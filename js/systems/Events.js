export function initEvents(game) {
  const od = game.destroyBrick ? game.destroyBrick.bind(game) : null;
  if (od) game.destroyBrick = (b, ...r) => {
    game.bricksBroken = (game.bricksBroken || 0) + 1;
    if (b.isGold) {
      b.isGold = false;
      game.score += 500;
      if (game.spawnPowerUp) { game.spawnPowerUp(b.x, b.y, true); game.spawnPowerUp(b.x + 10, b.y, true); }

    }
    if (b.isCaptive) {
      b.isCaptive = false;
      game.lives = (game.lives || 0) + 1;
      if (game.showBanner) game.showBanner('🕊 +1 жизнь');
    }
    return od(b, ...r);
  };

  let next = performance.now() + 12000;
  const tick = () => {
    requestAnimationFrame(tick);
    if (game.paused || game.menuOpen || game.museumOpen) return;
    if ((game.bricksBroken || 0) < 6) return;
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
    if (game.showBanner) game.showBanner('✨ Золотой кирпич!');
    setTimeout(() => {
      if (b.alive && b.isGold) { b.isGold = false; b.isSteel = true; }
    }, 12000);
  },
  (game) => {
    const alive = game.bricks.filter(b => b.alive && !b.isSteel);
    if (!alive.length) return;
    const b = alive[Math.floor(Math.random() * alive.length)];
    b.isCaptive = true; try { b.color = '#86efac'; } catch (e) {}
    if (game.showBanner) game.showBanner('🕊 Пленник!');
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
    game.charge = Math.min(100, (game.charge || 0) + 50);

  },
];




