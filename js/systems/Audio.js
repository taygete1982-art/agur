export class AudioManager {
  constructor() {
    this.context = null;
    this.enabled = true;
    this.volume = 0.35;
    this.initialized = false;
  }
  
  init() {
    if (this.initialized) return;
    try {
      this.context = new (window.AudioContext || window.webkitAudioContext)();
      this.master = this.context.createGain();
      this.master.gain.value = this.volume;
      this.master.connect(this.context.destination);
      this.initialized = true;
    } catch (e) { this.enabled = false; }
  }
  
  tone(freq, dur = 0.1, type = 'square', vol = 0.5, sweepTo = null) {
    if (!this.enabled || !this.context) return;
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
  
  noise(dur = 0.15, vol = 0.4, filterFreq = 1200) {
    if (!this.enabled || !this.context) return;
    const t = this.context.currentTime;
    const len = Math.floor(this.context.sampleRate * dur);
    const buf = this.context.createBuffer(1, len, this.context.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = this.context.createBufferSource();
    src.buffer = buf;
    const f = this.context.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = filterFreq;
    const g = this.context.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(f); f.connect(g); g.connect(this.master);
    src.start(t);
  }
  
  brickHit(row = 0) { this.tone(300 + row * 40, 0.06, 'square', 0.4); this.noise(0.04, 0.15, 3000); }
  brickBreak(row = 0) { this.tone(500 + row * 30, 0.09, 'triangle', 0.5, 200); this.noise(0.12, 0.4, 1500); }
  crack() { this.noise(0.06, 0.35, 2500); this.tone(200, 0.05, 'square', 0.25); }
  paddleHit() { this.tone(160, 0.08, 'sine', 0.6, 90); }
  wallHit() { this.tone(120, 0.05, 'triangle', 0.35); }
  wallBeam() { this.tone(900, 0.2, 'sawtooth', 0.35, 100); this.noise(0.15, 0.25, 4000); }
  launch() { this.tone(250, 0.12, 'sine', 0.35, 500); }
  powerUp() { this.tone(440, 0.08, 'square', 0.35); setTimeout(() => this.tone(554, 0.08, 'square', 0.35), 60); setTimeout(() => this.tone(659, 0.12, 'square', 0.35), 120); }
  fragment() { this.tone(880, 0.15, 'sine', 0.45, 1320); }
  artifact() { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => this.tone(f, 0.25, 'triangle', 0.45), i * 120)); }
  word() { this.tone(660, 0.1, 'sine', 0.35); setTimeout(() => this.tone(990, 0.2, 'sine', 0.35), 90); }
  loseLife() { this.tone(220, 0.25, 'sawtooth', 0.45, 110); this.noise(0.3, 0.35, 800); }
  laser() { this.tone(1200, 0.06, 'square', 0.2, 300); }
  win() { [392, 523, 659, 784, 1047].forEach((f, i) => setTimeout(() => this.tone(f, 0.3, 'triangle', 0.45), i * 140)); }
  gameOver() { [330, 262, 208, 165].forEach((f, i) => setTimeout(() => this.tone(f, 0.35, 'triangle', 0.45), i * 200)); }
  uiClick() { this.tone(700, 0.04, 'sine', 0.25); }
  toggle() { this.enabled = !this.enabled; return this.enabled; }
}
