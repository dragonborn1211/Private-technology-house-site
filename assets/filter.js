// Фильтр карточек: кейсы (cases.html) и готовые автоматизации (automations.html). Группа кнопок [data-filters] —
// в атрибуте префикс хеша ('' у кейсов: #sites; 'f-' в каталоге: #f-ai, чтобы не спорить с id шаблонов); кнопки
// [data-filter] (у «Все» — пусто), карточки [data-cat] — категории через пробел. Карточка без data-cat видна всегда.
// Подключается до engine.js: фильтр из адреса применяется до первого замера, и страница сразу собирается отфильтрованной.
// Без JS группа скрыта (hidden) и видны все карточки.
//
// Смена фильтра — с анимацией (FLIP, TASK-clarity.md, B1.1): уходящие карточки гаснут (160 мс), остающиеся едут со
// старого места на новое (320 мс), появляющиеся проявляются снизу по очереди (360 мс, +45 мс на каждую), высота сетки
// меняется плавно (300 мс) — подвал не прыгает. resize для движка и сцен — один раз, когда всё доехало: иначе они замерили
// бы карточки посреди трансформации. Схемы в появившихся карточках собираются заново (pt:shown → движок → restart()).
// Быстрые клики подряд: прошлая анимация доводится сразу, новая начинается с текущего состояния.
// Широкая карточка (B3): если видимых карточек нечётное число, последняя [data-fill] занимает всю ширину (.is-wide;
// CSS — от 901 px, уже сетка в одну колонку).
(function () {
  var box = document.querySelector('[data-filters]');
  if (!box) return;
  var rm = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var pre = box.getAttribute('data-filters') || '';
  var btns = Array.prototype.slice.call(box.querySelectorAll('[data-filter]'));
  var cards = Array.prototype.slice.call(document.querySelectorAll('[data-cat]'));
  var grid = cards.length ? cards[0].parentNode : null;
  var items = grid ? Array.prototype.filter.call(grid.children, function (el) { return el.classList.contains('obj'); }) : [];
  function cats(el) { return (el.getAttribute('data-cat') || '').split(/\s+/); }
  function off(el, f) { return !!f && el.hasAttribute('data-cat') && cats(el).indexOf(f) < 0; }
  // кнопка категории без карточек не нужна (вернутся скрытые кейсы — появится «Интеграции»)
  btns.forEach(function (b) {
    var f = b.getAttribute('data-filter');
    if (f && !cards.some(function (c) { return cats(c).indexOf(f) >= 0; })) b.hidden = true;
  });
  var valid = btns.filter(function (b) { return !b.hidden; }).map(function (b) { return b.getAttribute('data-filter'); });
  function fromHash() {
    var h = '';
    try { h = decodeURIComponent(location.hash.slice(1)); } catch (e) { h = ''; }
    if (h.indexOf(pre) !== 0) return '';
    h = h.slice(pre.length);
    return h && valid.indexOf(h) >= 0 ? h : '';
  }
  function wide() {
    var vis = items.filter(function (c) { return !c.hidden; }), fill = null;
    vis.forEach(function (c) { if (c.hasAttribute('data-fill')) fill = c; });
    items.forEach(function (c) { c.classList.toggle('is-wide', c === fill && vis.length % 2 === 1); });
  }
  function apply(f) { items.forEach(function (c) { c.hidden = off(c, f); }); wide(); }
  // пересчёт для движка и сцен (показанная схема до этого была нулевого размера) и перезапуск схем в показанных карточках
  var shown = [];
  function settle() {
    window.dispatchEvent(new Event('resize'));
    var list = shown; shown = [];
    if (list.length) window.dispatchEvent(new CustomEvent('pt:shown', { detail: list }));
  }
  var run = null;
  // довести текущую анимацию: карточки сразу в итоговом раскладе (resize сделает следующая анимация, когда доедет)
  function stop() {
    if (!run) return;
    var r = run; run = null;
    clearTimeout(r.t);
    r.anims.forEach(function (a) { a.cancel(); });
    if (!r.applied) apply(r.f);
  }
  function flip(f) {
    stop();
    var r = run = { f: f, anims: [], applied: false, t: 0 };
    var vis = items.filter(function (c) { return !c.hidden; }), first = [];
    vis.forEach(function (c) { first.push([c, c.getBoundingClientRect()]); });
    var h0 = grid.getBoundingClientRect().height;
    var leave = vis.filter(function (c) { return off(c, f); });
    leave.forEach(function (c) {
      r.anims.push(c.animate([{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(.97)' }], { duration: 160, easing: 'ease-in', fill: 'forwards' }));
    });
    r.t = setTimeout(function () {
      if (run !== r) return;
      r.anims.forEach(function (a) { a.cancel(); }); r.anims = [];
      apply(f); r.applied = true;
      var h1 = grid.getBoundingClientRect().height, k = 0, long = 0;
      items.forEach(function (c) {
        if (c.hidden) return;
        var a = null, b = c.getBoundingClientRect();
        first.forEach(function (x) { if (x[0] === c) a = x[1]; });
        if (a && Math.abs(a.width - b.width) < 2 && Math.abs(a.height - b.height) < 2) {
          var dx = a.left - b.left, dy = a.top - b.top;
          if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
          r.anims.push(c.animate([{ transform: 'translate(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) + 'px)' }, { transform: 'none' }], { duration: 320, easing: 'cubic-bezier(.2,.7,.2,1)' }));
          long = Math.max(long, 320);
          return;
        }
        // новая карточка или поменявшая размер (широкая) — проявляется снизу
        var d = 45 * k++;
        r.anims.push(c.animate([{ opacity: 0, transform: 'translateY(16px) scale(.98)' }, { opacity: 1, transform: 'none' }], { duration: 360, delay: d, easing: 'cubic-bezier(.2,.7,.2,1)', fill: 'backwards' }));
        long = Math.max(long, 360 + d);
        if (!a) shown.push(c);
      });
      if (Math.abs(h1 - h0) > 1) {
        r.anims.push(grid.animate([{ height: h0 + 'px' }, { height: h1 + 'px' }], { duration: 300, easing: 'cubic-bezier(.2,.7,.2,1)' }));
        long = Math.max(long, 300);
      }
      r.t = setTimeout(function () { if (run !== r) return; run = null; settle(); }, long + 20);
    }, leave.length ? 160 : 0);
  }
  // телефон: ряд фильтров — одна строка с прокруткой вбок (site.css, TASK-polish-2.md, 5). Выбранная кнопка — в видимой части
  // ряда (прокручиваем сам ряд, а не страницу, как scrollIntoView), маска справа «есть ещё» — пока ряд не докручен до конца
  function edge() { box.classList.toggle('is-end', box.scrollLeft + box.clientWidth >= box.scrollWidth - 2); }
  function reveal(f, now) {
    if (box.scrollWidth <= box.clientWidth + 2) return;
    var b = Array.prototype.filter.call(btns, function (x) { return x.getAttribute('data-filter') === f; })[0]; if (!b) return;
    var r = box.getBoundingClientRect(), q = b.getBoundingClientRect(), fade = r.width * 0.12, d = 0;
    if (q.left < r.left) d = q.left - r.left - 8; else if (q.right > r.right - fade) d = q.right - (r.right - fade) + 8;
    if (d) box.scrollBy({ left: d, behavior: rm || now ? 'auto' : 'smooth' });
  }
  box.addEventListener('scroll', edge, { passive: true });
  window.addEventListener('resize', edge);
  var cur = null;
  function set(f, write) {
    if (f === cur) return;
    var first = cur === null;
    cur = f;
    btns.forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-filter') === f ? 'true' : 'false'); });
    if (!first) reveal(f);
    // адрес — без новой записи в истории; «Все» — без хеша. Язык (?lang=en) остаётся
    if (write && history.replaceState) {
      try { history.replaceState(history.state, '', location.pathname + location.search + (f ? '#' + pre + f : '')); } catch (e) { /* file:// и т. п. */ }
    }
    if (first) { apply(f); return; }
    if (rm || !grid || !grid.animate) {
      items.forEach(function (c) { if (c.hidden && !off(c, f)) shown.push(c); });
      apply(f); settle(); return;
    }
    flip(f);
  }
  btns.forEach(function (b) { b.addEventListener('click', function () { set(b.getAttribute('data-filter'), true); }); });
  // хеш поменяли вручную или ссылкой на этой же странице. Хеш-якорь на карточку (#site-leads) — показать все
  window.addEventListener('hashchange', function () { set(fromHash(), false); });
  box.hidden = false;
  set(fromHash(), false);
  // замер — после показа ряда (скрытый мерится нулём и «докручен до конца»), и ещё раз со своими шрифтами; выбранная по хешу
  // кнопка (#f-ai) — сразу в видимой части ряда
  reveal(cur, true); edge();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { reveal(cur, true); edge(); });
})();
