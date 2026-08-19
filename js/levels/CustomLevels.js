// 88 раскопок БЕЗ внешних рамок: мяч гуляет по всему полю,
// сталь прикрывает артефакт, ворота 1-2 клетки - единственный вход.
function G() { const g = []; for (let r = 0; r < 18; r++) g.push(Array(12).fill('.')); return g; }
function H(g, r, c0, c1, ch) { for (let c = c0; c <= c1; c++) g[r][c] = ch; }
function V(g, c, r0, r1, ch) { for (let r = r0; r <= r1; r++) g[r][c] = ch; }
function done(g) { return g.map(r => r.join('')); }
function gateMat(bi) { return bi < 2 ? 'C' : (bi < 5 ? 'S' : 'R'); }
function gateW(bi) { return bi < 3 ? 2 : 1; }

// A: сейф - стальная коробка с воротами
function archVault(n, bi) {
  const g = G();
  H(g, 4, 3, 8, '#'); H(g, 10, 3, 8, '#'); V(g, 3, 4, 10, '#'); V(g, 8, 4, 10, '#');
  const gm = gateMat(bi), gw = gateW(bi);
  const side = n % 4;
  if (side === 0) for (let c = 4; c < 4 + gw; c++) g[10][c] = gm;
  if (side === 1) for (let r = 6; r < 6 + gw; r++) g[r][3] = gm;
  if (side === 2) for (let r = 6; r < 6 + gw; r++) g[r][8] = gm;
  if (side === 3) for (let c = 5; c < 5 + gw; c++) g[4][c] = gm;
  g[7][6] = 'A'; g[5][5] = 'G';
  if (bi >= 1) { g[12][2] = '#'; g[12][9] = '#'; }
  if (bi >= 3) { H(g, 13, 4, 7, 'C'); }
  return done(g);
}
// B: колодец с верхним жерлом
function archWell(n, bi) {
  const g = G();
  V(g, 3, 3, 12, '#'); V(g, 8, 3, 12, '#');
  H(g, 3, 3, 8, '#'); H(g, 12, 3, 8, '#');
  const mw = gateW(bi), mx = n % 2 ? 5 : 4;
  for (let c = mx; c < mx + mw; c++) g[3][c] = '.';
  g[10][n % 2 ? 6 : 5] = 'A';
  g[5][4] = 'G'; g[5][7] = 'G';
  V(g, 1, 6, 12, bi < 3 ? 'C' : '#'); V(g, 10, 6, 12, bi < 3 ? 'C' : '#');
  if (bi >= 3) { g[7][4] = 'S'; g[7][7] = 'S'; }
  return done(g);
}
// C: два сейфа, прострел через общую стену
function archSafes(n, bi) {
  const g = G();
  H(g, 4, 1, 4, '#'); H(g, 10, 1, 4, '#'); V(g, 1, 4, 10, '#'); V(g, 4, 4, 10, '#');
  H(g, 4, 7, 10, '#'); H(g, 10, 7, 10, '#'); V(g, 7, 4, 10, '#'); V(g, 10, 4, 10, '#');
  V(g, 5, 4, 10, 'S'); V(g, 6, 4, 10, 'S');
  const pr = 6 + (n % 3);
  for (let c = 4; c <= 7; c++) g[pr][c] = '.';
  for (let c = 2; c < 4; c++) g[10][c] = 'C';
  g[pr][8] = 'A'; g[6][2] = 'G';
  if (bi >= 2) { g[12][5] = '#'; g[12][6] = '#'; }
  return done(g);
}
// D: слалом из стальных baffles
function archSlalom(n, bi) {
  const g = G();
  const w = gateW(bi);
  const put = (r, side) => { const c0 = side === 'L' ? 0 : (12 - w); for (let i = 0; i < w; i++) g[r][c0 + i] = '.'; };
  H(g, 10, 0, 11, '#'); put(10, n % 2 ? 'R' : 'L');
  H(g, 7, 0, 11, '#');  put(7, n % 2 ? 'L' : 'R');
  H(g, 4, 0, 11, '#');  put(4, n % 2 ? 'R' : 'L');
  V(g, 5, 8, 9, '#');
  V(g, 6, 5, 6, '#');
  g[2][5] = 'A';
  g[8][n % 2 ? 9 : 2] = 'G';
  if (bi >= 1) { g[5][3] = 'S'; g[9][8] = 'S'; }
  if (bi >= 3) { g[6][2] = 'S'; g[6][9] = 'S'; }
  return done(g);
}
// E: колокол с пробкой
function archBell(n, bi) {
  const g = G();
  H(g, 4, 3, 8, '#'); V(g, 3, 4, 8, '#'); V(g, 8, 4, 8, '#');
  H(g, 8, 3, 4, '#'); H(g, 8, 7, 8, '#');
  g[6][5] = 'A'; g[5][6] = 'G';
  H(g, 11, 5, 6, '#'); H(g, 12, 5, 6, '#');
  const es = n % 2 ? 7 : 2;
  H(g, 14, 2, 9, 'C'); for (let c = es; c < es + 2; c++) g[14][c] = '.';
  if (bi >= 3) { g[10][4] = '#'; g[10][7] = '#'; }
  return done(g);
}
// F: коридор в дальнюю камеру
function archCorridor(n, bi) {
  const g = G();
  H(g, 2, 2, 9, '#'); V(g, 2, 3, 4, '#'); V(g, 9, 3, 4, '#');
  H(g, 4, 2, 9, '#'); g[4][5] = '.'; g[4][6] = '.';
  V(g, 4, 5, 12, '#'); V(g, 7, 5, 12, '#');
  H(g, 12, 4, 7, '#'); g[12][n % 2 ? 5 : 6] = gateMat(bi);
  g[3][n % 2 ? 2 : 9] = 'A';
  g[3][n % 2 ? 9 : 2] = 'G';
  if (bi >= 2) { g[6][3] = '#'; g[6][8] = '#'; }
  return done(g);
}

const ARCHS = [archVault, archWell, archSafes, archSlalom, archBell, archCorridor];
const NAMES = ['Сейф', 'Колодец', 'Два сейфа', 'Слалом', 'Колокол', 'Коридор'];

export const CUSTOM = {};
for (let n = 1; n <= 88; n++) {
  const li = (n - 1) % 11;
  if (li === 10) continue;
  const bi = Math.min(Math.floor((n - 1) / 11), 7);
  const i = (li + bi) % 6;
  CUSTOM[n] = { name: NAMES[i] + ' ', boss: false, grid: ARCHS[i](n, bi) };
}
