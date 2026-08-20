import { LevelManager } from '../levels/LevelManager.js?v=202608201609';
import { T } from '../levels/Layouts88.js?v=202608201609';

export class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        this.width = canvas.width;
        this.height = canvas.height;

        this.levelManager = new LevelManager();

        this.score = 0;
        this.lives = 3;
        this.levelNumber = 1;
        this.paused = false;
        this.started = false;
        this.win = false;
        this.lose = false;

        this.paddle = {
            x: this.width / 2 - 50,
            y: this.height - 30,
            w: 100,
            h: 12
        };

        this.ball = {
            x: this.width / 2,
            y: this.height - 50,
            r: 7,
            dx: 3.2,
            dy: -4.2
        };

        this.mouseX = this.width / 2;
        this.bricks = [];
        this.mechanics = {};
        this.gatesOpen = false;
        this.time = 0;

        this.loadLevel(0);
        this.bindInput();
        this.loop();
    }

    loadLevel(index) {
        const level = this.levelManager.loadLevel(index);
        if (!level) return;

        this.levelNumber = level.id;
        this.level = level;
        this.mechanics = level.mechanics || {};
        this.time = 0;
        this.gatesOpen = false;
        this.win = false;
        this.lose = false;

        this.buildLevel(level);
        this.resetBall();
        this.updateHUD();
    }

    buildLevel(level) {
        const rows = level.rows;
        const cols = 11;

        const bw = 58;
        const bh = 25;
        const ox = (this.width - cols * bw) / 2;
        const oy = 72;

        this.bricks = [];

        for (let r = 0; r < rows.length; r++) {
            const row = rows[r];

            for (let c = 0; c < row.length; c++) {
                const ch = row[c];

                if (ch === '.' || ch === ' ') continue;

                this.bricks.push({
                    x: ox + c * bw,
                    y: oy + r * bh,
                    w: bw - 3,
                    h: bh - 3,
                    type: ch,
                    hp: ch === 'S' ? 999999 : ch === 'E' ? 2 : 1,
                    alive: true,
                    phase: (r * 11 + c) * 0.7,
                    baseX: ox + c * bw,
                    baseY: oy + r * bh
                });
            }
        }

        this.activeSwitches = this.bricks.filter(b => b.type === 'X').length;
        this.teleporters = this.bricks.filter(b => b.type === 'O');
    }

    resetBall() {
        this.ball.x = this.width / 2;
        this.ball.y = this.height - 55;

        const direction = Math.random() < .5 ? -1 : 1;

        this.ball.dx = 3.2 * direction;
        this.ball.dy = -4.2;

        this.paddle.x = this.width / 2 - this.paddle.w / 2;
    }

    bindInput() {
        this.canvas.addEventListener('mousemove', e => {
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.canvas.width / rect.width;
            this.mouseX = (e.clientX - rect.left) * scaleX;
        });

        this.canvas.addEventListener('click', () => {
            this.started = true;

            if (this.win) {
                this.nextLevel();
            }
        });

        window.addEventListener('keydown', e => {
            if (e.key === 'ArrowLeft') this.mouseX -= 45;
            if (e.key === 'ArrowRight') this.mouseX += 45;

            if (e.key.toLowerCase() === 'p') {
                this.paused = !this.paused;
            }

            if (e.key === ' ' && this.win) {
                this.nextLevel();
            }
        });
    }

    nextLevel() {
        if (this.levelNumber >= 88) {
            this.win = true;
            return;
        }

        this.loadLevel(this.levelNumber);
        this.started = true;
    }

    update() {
        if (this.paused || !this.started || this.win || this.lose) return;

        this.time += 1 / 60;

        this.paddle.x += (this.mouseX - (this.paddle.x + this.paddle.w / 2)) * .25;
        this.paddle.x = Math.max(0, Math.min(this.width - this.paddle.w, this.paddle.x));

        this.updateMechanisms();

        this.ball.x += this.ball.dx;
        this.ball.y += this.ball.dy;

        if (this.ball.x - this.ball.r <= 0) {
            this.ball.x = this.ball.r;
            this.ball.dx = Math.abs(this.ball.dx);
        }

        if (this.ball.x + this.ball.r >= this.width) {
            this.ball.x = this.width - this.ball.r;
            this.ball.dx = -Math.abs(this.ball.dx);
        }

        if (this.ball.y - this.ball.r <= 55) {
            this.ball.y = 55 + this.ball.r;
            this.ball.dy = Math.abs(this.ball.dy);
        }

        if (
            this.ball.y + this.ball.r >= this.paddle.y &&
            this.ball.y - this.ball.r <= this.paddle.y + this.paddle.h &&
            this.ball.x >= this.paddle.x &&
            this.ball.x <= this.paddle.x + this.paddle.w &&
            this.ball.dy > 0
        ) {
            const hit = (this.ball.x - this.paddle.x) / this.paddle.w;
            const angle = (hit - .5) * 2.1;
            const speed = Math.min(9, Math.sqrt(this.ball.dx ** 2 + this.ball.dy ** 2) * 1.015);

            this.ball.dx = Math.sin(angle) * speed;
            this.ball.dy = -Math.cos(angle) * speed;
            this.ball.y = this.paddle.y - this.ball.r - 1;
        }

        if (this.ball.y > this.height + 30) {
            this.lives--;

            if (this.lives <= 0) {
                this.lose = true;
            } else {
                this.resetBall();
            }

            this.updateHUD();
            return;
        }

        this.handleBricks();

        if (this.isSolved()) {
            this.win = true;
            this.started = false;
        }

        this.updateHUD();
    }

    updateMechanisms() {
        for (const b of this.bricks) {
            if (!b.alive) continue;

            if (b.type === 'M') {
                b.x = b.baseX + Math.sin(this.time * 1.5 + b.phase) * 55;
            }
        }
    }

    handleBricks() {
        for (let i = this.bricks.length - 1; i >= 0; i--) {
            const b = this.bricks[i];

            if (!b.alive) continue;

            if (b.type === 'G' && this.gatesOpen) {
                continue;
            }

            if (
                this.ball.x + this.ball.r > b.x &&
                this.ball.x - this.ball.r < b.x + b.w &&
                this.ball.y + this.ball.r > b.y &&
                this.ball.y - this.ball.r < b.y + b.h
            ) {
                if (b.type === 'S') {
                    this.reflectFrom(b);
                    return;
                }

                if (b.type === 'B') {
                    this.reflectFrom(b);
                    const speed = Math.sqrt(this.ball.dx ** 2 + this.ball.dy ** 2) * 1.08;
                    const angle = Math.atan2(this.ball.dy, this.ball.dx);
                    this.ball.dx = Math.cos(angle) * Math.min(speed, 10);
                    this.ball.dy = Math.sin(angle) * Math.min(speed, 10);
                    return;
                }

                if (b.type === 'G') {
                    this.reflectFrom(b);
                    return;
                }

                if (b.type === 'O') {
                    this.teleport();
                    return;
                }

                if (b.type === '>') {
                    if (this.ball.dy > 0) return;
                    this.reflectFrom(b);
                    return;
                }

                if (b.type === 'X' || b.type === 'K') {
                    b.alive = false;
                    this.score += 50;
                    this.reflectFrom(b);

                    const remaining = this.bricks.filter(x =>
                        x.alive && (x.type === 'X' || x.type === 'K')
                    ).length;

                    if (remaining === 0) {
                        this.gatesOpen = true;

                        for (const gate of this.bricks) {
                            if (gate.type === 'G') gate.alive = false;
                        }
                    }

                    return;
                }

                if (b.type === 'E') {
                    b.hp--;

                    if (b.hp <= 0) {
                        b.alive = false;
                        this.score += 20;
                        this.explode(b);
                    }

                    this.reflectFrom(b);
                    return;
                }

                b.alive = false;
                this.score += 10;
                this.reflectFrom(b);
                return;
            }
        }
    }

    explode(source) {
        const radius = 75;

        for (const b of this.bricks) {
            if (!b.alive || b === source || b.type === 'S') continue;

            const dx = b.x + b.w / 2 - (source.x + source.w / 2);
            const dy = b.y + b.h / 2 - (source.y + source.h / 2);

            if (Math.sqrt(dx * dx + dy * dy) < radius) {
                b.alive = false;
                this.score += 5;
            }
        }
    }

    teleport() {
        const alive = this.bricks.filter(b => b.alive && b.type === 'O');

        if (alive.length < 2) return;

        let target = alive[Math.floor(Math.random() * alive.length)];

        if (target.x === undefined) return;

        this.ball.x = target.x + target.w / 2;
        this.ball.y = target.y + target.h / 2 + 20;
    }

    reflectFrom(b) {
        const left = this.ball.x + this.ball.r - b.x;
        const right = b.x + b.w - (this.ball.x - this.ball.r);
        const top = this.ball.y + this.ball.r - b.y;
        const bottom = b.y + b.h - (this.ball.y - this.ball.r);

        const overlapX = Math.min(left, right);
        const overlapY = Math.min(top, bottom);

        if (overlapX < overlapY) {
            this.ball.dx *= -1;
        } else {
            this.ball.dy *= -1;
        }
    }

    isSolved() {
        const blockers = this.bricks.filter(b =>
            b.alive &&
            b.type !== 'S' &&
            b.type !== 'G' &&
            b.type !== 'B' &&
            b.type !== 'M' &&
            b.type !== 'O' &&
            b.type !== '>'
        );

        return blockers.length === 0;
    }

    render() {
        const g = this.ctx;

        g.clearRect(0, 0, this.width, this.height);

        g.fillStyle = '#17120d';
        g.fillRect(0, 0, this.width, this.height);

        g.fillStyle = '#ead7b0';
        g.font = '16px system-ui';
        g.fillText(this.level?.name || 'АГУР', 18, 28);

        g.font = '12px system-ui';
        g.globalAlpha = .55;
        g.fillText('Головоломка ' + this.levelNumber + '/88', 18, 46);
        g.globalAlpha = 1;

        for (const b of this.bricks) {
            if (!b.alive) continue;

            if (b.type === 'S') g.fillStyle = '#514b45';
            else if (b.type === 'B') g.fillStyle = '#d9a441';
            else if (b.type === 'G') g.fillStyle = this.gatesOpen ? '#3d9b68' : '#8e3939';
            else if (b.type === 'X' || b.type === 'K') g.fillStyle = '#b85c36';
            else if (b.type === 'E') g.fillStyle = '#963c35';
            else if (b.type === 'M') g.fillStyle = '#8b65b7';
            else if (b.type === 'O') g.fillStyle = '#3e86a8';
            else if (b.type === '>') g.fillStyle = '#547f72';
            else g.fillStyle = '#b87942';

            g.fillRect(b.x, b.y, b.w, b.h);

            g.strokeStyle = 'rgba(255,235,190,.18)';
            g.strokeRect(b.x, b.y, b.w, b.h);

            if (b.type === 'X' || b.type === 'K') {
                g.fillStyle = '#ffe5a0';
                g.font = '12px system-ui';
                g.textAlign = 'center';
                g.fillText(b.type, b.x + b.w / 2, b.y + b.h / 2 + 4);
                g.textAlign = 'left';
            }
        }

        g.fillStyle = '#d9b27a';
        g.fillRect(this.paddle.x, this.paddle.y, this.paddle.w, this.paddle.h);

        g.beginPath();
        g.arc(this.ball.x, this.ball.y, this.ball.r, 0, Math.PI * 2);
        g.fillStyle = '#f4d27e';
        g.fill();

        if (!this.started && !this.win && !this.lose) {
            g.fillStyle = 'rgba(0,0,0,.45)';
            g.fillRect(0, 0, this.width, this.height);

            g.fillStyle = '#ead7b0';
            g.font = '28px system-ui';
            g.textAlign = 'center';
            g.fillText('КЛИКНИТЕ, ЧТОБЫ НАЧАТЬ', this.width / 2, this.height / 2);
            g.textAlign = 'left';
        }

        if (this.win) {
            g.fillStyle = 'rgba(0,0,0,.55)';
            g.fillRect(0, 0, this.width, this.height);

            g.fillStyle = '#ead7b0';
            g.font = '34px system-ui';
            g.textAlign = 'center';

            if (this.levelNumber === 88) {
                g.fillText('АГУР ЗАВЕРШЁН', this.width / 2, this.height / 2);
            } else {
                g.fillText('УРОВЕНЬ ПРОЙДЕН', this.width / 2, this.height / 2 - 15);
                g.font = '16px system-ui';
                g.fillText('Клик — следующий уровень', this.width / 2, this.height / 2 + 25);
            }

            g.textAlign = 'left';
        }

        if (this.lose) {
            g.fillStyle = 'rgba(0,0,0,.55)';
            g.fillRect(0, 0, this.width, this.height);

            g.fillStyle = '#d86c55';
            g.font = '32px system-ui';
            g.textAlign = 'center';
            g.fillText('ПОРАЖЕНИЕ', this.width / 2, this.height / 2);
            g.font = '15px system-ui';
            g.fillText('Клик — начать заново', this.width / 2, this.height / 2 + 30);
            g.textAlign = 'left';
        }
    }

    updateHUD() {
        const score = document.getElementById('score');
        const level = document.getElementById('level');
        const lives = document.getElementById('lives');

        if (score) score.textContent = 'Счёт: ' + this.score;
        if (level) level.textContent = 'Уровень: ' + this.levelNumber + ' / 88';
        if (lives) lives.textContent = 'Жизни: ' + this.lives;
    }

    loop() {
        this.update();
        this.render();
        requestAnimationFrame(() => this.loop());
    }
}
