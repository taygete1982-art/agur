import { CONFIG, clamp } from '../config.js';

export class InputManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.paddle = null;
    this.keys = { left: false, right: false };
    this.touchActive = false;
    this.touchOffsetX = 0;
    
    this.isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    this.isTouchDevice = 'ontouchstart' in window;
    
    this.onStart = null;
    this.onPause = null;
    this.onRestart = null;
    this.onMuseum = null;
    
    this.bindEvents();
    this.updateHintText();
  }
  
  setPaddle(paddle) { this.paddle = paddle; }
  
  bindEvents() {
    // ===== МЫШЬ: работает БЕЗ нажатия =====
    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    this.canvas.addEventListener('click', (e) => this.handleClick(e));
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    
    // ===== КЛАВИАТУРА =====
    document.addEventListener('keydown', (e) => this.handleKeyDown(e));
    document.addEventListener('keyup', (e) => this.handleKeyUp(e));
    
    // ===== TOUCH =====
    this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
    this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
    this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });
  }
  
  // МЫШЬ: простое движение = двигает ракетку (без клика)
  handleMouseMove(e) {
    if (!this.paddle) return;
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const mouseX = (e.clientX - rect.left) * scaleX;
    this.paddle.x = clamp(mouseX - this.paddle.width / 2, 0, CONFIG.WIDTH - this.paddle.width);
    this.paddle.targetX = this.paddle.x;
  }
  
  handleClick(e) {
    if (this.onStart) this.onStart();
  }
  
  handleKeyDown(e) {
    switch (e.key) {
      case 'ArrowLeft': case 'a': case 'A':
      case 'ф': case 'Ф': // русская раскладка
        this.keys.left = true; e.preventDefault(); break;
      case 'ArrowRight': case 'd': case 'D':
      case 'в': case 'В':
        this.keys.right = true; e.preventDefault(); break;
      case ' ': case 'Enter':
        if (this.onStart) this.onStart(); e.preventDefault(); break;
      case 'Escape': case 'p': case 'P':
      case 'з': case 'З':
        if (this.onPause) this.onPause(); e.preventDefault(); break;
      case 'r': case 'R':
      case 'к': case 'К':
        if (this.onRestart) this.onRestart(); break;
      case 'm': case 'M':
      case 'ь': case 'Ь':
        if (this.onMuseum) this.onMuseum(); break;
    }
  }
  
  handleKeyUp(e) {
    switch (e.key) {
      case 'ArrowLeft': case 'a': case 'A':
      case 'ф': case 'Ф':
        this.keys.left = false; break;
      case 'ArrowRight': case 'd': case 'D':
      case 'в': case 'В':
        this.keys.right = false; break;
    }
  }
  
  handleTouchStart(e) {
    e.preventDefault();
    this.touchActive = true;
    const touch = e.touches[0];
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const touchX = (touch.clientX - rect.left) * scaleX;
    
    if (this.paddle) {
      this.touchOffsetX = this.paddle.x + this.paddle.width / 2 - touchX;
      this.paddle.x = clamp(touchX + this.touchOffsetX - this.paddle.width / 2, 0, CONFIG.WIDTH - this.paddle.width);
      this.paddle.targetX = this.paddle.x;
    }
    if (this.onStart) this.onStart();
  }
  
  handleTouchMove(e) {
    e.preventDefault();
    if (!this.touchActive || !this.paddle) return;
    const touch = e.touches[0];
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const touchX = (touch.clientX - rect.left) * scaleX;
    this.paddle.x = clamp(touchX + this.touchOffsetX - this.paddle.width / 2, 0, CONFIG.WIDTH - this.paddle.width);
    this.paddle.targetX = this.paddle.x;
  }
  
  handleTouchEnd(e) {
    e.preventDefault();
    this.touchActive = false;
  }
  
  updateKeyboard(dt = 1) {
    if (!this.paddle) return;
    const step = 16 * dt;
    if (this.keys.left) {
      this.paddle.x = clamp(this.paddle.x - step, 0, CONFIG.WIDTH - this.paddle.width);
    }
    if (this.keys.right) {
      this.paddle.x = clamp(this.paddle.x + step, 0, CONFIG.WIDTH - this.paddle.width);
    }
  }
  
  updateHintText() {
    const hintElement = document.getElementById('hintText');
    if (!hintElement) return;
    if (this.isMobile || this.isTouchDevice) {
      hintElement.textContent = '\u{1F446} Веди пальцем \u{00B7} M = музей \u{00B7} Тап = старт';
    } else {
      hintElement.textContent = '\u{1F5B1}\u{FE0F} Мышь / \u{2190} \u{2192} \u{00B7} M = музей \u{00B7} Клик для старта';
    }
  }
}
