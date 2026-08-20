import { LEVELS as LEVELS88 } from '../levels/Layouts88.js?v=202608202149';
export const LEVEL_NAMES = LEVELS88.map(l => l.name.trim());

export function initProgression(game) {
  try { game.progress = JSON.parse(localStorage.getItem('agur_progress') || '{"max":1,"best":0}'); } catch (e) { game.progress = { max: 1, best: 0 }; }

  const lname = game.loadLevel ? 'loadLevel' : game.startLevel ? 'startLevel' : game.setLevel ? 'setLevel' : null;
  if (lname) {
    const orig = game[lname].bind(game);
    game[lname] = (n, ...rest) => {
      const r = orig(n, ...rest);
      scaleLevel(game, n);
      const name = LEVEL_NAMES[(n - 1) % LEVEL_NAMES.length] + (n > LEVEL_NAMES.length ? ' (круг ' + Math.ceil(n / LEVEL_NAMES.length) + ')' : '');
      if (game.showBanner) game.showBanner('🏛 Уровень ' + n + ': ' + name);
      return r;
    };
  }

  const nname = game.nextLevel ? 'nextLevel' : game.advanceLevel ? 'advanceLevel' : null;
  if (nname) {
    const orig = game[nname].bind(game);
    game[nname] = (...a) => {
      const r = orig(...a);
      const nl = game.level || 1;
      if (nl > game.progress.max) { game.progress.max = nl; save(game); }
      return r;
    };
  }

  const oname = game.gameOver ? 'gameOver' : game.endGame ? 'endGame' : null;
  if (oname) {
    const orig = game[oname].bind(game);
    game[oname] = (...a) => {
      if (game.score > game.progress.best) { game.progress.best = game.score; save(game); }
      return orig(...a);
    };
  }


}

function save(game) { try { localStorage.setItem('agur_progress', JSON.stringify(game.progress)); } catch (e) {} }

function scaleLevel(game, n) {
  const f = 1 + Math.min(Math.max(n - 1, 0), 12) * 0.02;
  if (game.balls) game.balls.forEach(b => { b.dx *= f; b.dy *= f; });
  if (n >= 5 && game.bricks) {
    game.bricks.forEach((b, i) => {
      if (typeof b.hp === 'number' && !b.isSteel && i % 7 === 0 && b.hp < 3) b.hp += 1;
    });
  }
}




