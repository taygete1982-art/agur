﻿export const CONFIG = {
  WIDTH: 800,
  HEIGHT: 500,
  PADDLE: { WIDTH: 140, HEIGHT: 14, RADIUS: 8, Y_OFFSET: 120 },
  BALL: { RADIUS: 10, INITIAL_SPEED: 8.0, MAX_SPEED_MULTIPLIER: 1.3, MIN_VERTICAL_RATIO: 0.3 },
  BRICK: { ROWS: 18, COLS: 12, WIDTH: 38, HEIGHT: 18, GAP: 3, TOP_OFFSET: 35 },
  TOUCH: { ZONE_HEIGHT: 100, SENSITIVITY: 3.5 },
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
    SILVER:    { score: 30, hp: 3 },
    EXPLOSIVE: { score: 30, emoji: '\u{1F4A5}' },
    FIRE:      { score: 20, emoji: '\u{1F525}' },
    REGEN:     { score: 15, emoji: '\u{1F331}', maxRegens: 2, regenDelay: 300 },
    MOVING:    { score: 20, emoji: '\u{1F42A}', range: 30, speed: 0.02 },
    GOLD:      { score: 50, emoji: '\u{1FA99}' },
    STEEL:     { score: 0, emoji: '\u{1FAA8}' },
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
    WIDE:    { emoji: '\u{1F334}', color: '#40b3a2', duration: 10000, desc: 'Широкая платформа' },
    SLOW:    { emoji: '\u{1F98E}', color: '#63d1c0', duration: 4000,  desc: 'Замедление мяча' },
    MULTI:    { emoji: '✶',  color: '#f0c96a', duration: 0,     desc: 'Три бога' },
    LASE:     { emoji: '⚡', color: '#fde047', duration: 8000,  desc: 'Молния Адада' },
    CATCH:    { emoji: '✋', color: '#f0d9a8', duration: 15000, desc: 'Рука жреца' },
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

// КРИТИЧНО: добавляем WORDS в CONFIG — иначе collectWord() и renderWords() падают
CONFIG.WORDS = WORDS;

export const GAME_STATE = {
  MENU: 'menu', PLAYING: 'playing', PAUSED: 'paused',
  GAME_OVER: 'gameOver', WIN: 'win', LEVEL_TRANSITION: 'levelTransition',
};

export function lerp(a, b, t) { return a + (b - a) * t; }
export function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
export function randomRange(min, max) { return Math.random() * (max - min) + min; }



export const ARTIFACT_FORMS = [
  { id: 'jug', name: 'кувшин', emoji: '\u{1F3FA}' },
  { id: 'seal', name: 'печать', emoji: '\u{1F9FF}' },
  { id: 'tablet', name: 'табличка', emoji: '\u{1F4DC}' },
  { id: 'idol', name: 'идол', emoji: '\u{1F5FF}' },
  { id: 'crown', name: 'венец', emoji: '\u{1F451}' },
  { id: 'lyre', name: 'лира', emoji: '\u{1F3BC}' },
  { id: 'bowl', name: 'чаша', emoji: '\u{1F963}' },
  { id: 'axe', name: 'топор', emoji: '\u{1FA93}' },
  { id: 'mirror', name: 'зеркало', emoji: '\u{1FA9E}' },
  { id: 'boat', name: 'ладья', emoji: '\u{26F5}' },
  { id: 'stand', name: 'штандарт', emoji: '\u{1F6A9}' },
  { id: 'ring', name: 'перстень', emoji: '\u{1F48D}' },
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
  { id: 'r1', name: 'Кувшин песков', emoji: '\u{1F3FA}' },
  { id: 'r2', name: 'Ожерелье Инанны', emoji: '\u{1F4FF}' },
  { id: 'r3', name: 'Тростниковая ладья', emoji: '\u{26F5}' },
  { id: 'r4', name: 'Серп жреца', emoji: '\u{1F33E}' },
  { id: 'r5', name: 'Каменная карта', emoji: '\u{1F5FA}\u{FE0F}' },
  { id: 'r6', name: 'Корона Нанны', emoji: '\u{1F451}' },
  { id: 'r7', name: 'Зеркало судьбы', emoji: '\u{1FA9E}' },
  { id: 'r8', name: 'Штандарт Ура', emoji: '\u{1F6A9}' },
];




