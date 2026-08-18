// Утуку — редкий дух, вмешивающийся в траекторию мяча
// 0 на Пески/Оазис, редкие на Евфрат/Степь, первые на Загрос, частые на Кур
const SPAWN = [0, 0, 0.15, 0.3, 0.6, 0.7, 0.85, 1];

export function initUtukku(game) {
  game.utukkus = game.utukkus || [];
  const origDemons = game.demons;
  if (origDemons) { for (const d of origDemons) d.dead = true; }
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
    const w = (game.canvas && game.canvas.width) || 540;
    const h = (game.canvas && game.canvas.height) || 860;

    for (const u of game.utukkus) {
      if (u.dead) continue;
      u.t = (u.t || 0) + 1;
      u.x = u.cx + Math.sin(now * 0.6 + u.ph) * u.rx;
      u.y = u.cy + Math.cos(now * 0.5 + u.ph * 1.3) * u.ry;

      // Вмешательство в траекторию: отклоняет мячи, проходящие рядом
      const balls = game.balls || [];
      for (const b of balls) {
        if (!b.isLaunched) continue;
        const dx = b.x - u.x, dy = b.y - u.y;
        const d2 = dx * dx + dy * dy;
        const ir = 40;
        if (d2 < ir * ir && d2 > 0.01) {
          const d = Math.sqrt(d2);
          const nx = dx / d, ny = dy / d;
          // искривление траектории - не лобовое столкновение, а гравитационный толчок
          const force = (1 - d / ir) * 0.4;
          b.dx += nx * force;
          b.dy += ny * force;
          if (game.particles && game.particles.burst) game.particles.burst(b.x, b.y, 3, '#3a2020');
        }
        // прямое попадание мячом = урон
        if (d2 < 18 * 18) {
          u.hp -= 1;
          u.hitT = 8;
          if (game.audio && game.audio.crack) game.audio.crack();
          if (game.particles && game.particles.burst) game.particles.burst(u.x, u.y, 5, '#1a0a0a');
          // отскок мяча
          const sp = Math.sqrt(b.dx * b.dx + b.dy * b.dy);
          b.dx = -b.dx; b.dy = -b.dy;
          const nsp = Math.sqrt(b.dx * b.dx + b.dy * b.dy);
          if (nsp > 0.01) { b.dx = b.dx / nsp * sp; b.dy = b.dy / nsp * sp; }
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
  const biome = game.biome || 0;
  const chance = SPAWN[Math.min(biome, 7)];
  if (Math.random() > chance) return;
  const w = (game.canvas && game.canvas.width) || 540;
  const h = (game.canvas && game.canvas.height) || 860;
  const count = biome >= 7 ? 2 + Math.floor(Math.random() * 3) : 1;
  for (let i = 0; i < count; i++) {
    const u = {
      x: 0, y: 0,
      cx: 80 + Math.random() * (w - 160),
      cy: 120 + Math.random() * (h * 0.4),
      rx: 40 + Math.random() * 60,
      ry: 20 + Math.random() * 30,
      ph: Math.random() * 6.28,
      hp: 2,
      t: 0,
      hitT: 0,
      dead: false,
      draw: null,
    };
    u.draw = (ctx) => {
      if (!ctx) return;
      ctx.save();
      ctx.translate(u.x, u.y);
      // шлейф пепла
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = '#0d0608';
      ctx.beginPath(); ctx.ellipse(-10 + Math.sin(u.t * 0.05) * 4, 14, 18, 5, 0, 0, 7); ctx.fill();
      // тёмный силуэт
      ctx.globalAlpha = 0.85;
      const jitter = Math.sin(u.t * 0.1) * 2;
      ctx.fillStyle = '#0a0406';
      ctx.beginPath();
      ctx.moveTo(-18 + jitter, -10);
      ctx.quadraticCurveTo(-22 + jitter, 0, -16 + jitter, 18);
      ctx.lineTo(-6, 22); ctx.lineTo(6, 22); ctx.lineTo(16 - jitter, 18);
      ctx.quadraticCurveTo(22 - jitter, 0, 18 - jitter, -10);
      ctx.quadraticCurveTo(0, -24 - Math.abs(jitter), -18 + jitter, -10);
      ctx.closePath(); ctx.fill();
      // внутреннее красное свечение
      ctx.globalAlpha = 0.4 + (u.hp === 1 ? 0.4 : 0);
      ctx.fillStyle = '#c82018';
      ctx.beginPath(); ctx.ellipse(0, 2, 10, 14, 0, 0, 7); ctx.fill();
      // глаза — клинописные знаки
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#e05038';
      const ey = -2;
      ctx.fillRect(-7, ey, 3, 2); ctx.fillRect(-4, ey - 2, 2, 4);
      ctx.fillRect(4, ey, 3, 2); ctx.fillRect(5, ey - 2, 2, 4);
      // трещины при низком HP
      if (u.hp === 1) {
        ctx.strokeStyle = 'rgba(224,80,56,0.6)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-8, -6); ctx.lineTo(-2, 4); ctx.lineTo(-6, 14);
        ctx.moveTo(8, -4); ctx.lineTo(4, 8); ctx.lineTo(10, 16);
        ctx.stroke();
      }
      ctx.restore();
    };
    game.utukkus.push(u);
  }
}

// Рендеринг — поверх остальных объектов
export function drawUtukkus(game, ctx) {
  for (const u of (game.utukkus || [])) {
    if (!u.dead && u.draw) u.draw(ctx);
  }
}

