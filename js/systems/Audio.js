export class AudioManager {
  constructor() {
    this.context = null;
    this.enabled = true;
    this.volume = 0.3;
    
    // Инициализация при первом взаимодействии
    this.initialized = false;
  }
  
  // Web Audio API требует инициализации после user interaction
  init() {
    if (this.initialized) return;
    
    try {
      this.context = new (window.AudioContext || window.webkitAudioContext)();
      this.initialized = true;
    } catch (e) {
      console.warn('Web Audio API не поддерживается');
      this.enabled = false;
    }
  }
  
  // Базовый тон
  playTone(frequency, duration = 0.1, type = 'square', volume = this.volume) {
    if (!this.enabled || !this.context) return;
    
    try {
      const osc = this.context.createOscillator();
      const gain = this.context.createGain();
      
      osc.type = type;
      osc.frequency.setValueAtTime(frequency, this.context.currentTime);
      
      gain.gain.setValueAtTime(volume, this.context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + duration);
      
      osc.connect(gain);
      gain.connect(this.context.destination);
      
      osc.start(this.context.currentTime);
      osc.stop(this.context.currentTime + duration);
    } catch (e) {
      // Игнорируем ошибки звука
    }
  }
  
  // Шумовой взрыв (для разрушения)
  playNoise(duration = 0.15, volume = this.volume) {
    if (!this.enabled || !this.context) return;
    
    try {
      const bufferSize = this.context.sampleRate * duration;
      const buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
      const data = buffer.getChannelData(0);
      
      // Генерируем белый шум
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      
      const source = this.context.createBufferSource();
      source.buffer = buffer;
      
      const gain = this.context.createGain();
      gain.gain.setValueAtTime(volume, this.context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + duration);
      
      // Фильтр для более мягкого звука
      const filter = this.context.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 1000;
      
      source.connect(filter);
      filter.connect(gain);
      gain.connect(this.context.destination);
      
      source.start(this.context.currentTime);
    } catch (e) {
      // Игнорируем
    }
  }
  
  // ===== Игровые звуки =====
  
  // Удар о кирпич (высота зависит от ряда)
  brickHit(row = 0) {
    const baseFreq = 200;
    const freq = baseFreq + row * 50;
    this.playTone(freq, 0.08, 'square', 0.2);
  }
  
  // Разрушение кирпича
  brickBreak(row = 0) {
    const baseFreq = 400;
    const freq = baseFreq + row * 30;
    this.playTone(freq, 0.1, 'sine', 0.25);
    this.playNoise(0.1, 0.15);
  }
  
  // Удар о платформу
  paddleHit() {
    this.playTone(150, 0.08, 'sine', 0.2);
  }
  
  // Удар о стену
  wallHit() {
    this.playTone(100, 0.05, 'triangle', 0.1);
  }
  
  // Подбор power-up
  powerUp() {
    // Восходящая арпеджио
    this.playTone(400, 0.1, 'sine', 0.2);
    setTimeout(() => this.playTone(500, 0.1, 'sine', 0.2), 50);
    setTimeout(() => this.playTone(600, 0.15, 'sine', 0.2), 100);
  }
  
  // Потеря жизни
  loseLife() {
    this.playTone(200, 0.2, 'sawtooth', 0.2);
    setTimeout(() => this.playTone(150, 0.3, 'sawtooth', 0.2), 100);
    setTimeout(() => this.playTone(100, 0.4, 'sawtooth', 0.2), 200);
  }
  
  // Запуск мяча
  launch() {
    this.playTone(300, 0.1, 'sine', 0.15);
  }
  
  // Победа
  win() {
    const notes = [400, 500, 600, 800];
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.2, 'sine', 0.25), i * 150);
    });
  }
  
  // Game Over
  gameOver() {
    const notes = [300, 250, 200, 150];
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.3, 'triangle', 0.2), i * 200);
    });
  }
  
  // Лазер
  laser() {
    this.playTone(800, 0.05, 'square', 0.1);
  }
  
  // Клик UI
  uiClick() {
    this.playTone(600, 0.05, 'sine', 0.1);
  }
  
  // ===== Управление =====
  
  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }
  
  setVolume(value) {
    this.volume = Math.max(0, Math.min(1, value));
  }
}
