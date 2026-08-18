let ctx = null, gain = null;

export function initMusic(game) {
  const start = () => {
    if (ctx) return;
    try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
    gain = ctx.createGain();
    gain.gain.value = 0;
    gain.connect(ctx.destination);
    const mk = (f, t) => { const o = ctx.createOscillator(); o.type = t; o.frequency.value = f; o.connect(gain); o.start(); };
    mk(68, 'sine');
    mk(102, 'sine');
    mk(136, 'triangle');
    const lfo = ctx.createOscillator();
    const lg = ctx.createGain();
    lfo.frequency.value = 0.07;
    lg.gain.value = 0.015;
    lfo.connect(lg);
    lg.connect(gain.gain);
    lfo.start();
  };
  window.addEventListener('pointerdown', start, { once: true });
  window.addEventListener('keydown', start, { once: true });
  setInterval(() => {
    if (!gain) return;
    const on = game.audio && game.audio.enabled !== false && !document.hidden && game.state !== 'menu';
    const target = on ? 0.035 : 0;
    gain.gain.value += (target - gain.gain.value) * 0.1;
  }, 400);
}
