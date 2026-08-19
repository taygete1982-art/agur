function rng(seed) { let t = seed >>> 0; return () => { t += 0x6D2B79F5; let r = Math.imul(t ^ t >>> 15, 1 | t); r ^= r + Math.imul(r ^ r >>> 7, 61 | r); return ((r ^ r >>> 14) >>> 0) / 4294967296; }; }

const PAL = [
  { brick: ['#b0764a', '#a06a42', '#c08454'], acc: '#e8b06a', bg: '#171008', sil: '#2a1c10', sun: 1 },
  { brick: ['#7fa06b', '#6a8a5c', '#8aa878'], acc: '#a8d8b0', bg: '#10150e', sil: '#1c2a1c', sun: 1 },
  { brick: ['#5f8f96', '#4f7f86', '#6f9fa6'], acc: '#7ec8d0', bg: '#0d1418', sil: '#16323a', sun: 1 },
  { brick: ['#a8905c', '#988050', '#b8a06c'], acc: '#d0b878', bg: '#171309', sil: '#2a2414', sun: 1 },
  { brick: ['#8a8a84', '#7a7a74', '#9a9a94'], acc: '#b8b8b0', bg: '#121212', sil: '#242422', sun: 1 },
  { brick: ['#cfc8b8', '#bfb8a8', '#dfd8c8'], acc: '#7ec8c0', bg: '#14161a', sil: '#2a2e34', sun: 1 },
  { brick: ['#4a4a5a', '#3a3a4a', '#5a5a6a'], acc: '#8ab0e0', bg: '#0a0a12', sil: '#1a1a2a', sun: 0 },
  { brick: ['#3a2a2a', '#2a1c1c', '#4a3434'], acc: '#e05038', bg: '#0d0708', sil: '#200f10', sun: 0 },
];

const brickCache = new Map();
const bgCache = new Map();

// ===== СИЛУЭТЫ =====
function ziggurat(g, cx, by, W, H, col) {
  g.fillStyle = col;
  for (let s = 0; s < 4; s++) {
    const sw = W * (1 - s * 0.22), sh = H / 4, y = by - (s + 1) * sh;
    g.beginPath();
    g.moveTo(cx - sw / 2, y + sh); g.lineTo(cx - sw / 2 + sw * 0.07, y);
    g.lineTo(cx + sw / 2 - sw * 0.07, y); g.lineTo(cx + sw / 2, y + sh);
    g.closePath(); g.fill();
  }
  const tw = W * 0.16;
  g.fillRect(cx - tw / 2, by - H - H * 0.2, tw, H * 0.2);
  g.fillStyle = 'rgba(0,0,0,0.3)';
  g.fillRect(cx - W * 0.03, by - H, W * 0.06, H);
}
function palm(g, x, by, s, col) {
  g.strokeStyle = col; g.lineWidth = 3 * s;
  g.beginPath(); g.moveTo(x, by); g.quadraticCurveTo(x + 4 * s, by - 20 * s, x + 2 * s, by - 38 * s); g.stroke();
  const tx = x + 2 * s, ty = by - 38 * s; g.lineWidth = 2 * s;
  for (let a = -2; a <= 2; a++) { g.beginPath(); g.moveTo(tx, ty); g.quadraticCurveTo(tx + a * 10 * s, ty - 10 * s, tx + a * 16 * s, ty + 2 * s); g.stroke(); }
}
function column(g, x, by, s, col) {
  g.fillStyle = col;
  g.fillRect(x - 4 * s, by - 30 * s, 8 * s, 30 * s);
  g.beginPath(); g.moveTo(x - 4 * s, by - 30 * s); g.lineTo(x - 2 * s, by - 36 * s); g.lineTo(x + s, by - 31 * s); g.lineTo(x + 4 * s, by - 34 * s); g.lineTo(x + 4 * s, by - 30 * s); g.closePath(); g.fill();
  g.fillRect(x - 6 * s, by - 3 * s, 12 * s, 3 * s);
}
function wall(g, x, by, w, h, col) {
  g.fillStyle = col;
  g.fillRect(x, by - h, w * 0.55, h);
  g.fillRect(x + w * 0.7, by - h * 0.6, w * 0.3, h * 0.6);
  for (let mx = x; mx < x + w * 0.55 - 6; mx += 12) g.fillRect(mx, by - h - 5, 7, 5);
}
function statue(g, x, by, s, col) {
  g.fillStyle = col;
  g.beginPath();
  g.moveTo(x - 8 * s, by); g.quadraticCurveTo(x - 8 * s, by - 16 * s, x - 3 * s, by - 18 * s);
  g.arc(x, by - 22 * s, 5 * s, Math.PI * 0.9, Math.PI * 2.1);
  g.quadraticCurveTo(x + 8 * s, by - 14 * s, x + 8 * s, by);
  g.closePath(); g.fill();
}
function reeds(g, x, by, s, col) {
  g.strokeStyle = col; g.lineWidth = 1.5 * s;
  for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(x + i * 3 * s, by); g.quadraticCurveTo(x + i * 5 * s, by - 14 * s, x + i * 7 * s, by - 22 * s); g.stroke(); }
}
function gate(g, cx, by, W, H, col) {
  g.fillStyle = col;
  g.fillRect(cx - W / 2, by - H, W * 0.22, H);
  g.fillRect(cx + W / 2 - W * 0.22, by - H, W * 0.22, H);
  g.fillRect(cx - W / 2, by - H, W, H * 0.18);
  g.fillRect(cx - W * 0.16, by - H * 0.55, W * 0.32, H * 0.55);
}

function makeBg(w, h, biome) {
  const pal = PAL[biome];
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d');
  const r = rng(biome * 131 + 7);
  g.fillStyle = pal.bg; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 500; i++) { g.fillStyle = r() > 0.5 ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.05)'; g.fillRect(r() * w, r() * h, 1 + r() * 2, 1); }
  g.strokeStyle = 'rgba(0,0,0,0.15)'; g.lineWidth = 1;
  for (let i = 0; i < 5; i++) { g.beginPath(); let x = r() * w, y = 0; g.moveTo(x, y); for (let s = 0; s < 6; s++) { x += (r() - 0.5) * 40; y += h / 6; g.lineTo(x, y); } g.stroke(); }

  const by = h * 0.66, sil = pal.sil;
  // дымка на горизонте
  g.fillStyle = sil; g.globalAlpha = 0.25; g.fillRect(0, by - 2, w, 3); g.globalAlpha = 1;

  if (biome === 0 || biome === 6) {
    g.globalAlpha = 0.5; ziggurat(g, w * 0.7, by, w * 0.5, h * 0.14, sil); g.globalAlpha = 1;
    g.globalAlpha = 0.85;
    wall(g, w * 0.02, by, w * 0.34, h * 0.05, sil);
    palm(g, w * 0.42, by, 1, sil);
    column(g, w * 0.52, by, 1, sil);
    statue(g, w * 0.88, by, 1, sil);
    g.globalAlpha = 1;
  } else if (biome === 1) {
    g.globalAlpha = 0.85;
    palm(g, w * 0.15, by, 1.2, sil); palm(g, w * 0.3, by, 0.9, sil); palm(g, w * 0.75, by, 1.1, sil);
    reeds(g, w * 0.55, by, 1, sil);
    g.globalAlpha = 0.3; g.fillStyle = pal.acc; g.fillRect(0, by, w, 8); g.globalAlpha = 1;
  } else if (biome === 2) {
    g.globalAlpha = 0.3; g.fillStyle = pal.acc; g.fillRect(0, by, w, 12); g.globalAlpha = 1;
    g.globalAlpha = 0.85;
    reeds(g, w * 0.1, by, 1.2, sil); reeds(g, w * 0.85, by, 1.2, sil);
    g.beginPath(); g.moveTo(w * 0.4, by); g.quadraticCurveTo(w * 0.5, by + 8, w * 0.62, by); g.lineTo(w * 0.58, by - 4); g.lineTo(w * 0.44, by - 4); g.closePath(); g.fill();
    g.fillRect(w * 0.5, by - 22, 2, 18);
    g.globalAlpha = 1;
  } else if (biome === 3) {
    g.globalAlpha = 0.6;
    g.beginPath(); g.arc(w * 0.2, by + 20, h * 0.08, Math.PI, 0); g.fill();
    g.beginPath(); g.arc(w * 0.8, by + 24, h * 0.1, Math.PI, 0); g.fill();
    g.globalAlpha = 0.85; wall(g, w * 0.4, by, w * 0.25, h * 0.03, sil); reeds(g, w * 0.1, by, 0.8, sil);
    g.globalAlpha = 1;
  } else if (biome === 4) {
    g.globalAlpha = 0.7;
    g.beginPath(); g.moveTo(0, by); g.lineTo(w * 0.25, by - h * 0.14); g.lineTo(w * 0.5, by); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(w * 0.4, by); g.lineTo(w * 0.7, by - h * 0.18); g.lineTo(w, by); g.closePath(); g.fill();
    g.globalAlpha = 0.85; column(g, w * 0.15, by, 1, sil);
    g.globalAlpha = 1;
  } else if (biome === 5) {
    g.globalAlpha = 0.4; g.fillStyle = pal.brick[0]; g.fillRect(0, by, w, h - by); g.globalAlpha = 1;
    g.globalAlpha = 0.85;
    for (let i = 0; i < 5; i++) { const x = r() * w; g.beginPath(); g.moveTo(x, by); g.lineTo(x + 5, by - 12 - r() * 8); g.lineTo(x + 10, by); g.closePath(); g.fill(); }
    g.globalAlpha = 1;
  } else if (biome === 7) {
    g.globalAlpha = 0.85; gate(g, w * 0.5, by, w * 0.4, h * 0.16, sil);
    g.globalAlpha = 0.25; g.fillStyle = pal.acc; g.fillRect(0, by - 2, w, 3); g.globalAlpha = 1;
  }

  if (pal.sun) { g.fillStyle = pal.acc; g.globalAlpha = 0.35; g.beginPath(); g.arc(w * 0.78, h * 0.1, 26, 0, 7); g.fill(); g.globalAlpha = 1; }
  else { g.fillStyle = pal.acc; g.globalAlpha = 0.4; g.beginPath(); g.arc(w * 0.24, h * 0.1, 18, 0, 7); g.fill(); g.globalAlpha = 1; }
  g.fillStyle = 'rgba(0,0,0,0.35)';
  g.fillRect(0, 0, w, 3); g.fillRect(0, h - 3, w, 3); g.fillRect(0, 0, 3, h); g.fillRect(w - 3, 0, 3, h);
  return c;
}

function makeBrick(w, h, pal, variant, mat) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d');
  const base = mat === 'gold' ? '#d8a848' : mat === 'steel' ? '#5a5a58' : mat === 'captive' ? '#6a9a70' : pal.brick[variant % 3];
  g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(0, h - 2, w, 2);
  g.fillStyle = base; g.fillRect(0, 0, w, h - 1);
  const r = rng(variant * 7 + w);
  g.fillStyle = 'rgba(0,0,0,0.12)';
  for (let i = 0; i < 6; i++) g.fillRect(2 + r() * (w - 6), 2 + r() * (h - 6), 2, 1);
  g.fillStyle = 'rgba(255,255,255,0.08)';
  for (let i = 0; i < 5; i++) g.fillRect(2 + r() * (w - 6), 2 + r() * (h - 6), 2, 1);
  g.fillStyle = mat === 'gold' ? 'rgba(255,240,200,0.5)' : 'rgba(255,255,255,0.18)';
  g.fillRect(0, 0, w, 1);
  g.fillStyle = 'rgba(0,0,0,0.22)'; g.fillRect(0, h - 3, w, 2);
  // ФОРМА: 4 силуэта
  g.globalCompositeOperation = 'destination-out';
  if (variant % 4 === 2) { g.beginPath(); g.moveTo(w - 6, 0); g.lineTo(w, 0); g.lineTo(w, 6); g.closePath(); g.fill(); }
  else if (variant % 4 === 3) { g.beginPath(); g.moveTo(0, 0); g.lineTo(6, 0); g.lineTo(0, 6); g.closePath(); g.fill(); }
  else if (variant % 4 === 1) { g.fillRect(w * 0.3, 0, 4, 2); g.fillRect(w * 0.65, 0, 3, 2); }
  g.globalCompositeOperation = 'source-over';
  if (variant % 2 === 1) { g.strokeStyle = 'rgba(0,0,0,0.3)'; g.lineWidth = 1; g.beginPath(); g.moveTo(w * 0.3, 0); g.lineTo(w * 0.4, h * 0.5); g.lineTo(w * 0.32, h); g.stroke(); }
  if (mat === 'gold') { g.fillStyle = 'rgba(255,255,255,0.7)'; g.fillRect(2, 1, Math.floor(w / 3), 1); }
  if (mat === 'steel') { g.fillStyle = 'rgba(255,255,255,0.15)'; g.fillRect(1, 1, w - 2, 1); }
  return c;
}

function wedge(g, x, y, s) { g.beginPath(); g.moveTo(x, y); g.lineTo(x + s, y + s * 0.4); g.lineTo(x, y + s * 0.8); g.closePath(); g.fill(); }

export function initVisual(game) {
  const bg = game.background;
  if (bg && typeof bg.draw === 'function') {
    bg.draw = function (ctx) {
      ctx = ctx || this.ctx;
      if (!ctx || !ctx.canvas) return;
      const w = ctx.canvas.width, h = ctx.canvas.height;
      const key = (game.biome || 0) + '_' + w + 'x' + h;
      let c = bgCache.get(key);
      if (!c) { c = makeBg(w, h, game.biome || 0); bgCache.set(key, c); }
      ctx.drawImage(c, 0, 0);
    };
  }

  const tryPatch = () => {
    if (!tryPatch.done && game.bricks && game.bricks.length) {
      const bp = Object.getPrototypeOf(game.bricks[0]);
      if (bp && bp.draw) {
        bp.draw = function (ctx) {
          ctx = (ctx && ctx.canvas) ? ctx : this.ctx;
          if (!ctx || !this.alive) return;
          if (this._v === undefined) this._v = Math.abs(Math.round(this.x * 7 + this.y * 13)) % 4;
          const mat = this.isSteel ? 'steel' : this.isGold ? 'gold' : this.isCaptive ? 'captive' : 'clay';
          const key = (game.biome || 0) + mat + this._v + this.width + 'x' + this.height;
          let s = brickCache.get(key);
          if (!s) { s = makeBrick(this.width, this.height, PAL[game.biome || 0], this._v, mat); brickCache.set(key, s); }
          ctx.drawImage(s, this.x, this.y);
          if (!this.isSteel && typeof this.hp === 'number') {
            if (this._hpMax === undefined) this._hpMax = this.hp;
            if (this.hp < this._hpMax) {
              const d = (this._hpMax - this.hp) / this._hpMax;
              const x = this.x, y = this.y, w = this.width, h = this.height;
              ctx.strokeStyle = 'rgba(20,10,5,' + (0.4 + 0.4 * d) + ')';
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.moveTo(x + w * 0.3, y);
              ctx.lineTo(x + w * 0.42, y + h * 0.5);
              ctx.lineTo(x + w * 0.28, y + h);
              if (d > 0.4) { ctx.moveTo(x + w * 0.72, y); ctx.lineTo(x + w * 0.6, y + h * 0.55); ctx.lineTo(x + w * 0.78, y + h); }
              ctx.stroke();
            }
          }
        };
      }
      tryPatch.done = true;
    }
    if (!tryPatch.pdone && game.paddle) {
      const pp = Object.getPrototypeOf(game.paddle);
      if (pp && pp.draw) {
        pp.draw = function (ctx) {
          ctx = (ctx && ctx.canvas) ? ctx : this.ctx;
          if (!ctx) return;
          const x = this.x, y = this.y, w = this.width, h = this.height;
          // перспективная плита
          ctx.fillStyle = '#6a4a2a';
          ctx.beginPath();
          ctx.moveTo(x + 3, y); ctx.lineTo(x + w - 3, y); ctx.lineTo(x + w, y + h); ctx.lineTo(x, y + h);
          ctx.closePath(); ctx.fill();
          ctx.fillStyle = '#8a6a3a'; ctx.fillRect(x + 3, y, w - 6, 2);
          ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(x, y + h - 2, w, 2);
          // износ
          ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(x + w * 0.2, y + 2, 6, 2); ctx.fillRect(x + w * 0.7, y + 3, 5, 2);
          ctx.fillStyle = '#d8a848';
          ctx.beginPath(); ctx.arc(x + 5, y + h / 2, 2, 0, 7); ctx.fill();
          ctx.beginPath(); ctx.arc(x + w - 5, y + h / 2, 2, 0, 7); ctx.fill();
          ctx.fillStyle = 'rgba(216,168,72,0.7)'; wedge(ctx, x + w / 2 - 4, y + 3, 8);
          if (w > 130) { ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(x + 24, y, 2, h); ctx.fillRect(x + w - 26, y, 2, h); }
        };
      }
      tryPatch.pdone = true;
    }
    if (!tryPatch.bdone && game.balls && game.balls.length) {
      const bpr = Object.getPrototypeOf(game.balls[0]);
      if (bpr && bpr.draw) {
        bpr.draw = function (ctx) {
          ctx = (ctx && ctx.canvas) ? ctx : this.ctx;
          if (!ctx) return;
          const r = this.radius || 8;
          ctx.fillStyle = 'rgba(216,168,72,0.25)';
          ctx.beginPath(); ctx.arc(this.x - (this.dx || 0) * 2, this.y - (this.dy || 0) * 2, r * 0.7, 0, 7); ctx.fill();
          ctx.fillStyle = '#d8a848';
          ctx.beginPath(); ctx.arc(this.x, this.y, r, 0, 7); ctx.fill();
          ctx.save(); ctx.translate(this.x, this.y); ctx.rotate((performance.now() / 500) % 6.28);
          ctx.fillStyle = '#7a5018'; wedge(ctx, -3, -3, 6); ctx.restore();
          ctx.fillStyle = 'rgba(255,240,200,0.8)';
          ctx.beginPath(); ctx.arc(this.x - r * 0.3, this.y - r * 0.35, r * 0.22, 0, 7); ctx.fill();
        };
      }
      tryPatch.bdone = true;
    }
    if (!tryPatch.udp && game.powerUps && game.powerUps.length) {
      const up = Object.getPrototypeOf(game.powerUps[0]);
      if (up && up.draw) {
        up.draw = function (ctx) {
          ctx = (ctx && ctx.canvas) ? ctx : this.ctx;
          if (!ctx) return;
          const t = performance.now() / 600;
          const sx = Math.abs(Math.cos(t + this.x * 0.01)) * 0.7 + 0.3;
          ctx.save(); ctx.translate(this.x, this.y); ctx.scale(sx, 1);
          ctx.fillStyle = '#241a10';
          ctx.beginPath(); ctx.arc(0, 0, 13, 0, 7); ctx.fill();
          ctx.strokeStyle = '#d8a848'; ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.arc(0, 0, 13, 0, 7); ctx.stroke();
          ctx.fillStyle = '#e8b06a';
          const tp = this.type;
          if (tp === 'WIDE') { ctx.fillRect(-8, -2, 6, 4); ctx.fillRect(2, -2, 6, 4); }
          else if (tp === 'SLOW') { ctx.beginPath(); ctx.moveTo(-4, -7); ctx.lineTo(4, -7); ctx.lineTo(5, 3); ctx.lineTo(0, 8); ctx.lineTo(-5, 3); ctx.closePath(); ctx.fill(); }
          else if (tp === 'MULTI') { ctx.beginPath(); ctx.arc(-5, 3, 3, 0, 7); ctx.fill(); ctx.beginPath(); ctx.arc(5, 3, 3, 0, 7); ctx.fill(); ctx.beginPath(); ctx.arc(0, -4, 3, 0, 7); ctx.fill(); }
          else if (tp === 'LASER') { ctx.beginPath(); ctx.arc(0, -3, 4, 0, 7); ctx.fill(); ctx.fillRect(-1, 0, 2, 8); }
          else if (tp === 'CATCH') { ctx.fillRect(-2, -8, 4, 10); ctx.fillRect(-6, -8, 3, 6); ctx.fillRect(3, -8, 3, 6); }
          else if (tp === 'LIFE') { ctx.beginPath(); ctx.moveTo(0, -8); ctx.quadraticCurveTo(6, 0, 0, 7); ctx.quadraticCurveTo(-6, 0, 0, -8); ctx.fill(); }
          else if (tp === 'FRAGMENT') { ctx.beginPath(); ctx.moveTo(-6, -6); ctx.lineTo(6, -4); ctx.lineTo(3, 7); ctx.lineTo(-4, 5); ctx.closePath(); ctx.fill(); }
          else if (tp === 'CARD') { ctx.fillRect(-5, -7, 10, 14); ctx.fillStyle = '#241a10'; wedge(ctx, -2, -4, 4); }
          else { wedge(ctx, -4, -5, 5); wedge(ctx, -1, 0, 5); wedge(ctx, -4, 4, 5); }
          ctx.restore();
        };
      }
      tryPatch.udp = true;
    }
  };
  setInterval(tryPatch, 400);
}
