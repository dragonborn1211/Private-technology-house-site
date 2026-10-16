// Фильтр карточек: кейсы (cases.html) и готовые автоматизации (automations.html). Группа кнопок [data-filters] —
// в атрибуте префикс хеша ('' у кейсов: #sites; 'f-' в каталоге: #f-ai, чтобы не спорить с id шаблонов); кнопки
// [data-filter] (у «Все» — пусто), карточки [data-cat] — категории через пробел. Карточка без data-cat видна всегда.
// Подключается до engine.js: фильтр из адреса применяется до первого замера, и страница сразу собирается отфильтрованной.
// Без JS группа скрыта (hidden) и видны все карточки.
(function () {
  var box = document.querySelector('[data-filters]');
  if (!box) return;
  var pre = box.getAttribute('data-filters') || '';
  var btns = Array.prototype.slice.call(box.querySelectorAll('[data-filter]'));
  var cards = Array.prototype.slice.call(document.querySelectorAll('[data-cat]'));
  function cats(el) { return (el.getAttribute('data-cat') || '').split(/\s+/); }
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
  var cur = null;
  function set(f, write) {
    if (f === cur) return;
    var first = cur === null;
    cur = f;
    btns.forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-filter') === f ? 'true' : 'false'); });
    cards.forEach(function (c) { c.hidden = !!f && cats(c).indexOf(f) < 0; });
    // адрес — без новой записи в истории; «Все» — без хеша. Язык (?lang=en) остаётся
    if (write && history.replaceState) {
      try { history.replaceState(history.state, '', location.pathname + location.search + (f ? '#' + pre + f : '')); } catch (e) { /* file:// и т. п. */ }
    }
    // показанная схема до этого была нулевого размера: пересчёт сцен, превью и замеров движка — как при смене размера окна
    if (!first) window.dispatchEvent(new Event('resize'));
  }
  btns.forEach(function (b) { b.addEventListener('click', function () { set(b.getAttribute('data-filter'), true); }); });
  // хеш поменяли вручную или ссылкой на этой же странице. Хеш-якорь на карточку (#site-leads) — показать все
  window.addEventListener('hashchange', function () { set(fromHash(), false); });
  box.hidden = false;
  set(fromHash(), false);
})();
