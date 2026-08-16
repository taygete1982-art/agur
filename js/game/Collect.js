import { CONFIG } from '../config.js';
import { PowerUp } from '../entities/PowerUp.js';

export const Collect = {
  spawnPowerUp(x, y) {
    const roll = Math.random() * 100;
    let type;
    if (roll < 25) type = 'WIDE';
    else if (roll < 50) type = 'FRAGMENT';
    else if (roll < 60) type = 'LIFE';
    else if (roll < 68) type = 'SLOW';
    else if (roll < 80) type = 'MULTI';
    else if (roll < 92) type = 'LASE';
    else type = 'CATCH';
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

  // === Трио: мультибол / лазер / кэтч ===
spawnMultiBall() {
    if (!this.balls || this.balls.length === 0) return;
    const source = this.balls[0];
    const baseAngle = Math.atan2(source.dy, source.dx);
    for (let i = -1; i <= 1; i += 2) {
      const a = baseAngle + i * 0.52;
      const b = new Ball(source.x, source.y);
      b.isLaunched = true;
      b.speed = source.speed;
      b.dx = Math.cos(a) * b.speed;
      b.dy = Math.sin(a) * b.speed;
      this.balls.push(b);
    }
    this.showBanner('✶ ТРИ БОГА');
  },



  fireLaser() {
    this.lasers.push({ x: this.paddle.x + 6, y: this.paddle.y - 4, vy: 12 });
    this.lasers.push({ x: this.paddle.x + this.paddle.width - 6, y: this.paddle.y - 4, vy: 12 });
    this.audio.crack && this.audio.crack();
  },

  releaseBall(b) {
    const off = b.caughtOffset - this.paddle.width / 2;
    const angle = -Math.PI / 2 + (off / (this.paddle.width / 2)) * 0.9;
    b.dx = Math.cos(angle) * b.speed;
    b.dy = Math.sin(angle) * b.speed;
    b.isLaunched = true;
    this.audio.launch && this.audio.launch();
  },

  handlePaddleTap() {
    for (const b of this.balls) {
      if (b.caught) { this.releaseBall(b); b.caught = false; return; }
    }
    if (this.laserTimer > 0) { this.fireLaser(); this.laserCooldown = 18; }
  },
};

