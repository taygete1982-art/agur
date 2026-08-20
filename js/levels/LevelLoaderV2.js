export const V2 = { levels: {}, ready: false };
export function initV2Loader() {
  [1,2,3].forEach(n => {
    fetch('levels_v2/level' + n + '.json')
      .then(r => r.ok ? r.json() : null)
      .then(j => { if (j) { V2.levels[n] = j; V2.ready = true; } })
      .catch(() => {});
  });
}
