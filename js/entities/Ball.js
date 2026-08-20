import { CONFIG, clamp } from '../config.js?v=202608210055';

export class Ball {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = CONFIG.BALL.RADIUS;
    this.speed = CONFIG.BALL.INITIAL_SPEED;
    this.dx = 0;
    this.dy = 0;
    this.isLaunched = false;
    this.caught = false;
    this.caughtOffset = 0;
    
    // Trail эффект
    this.trail = [];
    this.lastWallHit = null;
    this.maxTrailLength = 12;
  }
  
  // Запуск мяча в случайном направлении вверх
  launch() {

    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.0;
    this.dx = Math.cos(angle) * this.speed;
    this.dy = Math.sin(angle) * this.speed;
    this.isLaunched = true;
  }
  
  // Сброс мяча на платформу
  reset(paddleX, paddleY) {
    this.x = paddleX + CONFIG.PADDLE.WIDTH / 2;
    this.y = paddleY - this.radius - 1;
    this.dx = 0;
    this.dy = 0;
    this.isLaunched = false;
    this.caught = false;
    this.caughtOffset = 0;
    this.trail = [];
    this.lastWallHit = null;
  }
  
  update(dt = 1) {
    if (!this.isLaunched) return;
    
    // Сохраняем позицию для trail
    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > this.maxTrailLength) {
      this.trail.shift();
    }
    
    // Движение
    this.x += this.dx * dt;
    this.y += this.dy * dt;
    
    // Отскок от стен
    if (this.x - this.radius < 0) {
      this.x = this.radius;
      this.dx = Math.abs(this.dx);
      this.lastWallHit = 'left';
    } else if (this.x + this.radius > CONFIG.WIDTH) {
      this.x = CONFIG.WIDTH - this.radius;
      this.dx = -Math.abs(this.dx);
      this.lastWallHit = 'right';
    }
    
    // Отскок от потолка
    if (this.y - this.radius < 0) {
      this.y = this.radius;
      this.dy = Math.abs(this.dy);
    }
    
    // Ограничение максимальной скорости
    this.limitSpeed();
    
    // Гарантия минимальной вертикальной скорости
    this.ensureMinVerticalSpeed();
  }
  
  limitSpeed() {
    const currentSpeed = Math.sqrt(this.dx * this.dx + this.dy * this.dy);
    const maxSpeed = CONFIG.BALL.INITIAL_SPEED * CONFIG.BALL.MAX_SPEED_MULTIPLIER;
    
    if (currentSpeed > maxSpeed) {
      const ratio = maxSpeed / currentSpeed;
      this.dx *= ratio;
      this.dy *= ratio;
    }
  }
  
  ensureMinVerticalSpeed() {
    const currentSpeed = Math.sqrt(this.dx * this.dx + this.dy * this.dy);
    const minVertical = currentSpeed * CONFIG.BALL.MIN_VERTICAL_RATIO;
    
    if (Math.abs(this.dy) < minVertical) {
      const sign = this.dy >= 0 ? 1 : -1;
      this.dy = sign * minVertical;
      
      // Пересчитываем dx чтобы сохранить общую скорость
      const remaining = Math.sqrt(currentSpeed * currentSpeed - this.dy * this.dy);
      this.dx = (this.dx >= 0 ? 1 : -1) * remaining;
    }
  }
  
  // Отскок от платформы с учётом точки удара
  bounceOffPaddle(paddleX, paddleWidth) {
    const hitPos = (this.x - (paddleX + paddleWidth / 2)) / (paddleWidth / 2);
    const angle = clamp(hitPos, -1, 1) * 0.8; // -0.8 .. 0.8 рад
    
    const currentSpeed = Math.sqrt(this.dx * this.dx + this.dy * this.dy);
    this.dx = Math.sin(angle) * currentSpeed;
    this.dy = -Math.cos(angle) * currentSpeed;
    
    this.y = CONFIG.HEIGHT - CONFIG.PADDLE.Y_OFFSET - this.radius;
  }
  
  draw(ctx) {
    // Trail
    for (let i = 0; i < this.trail.length; i++) {
      const t = this.trail[i];
      const alpha = (i / this.trail.length) * 0.3;
      const size = (i / this.trail.length) * this.radius;
      
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#ffdd77';
      ctx.beginPath();
      ctx.arc(t.x, t.y, size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    
    // Основной мяч с градиентом
    const grad = ctx.createRadialGradient(
      this.x - 4, this.y - 4, 2,
      this.x, this.y, this.radius + 4
    );
    grad.addColorStop(0, '#fff9e6');
    grad.addColorStop(0.6, '#ffdd77');
    grad.addColorStop(1, '#e6a600');
    
    ctx.shadowColor = '#ffe066';
    ctx.shadowBlur = 25;
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    
    // Блик
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.beginPath();
    ctx.arc(this.x - 3, this.y - 4, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}












