const NAMES = ['Сплошная кладка', 'Шахматы', 'Пирамида', 'Ромб', 'Колонны', 'Зигзаг', 'Рамка', 'Крест'];

const PATTERNS = [
  (r, c, R, C) => true,
  (r, c, R, C) => (r + c) % 2 === 0,
  (r, c, R, C) => { const mid = (C - 1) / 2; const half = Math.ceil((C / 2) * (1 - r / R)); return Math.abs(c - mid) <= half; },
  (r, c, R, C) => { const mid = (C - 1) / 2; return Math.abs(r - (R - 1) / 2) / (R / 2) + Math.abs(c - mid) / (C / 2) <= 1; },
  (r, c, R, C) => c % 4 < 2,
  (r, c, R, C) => (r % 2 === 0) ? c % 4 < 2 : (c + 2) % 4 < 2,
  (r, c, R, C) => r === 0 || r === R - 1 || c === 0 || c === C - 1 || (r % 2 === 0 && c % 2 === 0),
  (r, c, R, C) => { const a = r / (R - 1), b = c / (C - 1); return Math.abs(a - b) < 0.18 || Math.abs(a - (1 - b)) < 0.18; },
];

export function initLayouts(game) {
  const lname = game.loadLevel ? 'loadLevel' : game.startLevel ? 'startLevel' : game.setLevel ? 'setLevel' : null;
  if (!lname) return;
  const orig = game[lname].bind(game);
  game[lname] = (n, ...rest) => {
    const r = orig(n, ...rest);
    try {
      applyLayout(game, n);
      if (game.showBanner) game.showBanner('🧱 ' + NAMES[(n - 1) % NAMES.length]);
    } catch (e) {}
    return r;
  };
}

function applyLayout(game, n) {
  const bricks = game.bricks;
  if (!bricks || !bricks.length) return;
  const ys = [...new Set(bricks.map(b => Math.round(b.y)))].sort((a, b) => a - b);
  const xs = [...new Set(bricks.map(b => Math.round(b.x)))].sort((a, b) => a - b);
  const R = ys.length, C = xs.length;
  if (R < 3 || C < 3) return;
  const yI = new Map(ys.map((y, i) => [y, i]));
  const xI = new Map(xs.map((x, i) => [x, i]));
  const fn = PATTERNS[(n - 1) % PATTERNS.length];
  let kept = 0;
  for (const b of bricks) {
    if (b.isSteel) { kept++; continue; }
    const r = yI.get(Math.round(b.y)), c = xI.get(Math.round(b.x));
    if (fn(r, c, R, C)) kept++;
    else { b.alive = false; b.hp = 0; }
  }
  if (kept < Math.floor(bricks.length * 0.35)) {
    for (const b of bricks) b.alive = true;
  }
}
