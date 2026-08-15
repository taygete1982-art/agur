import { CONFIG } from '../config.js';

export class PowerUp {
  constructor(x, y, type, artifactId = null) {
    this.x = x - 17;
    this.y = y - 17;
    this.width = 34;
    this.height = 34;
    this.type = type;
    this.artifactId = artifactId;
    this.config = CONFIG.POWERUP_TYPES[type];
    this.customEmoji = null;
    this.customColor = null;
    this.alive = true;
    this.time = 0;
  }

  update(dt = 1) {
    this.y += CONFIG.GAME.POWERUP_FALL_SPEED * dt;
    this.time += dt;
    if (this.y > CONFIG.HEIGHT + 40) this.alive = false;
  }

  apply(game) {
    switch (this.type) {
      case 'WIDE': game.paddle.activateWide(this.config.duration); break;
      case 'SLOW': game.applySlowEffect(); break;
      case 'LIFE': game.addLife(); break;
      case 'FRAGMENT': game.collectFragment(this.artifactId); break;
    }
  }

  draw(ctx) {
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;
    const pulse = 1 + Math.sin(this.time * 0.15) * 0.08;
    const color = this.customColor || this.config.color;

    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = 14;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, 16 * pulse, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.font = '18px "Segoe UI Emoji", "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.customEmoji || this.config.emoji, cx, cy + 1);
    ctx.restore();
  }
}
