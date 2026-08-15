const PAD = 4;
const cache = new Map();

function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.min(255, Math.max(0, Math.round(((n >> 16) & 255) * f)));
  const g = Math.min(255, Math.max(0, Math.round(((n >> 8) & 255) * f)));
  const b = Math.min(255, Math.max(0, Math.round((n & 255) * f)));
  return 'rgb(' + r + ',' + g + ',' + b + ')';
}

function rndFrom(str) {
  let seed = 0;
  for (let i = 0; i < str.length; i++) seed = (seed * 31 + str.charCodeAt(i)) | 0;
  return () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
}

export function getBrickSprite(colors, w, h, type) {
  const key = type + '|' + colors.base + '|' + w + 'x' + h;
  if (cache.has(key)) return cache.get(key);
  const cv = document.createElement('canvas');
  cv.width = w + PAD * 2;
  cv.height = h + PAD * 2;
  const c = cv.getContext('2d');
  const rnd = rndFrom(key);

  const grad = c.createLinearGradient(0, PAD, 0, PAD + h);
  grad.addColorStop(0, shade(colors.base, 1.25));
  grad.addColorStop(0.5, colors.base);
  grad.addColorStop(1, shade(colors.base, 0.7));
  c.fillStyle = grad;
  c.beginPath();
  c.roundRect(PAD, PAD, w, h, 3);
  c.fill();

  c.strokeStyle = 'rgba(30, 15, 5, 0.6)';
  c.lineWidth = 2;
  c.beginPath();
  c.roundRect(PAD + 1, PAD + 1, w - 2, h - 2, 3);
  c.stroke();

  c.fillStyle = 'rgba(255, 240, 200, 0.22)';
  c.fillRect(PAD + 2, PAD + 2, w - 4, 2);

  if (type === 'normal') {
    // клинопись: клинья-треугольники с хвостиками
    c.fillStyle = 'rgba(40, 15, 5, 0.5)';
    for (let r = 0; r < 2; r++) {
      const y = PAD + 6 + r * 7;
      for (let x = PAD + 4; x < PAD + w - 7; x += 6 + Math.floor(rnd() * 3)) {
        c.beginPath();
        c.moveTo(x, y);
        c.lineTo(x + 3, y - 1.5);
        c.lineTo(x + 3, y + 1.5);
        c.closePath();
        c.fill();
        c.fillRect(x + 3, y - 0.5, 2, 1);
      }
    }
    // солома
    c.strokeStyle = 'rgba(220, 200, 120, 0.5)';
    c.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      const x = PAD + 3 + rnd() * (w - 8), y = PAD + 3 + rnd() * (h - 6);
      c.beginPath();
      c.moveTo(x, y);
      c.lineTo(x + 3 + rnd() * 2, y + 1 + rnd());
      c.stroke();
    }
  } else if (type === 'clay') {
    // эрозия: рытвины + волосяная трещина
    c.fillStyle = 'rgba(60, 35, 15, 0.35)';
    for (let i = 0; i < 4; i++) {
      c.beginPath();
      c.arc(PAD + 4 + rnd() * (w - 8), PAD + 4 + rnd() * (h - 8), 1.5 + rnd() * 1.5, 0, 7);
      c.fill();
    }
    c.strokeStyle = 'rgba(50, 25, 10, 0.5)';
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(PAD + 3, PAD + h * 0.4);
    c.lineTo(PAD + w * 0.5, PAD + h * 0.55);
    c.lineTo(PAD + w - 4, PAD + h * 0.45);
    c.stroke();
  } else if (type === 'silver') {
    // лазурит: золотая жила + крупинки
    c.strokeStyle = 'rgba(220, 170, 60, 0.9)';
    c.lineWidth = 1.2;
    c.beginPath();
    c.moveTo(PAD + 3, PAD + h * 0.7);
    c.lineTo(PAD + w * 0.35, PAD + h * 0.4);
    c.lineTo(PAD + w * 0.6, PAD + h * 0.6);
    c.lineTo(PAD + w - 4, PAD + h * 0.25);
    c.stroke();
    c.fillStyle = 'rgba(230, 180, 70, 0.9)';
    for (let i = 0; i < 3; i++) {
      c.beginPath();
      c.arc(PAD + 5 + rnd() * (w - 10), PAD + 4 + rnd() * (h - 8), 1, 0, 7);
      c.fill();
    }
  } else if (type === 'gold') {
    c.fillStyle = 'rgba(255, 240, 190, 0.35)';
    c.beginPath();
    c.ellipse(PAD + w * 0.35, PAD + h * 0.35, w * 0.25, h * 0.18, -0.4, 0, 7);
    c.fill();
  } else if (type === 'steel') {
    // базальт: минеральная жилка + скол
    c.strokeStyle = 'rgba(220, 220, 225, 0.35)';
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(PAD + 4, PAD + h * 0.3);
    c.lineTo(PAD + w * 0.45, PAD + h * 0.5);
    c.lineTo(PAD + w - 5, PAD + h * 0.35);
    c.stroke();
    c.fillStyle = 'rgba(0, 0, 0, 0.4)';
    c.beginPath();
    c.moveTo(PAD + w - 7, PAD + 2);
    c.lineTo(PAD + w - 2, PAD + 2);
    c.lineTo(PAD + w - 2, PAD + 7);
    c.closePath();
    c.fill();
  } else if (type === 'explosive' || type === 'fire') {
    c.fillStyle = 'rgba(20, 10, 8, 0.55)';
    for (let i = 0; i < 3; i++) {
      c.beginPath();
      c.arc(PAD + 5 + rnd() * (w - 10), PAD + 4 + rnd() * (h - 8), 2.5 + rnd() * 2, 0, 7);
      c.fill();
    }
  } else if (type === 'regen') {
    c.fillStyle = 'rgba(90, 120, 50, 0.7)';
    for (let i = 0; i < 5; i++) {
      c.beginPath();
      c.arc(PAD + 3 + rnd() * (w - 6), PAD + 3 + rnd() * (h - 6), 1.2, 0, 7);
      c.fill();
    }
  } else if (type === 'moving') {
    c.fillStyle = 'rgba(200, 230, 240, 0.25)';
    c.fillRect(PAD + 3, PAD + h * 0.3, w - 6, 2);
  }

  c.fillStyle = 'rgba(0, 0, 0, 0.12)';
  for (let i = 0; i < 4; i++) c.fillRect(PAD + 2 + rnd() * (w - 4), PAD + 3 + rnd() * (h - 6), 1.5, 1.5);

  cache.set(key, cv);
  return cv;
}
