// js/game/Game.js — упрощённая версия с поддержкой стен и артефактов
import { Ball } from '../entities/Ball.js?v=202608201612';
import { Paddle } from '../entities/Paddle.js?v=202608201612';
import { Brick } from '../entities/Brick.js?v=202608201612';

export class Game {
    constructor(canvas, levelData) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;

        // Новые поля для стен и артефактов
        this.walls = levelData.walls || [];
        this.artifact = levelData.artifact || null;
        this.extraBlocks = levelData.extraBlocks || [];
        this.customGravity = levelData.gravity || 0.5;
        this.timeLimit = levelData.timeLimit || 0;
        this.timer = 0;

        // Игровые объекты
        this.paddle = new Paddle(this.width / 2 - 50, this.height - 40, 100, 15);
        this.ball = new Ball(this.width / 2, this.height - 60, 8);
        this.bricks = [];

        // Состояние
        this.score = 0;
        this.lives = 3;
        this.win = false;
        this.lose = false;
        this.paused = false;

        // Загрузка блоков (обычные + extraBlocks)
        if (levelData.blocks) {
            this.bricks = levelData.blocks.map(b => new Brick(b.x, b.y, b.w, b.h, b.hp || 1, b.type));
        }
        if (this.extraBlocks.length) {
            this.bricks = this.bricks.concat(this.extraBlocks.map(b => new Brick(b.x, b.y, b.w, b.h, b.hp || 1, b.type)));
        }

        // Запуск
        this.start();
    }

    start() {
        this.ball.x = this.width / 2;
        this.ball.y = this.height - 60;
        this.ball.dx = 2 * (Math.random() > 0.5 ? 1 : -1);
        this.ball.dy = -4;
        this.ball.speed = 4;
        this.paddle.x = this.width / 2 - 50;
        this.win = false;
        this.lose = false;
        this.timer = 0;
        this.mouseX = null;
        this.gameLoop();
    }

    gameLoop() {
        if (this.paused) {
            requestAnimationFrame(() => this.gameLoop());
            return;
        }
        this.update();
        this.render();
        if (!this.win && !this.lose) {
            requestAnimationFrame(() => this.gameLoop());
        }
    }

    update() {
        // Таймер
        if (this.timeLimit > 0) {
            this.timer += 1/60;
            if (this.timer >= this.timeLimit) {
                this.lose = true;
                return;
            }
        }

        // Движение платформы (мышь)
        if (this.mouseX !== null) {
            this.paddle.x = this.mouseX - this.paddle.w / 2;
        }
        this.paddle.x = Math.max(0, Math.min(this.width - this.paddle.w, this.paddle.x));

        // Движение мяча
        this.ball.x += this.ball.dx;
        this.ball.y += this.ball.dy;

        // Столкновения со стенами Canvas
        if (this.ball.x - this.ball.r < 0 || this.ball.x + this.ball.r > this.width) {
            this.ball.dx *= -1;
        }
        if (this.ball.y - this.ball.r < 0) {
            this.ball.dy *= -1;
        }
        if (this.ball.y + this.ball.r > this.height) {
            this.lives--;
            if (this.lives <= 0) {
                this.lose = true;
                return;
            } else {
                this.ball.x = this.width / 2;
                this.ball.y = this.height - 60;
                this.ball.dx = 2 * (Math.random() > 0.5 ? 1 : -1);
                this.ball.dy = -4;
                this.paddle.x = this.width / 2 - 50;
                return;
            }
        }

        // Столкновения с платформой
        const p = this.paddle;
        if (this.ball.y + this.ball.r > p.y && this.ball.y - this.ball.r < p.y + p.h &&
            this.ball.x > p.x && this.ball.x < p.x + p.w) {
            let hit = (this.ball.x - p.x) / p.w;
            let angle = (hit - 0.5) * Math.PI / 2;
            let speed = Math.sqrt(this.ball.dx*this.ball.dx + this.ball.dy*this.ball.dy);
            this.ball.dx = speed * Math.sin(angle);
            this.ball.dy = -speed * Math.cos(angle);
            this.ball.y = p.y - this.ball.r;
        }

        // Столкновения с непробиваемыми стенами
        for (let wall of this.walls) {
            if (this.ball.x + this.ball.r > wall.x && this.ball.x - this.ball.r < wall.x + wall.w &&
                this.ball.y + this.ball.r > wall.y && this.ball.y - this.ball.r < wall.y + wall.h) {
                let overlapX = Math.min(this.ball.x + this.ball.r - wall.x, wall.x + wall.w - this.ball.x + this.ball.r);
                let overlapY = Math.min(this.ball.y + this.ball.r - wall.y, wall.y + wall.h - this.ball.y + this.ball.r);
                if (overlapX < overlapY) {
                    this.ball.dx *= -1;
                } else {
                    this.ball.dy *= -1;
                }
                // сдвиг
                if (Math.abs(this.ball.dx) > Math.abs(this.ball.dy)) {
                    this.ball.x += (this.ball.dx > 0 ? 1 : -1);
                } else {
                    this.ball.y += (this.ball.dy > 0 ? 1 : -1);
                }
                break;
            }
        }

        // Столкновения с артефактом
        if (this.artifact) {
            const a = this.artifact;
            const dx = this.ball.x - a.x;
            const dy = this.ball.y - a.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            if (dist < this.ball.r + a.radius) {
                if (dist > 0) {
                    const nx = dx / dist, ny = dy / dist;
                    let dot = this.ball.dx * nx + this.ball.dy * ny;
                    this.ball.dx -= 2 * dot * nx;
                    this.ball.dy -= 2 * dot * ny;
                    this.ball.x = a.x + (a.radius + this.ball.r) * nx;
                    this.ball.y = a.y + (a.radius + this.ball.r) * ny;
                } else {
                    this.ball.dy *= -1;
                }
                a.hp--;
                if (a.hp <= 0) {
                    this.win = true;
                    return;
                }
            }
        }

        // Столкновения с кирпичами (обычные + extraBlocks)
        for (let i = this.bricks.length - 1; i >= 0; i--) {
            const b = this.bricks[i];
            if (this.ball.x + this.ball.r > b.x && this.ball.x - this.ball.r < b.x + b.w &&
                this.ball.y + this.ball.r > b.y && this.ball.y - this.ball.r < b.y + b.h) {
                b.hp--;
                if (b.hp <= 0) {
                    this.bricks.splice(i, 1);
                    this.score += 10;
                }
                let overlapX = Math.min(this.ball.x + this.ball.r - b.x, b.x + b.w - this.ball.x + this.ball.r);
                let overlapY = Math.min(this.ball.y + this.ball.r - b.y, b.y + b.h - this.ball.y + this.ball.r);
                if (overlapX < overlapY) {
                    this.ball.dx *= -1;
                } else {
                    this.ball.dy *= -1;
                }
                break;
            }
        }

        // Проверка победы (если артефакта нет, то по кирпичам)
        if (!this.artifact && this.bricks.length === 0) {
            this.win = true;
        }
    }

    render() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.width, this.height);

        // Фон
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, this.width, this.height);

        // Название и счёт
        ctx.fillStyle = '#e0c9a6';
        ctx.font = '18px sans-serif';
        ctx.fillText(`Уровень`, 20, 40);
        ctx.fillStyle = '#fff';
        ctx.font = '16px sans-serif';
        ctx.fillText(`❤️ ${this.lives}`, this.width - 60, 40);
        ctx.fillText(`Очки: ${this.score}`, 20, 70);
        if (this.timeLimit > 0) {
            const remaining = Math.max(0, this.timeLimit - this.timer);
            ctx.fillText(`⏱ ${Math.ceil(remaining)}с`, this.width - 150, 40);
        }

        // Стены
        ctx.fillStyle = '#b08d6b';
        for (let w of this.walls) {
            ctx.fillRect(w.x, w.y, w.w, w.h);
        }

        // Кирпичи
        for (let b of this.bricks) {
            ctx.fillStyle = b.type === 'bonus' ? '#3498db' : '#e67e22';
            ctx.fillRect(b.x, b.y, b.w, b.h);
        }

        // Артефакт
        if (this.artifact) {
            const a = this.artifact;
            ctx.beginPath();
            ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
            ctx.fillStyle = '#f1c40f';
            ctx.fill();
            ctx.strokeStyle = '#d4ac0d';
            ctx.lineWidth = 3;
            ctx.stroke();
            ctx.fillStyle = '#000';
            ctx.font = '14px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(a.hp, a.x, a.y);
            ctx.textAlign = 'left';
            ctx.textBaseline = 'alphabetic';
        }

        // Платформа
        ctx.fillStyle = '#d4a373';
        ctx.fillRect(this.paddle.x, this.paddle.y, this.paddle.w, this.paddle.h);

        // Мяч
        ctx.beginPath();
        ctx.arc(this.ball.x, this.ball.y, this.ball.r, 0, Math.PI * 2);
        ctx.fillStyle = '#f4d03f';
        ctx.fill();

        // Сообщения
        if (this.win) {
            ctx.fillStyle = '#2ecc71';
            ctx.font = '40px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('🎉 ПОБЕДА!', this.width/2, this.height/2);
            ctx.textAlign = 'left';
        } else if (this.lose) {
            ctx.fillStyle = '#e74c3c';
            ctx.font = '40px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('💀 ПОРАЖЕНИЕ', this.width/2, this.height/2);
            ctx.textAlign = 'left';
        }
    }

    setMouseX(x) {
        this.mouseX = x;
    }

    togglePause() {
        this.paused = !this.paused;
    }
}
