import { CONFIG } from '../config.js?v=202608210038';
import { Brick, biomeColor } from '../entities/Brick.js?v=202608210038';
import { LEVELS } from './Layouts88.js?v=202608210038';
import { V2LEVELS } from '../levels_v2/v2levels.js?v=202608210038';
import { Wall } from '../entities/Wall.js?v=202608210038';
import { V2, initV2Loader } from './LevelLoaderV2.js?v=202608210038';
const COLS = 12; const ROWS = 18;
export const BIOMES = [ { name: 'Пески' } ];
export class LevelManager {
  constructor() { initV2Loader(); this.level = 1; this.aliveCount = 0; this.totalCount = 0;
    this.layoutV2 = true; this.artifactCell = null; this.levelTitle = ''; this.current = null; }
  loadLevel(n) {
    this.level = n;
    const L = (n <= LEVELS.length) ? (V2LEVELS[n-1] || LEVELS[n-1]) : { name: 'Раскопка ' + (n - LEVELS.length) + ' ', boss: false, grid: this.proc(n) };
    this.current = L; this.levelTitle = L.name;
    const step = CONFIG.BRICK.WIDTH + 4;
    const offX = (CONFIG.WIDTH - COLS * step + 4) / 2; const offY = 60;
    const bricks = []; this.walls = [];
    for (let r = 0; r < ROWS; r++) for (let x = 0; x < COLS; x++) {
      const ch = (L.grid[r] && L.grid[r][x]) || '.';
      if (ch === '.') continue;
      if (ch === 'A') { this.artifactCell = { r, c: x, x: offX + x*step + CONFIG.BRICK.WIDTH/2, y: offY + r*(CONFIG.BRICK.HEIGHT+4) + CONFIG.BRICK.HEIGHT/2 }; continue; }
      const b = new Brick(offX + x*step, offY + r*(CONFIG.BRICK.HEIGHT+4), null, r, x);
      if (ch >= 'a' && ch <= 'd') b.color = biomeColor(0, ch.charCodeAt(0)-97);
      else switch (ch) {
        case 'C': b.setType('clay'); break;
        case 'S': b.setType('silver'); break;
        case 'G': b.setType('gold'); break;
        case '#': case 'T': b.setType('steel'); this.walls.push(new Wall(offX + x*step, offY + r*(CONFIG.BRICK.HEIGHT+4), CONFIG.BRICK.WIDTH, CONFIG.BRICK.HEIGHT));
        case 'E': b.setType('explosive'); break;
        case 'F': b.setType('fire'); break;
        case 'R': b.setType('regen'); break;
        case 'M': b.setType('moving'); break;
        case 'W': b.setType('gate'); break;
        case 'X': b.setType('switch'); break;
        case 'B': b.setType('bumper'); break;
        case 'P': b.setType('teleport'); b.teleportPair = 'Q'; break;
        case 'Q': b.setType('teleport'); b.teleportPair = 'P'; break;
        case '^': b.setType('oneway'); b.oneWayDir = 'up'; break;
        case 'v': b.setType('oneway'); b.oneWayDir = 'down'; break;
        case '<': b.setType('oneway'); b.oneWayDir = 'left'; break;
        case '>': b.setType('oneway'); b.oneWayDir = 'right'; break;
        case 't': b.setType('timed'); break;
        default: b.setType('clay');
      }
      bricks.push(b);
    }
    // Связать переключатели с воротами (один раз)
    const switches = bricks.filter(b => b.type === 'switch');
    const gates = bricks.filter(b => b.type === 'gate');
    switches.forEach((sw, i) => { sw.switchId = i; });
    gates.forEach(g => { g.gateSwitchId = 0; });
    if (this.artifactCell) { const { r: ar, c: ac } = this.artifactCell;
      for (const b of bricks) if (Math.max(Math.abs(b.row-ar), Math.abs(b.col-ac)) <= 3) b.isVault = true; }
    this.bricks = bricks;
    this.aliveCount = bricks.filter(b => b.alive && !b.isSteel).length;
    this.totalCount = this.aliveCount;
    return bricks;
  }
  proc(n) {
    const d = n - LEVELS.length;
    let s = (n * 2654435761) >>> 0;
    const rnd = () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
    const g = []; for (let r = 0; r < ROWS; r++) g.push(Array(COLS).fill('.'));
    const set = (r, c, ch) => { if (r >= 0 && r < ROWS && c >= 0 && c < COLS) g[r][c] = ch; };
    const cx = 3 + Math.floor(rnd() * 3);
    const ty = 3 + Math.floor(rnd() * 4);
    for (let c = cx; c < cx + 6; c++) { set(ty, c, '#'); set(ty + 4, c, '#'); }
    for (let r = ty; r <= ty + 4; r++) { set(r, cx, '#'); set(r, cx + 5, '#'); }
    set(ty + 2, cx + 2, 'A'); set(ty + 2, cx + 3, 'G');
    const side = Math.floor(rnd() * 4);
    if (side === 0) { set(ty, cx + 2, 'C'); set(ty, cx + 3, 'C'); }
    if (side === 1) { set(ty + 4, cx + 2, 'C'); set(ty + 4, cx + 3, 'C'); }
    if (side === 2) { set(ty + 2, cx, 'C'); set(ty + 3, cx, 'C'); }
    if (side === 3) { set(ty + 2, cx + 5, 'C'); set(ty + 3, cx + 5, 'C'); }
    const rows = [ty - 2, ty + 6, ty + 8];
    for (const rr of rows) if (rr > 0 && rr < 15) for (let c = 1; c < 11; c++) if (rnd() < 0.8) set(rr, c, rnd() < 0.7 ? 'a' : 'C');
    const traps = Math.min(2 + d, 8);
    for (let i = 0; i < traps; i++) {
      const rr = 1 + Math.floor(rnd() * 14), cc = 1 + Math.floor(rnd() * 10);
      if (g[rr][cc] === '.') set(rr, cc, rnd() < 0.5 ? 'E' : (rnd() < 0.5 ? 'F' : 'R'));
    }
    return g;
  }
  isBoss(n) { const L = LEVELS[n - 1]; return !!(L && L.boss); }
  brickDestroyed() { this.aliveCount--; }
  isLevelComplete() { return this.aliveCount <= 0; }
  nextLevel() { return this.level + 1; }
  getBallSpeed(n) { var base = 7, max = 13, boss = 12; var k = Math.min(n, boss); return base + (k - 1) * (max - base) / (boss - 1); }
  getLevelName(n) { const L = (n <= LEVELS.length) ? (V2LEVELS[n-1] || LEVELS[n-1]) : null;
    return n <= LEVELS.length ? 'Пески ' + n + '/12 — ' + (L ? L.name : '') : '∞ Раскопка ' + (n - LEVELS.length); }
}
