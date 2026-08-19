const SPAWN = [0, 0, 0.15, 0.3, 0.6, 0.7, 0.85, 1];

export function initUtukku(game) {
  game.utukkus = game.utukkus || [];
  game.demons = [];

  const rl = game.loadLevel ? 'loadLevel' : game.startLevel ? 'startLevel' : null;
  if (rl) {
    const o = game[rl].bind(game);
    game[rl] = (n, ...a) => {
      const r = o(n, ...a);
      try { spawnForBiome(game); } catch (e) {}
      return r;
    };
  }

  const tick = () => {
    requestAnimationFrame(tick);
    if (game.ctx) drawUtukkus(game, game.ctx);
    if (game.paused || game.menuOpen || game.museumOpen || game.state !== 'playing') return;
    const now = performance.now() / 1000;
    for (const u of game.utukkus) {
      if (u.dead) continue;
      u.t = (u.t || 0) + 1;
      u.x = u.cx + Math.sin(now * 0.6 + u.ph) * u.rx;
      u.y = u.cy + Math.cos(now * 0.5 + u.ph * 1.3) * u.ry;
      for (const b of (game.balls || [])) {
        if (!b.isLaunched) continue;
        const dx = b.x - u.x, dy = b.y - u.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < 1600 && d2 > 0.01) {
          const d = Math.sqrt(d2);
          b.dx += (dx / d) * (1 - d / 40) * 0.4;
          b.dy += (dy / d) * (1 - d / 40) * 0.4;
        }
        if (d2 < 324) {
          u.hp -= 1; u.hitT = 8;
          b.dx = -b.dx; b.dy = -b.dy;
          if (game.audio && game.audio.crack) game.audio.crack();
          if (u.hp <= 0) {
            u.dead = true;
            game.score += 250;
            if (game.showBanner) game.showBanner('🕯 Утуку рассеян');
            if (game.audio && game.audio.brickBreak) game.audio.brickBreak();
            if (game.particles && game.particles.explodeBrick) game.particles.explodeBrick(u.x, u.y, 14, 14, '#1a0a0a');
            if (Math.random() < 0.4 && game.spawnPowerUp) game.spawnPowerUp(u.x, u.y, true);
          }
        }
      }
      if (u.hitT > 0) u.hitT--;
    }
    game.utukkus = game.utukkus.filter(u => !u.dead);
  };
  requestAnimationFrame(tick);
}

function spawnForBiome(game) {
  if ((game.level || 1) % 11 !== 0) { game.utukkus = []; return; }
  const biome = game.biome || 0;
  const force = !!game._guardNext;
  game._guardNext = false;
  const chance = SPAWN[Math.min(biome, 7)];
  if (!force && Math.random() > chance) return;
  const w = (game.canvas && game.canvas.width) || 540;
  const h = (game.canvas && game.canvas.height) || 860;
  const guard = biome >= 6 || force;
  const count = force ? 1 : (biome >= 7 ? 2 + Math.floor(Math.random() * 3) : 1);
  for (let i = 0; i < count; i++) {
    const u = {
      x: 0, y: 0,
      cx: (game.digArtifact && guard) ? Math.max(50, Math.min(w - 50, game.digArtifact.x + (Math.random() * 90 - 45))) : 80 + Math.random() * (w - 160),
      cy: (game.digArtifact && guard) ? Math.max(70, Math.min(h * 0.7, game.digArtifact.y - 70)) : 120 + Math.random() * (h * 0.4),
      rx: guard ? 34 : 40 + Math.random() * 60,
      ry: guard ? 22 : 20 + Math.random() * 30,
      ph: Math.random() * 6.28,
      hp: 2, t: 0, hitT: 0, dead: false,
    };
    game.utukkus.push(u);
  }
}

export function drawUtukkus(game, ctx) {
  for (const u of (game.utukkus || [])) {
    if (u.dead || !ctx) continue;
    ctx.save();
    ctx.translate(u.x, u.y);
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = '#0d0608';
    ctx.beginPath(); ctx.ellipse(-10 + Math.sin((u.t || 0) * 0.05) * 4, 14, 18, 5, 0, 0, 7); ctx.fill();
    ctx.globalAlpha = 0.85;
    const j = Math.sin((u.t || 0) * 0.1) * 2;
    ctx.fillStyle = '#0a0406';
    ctx.beginPath();
    ctx.moveTo(-18 + j, -10);
    ctx.quadraticCurveTo(-22 + j, 0, -16 + j, 18);
    ctx.lineTo(-6, 22); ctx.lineTo(6, 22); ctx.lineTo(16 - j, 18);
    ctx.quadraticCurveTo(22 - j, 0, 18 - j, -10);
    ctx.quadraticCurveTo(0, -24 - Math.abs(j), -18 + j, -10);
    ctx.closePath(); ctx.fill();
    ctx.globalAlpha = 0.4 + (u.hp === 1 ? 0.4 : 0);
    ctx.fillStyle = '#c82018';
    ctx.beginPath(); ctx.ellipse(0, 2, 10, 14, 0, 0, 7); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#e05038';
    ctx.fillRect(-7, -2, 3, 2); ctx.fillRect(-4, -4, 2, 4);
    ctx.fillRect(4, -2, 3, 2); ctx.fillRect(5, -4, 2, 4);
    if (u.hp === 1) {
      ctx.strokeStyle = 'rgba(224,80,56,0.6)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-8, -6); ctx.lineTo(-2, 4); ctx.lineTo(-6, 14);
      ctx.moveTo(8, -4); ctx.lineTo(4, 8); ctx.lineTo(10, 16);
      ctx.stroke();
    }
    ctx.restore();
  }
}
