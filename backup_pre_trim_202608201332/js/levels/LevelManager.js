import { CONFIG } from '../config.js?v=202608201646';
import { Brick, biomeColor } from '../entities/Brick.js?v=202608201646';
import { LEVELS } from './Layouts88.js?v=202608201646';
const COLS = 12; const ROWS = 18; const PER_BIOME = 11;
export const BIOMES = [
{ name: 'Пески' }, { name: 'Оазис' }, { name: 'Евфрат' }, { name: 'Степь' },
{ name: 'Загрос' }, { name: 'Солёные равнины' }, { name: 'Ночная пустыня' }, { name: 'Кур' },
];
export class LevelManager {
constructor() { this.level = 1; this.aliveCount = 0; this.totalCount = 0;
this.layoutV2 = true; this.artifactCell = null; this.levelTitle = ''; }
loadLevel(n) {
this.level = n;
const biome = Math.min(Math.floor((n - 1) / PER_BIOME), BIOMES.length - 1);
const L = LEVELS[(n - 1) % LEVELS.length] || LEVELS[0];
const g = L.grid; this.levelTitle = L.name;
const step = CONFIG.BRICK.WIDTH + 4;
const offX = (CONFIG.WIDTH - COLS * step + 4) / 2; const offY = 60;
const bricks = []; this.artifactCell = null;
for (let r = 0; r < ROWS; r++) for (let x = 0; x < COLS; x++) {
const ch = (g[r] && g[r][x]) || '.';
if (ch === '.' || ch === '#') { if (ch === '#') { const b = new Brick(offX + x*step, offY + r*(CONFIG.BRICK.HEIGHT+4), null, r, x); b.setType('steel'); bricks.push(b); } continue; }
if (ch === 'A') { this.artifactCell = { r, c: x, x: offX + x*step + CONFIG.BRICK.WIDTH/2, y: offY + r*(CONFIG.BRICK.HEIGHT+4) + CONFIG.BRICK.HEIGHT/2 }; continue; }
const b = new Brick(offX + x*step, offY + r*(CONFIG.BRICK.HEIGHT+4), null, r, x);
if (ch >= 'a' && ch <= 'd') b.color = biomeColor(biome, ch.charCodeAt(0)-97);
else switch (ch) { case 'C': b.setType('clay'); break; case 'S': b.setType('silver'); break; case 'G': b.setType('gold'); break; case 'T': b.setType('steel'); break; case 'E': b.setType('explosive'); break; case 'F': b.setType('fire'); break; case 'R': b.setType('regen'); break; case 'M': b.setType('moving'); break; }
bricks.push(b);
}
if (this.artifactCell) { const { r: ar, c: ac } = this.artifactCell;
for (const b of bricks) if (Math.max(Math.abs(b.row-ar), Math.abs(b.col-ac)) <= 3) b.isVault = true; }
this.bricks = bricks;
this.aliveCount = bricks.filter(b => b.alive && !b.isSteel).length;
this.totalCount = this.aliveCount;
return bricks;
}
brickDestroyed() { this.aliveCount--; }
isLevelComplete() { return this.aliveCount <= 0; }
nextLevel() { return this.level < PER_BIOME * BIOMES.length ? this.level + 1 : null; }
getBallSpeed(n) { return Math.min(8 + (n-1)*0.12, 13); }
getLevelName(n) { const biome = Math.min(Math.floor((n-1)/PER_BIOME), BIOMES.length-1);
const li = ((n-1)%PER_BIOME)+1; const L = LEVELS[(n-1)%LEVELS.length];
return BIOMES[biome].name + ' ' + li + '/11 — ' + (L ? L.name : ''); }
}
