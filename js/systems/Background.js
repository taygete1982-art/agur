import { CONFIG } from '../config.js?v=202608210103';

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

    // Небо во всю высоту
    this.skyCanvas = document.createElement('canvas');
    this.skyCanvas.width = CONFIG.WIDTH;
    this.skyCanvas.height = CONFIG.HEIGHT;
    const sc = this.skyCanvas.getContext('2d');
    const grad = sc.createLinearGradient(0, 0, 0, CONFIG.HEIGHT);
    grad.addColorStop(0, bg.sky);
    grad.addColorStop(0.5, '#241a14');
    grad.addColorStop(1, '#1a120c');
    sc.fillStyle = grad;
    sc.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);

    if (bg.landmark === 'moon') {
      sc.fillStyle = bg.sun;
      sc.beginPath();
      sc.arc(CONFIG.WIDTH * 0.8, CONFIG.HEIGHT * 0.12, 26, 0, Math.PI * 2);
      sc.fill();
      sc.globalCompositeOperation = 'destination-out';
      sc.beginPath();
      sc.arc(CONFIG.WIDTH * 0.8 - 9, CONFIG.HEIGHT * 0.12 - 4, 22, 0, Math.PI * 2);
      sc.fill();
      sc.globalCompositeOperation = 'source-over';
      sc.fillStyle = 'rgba(240, 240, 255, 0.8)';
      for (let i = 0; i < 40; i++) {
        sc.fillRect(Math.random() * CONFIG.WIDTH, Math.random() * CONFIG.HEIGHT * 0.3, 1.5, 1.5);
      }
    } else if (bg.landmark !== 'gate') {
      sc.fillStyle = bg.sun;
      sc.beginPath();
      sc.arc(CONFIG.WIDTH * 0.72, CONFIG.HEIGHT * 0.1, 30, 0, Math.PI * 2);
      sc.fill();
    }

    // Ландмарка: призрачный силуэт в свободной зоне под кирпичами
    this.landmarkCanvas = document.createElement('canvas');
    this.landmarkCanvas.width = CONFIG.WIDTH;
    this.landmarkCanvas.height = CONFIG.HEIGHT * 0.25;
    const lm = this.landmarkCanvas.getContext('2d');
    lm.fillStyle = bg.sky;
    lm.globalAlpha = 0.22;
    const H = this.landmarkCanvas.height;
    if (bg.landmark === 'ziggurat') {
      lm.beginPath();
      lm.moveTo(CONFIG.WIDTH * 0.25, H);
      lm.lineTo(CONFIG.WIDTH * 0.38, H * 0.25);
      lm.lineTo(CONFIG.WIDTH * 0.62, H * 0.25);
      lm.lineTo(CONFIG.WIDTH * 0.75, H);
      lm.fill();
      lm.fillRect(CONFIG.WIDTH * 0.42, H * 0.05, CONFIG.WIDTH * 0.16, H * 0.25);
    } else if (bg.landmark === 'palm') {
      lm.fillRect(CONFIG.WIDTH * 0.48, H * 0.3, 10, H * 0.7);
      lm.beginPath();
      lm.ellipse(CONFIG.WIDTH * 0.49, H * 0.28, 60, 30, 0, 0, Math.PI * 2);
      lm.fill();
    } else if (bg.landmark === 'boat') {
      lm.beginPath();
      lm.moveTo(CONFIG.WIDTH * 0.3, H * 0.75);
      lm.quadraticCurveTo(CONFIG.WIDTH * 0.5, H * 0.95, CONFIG.WIDTH * 0.7, H * 0.75);
      lm.lineTo(CONFIG.WIDTH * 0.65, H * 0.7);
      lm.lineTo(CONFIG.WIDTH * 0.35, H * 0.7);
      lm.fill();
      lm.fillRect(CONFIG.WIDTH * 0.49, H * 0.2, 6, H * 0.5);
    } else if (bg.landmark === 'peak') {
      lm.beginPath();
      lm.moveTo(CONFIG.WIDTH * 0.15, H);
      lm.lineTo(CONFIG.WIDTH * 0.4, H * 0.1);
      lm.lineTo(CONFIG.WIDTH * 0.6, H);
      lm.moveTo(CONFIG.WIDTH * 0.5, H);
      lm.lineTo(CONFIG.WIDTH * 0.72, H * 0.25);
      lm.lineTo(CONFIG.WIDTH * 0.9, H);
      lm.fill();
    } else if (bg.landmark === 'crystal') {
      for (let i = 0; i < 6; i++) {
        lm.beginPath();
        lm.moveTo(CONFIG.WIDTH * (0.15 + i * 0.13), H);
        lm.lineTo(CONFIG.WIDTH * (0.18 + i * 0.13), H * (0.3 + (i % 3) * 0.15));
        lm.lineTo(CONFIG.WIDTH * (0.21 + i * 0.13), H);
        lm.fill();
      }
    } else if (bg.landmark === 'hill') {
      lm.beginPath();
      lm.ellipse(CONFIG.WIDTH * 0.3, H, CONFIG.WIDTH * 0.4, H * 0.7, 0, Math.PI, 0);
      lm.ellipse(CONFIG.WIDTH * 0.8, H, CONFIG.WIDTH * 0.35, H * 0.5, 0, Math.PI, 0);
      lm.fill();
    } else if (bg.landmark === 'gate') {
      lm.fillRect(CONFIG.WIDTH * 0.32, H * 0.15, 24, H * 0.85);
      lm.fillRect(CONFIG.WIDTH * 0.64, H * 0.15, 24, H * 0.85);
      lm.fillRect(CONFIG.WIDTH * 0.32, H * 0.15, CONFIG.WIDTH * 0.36, 24);
    }
    lm.globalAlpha = 1;

    // Параллакс: силуэты ВНУТРИ своего канваса, тонированные небом
    this.parallaxLayers = [];
    for (let i = 0; i < 3; i++) {
      const layer = document.createElement('canvas');
      layer.width = CONFIG.WIDTH * 2;
      layer.height = CONFIG.HEIGHT * 0.22;
      const l = layer.getContext('2d');
      l.fillStyle = bg.sky;
      l.globalAlpha = 0.07 + i * 0.06;
      const yBase = layer.height - 6 - i * 26;
      for (let x = 0; x < layer.width; x += 70 + ((x * 7919) % 50)) {
        const h = 18 + ((x * 104729) % 40);
        l.fillRect(x, yBase - h, 54, h);
      }
      l.globalAlpha = 1;
      this.parallaxLayers.push({ canvas: layer, speed: 0.15 + i * 0.12, offset: 0 });
    }

    // Амбиент-частицы: больше и заметнее
    this.particles = [];
    for (let i = 0; i < 24; i++) {
      this.particles.push({
        x: Math.random() * CONFIG.WIDTH,
        y: Math.random() * CONFIG.HEIGHT,
        vx: (Math.random() - 0.5) * 0.4,
        vy: bg.particles === 'ember' ? -0.3 - Math.random() * 0.3 : (Math.random() - 0.5) * 0.25,
        size: 1 + Math.random() * 2.2,
        life: Math.random() * 10,
        type: bg.particles,
      });
    }
  }

  update(dt) {
    for (const p of this.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life += 0.02 * dt;
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

    ctx.fillStyle = 'rgba(0,0,0,0.1)';
    ctx.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);

    if (this.skyCanvas) {
      ctx.globalAlpha = 0.9;
      ctx.drawImage(this.skyCanvas, 0, 0);
      ctx.globalAlpha = 1;
    }

    if (this.landmarkCanvas) {
      ctx.drawImage(this.landmarkCanvas, 0, CONFIG.HEIGHT * 0.5);
    }

    for (const layer of this.parallaxLayers) {
      ctx.drawImage(layer.canvas, -layer.offset, CONFIG.HEIGHT * 0.78);
      ctx.drawImage(layer.canvas, layer.canvas.width - layer.offset, CONFIG.HEIGHT * 0.78);
    }

    for (const p of this.particles) {
      const alpha = 0.35 + Math.sin(p.life * 2) * 0.25;
      if (p.type === 'dust') ctx.fillStyle = 'rgba(220, 190, 140, ' + alpha + ')';
      else if (p.type === 'fireflies') ctx.fillStyle = 'rgba(240, 230, 100, ' + alpha + ')';
      else if (p.type === 'splash') ctx.fillStyle = 'rgba(180, 220, 240, ' + alpha + ')';
      else if (p.type === 'stone') ctx.fillStyle = 'rgba(150, 140, 130, ' + alpha + ')';
      else if (p.type === 'glint') ctx.fillStyle = 'rgba(255, 255, 255, ' + alpha + ')';
      else if (p.type === 'star') ctx.fillStyle = 'rgba(240, 240, 255, ' + alpha + ')';
      else ctx.fillStyle = 'rgba(255, 90, 40, ' + alpha + ')';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }

    // Кур: сдержанная психоделика — пульсирующие полутоновые кольца
    if (biome % 8 === 7) {
      const t = performance.now() / 2000;
      ctx.globalAlpha = 0.06;
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








