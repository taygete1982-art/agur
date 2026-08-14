import { CONFIG } from '../config.js';

export class PowerUp {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type; // ключ из CONFIG.POWERUP_TYPES
    this.config = CONFIG.POWERUP_TYPES[type];
    
    this.width = 40;
    this.height = 40;
    this.speed = CONFIG.GAME.POWERUP_FALL_SPEED;
    
    this.alive = true;
    this.collected = false;
    
    // Анимация
    this.rotation = 0;
    this.pulsePhase = Math.random() * Math.PI * 2;
  }
  
  update(dt = 1) {
    // Падение вниз
    this.y += this.speed * dt;
    
    // Вращение и пульсация
    this.rotation += dt * 0.05;
    this.pulsePhase += dt * 0.1;
    
    // Удаление если упал за экран
    if (this.y > CONFIG.HEIGHT + this.height) {
      this.alive = false;
    }
  }
  
  // Проверка подбора платформой
  checkCollision(paddle) {
    return (
      this.alive &&
      this.y + this.height >= paddle.y &&
      this.y <= paddle.y + paddle.height &&
      this.x + this.width >= paddle.x &&
      this.x <= paddle.x + paddle.width
    );
  }
  
  // Применить эффект к игре
  apply(game) {
    switch (this.type) {
      case 'WIDE':
        game.paddle.activateWide();
        break;
        
      case 'MULTI':
        game.spawnExtraBalls(2); // +2 мяча к текущему
        break;
        
      case 'SLOW':
        game.applySlowEffect();
        break;
        
      case 'LASER':
        game.activateLaser(this.config.duration);
        break;
        
      case 'LIFE':
        game.addLife();
        break;
        
      case 'STICKY':
        game.paddle.activateSticky();
        break;
    }
    
    this.collected = true;
    this.alive = false;
  }
  
  draw(ctx) {
    if (!this.alive) return;
    
    const pulse = 1 + Math.sin(this.pulsePhase) * 0.1;
    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2;
    
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(this.rotation);
    ctx.scale(pulse, pulse);
    
    // Свечение
    ctx.shadowColor = this.config.color;
    ctx.shadowBlur = 20;
    
    // Фон бонуса (круг)
    ctx.fillStyle = this.config.color;
    ctx.globalAlpha = 0.3;
    ctx.beginPath();
    ctx.arc(0, 0, this.width / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    
    // Обводка
    ctx.strokeStyle = this.config.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, this.width / 2, 0, Math.PI * 2);
    ctx.stroke();
    
    // Эмодзи
    ctx.shadowBlur = 0;
    ctx.font = '20px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.config.emoji, 0, 0);
    
    ctx.restore();
  }
}
