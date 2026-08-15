import { CONFIG } from '../config.js';
import { PowerUp } from '../entities/PowerUp.js';

export const Collect = {
  spawnPowerUp(x, y) {
    const roll = Math.random() * 100;
    let type;
    if (roll < 34) type = 'WIDE';
    else if (roll < 68) type = 'FRAGMENT';
    else if (roll < 88) type = 'LIFE';
    else type = 'SLOW';
    this.powerUps.push(new PowerUp(x, y, type));
  },

  collectPowerUp(powerUp) {
    powerUp.apply(this);
    this.particles.powerupCollect(powerUp.x + powerUp.width / 2, powerUp.y + powerUp.height / 2, powerUp.config.color);
  },

  collectFragment(artifactId) {
    if (!this.museum) return;
    const art = CONFIG.ARTIFACTS.find(a => a.id === artifactId);
    if (!art) return;
    const completed = this.museum.addShard(artifactId);
    this.audio.fragment();
    if (completed) {
      this.showBanner('\u{1F3FA} Артефакт собран: ' + art.name + '!');
      this.effects.flash('#f0c96a', 0.3);
      this.audio.artifact();
    } else {
      this.showBanner('\u{1F9E9} Черепок: ' + art.name + ' (' + this.museum.data[artifactId] + '/' + art.shards + ')');
    }
    const cnt = document.getElementById('museumCount');
    if (cnt) cnt.textContent = this.museum.totalShards();
  },

  collectWord() {
    if (!this.museum || !this.museum.hasWord) return;
    if (!Array.isArray(CONFIG.WORDS) || CONFIG.WORDS.length === 0) return;
    const uncollected = CONFIG.WORDS.filter(w => !this.museum.hasWord(w.word));
    if (uncollected.length === 0) {
      this.addLife();
      this.showBanner('\u{1F4DC} Все слова собраны! +1 жизнь');
      return;
    }
    const w = uncollected[Math.floor(Math.random() * uncollected.length)];
    this.museum.addWord(w.word);
    this.audio.word();
    this.showBanner('\u{1F4DC} Слово Шумера: ' + w.word + ' — ' + w.meaning);
  },
};

