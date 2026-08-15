import { CONFIG, GAME_STATE } from '../config.js';
import { Paddle } from '../entities/Paddle.js';
import { ParticleSystem } from '../systems/Particles.js';
import { InputManager } from '../systems/Input.js';
import { CollisionSystem } from '../systems/Collision.js';
import { AudioManager } from '../systems/Audio.js';
import { LevelManager } from '../levels/LevelManager.js';
import { Effects } from '../systems/Effects.js';
import { Renderer } from '../systems/Renderer.js';
import { Flow } from './Flow.js';
import { Combat } from './Combat.js';
import { Collect } from './Collect.js';

export class Game {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');

    CONFIG.WIDTH = 540;
    CONFIG.HEIGHT = 860;
    CONFIG.PADDLE.WIDTH = 110;
    this.canvas.width = CONFIG.WIDTH;
    this.canvas.height = CONFIG.HEIGHT;
    this.canvas.style.aspectRatio = CONFIG.WIDTH + ' / ' + CONFIG.HEIGHT;
    this.canvas.style.width = 'min(96vw, calc(70vh * ' + (CONFIG.WIDTH / CONFIG.HEIGHT) + '))';
    this.canvas.style.height = 'auto';

    this.input = new InputManager(this.canvas);
    this.particles = new ParticleSystem();
    this.collision = new CollisionSystem();
    this.audio = new AudioManager();
    this.levelManager = new LevelManager();
    this.effects = new Effects();
    this.renderer = new Renderer(this);

    this.museum = null;
    import('../systems/Museum.js').then(mod => {
      this.museum = new mod.Museum();
      const cnt = document.getElementById('museumCount');
      if (cnt) cnt.textContent = this.museum.totalShards();
    }).catch(() => {});

    this.paddle = new Paddle();
    this.balls = [];
    this.bricks = [];
    this.powerUps = [];
    this.zShards = [];

    this.state = GAME_STATE.MENU;
    this.score = 0;
    this.lives = CONFIG.GAME.MAX_LIVES;
    this.level = 1;
    this.combo = 0;
    this.bestScore = 0;
    try { this.bestScore = parseInt(localStorage.getItem('agur_best')) || 0; } catch (e) {}

    this.slowMotion = false;
    this.slowTimer = 0;
    this.wallCharge = { left: 0, right: 0 };
    this.banner = null;
    this.museumOpen = false;
    this.shakeIntensity = 0;
    this.quakeCooldown = 0;
    this.aimCooldown = 0;
    this.lastTime = 0;

    this.input.setPaddle(this.paddle);
    this.setupCallbacks();
    this.loadLevel(1);
    this.resetBall();
    this.createHudButtons();

    requestAnimationFrame((t) => this.gameLoop(t));
  }

  createHudButtons() {
    if (!window.__pauseBtn) {
      window.__pauseBtn = 1;
      const pauseBtn = document.createElement('button');
      pauseBtn.className = 'hud-item museum-btn';
      pauseBtn.innerHTML = '<span class="hud-label">Пауза</span><span class="hud-value" id="pauseIcon">\u{23F8}</span>';
      pauseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.togglePause();
        document.getElementById('pauseIcon').textContent = this.state === GAME_STATE.PAUSED ? '\u{25B6}' : '\u{23F8}';
      });
      document.querySelector('.hud').appendChild(pauseBtn);
    }
    if (!window.__sndBtn) {
      window.__sndBtn = 1;
      const sndBtn = document.createElement('button');
      sndBtn.className = 'hud-item museum-btn';
      sndBtn.innerHTML = '<span class="hud-label">Звук</span><span class="hud-value" id="sndIcon">' + (this.audio.enabled ? '\u{1F50A}' : '\u{1F507}') + '</span>';
      sndBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const on = this.audio.toggle();
        try { localStorage.setItem('agur_mute', on ? '0' : '1'); } catch (err) {}
        document.getElementById('sndIcon').textContent = on ? '\u{1F50A}' : '\u{1F507}';
      });
      document.querySelector('.hud').appendChild(sndBtn);
    }
  }

  setupCallbacks() {
    this.input.onStart = () => this.handleStart();
    this.input.onPause = () => this.togglePause();
    this.input.onRestart = () => this.restartGame();
    this.input.onMuseum = () => this.toggleMuseum();
    this.input.onLeftBtn = () => this.earthquake();
    this.input.onRightBtn = () => this.aimShot();
    const mBtn = document.getElementById('museumBtn');
    if (mBtn) mBtn.addEventListener('click', (e) => { e.stopPropagation(); this.toggleMuseum(); });
    const mClose = document.getElementById('museumClose');
    if (mClose) mClose.addEventListener('click', () => this.toggleMuseum());
  }

  update(dt) {
    if (!this.paddle || !this.balls || !this.bricks) return;
    if (this.state !== GAME_STATE.PLAYING || this.museumOpen) return;

    const timeScale = this.slowMotion ? 0.5 : 1;
    const scaledDt = dt * timeScale;

    if (this.slowMotion) {
      this.slowTimer -= dt * 16.67;
      if (this.slowTimer <= 0) this.slowMotion = false;
    }
    if (this.quakeCooldown > 0) this.quakeCooldown -= dt;
    if (this.aimCooldown > 0) this.aimCooldown -= dt;
    if (this.banner) {
      this.banner.timer -= dt;
      if (this.banner.timer <= 0) this.banner = null;
    }

    this.input.updateKeyboard(dt);
    this.paddle.update(scaledDt);

    for (let i = this.balls.length - 1; i >= 0; i--) {
      const ball = this.balls[i];
      if (!ball.isLaunched) {
        ball.x = this.paddle.x + this.paddle.width / 2;
        ball.y = this.paddle.y - ball.radius - 1;
        continue;
      }
      ball.update(scaledDt);
      if (ball.lastWallHit) { this.wallHit(ball.lastWallHit, ball); ball.lastWallHit = null; }
      if (this.collision.checkPaddleCollision(ball, this.paddle)) {
        this.audio.paddleHit();
        this.particles.paddleHit(ball.x, ball.y);
        this.combo = 0;
      }
      if (this.collision.checkBallLost(ball)) {
        this.balls.splice(i, 1);
        if (this.balls.length === 0) this.loseLife();
      }
    }

    for (const brick of this.bricks) {
      brick.update(scaledDt);
      if (brick.justRegenerated) {
        brick.justRegenerated = false;
        this.levelManager.aliveCount++;
        this.effects.wave(brick.x + brick.width / 2, brick.y + brick.height / 2, '#34d399');
      }
    }

    for (const ball of this.balls) {
      if (!ball.isLaunched) continue;
      for (const brick of this.bricks) {
        if (!brick.alive || brick.isBreaking) continue;
        const result = this.collision.checkBrickCollision(ball, brick);
        if (result.hit) {
          if (!result.destroyed) this.audio.crack();
          if (result.destroyed) this.destroyBrick(brick);
          break;
        }
      }
    }

    for (let i = this.powerUps.length - 1; i >= 0; i--) {
      const powerUp = this.powerUps[i];
      powerUp.update(scaledDt);
      if (this.collision.checkPowerUpCollision(powerUp, this.paddle)) {
        this.collectPowerUp(powerUp);
        this.powerUps.splice(i, 1);
      } else if (!powerUp.alive) {
        this.powerUps.splice(i, 1);
      }
    }

    for (let i = this.zShards.length - 1; i >= 0; i--) {
      const s = this.zShards[i];
      s.t += scaledDt;
      s.z += s.vz * scaledDt;
      s.ox += (s.lx || 0) * scaledDt;
      s.oy += (s.ly || 0) * scaledDt;
      if (s.z >= 245) this.zShards.splice(i, 1);
    }

    this.particles.update(scaledDt);
    this.effects.update(scaledDt);

    if (this.shakeIntensity > 0) {
      this.shakeIntensity *= 0.9;
      if (this.shakeIntensity < 0.1) this.shakeIntensity = 0;
    }

    if (this.levelManager.isLevelComplete()) this.levelComplete();
  }

  gameLoop(timestamp) {
    if (this.canvas.width !== CONFIG.WIDTH || this.canvas.height !== CONFIG.HEIGHT) {
      this.canvas.width = CONFIG.WIDTH;
      this.canvas.height = CONFIG.HEIGHT;
    }
    const dt = Math.min((timestamp - this.lastTime) / 16.67, 2);
    this.lastTime = timestamp;
    this.update(dt);
    this.renderer.draw();
    requestAnimationFrame((t) => this.gameLoop(t));
  }
}

Object.assign(Game.prototype, Flow, Combat, Collect);




