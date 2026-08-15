const TYPES = ['normal', 'clay', 'silver', 'gold', 'steel', 'explosive', 'regen', 'moving'];
const ready = {};

function chromaKey(img) {
  const cv = document.createElement('canvas');
  cv.width = img.width;
  cv.height = img.height;
  const c = cv.getContext('2d');
  c.drawImage(img, 0, 0);
  const d = c.getImageData(0, 0, cv.width, cv.height);
  const px = d.data;
  for (let i = 0; i < px.length; i += 4) {
    const r = px[i], g = px[i + 1], b = px[i + 2];
    if (r > 140 && b > 120 && g < 110) px[i + 3] = 0;
  }
  c.putImageData(d, 0, 0);
  return cv;
}

for (const t of TYPES) {
  const img = new Image();
  img.onload = () => { ready[t] = chromaKey(img); };
  img.src = 'assets/bricks/' + t + '.png';
}

export function getBrickTexture(type) { return ready[type] || null; }
