export const CONFIG = {
  WIDTH: 540,
  HEIGHT: 860,
  PADDLE: { WIDTH: 110, HEIGHT: 14, RADIUS: 8, Y_OFFSET: 120 },
  BALL: { RADIUS: 10, INITIAL_SPEED: 8.0, MAX_SPEED_MULTIPLIER: 1.3, MIN_VERTICAL_RATIO: 0.3 },
  BRICK: { ROWS: 18, COLS: 12, WIDTH: 38, HEIGHT: 18, GAP: 3, TOP_OFFSET: 35 },
  TOUCH: { ZONE_HEIGHT: 100, SENSITIVITY: 3.5 },
  GAME: { MAX_LIVES: 3, POWERUP_DROP_CHANCE: 0.15, POWERUP_FALL_SPEED: 2.5 },
  MUSEUM: { FRAGMENT_CHANCE: 0 },
  
  ARTIFACTS: [
    { id: 'jug',     name: 'Глиняный кувшин',       emoji: '🏺', shards: 5 },
    { id: 'seal',    name: 'Цилиндрическая печать', emoji: '🧿', shards: 4 },
    { id: 'tablet',  name: 'Табличка с письменами', emoji: '📜', shards: 5 },
    { id: 'standard',name: 'Штандарт Ура',          emoji: '🚩', shards: 6 },
    { id: 'ram',     name: 'Баран в зарослях',      emoji: '🐏', shards: 7 },
    { id: 'lyre',    name: 'Лира Ура',              emoji: '🎼', shards: 7 },
  ],
  
  BRICK_TYPES: {
    NORMAL:    { score: 10 },
    SILVER:    { score: 30, hp: 3 },
    EXPLOSIVE: { score: 30, emoji: '💥' },
    FIRE:      { score: 20, emoji: '🔥' },
    REGEN:     { score: 15, emoji: '🌱', maxRegens: 2, regenDelay: 300 },
    MOVING:    { score: 20, emoji: '🐪', range: 30, speed: 0.02 },
    GOLD:      { score: 50, emoji: '🪙' },
    STEEL:     { score: 0, emoji: '🪨' },
    CLAY:      { score: 20, hp: 2 },
  },
  
  ROW_COLORS: [
    { base: '#9c4a34', glow: '#b86a4a' },
    { base: '#b89868', glow: '#d0b080' },
    { base: '#cbb995', glow: '#e0d0b0' },
    { base: '#a85a3a', glow: '#c07a52' },
    { base: '#8a6a4a', glow: '#a88a62' },
    { base: '#7a8a4a', glow: '#98aa62' },
    { base: '#6a5a44', glow: '#8a7a5c' },
  ],
  
  POWERUP_TYPES: {
    WIDE:     { emoji: '🌴', color: '#40b3a2', duration: 10000, desc: 'Широкая платформа' },
    SLOW:     { emoji: '🦎', color: '#63d1c0', duration: 4000,  desc: 'Замедление мяча' },
    MULTI:    { emoji: '✶',  color: '#f0c96a', duration: 0,     desc: 'Три бога' },
    LASER:    { emoji: '⚡', color: '#fde047', duration: 8000,  desc: 'Молния Адада' },
    CATCH:    { emoji: '✋', color: '#f0d9a8', duration: 15000, desc: 'Рука жреца' },
    LIFE:     { emoji: '💧', color: '#40b3a2', duration: 0,     desc: '+1 жизнь' },
    FRAGMENT: { emoji: '🧩', color: '#e8c98a', duration: 0,     desc: 'Черепок артефакта' },
    CARD:     { emoji: '🃏', color: '#e8c98a', duration: 0,     desc: 'Карта Судеб' },
    SIGN:     { emoji: '𒀭', color: '#e8c98a', duration: 0,     desc: 'Клинописный знак' },
  },
  
  WORDS: [
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
  ],
};

export const GAME_STATE = {
  MENU: 'menu', PLAYING: 'playing', PAUSED: 'paused',
  GAME_OVER: 'gameOver', WIN: 'win', LEVEL_TRANSITION: 'levelTransition',
};

export function lerp(a, b, t) { return a + (b - a) * t; }
export function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
export function randomRange(min, max) { return Math.random() * (max - min) + min; }

// Устаревшие экспорты (для обратной совместимости, можно удалить позже)
export const ARTIFACT_FORMS = [
  { id: 'jug', name: 'кувшин', emoji: '🏺' },
  { id: 'seal', name: 'печать', emoji: '🧿' },
  { id: 'tablet', name: 'табличка', emoji: '📜' },
  { id: 'idol', name: 'идол', emoji: '🗿' },
  { id: 'crown', name: 'венец', emoji: '👑' },
  { id: 'lyre', name: 'лира', emoji: '🎼' },
  { id: 'bowl', name: 'чаша', emoji: '🥣' },
  { id: 'axe', name: 'топор', emoji: '🪓' },
  { id: 'mirror', name: 'зеркало', emoji: '🪞' },
  { id: 'boat', name: 'ладья', emoji: '⛵' },
  { id: 'stand', name: 'штандарт', emoji: '🚩' },
  { id: 'ring', name: 'перстень', emoji: '💍' },
];
export const ARTIFACT_MATERIALS = [
  { id: 'clay', name: 'Глиняный', color: '#c96f4a' },
  { id: 'bronze', name: 'Бронзовый', color: '#b08d57' },
  { id: 'gold', name: 'Золотой', color: '#f0c96a' },
  { id: 'lapis', name: 'Лазуритовый', color: '#35608c' },
  { id: 'alabaster', name: 'Алебастровый', color: '#e0d3e0' },
  { id: 'obsidian', name: 'Обсидиановый', color: '#4a5560' },
];
export const ARTIFACT_QUALITIES = [
  { id: 'common', name: 'обычный' },
  { id: 'rare', name: 'редкий' },
  { id: 'legendary', name: 'легендарный' },
];
export const RELICS = [
  { id: 'r1', name: 'Кувшин песков', emoji: '🏺' },
  { id: 'r2', name: 'Ожерелье Инанны', emoji: '📿' },
  { id: 'r3', name: 'Тростниковая ладья', emoji: '⛵' },
  { id: 'r4', name: 'Серп жреца', emoji: '🌾' },
  { id: 'r5', name: 'Каменная карта', emoji: '🗺️' },
  { id: 'r6', name: 'Корона Нанны', emoji: '👑' },
  { id: 'r7', name: 'Зеркало судьбы', emoji: '🪞' },
  { id: 'r8', name: 'Штандарт Ура', emoji: '🚩' },
];
