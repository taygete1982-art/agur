import { CONFIG } from '../config.js?v=2';
import { Brick, biomeColor } from '../entities/Brick.js?v=2';

const COLS = 12;
const ROWS = 18;
const PER_BIOME = 11;

export const BIOMES = [
  { name: 'Пески', flavor: '' },
  { name: 'Оазис', flavor: 'R' },
  { name: 'Евфрат', flavor: 'M' },
  { name: 'Степь', flavor: 'M' },
  { name: 'Загрос', flavor: 'T' },
  { name: 'Солёные равнины', flavor: 'C' },
  { name: 'Ночная пустыня', flavor: 'G' },
  { name: 'Кур', flavor: 'R' },
];

function rng(seed) { let s = seed; return () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }; }
function grid() { return Array.from({ length: ROWS }, () => new Array(COLS).fill('0')); }

// ===== 1. Силуэты (анатомия: цвет = роль детали) =====
function ziggurat(g, d) {
  const mats = ['G', 'a', 'b', 'c', 'd'];
  let row = 0;
  for (let s = 0; s < 5; s++) {
    const w = 4 + s * 2;
    const h = s < 4 ? 2 + (d > 0.5 ? 1 : 0) : 4;
    const x0 = Math.floor((COLS - w) / 2);
    for (let r = 0; r < h && row < ROWS; r++, row++)
      for (let x = x0; x < x0 + w; x++) g[row][x] = mats[s];
  }
}
function palm(g) {
  for (let r = 5; r < 16; r++) { g[r][5] = 'c'; g[r][6] = 'c'; }
  for (let x = 1; x < 11; x++) { g[4][x] = 'R'; if (x % 2) g[3][x] = 'R'; }
  g[2][5] = 'G'; g[2][6] = 'G';
}
function boat(g) {
  for (let r = 11; r < 15; r++) { const ins = r - 11; for (let x = 1 + ins; x < 11 - ins; x++) g[r][x] = 'c'; }
  for (let r = 4; r < 11; r++) { g[r][5] = 'b'; g[r][6] = 'b'; }
  for (let r = 5; r < 10; r++) for (let x = 7; x < Math.min(7 + (r - 4), 11); x++) g[r][x] = 'a';
}
function star(g, seed) {
  const rnd = rng(seed);
  for (let i = 0; i < 16; i++) {
    const x = 1 + Math.floor(rnd() * 5);
    const y = 1 + Math.floor(rnd() * 15);
    g[y][x] = 'G'; g[y][COLS - 1 - x] = 'G';
  }
}

// ===== 2. Резная табличка (однотонная плита) =====
const SIGNS = [
  ['010110','111111','010110','010110','111111','010110','010110'],
  ['111111','110110','110110','111111','110110','110110','111111'],
  ['011110','110110','110110','011110','011011','011011','011011'],
];
function tablet(g, d, seed) {
  const slots = ['a', 'b', 'c', 'd'];
  for (let r = 1; r < 16; r++) for (let x = 0; x < COLS; x++)
    g[r][x] = d > 0.5 && r % 4 === 0 ? 'C' : slots[Math.floor(r / 2) % 4];
  const sign = SIGNS[seed % SIGNS.length];
  for (let r = 0; r < sign.length; r++) for (let x = 0; x < 6; x++)
    if (sign[r][x] === '1') g[5 + r][3 + x] = '0';
}

// ===== 3. Сокровищница (твёрдость: базальт > лазурит > золото) =====
function vault(g, d) {
  const gap = Math.max(2, 4 - Math.floor(d * 2));
  for (let r = 2; r < 14; r++) for (let x = 1; x < 11; x++) {
    const edge = r === 2 || r === 13 || x === 1 || x === 10;
    if (edge) {
      const topGap = r === 2 && x >= 6 - gap / 2 && x < 6 + gap / 2;
      g[r][x] = topGap ? '0' : 'T';
    } else {
      const core = r >= 7 && r <= 8 && x >= 5 && x <= 6;
      const ring = r >= 5 && r <= 10 && x >= 3 && x <= 8;
      g[r][x] = core ? 'G' : ring ? 'S' : 'a';
    }
  }
}

// ===== 4. Живой храм =====
function temple(g, d) {
  for (let r = 2; r < 15; r++) {
    const gate = (r - 2) % 3 === 0;
    for (let x = 0; x < COLS; x++) {
      if (gate) {
        g[r][x] = 'M';
        const gx = 2 + (r % 5);
        if (x >= gx && x < gx + 2 + Math.floor(d * 2)) g[r][x] = '0';
      } else if ((r * 7 + x * 3) % 6 === 0) g[r][x] = 'a';
    }
  }
  for (let x = 2; x < 10; x++) g[16][x] = 'G';
}

// ===== 5. Луковица (твёрдость кольцами: снаружи слабо, внутри награда) =====
function onion(g, d) {
  const rings = ['S', 'C', 'a'];
  for (let r = 1; r < 16; r++) for (let x = 0; x < COLS; x++) {
    const dist = Math.max(Math.abs(x - 5.5) / 6, Math.abs(r - 8) / 7.5);
    if (dist > 1) continue;
    g[r][x] = dist < 0.22 ? 'G' : rings[Math.min(2, Math.floor((dist - 0.22) / 0.78 * (3 + (d > 0.5 ? 1 : 0))))];
  }
}

function monument(g) {
  onion(g, 1);
  for (let r = 1; r < 16; r++) { g[r][0] = 'T'; g[r][COLS - 1] = 'T'; }
}

function throne(g) {
  for (let x = 1; x < 11; x++) {
    g[1][x] = 'a';
    g[2][x] = (x % 4 === 0) ? 'S' : 'a';
  }
  for (let x = 0; x < COLS; x++) if (x % 2 === 0) g[5][x] = 'a';
}

function flavor(g, biome, seed) {
  const f = BIOMES[biome].flavor;
  if (!f) return;
  const rnd = rng(seed + 7);
  for (let r = 0; r < ROWS; r++) for (let x = 0; x < COLS; x++) {
    const ch = g[r][x];
    if ((ch === '1' || (ch >= 'a' && ch <= 'd')) && rnd() < 0.12) g[r][x] = f;
  }
}

function buildLevel(n) {
  const biome = Math.floor((n - 1) / PER_BIOME);
  const li = (n - 1) % PER_BIOME;
  const d = li / 10;
  const g = grid();
  if (li === 0) ziggurat(g, d);
  else if (li === 1) { const k = biome % 3; if (k === 0) boat(g); else if (k === 1) palm(g); else star(g, n); }
  else if (li <= 3) tablet(g, d, n);
  else if (li <= 5) vault(g, d);
  else if (li <= 7) temple(g, d);
  else if (li <= 9) onion(g, d);
  else throne(g);
  flavor(g, biome, n);
  return g;
}

export class LevelManager {
  constructor() { this.level = 1; this.aliveCount = 0; this.totalCount = 0; }

  loadLevel(n) {
    this.level = n;
    const biome = Math.floor((n - 1) / PER_BIOME);
    const g = buildLevel(n);
    const step = CONFIG.BRICK.WIDTH + 4;
    const offX = (CONFIG.WIDTH - COLS * step + 4) / 2;
    const offY = 60;
    const bricks = [];
    for (let r = 0; r < ROWS; r++) for (let x = 0; x < COLS; x++) {
      const ch = g[r][x];
      if (ch === '0') continue;
      const b = new Brick(offX + x * step, offY + r * (CONFIG.BRICK.HEIGHT + 4), null, r, x);
      if (ch >= 'a' && ch <= 'd') {
        b.color = biomeColor(biome, ch.charCodeAt(0) - 97);
      } else {
        switch (ch) {
          case 'C': b.setType('clay'); break;
          case 'S': b.setType('silver'); break;
          case 'G': b.setType('gold'); break;
          case 'T': b.setType('steel'); break;
          case 'E': b.setType('explosive'); break;
          case 'F': b.setType('fire'); break;
          case 'R': b.setType('regen'); break;
          case 'M': b.setType('moving'); break;
        }
      }
      bricks.push(b);
    }
    this.bricks = bricks;
    this.aliveCount = bricks.filter(b => b.alive && !b.isSteel).length;
    this.totalCount = this.aliveCount;
    return bricks;
  }

  brickDestroyed() { this.aliveCount--; }
  isLevelComplete() { return this.aliveCount <= 0; }
  nextLevel() { return this.level < PER_BIOME * BIOMES.length ? this.level + 1 : null; }
  getBallSpeed(n) { return Math.min(8 + (n - 1) * 0.12, 13); }

  getLevelName(n) {
    const biome = Math.floor((n - 1) / PER_BIOME);
    const li = ((n - 1) % PER_BIOME) + 1;
    return BIOMES[biome].name + ' — ' + li + '/11';
  }
}




