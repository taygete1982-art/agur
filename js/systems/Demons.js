export function initDemons(game) {
  const tick = () => {
    requestAnimationFrame(tick);
    if (game.paused || game.menuOpen || game.museumOpen) return;
    const demons = game.demons || game.enemies || [];
    const balls = game.balls || [];
    if (!demons.length || !balls.length) return;
    for (const d of demons) {
      if (d.dead) continue;
      const dr = (d.radius || d.size || 18) + 6;
      for (const b of balls) {
        const dx = (d.x || 0) - (b.x || 0), dy = (d.y || 0) - (b.y || 0);
        const br = (b.radius || b.r || 6) + dr;
        if (dx * dx + dy * dy < br * br) { hit(game, d); break; }
      }
    }
  };
  requestAnimationFrame(tick);
}

function hit(game, d) {
  if (d.hp && d.hp > 1) { d.hp -= 1; d.hitCd = 30; return; }
  d.dead = true; d.alive = false; d.y = -9999;
  game.score += 250;
  if (game.effects && game.effects.bolt) game.effects.bolt(d.x || 0, 0, d.x || 0, d.y || 100);
  if (game.effects && game.effects.flash) game.effects.flash('#fca5a5', 0.12);
  if (game.spawnPowerUp) {
    game.spawnPowerUp(d.x || 0, 80, true);
    if (Math.random() < 0.35) game.spawnPowerUp((d.x || 0) + 20, 80);
  }

}


