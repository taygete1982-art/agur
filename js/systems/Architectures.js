const ROLE = [
  'Курган',
  'Рикошет',
  'Шахта',
  'Разлом',
  'Сокровищница',
  'Глубокая сокровищница',
  'Живой храм',
  'Стальной угол',
  'Спираль',
  'Ложная гробница',
  'Охраняемый трон'
];

const KINDS = [
  'Амфора',
  'Цилиндрическая печать',
  'Золотая маска',
  'Амулет',
  'Табличка',
  'Корона',
  'Идол',
  'Самоцвет',
  'Статуэтка',
  'Перстень',
  'Чаша',
  'Наконечник'
];

/*
 * ARCHITECTURES
 *
 * ВАЖНО:
 * Мы НЕ строим воображаемую прямоугольную сетку.
 * Мы работаем только с реально существующими кирпичами уровня.
 *
 * Архитектура меняет уже созданный силуэт, а не пересоздаёт его.
 */

const MODES = [
  { carve: 0.10, pattern: 'center' },
  { carve: 0.12, pattern: 'checker' },
  { carve: 0.14, pattern: 'pyramid' },
  { carve: 0.12, pattern: 'diamond' },
  { carve: 0.16, pattern: 'columns' },
  { carve: 0.14, pattern: 'zigzag' },
  { carve: 0.18, pattern: 'frame' },
  { carve: 0.15, pattern: 'cross' },
  { carve: 0.16, pattern: 'spiral' },
  { carve: 0.13, pattern: 'crypt' },
  { carve: 0.10, pattern: 'throne' }
];

export function initArchitectures(game) {
  const lname =
    game.loadLevel ? 'loadLevel' :
    game.startLevel ? 'startLevel' :
    null;

  if (!lname) return;

  if (game.__architecturesInstalled) return;
  game.__architecturesInstalled = true;

  const originalLoadLevel = game[lname].bind(game);

  game[lname] = (n, ...rest) => {
    game._digDone = false;
    game._livesStart = game.lives;
    game.digArtifact = null;
    game._archApplied = null;

    const result = originalLoadLevel(n, ...rest);

    try {
      applyArchitecture(game, n);
    } catch (err) {
      console.error('[ARCHITECTURE]', err);
    }

    return result;
  };

  /*
   * Артефакт рисуется поверх обычного Renderer.
   */
  const renderer = game.renderer;

  if (
    renderer &&
    typeof renderer.draw === 'function' &&
    !renderer.__architectureRendererPatched
  ) {
    renderer.__architectureRendererPatched = true;

    const originalDraw = renderer.draw.bind(renderer);

    renderer.draw = function () {
      originalDraw();

      const artifact = game.digArtifact;

      if (
        artifact &&
        !artifact.taken &&
        game.ctx
      ) {
        drawArtifact(game.ctx, artifact, performance.now());
      }
    };
  }

  /*
   * Проверяем столкновение мяча с артефактом.
   */
  if (!game.__architectureCollectorTimer) {
    game.__architectureCollectorTimer = setInterval(() => {
      const a = game.digArtifact;

      if (!a || a.taken || game._digDone) return;

      if (
        game.paused ||
        game.menuOpen ||
        game.museumOpen ||
        game.state !== 'playing'
      ) {
        return;
      }

      for (const ball of game.balls || []) {
        if (!ball || !ball.isLaunched) continue;

        const dx = ball.x - a.x;
        const dy = ball.y - a.y;

        const radius =
          18 + (ball.radius || 8);

        if (
          dx * dx + dy * dy <
          radius * radius
        ) {
          collectArtifact(game, a);
          return;
        }
      }

      /*
       * Если игрок разбил всё вокруг артефакта,
       * считаем раскопку завершённой.
       */
      if (
        game.levelManager &&
        game.levelManager.aliveCount <= 0
      ) {
        collectArtifact(game, a);
      }
    }, 100);
  }

  /*
   * Некоторые системы игры могут менять bricks после loadLevel.
   * Поэтому даём архитектуре второй шанс.
   */
  if (!game.__architectureSafetyTimer) {
    game.__architectureSafetyTimer = setInterval(() => {
      if (!game || !game.bricks) return;

      const n = game.level;

      if (!n) return;

      const alive = game.bricks.filter(b => b && b.alive);

      if (
        alive.length >= 8 &&
        game._archApplied !== n
      ) {
        try {
          applyArchitecture(game, n);
        } catch (err) {
          console.error('[ARCHITECTURE RETRY]', err);
        }
      }
    }, 500);
  }
}


/* =========================================================
 * ГЛАВНАЯ ЛОГИКА
 * ========================================================= */

function applyArchitecture(game, level) {
  if (game._archApplied === level) return;

  const bricks = game.bricks;

  if (!Array.isArray(bricks)) return;

  const alive = bricks.filter(
    b => b && b.alive
  );

  /*
   * Слишком маленькие уровни вообще не трогаем.
   */
  if (alive.length < 8) {
    game._archApplied = level;
    return;
  }

  game._archApplied = level;

  const modeIndex =
    (level - 1) % MODES.length;

  const mode = MODES[modeIndex];

  /*
   * Геометрический центр РЕАЛЬНОГО уровня.
   */
  const bounds = getBounds(alive);

  const centerX =
    (bounds.left + bounds.right) / 2;

  const centerY =
    (bounds.top + bounds.bottom) / 2;

  /*
   * Сначала определяем кирпичи,
   * которые естественно образуют центральную камеру.
   */
  const candidates = alive
    .map((brick, index) => {
      const bx =
        brick.x + brick.width / 2;

      const by =
        brick.y + brick.height / 2;

      const dx = bx - centerX;
      const dy = by - centerY;

      const distance =
        Math.sqrt(dx * dx + dy * dy);

      return {
        brick,
        index,
        bx,
        by,
        distance,
        row: Math.round(by / Math.max(1, brick.height)),
        col: Math.round(bx / Math.max(1, brick.width))
      };
    })
    .sort((a, b) => a.distance - b.distance);

  /*
   * Нельзя вырезать слишком много.
   *
   * Это КЛЮЧЕВОЕ отличие от старой версии:
   * архитектура никогда не превращает уровень
   * в четыре случайных кирпича.
   */
  const maxCarve =
    Math.max(
      1,
      Math.min(
        5,
        Math.floor(alive.length * mode.carve)
      )
    );

  /*
   * На маленьких уровнях достаточно одного-двух
   * кирпичей в центре.
   */
  let carveCount = maxCarve;

  if (alive.length < 14) {
    carveCount = Math.min(2, maxCarve);
  } else if (alive.length < 24) {
    carveCount = Math.min(3, maxCarve);
  }

  /*
   * Выбираем центральную камеру в зависимости
   * от типа архитектуры.
   */
  let selected = selectCarveCells(
    candidates,
    mode.pattern,
    carveCount,
    bounds
  );

  /*
   * Защита: если паттерн ничего не нашёл,
   * берём ближайшие к центру кирпичи.
   */
  if (!selected.length) {
    selected = candidates
      .slice(0, carveCount)
      .map(x => x.brick);
  }

  /*
   * Ещё одна защита.
   * Никогда не оставляем меньше 6 кирпичей.
   */
  const maximumAllowed =
    Math.max(
      1,
      alive.length - 6
    );

  if (selected.length > maximumAllowed) {
    selected =
      selected.slice(0, maximumAllowed);
  }

  /*
   * Координата артефакта:
   * не на кирпиче, а в центре образовавшейся камеры.
   */
  const artifactPosition =
    getArtifactPosition(
      selected,
      centerX,
      centerY,
      bounds
    );

  /*
   * Создаём артефакт ДО удаления кирпичей.
   */
  game.digArtifact = {
    x: artifactPosition.x,
    y: artifactPosition.y,
    taken: false,

    /*
     * После шестого биома артефакт становится
     * менее заметным.
     */
    hidden:
      Math.floor((level - 1) / 11) >= 6,

    kind:
      ((level - 1) * 3 + modeIndex) % KINDS.length,

    role: modeIndex
  };

  /*
   * Удаляем только выбранные кирпичи.
   */
  for (const brick of selected) {
    if (!brick || !brick.alive) continue;

    brick.alive = false;
    brick.y = -9999;
    brick.maxRegens = 0;

    if (
      game.levelManager &&
      typeof game.levelManager.aliveCount === 'number'
    ) {
      game.levelManager.aliveCount =
        Math.max(
          0,
          game.levelManager.aliveCount - 1
        );
    }
  }

  /*
   * Особые свойства архитектур.
   */
  applySpecialWalls(
    game,
    alive,
    modeIndex
  );

  if (game.showBanner) {
    game.showBanner(
      '⛏ Раскопки №' +
      level +
      ' — ' +
      ROLE[modeIndex]
    );
  }
}


/* =========================================================
 * ВЫБОР КАМЕРЫ
 * ========================================================= */

function selectCarveCells(
  candidates,
  pattern,
  count,
  bounds
) {
  if (!candidates.length) return [];

  const cx =
    (bounds.left + bounds.right) / 2;

  const cy =
    (bounds.top + bounds.bottom) / 2;

  let pool;

  switch (pattern) {

    case 'checker':
      pool = candidates.filter(x =>
        (x.row + x.col) % 2 === 0
      );
      break;

    case 'pyramid':
      pool = candidates.filter(x => {
        const dx = Math.abs(x.bx - cx);
        const dy = x.by - bounds.top;
        const width =
          (bounds.right - bounds.left) *
          (1 - dy /
            Math.max(1, bounds.bottom - bounds.top));

        return dx < width / 3;
      });
      break;

    case 'diamond':
      pool = candidates.filter(x => {
        const dx =
          Math.abs(x.bx - cx) /
          Math.max(1, bounds.right - bounds.left);

        const dy =
          Math.abs(x.by - cy) /
          Math.max(1, bounds.bottom - bounds.top);

        return dx + dy < 0.38;
      });
      break;

    case 'columns':
      pool = candidates.filter(x =>
        Math.abs(x.col % 4) <= 1
      );
      break;

    case 'zigzag':
      pool = candidates.filter(x =>
        ((x.row + x.col) % 3) !== 1
      );
      break;

    case 'frame':
      pool = candidates.filter(x => {
        const edgeX =
          Math.min(
            Math.abs(x.bx - bounds.left),
            Math.abs(x.bx - bounds.right)
          );

        const edgeY =
          Math.min(
            Math.abs(x.by - bounds.top),
            Math.abs(x.by - bounds.bottom)
          );

        return edgeX < edgeY * 1.5;
      });
      break;

    case 'cross':
      pool = candidates.filter(x =>
        Math.abs(x.bx - cx) <
          (bounds.right - bounds.left) * 0.16 ||
        Math.abs(x.by - cy) <
          (bounds.bottom - bounds.top) * 0.16
      );
      break;

    case 'spiral':
      pool = candidates.filter(x => {
        const angle =
          Math.atan2(
            x.by - cy,
            x.bx - cx
          );

        return (
          Math.floor(
            ((angle + Math.PI) /
              (Math.PI * 2)) * 8
          ) % 2 === 0
        );
      });
      break;

    case 'crypt':
      pool = candidates.filter(x =>
        x.by > cy &&
        x.bx > bounds.left &&
        x.bx < bounds.right
      );
      break;

    case 'throne':
      pool = candidates.filter(x =>
        x.by < cy
      );
      break;

    case 'center':
    default:
      pool = candidates;
      break;
  }

  /*
   * Всегда сортируем по близости к центру.
   * Поэтому даже сложные паттерны не вырывают
   * случайные кирпичи с краёв уровня.
   */
  pool.sort(
    (a, b) =>
      a.distance - b.distance
  );

  return pool
    .slice(0, count)
    .map(x => x.brick);
}


/* =========================================================
 * ПОЗИЦИЯ АРТЕФАКТА
 * ========================================================= */

function getArtifactPosition(
  selected,
  centerX,
  centerY,
  bounds
) {
  /*
   * Если камера состоит из кирпичей,
   * ставим артефакт в центр камеры.
   */
  if (selected.length) {
    const x =
      selected.reduce(
        (sum, b) =>
          sum + b.x + b.width / 2,
        0
      ) / selected.length;

    const y =
      selected.reduce(
        (sum, b) =>
          sum + b.y + b.height / 2,
        0
      ) / selected.length;

    return {
      x,
      y
    };
  }

  return {
    x: centerX,
    y: centerY
  };
}


/* =========================================================
 * СПЕЦИАЛЬНЫЕ СТЕНЫ
 * ========================================================= */

function applySpecialWalls(
  game,
  bricks,
  role
) {
  if (!Array.isArray(bricks)) return;

  /*
   * Стальной угол.
   */
  if (role === 7) {
    const alive =
      bricks.filter(b => b && b.alive);

    const steel =
      alive
        .sort((a, b) =>
          (a.x + a.y) -
          (b.x + b.y)
        )
        .slice(
          0,
          Math.min(4, alive.length)
        );

    for (const b of steel) {
      b.isSteel = true;
    }
  }

  /*
   * Спираль / регенерация.
   */
  if (role === 8) {
    const alive =
      bricks.filter(b => b && b.alive);

    const regen =
      alive.filter((b, i) =>
        i % 5 === 0
      );

    for (const b of regen) {
      b.maxRegens =
        Math.max(
          b.maxRegens || 0,
          2
        );
    }
  }

  /*
   * Охраняемый трон.
   */
  if (role === 10) {
    game._guardNext = true;
  }
}


/* =========================================================
 * BOUNDS
 * ========================================================= */

function getBounds(bricks) {
  let left = Infinity;
  let right = -Infinity;
  let top = Infinity;
  let bottom = -Infinity;

  for (const b of bricks) {
    left =
      Math.min(left, b.x);

    right =
      Math.max(
        right,
        b.x + b.width
      );

    top =
      Math.min(top, b.y);

    bottom =
      Math.max(
        bottom,
        b.y + b.height
      );
  }

  return {
    left,
    right,
    top,
    bottom
  };
}


/* =========================================================
 * АРТЕФАКТ
 * ========================================================= */

function collectArtifact(game, a) {
  if (!a || a.taken || game._digDone) {
    return;
  }

  a.taken = true;

  const allDestroyed =
    game.levelManager &&
    game.levelManager.aliveCount <= 0;

  const noLifeLost =
    game.lives >=
    (game._livesStart ?? game.lives);

  const stars =
    1 +
    (allDestroyed ? 1 : 0) +
    (noLifeLost ? 1 : 0);

  game.score += 500;

  if (
    game.effects &&
    game.effects.flash
  ) {
    game.effects.flash(
      '#f0c96a',
      0.3
    );
  }

  if (game.showBanner) {
    game.showBanner(
      '⚱ ' +
      KINDS[
        (a.kind || 0) %
        KINDS.length
      ] +
      ' ' +
      '🏺'.repeat(stars)
    );
  }

  if (
    game.audio &&
    game.audio.powerupGet
  ) {
    game.audio.powerupGet();
  }

  try {
    const saved =
      JSON.parse(
        localStorage.getItem(
          'agur_dig'
        ) || '{}'
      );

    saved[game.level] =
      Math.max(
        saved[game.level] || 0,
        stars
      );

    localStorage.setItem(
      'agur_dig',
      JSON.stringify(saved)
    );
  } catch (e) {}

  game._digDone = true;

  /*
   * Не вызываем levelComplete мгновенно:
   * даём эффекту раскопки закончиться.
   */
  setTimeout(() => {
    if (
      typeof game.levelComplete ===
      'function'
    ) {
      game.levelComplete();
    }
  }, 700);
}


/* =========================================================
 * RENDER
 * ========================================================= */

export function drawArtifact(g, a, t) {
  const pulse =
    0.6 +
    0.4 *
    Math.sin(t / 300);

  g.save();

  g.translate(
    a.x,
    a.y
  );

  /*
   * Свечение.
   */
  g.globalAlpha =
    ((a.hidden ? 0.22 : 0.32) *
      pulse) +
    0.12;

  g.fillStyle =
    '#f0c96a';

  g.beginPath();

  g.arc(
    0,
    0,
    19,
    0,
    Math.PI * 2
  );

  g.fill();

  /*
   * Сам артефакт.
   */
  g.globalAlpha = 1;

  g.fillStyle =
    '#d8a848';

  const k =
    (a.kind || 0) %
    KINDS.length;

  if (k === 0) {
    // Амфора
    g.beginPath();
    g.moveTo(-6, -8);
    g.quadraticCurveTo(
      -10,
      0,
      -5,
      8
    );
    g.lineTo(5, 8);
    g.quadraticCurveTo(
      10,
      0,
      6,
      -8
    );
    g.closePath();
    g.fill();

    g.fillRect(
      -4,
      -12,
      8,
      4
    );
  }

  else if (k === 1) {
    // Цилиндрическая печать
    g.fillRect(
      -4,
      -10,
      8,
      20
    );

    g.fillStyle =
      '#7a5018';

    g.fillRect(
      -1,
      -9,
      2,
      18
    );
  }

  else if (k === 2) {
    // Маска
    g.beginPath();

    g.arc(
      0,
      -1,
      9,
      0,
      Math.PI * 2
    );

    g.fill();

    g.fillStyle =
      '#7a5018';

    g.fillRect(
      -5,
      -3,
      3,
      2
    );

    g.fillRect(
      2,
      -3,
      3,
      2
    );
  }

  else if (k === 3) {
    // Амулет
    g.beginPath();

    g.moveTo(0, -9);
    g.lineTo(7, 0);
    g.lineTo(0, 9);
    g.lineTo(-7, 0);
    g.closePath();

    g.fill();

    g.strokeStyle =
      '#d8a848';

    g.lineWidth = 2;

    g.beginPath();

    g.arc(
      0,
      -11,
      3,
      0,
      Math.PI * 2
    );

    g.stroke();
  }

  else if (k === 4) {
    // Табличка
    g.fillRect(
      -8,
      -8,
      16,
      16
    );

    g.fillStyle =
      '#7a5018';

    g.fillRect(
      -5,
      -5,
      10,
      2
    );

    g.fillRect(
      -5,
      -1,
      7,
      2
    );

    g.fillRect(
      -5,
      3,
      10,
      2
    );
  }

  else if (k === 5) {
    // Корона
    g.fillRect(
      -9,
      2,
      18,
      5
    );

    g.beginPath();

    g.moveTo(-7, 2);
    g.lineTo(-4, -7);
    g.lineTo(-1, 2);

    g.lineTo(0, -9);
    g.lineTo(2, 2);

    g.lineTo(5, -7);
    g.lineTo(7, 2);

    g.closePath();

    g.fill();
  }

  else if (k === 6) {
    // Идол
    g.beginPath();

    g.arc(
      0,
      -6,
      4,
      0,
      Math.PI * 2
    );

    g.fill();

    g.fillRect(
      -3,
      -3,
      6,
      11
    );

    g.fillRect(
      -7,
      -1,
      14,
      3
    );
  }

  else if (k === 7) {
    // Самоцвет
    g.beginPath();

    g.moveTo(0, -9);
    g.lineTo(7, -3);
    g.lineTo(5, 7);
    g.lineTo(-5, 7);
    g.lineTo(-7, -3);

    g.closePath();
    g.fill();

    g.strokeStyle =
      '#7a5018';

    g.lineWidth = 1;

    g.beginPath();

    g.moveTo(0, -9);
    g.lineTo(0, 7);

    g.stroke();
  }

  else if (k === 8) {
    // Статуэтка
    g.beginPath();

    g.ellipse(
      0,
      2,
      6,
      7,
      0,
      0,
      Math.PI * 2
    );

    g.fill();

    g.beginPath();

    g.arc(
      3,
      -6,
      3,
      0,
      Math.PI * 2
    );

    g.fill();
  }

  else if (k === 9) {
    // Перстень
    g.strokeStyle =
      '#d8a848';

    g.lineWidth = 3;

    g.beginPath();

    g.arc(
      0,
      2,
      6,
      0,
      Math.PI * 2
    );

    g.stroke();

    g.fillRect(
      -2,
      -10,
      4,
      4
    );
  }

  else if (k === 10) {
    // Чаша
    g.beginPath();

    g.arc(
      0,
      -2,
      8,
      0,
      Math.PI
    );

    g.fill();

    g.fillRect(
      -9,
      -3,
      18,
      2
    );
  }

  else {
    // Наконечник
    g.beginPath();

    g.moveTo(0, -10);
    g.lineTo(5, 2);
    g.lineTo(0, 0);
    g.lineTo(-5, 2);

    g.closePath();

    g.fill();

    g.fillRect(
      -1,
      0,
      2,
      10
    );
  }

  /*
   * Блик.
   */
  g.fillStyle =
    'rgba(255,240,200,0.85)';

  g.fillRect(
    -2,
    -7,
    2,
    6
  );

  g.restore();
}
