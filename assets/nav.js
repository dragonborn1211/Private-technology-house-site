// Навигация: липкая шапка [data-topbar] и меню на телефоне [data-menu]. Обе живут в #pt-site вне секций — движок
// их не собирает из частиц. Здесь же следим, чтобы свёрнутая кнопка пульта не ложилась на первый экран.
(function () {
  var root = document.getElementById('pt-site');
  if (!root) return;
  var de = document.documentElement, bar = root.querySelector('[data-topbar]'), menu = root.querySelector('[data-menu]');
  var hero = root.querySelector('[data-sec="hero"]'), pult = root.querySelector('[data-pult]');

  // ---------- липкая шапка ----------
  // Пока первый экран в кадре — скрыта. Ниже: прокрутка вверх показывает, вниз прячет. После перехода по якорю
  // (меню, кнопки) остаётся видимой, пока человек сам не начнёт прокручивать.
  var lastY = window.scrollY, shown = false, pinned = false, raf = 0;
  function show(v) {
    if (!bar || v === shown) return;
    shown = v; bar.classList.toggle('on', v);
    if (v) bar.removeAttribute('inert'); else bar.setAttribute('inert', '');
  }
  function update() {
    raf = 0;
    var y = window.scrollY, dy = y - lastY; lastY = y;
    // закрепление после якоря снимает только сам человек (колесо, палец, клавиши): в начале поездки к секции первый
    // экран ещё в кадре, и сброс здесь гасил шапку
    if (hero && hero.getBoundingClientRect().bottom > 0) show(false);
    else if (pinned || dy < -1) show(true);
    else if (dy > 1) show(false);
    guardPult();
  }
  function onScroll() { if (!raf) raf = requestAnimationFrame(update); }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
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

  // активный раздел: пункт меню текущей секции — aria-current
  var links = Array.prototype.slice.call(root.querySelectorAll('[data-nav]'));
  // «Процесс» живёт на странице услуг (пункт меню главной ведёт туда), «Цены» скрыты до утверждения цен
  var KEY = { directions: 'directions', objects: 'objects', automation: 'automation', pricing: 'pricing' };
  var secs = Array.prototype.slice.call(root.querySelectorAll('[data-sec]')), inBand = [];
  function setActive() {
    var cur = null;
    for (var k = 0; k < secs.length; k++) if (inBand.indexOf(secs[k]) >= 0) { cur = KEY[secs[k].getAttribute('data-sec')] || null; break; }
    links.forEach(function (a) { if (cur && a.getAttribute('data-nav') === cur) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
  }
  if ('IntersectionObserver' in window) {
    // тонкая полоса на 35–40% высоты окна: секция, которая её пересекает, и есть текущая
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { var i = inBand.indexOf(e.target); if (e.isIntersecting && i < 0) inBand.push(e.target); else if (!e.isIntersecting && i >= 0) inBand.splice(i, 1); });
      setActive();
    }, { rootMargin: '-35% 0px -60% 0px', threshold: 0 });
    secs.forEach(function (s) { io.observe(s); });
  }

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
  var tgs = Array.prototype.slice.call(root.querySelectorAll('[data-tg]'));
  function tgLinks() {
    var I = window.PTI18N, en = !!(I && I.lang === 'en');
    tgs.forEach(function (a) {
      var t = (a.getAttribute('data-tg') || '').replace(/\s+/g, ' ').trim();
      a.href = 'https://t.me/dragonborne0?text=' + encodeURIComponent((en ? 'Hello!' : 'Здравствуйте!') + ' ' + (I ? I.t(t) : t));
    });
  }
  document.addEventListener('pt:lang', tgLinks);
  tgLinks();

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
  function guardPult() {
    if (!pult) return;
    var off = false;
    if (pult.classList.contains('is-mini')) {
      // меряем свёрнутую кнопку 44×44 от левого нижнего угла: если курсор над ней, она развёрнута в плашку, и по
      // плашке выходило бы «легла на контент» — кнопка пряталась сразу после пересборки и не возвращалась
      // место кнопки — без трансформации: при первом сворачивании она катится в угол (engine.js, rollPult), и по
      // getBoundingClientRect выходило бы «стоит по центру внизу» — кнопка пряталась и не возвращалась до прокрутки
      var bl = pult.offsetLeft, bb = pult.offsetTop + pult.offsetHeight, p = { left: bl, right: bl + 44, top: bb - 44, bottom: bb };
      // телефон: только пока под кнопкой сам первый экран. Первый экран страницы услуг короче окна, и раньше (правило
      // «первый экран целиком ушёл вверх») ↻ ложилась на заголовок и текст следующей секции
      if (phone && phone.matches && hero && hero.getBoundingClientRect().bottom < p.bottom) off = true;
      for (var k = 0; k < guard.length && !off; k++) { var r = guard[k].getBoundingClientRect(); off = r.width > 0 && r.right > p.left && r.left < p.right && r.bottom > p.top && r.top < p.bottom; }
    }
    if (pult.classList.contains('is-off') !== off) pult.classList.toggle('is-off', off);
  }
  if (pult && 'MutationObserver' in window) new MutationObserver(guardPult).observe(pult, { attributes: true, attributeFilter: ['class'] });
  update();
})();
