import { CONFIG, clamp } from '../config.js';

export class Paddle {
  constructor() {
    this.baseWidth = CONFIG.PADDLE.WIDTH;
    this.width = this.baseWidth;
    this.height = CONFIG.PADDLE.HEIGHT;
    this.radius = CONFIG.PADDLE.RADIUS;
    this.x = CONFIG.WIDTH / 2 - this.width / 2;
    this.y = CONFIG.HEIGHT - CONFIG.PADDLE.Y_OFFSET;
    
    // Активные эффекты
    this.isWide = false;
    this.isSticky = false;
    this.hasBall = false; // для sticky режима
    
    // Таймеры эффектов
    this.wideTimer = 0;
    this.stickyTimer = 0;
    
    // Для плавного движения
    this.targetX = this.x;
    this.smoothing = 0.3;
  }
  
  // Обновление позиции (для клавиатуры)
  moveLeft(step = 16) {
    this.targetX = clamp(this.x - step, 0, CONFIG.WIDTH - this.width);
    this.x = this.targetX;
  }
  
  moveRight(step = 16) {
    this.targetX = clamp(this.x + step, 0, CONFIG.WIDTH - this.width);
    this.x = this.targetX;
  }
  
  // Позиционирование по мыши/тапу
  moveTo(x) {
    this.targetX = clamp(x - this.width / 2, 0, CONFIG.WIDTH - this.width);
    this.x = this.targetX;
  }
  
  update(dt = 1) {
    // Плавная интерполяция к целевой позиции
    this.x += (this.targetX - this.x) * this.smoothing;
    
    // Обновление таймеров эффектов
    if (this.isWide) {
      this.wideTimer -= dt * 16.67; // конвертируем в мс
      if (this.wideTimer <= 0) {
        this.deactivateWide();
      }
    }
    
    if (this.isSticky) {
      this.stickyTimer -= dt * 16.67;
      if (this.stickyTimer <= 0) {
        this.deactivateSticky();
      }
    }
  }
  
  // ===== Power-up эффекты =====
  
  activateWide(duration = CONFIG.POWERUP_TYPES.WIDE.duration) {
    this.isWide = true;
    this.wideTimer = duration;
    this.width = this.baseWidth * 1.5;
    // Центрируем чтобы не вылезла за край
    this.x = clamp(this.x, 0, CONFIG.WIDTH - this.width);
  }
  
  deactivateWide() {
    this.isWide = false;
    this.width = this.baseWidth;
    this.x = clamp(this.x, 0, CONFIG.WIDTH - this.width);
  }
  
  activateSticky(duration = CONFIG.POWERUP_TYPES.STICKY.duration) {
    this.isSticky = true;
    this.stickyTimer = duration;
  }
  
  deactivateSticky() {
    this.isSticky = false;
    this.hasBall = false;
  }
  
  // Проверка столкновения с мячом
  checkCollision(ball) {
    return (
      ball.dy > 0 &&
      ball.y + ball.radius >= this.y &&
      ball.y + ball.radius <= this.y + this.height + 8 &&
      ball.x >= this.x - ball.radius &&
      ball.x <= this.x + this.width + ball.radius
    );
  }
  
  draw(ctx) {
    // Свечение
    ctx.shadowColor = this.isSticky ? '#fbbf24' : '#d9a441';
    ctx.shadowBlur = 25;
    
    // Градиент платформы
    const grad = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
    
    if (this.isSticky) {
      grad.addColorStop(0, '#ffd97d');
      grad.addColorStop(0.4, '#fbbf24');
      grad.addColorStop(1, '#d97706');
    } else if (this.isWide) {
      grad.addColorStop(0, '#7fd6c2');
      grad.addColorStop(0.4, '#40b3a2');
      grad.addColorStop(1, '#2a8c7e');
    } else {
      grad.addColorStop(0, '#f0d9a8');
      grad.addColorStop(0.4, '#c9853f');
      grad.addColorStop(1, '#8a5a2b');
    }
    
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(this.x, this.y, this.width, this.height, this.radius);
    ctx.fill();
    ctx.shadowBlur = 0;
    
    // Блик
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.beginPath();
    ctx.roundRect(this.x + 12, this.y + 3, this.width - 24, 5, 4);
    ctx.fill();
    
    // Индикатор sticky (магнит)
    if (this.isSticky) {
      ctx.fillStyle = 'rgba(251, 191, 36, 0.5)';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('\u{1F36F}', this.x + this.width / 2, this.y - 5);
    }
  }
}


