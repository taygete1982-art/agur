import { CONFIG, clamp } from '../config.js';

export class InputManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.paddle = null;
    this.keys = { left: false, right: false };
    this.touchActive = false;
    this.touchOffsetX = 0;
    this.isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    
    this.onStart = null;
    this.onPause = null;
    this.onRestart = null;
    this.onMuseum = null;
    
    this.bindEvents();
    this.updateHintText();
  }
  
  setPaddle(paddle) { this.paddle = paddle; }
  
  bindEvents() {
    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    this.canvas.addEventListener('click', (e) => this.handleClick(e));
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    document.addEventListener('keydown', (e) => this.handleKeyDown(e));
    document.addEventListener('keyup', (e) => this.handleKeyUp(e));
    this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
    this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
    this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });
  }
  
  handleMouseMove(e) {
    if (!this.paddle) return;
    if (this.isTouchDevice) return;
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const mouseX = (e.clientX - rect.left) * scaleX;
    this.paddle.moveTo(mouseX);
  }
  
  handleClick(e) {
    if (this.onStart) this.onStart();
  }
  
  getTouchPos(touch) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: (touch.clientX - rect.left) * (this.canvas.width / rect.width),
      y: (touch.clientY - rect.top) * (this.canvas.height / rect.height)
    };
  }
  
  handleTouchStart(e) {
    e.preventDefault();
    this.touchActive = true;
    const pos = this.getTouchPos(e.touches[0]);
    if (this.paddle) {
      // Смещение: расстояние от пальца до центра платформы
      this.touchOffsetX = (this.paddle.x + this.paddle.width / 2) - pos.x;
    }
    if (this.onStart) this.onStart();
  }
  
  handleTouchMove(e) {
    e.preventDefault();
    if (!this.touchActive || !this.paddle) return;
    const pos = this.getTouchPos(e.touches[0]);
    // Палец двигается -> платформа двигается с тем же смещением
    this.paddle.moveTo(pos.x + this.touchOffsetX);
  }
  
  handleTouchEnd(e) {
    e.preventDefault();
    this.touchActive = false;
  }
  
  handleKeyDown(e) {
    switch (e.key) {
      case 'ArrowLeft': case 'a': case 'A':
      case 'ф': case 'Ф':
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
  
  updateKeyboard(dt = 1) {
    if (!this.paddle) return;
    const step = 16 * dt;
    if (this.keys.left) this.paddle.moveLeft(step);
    if (this.keys.right) this.paddle.moveRight(step);
  }
  
  updateHintText() {
    const hintElement = document.getElementById('hintText');
    if (!hintElement) return;
    if (this.isTouchDevice) {
      hintElement.textContent = '\u{1F446} Веди пальцем \u{00B7} M = музей';
    } else {
      hintElement.textContent = '\u{1F5B1}\u{FE0F} Мышь / \u{2190} \u{2192} \u{00B7} M = музей';
    }
  }
}
