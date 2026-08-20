export function initWalls(game) {
  const get = () => (game.levelManager && game.levelManager.walls) || game.walls || [];
  const r = game.renderer;
  if (r && typeof r.draw === 'function' && !r.__wallsPatched) {
    const od = r.draw.bind(r);
    r.draw = function (...a) {
      let res; try { res = od(...a); } finally {
        try { const ctx = game.ctx || r.ctx || (this && this.ctx); if (ctx) for (const w of get()) w.draw(ctx); } catch (e) {}
      }
      return res;
    };
    r.__wallsPatched = true;
  }
  if (game.effects && game.effects.text && !game.effects.__textGated) {
    const ot = game.effects.text.bind(game.effects);
    game.effects.text = function(...args){ if(!game.scoreFx && args.some(a=>typeof a==='string' && /\+\d/.test(a))) return; return ot(...args); };
    game.effects.__textGated = true;
  }
  if (false) {
  }
}
