import { CONFIG, GAME_STATE } from '../config.js?v=202608201644';
import { Ball } from '../entities/Ball.js?v=202608201644';

export const Flow = {
  handleStart() {
    switch (this.state) {
      case GAME_STATE.MENU:
      case GAME_STATE.GAME_OVER:
      case GAME_STATE.WIN:
        this.startGame();
        break;
      case GAME_STATE.PLAYING:
        if (this.balls && this.balls.length > 0) {
          if (!this.balls.some(b => b.isLaunched)) {
            for (const ball of this.balls) {
              if (ball && !ball.isLaunched) { ball.launch(); this.audio.launch(); }
            }
          }
        } else {
          this.resetBall();
          if (this.balls[0]) this.balls[0].launch();
        }
        break;
    }
  },
  startGame() {
    this.state = GAME_STATE.PLAYING;
    this.score = 0;
    this.lives = CONFIG.GAME.MAX_LIVES;
    this.level = 1;
    this.combo = 0;
    this.loadLevel(1);
    this.resetBall();
    this.updateHUD();
  },
  restartGame() { this.startGame(); },
  togglePause() {
    if (this.state === GAME_STATE.PLAYING) this.state = GAME_STATE.PAUSED;
    else if (this.state === GAME_STATE.PAUSED) this.state = GAME_STATE.PLAYING;
  },
  toggleMuseum() {
    const overlay = document.getElementById('museumOverlay');
    if (!overlay || !this.museum) return;
    this.museumOpen = !this.museumOpen;
    overlay.style.display = this.museumOpen ? 'flex' : 'none';
    if (this.museumOpen) { this.museum.render(); this.audio.uiClick(); }
  },
  loadLevel(levelNumber) {
    this.level = levelNumber;
    window.__biome = Math.floor((levelNumber - 1) / 11);
    this.bricks = this.levelManager.loadLevel(levelNumber);
    for (let i = 0; i < this.bricks.length; i++) {
      this.bricks[i].breakPhase = 0.01 + this.bricks[i].row * 0.04 + Math.random() * 0.02;
    }
    this.powerUps = [];
    this.zShards = [];
    this.demons = [];
    this.demonTimer = 600;
    this.maybeSpawnBoss(levelNumber);
    this.slowMotion = false;
    this.wallCharge = { left: 0, right: 0 };
    this.showBanner(this.levelManager.getLevelName(levelNumber));
    const ballSpeed = this.levelManager.getBallSpeed(levelNumber);
    for (const ball of this.balls) ball.speed = ballSpeed;
  },
  resetBall() {
    if (!this.paddle) return;
    this.paddle.y = CONFIG.HEIGHT - CONFIG.PADDLE.Y_OFFSET;
    this.balls = [new Ball(this.paddle.x + this.paddle.width / 2, this.paddle.y - CONFIG.BALL.RADIUS - 1)];
    this.balls[0].speed = this.levelManager.getBallSpeed(this.level);
  },
  loseLife() {
    if (this.deckHas && this.deckHas('GIR_TAB') && this.shieldUsed !== this.level) {
      this.shieldUsed = this.level;
      this.resetBall();
      this.showBanner('🦂 Щит скорпиона!');
      return;
    }
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
  },
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
  },
  updateHUD() {
    document.getElementById('scoreDisplay').textContent = this.score;
    document.getElementById('levelDisplay').textContent = this.level;
    document.getElementById('livesDisplay').textContent = this.lives;
  },
  saveBest() {
    if (this.score > this.bestScore) {
      this.bestScore = this.score;
      try { localStorage.setItem('agur_best', String(this.bestScore)); } catch (e) {}
      this.showBanner('🏆 Новый рекорд: ' + this.bestScore);
    }
  },
  addLife() { this.lives = Math.min(this.lives + 1, 5); this.updateHUD(); },
  showBanner(text) { this.banner = { text: text, timer: 180 }; },
  applySlowEffect() { this.slowMotion = true; this.slowTimer = CONFIG.POWERUP_TYPES.SLOW.duration; },
  triggerDramaticSlowMo() {
    this.slowMotion = true;
    this.slowTimer = 600;
    this.effects.flash('#f0c96a', 0.3);
    this.shakeIntensity = 10;
  },
};


