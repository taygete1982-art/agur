import { CONFIG, randomRange } from '../config.js';

const PAD = 4;
const spriteCache = new Map();

function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.min(255, Math.max(0, Math.round(((n >> 16) & 255) * f)));
  const g = Math.min(255, Math.max(0, Math.round(((n >> 8) & 255) * f)));
  const b = Math.min(255, Math.max(0, Math.round((n & 255) * f)));
  return 'rgb(' + r + ',' + g + ',' + b + ')';
}

function getBrickSprite(colors, w, h) {
  const key = colors.base + '|' + w + 'x' + h;
  if (spriteCache.has(key)) return spriteCache.get(key);
  const cv = document.createElement('canvas');
  cv.width = w + PAD * 2;
  cv.height = h + PAD * 2;
  const c = cv.getContext('2d');

  // Матовая глиняная плита: светлее сверху, темнее снизу
  const grad = c.createLinearGradient(0, PAD, 0, PAD + h);
  grad.addColorStop(0, shade(colors.base, 1.25));
  grad.addColorStop(0.5, colors.base);
  grad.addColorStop(1, shade(colors.base, 0.7));
  c.fillStyle = grad;
  c.beginPath();
  c.roundRect(PAD, PAD, w, h, 3);
  c.fill();

  // Тёмная обводка — кирпич читается как камень, а не подушка
  c.strokeStyle = 'rgba(30, 15, 5, 0.6)';
  c.lineWidth = 2;
  c.beginPath();
  c.roundRect(PAD + 1, PAD + 1, w - 2, h - 2, 3);
  c.stroke();

  // Верхняя грань — светлая кромка
  c.fillStyle = 'rgba(255, 240, 200, 0.22)';
  c.fillRect(PAD + 2, PAD + 2, w - 4, 2);

  // Крапинки-песчинки (детерминированные)
  let seed = 0;
  for (let i = 0; i < key.length; i++) seed = (seed * 31 + key.charCodeAt(i)) | 0;
  const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  c.fillStyle = 'rgba(0, 0, 0, 0.12)';
  for (let i = 0; i < 5; i++) c.fillRect(PAD + 2 + rnd() * (w - 5), PAD + 3 + rnd() * (h - 6), 2, 2);

  spriteCache.set(key, cv);
  return cv;
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
      case 'silver':    return { base: '#8a8f98', glow: '#c9ced6' };
      case 'explosive': return { base: '#a83a2a', glow: '#d96a3a' };
      case 'fire':      return { base: '#b3541e', glow: '#d98a3a' };
      case 'regen':     return { base: '#3a7d5c', glow: '#6aab8a' };
      case 'moving':    return { base: '#3a7d8c', glow: '#6aabba' };
      case 'gold':      return { base: '#b8860b', glow: '#e0b83a' };
      case 'clay':      return { base: '#8c5a3a', glow: '#ab7d5c' };
      case 'steel':     return { base: '#5a6068', glow: '#8a9098' };
      default:          return this.color;
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

    ctx.drawImage(getBrickSprite(this.getColors(), this.width, this.height), this.x - PAD, this.y - PAD);

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
