const origAdd = CanvasGradient.prototype.addColorStop;
CanvasGradient.prototype.addColorStop = function (o, c) {
  try { origAdd.call(this, o, c); }
  catch (e) { try { origAdd.call(this, o, '#808080'); } catch (e2) {} }
};
