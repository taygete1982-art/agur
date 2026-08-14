export const CONFIG = {
  WIDTH: 800,
  HEIGHT: 500,
  PADDLE: { WIDTH: 140, HEIGHT: 14, RADIUS: 8, Y_OFFSET: 40 },
  BALL: { RADIUS: 10, INITIAL_SPEED: 8.0, MAX_SPEED_MULTIPLIER: 1.3, MIN_VERTICAL_RATIO: 0.3 },
  BRICK: { ROWS: 10, COLS: 12, WIDTH: 58, HEIGHT: 22, GAP: 5, TOP_OFFSET: 45 },
  GAME: { MAX_LIVES: 3, POWERUP_DROP_CHANCE: 0.15, POWERUP_FALL_SPEED: 2.5 },
  MUSEUM: { FRAGMENT_CHANCE: 0.04 },
  ARTIFACTS: [
    { id: 'jug',     name: 'Глиняный кувшин',       emoji: '\u{1F3FA}', shards: 5 },
    { id: 'seal',    name: 'Цилиндрическая печать', emoji: '\u{1F9FF}', shards: 4 },
    { id: 'tablet',  name: 'Табличка с письменами', emoji: '\u{1F4DC}', shards: 5 },
    { id: 'standard',name: 'Штандарт Ура',          emoji: '\u{1F6A9}', shards: 6 },
    { id: 'ram',     name: 'Баран в зарослях',      emoji: '\u{1F40F}', shards: 7 },
    { id: 'lyre',    name: 'Лира Ура',              emoji: '\u{1F3BC}', shards: 7 },
  ],
  BRICK_TYPES: {
    NORMAL:    { score: 10 },
    CLAY:      { score: 20, hp: 2 },
    SILVER:    { score: 30, hp: 3 },
    EXPLOSIVE: { score: 30, emoji: '\u{1F4A5}' },
    FIRE:      { score: 20, emoji: '\u{1F525}' },
    REGEN:     { score: 15, emoji: '\u{1F331}', maxRegens: 2, regenDelay: 300 },
    MOVING:    { score: 20, emoji: '\u{1F42A}', range: 30, speed: 0.02 },
    GOLD:      { score: 50, emoji: '\u{1FA99}' },
    STEEL:     { score: 0, emoji: '\u{1FAA8}' },
  },
  ROW_COLORS: [
    { base: '#d9a441', glow: '#f0c96a' },
    { base: '#c9853f', glow: '#e0a35c' },
    { base: '#c96f4a', glow: '#e08d63' },
    { base: '#a84a32', glow: '#c4654a' },
    { base: '#8a5a3b', glow: '#a87550' },
    { base: '#40b3a2', glow: '#63d1c0' },
    { base: '#2a8c7e', glow: '#45ab9c' },
  ],
  POWERUP_TYPES: {
    WIDE:    { emoji: '\u{1F334}', color: '#40b3a2', duration: 10000, desc: 'Широкая платформа' },
    SLOW:    { emoji: '\u{1F98E}', color: '#63d1c0', duration: 8000,  desc: 'Замедление мяча' },
    LIFE:    { emoji: '\u{1F4A7}', color: '#40b3a2', duration: 0,     desc: '+1 жизнь' },
    FRAGMENT:{ emoji: '\u{1F9E9}', color: '#e8c98a', duration: 0,     desc: 'Черепок артефакта' },
  },
};

export const WORDS = [
  { word: 'LUGAL', meaning: 'царь' },
  { word: 'AN', meaning: 'небо' },
  { word: 'KI', meaning: 'земля' },
  { word: 'UD', meaning: 'солнце' },
  { word: 'A', meaning: 'вода' },
  { word: 'E', meaning: 'дом' },
  { word: 'MUL', meaning: 'звезда' },
  { word: 'DINGIR', meaning: 'бог' },
  { word: 'SAG', meaning: 'голова' },
  { word: 'SHU', meaning: 'рука' },
  { word: 'NINDA', meaning: 'хлеб' },
  { word: 'AB', meaning: 'море' },
];

export const GAME_STATE = {
  MENU: 'menu', PLAYING: 'playing', PAUSED: 'paused',
  GAME_OVER: 'gameOver', WIN: 'win', LEVEL_TRANSITION: 'levelTransition',
};

export function lerp(a, b, t) { return a + (b - a) * t; }
export function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
export function randomRange(min, max) { return Math.random() * (max - min) + min; }




