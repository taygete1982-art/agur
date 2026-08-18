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
  if (variant % 2 === 1) { g.strokeStyle = 'rgba(0,0,0,0.3)'; g.lineWidth = 1; g.beginPath(); g.moveTo(w * 0.3, 0); g.lineTo(w * 0.4, h * 0.5); g.lineTo(w * 0.32, h); g.stroke(); }
  if (variant % 4 === 2) { g.globalCompositeOperation = 'destination-out'; g.beginPath(); g.moveTo(w - 5, 0); g.lineTo(w, 0); g.lineTo(w, 5); g.closePath(); g.fill(); g.globalCompositeOperation = 'source-over'; }
  if (mat === 'gold') { g.fillStyle = 'rgba(255,255,255,0.7)'; g.fillRect(2, 1, Math.floor(w / 3), 1); }
  if (mat === 'steel') { g.fillStyle = 'rgba(255,255,255,0.15)'; g.fillRect(1, 1, w - 2, 1); }
  return c;
}

function makeBg(w, h, biome) {
  const pal = PAL[biome];
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d');
  const r = rng(biome * 131 + 7);
  g.fillStyle = pal.bg; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 500; i++) {
    g.fillStyle = r() > 0.5 ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.05)';
    g.fillRect(r() * w, r() * h, 1 + r() * 2, 1);
  }
  g.strokeStyle = 'rgba(0,0,0,0.15)'; g.lineWidth = 1;
  for (let i = 0; i < 5; i++) {
    g.beginPath(); let x = r() * w, y = 0; g.moveTo(x, y);
    for (let s = 0; s < 6; s++) { x += (r() - 0.5) * 40; y += h / 6; g.lineTo(x, y); }
    g.stroke();
  }
  const sil = pal.sil;
  g.fillStyle = sil; g.globalAlpha = 0.5;
  const bw = w * 0.5, bx = w * 0.25, by = h * 0.30;
  for (let s = 0; s < 5; s++) { const sw = bw * (1 - s * 0.18); g.fillRect(w / 2 - sw / 2, by - s * 14, sw, 14); }
  g.globalAlpha = 1;
  if (pal.sun) { g.fillStyle = pal.acc; g.globalAlpha = 0.35; g.beginPath(); g.arc(w * 0.78, h * 0.10, 26, 0, 7); g.fill(); g.globalAlpha = 1; }
  else { g.fillStyle = pal.acc; g.globalAlpha = 0.4; g.beginPath(); g.arc(w * 0.24, h * 0.10, 18, 0, 7); g.fill(); g.globalAlpha = 1; }
  g.fillStyle = 'rgba(0,0,0,0.35)';
  g.fillRect(0, 0, w, 3); g.fillRect(0, h - 3, w, 3); g.fillRect(0, 0, 3, h); g.fillRect(w - 3, 0, 3, h);
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
      const biome = game.biome || 0;
      const key = biome + '_' + w + 'x' + h;
      let c = bgCache.get(key);
      if (!c) { c = makeBg(w, h, biome); bgCache.set(key, c); }
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
          ctx.fillStyle = '#6a4a2a'; ctx.fillRect(x, y, w, h);
          ctx.fillStyle = '#8a6a3a'; ctx.fillRect(x, y, w, 2);
          ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(x, y + h - 2, w, 2);
          ctx.fillStyle = '#d8a848';
          ctx.beginPath(); ctx.arc(x + 5, y + h / 2, 2, 0, 7); ctx.fill();
          ctx.beginPath(); ctx.arc(x + w - 5, y + h / 2, 2, 0, 7); ctx.fill();
          ctx.fillStyle = 'rgba(216,168,72,0.7)';
          wedge(ctx, x + w / 2 - 4, y + 3, 8);
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
          ctx.save();
          ctx.translate(this.x, this.y);
          ctx.rotate((performance.now() / 500) % 6.28);
          ctx.fillStyle = '#7a5018';
          wedge(ctx, -3, -3, 6);
          ctx.restore();
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
          ctx.save();
          ctx.translate(this.x, this.y);
          ctx.scale(sx, 1);
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
