import { CONFIG } from '../config.js';
import { Brick } from '../entities/Brick.js';

const ROWS = 10, COLS = 12;

function mulberry32(seed) {
  return function() {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function emptyGrid() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
}

const CODES = {
  '0': 0, '1': 1, '2': 2, '3': 3,
  'S': 'steel', 'X': 'explosive', 'F': 'fire', 'R': 'regen',
  'M': 'moving', 'G': 'gold', 'V': 'silver', 'C': 'clay',
};

const TYPE_CODES = { explosive: 'X', fire: 'F', regen: 'R', moving: 'M', gold: 'G', silver: 'V', steel: 'S', clay: 'C' };

const BIOMES = [
  { name: 'Пески', style: 'rows', spec: { clay: 0.2, explosive: 0.04, gold: 0.03 },
    palette: [['#d9a441','#f0c96a'],['#c9853f','#e0a35c'],['#c96f4a','#e08d63'],['#a84a32','#c4654a'],['#8a5a3b','#a87550'],['#b98a4a','#d4a96a'],['#a3703a','#c08d52']] },
  { name: 'Оазис', style: 'wave', spec: { clay: 0.1, regen: 0.12, gold: 0.03 },
    palette: [['#2a8c7e','#45ab9c'],['#40b3a2','#63d1c0'],['#5fc48f','#82dba8'],['#7ecb6f','#a0dc8f'],['#3d9c8b','#5cbcab'],['#2f7d6d','#4a9c8a'],['#57b89a','#7ad1b5']] },
  { name: 'Река', style: 'flow', spec: { moving: 0.18, clay: 0.1 },
    palette: [['#2a6f8c','#4592b0'],['#3189ad','#54a8c9'],['#3ba3c9','#63c2e0'],['#2a8c7e','#45ab9c'],['#4179a8','#639ac9'],['#28536b','#3f7b99'],['#35708c','#5493b3']] },
  { name: 'Степь', style: 'checker', spec: { fire: 0.12, clay: 0.15 },
    palette: [['#9aa04a','#bcc26a'],['#b3a83f','#d1c75f'],['#8a9a3a','#a8bc55'],['#c9b83f','#e0d35f'],['#7d8c32','#99ac4a'],['#a89a4a','#c4b76a'],['#6b7a2d','#88994a']] },
  { name: 'Горы', style: 'peaks', spec: { silver: 0.18, steel: 0.04, clay: 0.1 },
    palette: [['#6b7280','#9ca3af'],['#7d6b5a','#9c8a75'],['#57606b','#7b8494'],['#8c7a63','#ab977d'],['#4a5560','#6b7885'],['#756350','#94806a'],['#5f6a75','#828d99']] },
  { name: 'Ночная пустыня', style: 'stars', spec: { explosive: 0.08, gold: 0.06 },
    palette: [['#1f3a5f','#3a5a85'],['#27476b','#42688f'],['#2e5378','#4a76a0'],['#d9a441','#f0c96a'],['#1a2f4a','#33507a'],['#35608c','#5283b3'],['#24405f','#3f628c']] },
  { name: 'Солёные равнины', style: 'diamond', spec: { silver: 0.12, moving: 0.08 },
    palette: [['#c9b8c9','#e0d3e0'],['#b8a8b8','#d1c4d1'],['#d9ccd9','#efe6ef'],['#a899a8','#c4b8c4'],['#e0d3e0','#f5eef5'],['#bfb0bf','#d9ccd9'],['#998a99','#b8aab8']] },
  { name: 'Руины Ура', style: 'mix', spec: { explosive: 0.06, regen: 0.06, moving: 0.06, silver: 0.1, gold: 0.04, clay: 0.1 },
    palette: [['#a84a32','#c4654a'],['#8c3a28','#ab5742'],['#c96f4a','#e08d63'],['#75301f','#944a38'],['#b85a3f','#d17a5c'],['#63281a','#82422f'],['#9c4430','#bb6249']] },
];

// Фирменные первые уровни биомов (картинки)
const SIGNATURES = [
  ['000000000GG0','000000000GG0','000001100000','000011110000','000111111000','001111111100','011111111110','111111111111','000000000000','000000000000'],
  ['011000000110','111100001111','111110011111','011111111110','001111111100','000011110000','000011110000','000011110000','000011110000','000111111000'],
  ['111001110011','111001110011','001110011100','001110011100','110011100111','110011100111','001110011100','001110011100','111001110011','111001110011'],
  ['110011001100','110011001100','001100110011','001100110011','110011001100','110011001100','001100110011','001100110011','110011001100','110011001100'],
  ['000110001100','001111011110','011111111111','111111111111','111111111111','111111111111','000000000000','000000000000','000000000000','000000000000'],
  ['000111110000','001111111000','011111000000','01111000G000','0111100GGG00','01111000G000','011110000000','011111000000','001111111000','000111110000'],
  ['000001100000','000011110000','000111111000','001111111100','011111111110','111111111111','011111111110','001111111100','000111111000','000011110000'],
  ['111111111111','110000000011','110000000011','110011110011','110011110011','110000000011','110000000011','110000000011','110000000011','111111111111'],
];

const GENERATORS = {
  rows(rng, d) {
    const g = emptyGrid();
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS / 2; c++)
        if (rng() < 0.5 + d * 0.45) { g[r][c] = 1; g[r][COLS - 1 - c] = 1; }
    return g;
  },
  checker(rng, d) {
    const g = emptyGrid();
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++)
        if ((r + c) % 2 === 0 || rng() < d * 0.5) g[r][c] = 1;
    return g;
  },
  wave(rng, d) {
    const g = emptyGrid();
    for (let c = 0; c < COLS; c++) {
      const center = 4.5 + Math.sin(c * 0.7) * 2.5;
      for (let r = 0; r < ROWS; r++)
        if (Math.abs(r - center) < 1.2 + d * 1.8) g[r][c] = 1;
    }
    return g;
  },
  peaks(rng, d) {
    const g = emptyGrid();
    for (let c = 0; c < COLS; c++) {
      const h = Math.floor((1 - Math.abs(c - 5.5) / 6.5) * ROWS * (0.5 + d * 0.5) + rng() * 2);
      for (let r = 0; r < Math.min(h, ROWS); r++) g[r][c] = 1;
    }
    return g;
  },
  diamond(rng, d) {
    const g = emptyGrid();
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++)
        if (Math.abs(r - 4.5) / 5.5 + Math.abs(c - 5.5) / 6.5 < 0.55 + d * 0.5) g[r][c] = 1;
    return g;
  },
  stars(rng, d) {
    const g = emptyGrid();
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS / 2; c++)
        if (rng() < 0.28 + d * 0.3) { g[r][c] = 1; g[r][COLS - 1 - c] = 1; }
    return g;
  },
  flow(rng, d) {
    const g = emptyGrid();
    for (let r = 0; r < ROWS; r += 2) {
      const off = Math.floor(Math.sin(r * 1.3) * 2 + 2);
      for (let c = 0; c < COLS; c++)
        if ((c + off) % 3 !== 0 || rng() < d * 0.4) g[r][c] = 1;
    }
    return g;
  },
  mix(rng, d) {
    const keys = Object.keys(GENERATORS).filter(k => k !== 'mix');
    const a = GENERATORS[keys[Math.floor(rng() * keys.length)]](rng, d);
    const b = GENERATORS[keys[Math.floor(rng() * keys.length)]](rng, d);
    const g = emptyGrid();
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++)
        g[r][c] = (a[r][c] || b[r][c]) ? 1 : 0;
    return g;
  },
};

export class LevelManager {
  constructor() {
    this.currentLevel = 1;
    this.maxLevel = 88;
    this.bricks = [];
    this.aliveCount = 0;
  }
  
  getBiome(level) {
    return BIOMES[Math.min(Math.floor((level - 1) / 11), BIOMES.length - 1)];
  }
  
  decode(rows) {
    return rows.map(rowStr => rowStr.split('').map(ch => CODES[ch] ?? 0));
  }
  
  loadLevel(levelNumber) {
    this.currentLevel = levelNumber;
    this.bricks = [];
    this.aliveCount = 0;
    
    const biomeIndex = Math.min(Math.floor((levelNumber - 1) / 11), BIOMES.length - 1);
    const biome = BIOMES[biomeIndex];
    const inner = (levelNumber - 1) % 11;
    const d = (levelNumber - 1) / (this.maxLevel - 1);
    const rng = mulberry32(levelNumber * 1337 + 7);
    
    // Первый уровень биома = фирменная картинка
    let grid = inner === 0
      ? this.decode(SIGNATURES[biomeIndex])
      : GENERATORS[biome.style](rng, Math.min(0.5 + inner * 0.045 + d * 0.3, 1));
    
    let count = 0;
    for (const row of grid) for (const v of row) count += v;
    if (count < 35) grid = GENERATORS.rows(rng, 0.95);
    
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (!grid[r][c]) continue;
        const p = biome.palette[r % biome.palette.length];
        const brick = new Brick(this.getBrickX(c), this.getBrickY(r), { base: p[0], glow: p[1] }, r, c);
        
        const roll = rng();
        let acc = 0;
        for (const key of Object.keys(biome.spec)) {
          acc += biome.spec[key];
          if (roll < acc) { brick.setType(TYPE_CODES[key]); break; }
        }
        
        this.bricks.push(brick);
        if (!brick.isSteel) this.aliveCount++;
      }
    }
    return this.bricks;
  }
  
  getBrickX(col) {
    const totalWidth = CONFIG.BRICK.COLS * (CONFIG.BRICK.WIDTH + CONFIG.BRICK.GAP) - CONFIG.BRICK.GAP;
    const leftOffset = (CONFIG.WIDTH - totalWidth) / 2;
    return leftOffset + col * (CONFIG.BRICK.WIDTH + CONFIG.BRICK.GAP);
  }
  
  getBrickY(row) {
    return CONFIG.BRICK.TOP_OFFSET + row * (CONFIG.BRICK.HEIGHT + CONFIG.BRICK.GAP);
  }
  
  brickDestroyed() { this.aliveCount--; }
  isLevelComplete() { return this.aliveCount <= 0; }
  nextLevel() { return this.currentLevel < this.maxLevel ? this.currentLevel + 1 : null; }
  
  getLevelName(level) {
    return this.getBiome(level).name + ' · ' + (((level - 1) % 11) + 1) + '/11';
  }
  
  getBallSpeed(level) {
    return CONFIG.BALL.INITIAL_SPEED * (1 + Math.min(level - 1, 66) * 0.004);
  }
}

