import { CONFIG } from '../config.js?v=2';

export const Enemies = {
  spawnDemon() {
    if (!this.demons) this.demons = [];
    if (this.demons.length >= 2) return;
    const fromLeft = Math.random() < 0.5;
    this.demons.push({
      x: fromLeft ? -30 : CONFIG.WIDTH + 30,
      y: 120 + Math.random() * 160,
      vx: (fromLeft ? 1 : -1) * (1.2 + Math.random() * 0.8) * (this.deckHas && this.deckHas('MUS') ? 0.6 : 1),
      phase: Math.random() * 6.28,
      hp: 2,
    });
  },

  updateEnemies(scaledDt) {
    if (this.freezeDemons > 0) this.freezeDemons -= scaledDt;
    if (this.freezeDemons > 0) this.freezeDemons -= scaledDt;
    if (!this.demons) this.demons = [];
    this.demonTimer = (this.demonTimer || 600) - scaledDt;
    if (this.demonTimer <= 0 && this.state === 'playing') {
      this.demonTimer = 720 + Math.random() * 480;
      this.spawnDemon();
    }
    for (let i = this.demons.length - 1; i >= 0; i--) {
      const d = this.demons[i];
      if (!(this.freezeDemons > 0)) {
        d.x += d.vx * scaledDt;
        d.phase += 0.05 * scaledDt;
        d.y += Math.sin(d.phase) * 0.6 * scaledDt;
      }
      let dead = false;
      for (let j = (this.lasers || []).length - 1; j >= 0; j--) {
        const l = this.lasers[j];
        if (Math.abs(l.x - d.x) < 18 && Math.abs(l.y - d.y) < 16) {
          this.lasers.splice(j, 1);
          d.hp--;
          this.particles.explodeBrick(d.x - 10, d.y - 10, 20, 20, '#8a5a9c');
          if (d.hp <= 0) {
            this.score += 100;
            this.showBanner('𒀭 Демон сбит +100');
            dead = true;
          }
          break;
        }
      }
      if (!dead) {
        for (const b of this.balls) {
          if (b.isLaunched && Math.abs(b.x - d.x) < 16 + b.radius && Math.abs(b.y - d.y) < 14 + b.radius) {
            if (!(this.deckHas && this.deckHas('GALLA'))) b.dy = -b.dy;
            d.hp--;
            this.particles.explodeBrick(d.x - 10, d.y - 10, 20, 20, '#8a5a9c');
            this.shakeIntensity = Math.max(this.shakeIntensity, 4);
            if (d.hp <= 0) {
              this.score += 100;
              this.showBanner('𒀭 Демон сбит +100');
              this.spawnPowerUp(d.x, d.y);
              dead = true;
            }
            break;
          }
        }
      }
      if (dead || d.x < -60 || d.x > CONFIG.WIDTH + 60) this.demons.splice(i, 1);
    }

    if (this.boss) {
      const bs = this.boss;
      bs.x += bs.vx * scaledDt;
      if (bs.x < 30 || bs.x > CONFIG.WIDTH - 30 - bs.w) bs.vx *= -1;
      bs.cd -= scaledDt;
      if (bs.cd <= 0) {
        bs.cd = 90 + Math.random() * 60;
        if (!this.bossBolts) this.bossBolts = [];
        this.bossBolts.push({ x: bs.x + bs.w / 2, y: bs.y + bs.h, vy: 3 });
      }
      for (const b of this.balls) {
        if (b.isLaunched && b.dy < 0 &&
            b.x > bs.x - b.radius && b.x < bs.x + bs.w + b.radius &&
            b.y - b.radius < bs.y + bs.h && b.y > bs.y) {
          b.dy = -b.dy;
          bs.hp -= (this.deckHas && this.deckHas('NAM_TAR') ? 2 : 1);
          this.particles.explodeBrick(b.x - 15, bs.y + bs.h - 10, 30, 12, '#c98a1a');
          this.shakeIntensity = Math.max(this.shakeIntensity, 5);
          if (bs.hp <= 0) { this.killBoss(); break; }
        }
      }
      for (let i = (this.bossBolts || []).length - 1; i >= 0; i--) {
        const p = this.bossBolts[i];
        p.y += p.vy * scaledDt;
        if (p.y > CONFIG.HEIGHT + 10) { this.bossBolts.splice(i, 1); continue; }
        if (p.x > this.paddle.x && p.x < this.paddle.x + this.paddle.width &&
            p.y > this.paddle.y && p.y < this.paddle.y + this.paddle.height) {
          this.bossBolts.splice(i, 1);
          this.paddle.width = Math.max(70, this.paddle.width * 0.85);
          this.shakeIntensity = Math.max(this.shakeIntensity, 6);
          this.effects.flash('#ff4020', 0.15);
        }
      }
    }
  },

  killBoss() {
    this.boss = null;
    this.bossBolts = [];
    this.score += 1000;
    this.effects.flash('#f0c96a', 0.3);
    this.shakeIntensity = 14;
    this.showBanner('𒀭 Хранитель пал +1000');
    for (const br of this.bricks) if (br.alive && !br.isSteel) br.alive = false;
    this.levelManager.aliveCount = 0;
  },

  maybeSpawnBoss(levelNumber) {
    const li = (levelNumber - 1) % 11;
    if (li === 10) {
      const biome = Math.floor((levelNumber - 1) / 11);
      this.boss = {
        x: CONFIG.WIDTH / 2 - 60, y: 64, w: 120, h: 34,
        vx: (1.1 + biome * 0.15) * (Math.random() < 0.5 ? 1 : -1),
        hp: 30 + biome * 10, maxHp: 30 + biome * 10,
        cd: 120, biome,
      };
      this.bossBolts = [];
      this.showBanner('𒀭 Хранитель! Бей его мячом!');
    } else {
      this.boss = null;
      this.bossBolts = [];
      this.showBanner('𒀭 Хранитель! Бей его мячом!');
    }
  },
};





