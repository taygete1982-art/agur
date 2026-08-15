const TYPES = ['normal', 'clay', 'silver', 'gold', 'steel', 'explosive', 'regen', 'moving'];
const ready = {};
const status = {};

for (const t of TYPES) {
  const img = new Image();
  img.onload = () => {
    // Без chroma-key — используем картинку как есть
    ready[t] = img;
    status[t] = 'OK (' + img.width + 'x' + img.height + ')';
    console.log('[brickTexture] ' + t + ' → OK (' + img.width + 'x' + img.height + ')');
  };
  img.onerror = () => {
    status[t] = '404';
    console.warn('[brickTexture] ' + t + ' → 404');
  };
  img.src = 'assets/bricks/' + t + '.png';
}

export function getBrickTexture(type) {
  // Диагностика: один раз выведем статус
  if (!window.__brickTexLog) {
    window.__brickTexLog = true;
    console.log('[brickTexture] status:', status);
  }
  return ready[type] || null;
}
