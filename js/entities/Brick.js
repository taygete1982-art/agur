import { CONFIG, randomRange } from '../config.js';

const PAD = 12;
const spriteCache = new Map();

function getBrickSprite(colors, w, h) {
  const key = colors.base + '|' + colors.glow + '|' + w + 'x' + h;
  if (spriteCache.has(key)) return spriteCache.get(key);
  const cv = document.createElement('canvas');
  cv.width = w + PAD * 2;
  cv.height = h + PAD * 2;
  const c = cv.getContext('2d');
  const grad = c.createLinearGradient(PAD, PAD, PAD + w, PAD + h);
  grad.addColorStop(0, colors.base);
  grad.addColorStop(1, colors.glow);
  c.shadowColor = colors.glow;
  c.shadowBlur = 10;
  c.fillStyle = grad;
  c.beginPath();
  c.roundRect(PAD, PAD, w, h, 6);
  c.fill();
  c.shadowBlur = 0;
  c.fillStyle = 'rgba(255, 255, 255, 0.15)';
  c.beginPath();
  c.roundRect(PAD + 4, PAD + 3, w - 8, h * 0.35, 4);
  c.fill();
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
      case 'silver':    return { base: '#6b7280', glow: '#e5e7eb' };
      case 'explosive': return { base: '#dc2626', glow: '#f97316' };
      case 'fire':      return { base: '#ea580c', glow: '#fbbf24' };
      case 'regen':     return { base: '#059669', glow: '#34d399' };
      case 'moving':    return { base: '#0891b2', glow: '#67e8f9' };
      case 'gold':      return { base: '#d97706', glow: '#fde047' };
      case 'clay':      return { base: '#96603d', glow: '#b57f52' };
      case 'steel':     return { base: '#6b7280', glow: '#9ca3af' };
      default:          return this.color;
    }
  }
  
  getEmoji() { return CONFIG.BRICK_TYPES[this.type.toUpperCase()]?.emoji || null; }
  
  draw(ctx) {
    if (!this.alive) {
      if (this.type === 'regen' && this.regensLeft > 0) {
        ctx.save();
        ctx.globalAlpha = 0.25 + Math.abs(Math.sin(this.respawnProgress * Math.PI * 3)) * 0.2;
        ctx.strokeStyle = '#34d399';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.roundRect(this.x, this.y, this.width, this.height, 6);
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
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
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
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.45)';
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
      ctx.fillStyle = 'rgba(255, 255, 255, ' + this.flashOpacity + ')';
      ctx.beginPath();
      ctx.roundRect(this.x, this.y, this.width, this.height, 6);
      ctx.fill();
    }
    
    ctx.restore();
  }
}
