import { CONFIG, GAME_STATE, clamp } from './config.js';
import { Ball } from './entities/Ball.js';
import { Paddle } from './entities/Paddle.js';
import { PowerUp } from './entities/PowerUp.js';
import { ParticleSystem } from './systems/Particles.js';
import { InputManager } from './systems/Input.js';
import { CollisionSystem, Laser } from './systems/Collision.js';
import { AudioManager } from './systems/Audio.js';
import { LevelManager } from './levels/LevelManager.js';

class Game {
  constructor() {
    // Canvas
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    
    // Системы
    this.input = new InputManager(this.canvas);
    this.particles = new ParticleSystem();
    this.collision = new CollisionSystem();
    this.audio = new AudioManager();
    this.levelManager = new LevelManager();
    
    // Игровые объекты
    this.paddle = new Paddle();
    this.balls = [];
    this.bricks = [];
    this.powerUps = [];
    this.lasers = [];
    
    // Состояние игры
    this.state = GAME_STATE.MENU;
    this.score = 0;
    this.lives = CONFIG.GAME.MAX_LIVES;
    this.level = 1;
    this.combo = 0;
    
    // Лазер
    this.laserActive = false;
    this.laserTimer = 0;
    this.laserCooldown = 0;
    
    // Замедление
    this.slowMotion = false;
    this.slowTimer = 0;
    
    // Delta time
    this.lastTime = 0;
    
    // Shake эффект
    this.shakeIntensity = 0;
    
    // Инициализация
    this.input.setPaddle(this.paddle);
    this.setupCallbacks();
    this.loadLevel(1);
    this.resetBall();
    
    // Запуск цикла
    requestAnimationFrame((t) => this.gameLoop(t));
  }
  
  setupCallbacks() {
    this.input.onStart = () => this.handleStart();
    this.input.onPause = () => this.togglePause();
    this.input.onRestart = () => this.restartGame();
  }
  
  handleStart() {
    this.audio.init(); // Инициализация звука при первом клике
    
    switch (this.state) {
      case GAME_STATE.MENU:
      case GAME_STATE.GAME_OVER:
      case GAME_STATE.WIN:
        this.startGame();
        break;
        
      case GAME_STATE.PLAYING:
        // Запуск мяча если он на платформе
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
  
  restartGame() {
    this.startGame();
  }
  
  togglePause() {
    if (this.state === GAME_STATE.PLAYING) {
      this.state = GAME_STATE.PAUSED;
    } else if (this.state === GAME_STATE.PAUSED) {
      this.state = GAME_STATE.PLAYING;
    }
  }
  
  loadLevel(levelNumber) {
    this.level = levelNumber;
    this.bricks = this.levelManager.loadLevel(levelNumber);
    this.powerUps = [];
    this.lasers = [];
    this.laserActive = false;
    this.slowMotion = false;
    
    // Увеличиваем скорость мяча с уровнем
    const ballSpeed = this.levelManager.getBallSpeed(levelNumber);
    for (const ball of this.balls) {
      ball.speed = ballSpeed;
    }
  }
  
  resetBall() {
    this.balls = [new Ball(
      this.paddle.x + CONFIG.PADDLE.WIDTH / 2,
      this.paddle.y - CONFIG.BALL.RADIUS - 1
    )];
    this.balls[0].speed = this.levelManager.getBallSpeed(this.level);
  }
  
  // ===== Power-up эффекты =====
  
  spawnExtraBalls(count) {
    const newBalls = [];
    for (const ball of this.balls) {
      for (let i = 0; i < count; i++) {
        const newBall = new Ball(ball.x, ball.y);
        newBall.speed = ball.speed;
        newBall.isLaunched = true;
        
        // Разные направления
        const angle = -Math.PI / 2 + (i - count / 2) * 0.5;
        newBall.dx = Math.cos(angle) * ball.speed;
        newBall.dy = Math.sin(angle) * ball.speed;
        
        newBalls.push(newBall);
      }
    }
    this.balls.push(...newBalls);
  }
  
  applySlowEffect() {
    this.slowMotion = true;
    this.slowTimer = CONFIG.POWERUP_TYPES.SLOW.duration;
  }
  
  activateLaser(duration) {
    this.laserActive = true;
    this.laserTimer = duration;
  }
  
  addLife() {
    this.lives = Math.min(this.lives + 1, 5); // Максимум 5 жизней
    this.updateHUD();
  }
  
  // ===== Обновление игры =====
  
  update(dt) {
    if (this.state !== GAME_STATE.PLAYING) return;
    
    // Замедление времени
    const timeScale = this.slowMotion ? 0.5 : 1;
    const scaledDt = dt * timeScale;
    
    // Обновление таймеров
    if (this.slowMotion) {
      this.slowTimer -= dt * 16.67;
      if (this.slowTimer <= 0) this.slowMotion = false;
    }
    
    if (this.laserActive) {
      this.laserTimer -= dt * 16.67;
      if (this.laserTimer <= 0) this.laserActive = false;
      
      // Стрельба лазером
      this.laserCooldown -= dt;
      if (this.laserCooldown <= 0) {
        this.fireLaser();
        this.laserCooldown = 15; // кадров между выстрелами
      }
    }
    
    // Обновление клавиатуры
    this.input.updateKeyboard(dt);
    
    // Обновление платформы
    this.paddle.update(scaledDt);
    
    // Обновление мячей
    for (let i = this.balls.length - 1; i >= 0; i--) {
      const ball = this.balls[i];
      
      // Мяч на платформе (sticky)
      if (!ball.isLaunched) {
        ball.x = this.paddle.x + this.paddle.width / 2;
        ball.y = this.paddle.y - ball.radius - 1;
        continue;
      }
      
      ball.update(scaledDt);
      
      // Проверка столкновения с платформой
      if (this.collision.checkPaddleCollision(ball, this.paddle)) {
        this.audio.paddleHit();
        this.particles.paddleHit(ball.x, ball.y);
        this.combo = 0; // Сброс комбо при касании платформы
      }
      
      // Проверка потери мяча
      if (this.collision.checkBallLost(ball)) {
        this.balls.splice(i, 1);
        
        // Если это был последний мяч
        if (this.balls.length === 0) {
          this.loseLife();
        }
      }
    }
    
    // Обновление кирпичей
    for (const brick of this.bricks) {
      if (brick.alive) {
        brick.update(scaledDt);
      }
    }
    
    // Проверка столкновений мячей с кирпичами
    for (const ball of this.balls) {
      if (!ball.isLaunched) continue;
      
      for (const brick of this.bricks) {
        if (!brick.alive || brick.isBreaking) continue;
        
        const result = this.collision.checkBrickCollision(ball, brick);
        
        if (result.hit) {
          this.audio.brickHit(brick.row);
          
          if (result.destroyed) {
            this.destroyBrick(brick);
          }
          break; // Только одно столкновение за кадр
        }
      }
    }
    
    // Обновление power-ups
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
    
    // Обновление лазеров
    for (let i = this.lasers.length - 1; i >= 0; i--) {
      const laser = this.lasers[i];
      laser.update(scaledDt);
      
      // Проверка попадания в кирпичи
      for (const brick of this.bricks) {
        if (!brick.alive || brick.isBreaking) continue;
        
        if (this.collision.checkLaserHit(laser, brick)) {
          const destroyed = brick.takeDamage();
          laser.alive = false;
          
          if (destroyed) {
            this.destroyBrick(brick);
          }
          break;
        }
      }
      
      if (!laser.alive) {
        this.lasers.splice(i, 1);
      }
    }
    
    // Обновление частиц
    this.particles.update(scaledDt);
    
    // Затухание shake
    if (this.shakeIntensity > 0) {
      this.shakeIntensity *= 0.9;
      if (this.shakeIntensity < 0.1) this.shakeIntensity = 0;
    }
    
    // Проверка завершения уровня
    if (this.levelManager.isLevelComplete()) {
      this.levelComplete();
    }
  }
  
  destroyBrick(brick) {
    this.levelManager.brickDestroyed();
    this.combo++;
    
    // Очки с множителем комбо
    const points = 10 * this.combo;
    this.score += points;
    
    this.audio.brickBreak(brick.row);
    this.particles.explodeBrick(
      brick.x, brick.y, brick.width, brick.height, brick.color.glow
    );
    
    // Шанс выпадения power-up
    if (Math.random() < CONFIG.GAME.POWERUP_DROP_CHANCE && !brick.isSteel) {
      this.spawnPowerUp(brick.x + brick.width / 2, brick.y + brick.height / 2);
    }
    
    this.updateHUD();
  }
  
  spawnPowerUp(x, y) {
    const types = Object.keys(CONFIG.POWERUP_TYPES);
    const randomType = types[Math.floor(Math.random() * types.length)];
    this.powerUps.push(new PowerUp(x, y, randomType));
  }
  
  collectPowerUp(powerUp) {
    powerUp.apply(this);
    this.audio.powerUp();
    this.particles.powerupCollect(
      powerUp.x + powerUp.width / 2,
      powerUp.y + powerUp.height / 2,
      powerUp.config.color
    );
  }
  
  fireLaser() {
    const laserX = this.paddle.x + this.paddle.width / 2;
    const laserY = this.paddle.y;
    this.lasers.push(new Laser(laserX, laserY));
    this.audio.laser();
  }
  
  loseLife() {
    this.lives--;
    this.combo = 0;
    this.audio.loseLife();
    this.shakeIntensity = 10;
    this.particles.loseLife(this.balls[0]?.x || CONFIG.WIDTH / 2, CONFIG.HEIGHT - 20);
    
    this.updateHUD();
    
    if (this.lives <= 0) {
      this.state = GAME_STATE.GAME_OVER;
      this.audio.gameOver();
    } else {
      this.resetBall();
    }
  }
  
  levelComplete() {
    const nextLevel = this.levelManager.nextLevel();
    
    if (nextLevel) {
      this.state = GAME_STATE.LEVEL_TRANSITION;
      this.audio.win();
      
      // Переход на следующий уровень через 2 секунды
      setTimeout(() => {
        this.loadLevel(nextLevel);
        this.resetBall();
        this.state = GAME_STATE.PLAYING;
        this.updateHUD();
      }, 2000);
    } else {
      // Все уровни пройдены
      this.state = GAME_STATE.WIN;
      this.audio.win();
    }
  }
  
  updateHUD() {
    document.getElementById('scoreDisplay').textContent = this.score;
    document.getElementById('levelDisplay').textContent = this.level;
    document.getElementById('livesDisplay').textContent = this.lives;
  }
  
  // ===== Отрисовка =====
  
  draw() {
    const ctx = this.ctx;
    
    // Shake эффект
    ctx.save();
    if (this.shakeIntensity > 0) {
      const shakeX = (Math.random() - 0.5) * this.shakeIntensity;
      const shakeY = (Math.random() - 0.5) * this.shakeIntensity;
      ctx.translate(shakeX, shakeY);
    }
    
    // Очистка
    ctx.clearRect(-20, -20, CONFIG.WIDTH + 40, CONFIG.HEIGHT + 40);
    
    // Фоновая сетка
    this.drawGrid(ctx);
    
    // Кирпичи
    for (const brick of this.bricks) {
      brick.draw(ctx);
    }
    
    // Power-ups
    for (const powerUp of this.powerUps) {
      powerUp.draw(ctx);
    }
    
    // Лазеры
    for (const laser of this.lasers) {
      laser.draw(ctx);
    }
    
    // Платформа
    this.paddle.draw(ctx);
    
    // Мячи
    for (const ball of this.balls) {
      ball.draw(ctx);
    }
    
    // Частицы
    this.particles.draw(ctx);
    
    ctx.restore();
    
    // UI сообщения
    this.drawMessages(ctx);
  }
  
  drawGrid(ctx) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
    ctx.lineWidth = 1;
    
    for (let i = 0; i < CONFIG.WIDTH; i += 40) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, CONFIG.HEIGHT);
      ctx.stroke();
    }
    
    for (let i = 0; i < CONFIG.HEIGHT; i += 40) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(CONFIG.WIDTH, i);
      ctx.stroke();
    }
  }
  
  drawMessages(ctx) {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    switch (this.state) {
      case GAME_STATE.MENU:
        this.drawCenterText(ctx, '?? DRUNKANOID', 48, '#fff', 0);
        this.drawCenterText(ctx, 'Кликните, чтобы начать', 24, 'rgba(255,255,255,0.7)', 60);
        break;
        
      case GAME_STATE.PAUSED:
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);
        this.drawCenterText(ctx, '?? ПАУЗА', 42, '#fff', 0);
        this.drawCenterText(ctx, 'ESC - продолжить', 20, 'rgba(255,255,255,0.6)', 50);
        break;
        
      case GAME_STATE.GAME_OVER:
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);
        this.drawCenterText(ctx, '?? Игра окончена', 44, '#ff4466', 0);
        this.drawCenterText(ctx, `Счёт: ${this.score}`, 28, '#fff', 50);
        this.drawCenterText(ctx, 'Кликните, чтобы начать заново', 20, 'rgba(255,255,255,0.6)', 100);
        break;
        
      case GAME_STATE.WIN:
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);
        this.drawCenterText(ctx, '?? ПОБЕДА!', 48, '#4ade80', 0);
        this.drawCenterText(ctx, `Финальный счёт: ${this.score}`, 28, '#fff', 60);
        this.drawCenterText(ctx, 'Кликните, чтобы сыграть ещё', 20, 'rgba(255,255,255,0.6)', 110);
        break;
        
      case GAME_STATE.LEVEL_TRANSITION:
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);
        this.drawCenterText(ctx, `? Уровень ${this.level} пройден!`, 36, '#ffd97d', 0);
        this.drawCenterText(ctx, 'Приготовьтесь...', 24, 'rgba(255,255,255,0.7)', 50);
        break;
    }
  }
  
  drawCenterText(ctx, text, size, color, offsetY) {
    ctx.fillStyle = color;
    ctx.font = `bold ${size}px "Segoe UI", sans-serif`;
    ctx.shadowColor = color;
    ctx.shadowBlur = 20;
    ctx.fillText(text, CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2 + offsetY);
    ctx.shadowBlur = 0;
  }
  
  // ===== Игровой цикл =====
  
  gameLoop(timestamp) {
    // Delta time (нормализация к 60fps)
    const dt = Math.min((timestamp - this.lastTime) / 16.67, 2);
    this.lastTime = timestamp;
    
    this.update(dt);
    this.draw();
    
    requestAnimationFrame((t) => this.gameLoop(t));
  }
}

// Запуск игры
window.addEventListener('DOMContentLoaded', () => {
  new Game();
});


