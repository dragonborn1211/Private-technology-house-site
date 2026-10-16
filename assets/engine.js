// Движок сборки из частиц. Сцены в карточках живут в assets/scenes.js (window.PTScenes) и подключаются раньше.
(function () {
    var factory = function (root) {
      var canvas = root.querySelector('[data-pt-canvas]');
      var stepEl = root.querySelector('[data-pt-step]'), progEl = root.querySelector('[data-pt-prog]');
      // «Пересобрать блок»: кнопка в плашке пульта и свёрнутая кнопка ↻
      var btns = Array.prototype.slice.call(root.querySelectorAll('[data-pt-replay]'));
      var countEl = root.querySelector('[data-pt-count]');
      var rm = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
      var env = { rm: rm, mob: false, vh: 800 };
      var gl = null, c2 = null;
      if (canvas) {
        try { gl = canvas.getContext('webgl', { antialias: false, alpha: true, premultipliedAlpha: true }) || canvas.getContext('experimental-webgl', { alpha: true }); } catch (e) { gl = null; }
        if (!gl) c2 = canvas.getContext('2d');
      }
      var oc = document.createElement('canvas'), og = oc.getContext('2d', { willReadFrequently: true });
      var W = 1, VH = 1, dpr = 1, mob = false, N = 0, alive = true, active = true, raf = 0, prev = performance.now();
      var rootTop = 0, rootLeft = 0, lastTop = null;
      var mouse = { cx: -1e5, cy: -1e5 };
      var P, V, T, NT, C, CT, NC, A, AT, NA, SZ, NS, SW, M, NM, SP, TP, BUF, ALL = [], BLD = [];
      var layoutGen = 0, lzT = [0, 0, 0, 0], lzQ = 0;
      var prog = null, buf = null, U = {};
      var SMK = 520, sX = new Float32Array(SMK), sY = new Float32Array(SMK), sVX = new Float32Array(SMK), sVY = new Float32Array(SMK), sL = new Float32Array(SMK), sM = new Float32Array(SMK), sC = new Float32Array(SMK), sI = 0, lastPX = null, lastPY = null;
      var smk = root.querySelector('[data-pt-smoke]'), sctx = smk ? smk.getContext('2d') : null, SPR = [], smokeLive = false;
      var sites = Array.prototype.slice.call(root.querySelectorAll('.site-view iframe')), scenes = [];
      // язык: ссылки RU / EN в шапке и луч, который проходит экран при смене языка
      var langLinks = Array.prototype.slice.call(root.querySelectorAll('[data-lang]')), beamEl = root.querySelector('[data-lang-beam]');
      var COL = { frost: [238, 243, 246], glass: [188, 211, 222], skel: [96, 124, 142], accent: [142, 216, 248] };
      var DUST = [[142, 216, 248], [127, 168, 255], [183, 166, 242], [159, 229, 209], [230, 236, 241]];
      // burst (data-pt-burst) — финал сборки секции. Без атрибута — тихий: частицы гаснут на месте (phSettle; так у всех
      // секций, кроме подвала, TASK-structure.md). "soft" — мягкий «выдох» (phPuff): только у подвала, акцент «страница
      // кончилась» (TASK-clarity.md, B8). Пустое значение — прежний сильный разлёт по экрану (phAmbient), оставлен на будущее
      var secs = Array.prototype.slice.call(root.querySelectorAll('[data-sec]')).map(function (el) { return { el: el, name: el.getAttribute('data-sec'), state: 'idle', geo: null, geoKey: '', replay: false, burst: el.getAttribute('data-pt-burst') }; });
      var pultEl = root.querySelector('[data-pult]'), pultT = 0, pultShown = false, replaying = false;
      var hero = secs[0], queue = [], running = null, timers = [], typeT = 0, cur = null, io = null, io2 = null;
      // «Тихие» зоны — текстовые блоки первого экрана (кикер, H1, лид, кнопки, строка доверия) и текст панели «Кодекс
      // студии» (вкладки сверху, подпись снизу): фоновая пыль на них не ложится ни при раскладке (gAmbient выбирает
      // точку заново), ни при дрейфе (такая точка не рисуется). Координаты — от корня, как у частиц; пересчёт при смене
      // раскладки (layoutGen).
      var calmEls = Array.prototype.filter.call(hero.el.querySelectorAll('[data-blk]'), function (b) { return !b.matches('[data-obj], header'); })
        .concat(Array.prototype.slice.call(hero.el.querySelectorAll('[data-obj] .obj-top, [data-obj] .obj-cw')));
      var calm = [], calmGen = -1;
      // доля видимых точек пыли после сборки
      var DUSTA = 0.035, DUSTM = 0.015;
      // Объект первого экрана — пять принципов студии (assets/hero-objects.js, свой WebGL-холст в секции).
      // Движок только запускает его в конце сборки первого экрана; без модуля сайт работает как раньше.
      var heroObj = null;
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
      try { lite = +sessionStorage.getItem('pt-lite') || 0; } catch (e) {}
      if (lite >= 2) dprCap = 1;
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
      var MODE = (function () {
        var q = /[?&]intro=(full|fast|instant)(?:&|$)/.exec(location.search);
        if (rm) return 'rm';
        if (q) return q[1];
        if (!AUTO_MODE) return 'full';
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
      // Повторный переход в этой вкладке (вторая и следующие страницы, обновление): та же полная сборка, темп ×REPEAT_K
      // (просьба владельца: «чуть-чуть» быстрее). ?intro=… — без ускорения, чтобы проверки шли в одном темпе.
      // «Пересобрать блок» (PRESENT_K) не меняется. Выше этой строки от HERO_K / SEC_K зависит только runK — пересчитан.
      var REPEAT_K = 0.75, REPEAT = false;
      try { REPEAT = sessionStorage.getItem('pt-nav') === '1'; sessionStorage.setItem('pt-nav', '1'); } catch (e) { /* хранилище запрещено — полный темп */ }
      if (REPEAT && MODE === 'full' && !/[?&]intro=/.test(location.search)) { HERO_K *= REPEAT_K; SEC_K *= REPEAT_K; runK = SEC_K; root.setAttribute('data-repeat', ''); }

      function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
      function tr(s) { return window.PTI18N ? window.PTI18N.t(s) : s; }
      function fmtN() { try { return N.toLocaleString('ru-RU'); } catch (e) { return String(N); } }
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
      function pultSkip() { if (!pultShown && !replaying) { pultShown = true; clearTimeout(pultT); pultMini(true, true); } }
      function at(sec, fn) { timers.push(setTimeout(function () { if (alive) fn(); }, Math.max(0, sec) * 1000)); }
      function rootRect() { var r = root.getBoundingClientRect(); rootLeft = r.left; rootTop = r.top; return r; }
      function setStage(s, st) { var c = s.el.classList; c.remove('s-wire', 's-skel', 's-text', 's-done'); if (st) c.add('s-' + st); }
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
        Array.prototype.forEach.call(el.querySelectorAll('[data-blk]'), function (b) {
          var t = b.querySelector('[data-wf-size]'); if (!t) return;
          // размер — в атрибут (CSS выводит его в ::after): служебная подпись не становится текстом страницы
          t.setAttribute('data-wf-size', Math.round(b.offsetWidth) + '×' + Math.round(b.offsetHeight));
        });
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
      function glyphs(words) {
        var xs = [], ys = [], cr = [], cg = [], cb = [], big = [], small = [];
        words.forEach(function (w) { (w.st.fs >= 30 ? big : small).push(w); });
        // Слова рисуются не на месте (холст размером со всю секцию почти пустой: дорого выделять, читать и
        // перебирать), а плотно, «полками», в компактный атлас. Каждая найденная точка переносится обратно
        // в координаты своего слова на странице. Запас px — под курсивный вынос.
        function pass(ws, step) {
          if (!ws.length) return;
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
          var d = og.getImageData(0, 0, w, h).data;
          cells.forEach(function (cl) {
            var ox = cl.wd.x - cl.px - cl.ax, oy = cl.wd.y - 2 - cl.ay, xe = Math.min(w, cl.ax + cl.bw), ye = Math.min(h, cl.ay + cl.bh);
            for (var y = cl.ay; y < ye; y += step) {
              var row = y * w;
              for (var x = cl.ax; x < xe; x += step) {
                var k = (row + x) * 4;
                if (d[k + 3] > 110) { xs.push(ox + x + Math.random() * step); ys.push(oy + y + Math.random() * step); cr.push(d[k]); cg.push(d[k + 1]); cb.push(d[k + 2]); }
              }
            }
          });
        }
        function pack() { var o = { n: xs.length, x: Float32Array.from(xs), y: Float32Array.from(ys), r: Uint8Array.from(cr), g: Uint8Array.from(cg), b: Uint8Array.from(cb) }; xs = []; ys = []; cr = []; cg = []; cb = []; return o; }
        pass(big, 2); var B = pack(); pass(small, 1); var S = pack();
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
      function ensureGl(s) { if (s.geo && !s.geo.gl) s.geo.gl = glyphs(s.geo.words); }
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
        calmGen = layoutGen; calm = [];
        var rl = root.getBoundingClientRect();
        calmEls.forEach(function (b) { var r = b.getBoundingClientRect(); if (r.width > 0) calm.push(r.left - rl.left - 6, r.top - rl.top - 6, r.right - rl.left + 6, r.bottom - rl.top + 6); });
        return calm;
      }
      function inCalm(x, y) { for (var k = 0; k < calm.length; k += 4) if (x > calm[k] && x < calm[k + 2] && y > calm[k + 1] && y < calm[k + 3]) return true; return false; }
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
      function fill(idx, gens, opt) {
        var tot = 0, cum = [], now = performance.now();
        gens.forEach(function (g) { tot += g.w; cum.push(tot); });
        for (var k = 0; k < idx.length; k++) {
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
      }
      function sweep(s, inst, spread) {
        if (s === hero && heroSweep) return heroSweep.axis === 'x' ? { instant: inst, axis: 'x', spread: heroSweep.spread, rnd: 0.06 } : { instant: inst, axis: 'y', y0: -rootTop, h: VH, spread: heroSweep.spread, rnd: 0.06 };
        return s === hero ? { instant: inst, axis: 'x', spread: spread * 0.8, rnd: 0.1 } : { instant: inst, axis: 'y', y0: s.geo.box.y, h: Math.min(s.geo.box.h, VH * 1.4), spread: spread * runK, rnd: 0.12 * runK }; }
      function phGrid(s, idx, inst) {
        var cols = [];
        Array.prototype.forEach.call(root.querySelectorAll('.pt-col'), function (el) { var r = el.getBoundingClientRect(); if (r.width > 0) cols.push(r.left - rootLeft, r.right - rootLeft); });
        Array.prototype.forEach.call(root.querySelectorAll('.pt-edge'), function (el) { var r = el.getBoundingClientRect(); if (r.left - rootLeft > 2 && r.left - rootLeft < W - 2) cols.push(r.left - rootLeft); });
        if (!cols.length) cols = [0, W];
        var y0 = s.geo.box.y, hh = Math.min(s.geo.box.h, VH);
        fill(idx, [{ w: 1, f: function (o) { o.x = cols[(Math.random() * cols.length) | 0] + (Math.random() - 0.5) * 1.2; o.y = y0 + Math.random() * hh; setC(o, Math.random() < 0.6 ? COL.glass : DUST[(Math.random() * DUST.length) | 0]); o.a = 0.55; o.s = 1.5; o.m = 0; } }], { instant: inst, axis: 'y', y0: y0, h: hh, spread: 0.35, rnd: 0.12 });
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
        fill(idx, [{ w: 1, f: function (o) { gAmbient(o); o.m = 0; o.a = Math.random() < (mob ? DUSTM : DUSTA) ? 0.34 : 0; } }], { instant: inst, axis: 'x', spread: 0, rnd: inst ? 0 : 0.5 });
        at(inst ? 0 : 1.6, function () { if (running) return; for (var k = 0; k < idx.length; k++) { var i = idx[k]; if (SW[i]) NM[i] = 1; else M[i] = 1; } });
      }
      // Тихий финал сборки — теперь у всех секций (data-pt-burst нет нигде): частицы догасают на месте, а уже невидимыми
      // переезжают в случайные точки экрана (TP — телепорт при переключении). Пыль там проявляется без разлёта.
      function phSettle(idx) {
        var now = performance.now();
        for (var k = 0; k < idx.length; k++) {
          var i = idx[k], p = i * 2, c = i * 3;
          if (SW[i]) { T[p] = NT[p]; T[p + 1] = NT[p + 1]; CT[c] = NC[c]; CT[c + 1] = NC[c + 1]; CT[c + 2] = NC[c + 2]; AT[i] = NA[i]; SZ[i] = NS[i]; M[i] = NM[i]; }
          gAmbient(tmp);
          NT[p] = tmp.x; NT[p + 1] = tmp.y; NC[c] = tmp.r / 255; NC[c + 1] = tmp.g / 255; NC[c + 2] = tmp.b / 255;
          NA[i] = Math.random() < (mob ? DUSTM : DUSTA) ? 0.34 : 0; NS[i] = tmp.s; NM[i] = 1; TP[i] = 1;
          SW[i] = now + 1300 + Math.random() * 700;
        }
      }
      // Мягкий «выдох» в конце страницы (подвал, data-pt-burst="soft"): частицы с букв и рамок не гаснут на месте, а
      // расходятся недалеко от подвала — от его середины наружу, с разбросом ±35°, на 40–160 px (телефон 25–90), по
      // вертикали ×0.6 (облако приплюснутое) — и тают; 30 % на миг светятся. Через 1.2 с — как тихий финал: уже невидимые
      // уезжают в пыль. Примерно четверть прежнего разлёта: облако не выходит за подвал и полосу над ним.
      function phPuff(idx, s) {
        var now = performance.now(), g = s.geo && s.geo.box, cx = W / 2, cy = g ? g.y + g.h / 2 : -rootTop + VH * 0.85;
        var lo = mob ? 25 : 40, hi = mob ? 90 : 160, lit = [];
        for (var k = 0; k < idx.length; k++) {
          var i = idx[k], p = i * 2, c = i * 3;
          if (SW[i]) { T[p] = NT[p]; T[p + 1] = NT[p + 1]; CT[c] = NC[c]; CT[c + 1] = NC[c + 1]; CT[c + 2] = NC[c + 2]; SZ[i] = NS[i]; M[i] = NM[i]; SW[i] = 0; }
          if (M[i] || A[i] < 0.05) continue;
          var ang = Math.atan2(P[p + 1] - cy, P[p] - cx) + (Math.random() - 0.5) * 1.22, len = lo + Math.random() * (hi - lo);
          NT[p] = P[p] + Math.cos(ang) * len; NT[p + 1] = P[p + 1] + Math.sin(ang) * len * 0.6;
          NC[c] = CT[c]; NC[c + 1] = CT[c + 1]; NC[c + 2] = CT[c + 2]; NS[i] = SZ[i]; NM[i] = 0;
          if (Math.random() < 0.3) { NA[i] = 0.5; lit.push(i); } else NA[i] = 0;
          SW[i] = now + Math.random() * 120; AT[i] = A[i];
        }
        // короткое свечение — и тоже тают
        at(0.45, function () { if (running) return; for (var q = 0; q < lit.length; q++) { if (SW[lit[q]]) NA[lit[q]] = 0; else AT[lit[q]] = 0; } });
        at(1.2, function () { if (running) return; phSettle(idx); });
      }
      function alloc() {
        N = gl ? (mob ? 14000 : 26000) : (mob ? 3000 : 6000);
        P = new Float32Array(N * 2); V = new Float32Array(N * 2); T = new Float32Array(N * 2); NT = new Float32Array(N * 2);
        C = new Float32Array(N * 3); CT = new Float32Array(N * 3); NC = new Float32Array(N * 3);
        A = new Float32Array(N); AT = new Float32Array(N); NA = new Float32Array(N); SZ = new Float32Array(N); NS = new Float32Array(N);
        SW = new Float64Array(N); M = new Uint8Array(N); NM = new Uint8Array(N); SP = new Float32Array(N); TP = new Uint8Array(N);
        BUF = new Float32Array((N + SMK) * 7); ALL = []; BLD = [];
        for (var i = 0; i < N; i++) {
          SP[i] = Math.random() < 0.5 ? -1 : 1;
          M[i] = 1; A[i] = 0; P[i * 2] = -999; P[i * 2 + 1] = -999; SZ[i] = 1.4;
          ALL.push(i); BLD.push(i);
        }
        if (countEl) countEl.setAttribute('data-an', 'webgl · ' + fmtN() + ' particles');
      }
      // Если вспышки первого экрана не было (например, после перезагрузки в середине страницы первый экран пропущен),
      // частицы невидимо раскладываются по текущему экрану. Иначе сборка тянула бы их из угла за экраном.
      function seed() {
        if (booted) return;
        booted = true; rootRect();
        for (var i = 0; i < N; i++) {
          var p = i * 2, c = i * 3, col = DUST[(Math.random() * DUST.length) | 0];
          P[p] = T[p] = NT[p] = Math.random() * W; P[p + 1] = T[p + 1] = NT[p + 1] = -rootTop + Math.random() * VH; V[p] = V[p + 1] = 0;
          C[c] = CT[c] = NC[c] = col[0] / 255; C[c + 1] = CT[c + 1] = NC[c + 1] = col[1] / 255; C[c + 2] = CT[c + 2] = NC[c + 2] = col[2] / 255;
          A[i] = AT[i] = NA[i] = 0; SZ[i] = NS[i] = 1.5; M[i] = NM[i] = 1; SW[i] = 0; TP[i] = 0;
        }
      }
      // Линии вступления. line — запустить луч на sec секунд; linesOff — погасить (сборку первого экрана довели или
      // прервали); lineDelays — элемент проявляется, когда до него доходит линия: задержка по его положению (--ld).
      function line(el, sec) { if (!el) return; el.style.setProperty('--beam', sec + 's'); el.classList.remove('run'); void el.offsetWidth; el.classList.add('run'); }
      function linesOff() { heroSweep = null; root.classList.remove('pt-sweep'); if (!INTRO_LINES) return; if (beamEl) beamEl.classList.remove('run'); if (beamH) beamH.classList.remove('run'); }
      function lineDelays(sel, axis, sec) {
        var vw = Math.max(1, window.innerWidth);
        Array.prototype.forEach.call(hero.el.querySelectorAll(sel), function (el) {
          var r = el.getBoundingClientRect(), u = axis === 'x' ? r.left / vw : r.top / Math.max(1, VH);
          el.style.setProperty('--ld', (clamp(u, 0, 1) * sec).toFixed(3) + 's');
        });
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
        seed(); root.classList.add('g-on');
        if (heroObj) heroObj.start(true);
        pultSkip();
      }
      function burst() {
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
      }
      function snap() {
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
        W = Math.max(1, root.clientWidth || window.innerWidth || 1); VH = Math.max(1, window.innerHeight || 800); mob = W < 760;
        env.mob = mob; env.vh = VH;
        dpr = Math.min(window.devicePixelRatio || 1, dprCap);
        if (canvas) { canvas.width = Math.round(W * dpr); canvas.height = Math.round(VH * dpr); }
        if (c2) c2.setTransform(dpr, 0, 0, dpr, 0, 0);
        if (!N) alloc();
        if (gl && buf) { gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, BUF.byteLength, gl.DYNAMIC_DRAW); }
        if (smk) { smk.width = Math.ceil(W * 0.5); smk.height = Math.ceil(VH * 0.5); smokeLive = false; }
        fitSites();
        for (var si = 0; si < scenes.length; si++) scenes[si].resize();
      }
      // Адаптивное качество: окна по 2 с; если в двух окнах подряд медиана кадра дольше 24 мс (меньше ~42 fps),
      // спускаемся на уровень. Медиана, а не среднее: одиночный рывок (загрузка картинки, сборка секции) на быстрой
      // машине облегчение не включает. Паузой считаем только кадр дольше 1 с (вкладка была скрыта, отладчик) —
      // раньше паузой считался любой кадр дольше 0,1 с, и на самых медленных машинах (браузер без ускорения
      // видеокарты, ~6 к/с) облегчённый режим не включался никогда. Первые 3 с после старта не считаем.
      // Уровень помнится до конца сессии.
      var qSlow = 0;
      function watchQuality(now, raw) {
        if (raw > 1 || document.hidden) { qT = 0; qW.length = 0; return; }
        if (lite >= 2 || now - bootAt < 3000) return;
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
        if (n >= 2 && dprCap !== 1) { dprCap = 1; layout(); }
        try { sessionStorage.setItem('pt-lite', String(n)); } catch (e) {}
      }
      function frame(now) {
        var raw = Math.max(0, (now - prev) / 1000), dt = Math.min(0.05, raw); prev = now;
        if (!rm) watchQuality(now, raw);
        // мягкая прокрутка (assets/scroll.js) сдвигает страницу до замера: частицы не отстают от контента
        if (window.PTScroll) window.PTScroll.tick(now);
        rootRect();
        if (running && queue.length && now > abortAt) {
          abortAt = now + 200;
          var rr = running.el.getBoundingClientRect();
          if (rr.bottom < 0 || rr.top > VH) abortRun();
        }
        var shift = lastTop == null ? 0 : lastTop - rootTop; lastTop = rootTop;
        var f = Math.min(3, dt * 60), damp = Math.pow(0.855, f), k = 0.015 * f, dd = Math.pow(0.975, f);
        // курсор — «свет» (TASK-clarity.md, B4): слабый толчок от курсора и закручивание вокруг него — частицы обтекают его и
        // не улетают (раньше толчок ×1.6 выметал пыль, и вокруг мыши оставалось пустое пятно); свободная пыль в круге ярче и
        // чуть крупнее. На телефоне курсора нет — эффекта нет
        var mx = mouse.cx - rootLeft, my = mouse.cy - rootTop, R = mob ? 0 : 110, R2 = R * R;
        var ca = Math.min(1, dt * 3.5), aa = Math.min(1, dt * 3), ts = now * 0.00035, vt = -rootTop, n = 0;
        // первый экран собран и не пересобирается — свободные точки пыли в его текстовых блоках не рисуем
        var calmOn = hero.state === 'done' && calmZones().length > 0;
        // невидимые свободные частицы на экран не попадают: их дрейф считаем по очереди, четверть за кадр,
        // с накопленным временем своей четверти (lzT). Видимые частицы считаются каждый кадр, как раньше.
        lzQ = (lzQ + 1) & 3;
        for (var q = 0; q < 4; q++) lzT[q] += dt;
        var ldt = lzT[lzQ], lf = Math.min(12, ldt * 60), ldd = Math.pow(0.975, lf), lca = Math.min(1, ldt * 3.5), laa = Math.min(1, ldt * 3);
        lzT[lzQ] = 0;
        for (var i = 0; i < N; i++) {
          var p = i * 2, c = i * 3;
          if (SW[i] && now >= SW[i]) {
            T[p] = NT[p]; T[p + 1] = NT[p + 1]; CT[c] = NC[c]; CT[c + 1] = NC[c + 1]; CT[c + 2] = NC[c + 2];
            AT[i] = NA[i]; SZ[i] = NS[i]; M[i] = NM[i]; SW[i] = 0;
            if (TP[i]) { TP[i] = 0; P[p] = T[p]; P[p + 1] = T[p + 1]; V[p] = V[p + 1] = 0; A[i] = 0; C[c] = CT[c]; C[c + 1] = CT[c + 1]; C[c + 2] = CT[c + 2]; }
            else if (!M[i] && !rm) { V[p] += (Math.random() - 0.5) * 3; V[p + 1] += (Math.random() - 0.5) * 3; }
          }
          var x = P[p], y = P[p + 1], vx = V[p], vy = V[p + 1];
          if (M[i] && AT[i] === 0 && A[i] < 0.01) {
            y += shift;
            if ((i & 3) === lzQ) {
              vx += (Math.random() - 0.5) * 0.05 * lf + Math.sin(y * 0.0045 + ts + SP[i]) * 0.012 * lf;
              vy += (Math.random() - 0.5) * 0.05 * lf + Math.cos(x * 0.0045 - ts) * 0.012 * lf;
              vx *= ldd; vy *= ldd; x += vx * lf; y += vy * lf;
              if (x < -4) x += W + 8; else if (x > W + 4) x -= W + 8;
              if (y < vt - 30) y += VH + 60; else if (y > vt + VH + 30) y -= VH + 60;
              V[p] = vx; V[p + 1] = vy; P[p] = x;
              C[c] += (CT[c] - C[c]) * lca; C[c + 1] += (CT[c + 1] - C[c + 1]) * lca; C[c + 2] += (CT[c + 2] - C[c + 2]) * lca;
              A[i] += (AT[i] - A[i]) * laa;
            }
            P[p + 1] = y;
            continue;
          }
          if (M[i]) {
            y += shift;
            vx += (Math.random() - 0.5) * 0.05 * f + Math.sin(y * 0.0045 + ts + SP[i]) * 0.012 * f;
            vy += (Math.random() - 0.5) * 0.05 * f + Math.cos(x * 0.0045 - ts) * 0.012 * f;
            vx *= dd; vy *= dd;
          } else if (rm) { x = T[p]; y = T[p + 1]; vx = vy = 0; }
          else {
            var dx = T[p] - x, dy = T[p + 1] - y;
            vx = (vx + dx * k) * damp; vy = (vy + dy * k) * damp;
            var d2 = dx * dx + dy * dy;
            if (d2 > 400) { var dl = Math.sqrt(d2), sw = Math.min(1, dl / 260) * 0.45 * f * SP[i]; vx -= dy / dl * sw; vy += dx / dl * sw; }
            vx += (Math.random() - 0.5) * 0.025 * f; vy += (Math.random() - 0.5) * 0.025 * f;
          }
          var ex = x - mx, ey = y - my, e2 = ex * ex + ey * ey;
          var lt = 0;
          if (e2 < R2) { var ed = Math.sqrt(e2) || 1, es = (1 - ed / R) * 0.35 * f, sv = (1 - ed / R) * 0.5 * f; vx += ex / ed * es - ey / ed * sv; vy += ey / ed * es + ex / ed * sv; if (M[i]) lt = 1 - ed / R; }
          x += vx * f; y += vy * f;
          if (M[i] && now > burstEnd) { if (x < -4) x += W + 8; else if (x > W + 4) x -= W + 8; if (y < vt - 30) y += VH + 60; else if (y > vt + VH + 30) y -= VH + 60; }
          P[p] = x; P[p + 1] = y; V[p] = vx; V[p + 1] = vy;
          C[c] += (CT[c] - C[c]) * ca; C[c + 1] += (CT[c + 1] - C[c + 1]) * ca; C[c + 2] += (CT[c + 2] - C[c + 2]) * ca;
          A[i] += (AT[i] - A[i]) * aa;
          var sx = x + rootLeft, sy = y + rootTop;
          if (A[i] < 0.01 || sy < -8 || sy > VH + 8 || sx < -8 || sx > W + 8) continue;
          if (calmOn && M[i] && inCalm(x, y)) continue;
          var b = n * 7; n++;
          BUF[b] = sx; BUF[b + 1] = sy; BUF[b + 2] = C[c]; BUF[b + 3] = C[c + 1]; BUF[b + 4] = C[c + 2];
          BUF[b + 5] = lt ? Math.min(0.9, A[i] * (1 + 1.4 * lt)) : A[i]; BUF[b + 6] = lt ? SZ[i] * (1 + 0.25 * lt) : SZ[i];
        }
        drawSmoke(dt, f);
        for (var si = 0; si < scenes.length; si++) scenes[si].tick(dt);
        render(n);
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
        smokeLive = any;
      }
      function fitSites() {
        sites.forEach(function (fr) { var p = fr.parentNode, k = Math.max(0.01, p.clientWidth / 1440); fr.style.transform = 'scale(' + k.toFixed(4) + ')'; fr.style.height = Math.ceil(p.clientHeight / k) + 'px'; });
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
      function onScrollSites() { lastScroll = performance.now(); sites.forEach(function (fr) { clearTimeout(fr._intent); }); }
      function bindSites() {
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
        fitSites();
        scenes.forEach(function (sc) { if (el.contains(sc.cv)) sc.wake(); });
        secDone(el);
      }
      // секция собрана — событие для отклика на цели якоря (scroll.js, arrive): цель в несобранной секции ждёт его
      function secDone(el) { try { window.dispatchEvent(new CustomEvent('pt:secdone', { detail: el })); } catch (e) { /* старый браузер */ } }
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
          gl.uniform2f(U.uR, W, VH); gl.uniform1f(U.uD, dpr);
          gl.drawArrays(gl.POINTS, 0, n);
        } else if (c2) {
          c2.clearRect(0, 0, W, VH); c2.globalCompositeOperation = 'lighter';
          for (var j = 0; j < n; j++) {
            var b = j * 7, s = BUF[b + 6];
            c2.fillStyle = 'rgba(' + Math.round(BUF[b + 2] * 255) + ',' + Math.round(BUF[b + 3] * 255) + ',' + Math.round(BUF[b + 4] * 255) + ',' + BUF[b + 5].toFixed(3) + ')';
            c2.fillRect(BUF[b] - s / 2, BUF[b + 1] - s / 2, s, s);
          }
        }
      }
      function loop(now) { raf = 0; if (!alive || !active) return; frame(now); if (!rm) raf = requestAnimationFrame(loop); }
      function start() { if (raf || !alive || !active || rm) return; prev = performance.now(); raf = requestAnimationFrame(loop); }
      function finish(s) {
        running = null;
        if (!queue.length) { if (s && s.burst === 'soft') phPuff(BLD, s); else if (!s || s.burst != null) phAmbient(BLD, false); else phSettle(BLD); }
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
        if (s === hero) { linesOff(); root.classList.add('g-on'); if (heroObj) heroObj.start(false); if (!pultShown && !replaying) pultLater(); }
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
        setStage(s, 'done'); phText(s, ALL, false); heroSweep = null;
        if (heroObj) heroObj.start(false);
        pultSkip(); log(s, '✓ ready');
        atRun(FAST_LD + 0.15, function () { phFade(BLD); });
        atRun(FAST_LD + 0.35, function () { s.state = 'done'; setProg(); secDone(s.el); finish(s); });
        atRun(FAST_LD + 1.2, function () { root.classList.remove('pt-sweep'); if (beamEl) beamEl.classList.remove('run'); });
      }
      function runHero(s, replay) {
        if (MODE === 'fast' && !replay) { runHeroFast(s); return; }
        runId++; running = s; s.state = 'run'; s.replay = false; measure(s);
        var o = replay ? -0.6 : 0, K = replay ? PRESENT_K : HERO_K, LD = LINE * K;
        if (!replay) { burst(); log(s, 'boot · ' + fmtN() + ' particles'); }
        atRun((0.6 + o) * K, function () { root.classList.add('g-on'); measure(s); phGrid(s, ALL, false); log(s, '01 · grid.init(12)'); });
        function done() { setStage(s, 'done'); s.state = 'done'; phFade(BLD); if (heroObj) { if (replay) heroObj.replay(); else heroObj.start(false); } if (!replay && !pultShown) pultLater(); log(s, '✓ ready'); setProg(); secDone(s.el); }
        if (INTRO_LINES) {
          // вертикальная линия рисует все рамки (каркас и стили — одна стадия), за ней частицы обводят блоки и рамки
          atRun((1.6 + o) * K, function () {
            lineDelays('.wf, .fr, .an, .hero-obj, .nb .ar, .logo-d, .ico svg, .burger', 'x', LD); heroSweep = { axis: 'x', spread: LD }; line(beamEl, LD);
            setStage(s, 'skel'); measure(s); phWire(s, ALL, false); heroSweep = null; log(s, '02 · frames.draw()');
          });
          // горизонтальная линия — текст: за ней частицы ложатся на буквы и проявляется настоящий текст
          atRun((2.65 + o) * K, function () {
            lineDelays('.ptx, .obj-ct, .obj-cap', 'y', LD); heroSweep = { axis: 'y', spread: LD }; line(beamH, LD);
            setStage(s, 'text'); measure(s); phText(s, ALL, false); heroSweep = null; log(s, '03 · type.crystallize()');
          });
          // частицы долю секунды держат буквы — и гаснут на месте
          atRun((4.2 + o) * K, done);
          atRun((4.75 + o) * K, function () { finish(s); });
          return;
        }
        atRun((1.6 + o) * K, function () { setStage(s, 'wire'); measure(s); phWire(s, ALL, false); log(s, '02 · layout.measure()'); });
        atRun((2.65 + o) * K, function () { setStage(s, 'skel'); phSkel(s, ALL, false); log(s, '03 · styles.apply(glacier)'); });
        atRun((3.7 + o) * K, function () { setStage(s, 'text'); measure(s); phText(s, ALL, false); log(s, '04 · type.crystallize()'); });
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
        while (queue.length) {
          var q = queue[0], r = q.el.getBoundingClientRect();
          if (q.instant) { queue.shift(); q.instant = false; setStage(q, 'done'); q.state = 'done'; setProg(); wakeSites(q.el); continue; }
          if (r.bottom < 0) { queue.shift(); setStage(q, 'done'); q.state = 'done'; setProg(); wakeSites(q.el); if (q === hero) skipHero(); continue; }
          if (r.top > VH) { queue.shift(); q.state = 'idle'; continue; }
          break;
        }
        if (!queue.length) { if (!running && replaying) pultLater(); return; }
        var s = queue.shift();
        if (s === hero) runHero(s, s.replay); else runSec(s);
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
        var s = list[0], idx = s === hero ? ALL : BLD, every = list.concat(minor);
        runId++; running = s; replaying = true; clearTimeout(pultT); pultMini(false);
        every.forEach(function (x) { x.state = 'run'; });
        // прервали до постановки в очередь — все задетые секции сразу собраны (иначе гасли насовсем)
        settleFn = function () {
          every.forEach(function (x) { setStage(x, 'done'); x.state = 'done'; x.replay = false; x.instant = false; wakeSites(x.el); });
          if (list.indexOf(hero) >= 0 && heroObj) heroObj.replay();
        };
        measure(s); phText(s, idx, false); log(s, 'text.dissolve()');
        atRun(1.0, function () {
          every.forEach(function (x) {
            setStage(x, null);
            // сцены в карточках гаснут вместе с текстом (CSS) и спят до конца пересборки, потом собираются заново
            scenes.forEach(function (sc) { if (sc.sleep && x.el.contains(sc.cv)) sc.sleep(); });
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
        I.apply(lang); if (heroObj) heroObj.relabel(); layoutGen++;
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
        fill(idx, gens, { instant: false, axis: 'x', spread: spread, rnd: 0.08 });
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
          list.forEach(function (x) { x.el.classList.remove('s-swap'); setStage(x, 'done'); wakeSites(x.el); if (x === hero && heroObj) heroObj.replay(); });
        }
        function end() { reveal(); list.forEach(function (x) { x.state = 'done'; }); if (beamEl) beamEl.classList.remove('run'); }
        settleFn = function () { swap(); end(); };
        list.forEach(function (x) { measure(x); });
        phGlyphs(list, BLD, 0.3); log(s, 'i18n · text.capture()');
        atRun(0.45, function () {
          list.forEach(function (x) {
            x.el.classList.add('s-swap'); setStage(x, null);
            // сцены гаснут вместе со всем и спят: на новом языке они соберутся заново, уже на виду (wakeSites)
            scenes.forEach(function (sc) { if (sc.sleep && x.el.contains(sc.cv)) sc.sleep(); });
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
          if (!lite) for (var k = 1; k <= n; k++) emit(lastPX + dx * k / n, lastPY + dy * k / n, dx, dy);
          if (n) { lastPX = e.clientX; lastPY = e.clientY; }
        } else { lastPX = e.clientX; lastPY = e.clientY; }
        start();
      }
      function onOut(e) { if (!e.relatedTarget) { mouse.cx = -1e5; mouse.cy = -1e5; lastPX = lastPY = null; } }
      function reapply() { if (cur && running === cur.s) { measure(cur.s); cur.f(cur.s, cur.idx, true); } }
      function onResize() { layoutGen++; layout(); reapply(); if (rm) { snap(); frame(performance.now()); } }
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
      try { heroObj = window.PTHero ? window.PTHero.mount(hero.el, { autostart: false }) : null; } catch (e) { heroObj = null; console.warn(e); }
      makeSprites(); initGL(); layout(); rootRect();
      btns.forEach(function (b) { b.addEventListener('click', replay); });
      langLinks.forEach(function (a) { a.addEventListener('click', onLang); });
      bindSites();
      if (lite) root.classList.add('pt-lite');
      window.addEventListener('wheel', onSkip, { passive: true });
      window.addEventListener('touchmove', onSkip, { passive: true });
      window.addEventListener('pointerdown', onSkip, { passive: true });
      window.addEventListener('keydown', onSkip);
      window.addEventListener('pointermove', onMove, { passive: true });
      window.addEventListener('pointerdown', onMove, { passive: true });
      window.addEventListener('pointerout', onOut);
      window.addEventListener('resize', onResize);
      window.addEventListener('pt:shown', onShown);
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(onFonts);
      if (document.fonts && document.fonts.addEventListener) document.fonts.addEventListener('loadingdone', onFonts);
      if (rm || MODE === 'instant') {
        // reduced motion и режим «сразу»: всё на местах с первого кадра. В «сразу» — с движением: объект живёт, пыль на
        // местах, сцены и рисунки играют; прокрутку (назад, обновление) браузер восстанавливает сам — якорем не трогаем
        root.classList.add('g-on');
        secs.forEach(function (s) { setStage(s, 'done'); s.state = 'done'; wakeSites(s.el); });
        if (heroObj) heroObj.start(true);
        if (rm) { snap(); frame(performance.now()); }
        else {
          seed(); phAmbient(ALL, true); start();
          requestAnimationFrame(function () { requestAnimationFrame(function () { root.classList.remove('pt-instant'); }); });
        }
        setProg(); typeLabel('✓ ready'); pultShown = true; pultMini(true);
      } else {
        if (!jumpStart()) request(hero);
        if ('IntersectionObserver' in window) {
          var onSee = function (es) { es.forEach(function (e) { if (e.isIntersecting) { for (var i = 0; i < secs.length; i++) if (secs[i].el === e.target) request(secs[i]); } }); };
          io = new IntersectionObserver(onSee, { rootMargin: '0px 0px -18% 0px', threshold: 0 });
          secs.forEach(function (s) { io.observe(s.el); });
          // последняя секция (подвал) — без отступа снизу: она бывает ниже 18% окна и тогда никогда не попала бы в полосу
          io2 = new IntersectionObserver(onSee, { threshold: 0 }); io2.observe(secs[secs.length - 1].el);
        } else secs.forEach(function (s) { request(s); });
        start();
      }
      // страница открыта в этой вкладке: при возврате на неё — режим «сразу»
      if (AUTO_MODE) try { var seenNow = JSON.parse(sessionStorage.getItem('pt-seen') || '[]'); if (seenNow.indexOf(PAGE) < 0) { seenNow.push(PAGE); sessionStorage.setItem('pt-seen', JSON.stringify(seenNow)); } } catch (e) { /* хранилище запрещено */ }
      // «Назад» из кэша браузера (bfcache): страница вернулась целиком, сборка уже готова — только возобновляем кадры.
      // unload / beforeunload не вешаем: они отключают bfcache
      window.addEventListener('pageshow', function (e) { if (e.persisted) { prev = performance.now(); start(); } });
      return {
        setActive: function (v) { active = v; if (v) start(); },
        destroy: function () {
          alive = false; timers.forEach(clearTimeout); clearInterval(typeT); clearTimeout(pultT); if (raf) cancelAnimationFrame(raf); if (io) io.disconnect(); if (io2) io2.disconnect();
          btns.forEach(function (b) { b.removeEventListener('click', replay); });
          if (heroObj) heroObj.destroy();
          langLinks.forEach(function (a) { a.removeEventListener('click', onLang); });
          siteOff.forEach(function (off) { off(); });
          window.removeEventListener('scroll', onScrollSites);
          window.removeEventListener('pointermove', onMove);
          window.removeEventListener('pointerdown', onMove);
          window.removeEventListener('pointerout', onOut);
          window.removeEventListener('resize', onResize);
          window.removeEventListener('pt:shown', onShown);
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
