import { CONFIG } from '../config.js';

const BIOME_BACKGROUNDS = [
  { name: 'Пески', sky: '#d9a441', sun: '#ffffff', landmark: 'ziggurat', particles: 'dust' },
  { name: 'Оазис', sky: '#8a9a4a', sun: '#f0e060', landmark: 'palm', particles: 'fireflies' },
  { name: 'Евфрат', sky: '#4a8a9a', sun: '#e0c060', landmark: 'boat', particles: 'splash' },
  { name: 'Степь', sky: '#c9853f', sun: '#f0d080', landmark: 'hill', particles: 'dust' },
  { name: 'Загрос', sky: '#5a6a7a', sun: '#a0b0c0', landmark: 'peak', particles: 'stone' },
  { name: 'Солёные равнины', sky: '#e8e0d8', sun: '#ffffff', landmark: 'crystal', particles: 'glint' },
  { name: 'Ночная пустыня', sky: '#16264c', sun: '#e0e8f0', landmark: 'moon', particles: 'star' },
  { name: 'Кур', sky: '#000000', sun: '#ff4020', landmark: 'gate', particles: 'ember' },
];

export class Background {
  constructor() {
    this.particles = [];
    this.cachedBiome = -1;
    this.skyCanvas = null;
    this.landmarkCanvas = null;
    this.parallaxLayers = [];
  }

  buildBiome(biome) {
    if (this.cachedBiome === biome) return;
    this.cachedBiome = biome;
    const bg = BIOME_BACKGROUNDS[biome % BIOME_BACKGROUNDS.length];

    // Небо с небесным телом
    this.skyCanvas = document.createElement('canvas');
    this.skyCanvas.width = CONFIG.WIDTH;
    this.skyCanvas.height = CONFIG.HEIGHT * 0.4;
    const skyCtx = this.skyCanvas.getContext('2d');
    const grad = skyCtx.createLinearGradient(0, 0, 0, this.skyCanvas.height);
    grad.addColorStop(0, bg.sky);
    grad.addColorStop(1, 'rgba(0,0,0,0.3)');
    skyCtx.fillStyle = grad;
    skyCtx.fillRect(0, 0, this.skyCanvas.width, this.skyCanvas.height);

    if (bg.landmark === 'moon') {
      skyCtx.fillStyle = bg.sun;
      skyCtx.beginPath();
      skyCtx.arc(CONFIG.WIDTH * 0.8, this.skyCanvas.height * 0.3, 30, 0, Math.PI * 2);
      skyCtx.fill();
      skyCtx.globalCompositeOperation = 'destination-out';
      skyCtx.beginPath();
      skyCtx.arc(CONFIG.WIDTH * 0.8 - 10, this.skyCanvas.height * 0.3 - 5, 25, 0, Math.PI * 2);
      skyCtx.fill();
      skyCtx.globalCompositeOperation = 'source-over';
    } else if (bg.landmark !== 'gate') {
      skyCtx.fillStyle = bg.sun;
      skyCtx.beginPath();
      skyCtx.arc(CONFIG.WIDTH * 0.7, this.skyCanvas.height * 0.35, 40, 0, Math.PI * 2);
      skyCtx.fill();
    }

    // Ландмарка на горизонте
    this.landmarkCanvas = document.createElement('canvas');
    this.landmarkCanvas.width = CONFIG.WIDTH;
    this.landmarkCanvas.height = CONFIG.HEIGHT * 0.3;
    const lmCtx = this.landmarkCanvas.getContext('2d');
    lmCtx.fillStyle = 'rgba(0,0,0,0.2)';
    if (bg.landmark === 'ziggurat') {
      lmCtx.beginPath();
      lmCtx.moveTo(CONFIG.WIDTH * 0.3, this.landmarkCanvas.height);
      lmCtx.lineTo(CONFIG.WIDTH * 0.4, this.landmarkCanvas.height * 0.3);
      lmCtx.lineTo(CONFIG.WIDTH * 0.6, this.landmarkCanvas.height * 0.3);
      lmCtx.lineTo(CONFIG.WIDTH * 0.7, this.landmarkCanvas.height);
      lmCtx.fill();
    } else if (bg.landmark === 'palm') {
      lmCtx.fillRect(CONFIG.WIDTH * 0.45, this.landmarkCanvas.height * 0.4, 8, this.landmarkCanvas.height * 0.6);
      lmCtx.beginPath();
      lmCtx.ellipse(CONFIG.WIDTH * 0.45, this.landmarkCanvas.height * 0.35, 40, 25, 0, 0, Math.PI * 2);
      lmCtx.fill();
    } else if (bg.landmark === 'boat') {
      lmCtx.fillRect(CONFIG.WIDTH * 0.4, this.landmarkCanvas.height * 0.7, 60, 10);
      lmCtx.fillRect(CONFIG.WIDTH * 0.48, this.landmarkCanvas.height * 0.4, 6, this.landmarkCanvas.height * 0.3);
    } else if (bg.landmark === 'peak') {
      lmCtx.beginPath();
      lmCtx.moveTo(CONFIG.WIDTH * 0.2, this.landmarkCanvas.height);
      lmCtx.lineTo(CONFIG.WIDTH * 0.4, this.landmarkCanvas.height * 0.2);
      lmCtx.lineTo(CONFIG.WIDTH * 0.6, this.landmarkCanvas.height);
      lmCtx.fill();
    } else if (bg.landmark === 'crystal') {
      for (let i = 0; i < 5; i++) {
        lmCtx.fillRect(CONFIG.WIDTH * 0.2 + i * CONFIG.WIDTH * 0.12, this.landmarkCanvas.height * 0.6, 20, this.landmarkCanvas.height * 0.4);
      }
    } else if (bg.landmark === 'moon') {
      lmCtx.fillRect(CONFIG.WIDTH * 0.3, this.landmarkCanvas.height * 0.8, CONFIG.WIDTH * 0.4, this.landmarkCanvas.height * 0.2);
    } else if (bg.landmark === 'gate') {
      lmCtx.fillRect(CONFIG.WIDTH * 0.35, this.landmarkCanvas.height * 0.3, 20, this.landmarkCanvas.height * 0.7);
      lmCtx.fillRect(CONFIG.WIDTH * 0.65, this.landmarkCanvas.height * 0.3, 20, this.landmarkCanvas.height * 0.7);
      lmCtx.fillRect(CONFIG.WIDTH * 0.35, this.landmarkCanvas.height * 0.3, CONFIG.WIDTH * 0.3, 20);
    }

    // Параллакс-слои (2-3 слоя силуэтов)
    this.parallaxLayers = [];
    for (let i = 0; i < 3; i++) {
      const layer = document.createElement('canvas');
      layer.width = CONFIG.WIDTH * 2;
      layer.height = CONFIG.HEIGHT * 0.2;
      const lCtx = layer.getContext('2d');
      lCtx.fillStyle = `rgba(0,0,0,${0.1 + i * 0.08})`;
      const yBase = this.landmarkCanvas.height - i * 30;
      for (let x = 0; x < layer.width; x += 80 + Math.random() * 40) {
        const h = 20 + Math.random() * 40;
        lCtx.fillRect(x, yBase - h, 60, h);
      }
      this.parallaxLayers.push({ canvas: layer, speed: 0.2 + i * 0.15, offset: 0 });
    }

    // Амбиент-частицы
    this.particles = [];
    for (let i = 0; i < 15; i++) {
      this.particles.push({
        x: Math.random() * CONFIG.WIDTH,
        y: Math.random() * CONFIG.HEIGHT,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.2 - 0.1,
        size: 1 + Math.random() * 2,
        life: Math.random(),
        type: bg.particles,
      });
    }
  }

  update(dt) {
    for (const p of this.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life += 0.01 * dt;
      if (p.x < 0) p.x = CONFIG.WIDTH;
      if (p.x > CONFIG.WIDTH) p.x = 0;
      if (p.y < 0) p.y = CONFIG.HEIGHT;
      if (p.y > CONFIG.HEIGHT) p.y = 0;
    }
    for (const layer of this.parallaxLayers) {
      layer.offset = (layer.offset + layer.speed * dt) % CONFIG.WIDTH;
    }
  }

  draw(ctx, biome) {
    this.buildBiome(biome);

    // Scrim-подложка для контраста
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);

    // Небо
    if (this.skyCanvas) {
      ctx.globalAlpha = 0.85;
      ctx.drawImage(this.skyCanvas, 0, 0);
      ctx.globalAlpha = 1;
    }

    // Ландмарка
    if (this.landmarkCanvas) {
      ctx.globalAlpha = 0.55;
      ctx.drawImage(this.landmarkCanvas, 0, CONFIG.HEIGHT * 0.35);
      ctx.globalAlpha = 1;
    }

    // Параллакс-слои
    for (const layer of this.parallaxLayers) {
      ctx.globalAlpha = 0.45;
      ctx.drawImage(layer.canvas, -layer.offset, CONFIG.HEIGHT * 0.75);
      ctx.drawImage(layer.canvas, layer.canvas.width - layer.offset, CONFIG.HEIGHT * 0.75);
      ctx.globalAlpha = 1;
    }

    // Амбиент-частицы
    for (const p of this.particles) {
      const alpha = 0.3 + Math.sin(p.life * 2) * 0.2;
      if (p.type === 'dust') {
        ctx.fillStyle = `rgba(200, 180, 140, ${alpha})`;
      } else if (p.type === 'fireflies') {
        ctx.fillStyle = `rgba(240, 230, 100, ${alpha})`;
      } else if (p.type === 'splash') {
        ctx.fillStyle = `rgba(180, 220, 240, ${alpha})`;
      } else if (p.type === 'stone') {
        ctx.fillStyle = `rgba(120, 110, 100, ${alpha})`;
      } else if (p.type === 'glint') {
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      } else if (p.type === 'star') {
        ctx.fillStyle = `rgba(240, 240, 255, ${alpha})`;
      } else if (p.type === 'ember') {
        ctx.fillStyle = `rgba(255, 80, 30, ${alpha})`;
      }
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }

    // Кур: дорогая психоделика — пульсирующие полутоновые кольца
    if (biome % 8 === 7) {
      const t = performance.now() / 2000;
      ctx.globalAlpha = 0.05;
      ctx.strokeStyle = '#ff6030';
      ctx.lineWidth = 2;
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.arc(CONFIG.WIDTH / 2, CONFIG.HEIGHT * 0.5, 80 + i * 70 + Math.sin(t + i) * 12, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
  }
}

