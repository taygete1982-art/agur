let ctx = null, gain = null, voices = false;

export function initMusic(game) {
  function startVoices() {
    if (voices || !ctx || ctx.state !== 'running') return;
    voices = true;
    try {
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
    } catch (e) {}
  }
  const unlock = () => {
    const act = navigator.userActivation;
    if (act && !act.hasBeenActive) return; // жеста ещё не было - ничего не создаём
    if (!ctx) {
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        ctx = new AC();
        gain = ctx.createGain();
        gain.gain.value = 0;
        gain.connect(ctx.destination);
      } catch (e) { ctx = null; gain = null; return; }
    }
    if (ctx.state !== 'running') {
      ctx.resume().then(startVoices).catch(() => {});
    } else {
      startVoices();
    }
  };
  window.addEventListener('pointerdown', unlock);
  window.addEventListener('keydown', unlock);
  window.addEventListener('touchend', unlock);
  setInterval(() => {
    if (!gain || !ctx) return;
    const on = ctx.state === 'running' &&
               game.audio && game.audio.enabled !== false &&
               !document.hidden && game.state !== 'menu';
    const target = on ? 0.035 : 0;
    gain.gain.value += (target - gain.gain.value) * 0.1;
  }, 400);
}
