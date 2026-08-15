export class AudioManager {
  constructor() {
    this.context = null;
    this.enabled = true;
    try { this.enabled = localStorage.getItem('agur_mute') !== '1'; } catch (e) {}
    this.volume = 0.35;
    this.initialized = false;
    this.buffers = {};
    this.musicOn = false;
    this.nextNoteTime = 0;
    this._gestureUnlocked = false;

    // Только отмечаем что жест был. AudioContext создадим при ПЕРВОМ звуке.
    const unlock = () => {
      if (this._gestureUnlocked) return;
      this._gestureUnlocked = true;
    };
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('touchstart', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
  }

  ensureContext() {
    if (this.initialized) return true;
    if (!this._gestureUnlocked) return false;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) { this.enabled = false; return false; }
      this.context = new Ctx();
      this.master = this.context.createGain();
      this.master.gain.value = this.enabled ? this.volume : 0;
      const comp = this.context.createDynamicsCompressor();
      this.master.connect(comp);
      comp.connect(this.context.destination);
      this.initialized = true;
      this.loadSounds();
      this.startMusic();
      return true;
    } catch (e) {
      this.enabled = false;
      return false;
    }
  }

  async loadSounds() {
    const names = ['paddle-hit','wall-hit','brick-hit','brick-break','powerup-get','life-lost','level-complete','game-over','ui-click','laser'];
    for (const n of names) {
      try {
        const res = await fetch('assets/audio/' + n + '.ogg');
        if (!res.ok) continue;
        const arr = await res.arrayBuffer();
        this.buffers[n] = await this.context.decodeAudioData(arr);
      } catch (e) {}
    }
  }

  play(name, rate = 1, vol = 1) {
    if (!this.enabled || !this.ensureContext()) return false;
    const buf = this.buffers[name];
    if (!buf) return false;
    try {
      const src = this.context.createBufferSource();
      src.buffer = buf;
      src.playbackRate.value = rate;
      const g = this.context.createGain();
      g.gain.value = vol;
      src.connect(g); g.connect(this.master);
      src.start();
      return true;
    } catch (e) { return false; }
  }

  toggle() {
    this.enabled = !this.enabled;
    if (this.master) this.master.gain.value = this.enabled ? this.volume : 0;
    return this.enabled;
  }

  _tone(freq, dur = 0.1, type = 'square', vol = 0.5, sweepTo = null) {
    if (!this.enabled || !this.ensureContext()) return;
    const t = this.context.currentTime;
    const osc = this.context.createOscillator();
    const g = this.context.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (sweepTo) osc.frequency.exponentialRampToValueAtTime(sweepTo, t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(g); g.connect(this.master);
    osc.start(t); osc.stop(t + dur);
  }

  _noise(dur = 0.15, vol = 0.4, filterFreq = 1200) {
    if (!this.enabled || !this.ensureContext()) return;
    const t = this.context.currentTime;
    const len = Math.floor(this.context.sampleRate * dur);
    const buf = this.context.createBuffer(1, len, this.context.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = this.context.createBufferSource();
    src.buffer = buf;
    const f = this.context.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.value = filterFreq;
    const g = this.context.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(f); f.connect(g); g.connect(this.master);
    src.start(t);
  }

  startMusic() {
    if (!this.initialized || this.musicOn) return;
    this.musicOn = true;
    const drone = this.context.createOscillator();
    const droneGain = this.context.createGain();
    drone.type = 'sine';
    drone.frequency.value = 73.4;
    droneGain.gain.value = 0.05;
    drone.connect(droneGain); droneGain.connect(this.master);
    drone.start();
    this.nextNoteTime = this.context.currentTime + 1;
    setInterval(() => this.scheduleMusic(), 400);
  }

  scheduleMusic() {
    if (!this.context || !this.musicOn) return;
    while (this.nextNoteTime < this.context.currentTime + 1) {
      if (Math.random() < 0.75) this.pluck(this.nextNoteTime);
      this.nextNoteTime += 1.5 + Math.random() * 2.5;
    }
  }

  pluck(t) {
    const scale = [294, 311, 370, 392, 440, 466, 587];
    const f = scale[Math.floor(Math.random() * scale.length)];
    const osc = this.context.createOscillator();
    const g = this.context.createGain();
    osc.type = 'triangle';
    osc.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.1, t + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.8);
    osc.connect(g); g.connect(this.master);
    osc.start(t); osc.stop(t + 2);
  }

  brickHit(row = 0) { if (!this.play('brick-hit', 1 + row * 0.05, 0.7)) this._tone(300 + row * 40, 0.06, 'square', 0.4); }
  brickBreak(row = 0) { if (!this.play('brick-break', 1, 0.8)) { this._tone(500 + row * 30, 0.09, 'triangle', 0.5, 200); this._noise(0.12, 0.4, 1500); } }
  crack() { this._noise(0.06, 0.35, 2500); this._tone(200, 0.05, 'square', 0.25); }
  paddleHit() { if (!this.play('paddle-hit')) this._tone(160, 0.08, 'sine', 0.6, 90); }
  wallHit() { if (!this.play('wall-hit')) this._tone(120, 0.05, 'triangle', 0.35); }
  wallBeam() { if (!this.play('laser', 0.6, 0.9)) this._tone(900, 0.2, 'sawtooth', 0.35, 100); }
  launch() { this._tone(250, 0.12, 'sine', 0.35, 500); }
  powerUp() { if (!this.play('powerup-get')) { this._tone(440, 0.08, 'square', 0.35); setTimeout(() => this._tone(659, 0.12, 'square', 0.35), 100); } }
  fragment() { this._tone(880, 0.15, 'sine', 0.45, 1320); }
  artifact() { if (!this.play('level-complete')) [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => this._tone(f, 0.25, 'triangle', 0.45), i * 120)); }
  word() { this._tone(660, 0.1, 'sine', 0.35); setTimeout(() => this._tone(990, 0.2, 'sine', 0.35), 90); }
  loseLife() { if (!this.play('life-lost')) { this._tone(220, 0.25, 'sawtooth', 0.45, 110); this._noise(0.3, 0.35, 800); } }
  win() { if (!this.play('level-complete')) [392, 523, 659, 784, 1047].forEach((f, i) => setTimeout(() => this._tone(f, 0.3, 'triangle', 0.45), i * 140)); }
  gameOver() { if (!this.play('game-over')) [330, 262, 208, 165].forEach((f, i) => setTimeout(() => this._tone(f, 0.35, 'triangle', 0.45), i * 200)); }
  uiClick() { if (!this.play('ui-click')) this._tone(700, 0.04, 'sine', 0.25); }
}
