export function initVisual(game) {
  // ===== ЦЕНТРОВКА: вертикальное поле по центру широкого экрана =====
  const wrap = document.querySelector('.game-wrapper');
  if (wrap) {
    wrap.style.display = 'flex';
    wrap.style.flexDirection = 'column';
    wrap.style.alignItems = 'center';
  }
  const cv = document.getElementById('gameCanvas');
  if (cv) cv.style.margin = '0 auto';

  // ===== ФОН: чистый градиент + дюны + одно солнце =====
  const bg = game.background;
  if (bg && typeof bg.draw === 'function') {
    bg.draw = function (ctx) {
      ctx = ctx || this.ctx;
      if (!ctx || !ctx.canvas) return;
      const w = ctx.canvas.width, h = ctx.canvas.height;

      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#1b1f3a');
      g.addColorStop(0.45, '#4a2a5a');
      g.addColorStop(0.75, '#c85a4a');
      g.addColorStop(1, '#e8935a');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      const sx = w * 0.7, sy = h * 0.16, sr = Math.min(w, h) * 0.08;
      const glow = ctx.createRadialGradient(sx, sy, sr * 0.4, sx, sy, sr * 2.6);
      glow.addColorStop(0, 'rgba(255,217,138,0.5)');
      glow.addColorStop(1, 'rgba(255,217,138,0)');
      ctx.fillStyle = glow;
      ctx.beginPath(); ctx.arc(sx, sy, sr * 2.6, 0, 7); ctx.fill();
      ctx.fillStyle = '#ffd98a';
      ctx.beginPath(); ctx.arc(sx, sy, sr, 0, 7); ctx.fill();

      const dune = (baseY, amp, f, ph, col) => {
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.moveTo(0, h);
        for (let x = 0; x <= w; x += 8) ctx.lineTo(x, baseY + Math.sin(x * f + ph) * amp);
        ctx.lineTo(w, h);
        ctx.closePath();
        ctx.fill();
      };
      dune(h * 0.80, 14, 0.012, 1.7, '#3a2148');
      dune(h * 0.86, 18, 0.010, 4.2, '#2a1638');
      dune(h * 0.93, 22, 0.008, 0.5, '#1c0f2a');
    };
  }
}
