export const CARDS = [
  { id: 'ICE_WORD', suit: 'ice', name: 'Слово Льда', glyph: '𒀭' },
  { id: 'ICE_BULL', suit: 'ice', name: 'Ледяной Бык', glyph: '❄' },
  { id: 'ICE_SEAL', suit: 'ice', name: 'Печать Зимы', glyph: '❅' },
  { id: 'ICE_TEMPLE', suit: 'ice', name: 'Ледяной Храм', glyph: '𒂍' },
  { id: 'ICE_HARP', suit: 'ice', name: 'Замёрзшая Арфа', glyph: '♪' },
  { id: 'FIRE_WORD', suit: 'fire', name: 'Слово Огня', glyph: '𒌋' },
  { id: 'FIRE_KILN', suit: 'fire', name: 'Гончарная Печь', glyph: '🔥' },
  { id: 'FIRE_FORGE', suit: 'fire', name: 'Кузня Загроса', glyph: '⚒' },
  { id: 'FIRE_HEARTH', suit: 'fire', name: 'Очаг', glyph: '🏠' },
  { id: 'FIRE_STAR', suit: 'fire', name: 'Падающая Звезда', glyph: '✦' },
  { id: 'UDU', suit: 'beast', name: 'UDU — Баран', glyph: '🐏' },
  { id: 'UG', suit: 'beast', name: 'UG — Лев', glyph: '🦁' },
  { id: 'MUS', suit: 'beast', name: 'MUS — Змей', glyph: '🐍' },
  { id: 'KU6', suit: 'beast', name: 'KU6 — Рыба', glyph: '🐟' },
  { id: 'GIR_TAB', suit: 'beast', name: 'GIR-TAB — Скорпион', glyph: '🦂' },
  { id: 'AB2', suit: 'beast', name: 'AB2 — Корова', glyph: '🐄' },
  { id: 'TIR', suit: 'beast', name: 'TIR — Ласточка', glyph: '🕊' },
  { id: 'PUABI', suit: 'dead', name: 'Венец Пуаби', glyph: '👑' },
  { id: 'CUP', suit: 'dead', name: 'Кубок подношений', glyph: '🏆' },
  { id: 'NAM_TAR', suit: 'dead', name: 'Табличка судеб', glyph: '' },
  { id: 'GALLA', suit: 'dead', name: 'Печать галла', glyph: '💀' },
  { id: 'UR', suit: 'dead', name: 'Царская игра Ура', glyph: '🎲' },
  { id: 'WATER_WORD', suit: 'water', name: 'Слово Воды', glyph: '𒀀' },
  { id: 'WATER_EUFRAT', suit: 'water', name: 'Евфрат', glyph: '≈' },
  { id: 'WATER_TIGR', suit: 'water', name: 'Тигр', glyph: '≋' },
  { id: 'WATER_FLOOD', suit: 'water', name: 'Потоп (Аба)', glyph: '🌊' },
  { id: 'WATER_CANAL', suit: 'water', name: 'Канал Энки', glyph: '💧' },
  { id: 'STORM_WORD', suit: 'storm', name: 'Слово Бури', glyph: '⚡' },
  { id: 'STORM_ADAD', suit: 'storm', name: 'Адад, всадник бури', glyph: '🌩' },
  { id: 'STORM_THUNDER', suit: 'storm', name: 'Гром', glyph: '☁' },
  { id: 'STORM_BOLT', suit: 'storm', name: 'Молния', glyph: '✧' },
  { id: 'STORM_WHIRL', suit: 'storm', name: 'Вихрь', glyph: '🌀' },
  { id: 'STAR_WORD', suit: 'star', name: 'Слово Звезды', glyph: '✦' },
  { id: 'STAR_ISHTAR', suit: 'star', name: 'Звезда Иштар (Венера)', glyph: '★' },
  { id: 'STAR_MULMUL', suit: 'star', name: 'MUL.MUL (Плеяды)', glyph: '✶' },
  { id: 'STAR_MOON', suit: 'star', name: 'Путь Луны', glyph: '☾' },
  { id: 'STAR_ZODIAC', suit: 'star', name: 'Зодиак', glyph: '✷' },
  { id: 'DARK_WORD', suit: 'dark', name: 'Слово Тьмы', glyph: '🌑' },
  { id: 'DARK_KUR', suit: 'dark', name: 'Кур, Нижний Мир', glyph: '🕳' },
  { id: 'DARK_ERESH', suit: 'dark', name: 'Эрешкигаль', glyph: '🌘' },
  { id: 'DARK_DOG', suit: 'dark', name: 'Чёрный пёс Кур', glyph: '🐕' },
  { id: 'DARK_ECLIPSE', suit: 'dark', name: 'Затмение', glyph: '🌒' },
];

const SUIT_COLORS = { ice: '#7dd3fc', fire: '#fca5a5', beast: '#fcd34d', dead: '#a3a3a3', water: '#67e8f9', storm: '#d8b4fe', star: '#f8fafc', dark: '#86efac' };
const SUIT_BORDERS = { ice: '#3b82f6', fire: '#dc2626', beast: '#ca8a04', dead: '#737373', water: '#0891b2', storm: '#7c3aed', star: '#e2e8f0', dark: '#15803d' };

function suitEmoji(s) { return s === 'ice' ? '❄' : s === 'fire' ? '🔥' : s === 'beast' ? '🐂' : s === 'dead' ? '💀' : s === 'water' ? '💧' : s === 'storm' ? '⚡' : s === 'star' ? '✦' : '🌑'; }

export function initDeck(game) {
  try { game.deck = JSON.parse(localStorage.getItem('agur_deck') || '[]'); } catch (e) { game.deck = []; }
  if (game.setDeckMods) game.setDeckMods();
  let ov = document.getElementById('deckOverlay');
  if (!ov) {
    ov = document.createElement('div');
    ov.id = 'deckOverlay';
    ov.style.cssText = 'position:fixed;inset:0;background:rgba(5,3,1,0.96);display:none;overflow-y:auto;z-index:50;padding:20px;box-sizing:border-box;';
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
  let html = '<h2 style="color:#f0c96a;text-align:center;font-family:Georgia,serif;margin:20px 0;">𒁹 Колода Судеб (' + game.deck.length + '/' + CARDS.length + ')</h2>';
  html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:14px;max-width:1000px;margin:0 auto;">';
  for (const c of CARDS) {
    const has = game.deckHas(c.id);
    const color = SUIT_COLORS[c.suit];
    const border = SUIT_BORDERS[c.suit];
    html += '<div style="aspect-ratio:2/3;border:2px solid ' + (has ? border : '#2a2010') + ';border-radius:8px;background:' + (has ? 'linear-gradient(145deg,#1a1410,#0a0604)' : 'rgba(0,0,0,0.5)') + ';padding:10px;box-sizing:border-box;display:flex;flex-direction:column;align-items:center;justify-content:center;position:relative;box-shadow:' + (has ? '0 4px 20px rgba(240,201,106,0.15)' : 'none') + ';">';
    if (has) {
      html += '<div style="position:absolute;top:6px;left:0;right:0;text-align:center;font-size:9px;color:#f0c96a;letter-spacing:1px;font-family:serif;opacity:0.6;">𒀭  𒀭</div>';
      html += '<div style="font-size:56px;line-height:1;margin:10px 0;filter:drop-shadow(0 0 8px ' + color + ');">' + c.glyph + '</div>';
      html += '<div style="color:' + color + ';font-family:Georgia,serif;font-size:11px;text-align:center;margin-top:auto;letter-spacing:0.5px;">' + c.name + '</div>';
      html += '<div style="position:absolute;bottom:6px;left:0;right:0;text-align:center;font-size:9px;color:#f0c96a;letter-spacing:1px;font-family:serif;opacity:0.6;">𒀭 𒀭 𒀭</div>';
    } else {
      html += '<div style="font-size:48px;opacity:0.2;filter:grayscale(1);">' + c.glyph + '</div>';
      html += '<div style="color:#4a3a24;font-family:Georgia,serif;font-size:11px;margin-top:8px;">???</div>';
    }
    html += '</div>';
  }
  html += '</div><p style="color:#6a5a44;text-align:center;font-family:Georgia,serif;margin:30px 0;font-size:14px;">Клик или C — закрыть коллекцию</p>';
  ov.innerHTML = html;
}
