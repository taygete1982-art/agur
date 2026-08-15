const TYPES = ['normal', 'clay', 'silver', 'gold', 'steel', 'explosive', 'regen', 'moving'];
const ready = {};
const TARGET_W = 152;
const TARGET_H = 72;

function process(img) {
  const cv = document.createElement('canvas');
  cv.width = img.width;
  cv.height = img.height;
  const c = cv.getContext('2d');
  c.drawImage(img, 0, 0);
  const d = c.getImageData(0, 0, cv.width, cv.height);
  const px = d.data;

  // Вырезаем мадженту-фон
  for (let i = 0; i < px.length; i += 4) {
    const r = px[i], g = px[i + 1], b = px[i + 2];
    if (r > 110 && b > 90 && (r - g) > 45 && (b - g) > 35) px[i + 3] = 0;
  }
  c.putImageData(d, 0, 0);

  // Рамка по непрозрачным пикселям (сам кирпич)
  let minX = cv.width, minY = cv.height, maxX = -1, maxY = -1;
  for (let y = 0; y < cv.height; y += 2) {
    for (let x = 0; x < cv.width; x += 2) {
      if (px[(y * cv.width + x) * 4 + 3] > 20) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return null;
  const w = maxX - minX + 1;
  const h = maxY - minY + 1;

  // Предварительно сжимаем до спрайта 152x72 — чтобы на 38x18 было ЧЁТКО, а не шум
  const out = document.createElement('canvas');
  out.width = TARGET_W;
  out.height = TARGET_H;
  const o = out.getContext('2d');
  o.imageSmoothingEnabled = true;
  o.imageSmoothingQuality = 'high';
  o.drawImage(cv, minX, minY, w, h, 0, 0, TARGET_W, TARGET_H);
  return out;
}

for (const t of TYPES) {
  const img = new Image();
  img.onload = () => {
    const res = process(img);
    if (res) {
      ready[t] = res;
      console.log('[brickTexture] ' + t + ' → спрайт ' + res.width + 'x' + res.height);
    }
  };
  img.onerror = () => console.warn('[brickTexture] ' + t + ' → 404');
  img.src = 'assets/bricks/' + t + '.png';
}

export function getBrickTexture(type) { return ready[type] || null; }
