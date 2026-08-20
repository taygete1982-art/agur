import { CONFIG, GAME_STATE } from '../config.js?v=202608201545';

export class Renderer {
  constructor(game) {
    this.g = game;
    document.body.style.background = '#241a14';
  }

  draw() {
    const g = this.g;
    const ctx = g.ctx;
    if (!g.paddle || !g.canvas || !ctx) return;

    ctx.save();
    if (g.shakeIntensity > 0) {
      ctx.translate((Math.random() - 0.5) * g.shakeIntensity, (Math.random() - 0.5) * g.shakeIntensity);
    }
    ctx.clearRect(-20, -20, CONFIG.WIDTH + 40, CONFIG.HEIGHT + 40);
    if (g.background) g.background.draw(ctx, window.__biome || 0);
    if (g.popups) {
      for (const p of g.popups) {
        ctx.globalAlpha = 1 - p.t;
        ctx.fillStyle = '#f0d9a8';
        ctx.font = 'bold 13px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(p.text, p.x, p.y - p.t * 30);
      }
      ctx.globalAlpha = 1;
    }

    this.drawBackground(ctx);

    for (const brick of g.bricks) {
      if (brick.breakPhase < 1) {
        ctx.save();
        const cx = brick.x + brick.width / 2;
        const cy = brick.y + brick.height / 2;
        ctx.translate(cx, cy);
        ctx.scale(brick.breakPhase, brick.breakPhase);
        ctx.globalAlpha = brick.breakPhase;
        ctx.translate(-cx, -cy);
        brick.draw(ctx);
        ctx.restore();
      } else {
        brick.draw(ctx);
      }
    }
    for (const d of (g.demons || [])) {
      ctx.save();
      ctx.translate(d.x, d.y);
      ctx.fillStyle = '#3a2a4a';
      ctx.beginPath();
      ctx.ellipse(0, 0, 16, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      const w = Math.sin(d.phase * 3) * 6;
      ctx.strokeStyle = 'rgba(138, 90, 156, 0.8)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-14, -4); ctx.quadraticCurveTo(-26, -12 - w, -30, -2 - w);
      ctx.moveTo(14, -4); ctx.quadraticCurveTo(26, -12 - w, 30, -2 - w);
      ctx.stroke();
      ctx.fillStyle = '#ff6030';
      ctx.beginPath();
      ctx.arc(-5, -2, 2.5, 0, Math.PI * 2);
      ctx.arc(5, -2, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    if (g.boss) {
      const bs = g.boss;
      ctx.save();
      ctx.fillStyle = '#26262c';
      ctx.beginPath();
      ctx.roundRect(bs.x, bs.y, bs.w, bs.h, 8);
      ctx.fill();
      ctx.strokeStyle = '#c98a1a';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#c98a1a';
      ctx.beginPath();
      ctx.moveTo(bs.x + 12, bs.y); ctx.lineTo(bs.x + 2, bs.y - 16); ctx.lineTo(bs.x + 24, bs.y);
      ctx.moveTo(bs.x + bs.w - 12, bs.y); ctx.lineTo(bs.x + bs.w - 2, bs.y - 16); ctx.lineTo(bs.x + bs.w - 24, bs.y);
      ctx.fill();
      ctx.fillStyle = '#ff4020';
      ctx.beginPath();
      ctx.arc(bs.x + bs.w * 0.35, bs.y + bs.h / 2, 4, 0, Math.PI * 2);
      ctx.arc(bs.x + bs.w * 0.65, bs.y + bs.h / 2, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(bs.x, bs.y - 26, bs.w, 6);
      ctx.fillStyle = '#ff4020';
      ctx.fillRect(bs.x, bs.y - 26, bs.w * Math.max(0, bs.hp / bs.maxHp), 6);
      ctx.restore();
    }
    for (const p of (g.bossBolts || [])) {
      ctx.fillStyle = '#ff6030';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
      ctx.fill();
    }
    for (const powerUp of g.powerUps) powerUp.draw(ctx);
    g.paddle.draw(ctx);
    if (g.catchMode) {
      ctx.save();
      ctx.strokeStyle = 'rgba(240, 217, 168, 0.7)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(g.paddle.x - 2, g.paddle.y - 2, g.paddle.width + 4, g.paddle.height + 4, 8);
      ctx.stroke();
      ctx.restore();
    }
    if (g.laserTimer > 0) {
      ctx.save();
      ctx.fillStyle = 'rgba(255, 230, 120, 0.8)';
      ctx.fillRect(g.paddle.x + 3, g.paddle.y - 6, 4, 4);
      ctx.fillRect(g.paddle.x + g.paddle.width - 7, g.paddle.y - 6, 4, 4);
      ctx.restore();
    }
    for (const l of g.lasers) {
      ctx.save();
      const g1 = ctx.createLinearGradient(l.x, l.y, l.x, l.y + 18);
      g1.addColorStop(0, 'rgba(255, 240, 140, 1)');
      g1.addColorStop(1, 'rgba(255, 180, 60, 0)');
      ctx.fillStyle = g1;
      ctx.fillRect(l.x - 2, l.y, 4, 18);
      ctx.restore();
    }
    for (const ball of g.balls) ball.draw(ctx);
    g.particles.draw(ctx);
    g.effects.draw(ctx);
    this.drawZShards(ctx);
    this.drawTouchZone(ctx);

    ctx.restore();

    this.drawVignette(ctx);
    this.drawBannerAndCombo(ctx);
    this.drawMessages(ctx);
  }

  drawBackground(ctx) {
    const hzT = performance.now() / 1000;
    const pulse = 0.5 + Math.sin(hzT * 0.8) * 0.5;
    const bgGrad = ctx.createRadialGradient(CONFIG.WIDTH / 2, CONFIG.HEIGHT * 0.35, 50, CONFIG.WIDTH / 2, CONFIG.HEIGHT * 0.5, CONFIG.HEIGHT * 0.8);
    bgGrad.addColorStop(0, 'rgba(217, 164, 65, ' + (0.05 + pulse * 0.05).toFixed(3) + ')');
    bgGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);
    ctx.strokeStyle = 'rgba(240, 201, 106, 0.05)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      for (let x = 0; x <= CONFIG.WIDTH; x += 20) {
        const y = CONFIG.HEIGHT * 0.25 + i * 90 + Math.sin(x * 0.02 + hzT * 2 + i) * 8;
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }

  drawZShards(ctx) {
    const g = this.g;
    if (!g.zShards.length) return;
    const F = 260;
    const cx = CONFIG.WIDTH / 2;
    const cy = CONFIG.HEIGHT / 2;
    ctx.save();
    for (const s of g.zShards) {
      const scale = F / (F - Math.min(s.z, 250));
      const drift = s.face ? 0.15 : 1;
      const px = cx + s.ox * (1 + (scale - 1) * drift);
      const py = cy + s.oy * (1 + (scale - 1) * drift);
      if (px < -100 || px > CONFIG.WIDTH + 100 || py < -100 || py > CONFIG.HEIGHT + 100) continue;
      const sz = s.size * scale * (s.face ? 1.4 : 1);
      const fade = Math.min(1, s.t * 0.6) * Math.max(0, 1 - s.z / 250);
      const ang = Math.atan2(py - cy, px - cx) + s.rot;
      const stretch = 1 + Math.min(scale - 1, 2.5) * 0.7;
      ctx.globalAlpha = fade;
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(ang);
      ctx.fillStyle = s.color;
      ctx.fillRect((-sz * stretch) / 2, -sz / 3, sz * stretch, sz * 0.66);
      ctx.restore();
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  drawTouchZone(ctx) {
    const g = this.g;
    const zoneY = CONFIG.HEIGHT - CONFIG.TOUCH.ZONE_HEIGHT;
    const trackX = 70;
    const trackW = CONFIG.WIDTH - 140;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.beginPath();
    ctx.roundRect(trackX, zoneY + 40, trackW, 10, 5);
    ctx.fill();
    ctx.strokeStyle = 'rgba(217, 164, 65, 0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(trackX, zoneY + 40, trackW, 10, 5);
    ctx.stroke();
    const trackT = (CONFIG.WIDTH - g.paddle.width) > 0 ? g.paddle.x / (CONFIG.WIDTH - g.paddle.width) : 0.5;
    const trackerX = trackX + trackT * trackW;
    ctx.fillStyle = 'rgba(240, 201, 106, 0.25)';
    ctx.beginPath();
    ctx.arc(trackerX, zoneY + 45, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f0c96a';
    ctx.beginPath();
    ctx.arc(trackerX, zoneY + 45, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff9e6';
    ctx.beginPath();
    ctx.arc(trackerX - 2, zoneY + 43, 3, 0, Math.PI * 2);
    ctx.fill();

    const btns = [
      { x: 35, cd: g.quakeCooldown, max: 45 * 60, icon: '\u{1F30D}' },
      { x: CONFIG.WIDTH - 35, cd: g.aimCooldown, max: 20 * 60, icon: '\u{1F3AF}' },
    ];
    for (const b of btns) {
      const ready = b.cd <= 0;
      ctx.strokeStyle = ready ? 'rgba(240, 201, 106, 0.8)' : 'rgba(217, 164, 65, 0.25)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(b.x, zoneY + 45, 24, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = ready ? 'rgba(240, 201, 106, 0.15)' : 'rgba(217, 164, 65, 0.06)';
      ctx.fill();
      if (!ready) {
        ctx.strokeStyle = '#f0c96a';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(b.x, zoneY + 45, 24, -Math.PI / 2, -Math.PI / 2 + (1 - b.cd / b.max) * Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalAlpha = ready ? 1 : 0.35;
      ctx.font = '20px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#f0c96a';
      ctx.fillText(b.icon, b.x, zoneY + 46);
      ctx.globalAlpha = 1;
    }
  }

  drawVignette(ctx) {
    const vg = ctx.createRadialGradient(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2, CONFIG.HEIGHT * 0.35, CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2, CONFIG.HEIGHT * 0.75);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,0.35)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);
  }

  drawBannerAndCombo(ctx) {
    const g = this.g;
    if (g.banner) {
      ctx.globalAlpha = Math.min(1, g.banner.timer / 30);
      ctx.fillStyle = '#f0c96a';
      ctx.font = 'bold 24px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = '#d9a441';
      ctx.shadowBlur = 20;
      ctx.fillText(g.banner.text, CONFIG.WIDTH / 2, 90);
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    }
    if (g.laserTimer > 0 || g.catchTimer > 0) {
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'left';
      let y = 18;
      if (g.laserTimer > 0) {
        ctx.fillStyle = '#fde047';
        ctx.fillText('⚡ Молния ' + Math.ceil(g.laserTimer / 1000) + 'с', 12, y);
        y += 18;
      }
      if (g.catchTimer > 0) {
        ctx.fillStyle = '#f0d9a8';
        ctx.fillText('✋ Рука ' + Math.ceil(g.catchTimer / 1000) + 'с', 12, y);
      }
    }
    if (g.combo >= 2 && g.state === GAME_STATE.PLAYING) {
      ctx.fillStyle = '#f0c96a';
      ctx.font = 'bold ' + Math.min(20 + g.combo, 40) + 'px "Segoe UI", sans-serif';
      ctx.textAlign = 'right';
      ctx.shadowColor = '#d9a441';
      ctx.shadowBlur = 15;
      ctx.fillText('Комбо x' + g.combo, CONFIG.WIDTH - 12, 30);
      ctx.shadowBlur = 0;
    }
  }

  drawMessages(ctx) {
    const g = this.g;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    switch (g.state) {
      case GAME_STATE.MENU:
        this.drawCenterText(ctx, '\u{1F3FA} AGUR', 48, '#f0c96a', 0);
        this.drawCenterText(ctx, 'пески помнят всё', 20, '#a8845c', 50);
        this.drawCenterText(ctx, 'Кликните, чтобы начать', 22, 'rgba(255,255,255,0.7)', 90);
        this.drawCenterText(ctx, '\u{1F3C6} Рекорд: ' + g.bestScore, 18, '#a8845c', 130);
        break;
      case GAME_STATE.PAUSED:
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);
        this.drawCenterText(ctx, '\u{23F8}\u{FE0F} ПАУЗА', 42, '#fff', 0);
        this.drawCenterText(ctx, 'ESC - продолжить', 20, 'rgba(255,255,255,0.6)', 50);
        break;
      case GAME_STATE.GAME_OVER:
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);
        this.drawCenterText(ctx, '\u{1F494} Игра окончена', 44, '#ff4466', 0);
        this.drawCenterText(ctx, 'Счёт: ' + g.score, 28, '#fff', 50);
        this.drawCenterText(ctx, 'Кликните, чтобы начать заново', 20, 'rgba(255,255,255,0.6)', 100);
        break;
      case GAME_STATE.WIN:
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);
        this.drawCenterText(ctx, '\u{1F389} ПОБЕДА!', 48, '#4ade80', 0);
        this.drawCenterText(ctx, 'Финальный счёт: ' + g.score, 28, '#fff', 60);
        this.drawCenterText(ctx, 'Кликните, чтобы сыграть ещё', 20, 'rgba(255,255,255,0.6)', 110);
        break;
      case GAME_STATE.LEVEL_TRANSITION:
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);
        this.drawCenterText(ctx, '\u{2728} ' + g.levelManager.getLevelName(g.level), 34, '#ffd97d', 0);
        this.drawCenterText(ctx, 'Уровень пройден!', 24, 'rgba(255,255,255,0.7)', 50);
        break;
    }
  }

  drawCenterText(ctx, text, size, color, offsetY) {
    ctx.fillStyle = color;
    ctx.font = 'bold ' + size + 'px "Segoe UI", sans-serif';
    ctx.shadowColor = color;
    ctx.shadowBlur = 20;
    ctx.fillText(text, CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2 + offsetY);
    ctx.shadowBlur = 0;
  }
}





















