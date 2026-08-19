import { CONFIG } from '../config.js?v=202608192003';
import { PowerUp } from '../entities/PowerUp.js?v=202608192003';
import { Ball } from '../entities/Ball.js?v=202608192003';
import { CARDS } from '../systems/Cards.js?v=202608192003';

export const Collect = {
  deckHas(id) { return Array.isArray(this.deck) && this.deck.includes(id); },

  setDeckMods() {
    let mul = 1;
    if (this.deckHas('AB2')) mul += 0.10;
    if (this.deckHas('PUABI')) mul += 0.15;
    if (this.deckHas('UG')) mul += 0.10;
    this.deckScoreMul = mul;
  },

  spawnPowerUp(x, y, force) {
    this.noDrop = 0;
    if (!force) {
      if (this.powerUps.length >= 4) return;
      const now = Date.now();
      if (this.lastDrop && now - this.lastDrop < 1100) return;
      this.lastDrop = now;
    }
    const luck = ((this.buffs && this.buffs.luck) || 0) + (this.biomeLuck || 0);
    const cardChance = (this.deckHas('UR') ? 0.06 : 0.035) + luck * 0.006;
    if (Math.random() < cardChance && CARDS.some(c => !this.deckHas(c.id))) {
      this.powerUps.push(new PowerUp(x, y, 'CARD'));
      return;
    }
    const roll = Math.random() * 100;
    let type;
    if (roll < 38 + luck * 2) type = 'FRAGMENT';
    else if (roll < 62) type = 'WIDE';
    else if (roll < 78) type = 'LIFE';
    else type = 'WIDE';
    this.powerUps.push(new PowerUp(x, y, type));
  },

  collectPowerUp(powerUp) {
    powerUp.apply(this);
    this.particles.powerupCollect(powerUp.x + powerUp.width / 2, powerUp.y + powerUp.height / 2, powerUp.config.color);
  },

  collectCard() {
    const left = CARDS.filter(c => !this.deckHas(c.id));
    if (!left.length) { this.score += 100; this.showBanner('🃏 Колода полна! +100'); return; }
    const card = left[Math.floor(Math.random() * left.length)];
    this.deck = this.deck || [];
    this.deck.push(card.id);
    try { localStorage.setItem('agur_deck', JSON.stringify(this.deck)); } catch (e) {}
    this.setDeckMods();
    this.score += 150;
    this.effects.flash('#e8c98a', 0.2);
    if (card.suit === 'ice') { this.applySlowEffect(); this.freezeDemons = 240; this.showBanner('❄ ' + card.name + '!'); }
    else if (card.suit === 'fire') { this.castMeteor(); this.showBanner('🔥 ' + card.name + '!'); }
    else if (card.suit === 'water') { if (this.applyWideEffect) this.applyWideEffect(); this.score += 50; this.showBanner('💧 ' + card.name + '! +50'); }
    else if (card.suit === 'storm') { this.castStorm(); this.showBanner('⚡ ' + card.name + '!'); }
    else if (card.suit === 'star') { this.score += 500; this.effects.flash('#fde047', 0.25); this.showBanner('✦ ' + card.name + '! +500'); }
    else if (card.suit === 'dark') { this.freezeDemons = 300; this.effects.flash('#14532d', 0.3); this.showBanner('🌑 ' + card.name + '!'); }
    else this.showBanner('🃏 ' + card.name + '! +150');
    if (this.audio && this.audio.powerupGet) this.audio.powerupGet();
  },

  castMeteor() {
    const alive = this.bricks.filter(b => b.alive && !b.isBreaking && !b.isSteel);
    if (!alive.length) return;
    const center = alive[Math.floor(Math.random() * alive.length)];
    let n = 0;
    for (const b of this.bricks) {
      if (n >= 6) break;
      if (!b.alive || b.isSteel) continue;
      if (Math.abs(b.row - center.row) <= 1 && Math.abs(b.col - center.col) <= 1) {
        this.effects.bolt(center.x + center.width / 2, 0, b.x + b.width / 2, b.y + b.height / 2);
        if (b.takeDamage()) this.destroyBrick(b);
        n++;
      }
    }
    this.effects.flash('#f97316', 0.2);
    this.shakeIntensity = Math.max(this.shakeIntensity, 10);
  },

  castStorm() {
    const alive = this.bricks.filter(b => b.alive && !b.isSteel);
    let n = 0;
    while (n < 8 && alive.length) {
      const b = alive.splice(Math.floor(Math.random() * alive.length), 1)[0];
      if (this.effects && this.effects.bolt) this.effects.bolt(b.x + b.width / 2, 0, b.x + b.width / 2, b.y + b.height / 2);
      if (b.takeDamage()) this.destroyBrick(b);
      n++;
    }
    if (this.effects && this.effects.flash) this.effects.flash('#a5f3fc', 0.2);
    this.shakeIntensity = Math.max(this.shakeIntensity || 0, 12);
  },

  spawnMultiBall() {
    return; // мультибол отключён, один мяч
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

  releaseBall(b) {
    const off = b.caughtOffset - this.paddle.width / 2;
    const angle = -Math.PI / 2 + (off / (this.paddle.width / 2)) * 0.9;
    b.dx = Math.cos(angle) * b.speed;
    b.dy = Math.sin(angle) * b.speed;
    b.isLaunched = true;
  },

  handlePaddleTap() {
    for (const b of this.balls) {
      if (b.caught) { this.releaseBall(b); b.caught = false; return; }
    }
  },

  initWords() {
    this.WORDS = [
      { name: 'E2-GAL', meaning: 'дворец', signs: [{ c: '𒂍', t: 'E2' }, { c: '𒃲', t: 'GAL' }] },
      { name: 'LU-GAL', meaning: 'царь', signs: [{ c: '𒇻', t: 'LU' }, { c: '𒃲', t: 'GAL' }] },
      { name: 'AN-KI', meaning: 'вселенная', signs: [{ c: '𒀭', t: 'AN' }, { c: '𒆠', t: 'KI' }] },
      { name: 'A-AB', meaning: 'море', signs: [{ c: '𒀀', t: 'A' }, { c: '𒀊', t: 'AB' }] },
    ];
    this.wordIdx = 0;
    this.wordGot = [];
  },

  collectWord() {
    if (!this.WORDS) this.initWords();
    const w = this.WORDS[this.wordIdx % this.WORDS.length];
    const need = w.signs.filter(s => !(this.wordGot || []).includes(s.t));
    const pool = need.length && Math.random() < 0.7 ? need : this.WORDS.flatMap(x => x.signs);
    const sign = pool[Math.floor(Math.random() * pool.length)];
    this.powerUps.push(new PowerUp(60 + Math.random() * (CONFIG.WIDTH - 120), 40, 'SIGN', sign));
  },

  collectSign(sign) {
    if (!this.WORDS) this.initWords();
    const w = this.WORDS[this.wordIdx % this.WORDS.length];
    const inWord = w.signs.some(s => s.t === sign.t);
    if (inWord && !(this.wordGot || []).includes(sign.t)) {
      this.wordGot = this.wordGot || [];
      this.wordGot.push(sign.t);
      this.score += 50;
      this.showBanner(sign.c + ' ' + sign.t);
      const left = w.signs.filter(s => !this.wordGot.includes(s.t));
      if (left.length === 0) {
        this.score += 500;
        this.showBanner('𒁾 ' + w.name + ' — ' + w.meaning + '! +500');
        this.effects.flash('#e8c98a', 0.25);
        this.wordIdx++;
        this.wordGot = [];
      }
    } else {
      this.score += 25;
      this.showBanner(sign.c + ' ' + sign.t + ' +25');
    }
  },
};

















