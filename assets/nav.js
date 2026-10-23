// Навигация: липкая шапка [data-topbar] и меню на телефоне [data-menu]. Обе живут в #pt-site вне секций — движок
// их не собирает из частиц. Здесь же следим, чтобы свёрнутая кнопка пульта не ложилась на первый экран.
(function () {
  var root = document.getElementById('pt-site');
  if (!root) return;
  var de = document.documentElement, bar = root.querySelector('[data-topbar]'), menu = root.querySelector('[data-menu]');
  // граница липкой шапки — первый экран; на странице без движка (privacy.html) — блок шапки [data-top]
  var hero = root.querySelector('[data-sec="hero"], [data-top]'), pult = root.querySelector('[data-pult]');

  // ---------- панель замеров ?hud (TASK-perf.md, 0.1) ----------
  // Только по ?hud (дальше держится до конца вкладки) — без флага файл не грузится вовсе; ?hud=0 и ?pt-reset — выключить.
  // Путь — от этого скрипта: на 404 страницы лежат по любому адресу
  try {
    var hq = location.search, hs = window.sessionStorage, me = document.currentScript;
    if (/[?&]pt-reset(?:[=&]|$)/.test(hq) || /[?&]hud=0(?:&|$)/.test(hq)) hs.removeItem('pt-hud');
    else if (/[?&]hud(?:[=&]|$)/.test(hq) || hs.getItem('pt-hud') === '1') {
      var hud = document.createElement('script');
      hud.src = me && me.src ? me.src.replace(/nav\.js(?:\?.*)?$/, 'perf-hud.js') : 'assets/perf-hud.js';
      document.head.appendChild(hud);
    }
  } catch (e) { /* хранилище запрещено — без панели */ }

  // ---------- липкая шапка ----------
  // Пока первый экран в кадре — скрыта. Ниже: прокрутка вверх показывает, вниз прячет. После перехода по якорю
  // (меню, кнопки) остаётся видимой, пока человек сам не начнёт прокручивать.
  // прошлая позиция — с первого обновления, а не при загрузке: чтение scrollY здесь раскладывало всю страницу посреди разбора
  // HTML, а сразу за этим движок снимает .pt-boot — и раскладка считалась заново (~75 мс при CPU ×4 на телефоне)
  var lastY = null, shown = false, pinned = false, raf = 0;
  // первый экран в кадре — по IntersectionObserver, а не getBoundingClientRect в каждом кадре прокрутки (TASK-perf.md, 3.3)
  var heroIn = true;
  if (hero && 'IntersectionObserver' in window) new IntersectionObserver(function (es) { heroIn = es[es.length - 1].isIntersecting; onScroll(); }, { threshold: 0 }).observe(hero);
  function show(v) {
    if (!bar || v === shown) return;
    shown = v; bar.classList.toggle('on', v);
    if (v) bar.removeAttribute('inert'); else bar.setAttribute('inert', '');
  }
  function update() {
    raf = 0;
    var y = window.scrollY, dy = lastY === null ? 0 : y - lastY; lastY = y;
    // закрепление после якоря снимает только сам человек (колесо, палец, клавиши): в начале поездки к секции первый
    // экран ещё в кадре, и сброс здесь гасил шапку
    if (hero && heroIn) show(false);
    else if (pinned || dy < -1) show(true);
    else if (dy > 1) show(false);
    guardPult();
  }
  function onScroll() { if (!raf) raf = requestAnimationFrame(update); }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', function () { gDoc = null; pBox = null; onScroll(); });
  root.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (a && a.getAttribute('href').length > 1) pinned = true;
  });
  function unpin() { pinned = false; }
  window.addEventListener('wheel', unpin, { passive: true });
  window.addEventListener('touchmove', unpin, { passive: true });
  // нажатие (в том числе на свой скроллбар) тоже снимает закрепление; клик по якорю после него закрепит снова
  window.addEventListener('pointerdown', unpin, { passive: true });
  window.addEventListener('keydown', function (e) { if (/^(Arrow(Up|Down)|Page(Up|Down)|Home|End| )$/.test(e.key)) unpin(); });

  // ---------- меню на телефоне, планшете и узком ноутбуке (до 1199 px) ----------
  // Открывается кнопкой [data-menu-open] (в шапке первого экрана и в липкой). Фокус уходит в меню и не выходит из него;
  // Esc, кнопка закрытия и клик по пункту закрывают, фокус возвращается на кнопку. Пока меню открыто, страница стоит.
  var openers = Array.prototype.slice.call(root.querySelectorAll('[data-menu-open]')), closer = menu && menu.querySelector('[data-menu-close]'), opener = null, isOpen = false;
  function focusables() { return Array.prototype.filter.call(menu.querySelectorAll('a[href], button:not([disabled])'), function (el) { return el.getClientRects().length > 0; }); }
  function open(btn) {
    if (!menu || isOpen) return;
    isOpen = true; opener = btn;
    menu.removeAttribute('inert'); menu.classList.add('on'); de.classList.add('pt-lock');
    openers.forEach(function (b) { b.setAttribute('aria-expanded', 'true'); });
    document.addEventListener('keydown', onKey, true);
    var f = closer || focusables()[0]; if (f) f.focus({ preventScroll: true });
  }
  function close(back) {
    if (!isOpen) return;
    isOpen = false;
    menu.classList.remove('on'); menu.setAttribute('inert', ''); de.classList.remove('pt-lock');
    openers.forEach(function (b) { b.setAttribute('aria-expanded', 'false'); });
    document.removeEventListener('keydown', onKey, true);
    if (back !== false && opener) opener.focus({ preventScroll: true });
  }
  function onKey(e) {
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (e.key !== 'Tab') return;
    var f = focusables(); if (!f.length) return;
    var first = f[0], last = f[f.length - 1], a = document.activeElement;
    if (!menu.contains(a)) { e.preventDefault(); first.focus(); }
    else if (e.shiftKey && a === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && a === last) { e.preventDefault(); first.focus(); }
  }
  openers.forEach(function (b) { b.addEventListener('click', function () { open(b); }); });
  if (closer) closer.addEventListener('click', function () { close(); });
  // пункт меню: закрыть до того, как scroll.js поведёт страницу к секции (его обработчик — на document, он позже)
  if (menu) Array.prototype.forEach.call(menu.querySelectorAll('[data-menu-link]'), function (a) { a.addEventListener('click', function () { pinned = true; close(); }); });
  if (window.matchMedia) {
    var wide = window.matchMedia('(min-width: 1200px)'), onWide = function (e) { if (e.matches) close(false); };
    if (wide.addEventListener) wide.addEventListener('change', onWide); else if (wide.addListener) wide.addListener(onWide);
  }

  // ---------- кнопки действия — сразу в Telegram с готовым черновиком (TASK-clarity.md, B11.1) ----------
  // У ссылки [data-tg] в разметке — чат без текста (так она работает и без JS) и черновик в data-tg; здесь адрес
  // собирается как t.me/<имя>?text=<привет + черновик> на языке страницы и пересобирается при смене языка (pt:lang)
  // WhatsApp [data-wa] — так же: wa.me/<номер>?text=<привет + черновик>
  var tgs = Array.prototype.slice.call(root.querySelectorAll('[data-tg]')), was = Array.prototype.slice.call(root.querySelectorAll('[data-wa]'));
  function tgLinks() {
    var I = window.PTI18N, en = !!(I && I.lang === 'en');
    function msg(a, k) { var t = (a.getAttribute(k) || '').replace(/\s+/g, ' ').trim(); return encodeURIComponent((en ? 'Hello!' : 'Здравствуйте!') + ' ' + (I ? I.t(t) : t)); }
    tgs.forEach(function (a) { a.href = 'https://t.me/dragonborne0?text=' + msg(a, 'data-tg'); });
    was.forEach(function (a) { a.href = 'https://wa.me/79090243995?text=' + msg(a, 'data-wa'); });
  }
  document.addEventListener('pt:lang', tgLinks);
  tgLinks();

  // ---------- «Обсудить проект» — список каналов связи [data-cm] (просьба владельца) ----------
  // Кнопка открывает список (Telegram, MAX, WhatsApp, телефон), закрывают: пункт, клик мимо, Esc (фокус — на кнопку), прокрутка
  var cms = Array.prototype.slice.call(root.querySelectorAll('[data-cm]'));
  function cmSet(cm, v) {
    var b = cm.querySelector('.cm-btn'), p = cm.querySelector('.cm-pop');
    if (!b || !p || p.hidden === !v) return;
    p.hidden = !v; b.setAttribute('aria-expanded', v ? 'true' : 'false'); cm.classList.toggle('is-open', v);
    // список прижат правым краем к кнопке; на узком экране (320 px) он уходил за левый край — сдвигаем в пределы окна
    if (v) { p.style.setProperty('--cm-dx', '0px'); var r = p.getBoundingClientRect(), W = document.documentElement.clientWidth; p.style.setProperty('--cm-dx', Math.round(r.left < 12 ? 12 - r.left : (r.right > W - 12 ? W - 12 - r.right : 0)) + 'px'); }
  }
  function cmClose(keep) { cms.forEach(function (cm) { if (cm !== keep) cmSet(cm, false); }); }
  cms.forEach(function (cm) {
    var b = cm.querySelector('.cm-btn'), p = cm.querySelector('.cm-pop');
    if (!b || !p) return;
    b.addEventListener('click', function () {
      var open = p.hidden; cmClose(cm); cmSet(cm, open);
      if (open && b.matches(':focus-visible')) { var a = p.querySelector('a'); if (a) a.focus(); }
    });
    p.addEventListener('click', function (e) { if (e.target.closest('a')) cmSet(cm, false); });
  });
  if (cms.length) {
    document.addEventListener('click', function (e) { if (!e.target.closest || !e.target.closest('[data-cm]')) cmClose(); });
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      cms.forEach(function (cm) { var p = cm.querySelector('.cm-pop'); if (p && !p.hidden) { cmSet(cm, false); cm.querySelector('.cm-btn').focus(); } });
    });
    window.addEventListener('scroll', function () { cmClose(); }, { passive: true });
  }

  // ---------- услуги на телефоне: в «Что входит» две строки, остальные — под кнопкой (TASK-clarity.md, B11.2) ----------
  // CSS прячет строки с третьей (только до 760 px); кнопка раскрывает и сворачивает список, высота меняется за 300 мс
  var rmq = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
  Array.prototype.forEach.call(root.querySelectorAll('.sv-more'), function (b) {
    var ul = document.getElementById(b.getAttribute('aria-controls')), anim = null;
    if (!ul) return;
    b.addEventListener('click', function () {
      var open = b.getAttribute('aria-expanded') !== 'true', h0 = ul.getBoundingClientRect().height;
      if (anim) { anim.cancel(); anim = null; }
      b.setAttribute('aria-expanded', open ? 'true' : 'false');
      ul.classList.toggle('is-open', open);
      if (rmq && rmq.matches || !ul.animate) return;
      var h1 = ul.getBoundingClientRect().height;
      // сворачивание: строки прячутся, когда высота доехала
      if (!open) ul.classList.add('is-open');
      anim = ul.animate([{ height: h0 + 'px', overflow: 'hidden' }, { height: h1 + 'px', overflow: 'hidden' }], { duration: 300, easing: 'cubic-bezier(.2,.7,.2,1)' });
      anim.onfinish = function () { anim = null; if (!open) ul.classList.remove('is-open'); };
    });
  });

  // ---------- свёрнутый пульт не ложится на первый экран ----------
  // Кнопка ↻ стоит в левом нижнем углу. Если под ней панель объекта, кнопки или строка доверия (на странице услуг —
  // «Два формата» со ссылками на направления, в каталоге — шаги подключения; на телефоне и
  // средних ширинах так бывает), она прячется, пока их не прокрутят. На телефоне она есть только на первом экране:
  // ниже свёрнутый пульт ложился поверх карточек всех секций.
  var guard = hero ? Array.prototype.slice.call(hero.querySelectorAll('[data-obj], .hero-act .btn, .hero-act .lnk, .trust, .sv-fmt, .sv-step')) : [];
  var phone = window.matchMedia ? window.matchMedia('(max-width: 760px)') : null;
  // Места кнопки и границы первого экрана — в переменных, в координатах документа (TASK-perf.md, 3.3): раньше каждый кадр
  // прокрутки читал offset* пульта и getBoundingClientRect всех границ. Перемеряем на resize, при смене раскладки страницы
  // (ResizeObserver) и при смене классов пульта; первый экран не в кадре — границы не нужны
  var gDoc = null, hDoc = 0, pBox = null;
  function measureGuard() {
    var sy = window.scrollY; gDoc = [];
    for (var k = 0; k < guard.length; k++) { var r = guard[k].getBoundingClientRect(); gDoc.push([r.left, r.top + sy, r.right, r.bottom + sy, r.width]); }
    hDoc = hero ? hero.getBoundingClientRect().bottom + sy : 0;
  }
  if (hero && 'ResizeObserver' in window) new ResizeObserver(function () { gDoc = null; }).observe(root);
  function guardPult() {
    if (!pult) return;
    var off = false;
    if (pult.classList.contains('is-mini')) {
      // меряем свёрнутую кнопку 44×44 от левого нижнего угла: если курсор над ней, она развёрнута в плашку, и по
      // плашке выходило бы «легла на контент» — кнопка пряталась сразу после пересборки и не возвращалась
      // место кнопки — без трансформации: при первом сворачивании она катится в угол (engine.js, rollPult), и по
      // getBoundingClientRect выходило бы «стоит по центру внизу» — кнопка пряталась и не возвращалась до прокрутки
      if (!pBox) { var bl = pult.offsetLeft, bb = pult.offsetTop + pult.offsetHeight; pBox = { left: bl, right: bl + 44, top: bb - 44, bottom: bb }; }
      var p = pBox, sy = window.scrollY;
      if (hero && !heroIn) off = !!(phone && phone.matches);
      else {
        if (!gDoc) measureGuard();
        // телефон: только пока под кнопкой сам первый экран. Первый экран страницы услуг короче окна, и раньше (правило
        // «первый экран целиком ушёл вверх») ↻ ложилась на заголовок и текст следующей секции
        if (phone && phone.matches && hero && hDoc - sy < p.bottom) off = true;
        for (var k = 0; k < gDoc.length && !off; k++) { var g = gDoc[k]; off = g[4] > 0 && g[2] > p.left && g[0] < p.right && g[3] - sy > p.top && g[1] - sy < p.bottom; }
      }
    }
    if (pult.classList.contains('is-off') !== off) pult.classList.toggle('is-off', off);
  }
  if (pult && 'MutationObserver' in window) new MutationObserver(function () { pBox = null; guardPult(); }).observe(pult, { attributes: true, attributeFilter: ['class'] });
  update();
})();
