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
  var TAIL = 3; // наименьший шаг в конце, px за кадр при 60 к/с
  // ?pt-scroll=native (TASK-perf.md, 0.2): колесо — нативное, без мягкой прокрутки, — только на странице с этим флагом в адресе.
  // Раньше флаг держался до конца вкладки, и после замеров владелец видел нативную прокрутку дальше (2026-10-24: «скролл
  // неприятный, поставь плавный»); память флага стирается. Якоря (to()) и свой скроллбар — как всегда. Меню и панели держат
  // страницу и так (overflow: hidden у html.pt-lock / html.cp-lock)
  var NATIVE = /[?&]pt-scroll=native(?:&|$)/.test(location.search);
  try { window.sessionStorage.removeItem('pt-scroll'); } catch (e) { /* хранилище запрещено */ }
  // начальная позиция не читается: чтение scrollY здесь заставляло браузер разложить всю страницу прямо посреди разбора
  // HTML (долгая задача на слабом телефоне). Её берут колесо (cur = tgt = scrollY, пока не едем), to() и обработчик scroll
  var cur = 0, tgt = 0, run = false, tw = null, last = -1, raf = 0, ours = 0;
  var bar = document.querySelector('[data-sbar]'), thumb = bar && bar.querySelector('[data-sbar-thumb]');
  var hideT = 0, drag = null, hover = false, th = 0;

  // Высота страницы и дорожки полосы — в переменных (TASK-perf.md, 3.3): обработчик scroll и колесо читали scrollHeight и
  // clientHeight на каждом событии — принудительный пересчёт раскладки, если движок в этом кадре что-то менял. Обновляются по
  // ResizeObserver на странице и по resize; положение ползунка — только из scrollY
  var docH = 0, trackH = 0;
  function sizes() { docH = de.scrollHeight; trackH = bar ? bar.clientHeight : 0; }
  function max() { if (!docH) sizes(); return Math.max(0, docH - window.innerHeight); }
  function clamp(v) { return v < 0 ? 0 : Math.min(v, max()); }
  // Одно чтение scrollY за кадр на всех (TASK-weak-phone, 4): этот модуль, шапка (nav.js) и движок берут позицию кадра отсюда —
  // PTScroll.y(now), now — метка кадра rAF (у всех вызовов одного кадра она одна). Чтение scrollY заставляет браузер досчитать
  // раскладку, если что-то менялось: в обработчике scroll на каждое событие у владельца (Galaxy A15) — 16–33 мс. Сдвинули
  // страницу сами (put) — следующее чтение заново
  var fy = 0, fyT = -1;
  function frameY(now) { if (now == null || now !== fyT) { fyT = now == null ? -1 : now; fy = window.scrollY || 0; } return fy; }
  function put(y) { y = Math.round(y); ours = y; window.scrollTo({ top: y, behavior: 'instant' }); fyT = -1; }
  function ease(p) { return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2; }
  function sync(y) { run = false; tw = null; cur = tgt = y == null ? window.scrollY : y; }

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
      // хвост: когда сглаживание даёт меньше TAIL px за кадр, дальше — ровно TAIL px за кадр до цели. Иначе страница ~0.6 с
      // доползала по пикселю за кадр, и при масштабе экрана 125–150 % шаг выходил то 1, то 2 пикселя экрана — на остановке
      // дрожал весь текст (владелец 2026-10-26). Позиция — целые пиксели страницы: дробную браузер округлял бы сам, неровно
      // шаг хвоста — целый (3 px при 60 Гц, 1 px при 120–144 Гц): дробный давал неровные 2 / 3
      var d = tgt - cur, s = d * (1 - Math.pow(1 - LERP, dt * 60)), m = Math.max(1, Math.round(TAIL * dt * 60));
      if (Math.abs(s) < m) { cur = Math.round(cur); d = tgt - cur; s = Math.abs(d) <= m ? d : (d > 0 ? m : -m); }
      cur = Math.abs(d - s) < 0.5 ? tgt : cur + s;
      if (cur === tgt) run = false;
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
    if (!NATIVE) window.addEventListener('wheel', function (e) {
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
    window.PTScroll = { tick: tick, to: to, arrive: arrive, mode: NATIVE ? 'native' : 'soft', y: frameY };
  }
  // обработчик scroll — только флаг; позиция и ползунок — в кадре (onScrollFrame: свой rAF или кадр движка через tick)
  var sDirty = false, sraf = 0;
  function onScrollFrame(now) {
    sraf = 0; if (!sDirty) return; sDirty = false;
    var y = frameY(now);
    // прокрутил кто-то другой (клавиатура, тач, поиск, перетаскивание ползунка) — отдаём управление
    if (run && Math.abs(y - ours) > 2) sync(y);
    else if (!run) cur = tgt = y;
    show(y);
  }
  function tick(now) { step(now); if (sDirty) onScrollFrame(now); }
  window.addEventListener('scroll', function () { sDirty = true; if (!sraf) sraf = requestAnimationFrame(onScrollFrame); }, { passive: true });
  // ресайз: граница прокрутки — только пока едем (стоим — цель возьмётся из scrollY при следующем колесе), полоса — только
  // видимая (скрытую измерит show()). Раньше — два замера высоты страницы на каждый resize, в том числе на загрузке
  window.addEventListener('resize', function () { if (docH) sizes(); if (run) tgt = clamp(tgt); if (bar && bar.classList.contains('on')) update(); });
  if ('ResizeObserver' in window) {
    var sro = new ResizeObserver(function () { if (docH) sizes(); });
    if (document.body) sro.observe(document.body);
    var site = document.getElementById('pt-site'); if (site) sro.observe(site);
  }

  // ---------- скроллбар: скрыт, пока страницу не прокручивают; гаснет через 1.2 с после остановки ----------
  // высота ползунка — только когда она меняется (высота страницы, дорожки, окна), сдвиг — от позиции кадра
  var thSet = -1;
  function update(y) {
    if (!bar) return false;
    var m = max(), track = trackH || (trackH = bar.clientHeight);
    if (m < 1) { bar.classList.remove('on'); return false; }
    th = Math.max(36, Math.round(track * window.innerHeight / docH));
    if (th !== thSet) { thSet = th; thumb.style.height = th + 'px'; }
    thumb.style.transform = 'translateY(' + ((track - th) * Math.min(1, (y == null ? window.scrollY : y) / m)).toFixed(1) + 'px)';
    return true;
  }
  function hide() { if (drag || hover) { hideT = setTimeout(hide, 600); return; } bar.classList.remove('on'); }
  function show(y) { if (!update(y)) return; if (!bar.classList.contains('on')) bar.classList.add('on'); clearTimeout(hideT); hideT = setTimeout(hide, 1200); }
  if (!bar || !thumb) return;
  function end() { if (!drag) return; drag = null; thumb.classList.remove('drag'); show(); }
  bar.addEventListener('pointerenter', function () { hover = true; });
  bar.addEventListener('pointerleave', function () { hover = false; });
  thumb.addEventListener('pointerdown', function (e) {
    if (e.button) return;
    e.preventDefault(); sync(); update();
    drag = { y: e.clientY, s: window.scrollY }; thumb.classList.add('drag');
    thumb.setPointerCapture(e.pointerId);
  });
  thumb.addEventListener('pointermove', function (e) {
    if (!drag) return;
    var free = (trackH || bar.clientHeight) - th;
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
  // полоса скрыта до первой прокрутки, и show() меряет её сам. Замер здесь раскладывал всю страницу посреди её загрузки
  // (0.1–0.15 с при CPU ×4), а сразу за ним движок снимает .pt-boot — и раскладка считалась заново
})();
