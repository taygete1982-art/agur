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
            for (const b of (game.bricks || [])) {
              if (b.alive && b.isMechanical && b.isMechanical()) {
                const c = b.getColors();
                ctx.save();
                ctx.fillStyle = c.base;
                ctx.beginPath(); ctx.roundRect(b.x, b.y, b.width, b.height, 4); ctx.fill();
                ctx.strokeStyle = c.glow; ctx.lineWidth = 2;
                ctx.beginPath(); ctx.roundRect(b.x + 1, b.y + 1, b.width - 2, b.height - 2, 3); ctx.stroke();
                const e = b.getEmoji ? b.getEmoji() : null;
                if (e) { ctx.fillStyle = '#fff'; ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(e, b.x + b.width / 2, b.y + b.height / 2); }
                ctx.restore();
              }
            }
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
