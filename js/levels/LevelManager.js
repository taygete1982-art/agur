import { CONFIG } from '../config.js?v=202608210133';
import { Brick, biomeColor } from '../entities/Brick.js?v=202608210133';
import { LEVELS } from './levels.js?v=202608210133';
import { Wall } from '../entities/Wall.js?v=202608210133';

const COLS = 12; const ROWS = 18;

export class LevelManager {
  constructor() {
    this.level = 1; this.aliveCount = 0; this.totalCount = 0;
    this.layoutV2 = true; this.artifactCell = null; this.levelTitle = ''; this.current = null;
    this.bricks = []; this.walls = [];
  }
  loadLevel(n) {
    this.level = n;
    const L = LEVELS[Math.min(n, LEVELS.length) - 1];
    this.current = L; this.levelTitle = L.name; this.artifactCell = null;
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
        case '#': case 'T': b.setType('steel'); this.walls.push(new Wall(offX + x*step, offY + r*(CONFIG.BRICK.HEIGHT+4), CONFIG.BRICK.WIDTH, CONFIG.BRICK.HEIGHT)); break;
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
    const switches = bricks.filter(b => b.type === 'switch');
    const gates = bricks.filter(b => b.type === 'gate');
    switches.forEach((sw, i) => { sw.switchId = i; });
    gates.forEach(g => { g.gateSwitchId = 0; });
    if (this.artifactCell) { const { r: ar, c: ac } = this.artifactCell;
      for (const b of bricks) if (Math.max(Math.abs(b.row-ar), Math.abs(b.col-ac)) <= 3) b.isVault = true; }
    this.bricks = bricks;
    this.aliveCount = bricks.filter(b => b.alive && !b.isSteel && b.hp !== Infinity).length;
    this.totalCount = this.aliveCount;
    try { const vb = document.getElementById('verbadge'); if (vb) vb.textContent += ' | B:' + bricks.filter(b => b.type === 'bumper').length + ' T:' + bricks.length; } catch (e) {}
    return bricks;
  }
  isBoss(n) { const L = LEVELS[n - 1]; return !!(L && L.boss); }
  brickDestroyed() { this.aliveCount--; }
  isLevelComplete() { return this.aliveCount <= 0; }
  nextLevel() { return this.level + 1; }
  getBallSpeed(n) { var base = 7, max = 13, boss = 12; var k = Math.min(n, boss); return base + (k - 1) * (max - base) / (boss - 1); }
  getLevelName(n) { const L = LEVELS[n - 1]; return 'Пески ' + n + '/12 — ' + (L ? L.name : ''); }
}
