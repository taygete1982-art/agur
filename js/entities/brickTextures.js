const TYPES = ['normal', 'clay', 'silver', 'gold', 'steel', 'explosive', 'regen', 'moving'];
const ready = {};

function process(img) {
  const cv = document.createElement('canvas');
  cv.width = img.width;
  cv.height = img.height;
  const c = cv.getContext('2d');
  c.drawImage(img, 0, 0);
  let d;
  try { d = c.getImageData(0, 0, cv.width, cv.height); } catch (e) { return img; }
  const px = d.data;

  // Вырезаем мадженту-фон
  for (let i = 0; i < px.length; i += 4) {
    const r = px[i], g = px[i + 1], b = px[i + 2];
    if (r > 110 && b > 90 && (r - g) > 45 && (b - g) > 35) px[i + 3] = 0;
  }
  c.putImageData(d, 0, 0);

  // Автокроп по непрозрачным пикселям
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
  if (maxX < 0) return img;
  const w = maxX - minX + 1;
  const h = maxY - minY + 1;
  const out = document.createElement('canvas');
  out.width = w;
  out.height = h;
  out.getContext('2d').drawImage(cv, minX, minY, w, h, 0, 0, w, h);
  return out;
}

for (const t of TYPES) {
  const img = new Image();
  img.onload = () => {
    ready[t] = process(img);
    console.log('[brickTexture] ' + t + ' → OK (' + ready[t].width + 'x' + ready[t].height + ')');
  };
  img.onerror = () => console.warn('[brickTexture] ' + t + ' → 404');
  img.src = 'assets/bricks/' + t + '.png';
}

export function getBrickTexture(type) { return ready[type] || null; }
