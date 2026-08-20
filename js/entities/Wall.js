export class Wall {
  constructor(x, y, w, h) { this.x = x; this.y = y; this.w = w; this.h = h; }
  // Отскок мяча от произвольного прямоугольника
  resolve(ball) {
    if (!(ball.x + ball.radius > this.x && ball.x - ball.radius < this.x + this.w &&
          ball.y + ball.radius > this.y && ball.y - ball.radius < this.y + this.h)) return false;
    const left = (ball.x + ball.radius) - this.x;
    const right = (this.x + this.w) - (ball.x - ball.radius);
    const top = (ball.y + ball.radius) - this.y;
    const bottom = (this.y + this.h) - (ball.y - ball.radius);
    const m = Math.min(left, right, top, bottom);
    if (m === top) { ball.y = this.y - ball.radius; ball.dy = -Math.abs(ball.dy); }
    else if (m === bottom) { ball.y = this.y + this.h + ball.radius; ball.dy = Math.abs(ball.dy); }
    else if (m === left) { ball.x = this.x - ball.radius; ball.dx = -Math.abs(ball.dx); }
    else { ball.x = this.x + this.w + ball.radius; ball.dx = Math.abs(ball.dx); }
    return true;
  }
  draw(ctx) {
    ctx.save();
    ctx.fillStyle = '#26262c'; ctx.strokeStyle = '#4a4a52'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect(this.x, this.y, this.w, this.h, 3); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.fillRect(this.x + 2, this.y + 2, this.w - 4, 3);
    ctx.restore();
  }
}
