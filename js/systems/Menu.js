import { LEVEL_NAMES } from './Progression.js?v=202608210004';

export function initMenu(game) {
  const mk = (id, css) => {
    let ov = document.getElementById(id);
    if (!ov) {
      ov = document.createElement('div');
      ov.id = id;
      ov.style.cssText = 'position:fixed;inset:0;' + css + 'display:none;z-index:60;';
      document.body.appendChild(ov);
    }
    return ov;
  };
  const menuOv = mk('menuOverlay', 'background:radial-gradient(ellipse at 50% 30%, rgba(30,20,8,0.97), rgba(5,3,1,0.99));flex-direction:column;align-items:center;justify-content:center;gap:14px;');
  const mapOv = mk('mapOverlay', 'background:rgba(5,3,1,0.97);overflow-y:auto;padding:20px;box-sizing:border-box;');
  const legOv = mk('legendOverlay', 'background:rgba(5,3,1,0.96);overflow-y:auto;padding:20px;box-sizing:border-box;');
  const show = (ov, flex) => { ov.style.display = flex ? 'flex' : 'block'; };
  const hide = (ov) => { ov.style.display = 'none'; };

  window.__menu = {
    toMap: () => { hide(menuOv); renderMap(game, mapOv); show(mapOv, false); },
    back: () => { hide(mapOv); renderMenu(game, menuOv); show(menuOv, true); game.menuOpen = true; },
    play: (n) => {
      hide(mapOv); game.menuOpen = false;
      if ('paused' in game) game.paused = false;
      const m = ['startGame', 'start', 'newGame', 'begin', 'reset'].find(k => typeof game[k] === 'function');
      if (m) game[m]();
      else {
        window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' }));
        const cv = document.querySelector('canvas'); if (cv) cv.dispatchEvent(new MouseEvent('click'));
      }
      const lname = game.loadLevel ? 'loadLevel' : game.startLevel ? 'startLevel' : game.setLevel ? 'setLevel' : null;
      if (lname && n > 1) game[lname](n);
      if (!localStorage.getItem('agur_tut')) { renderLegend(game, legOv, true); show(legOv, false); }
    },
    legend: () => { hide(menuOv); renderLegend(game, legOv, false); show(legOv, false); },
    ach: () => { hide(menuOv); game.menuOpen = false; window.toggleAch && window.toggleAch(game); },
    reset: () => { if (confirm('Стереть ВСЮ прогрессию, титулы и рекорды?')) { ['agur_deck','agur_museum','agur_ach','agur_progress','agur_tut'].forEach(k => localStorage.removeItem(k)); location.reload(); } },
    closeLegend: () => { hide(legOv); try { localStorage.setItem('agur_tut', '1'); } catch (e) {} },
  };

  window.showMenu = () => { renderMenu(game, menuOv); show(menuOv, true); game.menuOpen = true; if ('paused' in game) game.paused = true; };

  window.addEventListener('keydown', (e) => {
    if (e.code === 'Escape') {
      if (legOv.style.display === 'block') { hide(legOv); return; }
      if (menuOv.style.display !== 'flex' && mapOv.style.display !== 'block') window.showMenu();
      return;
    }
    if (e.code === 'KeyH') { renderLegend(game, legOv, false); show(legOv, false); }
  });

  const og = game.gameOver ? game.gameOver.bind(game) : null;
  if (og) game.gameOver = (...a) => { const r = og(...a); setTimeout(() => { window.showMenu && window.showMenu(); }, 1400); return r; };

  renderMenu(game, menuOv);
  show(menuOv, true); game.menuOpen = true;
}

function renderMenu(game, ov) {
  let prog = { max: 1, best: 0 }; try { prog = JSON.parse(localStorage.getItem('agur_progress') || '{"max":1,"best":0}'); } catch (e) {}
  ov.innerHTML =
    '<div style="font-size:64px;color:#f0c96a;font-family:Georgia,serif;text-shadow:0 0 30px rgba(240,201,106,0.4);">АГУР</div>' +
    '<div style="color:#6a5a44;font-family:Georgia,serif;font-size:13px;margin-top:8px;">Рекорд: ' + prog.best + ' · Уровень: ' + prog.max + (window.__title ? ' · «' + window.__title() + '»' : '') + '</div>' +
    '<button onclick="__menu.toMap()" style="margin-top:18px;background:linear-gradient(#f0c96a,#c9a24a);border:none;padding:14px 46px;font-family:Georgia,serif;font-size:18px;color:#1a1410;cursor:pointer;border-radius:6px;letter-spacing:2px;">🗺 НАЧАТЬ ПУТЬ</button>' +
    '<div style="display:flex;gap:10px;margin-top:6px;">' +
    '<button onclick="__menu.legend()" style="background:transparent;border:1px solid #8a6a3a;padding:8px 18px;font-family:Georgia,serif;font-size:13px;color:#f0c96a;cursor:pointer;border-radius:6px;">📜 Как играть</button>' +
    '<button onclick="__menu.reset()" style="background:transparent;border:1px solid #5a2a2a;padding:8px 18px;font-family:Georgia,serif;font-size:13px;color:#a06060;cursor:pointer;border-radius:6px;">♻ Сброс</button>' +
    '<button onclick="__menu.ach()" style="background:transparent;border:1px solid #8a6a3a;padding:8px 18px;font-family:Georgia,serif;font-size:13px;color:#f0c96a;cursor:pointer;border-radius:6px;">🏆 Титулы</button>' +
    '</div>';
}

function renderMap(game, ov) {
  let prog = { max: 1, best: 0 }; try { prog = JSON.parse(localStorage.getItem('agur_progress') || '{"max":1,"best":0}'); } catch (e) {}
  const total = Math.min(Math.ceil(Math.max(12, prog.max) / 12) * 12, 36);
  let html = '<h2 style="color:#f0c96a;text-align:center;font-family:Georgia,serif;margin:20px 0;">🗺 Карта Судеб</h2>';
  html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:12px;max-width:900px;margin:0 auto;">';
  for (let n = 1; n <= total; n++) {
    const locked = n > prog.max;
    const name = LEVEL_NAMES[(n - 1) % LEVEL_NAMES.length] + (n > 12 ? ' · круг ' + Math.ceil(n / 12) : '');
    html += '<div onclick="' + (locked ? '' : '__menu.play(' + n + ')') + '" style="border:2px solid ' + (locked ? '#241a10' : '#8a6a3a') + ';border-radius:10px;background:' + (locked ? 'rgba(0,0,0,0.5)' : 'radial-gradient(circle at 50% 35%, #3a2c14, #171008)') + ';padding:14px 8px;text-align:center;cursor:' + (locked ? 'default' : 'pointer') + ';box-shadow:' + (locked ? 'none' : '0 0 14px rgba(240,201,106,0.15)') + ';">';
    html += '<div style="font-size:22px;">' + (locked ? '🔒' : '𒀭') + '</div>';
    html += '<div style="color:' + (locked ? '#3a2c1a' : '#f0c96a') + ';font-family:Georgia,serif;font-size:16px;margin-top:4px;">' + n + '</div>';
    html += '<div style="color:' + (locked ? '#241a10' : '#9a8a70') + ';font-family:Georgia,serif;font-size:10px;margin-top:2px;">' + name + '</div></div>';
  }
  html += '</div>';
  html += '<div style="text-align:center;margin:24px 0;"><button onclick="__menu.back()" style="background:transparent;border:1px solid #8a6a3a;padding:10px 30px;font-family:Georgia,serif;font-size:14px;color:#f0c96a;cursor:pointer;border-radius:6px;">← Назад</button></div>';
  ov.innerHTML = html;
}

function renderLegend(game, ov, first) {
  const row = (icon, name, desc, color) => '<div style="display:flex;align-items:center;gap:14px;max-width:600px;margin:0 auto 12px;background:rgba(240,201,106,0.05);border:1px solid #2a2010;border-radius:8px;padding:10px 14px;">' +
    '<div style="font-size:30px;min-width:40px;text-align:center;filter:drop-shadow(0 0 6px ' + color + ');">' + icon + '</div>' +
    '<div><div style="color:' + color + ';font-family:Georgia,serif;font-size:14px;">' + name + '</div>' +
    '<div style="color:#9a8a70;font-family:Georgia,serif;font-size:12px;">' + desc + '</div></div></div>';
  let html = '<h2 style="color:#f0c96a;text-align:center;font-family:Georgia,serif;margin:20px 0;">📜 Как играть</h2>';
  html += '<p style="color:#9a8a70;text-align:center;font-family:Georgia,serif;font-size:14px;max-width:600px;margin:0 auto 20px;">' + (first ? 'Добро пожаловать в Шумер! Отбивай мяч платформой и разбивай кирпичи. С неба падают круглые печати — лови их:' : 'Отбивай мяч, разбивай кирпичи, лови круглые печати:') + '</p>';
  html += row('↔', 'Широкая платформа', 'платформа становится шире — легче отбивать мяч', '#7dd3fc');
  html += row('❤', 'Жизнь', '+1 жизнь к твоим силам', '#fca5a5');
  html += row('', 'Знак клинописи', 'лови знаки и собирай их в слова — собранное слово даёт награду', '#f8fafc');
  html += '<div style="max-width:600px;margin:18px auto;background:rgba(0,0,0,0.3);border:1px solid #2a2010;border-radius:8px;padding:12px 16px;color:#9a8a70;font-family:Georgia,serif;font-size:12px;line-height:1.7;">' +
    '<b style="color:#e8c98a;">Слова</b> — клинописные надписи на поле, собирай их из знаков.</div>';
  html += '<div style="text-align:center;margin:24px 0;"><button onclick="__menu.closeLegend()" style="background:linear-gradient(#f0c96a,#c9a24a);border:none;padding:12px 40px;font-family:Georgia,serif;font-size:16px;color:#1a1410;cursor:pointer;border-radius:6px;">Понятно</button></div>';
  ov.innerHTML = html;
}
