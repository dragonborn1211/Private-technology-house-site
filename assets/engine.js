// Движок сборки из частиц. Сцены в карточках живут в assets/scenes.js (window.PTScenes) и подключаются раньше.
(function () {
    var factory = function (root) {
      var canvas = root.querySelector('[data-pt-canvas]');
      var stepEl = root.querySelector('[data-pt-step]'), progEl = root.querySelector('[data-pt-prog]');
      // «Пересобрать блок»: кнопка в плашке пульта и свёрнутая кнопка ↻
      var btns = Array.prototype.slice.call(root.querySelectorAll('[data-pt-replay]'));
      var countEl = root.querySelector('[data-pt-count]');
      var rm = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
      // hold — облегчённый режим и идёт прокрутка: декоративные петли сцен стоят (TASK-qa-decisions.md, 3; см. onHold)
      // low — облегчение уровня 2: сцены в карточках рисуются в 1× разрешении, как частицы (TASK-hud2.md, 4)
      var env = { rm: rm, mob: false, vh: 800, hold: false, low: false };
      var gl = null, c2 = null;
      if (canvas) {
        try { gl = canvas.getContext('webgl', { antialias: false, alpha: true, premultipliedAlpha: true }) || canvas.getContext('experimental-webgl', { alpha: true }); } catch (e) { gl = null; }
        if (!gl) c2 = canvas.getContext('2d');
      }
      var oc = document.createElement('canvas'), og = oc.getContext('2d', { willReadFrequently: true });
      var W = 1, VH = 1, dpr = 1, mob = false, N = 0, alive = true, active = true, raf = 0, prev = performance.now();
      var rootTop = 0, rootLeft = 0, lastTop = null;
      // Холст частиц лежит в документе (внутри .pt, position: absolute) и едет вместе со страницей (TASK-perf.md, 2): между
      // кадрами главного потока браузер прокручивает его вместе с текстом, и частицы не отстают от рамок. Его высота — окно и
      // запас CM сверху и снизу (15 % окна: на быстром свайпе у краёв нет пустой полосы), в своём кадре движок ставит его на
      // место (cvY — сдвиг холста в координатах корня). layoutVH — высота окна при последнем layout()
      var CM = 0, CH = 1, cvY = null, layoutVH = 1;
      var mouse = { cx: -1e5, cy: -1e5 };
      var P, V, T, NT, C, CT, NC, A, AT, NA, SZ, NS, SW, M, NM, SP, TP, BUF, BLD = [];
      var layoutGen = 0, lzT = new Float64Array(4), lzQ = 0;
      // Дрожание частиц сборки — из таблицы случайных чисел (JN), с новой случайной точки в каждом кадре: тот же равномерный
      // шум той же силы, но без двух вызовов Math.random на каждую из 25 000 частиц (это было ~40 % времени цикла при сборке)
      var JN = new Float32Array(8192);
      for (var jq = 0; jq < 8192; jq++) JN[jq] = Math.random() - 0.5;
      var prog = null, buf = null, U = {};
      var SMK = 520, sX = new Float32Array(SMK), sY = new Float32Array(SMK), sVX = new Float32Array(SMK), sVY = new Float32Array(SMK), sL = new Float32Array(SMK), sM = new Float32Array(SMK), sC = new Float32Array(SMK), sI = 0, lastPX = null, lastPY = null;
      var smk = root.querySelector('[data-pt-smoke]'), sctx = smk ? smk.getContext('2d') : null, SPR = [], smokeLive = false;
      var sites = Array.prototype.slice.call(root.querySelectorAll('.site-view iframe')), scenes = [];
      // язык: ссылки RU / EN в шапке и луч, который проходит экран при смене языка
      var langLinks = Array.prototype.slice.call(root.querySelectorAll('[data-lang]')), beamEl = root.querySelector('[data-lang-beam]');
      var COL = { frost: [238, 243, 246], glass: [188, 211, 222], skel: [96, 124, 142], accent: [142, 216, 248] };
      var DUST = [[142, 216, 248], [127, 168, 255], [183, 166, 242], [159, 229, 209], [230, 236, 241]];
      // burst (data-pt-burst) — финал сборки секции. Без атрибута — тихий: частицы гаснут на месте (phSettle; так у всех
      // секций, кроме подвала, TASK-structure.md). "pop" — небольшой взрыв (phPop): только у подвала, акцент «страница
      // кончилась». Пустое значение — прежний сильный разлёт по экрану (phAmbient), оставлен на будущее
      var secs = Array.prototype.slice.call(root.querySelectorAll('[data-sec]')).map(function (el) { return { el: el, name: el.getAttribute('data-sec'), state: 'idle', geo: null, geoKey: '', replay: false, burst: el.getAttribute('data-pt-burst') }; });
      var pultEl = root.querySelector('[data-pult]'), pultT = 0, pultShown = false, replaying = false;
      var hero = secs[0], queue = [], running = null, timers = [], typeT = 0, seeT = 0, cur = null, io = null, io2 = null, io3 = null, io4 = null, near = [], preOn = false;
      // Сцены в карточках просыпаются по одной за кадр (wakeQ, frame): пробуждение схемы или демо-сайта — подгонка холста и
      // раскладка узлов, 15–20 мс на слабом устройстве; две-три в одной задаче давали рывок до 45 мс в финале сборки секции.
      // Сцена стартует на кадр-два позже — на глаз не видно. Усыплённая (пересборка, смена языка) из очереди убирается
      // Кольцо фиксированной длины, а не массив с push / shift (TASK-perf.md, 3.1): смена вида массива деоптимизировала frame
      var WQ = 64, wakeQ = new Array(WQ).fill(null), wqH = 0, wqN = 0;
      function wakePush(sc) {
        for (var k = 0; k < wqN; k++) if (wakeQ[(wqH + k) % WQ] === sc) return;
        if (wqN < WQ) { wakeQ[(wqH + wqN) % WQ] = sc; wqN++; }
      }
      // одна сцена за кадр; усыплённые из очереди убраны (null) — пропускаем
      function wakeNext() { while (wqN) { var sc = wakeQ[wqH]; wakeQ[wqH] = null; wqH = (wqH + 1) % WQ; wqN--; if (sc) { sc.wake(); return; } } }
      function sleepScene(sc) { for (var k = 0; k < wqN; k++) { var j = (wqH + k) % WQ; if (wakeQ[j] === sc) wakeQ[j] = null; } sc.sleep(); }
      // «Тихие» зоны — текст первого экрана (кикер, H1, лид, кнопки, строка доверия) и текст панели «Кодекс студии»
      // (вкладки сверху, подпись снизу): пыль над ним горит слабее (CALM_A), чтобы не мешать читать, а при раскладке
      // gAmbient выбирает точку вне зон. Раньше зоны были блоками целиком и пыль в них не рисовалась вовсе: блоки занимали
      // всю колонку текста (на телефоне — почти весь первый экран), и пыль, которая теперь видна всегда, оставляла посередине
      // пустое место (владелец: «очень мало в центре, в основном по краям»). Теперь зоны — строки текста (calmEls,
      // прямоугольники строк через Range); вкладки и подпись панели (calmBox) — целиком: подпись меняется каждые 8–10 с.
      // Координаты — от корня, как у частиц; пересчёт при смене раскладки (layoutGen; смена языка его тоже растит). calmB —
      // общая рамка зон, чтобы не перебирать их для каждой точки.
      var calmEls = Array.prototype.filter.call(hero.el.querySelectorAll('[data-blk]'), function (b) { return !b.matches('[data-obj], header'); });
      var calmBox = Array.prototype.slice.call(hero.el.querySelectorAll('[data-obj] .obj-top, [data-obj] .obj-cw'));
      var calm = new Float64Array(0), calmB = new Float64Array(4), calmGen = -1, CALM_A = 0.3;
      // Фоновая пыль (просьба владельца: «чтобы всегда на заднем фоне были частицы; при анимации их чуть меньше, после каждой —
      // обратно»). Свой запас точек AMB — доля DUSTA / DUSTM от всех частиц (столько пыли было видно после сборки и раньше), в
      // сборке он не участвует: секции собирают остальные (BLD), и пыль не пропадает на каждой сборке. Пока идёт сборка (первый
      // экран, секция, «Пересобрать блок», смена языка), видна доля DUST_BUSY пыли, остальная гаснет; после — снова вся (dustSet
      // из frame). DUSTV — яркость точки пыли.
      var DUSTA = 0.035, DUSTM = 0.015, DUST_BUSY = 0.6, DUSTV = 0.34, AMB = [], dustLvl = -1, dustT = 0;
      // Объект первого экрана — пять принципов студии (assets/hero-objects.js, свой WebGL-холст в секции).
      // Движок только запускает его в конце сборки первого экрана; без модуля сайт работает как раньше.
      var heroObj = null;
      // objStart — запустить объект один раз: повторный start() начинает полёт заново. На вступлении его запускает стадия рамок
      // (TASK-review.md 1.3: к моменту, когда читается H1, ферзь уже узнаваем; раньше панель «Кодекс студии» стояла пустой, пока
      // собирался текст), пропуск сборки и skipHero — если ещё не запущен. heroRp — идёт «Пересобрать блок» первого экрана.
      var objOn = false, heroRp = false;
      // Телефон (TASK-qa-decisions.md, 1): панель «Кодекса» там ниже первого экрана — видна только её верхняя кромка, а монтаж
      // объекта (WebGL, фигуры, свой цикл кадров) при загрузке шёл прямо во время вступления и давал основную часть TBT. На
      // ширине до 760 px (полная и быстрая сборка) объект монтируется, когда панель впервые видна хотя бы на 25 %, или после
      // конца вступления в простое браузера (таймаут 2 с) — что раньше. Стадия рамок до этого только помечает «пора» (objPend),
      // и ферзь собирается обычной анимацией, когда его видно. Пока объекта нет, панель как до старта ферзя: рамка, вкладки,
      // подпись из разметки. «Собрать заново», смена языка и касание панели монтируют сразу. Десктоп, «сразу», reduced
      // motion — как раньше (монтаж при загрузке).
      var heroLazy = false, objPend = false, heroIO = null, heroIdleT = 0;
      function heroNow() {
        if (heroObj || !heroLazy) return heroObj;
        heroLazy = false; if (heroIO) { heroIO.disconnect(); heroIO = null; } clearTimeout(heroIdleT);
        try { heroObj = window.PTHero.mount(hero.el, { autostart: false }); } catch (e) { heroObj = null; console.warn(e); }
        return heroObj;
      }
      // смонтировать и, если вступление уже дошло до объекта, запустить его сборку
      function heroWake() { if (!heroLazy || !alive) return; heroNow(); if (objPend) { objPend = false; objStart(false); } }
      // из простоя и от прокрутки: монтаж и запуск — в соседних кадрах (вместе — задача ~90 мс на слабом телефоне сразу после
      // вступления). Касание панели — heroWake: обработчикам модуля нужен запущенный объект в том же клике
      function heroWakeSoft() { if (!heroLazy || !alive) return; heroNow(); if (objPend) { objPend = false; requestAnimationFrame(function () { if (alive) objStart(false); }); } }
      // вступление кончилось — смонтировать в простое (не позже чем через 2 с)
      function heroIdle() {
        if (!heroLazy || heroIdleT) return;
        heroIdleT = setTimeout(function () {
          if (window.requestIdleCallback) window.requestIdleCallback(heroWakeSoft, { timeout: 2000 }); else setTimeout(heroWakeSoft, 200);
        }, 0);
      }
      // не нужное первому экрану — после его сборки, в простое браузера (не позже чем через 2 с)
      function idleOnce(fn) { setTimeout(function () { if (!alive) return; if (window.requestIdleCallback) window.requestIdleCallback(fn, { timeout: 2000 }); else setTimeout(fn, 200); }, 0); }
      // «Собрать заново» и смена языка: объекта ещё нет — смонтировать сразу
      function heroReplay() { heroNow(); if (!heroObj) return; objPend = false; objOn = true; heroObj.replay(); }
      function objStart(instant) {
        if (heroLazy) { objPend = true; return; }
        if (!heroObj || objOn) return; objOn = true; heroObj.start(instant);
      }
      // Темп сборки: HERO_K — множитель таймингов первого экрана (1 — исходные 5.8 с; 0.5 — буквы на 1.85 с, текст на
      // 2.6 с: по ТЗ шапки первый экран должен читаться к ~2 с), SEC_K — остальных секций (1 — исходные 3.1 с), одинаковый
      // для всех секций, страниц и режимов. Был 0.9; владелец попросил секции на обеих страницах как быстрая сборка при
      // переходе между страницами (0.3) и ещё чуть быстрее — 0.25, секция за ~0.7 с. PRESENT_K — «Пересобрать блок»:
      // полный темп для показа.
      // runK — темп текущей сборки секции (по нему же масштабируется sweep). runId отменяет таймеры прерванной сборки.
      var HERO_K = 0.5, SEC_K = 0.25, PRESENT_K = 1, runK = SEC_K, runId = 0, booted = false, abortAt = 0;
      // адаптивное качество: 1 — без стеклянного размытия и дымного следа, 2 — ещё и частицы в 1× разрешении
      var lite = 0, dprCap = 2, qT = 0, qW = [], bootAt = performance.now();
      // settleFn — как мгновенно довести до конца сборку из нескольких секций («Пересобрать блок» до постановки
      // в очередь, смена языка), если её прервали кликом (skipNow) или прокруткой (abortRun). BEAM — проход луча, с.
      var settleFn = null, BEAM = 1.2;
      // Вступление первого экрана (просьба владельца). INTRO_LINES — две быстрые линии «рисуют» первый экран:
      // вертикальная (тот же луч, что при смене языка) слева направо рисует все рамки — каркас и стили одной стадией,
      // горизонтальная сверху вниз — текст; за линией волной летят частицы и проявляется то, до чего она дошла (CSS
      // --ld). Потом частицы долю секунды держат буквы и гаснут на месте (finish). false — прежние стадии и линия-сканер
      // .scan. BURST_FULL — вспышка при загрузке разлетается на весь экран; false — прежний сгусток в
      // центре. LINE — проход линии при темпе 1, с (умножается на HERO_K / PRESENT_K). heroSweep — волна частиц первого
      // экрана в такт с линией (sweep).
      var INTRO_LINES = true, BURST_FULL = true, LINE = 1.0, heroSweep = null, burstEnd = 0, beamH = root.querySelector('[data-scan-beam]');
      if (INTRO_LINES) root.classList.add('pt-lines');
      try { lite = +sessionStorage.getItem('pt-q') || 0; } catch (e) {}
      // Флаги проверки (TASK-perf.md, 0.2), держатся до конца вкладки; ?pt-reset — сброс. ?pt-q=0|1|2 — уровень облегчения
      // зафиксирован: автоматика (probe, watchQuality) его не меняет и не пишет в pt-q
      var QFIX = -1;
      try {
        var fq = location.search;
        if (/[?&]pt-reset(?:[=&]|$)/.test(fq)) { sessionStorage.removeItem('pt-qfix'); sessionStorage.removeItem('pt-q'); lite = 0; }
        var mq = /[?&]pt-q=([012])(?:&|$)/.exec(fq);
        if (mq) sessionStorage.setItem('pt-qfix', mq[1]);
        var fx = sessionStorage.getItem('pt-qfix');
        if (fx === '0' || fx === '1' || fx === '2') { QFIX = +fx; lite = QFIX; }
      } catch (e) { /* хранилище запрещено — без флагов */ }
      if (lite >= 2) { dprCap = 1; env.low = true; }
      // Режим сборки (TASK-glyphs-transitions.md, раздел 3). full — первое знакомство с сайтом или прошло больше 30 дней
      // с последней полной сборки: вспышка, две линии, сборка частицами. fast — страница сайта, которую в этой вкладке ещё
      // не открывали (переход главная → услуги), или новый визит в течение 30 дней: один луч, за ним всё проявляется,
      // секции ниже — в общем темпе SEC_K. instant — страница уже открывалась в этой вкладке (назад, ссылка, обновление): всё
      // на месте с первого кадра, движение (объект, пыль, сцены, рисунки) идёт. ?intro=full|fast|instant — принудительно
      // (проверки, показ клиенту). Хранилище недоступно — full. Reduced motion — как раньше (rm). «Пересобрать блок» —
      // всегда полная показательная сборка. PAGE — страница без языка и якоря: / и /index.html — одна.
      // AUTO_MODE — выбирать режим сам (по pt-seen и pt-intro). Сейчас выключен по просьбе владельца: он проверяет полную
      // сборку, а память режимов показывала ему только быструю и «сразу». Пока false — всегда полная (кроме ?intro=… и
      // reduced motion), хранилища не трогаем. Включить — true.
      var AUTO_MODE = false;
      var FAST_LD = 0.6, PAGE = (location.pathname.split('/').pop() || 'index.html').replace(/\.html$/, '');
      // Повторный заход в этой вкладке (вторая и следующие страницы, обновление, «назад»): sessionStorage['pt-visit'] — время
      // прошлой страницы. Перерыв больше 30 минут — снова первый заход: телефон держит вкладку днями, и полную сборку там больше
      // не было бы видно. Ключ сменён (был pt-nav, вместе с ним pt-lite → pt-q) — сброс по просьбе владельца: «будто я первый
      // раз на сайт зашёл», во всех открытых вкладках следующий заход — полный.
      var REPEAT = false;
      try { var tv = +sessionStorage.getItem('pt-visit') || 0; REPEAT = tv > 0 && Date.now() - tv < 30 * 60e3; sessionStorage.setItem('pt-visit', String(Date.now())); } catch (e) { /* хранилище запрещено — полная */ }
      // Скрипты пришли поздно (позже ~4 с от начала загрузки): CSS показывает страницу без сборки (pt-late в site.css) — не
      // прячем её ради вступления, всё сразу на месте, движение идёт (как режим «сразу»). По времени, а не по стилю: чтение
      // стиля здесь стоило лишнего пересчёта стилей всей страницы. Время — часы анимаций документа (от начала загрузки, как
      // performance.now): их не подменяют поддельные часы проверок (у Playwright performance.now не начинается заново на
      // следующей странице), и считают они время, пока страница рисовалась, — а запасной CSS виден только тогда
      // BOOT — когда это считалось (для панели замеров, PTPerf.boot; TASK-hud2.md, 2)
      var BOOT = performance.now(), LATE = root.classList.contains('pt-boot') && (function () { var t = document.timeline && document.timeline.currentTime; return typeof t === 'number' ? t : performance.now(); })() > 3800;
      var MODE = (function () {
        var q = /[?&]intro=(full|fast|instant)(?:&|$)/.exec(location.search);
        if (rm) return 'rm';
        // явный ?intro=full|fast перебивает LATE (TASK-hud2.md, 3): на медленной загрузке вступление можно посмотреть
        // принудительно — для проверок; без флага поздние скрипты, как раньше, дают «сразу»
        if (q) return q[1];
        if (LATE) return 'instant';
        // повторный заход — быстрая сборка (просьба владельца: «очень сильно упростить и ускорить»); первый — полная
        if (!AUTO_MODE) return REPEAT ? 'fast' : 'full';
        try {
          var seen = JSON.parse(sessionStorage.getItem('pt-seen') || '[]');
          if (seen.indexOf(PAGE) >= 0) return 'instant';
          var t = +localStorage.getItem('pt-intro') || 0;
          if (t && Date.now() - t < 30 * 864e5) return 'fast';
          localStorage.setItem('pt-intro', String(Date.now()));
        } catch (e) { /* хранилище запрещено — полная сборка */ }
        return 'full';
      })();
      root.setAttribute('data-intro', MODE);
      // Повторный заход: первый экран — быстрая сборка (runHeroFast: без вспышки и двух линий, один луч, H1 читается к ~0.4 с),
      // секции ниже — в темпе ×REPEAT_K (~0.47 с вместо ~0.78). Раньше повторный заход был той же полной сборкой ×0.75.
      // ?intro=… — без ускорения, чтобы проверки шли в одном темпе. «Пересобрать блок» (PRESENT_K) — прежний.
      // Выше этой строки от SEC_K зависит только runK — пересчитан.
      var REPEAT_K = 0.6;
      if (REPEAT && !AUTO_MODE && MODE === 'fast' && !/[?&]intro=/.test(location.search)) { SEC_K *= REPEAT_K; runK = SEC_K; root.setAttribute('data-repeat', ''); }

      function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
      function tr(s) { return window.PTI18N ? window.PTI18N.t(s) : s; }
      // разряды — неразрывным пробелом, как toLocaleString('ru-RU'), но без него: первый вызов поднимает ICU (~0.1 с на
      // слабом телефоне, прямо на старте сборки)
      function fmtN() { return String(N).replace(/\B(?=(\d{3})+(?!\d))/g, '\u00A0'); }
      function parseColor(s) { var m = /rgba?\(([^)]+)\)/.exec(s || ''); if (!m) return COL.accent; var p = m[1].split(',').map(parseFloat); if (p.length > 3 && p[3] < 0.05) return COL.accent; return [p[0] | 0, p[1] | 0, p[2] | 0]; }
      function typeLabel(s) {
        if (!stepEl) return;
        clearInterval(typeT);
        if (rm) { stepEl.textContent = s; return; }
        var n = 0; stepEl.textContent = '';
        typeT = setInterval(function () { n++; stepEl.textContent = s.slice(0, n) + (n < s.length ? '_' : ''); if (n >= s.length) clearInterval(typeT); }, 16);
      }
      function log(s, t) { typeLabel(s.name + ' · ' + t); }
      function setProg() {
        var d = 0; secs.forEach(function (s) { if (s.state === 'done') d++; });
        if (progEl) progEl.style.transform = 'scaleX(' + (d / secs.length).toFixed(3) + ')';
        if (pultEl) pultEl.style.setProperty('--prog', (d / secs.length).toFixed(3));   // кольцо свёрнутой кнопки
      }
      // Пульт. Первая сборка — плашка с логом шагов по центру, это часть шоу. Через 2 с после того, как всё собрано,
      // она сворачивается в кнопку ↻ в левом нижнем углу (CSS: .is-left, .is-mini). «Пересобрать блок» снова её
      // разворачивает, после пересборки она сворачивается. Сборка секций при прокрутке пульт не разворачивает.
      // свернуть (true) — кнопка ↻ слева внизу; открыть (false) — плашка с логом над свёрнутой кнопкой (.is-open)
      // roll — первое сворачивание (pultLater, pultSkip): плашка не исчезает, а укатывается кнопкой в угол (rollPult)
      var pultRoll = null;
      function pultMini(v, roll) {
        if (!pultEl) return;
        if (pultRoll) { var pr = pultRoll; pultRoll = null; pr(); }
        if (v) {
          if (roll && !rm && pultEl.animate && !pultEl.classList.contains('is-mini')) { rollPult(); return; }
          pultEl.classList.add('is-left', 'is-mini'); pultEl.classList.remove('is-open');
        }
        else if (pultEl.classList.contains('is-mini')) pultEl.classList.add('is-open');
      }
      // Одно движение (TASK-clarity.md, B5): текст плашки гаснет, плашка сжимается к центру в круг 44 px (200 мс); пульт
      // встаёт свёрнутым в угол, и кнопка катится туда от центра плашки, как колесо радиусом 22 px (700 мс): сдвиг
      // translateX(dx) → 0 и поворот dx / 22 рад → 0 — влево против часовой; ↻ и кольцо крутятся вместе с кнопкой.
      // Повторная сборка разворачивает пульт как раньше, без качения. Прервали (↻, пересборка) — сразу в итог
      function rollPult() {
        var bar = pultEl.querySelector('.pult-bar'), mini = pultEl.querySelector('.pult-mini'), anims = [], t = 0;
        function fold() { pultEl.classList.add('is-left', 'is-mini'); pultEl.classList.remove('is-open'); }
        function end() { clearTimeout(t); anims.forEach(function (a) { a.cancel(); }); anims = []; }
        if (!bar || !mini) { fold(); return; }
        var br = bar.getBoundingClientRect(), cx = br.left + br.width / 2, sx = Math.max(0, br.width / 2 - 22), sy = Math.max(0, (br.height - 44) / 2);
        anims.push(bar.animate([{ clipPath: 'inset(0px 0px round 999px)' }, { clipPath: 'inset(' + sy.toFixed(1) + 'px ' + sx.toFixed(1) + 'px round 999px)' }], { duration: 200, easing: 'ease-in', fill: 'forwards' }));
        Array.prototype.forEach.call(bar.children, function (k) { anims.push(k.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 140, easing: 'ease-in', fill: 'forwards' })); });
        pultRoll = function () { end(); fold(); };
        t = setTimeout(function () {
          end(); fold();
          var mr = mini.getBoundingClientRect(), dx = cx - (mr.left + mr.width / 2), ez = 'cubic-bezier(.25,.8,.25,1)';
          anims = [pultEl.animate([{ transform: 'translateX(' + dx.toFixed(1) + 'px)' }, { transform: 'none' }], { duration: 700, easing: ez }),
            mini.animate([{ transform: 'rotate(' + (dx / 22 * 57.3).toFixed(1) + 'deg)' }, { transform: 'rotate(0deg)' }], { duration: 700, easing: ez })];
          pultRoll = end;
          t = setTimeout(function () { if (pultRoll === end) pultRoll = null; anims = []; }, 720);
        }, 200);
      }
      // Через 2 с свернуть. После первой сборки первого экрана — сразу, даже если секции ждут в очереди (их первая
      // сборка видна только кольцом на кнопке). После «Пересобрать блок» — когда пересборка закончится.
      function pultLater() {
        clearTimeout(pultT);
        pultT = setTimeout(function () { if (!alive) return; if (replaying && (running || queue.length)) { pultLater(); return; } replaying = false; pultShown = true; pultMini(true, true); }, 2000);
      }
      // первый экран собран без показа (перезагрузка в середине страницы) — пульт сразу свёрнут
      // still — без качения: быстрая сборка повторного захода сворачивает пульт сразу, катить его на каждом переходе незачем
      function pultSkip(still) { if (!pultShown && !replaying) { pultShown = true; clearTimeout(pultT); pultMini(true, !still); } }
      function at(sec, fn) { timers.push(setTimeout(function () { if (alive) fn(); }, Math.max(0, sec) * 1000)); }
      // Положение корня. getBoundingClientRect заставляет браузер досчитать стили и раскладку, если их что-то сбило, — в
      // кадре это лишний пересчёт всей страницы (на слабом телефоне — заметная доля кадра). Полный замер — на стадиях,
      // старте и ресайзе; в кадре — от прокрутки (rootFast): корень стоит в начале документа, его место в документе
      // (rootDoc) меняется только вместе с раскладкой
      var rootDoc = 0;
      function rootRect() { var r = root.getBoundingClientRect(); rootLeft = r.left; rootTop = r.top; rootDoc = r.top + (window.scrollY || 0); return r; }
      function rootFast() { rootTop = rootDoc - (window.scrollY || 0); }
      // .obj-go — объект первого экрана запущен до s-done (холсты видны раньше, site.css); снимается с готовой или погашенной секцией
      // .pt-wait — секция ещё ни разу не собиралась (CSS её обрезает, браузер её не рисует); снимается первой стадией навсегда:
      // «Собрать заново» и смена языка снимают стадии (null), но гаснуть секция должна переходами, как раньше
      function setStage(s, st) { var c = s.el.classList; c.remove('s-wire', 's-skel', 's-text', 's-done'); if (st) { c.add('s-' + st); c.remove('pt-wait'); } if (st !== 'skel' && st !== 'text') c.remove('obj-go'); }
      function markText() {
        secs.forEach(function (s) {
          var tw = document.createTreeWalker(s.el, NodeFilter.SHOW_TEXT, null), n;
          while ((n = tw.nextNode())) {
            if (!n.nodeValue.trim()) continue;
            var pe = n.parentElement;
            if (!pe || pe.closest('[data-pt-skip]')) continue;
            pe.classList.add('ptx');
          }
        });
      }
      function updateSizes(el) {
        // размер — в атрибут (CSS выводит его в ::after): служебная подпись не становится текстом страницы. Сначала все
        // замеры, потом все записи: запись атрибута сбивает раскладку, и чередование «замер, запись» пересчитывало всю
        // страницу на каждом блоке
        var w = [];
        Array.prototype.forEach.call(el.querySelectorAll('[data-blk]'), function (b) {
          var t = b.querySelector('[data-wf-size]'); if (t) w.push([t, Math.round(b.offsetWidth) + '×' + Math.round(b.offsetHeight)]);
        });
        w.forEach(function (x) { if (x[0].getAttribute('data-wf-size') !== x[1]) x[0].setAttribute('data-wf-size', x[1]); });
      }
      function collectWords(el) {
        var out = [], tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null), n, rg = document.createRange(), cache = new Map();
        while ((n = tw.nextNode())) {
          var v = n.nodeValue; if (!v.trim()) continue;
          var pe = n.parentElement; if (!pe || pe.closest('[data-pt-skip]')) continue;
          var st = cache.get(pe);
          if (!st) {
            var cs = window.getComputedStyle(pe);
            var gEl = pe.closest('[data-grad]');
            st = { font: cs.fontStyle + ' ' + cs.fontWeight + ' ' + cs.fontSize + ' ' + cs.fontFamily, fs: parseFloat(cs.fontSize) || 16, ls: parseFloat(cs.letterSpacing) || 0, up: cs.textTransform === 'uppercase', col: parseColor(cs.color), grad: gEl ? gEl.getAttribute('data-grad').split(',') : null };
            cache.set(pe, st);
          }
          var re = /\S+/g, m;
          while ((m = re.exec(v))) {
            rg.setStart(n, m.index); rg.setEnd(n, m.index + m[0].length);
            var r = rg.getBoundingClientRect();
            if (r.width < 1 || r.height < 1) continue;
            out.push({ x: r.left - rootLeft, y: r.top - rootTop, w: r.width, h: r.height, t: st.up ? m[0].toUpperCase() : m[0], st: st });
          }
        }
        return out;
      }
      function makeLines(words) {
        var ws = words.slice().sort(function (a, b) { return Math.abs(a.y - b.y) < 3 ? a.x - b.x : a.y - b.y; });
        var L = [], cu = null;
        ws.forEach(function (w) {
          if (cu && Math.abs(w.y - cu.y) < 3 && w.x - cu.x2 < w.st.fs * 1.4 && w.x >= cu.x1 - 2) { cu.x2 = Math.max(cu.x2, w.x + w.w); cu.h = Math.max(cu.h, w.h); }
          else { cu = { x1: w.x, x2: w.x + w.w, y: w.y, h: w.h, fs: w.st.fs }; L.push(cu); }
        });
        return L.map(function (l) { return { x: l.x1, w: l.x2 - l.x1, cy: l.y + l.h * 0.56, bh: Math.max(3, l.fs * 0.4) }; });
      }
      // растр букв частями (prefetch): склейка частей — как один растр
      function catGl(parts) {
        function cat(key) {
          var n = 0; parts.forEach(function (p) { n += p[key].n; });
          var o = { n: n, x: new Float32Array(n), y: new Float32Array(n), r: new Uint8Array(n), g: new Uint8Array(n), b: new Uint8Array(n) }, at = 0;
          parts.forEach(function (p) { var q = p[key]; ['x', 'y', 'r', 'g', 'b'].forEach(function (f) { o[f].set(q[f], at); }); at += q.n; });
          return o;
        }
        var B = cat('big'), S = cat('small');
        return { n: B.n + S.n, big: B, small: S };
      }
      function glyphs(words) {
        var big = [], small = [];
        words.forEach(function (w) { (w.st.fs >= 30 ? big : small).push(w); });
        // Слова рисуются не на месте (холст размером со всю секцию почти пустой: дорого выделять, читать и
        // перебирать), а плотно, «полками», в компактный атлас. Каждая найденная точка переносится обратно
        // в координаты своего слова на странице. Запас px — под курсивный вынос.
        // Перебор пикселей — по 32-битным словам (альфа — старший байт), точки — сразу в типизированные массивы размером
        // с верхнюю оценку: без push в обычные массивы и копии в конце. Тот же набор точек вдвое-втрое быстрее — растр
        // считается на стадии текста первого экрана, и на слабом телефоне он давал рывок
        function pass(ws, step) {
          if (!ws.length) return { n: 0, x: new Float32Array(0), y: new Float32Array(0), r: new Uint8Array(0), g: new Uint8Array(0), b: new Uint8Array(0) };
          var AW = 1024, gap = 4, cx = 0, cy = 0, shelf = 0, cells = [];
          ws.forEach(function (wd) { AW = Math.max(AW, Math.ceil(wd.w + 4 + wd.st.fs * 0.3) + 4); });
          ws.forEach(function (wd) {
            var px = 2 + Math.ceil(wd.st.fs * 0.15), bw = Math.ceil(wd.w + px * 2), bh = Math.ceil(wd.h + 4);
            if (cx + bw > AW) { cx = 0; cy += shelf + gap; shelf = 0; }
            cells.push({ wd: wd, ax: cx, ay: cy, px: px, bw: bw, bh: bh });
            cx += bw + gap; shelf = Math.max(shelf, bh);
          });
          var w = AW, h = cy + shelf;
          oc.width = w; oc.height = h;
          og.setTransform(1, 0, 0, 1, 0, 0); og.clearRect(0, 0, w, h);
          var nat = 'letterSpacing' in og;
          cells.forEach(function (cl) {
            var wd = cl.wd, st = wd.st; og.font = st.font;
            if (nat) og.letterSpacing = st.ls + 'px';
            var mt = og.measureText(wd.t), asc = mt.fontBoundingBoxAscent, des = mt.fontBoundingBoxDescent, by, bx = cl.ax + cl.px;
            if (st.grad) { var lg = og.createLinearGradient(bx, 0, bx + wd.w, 0); st.grad.forEach(function (gc, gi) { lg.addColorStop(gi / Math.max(1, st.grad.length - 1), gc); }); og.fillStyle = lg; }
            else og.fillStyle = 'rgb(' + st.col[0] + ',' + st.col[1] + ',' + st.col[2] + ')';
            if (asc) { og.textBaseline = 'alphabetic'; by = cl.ay + 2 + (wd.h - (asc + des)) / 2 + asc; }
            else { og.textBaseline = 'middle'; by = cl.ay + 2 + wd.h / 2; }
            if (nat || !st.ls) og.fillText(wd.t, bx, by);
            else { for (var ci = 0; ci < wd.t.length; ci++) { og.fillText(wd.t[ci], bx, by); bx += og.measureText(wd.t[ci]).width + st.ls; } }
          });
          var d = og.getImageData(0, 0, w, h).data, d32 = new Uint32Array(d.buffer, d.byteOffset, d.length >> 2), cap = 0, n = 0;
          cells.forEach(function (cl) { cap += Math.ceil(cl.bw / step) * Math.ceil(cl.bh / step); });
          var X = new Float32Array(cap), Y = new Float32Array(cap), R = new Uint8Array(cap), G = new Uint8Array(cap), B = new Uint8Array(cap);
          cells.forEach(function (cl) {
            var ox = cl.wd.x - cl.px - cl.ax, oy = cl.wd.y - 2 - cl.ay, xe = Math.min(w, cl.ax + cl.bw), ye = Math.min(h, cl.ay + cl.bh);
            for (var y = cl.ay; y < ye; y += step) {
              var row = y * w;
              for (var x = cl.ax; x < xe; x += step) {
                var q = row + x;
                if ((d32[q] >>> 24) > 110) { var k = q << 2; X[n] = ox + x + Math.random() * step; Y[n] = oy + y + Math.random() * step; R[n] = d[k]; G[n] = d[k + 1]; B[n] = d[k + 2]; n++; }
              }
            }
          });
          return { n: n, x: X.subarray(0, n), y: Y.subarray(0, n), r: R.subarray(0, n), g: G.subarray(0, n), b: B.subarray(0, n) };
        }
        var B = pass(big, 2), S = pass(small, 1);
        return { n: B.n + S.n, big: B, small: S };
      }
      function frameRects(el) {
        var out = [];
        Array.prototype.forEach.call(el.querySelectorAll('.fr'), function (f) {
          var r = f.getBoundingClientRect(); if (r.width < 2 || r.height < 1) return;
          var cs = window.getComputedStyle(f), rad = parseFloat(cs.borderTopLeftRadius) || 0;
          out.push({ x: r.left - rootLeft, y: r.top - rootTop, w: r.width, h: r.height, r: Math.min(rad, r.width / 2, r.height / 2), line: f.getAttribute('data-fr-line'), c: f.getAttribute('data-fr-color') === 'accent' ? COL.accent : COL.glass });
        });
        return out;
      }
      function blockRects(el) {
        var out = [];
        Array.prototype.forEach.call(el.querySelectorAll('[data-blk]'), function (b) {
          var r = b.getBoundingClientRect(); if (r.width < 2 || r.height < 2) return;
          out.push({ x: r.left - rootLeft - 8, y: r.top - rootTop - 8, w: r.width + 16, h: r.height + 16, r: 10, c: COL.glass });
        });
        return out;
      }
      // Замер дорогой (Range по словам + растр букв), а раскладка между стадиями не меняется.
      // Поэтому геометрия кэшируется и пересчитывается только при ресайзе, догрузке шрифтов или сдвиге секции.
      function measure(s) {
        rootRect();
        var br = s.el.getBoundingClientRect();
        var key = [layoutGen, W, Math.round(br.width), Math.round(br.height), Math.round(br.top - rootTop), document.fonts ? document.fonts.status : ''].join('|');
        if (s.geo && s.geoKey === key) return;
        var words = collectWords(s.el);
        s.geo = { box: { x: 0, y: br.top - rootTop, w: W, h: Math.max(1, br.height) }, blocks: blockRects(s.el), frames: frameRects(s.el), lines: makeLines(words), gl: null, words: words };
        s.geoKey = key;
        updateSizes(s.el);
      }
      // Растр букв — самая дорогая часть замера, а нужен он только стадии «буквы» (phText). Поэтому он считается
      // лениво и один раз на геометрию. Раньше он пересчитывался уже на стадии сетки первого экрана (после догрузки
      // шрифтов кэш сбрасывается) и давал заметный рывок.
      // растр букв: начатый заранее (prefetch, glAhead) — досчитать остаток, а не начинать заново (части склеивает catGl, растр
      // тот же, что целиком)
      function ensureGl(s) {
        if (!s.geo || s.geo.gl) return;
        var job = s.prep, ws = s.geo.words;
        if (job && job.geo === s.geo && job.parts.length) { if (job.i < ws.length) job.parts.push(glyphs(ws.slice(job.i))); s.geo.gl = catGl(job.parts); }
        else s.geo.gl = glyphs(ws);
        s.prep = null;
      }
      // Замер и растр букв секции — заранее, пока она в полутора экранах ниже (IntersectionObserver), в простое браузера и
      // частями по словам: на стадии букв растр уже готов, и сборка не дёргается (растр — до 40 мс на слабом устройстве, замер
      // — до 10). Геометрия та же: кэш по layoutGen, ширине, месту секции в документе и шрифтам. Не успели — ensureGl посчитает
      // сразу, как раньше. Часть — слова на ~6 мс, между частями браузер рисует кадры
      var ric = window.requestIdleCallback ? function (fn) { return window.requestIdleCallback(fn, { timeout: 600 }); } : function (fn) { return setTimeout(function () { fn({ timeRemaining: function () { return 8; }, didTimeout: true }); }, 30); };
      function prefetchNear() { preOn = true; near.forEach(function (s) { prefetch(s); prepScenes(s); }); }
      // Сцены секции (демо-сайты, схемы) — подготовить заранее, по одной за простой (sc.prep: контекст, размер холста, замер
      // текста и раскладка): их первое пробуждение в кадре проявления секции было самым долгим кадром сборки «Работ» на телефоне
      // (×6: 76 мс, из них ~25 — первый замер текста шрифтами сцены). Картинка та же: пробуждение берёт готовое
      var prepped = [];
      function prepScenes(s) {
        if (rm) return;
        var list = scenes.filter(function (sc) { return sc.prep && prepped.indexOf(sc) < 0 && s.el.contains(sc.cv) && !sc.cv.closest('[data-cp]'); });
        prepped.push.apply(prepped, list);
        (function one() { var sc = list.shift(); if (sc) ric(function () { if (alive && (s.state === 'idle' || s.state === 'queued')) sc.prep(); one(); }); })();
      }
      // Растр букв первого экрана — заранее, со стадии сетки, а не целиком в переходе к стадии текста: там это была самая
      // долгая задача вступления (на слабом телефоне ~75 мс). Частями по 4 слова: в простое между кадрами (requestIdleCallback
      // без таймаута) и в конце кадра движка, пока у кадра есть запас (frame → glTick; не меньше одной части за кадр — на
      // компьютере кадры вступления заняты объектом «Кодекса», простоя нет). Не успел — ensureGl досчитает остаток. Картинка та
      // же: точки растра и так каждый раз случайно сдвинуты в пределах шага сетки; раскладка сменилась (догрузились шрифты) —
      // начатое бросаем
      var glJob = null;
      function glAhead(s) {
        if (rm || !s.geo || s.geo.gl || s.prep) return;
        glJob = s.prep = { s: s, geo: s.geo, parts: [], i: 0 };
        if (window.requestIdleCallback) window.requestIdleCallback(function idle(dl) { if (glJob && glTick(performance.now() + dl.timeRemaining() - 3, false)) window.requestIdleCallback(idle); });
      }
      // части растра до момента end; once — хотя бы одна часть. true — ещё не всё
      function glTick(end, once) {
        var job = glJob; if (!job || !alive) return false;
        var s = job.s, geo = job.geo, ws = geo.words;
        if (s.prep !== job || s.geo !== geo || geo.gl) { if (s.prep === job) s.prep = null; glJob = null; return false; }
        // свободное время кадра — по 4 слова; кадр и так тяжёлый — обязательная часть поменьше, 2 слова
        while (job.i < ws.length && (once || performance.now() < end)) { var part = ws.slice(job.i, job.i + (once && performance.now() >= end ? 2 : 4)); once = false; job.i += part.length; job.parts.push(glyphs(part)); }
        if (job.i < ws.length) return true;
        geo.gl = catGl(job.parts); s.prep = null; glJob = null; return false;
      }
      function prefetch(s) {
        if (rm || s === hero || (s.state !== 'idle' && s.state !== 'queued') || s.prep || (s.geo && s.geo.gl)) return;
        var job = s.prep = { parts: [], i: 0 };
        ric(function step(dl) {
          if (s.prep !== job || (s.state !== 'idle' && s.state !== 'queued')) { if (s.prep === job) s.prep = null; return; }
          if (!job.geo) { measure(s); job.geo = s.geo; if (job.geo.gl) { s.prep = null; return; } if (dl.timeRemaining() < 4) { ric(step); return; } }
          if (s.geo !== job.geo) { s.prep = null; return; }   // раскладка сменилась — посчитает сборка
          var ws = job.geo.words, t0 = performance.now();
          while (job.i < ws.length && (performance.now() - t0 < 6 || dl.didTimeout && performance.now() - t0 < 10)) {
            var part = ws.slice(job.i, job.i + 24); job.i += part.length;
            job.parts.push(glyphs(part));
          }
          if (job.i < ws.length) { ric(step); return; }
          job.geo.gl = catGl(job.parts); s.prep = null;
        });
      }
      function perLen(f) { if (f.line === 'top') return f.w; var r = f.r; return 2 * Math.max(0, f.w - 2 * r) + 2 * Math.max(0, f.h - 2 * r) + 2 * Math.PI * r; }
      function chooser(list, wf) { var cum = [], s = 0; list.forEach(function (it) { s += wf(it); cum.push(s); }); return function () { var v = Math.random() * s, lo = 0, hi = cum.length - 1; while (lo < hi) { var mid = (lo + hi) >> 1; if (cum[mid] < v) lo = mid + 1; else hi = mid; } return list[lo]; }; }
      function rrPoint(f, o) {
        if (f.line === 'top') { o.x = f.x + Math.random() * f.w; o.y = f.y + (Math.random() - 0.5) * 0.8; return; }
        var r = f.r, sw = Math.max(0, f.w - 2 * r), sh = Math.max(0, f.h - 2 * r), ar = Math.PI * r / 2, t = Math.random() * (2 * sw + 2 * sh + 4 * ar), x, y, a;
        if (t < sw) { x = f.x + r + t; y = f.y; }
        else if ((t -= sw) < ar) { a = -Math.PI / 2 + t / r; x = f.x + f.w - r + Math.cos(a) * r; y = f.y + r + Math.sin(a) * r; }
        else if ((t -= ar) < sh) { x = f.x + f.w; y = f.y + r + t; }
        else if ((t -= sh) < ar) { a = t / r; x = f.x + f.w - r + Math.cos(a) * r; y = f.y + f.h - r + Math.sin(a) * r; }
        else if ((t -= ar) < sw) { x = f.x + f.w - r - t; y = f.y + f.h; }
        else if ((t -= sw) < ar) { a = Math.PI / 2 + t / r; x = f.x + r + Math.cos(a) * r; y = f.y + f.h - r + Math.sin(a) * r; }
        else if ((t -= ar) < sh) { x = f.x; y = f.y + f.h - r - t; }
        else { t -= sh; a = Math.PI + t / Math.max(r, 0.001); x = f.x + r + Math.cos(a) * r; y = f.y + r + Math.sin(a) * r; }
        o.x = x + (Math.random() - 0.5) * 1.1; o.y = y + (Math.random() - 0.5) * 1.1;
      }
      function setC(o, c) { o.r = c[0]; o.g = c[1]; o.b = c[2]; }
      function calmZones() {
        if (calmGen === layoutGen) return calm;
        calmGen = layoutGen;
        var rl = root.getBoundingClientRect(), rg = document.createRange(), cz = [];
        function add(r, pad) { if (r.width > 0 && r.height > 0) cz.push(r.left - rl.left - pad, r.top - rl.top - pad, r.right - rl.left + pad, r.bottom - rl.top + pad); }
        calmEls.forEach(function (b) {
          var tw = document.createTreeWalker(b, NodeFilter.SHOW_TEXT), t;
          while ((t = tw.nextNode())) { if (!/\S/.test(t.nodeValue)) continue; rg.selectNodeContents(t); Array.prototype.forEach.call(rg.getClientRects(), function (r) { add(r, 2); }); }
        });
        calmBox.forEach(function (b) { add(b.getBoundingClientRect(), 6); });
        calm = new Float64Array(cz); calmB[0] = 1e9; calmB[1] = 1e9; calmB[2] = -1e9; calmB[3] = -1e9;
        for (var k = 0; k < calm.length; k += 4) { calmB[0] = Math.min(calmB[0], calm[k]); calmB[1] = Math.min(calmB[1], calm[k + 1]); calmB[2] = Math.max(calmB[2], calm[k + 2]); calmB[3] = Math.max(calmB[3], calm[k + 3]); }
        return calm;
      }
      function inCalm(x, y) {
        if (x < calmB[0] || x > calmB[2] || y < calmB[1] || y > calmB[3]) return false;
        for (var k = 0; k < calm.length; k += 4) if (x > calm[k] && x < calm[k + 2] && y > calm[k + 1] && y < calm[k + 3]) return true;
        return false;
      }
      function gAmbient(o) {
        var z = hero.state === 'done' && calmZones().length;
        for (var t = 0; t < 8; t++) { o.x = Math.random() * W; o.y = -rootTop + Math.random() * VH; if (!z || !inCalm(o.x, o.y)) break; }
        setC(o, Math.random() < 0.07 ? COL.accent : DUST[(Math.random() * DUST.length) | 0]);
        o.a = 0.38; o.s = 1.8 + Math.random() * 1.6; o.m = 1;
      }
      function gFrames(list, a, s) { var ch = chooser(list, perLen); return function (o) { var f = ch(); rrPoint(f, o); setC(o, f.c); o.a = a; o.s = s; o.m = 0; }; }
      function gBlocks(list) { var ch = chooser(list, perLen); return function (o) { rrPoint(ch(), o); setC(o, COL.glass); o.a = 0.42; o.s = 1.35; o.m = 0; }; }
      function gLines(list) { var ch = chooser(list, function (l) { return l.w * l.bh; }); return function (o) { var l = ch(); o.x = l.x + Math.random() * l.w; o.y = l.cy + (Math.random() - 0.5) * l.bh; setC(o, COL.skel); o.a = 0.75; o.s = 1.5; o.m = 0; }; }
      function gGlyph(G, a) {
        var pb = !G.small.n ? 1 : (!G.big.n ? 0 : clamp(G.big.n / G.n * 1.6, 0.35, 0.62));
        return function (o) {
          var bigOne = Math.random() < pb, g = bigOne ? G.big : G.small, k = (Math.random() * g.n) | 0;
          o.x = g.x[k] + (Math.random() - 0.5) * 0.5; o.y = g.y[k] + (Math.random() - 0.5) * 0.5; o.r = g.r[k]; o.g = g.g[k]; o.b = g.b[k];
          o.a = a; o.s = bigOne ? (mob ? 1.5 : 1.45) : (mob ? 1.3 : 1.15); o.m = 0;
        };
      }
      var tmp = { x: 0, y: 0, r: 0, g: 0, b: 0, a: 1, s: 1.3, m: 0 };
      // Новые цели частиц. opt.part (стадии обычных секций, sweep) — по частям: треть сразу, остальное — по трети в
      // следующих кадрах (fillJob, frame). Раскладка 25 000 целей — до 35 мс на слабом устройстве, и она совпадала с
      // пересчётом стилей стадии в одном кадре. Время смены цели у всех частиц считается от одного момента (job.now), как
      // если бы раскладка шла целиком: частица из поздней части сменит цель на кадр-два позже — на глаз не видно. Всё, что
      // трогает цели (новая раскладка, гашение, финал, взрыв, мгновенная сборка, смена языка), сначала доводит отложенное
      // (flushFill), поэтому порядок событий прежний. Первый экран, смена языка и мгновенные стадии — целиком, как раньше.
      // TASK-perf.md, 3.2: часть, которая не помещается в FILL_MS, дорабатывает в следующих кадрах (раньше — ровно по трети:
      // на слабом устройстве треть 25 000 целей не помещалась в кадр). opt — всегда одной формы (fopt), job — тоже: объекты
      // разной формы деоптимизировали fillRun («wrong map»)
      var fillJob = null, FILL_MS = 4, FILL_CHUNK = 1500;
      function fopt(instant, axis, y0, h, spread, rnd, part) { return { instant: !!instant, axis: axis, y0: y0 || 0, h: h || 1, spread: spread || 0, rnd: rnd || 0, part: !!part }; }
      function flushFill() { var j = fillJob; if (j) { fillJob = null; fillRun(j, j.idx.length); } }
      function fillSlice(job, until) {
        do fillRun(job, FILL_CHUNK); while (job.k < job.idx.length && performance.now() < until);
        if (job.k >= job.idx.length) { if (fillJob === job) fillJob = null; } else fillJob = job;
      }
      function fill(idx, gens, opt) {
        flushFill();
        var tot = 0, cum = [];
        gens.forEach(function (g) { tot += g.w; cum.push(tot); });
        var job = { idx: idx, gens: gens, cum: cum, tot: tot, opt: opt, now: performance.now(), k: 0 };
        if (!opt.part || opt.instant || rm) { fillRun(job, idx.length); return; }
        fillSlice(job, job.now + FILL_MS);
      }
      function fillRun(job, cnt) {
        var idx = job.idx, gens = job.gens, cum = job.cum, tot = job.tot, opt = job.opt, now = job.now, end = Math.min(idx.length, job.k + cnt);
        for (var k = job.k; k < end; k++) {
          var i = idx[k], v = Math.random() * tot, gi = 0;
          while (gi < cum.length - 1 && v > cum[gi]) gi++;
          gens[gi].f(tmp);
          var p = i * 2, c = i * 3;
          NT[p] = tmp.x; NT[p + 1] = tmp.y; NC[c] = tmp.r / 255; NC[c + 1] = tmp.g / 255; NC[c + 2] = tmp.b / 255;
          NA[i] = tmp.a; NS[i] = tmp.s; NM[i] = tmp.m; TP[i] = 0;
          var d = 0;
          if (!opt.instant) {
            var u = opt.axis === 'x' ? tmp.x / Math.max(1, W) : (tmp.y - opt.y0) / Math.max(1, opt.h);
            d = clamp(u, 0, 1) * (opt.spread || 0) + Math.random() * (opt.rnd || 0);
          }
          SW[i] = now + d * 1000;
        }
        job.k = end;
      }
      function sweep(s, inst, spread) {
        if (s === hero && heroSweep) return heroSweep.axis === 'x' ? fopt(inst, 'x', 0, 1, heroSweep.spread, 0.06, false) : fopt(inst, 'y', -rootTop, VH, heroSweep.spread, 0.06, false);
        return s === hero ? fopt(inst, 'x', 0, 1, spread * 0.8, 0.1, false) : fopt(inst, 'y', s.geo.box.y, Math.min(s.geo.box.h, VH * 1.4), spread * runK, 0.12 * runK, true); }
      function phGrid(s, idx, inst) {
        var cols = [];
        Array.prototype.forEach.call(root.querySelectorAll('.pt-col'), function (el) { var r = el.getBoundingClientRect(); if (r.width > 0) cols.push(r.left - rootLeft, r.right - rootLeft); });
        Array.prototype.forEach.call(root.querySelectorAll('.pt-edge'), function (el) { var r = el.getBoundingClientRect(); if (r.left - rootLeft > 2 && r.left - rootLeft < W - 2) cols.push(r.left - rootLeft); });
        if (!cols.length) cols = [0, W];
        var y0 = s.geo.box.y, hh = Math.min(s.geo.box.h, VH);
        fill(idx, [{ w: 1, f: function (o) { o.x = cols[(Math.random() * cols.length) | 0] + (Math.random() - 0.5) * 1.2; o.y = y0 + Math.random() * hh; setC(o, Math.random() < 0.6 ? COL.glass : DUST[(Math.random() * DUST.length) | 0]); o.a = 0.55; o.s = 1.5; o.m = 0; } }], fopt(inst, 'y', y0, hh, 0.35, 0.12, false));
        cur = { s: s, f: phGrid, idx: idx };
      }
      function phWire(s, idx, inst) {
        var g = s.geo, gens = [];
        if (g.blocks.length) gens.push({ w: 0.55, f: gBlocks(g.blocks) });
        if (g.frames.length) gens.push({ w: 0.45, f: gFrames(g.frames, 0.55, 1.35) });
        if (!gens.length) gens.push({ w: 1, f: gAmbient });
        fill(idx, gens, sweep(s, inst, 0.35));
        cur = { s: s, f: phWire, idx: idx };
      }
      function phSkel(s, idx, inst) {
        var g = s.geo, gens = [];
        if (g.lines.length) gens.push({ w: 0.6, f: gLines(g.lines) });
        if (g.frames.length) gens.push({ w: 0.4, f: gFrames(g.frames, 0.62, 1.4) });
        if (!gens.length) gens.push({ w: 1, f: gAmbient });
        fill(idx, gens, sweep(s, inst, 0.3));
        cur = { s: s, f: phSkel, idx: idx };
      }
      function phText(s, idx, inst) {
        ensureGl(s);
        var g = s.geo, gens = [];
        if (g.gl && g.gl.n) gens.push({ w: 0.88, f: gGlyph(g.gl, 0.82) });
        if (g.frames.length) gens.push({ w: 0.12, f: gFrames(g.frames, 0.55, 1.3) });
        if (!gens.length) gens.push({ w: 1, f: gAmbient });
        fill(idx, gens, sweep(s, inst, 0.3));
        cur = { s: s, f: phText, idx: idx };
      }
      function phFade(idx) {
        flushFill();
        var now = performance.now();
        for (var k = 0; k < idx.length; k++) {
          var i = idx[k], p = i * 2, c = i * 3;
          if (SW[i]) { T[p] = NT[p]; T[p + 1] = NT[p + 1]; CT[c] = NC[c]; CT[c + 1] = NC[c + 1]; CT[c + 2] = NC[c + 2]; SZ[i] = NS[i]; M[i] = NM[i]; }
          NT[p] = T[p]; NT[p + 1] = T[p + 1]; NC[c] = CT[c]; NC[c + 1] = CT[c + 1]; NC[c + 2] = CT[c + 2]; NS[i] = SZ[i]; NM[i] = M[i]; NA[i] = 0;
          SW[i] = now + Math.random() * 500;
        }
        cur = null;
      }
      function phAmbient(idx, inst) {
        fill(idx, [{ w: 1, f: function (o) { gAmbient(o); o.m = 0; o.a = 0; } }], fopt(inst, 'x', 0, 1, 0, inst ? 0 : 0.5, false));
        at(inst ? 0 : 1.6, function () { if (running) return; flushFill(); for (var k = 0; k < idx.length; k++) { var i = idx[k]; if (SW[i]) NM[i] = 1; else M[i] = 1; } });
      }
      // Тихий финал сборки — у всех секций, кроме подвала: частицы догасают на месте, а уже невидимыми переезжают в случайные
      // точки экрана (TP — телепорт при переключении) и ждут следующей сборки. Видимая пыль — свой запас AMB (dustSet).
      // Частицы сборки после финала невидимы (видимая пыль — свой запас AMB), поэтому им нужна только случайная точка экрана:
      // цвет и размер им задаст следующая сборка. Раньше здесь для каждой из 25 000 частиц подбиралась точка пыли с обходом
      // текста первого экрана (gAmbient, до 8 попыток) — до 60 мс на слабом устройстве в финале каждой секции
      function phSettle(idx) {
        flushFill();
        var now = performance.now(), vt = -rootTop;
        for (var k = 0; k < idx.length; k++) {
          var i = idx[k], p = i * 2, c = i * 3;
          if (SW[i]) { T[p] = NT[p]; T[p + 1] = NT[p + 1]; CT[c] = NC[c]; CT[c + 1] = NC[c + 1]; CT[c + 2] = NC[c + 2]; AT[i] = NA[i]; SZ[i] = NS[i]; M[i] = NM[i]; }
          NT[p] = Math.random() * W; NT[p + 1] = vt + Math.random() * VH; NC[c] = CT[c]; NC[c + 1] = CT[c + 1]; NC[c + 2] = CT[c + 2];
          NA[i] = 0; NS[i] = SZ[i]; NM[i] = 1; TP[i] = 1;
          SW[i] = now + 1300 + Math.random() * 700;
        }
      }
      // Взрыв в конце страницы (подвал всех страниц, data-pt-burst="pop"). Просьба владельца: «взрыв по всему футеру, не
      // концентрируй все частицы в одной области, пусть разлетаются». Частицы подвала гаснут на месте, а POPN из них вспыхивают
      // на буквах подвала — по всей его ширине (точки растра букв; если букв нет — по всему блоку) — и разлетаются во все
      // стороны, как вспышка при загрузке: свободно, скорость затухает сама, на POPR (вниз — ×0.7: под подвалом мало места).
      // Через 0.25 с начинают гаснуть, к ~1 с их нет. Пока летят, за край экрана не переносятся (burstEnd). Через 1.2 с — тихий
      // финал (phSettle). Раньше было из одной точки: из середины подвала (облако закрывало ссылки), потом — из середины его
      // верхней линии полукуполом (TASK-review.md, раздел 8).
      function phPop(idx, s) {
        flushFill();
        var now = performance.now(), g = s.geo && s.geo.box, G = null;
        if (s.geo) { ensureGl(s); G = s.geo.gl; }
        var POPN = mob ? 2000 : 4000, POPR = mob ? 110 : 170, reach = (1 - Math.pow(0.975, 45)) / 0.025, out = [];
        var pb = G && G.n ? (G.small.n ? (G.big.n ? G.big.n / G.n : 0) : 1) : 0;
        burstEnd = Math.max(burstEnd, now + 1600);
        for (var k = 0; k < idx.length; k++) {
          var i = idx[k], p = i * 2, c = i * 3;
          if (SW[i]) { T[p] = NT[p]; T[p + 1] = NT[p + 1]; CT[c] = NC[c]; CT[c + 1] = NC[c + 1]; CT[c + 2] = NC[c + 2]; SZ[i] = NS[i]; M[i] = NM[i]; SW[i] = 0; }
          AT[i] = NA[i] = 0;
        }
        for (k = 0; k < POPN && k < idx.length; k++) {
          var j = idx[(Math.random() * idx.length) | 0], q = j * 2, r = j * 3, a = Math.random() * 6.2832, x, y;
          if (G && G.n) { var gg = Math.random() < pb ? G.big : G.small, n = (Math.random() * gg.n) | 0; x = gg.x[n]; y = gg.y[n]; }
          else if (g) { x = g.x + Math.random() * g.w; y = g.y + Math.random() * g.h; }
          else { x = Math.random() * W; y = -rootTop + VH * (0.8 + Math.random() * 0.2); }
          var d = POPR * Math.sqrt(Math.random()) * (0.85 + Math.random() * 0.3) / reach, sy = Math.sin(a), col = Math.random() < 0.3 ? COL.frost : DUST[(Math.random() * DUST.length) | 0];
          P[q] = x; P[q + 1] = y; V[q] = Math.cos(a) * d; V[q + 1] = sy * d * (sy > 0 ? 0.7 : 1);
          C[r] = CT[r] = NC[r] = col[0] / 255; C[r + 1] = CT[r + 1] = NC[r + 1] = col[1] / 255; C[r + 2] = CT[r + 2] = NC[r + 2] = col[2] / 255;
          A[j] = 0.9; AT[j] = NA[j] = 0.6; SZ[j] = NS[j] = 1.4 + Math.random() * 1.1; M[j] = NM[j] = 1; TP[j] = 0; out.push(j);
        }
        at(0.25, function () { if (running) return; flushFill(); for (var q = 0; q < out.length; q++) AT[out[q]] = NA[out[q]] = 0; });
        at(1.2, function () { if (running) return; phSettle(idx); });
      }
      function alloc() {
        N = gl ? (mob ? 14000 : 26000) : (mob ? 3000 : 6000);
        P = new Float32Array(N * 2); V = new Float32Array(N * 2); T = new Float32Array(N * 2); NT = new Float32Array(N * 2);
        C = new Float32Array(N * 3); CT = new Float32Array(N * 3); NC = new Float32Array(N * 3);
        A = new Float32Array(N); AT = new Float32Array(N); NA = new Float32Array(N); SZ = new Float32Array(N); NS = new Float32Array(N);
        SW = new Float64Array(N); M = new Uint8Array(N); NM = new Uint8Array(N); SP = new Float32Array(N); TP = new Uint8Array(N);
        BUF = new Float32Array((N + SMK) * 7); BLD = []; AMB = [];
        // последние na точек — фоновая пыль, остальные собирают секции
        var na = Math.round(N * (mob ? DUSTM : DUSTA));
        for (var i = 0; i < N; i++) {
          SP[i] = Math.random() < 0.5 ? -1 : 1;
          M[i] = 1; A[i] = 0; P[i * 2] = -999; P[i * 2 + 1] = -999; SZ[i] = 1.4;
          (i < N - na ? BLD : AMB).push(i);
        }
        if (countEl) countEl.setAttribute('data-an', 'webgl · ' + fmtN() + ' particles');
      }
      // Если вспышки первого экрана не было (например, после перезагрузки в середине страницы первый экран пропущен),
      // частицы невидимо раскладываются по текущему экрану. Иначе сборка тянула бы их из угла за экраном.
      function seed() {
        root.classList.add('pt-booted');
        if (booted) return;
        flushFill();
        booted = true; rootRect();
        for (var i = 0; i < N; i++) {
          var p = i * 2, c = i * 3, col = DUST[(Math.random() * DUST.length) | 0];
          P[p] = T[p] = NT[p] = Math.random() * W; P[p + 1] = T[p + 1] = NT[p + 1] = -rootTop + Math.random() * VH; V[p] = V[p + 1] = 0;
          C[c] = CT[c] = NC[c] = col[0] / 255; C[c + 1] = CT[c + 1] = NC[c + 1] = col[1] / 255; C[c + 2] = CT[c + 2] = NC[c + 2] = col[2] / 255;
          A[i] = AT[i] = NA[i] = 0; SZ[i] = NS[i] = 1.5; M[i] = NM[i] = 1; SW[i] = 0; TP[i] = 0;
        }
        // пыль — как точки gAmbient (цвет, размер); проявляется в ближайшем кадре (dustSet)
        for (var k = 0; k < AMB.length; k++) { var j = AMB[k], q = j * 3; gAmbient(tmp); C[q] = CT[q] = NC[q] = tmp.r / 255; C[q + 1] = CT[q + 1] = NC[q + 1] = tmp.g / 255; C[q + 2] = CT[q + 2] = NC[q + 2] = tmp.b / 255; SZ[j] = NS[j] = tmp.s; }
        dustLvl = -1;
      }
      // фоновая пыль: full — видна вся; иначе каждая точка остаётся с вероятностью DUST_BUSY, остальные гаснут (и потом проявляются)
      function dustSet(full) { for (var k = 0; k < AMB.length; k++) { var i = AMB[k]; AT[i] = NA[i] = full || Math.random() < DUST_BUSY ? DUSTV : 0; } }
      // Линии вступления. line — запустить луч на sec секунд; linesOff — погасить (сборку первого экрана довели или
      // прервали); lineDelays — элемент проявляется, когда до него доходит линия: задержка по его положению (--ld).
      function line(el, sec) { if (!el) return; el.style.setProperty('--beam', sec + 's'); el.classList.remove('run'); void el.offsetWidth; el.classList.add('run'); }
      function linesOff() { heroSweep = null; root.classList.remove('pt-sweep'); if (!INTRO_LINES) return; if (beamEl) beamEl.classList.remove('run'); if (beamH) beamH.classList.remove('run'); }
      // Сначала все замеры, потом все записи --ld: запись стиля сбивает раскладку, и чередование «замер, запись» пересчитывало
      // всю страницу на каждом элементе — рывок ровно в момент старта линии (на слабом телефоне — десятые доли секунды)
      function lineDelays(sel, axis, sec) {
        var vw = Math.max(1, window.innerWidth), els = hero.el.querySelectorAll(sel), v = [];
        for (var k = 0; k < els.length; k++) { var r = els[k].getBoundingClientRect(); v.push((clamp(axis === 'x' ? r.left / vw : r.top / Math.max(1, VH), 0, 1) * sec).toFixed(3) + 's'); }
        for (k = 0; k < els.length; k++) els[k].style.setProperty('--ld', v[k]);
      }
      // Переход по якорю с другой страницы (services.html#apps): секции выше цели сразу готовы — как уже прокрученные, —
      // страница стоит у цели (с учётом scroll-margin-top), и цель собирается первой. Раньше сначала собирался
      // частично видимый блок выше, и цель была готова только через 5–6 с. false — якоря нет или он в первом экране.
      function jumpStart() {
        var el = null, to = null;
        try { el = location.hash.length > 1 ? document.getElementById(decodeURIComponent(location.hash.slice(1))) : null; } catch (e) { el = null; }
        if (!el) return false;
        for (var k = 1; k < secs.length && !to; k++) if (secs[k].el.contains(el)) to = secs[k];
        if (!to) return false;
        for (k = 0; secs[k] !== to; k++) { setStage(secs[k], 'done'); secs[k].state = 'done'; wakeSites(secs[k].el); }
        skipHero();
        window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - (parseFloat(getComputedStyle(el).scrollMarginTop) || 0), behavior: 'instant' });
        rootRect(); request(to);
        // после сборки цели — отклик на ней, как у якоря на этой же странице (scroll.js ждёт pt:secdone)
        if (window.PTScroll && window.PTScroll.arrive) window.PTScroll.arrive(el);
        return true;
      }
      // Первый экран помечен собранным без сборки: включаем сетку, объект первого экрана сразу стоит на месте.
      function skipHero() {
        if (!preOn) setTimeout(prefetchNear, 800);
        seed(); root.classList.add('g-on');
        objStart(true); heroIdle();
        pultSkip();
      }
      // pt-booted — пульт можно показывать (TASK-review.md 1.1: до вспышки посетитель видел чёрный экран и кнопку пульта)
      function burst() {
        root.classList.add('pt-booted');
        flushFill();
        booted = true;
        var hr = hero.el.getBoundingClientRect(), cx = W / 2, cy = hr.top - rootTop + Math.min(VH, hr.height) * 0.46;
        // BURST_FULL: круглая вспышка растёт и к стадии сетки (0.6 · HERO_K с) накрывает весь экран — круг радиусом в
        // полдиагонали, точки равномерно по кругу, скорость с разбросом (край рваный). Свободная частица за n кадров при
        // затухании 0.975 проходит v · (1 − 0.975ⁿ) / 0.025 — отсюда скорость. Что улетело за край, пока идёт вспышка,
        // не переносится на другую сторону (burstEnd), а потом слетается к сетке.
        var reach = (1 - Math.pow(0.975, 0.6 * HERO_K * 60)) / 0.025, R = Math.sqrt(W * W + VH * VH) / 2;
        burstEnd = performance.now() + 0.6 * HERO_K * 1000 + 150;
        for (var i = 0; i < N; i++) {
          var p = i * 2, c = i * 3, a = Math.random() * 6.2832, rr = Math.random() * 4, s = 2 + Math.pow(Math.random(), 0.7) * 18;
          P[p] = cx + Math.cos(a) * rr; P[p + 1] = cy + Math.sin(a) * rr;
          if (BURST_FULL) { var d = R * Math.sqrt(Math.random()) * (0.85 + Math.random() * 0.3) / reach; V[p] = Math.cos(a) * d; V[p + 1] = Math.sin(a) * d; }
          else { V[p] = Math.cos(a) * s; V[p + 1] = Math.sin(a) * s; }
          var col = Math.random() < 0.25 ? COL.frost : DUST[(Math.random() * DUST.length) | 0];
          C[c] = CT[c] = NC[c] = col[0] / 255; C[c + 1] = CT[c + 1] = NC[c + 1] = col[1] / 255; C[c + 2] = CT[c + 2] = NC[c + 2] = col[2] / 255;
          A[i] = 0.95; AT[i] = NA[i] = 0.55; SZ[i] = NS[i] = 2 + Math.random() * 1.4; M[i] = NM[i] = 1; SW[i] = 0;
          T[p] = NT[p] = P[p]; T[p + 1] = NT[p + 1] = P[p + 1];
        }
        // Пыль разлетается со вспышкой и остаётся на экране, когда остальные уходят в сетку (dustSet в ближайшем кадре). Её
        // скорость — чтобы остановиться в случайной точке экрана: свободная точка за всё время проходит 39 · v (затухание
        // 0.975 за кадр). С общей скоростью вспышки она пролетала бы в 2.7 раза дальше расчётного, за край экрана, и потом
        // ещё секунду-две проносилась через весь экран, перескакивая с края на край.
        for (var k = 0; k < AMB.length; k++) { var j = AMB[k] * 2; V[j] = (Math.random() * W - P[j]) / 39; V[j + 1] = (-rootTop + Math.random() * VH - P[j + 1]) / 39; }
        dustLvl = -1;
      }
      function snap() {
        flushFill();
        for (var i = 0; i < N; i++) {
          var p = i * 2, c = i * 3;
          T[p] = NT[p]; T[p + 1] = NT[p + 1]; M[i] = NM[i]; AT[i] = A[i] = NA[i]; SZ[i] = NS[i];
          if (!M[i]) { P[p] = T[p]; P[p + 1] = T[p + 1]; }
          V[p] = V[p + 1] = 0; CT[c] = C[c] = NC[c]; CT[c + 1] = C[c + 1] = NC[c + 1]; CT[c + 2] = C[c + 2] = NC[c + 2]; SW[i] = 0;
        }
      }
      function initGL() {
        if (!gl) return;
        var mk = function (type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn(gl.getShaderInfoLog(s)); return null; } return s; };
        var v = mk(gl.VERTEX_SHADER, 'attribute vec2 aP;attribute vec4 aC;attribute float aS;uniform vec2 uR;uniform float uD;varying vec4 vC;varying float vS;void main(){vec2 c=aP/uR*2.0-1.0;gl_Position=vec4(c.x,-c.y,0.0,1.0);gl_PointSize=max(1.0,aS*uD);vS=aS*uD;vC=aC;}');
        var f = mk(gl.FRAGMENT_SHADER, 'precision mediump float;varying vec4 vC;varying float vS;void main(){vec2 d=gl_PointCoord-0.5;float r=length(d);float hard=smoothstep(0.5,0.25,r)+smoothstep(0.22,0.0,r)*0.4;float soft=exp(-r*r*13.0)*(1.0-smoothstep(0.42,0.5,r));float m=mix(hard,soft,clamp((vS-8.0)/6.0,0.0,1.0));vec3 c=vC.rgb*vC.a*m;gl_FragColor=vec4(c,max(c.r,max(c.g,c.b)));}');
        if (!v || !f) { gl = null; c2 = canvas.getContext('2d'); return; }
        prog = gl.createProgram(); gl.attachShader(prog, v); gl.attachShader(prog, f); gl.linkProgram(prog);
        if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { gl = null; c2 = canvas.getContext('2d'); return; }
        gl.useProgram(prog); buf = gl.createBuffer();
        U.aP = gl.getAttribLocation(prog, 'aP'); U.aC = gl.getAttribLocation(prog, 'aC'); U.aS = gl.getAttribLocation(prog, 'aS');
        U.uR = gl.getUniformLocation(prog, 'uR'); U.uD = gl.getUniformLocation(prog, 'uD');
        gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE); gl.clearColor(0, 0, 0, 0);
      }
      function layout() {
        W = Math.max(1, root.clientWidth || window.innerWidth || 1); VH = layoutVH = Math.max(1, window.innerHeight || 800); mob = W < 760;
        env.mob = mob; env.vh = VH;
        dpr = Math.min(window.devicePixelRatio || 1, dprCap);
        CM = Math.round(VH * 0.15); CH = VH + 2 * CM; cvY = null;
        if (canvas) { canvas.width = Math.round(W * dpr); canvas.height = Math.round(CH * dpr); canvas.style.height = CH + 'px'; }
        if (c2) c2.setTransform(dpr, 0, 0, dpr, 0, 0);
        if (!N) alloc();
        if (gl && buf) { gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, BUF.byteLength, gl.DYNAMIC_DRAW); }
        if (smk) { smk.width = Math.ceil(W * 0.5); smk.height = Math.ceil(VH * 0.5); smokeLive = false; }
        fitSites();
        if (!sro) for (var si = 0; si < scenes.length; si++) scenes[si].resize();
      }
      // Адаптивное качество: окна по 2 с; если в двух окнах подряд медиана кадра дольше 24 мс (меньше ~42 fps),
      // спускаемся на уровень. Медиана, а не среднее: одиночный рывок (загрузка картинки, сборка секции) на быстрой
      // машине облегчение не включает. Паузой считаем только кадр дольше 1 с (вкладка была скрыта, отладчик) —
      // раньше паузой считался любой кадр дольше 0,1 с, и на самых медленных машинах (браузер без ускорения
      // видеокарты, ~6 к/с) облегчённый режим не включался никогда. Первые 3 с после старта не считаем.
      // Уровень помнится до конца сессии.
      var qSlow = 0;
      // Ранняя оценка (TASK: на дешёвых телефонах лагала первая анимация). watchQuality ждёт 3 с и два окна по 2 с, то есть
      // облегчение включалось не раньше 7-й секунды — уже после вступления. Пока идёт вспышка и сетка первого экрана (до
      // стадии рамок: стекла и размытия ещё нет), меряем кадры: медиана дольше 34 мс (меньше ~30 к/с) — сразу уровень 1
      // (без размытия стекла и дымного следа), дольше 50 мс (меньше 20 к/с) — уровень 2 (частицы в 1×). Анимация та же.
      var probe = null;
      function probeStart(K) { if (rm || lite >= 2 || QFIX >= 0) return; var t = performance.now(); probe = { from: t + 120, to: t + 1000 * 1.6 * K * 0.94, w: [] }; }
      function probeFrame(now, raw) {
        if (!probe || now < probe.from) return;
        if (raw > 0 && raw < 1) probe.w.push(raw);
        // на очень медленном устройстве к концу окна кадров меньше четырёх — добираем ещё до 1.5 с
        if (now < probe.to || (probe.w.length < 4 && now < probe.to + 1500)) return;
        probeDecide(4);
      }
      function probeDecide(min) {
        if (!probe || probe.w.length < min) return;
        var w = probe.w; probe = null;
        w.sort(function (a, b) { return a - b; });
        var med = w[w.length >> 1], want = med > 0.05 ? 2 : med > 0.034 ? 1 : 0;
        if (want > lite) setLite(want);
      }
      // стадия рамок первого экрана подводит итог оценки по уже собранным кадрам (от трёх) — до своей тяжёлой работы. Окно
      // кончается за ~50 мс до неё, а на слабом телефоне кадр длиннее: решение приходило уже после начала стадии рамок
      function probeNow() { probeDecide(3); }
      function watchQuality(now, raw) {
        if (raw > 1 || document.hidden) { qT = 0; qW.length = 0; return; }
        if (lite >= 2 || QFIX >= 0 || now - bootAt < 3000) return;
        qT += raw; qW.push(raw);
        if (qT < 2) return;
        qW.sort(function (a, b) { return a - b; });
        var med = qW[qW.length >> 1]; qT = 0; qW.length = 0;
        qSlow = med > 0.024 ? qSlow + 1 : 0;
        if (qSlow >= 2) { qSlow = 0; setLite(lite + 1); }
      }
      function setLite(n) {
        lite = n; root.classList.toggle('pt-lite', n >= 1);
        if (n >= 1 && sctx) { sL.fill(0); sctx.setTransform(1, 0, 0, 1, 0, 0); sctx.clearRect(0, 0, smk.width, smk.height); smokeLive = false; }
        // уровень 2: частицы и сцены — в 1× (layout сам перемеряет сцены, только если нет ResizeObserver)
        if (n >= 2 && dprCap !== 1) { dprCap = 1; env.low = true; layout(); if (sro) for (var si = 0; si < scenes.length; si++) scenes[si].resize(); }
        try { sessionStorage.setItem('pt-q', String(n)); } catch (e) {}
      }
      // Кадр. Цикл частиц — отдельная функция stepParticles (TASK-perf.md, 3.1): в ней только типизированные массивы и числа.
      // Всё редкое (проверка прерывания, раскладка целей, след, пробуждение и кадры сцен, зоны «тихого» текста) — здесь, до
      // или после неё: деоптимизация в редком месте раньше выбивала цикл по 26 000 частиц в медленный режим на несколько кадров
      function frame(now) {
        var raw = Math.max(0, (now - prev) / 1000), dt = Math.min(0.05, raw); prev = now;
        if (!rm) { probeFrame(now, raw); watchQuality(now, raw); }
        // мягкая прокрутка (assets/scroll.js) сдвигает страницу до замера: частицы не отстают от контента
        if (window.PTScroll) window.PTScroll.tick(now);
        rootFast();
        if (running && queue.length && now > abortAt) checkAbort(now);
        var shift = lastTop == null ? 0 : lastTop - rootTop; lastTop = rootTop;
        // холст — на место: окно и запас CM сверху и снизу (пишем, только когда сдвиг меняется)
        var ty = Math.round(-rootTop - CM);
        if (ty !== cvY) { cvY = ty; if (canvas) canvas.style.transform = 'translate3d(0,' + ty + 'px,0)'; }
        // фоновая пыль: пока идёт сборка (и 0.4 с после — между секциями в очереди не мигает) — реже, потом снова вся
        if (running) dustT = now;
        var dl = now - dustT < 400 ? 0 : 1;
        if (booted && dl !== dustLvl) { dustLvl = dl; dustSet(dl === 1); }
        if (fillJob) fillSlice(fillJob, performance.now() + FILL_MS);
        var f = Math.min(3, dt * 60);
        // первый экран собран и не пересобирается — свободные точки пыли над его текстом горят слабее (CALM_A)
        var calmOn = hero.state === 'done' && calmZones().length > 0 ? 1 : 0;
        // невидимые частицы — по очереди, четверть за кадр, с накопленным временем своей четверти (lzT)
        lzQ = (lzQ + 1) & 3;
        for (var q = 0; q < 4; q++) lzT[q] += dt;
        var ldt = lzT[lzQ], lf = Math.min(12, ldt * 60);
        lzT[lzQ] = 0;
        // курсор — «свет» (TASK-clarity.md, B4); на телефоне курсора нет — R = 0
        var n = stepParticles(now, f, shift, mouse.cx - rootLeft, mouse.cy - rootTop, mob ? 0 : 110, Math.min(1, dt * 3.5), Math.min(1, dt * 3), now * 0.00035,
          lzQ, Math.min(1, ldt * 3.5), Math.min(1, ldt * 3), Math.pow(0.975, lf), calmOn, (Math.random() * 8192) | 0);
        drawSmoke(dt, f);
        wakeNext();
        tickScenes(dt);
        render(n);
      }
      // собираемая секция ушла с экрана, а видимые ждут — дособрать её сразу (раз в 200 мс)
      function checkAbort(now) {
        abortAt = now + 200;
        var rr = running.el.getBoundingClientRect();
        if (rr.bottom < 0 || rr.top > VH || (rr.top < 0 && rr.bottom < VH * 0.12)) abortRun();
      }
      function tickScenes(dt) { for (var si = 0; si < scenes.length; si++) scenes[si].tick(dt); }
      // Невидимые частицы (погасли и гаснут дальше) на экран не попадают, их движение не видно. Свободные только едут вместе со
      // страницей и остаются в пределах экрана (перенос с края на край) — оттуда их возьмёт следующая сборка или пыль. Погасшие
      // на буквах после сборки (до переноса в случайную точку, 1.3–2 с) стоят на месте: пружина уже привела их к цели. Цвет и
      // затухание скорости — по очереди, четверть за кадр (lzq), с накопленным временем своей четверти. Видимые частицы
      // считаются каждый кадр; назначенная смена цели (SW) проверяется раньше, так что частица, которой пора загореться,
      // считается полностью. Случайный шум — из таблицы JN (и у свободной пыли: тот же шум той же силы, без Math.random на
      // каждую частицу). Координаты на холсте — от его верха (cvY); отсекаем по холсту с запасом CM
      function stepParticles(now, f, shift, mx, my, R, ca, aa, ts, lzq, lca, laa, ldd, calmOn, jn) {
        var P_ = P, V_ = V, T_ = T, NT_ = NT, C_ = C, CT_ = CT, NC_ = NC, A_ = A, AT_ = AT, NA_ = NA, SZ_ = SZ, NS_ = NS, SW_ = SW, M_ = M, NM_ = NM, SP_ = SP, TP_ = TP, B = BUF, J = JN;
        var damp = Math.pow(0.855, f), k = 0.015 * f, dd = Math.pow(0.975, f), R2 = R * R, vt = -rootTop, vh = VH, w = W, cy0 = cvY, ch = CH, still = rm, bEnd = burstEnd, n = 0, cnt = N;
        for (var i = 0; i < cnt; i++) {
          var p = i * 2, c = i * 3;
          if (SW_[i] && now >= SW_[i]) {
            T_[p] = NT_[p]; T_[p + 1] = NT_[p + 1]; CT_[c] = NC_[c]; CT_[c + 1] = NC_[c + 1]; CT_[c + 2] = NC_[c + 2];
            AT_[i] = NA_[i]; SZ_[i] = NS_[i]; M_[i] = NM_[i]; SW_[i] = 0;
            if (TP_[i]) { TP_[i] = 0; P_[p] = T_[p]; P_[p + 1] = T_[p + 1]; V_[p] = V_[p + 1] = 0; A_[i] = 0; C_[c] = CT_[c]; C_[c + 1] = CT_[c + 1]; C_[c + 2] = CT_[c + 2]; }
            else if (!M_[i] && !still) { V_[p] += J[jn = (jn + 1) & 8191] * 3; V_[p + 1] += J[jn = (jn + 1) & 8191] * 3; }
          }
          if (AT_[i] === 0 && A_[i] < 0.01) {
            if (M_[i]) {
              var ly = P_[p + 1] + shift;
              if (ly < vt - 30) ly += vh + 60; else if (ly > vt + vh + 30) ly -= vh + 60;
              P_[p + 1] = ly;
            }
            if ((i & 3) === lzq) {
              C_[c] += (CT_[c] - C_[c]) * lca; C_[c + 1] += (CT_[c + 1] - C_[c + 1]) * lca; C_[c + 2] += (CT_[c + 2] - C_[c + 2]) * lca;
              A_[i] += (AT_[i] - A_[i]) * laa; V_[p] *= ldd; V_[p + 1] *= ldd;
            }
            continue;
          }
          var x = P_[p], y = P_[p + 1], vx = V_[p], vy = V_[p + 1];
          if (M_[i]) {
            y += shift;
            vx += J[jn = (jn + 1) & 8191] * 0.05 * f + Math.sin(y * 0.0045 + ts + SP_[i]) * 0.012 * f;
            vy += J[jn = (jn + 1) & 8191] * 0.05 * f + Math.cos(x * 0.0045 - ts) * 0.012 * f;
            vx *= dd; vy *= dd;
          } else if (still) { x = T_[p]; y = T_[p + 1]; vx = vy = 0; }
          else {
            var dx = T_[p] - x, dy = T_[p + 1] - y;
            vx = (vx + dx * k) * damp; vy = (vy + dy * k) * damp;
            var d2 = dx * dx + dy * dy;
            if (d2 > 400) { var dl = Math.sqrt(d2), sw = Math.min(1, dl / 260) * 0.45 * f * SP_[i]; vx -= dy / dl * sw; vy += dx / dl * sw; }
            var jf = 0.025 * f; vx += J[jn = (jn + 1) & 8191] * jf; vy += J[jn = (jn + 1) & 8191] * jf;
          }
          var ex = x - mx, ey = y - my, e2 = ex * ex + ey * ey;
          var lt = 0, ox = 0, oy = 0;
          if (e2 < R2) {
            var ed = Math.sqrt(e2) || 1, es = (1 - ed / R) * 0.35 * f, sv = (1 - ed / R) * 0.5 * f;
            // Частицы сборки держит пружина — толчок и закручивание в скорость. Свободную пыль держит только затухание 0.975:
            // те же добавки копились, точка раскручивалась и вылетала из круга, и вокруг мыши (обычно посреди экрана) было
            // пусто. Ей — сдвиг, а не скорость: медленно обтекает курсор по кругу (до ~1 px за кадр у центра) и не улетает.
            if (M_[i]) { lt = 1 - ed / R; ox = -ey / ed * lt * 0.9 * f; oy = ex / ed * lt * 0.9 * f; }
            else { vx += ex / ed * es - ey / ed * sv; vy += ey / ed * es + ex / ed * sv; }
          }
          x += vx * f + ox; y += vy * f + oy;
          if (M_[i] && now > bEnd) { if (x < -4) x += w + 8; else if (x > w + 4) x -= w + 8; if (y < vt - 30) y += vh + 60; else if (y > vt + vh + 30) y -= vh + 60; }
          P_[p] = x; P_[p + 1] = y; V_[p] = vx; V_[p + 1] = vy;
          C_[c] += (CT_[c] - C_[c]) * ca; C_[c + 1] += (CT_[c + 1] - C_[c + 1]) * ca; C_[c + 2] += (CT_[c + 2] - C_[c + 2]) * ca;
          A_[i] += (AT_[i] - A_[i]) * aa;
          var cy = y - cy0;
          if (A_[i] < 0.01 || cy < -8 || cy > ch + 8 || x < -8 || x > w + 8) continue;
          var cz = calmOn && M_[i] && inCalm(x, y) ? CALM_A : 1;
          var b = n * 7; n++;
          B[b] = x; B[b + 1] = cy; B[b + 2] = C_[c]; B[b + 3] = C_[c + 1]; B[b + 4] = C_[c + 2];
          B[b + 5] = (lt ? Math.min(0.9, A_[i] * (1 + 1.4 * lt)) : A_[i]) * cz; B[b + 6] = lt ? SZ_[i] * (1 + 0.25 * lt) : SZ_[i];
        }
        return n;
      }
      function makeSprites() {
        for (var h = 0; h < 36; h++) {
          var SP = [[70, 190, 255], [92, 124, 255], [168, 112, 255], [72, 222, 196]];
          var t = h / 36 * SP.length, i0 = Math.floor(t) % SP.length, i1 = (i0 + 1) % SP.length, u = t - Math.floor(t), a = SP[i0], b = SP[i1];
          var rgb = Math.round(a[0] + (b[0] - a[0]) * u) + ',' + Math.round(a[1] + (b[1] - a[1]) * u) + ',' + Math.round(a[2] + (b[2] - a[2]) * u);
          var cv = document.createElement('canvas'); cv.width = cv.height = 64;
          var x = cv.getContext('2d'), gr = x.createRadialGradient(32, 32, 0, 32, 32, 32);
          gr.addColorStop(0, 'rgba(' + rgb + ',1)'); gr.addColorStop(0.35, 'rgba(' + rgb + ',0.5)'); gr.addColorStop(1, 'rgba(' + rgb + ',0)');
          x.fillStyle = gr; x.fillRect(0, 0, 64, 64); SPR.push(cv);
        }
      }
      function drawSmoke(dt, f) {
        if (!sctx || !SPR.length) return;
        if (smokeLive) { sctx.setTransform(1, 0, 0, 1, 0, 0); sctx.globalAlpha = 1; sctx.clearRect(0, 0, smk.width, smk.height); }
        // след сделан тише (было 0.05 / 0.032): меньше движения под текстом
        var any = false, damp = Math.pow(0.955, f), base = mob ? 0.035 : 0.022;
        sctx.setTransform(0.5, 0, 0, 0.5, 0, 0); sctx.globalCompositeOperation = 'lighter';
        for (var j = 0; j < SMK; j++) {
          if (sL[j] <= 0) continue;
          sL[j] -= dt;
          if (sL[j] <= 0) continue;
          any = true;
          sVX[j] = sVX[j] * damp + (Math.random() - 0.5) * 0.14 * f; sVY[j] = sVY[j] * damp - 0.012 * f + (Math.random() - 0.5) * 0.1 * f;
          sX[j] += sVX[j] * f; sY[j] += sVY[j] * f;
          var u = sL[j] / sM[j], age = sM[j] - sL[j], r = 14 + (1 - u) * 52, hue = (sC[j] + age * 0.35) % 1;
          sctx.globalAlpha = Math.pow(u, 1.3) * base;
          sctx.drawImage(SPR[(hue * SPR.length) | 0], sX[j] - r, sY[j] - r, r * 2, r * 2);
        }
        sctx.globalAlpha = 1; sctx.globalCompositeOperation = 'source-over';
        // пустой холст следа прячем: полноэкранный слой под стеклянными карточками заставлял видеокарту заново размывать их
        // фон при прокрутке, даже когда следа нет
        if (any !== smokeLive) smk.style.visibility = any ? '' : 'hidden';
        smokeLive = any;
      }
      // el — только превью этой секции (сборка); без el — все (ресайз). Сначала все замеры, потом все записи: чередование
      // «замер, запись» пересчитывало страницу на каждом превью (до 45 мс в финале сборки на слабом устройстве)
      function fitSites(el) {
        var v = [];
        sites.forEach(function (fr) { if (el && !el.contains(fr)) return; var p = fr.parentNode; v.push([fr, Math.max(0.01, p.clientWidth / 1440), p.clientHeight]); });
        v.forEach(function (x) { x[0].style.transform = 'scale(' + x[1].toFixed(4) + ')'; x[0].style.height = Math.ceil(x[2] / x[1]) + 'px'; });
      }
      // Живое превью дорогое: целый сайт рендерится в 1440 px. Поэтому карточка по умолчанию показывает снимок
      // .site-shot, а iframe грузится и проявляется, только пока курсор (или фокус) на карточке собранной секции.
      // Ушёл курсор — iframe гаснет и получает visibility: hidden, браузер перестаёт его рисовать.
      function liveSite(fr, on) {
        fr._want = on; clearTimeout(fr._off);
        if (!on) { fr._off = setTimeout(function () { fr.classList.remove('on'); }, 250); return; }
        if (!fr._armed || rm) return;
        if (fr.getAttribute('src')) { if (fr._ready) fr.classList.add('on'); return; }
        fr.addEventListener('load', function () { fr._ready = true; if (fr._want) fr.classList.add('on'); });
        fr.setAttribute('src', fr.getAttribute('data-src'));
      }
      // Намеренное наведение: курсор сам двигался по карточке и задержался на ней 0.6 с без прокрутки.
      // Если страница просто проехала под неподвижным курсором, превью не включается: иначе на прокрутке
      // через «Объекты» тяжёлые сайты грузились бы сами.
      var siteOff = [], lastScroll = 0;
      // Облегчённый режим (lite ≥ 1, слабое устройство): на время прокрутки декоративные петли стоят — импульсы на схемах и
      // смена демо-сайтов (scenes.js, env.hold; петли рисунков в облегчённом режиме выключены и так — .pt-lite .glyph *);
      // через 150 мс после остановки идут дальше. Пыль и частицы сборки не трогаем. Человек в этот момент листает — паузы
      // не видно, а кадр прокрутки легче
      var holdT = 0;
      // Объект «Кодекса» в облегчённом режиме на время прокрутки тоже стоит (владелец 2026-10-23, TASK-perf, телефон: на первом
      // экране упор в объект — без него прокрутка шла 60 к/с, с ним ~40). Пальцем листают — паузы не видно; через 150 мс он
      // продолжает с того же места, полоска вкладки — тоже
      function onHold() {
        if (!lite) return;
        env.hold = true;
        if (heroObj && heroObj.hold) heroObj.hold(true);
        clearTimeout(holdT); holdT = setTimeout(function () { env.hold = false; if (heroObj && heroObj.hold) heroObj.hold(false); }, 150);
      }
      function onScrollSites() { lastScroll = performance.now(); sites.forEach(function (fr) { clearTimeout(fr._intent); }); }
      var sitesBound = false;
      function bindSites() {
        if (sitesBound) return; sitesBound = true;
        sites.forEach(function (fr) {
          var card = fr.closest('.obj') || fr.parentNode;
          var move = function (e) {
            if (e.pointerType !== 'mouse' || fr._want || performance.now() - lastScroll < 300) return;
            clearTimeout(fr._intent);
            fr._intent = setTimeout(function () { if (card.matches(':hover') && performance.now() - lastScroll >= 600) liveSite(fr, true); }, 600);
          };
          var focus = function (e) { if (e.target.matches && e.target.matches(':focus-visible')) liveSite(fr, true); };
          var leave = function () { clearTimeout(fr._intent); liveSite(fr, false); };
          card.addEventListener('pointermove', move); card.addEventListener('pointerleave', leave);
          card.addEventListener('focusin', focus); card.addEventListener('focusout', leave);
          siteOff.push(function () { card.removeEventListener('pointermove', move); card.removeEventListener('pointerleave', leave); card.removeEventListener('focusin', focus); card.removeEventListener('focusout', leave); });
        });
        if (sites.length) window.addEventListener('scroll', onScrollSites, { passive: true });
      }
      function wakeSites(el) {
        sites.forEach(function (fr) { if (el.contains(fr) && !fr._armed) { fr._armed = true; if (fr._want) liveSite(fr, true); } });
        fitSites(el);
        // схемы панели разбора работы ([data-cp], cases.html) секция не будит: панель закрыта, холст нулевой — их будит сама
        // панель (pt:wake), когда показывает статью
        scenes.forEach(function (sc) { if (el.contains(sc.cv) && !sc.cv.closest('[data-cp]')) { if (rm) sc.wake(); else wakePush(sc); } });
        secDone(el);
      }
      // секция собрана — событие для отклика на цели якоря (scroll.js, arrive): цель в несобранной секции ждёт его
      // firstT — когда первый экран впервые собран (мс от начала загрузки; в «сразу» и reduced motion — когда секции получили
      // s-done): панель замеров (PTPerf.first) ловила pt:secdone и в режиме «сразу» его пропускала — он раньше неё
      var firstT;
      function secDone(el) { if (el === hero.el) { if (firstT === undefined) firstT = Math.round(performance.now()); heroIdle(); idleOnce(bindSites); } try { window.dispatchEvent(new CustomEvent('pt:secdone', { detail: el })); } catch (e) { /* старый браузер */ } }
      // панель разбора работы (assets/cases.js, TASK-cases-panel.md, 4.6). pt:sleep — сцены внутри detail засыпают (сетка под
      // открытой панелью, статья, с которой ушли), живые превью гаснут: под подложкой их кадры не нужны. pt:wake — просыпаются
      // с того же места (resume); ещё не просыпавшиеся — как обычно, но только в собранной секции. Заново с первого узла —
      // pt:shown (панель шлёт его за pt:wake для показанной статьи)
      function sceneSec(sc) { for (var i = 0; i < secs.length; i++) if (secs[i].el.contains(sc.cv)) return secs[i]; return null; }
      function onSleepEv(e) {
        var el = e && e.detail; if (!el || !el.contains) return;
        scenes.forEach(function (sc) { if (el.contains(sc.cv)) sleepScene(sc); });
        sites.forEach(function (fr) { if (el.contains(fr)) liveSite(fr, false); });
      }
      function onWakeEv(e) {
        var el = e && e.detail; if (!el || !el.contains) return;
        scenes.forEach(function (sc) {
          if (!el.contains(sc.cv)) return;
          var s = sceneSec(sc); if (s && s.state !== 'done') return;
          if (sc.resume) sc.resume(); else sc.wake();
        });
      }
      // фильтр (assets/filter.js) показал карточки — их схемы собираются заново с первого узла
      function onShown(e) {
        var els = (e && e.detail) || [];
        scenes.forEach(function (sc) { if (sc.restart && els.some(function (el) { return el.contains(sc.cv); })) sc.restart(); });
      }
      function render(n) {
        if (gl) {
          gl.viewport(0, 0, canvas.width, canvas.height); gl.clear(gl.COLOR_BUFFER_BIT);
          if (!n) return;
          gl.useProgram(prog); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferSubData(gl.ARRAY_BUFFER, 0, BUF.subarray(0, n * 7));
          gl.enableVertexAttribArray(U.aP); gl.vertexAttribPointer(U.aP, 2, gl.FLOAT, false, 28, 0);
          gl.enableVertexAttribArray(U.aC); gl.vertexAttribPointer(U.aC, 4, gl.FLOAT, false, 28, 8);
          gl.enableVertexAttribArray(U.aS); gl.vertexAttribPointer(U.aS, 1, gl.FLOAT, false, 28, 24);
          gl.uniform2f(U.uR, W, CH); gl.uniform1f(U.uD, dpr);
          gl.drawArrays(gl.POINTS, 0, n);
        } else if (c2) {
          c2.clearRect(0, 0, W, CH); c2.globalCompositeOperation = 'lighter';
          for (var j = 0; j < n; j++) {
            var b = j * 7, s = BUF[b + 6];
            c2.fillStyle = 'rgba(' + Math.round(BUF[b + 2] * 255) + ',' + Math.round(BUF[b + 3] * 255) + ',' + Math.round(BUF[b + 4] * 255) + ',' + BUF[b + 5].toFixed(3) + ')';
            c2.fillRect(BUF[b] - s / 2, BUF[b + 1] - s / 2, s, s);
          }
        }
      }
      // после кадра — часть растра букв первого экрана (glAhead): пока у кадра есть запас до 10 мс, но не меньше одной части.
      // Пока идёт ранняя оценка кадров (probe, до стадии рамок) — только запас: обязательная часть удлиняла её кадры, и на
      // слабом телефоне их к стадии рамок не набиралось на решение — облегчение включалось на секунды позже
      function loop(now) { raf = 0; if (!alive || !active) return; var t0 = performance.now(); frame(now); if (glJob) glTick(t0 + 10, !probe); if (!rm) raf = requestAnimationFrame(loop); }
      function start() { if (raf || !alive || !active || rm) return; prev = performance.now(); raf = requestAnimationFrame(loop); }
      // Взрыв подвала ждёт, пока соберётся всё в очереди (popWait): частицы нужны следующей сборке. На телефоне подвал виден
      // сразу с секциями над ним и собирается первым (у него свой наблюдатель без отступа) — раньше взрыв там не случался
      // никогда: к финалу подвала очередь не пуста. Теперь он — в финале последней сборки, если подвал ещё на экране.
      var popWait = null;
      function finish(s) {
        running = null;
        if (s === hero && !preOn) setTimeout(prefetchNear, 800);
        if (s && s.burst === 'pop') popWait = s;
        if (!queue.length) {
          var ps = popWait, pr = ps && ps.el.getBoundingClientRect(); popWait = null;
          if (ps && pr.bottom > 0 && pr.top < VH) phPop(BLD, ps); else if (s && s.burst === '') phAmbient(BLD, false); else phSettle(BLD);
        }
        pump();
      }
      // Пропуск сборки по действию пользователя: текст и рамки проявляются сразу, частицы уходят в финал.
      // Первый экран пропускается прокруткой, кликом или клавишей; остальные секции — кликом или клавишей
      // (прокрутка их не трогает: секции и собираются по прокрутке, а ушедшие с экрана дособирает abortRun).
      function skipNow() {
        var s = running; if (!s || rm) return;
        runId++; running = null; cur = null;
        var pend = settleFn; settleFn = null;
        if (pend) { pend(); phFade(BLD); log(s, '✓ ready'); setProg(); if (!queue.length) phSettle(BLD); pump(); return; }
        setStage(s, 'done'); s.state = 'done'; s.replay = false;
        phFade(BLD);
        if (s === hero) { linesOff(); root.classList.add('g-on'); if (heroRp) heroReplay(); else objStart(false); if (!pultShown && !replaying) pultLater(); }
        log(s, '✓ ready'); setProg(); wakeSites(s.el);
        finish(s);
      }
      function onSkip(e) {
        if (!running || rm) return;
        if (e.type === 'keydown' && (e.key === 'Shift' || e.key === 'Control' || e.key === 'Alt' || e.key === 'Meta')) return;
        if (e.target && e.target.closest && e.target.closest('[data-pt-replay]')) return;
        var scrollish = e.type === 'wheel' || e.type === 'touchmove';
        if (scrollish && running !== hero) return;
        skipNow();
      }
      // таймер текущей сборки: молча отменяется, если сборку прервали (abortRun) или запустили новую
      function atRun(sec, fn) { var my = runId; at(sec, function () { if (my === runId) fn(); }); }
      // Быстрая сборка первого экрана (fast): без вспышки и двух линий — один луч слева направо (FAST_LD), за ним по --ld
      // всё проявляется сразу в финальном виде (s-done и .pt-sweep: задержка по положению, текст — 0.35 с); частицы из
      // невидимой раскладки волной за лучом ложатся на буквы, на долю секунды держат их и гаснут на месте. По сути — смена
      // языка из пустого состояния. Объект первого экрана стартует сразу. Пульт сразу свёрнут.
      function runHeroFast(s) {
        runId++; running = s; s.state = 'run'; s.replay = false;
        seed(); root.classList.add('g-on'); measure(s);
        lineDelays('*', 'x', FAST_LD); root.classList.add('pt-sweep');
        heroSweep = { axis: 'x', spread: FAST_LD }; line(beamEl, FAST_LD);
        setStage(s, 'done'); phText(s, BLD, false); heroSweep = null;
        objStart(false);
        pultSkip(true); log(s, '✓ ready');
        atRun(FAST_LD + 0.15, function () { phFade(BLD); });
        atRun(FAST_LD + 0.35, function () { s.state = 'done'; setProg(); secDone(s.el); finish(s); });
        atRun(FAST_LD + 1.2, function () { root.classList.remove('pt-sweep'); if (beamEl) beamEl.classList.remove('run'); });
      }
      function runHero(s, replay) {
        if (MODE === 'fast' && !replay) { runHeroFast(s); return; }
        runId++; running = s; s.state = 'run'; s.replay = false; heroRp = !!replay; measure(s);
        var o = replay ? -0.6 : 0, K = replay ? PRESENT_K : HERO_K, LD = LINE * K;
        if (!replay) { burst(); log(s, 'boot · ' + fmtN() + ' particles'); probeStart(K); }
        atRun((0.6 + o) * K, function () { root.classList.add('g-on'); measure(s); phGrid(s, BLD, false); glAhead(s); log(s, '01 · grid.init(12)'); });
        function done() { setStage(s, 'done'); s.state = 'done'; phFade(BLD); if (replay) heroReplay(); else objStart(false); if (!replay && !pultShown) pultLater(); log(s, '✓ ready'); setProg(); secDone(s.el); }
        // объект — на стадии рамок, когда линия прошла середину экрана и рамка панели уже нарисована (TASK-review.md 1.3)
        function objGo() { if (replay) return; s.el.classList.add('obj-go'); objStart(false); }
        if (INTRO_LINES) {
          // вертикальная линия рисует все рамки (каркас и стили — одна стадия), за ней частицы обводят блоки и рамки
          atRun((1.6 + o) * K, function () {
            probeNow();
            lineDelays('.wf, .fr, .an, .hero-obj, .nb .ar, .logo-d, .ico svg, .cm-btn svg, .cm-btn .ic, .burger', 'x', LD); heroSweep = { axis: 'x', spread: LD }; line(beamEl, LD);
            setStage(s, 'skel'); measure(s); phWire(s, BLD, false); heroSweep = null; log(s, '02 · frames.draw()');
          });
          atRun((1.6 + o) * K + LD * 0.5, objGo);
          // горизонтальная линия — текст: за ней частицы ложатся на буквы и проявляется настоящий текст
          atRun((2.65 + o) * K, function () {
            // главная кнопка — с текстом: её заливка проявляется по той же линии (site.css, TASK-review.md 1.4)
            lineDelays('.ptx, .obj-ct, .obj-cap, a.btn-p.fr', 'y', LD); heroSweep = { axis: 'y', spread: LD }; line(beamH, LD);
            setStage(s, 'text'); measure(s); phText(s, BLD, false); heroSweep = null; log(s, '03 · type.crystallize()');
          });
          // частицы долю секунды держат буквы — и гаснут на месте
          atRun((4.2 + o) * K, done);
          atRun((4.75 + o) * K, function () { finish(s); });
          return;
        }
        atRun((1.6 + o) * K, function () { probeNow(); setStage(s, 'wire'); measure(s); phWire(s, BLD, false); log(s, '02 · layout.measure()'); objGo(); });
        atRun((2.65 + o) * K, function () { setStage(s, 'skel'); phSkel(s, BLD, false); log(s, '03 · styles.apply(glacier)'); });
        atRun((3.7 + o) * K, function () { setStage(s, 'text'); measure(s); phText(s, BLD, false); log(s, '04 · type.crystallize()'); });
        atRun((5.25 + o) * K, done);
        atRun((5.8 + o) * K, function () { finish(s); });
      }
      function runSec(s) {
        // темп одинаковый для всех секций (раньше при очереди ускорялся ×0.6, и блоки собирались вразнобой)
        var k = runK = s.replay ? PRESENT_K : SEC_K;
        seed(); runId++; running = s; s.state = 'run'; s.replay = false;
        measure(s); setStage(s, 'wire'); phWire(s, BLD, false); log(s, '01 · layout.measure()');
        atRun(0.75 * k, function () { setStage(s, 'skel'); phSkel(s, BLD, false); log(s, '02 · styles.apply()'); });
        atRun(1.5 * k, function () { setStage(s, 'text'); measure(s); phText(s, BLD, false); log(s, '03 · type.render()'); });
        atRun(2.75 * k, function () { setStage(s, 'done'); s.state = 'done'; phFade(BLD); log(s, '✓ ready'); setProg(); wakeSites(s.el); });
        atRun(3.1 * k, function () { finish(s); });
      }
      // Секция ушла с экрана посреди сборки, а видимые секции ждут в очереди — дособираем её мгновенно.
      // Иначе видимые секции стоят пустыми, пока сборка идёт за кадром (например, браузер вернул прокрутку
      // после перезагрузки, когда первый экран уже начал собираться).
      function abortRun() {
        var s = running; runId++; running = null; cur = null;
        var pend = settleFn; settleFn = null;
        if (pend) { pend(); phFade(BLD); setProg(); pump(); return; }
        setStage(s, 'done'); s.state = 'done'; s.replay = false; setProg(); wakeSites(s.el);
        if (s === hero) { linesOff(); skipHero(); }
        pump();
      }
      function pump() {
        if (running) return;
        // едем к якорю дальше 1.5 экрана (scroll.js, pt:jump) — где остановимся, там и соберём
        var now = performance.now();
        if (now < travelEnd) { clearTimeout(pumpT); pumpT = setTimeout(pump, travelEnd - now + 30); return; }
        while (queue.length) {
          var q = queue[0], r = q.el.getBoundingClientRect();
          if (q.instant) { queue.shift(); q.instant = false; setStage(q, 'done'); q.state = 'done'; setProg(); wakeSites(q.el); continue; }
          // уже над экраном — или от неё у верхнего края осталась полоска меньше 12 % экрана, а за ней ждут другие (быстрая
          // прокрутка, TASK-qa.md): сразу готова. Иначе видимые секции ждали, пока частицы соберут почти невидимую полоску
          if (r.bottom < 0 || (queue.length > 1 && r.top < 0 && r.bottom < VH * 0.12)) { queue.shift(); setStage(q, 'done'); q.state = 'done'; setProg(); wakeSites(q.el); if (q === hero) skipHero(); continue; }
          if (r.top > VH) { queue.shift(); q.state = 'idle'; continue; }
          break;
        }
        if (!queue.length) { if (!running && replaying) pultLater(); return; }
        if (now < jumpUntil && !replaying) {
          var vis = queue.filter(function (x) { if (x === hero || x.replay || x.instant) return false; var r = x.el.getBoundingClientRect(); return r.bottom > 0 && r.top < VH; });
          if (vis.length) { queue = queue.filter(function (x) { return vis.indexOf(x) < 0; }); runJump(vis); return; }
        }
        var s = queue.shift();
        if (s === hero) runHero(s, s.replay); else runSec(s);
      }
      // Прыжок (TASK-qa-decisions.md, 4): End, якорь через несколько экранов, рывок скроллбара — больше 1.5 высоты окна за
      // 300 мс или поездка scroll.js к якорю (pt:jump). Раньше очередь честно собирала оказавшиеся на экране секции по одной
      // (после End подвал ждал контакт ~1.5 с). Теперь проскоченные сразу готовы (как и раньше), а видимые — вместе, быстрой
      // сборкой (runJump: один луч FAST_LD, как при быстром заходе); идущая обычная сборка уходит в ту же группу.
      // travelEnd — до него pump ждёт: конец поездки к якорю; jumpUntil — до него видимые секции из очереди собираются
      // группой. Новые видимые секции наблюдатели сообщают после кадра (onSee → pump) — группа запускается оттуда, а если
      // сообщать нечего (на экране только прерванная сборка) — через два кадра
      var jumpUntil = 0, travelEnd = 0, pumpT = 0, yHist = [], lastY = window.scrollY || 0;
      function jumpNow(until) {
        if (rm || !alive) return;
        var now = performance.now();
        if (until) travelEnd = Math.max(travelEnd, until);
        jumpUntil = Math.max(jumpUntil, Math.max(travelEnd, now) + 600);
        var s = running;
        if (s && s !== hero && s.state === 'run' && !settleFn && !replaying && !s.jump) { runId++; running = null; cur = null; s.state = 'queued'; queue.unshift(s); }
        clearTimeout(pumpT);
        if (now < travelEnd) pumpT = setTimeout(pump, travelEnd - now + 30);
        else requestAnimationFrame(function () { requestAnimationFrame(function () { if (alive) pump(); }); });
      }
      // точка отсчёта — последняя позиция не позже чем 300 мс назад (End — один скачок после долгой паузы: сравнивать надо
      // с тем, где страница стояла до него)
      function onJumpScroll() {
        var t = performance.now(), y = window.scrollY || 0;
        if (!yHist.length) yHist.push(t - 1000, lastY);
        yHist.push(t, y);
        while (yHist.length > 4 && t - yHist[2] >= 300) yHist.splice(0, 2);
        if (Math.abs(y - yHist[1]) > VH * 1.5) { yHist = [t, y]; jumpNow(); }
        lastY = y;
      }
      function onJumpEv(e) { var d = (e && e.detail) || {}; jumpNow(d.until || 0); }
      // --ld всем элементам группы по положению слева направо: сначала все замеры, потом все записи (ловушка 7)
      function jumpDelays(list, sec) {
        var vw = Math.max(1, window.innerWidth), els = [], v = [], k;
        list.forEach(function (x) { Array.prototype.push.apply(els, x.el.querySelectorAll('*')); });
        for (k = 0; k < els.length; k++) { var r = els[k].getBoundingClientRect(); v.push((clamp(r.left / vw, 0, 1) * sec).toFixed(3) + 's'); }
        for (k = 0; k < els.length; k++) els[k].style.setProperty('--ld', v[k]);
      }
      function runJump(list) {
        var s = list[0], ft = null, my;
        runId++; my = runId; running = s; cur = null; runK = SEC_K;
        list.forEach(function (x) { x.state = 'run'; x.replay = false; x.jump = true; if (x.burst === 'pop') ft = x; });
        function end() { list.forEach(function (x) { x.el.classList.remove('pt-jump'); x.jump = false; }); if (beamEl && !running) beamEl.classList.remove('run'); }
        settleFn = function () { list.forEach(function (x) { setStage(x, 'done'); x.state = 'done'; wakeSites(x.el); }); end(); };
        seed(); list.forEach(function (x) { measure(x); });
        jumpDelays(list, FAST_LD);
        list.forEach(function (x) { x.el.classList.add('pt-jump'); setStage(x, 'done'); });
        line(beamEl, FAST_LD);
        phGlyphs(list, BLD, FAST_LD); log(s, 'jump · ' + list.length + ' × ' + list.map(function (x) { return x.name; }).join(', '));
        atRun(FAST_LD + 0.15, function () { phFade(BLD); });
        atRun(FAST_LD + 0.35, function () {
          settleFn = null; list.forEach(function (x) { x.state = 'done'; wakeSites(x.el); }); setProg(); log(s, '✓ ready');
          if (ft) popWait = ft;
          finish(s);
        });
        at(FAST_LD + 1.2, function () { if (runId === my || !running) end(); else list.forEach(function (x) { x.el.classList.remove('pt-jump'); x.jump = false; }); });
      }
      function request(s) { if (!s || s.state !== 'idle') return; s.state = 'queued'; queue.push(s); pump(); }
      // «Пересобрать блок» пересобирает всё, что видно на экране, а не одну секцию: иначе соседний блок оставался
      // нетронутым и казалось, что часть контента «не исчезает». Все видимые секции разом гаснут. Те, что занимают
      // от 12% высоты экрана, собираются заново из частиц сверху вниз, по очереди. Узкие полоски у края экрана
      // (instant) проявляются сразу после них: собирать их частицами значило бы заставить основной блок ждать.
      function replay() {
        if (rm) return;
        // идёт сборка (на телефоне — почти при каждой прокрутке) — сначала доводим её и всё, что ждёт в очереди на экране
        // (после доведения очередь сразу берёт следующую секцию), иначе нажатие ↻ ничего не делало
        for (var guard = 0; running && guard < secs.length + 2; guard++) skipNow();
        if (running) return;
        var list = [], minor = [];
        secs.forEach(function (x) {
          if (x.state !== 'done') return;
          var r = x.el.getBoundingClientRect(), v = Math.min(r.bottom, VH) - Math.max(r.top, 0);
          if (v >= VH * 0.12) list.push(x); else if (v > 0) minor.push(x);
        });
        if (!list.length) return;
        var s = list[0], idx = BLD, every = list.concat(minor);
        runId++; running = s; replaying = true; clearTimeout(pultT); pultMini(false);
        every.forEach(function (x) { x.state = 'run'; });
        // прервали до постановки в очередь — все задетые секции сразу собраны (иначе гасли насовсем)
        settleFn = function () {
          every.forEach(function (x) { setStage(x, 'done'); x.state = 'done'; x.replay = false; x.instant = false; wakeSites(x.el); });
          if (list.indexOf(hero) >= 0) heroReplay();
        };
        measure(s); phText(s, idx, false); log(s, 'text.dissolve()');
        atRun(1.0, function () {
          every.forEach(function (x) {
            setStage(x, null);
            // сцены в карточках гаснут вместе с текстом (CSS) и спят до конца пересборки, потом собираются заново
            scenes.forEach(function (sc) { if (sc.sleep && x.el.contains(sc.cv)) sleepScene(sc); });
          });
          log(s, 'content.unmount()'); measure(s); phWire(s, idx, false);
        });
        atRun(1.7, function () {
          settleFn = null; running = null;
          list.forEach(function (x) { x.state = 'queued'; x.replay = true; });
          minor.forEach(function (x) { x.state = 'queued'; x.instant = true; });
          queue.unshift.apply(queue, every); setProg(); pump();
        });
      }
      // ---------- смена языка ----------
      function setToggle(lang) {
        langLinks.forEach(function (a) { if (a.getAttribute('data-lang') === lang) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
        Array.prototype.forEach.call(root.querySelectorAll('.lang'), function (g) { g.setAttribute('data-cur', lang); });
      }
      // Подмена текста. Длина текста меняется, и блоки выше экрана могут вырасти или сжаться: якорь — первый блок
      // у верхнего края экрана, после подмены прокрутка возвращает его на место. Сцены в карточках пересобираются.
      function swapLang(lang, list) {
        var I = window.PTI18N, anchor = null, top0 = 0;
        (list || secs).some(function (x) {
          return Array.prototype.some.call(x.el.querySelectorAll('[data-blk]'), function (b) { var r = b.getBoundingClientRect(); if (r.bottom > 0) { anchor = b; top0 = r.top; return true; } return false; });
        });
        root.classList.add('no-anchor');
        I.apply(lang); if (heroNow()) heroObj.relabel(); layoutGen++;
        if (anchor) { var d = anchor.getBoundingClientRect().top - top0; if (Math.abs(d) > 0.5) window.scrollTo({ top: window.scrollY + d, behavior: 'instant' }); }
        requestAnimationFrame(function () { root.classList.remove('no-anchor'); });
        scenes.forEach(function (sc) { if (sc.relang) sc.relang(); });
      }
      // точки букв только в пределах экрана (±60 px): при смене языка все частицы уходят в видимый текст
      function clipGl(G, y0, y1) {
        function cut(g) {
          var o = { n: 0, x: [], y: [], r: [], g: [], b: [] };
          for (var k = 0; k < g.n; k++) if (g.y[k] >= y0 && g.y[k] <= y1) { o.x.push(g.x[k]); o.y.push(g.y[k]); o.r.push(g.r[k]); o.g.push(g.g[k]); o.b.push(g.b[k]); }
          o.n = o.x.length; return o;
        }
        var B = cut(G.big), S = cut(G.small);
        return { n: B.n + S.n, big: B, small: S };
      }
      // частицы — в буквы и контуры рамок нескольких секций сразу (при смене языка гаснут и рамки, кнопки, панели —
      // их держат частицы); волна слева направо за spread секунд (в такт с лучом)
      function phGlyphs(list, idx, spread) {
        var y0 = -rootTop - 60, y1 = -rootTop + VH + 60, gens = [], frs = [], gw = 0;
        list.forEach(function (x) {
          ensureGl(x); var g = x.geo && x.geo.gl ? clipGl(x.geo.gl, y0, y1) : null; if (g && g.n) { gens.push({ w: g.n, f: gGlyph(g, 0.82) }); gw += g.n; }
          if (x.geo) x.geo.frames.forEach(function (f) { if (f.y + f.h >= y0 && f.y <= y1) frs.push(f); });
        });
        if (frs.length) gens.push({ w: Math.max(1, gw) * 0.3, f: gFrames(frs, 0.6, 1.35) });
        if (!gens.length) gens.push({ w: 1, f: gAmbient });
        fill(idx, gens, fopt(false, 'x', 0, 1, spread, 0.08, false));
        cur = null;
      }
      // Смена языка на экране. Частицы ложатся на буквы текущего текста и контуры рамок, и гаснет всё сразу: у секций
      // снимается s-done (.s-swap — быстрее обычного), пропадают текст, рамки, кнопки, подпись панели, объект и сцены.
      // Луч проходит экран слева направо, за ним частицы перелетают в буквы и рамки нового языка; потом всё
      // проявляется, объект и сцены собираются заново, частицы гаснут. Секции за экраном получают новый текст сразу.
      // Клик или клавиша доводят смену мгновенно (skipNow).
      function morph(lang, list) {
        var s = list[0], swapped = false, shown = false;
        runId++; running = s; cur = null;
        list.forEach(function (x) { x.state = 'run'; });
        function swap() { if (!swapped) { swapped = true; swapLang(lang, list); } }
        function reveal() {
          if (shown) return; shown = true;
          list.forEach(function (x) { x.el.classList.remove('s-swap'); setStage(x, 'done'); wakeSites(x.el); if (x === hero) heroReplay(); });
        }
        function end() { reveal(); list.forEach(function (x) { x.state = 'done'; }); if (beamEl) beamEl.classList.remove('run'); }
        settleFn = function () { swap(); end(); };
        list.forEach(function (x) { measure(x); });
        phGlyphs(list, BLD, 0.3); log(s, 'i18n · text.capture()');
        atRun(0.45, function () {
          list.forEach(function (x) {
            x.el.classList.add('s-swap'); setStage(x, null);
            // сцены гаснут вместе со всем и спят: на новом языке они соберутся заново, уже на виду (wakeSites)
            scenes.forEach(function (sc) { if (sc.sleep && x.el.contains(sc.cv)) sleepScene(sc); });
          });
        });
        atRun(0.95, function () {
          swap(); list.forEach(function (x) { measure(x); });
          if (beamEl) { beamEl.style.setProperty('--beam', BEAM + 's'); beamEl.classList.remove('run'); void beamEl.offsetWidth; beamEl.classList.add('run'); }
          phGlyphs(list, BLD, BEAM); log(s, 'i18n · locale("' + lang + '") · morph()');
        });
        atRun(0.95 + BEAM + 0.35, function () { reveal(); phFade(BLD); log(s, '✓ ' + lang); });
        atRun(0.95 + BEAM + 0.75, function () { settleFn = null; end(); running = null; if (!queue.length) phSettle(BLD); pump(); });
      }
      function setLang(lang) {
        var I = window.PTI18N;
        if (!I || !alive) return;
        if (running && !rm) skipNow();
        setToggle(lang);
        if (lang === I.lang) return;
        I.toUrl(lang);
        var list = [];
        if (!rm) secs.forEach(function (x) { if (x.state !== 'done') return; var r = x.el.getBoundingClientRect(); if (r.bottom > 0 && r.top < VH) list.push(x); });
        if (list.length) morph(lang, list); else swapLang(lang, null);
      }
      function onLang(e) {
        if (!window.PTI18N || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        setLang(e.currentTarget.getAttribute('data-lang'));
      }
      function emit(x, y, dx, dy) {
        var i = sI; sI = (sI + 1) % SMK;
        sX[i] = x + (Math.random() - 0.5) * 4; sY[i] = y + (Math.random() - 0.5) * 4;
        sVX[i] = dx * 0.02 + (Math.random() - 0.5) * 0.6; sVY[i] = dy * 0.02 + (Math.random() - 0.5) * 0.6 - 0.15;
        sM[i] = sL[i] = 1.1 + Math.random() * 0.7; sC[i] = (performance.now() / 2600) % 1;
      }
      function onMove(e) {
        mouse.cx = e.clientX; mouse.cy = e.clientY;
        if (rm) return;
        if (lastPX != null) {
          var dx = e.clientX - lastPX, dy = e.clientY - lastPY, d = Math.sqrt(dx * dx + dy * dy), n = Math.min(14, Math.floor(d / 3));
          if (!lite && n) { if (!SPR.length) makeSprites(); for (var k = 1; k <= n; k++) emit(lastPX + dx * k / n, lastPY + dy * k / n, dx, dy); }
          if (n) { lastPX = e.clientX; lastPY = e.clientY; }
        } else { lastPX = e.clientX; lastPY = e.clientY; }
        start();
      }
      function onOut(e) { if (!e.relatedTarget) { mouse.cx = -1e5; mouse.cy = -1e5; lastPX = lastPY = null; } }
      function reapply() { if (cur && running === cur.s) { measure(cur.s); cur.f(cur.s, cur.idx, true); } }
      // Телефон: при прокрутке браузер прячет и показывает адресную строку — меняется только высота окна, а раскладка страницы
      // та же (vh считается от большого окна). Раньше каждый такой resize сбрасывал замеры всех секций, пересоздавал холсты и
      // перезапускал текущую стадию сборки (рывок всех частиц, ~100 мс на телефоне). Теперь — только новая высота для отсечения
      // частиц: холст с запасом CM и так закрывает окно. Настоящий ресайз (другая ширина, поворот, окно на компьютере) — как
      // раньше, но не чаще раза в 120 мс, последний — обязательно
      var rzT = 0, rzAt = 0, coarse = !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
      function onResize() {
        var w = root.clientWidth || window.innerWidth || 1, h = window.innerHeight || 800;
        if (coarse && w === W && Math.abs(h - layoutVH) <= CM) { if (h !== VH) { VH = h; env.vh = h; } return; }
        var now = performance.now(); clearTimeout(rzT);
        if (now - rzAt >= 120) resizeNow(); else rzT = setTimeout(resizeNow, 120 - (now - rzAt));
      }
      function resizeNow() { rzT = 0; rzAt = performance.now(); layoutGen++; layout(); rootRect(); reapply(); if (rm) { snap(); frame(performance.now()); } }
      // Сцены в карточках пересчитываются по размеру своего окна (ResizeObserver), а не по каждому resize окна: высота окна
      // (адресная строка) их не касается; окно, показанное фильтром или панелью, получает размер само. Первое сообщение
      // наблюдателя — размер при старте: его уже взял layout()
      var sro = null;
      function watchScenes() {
        if (sro || !scenes.length || !('ResizeObserver' in window)) return;
        var boxes = [], lists = [], seen = [];
        scenes.forEach(function (sc) { var b = sc.cv.parentNode || sc.cv, k = boxes.indexOf(b); if (k < 0) { boxes.push(b); lists.push([sc]); seen.push(''); } else lists[k].push(sc); });
        sro = new ResizeObserver(function (es) {
          for (var e = 0; e < es.length; e++) {
            var k = boxes.indexOf(es[e].target), r = es[e].contentRect, key = Math.round(r.width) + 'x' + Math.round(r.height);
            if (k < 0) continue;
            var was = seen[k]; seen[k] = key;
            if (!was || was === key) continue;
            env.mob = (root.clientWidth || window.innerWidth) < 760;
            for (var j = 0; j < lists[k].length; j++) lists[k][j].resize();
          }
        });
        boxes.forEach(function (b) { sro.observe(b); });
      }
      // Догрузка шрифтов только сбрасывает кэш замеров: следующая стадия возьмёт свежую геометрию. Мгновенный
      // перезапуск текущей стадии (reapply) давал рывок всех частиц, если шрифт приходил посреди сборки.
      function onFonts() { layoutGen++; }
      markText();
      root.classList.add('pt-on');
      // режим «сразу»: на первые кадры переходы выключены (.pt-instant) — секции получают s-done в том же кадре, что
      // снимается .pt-boot, и ничего не проявляется постепенно
      if (MODE === 'instant') root.classList.add('pt-instant');
      // текст и рамки уже скрыты движком — фиксируем это без переходов и открываем секции (см. .pt-boot в site.css)
      void root.offsetWidth;
      root.classList.remove('pt-boot');
      scenes = window.PTScenes ? window.PTScenes.create(root, env) : [];
      // объект первого экрана: модуль сам создаёт в секции холсты [data-gl]/[data-ov] (data-pt-skip, без кликов),
      // подписи панели, стрелки и строку принципов; ошибка модуля не должна ронять сборку сайта
      var objPanel = hero.el.querySelector('[data-obj]');
      heroLazy = !!(window.PTHero && objPanel && !rm && MODE !== 'instant' && window.matchMedia && window.matchMedia('(max-width: 760px)').matches && 'IntersectionObserver' in window);
      if (heroLazy) {
        // «вошла в экран» — от прокрутки: на большинстве телефонов (390–430 px) верх панели и так виден на 25–60 % с первого
        // кадра, и монтаж пришёлся бы на вступление. Без прокрутки — после вступления (heroIdle)
        var y0 = window.scrollY || 0;
        heroIO = new IntersectionObserver(function (es) { if (Math.abs((window.scrollY || 0) - y0) > 8 && es.some(function (e) { return e.intersectionRatio >= 0.25; })) heroWakeSoft(); }, { threshold: [0, 0.25, 0.5, 0.75, 1] });
        heroIO.observe(objPanel);
        // касание панели до монтажа: смонтировать и запустить сразу — обработчики модуля получат этот же клик
        hero.el.addEventListener('click', function (e) { if (heroLazy && e.target.closest && e.target.closest('[data-obj]')) { objPend = true; heroWake(); } }, true);
      } else try { heroObj = window.PTHero ? window.PTHero.mount(hero.el, { autostart: false }) : null; } catch (e) { heroObj = null; console.warn(e); }
      initGL(); layout(); rootRect(); watchScenes();
      btns.forEach(function (b) { b.addEventListener('click', replay); });
      langLinks.forEach(function (a) { a.addEventListener('click', onLang); });
      if (lite) root.classList.add('pt-lite');
      window.addEventListener('wheel', onSkip, { passive: true });
      window.addEventListener('touchmove', onSkip, { passive: true });
      window.addEventListener('pointerdown', onSkip, { passive: true });
      window.addEventListener('keydown', onSkip);
      window.addEventListener('pointermove', onMove, { passive: true });
      window.addEventListener('pointerdown', onMove, { passive: true });
      window.addEventListener('pointerout', onOut);
      window.addEventListener('resize', onResize);
      window.addEventListener('scroll', onHold, { passive: true });
      window.addEventListener('scroll', onJumpScroll, { passive: true });
      window.addEventListener('pt:jump', onJumpEv);
      window.addEventListener('pt:shown', onShown);
      window.addEventListener('pt:wake', onWakeEv);
      window.addEventListener('pt:sleep', onSleepEv);
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(onFonts);
      if (document.fonts && document.fonts.addEventListener) document.fonts.addEventListener('loadingdone', onFonts);
      if (rm || MODE === 'instant') {
        // reduced motion и режим «сразу»: всё на местах с первого кадра. В «сразу» — с движением: объект живёт, пыль на
        // местах, сцены и рисунки играют; прокрутку (назад, обновление) браузер восстанавливает сам — якорем не трогаем
        root.classList.add('g-on');
        secs.forEach(function (s) { setStage(s, 'done'); s.state = 'done'; wakeSites(s.el); });
        objStart(true);
        if (rm) { snap(); frame(performance.now()); }
        else {
          seed(); start();
          requestAnimationFrame(function () { requestAnimationFrame(function () { root.classList.remove('pt-instant'); }); });
        }
        setProg(); typeLabel('✓ ready'); pultShown = true; pultMini(true); root.classList.add('pt-booted');
      } else {
        secs.forEach(function (s) { if (s !== hero && s.state === 'idle') s.el.classList.add('pt-wait'); });
        if (!jumpStart()) request(hero);
        if ('IntersectionObserver' in window) {
          // Секции, ставшие видимыми в одном кадре (их сообщают два наблюдателя: io и io2 подвала), сначала все встают в
          // очередь, потом — по порядку на странице — сборка (seeT, один отложенный вызов). Раньше первой начинала та, о
          // которой сообщили раньше: при быстрой прокрутке вниз — подвал или полоска верхней секции, а основной блок ждал
          var onSee = function (es) {
            es.forEach(function (e) { if (e.isIntersecting) { for (var i = 0; i < secs.length; i++) if (secs[i].el === e.target && secs[i].state === 'idle') { secs[i].state = 'queued'; queue.push(secs[i]); } } });
            if (!seeT) seeT = setTimeout(function () { seeT = 0; if (!alive) return; queue.sort(function (a, b) { return secs.indexOf(a) - secs.indexOf(b); }); pump(); }, 0);
          };
          io = new IntersectionObserver(onSee, { rootMargin: '0px 0px -18% 0px', threshold: 0 });
          secs.forEach(function (s) { io.observe(s.el); });
          // последняя секция (подвал) — без отступа снизу: она бывает ниже 18% окна и тогда никогда не попала бы в полосу
          io2 = new IntersectionObserver(onSee, { threshold: 0 }); io2.observe(secs[secs.length - 1].el);
          // первый экран ушёл из кадра — перелив заголовка и пульсация точки на паузе (.pt-away): их всё равно не видно, а
          // браузер пересчитывал их каждый кадр
          io4 = new IntersectionObserver(function (es) { hero.el.classList.toggle('pt-away', !es[es.length - 1].isIntersecting); }, { threshold: 0 });
          io4.observe(hero.el);
          // секции в полутора экранах ниже — замер и растр букв заранее (prefetch)
          io3 = new IntersectionObserver(function (es) {
            es.forEach(function (e) { for (var i = 0; i < secs.length; i++) if (secs[i].el === e.target) { var s = secs[i], k = near.indexOf(s); if (e.isIntersecting) { if (k < 0) near.push(s); if (preOn) { prefetch(s); prepScenes(s); } } else if (k >= 0) near.splice(k, 1); } });
          }, { rootMargin: '0px 0px 150% 0px', threshold: 0 });
          secs.forEach(function (s) { io3.observe(s.el); });
        } else secs.forEach(function (s) { request(s); });
        start();
      }
      // страница открыта в этой вкладке: при возврате на неё — режим «сразу»
      if (AUTO_MODE) try { var seenNow = JSON.parse(sessionStorage.getItem('pt-seen') || '[]'); if (seenNow.indexOf(PAGE) < 0) { seenNow.push(PAGE); sessionStorage.setItem('pt-seen', JSON.stringify(seenNow)); } } catch (e) { /* хранилище запрещено */ }
      // «Назад» из кэша браузера (bfcache): страница вернулась целиком, сборка уже готова — только возобновляем кадры.
      // unload / beforeunload не вешаем: они отключают bfcache
      window.addEventListener('pageshow', function (e) { if (e.persisted) { prev = performance.now(); start(); } });
      // панель замеров (?hud, assets/perf-hud.js): разрешение холста частиц и вид прокрутки колесом
      // boot, late, first — для панели замеров (TASK-hud2.md, 2); first — undefined, пока первый экран не собран
      window.PTPerf = { dpr: function () { return dpr; }, scroll: function () { return window.PTScroll && window.PTScroll.mode === 'soft' ? 'soft' : 'native'; }, boot: BOOT, late: LATE, get first() { return firstT; } };
      return {
        setActive: function (v) { active = v; if (v) start(); },
        destroy: function () {
          alive = false; timers.forEach(clearTimeout); clearInterval(typeT); clearTimeout(pultT); clearTimeout(seeT); if (raf) cancelAnimationFrame(raf); if (io) io.disconnect(); if (io2) io2.disconnect(); if (io3) io3.disconnect(); if (io4) io4.disconnect();
          btns.forEach(function (b) { b.removeEventListener('click', replay); });
          if (heroObj) heroObj.destroy(); if (heroIO) heroIO.disconnect(); clearTimeout(heroIdleT);
          langLinks.forEach(function (a) { a.removeEventListener('click', onLang); });
          siteOff.forEach(function (off) { off(); });
          window.removeEventListener('scroll', onScrollSites);
          window.removeEventListener('pointermove', onMove);
          window.removeEventListener('pointerdown', onMove);
          window.removeEventListener('pointerout', onOut);
          window.removeEventListener('resize', onResize); window.removeEventListener('scroll', onHold); clearTimeout(holdT); clearTimeout(rzT); if (sro) sro.disconnect();
          window.removeEventListener('scroll', onJumpScroll); window.removeEventListener('pt:jump', onJumpEv); clearTimeout(pumpT);
          window.removeEventListener('pt:shown', onShown); window.removeEventListener('pt:wake', onWakeEv); window.removeEventListener('pt:sleep', onSleepEv);
          window.removeEventListener('wheel', onSkip); window.removeEventListener('touchmove', onSkip);
          window.removeEventListener('pointerdown', onSkip); window.removeEventListener('keydown', onSkip);
          if (document.fonts && document.fonts.removeEventListener) document.fonts.removeEventListener('loadingdone', onFonts);
          if (gl) { var ext = gl.getExtension('WEBGL_lose_context'); if (ext) ext.loseContext(); }
        }
      };
    };
      var el = document.getElementById('pt-site');
  if (el) { try { factory(el); } catch (e) { console.error(e); el.classList.remove('pt-on', 'pt-boot'); } }
})();
