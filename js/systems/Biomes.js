export const BIOMES = ['Пески', 'Оазис', 'Евфрат', 'Степь', 'Загрос', 'Солёные равнины', 'Ночная пустыня', 'Кур'];

export function initBiomes(game) {
  game.biome = 0;
  game.biomeLuck = 0;

  const rl = game.loadLevel ? 'loadLevel' : game.startLevel ? 'startLevel' : null;
  if (rl) {
    const o = game[rl].bind(game);
    game[rl] = (n, ...a) => {
      const r = o(n, ...a);
      try { applyBiome(game, n); } catch (e) {}
      return r;
    };
  }

  const tick = () => {
    requestAnimationFrame(tick);
    if (game.paused || game.menuOpen || game.museumOpen) return;
    const t = performance.now() / 1000;
    if (game.biome === 2) {
      for (const b of (game.bricks || [])) {
        if (b._flow) b.x = b._bx + Math.sin(t * 0.8 + b._ph) * 10;
      }
    }
    if (game.biome === 3) {
      const w = Math.sin(t * 0.5) * 0.006;
      for (const b of (game.balls || [])) if (b.isLaunched) b.dx += w;
    }
  };
  requestAnimationFrame(tick);
}

function applyBiome(game, n) {
  const biome = Math.min(Math.floor(((n || 1) - 1) / 11), 7);
  game.biome = biome;
  game.biomeLuck = 0;
  const cv = document.getElementById('gameCanvas');
  if (cv) cv.style.filter = '';

  const balls = game.balls || [];
  const bricks = game.bricks || [];

  if (biome === 1) {
    for (const b of balls) { b.dx *= 0.92; b.dy *= 0.92; }
  }
  if (biome === 2) {
    bricks.forEach((b, i) => {
      if (!b.isSteel && i % 5 === 0) { b._flow = true; b._bx = b.x; b._ph = i * 0.7; }
    });
  }
  if (biome === 4) {
    bricks.forEach((b, i) => {
      if (!b.isSteel && i % 9 === 0) b.isSteel = true;
    });
  }
  if (biome === 5) game.biomeLuck = 1;
  if (biome === 6) { game.biomeLuck = 2; if (cv) cv.style.filter = 'brightness(0.72)'; }
  if (biome === 7) {
    game.biomeLuck = 1;
    for (const b of balls) { b.dx *= 1.08; b.dy *= 1.08; }
    if (cv) cv.style.filter = 'brightness(0.85) saturate(1.25)';
  }
}
