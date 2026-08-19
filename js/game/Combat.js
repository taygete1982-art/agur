import { CONFIG } from '../config.js?v=202608192032';
import { PowerUp } from '../entities/PowerUp.js?v=202608192032';

export const Combat = {
  wallHit(side, ball) {
    this.wallCharge[side]++;
    this.audio.wallHit();
    this.effects.wave(side === 'left' ? 4 : CONFIG.WIDTH - 4, ball.y, '#f0c96a');
    if (this.wallCharge[side] >= 5) {
      this.wallCharge[side] = 0;
      this.fireWallBolt(side, ball.y);
    }
  },

  fireWallBolt(side, y) {
    const row = this.bricks.filter(b => b.alive && !b.isBreaking && !b.isSteel && y > b.y && y < b.y + b.height)
      .sort((a, b) => side === 'left' ? a.x - b.x : b.x - a.x);
    const target = row[0];
    const startX = side === 'left' ? 0 : CONFIG.WIDTH;
    if (target) {
      this.effects.bolt(startX, y, target.x + target.width / 2, target.y + target.height / 2);
      this.effects.flash('#f0c96a', 0.15);
      this.shakeIntensity = Math.max(this.shakeIntensity, 6);
      if (target.takeDamage()) this.destroyBrick(target);
    } else {
      this.effects.bolt(startX, y, CONFIG.WIDTH / 2, y);
    }
    this.audio.wallBeam();
  },

  destroyBrick(brick) {
    if (this.levelManager.aliveCount <= 1 && this.state === 'playing') this.triggerDramaticSlowMo();
    if (brick.isDead || !brick.alive || brick.isSteel) return;
    brick.isDead = true;

    this.levelManager.brickDestroyed();
    this.combo++;
    if (this.combo % 12 === 0) this.collectWord();

    const typeScores = { gold: 50, silver: 30, explosive: 30, fire: 20, regen: 15, moving: 20, clay: 20 };
    this.score += Math.round((typeScores[brick.type] || 10) * this.combo * (this.deckScoreMul || 1));

    this.audio.brickBreak(brick.row);
    this.particles.explodeBrick(brick.x, brick.y, brick.width, brick.height, brick.getColors().glow);
    this.effects.wave(brick.x + brick.width / 2, brick.y + brick.height / 2, brick.getColors().glow);
    this.spawnZShards(brick);
    this.hitstop = 2;
    this.popups = this.popups || [];
    this.popups.push({ x: brick.x + brick.width / 2, y: brick.y, t: 0, text: '+' + (10 * Math.max(1, this.combo || 1)) });

    if (brick.type === 'explosive') {
      this.shakeIntensity = Math.max(this.shakeIntensity, 8);
      this.effects.flash('#f97316', 0.12);
      this.chainExplosion(brick);
    } else if (brick.type === 'fire') {
      this.fireDamage(brick);
    }

    const cx = brick.x + brick.width / 2;
    const cy = brick.y + brick.height / 2;
    const pityLimit = this.deckHas && this.deckHas('CUP') ? 28 : 40;
    this.noDrop = (this.noDrop || 0) + 1;
    if (this.noDrop >= pityLimit) { this.noDrop = 0; this.spawnPowerUp(cx, cy); }
    else if (brick.type === 'gold') {
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
  },

  chainExplosion(source) {
    for (const other of this.bricks) {
      if (other === source || !other.alive || other.isBreaking || other.isSteel) continue;
      if (Math.abs(other.row - source.row) <= 1 && Math.abs(other.col - source.col) <= 1) {
        this.effects.bolt(source.x + source.width / 2, source.y + source.height / 2, other.x + other.width / 2, other.y + other.height / 2);
        this.destroyBrick(other);
      }
    }
  },

  fireDamage(source) {
    for (const other of this.bricks) {
      if (other === source || !other.alive || other.isBreaking || other.isSteel) continue;
      const dr = Math.abs(other.row - source.row);
      const dc = Math.abs(other.col - source.col);
      if ((dr === 1 && dc === 0) || (dr === 0 && dc === 1)) {
        if (other.takeDamage()) this.destroyBrick(other);
      }
    }
  },

  spawnZShards(brick) {
    if (this.zShards.length > 240) return;
    const cx = brick.x + brick.width / 2;
    const cy = brick.y + brick.height / 2;
    const color = brick.getColors().base;
    const special = brick.type !== 'normal' && brick.type !== 'clay' && brick.type !== 'moving';
    if (!special && Math.random() > 0.12) return;
    if (special && brick.type !== 'gold' && brick.type !== 'explosive' && Math.random() < 0.5) return;
    const count = special ? 8 + Math.floor(Math.random() * 4) : 5 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) {
      const face = Math.random() < 0.5 ? 1 : 0;
      this.zShards.push({
        ox: cx - CONFIG.WIDTH / 2 + (Math.random() - 0.5) * brick.width * 0.8,
        oy: cy - CONFIG.HEIGHT / 2 + (Math.random() - 0.5) * brick.height * 0.8,
        lx: (Math.random() - 0.5) * 1.5,
        ly: 1.5 + Math.random() * 2.5,
        face: face,
        t: 0,
        z: 0,
        vz: face ? 3 + Math.random() * 2 : 2 + Math.random() * 1.5,
        size: 7 + Math.random() * 7,
        color: color,
        rot: (Math.random() - 0.5) * 0.6,
      });
    }
  },

  earthquake() {
    if (this.state !== 'playing' || this.quakeCooldown > 0) return;
    this.quakeCooldown = 45 * 60;
    this.shakeIntensity = 18;
    this.effects.flash('#d9a441', 0.25);
    this.audio.wallBeam();
    if (navigator.vibrate) navigator.vibrate(120);
    for (const brick of this.bricks) {
      if (!brick.alive || brick.isBreaking || brick.isSteel) continue;
      if (brick.takeDamage()) this.destroyBrick(brick);
    }
  },

  aimShot() {
    if (this.state !== 'playing' || this.aimCooldown > 0) return;
    const ball = this.balls[0];
    if (!ball || ball.isLaunched) return;
    let target = null, best = -1;
    for (const b of this.bricks) {
      if (!b.alive || b.isSteel) continue;
      const d = Math.hypot(b.x - ball.x, b.y - ball.y);
      if (d > best) { best = d; target = b; }
    }
    if (!target) return;
    this.aimCooldown = 20 * 60;
    const tx = target.x + target.width / 2;
    const ty = target.y + target.height / 2;
    const dx = tx - ball.x, dy = ty - ball.y;
    const len = Math.hypot(dx, dy) || 1;
    ball.dx = dx / len;
    ball.dy = dy / len;
    ball.isLaunched = true;
    this.effects.bolt(ball.x, ball.y, tx, ty);
    this.audio.launch();
    if (navigator.vibrate) navigator.vibrate(40);
  },
};




















