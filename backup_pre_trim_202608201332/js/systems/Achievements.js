const ACH = [
  ['m1', 'Первая древность', 'открыть 1 артефакт музея', s => s.mus >= 1],
  ['m50', 'Смотритель', 'открыть 50 артефактов', s => s.mus >= 50],
  ['m100', 'Хранитель', 'открыть 100 артефактов', s => s.mus >= 100],
  ['m216', 'Полный музей', 'все 216 древностей', s => s.mus >= 216],
  ['c1', 'Первая карта', '1 карта в колоде', s => s.deck >= 1],
  ['c21', 'Полколоды', '21 карта', s => s.deck >= 21],
  ['c42', 'Полная колода', 'все 42 карты', s => s.deck >= 42],
  ['s10', 'Тысячник', '10 000 очков за забег', s => s.best >= 10000],
  ['s50', 'Великий счёт', '50 000 очков', s => s.best >= 50000],
  ['s100', 'Легенда', '100 000 очков', s => s.best >= 100000],
  ['l5', 'Путник', 'дойти до 5 уровня', s => s.max >= 5],
  ['l12', 'Царь дороги', 'пройти 12 уровней', s => s.max >= 12],
];

function titleFor(n) {
  if (n >= 12) return 'Царь Шумера';
  if (n >= 9) return 'Владыка судеб';
  if (n >= 6) return 'Жрец';
  if (n >= 3) return 'Писец';
  return 'Пыль дорог';
}

function stats(game) {
  let prog = { max: 1, best: 0 }; try { prog = JSON.parse(localStorage.getItem('agur_progress') || '{"max":1,"best":0}'); } catch (e) {}
  let deck = 0; try { deck = (JSON.parse(localStorage.getItem('agur_deck') || '[]')).length; } catch (e) {}
  let mus = 0; try { mus = (JSON.parse(localStorage.getItem('agur_museum') || '[]')).length; } catch (e) {}
  return { max: Math.max(prog.max, game.level || 1), best: Math.max(prog.best, game.score || 0), deck, mus };
}

export function initAchievements(game) {
  let have = []; try { have = JSON.parse(localStorage.getItem('agur_ach') || '[]'); } catch (e) {}
  window.__title = () => titleFor(have.length);

  let ov = document.getElementById('achOverlay');
  if (!ov) {
    ov = document.createElement('div');
    ov.id = 'achOverlay';
    ov.style.cssText = 'position:fixed;inset:0;background:rgba(5,3,1,0.96);display:none;overflow-y:auto;z-index:50;padding:20px;box-sizing:border-box;';
    ov.addEventListener('click', () => { ov.style.display = 'none'; });
    document.body.appendChild(ov);
  }
  window.toggleAch = (g) => {
    const on = ov.style.display !== 'block';
    ov.style.display = on ? 'block' : 'none';
    if (on) renderAch(g, have);
  };
  window.addEventListener('keydown', (e) => { if (e.code === 'KeyT') window.toggleAch(game); });

  const check = (silent) => {
    const s = stats(game);
    const fresh = ACH.filter(a => !have.includes(a[0]) && a[3](s));
    if (fresh.length) {
      fresh.forEach(a => have.push(a[0]));
      try { localStorage.setItem('agur_ach', JSON.stringify(have)); } catch (e) {}
      if (!silent && game.showBanner) game.showBanner('🏆 Достижения: ' + fresh.length);
      if (!silent && game.audio && game.audio.powerupGet) game.audio.powerupGet();
    }
    return fresh.length;
  };
  check(true);

  const og = game.gameOver ? game.gameOver.bind(game) : null;
  if (og) game.gameOver = (...a) => { const r = og(...a); setTimeout(() => check(false), 300); return r; };
}

function renderAch(game, have) {
  const ov = document.getElementById('achOverlay');
  let html = '<h2 style="color:#f0c96a;text-align:center;font-family:Georgia,serif;margin:20px 0;">🏆 Титулы и достижения</h2>';
  html += '<div style="text-align:center;color:#e8c98a;font-family:Georgia,serif;font-size:18px;margin-bottom:6px;">Твой титул: «' + titleFor(have.length) + '»</div>';
  html += '<div style="text-align:center;color:#6a5a44;font-family:Georgia,serif;font-size:13px;margin-bottom:20px;">' + have.length + '/' + ACH.length + ' · T — закрыть</div>';
  html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px;max-width:900px;margin:0 auto;">';
  for (const a of ACH) {
    const got = have.includes(a[0]);
    html += '<div style="border:1px solid ' + (got ? '#8a6a3a' : '#241a10') + ';border-radius:6px;background:' + (got ? 'rgba(240,201,106,0.07)' : 'rgba(0,0,0,0.4)') + ';padding:10px;">';
    html += '<div style="color:' + (got ? '#f0c96a' : '#3a2c1a') + ';font-family:Georgia,serif;font-size:13px;">' + (got ? '✅ ' : '🔒 ') + a[1] + '</div>';
    html += '<div style="color:' + (got ? '#9a8a70' : '#241a10') + ';font-family:Georgia,serif;font-size:11px;margin-top:4px;">' + a[2] + '</div></div>';
  }
  html += '</div>';
  ov.innerHTML = html;
}


