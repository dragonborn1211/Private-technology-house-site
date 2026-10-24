// perf-hud.js — замер плавности на настоящем устройстве. Подключается только по ?hud (дальше держится до конца вкладки),
// ?hud=0 или «×» — выключить. Без флага файл не грузится вовсе.
//
// Что показывает:
//   Гц      — частота экрана (медиана интервала кадров в покое).
//   к/с     — кадров за последнюю секунду.
//   Рывки   — кадры, которые шли дольше 1,5 обычного кадра: число и доля потерянного времени.
//   Задачи  — долгие задачи главного потока (> 50 мс): сколько, самая долгая, сумма сверх 50 мс. В Safari недоступно.
//   Сборка  — режим вступления (полная / быстрая / сразу) и почему «сразу»: скрипты пришли позже порога.
//   Загрузка — когда пришли HTML, стили, движок; сколько скачано, что из кэша, самый медленный файл.
//   1-й экран — через сколько секунд от открытия страницы собрался первый экран.
//   Режим   — уровень облегчения из движка (PTPerf.q; 0 — полный, 1 — без размытия стекла и следа, 2 — частицы в 1×),
//             «через кадр» (PTPerf.alt: частицы, сцены и объект — в каждом втором кадре), DPR, прокрутка.
// «Замер 10 с» обнуляет счётчики, через 10 с замораживает итог; «Копировать» — итог для чата, с подробностями: долгие кадры
// с источником (Long Animation Frames, Chrome 123+) и тайминги файлов.
(function () {
  var q = location.search, ss = null;
  try { ss = window.sessionStorage; } catch (e) {}
  if (/[?&]hud=0\b/.test(q)) { try { ss.removeItem('pt-hud'); } catch (e) {} return; }
  if (/[?&]hud\b/.test(q)) { try { ss.setItem('pt-hud', '1'); } catch (e) {} }
  if (!ss || ss.getItem('pt-hud') !== '1' || window.__ptHud) return;
  window.__ptHud = true;

  var first = null; // секунды до сборки первого экрана (performance.now() считается от открытия страницы)
  window.addEventListener('pt:secdone', function () { if (first == null) first = performance.now() / 1000; });
  function sec(ms) { return (ms / 1000).toFixed(1) + ' с'; }
  function file(u) { return String(u || '').split('?')[0].split('/').pop() || '/'; }

  // ---- кадры ----
  var iv = [], last = 0, win = null, hz = 60;
  function onFrame(t) {
    if (last) {
      var d = t - last;
      if (d < 1000) { // вкладка была скрыта — не считаем
        iv.push([t, d]);
        while (iv.length && t - iv[0][0] > 2000) iv.shift();
        if (win && !win.done) { win.n++; win.sum += d; var base = 1000 / hz; if (d > base * 1.5) { win.jank++; win.lost += d - base; } if (d > win.max) { win.max = d; win.maxAt = t; } }
      }
    }
    last = t;
    requestAnimationFrame(onFrame);
  }
  requestAnimationFrame(onFrame);
  // частота экрана: нижняя четверть интервалов, пересчёт раз в 2 с
  setInterval(function () {
    if (iv.length < 20) return;
    var s = iv.map(function (x) { return x[1]; }).sort(function (a, b) { return a - b; });
    var m = s[s.length >> 2];
    hz = [60, 75, 90, 100, 120, 144, 165, 240].reduce(function (b, h) { return Math.abs(1000 / h - m) < Math.abs(1000 / b - m) ? h : b; }, 60);
  }, 2000);

  // ---- долгие задачи ----
  var lt = { ok: false, n: 0, max: 0, tbt: 0 }, ltW = null;
  try {
    new PerformanceObserver(function (l) {
      l.getEntries().forEach(function (e) {
        lt.n++; lt.max = Math.max(lt.max, e.duration); lt.tbt += Math.max(0, e.duration - 50);
        if (ltW && win && !win.done) { ltW.n++; ltW.max = Math.max(ltW.max, e.duration); ltW.tbt += Math.max(0, e.duration - 50); }
      });
    }).observe({ type: 'longtask', buffered: true });
    lt.ok = true;
  } catch (e) {}

  // ---- долгие кадры с источником (Long Animation Frames) ----
  // Кадр > 50 мс: сколько занял, сколько из него скрипты (какой файл и функция), сколько стили и раскладка.
  // Если худший кадр замера здесь не виден — время ушло не в главном потоке (видеокарта, сам браузер)
  var loaf = { ok: false, all: [] };
  function loafLine(e) {
    var scr = (e.scripts || []).slice().sort(function (a, b) { return b.duration - a.duration; }).slice(0, 2).map(function (s) {
      // запуск файла целиком — «запуск»; иначе имя функции или тип вызова (таймер, кадр, событие) без адресов
      var fn = s.invokerType === 'classic-script' || s.invokerType === 'module-script' ? 'запуск' : (s.sourceFunctionName || String(s.invoker || '').replace(/https?:\/\/\S+/g, '').trim());
      // из них принудительный пересчёт стилей и раскладки, который вызвал сам скрипт (чтение scrollY, размеров после записи)
      var fl = s.forcedStyleAndLayoutDuration || 0;
      return file(s.sourceURL) + (fn ? ' ' + String(fn).slice(0, 28) : '') + ' ' + s.duration.toFixed(0) + (fl >= 1 ? ' (из них раскладка ' + fl.toFixed(0) + ')' : '');
    });
    var end = e.startTime + e.duration, lay = e.styleAndLayoutStart ? end - e.styleAndLayoutStart : 0, rn = e.renderStart ? end - e.renderStart : 0;
    return Math.round(e.duration) + ' мс в ' + sec(e.startTime) + (scr.length ? ': ' + scr.join(', ') : ': без скриптов') +
      (rn > 5 ? '; отрисовка ' + rn.toFixed(0) + (lay > 5 ? ' (стили+раскладка ' + lay.toFixed(0) + ')' : '') : '');
  }
  try {
    new PerformanceObserver(function (l) {
      l.getEntries().forEach(function (e) { loaf.all.push(e); if (loaf.all.length > 400) loaf.all.shift(); });
    }).observe({ type: 'long-animation-frame', buffered: true });
    loaf.ok = true;
  } catch (e) {}
  function topLoaf(from, to, k) {
    return loaf.all.filter(function (e) { return e.startTime >= from && e.startTime <= to; })
      .sort(function (a, b) { return b.duration - a.duration; }).slice(0, k);
  }

  // ---- загрузка ----
  function load() {
    var nav = performance.getEntriesByType && performance.getEntriesByType('navigation')[0];
    var res = performance.getEntriesByType ? performance.getEntriesByType('resource') : [];
    var P = window.PTPerf || {}, root = document.getElementById('pt-site');
    var css = 0, eng = null, kb = 0, cached = 0, slow = null;
    res.forEach(function (r) {
      var n = file(r.name);
      if (/\.css$/.test(n)) css = Math.max(css, r.responseEnd);
      if (/^engine\.js$/.test(n)) eng = r;
      if (/\.(js|css|woff2)$/.test(n)) {
        if (r.transferSize === 0 && r.decodedBodySize > 0) cached++;
        if (!slow || r.duration > slow.duration) slow = r;
      }
      kb += (r.transferSize || 0) / 1024;
    });
    if (nav) kb += (nav.transferSize || 0) / 1024;
    var md = root ? root.getAttribute('data-intro') : '';
    var MD = { full: 'полная', fast: 'быстрая', instant: 'сразу', rm: 'без движения' }[md] || md || '?';
    var boot = P.boot != null ? P.boot : (eng ? eng.responseEnd : null);
    var why = md === 'instant' ? (P.late || (boot != null && boot > 3800) ? ' — скрипты опоздали' : ' — страница уже открывалась') : (P.late ? ' — по флагу, скрипты опоздали' : '');
    return {
      mode: 'Сборка: ' + MD + why,
      line: 'Загрузка: HTML ' + (nav ? sec(nav.responseStart) : '?') + ', стили ' + (css ? sec(css) : '?') + (P.boot != null ? ', движок запущен ' : ', движок скачан ') + (boot != null ? sec(boot) : '?') +
        (nav && nav.domContentLoadedEventEnd ? ', DOM ' + sec(nav.domContentLoadedEventEnd) : ''),
      net: 'Сеть: ' + kb.toFixed(0) + ' КБ' + (cached ? ', из кэша ' + cached : '') + (slow ? ', дольше всех ' + file(slow.name) + ' ' + slow.duration.toFixed(0) + ' мс' : ''),
      files: res.filter(function (r) { return /\.(js|css|woff2)$/.test(file(r.name)); })
        .sort(function (a, b) { return b.responseEnd - a.responseEnd; }).slice(0, 6)
        .map(function (r) { return '  ' + file(r.name) + ': пришёл ' + sec(r.responseEnd) + ', ' + r.duration.toFixed(0) + ' мс, ' + (r.transferSize === 0 && r.decodedBodySize > 0 ? 'кэш' : ((r.transferSize || 0) / 1024).toFixed(0) + ' КБ'); })
    };
  }

  // ---- панель ----
  var box = document.createElement('div');
  box.setAttribute('data-pt-skip', '');
  box.setAttribute('aria-hidden', 'true');
  box.style.cssText = 'position:fixed;left:8px;top:8px;z-index:2147483000;width:max-content;max-width:min(440px,calc(100vw - 16px));padding:8px 10px;border-radius:10px;' +
    'background:rgba(0,0,0,.82);color:#d8f3ff;font:12px/1.45 ui-monospace,Menlo,Consolas,monospace;white-space:pre-wrap;overflow-wrap:anywhere;pointer-events:auto;box-shadow:0 4px 18px rgba(0,0,0,.5)';
  var txt = document.createElement('div'), row = document.createElement('div');
  row.style.cssText = 'display:flex;gap:6px;margin-top:6px;flex-wrap:wrap';
  function btn(label, fn) {
    var b = document.createElement('button'); b.type = 'button'; b.textContent = label;
    b.style.cssText = 'font:12px ui-monospace,Menlo,Consolas,monospace;padding:4px 8px;border-radius:6px;border:1px solid #4a6a7a;background:#12222c;color:#d8f3ff;cursor:pointer';
    b.addEventListener('click', fn); row.appendChild(b); return b;
  }
  var bRun = btn('Замер 10 с', start), bCopy = btn('Копировать', copy);
  btn('×', function () { try { ss.removeItem('pt-hud'); } catch (e) {} box.remove(); });
  box.appendChild(txt); box.appendChild(row);
  // ?hud=intro — замер 10 с начинается сам, как только панель загрузилась: так в него попадает вступление
  if (/[?&]hud=intro\b/.test(q)) setTimeout(function () { start(); }, 0);
  (document.body ? Promise.resolve() : new Promise(function (r) { document.addEventListener('DOMContentLoaded', r); })).then(function () { document.body.appendChild(box); });

  function start() {
    win = { n: 0, sum: 0, jank: 0, lost: 0, max: 0, maxAt: 0, t: performance.now(), done: false };
    ltW = { n: 0, max: 0, tbt: 0 };
    bRun.disabled = true;
    setTimeout(function () { win.done = true; win.end = performance.now(); bRun.disabled = false; bRun.textContent = 'Ещё замер'; }, 10000);
  }
  function mode() {
    // уровень — из движка (PTPerf.q): sessionStorage не видел ?pt-q; без поля — как раньше
    var root = document.getElementById('pt-site'), lv = '?', P = window.PTPerf || {};
    if (P.q != null) lv = String(P.q);
    else {
      try { lv = ss.getItem('pt-q') || '0'; } catch (e) {}
      if (root && root.classList.contains('pt-lite') && lv === '0') lv = '1+';
    }
    var touch = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    var sc = touch ? 'тач' : (/[?&]pt-scroll=native\b/.test(q) || (P.scroll && P.scroll() === 'native') || !window.PTScroll ? 'колесо нативное' : 'колесо мягкое');
    return ['ур. ' + lv + (P.alt ? ' · через кадр' : '') + ' · DPR ' + (window.devicePixelRatio || 1).toFixed(2) + (P.dpr ? ' (холст ' + P.dpr().toFixed(2) + ')' : ''),
      innerWidth + '×' + innerHeight + ' · ' + sc];
  }
  // строки короткие: на телефоне панель в ширину экрана, текст переносится. full — с подробностями (для «Копировать»)
  // тайминги загрузки почти не меняются — пересчёт раз в 2 с (для «Копировать» — свежие); текст панели — раз в 1 с (TASK-weak-phone, 5)
  var ldC = null, ldT = 0;
  function loadC() { var n = performance.now(); if (!ldC || n - ldT > 2000) { ldC = load(); ldT = n; } return ldC; }
  function summary(full) {
    var u = new URLSearchParams(location.search); u.delete('hud'); var qs = u.toString();
    var m = mode(), ld = full ? load() : loadC(), P = window.PTPerf || {}, L = [location.pathname + (qs ? '?' + qs : '') + ' · ' + hz + ' Гц · ' + m[0], m[1], ld.mode];
    if (win) {
      var secs = (win.done ? win.sum : performance.now() - win.t) / 1000;
      L.push('Замер ' + (win.done ? '10 с' : secs.toFixed(0) + ' с…') + ': ' + (win.n / Math.max(0.001, win.sum / 1000)).toFixed(0) + ' к/с');
      L.push('  рывков ' + win.jank + ' (' + (100 * win.lost / Math.max(1, win.sum)).toFixed(1) + '% времени), худший кадр ' + win.max.toFixed(0) + ' мс');
      if (lt.ok) L.push('  долгих задач ' + ltW.n + ', макс ' + ltW.max.toFixed(0) + ' мс');
      if (full && loaf.ok) {
        var w = topLoaf(win.t, win.end || performance.now(), 3);
        L.push('  долгие кадры замера:' + (w.length ? '' : ' нет'));
        w.forEach(function (e) { L.push('   ' + loafLine(e)); });
        if (win.max > 100 && !loaf.all.some(function (e) { return Math.abs(e.startTime + e.duration - win.maxAt) < 60; })) L.push('   худший кадр — не главный поток (видеокарта или браузер)');
      }
    }
    var f = P.first != null ? P.first / 1000 : first;
    L.push('С открытия: 1-й экран ' + (f == null ? '—' : f.toFixed(1) + ' с'));
    L.push(lt.ok ? '  долгих задач ' + lt.n + ', макс ' + lt.max.toFixed(0) + ' мс, сверх 50 мс — ' + lt.tbt.toFixed(0) + ' мс' : '  долгие задачи: н/д (Safari)');
    L.push(ld.line);
    L.push(ld.net);
    if (full) {
      L.push('  файлы, пришедшие последними:'); L.push.apply(L, ld.files);
      if (loaf.ok) {
        var a = topLoaf(0, 8000, 3);
        L.push('  долгие кадры первых 8 с:' + (a.length ? '' : ' нет'));
        a.forEach(function (e) { L.push('   ' + loafLine(e)); });
      }
      L.push('  ' + navigator.userAgent.replace(/^Mozilla\/5\.0 /, '').slice(0, 120));
    }
    return L.join('\n');
  }
  function copy() {
    var s = summary(true);
    var done = function () { bCopy.textContent = 'Скопировано'; setTimeout(function () { bCopy.textContent = 'Копировать'; }, 1200); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(s).then(done, function () { prompt('Скопируйте:', s); });
    else prompt('Скопируйте:', s);
  }
  setInterval(function () {
    var now = performance.now(), n = 0;
    for (var i = iv.length - 1; i >= 0 && now - iv[i][0] <= 1000; i--) n++;
    txt.textContent = n + ' к/с сейчас\n' + summary(false);
  }, 1000);
})();
