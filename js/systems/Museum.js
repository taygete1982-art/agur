import { CONFIG } from '../config.js';

export class Museum {
  constructor() {
    this.data = this.load();
    if (!Array.isArray(this.data.words)) this.data.words = [];
    if (!this.data.relics) this.data.relics = {};
    if (!this.data.collected) this.data.collected = {};
    this.catalog = this.buildCatalog();
  }
  
  load() { try { return JSON.parse(localStorage.getItem('agur_museum')) || {}; } catch (e) { return {}; } }
  save() { try { localStorage.setItem('agur_museum', JSON.stringify(this.data)); } catch (e) {} }
  
  buildCatalog() {
    const list = [];
    for (const f of CONFIG.ARTIFACT_FORMS)
      for (const m of CONFIG.ARTIFACT_MATERIALS)
        for (const q of CONFIG.ARTIFACT_QUALITIES)
          list.push({
            id: f.id + '_' + m.id + '_' + q.id,
            name: m.name + ' ' + f.name + (q.id !== 'common' ? ' (' + q.name + ')' : ''),
            form: f, material: m, quality: q
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
    const pool = this.catalog.filter(a => a.quality.id === qid && !this.has(a.id));
    if (pool.length === 0) return null;
    return pool[Math.floor(Math.random() * pool.length)];
  }
  
  hasWord(w) { return this.data.words.includes(w); }
  addWord(w) { if (this.hasWord(w)) return; this.data.words.push(w); this.save(); }
  addRelic(id) { if (this.data.relics[id]) return; this.data.relics[id] = 1; this.save(); }
  
  totalShards() { return this.count(); }
  
  render() {
    const el = document.getElementById('museumContent');
    if (!el) return;
    const words = this.data.words.map(w => {
      const def = (CONFIG.WORDS || []).find(x => x.word === w);
      return '<span class="word-chip">' + w + ' — ' + (def ? def.meaning : '') + '</span>';
    }).join('');
    
    const relics = CONFIG.RELICS.map(r =>
      '<div class="slot relic ' + (this.data.relics[r.id] ? 'got' : 'empty') + '" title="' + r.name + '">' + r.emoji + '</div>'
    ).join('');
    
    const grid = this.catalog.map(a =>
      '<div class="slot q-' + a.quality.id + (this.has(a.id) ? ' got' : ' empty') + '" title="' + a.name + '">' + a.form.emoji + '</div>'
    ).join('');
    
    el.innerHTML =
      '<h3>\u{1F3FA} Музей Шумера — ' + this.count() + '/' + this.catalog.length + '</h3>' +
      '<div class="museum-sub">Реликвии биомов (даёт босс 11-го уровня):</div>' +
      '<div class="museum-grid relics">' + relics + '</div>' +
      '<div class="museum-sub">Слова силы (' + this.data.words.length + '/' + (CONFIG.WORDS || []).length + ') — комбо ×12:</div>' +
      '<div class="museum-words">' + (words || '<span class="word-chip">пока пусто</span>') + '</div>' +
      '<div class="museum-sub">Коллекция артефактов:</div>' +
      '<div class="museum-grid">' + grid + '</div>';
  }
}
