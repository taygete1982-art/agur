const KINDS = [
  'Амфора','Цилиндрическая печать','Золотая маска','Амулет',
  'Табличка','Корона','Идол','Самоцвет','Статуэтка','Перстень',
  'Чаша','Наконечник'
];

const ROLE = [
  'Курган','Рикошет','Шахта','Разлом','Сокровищница',
  'Глубокая сокровищница','Живой храм','Стальной угол',
  'Спираль','Ложная гробница','Охраняемый трон'
];

export function initArchitectures(game) {
  if (!game || game.__architecturesInstalled) return;

  const name =
    typeof game.loadLevel === 'function' ? 'loadLevel' :
    typeof game.startLevel === 'function' ? 'startLevel' : null;

  if (!name) return;

  game.__architecturesInstalled = true;

  const original = game[name].bind(game);

  game[name] = function(level, ...args) {
    game._digDone = false;
    game._livesStart = game.lives;
    game.digArtifact = null;
    game._archApplied = null;

    const result = original(level, ...args);

    applyArchitecture(game, level);

    requestAnimationFrame(() => {
      applyArchitecture(game, level);
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

  if (bricks.length < 15) return;

  const rows = positions(bricks, b => b.y);
  const cols = positions(bricks, b => b.x);

  if (rows.length < 6 || cols.length < 6) return;

  const ri = new Map(rows.map((v,i) => [v,i]));
  const ci = new Map(cols.map((v,i) => [v,i]));

  const R = rows.length;
  const C = cols.length;

  /*
   * КАРТА:
   *
   *       █████████
   *      █         █
   *      █   ⚱     █
   *      █         █
   *      █    █    █
   *      █    █    █
   *      █    █    █
   *           ↑
   *        ВХОД СНИЗУ
   *
   * Мы не создаём новую сетку.
   * Мы используем реальные кирпичи текущего уровня.
   */

  const centerR = Math.floor(R * 0.48);
  const centerC = Math.floor(C / 2);

  /*
   * Камера вокруг артефакта.
   * Размер меняется по уровням:
   * ранние уровни проще,
   * поздние получают более глубокую камеру.
   */
  const chamberDepth = 2 + Math.min(3, Math.floor((level - 1) / 11));
  const chamberWidth = 3 + ((level - 1) % 3 === 0 ? 1 : 0);

  /*
   * Определяем геометрические зоны.
   */
  const chamber = new Set();
  const corridor = new Set();
  const entrance = new Set();

  for (let r = 0; r < R; r++) {
    for (let c = 0; c < C; c++) {

      /*
       * Центральная камера.
       */
      if (
        r >= centerR - 1 &&
        r <= centerR + 1 &&
        Math.abs(c - centerC) <= Math.floor(chamberWidth / 2)
      ) {
        chamber.add(key(r,c));
      }

      /*
       * Центральная шахта от камеры вниз.
       */
      if (
        c >= centerC - 1 &&
        c <= centerC + 1 &&
        r > centerR + 1
      ) {
        corridor.add(key(r,c));
      }
    }
  }

  /*
   * Самый нижний участок делаем широким,
   * чтобы шар гарантированно мог войти.
   */
  for (let r = Math.max(centerR + 2, R - 5); r < R; r++) {
    for (let c = centerC - 2; c <= centerC + 2; c++) {
      if (c >= 0 && c < C) {
        corridor.add(key(r,c));
        entrance.add(key(r,c));
      }
    }
  }

  /*
   * Выбираем реальные кирпичи.
   */
  const map = new Map();

  for (const b of bricks) {
    const r = ri.get(Math.round(b.y));
    const c = ci.get(Math.round(b.x));
    if (r == null || c == null) continue;
    map.set(key(r,c), b);
  }

  /*
   * ВАЖНО:
   * сначала снимаем steel/regen-флаги с кирпичей,
   * которые попадут в проход.
   *
   * Иначе старые типы уровня могут случайно
   * превратить вход в непробиваемую стену.
   */
  for (const k of [...chamber, ...corridor]) {
    const b = map.get(k);
    if (!b) continue;

    b.isSteel = false;
    b.maxRegens = 0;
  }

  /*
   * Камера должна быть пустой.
   */
  for (const k of chamber) {
    removeBrick(game, map.get(k));
  }

  /*
   * Проход должен быть пустым.
   */
  for (const k of corridor) {
    removeBrick(game, map.get(k));
  }

  /*
   * Артефакт находится не "примерно в центре",
   * а строго внутри реальной камеры.
   */
  const chamberCells = [...chamber]
    .map(k => map.get(k))
    .filter(Boolean);

  /*
   * После удаления кирпичей координаты камеры
   * считаем по исходной сетке.
   */
  const sample =
    bricks.find(b => {
      const r = ri.get(Math.round(b.y));
      const c = ci.get(Math.round(b.x));
      return (
        r === centerR &&
        c === centerC
      );
    }) || bricks[Math.floor(bricks.length / 2)];

  if (!sample) return;

  game.digArtifact = {
    x: sample.x + sample.width / 2,
    y: sample.y + sample.height / 2,
    radius: 18,
    taken: false,
    hidden: false,
    kind: ((level - 1) * 3) % KINDS.length,
    role: (level - 1) % ROLE.length
  };

  /*
   * Теперь строим защиту камеры.
   *
   * НЕ закрываем вход.
   *
   * Левая и правая стены:
   *
   *       █   █
   *       █ ⚱ █
   *       █   █
   *       █   █
   *         ↑
   *
   * Верх закрыт, но снизу открыт.
   */

  const wallDepth =
    2 + Math.min(2, Math.floor((level - 1) / 22));

  const wall = new Set();

  for (let d = 0; d < wallDepth; d++) {

    const left = centerC - Math.floor(chamberWidth / 2) - 1 - d;
    const right = centerC + Math.floor(chamberWidth / 2) + 1 + d;

    for (let r = centerR - 2; r <= centerR + 2 + d; r++) {
      if (r >= 0 && r < R) {
        if (left >= 0) wall.add(key(r,left));
        if (right < C) wall.add(key(r,right));
      }
    }

    /*
     * Верхняя перемычка.
     */
    const top = centerR - 2 - d;

    for (
      let c = centerC - Math.floor(chamberWidth / 2) - 1 - d;
      c <= centerC + Math.floor(chamberWidth / 2) + 1 + d;
      c++
    ) {
      if (top >= 0 && c >= 0 && c < C) {
        wall.add(key(top,c));
      }
    }
  }

  /*
   * Убираем стену из входного канала.
   */
  for (const k of entrance) {
    wall.delete(k);
  }

  /*
   * И ещё важнее:
   * никогда не ставим стену непосредственно
   * в клетку камеры или прохода.
   */
  for (const k of chamber) wall.delete(k);
  for (const k of corridor) wall.delete(k);

  /*
   * Превращаем существующие кирпичи стены в steel.
   */
  for (const k of wall) {
    const b = map.get(k);
    if (!b || !b.alive) continue;

    b.isSteel = true;
    b.maxRegens = 0;
  }

  /*
   * На нечётных уровнях добавляем пару "зубцов",
   * заставляющих шар менять траекторию,
   * но не перекрывающих вход.
   */
  if (level % 2 === 0) {
    addTooth(map, centerC - 3, centerR + 3, corridor, C);
    addTooth(map, centerC + 3, centerR + 5, corridor, C);
  }

  /*
   * На каждом третьем уровне — один дополнительный
   * боковой рикошет.
   */
  if (level % 3 === 0) {
    addTooth(map, centerC - 4, centerR + 6, corridor, C);
  }

  /*
   * Страховка: вход обязан оставаться открытым.
   */
  for (const k of entrance) {
    const b = map.get(k);
    if (!b) continue;

    b.alive = false;
    b.y = -9999;
    b.isSteel = false;
    b.maxRegens = 0;
  }

  recalcAlive(game);

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

function addTooth(map, c, r, corridor, C) {
  if (c < 0 || c >= C) return;

  const k = key(r,c);

  /*
   * Не ставим препятствие в центральный коридор.
   */
  if (corridor.has(k)) return;

  const b = map.get(k);

  if (b && b.alive) {
    b.isSteel = true;
    b.maxRegens = 0;
  }
}

function removeBrick(game, b) {
  if (!b || !b.alive) return;

  b.alive = false;
  b.y = -9999;
  b.maxRegens = 0;
  b.isSteel = false;

  if (
    game.levelManager &&
    typeof game.levelManager.aliveCount === 'number'
  ) {
    game.levelManager.aliveCount =
      Math.max(0, game.levelManager.aliveCount - 1);
  }
}

function recalcAlive(game) {
  if (
    !game.levelManager ||
    !Array.isArray(game.bricks)
  ) return;

  game.levelManager.aliveCount =
    game.bricks.filter(
      b => b &&
           b.alive &&
           !b.isSteel
    ).length;
}

function positions(bricks, fn) {
  return [...new Set(
    bricks.map(b => Math.round(fn(b)))
  )].sort((a,b) => a-b);
}

function key(r,c) {
  return r + ':' + c;
}

function patchRenderer(game) {
  const renderer = game.renderer;

  if (
    !renderer ||
    typeof renderer.draw !== 'function' ||
    renderer.__architectureRendererPatched
  ) return;

  renderer.__architectureRendererPatched = true;

  const original = renderer.draw.bind(renderer);

  renderer.draw = function() {
    original();

    const a = game.digArtifact;

    if (
      a &&
      !a.taken &&
      game.ctx
    ) {
      drawArtifact(
        game.ctx,
        a,
        performance.now()
      );
    }
  };
}

function installCollector(game) {
  if (game.__architectureCollectorTimer) return;

  game.__architectureCollectorTimer =
    setInterval(() => {

      const a = game.digArtifact;

      if (
        !a ||
        a.taken ||
        game._digDone
      ) return;

      if (
        game.state !== 'playing' ||
        game.museumOpen
      ) return;

      for (const ball of game.balls || []) {
        if (!ball || !ball.isLaunched) continue;

        const dx = ball.x - a.x;
        const dy = ball.y - a.y;

        const radius =
          a.radius +
          (ball.radius || 8);

        if (
          dx * dx +
          dy * dy <=
          radius * radius
        ) {
          collectArtifact(game, a);
          return;
        }
      }
    }, 50);
}

function collectArtifact(game, a) {
  if (a.taken || game._digDone) return;

  a.taken = true;
  game._digDone = true;

  const noLifeLost =
    game.lives >= (
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
    game.effects.flash('#f0c96a', 0.3);
  }

  if (typeof game.showBanner === 'function') {
    game.showBanner(
      '⚱ ' +
      KINDS[a.kind % KINDS.length] +
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

  setTimeout(() => {
    if (
      game.digArtifact === a &&
      typeof game.levelComplete === 'function'
    ) {
      game.levelComplete();
    }
  }, 700);
}

function drawArtifact(g, a, t) {
  const pulse =
    0.7 +
    0.3 * Math.sin(t / 220);

  g.save();

  g.translate(a.x, a.y);

  g.globalAlpha =
    0.12 * pulse;

  g.fillStyle = '#f0c96a';

  g.beginPath();
  g.arc(
    0,
    0,
    28 + pulse * 5,
    0,
    Math.PI * 2
  );
  g.fill();

  g.globalAlpha = 1;
  g.fillStyle = '#d8a848';

  const k =
    a.kind % KINDS.length;

  if (k === 0) {
    g.beginPath();
    g.moveTo(-7,-8);
    g.quadraticCurveTo(-10,0,-6,8);
    g.lineTo(6,8);
    g.quadraticCurveTo(10,0,7,-8);
    g.closePath();
    g.fill();
    g.fillRect(-4,-12,8,3);

  } else if (k === 1) {
    g.fillRect(-5,-10,10,20);

  } else if (k === 2) {
    g.beginPath();
    g.arc(0,0,9,0,Math.PI*2);
    g.fill();
    g.fillStyle='#7a5018';
    g.fillRect(-5,-2,3,3);
    g.fillRect(2,-2,3,3);

  } else if (k === 3) {
    g.beginPath();
    g.moveTo(0,-10);
    g.lineTo(8,0);
    g.lineTo(0,10);
    g.lineTo(-8,0);
    g.closePath();
    g.fill();

  } else if (k === 4) {
    g.fillRect(-8,-9,16,18);
    g.fillStyle='#7a5018';
    g.fillRect(-5,-5,10,2);
    g.fillRect(-5,-1,7,2);
    g.fillRect(-5,3,10,2);

  } else if (k === 5) {
    g.fillRect(-9,3,18,5);
    g.beginPath();
    g.moveTo(-7,3);
    g.lineTo(-5,-7);
    g.lineTo(-2,3);
    g.lineTo(0,-9);
    g.lineTo(3,3);
    g.lineTo(6,-7);
    g.lineTo(8,3);
    g.closePath();
    g.fill();

  } else if (k === 6) {
    g.beginPath();
    g.arc(0,-6,4,0,Math.PI*2);
    g.fill();
    g.fillRect(-4,-2,8,11);
    g.fillRect(-8,0,16,3);

  } else if (k === 7) {
    g.beginPath();
    g.moveTo(0,-10);
    g.lineTo(8,-3);
    g.lineTo(5,8);
    g.lineTo(-5,8);
    g.lineTo(-8,-3);
    g.closePath();
    g.fill();

  } else if (k === 8) {
    g.beginPath();
    g.ellipse(0,3,6,7,0,0,Math.PI*2);
    g.fill();
    g.beginPath();
    g.arc(3,-6,3,0,Math.PI*2);
    g.fill();

  } else if (k === 9) {
    g.strokeStyle='#d8a848';
    g.lineWidth=3;
    g.beginPath();
    g.arc(0,3,6,0,Math.PI*2);
    g.stroke();
    g.fillRect(-2,-9,4,4);

  } else if (k === 10) {
    g.beginPath();
    g.arc(0,-1,9,0,Math.PI);
    g.fill();
    g.fillRect(-10,-3,20,2);

  } else {
    g.beginPath();
    g.moveTo(0,-11);
    g.lineTo(6,2);
    g.lineTo(0,0);
    g.lineTo(-6,2);
    g.closePath();
    g.fill();
    g.fillRect(-1,0,2,10);
  }

  g.fillStyle='rgba(255,240,200,0.85)';
  g.fillRect(-2,-7,2,6);

  g.restore();
}
