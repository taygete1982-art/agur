import { CONFIG, clamp } from '../config.js';

export class InputManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.paddle = null; // будет установлен извне
    
    // Состояние ввода
    this.mouseX = CONFIG.WIDTH / 2;
    this.keys = { left: false, right: false };
    this.touchActive = false;
    this.touchOffsetX = 0;
    
    // Гироскоп
    this.gyroEnabled = false;
    this.gyroOffset = 0;
    
    // Callbacks
    this.onStart = null;
    this.onPause = null;
    this.onRestart = null;
    
    // Определяем тип устройства
    this.isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    this.isTouchDevice = 'ontouchstart' in window;
    
    this.bindEvents();
    this.updateHintText();
  }
  
  setPaddle(paddle) {
    this.paddle = paddle;
  }
  
  bindEvents() {
    // ===== Мышь =====
    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    this.canvas.addEventListener('click', (e) => this.handleClick(e));
    
    // ===== Клавиатура =====
    document.addEventListener('keydown', (e) => this.handleKeyDown(e));
    document.addEventListener('keyup', (e) => this.handleKeyUp(e));
    
    // ===== Touch =====
    this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
    this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
    this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });
    
    // Предотвращение контекстного меню
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }
  
  // ===== Обработчики мыши =====
  
  handleMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    this.mouseX = (e.clientX - rect.left) * scaleX;
    
    if (this.paddle) {
      this.paddle.moveTo(this.mouseX);
    }
  }
  
  handleClick(e) {
    if (this.onStart) this.onStart();
  }
  
  // ===== Обработчики клавиатуры =====
  
  handleKeyDown(e) {
    switch (e.key) {
      case 'ArrowLeft':
      case 'a':
      case 'A':
        this.keys.left = true;
        e.preventDefault();
        break;
        
      case 'ArrowRight':
      case 'd':
      case 'D':
        this.keys.right = true;
        e.preventDefault();
        break;
        
      case ' ':
      case 'Enter':
        if (this.onStart) this.onStart();
        e.preventDefault();
        break;
        
      case 'Escape':
      case 'p':
      case 'P':
        if (this.onPause) this.onPause();
        e.preventDefault();
        break;
        
      case 'r':
      case 'R':
        if (this.onRestart) this.onRestart();
        break;
    }
  }
  
  handleKeyUp(e) {
    switch (e.key) {
      case 'ArrowLeft':
      case 'a':
      case 'A':
        this.keys.left = false;
        break;
        
      case 'ArrowRight':
      case 'd':
      case 'D':
        this.keys.right = false;
        break;
    }
  }
  
  // ===== Обработчики Touch =====
  
  handleTouchStart(e) {
    e.preventDefault();
    this.touchActive = true;
    
    const touch = e.touches[0];
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const touchX = (touch.clientX - rect.left) * scaleX;
    
    // Если тап рядом с платформой - "хватаем" её
    if (this.paddle) {
      const paddleCenter = this.paddle.x + this.paddle.width / 2;
      if (Math.abs(touchX - paddleCenter) < this.paddle.width) {
        this.touchOffsetX = paddleCenter - touchX;
      } else {
        this.touchOffsetX = 0;
      }
      this.paddle.moveTo(touchX + this.touchOffsetX);
    }
    
    // Тап = старт
    if (this.onStart) this.onStart();
  }
  
  handleTouchMove(e) {
    e.preventDefault();
    if (!this.touchActive || !this.paddle) return;
    
    const touch = e.touches[0];
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const touchX = (touch.clientX - rect.left) * scaleX;
    
    this.paddle.moveTo(touchX + this.touchOffsetX);
  }
  
  handleTouchEnd(e) {
    e.preventDefault();
    this.touchActive = false;
  }
  
  // ===== Гироскоп =====
  
  enableGyro() {
    if (typeof DeviceOrientationEvent !== 'undefined' &&
        typeof DeviceOrientationEvent.requestPermission === 'function') {
      // iOS 13+ требует разрешение
      DeviceOrientationEvent.requestPermission()
        .then(response => {
          if (response === 'granted') {
            window.addEventListener('deviceorientation', (e) => this.handleGyro(e));
            this.gyroEnabled = true;
          }
        })
        .catch(console.error);
    } else {
      window.addEventListener('deviceorientation', (e) => this.handleGyro(e));
      this.gyroEnabled = true;
    }
  }
  
  handleGyro(e) {
    if (!this.paddle) return;
    
    // gamma: наклон влево/вправо (-90..90)
    const tilt = e.gamma || 0;
    
    // Калибровка первого значения
    if (this.gyroOffset === 0) {
      this.gyroOffset = tilt;
    }
    
    // Преобразуем наклон в позицию (-30..+30 градусов = весь диапазон)
    const normalizedTilt = clamp((tilt - this.gyroOffset) / 30, -1, 1);
    const targetX = CONFIG.WIDTH / 2 + normalizedTilt * (CONFIG.WIDTH / 2 - this.paddle.width / 2);
    
    // Плавная интерполяция
    this.paddle.x += (targetX - this.paddle.x) * 0.3;
    this.paddle.x = clamp(this.paddle.x, 0, CONFIG.WIDTH - this.paddle.width);
  }
  
  // ===== Обработка движения клавиатуры =====
  
  updateKeyboard(dt = 1) {
    if (!this.paddle) return;
    
    const step = 16 * dt;
    
    if (this.keys.left) {
      this.paddle.moveLeft(step);
    }
    if (this.keys.right) {
      this.paddle.moveRight(step);
    }
  }
  
  // ===== UI подсказки =====
  
  updateHintText() {
    const hintElement = document.getElementById('hintText');
    if (!hintElement) return;
    
    if (this.isMobile || this.isTouchDevice) {
      hintElement.textContent = '👆 Веди пальцем · Тап = старт';
    } else {
      hintElement.textContent = '🖱️ Мышь / ← → · Клик для старта';
    }
  }
}
