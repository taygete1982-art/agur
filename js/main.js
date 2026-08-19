import { Game } from './game/Game.js?v=202608202350';

window.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const game = new Game(canvas);
    window.AGUR = game;
});
