// Прокрутка сайта: мягкая инерционная прокрутка колесом и свой скроллбар в палитре сайта.
//
// Колесо и тачпад двигают цель, а страница плавно догоняет её: экспоненциальное сглаживание, доля пути LERP
// за кадр при 60 fps. Якорные ссылки (#…) едут к секции по кривой easeInOutCubic. Тач, клавиатура и поиск по
// странице прокручивают нативно, модуль только подхватывает их позицию. При prefers-reduced-motion вся прокрутка
// нативная.
//
// По прибытии к якорю — отклик на цели (arrive, TASK-clarity.md, B1.2): рамка цели на 1.1 с вспыхивает цветом
// направления, заголовок — тоже. Цель ещё не собрана — отклик после её сборки (движок шлёт pt:secdone). Тот же
// arrive движок зовёт после перехода по якорю с другой страницы (jumpStart). Reduced motion — без отклика.
//
// Кадр модуля — PTScroll.tick(now). Его вызывает движок в начале своего кадра, до замеров: так частицы не
// отстают от страницы. Пока страница едет, модуль держит и свой rAF (на случай, если движка нет). Работа
// выполняется один раз за кадр: оба вызова получают одну метку времени.
(function () {
  var de = document.documentElement;
  var rm = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var LERP = 0.08;
  // начальная позиция не читается: чтение scrollY здесь заставляло браузер разложить всю страницу прямо посреди разбора
  // HTML (долгая задача на слабом телефоне). Её берут колесо (cur = tgt = scrollY, пока не едем), to() и обработчик scroll
  var cur = 0, tgt = 0, run = false, tw = null, last = -1, raf = 0, ours = 0;
  var bar = document.querySelector('[data-sbar]'), thumb = bar && bar.querySelector('[data-sbar-thumb]');
  var hideT = 0, drag = null, hover = false, th = 0;

  function max() { return Math.max(0, de.scrollHeight - window.innerHeight); }
  function clamp(v) { return v < 0 ? 0 : Math.min(v, max()); }
  function put(y) { ours = y; window.scrollTo({ top: y, behavior: 'instant' }); }
  function ease(p) { return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2; }
  function sync() { run = false; tw = null; cur = tgt = window.scrollY; }

  // ---------- отклик на цели якоря ----------
  // рамка: сама цель, её ближайший предок с рамкой или первый такой потомок. Линии-разделители (data-fr-line) — не
  // рамки. Нет рамки (секция, строка группы) — вспыхивает заголовок
  var ARR = '.obj, .sv-mod, .sv-path, .fr:not([data-fr-line])', HEAD = 'h1, h2, .gh-w, .sv-t, .obj-h, .sv-ph';
  var waitEl = null, waitT = 0;
  function flash(t, cls) { t.classList.remove(cls); void t.offsetWidth; t.classList.add(cls); setTimeout(function () { t.classList.remove(cls); }, 1150); }
  function arrive(el) {
    if (rm || !el || !el.closest) return;
    // пустой якорь-метка (<span id="apps">) — его секция
    if (!el.children.length && !el.textContent.trim()) el = el.closest('[data-sec]') || el;
    var sec = el.closest('[data-sec]');
    waitEl = null; clearTimeout(waitT);
    if (sec && !sec.classList.contains('s-done')) { waitEl = el; waitT = setTimeout(function () { waitEl = null; }, 8000); return; }
    var t = el.matches(ARR) ? el : el.closest(ARR);
    if (t && !el.matches('[data-sec]')) { flash(t, 'pt-arrive'); return; }
    var h = el.matches(HEAD) ? el : el.querySelector('.gh-w') || el.querySelector(HEAD);
    if (h) { flash(h, 'pt-arrive-x'); return; }
    t = el.querySelector(ARR);
    if (t) flash(t, 'pt-arrive');
  }
  // секция цели собралась — отклик чуть позже: настоящий текст и рамки как раз проявляются
  window.addEventListener('pt:secdone', function (e) {
    var el = waitEl;
    if (!el || !e.detail || !e.detail.contains(el)) return;
    waitEl = null; clearTimeout(waitT);
    setTimeout(function () { arrive(el); }, 300);
  });

  function step(now) {
    if (!run || now === last) return;
    var dt = last < 0 ? 1 / 60 : Math.min(0.05, (now - last) / 1000); last = now;
    if (tw) {
      var p = Math.min(1, Math.max(0, (now - tw.t0) / tw.d));
      cur = tgt = tw.from + (tw.to - tw.from) * ease(p);
      if (p >= 1) { var fin = tw.fin; tw = null; run = false; if (fin) fin(); }
    } else {
      cur += (tgt - cur) * (1 - Math.pow(1 - LERP, dt * 60));
      if (Math.abs(tgt - cur) < 0.5) { cur = tgt; run = false; }
    }
    put(cur);
  }
  function loop(now) { raf = 0; step(now); if (run) raf = requestAnimationFrame(loop); }
  function go() { if (!run) { run = true; last = -1; } if (!raf) raf = requestAnimationFrame(loop); }
  // плавно к позиции y; длительность растёт с расстоянием (0.45–0.95 с); fin — по прибытии (прокрутку не перебили)
  function to(y, fin) {
    var from = window.scrollY; y = clamp(y);
    tw = { from: from, to: y, t0: performance.now(), d: Math.min(950, Math.max(450, 380 + Math.abs(y - from) / 5)), fin: fin || null };
    cur = tgt = from; go();
    // дальше 1.5 экрана — прыжок: движок не собирает секции по пути, а когда доедем — видимые разом (TASK-qa-decisions.md, 4)
    if (Math.abs(y - from) > window.innerHeight * 1.5) { try { window.dispatchEvent(new CustomEvent('pt:jump', { detail: { until: tw.t0 + tw.d } })); } catch (e) { /* старый браузер */ } }
  }

  if (!rm) {
    window.addEventListener('wheel', function (e) {
      if (e.ctrlKey || e.defaultPrevented) return;
      // открыто меню (nav.js, html.pt-lock) — страница стоит
      if (de.classList.contains('pt-lock')) { e.preventDefault(); return; }
      // открыта панель разбора работы (cases.js, html.cp-lock): колесо крутит её тело — нативно, страница стоит
      if (de.classList.contains('cp-lock')) { if (!(e.target.closest && e.target.closest('[data-cp-body]'))) e.preventDefault(); return; }
      var dy = e.deltaY;
      if (Math.abs(e.deltaX) > Math.abs(dy)) return;
      if (e.deltaMode === 1) dy *= 16; else if (e.deltaMode === 2) dy *= window.innerHeight;
      e.preventDefault();
      if (!run || tw) { tw = null; cur = tgt = window.scrollY; }
      tgt = clamp(tgt + dy);
      go();
    }, { passive: false });
    document.addEventListener('click', function (e) {
      if (e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      // путь страницы без .html и index: /services и /services.html, / и /index.html — одна страница
      var pn = function (p) { return p.replace(/[.]html$/, '').replace(/[/]index$/, '/'); };
      // якорь на этой же странице: «#process» или с именем файла — «services.html#process» в подвале страницы услуг
      var a = e.target.closest && e.target.closest('a[href*="#"]'), id = '';
      if (a && a.hash.length > 1 && !a.target && pn(a.pathname) === pn(location.pathname) && a.search === location.search) {
        try { id = decodeURIComponent(a.hash.slice(1)); } catch (er) { id = ''; }
      }
      var el = id && document.getElementById(id);
      if (!el) return;
      e.preventDefault();
      // scroll-margin-top цели (модули страницы услуг — 88 px): иначе она уходила под липкую шапку
      // цель с tabindex (ссылка «к содержанию» → #main) получает фокус: следующий Tab идёт уже от неё, а не по шапке
      if (el.hasAttribute('tabindex')) el.focus({ preventScroll: true });
      to(el.getBoundingClientRect().top + window.scrollY - (parseFloat(getComputedStyle(el).scrollMarginTop) || 0), function () { arrive(el); });
      if (history.pushState) history.pushState(null, '', '#' + id);
    });
    window.PTScroll = { tick: step, to: to, arrive: arrive };
  }
  window.addEventListener('scroll', function () {
    // прокрутил кто-то другой (клавиатура, тач, поиск, перетаскивание ползунка) — отдаём управление
    if (run && Math.abs(window.scrollY - ours) > 2) sync();
    else if (!run) cur = tgt = window.scrollY;
    show();
  }, { passive: true });
  window.addEventListener('resize', function () { tgt = clamp(tgt); update(); });

  // ---------- скроллбар: скрыт, пока страницу не прокручивают; гаснет через 1.2 с после остановки ----------
  function update() {
    if (!bar) return false;
    var m = max(), track = bar.clientHeight;
    if (m < 1) { bar.classList.remove('on'); return false; }
    th = Math.max(36, Math.round(track * window.innerHeight / de.scrollHeight));
    thumb.style.height = th + 'px';
    thumb.style.transform = 'translateY(' + ((track - th) * Math.min(1, window.scrollY / m)).toFixed(1) + 'px)';
    return true;
  }
  function hide() { if (drag || hover) { hideT = setTimeout(hide, 600); return; } bar.classList.remove('on'); }
  function show() { if (!update()) return; bar.classList.add('on'); clearTimeout(hideT); hideT = setTimeout(hide, 1200); }
  if (!bar || !thumb) return;
  function end() { if (!drag) return; drag = null; thumb.classList.remove('drag'); show(); }
  bar.addEventListener('pointerenter', function () { hover = true; });
  bar.addEventListener('pointerleave', function () { hover = false; });
  thumb.addEventListener('pointerdown', function (e) {
    if (e.button) return;
    e.preventDefault(); sync();
    drag = { y: e.clientY, s: window.scrollY }; thumb.classList.add('drag');
    thumb.setPointerCapture(e.pointerId);
  });
  thumb.addEventListener('pointermove', function (e) {
    if (!drag) return;
    var free = bar.clientHeight - th;
    window.scrollTo({ top: drag.s + (e.clientY - drag.y) * (free > 0 ? max() / free : 0), behavior: 'instant' });
  });
  thumb.addEventListener('pointerup', end);
  thumb.addEventListener('pointercancel', end);
  thumb.addEventListener('lostpointercapture', end);
  bar.addEventListener('pointerdown', function (e) {
    if (e.target === thumb || e.button) return;
    var r = thumb.getBoundingClientRect(), y = window.scrollY + (e.clientY < r.top ? -1 : 1) * window.innerHeight * 0.85;
    if (window.PTScroll) to(y); else window.scrollTo({ top: y, behavior: 'smooth' });
  });
  update();
})();
