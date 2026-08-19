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

const COLS = 12;
const ROWS = 18;

/*
 * Архитектура Agur.
 *
 * ВАЖНО:
 * LevelManager уже создаёт кирпичи на сетке 12 x 18.
 * Мы НЕ пытаемся удалить силуэт уровня.
 * Мы превращаем существующие кирпичи в полноценную
 * арканоидную головоломку:
 *
 *   ################
 *   #              #
 *   #   ########   #
 *   #   #      #   #
 *   #   #  ⚱   #   #
 *   #   #      #   #
 *   #   ########   #
 *   #              #
 *   ################
 *
 * Внешняя стена = steel.
 * Внутренние стены = обычные/спецкирпичи.
 * Центр = раскопка.
 */

export function initArchitectures(game) {
  if (!game || game.__architecturesInstalled) return;

  const loadName =
    typeof game.loadLevel === 'function'
      ? 'loadLevel'
      : typeof game.startLevel === 'function'
        ? 'startLevel'
        : null;

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

/* =========================================================
 * ОСНОВА
 * ======================================================= */

function applyArchitecture(game, level) {
  if (game._archApplied === level) return;

  /*
   * РАСКЛАДКИ V2 (Layouts88).
   *
   * LevelManager уже построил финальную архитектуру уровня:
   * внешние стены, тематическую постройку и камеру артефакта.
   * Здесь мы больше НЕ перекраиваем кирпичи — только ставим
   * артефакт в спроектированную камеру.
   *
   * Босс-уровни (11, 22, ..., 88): ни артефакта, ни стен.
   */
  const lmV2 = game.levelManager;
  if (lmV2 && lmV2.layoutV2) {
    game._archApplied = level;
    const ap = lmV2.artifactCell;
    if (!ap) {
      game.digArtifact = null;
      if (typeof game.showBanner === 'function' && level % 11 === 0) {
        game.showBanner('👹 Арена — ' + (lmV2.levelTitle || ''));
      }
      return;
    }
    game.digArtifact = {
      x: ap.x,
      y: ap.y,
      taken: false,
      hidden: level >= 67,
      kind: ((level - 1) * 3) % KINDS.length,
      role: (level - 1) % ROLE.length,
      radius: 16
    };
    if (typeof game.showBanner === 'function') {
      game.showBanner('⛏ ' + (lmV2.levelTitle || ('Раскопки №' + level)));
    }
    return;
  }

  const bricks = Array.isArray(game.bricks)
    ? game.bricks.filter(b => b && b.alive)
    : [];

  if (bricks.length < 24) {
    console.warn('[ARCH] Too few bricks:', bricks.length);
    return;
  }

  const rows = groupPositions(bricks, b => b.y);
  const cols = groupPositions(bricks, b => b.x);

  if (rows.length < 4 || cols.length < 4) {
    console.warn('[ARCH] Grid too small');
    return;
  }

  /*
   * Реальный размер сетки может отличаться из-за того,
   * как LevelManager создавал кирпичи, но обычно это 18 x 12.
   */
  const R = Math.min(ROWS, rows.length);
  const C = Math.min(COLS, cols.length);

  /*
   * Карта существующих кирпичей.
   */
  const byCell = new Map();

  for (const brick of bricks) {
    const r = nearestIndex(rows, brick.y);
    const c = nearestIndex(cols, brick.x);

    if (r < R && c < C) {
      byCell.set(r + ':' + c, brick);
    }
  }

  /*
   * Строим архитектурный план.
   *
   * true  = кирпич должен существовать
   * steel = внешняя/защитная стена
   */
  const plan = buildPlan(level, R, C);

  /*
   * Сначала выбираем существующие кирпичи.
   *
   * Мы не создаём новые Brick(), потому что это может
   * ломать внутренний bookkeeping Game/LevelManager.
   *
   * Если в исходном силуэте кирпича нет в нужной клетке,
   * ближайший свободный кирпич переносится туда.
   */
  const used = new Set();
  const assignments = [];

  const wanted = [];

  for (let r = 0; r < R; r++) {
    for (let c = 0; c < C; c++) {
      const cell = plan[r][c];

      if (cell === '.' || cell === 'A') continue;

      wanted.push({
        r,
        c,
        type: cell
      });
    }
  }

  /*
   * Сначала пытаемся сохранить кирпичи,
   * которые уже стоят на нужных местах.
   */
  for (const w of wanted) {
    const b = byCell.get(w.r + ':' + w.c);

    if (b && !used.has(b)) {
      used.add(b);
      assignments.push([b, w]);
    }
  }

  /*
   * Затем добираем остальные существующие кирпичи.
   */
  const free = bricks.filter(b => !used.has(b));

  for (const w of wanted) {
    if (assignments.some(a => a[1] === w)) continue;

    const b = free.shift();

    if (!b) break;

    used.add(b);
    assignments.push([b, w]);
  }

  /*
   * Если кирпичей не хватает, делаем максимально полную
   * архитектуру из того, что реально есть.
   */
  if (assignments.length < 20) {
    console.warn(
      '[ARCH] Architecture too small:',
      assignments.length
    );
    return;
  }

  /*
   * Все неиспользованные кирпичи выключаем.
   */
  for (const b of bricks) {
    if (used.has(b)) continue;

    b.alive = false;
    b.y = -9999;
    b.maxRegens = 0;

    decrementAlive(game, b);
  }

  /*
   * Перемещаем выбранные кирпичи в архитектурную сетку.
   */
  for (const [brick, cell] of assignments) {
    const x = cols[cell.c];
    const y = rows[cell.r];

    brick.x = x;
    brick.y = y;

    /*
     * Сбрасываем прежние свойства, чтобы старый силуэт
     * не протащил странную механику в новую архитектуру.
     */
    brick.maxRegens = 0;

    if (cell.type === '#') {
      makeSteel(brick);
    } else if (cell.type === 'R') {
      makeRegen(brick);
    } else if (cell.type === 'S') {
      makeSilver(brick);
    } else if (cell.type === 'G') {
      makeGold(brick);
    } else {
      /*
       * Внутренние кирпичи оставляем обычными.
       */
      brick.isSteel = false;
    }
  }

  /*
   * После переноса пересчитываем aliveCount.
   *
   * Это критично: LevelManager считает steel отдельно.
   */
  recountAlive(game);

  /*
   * Артефакт ставим в центральную клетку.
   */
  const center = findArtifactCenter(plan, rows, cols);

  game.digArtifact = {
    x: center.x,
    y: center.y,
    taken: false,
    hidden: level >= 67,
    kind: ((level - 1) * 3) % KINDS.length,
    role: (level - 1) % ROLE.length,
    radius: 16
  };

  game._archApplied = level;

  if (typeof game.showBanner === 'function') {
    game.showBanner(
      '⛏ Раскопки №' +
      level +
      ' — ' +
      ROLE[(level - 1) % ROLE.length]
    );
  }
}

/* =========================================================
 * ПЛАНЫ
 * ======================================================= */

function buildPlan(level, R, C) {
  const p = Array.from(
    { length: R },
    () => Array(C).fill('.')
  );

  const role = (level - 1) % ROLE.length;

  /*
   * ВНЕШНЯЯ СТЕНА.
   *
   * Она есть на каждом уровне.
   *
   * Оставляем отверстия только там, где они действительно
   * нужны для ощущения входов/проёмов.
   */
  for (let r = 0; r < R; r++) {
    for (let c = 0; c < C; c++) {
      if (
        r === 0 ||
        r === R - 1 ||
        c === 0 ||
        c === C - 1
      ) {
        p[r][c] = '#';
      }
    }
  }

  /*
   * Центральная камера.
   *
   * 5 x 5 пространство.
   */
  const cr = Math.floor(R / 2);
  const cc = Math.floor(C / 2);

  for (let r = cr - 2; r <= cr + 2; r++) {
    for (let c = cc - 2; c <= cc + 2; c++) {
      if (
        r > 0 &&
        r < R - 1 &&
        c > 0 &&
        c < C - 1
      ) {
        p[r][c] = '.';
      }
    }
  }

  /*
   * Каждая роль — отдельная головоломка.
   */
  switch (role) {
    case 0:
      planMound(p, cr, cc);
      break;

    case 1:
      planRicochet(p, cr, cc);
      break;

    case 2:
      planShaft(p, cr, cc);
      break;

    case 3:
      planRift(p, cr, cc);
      break;

    case 4:
      planTreasury(p, cr, cc);
      break;

    case 5:
      planDeepTreasury(p, cr, cc);
      break;

    case 6:
      planTemple(p, cr, cc);
      break;

    case 7:
      planSteelCorner(p, cr, cc);
      break;

    case 8:
      planSpiral(p, cr, cc);
      break;

    case 9:
      planFalseTomb(p, cr, cc);
      break;

    case 10:
      planThrone(p, cr, cc);
      break;
  }

  /*
   * Центральная камера всегда остаётся пустой.
   */
  for (let r = cr - 2; r <= cr + 2; r++) {
    for (let c = cc - 2; c <= cc + 2; c++) {
      if (
        r > 0 &&
        r < R - 1 &&
        c > 0 &&
        c < C - 1
      ) {
        p[r][c] = '.';
      }
    }
  }

  /*
   * Но вход в камеру существует.
   *
   * Верхний, нижний, левый, правый проходы.
   */
  p[cr - 3][cc] = '.';
  p[cr + 3][cc] = '.';
  p[cr][cc - 3] = '.';
  p[cr][cc + 3] = '.';

  return p;
}

/* Курган */
function planMound(p, cr, cc) {
  const R = p.length;
  const C = p[0].length;

  for (let r = 2; r < cr - 2; r++) {
    const width = 1 + Math.floor(
      (r - 2) / Math.max(1, cr - 4) * (C - 4)
    );

    const left = Math.floor((C - width) / 2);

    for (let c = left; c < left + width; c++) {
      if (p[r][c] === '.') p[r][c] = 'N';
    }
  }

  for (let r = cr + 3; r < R - 2; r++) {
    const width = 1 + Math.floor(
      (R - 3 - r) / Math.max(1, R - cr - 5) * (C - 4)
    );

    const left = Math.floor((C - width) / 2);

    for (let c = left; c < left + width; c++) {
      if (p[r][c] === '.') p[r][c] = 'N';
    }
  }
}

/* Рикошет */
function planRicochet(p, cr, cc) {
  const R = p.length;
  const C = p[0].length;

  for (let r = 3; r < R - 3; r += 3) {
    for (let c = 2; c < C - 2; c++) {
      if (p[r][c] === '.') p[r][c] = 'N';
    }

    const gap =
      2 + ((r / 3) % 2) * (C - 5);

    p[r][Math.floor(gap)] = '.';
    p[r][Math.min(C - 3, Math.floor(gap) + 1)] = '.';
  }

  for (let c = 2; c < C - 2; c += 4) {
    for (let r = 2; r < R - 2; r++) {
      if (
        Math.abs(r - cr) > 2 &&
        p[r][c] === '.'
      ) {
        p[r][c] = 'N';
      }
    }
  }
}

/* Шахта */
function planShaft(p, cr, cc) {
  const R = p.length;
  const C = p[0].length;

  for (let c = 2; c < C - 2; c++) {
    if (c === cc || c === cc - 1 || c === cc + 1) continue;

    for (let r = 2; r < R - 2; r++) {
      if (r % 4 !== 0 && p[r][c] === '.') {
        p[r][c] = 'N';
      }
    }
  }

  for (let r = 2; r < R - 2; r += 4) {
    p[r][cc - 3] = '.';
    p[r][cc + 3] = '.';
  }
}

/* Разлом */
function planRift(p, cr, cc) {
  const R = p.length;
  const C = p[0].length;

  for (let r = 2; r < R - 2; r++) {
    const crack =
      Math.floor(
        cc +
        Math.sin(r * 0.8) * 2
      );

    for (let c = 1; c < C - 1; c++) {
      if (
        Math.abs(c - crack) > 1 &&
        p[r][c] === '.'
      ) {
        p[r][c] = 'N';
      }
    }
  }
}

/* Сокровищница */
function planTreasury(p, cr, cc) {
  const R = p.length;
  const C = p[0].length;

  for (let r = 3; r < R - 3; r++) {
    for (let c = 2; c < C - 2; c++) {
      const d = Math.max(
        Math.abs(r - cr),
        Math.abs(c - cc)
      );

      if (d === 5 || d === 6) {
        p[r][c] = 'S';
      } else if (d >= 3 && d < 5) {
        p[r][c] = 'N';
      }
    }
  }

  p[cr - 3][cc] = '.';
  p[cr + 3][cc] = '.';
  p[cr][cc - 3] = '.';
  p[cr][cc + 3] = '.';
}

/* Глубокая сокровищница */
function planDeepTreasury(p, cr, cc) {
  const R = p.length;
  const C = p[0].length;

  for (let r = 2; r < R - 2; r++) {
    for (let c = 2; c < C - 2; c++) {
      const d =
        Math.abs(r - cr) +
        Math.abs(c - cc);

      if (d >= 6 && d <= 8) {
        p[r][c] = 'S';
      } else if (d >= 4 && d < 6) {
        p[r][c] = 'N';
      }
    }
  }

  for (let c = 2; c < C - 2; c += 3) {
    p[cr - 4][c] = 'N';
    p[cr + 4][c] = 'N';
  }
}

/* Живой храм */
function planTemple(p, cr, cc) {
  const R = p.length;
  const C = p[0].length;

  for (let r = 2; r < R - 2; r += 3) {
    for (let c = 2; c < C - 2; c++) {
      if (p[r][c] === '.') p[r][c] = 'N';
    }

    const gate = 2 + ((r * 3) % (C - 5));

    p[r][gate] = '.';
    p[r][Math.min(C - 3, gate + 1)] = '.';
  }

  for (let c = 3; c < C - 3; c += 3) {
    p[cr - 4][c] = 'N';
    p[cr + 4][c] = 'N';
  }
}

/* Стальной угол */
function planSteelCorner(p, cr, cc) {
  const R = p.length;
  const C = p[0].length;

  for (let r = 2; r < R - 2; r++) {
    for (let c = 2; c < C - 2; c++) {
      if (
        (r < cr && c < cc) ||
        (r > cr && c > cc)
      ) {
        if (p[r][c] === '.') p[r][c] = 'N';
      }
    }
  }

  for (let r = 2; r < cr; r++) {
    p[r][2] = 'S';
    p[r][C - 3] = 'S';
  }

  for (let r = cr + 1; r < R - 2; r++) {
    p[r][2] = 'S';
    p[r][C - 3] = 'S';
  }
}

/* Спираль */
function planSpiral(p, cr, cc) {
  const R = p.length;
  const C = p[0].length;

  let top = 2;
  let bottom = R - 3;
  let left = 2;
  let right = C - 3;

  while (top <= bottom && left <= right) {
    for (let c = left; c <= right; c++) {
      if (p[top][c] === '.') p[top][c] = 'N';
    }

    for (let r = top; r <= bottom; r++) {
      if (p[r][right] === '.') p[r][right] = 'N';
    }

    if (top < bottom) {
      for (let c = right; c >= left; c--) {
        if (p[bottom][c] === '.') p[bottom][c] = 'N';
      }
    }

    if (left < right) {
      for (let r = bottom; r >= top; r--) {
        if (p[r][left] === '.') p[r][left] = 'N';
      }
    }

    top += 2;
    bottom -= 2;
    left += 2;
    right -= 2;
  }
}

/* Ложная гробница */
function planFalseTomb(p, cr, cc) {
  const R = p.length;
  const C = p[0].length;

  for (let r = 3; r < R - 3; r++) {
    for (let c = 2; c < C - 2; c++) {
      if (
        (r === 3 || r === R - 4) &&
        p[r][c] === '.'
      ) {
        p[r][c] = 'N';
      }

      if (
        (c === 2 || c === C - 3) &&
        p[r][c] === '.'
      ) {
        p[r][c] = 'N';
      }
    }
  }

  /*
   * Ложный проход.
   */
  p[3][cc] = '.';
  p[3][cc + 1] = '.';

  /*
   * Настоящий проход.
   */
  p[cr - 3][cc] = '.';
}

/* Охраняемый трон */
function planThrone(p, cr, cc) {
  const R = p.length;
  const C = p[0].length;

  for (let r = 2; r < R - 2; r++) {
    for (let c = 2; c < C - 2; c++) {
      if (
        Math.abs(r - cr) +
        Math.abs(c - cc) >= 5
      ) {
        if (p[r][c] === '.') p[r][c] = 'N';
      }
    }
  }

  /*
   * Трон — нижняя часть.
   */
  for (let c = cc - 2; c <= cc + 2; c++) {
    p[cr + 3][c] = 'S';
  }

  p[cr + 3][cc] = 'G';

  /*
   * Проход к трону.
   */
  for (let r = cr + 1; r <= cr + 2; r++) {
    p[r][cc] = '.';
  }
}

/* =========================================================
 * АРТЕФАКТ
 * ======================================================= */

function findArtifactCenter(plan, rows, cols) {
  const R = plan.length;
  const C = plan[0].length;

  const r = Math.floor(R / 2);
  const c = Math.floor(C / 2);

  const rr = Math.min(
    rows.length - 1,
    Math.max(0, r)
  );

  const cc = Math.min(
    cols.length - 1,
    Math.max(0, c)
  );

  return {
    x: cols[cc],
    y: rows[rr]
  };
}

/* =========================================================
 * BRICKS
 * ======================================================= */

function makeSteel(brick) {
  brick.isSteel = true;
  brick.maxRegens = 0;
}

function makeSilver(brick) {
  brick.isSteel = false;

  if (typeof brick.setType === 'function') {
    try {
      brick.setType('silver');
    } catch (_) {}
  }
}

function makeGold(brick) {
  brick.isSteel = false;

  if (typeof brick.setType === 'function') {
    try {
      brick.setType('gold');
    } catch (_) {}
  }
}

function makeRegen(brick) {
  brick.isSteel = false;
  brick.maxRegens = 2;
}

function decrementAlive(game, brick) {
  /*
   * Steel кирпичи LevelManager не считает живыми.
   */
  if (brick.isSteel) return;

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

function recountAlive(game) {
  if (
    !game.levelManager ||
    typeof game.levelManager.aliveCount !== 'number'
  ) {
    return;
  }

  game.levelManager.aliveCount =
    (game.bricks || []).filter(
      b => b && b.alive && !b.isSteel
    ).length;
}

/* =========================================================
 * GRID
 * ======================================================= */

function groupPositions(bricks, getter) {
  const values = bricks
    .map(getter)
    .filter(v => Number.isFinite(v))
    .map(v => Math.round(v));

  return [...new Set(values)].sort(
    (a, b) => a - b
  );
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

/* =========================================================
 * RENDER
 * ======================================================= */

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

function drawArtifact(g, artifact, time) {
  const pulse =
    0.65 +
    0.35 *
      Math.sin(time / 220);

  g.save();

  g.translate(
    artifact.x,
    artifact.y
  );

  /*
   * Свечение.
   */
  g.globalAlpha =
    0.10 +
    pulse * 0.10;

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
   * Артефакт.
   */
  g.globalAlpha = 1;
  g.fillStyle = '#d8a848';

  const k =
    artifact.kind % KINDS.length;

  if (k === 0) {
    g.beginPath();
    g.moveTo(-7, -8);
    g.quadraticCurveTo(
      -10,
      0,
      -6,
      8
    );
    g.lineTo(6, 8);
    g.quadraticCurveTo(
      10,
      0,
      7,
      -8
    );
    g.closePath();
    g.fill();
    g.fillRect(-4, -12, 8, 3);
  } else if (k === 1) {
    g.fillRect(-5, -10, 10, 20);
    g.fillStyle = '#7a5018';
    g.fillRect(-2, -8, 4, 16);
  } else if (k === 2) {
    g.beginPath();
    g.arc(
      0,
      0,
      9,
      0,
      Math.PI * 2
    );
    g.fill();

    g.fillStyle = '#7a5018';
    g.fillRect(-5, -2, 3, 3);
    g.fillRect(2, -2, 3, 3);
  } else if (k === 3) {
    g.beginPath();
    g.moveTo(0, -10);
    g.lineTo(8, 0);
    g.lineTo(0, 10);
    g.lineTo(-8, 0);
    g.closePath();
    g.fill();
  } else if (k === 4) {
    g.fillRect(-8, -9, 16, 18);
    g.fillStyle = '#7a5018';
    g.fillRect(-5, -5, 10, 2);
    g.fillRect(-5, -1, 7, 2);
    g.fillRect(-5, 3, 10, 2);
  } else if (k === 5) {
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
    g.beginPath();
    g.arc(
      0,
      -6,
      4,
      0,
      Math.PI * 2
    );
    g.fill();
    g.fillRect(-4, -2, 8, 11);
    g.fillRect(-8, 0, 16, 3);
  } else if (k === 7) {
    g.beginPath();
    g.moveTo(0, -10);
    g.lineTo(8, -3);
    g.lineTo(5, 8);
    g.lineTo(-5, 8);
    g.lineTo(-8, -3);
    g.closePath();
    g.fill();
  } else if (k === 8) {
    g.beginPath();
    g.ellipse(
      0,
      3,
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
  } else if (k === 9) {
    g.strokeStyle = '#d8a848';
    g.lineWidth = 3;

    g.beginPath();
    g.arc(
      0,
      3,
      6,
      0,
      Math.PI * 2
    );
    g.stroke();

    g.fillRect(-2, -9, 4, 4);
  } else if (k === 10) {
    g.beginPath();
    g.arc(
      0,
      -1,
      9,
      0,
      Math.PI
    );
    g.fill();

    g.fillRect(-10, -3, 20, 2);
  } else {
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

/* =========================================================
 * COLLECTOR
 * ======================================================= */

function installCollector(game) {
  if (game.__architectureCollectorTimer) return;

  game.__architectureCollectorTimer =
    setInterval(() => {
      const artifact =
        game.digArtifact;

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
        if (
          !ball ||
          !ball.isLaunched
        ) {
          continue;
        }

        const dx =
          ball.x - artifact.x;

        const dy =
          ball.y - artifact.y;

        const radius =
          artifact.radius +
          (ball.radius || 8);

        if (
          dx * dx +
          dy * dy <=
          radius * radius
        ) {
          collectArtifact(
            game,
            artifact
          );

          return;
        }
      }
    }, 50);
}

function collectArtifact(
  game,
  artifact
) {
  if (
    artifact.taken ||
    game._digDone
  ) {
    return;
  }

  artifact.taken = true;
  game._digDone = true;

  const noLifeLost =
    game.lives >=
    (
      game._livesStart == null
        ? game.lives
        : game._livesStart
    );

  const allDestroyed =
    game.levelManager &&
    typeof game.levelManager.aliveCount === 'number' &&
    game.levelManager.aliveCount <= 0;

  const stars =
    1 +
    (allDestroyed ? 1 : 0) +
    (noLifeLost ? 1 : 0);

  game.score += 500;

  if (
    game.effects &&
    typeof game.effects.flash === 'function'
  ) {
    game.effects.flash(
      '#f0c96a',
      0.3
    );
  }

  if (
    typeof game.showBanner === 'function'
  ) {
    game.showBanner(
      '⚱ ' +
      KINDS[
        artifact.kind %
        KINDS.length
      ] +
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
    const data =
      JSON.parse(
        localStorage.getItem(
          'agur_dig'
        ) || '{}'
      );

    data[game.level] =
      Math.max(
        Number(data[game.level]) || 0,
        stars
      );

    localStorage.setItem(
      'agur_dig',
      JSON.stringify(data)
    );
  } catch (_) {}

  setTimeout(() => {
    if (
      game.digArtifact === artifact &&
      typeof game.levelComplete === 'function'
    ) {
      game.levelComplete();
    }
  }, 700);
}
