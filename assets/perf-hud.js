// perf-hud.js — замер плавности на настоящем устройстве. Подключается только по ?hud (дальше держится до конца вкладки),
// ?hud=0 или «×» — выключить. Без флага файл не грузится вовсе.
//
// Что показывает:
//   Гц      — частота экрана (медиана интервала кадров в покое).
//   к/с     — кадров за последнюю секунду.
//   Рывки   — кадры, которые шли дольше 1,5 обычного кадра: число и доля потерянного времени.
//   Задачи  — долгие задачи главного потока (> 50 мс): сколько, самая долгая, сумма сверх 50 мс. В Safari недоступно.
//   1-й экран — через сколько секунд от открытия страницы собрался первый экран (событие pt:secdone).
//   Режим   — уровень облегчения (0 — полный, 1 — без размытия стекла и следа, 2 — частицы в 1×), DPR, прокрутка.
// «Замер 10 с» обнуляет счётчики, через 10 с замораживает итог; «Копировать» — строка итога для чата.
(function () {
  var q = location.search, ss = null;
  try { ss = window.sessionStorage; } catch (e) {}
  if (/[?&]hud=0\b/.test(q)) { try { ss.removeItem('pt-hud'); } catch (e) {} return; }
  if (/[?&]hud\b/.test(q)) { try { ss.setItem('pt-hud', '1'); } catch (e) {} }
  if (!ss || ss.getItem('pt-hud') !== '1' || window.__ptHud) return;
  window.__ptHud = true;

  var t0 = 0; // performance.now() считается от открытия страницы
  var first = null; // секунды до сборки первого экрана
  window.addEventListener('pt:secdone', function () { if (first == null) first = (performance.now() - t0) / 1000; });

  // ---- кадры ----
  var iv = [], last = 0, win = null, hz = 60;
  function onFrame(t) {
    if (last) {
      var d = t - last;
      if (d < 1000) { // вкладка была скрыта — не считаем
        iv.push([t, d]);
        while (iv.length && t - iv[0][0] > 2000) iv.shift();
        if (win && !win.done) { win.n++; win.sum += d; var base = 1000 / hz; if (d > base * 1.5) { win.jank++; win.lost += d - base; } if (d > win.max) win.max = d; }
      }
    }
    last = t;
    requestAnimationFrame(onFrame);
  }
  requestAnimationFrame(onFrame);
  // частота экрана: медиана интервалов, пересчёт раз в 2 с
  setInterval(function () {
    if (iv.length < 20) return;
    var s = iv.map(function (x) { return x[1]; }).sort(function (a, b) { return a - b; });
    var m = s[s.length >> 2]; // нижняя четверть — ближе к настоящему интервалу экрана, рывки её не сдвигают
    var c = [60, 75, 90, 120, 144, 165, 240].reduce(function (b, h) { return Math.abs(1000 / h - m) < Math.abs(1000 / b - m) ? h : b; }, 60);
    hz = c;
  }, 2000);

  // ---- долгие задачи ----
  var lt = { ok: false, n: 0, max: 0, tbt: 0 }, ltW = null;
  try {
    new PerformanceObserver(function (l) {
      l.getEntries().forEach(function (e) {
        lt.n++; lt.max = Math.max(lt.max, e.duration); lt.tbt += Math.max(0, e.duration - 50);
        if (ltW && !win.done) { ltW.n++; ltW.max = Math.max(ltW.max, e.duration); ltW.tbt += Math.max(0, e.duration - 50); }
      });
    }).observe({ type: 'longtask', buffered: true });
    lt.ok = true;
  } catch (e) {}

  // ---- панель ----
  var box = document.createElement('div');
  box.setAttribute('data-pt-skip', '');
  box.setAttribute('aria-hidden', 'true');
  box.style.cssText = 'position:fixed;left:8px;top:8px;z-index:2147483000;width:max-content;max-width:min(440px,calc(100vw - 16px));padding:8px 10px;border-radius:10px;' +
    'background:rgba(0,0,0,.82);color:#d8f3ff;font:12px/1.45 ui-monospace,Menlo,Consolas,monospace;white-space:pre-wrap;overflow-wrap:anywhere;pointer-events:auto;box-shadow:0 4px 18px rgba(0,0,0,.5)';
  var txt = document.createElement('div'), row = document.createElement('div');
  row.style.cssText = 'display:flex;gap:6px;margin-top:6px';
  function btn(label, fn) {
    var b = document.createElement('button'); b.type = 'button'; b.textContent = label;
    b.style.cssText = 'font:12px ui-monospace,Menlo,Consolas,monospace;padding:4px 8px;border-radius:6px;border:1px solid #4a6a7a;background:#12222c;color:#d8f3ff;cursor:pointer';
    b.addEventListener('click', fn); row.appendChild(b); return b;
  }
  var bRun = btn('Замер 10 с', start), bCopy = btn('Копировать', copy);
  btn('×', function () { try { ss.removeItem('pt-hud'); } catch (e) {} box.remove(); });
  box.appendChild(txt); box.appendChild(row);
  (document.body ? Promise.resolve() : new Promise(function (r) { document.addEventListener('DOMContentLoaded', r); })).then(function () { document.body.appendChild(box); });

  function start() {
    win = { n: 0, sum: 0, jank: 0, lost: 0, max: 0, t: performance.now(), done: false };
    ltW = { n: 0, max: 0, tbt: 0 };
    bRun.disabled = true;
    setTimeout(function () { win.done = true; bRun.disabled = false; bRun.textContent = 'Ещё замер'; }, 10000);
  }
  function mode() {
    var root = document.getElementById('pt-site'), lv = '?';
    try { lv = ss.getItem('pt-q') || '0'; } catch (e) {}
    if (root && root.classList.contains('pt-lite') && lv === '0') lv = '1+';
    var P = window.PTPerf || {};
    var touch = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    var sc = touch ? 'тач' : (/[?&]pt-scroll=native\b/.test(q) || (P.scroll && P.scroll() === 'native') || !window.PTScroll ? 'колесо нативное' : 'колесо мягкое');
    return ['ур. ' + lv + ' · DPR ' + (window.devicePixelRatio || 1).toFixed(2) + (P.dpr ? ' (холст ' + P.dpr().toFixed(2) + ')' : ''),
      innerWidth + '×' + innerHeight + ' · ' + sc];
  }
  // строки короткие: на телефоне панель в ширину экрана, текст переносится
  function summary() {
    var m = mode(), L = [location.pathname + ' · ' + hz + ' Гц · ' + m[0], m[1]];
    if (win) {
      var secs = (win.done ? win.sum : performance.now() - win.t) / 1000;
      L.push('Замер ' + (win.done ? '10 с' : secs.toFixed(0) + ' с…') + ': ' + (win.n / Math.max(0.001, win.sum / 1000)).toFixed(0) + ' к/с');
      L.push('  рывков ' + win.jank + ' (' + (100 * win.lost / Math.max(1, win.sum)).toFixed(1) + '% времени), худший кадр ' + win.max.toFixed(0) + ' мс');
      if (lt.ok) L.push('  долгих задач ' + ltW.n + ', макс ' + ltW.max.toFixed(0) + ' мс');
    }
    L.push('С открытия: 1-й экран ' + (first == null ? '—' : first.toFixed(1) + ' с'));
    L.push(lt.ok ? '  долгих задач ' + lt.n + ', макс ' + lt.max.toFixed(0) + ' мс, сверх 50 мс — ' + lt.tbt.toFixed(0) + ' мс' : '  долгие задачи: н/д (Safari)');
    return L.join('\n');
  }
  function copy() {
    var s = summary();
    var done = function () { bCopy.textContent = 'Скопировано'; setTimeout(function () { bCopy.textContent = 'Копировать'; }, 1200); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(s).then(done, function () { prompt('Скопируйте:', s); });
    else prompt('Скопируйте:', s);
  }
  setInterval(function () {
    var now = performance.now(), n = 0;
    for (var i = iv.length - 1; i >= 0 && now - iv[i][0] <= 1000; i--) n++;
    txt.textContent = n + ' к/с сейчас\n' + summary();
  }, 500);
})();
