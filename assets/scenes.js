// Сцены в карточках «Объектов». Каждая сцена — свой 2D-холст и методы wake() / tick(dt) / resize().
// Движок (assets/engine.js) создаёт их через PTScenes.create(root, env), будит из wakeSites(),
// тикает из frame(), ресайзит из layout(). Свой requestAnimationFrame сцены не заводят.
// env — живые параметры движка: env.rm (prefers-reduced-motion), env.mob (ширина < 760), env.vh (высота окна).
(function () {
  var ACC = ['#8ED8F8', '#7FA8FF', '#B7A6F2', '#9FE5D1'], LILAC = '#B7A6F2';
  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function rgba(hex, a) { return 'rgba(' + parseInt(hex.slice(1, 3), 16) + ',' + parseInt(hex.slice(3, 5), 16) + ',' + parseInt(hex.slice(5, 7), 16) + ',' + a + ')'; }
  function rrect(g, x, y, w, h, r) { r = Math.max(0, Math.min(r, w / 2, h / 2)); g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
  function offscreen(cv, env) { var b = cv.getBoundingClientRect(); return b.bottom < -20 || b.top > env.vh + 20; }
  // подгоняет буфер холста под размер окна-родителя; true — если размер поменялся
  function fitCanvas(cv, st) {
    var p = cv.parentNode, w = Math.max(1, p.clientWidth), h = Math.max(1, p.clientHeight), d = Math.min(window.devicePixelRatio || 1, 2);
    if (Math.abs(w - st.w) < 0.5 && Math.abs(h - st.h) < 0.5 && d === st.d) return false;
    st.w = w; st.h = h; st.d = d; cv.width = Math.round(w * d); cv.height = Math.round(h * d);
    return true;
  }
  var GLOW = {};
  function glow(hex) {
    if (GLOW[hex]) return GLOW[hex];
    var c = document.createElement('canvas'); c.width = c.height = 32;
    var x = c.getContext('2d'), gr = x.createRadialGradient(16, 16, 0, 16, 16, 16);
    gr.addColorStop(0, rgba(hex, 0.9)); gr.addColorStop(0.3, rgba(hex, 0.32)); gr.addColorStop(1, rgba(hex, 0));
    x.fillStyle = gr; x.fillRect(0, 0, 32, 32);
    return (GLOW[hex] = c);
  }

  // ---------- «ваш проект»: по кругу собираются демо-сайты ----------
  function makeMini(cv, env) {
    if (!cv || !cv.getContext) return null;
    var mx = cv.getContext('2d'), lab = cv.parentNode.querySelector('[data-mini-label]');
    var oc3 = document.createElement('canvas'), og3 = oc3.getContext('2d', { willReadFrequently: true });
    var MW = 1, MH = 1, md = 1, NP = 0, on = false, ct = 0, stage = -1, ti = 0, gridA = 0, wireA = 0, siteA = 0, RC = [];
    var X, Y, VX, VY, TX, TY, A, AT, CI, FR, NX, NY, NA, NC, NF, SWT;
    var GP = [], GRGB = [];
    function gi(hex) { var k = GP.indexOf(hex); if (k >= 0) return k; GP.push(hex); GRGB.push([parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)]); return GP.length - 1; }
    var GLS = gi('#BCD3DE'), ICEC = gi('#8ED8F8');
    var TPL = [
      { name: 'Кофейня «Зерно»', bg: '#F3EBDD', ink: '#2B1D14', acc: '#C8743C', acc2: '#8A4B22', soft: '#E2CDB0', ff: 'Georgia, "Times New Roman", serif', fw: '600', st: 'normal',
        h1: ['Кофе, который', 'помнит зерно.'], hc: ['ink', 'acc'], hx: 0.06, hy: 0.33, hs: 0.083, lh: 1.14, al: 'left',
        els: [
          { k: 'logo', x: 0.06, y: 0.105, s: 0.045, t: 'ЗЕРНО' },
          { k: 'bar', x: 0.5, y: 0.075, w: 0.07, h: 0.016 }, { k: 'bar', x: 0.6, y: 0.075, w: 0.07, h: 0.016 }, { k: 'bar', x: 0.7, y: 0.075, w: 0.07, h: 0.016 },
          { k: 'btn', x: 0.82, y: 0.05, w: 0.12, h: 0.06, c: 'ink', t: 'Заказ', tc: 'bg' },
          { k: 'bar', x: 0.06, y: 0.45, w: 0.36, h: 0.018 }, { k: 'bar', x: 0.06, y: 0.49, w: 0.27, h: 0.018 },
          { k: 'btn', x: 0.06, y: 0.56, w: 0.2, h: 0.075, c: 'acc', t: 'Меню →', tc: '#FFFFFF' },
          { k: 'img', x: 0.52, y: 0.18, w: 0.42, h: 0.5, c1: 'soft', c2: 'acc' },
          { k: 'disc', x: 0.73, y: 0.43, rr: 0.13, c: 'bg', a: 0.6 }, { k: 'disc', x: 0.73, y: 0.43, rr: 0.08, c: 'acc2', a: 0.9 },
          { k: 'box', x: 0.06, y: 0.76, w: 0.27, h: 0.17, c: 'soft' }, { k: 'box', x: 0.365, y: 0.76, w: 0.27, h: 0.17, c: 'soft' }, { k: 'box', x: 0.67, y: 0.76, w: 0.27, h: 0.17, c: 'soft' },
          { k: 'bar', x: 0.085, y: 0.8, w: 0.12, h: 0.016, a: 0.55 }, { k: 'bar', x: 0.085, y: 0.85, w: 0.19, h: 0.014, a: 0.28 },
          { k: 'bar', x: 0.39, y: 0.8, w: 0.12, h: 0.016, a: 0.55 }, { k: 'bar', x: 0.39, y: 0.85, w: 0.19, h: 0.014, a: 0.28 },
          { k: 'bar', x: 0.695, y: 0.8, w: 0.12, h: 0.016, a: 0.55 }, { k: 'bar', x: 0.695, y: 0.85, w: 0.19, h: 0.014, a: 0.28 }
        ] },
      { name: 'Северный юрист', bg: '#0F1E33', ink: '#E9EEF5', acc: '#C9A86A', acc2: '#8FA6C7', soft: '#1A2F4E', ff: 'Georgia, "Times New Roman", serif', fw: '500', st: 'normal',
        h1: ['Право —', 'на вашей стороне.'], hc: ['ink', 'acc'], hx: 0.5, hy: 0.33, hs: 0.086, lh: 1.14, al: 'center',
        els: [
          { k: 'logo', x: 0.06, y: 0.1, s: 0.034, t: 'СЕВЕРНЫЙ ЮРИСТ' },
          { k: 'bar', x: 0.6, y: 0.075, w: 0.07, h: 0.016 }, { k: 'bar', x: 0.7, y: 0.075, w: 0.07, h: 0.016 }, { k: 'bar', x: 0.8, y: 0.075, w: 0.07, h: 0.016 },
          { k: 'bar', x: 0.29, y: 0.47, w: 0.42, h: 0.018, a: 0.3 }, { k: 'bar', x: 0.35, y: 0.51, w: 0.3, h: 0.018, a: 0.3 },
          { k: 'btn', x: 0.285, y: 0.58, w: 0.205, h: 0.075, c: 'acc', t: 'Консультация', tc: 'bg' },
          { k: 'obtn', x: 0.51, y: 0.58, w: 0.205, h: 0.075, c: 'ink', t: 'Услуги', tc: 'ink' },
          { k: 'box', x: 0.06, y: 0.74, w: 0.27, h: 0.19, c: 'soft' }, { k: 'box', x: 0.365, y: 0.74, w: 0.27, h: 0.19, c: 'soft' }, { k: 'box', x: 0.67, y: 0.74, w: 0.27, h: 0.19, c: 'soft' },
          { k: 'box', x: 0.085, y: 0.77, w: 0.035, h: 0.045, c: 'acc', r: 0.008 }, { k: 'bar', x: 0.085, y: 0.85, w: 0.15, h: 0.016, a: 0.55 }, { k: 'bar', x: 0.085, y: 0.89, w: 0.2, h: 0.014, a: 0.28 },
          { k: 'box', x: 0.39, y: 0.77, w: 0.035, h: 0.045, c: 'acc', r: 0.008 }, { k: 'bar', x: 0.39, y: 0.85, w: 0.15, h: 0.016, a: 0.55 }, { k: 'bar', x: 0.39, y: 0.89, w: 0.2, h: 0.014, a: 0.28 },
          { k: 'box', x: 0.695, y: 0.77, w: 0.035, h: 0.045, c: 'acc', r: 0.008 }, { k: 'bar', x: 0.695, y: 0.85, w: 0.15, h: 0.016, a: 0.55 }, { k: 'bar', x: 0.695, y: 0.89, w: 0.2, h: 0.014, a: 0.28 }
        ] },
      { name: 'Nova Lab', bg: '#0B0B14', ink: '#F2F2F7', acc: '#7C5CFF', acc2: '#4FD1C5', soft: '#191830', ff: 'Manrope, system-ui, sans-serif', fw: '600', st: 'normal',
        h1: ['Build the', 'next thing.'], hc: ['ink', 'acc2'], hx: 0.06, hy: 0.33, hs: 0.083, lh: 1.1, al: 'left',
        els: [
          { k: 'logo', x: 0.06, y: 0.105, s: 0.042, t: 'nova/lab' },
          { k: 'bar', x: 0.5, y: 0.075, w: 0.07, h: 0.016 }, { k: 'bar', x: 0.6, y: 0.075, w: 0.07, h: 0.016 }, { k: 'bar', x: 0.7, y: 0.075, w: 0.07, h: 0.016 },
          { k: 'btn', x: 0.82, y: 0.05, w: 0.12, h: 0.06, c: 'acc', t: 'Login', tc: '#FFFFFF' },
          { k: 'bar', x: 0.06, y: 0.47, w: 0.34, h: 0.018 }, { k: 'bar', x: 0.06, y: 0.51, w: 0.26, h: 0.018 },
          { k: 'btn', x: 0.06, y: 0.59, w: 0.19, h: 0.075, c: 'acc', t: 'Start →', tc: '#FFFFFF' },
          { k: 'img', x: 0.5, y: 0.18, w: 0.21, h: 0.34, c1: 'acc', c2: 'acc2' },
          { k: 'box', x: 0.73, y: 0.18, w: 0.21, h: 0.16, c: 'soft' }, { k: 'box', x: 0.73, y: 0.36, w: 0.21, h: 0.16, c: 'soft' }, { k: 'box', x: 0.5, y: 0.55, w: 0.44, h: 0.22, c: 'soft' },
          { k: 'bar', x: 0.75, y: 0.22, w: 0.1, h: 0.016, a: 0.55 }, { k: 'bar', x: 0.75, y: 0.4, w: 0.14, h: 0.016, a: 0.55 },
          { k: 'box', x: 0.53, y: 0.68, w: 0.04, h: 0.06, c: 'acc', r: 0.006 }, { k: 'box', x: 0.595, y: 0.64, w: 0.04, h: 0.1, c: 'acc2', r: 0.006 }, { k: 'box', x: 0.66, y: 0.66, w: 0.04, h: 0.08, c: 'acc', r: 0.006 },
          { k: 'box', x: 0.725, y: 0.61, w: 0.04, h: 0.13, c: 'acc2', r: 0.006 }, { k: 'box', x: 0.79, y: 0.63, w: 0.04, h: 0.11, c: 'acc', r: 0.006 }, { k: 'box', x: 0.855, y: 0.59, w: 0.04, h: 0.15, c: 'acc2', r: 0.006 },
          { k: 'bar', x: 0.06, y: 0.86, w: 0.14, h: 0.014, a: 0.25 }, { k: 'bar', x: 0.24, y: 0.86, w: 0.14, h: 0.014, a: 0.25 }, { k: 'bar', x: 0.42, y: 0.86, w: 0.14, h: 0.014, a: 0.25 }
        ] },
      { name: 'Студия «Лён»', bg: '#F4EEEA', ink: '#3A2E2A', acc: '#B98E7C', acc2: '#8C6A5D', soft: '#E8D8CF', ff: '"Cormorant Garamond", Georgia, serif', fw: '500', st: 'italic',
        h1: ['Красота', 'в деталях.'], hc: ['ink', 'acc2'], hx: 0.06, hy: 0.665, hs: 0.1, lh: 1.0, al: 'left',
        els: [
          { k: 'logo', x: 0.06, y: 0.115, s: 0.06, t: 'Лён' },
          { k: 'bar', x: 0.6, y: 0.075, w: 0.07, h: 0.016 }, { k: 'bar', x: 0.7, y: 0.075, w: 0.07, h: 0.016 }, { k: 'bar', x: 0.8, y: 0.075, w: 0.07, h: 0.016 },
          { k: 'img', x: 0.06, y: 0.17, w: 0.88, h: 0.36, c1: 'soft', c2: 'acc' },
          { k: 'disc', x: 0.78, y: 0.33, rr: 0.12, c: 'bg', a: 0.35 }, { k: 'disc', x: 0.24, y: 0.42, rr: 0.07, c: 'bg', a: 0.25 },
          { k: 'bar', x: 0.55, y: 0.6, w: 0.38, h: 0.018, a: 0.32 }, { k: 'bar', x: 0.55, y: 0.64, w: 0.3, h: 0.018, a: 0.32 },
          { k: 'btn', x: 0.55, y: 0.71, w: 0.22, h: 0.075, c: 'ink', t: 'Записаться', tc: 'bg' },
          { k: 'bar', x: 0.06, y: 0.9, w: 0.12, h: 0.014, a: 0.3 }, { k: 'bar', x: 0.22, y: 0.9, w: 0.12, h: 0.014, a: 0.3 }, { k: 'bar', x: 0.38, y: 0.9, w: 0.12, h: 0.014, a: 0.3 }, { k: 'bar', x: 0.78, y: 0.9, w: 0.16, h: 0.014, a: 0.3 }
        ] }
    ];
    TPL.forEach(function (tp) { tp.pal = [gi(tp.ink), gi(tp.acc), gi(tp.acc2), gi(tp.soft), gi(tp.bg), gi('#FFFFFF')]; });
    var STG = [0, 0.75, 1.6, 2.5, 3.5, 4.3, 7.3], CYC = 8.3;
    var LBL = ['01 · grid.init(6)', '02 · layout()', '03 · styles.apply()', '04 · content.render()', '05 · paint()', '✓ ready', 'next →'];
    function col(tp, c) { return c === 'bg' ? tp.bg : c === 'ink' ? tp.ink : c === 'acc' ? tp.acc : c === 'acc2' ? tp.acc2 : c === 'soft' ? tp.soft : c; }
    function rr(g, x, y, w, h, r) { r = Math.max(0, Math.min(r, w / 2, h / 2)); g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
    function fnt(tp, s) { return tp.st + ' ' + tp.fw + ' ' + Math.max(6, s).toFixed(1) + 'px ' + tp.ff; }
    function isTxt(k) { return k === 'bar' || k === 'btn' || k === 'obtn' || k === 'logo'; }
    function drawSite(g, tp, al, mode) {
      g.save(); g.globalAlpha = al;
      if (!mode) { g.fillStyle = tp.bg; g.fillRect(0, 0, MW, MH); }
      tp.els.forEach(function (e) {
        if (mode === 'txt' && !isTxt(e.k)) return;
        if (mode === 'blk' && isTxt(e.k)) return;
        var x = e.x * MW, y = e.y * MH, w = (e.w || 0) * MW, h = (e.h || 0) * MH, r = (e.r != null ? e.r : 0.03) * MH;
        if (e.k === 'bar') { g.globalAlpha = al * (e.a || 0.35); g.fillStyle = col(tp, e.c || 'ink'); rr(g, x, y, w, h, h / 2); g.fill(); g.globalAlpha = al; }
        else if (e.k === 'box') { g.fillStyle = col(tp, e.c); rr(g, x, y, w, h, r); g.fill(); }
        else if (e.k === 'img') { var gr = g.createLinearGradient(x, y, x + w, y + h); gr.addColorStop(0, col(tp, e.c1)); gr.addColorStop(1, col(tp, e.c2)); g.fillStyle = gr; rr(g, x, y, w, h, 0.035 * MH); g.fill(); }
        else if (e.k === 'disc') { g.globalAlpha = al * (e.a || 1); g.fillStyle = col(tp, e.c); g.beginPath(); g.arc(x, y, e.rr * MH, 0, 6.2832); g.fill(); g.globalAlpha = al; }
        else if (e.k === 'btn' || e.k === 'obtn') {
          rr(g, x, y, w, h, h / 2);
          if (e.k === 'btn') { g.fillStyle = col(tp, e.c); g.fill(); } else { g.strokeStyle = col(tp, e.c); g.lineWidth = 1; g.stroke(); }
          g.font = '600 ' + (h * 0.4).toFixed(1) + 'px Manrope, system-ui, sans-serif'; g.fillStyle = col(tp, e.tc); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(e.t, x + w / 2, y + h / 2 + 0.5);
        }
        else if (e.k === 'logo') { g.font = fnt(tp, e.s * MH); g.fillStyle = tp.ink; g.textAlign = 'left'; g.textBaseline = 'alphabetic'; g.fillText(e.t, x, y); }
      });
      if (mode !== 'blk') {
        g.font = fnt(tp, tp.hs * MH); g.textAlign = tp.al; g.textBaseline = 'alphabetic';
        tp.h1.forEach(function (L, i) { g.fillStyle = col(tp, tp.hc[i]); g.fillText(L, tp.hx * MW, tp.hy * MH + i * tp.hs * MH * tp.lh); });
      }
      g.restore();
    }
    function rects(tp) {
      var R = [];
      mx.save();
      tp.els.forEach(function (e) {
        if (e.k === 'disc') return;
        if (e.k === 'logo') { mx.font = fnt(tp, e.s * MH); var lw = mx.measureText(e.t).width; R.push({ x: e.x * MW, y: e.y * MH - e.s * MH * 0.8, w: lw, h: e.s * MH, t: 1 }); return; }
        R.push({ x: e.x * MW, y: e.y * MH, w: e.w * MW, h: e.h * MH, r: e.k === 'btn' || e.k === 'obtn' || e.k === 'bar' ? e.h * MH / 2 : 0.03 * MH, t: isTxt(e.k) ? 1 : 0 });
      });
      mx.font = fnt(tp, tp.hs * MH);
      tp.h1.forEach(function (L, i) {
        var w = mx.measureText(L).width, bx = tp.al === 'center' ? tp.hx * MW - w / 2 : tp.hx * MW, by = tp.hy * MH + i * tp.hs * MH * tp.lh;
        R.push({ x: bx, y: by - tp.hs * MH * 0.74, w: w, h: tp.hs * MH * 0.86, r: 0, t: 1 });
      });
      mx.restore();
      return R;
    }
    function nearest(tp, r, g, b) {
      var best = tp.pal[0], bd = 1e9;
      for (var q = 0; q < tp.pal.length; q++) { var c = GRGB[tp.pal[q]], d = (c[0] - r) * (c[0] - r) + (c[1] - g) * (c[1] - g) + (c[2] - b) * (c[2] - b); if (d < bd) { bd = d; best = tp.pal[q]; } }
      return best;
    }
    function sample(tp, mode) {
      oc3.width = Math.max(1, Math.round(MW)); oc3.height = Math.max(1, Math.round(MH));
      og3.setTransform(1, 0, 0, 1, 0, 0); og3.clearRect(0, 0, oc3.width, oc3.height);
      drawSite(og3, tp, 1, mode);
      var d = og3.getImageData(0, 0, oc3.width, oc3.height).data, xs = [], ys = [], cs = [], w = oc3.width;
      if (!mode) return { d: d, w: w, h: oc3.height };
      for (var y = 0; y < oc3.height; y++) for (var x = 0; x < w; x++) {
        var k = (y * w + x) * 4;
        if (d[k + 3] > 110) { xs.push(x + Math.random()); ys.push(y + Math.random()); cs.push(nearest(tp, d[k], d[k + 1], d[k + 2])); }
      }
      return { n: xs.length, x: xs, y: ys, c: cs };
    }
    function perim(f, o) {
      var r = Math.min(f.r || 0, f.w / 2, f.h / 2), sw = Math.max(0, f.w - 2 * r), sh = Math.max(0, f.h - 2 * r), ar = Math.PI * r / 2, t = Math.random() * (2 * sw + 2 * sh + 4 * ar), a, x, y;
      if (t < sw) { x = f.x + r + t; y = f.y; }
      else if ((t -= sw) < ar) { a = -Math.PI / 2 + t / r; x = f.x + f.w - r + Math.cos(a) * r; y = f.y + r + Math.sin(a) * r; }
      else if ((t -= ar) < sh) { x = f.x + f.w; y = f.y + r + t; }
      else if ((t -= sh) < ar) { a = t / r; x = f.x + f.w - r + Math.cos(a) * r; y = f.y + f.h - r + Math.sin(a) * r; }
      else if ((t -= ar) < sw) { x = f.x + f.w - r - t; y = f.y + f.h; }
      else if ((t -= sw) < ar) { a = Math.PI / 2 + t / r; x = f.x + r + Math.cos(a) * r; y = f.y + f.h - r + Math.sin(a) * r; }
      else if ((t -= ar) < sh) { x = f.x; y = f.y + f.h - r - t; }
      else { t -= sh; a = Math.PI + t / Math.max(r, 0.001); x = f.x + r + Math.cos(a) * r; y = f.y + r + Math.sin(a) * r; }
      o.x = x + (Math.random() - 0.5) * 0.8; o.y = y + (Math.random() - 0.5) * 0.8;
    }
    function pick(list, wf) { var cum = [], s = 0; list.forEach(function (it) { s += wf(it); cum.push(s); }); return function () { var v = Math.random() * s; for (var q = 0; q < cum.length; q++) if (v <= cum[q]) return list[q]; return list[list.length - 1]; }; }
    var tmp = { x: 0, y: 0, a: 0, c: 0 };
    function assign(gen, stag, free) {
      for (var i = 0; i < NP; i++) {
        gen(tmp, i);
        NX[i] = tmp.x; NY[i] = tmp.y; NA[i] = tmp.a; NC[i] = tmp.c; NF[i] = free ? 1 : 0;
        SWT[i] = ct + (stag ? (tmp.x / MW) * 0.3 + Math.random() * 0.12 : 0) + 1e-4;
      }
    }
    function setStage(s, instant) {
      stage = s; var tp = TPL[ti];
      if (s === 0) {
        RC = rects(tp);
        var L = []; for (var q = 0; q <= 6; q++) L.push(MW * (0.06 + q * 0.88 / 6));
        assign(function (o) { o.x = L[(Math.random() * L.length) | 0] + (Math.random() - 0.5) * 0.8; o.y = Math.random() * MH; o.a = 0.55; o.c = Math.random() < 0.75 ? GLS : ICEC; }, !instant, false);
      } else if (s === 1) {
        if (!RC.length) RC = rects(tp);
        var pw = pick(RC, function (f) { return f.w + f.h; });
        assign(function (o) { perim(pw(), o); o.a = 0.85; o.c = Math.random() < 0.7 ? GLS : ICEC; }, !instant, false);
      } else if (s === 2) {
        if (!RC.length) RC = rects(tp);
        var tx = RC.filter(function (f) { return f.t; }), bk = RC.filter(function (f) { return !f.t; });
        var pt = pick(tx, function (f) { return f.w * Math.max(2, f.h * 0.5); }), pb = bk.length ? pick(bk, function (f) { return f.w + f.h; }) : null;
        assign(function (o) {
          if (!pb || Math.random() < 0.6) { var f = pt(), bh = Math.max(2, Math.min(f.h, f.h * 0.5)); o.x = f.x + Math.random() * f.w; o.y = f.y + (f.h - bh) / 2 + Math.random() * bh; o.c = GLS; }
          else { perim(pb(), o); o.c = ICEC; }
          o.a = 0.8;
        }, !instant, false);
      } else if (s === 3) {
        var st = sample(tp, 'txt'), sb = sample(tp, 'blk');
        assign(function (o) {
          var S = (!sb.n || (st.n && Math.random() < 0.62)) ? st : sb;
          if (!S.n) { o.x = Math.random() * MW; o.y = Math.random() * MH; o.c = GLS; o.a = 0; return; }
          var k = (Math.random() * S.n) | 0; o.x = S.x[k]; o.y = S.y[k]; o.c = S.c[k]; o.a = 1;
        }, !instant, false);
      } else if (s === 4) {
        assign(function (o, i) { o.x = TX[i]; o.y = TY[i]; o.c = CI[i]; o.a = 0; }, false, false);
        for (var j = 0; j < NP; j++) SWT[j] = ct + Math.random() * 0.6 + 1e-4;
      } else if (s === 6) {
        var full = sample(tp, null), cx = MW / 2, cy = MH / 2;
        for (var i = 0; i < NP; i++) {
          var x = Math.random() * MW, y = Math.random() * MH, k2 = ((Math.min(full.h - 1, y | 0)) * full.w + Math.min(full.w - 1, x | 0)) * 4;
          X[i] = x; Y[i] = y; CI[i] = nearest(tp, full.d[k2], full.d[k2 + 1], full.d[k2 + 2]);
          VX[i] = (x - cx) / MW * 3.2 + (Math.random() - 0.5) * 2.4; VY[i] = (y - cy) / MH * 3.2 + (Math.random() - 0.5) * 2.4 - 0.5;
          A[i] = 1; AT[i] = 0.32; FR[i] = 1; SWT[i] = 0;
        }
      }
      if (lab) lab.textContent = tp.name + ' · ' + LBL[s];
    }
    function resize() {
      var p = cv.parentNode, w = Math.max(1, p.clientWidth), h = Math.max(1, p.clientHeight);
      if (Math.abs(w - MW) < 0.5 && Math.abs(h - MH) < 0.5 && NP) return;
      var sx = w / MW, sy = h / MH;
      MW = w; MH = h; md = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = Math.round(MW * md); cv.height = Math.round(MH * md);
      if (!NP) {
        NP = env.mob ? 1400 : 2600;
        X = new Float32Array(NP); Y = new Float32Array(NP); VX = new Float32Array(NP); VY = new Float32Array(NP); TX = new Float32Array(NP); TY = new Float32Array(NP);
        A = new Float32Array(NP); AT = new Float32Array(NP); CI = new Uint8Array(NP); FR = new Uint8Array(NP);
        NX = new Float32Array(NP); NY = new Float32Array(NP); NA = new Float32Array(NP); NC = new Uint8Array(NP); NF = new Uint8Array(NP); SWT = new Float32Array(NP);
        for (var i = 0; i < NP; i++) { X[i] = TX[i] = Math.random() * MW; Y[i] = TY[i] = Math.random() * MH; FR[i] = 1; CI[i] = GLS; }
      } else {
        for (var j = 0; j < NP; j++) { X[j] *= sx; Y[j] *= sy; TX[j] *= sx; TY[j] *= sy; }
        if (on && stage >= 0 && stage <= 3) { RC = []; setStage(stage, true); }
      }
      if (on && env.rm) drawStatic();
    }
    function drawStatic() { mx.setTransform(md, 0, 0, md, 0, 0); mx.clearRect(0, 0, MW, MH); drawSite(mx, TPL[0], 1); if (lab) lab.textContent = TPL[0].name + ' · ✓ ready'; }
    function tick(dt) {
      if (!on || env.rm || asleep) return;
      var br = cv.getBoundingClientRect();
      if (br.bottom < -20 || br.top > env.vh + 20) return;
      ct += dt;
      while (stage < STG.length - 1 && ct >= STG[stage + 1]) setStage(stage + 1);
      if (ct >= CYC) { ti = (ti + 1) % TPL.length; ct = 0; stage = -1; RC = []; setStage(0); }
      var f = Math.min(3, dt * 60), damp = Math.pow(0.84, f), k = 0.02 * f, dd = Math.pow(0.955, f), ea = Math.min(1, dt * 4);
      for (var i = 0; i < NP; i++) {
        if (SWT[i] && ct >= SWT[i]) { TX[i] = NX[i]; TY[i] = NY[i]; AT[i] = NA[i]; CI[i] = NC[i]; FR[i] = NF[i]; SWT[i] = 0; }
        var x = X[i], y = Y[i], vx = VX[i], vy = VY[i];
        if (FR[i]) {
          vx = vx * dd + (Math.random() - 0.5) * 0.05 * f; vy = vy * dd + (Math.random() - 0.5) * 0.05 * f - 0.004 * f;
          x += vx * f; y += vy * f;
          if (x < 0) x += MW; else if (x > MW) x -= MW; if (y < 0) y += MH; else if (y > MH) y -= MH;
        } else {
          vx = (vx + (TX[i] - x) * k) * damp; vy = (vy + (TY[i] - y) * k) * damp;
          x += vx * f; y += vy * f;
        }
        X[i] = x; Y[i] = y; VX[i] = vx; VY[i] = vy;
        A[i] += (AT[i] - A[i]) * ea;
      }
      var gT = stage >= 0 && stage <= 3 ? 1 : 0, wT = stage === 1 || stage === 2 ? 1 : 0, sT = stage === 4 || stage === 5 ? 1 : 0;
      gridA += (gT - gridA) * Math.min(1, dt * 3); wireA += (wT - wireA) * Math.min(1, dt * 3);
      siteA += (sT - siteA) * Math.min(1, dt * (sT ? 2.4 : 9));
      mx.setTransform(md, 0, 0, md, 0, 0); mx.clearRect(0, 0, MW, MH);
      var tp = TPL[ti];
      if (siteA > 0.004) drawSite(mx, tp, siteA);
      if (gridA > 0.004) {
        mx.globalAlpha = gridA * 0.16; mx.strokeStyle = '#BCD3DE'; mx.lineWidth = 1; mx.beginPath();
        for (var q = 0; q <= 6; q++) { var lx = Math.round(MW * (0.06 + q * 0.88 / 6)) + 0.5; mx.moveTo(lx, 0); mx.lineTo(lx, MH); }
        mx.stroke();
      }
      if (wireA > 0.004 && RC.length) {
        mx.globalAlpha = wireA * 0.4; mx.strokeStyle = '#BCD3DE'; mx.setLineDash([3, 3]);
        RC.forEach(function (fr) { rr(mx, fr.x - 2.5, fr.y - 2.5, fr.w + 5, fr.h + 5, (fr.r || 0) + 2); mx.stroke(); });
        mx.setLineDash([]);
      }
      var lc = -1, ps = env.mob ? 1.4 : 1.3;
      for (var j = 0; j < NP; j++) {
        if (A[j] < 0.02) continue;
        if (CI[j] !== lc) { lc = CI[j]; mx.fillStyle = GP[lc]; }
        mx.globalAlpha = A[j];
        mx.fillRect(X[j] - ps / 2, Y[j] - ps / 2, ps, ps);
      }
      mx.globalAlpha = 1;
    }
    // повторное пробуждение (секцию пересобрали) — текущий демо-сайт собирается заново с сетки
    var asleep = false;
    function wake() {
      asleep = false;
      if (on) { if (!env.rm) { ct = 0; stage = -1; RC = []; setStage(0); } return; }
      on = true; resize();
      if (lab) lab.classList.add('on');
      if (env.rm) { drawStatic(); return; }
      ct = 0; stage = -1; setStage(0);
    }
    function sleep() { asleep = true; }
    return { cv: cv, tick: tick, resize: resize, wake: wake, sleep: sleep };
  }

  // ---------- схемы: общий движок узлов, связей и импульсов ----------
  // spec: { nodes: [{ id, name, role, x, y, turn, stack }], edges: [{ a, b, ev, k, grp, p }], src: [id], duplex, title }
  //   x, y — центр узла в долях окна (0..1). Имя с « · » переносится на вторую строку, длинное — по пробелам.
  //   k: 'f' — прямая связь (по умолчанию); 'r' — обратный поток: импульс идёт назад по пройденному пути;
  //      'q' — ответная ветка, берётся с вероятностью p один раз за путь импульса.
  //   grp — из связей узла с одинаковым grp импульс выбирает одну; остальные связи на ветвлении раздваивают импульс.
  //   turn — узел разворачивает импульс обратно по пути. duplex — встречные импульсы сиреневые.
  var PS = { x: 0, y: 0 }, PT = { x: 0, y: 0 };
  function makeGraph(spec) {
    var G = { t: 0, first: 1.5, spawnAt: 1.5, fade: 1, dusting: false, W: 1, H: 1, compact: false, fs: 11, lh: 14, py: 6, title: spec.title || '' };
    var nodes = [], edges = [], pulses = [], labels = [], parts = [], byId = {};
    spec.nodes.forEach(function (n, i) {
      var o = { id: n.id, name: n.name, role: n.role || '', role2: '', fx: n.x, fy: n.y, turn: !!n.turn, stack: !!n.stack, i: i, x: 0, y: 0, w: 0, h: 0, lines: [], at: 0, shown: false, fl: 0, fc: ACC[0], out: [] };
      nodes.push(o); byId[n.id] = o;
    });
    spec.edges.forEach(function (e) {
      var o = { a: byId[e.a], b: byId[e.b], ev: e.ev || '', k: e.k || 'f', grp: e.grp || '', p: e.p == null ? 1 : e.p, side: 0, hor: true, c: null, pts: null, cum: null, len: 1, at: 0 };
      edges.push(o); o.a.out.push(o);
    });
    edges.forEach(function (e) {
      // встречные связи одной пары узлов расходятся: прямая выше (левее), обратная ниже (правее)
      for (var j = 0; j < edges.length; j++) if (edges[j].a === e.b && edges[j].b === e.a) { e.side = e.a.i < e.b.i ? -1 : 1; break; }
    });

    function wrapName(g, name, maxW) {
      var out = [];
      if (g.measureText(name).width <= maxW) return [name];
      name.split(' · ').forEach(function (part) {
        if (g.measureText(part).width <= maxW) { out.push(part); return; }
        var cur = '';
        part.split(' ').forEach(function (w) { var t = cur ? cur + ' ' + w : w; if (cur && g.measureText(t).width > maxW) { out.push(cur); cur = w; } else cur = t; });
        if (cur) out.push(cur);
      });
      return out;
    }
    function curve(e) {
      var A = e.a, B = e.b, dx = B.x - A.x, dy = B.y - A.y, off = (G.compact ? 4 : 5) * e.side, x0, y0, x1, y1, x2, y2, x3, y3, k;
      // горизонтальный зазор между плашками больше вертикального — выходим из боковых сторон, иначе сверху/снизу
      var hor = e.hor = Math.abs(dx) - (A.w + B.w) / 2 > Math.abs(dy) - (A.h + B.h) / 2;
      if (hor) {
        var sx = dx >= 0 ? 1 : -1, fa = clamp(dy * 0.2, -A.h / 2 + 7, A.h / 2 - 7), fb = clamp(-dy * 0.2, -B.h / 2 + 7, B.h / 2 - 7);
        x0 = A.x + sx * A.w / 2; y0 = A.y + fa + off; x3 = B.x - sx * (B.w / 2 + 1); y3 = B.y + fb + off;
        k = Math.max(12, Math.abs(x3 - x0) * 0.5);
        x1 = x0 + sx * k; y1 = y0 + off * 1.6; x2 = x3 - sx * k; y2 = y3 + off * 1.6;
      } else {
        var sy = dy >= 0 ? 1 : -1, ga = clamp(dx * 0.2, -A.w / 2 + 8, A.w / 2 - 8), gb = clamp(-dx * 0.2, -B.w / 2 + 8, B.w / 2 - 8);
        x0 = A.x + ga + off; y0 = A.y + sy * A.h / 2; x3 = B.x + gb + off; y3 = B.y - sy * (B.h / 2 + 1);
        k = Math.max(12, Math.abs(y3 - y0) * 0.5);
        x1 = x0 + off * 1.6; y1 = y0 + sy * k; x2 = x3 + off * 1.6; y2 = y3 - sy * k;
      }
      e.c = [x0, y0, x1, y1, x2, y2, x3, y3];
      // таблица точек по длине: импульсы бегут с постоянной скоростью в px/с
      var N = 40, pts = new Float32Array((N + 1) * 2), cum = new Float32Array(N + 1), L = 0, lx = x0, ly = y0;
      for (var i = 0; i <= N; i++) {
        var t = i / N, u = 1 - t, a = u * u * u, b = 3 * u * u * t, c = 3 * u * t * t, d = t * t * t;
        var x = a * x0 + b * x1 + c * x2 + d * x3, y = a * y0 + b * y1 + c * y2 + d * y3;
        if (i) L += Math.sqrt((x - lx) * (x - lx) + (y - ly) * (y - ly));
        pts[i * 2] = x; pts[i * 2 + 1] = y; cum[i] = L; lx = x; ly = y;
      }
      e.pts = pts; e.cum = cum; e.len = Math.max(1, L);
    }
    function pos(e, s, o) {
      var cum = e.cum, P = e.pts, N = cum.length - 1;
      if (s <= 0) { o.x = P[0]; o.y = P[1]; return; }
      if (s >= e.len) { o.x = P[N * 2]; o.y = P[N * 2 + 1]; return; }
      var i = Math.min(N - 1, Math.floor(s / e.len * N));
      while (i > 0 && cum[i] > s) i--;
      while (i < N - 1 && cum[i + 1] < s) i++;
      var u = (s - cum[i]) / ((cum[i + 1] - cum[i]) || 1);
      o.x = P[i * 2] + (P[i * 2 + 2] - P[i * 2]) * u; o.y = P[i * 2 + 1] + (P[i * 2 + 3] - P[i * 2 + 1]) * u;
    }
    // подпись события: над горизонтальной связью (встречная — под ней), плашки узлов не перекрывает;
    // у вертикальной — на самой линии ближе к источнику, чтобы подписи соседних связей зигзага не сходились
    function labelPos(L) {
      var e = L.e, m = e.len / 2, h = L.h = G.compact ? 14 : 15, x, y, side;
      pos(e, m - 3, PS); pos(e, m + 3, PT);
      var mx = (PS.x + PT.x) / 2, my = (PS.y + PT.y) / 2;
      if (e.hor) {
        side = e.side > 0 ? 1 : -1; x = mx - L.w / 2; y = side < 0 ? my - 5 - h : my + 5;
        for (var pass = 0; pass < 2; pass++) [e.a, e.b].forEach(function (n) {
          if (x < n.x + n.w / 2 + 3 && x + L.w > n.x - n.w / 2 - 3 && y < n.y + n.h / 2 + 3 && y + h > n.y - n.h / 2 - 3) y = side < 0 ? n.y - n.h / 2 - h - 4 : n.y + n.h / 2 + 4;
        });
      } else {
        pos(e, e.len * 0.4, PS); x = PS.x - L.w / 2 + e.side * (L.w / 2 + 6); y = PS.y - h / 2;
      }
      L.x = clamp(x, 3, G.W - L.w - 3); L.y = clamp(y, 3, G.H - h - 3);
    }

    function go(e, from, path, ret) {
      if (pulses.length > 48 || from.step > 12) return;
      var r = !!ret || e.k === 'r', st = from.step + 1;
      pulses.push({ e: e, s: 0, v: 260 + Math.random() * 120, tl: 28 + Math.random() * 8, end: false, step: st, q: from.q || e.k === 'q', ret: r, path: path, col: r && spec.duplex ? LILAC : ACC[st % ACC.length] });
    }
    function back(a, b) { for (var j = 0; j < a.out.length; j++) if (a.out[j].b === b && a.out[j].k === 'r') return a.out[j]; return null; }
    function route(n, p) {
      var e;
      if (p.ret) { if (p.path.length > 1 && (e = back(n, p.path[p.path.length - 2]))) go(e, p, p.path.slice(0, -1), true); return; }
      var grp = {};
      n.out.forEach(function (o) {
        if (o.k === 'r') return;
        if (o.k === 'q') { if (!p.q && Math.random() < o.p) go(o, p, p.path.concat(o.b)); return; }
        if (o.grp) { (grp[o.grp] = grp[o.grp] || []).push(o); return; }
        if (Math.random() < o.p) go(o, p, p.path.concat(o.b));
      });
      Object.keys(grp).forEach(function (k) { var l = grp[k], o = l[(Math.random() * l.length) | 0]; go(o, p, p.path.concat(o.b)); });
      if (n.turn && p.path.length > 1 && (e = back(n, p.path[p.path.length - 2]))) go(e, p, p.path.slice(0, -1), true);
    }
    function arrive(p) {
      var n = p.e.b, L = null;
      n.fl = 0.4; n.fc = p.col;
      if (p.e.ev) {
        for (var j = 0; j < labels.length; j++) if (labels[j].e === p.e) { L = labels[j]; break; }
        if (L) L.t = Math.min(L.t, 0.12);
        else labels.push(L = { e: p.e, txt: p.e.ev, t: 0, w: 0, h: 15, x: 0, y: 0, fs: 0 });
        L.col = p.col;
      }
      route(n, p);
    }
    function puff(x, y, vx, vy, life, col) { if (parts.length < 900) parts.push({ x: x, y: y, vx: vx, vy: vy, l: life, m: life, c: col }); }
    function rim(n, o) {
      var w = n.w, h = n.h, t = Math.random() * 2 * (w + h);
      if (t < w) { o.x = n.x - w / 2 + t; o.y = n.y - h / 2; }
      else if ((t -= w) < h) { o.x = n.x + w / 2; o.y = n.y - h / 2 + t; }
      else if ((t -= h) < w) { o.x = n.x + w / 2 - t; o.y = n.y + h / 2; }
      else { o.x = n.x - w / 2; o.y = n.y + h / 2 - (t - w); }
    }
    function burst(n) {
      var col = ACC[n.i % ACC.length];
      for (var j = 0; j < 26; j++) {
        rim(n, PS);
        var dx = PS.x - n.x, dy = PS.y - n.y, dl = Math.sqrt(dx * dx + dy * dy) || 1, sp = 20 + Math.random() * 45;
        puff(PS.x, PS.y, dx / dl * sp, dy / dl * sp, 0.35 + Math.random() * 0.35, col);
      }
    }

    G.layout = function (g, W, H, compact) {
      G.W = W; G.H = H; G.compact = compact;
      var fs = compact ? 10 : 11, px = compact ? 7 : 10, py = compact ? 5 : 6, lh = fs + 3, maxW = W * (compact ? 0.3 : 0.27) - 2 * px;
      G.fs = fs; G.lh = lh; G.py = py;
      g.save();
      nodes.forEach(function (n) {
        g.font = '600 ' + fs + 'px Manrope, system-ui, sans-serif';
        n.lines = wrapName(g, n.name, maxW);
        var tw = 0;
        n.lines.forEach(function (l) { tw = Math.max(tw, g.measureText(l).width); });
        n.role2 = compact ? '' : n.role;
        if (n.role2) { g.font = '500 9px "JetBrains Mono", monospace'; tw = Math.max(tw, g.measureText(n.role2).width); }
        n.w = Math.ceil(tw + 2 * px); n.h = Math.ceil(2 * py + n.lines.length * lh + (n.role2 ? 12 : 0));
        n.x = clamp(n.fx * W, n.w / 2 + 6, W - n.w / 2 - 6); n.y = clamp(n.fy * H, n.h / 2 + 6, H - n.h / 2 - 6);
      });
      g.restore();
      edges.forEach(curve);
    };
    // instant — сразу готовая схема (статичный кадр, оверлей «Потока»)
    G.build = function (instant) {
      G.t = 0; G.fade = 1; G.dusting = false; G.first = G.spawnAt = instant ? 0.3 : 1.5;
      pulses.length = 0; labels.length = 0; parts.length = 0;
      // узлы появляются по одному слева направо, связи прорисовываются вслед за ними
      nodes.forEach(function (n) { n.at = instant ? -1 : 0.12 + n.fx * 0.95 + n.fy * 0.15; n.shown = instant; n.fl = 0; });
      edges.forEach(function (e) { e.at = instant ? -1 : Math.max(e.a.at, e.b.at) + 0.12; });
    };
    G.fire = function () {
      var ids = spec.src || [nodes[0].id], n = byId[ids[(Math.random() * ids.length) | 0]];
      route(n, { step: -1, q: false, ret: false, path: [n] });
    };
    G.clear = function () { pulses.length = 0; labels.length = 0; };
    // рассыпаться пылью: плашки и связи превращаются в частицы и гаснут
    G.dust = function () {
      nodes.forEach(function (n) {
        if (!n.shown) return;
        for (var j = 0; j < 46; j++) {
          if (j % 3) rim(n, PS); else { PS.x = n.x + (Math.random() - 0.5) * n.w * 0.7; PS.y = n.y + (Math.random() - 0.5) * n.h * 0.6; }
          puff(PS.x, PS.y, (Math.random() - 0.5) * 36, (Math.random() - 0.5) * 30 - 14, 0.8 + Math.random() * 0.7, j % 4 ? '#BCD3DE' : ACC[n.i % ACC.length]);
        }
      });
      edges.forEach(function (e) {
        for (var j = 0; j < 22; j++) { pos(e, Math.random() * e.len, PS); puff(PS.x, PS.y, (Math.random() - 0.5) * 26, (Math.random() - 0.5) * 22 - 10, 0.6 + Math.random() * 0.7, '#BCD3DE'); }
      });
      G.dusting = true;
    };
    // rate — интервал между импульсами в секундах, 0 — новых не запускать
    G.update = function (dt, rate) {
      G.t += dt;
      var t = G.t, j;
      for (j = 0; j < nodes.length; j++) {
        var n = nodes[j];
        if (!n.shown && t >= n.at) { n.shown = true; burst(n); }
        if (n.fl > 0) n.fl = Math.max(0, n.fl - dt);
      }
      if (rate) {
        if (G.spawnAt - t > rate) G.spawnAt = Math.max(G.first, t + rate);
        if (t >= G.spawnAt) { G.spawnAt = t + rate; G.fire(); }
      }
      for (j = pulses.length - 1; j >= 0; j--) {
        var p = pulses[j];
        p.s += p.v * dt;
        if (!p.end && p.s >= p.e.len) { p.end = true; arrive(p); }
        if (p.end && p.s - p.tl >= p.e.len) pulses.splice(j, 1);
      }
      for (j = labels.length - 1; j >= 0; j--) { labels[j].t += dt; if (labels[j].t >= 0.9) labels.splice(j, 1); }
      var dd = Math.pow(0.1, dt);
      for (j = parts.length - 1; j >= 0; j--) {
        var q = parts[j];
        if ((q.l -= dt) <= 0) { parts.splice(j, 1); continue; }
        q.vx *= dd; q.vy *= dd; q.x += q.vx * dt; q.y += q.vy * dt;
      }
      if (G.dusting) G.fade = Math.max(0, G.fade - dt / 0.3);
    };
    // A — общая прозрачность; solid — плотная подложка под плашками (поверх ярких потоков)
    G.draw = function (g, A, solid) {
      var t = G.t, F = A * G.fade, j;
      g.save();
      g.lineCap = 'round'; g.lineJoin = 'round';
      if (F > 0.003) {
        g.lineWidth = 1;
        for (j = 0; j < edges.length; j++) {
          var e = edges[j], u = clamp((t - e.at) / 0.45, 0, 1), c = e.c;
          if (u <= 0) continue;
          g.globalAlpha = F; g.strokeStyle = 'rgba(188,211,222,.18)';
          if (u < 1) { g.setLineDash([e.len + 2, e.len + 2]); g.lineDashOffset = (e.len + 2) * (1 - u); }
          g.beginPath(); g.moveTo(c[0], c[1]); g.bezierCurveTo(c[2], c[3], c[4], c[5], c[6], c[7]); g.stroke();
          if (u < 1) { g.setLineDash([]); g.lineDashOffset = 0; continue; }
          // шеврон у входа в узел
          var N = e.cum.length - 1, ex = e.pts[N * 2], ey = e.pts[N * 2 + 1], tx = ex - e.pts[N * 2 - 4], ty = ey - e.pts[N * 2 - 3], tl = Math.sqrt(tx * tx + ty * ty) || 1;
          tx /= tl; ty /= tl;
          g.strokeStyle = 'rgba(188,211,222,.5)'; g.beginPath();
          g.moveTo(ex - tx * 4.5 - ty * 3.2, ey - ty * 4.5 + tx * 3.2); g.lineTo(ex, ey); g.lineTo(ex - tx * 4.5 + ty * 3.2, ey - ty * 4.5 - tx * 3.2); g.stroke();
        }
        for (j = 0; j < nodes.length; j++) {
          var n = nodes[j], a = clamp((t - n.at) / 0.3, 0, 1) * F;
          if (a <= 0) continue;
          var x = n.x - n.w / 2, y = n.y - n.h / 2, fl = n.fl / 0.4;
          g.lineWidth = 1;
          if (n.stack) for (var s = 2; s >= 1; s--) {
            g.globalAlpha = a * (s === 2 ? 0.35 : 0.6); rrect(g, x + s * 4, y - s * 4, n.w, n.h, 8);
            if (solid) { g.fillStyle = 'rgba(10,18,26,.85)'; g.fill(); }
            g.strokeStyle = 'rgba(188,211,222,.22)'; g.stroke();
          }
          g.globalAlpha = a; rrect(g, x, y, n.w, n.h, 8);
          if (solid) { g.fillStyle = 'rgba(10,18,26,.8)'; g.fill(); }
          g.fillStyle = fl > 0 ? rgba(n.fc, 0.04 + fl * 0.08) : 'rgba(228,237,242,.04)'; g.fill();
          g.strokeStyle = 'rgba(188,211,222,.22)'; g.stroke();
          if (fl > 0) {
            // вспышка: обводка ярче и расходящееся кольцо
            g.strokeStyle = rgba(n.fc, 0.75 * fl); g.stroke();
            var gr = (1 - fl) * 8;
            g.globalAlpha = a * fl * 0.55; g.lineWidth = 1.5; g.strokeStyle = n.fc;
            rrect(g, x - gr, y - gr, n.w + gr * 2, n.h + gr * 2, 8 + gr); g.stroke();
            g.globalAlpha = a; g.lineWidth = 1;
          }
          g.textAlign = 'center'; g.textBaseline = 'middle';
          var ty2 = y + G.py;
          if (n.role2) { g.font = '500 9px "JetBrains Mono", monospace'; g.fillStyle = '#8FAEC0'; g.fillText(n.role2, n.x, ty2 + 5); ty2 += 12; }
          g.font = '600 ' + G.fs + 'px Manrope, system-ui, sans-serif'; g.fillStyle = '#EEF3F6';
          for (var li = 0; li < n.lines.length; li++) g.fillText(n.lines[li], n.x, ty2 + G.lh * li + G.lh / 2 + 0.5);
        }
        g.globalCompositeOperation = 'lighter';
        for (j = 0; j < pulses.length; j++) {
          var p = pulses[j], hs = Math.min(p.s, p.e.len), ts = Math.max(0, p.s - p.tl);
          if (hs - ts < 0.5) continue;
          g.strokeStyle = p.col; pos(p.e, ts, PS);
          for (var k = 1; k <= 8; k++) {
            pos(p.e, ts + (hs - ts) * k / 8, PT);
            var f = k / 8; g.globalAlpha = F * f * f * 0.9; g.lineWidth = 0.6 + f * 1.4;
            g.beginPath(); g.moveTo(PS.x, PS.y); g.lineTo(PT.x, PT.y); g.stroke();
            PS.x = PT.x; PS.y = PT.y;
          }
          if (!p.end) {
            g.globalAlpha = F * 0.9; g.drawImage(glow(p.col), PT.x - 8, PT.y - 8, 16, 16);
            g.globalAlpha = F; g.fillStyle = p.col; g.beginPath(); g.arc(PT.x, PT.y, 1.25, 0, 6.2832); g.fill();
          }
        }
        g.globalCompositeOperation = 'source-over';
        g.font = '500 ' + (G.compact ? 9 : 9.5) + 'px "JetBrains Mono", monospace'; g.textAlign = 'left'; g.textBaseline = 'middle'; g.lineWidth = 1;
        for (j = 0; j < labels.length; j++) {
          var L = labels[j], la = Math.min(1, L.t / 0.12) * Math.min(1, (0.9 - L.t) / 0.45) * F;
          if (la <= 0) continue;
          if (L.fs !== G.fs) { L.w = g.measureText(L.txt).width + 12; L.fs = G.fs; }
          labelPos(L);
          g.globalAlpha = la * 0.9; rrect(g, L.x, L.y, L.w, L.h, L.h / 2); g.fillStyle = 'rgba(10,18,26,.82)'; g.fill(); g.strokeStyle = rgba(L.col, 0.3); g.stroke();
          g.globalAlpha = la; g.fillStyle = L.col; g.fillText(L.txt, L.x + 6, L.y + L.h / 2 + 0.5);
        }
      }
      if (parts.length) {
        g.globalCompositeOperation = 'lighter';
        for (j = 0; j < parts.length; j++) { var q = parts[j]; g.globalAlpha = A * Math.min(1, q.l / q.m * 1.4) * 0.85; g.fillStyle = q.c; g.fillRect(q.x - 0.7, q.y - 0.7, 1.4, 1.4); }
      }
      g.restore();
    };
    return G;
  }

  // ---------- конфигурации схем: canvas[data-flow="id"] ----------
  var FLOWS = {
    'b24-digest': { src: ['b24'], nodes: [
      { id: 'b24', name: 'Битрикс24 · задачи', role: 'trigger', x: 0.2, y: 0.28 },
      { id: 'wh', name: 'Webhook', role: 'webhook', x: 0.52, y: 0.28 },
      { id: 'n8n', name: 'n8n', role: 'workflow', x: 0.82, y: 0.28 },
      { id: 'ai', name: 'AI · анализ', role: 'ai', x: 0.36, y: 0.72 },
      { id: 'tg', name: 'Telegram', role: 'output', x: 0.76, y: 0.72 }
    ], edges: [
      { a: 'b24', b: 'wh', ev: 'task.updated' },
      { a: 'wh', b: 'n8n', ev: 'POST /webhook' },
      { a: 'n8n', b: 'ai', ev: 'summarize()' },
      { a: 'ai', b: 'tg', ev: 'sendMessage' },
      { a: 'tg', b: 'ai', ev: 'вопрос → ответ', k: 'q', p: 0.6 }
    ] },
    'call-audit': { src: ['tel'], nodes: [
      { id: 'tel', name: 'Телефония', role: 'trigger', x: 0.18, y: 0.28 },
      { id: 'rec', name: 'Битрикс24 · запись', role: 'webhook', x: 0.5, y: 0.28 },
      { id: 'n8n', name: 'n8n', role: 'workflow', x: 0.82, y: 0.28 },
      { id: 'stt', name: 'Распознавание речи', role: 'ai', x: 0.19, y: 0.72 },
      { id: 'ai', name: 'AI · оценка', role: 'ai', x: 0.5, y: 0.72 },
      { id: 'crm', name: 'CRM · сделка', role: 'output', x: 0.82, y: 0.72 }
    ], edges: [
      { a: 'tel', b: 'rec', ev: 'call.end' },
      { a: 'rec', b: 'n8n', ev: 'record.url' },
      { a: 'n8n', b: 'stt', ev: 'transcribe()' },
      { a: 'stt', b: 'ai', ev: 'score: 8/10' },
      { a: 'ai', b: 'crm', ev: 'comment.add' }
    ] },
    'tg-crm': { src: ['tg'], duplex: true, nodes: [
      { id: 'tg', name: 'Telegram · мини-приложение', role: 'trigger', x: 0.17, y: 0.38 },
      { id: 'api', name: 'API', role: 'webhook', x: 0.52, y: 0.38 },
      { id: 'crm', name: 'Битрикс24 · CRM', role: 'workflow', x: 0.84, y: 0.38, turn: true },
      { id: 'mgr', name: 'Менеджер', role: 'output', x: 0.84, y: 0.8 }
    ], edges: [
      { a: 'tg', b: 'api', ev: 'lead.create' },
      { a: 'api', b: 'crm', ev: 'sync ⇄' },
      { a: 'crm', b: 'mgr', ev: 'notify' },
      { a: 'crm', b: 'api', ev: 'status: в работе', k: 'r' },
      { a: 'api', b: 'tg', ev: 'sync ⇄', k: 'r' }
    ] },
    'ai-gateway': { src: ['site', 'crm', 'bot'], duplex: true, nodes: [
      { id: 'site', name: 'Сайт', role: 'trigger', x: 0.12, y: 0.2 },
      { id: 'crm', name: 'CRM', role: 'trigger', x: 0.12, y: 0.5 },
      { id: 'bot', name: 'Бот', role: 'trigger', x: 0.12, y: 0.8 },
      { id: 'gw', name: 'AI-шлюз · Cloudflare', role: 'workflow', x: 0.5, y: 0.4 },
      { id: 'log', name: 'Логи и лимиты', role: 'output', x: 0.5, y: 0.82 },
      { id: 'ma', name: 'Модель A', role: 'ai', x: 0.88, y: 0.2, turn: true },
      { id: 'mb', name: 'Модель B', role: 'ai', x: 0.88, y: 0.5, turn: true },
      { id: 'mc', name: 'Модель C', role: 'ai', x: 0.88, y: 0.8, turn: true }
    ], edges: [
      { a: 'site', b: 'gw', ev: 'POST /v1/chat' },
      { a: 'crm', b: 'gw', ev: 'POST /v1/chat' },
      { a: 'bot', b: 'gw', ev: 'POST /v1/chat' },
      { a: 'gw', b: 'ma', ev: 'route → A', grp: 'model' },
      { a: 'gw', b: 'mb', ev: 'route → B', grp: 'model' },
      { a: 'gw', b: 'mc', ev: 'route → C', grp: 'model' },
      { a: 'gw', b: 'log', ev: 'tokens: 1.2k' },
      { a: 'ma', b: 'gw', ev: 'sync ⇄', k: 'r' },
      { a: 'mb', b: 'gw', ev: 'sync ⇄', k: 'r' },
      { a: 'mc', b: 'gw', ev: 'sync ⇄', k: 'r' },
      { a: 'gw', b: 'site', ev: '200 OK', k: 'r' },
      { a: 'gw', b: 'crm', ev: '200 OK', k: 'r' },
      { a: 'gw', b: 'bot', ev: '200 OK', k: 'r' }
    ] },
    'your-process': { rand: 'chain' },
    'your-integration': { rand: 'duplex' }
  };

  // ---------- случайные цепочки для «Ваш процесс» / «Ваша интеграция» ----------
  var POOL = ['Сайт', 'Форма', 'CRM', 'Webhook', 'n8n', 'AI', 'Таблица', '1С', 'Telegram', 'Почта', 'Склад', 'Оплата'];
  var P_SRC = ['Сайт', 'Форма', 'Оплата', 'Почта', 'Telegram'], P_MID = ['Webhook', 'n8n', 'AI', 'CRM', '1С'], P_DST = ['Telegram', 'Почта', 'Таблица', 'CRM', '1С', 'Склад'];
  var ROLE = { Webhook: 'webhook', n8n: 'workflow', AI: 'ai', CRM: 'workflow', '1С': 'workflow' };
  var EVT = { Webhook: 'POST /hook', n8n: 'workflow.run', AI: 'classify()', CRM: 'lead.create', 'Таблица': 'row.append', '1С': 'doc.sync', Telegram: 'sendMessage', 'Почта': 'mail.send', 'Склад': 'stock.update' };
  function pickOne(list, used) { var l = list.filter(function (x) { return used.indexOf(x) < 0; }); return l[(Math.random() * l.length) | 0]; }
  function chainSpec(names, duplex) {
    var n = names.length, X = n === 2 ? [0.27, 0.73] : n === 3 ? [0.17, 0.5, 0.83] : null, nodes = [], edges = [];
    names.forEach(function (nm, i) {
      nodes.push({ id: 'n' + i, name: nm, role: i === 0 ? 'trigger' : i === n - 1 ? 'output' : ROLE[nm] || (duplex ? 'webhook' : 'workflow'),
        x: X ? X[i] : 0.14 + i * 0.72 / (n - 1), y: X ? 0.5 : (i % 2 ? 0.67 : 0.33), turn: duplex && i === n - 1 });
      if (!i) return;
      if (duplex) {
        edges.push({ a: 'n' + (i - 1), b: 'n' + i, ev: i === 1 ? ['POST /api', 'sync ⇄', 'webhook'][(Math.random() * 3) | 0] : 'sync ⇄' });
        edges.push({ a: 'n' + i, b: 'n' + (i - 1), ev: i === n - 1 && Math.random() < 0.5 ? '200 OK' : 'sync ⇄', k: 'r' });
      } else edges.push({ a: 'n' + (i - 1), b: 'n' + i, ev: EVT[nm] || 'sync' });
    });
    return { nodes: nodes, edges: edges, src: ['n0'], duplex: duplex, title: names.join(duplex ? ' ⇄ ' : ' → ') };
  }
  function randSpec(kind, prev) {
    var s = null;
    for (var tries = 0; tries < 6; tries++) {
      var names = [];
      if (kind === 'duplex') { var m = Math.random() < 0.5 ? 2 : 3; while (names.length < m) names.push(pickOne(POOL, names)); }
      else {
        var n = 3 + ((Math.random() * 3) | 0);
        names.push(pickOne(P_SRC, names));
        while (names.length < n - 1) names.push(pickOne(P_MID, names));
        names.push(pickOne(P_DST, names));
      }
      s = chainSpec(names, kind === 'duplex');
      if (s.title !== prev) break;
    }
    return s;
  }
  FLOWS['your-process'].still = chainSpec(['Форма', 'CRM', 'Telegram'], false);
  FLOWS['your-integration'].still = chainSpec(['CRM', '1С'], true);

  // ---------- карточка-схема ----------
  // Фиксированная схема: сборка → через ~1.5 с импульсы раз в 4.4 с, при наведении — раз в 1.1 с.
  // Случайная (cfg.rand): цикл 7 с — собралась → 2–3 импульса → рассыпалась пылью → следующая.
  function makeFlow(cv, env, cfg) {
    if (!cv || !cv.getContext) return null;
    var g = cv.getContext('2d'), win = cv.parentNode, card = win.closest('.glass') || win, lab = win.querySelector('[data-flow-label]');
    var st = { w: 0, h: 0, d: 0 }, on = false, G = null, ct = 0, stage = '', prev = '', CYC = 7;
    var RUN = cfg.rand === 'duplex' ? 'sync' : 'run';
    function compact() { return st.w < 340; }
    function label(s) { stage = s; if (lab && G) lab.textContent = G.title + ' · ' + s; }
    function next(first) {
      var spec = cfg.rand ? (first && env.rm ? cfg.still : randSpec(cfg.rand, prev)) : cfg;
      prev = spec.title || '';
      G = makeGraph(spec); G.layout(g, st.w, st.h, compact()); G.build(env.rm); ct = 0;
      if (cfg.rand) label(env.rm ? 'ready' : 'build');
    }
    function draw() { g.setTransform(st.d, 0, 0, st.d, 0, 0); g.clearRect(0, 0, st.w, st.h); if (G) G.draw(g, 1, false); }
    function tick(dt) {
      if (!on || env.rm || !G || asleep) return;
      if (offscreen(cv, env)) return;
      var hov = card.matches(':hover');
      if (cfg.rand) {
        ct += dt;
        if (ct >= CYC) next(false);
        else if (ct >= 5.6 && stage !== 'next →') { G.dust(); label('next →'); }
        else if (ct >= 1.5 && stage === 'build') label(RUN);
        G.update(dt, ct < 4.4 ? (hov ? 0.55 : 1.1) : 0);
      } else G.update(dt, hov ? 1.1 : 4.4); // в покое — спокойно, при наведении — вчетверо чаще
      draw();
    }
    function resize() {
      if (!fitCanvas(cv, st)) return;
      if (G) G.layout(g, st.w, st.h, compact());
      if (on && env.rm) draw();
    }
    // повторное пробуждение (секцию пересобрали) — схема собирается заново: узлы слева направо, потом импульсы
    var asleep = false;
    function wake() {
      asleep = false;
      if (on) { if (!env.rm && G) { if (cfg.rand) next(false); else G.build(false); } return; }
      on = true; fitCanvas(cv, st); next(true);
      if (lab) lab.classList.add('on');
      if (env.rm) draw();
    }
    function sleep() { asleep = true; }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if (G) { G.layout(g, st.w, st.h, compact()); if (on && env.rm) draw(); } });
    return { cv: cv, tick: tick, resize: resize, wake: wake, sleep: sleep };
  }

  // ---------- «Поток»: световые ленты под матовым стеклом, при наведении — схема устройства ----------
  var LOCK = { src: ['web'], nodes: [
    { id: 'web', name: 'Сайт', role: 'frontend', x: 0.18, y: 0.28 },
    { id: 'acc', name: 'Личный кабинет', role: 'account', x: 0.5, y: 0.28 },
    { id: 'pay', name: 'Платежи', role: 'billing', x: 0.82, y: 0.28 },
    { id: 'srv', name: 'Узлы ×N', role: 'servers', x: 0.36, y: 0.72, stack: true },
    { id: 'mon', name: 'Мониторинг', role: 'monitoring', x: 0.74, y: 0.72 }
  ], edges: [
    { a: 'web', b: 'acc', ev: 'signup' },
    { a: 'acc', b: 'pay', ev: 'checkout' },
    { a: 'pay', b: 'srv', ev: 'provision()' },
    { a: 'srv', b: 'mon', ev: 'health: ok' }
  ] };
  function makeFlowLight(cv, env) {
    if (!cv || !cv.getContext) return null;
    var g = cv.getContext('2d'), win = cv.parentNode, card = win.closest('[data-flowcard]') || win, frost = win.querySelector('[data-frost]');
    var st = { w: 0, h: 0, d: 0 }, on = false, t = 0, sa = 0, was = false, R = [], B = new Float32Array(8), G = makeGraph(LOCK), touch = '';
    function seed() {
      var n = env.mob ? 9 : 11; R = [];
      for (var i = 0; i < n; i++) R.push({ y0: (i + 0.5) / n, c: ACC[(i * 3) % ACC.length], ph: Math.random() * 6.283, w1: 0.22 + Math.random() * 0.3, w2: 0.18 + Math.random() * 0.28, amp: 0.05 + Math.random() * 0.08, per: 2.6 + Math.random() * 1.8, off: Math.random(), wd: 0.7 + Math.random() * 0.6 });
    }
    function isOpen() { return card.classList.contains('is-open') || card.matches(':hover') || card.matches(':focus-within'); }
    // лента: из-за левого края к точке схода (0.62, 0.55), контрольные точки медленно плавают
    function bez(r) {
      var W = st.w, H = st.h, fy = 0.55 * H, y0 = (-0.12 + r.y0 * 1.24) * H + Math.sin(t * r.w1 + r.ph) * 0.04 * H;
      B[0] = -0.06 * W; B[1] = y0;
      B[2] = 0.24 * W; B[3] = y0 + Math.sin(t * r.w2 + r.ph * 1.7) * r.amp * H;
      B[4] = 0.44 * W; B[5] = fy + (y0 - fy) * 0.16 + Math.cos(t * r.w1 * 0.8 + r.ph) * r.amp * 0.5 * H;
      B[6] = 0.62 * W + Math.sin(t * 0.7 + r.ph) * 1.5; B[7] = fy + Math.cos(t * 0.6 + r.ph) * 1.5;
    }
    function bezAt(u, o) { var v = 1 - u, a = v * v * v, b = 3 * v * v * u, c = 3 * v * u * u, d = u * u * u; o.x = a * B[0] + b * B[2] + c * B[4] + d * B[6]; o.y = a * B[1] + b * B[3] + c * B[5] + d * B[7]; }
    function draw() {
      var W = st.w, H = st.h, fx = 0.62 * W, fy = 0.55 * H, dim = 1 - 0.5 * sa, i, k;
      g.setTransform(st.d, 0, 0, st.d, 0, 0); g.clearRect(0, 0, W, H);
      g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
      var rg = g.createRadialGradient(fx, fy, 0, fx, fy, H * 0.5);
      rg.addColorStop(0, 'rgba(142,216,248,.26)'); rg.addColorStop(0.35, 'rgba(127,168,255,.09)'); rg.addColorStop(1, 'rgba(127,168,255,0)');
      g.globalAlpha = dim * (0.85 + 0.15 * Math.sin(t * 1.3)); g.fillStyle = rg; g.fillRect(0, 0, W, H);
      var bl = g.createLinearGradient(fx, 0, W, 0);
      bl.addColorStop(0, 'rgba(142,216,248,.55)'); bl.addColorStop(1, 'rgba(142,216,248,0)');
      g.strokeStyle = bl; g.beginPath(); g.moveTo(fx, fy); g.lineTo(W, fy - 0.03 * H);
      g.globalAlpha = dim * 0.12; g.lineWidth = 8; g.stroke(); g.globalAlpha = dim * 0.5; g.lineWidth = 1.2; g.stroke();
      for (i = 0; i < R.length; i++) {
        var r = R[i]; bez(r);
        var lg = g.createLinearGradient(B[0], 0, B[6], 0);
        lg.addColorStop(0, rgba(r.c, 0)); lg.addColorStop(0.3, rgba(r.c, 0.55)); lg.addColorStop(1, rgba(r.c, 1));
        g.strokeStyle = lg; g.beginPath(); g.moveTo(B[0], B[1]); g.bezierCurveTo(B[2], B[3], B[4], B[5], B[6], B[7]);
        g.globalAlpha = dim * 0.05; g.lineWidth = 10 * r.wd; g.stroke();
        g.globalAlpha = dim * 0.11; g.lineWidth = 4 * r.wd; g.stroke();
        g.globalAlpha = dim * 0.42; g.lineWidth = 1; g.stroke();
      }
      for (i = 0; i < R.length; i++) {
        var q = R[i]; bez(q);
        var u = (t / q.per + q.off) % 1, fade = Math.sin(Math.PI * u), tl = 0.16;
        g.strokeStyle = q.c; bezAt(Math.max(0, u - tl), PS);
        for (k = 1; k <= 10; k++) {
          bezAt(Math.max(0, u - tl + tl * k / 10), PT);
          var f = k / 10; g.globalAlpha = dim * fade * f * f; g.lineWidth = 0.6 + f * 1.8;
          g.beginPath(); g.moveTo(PS.x, PS.y); g.lineTo(PT.x, PT.y); g.stroke();
          PS.x = PT.x; PS.y = PT.y;
        }
        g.globalAlpha = dim * fade; g.drawImage(glow(q.c), PT.x - 10, PT.y - 10, 20, 20);
        g.fillStyle = q.c; g.beginPath(); g.arc(PT.x, PT.y, 1.4, 0, 6.2832); g.fill();
      }
      g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
      if (sa > 0.003) G.draw(g, sa, true);
    }
    function still() { t = 1.3; sa = isOpen() ? 1 : 0; draw(); }
    function tick(dt) {
      if (!on || env.rm || asleep) return;
      if (offscreen(cv, env)) return;
      t += dt;
      var op = isOpen();
      if (op && !was) G.spawnAt = G.t + 0.35;
      was = op;
      // стекло проясняется за 0.6 с (CSS), схема проявляется за то же время
      sa = clamp(sa + (op ? dt : -dt) / 0.6, 0, 1);
      if (sa > 0) G.update(dt, op ? 1.1 : 0); else G.clear();
      draw();
    }
    function resize() {
      if (!fitCanvas(cv, st)) return;
      G.layout(g, st.w, st.h, st.w < 340);
      if (on && env.rm) still();
    }
    var asleep = false;
    function wake() {
      asleep = false;
      if (on) return;
      on = true; fitCanvas(cv, st); seed(); G.layout(g, st.w, st.h, st.w < 340); G.build(true);
      if (frost) frost.classList.add('on');
      if (env.rm) still();
    }
    function sleep() { asleep = true; }
    // тап на тач-экране: первый открывает схему, второй ведёт по ссылке; тап мимо карточки закрывает
    function poke() { if (on && env.rm) setTimeout(still, 30); }
    card.addEventListener('pointerdown', function (e) { touch = e.pointerType && e.pointerType !== 'mouse' ? e.pointerType : ''; });
    card.addEventListener('click', function (e) {
      if (touch && !card.classList.contains('is-open')) { e.preventDefault(); card.classList.add('is-open'); poke(); }
      touch = '';
    });
    document.addEventListener('pointerdown', function (e) { if (card.classList.contains('is-open') && !card.contains(e.target)) { card.classList.remove('is-open'); poke(); } }, { passive: true });
    ['pointerenter', 'pointerleave', 'focusin', 'focusout'].forEach(function (ev) { card.addEventListener(ev, poke); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if (on) { G.layout(g, st.w, st.h, st.w < 340); if (env.rm) still(); } });
    return { cv: cv, tick: tick, resize: resize, wake: wake, sleep: sleep };
  }

  window.PTScenes = {
    create: function (root, env) {
      var out = [];
      function each(sel, fn) { Array.prototype.forEach.call(root.querySelectorAll(sel), function (cv) { var s = fn(cv); if (s) out.push(s); }); }
      each('canvas[data-mini]', function (cv) { return makeMini(cv, env); });
      each('canvas[data-flowlight]', function (cv) { return makeFlowLight(cv, env); });
      each('canvas[data-flow]', function (cv) { var c = FLOWS[cv.getAttribute('data-flow')]; return c ? makeFlow(cv, env, c) : null; });
      return out;
    }
  };
})();
