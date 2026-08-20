import { CONFIG } from '../config.js?v=202608201443';

export class Museum {
  constructor() {
    this.storageKey = 'agur_museum_v2';
    this.data = this.load();
    if (!this.data.collected) this.data.collected = {};
    if (!this.data.relics) this.data.relics = {};
    if (!Array.isArray(this.data.words)) this.data.words = [];
    this.catalog = this.buildCatalog();
  }

  load() { try { return JSON.parse(localStorage.getItem(this.storageKey)) || {}; } catch (e) { return {}; } }
  save() { try { localStorage.setItem(this.storageKey, JSON.stringify(this.data)); } catch (e) {} }

  buildCatalog() {
    const list = [];
    for (const f of CONFIG.ARTIFACT_FORMS)
      for (const mat of CONFIG.ARTIFACT_MATERIALS)
        for (const q of CONFIG.ARTIFACT_QUALITIES)
          list.push({
            id: f.id + '_' + mat.id + '_' + q.id,
            name: mat.name + ' ' + f.name + (q.id !== 'common' ? ' (' + q.name + ')' : ''),
            form: f, material: mat, quality: q
          });
    return list;
  }

  byId(id) { return this.catalog.find(a => a.id === id); }
  has(id) { return !!this.data.collected[id]; }
  add(id) { if (this.has(id)) return false; this.data.collected[id] = 1; this.save(); return true; }
  count() { return Object.keys(this.data.collected).length; }

  rollDrop() {
    const r = Math.random();
    const qid = r < 0.05 ? 'legendary' : (r < 0.30 ? 'rare' : 'common');
    let pool = this.catalog.filter(a => a.quality.id === qid && !this.has(a.id));
    if (pool.length === 0) pool = this.catalog.filter(a => !this.has(a.id));
    if (pool.length === 0) return null;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  hasWord(w) { return this.data.words.includes(w); }
  addWord(w) { if (this.hasWord(w)) return; this.data.words.push(w); this.save(); }
  addRelic(id) { if (this.data.relics[id]) return; this.data.relics[id] = 1; this.save(); }

  render() {
    const el = document.getElementById('museumContent');
    if (!el) return;
    const words = this.data.words.map(w => {
      const def = (CONFIG.WORDS || []).find(x => x.word === w);
      return '<span class="word-chip">' + w + ' — ' + (def ? def.meaning : '') + '</span>';
    }).join('');

    const relics = CONFIG.RELICS.map(r =>
      '<div class="slot relic ' + (this.data.relics[r.id] ? 'got' : 'empty') + '" title="' + r.name + ' (даёт босс)">' + r.emoji + '</div>'
    ).join('');

    const grid = this.catalog.map(a =>
      '<div class="slot q-' + a.quality.id + (this.has(a.id) ? ' got' : ' empty') + '" title="' + a.name + '">' + a.form.emoji + '</div>'
    ).join('');

    el.innerHTML =
      '<h3>\u{1F3FA} Музей Шумера — ' + this.count() + '/' + this.catalog.length + '</h3>' +
      '<div class="museum-sub">Реликвии биомов:</div><div class="museum-grid relics">' + relics + '</div>' +
      '<div class="museum-sub">Слова силы (' + this.data.words.length + '/' + (CONFIG.WORDS || []).length + '):</div>' +
      '<div class="museum-words">' + (words || '<span class="word-chip">комбо ×12 даёт слово</span>') + '</div>' +
      '<div class="museum-sub">Коллекция артефактов:</div><div class="museum-grid">' + grid + '</div>';
  }
}








