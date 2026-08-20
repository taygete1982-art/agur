import { CONFIG } from '../config.js?v=202608201644';

export class CollisionSystem {
  constructor() {
    this.lastCollisionTime = 0;
    this.collisionCooldown = 50; // мс между столкновениями
  }
  
  // Обработка столкновения мяча с кирпичом
  // Возвращает { hit: boolean, destroyed: boolean, side: 'top'|'bottom'|'left'|'right' }
  checkBrickCollision(ball, brick) {
    if (!brick.checkCollision(ball)) {
      return { hit: false, destroyed: false, side: null };
    }
    
    // Определяем сторону столкновения через перекрытие
    const overlapLeft = ball.x + ball.radius - brick.x;
    const overlapRight = brick.x + brick.width - (ball.x - ball.radius);
    const overlapTop = ball.y + ball.radius - brick.y;
    const overlapBottom = brick.y + brick.height - (ball.y - ball.radius);
    
    // Находим минимальное перекрытие
    const overlaps = [
      { side: 'left', value: overlapLeft },
      { side: 'right', value: overlapRight },
      { side: 'top', value: overlapTop },
      { side: 'bottom', value: overlapBottom },
    ];
    
    overlaps.sort((a, b) => a.value - b.value);
    const minOverlap = overlaps[0];
    
    // Отскок в зависимости от стороны
    switch (minOverlap.side) {
      case 'left':
        ball.dx = -Math.abs(ball.dx);
        ball.x = brick.x - ball.radius;
        break;
      case 'right':
        ball.dx = Math.abs(ball.dx);
        ball.x = brick.x + brick.width + ball.radius;
        break;
      case 'top':
        ball.dy = -Math.abs(ball.dy);
        ball.y = brick.y - ball.radius;
        break;
      case 'bottom':
        ball.dy = Math.abs(ball.dy);
        ball.y = brick.y + brick.height + ball.radius;
        break;
    }
    
    // Наносим урон кирпичу
    const destroyed = brick.takeDamage();
    
    return {
      hit: true,
      destroyed: destroyed,
      side: minOverlap.side
    };
  }
  
  // Обработка столкновения мяча с платформой
  checkPaddleCollision(ball, paddle) {
    if (ball.caught) return false;
    if (!paddle.checkCollision(ball)) {
      return false;
    }
    
    // Sticky режим - мяч прилипает
    if (paddle.isSticky) {
      paddle.hasBall = true;
      ball.isLaunched = false;
      ball.dx = 0;
      ball.dy = 0;
      return true;
    }
    
    // Обычный отскок с учётом точки удара
    ball.bounceOffPaddle(paddle.x, paddle.width);
    return true;
  }
  
  // Проверка выхода мяча за нижнюю границу
  checkBallLost(ball) {
    return ball.y - ball.radius > CONFIG.HEIGHT;
  }
  
  // Проверка столкновения power-up с платформой
  checkPowerUpCollision(powerUp, paddle) {
    return powerUp.checkCollision(paddle);
  }
  
  // Проверка попадания лазера в кирпич
  checkLaserHit(laser, brick) {
    return (
      brick.alive &&
      laser.x >= brick.x &&
      laser.x <= brick.x + brick.width &&
      laser.y >= brick.y &&
      laser.y <= brick.y + brick.height
    );
  }
}

// Класс лазера (для power-up LASER)
export class Laser {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 4;
    this.height = 15;
    this.speed = 10;
    this.alive = true;
  }
  
  update(dt = 1) {
    this.y -= this.speed * dt;
    
    if (this.y < -this.height) {
      this.alive = false;
    }
  }
  
  draw(ctx) {
    if (!this.alive) return;
    
    ctx.shadowColor = '#a78bfa';
    ctx.shadowBlur = 10;
    
    const grad = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
    grad.addColorStop(0, '#c4b5fd');
    grad.addColorStop(1, '#7c3aed');
    
    ctx.fillStyle = grad;
    ctx.fillRect(this.x - this.width / 2, this.y, this.width, this.height);
    
    ctx.shadowBlur = 0;
  }
}









