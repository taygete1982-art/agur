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
}
