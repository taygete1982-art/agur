export function initEvents(game) {
  const od = game.destroyBrick ? game.destroyBrick.bind(game) : null;
  if (od) game.destroyBrick = (b, ...r) => {
    if (b.isGold) {
      b.isGold = false;
      game.score += 500;
      if (game.spawnPowerUp) { game.spawnPowerUp(b.x, b.y, true); game.spawnPowerUp(b.x + 10, b.y, true); }
      if (game.showBanner) game.showBanner('✨ Золотой кирпич! +500');
    }
    if (b.isCaptive) {
      b.isCaptive = false;
      game.lives = (game.lives || 0) + 1;
      if (game.showBanner) game.showBanner('🕊 Пленник свободен! +1 жизнь');
    }
    return od(b, ...r);
  };

  let next = performance.now() + 12000;
  const tick = () => {
    requestAnimationFrame(tick);
    if (game.paused || game.menuOpen || game.museumOpen) return;
    const now = performance.now();
    if (now < next) return;
    next = now + 18000 + Math.random() * 8000;
    if (!game.bricks || !game.bricks.some(b => b.alive)) return;
    EVENTS[Math.floor(Math.random() * EVENTS.length)](game);
  };
  requestAnimationFrame(tick);
}

const EVENTS = [
  (game) => {
    const alive = game.bricks.filter(b => b.alive && !b.isSteel);
    if (!alive.length) return;
    const b = alive[Math.floor(Math.random() * alive.length)];
    b.isGold = true; try { b.color = '#f0c96a'; } catch (e) {}
    if (game.showBanner) game.showBanner('✨ Золотой кирпич! Разбей — будет карта');
    setTimeout(() => {
      if (b.alive && b.isGold) { b.isGold = false; b.isSteel = true; if (game.showBanner) game.showBanner('…кирпич закаменел в сталь'); }
    }, 12000);
  },
  (game) => {
    const alive = game.bricks.filter(b => b.alive && !b.isSteel);
    if (!alive.length) return;
    const b = alive[Math.floor(Math.random() * alive.length)];
    b.isCaptive = true; try { b.color = '#86efac'; } catch (e) {}
    if (game.showBanner) game.showBanner('🕊 Пленник за кирпичом! Освободи его');
    setTimeout(() => { b.isCaptive = false; }, 12000);
  },
  (game) => {
    if (!game.spawnDemon) return;
    const w = (document.querySelector('canvas') || { width: 800 }).width;
    try {
      for (let i = 0; i < 3; i++) game.spawnDemon(60 + Math.random() * (w - 120), 40 + i * 30);
      if (game.showBanner) game.showBanner('👹 Волна демонов!');
    } catch (e) {}
  },
  (game) => {
    if (!game.spawnPowerUp) return;
    const w = (document.querySelector('canvas') || { width: 800 }).width;
    for (let i = 0; i < 3; i++) game.spawnPowerUp(60 + Math.random() * (w - 120), 60 + i * 40, true);
    if (game.showBanner) game.showBanner('🏺 Дождь осколков!');
  },
  (game) => {
    game.charge = Math.min(100, (game.charge || 0) + 50);
    if (game.showBanner) game.showBanner('☀ Благословение Шамаша: +50 заряда');
  },
];

