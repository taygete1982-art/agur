import { CONFIG } from '../config.js?v=202608201644';

export class Effects {
  constructor() { this.bolts = []; this.waves = []; this.flashes = []; }

  bolt(x1, y1, x2, y2) {
    const pts = [{ x: x1, y: y1 }];
    const segs = 7;
    for (let i = 1; i < segs; i++) {
      const t = i / segs;
      pts.push({ x: x1 + (x2 - x1) * t + (Math.random() - 0.5) * 34, y: y1 + (y2 - y1) * t + (Math.random() - 0.5) * 34 });
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
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(b.pts[0].x, b.pts[0].y);
      for (const p of b.pts) ctx.lineTo(p.x, p.y);
      ctx.stroke();
      ctx.shadowBlur = 0;
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








