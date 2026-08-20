import { CONFIG, clamp } from '../config.js?v=202608210021';

export class InputManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.paddle = null;
    this.keys = { left: false, right: false };
    this.touchActive = false;
    this.lastTouchX = 0;
    this.isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

    this.onStart = null;
    this.onPause = null;
    this.onRestart = null;
    this.onMuseum = null;
    this.onLeftBtn = null;
    this.onRightBtn = null;
    this.onTap = null;
    this.onLeftBtn = null;
    this.onRightBtn = null;
    this.onTap = null;

    this.bindEvents();
    this.updateHintText();
  }

  setPaddle(paddle) { this.paddle = paddle; }

  bindEvents() {
    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    this.canvas.addEventListener('click', () => this.handleClick());
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    document.addEventListener('keydown', (e) => this.handleKeyDown(e));
    document.addEventListener('keyup', (e) => this.handleKeyUp(e));
    this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
    this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
    this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });
  }

  handleMouseMove(e) {
    if (!this.paddle || this.isTouchDevice) return;
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    this.paddle.moveTo((e.clientX - rect.left) * scaleX);
  }

  handleClick() { if (this.onStart) this.onStart(); }

  getTouchPos(touch) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: (touch.clientX - rect.left) * (this.canvas.width / rect.width),
      y: (touch.clientY - rect.top) * (this.canvas.height / rect.height)
    };
  }

  handleTouchStart(e) {
    e.preventDefault();
    const pos = this.getTouchPos(e.touches[0]);
    this.lastTouchX = pos.x;

    const zoneY = CONFIG.HEIGHT - CONFIG.TOUCH.ZONE_HEIGHT;
    if (Math.hypot(pos.x - 35, pos.y - (zoneY + 45)) < 30) {
      if (this.onLeftBtn) this.onLeftBtn();
      return;
    }
    if (Math.hypot(pos.x - (CONFIG.WIDTH - 35), pos.y - (zoneY + 45)) < 30) {
      if (this.onRightBtn) this.onRightBtn();
      return;
    }

    this.touchActive = true;
    if (this.onStart) this.onStart();
  }

  handleTouchMove(e) {
    e.preventDefault();
    if (!this.touchActive || !this.paddle) return;
    const pos = this.getTouchPos(e.touches[0]);
    const dx = (pos.x - this.lastTouchX) * CONFIG.TOUCH.SENSITIVITY;
    this.paddle.targetX = clamp(this.paddle.targetX + dx, 0, CONFIG.WIDTH - this.paddle.width);
    this.lastTouchX = pos.x;
  }

  handleTouchEnd(e) {
    e.preventDefault();
    this.touchActive = false;
  }

  handleKeyDown(e) {
    switch (e.key) {
      case 'ArrowLeft': case 'a': case 'A': case 'ф': case 'Ф':
        this.keys.left = true; e.preventDefault(); break;
      case 'ArrowRight': case 'd': case 'D': case 'в': case 'В':
        this.keys.right = true; e.preventDefault(); break;
      case ' ': case 'Enter':
        if (this.onStart) this.onStart(); e.preventDefault(); break;
      case 'Escape': case 'p': case 'P': case 'з': case 'З':
        if (this.onPause) this.onPause(); e.preventDefault(); break;
      case 'r': case 'R': case 'к': case 'К':
        if (this.onRestart) this.onRestart(); break;
      case 'm': case 'M': case 'ь': case 'Ь':
        if (this.onMuseum) this.onMuseum(); break;
    }
  }

  handleKeyUp(e) {
    switch (e.key) {
      case 'ArrowLeft': case 'a': case 'A': case 'ф': case 'Ф':
        this.keys.left = false; break;
      case 'ArrowRight': case 'd': case 'D': case 'в': case 'В':
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
    const el = document.getElementById('hintText');
    if (!el) return;
    el.textContent = this.isTouchDevice
      ? '\u{1F446} Свайп \u{00B7}'
      : '\u{1F5B1}\u{FE0F} Мышь / \u{2190} \u{2192} \u{00B7}';
  }
}










