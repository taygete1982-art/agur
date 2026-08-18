export function initPower(game) {
  game.charge = 0;
  let bar = document.getElementById('chargeHud');
  if (!bar) {
    bar = document.createElement('div');
    bar.id = 'chargeHud';
    bar.style.cssText = 'position:fixed;bottom:26px;left:50%;transform:translateX(-50%);width:220px;height:10px;border:1px solid #8a6a3a;border-radius:5px;background:rgba(0,0,0,0.5);z-index:45;';
    bar.innerHTML = '<div id="chargeFill" style="height:100%;width:0%;background:linear-gradient(90deg,#c9a24a,#f0c96a);border-radius:5px;"></div><div id="chargeHint" style="position:absolute;top:-18px;left:0;right:0;text-align:center;color:#f0c96a;font-family:Georgia,serif;font-size:11px;display:none;">⚡ ПРОБЕЛ — удар</div>';
    document.body.appendChild(bar);
  }

  const od = game.destroyBrick ? game.destroyBrick.bind(game) : null;
  if (od) game.destroyBrick = (b, ...r) => {
    const r0 = od(b, ...r);
    game.charge = Math.min(100, (game.charge || 0) + 3);
    updateBar(game);
    return r0;
  };

  window.addEventListener('keydown', (e) => {
    if ((e.code === 'Space' || e.code === 'KeyF') && game.charge >= 100) fire(game);
  });
}

function updateBar(game) {
  const f = document.getElementById('chargeFill');
  const h = document.getElementById('chargeHint');
  if (f) f.style.width = (game.charge || 0) + '%';
  if (h) h.style.display = game.charge >= 100 ? 'block' : 'none';
}

function fire(game) {
  game.charge = 0; updateBar(game);
  const alive = (game.bricks || []).filter(b => b.alive && !b.isSteel);
  const cols = {};
  alive.forEach(b => { const k = Math.round(b.x); (cols[k] = cols[k] || []).push(b); });
  const keys = Object.keys(cols);
  for (let i = 0; i < 3 && keys.length; i++) {
    const k = keys.splice(Math.floor(Math.random() * keys.length), 1)[0];
    const list = cols[k];
    const x = +k + (list[0].width || 20) / 2;
    if (game.effects && game.effects.bolt) game.effects.bolt(x, 0, x, list[0].y);
    list.forEach(b => { if (b.alive && game.destroyBrick) game.destroyBrick(b); });
  }
  if (game.effects && game.effects.flash) game.effects.flash('#fde047', 0.25);
  game.shakeIntensity = Math.max(game.shakeIntensity || 0, 14);
  if (game.showBanner) game.showBanner('⚡ Удар Адада!');
}
