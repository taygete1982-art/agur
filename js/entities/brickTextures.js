const TYPES = ['normal', 'clay', 'silver', 'gold', 'steel', 'explosive', 'regen', 'moving'];
const ready = {};

for (const t of TYPES) {
  const img = new Image();
  img.onload = () => {
    try {
      const cv = document.createElement('canvas');
      cv.width = img.width;
      cv.height = img.height;
      const c = cv.getContext('2d');
      c.drawImage(img, 0, 0);
      const d = c.getImageData(0, 0, cv.width, cv.height);
      const px = d.data;

      // Цвет фона = пиксель в углу; вырезаем всё похожее на него
      const br = px[0], bgc = px[1], bb = px[2];
      for (let i = 0; i < px.length; i += 4) {
        const dr = px[i] - br, dg = px[i + 1] - bgc, db = px[i + 2] - bb;
        if (dr * dr + dg * dg + db * db < 4900) px[i + 3] = 0;
      }
      c.putImageData(d, 0, 0);

      // Рамка по непрозрачным пикселям = сам кирпич
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
      if (maxX <= minX || maxY <= minY) { ready[t] = img; return; }

      // Срезаем 2% с каждой стороны — убираем розовую бахрому
      const sw = (maxX - minX) * 0.96;
      const sh = (maxY - minY) * 0.96;
      const sx = minX + (maxX - minX) * 0.02;
      const sy = minY + (maxY - minY) * 0.02;

      const out = document.createElement('canvas');
      out.width = 152;
      out.height = 72;
      const o = out.getContext('2d');
      o.imageSmoothingEnabled = true;
      o.imageSmoothingQuality = 'high';
      o.drawImage(cv, sx, sy, sw, sh, 0, 0, 152, 72);
      ready[t] = out;
      console.log('[brickTexture] ' + t + ' → вырезано ' + Math.round(sw) + 'x' + Math.round(sh));
    } catch (e) {
      ready[t] = img;
      console.warn('[brickTexture] ' + t + ' fallback', e);
    }
  };
  img.onerror = () => console.warn('[brickTexture] ' + t + ' → 404');
  img.src = 'assets/bricks/' + t + '.png';
}

export function getBrickTexture(type) { return ready[type] || null; }
