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

export function initArchitectures(game) {
  if (!game || game.__architecturesInstalled) return;

  const loadName =
    typeof game.loadLevel === 'function' ? 'loadLevel' :
    typeof game.startLevel === 'function' ? 'startLevel' :
    null;

  if (!loadName) {
    console.error('[ARCH] loadLevel/startLevel not found');
    return;
  }

  game.__architecturesInstalled = true;

  const originalLoad = game[loadName].bind(game);

  game[loadName] = function (level, ...args) {
    game._digDone = false;
    game._livesStart = game.lives;
    game.digArtifact = null;
    game._archApplied = null;

    const result = originalLoad(level, ...args);

    /*
     * LevelManager/Game уже создали bricks.
     * Применяем архитектуру сразу и ещё раз на следующем кадре,
     * если другая система успела изменить уровень.
     */
    applyArchitecture(game, level);

    requestAnimationFrame(() => {
      if (game._archApplied !== level) {
        applyArchitecture(game, level);
      }
    });

    return result;
  };

  patchRenderer(game);
  installCollector(game);
}

function applyArchitecture(game, level) {
  if (game._archApplied === level) return;

  const bricks = Array.isArray(game.bricks)
    ? game.bricks.filter(b => b && b.alive)
    : [];

  if (bricks.length < 12) return;

  /*
   * Находим реальные строки и колонки существующих кирпичей.
   * Никаких придуманных координат.
   */
  const rows = groupPositions(bricks, b => b.y);
  const cols = groupPositions(bricks, b => b.x);

  if (rows.length < 4 || cols.length < 4) return;

  const centerRow = Math.floor(rows.length / 2);
  const centerCol = Math.floor(cols.length / 2);

  /*
   * Центральная камера 2x2.
   *
   * Это и есть архитектура:
   *
   *     ██ ██
   *
   *      ⚱
   *
   *     ██ ██
   *
   * Четыре центральных кирпича убираются,
   * артефакт оказывается ровно в центре.
   */
  const targetRows = [
    rows[Math.max(0, centerRow - 1)],
    rows[Math.min(rows.length - 1, centerRow)]
  ];

  const targetCols = [
    cols[Math.max(0, centerCol - 1)],
    cols[Math.min(cols.length - 1, centerCol)]
  ];

  const targets = [];

  for (const brick of bricks) {
    const row = nearestIndex(rows, brick.y);
    const col = nearestIndex(cols, brick.x);

    if (
      targetRows.includes(rows[row]) &&
      targetCols.includes(cols[col])
    ) {
      targets.push(brick);
    }
  }

  /*
   * На нечётной/нестандартной сетке может получиться
   * меньше четырёх кирпичей. Тогда берём ближайшие
   * к геометрическому центру реальные кирпичи.
   */
  let selected = targets;

  if (selected.length < 4) {
    const bounds = getBounds(bricks);

    selected = bricks
      .slice()
      .sort((a, b) => {
        const ax = a.x + a.width / 2;
        const ay = a.y + a.height / 2;
        const bx = b.x + b.width / 2;
        const by = b.y + b.height / 2;

        return distance2(ax, ay, bounds.cx, bounds.cy) -
               distance2(bx, by, bounds.cx, bounds.cy);
      })
      .slice(0, 4);
  }

  if (selected.length < 1) return;

  /*
   * Центр камеры рассчитываем по фактическим кирпичам.
   */
  const artifact = getCenterOfBricks(selected);

  game.digArtifact = {
    x: artifact.x,
    y: artifact.y,
    taken: false,
    hidden: false,
    kind: ((level - 1) * 3) % KINDS.length,
    role: (level - 1) % ROLE.length,
    radius: 16
  };

  /*
   * Убираем кирпичи из игры.
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
      game.levelManager.aliveCount = Math.max(
        0,
        game.levelManager.aliveCount - 1
      );
    }
  }

  game._archApplied = level;

  if (typeof game.showBanner === 'function') {
    game.showBanner(
      '⛏ Раскопки №' + level +
      ' — ' + ROLE[(level - 1) % ROLE.length]
    );
  }
}

function patchRenderer(game) {
  const renderer = game.renderer;

  if (
    !renderer ||
    typeof renderer.draw !== 'function' ||
    renderer.__architectureRendererPatched
  ) {
    return;
  }

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
      drawArtifact(
        game.ctx,
        artifact,
        performance.now()
      );
    }
  };
}

function installCollector(game) {
  if (game.__architectureCollectorTimer) return;

  game.__architectureCollectorTimer = setInterval(() => {
    const artifact = game.digArtifact;

    if (
      !artifact ||
      artifact.taken ||
      game._digDone
    ) {
      return;
    }

    if (
      game.state !== 'playing' ||
      game.museumOpen
    ) {
      return;
    }

    for (const ball of game.balls || []) {
      if (!ball || !ball.isLaunched) continue;

      const dx = ball.x - artifact.x;
      const dy = ball.y - artifact.y;

      const r =
        artifact.radius +
        (ball.radius || 8);

      if (dx * dx + dy * dy <= r * r) {
        collectArtifact(game, artifact);
        return;
      }
    }
  }, 50);
}

function collectArtifact(game, artifact) {
  if (
    artifact.taken ||
    game._digDone
  ) {
    return;
  }

  artifact.taken = true;
  game._digDone = true;

  const noLifeLost =
    game.lives >= (
      game._livesStart == null
        ? game.lives
        : game._livesStart
    );

  const allBricksDestroyed =
    game.levelManager &&
    typeof game.levelManager.aliveCount === 'number' &&
    game.levelManager.aliveCount <= 0;

  const stars =
    1 +
    (allBricksDestroyed ? 1 : 0) +
    (noLifeLost ? 1 : 0);

  game.score += 500;

  if (
    game.effects &&
    typeof game.effects.flash === 'function'
  ) {
    game.effects.flash('#f0c96a', 0.3);
  }

  if (typeof game.showBanner === 'function') {
    game.showBanner(
      '⚱ ' +
      KINDS[artifact.kind % KINDS.length] +
      ' ' +
      '🏺'.repeat(stars)
    );
  }

  if (
    game.audio &&
    typeof game.audio.powerupGet === 'function'
  ) {
    game.audio.powerupGet();
  }

  try {
    const data = JSON.parse(
      localStorage.getItem('agur_dig') || '{}'
    );

    data[game.level] = Math.max(
      Number(data[game.level]) || 0,
      stars
    );

    localStorage.setItem(
      'agur_dig',
      JSON.stringify(data)
    );
  } catch (_) {}

  /*
   * Не вызываем levelComplete мгновенно.
   * Даём игре закончить анимацию артефакта.
   */
  setTimeout(() => {
    if (
      game.digArtifact === artifact &&
      typeof game.levelComplete === 'function'
    ) {
      game.levelComplete();
    }
  }, 700);
}

function drawArtifact(g, artifact, time) {
  const pulse =
    0.72 +
    0.28 * Math.sin(time / 220);

  g.save();

  g.translate(
    artifact.x,
    artifact.y
  );

  /*
   * Свечение.
   */
  g.globalAlpha =
    0.12 * pulse;

  g.fillStyle = '#f0c96a';

  g.beginPath();
  g.arc(
    0,
    0,
    25 + pulse * 5,
    0,
    Math.PI * 2
  );
  g.fill();

  /*
   * Сам артефакт.
   */
  g.globalAlpha = 1;
  g.fillStyle = '#d8a848';

  const k =
    artifact.kind % KINDS.length;

  if (k === 0) {
    // Амфора
    g.beginPath();
    g.moveTo(-7, -8);
    g.quadraticCurveTo(-10, 0, -6, 8);
    g.lineTo(6, 8);
    g.quadraticCurveTo(10, 0, 7, -8);
    g.closePath();
    g.fill();

    g.fillRect(-4, -12, 8, 3);
  } else if (k === 1) {
    // Печать
    g.fillRect(-5, -10, 10, 20);
    g.fillStyle = '#7a5018';
    g.fillRect(-2, -8, 4, 16);
  } else if (k === 2) {
    // Маска
    g.beginPath();
    g.arc(0, 0, 9, 0, Math.PI * 2);
    g.fill();

    g.fillStyle = '#7a5018';
    g.fillRect(-5, -2, 3, 3);
    g.fillRect(2, -2, 3, 3);
  } else if (k === 3) {
    // Амулет
    g.beginPath();
    g.moveTo(0, -10);
    g.lineTo(8, 0);
    g.lineTo(0, 10);
    g.lineTo(-8, 0);
    g.closePath();
    g.fill();
  } else if (k === 4) {
    // Табличка
    g.fillRect(-8, -9, 16, 18);
    g.fillStyle = '#7a5018';
    g.fillRect(-5, -5, 10, 2);
    g.fillRect(-5, -1, 7, 2);
    g.fillRect(-5, 3, 10, 2);
  } else if (k === 5) {
    // Корона
    g.fillRect(-9, 3, 18, 5);

    g.beginPath();
    g.moveTo(-7, 3);
    g.lineTo(-5, -7);
    g.lineTo(-2, 3);
    g.lineTo(0, -9);
    g.lineTo(3, 3);
    g.lineTo(6, -7);
    g.lineTo(8, 3);
    g.closePath();
    g.fill();
  } else if (k === 6) {
    // Идол
    g.beginPath();
    g.arc(0, -6, 4, 0, Math.PI * 2);
    g.fill();
    g.fillRect(-4, -2, 8, 11);
    g.fillRect(-8, 0, 16, 3);
  } else if (k === 7) {
    // Самоцвет
    g.beginPath();
    g.moveTo(0, -10);
    g.lineTo(8, -3);
    g.lineTo(5, 8);
    g.lineTo(-5, 8);
    g.lineTo(-8, -3);
    g.closePath();
    g.fill();
  } else if (k === 8) {
    // Статуэтка
    g.beginPath();
    g.ellipse(0, 3, 6, 7, 0, 0, Math.PI * 2);
    g.fill();

    g.beginPath();
    g.arc(3, -6, 3, 0, Math.PI * 2);
    g.fill();
  } else if (k === 9) {
    // Перстень
    g.strokeStyle = '#d8a848';
    g.lineWidth = 3;
    g.beginPath();
    g.arc(0, 3, 6, 0, Math.PI * 2);
    g.stroke();

    g.fillRect(-2, -9, 4, 4);
  } else if (k === 10) {
    // Чаша
    g.beginPath();
    g.arc(0, -1, 9, 0, Math.PI);
    g.fill();

    g.fillRect(-10, -3, 20, 2);
  } else {
    // Наконечник
    g.beginPath();
    g.moveTo(0, -11);
    g.lineTo(6, 2);
    g.lineTo(0, 0);
    g.lineTo(-6, 2);
    g.closePath();
    g.fill();

    g.fillRect(-1, 0, 2, 10);
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

function groupPositions(bricks, getter) {
  const values = bricks
    .map(getter)
    .sort((a, b) => a - b);

  const result = [];

  for (const value of values) {
    if (
      !result.length ||
      Math.abs(result[result.length - 1] - value) > 2
    ) {
      result.push(value);
    }
  }

  return result;
}

function nearestIndex(values, value) {
  let best = 0;
  let distance = Infinity;

  for (let i = 0; i < values.length; i++) {
    const d = Math.abs(values[i] - value);

    if (d < distance) {
      distance = d;
      best = i;
    }
  }

  return best;
}

function getCenterOfBricks(bricks) {
  let x = 0;
  let y = 0;

  for (const b of bricks) {
    x += b.x + b.width / 2;
    y += b.y + b.height / 2;
  }

  return {
    x: x / bricks.length,
    y: y / bricks.length
  };
}

function getBounds(bricks) {
  let left = Infinity;
  let right = -Infinity;
  let top = Infinity;
  let bottom = -Infinity;

  for (const b of bricks) {
    left = Math.min(left, b.x);
    right = Math.max(right, b.x + b.width);
    top = Math.min(top, b.y);
    bottom = Math.max(bottom, b.y + b.height);
  }

  return {
    left,
    right,
    top,
    bottom,
    cx: (left + right) / 2,
    cy: (top + bottom) / 2
  };
}

function distance2(ax, ay, bx, by) {
  const dx = ax - bx;
  const dy = ay - by;
  return dx * dx + dy * dy;
}
