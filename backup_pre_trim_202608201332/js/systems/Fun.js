const UPG = [
  { id: 'luck', icon: '💧', name: 'Дар Энки', desc: 'карты и осколки падают чаще', max: 5 },
  { id: 'score', icon: '☀', name: 'Дар Шамаша', desc: '+10% очков за каждый', max: 5 },
  { id: 'life', icon: '❤', name: 'Дар Нинмах', desc: '+1 жизнь сразу', max: 9 },
  { id: 'wide', icon: '↔', name: 'Дар Нисабы', desc: 'платформа шире', max: 5 },
];

export function initFun(game) {
  game.buffs = game.buffs || { luck: 0, score: 0, life: 0, wide: 0 };
  game.combo = 0;

  let hud = document.getElementById('comboHud');
  if (!hud) {
    hud = document.createElement('div');
    hud.id = 'comboHud';
    hud.style.cssText = 'position:fixed;top:10px;left:50%;transform:translateX(-50%);color:#f0c96a;font-family:Georgia,serif;font-size:26px;letter-spacing:2px;pointer-events:none;z-index:45;display:none;text-shadow:0 0 14px rgba(240,201,106,0.6);';
    document.body.appendChild(hud);
  }

  const od = game.destroyBrick ? game.destroyBrick.bind(game) : null;
  if (od) game.destroyBrick = (b, ...r) => {
    game.combo = (game.combo || 0) + 1;
    const mult = game.combo >= 20 ? 7 : game.combo >= 8 ? 5 : game.combo >= 5 ? 3 : game.combo >= 2 ? 2 : 1;
    if (game.combo === 20 && game.showBanner) game.showBanner('🔥 FRENZY ×7!');
    const r0 = od(b, ...r);
    const sb = (game.buffs && game.buffs.score) || 0;
    game.score += 5 * (mult - 1) + sb * 2;
    if (mult > 1) { hud.style.display = 'block'; hud.textContent = '×' + mult + ' (' + game.combo + ')'; }
    else hud.style.display = 'none';
    return r0;
  };

  const rl = game.loadLevel ? 'loadLevel' : game.startLevel ? 'startLevel' : null;
  if (rl) { const o = game[rl].bind(game); game[rl] = (n, ...a) => { game.combo = 0; hud.style.display = 'none'; return o(n, ...a); }; }
  const ll = game.loseLife ? 'loseLife' : null;
  if (ll) { const o = game[ll].bind(game); game[ll] = (...a) => { game.combo = 0; hud.style.display = 'none'; return o(...a); }; }

  const nn = game.nextLevel ? 'nextLevel' : game.advanceLevel ? 'advanceLevel' : null;
  if (nn) { const o = game[nn].bind(game); game[nn] = (...a) => showChoice(game, () => o(...a)); }
}

function apply(game, id) {
  const b = game.buffs; b[id] = (b[id] || 0) + 1;
  if (id === 'life') game.lives = (game.lives || 0) + 1;
  if (id === 'wide') { try { const p = game.paddle; if (p && 'width' in p) p.width *= 1.12; } catch (e) {} }
}

function showChoice(game, done) {
  let ov = document.getElementById('upgOverlay');
  if (!ov) {
    ov = document.createElement('div');
    ov.id = 'upgOverlay';
    ov.style.cssText = 'position:fixed;inset:0;background:rgba(5,3,1,0.92);display:none;align-items:center;justify-content:center;z-index:70;';
    document.body.appendChild(ov);
  }
  if ('paused' in game) game.paused = true;
  const pool = UPG.filter(u => (game.buffs[u.id] || 0) < u.max);
  const picks = [];
  while (picks.length < 3 && pool.length) picks.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  if (!picks.length) { if ('paused' in game) game.paused = false; done(); return; }
  ov.style.display = 'flex';
  ov.innerHTML = '<div style="text-align:center;"><h2 style="color:#f0c96a;font-family:Georgia,serif;margin-bottom:20px;">𒀭 Выбери дар богов</h2><div style="display:flex;gap:16px;justify-content:center;">' +
    picks.map((u, i) => '<div onclick="__upg.pick(' + i + ')" style="width:190px;border:2px solid #8a6a3a;border-radius:10px;background:radial-gradient(circle at 50% 30%,#3a2c14,#171008);padding:20px 12px;cursor:pointer;text-align:center;box-shadow:0 0 18px rgba(240,201,106,0.15);"><div style="font-size:36px;">' + u.icon + '</div><div style="color:#f0c96a;font-family:Georgia,serif;font-size:15px;margin-top:10px;">' + u.name + '</div><div style="color:#9a8a70;font-family:Georgia,serif;font-size:12px;margin-top:6px;">' + u.desc + '</div></div>').join('') +
    '</div></div>';
  window.__upg = { pick: (i) => { if (game.audio && game.audio.uiClick) game.audio.uiClick(); apply(game, picks[i].id); ov.style.display = 'none'; if ('paused' in game) game.paused = false; done(); } };
}


