import '../systems/Safe.js';
import { CONFIG, GAME_STATE } from '../config.js?v=202608192106';
import { Paddle } from '../entities/Paddle.js?v=202608192106';
import { ParticleSystem } from '../systems/Particles.js?v=202608192106';
import { InputManager } from '../systems/Input.js?v=202608192106';
import { CollisionSystem } from '../systems/Collision.js?v=202608192106';
import { AudioManager } from '../systems/Audio.js?v=202608192106';
import { LevelManager } from '../levels/LevelManager.js?v=202608192106';
import { Effects } from '../systems/Effects.js?v=202608192106';
import { Renderer } from '../systems/Renderer.js?v=202608192106';
import { Background } from '../systems/Background.js?v=202608192106';
import { Flow } from './Flow.js?v=202608192106';
import { Combat } from './Combat.js?v=202608192106';
import { Collect } from './Collect.js?v=202608192106';
import { initDeck } from '../systems/Cards.js?v=202608192106';
import { initMuseum } from '../systems/Museum216.js?v=202608192106';
import { initProgression } from '../systems/Progression.js?v=202608192106';
import { initMenu } from '../systems/Menu.js?v=202608192106';
import { initBosses } from '../systems/Bosses.js?v=202608192106';
import { initPolish } from '../systems/Polish.js?v=202608192106';
import { initArchitectures } from '../systems/Architectures.js?v=202608192106';
import { initAchievements } from '../systems/Achievements.js?v=202608192106';
import { initFun } from '../systems/Fun.js?v=202608192106';
import { initPower } from '../systems/Power.js?v=202608192106';
import { initUtukku } from '../systems/Utukku.js?v=202608192106';
import { initEvents } from '../systems/Events.js?v=202608192106';
import { initBiomes } from '../systems/Biomes.js?v=202608192106';
import { initMusic } from '../systems/Music.js?v=202608192106';
import { initRestore } from '../systems/Restore.js?v=202608192106';
import { initVisual } from '../systems/Visual.js?v=202608192106';
import { Enemies } from '../systems/Enemies.js?v=202608192106';

export class Game {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');

    this.canvas.width = CONFIG.WIDTH;
    this.canvas.height = CONFIG.HEIGHT;
    this.canvas.style.aspectRatio = CONFIG.WIDTH + ' / ' + CONFIG.HEIGHT;
    this.canvas.style.width = 'min(96vw, calc(70vh * ' + (CONFIG.WIDTH / CONFIG.HEIGHT) + '))';
    this.canvas.style.height = 'auto';

    this.input = new InputManager(this.canvas);
    this.particles = new ParticleSystem();
    this.collision = new CollisionSystem();
    this.audio = new AudioManager();
    try { if (localStorage.getItem('agur_mute') === '1') this.audio.enabled = false; } catch (e) {}
    this.levelManager = new LevelManager();
    this.effects = new Effects();
    this.background = new Background();
    this.renderer = new Renderer(this);
    window.gameCatchMode = () => this.catchMode;

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
    this.deck = [];

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
    this.laserTimer = 0;
    this.laserCooldown = 0;
    this.catchTimer = 0;
    this.catchMode = false;
    this.lasers = [];

    this.input.setPaddle(this.paddle);
    this.setupCallbacks();
    initDeck(this);
    initMuseum(this);
    initProgression(this);
    initMenu(this);
    initBosses(this);
    initPolish(this);
    initArchitectures(this);
    initAchievements(this);
    initFun(this);
    initPower(this);
    initUtukku(this);
    initEvents(this);
    initBiomes(this);
    initMusic(this);
    initRestore(this);
    initVisual(this);
    window.addEventListener('keydown', (e) => {
      if (e.code === 'KeyN' && this.state === GAME_STATE.PLAYING) { this.loadLevel(Math.min(this.level + 1, 88)); this.resetBall(); }
      if (e.code === 'KeyC') { window.toggleDeck && window.toggleDeck(this); }
      if (e.code === 'KeyM') { window.toggleMuseum && window.toggleMuseum(this); }
    });




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
      pauseBtn.innerHTML = '<span class="hud-label">Пауза</span><span class="hud-value" id="pauseIcon">⏸</span>';
      pauseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.togglePause();
        document.getElementById('pauseIcon').textContent = this.state === GAME_STATE.PAUSED ? '▶' : '⏸';
      });
      document.querySelector('.hud').appendChild(pauseBtn);
    }
    if (!window.__sndBtn) {
      window.__sndBtn = 1;
      const sndBtn = document.createElement('button');
      sndBtn.className = 'hud-item museum-btn';
      sndBtn.innerHTML = '<span class="hud-label">Звук</span><span class="hud-value" id="sndIcon">' + (this.audio.enabled ? '🔊' : '🔇') + '</span>';
      sndBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const on = this.audio.toggle();
        try { localStorage.setItem('agur_mute', on ? '0' : '1'); } catch (err) {}
        document.getElementById('sndIcon').textContent = on ? '🔊' : '🔇';
      });
      document.querySelector('.hud').appendChild(sndBtn);
    }
    if (!window.__fsBtn) {
      window.__fsBtn = 1;
      const fsBtn = document.createElement('button');
      fsBtn.className = 'hud-item museum-btn';
      fsBtn.innerHTML = '<span class="hud-label">Экран</span><span class="hud-value">⛶</span>';
      fsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (document.fullscreenElement) document.exitFullscreen();
        else document.documentElement.requestFullscreen();
      });
      document.querySelector('.hud').appendChild(fsBtn);
    }
  }

  setupCallbacks() {
    this.input.onStart = () => this.handleStart();
    this.input.onPause = () => this.togglePause();
    this.input.onRestart = () => this.restartGame();
    this.input.onMuseum = () => window.toggleMuseum && window.toggleMuseum(this);
    this.input.onLeftBtn = () => this.earthquake();
    this.input.onRightBtn = () => this.aimShot();
    this.input.onTap = () => this.handlePaddleTap();
    const mBtn = document.getElementById('museumBtn');
    if (mBtn) mBtn.addEventListener('click', (e) => { e.stopPropagation(); window.toggleMuseum && window.toggleMuseum(this); });
    const mClose = document.getElementById('museumClose');
    if (mClose) mClose.addEventListener('click', () => window.toggleMuseum && window.toggleMuseum(this));
  }

  update(dt) {
    if (!this.paddle || !this.balls || !this.bricks) return;
    if (this.state !== GAME_STATE.PLAYING || this.museumOpen) return;

    if (this.hitstop > 0) { this.hitstop--; return; }
    const timeScale = this.slowMotion ? 0.8 : 1;
    const scaledDt = dt * timeScale;

    if (this.slowMotion) {
      this.slowTimer -= dt * 16.67;
      if (this.slowTimer <= 0) this.slowMotion = false;
    }
    if (this.quakeCooldown > 0) this.quakeCooldown -= dt;
    if (this.aimCooldown > 0) this.aimCooldown -= dt;
    if (this.laserTimer > 0) {
      this.laserTimer -= dt * 16.67;
      if (this.laserCooldown <= 0) {
        this.fireLaser();
        this.laserCooldown = 18;
      }
    } else if (this.laserTimer <= 0) {
      this.laserCooldown = 0;
    }
    if (this.laserCooldown > 0) this.laserCooldown -= dt;
    if (this.catchTimer > 0) {
      this.catchTimer -= dt * 16.67;
      if (this.catchTimer <= 0) {
        this.catchMode = false;
        for (const b of this.balls) if (b.caught) { b.caught = false; this.releaseBall(b); }
      }
    }
    for (let i = this.lasers.length - 1; i >= 0; i--) {
      const l = this.lasers[i];
      l.y -= l.vy * scaledDt;
      if (l.y < -20) { this.lasers.splice(i, 1); continue; }
      let hit = false;
      for (const brick of this.bricks) {
        if (!brick.alive || brick.isBreaking || brick.isSteel) continue;
        if (l.x > brick.x && l.x < brick.x + brick.width &&
            l.y > brick.y && l.y < brick.y + brick.height) {
          if (brick.takeDamage()) this.destroyBrick(brick);
          this.particles.explodeBrick(l.x - 5, l.y, 10, 10, brick.getColors().glow);
          hit = true;
          break;
        }
      }
      if (hit) this.lasers.splice(i, 1);
    }
    for (const b of this.balls) {
      if (b.caught) {
        b.x = this.paddle.x + b.caughtOffset;
        b.y = this.paddle.y - b.radius - 1;
      }
    }
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
    for (let i = (this.popups || []).length - 1; i >= 0; i--) {
      const p = this.popups[i];
      p.t += 0.02 * scaledDt;
      if (p.t >= 1) this.popups.splice(i, 1);
    }

    this.particles.update(scaledDt);
    this.effects.update(scaledDt);
    this.background.update(scaledDt);
    this.updateEnemies(scaledDt);

    if (this.shakeIntensity > 0) {
      this.shakeIntensity *= 0.9;
      if (this.shakeIntensity < 0.1) this.shakeIntensity = 0;
    }

    if (this.levelManager.isLevelComplete() && !this.boss) this.levelComplete();
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

Object.assign(Game.prototype, Flow, Combat, Collect, Enemies);













