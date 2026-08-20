const BOSS_NAMES = ['Галла-страж', 'Нингирсу-воитель', 'Энки-хранитель', 'Иштар-воительница', 'Нергал-жнец', 'Мардук-порядок', 'Эрешкигаль-владычица', 'Адад-громовержец'];

export function initBosses(game) {
  const sname = game.spawnBoss ? 'spawnBoss' : game.startBoss ? 'startBoss' : null;
  if (!sname) return;
  const orig = game[sname].bind(game);
  game[sname] = (...a) => {
    const r = orig(...a);
    try {
      const b = game.boss;
      if (b) {
        const n = BOSS_NAMES[((game.level || 1) - 1) % BOSS_NAMES.length];
        b.name = n;
        if (typeof b.maxHp === 'number') {
          const m = 1 + Math.min(game.level || 1, 20) * 0.05;
          b.maxHp = Math.round(b.maxHp * m);
          b.hp = b.maxHp;
        }
        if (game.showBanner) game.showBanner('👹 ' + n + '!');
      }
    } catch (e) {}
    return r;
  };
}
