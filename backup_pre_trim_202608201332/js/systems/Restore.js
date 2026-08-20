const GREAT = [
  { name: 'Глиняный кувшин', shards: 5, emoji: '🏺' },
  { name: 'Цилиндрическая печать', shards: 4, emoji: '🧿' },
  { name: 'Табличка с письменами', shards: 5, emoji: '📜' },
  { name: 'Штандарт Ура', shards: 6, emoji: '🚩' },
  { name: 'Баран в зарослях', shards: 7, emoji: '🐏' },
  { name: 'Лира Ура', shards: 7, emoji: '🎼' },
];

export function initRestore(game) {
  let st = { i: 0, p: 0 };
  try { st = JSON.parse(localStorage.getItem('agur_restore') || '{"i":0,"p":0}'); } catch (e) {}

  const olc = game.levelComplete ? game.levelComplete.bind(game) : null;
  if (olc) game.levelComplete = (...a) => {
    const r = olc(...a);
    if (st.i < GREAT.length) {
      st.p++;
      if (st.p >= GREAT[st.i].shards) {
        if (game.showBanner) game.showBanner(GREAT[st.i].emoji + ' ' + GREAT[st.i].name + ' — РЕСТАВРИРОВАН');
        st.i++; st.p = 0;
      } else {
        if (game.showBanner) game.showBanner(GREAT[st.i].emoji + ' ' + st.p + '/' + GREAT[st.i].shards);
      }
      try { localStorage.setItem('agur_restore', JSON.stringify(st)); } catch (e) {}
    }
    return r;
  };
}
