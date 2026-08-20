const KINDS = ['Амфора','Печать','Маска','Амулет','Табличка','Корона','Идол','Самоцвет','Статуэтка','Перстень','Чаша','Наконечник'];

function drawArtifact(ctx, a, t) {
  const pulse = 0.65 + 0.35 * Math.sin(t / 220);
  ctx.save();
  ctx.globalAlpha = 0.25 * pulse;
  ctx.fillStyle = '#e0b83a';
  ctx.beginPath(); ctx.arc(a.x, a.y, a.radius + 10, 0, 7); ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#6a5220';
  ctx.beginPath(); ctx.arc(a.x, a.y, a.radius, 0, 7); ctx.fill();
  ctx.strokeStyle = '#f0c96a'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(a.x, a.y, a.radius, 0, 7); ctx.stroke();
  ctx.fillStyle = '#f0c96a';
  ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('◆', a.x, a.y);
  ctx.font = '10px sans-serif';
  ctx.fillText(KINDS[a.kind % KINDS.length], a.x, a.y - a.radius - 8);
  ctx.restore();
}

export function initArtifact(game) {
  const lname = ['loadLevel','startLevel','setLevel'].find(k => typeof game[k] === 'function');
  if (lname && !game.__artifactWrapped) {
    const orig = game[lname].bind(game);
    game[lname] = function (n, ...rest) {
      const r = orig(n, ...rest);
      const ap = game.levelManager && game.levelManager.artifactCell;
      game.digArtifact = ap
        ? { x: ap.x, y: ap.y, taken: false, kind: ((n - 1) * 3) % KINDS.length, radius: 16, hp: 1, maxHp: 1 }
        : null;
      return r;
    };
    game.__artifactWrapped = true;
  }
  const r = game.renderer;
  if (r && typeof r.draw === 'function' && !r.__artifactPatched) {
    const od = r.draw.bind(r);
    r.draw = function (...a) { const res = od(...a); const art = game.digArtifact; if (art && !art.taken && game.ctx) drawArtifact(game.ctx, art, performance.now()); return res; };
    r.__artifactPatched = true;
  }
  if (!game.__artifactCollector) {
    game.__artifactCollector = true;
    setInterval(() => {
      const art = game.digArtifact;
      if (!art || art.taken) return;
      for (const ball of (game.balls || [])) {
        const dx = ball.x - art.x, dy = ball.y - art.y;
        const rr = art.radius + (ball.radius || 8);
        if (dx * dx + dy * dy <= rr * rr) {
          art.taken = true;
          game.score = (game.score || 0) + 500;
          game.effects && game.effects.wave && game.effects.wave(art.x, art.y, '#e0b83a');
          if (game.levelComplete) game.levelComplete();
          return;
        }
      }
    }, 50);
  }
}
