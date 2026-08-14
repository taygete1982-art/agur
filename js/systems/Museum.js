import { CONFIG } from '../config.js';

export class Museum {
  constructor() {
    this.storageKey = 'agur_museum';
    this.data = this.load();
    if (!Array.isArray(this.data.words)) this.data.words = [];
  }
  
  load() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    const d = {};
    for (const a of CONFIG.ARTIFACTS) d[a.id] = 0;
    return d;
  }
  
  save() {
    try { localStorage.setItem(this.storageKey, JSON.stringify(this.data)); } catch (e) {}
  }
  
  addShard(id) {
    const art = CONFIG.ARTIFACTS.find(a => a.id === id);
    if (!art || (this.data[id] || 0) >= art.shards) return false;
    this.data[id] = (this.data[id] || 0) + 1;
    this.save();
    return this.data[id] === art.shards;
  }
  
  randomIncompleteId() {
    const incomplete = CONFIG.ARTIFACTS.filter(a => (this.data[a.id] || 0) < a.shards);
    if (incomplete.length === 0) return null;
    return incomplete[Math.floor(Math.random() * incomplete.length)].id;
  }
  
  totalShards() {
    return Object.entries(this.data)
      .filter(([k, v]) => typeof v === 'number')
      .reduce((s, [, v]) => s + v, 0);
  }
  
  hasWord(w) { return (this.data.words || []).includes(w); }
  
  addWord(w) {
    if (this.hasWord(w)) return;
    this.data.words.push(w);
    this.save();
  }
  
  render() {
    const el = document.getElementById('museumContent');
    if (!el) return;
    el.innerHTML = CONFIG.ARTIFACTS.map(a => {
      const have = this.data[a.id] || 0;
      const done = have >= a.shards;
      const dots = '\u{25C6}'.repeat(have) + '\u{25C7}'.repeat(a.shards - have);
      return '<div class="artifact' + (done ? ' done' : '') + '">' +
        '<div class="artifact-emoji">' + (done ? a.emoji : '\u{1F9E9}') + '</div>' +
        '<div class="artifact-name">' + a.name + '</div>' +
        '<div class="artifact-progress">' + dots + '</div>' +
        '</div>';
    }).join('') + this.renderWords();
  }
  
  renderWords() {
    const words = this.data.words || [];
    const head = '<div class="museum-sub">Слова силы (' + words.length + '/' + CONFIG.WORDS.length + ') — собирай серии из 12 кирпичей</div>';
    if (words.length === 0) return head;
    return head + '<div class="museum-words">' + words.map(w => {
      const def = CONFIG.WORDS.find(x => x.word === w);
      return '<span class="word-chip">' + w + ' — ' + (def ? def.meaning : '') + '</span>';
    }).join('') + '</div>';
  }
}

