function wedge(ctx, x, y, s, rot) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ctx.beginPath();
  ctx.moveTo(s * 0.6, 0);
  ctx.lineTo(-s * 0.2, -s * 0.45);
  ctx.lineTo(-s * 0.05, 0);
  ctx.lineTo(-s * 0.2, s * 0.45);
  ctx.closePath(); ctx.fill();
  ctx.fillRect(-s * 0.95, -s * 0.1, s * 0.85, s * 0.2);
  ctx.restore();
}

function drawMech(ctx, b, t) {
  const x = b.x, y = b.y, w = b.width, h = b.height;
  const cx = x + w / 2, cy = y + h / 2;
  ctx.save();
  if (b.type === 'gate') {
    ctx.globalAlpha = b.gateOpen ? 0.25 : 1;
    ctx.fillStyle = '#3a3230';
    ctx.beginPath(); ctx.roundRect(x, y, w, h, 2); ctx.fill();
    ctx.strokeStyle = '#c98a1a'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.roundRect(x + 1, y + 1, w - 2, h - 2, 2); ctx.stroke();
    ctx.fillStyle = '#e0b83a';
    wedge(ctx, cx - w * 0.18, cy, h * 0.5, Math.PI / 2);
    wedge(ctx, cx + w * 0.18, cy, h * 0.5, Math.PI / 2);
  } else if (b.type === 'switch') {
    ctx.fillStyle = b.switchUsed ? '#5a4a3a' : '#7a4a2a';
    ctx.beginPath(); ctx.roundRect(x, y, w, h, 3); ctx.fill();
    ctx.strokeStyle = '#c98a1a'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.roundRect(x + 1, y + 1, w - 2, h - 2, 3); ctx.stroke();
    ctx.fillStyle = '#e0b83a';
    ctx.beginPath(); ctx.arc(cx, cy + h * 0.12, h * 0.18, 0, 7); ctx.fill();
    wedge(ctx, cx, cy - h * 0.08, h * 0.4, b.switchUsed ? Math.PI : 0);
  } else if (b.type === 'teleport') {
    ctx.fillStyle = '#33302c';
    ctx.beginPath(); ctx.roundRect(x, y, w, h, 2); ctx.fill();
    const p = 0.5 + 0.5 * Math.sin(t / 300 + b.col);
    ctx.strokeStyle = 'rgba(224,185,58,' + (0.4 + 0.5 * p).toFixed(3) + ')';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(cx, cy, h * (0.12 + 0.18 * p), 0, 7); ctx.stroke();
    ctx.fillStyle = '#e0b83a';
    wedge(ctx, cx - w * 0.2, cy, h * 0.35, 0);
    wedge(ctx, cx + w * 0.2, cy, h * 0.35, Math.PI);
  } else if (b.type === 'timed') {
    ctx.globalAlpha = b.timedSolid ? 1 : 0.3;
    ctx.fillStyle = b.timedSolid ? '#4a4038' : '#6a5a3a';
    ctx.beginPath(); ctx.roundRect(x, y, w, h, 2); ctx.fill();
    ctx.strokeStyle = '#b09a6a'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.roundRect(x + 1, y + 1, w - 2, h - 2, 2); ctx.stroke();
    ctx.fillStyle = '#b09a6a';
    for (let i = -1; i <= 1; i++) wedge(ctx, cx + i * w * 0.22, cy, h * 0.3, Math.PI / 2);
  } else if (b.type === 'oneway') {
    ctx.globalAlpha = 0.8;
    ctx.fillStyle = '#4a4a3a';
    ctx.beginPath(); ctx.roundRect(x, y, w, h, 2); ctx.fill();
    const dir = { up: -Math.PI / 2, down: Math.PI / 2, left: Math.PI, right: 0 }[b.oneWayDir] || 0;
    ctx.fillStyle = '#8a9a5a';
    wedge(ctx, cx, cy, h * 0.45, dir);
  }
  ctx.restore();
}

export function initWalls(game) {
  const get = () => (game.levelManager && game.levelManager.walls) || game.walls || [];
  const r = game.renderer;
  if (r && typeof r.draw === 'function' && !r.__wallsPatched) {
    const od = r.draw.bind(r);
    r.draw = function (...a) {
      let res; try { res = od(...a); } finally {
        try {
          const ctx = game.ctx || r.ctx || (this && this.ctx);
          if (ctx) {
            for (const w of get()) w.draw(ctx);
            for (const b of (game.bricks || [])) if (b.alive && b.isMechanical && b.isMechanical()) drawMech(ctx, b, performance.now());
          }
        } catch (e) {}
      }
      return res;
    };
    r.__wallsPatched = true;
  }
  if (game.effects && game.effects.text && !game.effects.__textGated) {
    const ot = game.effects.text.bind(game.effects);
    game.effects.text = function(...args){ if(!game.scoreFx && args.some(x=>typeof x==='string' && /\+\d/.test(x))) return; return ot(...args); };
    game.effects.__textGated = true;
  }
}
