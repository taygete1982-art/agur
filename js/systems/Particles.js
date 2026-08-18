import { randomRange } from '../config.js?v=202608182307';

export class Particle {
  constructor(x, y, color, options = {}) {
    this.x = x;
    this.y = y;
    this.color = color;
    
    // Скорость
    const angle = options.angle ?? randomRange(0, Math.PI * 2);
    const speed = options.speed ?? randomRange(2, 6);
    this.dx = Math.cos(angle) * speed;
    this.dy = Math.sin(angle) * speed;
    
    // Физика
    this.gravity = options.gravity ?? 0.2;
    this.friction = options.friction ?? 0.99;
    
    // Жизнь
    this.life = 1.0;
    this.decay = options.decay ?? randomRange(0.015, 0.03);
    
    // Размер
    this.size = options.size ?? randomRange(2, 5);
    
    // Форма: 'square', 'circle', 'spark'
    this.shape = options.shape ?? 'square';
    
    this.alive = true;
  }
  
  update(dt = 1) {
    // Движение
    this.x += this.dx * dt;
    this.y += this.dy * dt;
    
    // Гравитация
    this.dy += this.gravity * dt;
    
    // Трение
    this.dx *= this.friction;
    this.dy *= this.friction;
    
    // Затухание жизни
    this.life -= this.decay * dt;
    
    if (this.life <= 0) {
      this.alive = false;
    }
  }
  
  draw(ctx) {
    if (!this.alive) return;
    
    ctx.globalAlpha = this.life;
    ctx.fillStyle = this.color;
    
    switch (this.shape) {
      case 'circle':
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * this.life, 0, Math.PI * 2);
        ctx.fill();
        break;
        
      case 'spark':
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(Math.atan2(this.dy, this.dx));
        ctx.fillRect(-this.size, -1, this.size * 2, 2);
        ctx.restore();
        break;
        
      case 'square':
      default:
        const s = this.size * this.life;
        ctx.fillRect(this.x - s/2, this.y - s/2, s, s);
        break;
    }
    
    ctx.globalAlpha = 1;
  }
}

export class ParticleSystem {
  constructor() {
    this.particles = [];
    this.pool = []; // Object pooling для производительности
  }
  
  // Получить частицу из пула или создать новую
  getParticle(x, y, color, options) {
    let particle = this.pool.pop();
    if (particle) {
      // Переинициализация
      Object.assign(particle, new Particle(x, y, color, options));
      return particle;
    }
    return new Particle(x, y, color, options);
  }
  
  // Взрыв при разрушении кирпича
  explodeBrick(x, y, width, height, color) {
    const centerX = x + width / 2;
    const centerY = y + height / 2;
    const count = 12;
    
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const particle = this.getParticle(
        centerX + randomRange(-width/4, width/4),
        centerY + randomRange(-height/4, height/4),
        color,
        {
          angle: angle,
          speed: randomRange(2, 5),
          gravity: 0.15,
          size: randomRange(3, 6),
          shape: 'square'
        }
      );
      this.particles.push(particle);
    }
    
    // Искры
    for (let i = 0; i < 6; i++) {
      const particle = this.getParticle(
        centerX, centerY, '#ffffff',
        {
          speed: randomRange(4, 8),
          gravity: 0.1,
          size: randomRange(1, 3),
          shape: 'spark',
          decay: 0.05
        }
      );
      this.particles.push(particle);
    }
  }
  
  // Вспышка при подборе power-up
  powerupCollect(x, y, color) {
    for (let i = 0; i < 20; i++) {
      const particle = this.getParticle(
        x, y, color,
        {
          speed: randomRange(3, 7),
          gravity: -0.1, // летят вверх
          size: randomRange(2, 4),
          shape: 'circle',
          decay: 0.03
        }
      );
      this.particles.push(particle);
    }
  }
  
  // Удар о платформу
  paddleHit(x, y) {
    for (let i = 0; i < 8; i++) {
      const particle = this.getParticle(
        x, y, '#6a8cff',
        {
          angle: randomRange(-Math.PI * 0.8, -Math.PI * 0.2),
          speed: randomRange(1, 3),
          gravity: 0.1,
          size: randomRange(1, 3),
          shape: 'circle',
          decay: 0.04
        }
      );
      this.particles.push(particle);
    }
  }
  
  // Потеря жизни (красный взрыв внизу)
  loseLife(x, y) {
    for (let i = 0; i < 30; i++) {
      const particle = this.getParticle(
        x, y, i % 2 === 0 ? '#ff4466' : '#ff8888',
        {
          speed: randomRange(2, 8),
          gravity: 0.3,
          size: randomRange(3, 8),
          shape: 'square',
          decay: 0.02
        }
      );
      this.particles.push(particle);
    }
  }
  
  update(dt = 1) {
    // Обновляем и удаляем мёртвые
    this.particles = this.particles.filter(p => {
      p.update(dt);
      if (!p.alive) {
        this.pool.push(p); // возвращаем в пул
        return false;
      }
      return true;
    });
  }
  
  draw(ctx) {
    for (const particle of this.particles) {
      particle.draw(ctx);
    }
  }
  
  get count() {
    return this.particles.length;
  }
}




