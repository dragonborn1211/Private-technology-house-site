// Панель «Частые вопросы» (services.html и automations.html, TASK-faq-panel.md). На странице вместо блока вопросов — плашка
// .faq-link[data-faq-open] в секции faq; клик открывает панель справа (на телефоне — шторку снизу). Панель — та же, что у
// кейсов (стили .cp-*), разметка [data-faq] стоит сразу после секции faq, вне секций: частицы её не собирают, без JS она
// идёт на месте плашки обычным блоком (<noscript> в <head>). Поведение — как у панели кейсов (assets/cases.js), но статья одна:
// ни листания, ни счётчика.
//
// - открывают: плашка (data-faq-open="faq-sub" — сразу на группе «Подписка»), ссылка «Вопросы» в подвале (services#faq — на этих
//   двух страницах панель открывается на месте, с остальных ведёт сюда), переход по #faq (после сборки секции, pt:secdone);
// - адрес — pushState #faq; закрыли — назад по истории (открывали кликом) или адрес без #faq; фокус — на то, что открыло;
// - html.cp-lock — страница стоит, колесо крутит тело панели (scroll.js, [data-cp-body]); остальная страница inert;
// - клик перехватываем раньше scroll.js (window, фаза захвата); filter.js #faq не трогает;
// - consent.js: pt:faq → цель Метрики faq_open { page } (только после «Принять»).
(function () {
  var fp = document.querySelector('[data-faq]');
  if (!fp) return;
  var de = document.documentElement;
  var sheet = fp.querySelector('.cp-sheet'), body = fp.querySelector('[data-cp-body]'), bar = fp.querySelector('.cp-bar');
  var art = fp.querySelector('.cp-art'), sec = document.querySelector('[data-sec="faq"]');
  var plate = document.querySelector('[data-faq-open]');
  var rm = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var on = false, opener = null, pushed = false, prevHash = '', hideT = 0, inert = [];
  fp.classList.add('js');
  function ev(name, detail) { try { window.dispatchEvent(new CustomEvent(name, { detail: detail })); } catch (e) { /* старый браузер */ } }
  function page(p) { var n = (p || '').replace(/\/+$/, '').split('/').pop().replace(/\.html$/, ''); return n || 'index'; }
  // остальная страница — inert (как у кейсов): соседи панели на всём пути вверх до <body>; плашку cookie не трогаем
  function setInert(v) {
    if (!v) { inert.forEach(function (x) { x.removeAttribute('inert'); }); inert = []; return; }
    for (var n = fp; n && n.parentElement && n !== document.body; n = n.parentElement) {
      Array.prototype.forEach.call(n.parentElement.children, function (x) {
        if (x === n || x.hasAttribute('inert') || /^(SCRIPT|STYLE|TEMPLATE|NOSCRIPT)$/.test(x.tagName) || x.classList.contains('ck')) return;
        x.setAttribute('inert', ''); inert.push(x);
      });
    }
  }
  // group — id группы, к которой прокрутить тело (faq-sub); from — элемент, на который вернуть фокус; src — страница для Метрики
  function open(group, push, from, src) {
    if (on) { if (group) toGroup(group); return; }
    clearTimeout(hideT); on = true;
    opener = from || plate;
    prevHash = location.hash === '#faq' ? '' : location.hash;
    fp.hidden = false; de.classList.add('cp-lock'); setInert(true);
    art.classList.remove('is-in');
    if (!rm) { void art.offsetWidth; art.classList.add('is-in'); }
    body.scrollTop = 0;
    if (group) toGroup(group);
    void fp.offsetWidth;
    requestAnimationFrame(function () { fp.classList.add('is-open'); sheet.focus({ preventScroll: true }); });
    if (push && history.pushState) { try { history.pushState({ faq: 1 }, '', '#faq'); pushed = true; } catch (e) { /* file:// */ } }
    ev('pt:faq', src || page(location.pathname));
  }
  function toGroup(id) {
    var g = id && fp.querySelector('#' + id);
    if (g) body.scrollTop = g.getBoundingClientRect().top - body.getBoundingClientRect().top + body.scrollTop - 8;
  }
  function close(fromPop) {
    if (!on) return;
    on = false; fp.classList.remove('is-open');
    de.classList.remove('cp-lock'); setInert(false);
    hideT = setTimeout(function () { fp.hidden = true; }, rm ? 0 : 460);
    if (!fromPop) {
      if (pushed) history.back();
      else try { history.replaceState(history.state, '', location.pathname + location.search + prevHash); } catch (e) { /* file:// */ }
    }
    pushed = false;
    if (opener && opener.focus) opener.focus({ preventScroll: true });
  }
  // плашка и ссылки на #faq этой страницы или на services#faq (подвал) — раньше scroll.js; Ctrl / ⌘ / Shift — как у ссылки
  function isFaq(a) {
    if (a.hasAttribute('data-faq-open')) return true;
    var h = a.getAttribute('href') || '';
    return /(^|\/|services(\.html)?)#faq$/.test(h);
  }
  window.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a || !isFaq(a) || fp.contains(a)) return;
    e.preventDefault();
    open(a.getAttribute('data-faq-open') || '', true, a);
  }, true);
  fp.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('[data-faq-close]')) close(); });
  // клавиатура: Esc закрывает, Tab по кругу внутри панели; фокус на самой панели — стрелки, PageUp / PageDown, пробел, Home / End
  // крутят её тело
  var KEYS = { ArrowDown: 56, ArrowUp: -56, PageDown: 0.9, PageUp: -0.9, ' ': 0.9 };
  document.addEventListener('keydown', function (e) {
    if (!on) return;
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (e.key === 'Tab') {
      var f = Array.prototype.filter.call(sheet.querySelectorAll('a[href], button:not([disabled]), summary, [tabindex="0"]'), function (x) { return x.getClientRects().length > 0; });
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1], act = document.activeElement;
      if (!sheet.contains(act) || (e.shiftKey && (act === first || act === sheet))) { e.preventDefault(); (e.shiftKey ? last : first).focus(); }
      else if (!e.shiftKey && act === last) { e.preventDefault(); first.focus(); }
      return;
    }
    if (e.target !== sheet) return;
    if (e.key === 'Home' || e.key === 'End') { e.preventDefault(); body.scrollTo({ top: e.key === 'Home' ? 0 : body.scrollHeight, behavior: rm ? 'auto' : 'smooth' }); return; }
    var d = KEYS[e.key];
    if (d === undefined) return;
    e.preventDefault();
    if (e.key === ' ' && e.shiftKey) d = -d;
    if (Math.abs(d) < 1) d = d * body.clientHeight;
    body.scrollBy({ top: d, behavior: rm ? 'auto' : 'smooth' });
  });
  // «назад» / «вперёд»: ушли с #faq — закрыть, пришли на него — открыть
  window.addEventListener('popstate', function () {
    if (location.hash === '#faq') { if (!on) open('', false); }
    else if (on) close(true);
  });
  // телефон: шторку тянут вниз за верхнюю полосу — больше 110 px или быстрый рывок закрывают, иначе пружинит обратно
  var y0 = 0, dy = 0, t0 = 0, drag = false;
  bar.addEventListener('pointerdown', function (e) {
    if (!on || e.pointerType === 'mouse' || (e.target.closest && e.target.closest('button'))) return;
    drag = true; y0 = e.clientY; dy = 0; t0 = Date.now(); sheet.style.transition = 'none';
    try { bar.setPointerCapture(e.pointerId); } catch (er) { /* без захвата */ }
  });
  bar.addEventListener('pointermove', function (e) { if (!drag) return; dy = Math.max(0, e.clientY - y0); sheet.style.transform = 'translateY(' + dy + 'px)'; });
  function end() {
    if (!drag) return;
    drag = false; sheet.style.transition = ''; sheet.style.transform = '';
    if (dy > 110 || dy / Math.max(1, Date.now() - t0) > 0.6) close();
  }
  bar.addEventListener('pointerup', end); bar.addEventListener('pointercancel', end);
  // заход по ссылке …#faq (подвал другой страницы): страница собирается как обычно, панель — когда секция faq собрана; на
  // «Готовых решениях» — сразу на группе «Подписка», как у плашки. Метрике — страница, откуда пришли
  if (location.hash === '#faq') {
    var src = '';
    try { var r = document.referrer && new URL(document.referrer); if (r && r.origin === location.origin) src = page(r.pathname); } catch (e) { /* без адреса */ }
    var done = false, go0 = function () { if (done) return; done = true; if (location.hash === '#faq') open(plate ? plate.getAttribute('data-faq-open') || '' : '', false, null, src || page(location.pathname)); };
    if (!sec || sec.classList.contains('s-done')) setTimeout(go0, rm ? 0 : 250);
    else {
      window.addEventListener('pt:secdone', function (e) { if (e.detail === sec) setTimeout(go0, rm ? 0 : 250); });
      setTimeout(go0, 6000); // запасной путь: движок не пришёл или секция так и не собралась
    }
  }
  window.PTFaq = { open: function (group) { open(group || '', true); }, close: function () { close(); } };
})();
