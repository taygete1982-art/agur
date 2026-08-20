import { CONFIG, randomRange } from '../config.js?v=202608201601';
import { getBrickSprite } from './brickSprites.js?v=202608201601';

const BIOME_PALETTES = [
  [{ base: '#c9a05a', glow: '#dcb878' }, { base: '#b4593a', glow: '#c97a52' }, { base: '#6a5a4a', glow: '#8a7a5c' }, { base: '#9c4a34', glow: '#b86a4a' }],
  [{ base: '#7a8a4a', glow: '#98aa62' }, { base: '#5a6a3a', glow: '#7a8a52' }, { base: '#b89868', glow: '#d0b080' }, { base: '#9c4a34', glow: '#b86a4a' }],
  [{ base: '#1f3a7c', glow: '#3a5a9c' }, { base: '#2a6a7a', glow: '#4a8a9a' }, { base: '#d8cfc4', glow: '#ece4d8' }, { base: '#b89868', glow: '#d0b080' }],
  [{ base: '#c9853f', glow: '#dca058' }, { base: '#8a6a44', glow: '#a88a62' }, { base: '#9c4a34', glow: '#b86a4a' }, { base: '#cbb995', glow: '#e0d0b0' }],
  [{ base: '#26262c', glow: '#4a4a52' }, { base: '#5a544c', glow: '#7a746c' }, { base: '#6a5a44', glow: '#8a7a5c' }, { base: '#c9853f', glow: '#dca058' }],
  [{ base: '#16264c', glow: '#2a3a6c' }, { base: '#3a3a44', glow: '#5a5a64' }, { base: '#c98a1a', glow: '#e0b83a' }, { base: '#9c4a34', glow: '#b86a4a' }],
  [{ base: '#e8e0d8', glow: '#f4ece4' }, { base: '#cbb995', glow: '#e0d0b0' }, { base: '#d8cfc4', glow: '#ece4d8' }, { base: '#c9a05a', glow: '#dcb878' }],
  [{ base: '#a8442a', glow: '#c06a4a' }, { base: '#6a5a44', glow: '#8a7a5c' }, { base: '#9c4a34', glow: '#b86a4a' }, { base: '#5a544c', glow: '#7a746c' }],
];

export function biomeColor(biome, slot) {
  const pal = BIOME_PALETTES[biome % BIOME_PALETTES.length];
  return pal[slot % pal.length];
}

export class Brick {
  constructor(x, y, color, row, col) {
    this.x = x;
    this.y = y;
    this.width = CONFIG.BRICK.WIDTH;
    this.height = CONFIG.BRICK.HEIGHT;
    this.color = color;
    this.row = row;
    this.col = col;
    this.type = 'normal';
    this.maxHP = 1;
    this.hp = 1;
    this.alive = true;
    this.isSteel = false;
    this.isDead = false;
    this.isBreaking = false;
    this.breakPhase = 0;
    this.breakProgress = 0;
    this.scale = 1;
    this.flashOpacity = 0;
    this.originX = x;
    this.movePhase = randomRange(0, Math.PI * 2);
    this.regensLeft = 0;
    this.respawnProgress = 0;
    this.justRegenerated = false;
  }

  setHP(hp) { this.maxHP = hp; this.hp = hp; return this; }
  setSteel() { this.isSteel = true; this.type = 'steel'; this.hp = Infinity; return this; }

  setType(type) {
    this.type = type;
    const T = CONFIG.BRICK_TYPES;
    switch (type) {
      case 'silver': this.maxHP = T.SILVER.hp; this.hp = this.maxHP; break;
      case 'clay':   this.maxHP = T.CLAY.hp;   this.hp = this.maxHP; break;
      case 'regen':  this.regensLeft = T.REGEN.maxRegens; break;
      case 'steel':  this.setSteel(); break;
    }
    return this;
  }

  takeDamage() {
    if (this.isSteel) { this.flashOpacity = 0.5; return false; }
    this.hp--;
    if (this.hp <= 0) { this.startBreakAnimation(); return true; }
    this.flashOpacity = 0.8;
    return false;
  }

  startBreakAnimation() { this.isBreaking = true; this.breakProgress = 0; }

  update(dt = 1) {
    if (this.breakPhase > 0 && this.breakPhase < 1) {
      this.breakPhase = Math.min(1, this.breakPhase + dt * 0.08);
    }
    if (this.alive && !this.isBreaking && this.type === 'moving') {
      const T = CONFIG.BRICK_TYPES.MOVING;
      this.movePhase += T.speed * dt;
      this.x = this.originX + Math.sin(this.movePhase) * T.range;
    }
    if (this.isBreaking) {
      this.breakProgress += dt * 0.1;
      this.scale = 1 + Math.sin(this.breakProgress * Math.PI) * 0.3;
      if (this.breakProgress >= 1) {
        this.alive = false;
        this.isBreaking = false;
        this.breakPhase = 0;
        this.scale = 1;
        if (this.type === 'regen' && this.regensLeft > 0) this.respawnProgress = 0;
      }
    }
    if (!this.alive && this.type === 'regen' && this.regensLeft > 0) {
      this.respawnProgress += dt * (100 / CONFIG.BRICK_TYPES.REGEN.regenDelay);
      if (this.respawnProgress >= 1) {
        this.regensLeft--;
        this.alive = true;
        this.isDead = false;
        this.hp = this.maxHP;
        this.justRegenerated = true;
      }
    }
    if (this.flashOpacity > 0) {
      this.flashOpacity -= dt * 0.05;
      if (this.flashOpacity < 0) this.flashOpacity = 0;
    }
  }

  checkCollision(ball) {
    return (
      this.alive && !this.isBreaking &&
      ball.x + ball.radius > this.x && ball.x - ball.radius < this.x + this.width &&
      ball.y + ball.radius > this.y && ball.y - ball.radius < this.y + this.height
    );
  }

  getColors() {
    switch (this.type) {
      case 'silver':    return { base: '#1f3a7c', glow: '#3a5a9c' };
      case 'explosive': return { base: '#9c4a34', glow: '#c06a3a' };
      case 'fire':      return { base: '#b3541e', glow: '#d98a3a' };
      case 'regen':     return { base: '#6a7a4a', glow: '#8a9a5a' };
      case 'moving':    return { base: '#3a4a5a', glow: '#5a6a7a' };
      case 'gold':      return { base: '#c98a1a', glow: '#e0b83a' };
      case 'clay':      return { base: '#cbb995', glow: '#e0d0b0' };
      case 'steel':     return { base: '#26262c', glow: '#4a4a52' };
      default: {
        if (this.color) return this.color;
        const pal = BIOME_PALETTES[(window.__biome || 0) % BIOME_PALETTES.length];
        return pal[Math.floor(this.row / 2) % pal.length];
      }
    }
  }

  getEmoji() { return CONFIG.BRICK_TYPES[this.type.toUpperCase()]?.emoji || null; }

  draw(ctx) {
    if (!this.alive) {
      if (this.type === 'regen' && this.regensLeft > 0) {
        ctx.save();
        ctx.globalAlpha = 0.25 + Math.abs(Math.sin(this.respawnProgress * Math.PI * 3)) * 0.2;
        ctx.strokeStyle = '#6aab8a';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.roundRect(this.x, this.y, this.width, this.height, 3);
        ctx.stroke();
        ctx.restore();
      }
      return;
    }

    ctx.save();
    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2;
    ctx.translate(centerX, centerY);
    ctx.scale(this.scale, this.scale);
    ctx.translate(-centerX, -centerY);
    if (this.isBreaking) ctx.globalAlpha = 1 - this.breakProgress;

    ctx.drawImage(getBrickSprite(this.getColors(), this.width, this.height, this.type), this.x - 4, this.y - 4);

    if (this.type === 'explosive' || this.type === 'fire') {
      const a = 0.2 + Math.abs(Math.sin(performance.now() / 300 + this.col)) * 0.35;
      ctx.strokeStyle = 'rgba(255, 90, 30, ' + a.toFixed(3) + ')';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(this.x + 6, this.y + this.height * 0.6);
      ctx.lineTo(this.x + this.width * 0.4, this.y + this.height * 0.35);
      ctx.lineTo(this.x + this.width * 0.7, this.y + this.height * 0.7);
      ctx.lineTo(this.x + this.width - 6, this.y + this.height * 0.4);
      ctx.stroke();
    } else if (this.type === 'gold') {
      const p = (performance.now() / 1400 + this.col * 0.13) % 1;
      const sx = this.x - 10 + p * (this.width + 20);
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(this.x, this.y, this.width, this.height, 3);
      ctx.clip();
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = '#fff2c9';
      ctx.beginPath();
      ctx.moveTo(sx, this.y);
      ctx.lineTo(sx + 6, this.y);
      ctx.lineTo(sx - 4, this.y + this.height);
      ctx.lineTo(sx - 10, this.y + this.height);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    } else if (this.type === 'regen') {
      const sw = Math.sin(performance.now() / 500 + this.col) * 2;
      ctx.strokeStyle = '#7a9a4a';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(this.x + this.width - 8, this.y + 3);
      ctx.quadraticCurveTo(this.x + this.width - 8 + sw, this.y - 4, this.x + this.width - 5 + sw, this.y - 8);
      ctx.stroke();
    }

    const emoji = this.getEmoji();
    if (emoji) {
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(emoji, centerX, centerY);
    }

    if (this.maxHP > 1 && this.hp > 0) {
      ctx.fillStyle = 'rgba(255, 250, 235, 0.95)';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(this.hp), centerX, centerY);
    }

    if (this.type === 'regen') {
      for (let i = 0; i < this.regensLeft; i++) {
        ctx.fillStyle = '#a7f3d0';
        ctx.beginPath();
        ctx.arc(this.x + 8 + i * 8, this.y + this.height - 6, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    if (this.maxHP > 1 && this.hp < this.maxHP) {
      const stage = this.maxHP - this.hp;
      const cx = this.x + this.width / 2;
      const cy = this.y + this.height / 2;
      ctx.strokeStyle = 'rgba(20, 10, 5, 0.55)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx - 10, this.y + 2);
      ctx.lineTo(cx - 4, cy - 3);
      ctx.lineTo(cx - 9, cy + 4);
      ctx.lineTo(cx - 2, this.y + this.height - 2);
      if (stage >= 2) {
        ctx.moveTo(cx + 8, this.y + 3);
        ctx.lineTo(cx + 3, cy);
        ctx.lineTo(cx + 10, cy + 6);
        ctx.lineTo(cx + 5, this.y + this.height - 3);
      }
      ctx.stroke();
    }

    if (this.flashOpacity > 0) {
      ctx.fillStyle = 'rgba(255, 250, 235, ' + this.flashOpacity + ')';
      ctx.beginPath();
      ctx.roundRect(this.x, this.y, this.width, this.height, 3);
      ctx.fill();
    }
    ctx.restore();
  }
}








