// Панель разбора работы (cases.html, TASK-cases-panel.md). Карточка «Работ» — заголовок-ссылка #case-<slug> с data-cp-open,
// растянутая на всю карточку, — открывает панель: справа на компьютере, шторкой снизу на телефоне. В панели статья кейса
// (.cp-art[data-case]): что было, что сделали, схема, что изменилось; у сайтов — кадры, три фишки и «Открыть сайт».
// Разметка панели — в HTML, прямой потомок секции cases: схемы создаёт движок вместе с секцией, тексты индексируются;
// data-pt-skip — частицы её не собирают. Без JS статьи идут под сеткой обычным блоком (<noscript> в <head>).
//
// Связь с сайтом:
// - движок (engine.js): pt:sleep / pt:wake (detail — элемент) усыпляют и будят сцены внутри, pt:shown — схема заново с первого
//   узла. Пока панель открыта, сетка под подложкой спит (и живые превью гаснут); закрыли — сетка идёт дальше с того же места,
//   панель засыпает. Схемы панели секция не будит — только панель, когда показывает статью;
// - scroll.js: клик по карточке перехватываем раньше него (window, фаза захвата) — он повёл бы #якорь плавной прокруткой;
//   html.cp-lock — страница стоит, колесо крутит тело панели (pt-lock меню не подходит: он прячет страницу под стеклом);
// - filter.js: #case-* фильтр не трогает; листаем только видимые при фильтре карточки; после закрытия хеш фильтра на месте;
// - consent.js: pt:case → цель Метрики case_open (только после «Принять»), призыв в панели — обычная цель tg;
// - i18n.js: что пишет модуль («Следующая работа», заголовок вкладки) — через PTI18N.t; статьи переводит словарь.
// Подключается после engine.js: заход по ссылке cases#case-… открывает панель, когда секция cases собрана (pt:secdone).
(function () {
  var cp = document.querySelector('[data-cp]');
  if (!cp) return;
  var de = document.documentElement;
  var sheet = cp.querySelector('.cp-sheet'), body = cp.querySelector('[data-cp-body]'), foot = cp.querySelector('[data-cp-foot]'), bar = cp.querySelector('.cp-bar');
  var nEl = cp.querySelector('[data-cp-n]'), tEl = cp.querySelector('[data-cp-total]');
  var prevB = cp.querySelector('[data-cp-prev]'), nextB = cp.querySelector('[data-cp-next]');
  var grid = document.querySelector('.obj-grid-2'), sec = cp.closest('[data-sec]');
  var arts = Array.prototype.slice.call(body.querySelectorAll('.cp-art'));
  var rm = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var cur = '', opener = null, pushed = false, prevHash = '', title0 = '', hideT = 0, wakeT = 0, inert = [];
  cp.classList.add('js');
  function t(s) { return window.PTI18N ? window.PTI18N.t(s) : s; }
  function ev(name, detail) { try { window.dispatchEvent(new CustomEvent(name, { detail: detail })); } catch (e) { /* старый браузер */ } }
  function art(id) { return body.querySelector('.cp-art[data-case="' + id + '"]'); }
  // порядок — как карточки в сетке, только видимые при текущем фильтре (кейс по прямой ссылке скрыт фильтром — все)
  function order(id) {
    var all = Array.prototype.filter.call(document.querySelectorAll('.obj-grid-2 > .obj[id^="case-"]'), function (c) { return !!art(c.id); });
    var vis = all.filter(function (c) { return !c.hidden; }).map(function (c) { return c.id; });
    return vis.indexOf(id) >= 0 ? vis : all.map(function (c) { return c.id; });
  }
  function title(id) { var h = art(id).querySelector('.cp-h'); return h ? h.textContent.replace(/\s+/g, ' ').trim() : ''; }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  // остальная страница, пока панель открыта, — inert (как меню): соседи панели на всём пути вверх до <body>. Плашка cookie —
  // своё окно, её не трогаем; то, что уже было inert (скрытая липкая шапка, закрытое меню), оставляем как есть
  function setInert(on) {
    if (!on) { inert.forEach(function (x) { x.removeAttribute('inert'); }); inert = []; return; }
    for (var n = cp; n && n.parentElement && n !== document.body; n = n.parentElement) {
      Array.prototype.forEach.call(n.parentElement.children, function (x) {
        if (x === n || x.hasAttribute('inert') || /^(SCRIPT|STYLE|TEMPLATE|NOSCRIPT)$/.test(x.tagName) || x.classList.contains('ck')) return;
        x.setAttribute('inert', ''); inert.push(x);
      });
    }
  }
  function fill(id, first) {
    var list = order(id), i = list.indexOf(id), a = art(id), old = cur && cur !== id ? art(cur) : null;
    if (old) ev('pt:sleep', old);
    arts.forEach(function (x) { x.hidden = x !== a; x.classList.remove('is-in'); });
    // картинки открытого кейса — сразу, не дожидаясь ленивой загрузки (иначе мигают при выезде)
    Array.prototype.forEach.call(a.querySelectorAll('img[loading="lazy"]'), function (im) { im.loading = 'eager'; });
    if (!rm) { void a.offsetWidth; a.classList.add('is-in'); }
    nEl.textContent = pad(i + 1); tEl.textContent = pad(list.length);
    prevB.disabled = i <= 0; nextB.disabled = i >= list.length - 1;
    // фокус стоял на стрелке, которая стала неактивной (дошли до края) — на панель, а не в никуда (<body>)
    if (document.activeElement && document.activeElement.disabled && cp.contains(document.activeElement)) sheet.focus({ preventScroll: true });
    sheet.style.setProperty('--cp-tc', a.style.getPropertyValue('--tc'));
    sheet.setAttribute('aria-labelledby', a.querySelector('.cp-h').id);
    // липкий подвал: «Следующая работа» и копия призыва кейса (сама .cp-cta в статье при JS скрыта)
    foot.innerHTML = '';
    var nx = list[i + 1];
    if (nx) {
      var b = document.createElement('button'), sm = document.createElement('small'), sp = document.createElement('span');
      b.type = 'button'; b.className = 'cp-nx'; sm.textContent = t('Следующая работа'); sp.textContent = title(nx) + ' →';
      b.appendChild(sm); b.appendChild(sp); b.addEventListener('click', function () { go(nx); });
      foot.appendChild(b);
    }
    var cta = a.querySelector('.cp-cta');
    if (cta) foot.appendChild(cta.cloneNode(true));
    if (foot.childNodes.length) foot.removeAttribute('aria-hidden'); else foot.setAttribute('aria-hidden', 'true');
    body.scrollTop = 0; cur = id;
    document.title = title(id) + ' — ' + t('Работы') + ' | Private Technology House';
    // схема статьи — проснуться (в панели она сразу целая, scenes.js), на открытии — чуть погодя, при листании — сразу
    clearTimeout(wakeT);
    wakeT = setTimeout(function () { if (cur !== id) return; ev('pt:wake', a); ev('pt:shown', [a]); }, rm ? 0 : first ? 80 : 30);
    ev('pt:case', id.replace(/^case-/, ''));
  }
  function open(id, push, from) {
    if (!art(id)) return;
    clearTimeout(hideT);
    if (cur) { fill(id, false); return; }
    var c = document.getElementById(id);
    opener = from || (c && c.querySelector('[data-cp-open]'));
    prevHash = /^#case-/.test(location.hash) ? '' : location.hash; title0 = document.title;
    cp.hidden = false; de.classList.add('cp-lock'); setInert(true);
    ev('pt:sleep', grid);
    fill(id, true);
    void cp.offsetWidth;
    requestAnimationFrame(function () { cp.classList.add('is-open'); sheet.focus({ preventScroll: true }); });
    if (push && history.pushState) { try { history.pushState({ cp: id }, '', '#' + id); pushed = true; } catch (e) { /* file:// */ } }
  }
  function go(id) {
    if (!id || !cur) return;
    fill(id, false);
    try { history.replaceState(history.state, '', '#' + id); } catch (e) { /* file:// */ }
  }
  function step(k) { var l = order(cur), i = l.indexOf(cur); go(l[i + k]); }
  function close(fromPop) {
    if (!cur) return;
    cp.classList.remove('is-open'); cur = ''; clearTimeout(wakeT);
    de.classList.remove('cp-lock'); setInert(false);
    ev('pt:sleep', cp); ev('pt:wake', grid);
    document.title = title0;
    hideT = setTimeout(function () { cp.hidden = true; foot.innerHTML = ''; foot.setAttribute('aria-hidden', 'true'); }, rm ? 0 : 460);
    // адрес: открывали кликом — назад по истории; зашли по ссылке или «вперёд» — адрес без кейса (с хешем фильтра, если был)
    if (!fromPop) {
      if (pushed) history.back();
      else try { history.replaceState(history.state, '', location.pathname + location.search + prevHash); } catch (e) { /* file:// */ }
    }
    pushed = false;
    if (opener && opener.focus) opener.focus({ preventScroll: true });
  }
  // клик или Enter по карточке — раньше scroll.js (window, фаза захвата); Ctrl / ⌘ / Shift + клик — как у обычной ссылки
  window.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest && e.target.closest('[data-cp-open]');
    if (!a) return;
    var id = (a.getAttribute('href') || '').replace(/^[^#]*#/, '');
    if (!art(id)) return;
    e.preventDefault();
    open(id, true, a);
  }, true);
  cp.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('[data-cp-close]')) close(); });
  prevB.addEventListener('click', function () { step(-1); });
  nextB.addEventListener('click', function () { step(1); });
  // клавиатура: Esc закрывает, ←/→ листают (не в поле ввода), Tab по кругу внутри панели; фокус на самой панели — стрелки
  // вверх/вниз, PageUp/PageDown, пробел, Home/End крутят её тело (сама панель не прокручивается, страница стоит)
  var KEYS = { ArrowDown: 56, ArrowUp: -56, PageDown: 0.9, PageUp: -0.9, ' ': 0.9 };
  document.addEventListener('keydown', function (e) {
    if (!cur) return;
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    var field = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName);
    if ((e.key === 'ArrowRight' || e.key === 'ArrowLeft') && !field) { e.preventDefault(); step(e.key === 'ArrowRight' ? 1 : -1); return; }
    if (e.key === 'Tab') {
      var f = Array.prototype.filter.call(sheet.querySelectorAll('a[href], button:not([disabled]), [tabindex="0"]'), function (x) { return x.getClientRects().length > 0; });
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
  // «назад» / «вперёд» браузера: ушли с #case-… — закрыть; пришли на него — показать этот кейс
  window.addEventListener('popstate', function () {
    var h = location.hash.slice(1);
    if (/^case-/.test(h) && art(h)) { if (cur) fill(h, false); else open(h, false); }
    else if (cur) close(true);
  });
  // телефон: шторку тянут вниз за верхнюю полосу — больше 110 px или быстрый рывок закрывают, иначе пружинит обратно
  var y0 = 0, dy = 0, t0 = 0, drag = false;
  bar.addEventListener('pointerdown', function (e) {
    if (!cur || e.pointerType === 'mouse' || (e.target.closest && e.target.closest('button'))) return;
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
  // заход по ссылке cases#case-…: страница собирается как обычно (движок сам ставит карточку в вид — переход по якорю),
  // панель — когда секция cases собрана; «сразу» и reduced motion собирают её до этого модуля — тогда сразу
  var h0 = location.hash.slice(1);
  if (/^case-/.test(h0) && art(h0)) {
    var done = false, go0 = function () { if (done) return; done = true; if (location.hash.slice(1) === h0) open(h0, false); };
    if (sec && sec.classList.contains('s-done')) setTimeout(go0, rm ? 0 : 250);
    else {
      window.addEventListener('pt:secdone', function (e) { if (e.detail === sec) setTimeout(go0, rm ? 0 : 250); });
      setTimeout(go0, 6000); // запасной путь: движок не пришёл или секция так и не собралась
    }
  }
  window.PTCases = { open: function (id) { open(id, true); }, close: function () { close(); } };
})();
