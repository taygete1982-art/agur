import { LEVELS } from './Layouts88.js';

export class LevelManager {
    constructor() {
        this.levels = LEVELS;
        this.currentIndex = 0;
    }

    get length() {
        return this.levels.length;
    }

    getCurrentLevel() {
        return this.levels[this.currentIndex] || null;
    }

    loadLevel(index) {
        if (index < 0 || index >= this.levels.length) return null;
        this.currentIndex = index;
        return this.getCurrentLevel();
    }

    nextLevel() {
        if (this.currentIndex + 1 >= this.levels.length) return null;
        this.currentIndex++;
        return this.getCurrentLevel();
    }

    reset() {
        this.currentIndex = 0;
    }
}
