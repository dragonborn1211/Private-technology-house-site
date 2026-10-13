// Движок сборки из частиц. Сцены в карточках живут в assets/scenes.js (window.PTScenes) и подключаются раньше.
(function () {
    var factory = function (root) {
      var canvas = root.querySelector('[data-pt-canvas]');
      var stepEl = root.querySelector('[data-pt-step]'), progEl = root.querySelector('[data-pt-prog]'), btn = root.querySelector('[data-pt-replay]');
      var vis = root.querySelector('[data-obj]'), objName = root.querySelector('[data-objname]'), objIdx = root.querySelector('[data-objidx]');
      var countEl = root.querySelector('[data-pt-count]');
      var dots = Array.prototype.slice.call(root.querySelectorAll('[data-objdot]'));
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
      var P, V, T, NT, C, CT, NC, A, AT, NA, SZ, NS, SW, M, NM, OB, SP, TP, BUF, ALL = [], BLD = [], OBJ = [];
      var layoutGen = 0, lzT = [0, 0, 0, 0], lzQ = 0;
      var prog = null, buf = null, U = {};
      var SMK = 520, sX = new Float32Array(SMK), sY = new Float32Array(SMK), sVX = new Float32Array(SMK), sVY = new Float32Array(SMK), sL = new Float32Array(SMK), sM = new Float32Array(SMK), sC = new Float32Array(SMK), sI = 0, lastPX = null, lastPY = null;
      var smk = root.querySelector('[data-pt-smoke]'), sctx = smk ? smk.getContext('2d') : null, SPR = [], smokeLive = false;
      var sites = Array.prototype.slice.call(root.querySelectorAll('.site-view iframe')), scenes = [];
      var COL = { frost: [238, 243, 246], glass: [188, 211, 222], skel: [96, 124, 142], accent: [142, 216, 248] };
      var IRI = [[142, 216, 248], [127, 168, 255], [183, 166, 242], [159, 229, 209]];
      var DUST = [[142, 216, 248], [127, 168, 255], [183, 166, 242], [159, 229, 209], [230, 236, 241]];
      var SHAPES = [
        { name: 'Brilliant', draw: function (g, cx, cy, S) {
          var gw = S * 0.5, tw = S * 0.27, ch = S * 0.18, ph = S * 0.48, y0 = cy - S * 0.1;
          g.lineWidth = Math.max(2, S * 0.011); g.lineJoin = 'round'; g.lineCap = 'round'; g.beginPath();
          g.moveTo(cx - tw, y0 - ch); g.lineTo(cx + tw, y0 - ch); g.lineTo(cx + gw, y0); g.lineTo(cx, y0 + ph); g.lineTo(cx - gw, y0); g.closePath();
          g.moveTo(cx - gw, y0); g.lineTo(cx + gw, y0);
          g.moveTo(cx - tw, y0 - ch); g.lineTo(cx - gw * 0.55, y0); g.lineTo(cx - tw / 3, y0 - ch); g.lineTo(cx, y0); g.lineTo(cx + tw / 3, y0 - ch); g.lineTo(cx + gw * 0.55, y0); g.lineTo(cx + tw, y0 - ch);
          g.moveTo(cx - gw * 0.55, y0); g.lineTo(cx, y0 + ph); g.moveTo(cx + gw * 0.55, y0); g.lineTo(cx, y0 + ph);
          g.moveTo(cx, y0); g.lineTo(cx, y0 + ph * 0.84);
          g.moveTo(cx - gw, y0); g.lineTo(cx - gw * 0.22, y0 + ph * 0.6); g.moveTo(cx + gw, y0); g.lineTo(cx + gw * 0.22, y0 + ph * 0.6);
          g.stroke();
        } },
        { name: 'Lattice', draw: function (g, cx, cy, S) {
          var R = S * 0.46, r = R * 0.5, o = [], n = [], k;
          for (k = 0; k < 6; k++) { var a = k * Math.PI / 3 - Math.PI / 2; o.push([cx + Math.cos(a) * R, cy + Math.sin(a) * R]); n.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); }
          g.lineWidth = Math.max(2, S * 0.01); g.lineJoin = 'round'; g.beginPath();
          for (k = 0; k < 6; k++) { var j = (k + 1) % 6; g.moveTo(o[k][0], o[k][1]); g.lineTo(o[j][0], o[j][1]); g.moveTo(n[k][0], n[k][1]); g.lineTo(n[j][0], n[j][1]); g.moveTo(n[k][0], n[k][1]); g.lineTo(o[k][0], o[k][1]); g.moveTo(cx, cy); g.lineTo(n[k][0], n[k][1]); }
          g.stroke();
          var nr = Math.max(3, S * 0.026);
          o.concat(n).concat([[cx, cy]]).forEach(function (p) { g.beginPath(); g.arc(p[0], p[1], nr, 0, 6.2832); g.fill(); });
        } },
        { name: 'Silicon', draw: function (g, cx, cy, S) {
          var s = S * 0.62, x0 = cx - s / 2, y0 = cy - s / 2;
          g.lineWidth = Math.max(2, s * 0.026); g.strokeRect(x0, y0, s, s);
          var n = 4, cs = s * 0.74 / n, ix = x0 + s * 0.13, iy = y0 + s * 0.13;
          for (var i = 0; i < n; i++) for (var j = 0; j < n; j++) g.fillRect(ix + i * cs + cs * 0.16, iy + j * cs + cs * 0.16, cs * 0.68, cs * 0.68);
          for (var p = 0; p < 6; p++) {
            var q = x0 + (p + 0.5) * s / 6 - s * 0.012, q2 = y0 + (p + 0.5) * s / 6 - s * 0.012;
            g.fillRect(q, y0 - s * 0.15, s * 0.024, s * 0.11); g.fillRect(q, y0 + s * 1.04, s * 0.024, s * 0.11);
            g.fillRect(x0 - s * 0.15, q2, s * 0.11, s * 0.024); g.fillRect(x0 + s * 1.04, q2, s * 0.11, s * 0.024);
          }
        } },
        { name: 'House', draw: function (g, cx, cy, S) {
          var bw = S * 0.66, bh = S * 0.42, by = cy + S * 0.36, top = by - bh, peak = top - S * 0.34, ev = S * 0.07;
          g.lineWidth = Math.max(2, S * 0.012); g.lineJoin = 'round'; g.beginPath();
          g.moveTo(cx - bw / 2, top); g.lineTo(cx - bw / 2, by); g.lineTo(cx + bw / 2, by); g.lineTo(cx + bw / 2, top);
          g.moveTo(cx - bw / 2 - ev, top + ev * 0.55); g.lineTo(cx, peak); g.lineTo(cx + bw / 2 + ev, top + ev * 0.55);
          g.stroke();
          var ws = S * 0.1, gap = S * 0.05, wx = cx - ws - gap / 2, wy = top + bh * 0.5 - ws - gap / 2;
          for (var i = 0; i < 2; i++) for (var j = 0; j < 2; j++) g.fillRect(wx + i * (ws + gap), wy + j * (ws + gap), ws, ws);
        } }
      ];
      // burst — после сборки частицы разлетаются по экрану (первый экран и контакты); у остальных секций гаснут на месте
      var secs = Array.prototype.slice.call(root.querySelectorAll('[data-sec]')).map(function (el) { return { el: el, name: el.getAttribute('data-sec'), state: 'idle', geo: null, geoKey: '', replay: false, burst: el.hasAttribute('data-pt-burst') }; });
      var hero = secs[0], queue = [], running = null, timers = [], typeT = 0, shape = 0, nextShapeAt = 0, objOn = false, cur = null, io = null;
      // Темп сборки: HERO_K — множитель таймингов первого экрана (1 — исходные 5.8 с), SEC_K — остальных секций
      // (1 — исходные 3.1 с), одинаковый для всех секций. PRESENT_K — «Пересобрать блок»: полный темп для показа.
      // runK — темп текущей сборки секции (по нему же масштабируется sweep). runId отменяет таймеры прерванной сборки.
      var HERO_K = 0.75, SEC_K = 0.9, PRESENT_K = 1, runK = SEC_K, runId = 0, booted = false, abortAt = 0;
      // адаптивное качество: 1 — без стеклянного размытия и дымного следа, 2 — ещё и частицы в 1× разрешении
      var lite = 0, dprCap = 2, qT = 0, qN = 0, bootAt = performance.now();
      try { lite = +sessionStorage.getItem('pt-lite') || 0; } catch (e) {}
      if (lite >= 2) dprCap = 1;

      function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
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
      function setProg() { if (!progEl) return; var d = 0; secs.forEach(function (s) { if (s.state === 'done') d++; }); progEl.style.transform = 'scaleX(' + (d / secs.length).toFixed(3) + ')'; }
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
          t.textContent = Math.round(b.offsetWidth) + '×' + Math.round(b.offsetHeight);
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
      function gAmbient(o) {
        o.x = Math.random() * W; o.y = -rootTop + Math.random() * VH;
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
      function sweep(s, inst, spread) { return s === hero ? { instant: inst, axis: 'x', spread: spread * 0.8, rnd: 0.1 } : { instant: inst, axis: 'y', y0: s.geo.box.y, h: Math.min(s.geo.box.h, VH * 1.4), spread: spread * runK, rnd: 0.12 * runK }; }
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
        fill(idx, [{ w: 1, f: function (o) { gAmbient(o); o.m = 0; o.a = Math.random() < (mob ? 0.03 : 0.07) ? 0.34 : 0; } }], { instant: inst, axis: 'x', spread: 0, rnd: inst ? 0 : 0.5 });
        at(inst ? 0 : 1.6, function () { if (running) return; for (var k = 0; k < idx.length; k++) { var i = idx[k]; if (SW[i]) NM[i] = 1; else M[i] = 1; } });
      }
      // Тихий финал сборки (секции без data-pt-burst): частицы догасают на месте, а уже невидимыми
      // переезжают в случайные точки экрана (TP — телепорт при переключении). Пыль там проявляется без разлёта.
      function phSettle(idx) {
        var now = performance.now();
        for (var k = 0; k < idx.length; k++) {
          var i = idx[k], p = i * 2, c = i * 3;
          if (SW[i]) { T[p] = NT[p]; T[p + 1] = NT[p + 1]; CT[c] = NC[c]; CT[c + 1] = NC[c + 1]; CT[c + 2] = NC[c + 2]; AT[i] = NA[i]; SZ[i] = NS[i]; M[i] = NM[i]; }
          gAmbient(tmp);
          NT[p] = tmp.x; NT[p + 1] = tmp.y; NC[c] = tmp.r / 255; NC[c + 1] = tmp.g / 255; NC[c + 2] = tmp.b / 255;
          NA[i] = Math.random() < (mob ? 0.03 : 0.07) ? 0.34 : 0; NS[i] = tmp.s; NM[i] = 1; TP[i] = 1;
          SW[i] = now + 1300 + Math.random() * 700;
        }
      }
      function objPts() {
        if (!vis) return [];
        var r = vis.getBoundingClientRect(), x0 = r.left - rootLeft, y0 = r.top - rootTop;
        var cx = x0 + r.width / 2, cy = y0 + r.height * 0.5, S = Math.min(r.width * 0.78, r.height * 0.6);
        x0 = Math.floor(x0); y0 = Math.floor(y0);
        var w = Math.max(1, Math.ceil(r.width)), h = Math.max(1, Math.ceil(r.height));
        oc.width = w; oc.height = h; og.setTransform(1, 0, 0, 1, 0, 0); og.clearRect(0, 0, w, h);
        og.fillStyle = '#fff'; og.strokeStyle = '#fff';
        og.save(); og.translate(-x0, -y0); SHAPES[shape].draw(og, cx, cy, S); og.restore();
        var d = og.getImageData(0, 0, w, h).data, pts = [];
        for (var y = 0; y < h; y += 2) for (var x = 0; x < w; x += 2) if (d[(y * w + x) * 4 + 3] > 110) pts.push(x0 + x + Math.random() * 2, y0 + y + Math.random() * 2);
        return pts;
      }
      function phObject(inst) {
        rootRect();
        var pts = objPts(), n = pts.length / 2;
        if (!n) return;
        var mnx = 1e9, mxx = -1e9, mny = 1e9, mxy = -1e9;
        for (var q = 0; q < pts.length; q += 2) { if (pts[q] < mnx) mnx = pts[q]; if (pts[q] > mxx) mxx = pts[q]; if (pts[q + 1] < mny) mny = pts[q + 1]; if (pts[q + 1] > mxy) mxy = pts[q + 1]; }
        var sx = Math.max(1, mxx - mnx), sy = Math.max(1, mxy - mny), off = shape * 0.25;
        fill(OBJ, [{ w: 1, f: function (o) {
          var k = ((Math.random() * n) | 0) * 2;
          o.x = pts[k] + (Math.random() - 0.5) * 0.8; o.y = pts[k + 1] + (Math.random() - 0.5) * 0.8;
          if (Math.random() < 0.07) { setC(o, [246, 248, 250]); o.s = 2.6; }
          else { var t = ((o.x - mnx) / sx * 0.7 + (o.y - mny) / sy * 0.3 + off) % 1, f = t * IRI.length, i0 = Math.floor(f) % IRI.length, i1 = (i0 + 1) % IRI.length, u = f - Math.floor(f), a = IRI[i0], b = IRI[i1];
            o.r = a[0] + (b[0] - a[0]) * u; o.g = a[1] + (b[1] - a[1]) * u; o.b = a[2] + (b[2] - a[2]) * u; o.s = mob ? 1.6 : 1.5; }
          o.a = o.s > 2 ? 0.95 : 0.78; o.m = 0;
        } }], { instant: inst, axis: 'x', spread: 0, rnd: inst ? 0 : 0.45 });
      }
      function alloc() {
        N = gl ? (mob ? 14000 : 26000) : (mob ? 3000 : 6000);
        P = new Float32Array(N * 2); V = new Float32Array(N * 2); T = new Float32Array(N * 2); NT = new Float32Array(N * 2);
        C = new Float32Array(N * 3); CT = new Float32Array(N * 3); NC = new Float32Array(N * 3);
        A = new Float32Array(N); AT = new Float32Array(N); NA = new Float32Array(N); SZ = new Float32Array(N); NS = new Float32Array(N);
        SW = new Float64Array(N); M = new Uint8Array(N); NM = new Uint8Array(N); OB = new Uint8Array(N); SP = new Float32Array(N); TP = new Uint8Array(N);
        BUF = new Float32Array((N + SMK) * 7); ALL = []; BLD = []; OBJ = [];
        for (var i = 0; i < N; i++) {
          OB[i] = Math.random() < 0.3 ? 1 : 0; SP[i] = Math.random() < 0.5 ? -1 : 1;
          M[i] = 1; A[i] = 0; P[i * 2] = -999; P[i * 2 + 1] = -999; SZ[i] = 1.4;
          ALL.push(i); (OB[i] ? OBJ : BLD).push(i);
        }
        if (countEl) countEl.textContent = fmtN();
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
      // Первый экран помечен собранным без сборки: включаем сетку и сразу ставим частицы объекта на место
      // (он над экраном, лететь им незачем), иначе карточка объекта осталась бы пустой.
      function skipHero() {
        seed(); root.classList.add('g-on');
        objOn = true; phObject(true); nextShapeAt = performance.now() + 7000;
        for (var k = 0; k < OBJ.length; k++) { var p = OBJ[k] * 2; P[p] = NT[p]; P[p + 1] = NT[p + 1]; V[p] = V[p + 1] = 0; }
      }
      function burst() {
        booted = true;
        var hr = hero.el.getBoundingClientRect(), cx = W / 2, cy = hr.top - rootTop + Math.min(VH, hr.height) * 0.46;
        for (var i = 0; i < N; i++) {
          var p = i * 2, c = i * 3, a = Math.random() * 6.2832, rr = Math.random() * 4, s = 2 + Math.pow(Math.random(), 0.7) * 18;
          P[p] = cx + Math.cos(a) * rr; P[p + 1] = cy + Math.sin(a) * rr; V[p] = Math.cos(a) * s; V[p + 1] = Math.sin(a) * s;
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
      // Адаптивное качество: окна по 2 с; если два окна подряд средний кадр дольше 24 мс (меньше ~42 fps),
      // спускаемся на уровень. Первые 3 с после старта и паузы (вкладка скрыта, кадр > 100 мс) не считаем.
      // Уровень помнится до конца сессии.
      var qSlow = 0;
      function watchQuality(now, raw) {
        if (lite >= 2 || raw > 0.1 || now - bootAt < 3000) return;
        qT += raw; qN++;
        if (qT < 2) return;
        var avg = qT / qN; qT = qN = 0;
        qSlow = avg > 0.024 ? qSlow + 1 : 0;
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
        if (objOn && !rm && now > nextShapeAt) { var hr = hero.el.getBoundingClientRect(); if (hr.bottom > 0) setShape(shape + 1, false); else nextShapeAt = now + 3000; }
        var f = Math.min(3, dt * 60), damp = Math.pow(0.855, f), k = 0.015 * f, dd = Math.pow(0.975, f);
        var mx = mouse.cx - rootLeft, my = mouse.cy - rootTop, R = mob ? 60 : 90, R2 = R * R;
        var ca = Math.min(1, dt * 3.5), aa = Math.min(1, dt * 3), ts = now * 0.00035, vt = -rootTop, n = 0;
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
          if (e2 < R2) { var ed = Math.sqrt(e2) || 1, es = (1 - ed / R) * 1.6 * f; vx += ex / ed * es; vy += ey / ed * es; }
          x += vx * f; y += vy * f;
          if (M[i]) { if (x < -4) x += W + 8; else if (x > W + 4) x -= W + 8; if (y < vt - 30) y += VH + 60; else if (y > vt + VH + 30) y -= VH + 60; }
          P[p] = x; P[p + 1] = y; V[p] = vx; V[p + 1] = vy;
          C[c] += (CT[c] - C[c]) * ca; C[c + 1] += (CT[c + 1] - C[c + 1]) * ca; C[c + 2] += (CT[c + 2] - C[c + 2]) * ca;
          A[i] += (AT[i] - A[i]) * aa;
          var sx = x + rootLeft, sy = y + rootTop;
          if (A[i] < 0.01 || sy < -8 || sy > VH + 8 || sx < -8 || sx > W + 8) continue;
          var b = n * 7; n++;
          BUF[b] = sx; BUF[b + 1] = sy; BUF[b + 2] = C[c]; BUF[b + 3] = C[c + 1]; BUF[b + 4] = C[c + 2]; BUF[b + 5] = A[i]; BUF[b + 6] = SZ[i];
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
        if (!queue.length) { if (!s || s.burst) phAmbient(BLD, false); else phSettle(BLD); }
        pump();
      }
      // Пропуск сборки по действию пользователя: текст и рамки проявляются сразу, частицы уходят в финал.
      // Первый экран пропускается прокруткой, кликом или клавишей; остальные секции — кликом или клавишей
      // (прокрутка их не трогает: секции и собираются по прокрутке, а ушедшие с экрана дособирает abortRun).
      function skipNow() {
        var s = running; if (!s || rm) return;
        runId++; running = null; cur = null;
        setStage(s, 'done'); s.state = 'done'; s.replay = false;
        phFade(BLD);
        if (s === hero) { root.classList.add('g-on'); objOn = true; phObject(false); nextShapeAt = performance.now() + 7000; }
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
      function runHero(s, replay) {
        runId++; running = s; s.state = 'run'; s.replay = false; measure(s);
        var o = replay ? -0.6 : 0, K = replay ? PRESENT_K : HERO_K;
        if (!replay) { burst(); log(s, 'boot · ' + fmtN() + ' particles'); }
        atRun((0.6 + o) * K, function () { root.classList.add('g-on'); measure(s); phGrid(s, ALL, false); log(s, '01 · grid.init(12)'); });
        atRun((1.6 + o) * K, function () { setStage(s, 'wire'); measure(s); phWire(s, ALL, false); log(s, '02 · layout.measure()'); });
        atRun((2.65 + o) * K, function () { setStage(s, 'skel'); phSkel(s, ALL, false); log(s, '03 · styles.apply(glacier)'); });
        atRun((3.7 + o) * K, function () { setStage(s, 'text'); measure(s); phText(s, ALL, false); log(s, '04 · type.crystallize()'); });
        atRun((5.25 + o) * K, function () { setStage(s, 'done'); s.state = 'done'; phFade(BLD); objOn = true; phObject(false); log(s, '✓ ready'); setProg(); });
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
        setStage(s, 'done'); s.state = 'done'; s.replay = false; setProg(); wakeSites(s.el);
        if (s === hero) skipHero();
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
        if (!queue.length) return;
        var s = queue.shift();
        if (s === hero) runHero(s, s.replay); else runSec(s);
      }
      function request(s) { if (!s || s.state !== 'idle') return; s.state = 'queued'; queue.push(s); pump(); }
      // «Пересобрать блок» пересобирает всё, что видно на экране, а не одну секцию: иначе соседний блок оставался
      // нетронутым и казалось, что часть контента «не исчезает». Все видимые секции разом гаснут. Те, что занимают
      // от 12% высоты экрана, собираются заново из частиц сверху вниз, по очереди. Узкие полоски у края экрана
      // (instant) проявляются сразу после них: собирать их частицами значило бы заставить основной блок ждать.
      function replay() {
        if (running || rm) return;
        var list = [], minor = [];
        secs.forEach(function (x) {
          if (x.state !== 'done') return;
          var r = x.el.getBoundingClientRect(), v = Math.min(r.bottom, VH) - Math.max(r.top, 0);
          if (v >= VH * 0.12) list.push(x); else if (v > 0) minor.push(x);
        });
        if (!list.length) return;
        var s = list[0], idx = s === hero ? ALL : BLD, every = list.concat(minor);
        runId++; running = s;
        every.forEach(function (x) { x.state = 'run'; });
        list.forEach(function (x) { if (x === hero) objOn = false; });
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
          running = null;
          list.forEach(function (x) { x.state = 'queued'; x.replay = true; });
          minor.forEach(function (x) { x.state = 'queued'; x.instant = true; });
          queue.unshift.apply(queue, every); setProg(); pump();
        });
      }
      function setShape(n, user) {
        shape = (n % SHAPES.length + SHAPES.length) % SHAPES.length;
        if (objName) objName.textContent = 'Object №0' + (shape + 1) + ' · ' + SHAPES[shape].name;
        if (objIdx) objIdx.textContent = '0' + (shape + 1) + ' / 0' + SHAPES.length;
        dots.forEach(function (d, i) { d.setAttribute('aria-pressed', i === shape ? 'true' : 'false'); });
        nextShapeAt = performance.now() + (user ? 12000 : 7000);
        if (objOn) { phObject(false); if (rm) { snap(); frame(performance.now()); } else for (var k = 0; k < OBJ.length; k++) { var p = OBJ[k] * 2; V[p] += (Math.random() - 0.5) * 6; V[p + 1] += (Math.random() - 0.5) * 6; } }
      }
      function onVis(e) { if (!objOn) return; if (e.target && e.target.closest && e.target.closest('[data-objdot]')) return; setShape(shape + 1, true); }
      function onDot(e) { e.stopPropagation(); if (objOn) setShape(+e.currentTarget.getAttribute('data-objdot'), true); }
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
      function reapply() { if (cur && running === cur.s) { measure(cur.s); cur.f(cur.s, cur.idx, true); } if (objOn) phObject(true); }
      function onResize() { layoutGen++; layout(); reapply(); if (rm) { snap(); frame(performance.now()); } }
      // Догрузка шрифтов только сбрасывает кэш замеров: следующая стадия возьмёт свежую геометрию. Мгновенный
      // перезапуск текущей стадии (reapply) давал рывок всех частиц, если шрифт приходил посреди сборки.
      function onFonts() { layoutGen++; }
      markText();
      root.classList.add('pt-on');
      // текст и рамки уже скрыты движком — фиксируем это без переходов и открываем секции (см. .pt-boot в site.css)
      void root.offsetWidth;
      root.classList.remove('pt-boot');
      scenes = window.PTScenes ? window.PTScenes.create(root, env) : [];
      makeSprites(); initGL(); layout(); rootRect(); setShape(0, false);
      if (btn) btn.addEventListener('click', replay);
      if (vis) vis.addEventListener('click', onVis);
      dots.forEach(function (d) { d.addEventListener('click', onDot); });
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
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(onFonts);
      if (document.fonts && document.fonts.addEventListener) document.fonts.addEventListener('loadingdone', onFonts);
      if (rm) {
        root.classList.add('g-on');
        secs.forEach(function (s) { setStage(s, 'done'); s.state = 'done'; wakeSites(s.el); });
        objOn = true; phObject(true); snap(); frame(performance.now()); setProg(); typeLabel('✓ ready');
      } else {
        request(hero);
        if ('IntersectionObserver' in window) {
          io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { for (var i = 0; i < secs.length; i++) if (secs[i].el === e.target) request(secs[i]); } }); }, { rootMargin: '0px 0px -18% 0px', threshold: 0 });
          secs.forEach(function (s) { io.observe(s.el); });
        } else secs.forEach(function (s) { request(s); });
        start();
      }
      return {
        setActive: function (v) { active = v; if (v) start(); },
        destroy: function () {
          alive = false; timers.forEach(clearTimeout); clearInterval(typeT); if (raf) cancelAnimationFrame(raf); if (io) io.disconnect();
          if (btn) btn.removeEventListener('click', replay);
          if (vis) vis.removeEventListener('click', onVis);
          dots.forEach(function (d) { d.removeEventListener('click', onDot); });
          siteOff.forEach(function (off) { off(); });
          window.removeEventListener('scroll', onScrollSites);
          window.removeEventListener('pointermove', onMove);
          window.removeEventListener('pointerdown', onMove);
          window.removeEventListener('pointerout', onOut);
          window.removeEventListener('resize', onResize);
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
