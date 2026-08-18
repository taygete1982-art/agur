const ROLE = ['Зиккурат', 'Врата', 'Табличка', 'Разлом', 'Сокровищница', 'Глубокая сокровищница', 'Храм', 'Врата храма', 'Спираль', 'Ложная гробница', 'Великая гробница'];

const ARCH = [
  (r, c, R, C) => { const mid = (C - 1) / 2; const half = (C / 2) * (1 - r / (R + 2)); if (Math.abs(c - mid) <= half && Math.abs(r - R / 2) <= 1) return 'G'; return Math.abs(c - mid) <= half ? 'C' : '.'; },
  (r, c, R, C) => { if (r < 2) return 'C'; if (c < 2 || c >= C - 2) return 'C'; if (r === Math.floor(R / 2) && c === Math.floor(C / 2)) return 'G'; return '.'; },
  (r, c, R, C) => (Math.abs(r - R / 2) <= 1 && Math.abs(c - (C - 1) / 2) <= 1) ? 'G' : (r % 4 === 3) ? '.' : 'C',
  (r, c, R, C) => { if (Math.abs(r - R / 2) <= 1 && Math.abs(c - (C - 1) / 2) <= 1) return 'G'; if (r % 4 === 3) return '.'; const crack = Math.floor(C / 2) + Math.floor((r - R / 2) / 3); return (c === crack || c === crack + 1) ? '.' : 'C'; },
  (r, c, R, C) => {
    const wall = r === 0 || r === R - 1 || c === 0 || c === C - 1;
    const shell = Math.min(r, c, R - 1 - r, C - 1) === 2;
    const core = Math.abs(r - R / 2) <= 1 && Math.abs(c - (C - 1) / 2) <= 1;
    if (core) return 'G';
    if (wall) return (r === 0 && c === Math.floor(C / 2)) ? '.' : 'C';
    if (shell) return (r === Math.floor(R / 2) && c === 2) ? '.' : 'C';
    return '.';
  },
  (r, c, R, C) => {
    const L = Math.min(r, c, R - 1 - r, C - 1);
    const core = Math.abs(r - R / 2) <= 1 && Math.abs(c - (C - 1) / 2) <= 1;
    if (core) return 'G';
    if (L === 0) return (r === 0 && c === Math.floor(C / 2)) ? '.' : 'C';
    if (L === 2) return (r === R - 1 && c === Math.floor(C / 2)) ? '.' : 'C';
    if (L === 4) return (r === Math.floor(R / 2) && c === 4) ? '.' : 'C';
    return '.';
  },
  (r, c, R, C) => { if (r < 2 || r > R - 3) return 'C'; if (c % 4 === 1) return 'S'; if (Math.abs(r - R / 2) <= 1 && Math.abs(c - (C - 1) / 2) <= 1) return 'G'; return '.'; },
  (r, c, R, C) => { if (r < 2 || r > R - 3) return 'C'; if (c % 4 === 1) return Math.abs(c - (C - 1) / 2) <= 1 ? '.' : 'S'; if (Math.abs(r - R / 2) <= 1 && Math.abs(c - (C - 1) / 2) <= 1) return 'G'; return '.'; },
  (r, c, R, C) => {
    const L = Math.min(r, c, R - 1 - r, C - 1);
    const core = Math.abs(r - R / 2) <= 1 && Math.abs(c - (C - 1) / 2) <= 1;
    if (core) return 'G';
    if (L % 2 === 1) return '.';
    const gap = (L * 3) % C;
    return (r === L && c === gap) ? '.' : 'C';
  },
  (r, c, R, C) => {
    const wall = r === 0 || r === R - 1 || c === 0 || c === C - 1;
    if (wall) return (r === 0 && c === Math.floor(C / 2)) ? '.' : 'C';
    if (Math.abs(r - R / 2) <= 1 && Math.abs(c - (C - 1) / 2) <= 1) return 'G';
    if (r === R - 2 && c === C - 2) return 'G';
    return '.';
  },
  (r, c, R, C) => {
    if (r === 0 || r === R - 1 || c === 0 || c === C - 1) return (r === 0 && c === Math.floor(C / 2)) ? '.' : 'C';
    if ((c === 2 || c === C - 3) && r > 2 && r < R - 3) return 'S';
    if (Math.abs(r - R / 2) <= 1 && Math.abs(c - (C - 1) / 2) <= 1) return 'G';
    if (r === 1 && c === Math.floor(C / 2)) return 'G';
    return '.';
  },
];

export function initArchitectures(game) {
  const lname = game.loadLevel ? 'loadLevel' : game.startLevel ? 'startLevel' : null;
  if (!lname) return;
  const orig = game[lname].bind(game);
  game[lname] = (n, ...rest) => {
    game._digDone = false;
    game._livesStart = game.lives;
    game.digArtifact = null;
    game._archApplied = null;
    const r = orig(n, ...rest);
    try { applyArch(game, n); } catch (e) { console.error('ARCH FAIL', e); if (game.showBanner) game.showBanner('ARCH FAIL: ' + e.message); }
    return r;
  };

  const tick = () => {
    requestAnimationFrame(tick);
    const a = game.digArtifact;
    if (!a || a.taken || game._digDone) return;
    if (game.paused || game.menuOpen || game.museumOpen || game.state !== 'playing') return;
    for (const b of (game.balls || [])) {
      if (!b.isLaunched) continue;
      const dx = b.x - a.x, dy = b.y - a.y;
      const rr2 = (16 + (b.radius || 8)) * (16 + (b.radius || 8));
      if (dx * dx + dy * dy < rr2) { collect(game, a); break; }
    }
    if (game.levelManager && game.levelManager.aliveCount <= 0) collect(game, a);
  };
  requestAnimationFrame(tick);

  setInterval(() => {
    const n = game.level;
    if (n && game._archApplied !== n && game.bricks && game.bricks.filter(b => b.alive).length > 10) {
      try { applyArch(game, n); } catch (e) { console.error('ARCH FAIL', e); }
    }
  }, 700);
}

function collect(game, a) {
  console.log('[ARCH] collecting artifact kind=', a.kind);
  if (a.taken || game._digDone) return;
  a.taken = true;
  const all = game.levelManager && game.levelManager.aliveCount <= 0;
  const noLife = game.lives >= (game._livesStart || game.lives);
  const stars = 1 + (all ? 1 : 0) + (noLife ? 1 : 0);
  game.score += 500;
  if (game.effects && game.effects.flash) game.effects.flash('#f0c96a', 0.3);
  if (game.showBanner) game.showBanner('⚱ ' + KINDS[(a.kind || 0) % 12] + ' ' + '🏺'.repeat(stars));
  if (game.audio && game.audio.powerupGet) game.audio.powerupGet();
  try {
    const m = JSON.parse(localStorage.getItem('agur_dig') || '{}');
    m[game.level] = Math.max(m[game.level] || 0, stars);
    localStorage.setItem('agur_dig', JSON.stringify(m));
  } catch (e) {}
  game._digDone = true;
  setTimeout(() => { if (game.levelComplete) game.levelComplete(); }, 700);
}

const KINDS = ['Амфора', 'Цилиндрическая печать', 'Золотая маска', 'Амулет', 'Табличка', 'Корона', 'Идол', 'Самоцвет', 'Статуэтка', 'Перстень', 'Чаша', 'Наконечник'];

function drawArtifact(g, a, t) {
  const pulse = 0.6 + 0.4 * Math.sin(t / 300);
  g.save();
  g.translate(a.x, a.y);
  g.globalAlpha = (a.hidden ? 0.3 : 0.2) * pulse + 0.1;
  g.fillStyle = '#f0c96a';
  g.beginPath(); g.arc(0, 0, 16, 0, 7); g.fill();
  g.globalAlpha = 1;
  g.fillStyle = '#d8a848';
  const k = (a.kind || 0) % 12;
  if (k === 0) { g.beginPath(); g.moveTo(-6, -8); g.quadraticCurveTo(-9, 0, -5, 8); g.lineTo(5, 8); g.quadraticCurveTo(9, 0, 6, -8); g.closePath(); g.fill(); g.fillRect(-4, -11, 8, 3); }
  else if (k === 1) { g.fillRect(-4, -9, 8, 18); g.fillStyle = '#7a5018'; g.fillRect(-1, -9, 2, 18); }
  else if (k === 2) { g.beginPath(); g.arc(0, -1, 8, 0, 7); g.fill(); g.fillStyle = '#7a5018'; g.fillRect(-5, -3, 3, 2); g.fillRect(2, -3, 3, 2); }
  else if (k === 3) { g.beginPath(); g.moveTo(0, -9); g.lineTo(7, 0); g.lineTo(0, 9); g.lineTo(-7, 0); g.closePath(); g.fill(); g.strokeStyle = '#d8a848'; g.lineWidth = 2; g.beginPath(); g.arc(0, -11, 3, 0, 7); g.stroke(); }
  else if (k === 4) { g.fillRect(-7, -8, 14, 16); g.fillStyle = '#7a5018'; g.fillRect(-4, -5, 8, 2); g.fillRect(-4, -1, 6, 2); g.fillRect(-4, 3, 8, 2); }
  else if (k === 5) { g.fillRect(-8, 2, 16, 5); g.beginPath(); g.moveTo(-6, 2); g.lineTo(-4, -6); g.lineTo(-2, 2); g.closePath(); g.fill(); g.beginPath(); g.moveTo(-2, 2); g.lineTo(0, -8); g.lineTo(2, 2); g.closePath(); g.fill(); g.beginPath(); g.moveTo(2, 2); g.lineTo(4, -6); g.lineTo(6, 2); g.closePath(); g.fill(); }
  else if (k === 6) { g.beginPath(); g.arc(0, -6, 4, 0, 7); g.fill(); g.fillRect(-3, -3, 6, 11); g.fillRect(-7, -1, 14, 3); }
  else if (k === 7) { g.beginPath(); g.moveTo(0, -9); g.lineTo(7, -3); g.lineTo(5, 7); g.lineTo(-5, 7); g.lineTo(-7, -3); g.closePath(); g.fill(); g.strokeStyle = '#7a5018'; g.lineWidth = 1; g.beginPath(); g.moveTo(0, -9); g.lineTo(0, 7); g.stroke(); }
  else if (k === 8) { g.beginPath(); g.ellipse(0, 2, 6, 7, 0, 0, 7); g.fill(); g.beginPath(); g.arc(3, -6, 3, 0, 7); g.fill(); g.fillRect(5, -7, 4, 2); }
  else if (k === 9) { g.strokeStyle = '#d8a848'; g.lineWidth = 3; g.beginPath(); g.arc(0, 2, 6, 0, 7); g.stroke(); g.fillRect(-2, -9, 4, 4); }
  else if (k === 10) { g.beginPath(); g.arc(0, -2, 8, 0, Math.PI); g.fill(); g.fillRect(-9, -3, 18, 2); }
  else { g.beginPath(); g.moveTo(0, -10); g.lineTo(5, 2); g.lineTo(0, 0); g.lineTo(-5, 2); g.closePath(); g.fill(); g.fillRect(-1, 0, 2, 10); }
  g.fillStyle = 'rgba(255,240,200,0.8)';
  g.fillRect(-2, -6, 2, 6);
  g.restore();
}

function applyArch(game, n) {
  if (game._archApplied === n) return;
  console.log('[ARCH] trying level', n, 'live bricks:', game.bricks ? game.bricks.filter(b=>b.alive).length : 0);
  const bricks = game.bricks;
  if (!bricks || !bricks.length) return;
  game._archApplied = n;
  const live = bricks.filter(b => b.alive);
  const ys = [...new Set(live.map(b => Math.round(b.y)))].sort((a, b) => a - b);
  const xs = [...new Set(live.map(b => Math.round(b.x)))].sort((a, b) => a - b);
  const R = ys.length, C = xs.length;
  console.log('[ARCH] R=', R, 'C=', C);
  if (R < 4 || C < 4) return;
  const yI = new Map(ys.map((y, i) => [y, i]));
  const xI = new Map(xs.map((x, i) => [x, i]));
  const role = (n - 1) % 11;
  const biome = Math.min(Math.floor((n - 1) / 11), 7);
  const fn = ARCH[role];

  const plan = [];
  const coreCells = [];
  for (const b of live) {
    const r = yI.get(Math.round(b.y)), c = xI.get(Math.round(b.x));
    if (r === undefined || c === undefined) continue;
    const spec = fn(r, c, R, C);
    plan.push([b, spec]);
    if (spec === 'G') coreCells.push(b);
  }
  const kept = plan.filter(p => p[1] === 'C' || p[1] === 'S').length;
  if (kept < 8) return;

  console.log('[ARCH] plan:', plan.length, 'cells, core:', coreCells.length, 'kept:', kept);
  
  // СНАЧАЛА позиция артефакта (пока кирпичи ещё на месте)
  if (coreCells.length) {
    const bw = coreCells[0].width, bh = coreCells[0].height;
    const ax = coreCells.reduce((s, b) => s + b.x, 0) / coreCells.length + bw / 2;
    const ay = coreCells.reduce((s, b) => s + b.y, 0) / coreCells.length + bh / 2;
    console.log('[ARCH] artifact placed at', ax, ay, 'kind', (biome * 3 + role) % 12);
    game.digArtifact = { x: ax, y: ay, taken: false, hidden: biome >= 6, kind: (biome * 3 + role) % 12 };
  } else {
    console.warn('[ARCH] no core cells for level', n, 'role', role);
  }
  
  // ПОТОМ удаляем кирпичи
  for (const [b, spec] of plan) {
    if (spec === '.' || spec === 'G') {
      if (b._oy === undefined) b._oy = b.y;
      b.alive = false; b.y = -9999; b.maxRegens = 0;
      if (game.levelManager && typeof game.levelManager.aliveCount === 'number') game.levelManager.aliveCount--;
    } else if (spec === 'S') {
      b.isSteel = true;
    }
  }
  if (game.showBanner) game.showBanner('⛏ Раскопки №' + n + ' — ' + ROLE[role]);
  console.log('[ARCH] level', n, 'applied successfully');
}









