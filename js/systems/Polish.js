export function initPolish(game) {
  let hud = document.getElementById('hudBar');
  if (!hud) {
    hud = document.createElement('div');
    hud.id = 'hudBar';
    hud.style.cssText = 'position:fixed;bottom:6px;left:0;right:0;text-align:center;color:#6a5a44;font-family:Georgia,serif;font-size:11px;letter-spacing:1px;pointer-events:none;z-index:40;opacity:0.8;';
    document.body.appendChild(hud);
  }
  let pov = document.getElementById('pauseOverlay');
  if (!pov) {
    pov = document.createElement('div');
    pov.id = 'pauseOverlay';
    pov.style.cssText = 'position:fixed;inset:0;background:rgba(5,3,1,0.7);display:none;align-items:center;justify-content:center;z-index:55;';
    pov.innerHTML = '<div style="color:#f0c96a;font-family:Georgia,serif;font-size:40px;letter-spacing:6px;">ПАУЗА</div>';
    document.body.appendChild(pov);
  }
  window.addEventListener('keydown', (e) => {
    if (e.code === 'KeyP') {
      if ('paused' in game) game.paused = !game.paused;
      pov.style.display = ('paused' in game && game.paused) ? 'flex' : 'none';
    }
  });
}


