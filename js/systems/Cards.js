export const CARDS = [
  { id: 'ICE_WORD', suit: 'ice', name: 'Слово Льда' },
  { id: 'ICE_BULL', suit: 'ice', name: 'Ледяной Бык' },
  { id: 'ICE_SEAL', suit: 'ice', name: 'Печать Зимы' },
  { id: 'ICE_TEMPLE', suit: 'ice', name: 'Ледяной Храм' },
  { id: 'ICE_HARP', suit: 'ice', name: 'Замёрзшая Арфа' },
  { id: 'FIRE_WORD', suit: 'fire', name: 'Слово Огня' },
  { id: 'FIRE_KILN', suit: 'fire', name: 'Гончарная Печь' },
  { id: 'FIRE_FORGE', suit: 'fire', name: 'Кузня Загроса' },
  { id: 'FIRE_HEARTH', suit: 'fire', name: 'Очаг' },
  { id: 'FIRE_STAR', suit: 'fire', name: 'Падающая Звезда' },
  { id: 'UDU', suit: 'beast', name: 'UDU — Баран' },
  { id: 'UG', suit: 'beast', name: 'UG — Лев' },
  { id: 'MUS', suit: 'beast', name: 'MUS — Змей' },
  { id: 'KU6', suit: 'beast', name: 'KU6 — Рыба' },
  { id: 'GIR_TAB', suit: 'beast', name: 'GIR-TAB — Скорпион' },
  { id: 'AB2', suit: 'beast', name: 'AB2 — Корова' },
  { id: 'TIR', suit: 'beast', name: 'TIR — Ласточка' },
  { id: 'PUABI', suit: 'dead', name: 'Венец Пуаби' },
  { id: 'CUP', suit: 'dead', name: 'Кубок подношений' },
  { id: 'NAM_TAR', suit: 'dead', name: 'Табличка судеб' },
  { id: 'GALLA', suit: 'dead', name: 'Печать галла' },
  { id: 'UR', suit: 'dead', name: 'Царская игра Ура' },
];

function suitEmoji(s) { return s === 'ice' ? '❄' : s === 'fire' ? '🔥' : s === 'beast' ? '🐂' : '💀'; }

export function initDeck(game) {
  try { game.deck = JSON.parse(localStorage.getItem('agur_deck') || '[]'); } catch (e) { game.deck = []; }
  if (game.setDeckMods) game.setDeckMods();
  let ov = document.getElementById('deckOverlay');
  if (!ov) {
    ov = document.createElement('div');
    ov.id = 'deckOverlay';
    ov.style.cssText = 'position:fixed;inset:0;background:rgba(10,6,3,0.94);display:none;overflow-y:auto;z-index:50;padding:20px;box-sizing:border-box;';
    ov.addEventListener('click', () => { ov.style.display = 'none'; game.museumOpen = false; });
    document.body.appendChild(ov);
  }
  window.toggleDeck = (g) => {
    g.museumOpen = ov.style.display !== 'flex';
    ov.style.display = g.museumOpen ? 'flex' : 'none';
    if (g.museumOpen) renderDeck(g);
  };
}

export function renderDeck(game) {
  const ov = document.getElementById('deckOverlay');
  let html = '<h2 style="color:#f0c96a;text-align:center;font-family:sans-serif;">🃏 Колода Судеб (' + game.deck.length + '/' + CARDS.length + ')</h2>';
  html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px;max-width:960px;margin:0 auto;">';
  for (const c of CARDS) {
    const has = game.deckHas(c.id);
    html += '<div style="border:2px solid ' + (has ? '#f0c96a' : '#3a2a1a') + ';border-radius:10px;padding:8px;background:' + (has ? 'rgba(240,201,106,0.08)' : 'rgba(0,0,0,0.4)') + ';text-align:center;">';
    if (has) {
      html += '<img src="assets/cards/' + c.id + '.png" data-fb="' + suitEmoji(c.suit) + '" style="width:100%;border-radius:6px;display:block;">';
    } else {
      html += '<div style="font-size:34px;padding:18px 0;filter:grayscale(1);opacity:0.35;">' + suitEmoji(c.suit) + '</div>';
    }
    html += '<div style="color:' + (has ? '#fff' : '#6a5a44') + ';font-family:sans-serif;font-size:13px;margin-top:6px;">' + c.name + '</div>';
    html += '</div>';
  }
  html += '</div><p style="color:#a8845c;text-align:center;font-family:sans-serif;">Клик или C — закрыть</p>';
  ov.innerHTML = html;
  ov.querySelectorAll('img').forEach(im => {
    im.addEventListener('error', () => {
      const d = document.createElement('div');
      d.style.cssText = 'font-size:34px;padding:18px 0;';
      d.textContent = im.getAttribute('data-fb');
      im.replaceWith(d);
    });
  });
}
