const TYPES = ['normal', 'clay', 'silver', 'gold', 'steel', 'explosive', 'regen', 'moving'];
const ready = {};
// Центральная область, где лежит сам кирпич (фон по краям не попадает)
const CROP = { x: 0.10, y: 0.12, w: 0.80, h: 0.76 };

for (const t of TYPES) {
  const img = new Image();
  img.onload = () => {
    ready[t] = {
      img: img,
      sx: img.width * CROP.x,
      sy: img.height * CROP.y,
      sw: img.width * CROP.w,
      sh: img.height * CROP.h,
    };
    console.log('[brickTexture] ' + t + ' → OK');
  };
  img.onerror = () => console.warn('[brickTexture] ' + t + ' → НЕ ЗАГРУЗИЛАСЬ');
  img.src = 'assets/bricks/' + t + '.png';
}

export function getBrickTexture(type) { return ready[type] || null; }
