const TYPES = ['normal', 'clay', 'silver', 'gold', 'steel', 'explosive', 'regen', 'moving'];
const ready = {};

for (const t of TYPES) {
  const img = new Image();
  img.onload = () => {
    const cv = document.createElement('canvas');
    cv.width = img.width;
    cv.height = img.height;
    const c = cv.getContext('2d');
    c.drawImage(img, 0, 0);
    const d = c.getImageData(0, 0, cv.width, cv.height);
    const px = d.data;
    for (let i = 0; i < px.length; i += 4) {
      if (px[i] > 140 && px[i + 2] > 120 && px[i + 1] < 110) px[i + 3] = 0;
    }
    c.putImageData(d, 0, 0);
    ready[t] = cv;
  };
  img.src = 'assets/bricks/' + t + '.png';
}

export function getBrickTexture(type) { return ready[type] || null; }
