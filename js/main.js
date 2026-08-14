import { CONFIG, GAME_STATE, clamp } from './config.js';
import { Ball } from './entities/Ball.js';
import { Paddle } from './entities/Paddle.js';
import { PowerUp } from './entities/PowerUp.js';
import { ParticleSystem } from './systems/Particles.js';
import { InputManager } from './systems/Input.js';
import { CollisionSystem } from './systems/Collision.js';
import { AudioManager } from './systems/Audio.js';
import { LevelManager } from './levels/LevelManager.js';

// ===== ЭФФЕКТЫ В СТИЛЕ MONTEZUMA: молнии, волны, вспышки =====
class Effects {
  constructor() { this.bolts = []; this.waves = []; this.flashes = []; }
  
  bolt(x1, y1, x2, y2) {
    const pts = [{ x: x1, y: y1 }];
    const segs = 7;
    for (let i = 1; i < segs; i++) {
      const t = i / segs;
      pts.push({
        x: x1 + (x2 - x1) * t + (Math.random() - 0.5) * 34,
        y: y1 + (y2 - y1) * t + (Math.random() - 0.5) * 34
      });
    }
    pts.push({ x: x2, y: y2 });
    this.bolts.push({ pts: pts, timer: 14 });
  }
  
  wave(x, y, color) { this.waves.push({ x: x, y: y, color: color, r: 6, timer: 22 }); }
  flash(color, alpha) { this.flashes.push({ color: color, alpha: alpha, timer: 10 }); }
  
  update(dt) {
    for (let i = this.bolts.length - 1; i >= 0; i--) { this.bolts[i].timer -= dt; if (this.bolts[i].timer <= 0) this.bolts.splice(i, 1); }
    for (let i = this.waves.length - 1; i >= 0; i--) { const w = this.waves[i]; w.timer -= dt; w.r += dt * 4; if (w.timer <= 0) this.waves.splice(i, 1); }
    for (let i = this.flashes.length - 1; i >= 0; i--) { this.flashes[i].timer -= dt; if (this.flashes[i].timer <= 0) this.flashes.splice(i, 1); }
  }
  
  draw(ctx) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    
    for (const b of this.bolts) {
      ctx.globalAlpha = b.timer / 14;
      ctx.strokeStyle = '#f0c96a';
      ctx.lineWidth = 4;
      ctx.shadowColor = '#ffe066';
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.moveTo(b.pts[0].x, b.pts[0].y);
      for (const p of b.pts) ctx.lineTo(p.x, p.y);
      ctx.stroke();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    
    for (const w of this.waves) {
      ctx.globalAlpha = w.timer / 22;
      ctx.strokeStyle = w.color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(w.x, w.y, w.r, 0, Math.PI * 2);
      ctx.stroke();
    }
    
    for (const f of this.flashes) {
      ctx.globalAlpha = (f.timer / 10) * f.alpha;
      ctx.fillStyle = f.color;
      ctx.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);
    }
    
    ctx.restore();
    ctx.globalAlpha = 1;
  }
}

class Game {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    
    // ===== Портретный режим на тач-устройствах =====
    const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    if (isTouch && window.matchMedia('(orientation: portrait)').matches) {
      CONFIG.WIDTH = 540;
      CONFIG.HEIGHT = 860;
      CONFIG.BRICK.WIDTH = 38;
      CONFIG.BRICK.GAP = 4;
      CONFIG.PADDLE.WIDTH = 110;
    }
    this.canvas.width = CONFIG.WIDTH;
    this.canvas.height = CONFIG.HEIGHT;
      this.canvas.style.aspectRatio = CONFIG.WIDTH + ' / ' + CONFIG.HEIGHT;
      this.canvas.style.width = 'min(96vw, calc(88vh * ' + (CONFIG.WIDTH / CONFIG.HEIGHT) + '))';
      this.canvas.style.height = 'auto';
    
    // Системы
    this.input = new InputManager(this.canvas);
    this.particles = new ParticleSystem();
    this.collision = new CollisionSystem();
    this.audio = new AudioManager();
    this.levelManager = new LevelManager();
    this.effects = new Effects();
    
    // Музей (опционально, если файл есть)
    this.museum = null;
    import('./systems/Museum.js').then(mod => {
      this.museum = new mod.Museum();
      const cnt = document.getElementById('museumCount');
      if (cnt) cnt.textContent = this.museum.totalShards();
    }).catch(() => {});
    
    // Объекты
    this.paddle = new Paddle();
    this.balls = [];
    this.bricks = [];
    this.powerUps = [];
    
    // Состояние
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
    this.lastTime = 0;
    
    this.input.setPaddle(this.paddle);
    this.setupCallbacks();
    this.loadLevel(1);
    this.resetBall();
    
    if (!window.__sndBtn) {
    window.__sndBtn = 1;
    // Кнопка звука в HUD
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
    
    requestAnimationFrame((t) => this.gameLoop(t));
  }
  
  setupCallbacks() {
    this.input.onStart = () => this.handleStart();
    this.input.onPause = () => this.togglePause();
    this.input.onRestart = () => this.restartGame();
    this.input.onMuseum = () => this.toggleMuseum();
    
    const mBtn = document.getElementById('museumBtn');
    if (mBtn) mBtn.addEventListener('click', (e) => { e.stopPropagation(); this.toggleMuseum(); });
    const mClose = document.getElementById('museumClose');
    if (mClose) mClose.addEventListener('click', () => this.toggleMuseum());
  }
  
  handleStart() {
    this.audio.init();
    this.audio.startMusic();
    switch (this.state) {
      case GAME_STATE.MENU:
      case GAME_STATE.GAME_OVER:
      case GAME_STATE.WIN:
        this.startGame();
        break;
      case GAME_STATE.PLAYING:
        for (const ball of this.balls) {
          if (!ball.isLaunched) {
            ball.launch();
            this.audio.launch();
          }
        }
        break;
    }
  }
  
  startGame() {
    this.state = GAME_STATE.PLAYING;
    this.score = 0;
    this.lives = CONFIG.GAME.MAX_LIVES;
    this.level = 1;
    this.combo = 0;
    this.loadLevel(1);
    this.resetBall();
    this.updateHUD();
  }
  
  restartGame() { this.startGame(); }
  
  togglePause() {
    if (this.state === GAME_STATE.PLAYING) this.state = GAME_STATE.PAUSED;
    else if (this.state === GAME_STATE.PAUSED) this.state = GAME_STATE.PLAYING;
  }
  
  toggleMuseum() {
    const overlay = document.getElementById('museumOverlay');
    if (!overlay || !this.museum) return;
    this.museumOpen = !this.museumOpen;
    overlay.style.display = this.museumOpen ? 'flex' : 'none';
    if (this.museumOpen) {
      this.museum.render();
      this.audio.uiClick();
    }
  }
  
  loadLevel(levelNumber) {
    this.level = levelNumber;
    this.bricks = this.levelManager.loadLevel(levelNumber);
    this.powerUps = [];
    this.slowMotion = false;
    this.wallCharge = { left: 0, right: 0 };
    const ballSpeed = this.levelManager.getBallSpeed(levelNumber);
    for (const ball of this.balls) ball.speed = ballSpeed;
  }
  
  resetBall() {
    this.paddle.y = CONFIG.HEIGHT - CONFIG.PADDLE.Y_OFFSET;
    this.paddle.y = CONFIG.HEIGHT - CONFIG.PADDLE.Y_OFFSET;
    this.balls = [new Ball(
      this.paddle.x + this.paddle.width / 2,
      this.paddle.y - CONFIG.BALL.RADIUS - 1
    )];
    this.balls[0].speed = this.levelManager.getBallSpeed(this.level);
  }
  
  // ===== Руны стен =====
  wallHit(side, ball) {
    this.wallCharge[side]++;
    this.audio.wallHit();
    this.effects.wave(side === 'left' ? 4 : CONFIG.WIDTH - 4, ball.y, '#f0c96a');
    
    if (this.wallCharge[side] >= 5) {
      this.wallCharge[side] = 0;
      this.fireWallBolt(side, ball.y);
    }
  }
  
  fireWallBolt(side, y) {
    const row = this.bricks.filter(b =>
      b.alive && !b.isBreaking && !b.isSteel &&
      y > b.y && y < b.y + b.height
    ).sort((a, b) => side === 'left' ? a.x - b.x : b.x - a.x);
    const target = row[0];
    const startX = side === 'left' ? 0 : CONFIG.WIDTH;
    
    if (target) {
      this.effects.bolt(startX, y, target.x + target.width / 2, target.y + target.height / 2);
      this.effects.flash('#f0c96a', 0.15);
      this.shakeIntensity = Math.max(this.shakeIntensity, 6);
      const destroyed = target.takeDamage();
      if (destroyed) this.destroyBrick(target);
    } else {
      this.effects.bolt(startX, y, CONFIG.WIDTH / 2, y);
    }
    this.audio.wallBeam();
  }
  
  // ===== Разрушение кирпича =====
  destroyBrick(brick) {
    if (brick.isDead || !brick.alive || brick.isSteel) return;
    brick.isDead = true;
    
    this.levelManager.brickDestroyed();
    this.combo++;
    if (this.combo % 12 === 0) this.collectWord();
    
    const typeScores = { gold: 50, silver: 30, explosive: 30, fire: 20, regen: 15, moving: 20, clay: 20 };
    const baseScore = typeScores[brick.type] || 10;
    this.score += baseScore * this.combo;
    
    this.audio.brickBreak(brick.row);
    this.particles.explodeBrick(brick.x, brick.y, brick.width, brick.height, brick.getColors().glow);
    this.effects.wave(brick.x + brick.width / 2, brick.y + brick.height / 2, brick.getColors().glow);
    
    if (brick.type === 'explosive') {
      this.shakeIntensity = Math.max(this.shakeIntensity, 8);
      this.effects.flash('#f97316', 0.12);
      this.chainExplosion(brick);
    } else if (brick.type === 'fire') {
      this.fireDamage(brick);
    }
    
    const cx = brick.x + brick.width / 2;
    const cy = brick.y + brick.height / 2;
    if (brick.type === 'gold') {
      this.spawnPowerUp(cx, cy);
    } else {
      const roll = Math.random();
      if (roll < CONFIG.MUSEUM.FRAGMENT_CHANCE && this.museum) {
        const artifactId = this.museum.randomIncompleteId();
        if (artifactId) this.powerUps.push(new PowerUp(cx, cy, 'FRAGMENT', artifactId));
      } else if (roll < CONFIG.MUSEUM.FRAGMENT_CHANCE + CONFIG.GAME.POWERUP_DROP_CHANCE) {
        this.spawnPowerUp(cx, cy);
      }
    }
    
    this.updateHUD();
  }
  
  chainExplosion(source) {
    for (const other of this.bricks) {
      if (other === source || !other.alive || other.isBreaking || other.isSteel) continue;
      const dr = Math.abs(other.row - source.row);
      const dc = Math.abs(other.col - source.col);
      if (dr <= 1 && dc <= 1) {
        // Молния между кирпичами!
        this.effects.bolt(
          source.x + source.width / 2, source.y + source.height / 2,
          other.x + other.width / 2, other.y + other.height / 2
        );
        this.destroyBrick(other);
      }
    }
  }
  
  fireDamage(source) {
    for (const other of this.bricks) {
      if (other === source || !other.alive || other.isBreaking || other.isSteel) continue;
      const dr = Math.abs(other.row - source.row);
      const dc = Math.abs(other.col - source.col);
      if ((dr === 1 && dc === 0) || (dr === 0 && dc === 1)) {
        const destroyed = other.takeDamage();
        if (destroyed) this.destroyBrick(other);
      }
    }
  }
  
  spawnPowerUp(x, y) {
    const types = Object.keys(CONFIG.POWERUP_TYPES);
    const randomType = types[Math.floor(Math.random() * types.length)];
    this.powerUps.push(new PowerUp(x, y, randomType));
  }
  
  collectPowerUp(powerUp) {
    powerUp.apply(this);
    this.particles.powerupCollect(powerUp.x + powerUp.width / 2, powerUp.y + powerUp.height / 2, powerUp.config.color);
  }
  
  collectFragment(artifactId) {
    if (!this.museum) return;
    const art = CONFIG.ARTIFACTS.find(a => a.id === artifactId);
    if (!art) return;
    const completed = this.museum.addShard(artifactId);
    this.audio.fragment();
    if (completed) {
      this.showBanner('\u{1F3FA} Артефакт собран: ' + art.name + '!');
      this.effects.flash('#f0c96a', 0.3);
      this.audio.artifact();
      for (let i = 0; i < 4; i++) {
        this.effects.bolt(CONFIG.WIDTH / 2, 0, Math.random() * CONFIG.WIDTH, Math.random() * CONFIG.HEIGHT / 2);
      }
    } else {
      this.showBanner('\u{1F9E9} Черепок: ' + art.name + ' (' + this.museum.data[artifactId] + '/' + art.shards + ')');
    }
    const cnt = document.getElementById('museumCount');
    if (cnt) cnt.textContent = this.museum.totalShards();
  }
  
  collectWord() {
    if (!this.museum || !this.museum.hasWord) return;
    const uncollected = CONFIG.WORDS.filter(w => !this.museum.hasWord(w.word));
    if (uncollected.length === 0) {
      this.addLife();
      this.showBanner('\u{1F4DC} Все слова собраны! +1 жизнь');
      return;
    }
    const w = uncollected[Math.floor(Math.random() * uncollected.length)];
    this.museum.addWord(w.word);
    this.audio.word();
    this.showBanner('\u{1F4DC} Слово Шумера: ' + w.word + ' — ' + w.meaning);
  }
  
  showBanner(text) { this.banner = { text: text, timer: 180 }; }
  
  applySlowEffect() { this.slowMotion = true; this.slowTimer = CONFIG.POWERUP_TYPES.SLOW.duration; }
  addLife() { this.lives = Math.min(this.lives + 1, 5); this.updateHUD(); }
  
  saveBest() {
    if (this.score > this.bestScore) {
      this.bestScore = this.score;
      try { localStorage.setItem('agur_best', String(this.bestScore)); } catch (e) {}
      this.showBanner('\u{1F3C6} Новый рекорд: ' + this.bestScore);
    }
  }
  
  loseLife() {
    this.lives--;
    this.combo = 0;
    this.audio.loseLife();
    this.shakeIntensity = 14;
    this.effects.flash('#ff4466', 0.25);
    this.particles.loseLife(this.balls[0] ? this.balls[0].x : CONFIG.WIDTH / 2, CONFIG.HEIGHT - 20);
    this.updateHUD();
    
    if (this.lives <= 0) {
      this.saveBest();
      this.state = GAME_STATE.GAME_OVER;
      this.audio.gameOver();
    } else {
      this.resetBall();
    }
  }
  
  levelComplete() {
    const nextLevel = this.levelManager.nextLevel();
    this.effects.flash('#f0c96a', 0.25);
    
    if (nextLevel) {
      this.state = GAME_STATE.LEVEL_TRANSITION;
      this.audio.win();
      setTimeout(() => {
        this.loadLevel(nextLevel);
        this.resetBall();
        this.state = GAME_STATE.PLAYING;
        this.updateHUD();
      }, 2000);
    } else {
      this.saveBest();
      this.state = GAME_STATE.WIN;
      this.audio.win();
    }
  }
  
  updateHUD() {
    document.getElementById('scoreDisplay').textContent = this.score;
    document.getElementById('levelDisplay').textContent = this.level;
    document.getElementById('livesDisplay').textContent = this.lives;
  }
  
  // ===== Обновление =====
  update(dt) {
    if (this.state !== GAME_STATE.PLAYING || this.museumOpen) return;
    
    const timeScale = this.slowMotion ? 0.5 : 1;
    const scaledDt = dt * timeScale;
    
    if (this.slowMotion) {
      this.slowTimer -= dt * 16.67;
      if (this.slowTimer <= 0) this.slowMotion = false;
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
      
      if (ball.lastWallHit) {
        this.wallHit(ball.lastWallHit, ball);
        ball.lastWallHit = null;
      }
      
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
    
    this.particles.update(scaledDt);
    this.effects.update(scaledDt);
    
    if (this.shakeIntensity > 0) {
      this.shakeIntensity *= 0.9;
      if (this.shakeIntensity < 0.1) this.shakeIntensity = 0;
    }
    
    if (this.levelManager.isLevelComplete()) {
      this.levelComplete();
    }
  }
  
  // ===== Отрисовка =====
  draw() {
    const ctx = this.ctx;
    
    ctx.save();
    if (this.shakeIntensity > 0) {
      ctx.translate((Math.random() - 0.5) * this.shakeIntensity, (Math.random() - 0.5) * this.shakeIntensity);
    }
    
    ctx.clearRect(-20, -20, CONFIG.WIDTH + 40, CONFIG.HEIGHT + 40);
    
    for (const brick of this.bricks) brick.draw(ctx);
    for (const powerUp of this.powerUps) powerUp.draw(ctx);
    try {
      if (!isFinite(this.paddle.x)) this.paddle.x = CONFIG.WIDTH / 2 - this.paddle.width / 2;
      if (!isFinite(this.paddle.y)) this.paddle.y = CONFIG.HEIGHT - CONFIG.PADDLE.Y_OFFSET;

      this.paddle.draw(ctx);
    } catch (err) {
      ctx.fillStyle = '#f0d9a8';
      ctx.fillRect(this.paddle.x, this.paddle.y, this.paddle.width, this.paddle.height);
      this.debugError = String(err);
    }
    for (const ball of this.balls) ball.draw(ctx);
    this.particles.draw(ctx);
    this.effects.draw(ctx);
    

    
    ctx.restore();
    
    // Баннер
    if (this.banner) {
      ctx.globalAlpha = Math.min(1, this.banner.timer / 30);
      ctx.fillStyle = '#f0c96a';
      ctx.font = 'bold 24px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = '#d9a441';
      ctx.shadowBlur = 20;
      ctx.fillText(this.banner.text, CONFIG.WIDTH / 2, 90);
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    }
    
    this.drawMessages(ctx);
  }
  
  drawMessages(ctx) {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    switch (this.state) {
      case GAME_STATE.MENU:
        this.drawCenterText(ctx, '\u{1F3FA} AGUR', 48, '#f0c96a', 0);
        this.drawCenterText(ctx, 'пески помнят всё', 20, '#a8845c', 50);
        this.drawCenterText(ctx, 'Кликните, чтобы начать', 22, 'rgba(255,255,255,0.7)', 90);
        this.drawCenterText(ctx, '\u{1F3C6} Рекорд: ' + this.bestScore, 18, '#a8845c', 130);
        break;
      case GAME_STATE.PAUSED:
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);
        this.drawCenterText(ctx, '\u{23F8}\u{FE0F} ПАУЗА', 42, '#fff', 0);
        this.drawCenterText(ctx, 'ESC - продолжить', 20, 'rgba(255,255,255,0.6)', 50);
        break;
      case GAME_STATE.GAME_OVER:
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);
        this.drawCenterText(ctx, '\u{1F494} Игра окончена', 44, '#ff4466', 0);
        this.drawCenterText(ctx, 'Счёт: ' + this.score, 28, '#fff', 50);
        this.drawCenterText(ctx, 'Кликните, чтобы начать заново', 20, 'rgba(255,255,255,0.6)', 100);
        break;
      case GAME_STATE.WIN:
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);
        this.drawCenterText(ctx, '\u{1F389} ПОБЕДА!', 48, '#4ade80', 0);
        this.drawCenterText(ctx, 'Финальный счёт: ' + this.score, 28, '#fff', 60);
        this.drawCenterText(ctx, 'Кликните, чтобы сыграть ещё', 20, 'rgba(255,255,255,0.6)', 110);
        break;
      case GAME_STATE.LEVEL_TRANSITION:
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);
        this.drawCenterText(ctx, '\u{2728} ' + this.levelManager.getLevelName(this.level), 34, '#ffd97d', 0);
        this.drawCenterText(ctx, 'Уровень пройден!', 24, 'rgba(255,255,255,0.7)', 50);
        break;
    }
  }
  
  drawCenterText(ctx, text, size, color, offsetY) {
    ctx.fillStyle = color;
    ctx.font = 'bold ' + size + 'px "Segoe UI", sans-serif';
    ctx.shadowColor = color;
    ctx.shadowBlur = 20;
    ctx.fillText(text, CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2 + offsetY);
    ctx.shadowBlur = 0;
  }
  
  gameLoop(timestamp) {
    if (this.canvas.width !== CONFIG.WIDTH || this.canvas.height !== CONFIG.HEIGHT) {
      this.canvas.width = CONFIG.WIDTH;
      this.canvas.height = CONFIG.HEIGHT;
      this.canvas.style.aspectRatio = CONFIG.WIDTH + ' / ' + CONFIG.HEIGHT;
      this.canvas.style.width = 'min(96vw, calc(88vh * ' + (CONFIG.WIDTH / CONFIG.HEIGHT) + '))';
      this.canvas.style.height = 'auto';
    }
    if (this.canvas.width !== CONFIG.WIDTH || this.canvas.height !== CONFIG.HEIGHT) {
      this.canvas.width = CONFIG.WIDTH;
      this.canvas.height = CONFIG.HEIGHT;
      this.canvas.style.aspectRatio = CONFIG.WIDTH + ' / ' + CONFIG.HEIGHT;
      this.canvas.style.width = 'min(96vw, calc(88vh * ' + (CONFIG.WIDTH / CONFIG.HEIGHT) + '))';
      this.canvas.style.height = 'auto';
    }
    const dt = Math.min((timestamp - this.lastTime) / 16.67, 2);
    this.lastTime = timestamp;
    this.update(dt);
    this.draw();
    if (!window.__sndBtn) {
    window.__sndBtn = 1;
    // Кнопка звука в HUD
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
    
    requestAnimationFrame((t) => this.gameLoop(t));
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new Game();
});








