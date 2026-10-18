// Рисунки направлений — чертежи линиями (ТЗ TASK-glyphs-transitions.md, вариант A — выбор владельца). Вместо иконок
// в квадратах у каждого направления маленький чертёж в цвете --c: когда секция собрана, линии прорисовываются по
// очереди, потом живут петлёй (см. «рисунки направлений» в site.css). Всё рисует CSS и SVG — ни холстов, ни своего
// requestAnimationFrame. Модуль только:
// - нумерует линии (--i: очередь прорисовки) и столбики статуса (--k);
// - ставит .is-on, когда секция [data-sec] получила s-done, и снимает, когда сборку сняли («Пересобрать блок», смена
//   языка) — чертёж гаснет и прорисовывается заново вместе с секцией; если секция собрана к старту модуля (режим
//   «сразу», reduced motion) — ещё и .is-now: всё сразу на месте;
// - ставит паузу вне экрана: .is-vis (CSS-петли) и pauseAnimations() у SVG (импульсы SMIL), в облегчённом режиме и
//   при reduced motion импульсы стоят всегда.
// Разметка: <span class="glyph" data-glyph="apps" aria-hidden="true"><svg viewBox="0 0 240 150">…</svg></span>,
// мини-вариант (подписи модулей на странице услуг) — .glyph-mini. Подключается после engine.js.
(function () {
  var root = document.getElementById('pt-site');
  if (!root) return;
  var rm = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches), items = [], watched = [];

  // импульсы SMIL идут, только если чертёж собран, виден и движение не выключено
  function smil(it) {
    if (!it.svg.pauseAnimations) return;
    if (it.on && it.vis && !rm && !root.classList.contains('pt-lite')) it.svg.unpauseAnimations(); else it.svg.pauseAnimations();
  }
  // Секция собралась — чертежи включаются по одному за кадр (onQ): старт прорисовки — новые анимации у сотен линий, и
  // шесть чертежей разом совпадали в одном кадре с проявлением текста секции (на слабом устройстве — рывок до 50 мс).
  // Соседний чертёж начинает на кадр позже — на глаз не видно. Сразу (без очереди) — при старте модуля и reduced motion
  var onQ = [], onRaf = 0;
  function turnOn(it) { it.on = true; it.el.classList.add('is-on'); smil(it); }
  function pump() { onRaf = 0; var it = onQ.shift(); if (it) turnOn(it); if (onQ.length) onRaf = requestAnimationFrame(pump); }
  function sync(it, first) {
    var done = !it.sec || !root.classList.contains('pt-on') || it.sec.classList.contains('s-done'), q = onQ.indexOf(it);
    if (done && !it.on) {
      if (first || rm) { if (q >= 0) onQ.splice(q, 1); it.on = true; it.el.classList.add('is-now'); it.el.classList.add('is-on'); }
      else if (q < 0) { if (onQ.length || onRaf) onQ.push(it); else { turnOn(it); onRaf = requestAnimationFrame(pump); } }
    }
    else if (!done) { if (q >= 0) onQ.splice(q, 1); if (it.on) { it.on = false; it.el.classList.remove('is-on', 'is-now'); } }
    smil(it);
  }
  function vis(it, v) { it.vis = v; it.el.classList.toggle('is-vis', v); smil(it); }

  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.target.__glyph) vis(e.target.__glyph, e.isIntersecting); });
  }, { rootMargin: '80px 0px' }) : null;

  Array.prototype.forEach.call(root.querySelectorAll('.glyph'), function (el) {
    var svg = el.querySelector('svg'); if (!svg) return;
    Array.prototype.forEach.call(svg.querySelectorAll('.d'), function (d, i) { d.style.setProperty('--i', i); });
    Array.prototype.forEach.call(svg.querySelectorAll('.bars .d'), function (d, k) { d.style.setProperty('--k', k); });
    var it = { el: el, svg: svg, sec: el.closest('[data-sec]'), on: false, vis: !io };
    el.__glyph = it; items.push(it);
    if (io) io.observe(el); else el.classList.add('is-vis');
    if (it.sec && watched.indexOf(it.sec) < 0) {
      watched.push(it.sec);
      new MutationObserver(function () { items.forEach(function (x) { if (x.sec === it.sec) sync(x, false); }); }).observe(it.sec, { attributes: true, attributeFilter: ['class'] });
    }
    sync(it, true);
  });
  // облегчённый режим движок включает на ходу (класс .pt-lite у корня) — импульсы останавливаем вслед
  new MutationObserver(function () { items.forEach(smil); }).observe(root, { attributes: true, attributeFilter: ['class'] });
  window.PTGlyphs = { refresh: function () { items.forEach(function (it) { sync(it, false); }); } };
})();
