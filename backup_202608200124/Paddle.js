import { CONFIG, clamp } from '../config.js?v=202608202143';

export class Paddle {
  constructor() {
    this.baseWidth = CONFIG.PADDLE.WIDTH;
    this.width = this.baseWidth;
    this.height = CONFIG.PADDLE.HEIGHT;
    this.radius = CONFIG.PADDLE.RADIUS;
    this.x = CONFIG.WIDTH / 2 - this.width / 2;
    this.y = CONFIG.HEIGHT - CONFIG.PADDLE.Y_OFFSET;
    this.targetX = this.x;
    this.smoothing = 0.35;
    
    this.isWide = false;
    this.isSticky = false;
    this.wideTimer = 0;
    this.stickyTimer = 0;
  }
  
  update(dt = 1) {
    // Плавное движение к целевой позиции
    this.x += (this.targetX - this.x) * this.smoothing * dt;
    
    if (this.isWide) {
      this.wideTimer -= dt * 16.67;
      if (this.wideTimer <= 0) {
        this.isWide = false;
        this.width = this.baseWidth;
      }
    }
    
    if (this.isSticky) {
      this.stickyTimer -= dt * 16.67;
      if (this.stickyTimer <= 0) this.isSticky = false;
    }
  }
  
  moveLeft(step = 16) {
    this.targetX = clamp(this.targetX - step, 0, CONFIG.WIDTH - this.width);
  }
  
  moveRight(step = 16) {
    this.targetX = clamp(this.targetX + step, 0, CONFIG.WIDTH - this.width);
  }
  
  moveTo(x) {
    this.targetX = clamp(x - this.width / 2, 0, CONFIG.WIDTH - this.width);
  }
  
  activateWide(duration = 10000) {
    this.isWide = true;
    this.width = this.baseWidth * 1.6;
    this.wideTimer = duration;
  }
  
  activateSticky(duration = 15000) {
    this.isSticky = true;
    this.stickyTimer = duration;
  }
  
  checkCollision(ball) {
    return (
      ball.y + ball.radius >= this.y &&
      ball.y - ball.radius <= this.y + this.height &&
      ball.x >= this.x &&
      ball.x <= this.x + this.width
    );
  }
  
  draw(ctx) {
    ctx.save();
    
    const x = this.x;
    const y = this.y;
    const w = this.width;
    const h = this.height;
    const r = this.radius;
    
    const grad = ctx.createLinearGradient(x, y, x, y + h);
    grad.addColorStop(0, '#c9955a');
    grad.addColorStop(0.5, '#a8743a');
    grad.addColorStop(1, '#6b4a24');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.fill();
    ctx.strokeStyle = 'rgba(30, 15, 5, 0.7)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = 'rgba(255, 240, 200, 0.25)';
    ctx.beginPath();
    ctx.roundRect(x + 6, y + 2, w - 12, h * 0.35, 3);
    ctx.fill();
    
    ctx.restore();
  }
}










