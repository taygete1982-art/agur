import { CONFIG } from '../config.js';

export class PowerUp {
  constructor(x, y, type, artifactId = null) {
    this.width = 34;
    this.height = 34;
    this.x = x - this.width / 2;
    this.y = y - this.height / 2;
    this.type = type;
    this.artifactId = artifactId;
    this.config = CONFIG.POWERUP_TYPES[type] || { emoji: '𒀭', color: '#e8c98a', duration: 0, desc: '' };
    this.speed = CONFIG.GAME.POWERUP_FALL_SPEED;
    this.alive = true;
    this.phase = Math.random() * Math.PI * 2;
  }

  update(dt = 1) {
    this.y += this.speed * dt;
    this.phase += 0.08 * dt;
    this.x += Math.sin(this.phase) * 0.5 * dt;
    if (this.y > CONFIG.HEIGHT + 40) this.alive = false;
  }

  checkCollision(paddle) {
    return (
      this.y + this.height >= paddle.y &&
      this.y <= paddle.y + paddle.height &&
      this.x + this.width >= paddle.x &&
      this.x <= paddle.x + paddle.width
    );
  }

  apply(game) {
    switch (this.type) {
      case 'WIDE': game.paddle.activateWide(this.config.duration); break;
      case 'SLOW': game.applySlowEffect(); break;
      case 'LIFE': game.addLife(); break;
      case 'CARD': game.collectCard(); break;
      case 'CARD': game.collectCard(); break;
      case 'FRAGMENT': game.collectFragment(this.artifactId); break;
      case 'MULTI': game.spawnMultiBall(); break;
      case 'SIGN': game.collectSign(this.artifactId); break;
      case 'LASER':
        game.laserTimer = this.config.duration;
        game.showBanner('⚡ Молния Адада! Пробел = залп');
        break;
    }
    game.audio.powerUp();
  }

  draw(ctx) {
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;
    const pulse = 1 + Math.sin(this.phase * 2) * 0.1;
    ctx.save();
    ctx.strokeStyle = this.config.color;
    ctx.lineWidth = 2;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.arc(cx, cy, 16 * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.font = this.type === 'SIGN' ? 'bold 18px sans-serif' : '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.type === 'CARD' ? '🃏' : (this.type === 'CARD' ? '🃏' : (this.type === 'SIGN' && this.artifactId ? this.artifactId.c : this.config.emoji)), cx, cy + 1);
    ctx.restore();
  }
}








