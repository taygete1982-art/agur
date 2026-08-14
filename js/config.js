// ==========================================
// КОНФИГУРАЦИЯ ИГРЫ
// ==========================================

export const CONFIG = {
  // Размеры canvas
  WIDTH: 800,
  HEIGHT: 500,
  
  // Платформа
  PADDLE: {
    WIDTH: 140,
    HEIGHT: 14,
    RADIUS: 8,
    Y_OFFSET: 40,
  },
  
  // Мяч
  BALL: {
    RADIUS: 10,
    INITIAL_SPEED: 5.2,
    MAX_SPEED_MULTIPLIER: 1.3,
    MIN_VERTICAL_RATIO: 0.3,
  },
  
  // Кирпичи
  BRICK: {
    ROWS: 7,
    COLS: 10,
    WIDTH: 65,
    HEIGHT: 22,
    GAP: 6,
    TOP_OFFSET: 50,
  },
  
  // Игровые правила
  GAME: {
    MAX_LIVES: 3,
    POWERUP_DROP_CHANCE: 0.15,
    POWERUP_FALL_SPEED: 2.5,
  },
  
  // ===== ТИПЫ КИРПИЧЕЙ =====
  BRICK_TYPES: {
    NORMAL:    { score: 10 },
    SILVER:    { score: 30, hp: 3 },
    EXPLOSIVE: { score: 30, emoji: '💥' },
    FIRE:      { score: 20, emoji: '🔥' },
    REGEN:     { score: 15, emoji: '', maxRegens: 2, regenDelay: 300 },
    MOVING:    { score: 20, emoji: '↔️', range: 30, speed: 0.02 },
    GOLD:      { score: 50, emoji: '💎' },
    STEEL:     { score: 0, emoji: '🔩' },
  },
  
  // Цвета рядов кирпичей
  ROW_COLORS: [
    { base: '#f94144', glow: '#ff6b6b' },
    { base: '#f8961e', glow: '#ffb347' },
    { base: '#f9c74f', glow: '#ffd97d' },
    { base: '#90be6d', glow: '#b5e48c' },
    { base: '#43aa8b', glow: '#72d6b2' },
    { base: '#577590', glow: '#7ba3c9' },
    { base: '#9b5de5', glow: '#c77dff' },
  ],
  
  // Типы power-ups
  POWERUP_TYPES: {
    WIDE:   { emoji: '📏', color: '#4ade80', duration: 10000, desc: 'Широкая платформа' },
    MULTI:  { emoji: '🔱', color: '#f87171', duration: 0,     desc: 'Двойной мяч' },
    SLOW:   { emoji: '🐢', color: '#60a5fa', duration: 8000,  desc: 'Замедление мяча' },
    LASER:  { emoji: '🔫', color: '#a78bfa', duration: 12000, desc: 'Лазер' },
    LIFE:   { emoji: '❤️', color: '#fb7185', duration: 0,     desc: '+1 жизнь' },
    STICKY: { emoji: '🧲', color: '#fbbf24', duration: 15000, desc: 'Липкая платформа' },
  },
};

// Состояния игры
export const GAME_STATE = {
  MENU: 'menu',
  PLAYING: 'playing',
  PAUSED: 'paused',
  GAME_OVER: 'gameOver',
  WIN: 'win',
  LEVEL_TRANSITION: 'levelTransition',
};

// Утилиты
export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function randomRange(min, max) {
  return Math.random() * (max - min) + min;
}
