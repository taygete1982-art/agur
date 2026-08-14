import { CONFIG } from '../config.js';
import { Brick } from '../entities/Brick.js';

// Коды кирпичей для паттернов
// 0=пусто 1=обычный 2/3=прочный S=сталь X=взрыв F=огонь R=реген M=движущийся G=золото V=серебро
const CODES = {
  '0': 0,
  '1': 1,
  '2': 2,
  '3': 3,
  'S': 'steel',
  'X': 'explosive',
  'F': 'fire',
  'R': 'regen',
  'M': 'moving',
  'G': 'gold',
  'V': 'silver',
};

export class LevelManager {
  constructor() {
    this.currentLevel = 1;
    this.maxLevel = 7;
    this.bricks = [];
    this.aliveCount = 0;
    
    this.levelNames = [
      'Разминка',
      'Пороховая бочка',
      'Огненное сердце',
      'Конвейер',
      'Гидра',
      'Крепость',
      'Финальный замес',
    ];
  }
  
  loadLevel(levelNumber) {
    this.currentLevel = levelNumber;
    this.bricks = [];
    this.aliveCount = 0;
    
    const pattern = this.getPattern(levelNumber);
    
    for (let row = 0; row < pattern.length; row++) {
      for (let col = 0; col < pattern[row].length; col++) {
        const cellConfig = pattern[row][col];
        if (!cellConfig) continue;
        
        const x = this.getBrickX(col);
        const y = this.getBrickY(row);
        const color = CONFIG.ROW_COLORS[row % CONFIG.ROW_COLORS.length];
        
        const brick = new Brick(x, y, color, row, col);
        
        // Применяем конфиг ячейки
        if (typeof cellConfig === 'number' && cellConfig >= 2) {
          brick.setHP(cellConfig);
        } else if (typeof cellConfig === 'string') {
          brick.setType(cellConfig);
        }
        
        this.bricks.push(brick);
        
        // ВАЖНО: стальные не учитываются для победы
        if (!brick.isSteel) {
          this.aliveCount++;
        }
      }
    }
    
    return this.bricks;
  }
  
  // Преобразует строки символов в массив конфигов
  decode(rows) {
    return rows.map(rowStr =>
      rowStr.split('').map(ch => CODES[ch] ?? 0)
    );
  }
  
  getBrickX(col) {
    const totalWidth = CONFIG.BRICK.COLS * (CONFIG.BRICK.WIDTH + CONFIG.BRICK.GAP) - CONFIG.BRICK.GAP;
    const leftOffset = (CONFIG.WIDTH - totalWidth) / 2;
    return leftOffset + col * (CONFIG.BRICK.WIDTH + CONFIG.BRICK.GAP);
  }
  
  getBrickY(row) {
    return CONFIG.BRICK.TOP_OFFSET + row * (CONFIG.BRICK.HEIGHT + CONFIG.BRICK.GAP);
  }
  
  brickDestroyed() {
    this.aliveCount--;
  }
  
  isLevelComplete() {
    return this.aliveCount <= 0;
  }
  
  nextLevel() {
    if (this.currentLevel < this.maxLevel) {
      return this.currentLevel + 1;
    }
    return null;
  }
  
  getLevelName(level) {
    return this.levelNames[(level - 1) % this.levelNames.length] || '';
  }
  
  getPattern(level) {
    switch (level) {
      case 1: return this.pattern1();
      case 2: return this.pattern2();
      case 3: return this.pattern3();
      case 4: return this.pattern4();
      case 5: return this.pattern5();
      case 6: return this.pattern6();
      case 7: return this.pattern7();
      default: return this.pattern1();
    }
  }
  
  // Уровень 1: Разминка — классика с золотым сюрпризом
  pattern1() {
    return this.decode([
      '1111111111',
      '1111111111',
      '1111111111',
      '1111GG1111',
      '1111111111',
      '1111111111',
      '1111111111',
    ]);
  }
  
  // Уровень 2: Пороховая бочка — взрывные цепочки
  pattern2() {
    return this.decode([
      '1111111111',
      '1X111111X1',
      '1111111111',
      '1111XX1111',
      '1111111111',
      '1X111111X1',
      '1111111111',
    ]);
  }
  
  // Уровень 3: Огненное сердце — огонь поджигает соседей
  pattern3() {
    return this.decode([
      '0FF0000FF0',
      'FFFF00FFFF',
      'FFFFFFFFFF',
      '0FFFFFFFF0',
      '00FFFFFF00',
      '000FFFF000',
      '0000GG0000',
    ]);
  }
  
  // Уровень 4: Конвейер — движущиеся кирпичи
  pattern4() {
    return this.decode([
      '1111111111',
      'M0M0M0M0M0',
      '1111111111',
      '0M0M0M0M0M',
      '1111111111',
      'M0M0M0M0M0',
      '1111111111',
    ]);
  }
  
  // Уровень 5: Гидра — регенерирующие кирпичи + взрывы в помощь
  pattern5() {
    return this.decode([
      '1R11R11R11',
      '1111111111',
      'R11R11R11R',
      '1111111111',
      '1R11R11R11',
      '1111111111',
      'XX111111XX',
    ]);
  }
  
  // Уровень 6: Крепость — стальная защита с золотым хранилищем
  pattern6() {
    return this.decode([
      '1S111111S1',
      '1111111111',
      'S1XX11XX1S',
      '1111111111',
      '1SGGGGGGS1',
      '1111111111',
      'S11111111S',
    ]);
  }
  
  // Уровень 7: Финальный замес — всё сразу
  pattern7() {
    return this.decode([
      'VVVVVVVVVV',
      'X1F1111F1X',
      '11R1MM1R11',
      'F11G11G11F',
      '11R1MM1R11',
      'X1F1111F1X',
      'VVVVVVVVVV',
    ]);
  }
  
  getBallSpeed(level) {
    return CONFIG.BALL.INITIAL_SPEED * (1 + (level - 1) * 0.08);
  }
}
