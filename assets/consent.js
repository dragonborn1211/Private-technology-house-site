// Согласие на cookie и Яндекс Метрика (TASK-about-analytics.md, раздел 3). Метрика ставит cookie и собирает данные о
// посетителе, поэтому загружается только после «Принять»; «Отклонить» рядом и того же веса. Выбор — localStorage['pt-consent']
// ('yes' / 'no'); хранилище недоступно — плашка на каждой странице, Метрики без «Принять» нет. Плашка — после сборки первого
// экрана (pt:secdone первого экрана или 4 с, что раньше), не поверх вступления; reduced motion и страница без движка
// (privacy.html) — сразу. «Настройки cookie» в политике ([data-ck-open], без JS скрыта) открывают её снова. Метрика грузится тоже
// после первого экрана и в простое браузера: вебвизор не пишет самую тяжёлую часть анимации, кадры вступления не отнимаются.
// Цели — только при загруженной Метрике: tg (ссылка в Telegram), max (Max), wa (WhatsApp), phone (звонок), filter (кнопка фильтра), replay (↻),
// lang_en (переход на EN). И две сводные (просьба владельца: видеть, сколько нажали на каждую кнопку, какой формат и сколько
// по итогу обращений): cta — любая кнопка и ссылка сайта, lead — любое обращение (Telegram, WhatsApp, MAX, звонок). Их параметры
// — деревом для отчёта «Параметры визитов»: cta — «Нажатия» → формат → кнопка → «блок · страница»; lead — «Обращения» → канал →
// формат → «кнопка · страница». Формат — разово / подписка / после запуска / кейс / общий: по блоку или модулю, где кнопка, а у
// ссылки на другую страницу — по её адресу. В Метрике цели cta и lead заводятся «JavaScript-событием» с этими идентификаторами.
// Подключается последним на всех страницах.
(function () {
  var YM_ID = 113667313;   // номер счётчика; 0 — Метрика выключена, плашки нет
  var KEY = 'pt-consent', de = document.documentElement, I = window.PTI18N, box = null, ymOn = false, ready = false, wait = [];
  var PAGE = (location.pathname.split('/').pop() || 'index.html').replace(/\.html$/, '') || 'index';
  if (!YM_ID) return;
  function get() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function put(v) { try { localStorage.setItem(KEY, v); } catch (e) { /* хранилище запрещено — спросим на следующей странице */ } }

  // «Настройки cookie» (в политике, раздел 6) — без скрипта не нужна, там вместо неё фраза в <noscript>
  Array.prototype.forEach.call(document.querySelectorAll('.foot-ckw, .pv-ck'), function (el) { el.hidden = false; });

  // первый экран собран
  function whenReady(fn) { if (ready) fn(); else wait.push(fn); }
  function fire() { if (ready) return; ready = true; var w = wait; wait = []; w.forEach(function (fn) { fn(); }); }
  var hero = document.querySelector('[data-sec="hero"]');
  var rm = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  if (!hero || rm || hero.classList.contains('s-done')) fire();
  else {
    window.addEventListener('pt:secdone', function (e) { if (e.detail === hero) fire(); });
    setTimeout(fire, 4000);
  }

  // текст плашки — на языке страницы; русский оригинал узла (__ru) i18n.js вернёт при обратном переключении
  function translate(el) {
    if (!I || I.lang !== 'en') return;
    var tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT), n;
    while ((n = tw.nextNode())) {
      var v = n.nodeValue, k = v.replace(/\s+/g, ' ').trim(), t = k && I.t(k);
      if (t && t !== k) { n.__ru = v; n.nodeValue = (/^\s/.test(v) ? ' ' : '') + t + (/\s$/.test(v) ? ' ' : ''); }
    }
  }
  function open() {
    if (box) return;
    var pl = document.querySelector('.foot-req a'), href = pl ? pl.getAttribute('href') : '/privacy';
    box = document.createElement('div');
    box.className = 'ck'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', 'Cookie');
    box.innerHTML = '<p>Сайт использует cookie и Яндекс Метрику, чтобы понимать, какие страницы полезны. Подробнее — в <a href="' + href + '">политике конфиденциальности</a>.</p>' +
      '<div class="ck-b"><button type="button" class="y">Принять</button><button type="button" class="n">Отклонить</button></div>';
    translate(box);
    box.querySelector('.y').addEventListener('click', accept);
    box.querySelector('.n').addEventListener('click', decline);
    document.body.appendChild(box);
    de.classList.add('ck-open');
  }
  function close() {
    if (!box) return;
    var b = box; box = null; de.classList.remove('ck-open');
    b.classList.add('ck-out'); setTimeout(function () { if (b.parentNode) b.parentNode.removeChild(b); }, 300);
  }
  function accept() { put('yes'); close(); whenReady(loadYm); }
  function decline() {
    var was = get() === 'yes' || ymOn;
    put('no'); close();
    // передумал после «Принять»: стереть cookie и хранилище Метрики и начать страницу без неё
    if (was) { clearYm(); location.reload(); }
  }
  function clearYm() {
    var host = location.hostname, root = host.replace(/^www\./, ''), exp = '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
    document.cookie.split(';').forEach(function (c) {
      var n = c.split('=')[0].trim();
      if (!/^_ym/.test(n)) return;
      document.cookie = n + exp; document.cookie = n + exp + '; domain=' + host; document.cookie = n + exp + '; domain=.' + root;
    });
    try { for (var i = localStorage.length - 1; i >= 0; i--) { var k = localStorage.key(i); if (/^_ym/.test(k)) localStorage.removeItem(k); } } catch (e) { /* нет хранилища */ }
  }
  // код счётчика — из настроек Метрики («Код счётчика»), без <noscript>-пикселя: он считал бы без согласия
  function loadYm() {
    if (ymOn) return; ymOn = true;
    var go = function () {
      (function (m, e, t, r, i, k, a) {
        m[i] = m[i] || function () { (m[i].a = m[i].a || []).push(arguments); }; m[i].l = 1 * new Date();
        for (var j = 0; j < document.scripts.length; j++) { if (document.scripts[j].src === r) return; }
        k = e.createElement(t); a = e.getElementsByTagName(t)[0]; k.async = 1; k.src = r; a.parentNode.insertBefore(k, a);
      })(window, document, 'script', 'https://mc.yandex.ru/metrika/tag.js', 'ym');
      window.ym(YM_ID, 'init', { clickmap: true, trackLinks: true, accurateTrackBounce: true, webvisor: true });
    };
    if (window.requestIdleCallback) window.requestIdleCallback(go, { timeout: 3000 }); else setTimeout(go, 200);
  }
  function goal(id, params) { if (ymOn && window.ym) window.ym(YM_ID, 'reachGoal', id, params); }
  // формат услуги — по модулю / блоку (страница услуг, «Как работаем», главная) или по адресу ссылки
  var FMT = { sites: 'разово', apps: 'разово', servers: 'разово', projects: 'разово', 'p-sites': 'разово', 'p-servers': 'разово',
    care: 'подписка', automation: 'подписка', ai: 'подписка', subscription: 'подписка', subs: 'подписка', 'sub-how': 'подписка', 'p-care': 'подписка', 'p-automation': 'подписка', templates: 'подписка',
    after: 'после запуска', objects: 'кейс', cases: 'кейс' };
  function fmtOf(el, href) {
    for (var n = el; n && n !== document.body; n = n.parentElement) {
      var k = n.id && FMT[n.id] ? n.id : n.getAttribute && n.getAttribute('data-sec');
      if (k && FMT[k]) return FMT[k];
    }
    var m = /(?:^|\/)(services|process)(?:\.html)?#([\w-]+)/.exec(href || '') || /^#([\w-]+)/.exec(href || '');
    var id = m ? m[m.length - 1] : '';
    if (FMT[id]) return FMT[id];
    if (/automations(\.html)?([#?]|$)/.test(href || '')) return 'подписка';
    if (/cases(\.html)?([#?]|$)/.test(href || '')) return 'кейс';
    return 'общий';
  }
  function nameOf(el) {
    // карточка-ссылка — по её заголовку (иначе в имя попадали подписи рисунка и описание)
    var h = el.querySelector && el.querySelector('h2, h3, h4, .obj-h, .svc-h');
    var t = el.getAttribute('data-tg') || el.getAttribute('aria-label') || (h ? h.textContent : el.textContent) || '';
    t = t.replace(/\s+/g, ' ').trim();
    return (t.length > 60 ? t.slice(0, 59) + '…' : t) || el.tagName.toLowerCase();
  }
  function track(el, place) {
    var href = el.getAttribute('href') || '', btn = nameOf(el), fmt = fmtOf(el, href), ch = /^tel:/.test(href) ? 'звонок' : /max\.ru/.test(href) ? 'MAX' : /wa\.me/.test(href) ? 'WhatsApp' : /t\.me\//.test(href) ? 'Telegram' : '';
    var p1 = {}, p2 = {}, p3 = {};
    p3[btn] = place + ' · ' + PAGE; p2[fmt] = p3; p1['Нажатия'] = p2;
    goal('cta', p1);
    if (ch) { var q1 = {}, q2 = {}, q3 = {}; q3[fmt] = btn + ' · ' + PAGE; q2[ch] = q3; q1['Обращения'] = q2; goal('lead', q1); }
  }

  document.addEventListener('click', function (e) {
    var t = e.target;
    if (!t || !t.closest) return;
    if (t.closest('[data-ck-open]')) { e.preventDefault(); open(); return; }
    if (!ymOn) return;
    // любая кнопка и ссылка — цель cta, обращение — ещё и lead (track)
    var el = t.closest('a[href], button, summary, [role="button"]');
    if (el) { var s0 = el.closest('[data-sec]'); track(el, s0 ? s0.getAttribute('data-sec') : el.closest('[data-topbar]') ? 'topbar' : el.closest('[data-menu]') ? 'menu' : el.closest('[data-pult]') ? 'пульт' : el.closest('.ck') ? 'cookie' : PAGE); }
    // обращения: Telegram, Max, WhatsApp, звонок; place — секция / липкая шапка / меню
    var a = t.closest('a[href*="t.me/dragonborne0"], a[href*="max.ru/"], a[href*="wa.me/"], a[href^="tel:"]');
    if (a) {
      var sec = a.closest('[data-sec]'), place = sec ? sec.getAttribute('data-sec') : a.closest('[data-topbar]') ? 'topbar' : a.closest('[data-menu]') ? 'menu' : PAGE;
      var href = a.getAttribute('href');
      if (/^tel:/.test(href)) goal('phone', { place: place });
      else if (/max\.ru/.test(href)) goal('max', { place: place });
      else if (/wa\.me/.test(href)) goal('wa', { place: place });
      else goal('tg', { place: place, text: a.getAttribute('data-tg') || a.textContent.replace(/\s+/g, ' ').trim() });
      return;
    }
    var f = t.closest('[data-filter]');
    if (f) { goal('filter', { page: PAGE, value: f.getAttribute('data-filter') || 'all' }); return; }
    if (t.closest('[data-pt-replay]')) goal('replay');
  }, true);
  window.addEventListener('pt:lang', function () { if (window.PTI18N && window.PTI18N.lang === 'en') goal('lang_en'); });

  var c = get();
  if (c === 'yes') whenReady(loadYm);
  else if (c !== 'no') whenReady(open);
})();
