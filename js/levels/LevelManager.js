// js/levels/LevelManager.js
import { LEVELS } from './Layouts88.js';

export class LevelManager {
    constructor() {
        this.levels = LEVELS;
        this.currentIndex = 0;
    }

    getCurrentLevel() {
        return this.levels[this.currentIndex] || null;
    }

    loadLevel(index) {
        if (index >= 0 && index < this.levels.length) {
            this.currentIndex = index;
            return this.getCurrentLevel();
        }
        return null;
    }

    nextLevel() {
        if (this.currentIndex < this.levels.length - 1) {
            this.currentIndex++;
            return this.getCurrentLevel();
        }
        return null;
    }

    // Метод для получения данных уровня в нужном для Game формате
    getLevelData() {
        const raw = this.getCurrentLevel();
        if (!raw) return null;
        // Преобразуем в объект с полями walls, artifact, extraBlocks, gravity, timeLimit
        return {
            blocks: raw.blocks || [],
            walls: raw.walls || [],
            artifact: raw.artifact || null,
            extraBlocks: raw.extraBlocks || [],
            gravity: raw.gravity || 0.5,
            timeLimit: raw.timeLimit || 0,
            name: raw.name || 'Уровень',
            region: raw.region || 'Пески'
        };
    }

    reset() {
        this.currentIndex = 0;
    }
}
