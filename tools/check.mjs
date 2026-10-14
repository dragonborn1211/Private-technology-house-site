// Проверка сайта после правок.
// Запуск:  npm install && npx playwright install chromium && node tools/check.mjs
// Что делает: открывает index.html в Chromium с виртуальными часами (анимации идут детерминированно),
// проходит первый экран по этапам и каждую секцию [data-sec] после её сборки на трёх ширинах,
// собирает ошибки консоли, проверяет запрещённые слова и горизонтальную прокрутку, кладёт скриншоты в tools/shots/.
// Сцены в карточках (canvas[data-mini|data-flow|data-flowlight]): до сборки секции пусты, после — нарисованы,
// вне экрана стоят на паузе.
// Языки: русская версия на трёх ширинах, английская (?lang=en) на двух — в ней не должно остаться кириллицы,
// и у русских строк скрытых <template> должен быть перевод. На 1440 — переключение RU → EN → RU и прерывание
// «Пересобрать блок» кликом.
// Объект первого экрана (assets/hero-objects.js): пять принципов, стрелки, клик по панели, автосмена,
// «Пересобрать блок», reduced motion; скриншоты каждого из пяти объектов на 1440 и 390.
// Шапка и первый экран (ТЗ TASK-header-hero.md): ссылки Telegram и отсутствие href="#", тексты H1 / строки доверия /
// меню, неразрывные пробелы после смены языка, сгиб на 1440×900 и 1280×720, свёрнутый пульт ничего не перекрывает,
// меню на телефоне (Esc, фокус, пункт меню, язык), липкая шапка и активный раздел; скриншоты первого экрана и меню.
// Шлифовка (TASK-hero-polish.md): шапка с первого кадра, H1 в три строки и курсив не рвётся, принцип на экране один
// раз (панель — объект и описание, строка — заголовки), пульт свёрнут при прокрутке сразу после первого экрана и
// плашка по наведению ничего не перекрывает, узкие телефоны 320–430.
// Панель «Кодекс студии» (TASK-codex.md): строки принципов под первым экраном нет, пять вкладок внутри панели; клик по
// вкладке не перескакивает дальше; у принципа свой цвет (data-slot, --acc) и подпись (.usp-n / .usp-t); стрелки; пауза
// под курсором; кольцо [data-ring] перед автосменой почти замкнуто; вкладки — Manrope с табличными цифрами, слова
// прячутся по ширине панели (< 540 px); английская версия; reduced motion — цвет без анимации, автосмены нет;
// панель целиком в первом экране на 1280×720 и 1440×900; скриншот паузы, «пауза» не лежит на кольце.
// Шапка первого экрана снова собирается из частиц. Смена языка гасит всё сразу (текст, рамки, панель, объект, шапку)
// и собирает заново. Вступление: вспышка на весь экран, вертикальная линия на каркасе, горизонтальная на стилях,
// прежний сканер .scan не идёт; кадры d1440-intro-*.png.
// Услуги (TASK-services.md): на главной блок «Услуги» — шесть карточек на якоря services.html, «Все услуги», без старых
// пунктов, «Цены» скрыты, нет ссылки на несуществующую objects.html, canonical. Страница services.html — на трёх
// ширинах RU и двух EN: секции собираются, якоря ведут на существующие id и модули не уходят под липкую шапку,
// <details> открываются кликом и Enter, JSON-LD парсится и вопросы FAQPage = тексты <summary>, смена языка на лету,
// переход по services.html#apps — модуль готов за 3.5 с. Раскладка обеих страниц 320–1920, курсив H2 в одну строку,
// объект первого экрана не задевает вкладки и подпись, ↻ на телефоне только на первом экране.
// Рисунки и переходы (TASK-glyphs-transitions.md): чертежи направлений линиями (вариант A) — шесть на главной, шесть
// мини на странице услуг, без иконок в квадратах; прорисовываются со сборкой секции, после ↻ — заново, вне экрана на
// паузе, при reduced motion — сразу на месте, без импульсов. «Процесс» только на странице услуг. Режимы сборки: полная
// (первый визит / старше 30 дней), быстрая (переход между страницами, моложе 30 дней), сразу (страница уже открывалась
// в этой вкладке, «Назад»), ?intro=…, запрещённое хранилище; нет unload / beforeunload.
import { chromium } from 'playwright';
import { readFileSync, readdirSync, mkdirSync, rmSync, existsSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const file = path.join(root, 'index.html');
const shots = path.join(here, 'shots');
rmSync(shots, { recursive: true, force: true });
mkdirSync(shots, { recursive: true });

let failed = 0;
const fail = (msg) => { failed++; console.log('  ✗ ' + msg); };

// 1. Запрещённые слова (юридическое требование, см. CLAUDE.md) — во всех файлах, которые уходят на сайт.
//    Сам список не хранится в публичном репозитории: tools/forbidden.local.txt, по слову на строку, # — комментарий.
const siteFiles = [...readdirSync(root).filter((f) => /\.html$/i.test(f) || f === 'sitemap.xml' || f === 'robots.txt'), ...readdirSync(path.join(root, 'assets'), { recursive: true })
  .map((f) => 'assets/' + String(f).replace(/\\/g, '/')).filter((f) => /\.(html|css|js|svg|json|txt)$/i.test(f))];
const listFile = path.join(here, 'forbidden.local.txt');
const words = existsSync(listFile) ? readFileSync(listFile, 'utf8').split(/\r?\n/).map((s) => s.trim()).filter((s) => s && !s.startsWith('#')) : [];
if (!words.length) console.log('  ⚠ tools/forbidden.local.txt не найден или пуст — проверка запрещённых слов пропущена (файл у владельца)');
else {
  const re = new RegExp(words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'gi');
  const bad = siteFiles.flatMap((f) => (readFileSync(path.join(root, f), 'utf8').match(re) || []).map((w) => `${f}: ${w.toLowerCase()}`));
  if (bad.length) fail(`запрещённые слова: ${[...new Set(bad)].join(', ')}`);
  else console.log(`  ✓ запрещённых слов нет (${words.length} в списке; ${siteFiles.join(', ')})`);
}

// отпечатки холстов-сцен, попавших под селектор (0 — холст пустой); кладётся в страницу до её скриптов
const SCENES = ':is(canvas[data-mini], canvas[data-flow], canvas[data-flowlight])';
const printsInit = () => {
  window.__scenePrints = (sel, visible) => [...document.querySelectorAll(sel)].filter((cv) => {
    const r = cv.getBoundingClientRect();
    return !visible || (r.bottom > 0 && r.top < window.innerHeight);
  }).map((cv) => {
    const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data;
    let h = 0;
    for (let i = 3; i < d.length; i += 4 * 7) h = (h * 31 + d[i] + d[i - 1] + d[i - 2]) % 1e9;
    return h;
  });
};

// кириллица на странице: текстовые узлы и атрибуты (кроме подписей на другом языке, [lang="ru"]); у <template>
// — русские строки без перевода в словаре assets/i18n.js
const cyrillic = () => {
  const RX = /[А-Яа-яЁё]/, out = [], skip = (el) => el && el.closest('[lang="ru"]');
  const scan = (root, isTpl) => {
    const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = tw.nextNode())) {
      const v = n.nodeValue;
      if (!RX.test(v) || skip(n.parentElement)) continue;
      if (!isTpl || window.PTI18N.t(v) === v) out.push(v.trim().slice(0, 60));
    }
    root.querySelectorAll('[aria-label],[title],[alt]').forEach((el) => ['aria-label', 'title', 'alt'].forEach((a) => {
      const v = el.getAttribute(a);
      if (v && RX.test(v) && !skip(el) && (!isTpl || window.PTI18N.t(v) === v)) out.push(`${a}="${v.slice(0, 50)}"`);
    }));
  };
  scan(document.body, false);
  document.querySelectorAll('template').forEach((t) => scan(t.content, true));
  if (RX.test(document.title)) out.push('<title>');
  return out;
};
// текст секций, который переводится (то, что пишет JS, — data-pt-skip, без .ptx)
const textSnap = () => [...document.querySelectorAll('.sec .ptx')].map((el) => el.textContent.trim()).join('\n');
// текст на экране, который после сборки так и остался невидимым
const hiddenVisible = () => [...document.querySelectorAll('.sec.s-done .ptx')].filter((el) => { const r = el.getBoundingClientRect(); return el.offsetParent && r.bottom > 0 && r.top < innerHeight && getComputedStyle(el).opacity !== '1'; }).length;
const notDoneVisible = () => [...document.querySelectorAll('[data-sec]')].filter((s) => { const r = s.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight && !s.classList.contains('s-done'); }).map((s) => s.getAttribute('data-sec'));

// Снимок всей страницы кусками по 2000 px, склейка на холсте в самой странице: длинную страницу (телефон, ~12 000 px)
// Chromium снимает целиком с повтором — вторая половина снимка повторяет первую.
async function fullShot(page, file) {
  const W = await page.evaluate(() => innerWidth), H = await page.evaluate(() => document.documentElement.scrollHeight), parts = [];
  for (let y = 0; y < H; y += 2000) parts.push((await page.screenshot({ fullPage: true, clip: { x: 0, y, width: W, height: Math.min(2000, H - y) } })).toString('base64'));
  const data = await page.evaluate(async ({ parts, W, H }) => {
    const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d'); let y = 0;
    for (const b of parts) { const im = new Image(); im.src = 'data:image/png;base64,' + b; await im.decode(); g.drawImage(im, 0, y); y += im.height; }
    return c.toDataURL('image/png').split(',')[1];
  }, { parts, W, H });
  writeFileSync(file, Buffer.from(data, 'base64'));
}
// Границы объекта первого экрана по пикселям скриншота панели: текст панели и пыль движка на время замера скрыты.
// top — низ подписей вкладок (.cx-l, без нижнего отступа кнопок), cap — верх заголовка подписи или стрелок (от верха
// панели).
async function objBox(page) {
  const g = await page.evaluate(() => {
    const o = document.querySelector('[data-obj]').getBoundingClientRect(), t = { bottom: Math.max(...[...document.querySelectorAll('.cx-l')].map((l) => l.getBoundingClientRect().bottom)) }, c = document.querySelector('.obj-ct').getBoundingClientRect(), n = document.querySelector('.nav2').getBoundingClientRect();
    document.querySelectorAll('.obj-top, .obj-foot, [data-pt-canvas]').forEach((e) => { e.style.visibility = 'hidden'; });
    return { o: [o.left, o.top, o.width, o.height], top: Math.round(t.bottom - o.top), cap: Math.round(Math.min(c.top, n.top) - o.top) };
  });
  await page.waitForTimeout(40);
  const png = (await page.screenshot({ clip: { x: Math.round(g.o[0]) + 6, y: Math.round(g.o[1]) + 6, width: Math.round(g.o[2]) - 12, height: Math.round(g.o[3]) - 12 } })).toString('base64');
  const b = await page.evaluate(async (b64) => {
    const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const x2 = c.getContext('2d'); x2.drawImage(img, 0, 0);
    const d = x2.getImageData(0, 0, c.width, c.height).data, W = c.width, H = c.height, rows = new Array(H).fill(0);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = (y * W + x) * 4; if (d[i] * 0.3 + d[i + 1] * 0.5 + d[i + 2] * 0.2 > 105) rows[y]++; }
    return [rows.findIndex((v) => v >= 3), H - 1 - [...rows].reverse().findIndex((v) => v >= 3)];
  }, png);
  await page.evaluate(() => document.querySelectorAll('.obj-top, .obj-foot, [data-pt-canvas]').forEach((e) => { e.style.visibility = ''; }));
  return { box: [0, b[0] + 6, 0, b[1] + 6], top: g.top, cap: g.cap };
}
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
// активный принцип «04 / 05» — по data-slot панели (его ставит модуль)
const idx = (page) => page.evaluate(() => '0' + document.querySelector('[data-obj]').dataset.slot + ' / 05');
// --acc панели: в CSS он @property <color>, поэтому getComputedStyle отдаёт rgb()
const accOf = () => getComputedStyle(document.querySelector('[data-obj]')).getPropertyValue('--acc').trim();
for (const [w, h, tag, lang, rm] of [[1440, 900, 'd1440', 'ru'], [1280, 720, 'd1280', 'ru'], [1700, 930, 'd1700', 'ru'], [390, 844, 'm390', 'ru'], [1440, 900, 'd1440-en', 'en'], [390, 844, 'm390-en', 'en'], [1440, 900, 'd1440-rm', 'ru', true]]) {
  console.log(`\n${tag} (${w}×${h}, ${lang}${rm ? ', prefers-reduced-motion' : ''})`);
  const page = await browser.newPage({ viewport: { width: w, height: h }, reducedMotion: rm ? 'reduce' : 'no-preference' });
  const errs = [];
  page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|ERR_/.test(m.text())) errs.push(m.text()); });
  await page.clock.install({ time: new Date('2026-01-01T12:00:00Z') });
  await page.clock.pauseAt(new Date('2026-01-01T12:00:01Z'));
  await page.addInitScript(printsInit);
  await page.goto('file://' + file + (lang === 'en' ? '?lang=en' : ''));
  const run = (ms) => page.clock.runFor(ms);
  const prints = (sel, visible) => page.evaluate(([q, v]) => window.__scenePrints(q, v), [sel, !!visible]);
  const shot = async (name) => { await page.waitForTimeout(400); await page.screenshot({ path: path.join(shots, `${tag}-${name}.png`) }); };
  const step = () => page.evaluate(() => document.querySelector('[data-pt-step]')?.textContent || '');

  if (rm) {
    await run(3000);
    const i0 = await idx(page);
    await run(12000);
    const i1 = await idx(page), nd = await page.evaluate(() => [...document.querySelectorAll('[data-sec]')].filter((s) => !s.classList.contains('s-done')).length);
    await page.click('[data-next]');
    const acc = await page.evaluate(accOf);   // сразу после клика: CSS-переход шёл бы в реальном времени
    await run(300);
    const i2 = await idx(page);
    if (i0 !== '01 / 05' || i1 !== i0) fail(`reduced motion: объект сменился сам (${i0} → ${i1})`);
    else if (i2 !== '02 / 05') fail(`reduced motion: стрелка не переключила объект (${i2})`);
    else if (acc !== 'rgb(127, 168, 255)') fail(`reduced motion: цвет панели меняется с анимацией (--acc сразу после клика ${acc})`);
    else if (nd) fail(`reduced motion: не собраны ${nd} секций`);
    else console.log('  ✓ reduced motion: всё на месте сразу, автосмены нет, стрелки работают, цвет панели без анимации');
    await shot('hero');
    if (errs.length) { errs.forEach((e) => fail(e)); } else console.log('  ✓ ошибок в консоли нет');
    await page.close();
    continue;
  }
  // первый экран по этапам
  let t = 0;
  for (const m of [0.4, 1.8, 2.9, 4.2, 7.0]) { await run(Math.round((m - t) * 1000)); t = m; await shot('hero-' + m.toFixed(1)); }
  if (!/ready/.test(await step())) fail('первый экран не дошёл до «ready»');
  if (tag === 'd1440' || tag === 'd1280' || tag === 'm390') {
    await run(2500);   // пульт сворачивается через 2 с после сборки
    const fx = await page.evaluate(() => {
      const R = (el) => el.getBoundingClientRect(), p = document.querySelector('[data-pult]'), pr = R(p), hidden = getComputedStyle(p).visibility === 'hidden';
      const hit = [...document.querySelectorAll('[data-sec="hero"] [data-obj], [data-sec="hero"] .hero-act .btn, [data-sec="hero"] .hero-act .lnk, [data-sec="hero"] .trust')]
        .filter((el) => { const r = R(el); return r.right > pr.left && r.left < pr.right && r.bottom > pr.top && r.top < pr.bottom; }).length;
      const o = R(document.querySelector('[data-obj]'));
      return { row: !!document.querySelector('.usp'), obj: [Math.round(o.top), Math.round(o.bottom)], mini: p.classList.contains('is-mini'), hit: hidden ? 0 : hit };
    });
    if (fx.row) fail('под первым экраном осталась строка принципов .usp');
    else if (w > 760 && (fx.obj[0] < 0 || fx.obj[1] > h)) fail(`сгиб: панель «Кодекс студии» ${fx.obj[0]}..${fx.obj[1]}px при окне ${h}px`);
    else if (!fx.mini) fail('пульт не свернулся после сборки');
    else if (fx.hit) fail(`свёрнутый пульт перекрывает первый экран (${fx.hit} эл.)`);
    else console.log(`  ✓ первый экран: ${w > 760 ? `панель целиком в первом экране (${fx.obj[0]}..${fx.obj[1]} из ${h}), ` : ''}пульт свёрнут и не перекрывает контент`);
    await shot('first-screen');
  }
  if (tag === 'd1440') {
    const lx = await page.evaluate(() => {
      const nb = (t) => t.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
      const as = [...document.querySelectorAll('[data-sec="hero"] a, [data-topbar] a, [data-menu] a, [data-sec="contact"] a')];
      const tg = [...document.querySelectorAll('#pt-site a[href*="t.me"]')];
      return { hash: as.filter((a) => a.getAttribute('href') === '#').length, tg: tg.length,
        tgBad: tg.filter((a) => a.getAttribute('href') !== 'https://t.me/dragonborne0' || a.target !== '_blank' || !/noopener/.test(a.rel)).length,
        h1: nb(document.querySelector('h1').textContent), trust: document.querySelectorAll('.trust .trust-i').length,
        nav: [...document.querySelectorAll('[data-sec="hero"] .nav a')].map((a) => nb(a.textContent)).join(','), nbsp: /\u00a0/.test(document.querySelector('h1').textContent),
        name: document.querySelector('[data-captitle]').textContent, aria: document.querySelector('[data-obj]').getAttribute('aria-label') };
    });
    const bad = [];
    if (lx.hash) bad.push(`href="#": ${lx.hash}`);
    if (lx.tg < 4 || lx.tgBad) bad.push(`Telegram: ссылок ${lx.tg}, неверных ${lx.tgBad}`);
    if (!/Сайты, интеграции ?и автоматизация/.test(lx.h1)) bad.push(`H1 «${lx.h1}»`);
    if (!lx.nbsp) bad.push('в H1 нет неразрывных пробелов');
    if (lx.trust !== 3) bad.push(`строка доверия: пунктов ${lx.trust}`);
    if (lx.nav !== 'Услуги,Работы,Процесс') bad.push(`меню: ${lx.nav}`);
    if (lx.name !== 'Холодный расчёт' || lx.aria !== 'Хрустальный ферзь') bad.push(`подпись панели «${lx.name}», aria-label «${lx.aria}»`);
    if (bad.length) fail('шапка и первый экран: ' + bad.join('; '));
    else console.log('  ✓ ссылки и тексты: Telegram → t.me/dragonborne0, нет href="#", H1, строка доверия, меню, подпись панели');
  }
  // объект первого экрана: каждый из пяти — скриншот (клик по вкладке); на телефоне панель целиком в кадре (низ
  // панели у низа окна — следующая секция ещё не видна и не начинает собираться)
  if (tag === 'd1440' || tag === 'm390') {
    if (w <= 760) { await page.evaluate(() => { const r = document.querySelector('[data-obj]').getBoundingClientRect(); window.scrollTo({ top: Math.max(0, r.bottom + scrollY - innerHeight + 8), behavior: 'instant' }); }); await page.waitForTimeout(100); }
    for (let k = 0; k < 5; k++) { await page.evaluate((n) => document.querySelector(`[data-usp="${n}"]`).click(), k); await run(k === 4 ? 8200 : 4000); await shot(`hero-obj${k + 1}`); }
    await page.evaluate(() => document.querySelector('[data-usp="0"]').click()); await run(500);
    if (w <= 760) { await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' })); await page.waitForTimeout(100); await run(300); }
  }
  if (tag === 'd1440') {
    // панель «Кодекс студии»: пять вкладок внутри панели, шрифт вкладок, слова видны (панель шире 540 px)
    const hx = await page.evaluate(() => {
      const o = document.querySelector('[data-obj]').getBoundingClientRect(), tabs = [...document.querySelectorAll('[data-usp]')];
      return { dots: document.querySelectorAll('[data-objdot]').length, gl: !!document.querySelector('[data-sec="hero"] canvas[data-gl]'), usp: tabs.length,
        out: tabs.filter((t) => { const r = t.getBoundingClientRect(); return r.left < o.left || r.right > o.right || r.top < o.top || r.bottom > o.bottom; }).length,
        font: getComputedStyle(document.querySelector('.cx-l')).fontFamily, num: getComputedStyle(document.querySelector('.cx-n')).fontVariantNumeric,
        words: [...document.querySelectorAll('.cx-w')].filter((x) => getComputedStyle(x).display !== 'none').length, wide: o.width >= 540,
        clip: [...document.querySelectorAll('.cx-l')].filter((l) => l.scrollWidth > l.clientWidth + 1).length };
    });
    const state = () => page.evaluate(() => {
      const o = document.querySelector('[data-obj]'), a = document.querySelector('[data-usp][aria-current="step"]');
      return { slot: o.dataset.slot, acc: getComputedStyle(o).getPropertyValue('--acc').trim(), tab: a ? a.dataset.usp : '-', title: document.querySelector('[data-captitle]').textContent,
        capOk: !!a && document.querySelector('[data-captitle]').textContent === a.querySelector('.usp-n').textContent && document.querySelector('[data-objcap]').textContent === a.querySelector('.usp-t').textContent,
        paused: o.classList.contains('is-paused'), ring: parseFloat(getComputedStyle(document.querySelector('[data-ring]')).strokeDashoffset) };
    });
    // CSS-переход цвета (0.9 с) идёт в реальном времени, таймеры модуля — по виртуальным часам
    const settle = async (ms) => { await run(ms); await page.waitForTimeout(1000); await run(50); };
    const bad = [], res = [];
    const want = (st, slot, acc, where) => { if (st.slot !== String(slot) || st.tab !== String(slot - 1) || st.acc !== acc || !st.capOk) bad.push(`${where}: ${JSON.stringify(st)}`); };
    // клик по вкладке 04: активна она, «Безопасность», мята; через 1 с всё ещё 04 — клик не всплывает до панели
    await page.click('[data-usp="3"]'); await settle(1000);
    let st = await state(); want(st, 4, 'rgb(159, 229, 209)', 'клик по вкладке 04');
    if (st.title !== 'Безопасность') bad.push(`подпись после клика по 04: «${st.title}»`);
    res.push(await idx(page));
    await page.click('[data-next]'); await settle(400); want(await state(), 5, 'rgb(201, 194, 245)', 'стрелка →'); res.push(await idx(page));
    await page.click('[data-prev]'); await settle(400); want(await state(), 4, 'rgb(159, 229, 209)', 'стрелка ←'); res.push(await idx(page));
    // курсор над панелью (он на стрелке): пауза, автосмены нет; ушёл — автосмена идёт
    await run(12000); st = await state(); res.push(await idx(page));
    if (!st.paused) bad.push('курсор над панелью, а класса is-paused нет');
    await page.waitForTimeout(400); await page.screenshot({ path: path.join(shots, 'd1440-codex-pause.png') });
    const ps = await page.evaluate(() => { const a = document.querySelector('.ps').getBoundingClientRect(), b = document.querySelector('[data-next]').getBoundingClientRect(); return { op: getComputedStyle(document.querySelector('.ps')).opacity, gap: Math.round(b.top - a.bottom) }; });
    if (ps.op !== '1' || ps.gap < 4) bad.push(`«пауза»: прозрачность ${ps.op}, зазор до кнопки ${ps.gap}px`);
    await page.mouse.move(5, 5); await run(400);
    if ((await state()).paused) bad.push('курсор ушёл, а is-paused остался');
    await run(9600); res.push(await idx(page));
    // клик по панели — следующий
    const pb = await page.evaluate(() => { const r = document.querySelector('[data-obj]').getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; });
    await page.mouse.click(pb[0], pb[1]); await run(300); res.push(await idx(page));
    // без курсора через ~8.5 с вкладка 01 сменяется на 02; перед сменой кольцо почти замкнуто
    await page.mouse.move(5, 5); await run(8100); st = await state(); res.push(await idx(page));
    if (!(st.ring >= 0 && st.ring < 169.65 * 0.12)) bad.push(`кольцо перед автосменой: stroke-dashoffset ${st.ring} из 169.65`);
    await run(900); res.push(await idx(page));
    const order = ['04 / 05', '05 / 05', '04 / 05', '04 / 05', '05 / 05', '01 / 05', '01 / 05', '02 / 05'];
    if (hx.dots || !hx.gl || hx.usp !== 5 || hx.out) bad.push(`точек ${hx.dots}, canvas[data-gl] ${hx.gl}, вкладок ${hx.usp}, вне панели ${hx.out}`);
    if (!/Manrope/.test(hx.font) || !/tabular-nums/.test(hx.num)) bad.push(`шрифт вкладок «${hx.font}», цифры «${hx.num}»`);
    if (!hx.wide || hx.words !== 5 || hx.clip) bad.push(`на 1440 слова вкладок: видно ${hx.words}, обрезано ${hx.clip}`);
    if (res.join() !== order.join()) bad.push(`порядок: ${res.join(' · ')} (ждали ${order.join(' · ')})`);
    if (bad.length) fail('панель «Кодекс студии»: ' + bad.join('; '));
    else console.log('  ✓ панель «Кодекс студии»: вкладки в панели, клик по вкладке не перескакивает, цвет и подпись принципа, стрелки, пауза, кольцо, клик по панели, автосмена');
  }

  // каждая секция после сборки
  const secs = await page.evaluate(() => [...document.querySelectorAll('[data-sec]')].map((s) => s.getAttribute('data-sec')));
  for (const name of secs.slice(1)) {
    await page.evaluate((n) => { const el = document.querySelector(`[data-sec="${n}"]`); window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 40, behavior: 'instant' }); }, name);
    await page.waitForTimeout(300);
    const sel = `[data-sec="${name}"] ${SCENES}`;
    await run(300); await shot(name + '-building');
    const building = await page.evaluate((n) => !document.querySelector(`[data-sec="${n}"]`).classList.contains('s-done'), name);
    const early = building ? (await prints(sel)).filter(Boolean).length : 0;
    if (early) fail(`${name}: ${early} сцен(ы) рисуют до сборки секции`);
    await run(4500); await shot(name + '-done');
    const drawn = await prints(sel, true);
    if (drawn.some((p) => !p)) fail(`${name}: ${drawn.filter((p) => !p).length} из ${drawn.length} видимых сцен пусты после сборки`);
  }
  // сцены вне экрана стоят на паузе
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.waitForTimeout(200); await run(500);
  const p0 = await prints(SCENES);
  await run(2000);
  const p1 = await prints(SCENES);
  const moving = p0.filter((p, i) => p !== p1[i]).length;
  if (moving) fail(`${moving} сцен(ы) анимируются вне экрана`);
  else console.log(`  ✓ сцены (${p0.length}) стартуют после сборки и стоят на паузе вне экрана`);
  if (tag === 'd1440') {
    // липкая шапка: в первом экране скрыта; ниже — видна при прокрутке вверх, прячется при прокрутке вниз
    const bar = () => page.evaluate(() => { const b = document.querySelector('[data-topbar]'); return { on: b.classList.contains('on') && getComputedStyle(b).visibility !== 'hidden', cur: [...b.querySelectorAll('[data-nav][aria-current="true"]')].map((a) => a.getAttribute('data-nav')).join(',') }; });
    const go = async (y) => { await page.evaluate((v) => window.scrollTo({ top: v, behavior: 'instant' }), y); await page.waitForTimeout(80); await run(150); await page.waitForTimeout(120); await run(50); };
    await go(0); const b0 = await bar();
    const py = await page.evaluate(() => document.querySelector('#automation').getBoundingClientRect().top + window.scrollY);
    await go(py + 300); const b1 = await bar();
    await go(py + 100); const b2 = await bar();
    await go(py + 400); const b3 = await bar();
    if (b0.on || b1.on || !b2.on || b3.on) fail(`липкая шапка: в первом экране ${b0.on}, вниз ${b1.on}, вверх ${b2.on}, снова вниз ${b3.on}`);
    else if (b2.cur !== 'objects') fail(`липкая шапка: активный пункт «${b2.cur}», ждали objects`);
    else console.log('  ✓ липкая шапка: скрыта в первом экране, вверх — видна (активен «Работы»), вниз — прячется');
  }
  if (tag === 'm390') {
    // меню на телефоне: Telegram и кнопка меню в шапке, Esc, фокус, пункт меню, язык
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' })); await page.waitForTimeout(100); await run(300);
    const st = () => page.evaluate(() => ({ on: document.querySelector('[data-menu]').classList.contains('on'), lock: document.documentElement.classList.contains('pt-lock'), inMenu: document.querySelector('[data-menu]').contains(document.activeElement), lang: document.documentElement.lang }));
    const hb = await page.evaluate(() => { const v = (sel) => { const el = document.querySelector(sel), r = el && el.getBoundingClientRect(); return !!r && r.width > 0 && r.bottom > 0 && r.top < innerHeight; }; return v('[data-sec="hero"] header a[href*="t.me"]') && v('[data-sec="hero"] [data-menu-open]'); });
    const opener = '[data-sec="hero"] [data-menu-open]';
    await page.click(opener); await run(400); await page.waitForTimeout(100);
    const m1 = await st(), exp = await page.getAttribute(opener, 'aria-expanded');
    // под открытым меню страница скрыта: иначе сквозь стекло просвечивала кнопка первого экрана (светлое пятно у RU/EN)
    await page.waitForTimeout(300);
    const under = await page.evaluate(() => getComputedStyle(document.querySelector('[data-sec="hero"]')).visibility);
    await shot('menu');
    await page.keyboard.press('Escape'); await run(400);
    const m2 = await st(), back = await page.evaluate((sel) => document.activeElement === document.querySelector(sel), opener);
    await page.click(opener); await run(400);
    await page.click('[data-menu] .menu-nav a[href="#objects"]'); await run(2600); await page.waitForTimeout(150); await run(100);
    const m3 = await st(), ptop = await page.evaluate(() => Math.round(document.querySelector('#objects').getBoundingClientRect().top));
    await page.click('[data-topbar] [data-menu-open]'); await run(400);
    await page.click('[data-menu] [data-lang="en"]'); await run(4200);
    const m4 = await st();
    await page.keyboard.press('Escape'); await run(400);
    await page.evaluate(() => document.querySelector('[data-menu] [data-lang="ru"]').click()); await run(4200);
    const bad = [];
    if (!hb) bad.push('в шапке не видно Telegram или кнопки меню');
    if (!m1.on || !m1.lock || !m1.inMenu || exp !== 'true') bad.push(`открытие: ${JSON.stringify(m1)}, aria-expanded ${exp}`);
    if (under !== 'hidden') bad.push('под открытым меню видна страница (светлое пятно)');
    if (m2.on || m2.lock || !back) bad.push(`Esc: меню ${m2.on ? 'открыто' : 'закрыто'}, фокус на кнопке ${back}`);
    if (m3.on || Math.abs(ptop) > 8) bad.push(`пункт меню: меню ${m3.on ? 'открыто' : 'закрыто'}, «Работы» на ${ptop}px`);
    if (m4.lang !== 'en') bad.push(`RU/EN в меню: lang=${m4.lang}`);
    if (bad.length) fail('меню на телефоне: ' + bad.join('; '));
    else console.log('  ✓ меню на телефоне: открывается, Esc закрывает и возвращает фокус, пункт ведёт к секции, RU/EN переключает язык');
  }
  // догоняем всё, что ещё в очереди
  await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
  await run(8000);
  const notDone = await page.evaluate(() => [...document.querySelectorAll('[data-sec]')].filter((s) => !s.classList.contains('s-done')).map((s) => s.getAttribute('data-sec')));
  if (notDone.length) fail('не собрались секции: ' + notDone.join(', '));
  const hidden = await page.evaluate(() => [...document.querySelectorAll('.sec.s-done .ptx')].filter((el) => el.offsetParent && getComputedStyle(el).opacity === '0').length);
  if (hidden) fail(`${hidden} текстовых элементов остались невидимыми после сборки`);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  if (overflow > 1) fail(`горизонтальная прокрутка: ${overflow}px`);
  if (lang === 'en') {
    const left = await page.evaluate(cyrillic);
    if (left.length) fail(`кириллица в английской версии: ${left.join(' | ')}`);
    else console.log('  ✓ английская версия: кириллицы нет, у скрытых блоков есть переводы');
    const h1e = await page.evaluate(() => document.querySelector('h1').textContent.replace(/\s+/g, ' '));
    if (!/Websites, integrations ?and automation/.test(h1e)) fail(`английский H1: «${h1e}»`);
    const cx = await page.evaluate(() => [document.querySelector('.obj-k').textContent.trim(), [...document.querySelectorAll('.cx-w')].map((x) => x.textContent).join(','), document.querySelector('[data-captitle]').textContent]);
    if (cx[0] !== 'The studio code' || cx[1] !== 'Logic,Precision,Speed,Security,Design' || !/^[A-Z][a-z]+( [a-z]+)*$/.test(cx[2])) fail(`английская панель: ${cx.join(' | ')}`);
    if ((await page.evaluate(() => document.documentElement.lang)) !== 'en') fail('<html lang> не en');
  }
  if (tag === 'd1440') {
    // смена языка на первом экране: RU → EN → RU
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.waitForTimeout(200); await run(800);
    const ru0 = await page.evaluate(textSnap);
    await page.click('[data-lang="en"]');
    await run(1500); await shot('lang-en-morph');
    // посреди смены гаснет всё сразу, а не только текст: шапка, рамка панели, подпись, объект
    await page.waitForTimeout(300);
    const mid = await page.evaluate(() => { const h = document.querySelector('[data-sec="hero"]'), o = document.querySelector('[data-obj]'), op = (q) => getComputedStyle(document.querySelector(q)).opacity;
      return { done: h.classList.contains('s-done'), border: getComputedStyle(o).borderTopColor, gl: op('[data-sec="hero"] canvas[data-gl]'), cap: op('.obj-cap'), hdr: op('.hero-hdr .nav a'), lang: getComputedStyle(document.querySelector('.hero-hdr .lang')).borderTopColor }; });
    if (mid.done || mid.border !== 'rgba(0, 0, 0, 0)' || mid.gl !== '0' || mid.cap !== '0' || mid.hdr !== '0' || mid.lang !== 'rgba(0, 0, 0, 0)') fail(`посреди смены языка погасло не всё: ${JSON.stringify(mid)}`);
    else console.log('  ✓ посреди смены языка погасло всё: текст, шапка, рамки, подпись и объект панели');
    await run(2500); await shot('lang-en');
    const en = await page.evaluate(() => ({ lang: document.documentElement.lang, url: location.search, swap: document.querySelectorAll('.s-swap').length }));
    const nd = await page.evaluate(notDoneVisible), left = await page.evaluate(cyrillic), hid = await page.evaluate(hiddenVisible);
    let ok = true;
    if (en.lang !== 'en' || en.url !== '?lang=en') { ok = false; fail(`после переключения на EN: lang=${en.lang}, адрес ${en.url}`); }
    if (en.swap || nd.length) { ok = false; fail(`после переключения на EN секции не собраны: s-swap ${en.swap}, не собраны ${nd.join(', ')}`); }
    if (left.length) { ok = false; fail(`после переключения на EN осталась кириллица: ${left.join(' | ')}`); }
    const on = await page.evaluate(() => [document.querySelector('[data-obj]').getAttribute('aria-label'), document.querySelector('.obj-k').textContent.trim(), [...document.querySelectorAll('.cx-w')].map((x) => x.textContent).join(',')]);
    if (!/^[A-Z][a-z]+( [a-z]+)*$/.test(on[0]) || on[1] !== 'The studio code' || on[2] !== 'Logic,Precision,Speed,Security,Design') { ok = false; fail(`после переключения на EN панель: ${on.join(' | ')}`); }
    await run(400);
    const capEn = await page.evaluate(() => { const a = document.querySelector('[data-usp][aria-current="step"]'); return [document.querySelector('[data-captitle]').textContent + ' / ' + document.querySelector('[data-objcap]').textContent, a.querySelector('.usp-n').textContent + ' / ' + a.querySelector('.usp-t').textContent]; });
    if (capEn[0] !== capEn[1] || /[А-Яа-яЁё]/.test(capEn[0])) { ok = false; fail(`после переключения на EN подпись в панели: «${capEn[0].slice(0, 50)}»`); }
    const h1en = await page.evaluate(() => document.querySelector('h1').textContent.replace(/\s+/g, ' '));
    if (!/Websites, integrations ?and automation/.test(h1en)) { ok = false; fail(`после переключения на EN H1: «${h1en}»`); }
    if (hid) { ok = false; fail(`после переключения на EN ${hid} текстовых элементов на экране невидимы`); }
    await page.waitForTimeout(1000);
    const back = await page.evaluate(() => ({ gl: getComputedStyle(document.querySelector('[data-sec="hero"] canvas[data-gl]')).opacity, border: getComputedStyle(document.querySelector('[data-obj]')).borderTopColor }));
    if (back.gl !== '1' || back.border === 'rgba(0, 0, 0, 0)') { ok = false; fail(`после переключения на EN панель не вернулась: ${JSON.stringify(back)}`); }
    await page.click('[data-lang="ru"]');
    await run(4000);
    const ru1 = await page.evaluate(textSnap);
    if (ru1 !== ru0) { ok = false; fail('после возврата на RU текст не совпал с исходным'); }
    if (!(await page.evaluate(() => /\u00a0/.test(document.querySelector('h1').textContent)))) { ok = false; fail('после возврата на RU пропали неразрывные пробелы'); }
    if ((await page.evaluate(() => document.documentElement.lang + location.search)) !== 'ru') { ok = false; fail('после возврата на RU: lang или адрес не сброшены'); }
    if (ok) console.log('  ✓ смена языка RU → EN → RU: текст, адрес и lang на месте');
    // «Пересобрать блок» на первом экране: всё собирается заново, объект на месте
    await page.locator('[data-pt-replay]:visible').first().click();
    await run(8000);
    const nd1 = await page.evaluate(notDoneVisible), hid1 = await page.evaluate(hiddenVisible), cv = await page.evaluate(() => getComputedStyle(document.querySelector('[data-sec="hero"] canvas[data-gl]')).opacity);
    if (nd1.length || hid1 || cv !== '1') fail(`«Пересобрать блок» на первом экране: не собраны ${nd1.join(', ') || '—'}, невидимых текстов ${hid1}, холст объекта opacity ${cv}`);
    else console.log('  ✓ «Пересобрать блок» на первом экране: секции и объект собраны заново');
    // курсор так и остался над кнопкой ↻: после пересборки пульт сворачивается и не прячется (раньше прятался —
    // защита от наложения мерила развёрнутую наведением плашку)
    await run(3000); await page.waitForTimeout(100);
    const pu = await page.evaluate(() => { const p = document.querySelector('[data-pult]'); return { mini: p.classList.contains('is-mini'), vis: getComputedStyle(p).visibility }; });
    if (!pu.mini || pu.vis !== 'visible') fail(`пульт после пересборки (курсор над ним): свёрнут ${pu.mini}, visibility ${pu.vis}`);
    else console.log('  ✓ после пересборки пульт свернулся и виден, хотя курсор над ним');
    // ↻ во время идущей сборки: она доводится, и пересборка всё равно запускается (раньше нажатие пропадало);
    // на пересборке над свёрнутой кнопкой открыта плашка с логом (.is-open)
    await page.mouse.move(700, 400);
    await page.locator('[data-pt-replay]:visible').first().click(); await run(600);
    await page.locator('[data-pt-replay]:visible').first().click(); await run(300);
    const rr = await page.evaluate(() => ({ open: document.querySelector('[data-pult]').classList.contains('is-open'), step: document.querySelector('[data-pt-step]').textContent }));
    await page.mouse.move(700, 400); await run(9000);
    const nd3 = await page.evaluate(notDoneVisible), hid3 = await page.evaluate(hiddenVisible);
    if (!rr.open || !/dissolve|text\.|layout|grid|styles|type|boot|hero|_/.test(rr.step)) fail(`↻ во время сборки не запустил пересборку: ${JSON.stringify(rr)}`);
    else if (nd3.length || hid3) fail(`↻ во время сборки: не собраны ${nd3.join(', ') || '—'}, невидимых текстов ${hid3}`);
    else console.log('  ✓ ↻ во время идущей сборки доводит её и запускает пересборку');
    // «Пересобрать блок», прерванный кликом до постановки в очередь (между 1.0 и 1.7 с): секции не гаснут насовсем
    await page.locator('[data-pt-replay]:visible').first().click();
    await run(1250);
    await page.mouse.click(5, 300);
    await run(3000);
    const nd2 = await page.evaluate(notDoneVisible), hid2 = await page.evaluate(hiddenVisible);
    if (nd2.length) fail(`«Пересобрать блок», прерванный кликом: не собраны ${nd2.join(', ')}`);
    else if (hid2) fail(`«Пересобрать блок», прерванный кликом: ${hid2} текстовых элементов невидимы`);
    else console.log('  ✓ «Пересобрать блок», прерванный кликом, ничего не оставляет пустым');
  }
  if (errs.length) { errs.forEach((e) => fail(e)); } else console.log('  ✓ ошибок в консоли нет');
  await page.close();
}
// Главная: блок «Услуги» (шесть карточек на якоря services.html, «Все услуги»), без старых пунктов; «Цены» скрыты
// (секция в <template>, пункта меню нет); нет ссылки на несуществующую objects.html; canonical.
console.log('\nглавная: блок «Услуги», скрытые «Цены», ссылки');
{
  const sHtml = readFileSync(path.join(root, 'services.html'), 'utf8'), ids = new Set([...sHtml.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('file://' + file); await page.waitForTimeout(200);
  const r = await page.evaluate(() => {
    const d = document.querySelector('#directions'), all = (q) => [...document.querySelectorAll(q)];
    return { cards: [...d.querySelectorAll('a.svc')].map((a) => a.getAttribute('href')), more: [...d.querySelectorAll('.more a')].map((a) => a.getAttribute('href')),
      h2: d.querySelector('h2').textContent.replace(/\s+/g, ' ').trim(), nums: [...d.querySelectorAll('.mono')].filter((m) => /^0[1-4]$/.test(m.textContent.trim())).length,
      old: ['Лендинги и сайты-визитки', '1С-Битрикс'].filter((t) => document.body.innerText.includes(t)),
      pricing: !!document.querySelector('[data-sec="pricing"]'), tpl: !!(document.querySelector('template[data-hidden-section="pricing"]') || { content: document.createDocumentFragment() }).content.querySelector('[data-sec="pricing"]'),
      pricingLinks: all('a[href="#pricing"]').length, dead: all('a[href$="objects.html"]').length, canonical: (document.querySelector('link[rel="canonical"]') || {}).href || '',
      glyphs: d.querySelectorAll('a.svc .glyph').length, icons: all('.svc-ic').length, process: !!document.querySelector('[data-sec="process"]'),
      procLinks: all('a').filter((a) => a.textContent.trim() === 'Процесс').map((a) => a.getAttribute('href')), contact: document.querySelector('#contact .mono.k').textContent.trim() };
  });
  const bad = [];
  if (r.cards.length !== 6 || r.cards.some((h) => !/^services\.html#/.test(h) || !ids.has(h.split('#')[1]))) bad.push(`карточки: ${r.cards.join(', ')}`);
  if (r.more.join() !== 'services.html') bad.push(`«Все услуги» → ${r.more.join()}`);
  if (r.h2 !== 'Делаем один раз. Держим всегда.') bad.push(`заголовок «${r.h2}»`);
  if (r.nums) bad.push(`номера 01–04 в блоке: ${r.nums}`);
  if (r.old.length) bad.push(`старые пункты: ${r.old.join(', ')}`);
  if (r.pricing || !r.tpl || r.pricingLinks) bad.push(`«Цены»: секция на странице ${r.pricing}, в <template> ${r.tpl}, ссылок #pricing ${r.pricingLinks}`);
  if (r.dead) bad.push(`ссылок на objects.html: ${r.dead}`);
  if (r.canonical !== 'https://privatechouse.ru/') bad.push(`canonical «${r.canonical}»`);
  if (r.glyphs !== 6 || r.icons) bad.push(`рисунков в карточках ${r.glyphs}, иконок в квадратах ${r.icons}`);
  if (r.process || r.procLinks.length !== 3 || r.procLinks.some((h) => h !== 'services.html#process') || r.contact !== '03 / Контакт') bad.push(`«Процесс»: секция ${r.process}, ссылки ${r.procLinks.join(', ')}, контакт «${r.contact}»`);
  const sv = readFileSync(path.join(root, 'services.html'), 'utf8');
  if ((sv.match(/class="glyph glyph-mini"/g) || []).length !== 6 || /svc-ic/.test(sv) || (sv.match(/<a href="#process"[^>]*>Процесс<\/a>/g) || []).length !== 3) bad.push('страница услуг: шесть мини-рисунков, нет иконок, «Процесс» → #process');
  for (const f of readdirSync(path.join(root, 'assets')).filter((x) => x.endsWith('.js'))) if (/addEventListener\(\s*['"](before)?unload['"]/.test(readFileSync(path.join(root, 'assets', f), 'utf8'))) bad.push(`${f}: unload / beforeunload отключает кэш «Назад»`);
  const sm = readFileSync(path.join(root, 'sitemap.xml'), 'utf8'), rb = readFileSync(path.join(root, 'robots.txt'), 'utf8');
  if (!sm.includes('<loc>https://privatechouse.ru/</loc>') || !sm.includes('<loc>https://privatechouse.ru/services.html</loc>') || (sm.match(/hreflang="en"/g) || []).length !== 2) bad.push('sitemap.xml: нет страницы или EN-версии');
  if (!/User-agent: \*/.test(rb) || !/Sitemap: https:\/\/privatechouse\.ru\/sitemap\.xml/.test(rb)) bad.push('robots.txt');
  await page.close();
  if (bad.length) fail('главная: ' + bad.join('; '));
  else console.log('  ✓ «Делаем один раз. Держим всегда.»: шесть карточек с рисунками на существующие якоря services.html, «Все услуги», без старых пунктов и иконок в квадратах; «Цены» в <template>; «Процесс» → services.html#process, контакт «03 / Контакт»; нет objects.html и unload; canonical, sitemap.xml, robots.txt');
}

// Страница услуг: как главная — сборка всех секций на трёх ширинах RU и двух EN, ошибки консоли, кириллица в EN.
// На 1440 RU: якоря (существуют, модуль после перехода не под липкой шапкой), <details>, JSON-LD, смена языка, снимки.
console.log('\nстраница услуг (services.html)');
const sfile = path.join(root, 'services.html');
for (const [w, h, tag, lang] of [[1440, 900, 's1440', 'ru'], [1700, 930, 's1700', 'ru'], [390, 844, 's390', 'ru'], [1440, 900, 's1440-en', 'en'], [390, 844, 's390-en', 'en']]) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  const errs = [], bad = [];
  page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|ERR_/.test(m.text())) errs.push(m.text()); });
  await page.clock.install({ time: new Date('2026-01-01T12:00:00Z') });
  await page.clock.pauseAt(new Date('2026-01-01T12:00:01Z'));
  await page.goto('file://' + sfile + (lang === 'en' ? '?lang=en' : ''));
  const run = (ms) => page.clock.runFor(ms), done = (n) => page.evaluate((q) => document.querySelector(`[data-sec="${q}"]`).classList.contains('s-done'), n);
  await run(4000);
  if (!(await done('hero'))) bad.push('шапка страницы не собралась за 4 с');
  if (tag === 's1440-en') await page.screenshot({ path: path.join(shots, 's1440-en-head.png') });
  if (w === 390) {
    // ↻ на телефоне: на первом экране виден, ниже — спрятан
    await run(2600); await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' })); await page.waitForTimeout(120); await run(100);
    const p0 = await page.evaluate(() => {
      const p = document.querySelector('[data-pult]'), b = p.getBoundingClientRect(), m = { l: b.left, r: b.left + 44, t: b.bottom - 44, b: b.bottom };
      const over = [...document.querySelectorAll('[data-sec="hero"] .sv-fmt, [data-sec="hero"] .sv-jump a')].some((el) => { const r = el.getBoundingClientRect(); return r.right > m.l && r.left < m.r && r.bottom > m.t && r.top < m.b; });
      return p.className.replace(over ? ' is-off' : '', '');
    });
    await page.evaluate(() => window.scrollTo({ top: 3000, behavior: 'instant' })); await page.waitForTimeout(120); await run(100);
    const p1 = await page.evaluate(() => document.querySelector('[data-pult]').className);
    if (!/is-mini/.test(p0) || /is-off/.test(p0) || !/is-off/.test(p1)) bad.push(`↻ на телефоне: в первом экране «${p0}», ниже «${p1}»`);
  }
  const secs = await page.evaluate(() => [...document.querySelectorAll('[data-sec]')].map((s) => s.dataset.sec));
  for (const name of secs.slice(1)) {
    await page.evaluate((n) => { const el = document.querySelector(`[data-sec="${n}"]`); window.scrollTo({ top: el.getBoundingClientRect().top + scrollY - 40, behavior: 'instant' }); }, name);
    await page.waitForTimeout(200); await run(3600);
    if (!(await done(name))) bad.push(`${name} не собралась за 3.6 с`);
  }
  await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' })); await run(6000);
  const fin = await page.evaluate(() => ({ nd: [...document.querySelectorAll('[data-sec]')].filter((s) => !s.classList.contains('s-done')).map((s) => s.dataset.sec), hid: [...document.querySelectorAll('.sec.s-done .ptx')].filter((el) => el.offsetParent && !(el.closest('details:not([open])') && !el.closest('summary')) && getComputedStyle(el).opacity === '0').length, sw: document.documentElement.scrollWidth - innerWidth }));
  if (fin.nd.length) bad.push(`не собрались: ${fin.nd.join(', ')}`);
  if (fin.hid) bad.push(`${fin.hid} текстов невидимы после сборки`);
  if (fin.sw > 1) bad.push(`горизонтальная прокрутка ${fin.sw}px`);
  if (lang === 'en') { const left = await page.evaluate(cyrillic); if (left.length) bad.push(`кириллица в EN: ${left.slice(0, 6).join(' | ')}`); }
  if (tag === 's1440') {
    const st = await page.evaluate(() => {
      const missing = [...document.querySelectorAll('a[href^="#"]')].map((a) => a.getAttribute('href')).filter((hh) => hh.length > 1 && !document.getElementById(hh.slice(1)));
      const ld = [...document.querySelectorAll('script[type="application/ld+json"]')].map((sc) => { try { return JSON.parse(sc.textContent); } catch (e) { return { error: e.message }; } });
      const faq = ld.find((x) => x['@type'] === 'FAQPage'), org = ld.find((x) => x['@type'] === 'Organization'), nb = (t) => t.replace(/\s+/g, ' ').trim();
      const qs = faq ? faq.mainEntity.map((q) => nb(q.name)) : [], sums = [...document.querySelectorAll('.sv-q summary')].map((x) => nb(x.textContent));
      return { missing, errs: ld.filter((x) => x.error).length, types: ld.map((x) => x['@type']).join(','), offers: org && org.hasOfferCatalog ? org.hasOfferCatalog.itemListElement.length : 0, faqOk: qs.length === 6 && qs.join('|') === sums.join('|'), qs: qs.length, sums: sums.length };
    });
    if (st.missing.length) bad.push(`якоря без цели: ${st.missing.join(', ')}`);
    if (st.errs || st.types !== 'BreadcrumbList,Organization,FAQPage' || st.offers !== 6 || !st.faqOk) bad.push(`JSON-LD: ошибок ${st.errs}, типы ${st.types}, услуг ${st.offers}, вопросы ${st.qs} / ${st.sums}, совпадают ${st.faqOk}`);
    // <details>: клик открывает, Enter закрывает; Enter на другом — открывает
    const q = page.locator('.sv-q summary');
    await q.nth(0).click(); await page.waitForTimeout(450); const o1 = await page.evaluate(() => { const d = document.querySelectorAll('.sv-q')[0]; return d.open && getComputedStyle(d.querySelector('p')).opacity === '1'; });
    await q.nth(0).press('Enter'); const o2 = await page.evaluate(() => document.querySelectorAll('.sv-q')[0].open);
    await q.nth(1).focus(); await page.keyboard.press('Enter'); const o3 = await page.evaluate(() => document.querySelectorAll('.sv-q')[1].open);
    if (!o1 || o2 || !o3) bad.push(`<details>: клик ${o1 ? 'открыл, ответ виден' : 'не открыл или ответ невидим'}, Enter ${!o2 ? 'закрыл' : 'не закрыл'}, Enter на втором ${o3}`);
    // якоря шапки и переходов: модуль встаёт под липкой шапкой с зазором (scroll-margin-top 88), а не под неё
    const tops = [];
    for (const id of ['projects', 'sites', 'apps', 'servers', 'subscription', 'care', 'automation', 'ai']) {
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' })); await page.waitForTimeout(80); await run(200);
      await page.click(`a[href="#${id}"]`); await run(2400); await page.waitForTimeout(60);
      tops.push([id, await page.evaluate((i) => Math.round(document.getElementById(i).getBoundingClientRect().top), id)]);
    }
    const low = tops.filter(([, t]) => t < 64 || t > 120);
    if (low.length) bad.push(`после перехода по якорю: ${low.map(([i, t]) => `${i} ${t}px`).join(', ')}`);
    // смена языка на лету: RU → EN → RU
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' })); await page.waitForTimeout(150); await run(800);
    const ru0 = await page.evaluate(textSnap);
    await page.click('.hero-hdr [data-lang="en"]'); await run(4200);
    const en = await page.evaluate(() => ({ lang: document.documentElement.lang, url: location.search, title: document.title }));
    const left = await page.evaluate(cyrillic);
    if (en.lang !== 'en' || en.url !== '?lang=en' || /[А-Яа-яЁё]/.test(en.title) || left.length) bad.push(`EN на лету: ${JSON.stringify(en)}, кириллица ${left.slice(0, 4).join(' | ')}`);
    await page.click('.hero-hdr [data-lang="ru"]'); await run(4200);
    if ((await page.evaluate(textSnap)) !== ru0) bad.push('после возврата на RU текст не совпал');
  }
  errs.forEach((e) => bad.push(e));
  await page.close();
  if (bad.length) fail(`${tag}: ` + bad.join('; '));
  else console.log(`  ✓ ${tag}: ${secs.length} секций собраны, ошибок нет${lang === 'en' ? ', кириллицы нет' : ''}${tag === 's1440' ? '; якоря, <details>, JSON-LD, смена языка' : ''}${w === 390 ? '; ↻ только на первом экране' : ''}`);
}
// переход с главной по якорю: секции выше цели готовы сразу, цель собирается первой — готова за 3.5 с
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.clock.install({ time: new Date('2026-01-01T12:00:00Z') });
  await page.clock.pauseAt(new Date('2026-01-01T12:00:01Z'));
  await page.goto('file://' + sfile + '#apps');
  await page.clock.runFor(3500);
  const r = await page.evaluate(() => ({ apps: document.querySelector('[data-sec="apps"]').classList.contains('s-done'), above: ['hero', 'sites'].filter((n) => !document.querySelector(`[data-sec="${n}"]`).classList.contains('s-done')), top: Math.round(document.getElementById('apps').getBoundingClientRect().top) }));
  await page.close();
  if (!r.apps || r.above.length || r.top < 64) fail(`services.html#apps: через 3.5 с apps ${r.apps ? 'собран' : 'не собран'}, выше не готовы ${r.above.join(', ') || '—'}, модуль на ${r.top}px`);
  else console.log(`  ✓ services.html#apps: модуль собран за 3.5 с, секции выше готовы сразу, модуль на ${r.top}px — не под липкой шапкой`);
}
// снимки: блок «Услуги» главной и страница услуг целиком на 1440 и 390 (reduced motion — всё собрано; холсты на время
// снимка скрыты, длинная страница снимается кусками — fullShot)
for (const w of [1440, 390]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto('file://' + file); await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(300);
  const b = await page.evaluate(() => { const r = document.querySelector('#directions').getBoundingClientRect(); return { y: r.top + scrollY, h: r.height }; });
  await page.addStyleTag({ content: 'canvas{display:none!important}' });
  await page.screenshot({ path: path.join(shots, `home-services-${w}.png`), fullPage: true, clip: { x: 0, y: Math.round(b.y), width: w, height: Math.round(b.h) } });
  await page.goto('file://' + sfile); await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(300);
  await page.addStyleTag({ content: 'canvas{display:none!important}' });
  await page.evaluate(() => document.querySelectorAll('img[loading="lazy"]').forEach((i) => { i.loading = 'eager'; })); await page.waitForTimeout(300);
  await fullShot(page, path.join(shots, `services-${w}.png`));
  await ctx.close();
}

// Рисунки направлений (вариант A — чертежи линиями): после сборки секции прорисованы (is-on, линии дорисованы, есть
// пиксели), вне экрана на паузе, после ↻ — заново; на странице услуг — шесть мини; reduced motion — сразу, без импульсов.
console.log('\nрисунки направлений');
{
  const bad = [];
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = []; page.on('pageerror', (e) => errs.push(e.message));
  await page.clock.install({ time: new Date('2026-01-01T12:00:00Z') });
  await page.clock.pauseAt(new Date('2026-01-01T12:00:01Z'));
  await page.goto('file://' + file);
  const run = (ms) => page.clock.runFor(ms);
  await run(4000);
  await page.evaluate(() => window.scrollTo({ top: document.querySelector('#directions').getBoundingClientRect().top + scrollY + 280, behavior: 'instant' }));
  await page.waitForTimeout(150); await run(3200); await page.waitForTimeout(3300);   // CSS-прорисовка идёт в реальном времени
  const g = await page.evaluate(() => [...document.querySelectorAll('#directions .glyph')].map((el) => {
    const ds = [...el.querySelectorAll('.d')].filter((d) => !d.closest('.type')), undrawn = ds.filter((d) => parseFloat(getComputedStyle(d).strokeDashoffset) > 0.02).length, r = el.getBoundingClientRect();
    return { k: el.dataset.glyph, on: el.classList.contains('is-on'), vis: el.classList.contains('is-vis'), undrawn, n: ds.length, box: [r.left, r.top, r.width, r.height] };
  }));
  for (const x of g.filter((y) => y.box[1] + y.box[3] > 0 && y.box[1] < 900)) {
    const png = (await page.screenshot({ clip: { x: x.box[0], y: Math.max(0, x.box[1]), width: x.box[2], height: Math.min(x.box[3], 900 - Math.max(0, x.box[1])) } })).toString('base64');
    x.px = await page.evaluate(async (b64) => { const im = new Image(); im.src = 'data:image/png;base64,' + b64; await im.decode(); const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const q = c.getContext('2d'); q.drawImage(im, 0, 0); const d = q.getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i] + d[i + 1] + d[i + 2] > 300) n++; return n; }, png);
  }
  if (g.length !== 6 || g.some((x) => !x.on || x.undrawn)) bad.push(`после сборки: ${g.map((x) => `${x.k} ${x.on ? 'on' : 'off'} недорисовано ${x.undrawn}/${x.n}`).join(', ')}`);
  if (g.some((x) => x.px != null && x.px < 40)) bad.push(`пустые рисунки на экране: ${g.filter((x) => x.px != null && x.px < 40).map((x) => x.k).join(', ')}`);
  await page.screenshot({ path: path.join(shots, 'd1440-glyphs.png') });
  // вне экрана — на паузе
  await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' })); await page.waitForTimeout(250);
  const off = await page.evaluate(() => [...document.querySelectorAll('#directions .glyph')].filter((el) => el.classList.contains('is-vis') || !el.querySelector('svg').animationsPaused()).length);
  if (off) bad.push(`вне экрана не на паузе: ${off}`);
  // «Пересобрать блок»: рисунок гаснет вместе с секцией и прорисовывается заново
  await page.evaluate(() => { window.scrollTo({ top: document.querySelector('#directions').getBoundingClientRect().top + scrollY + 280, behavior: 'instant' }); window.__glOff = 0; document.querySelectorAll('#directions .glyph').forEach((el) => new MutationObserver(() => { if (!el.classList.contains('is-on')) window.__glOff++; }).observe(el, { attributes: true, attributeFilter: ['class'] })); });
  await page.waitForTimeout(200); await run(3000);
  await page.locator('[data-pt-replay]:visible').first().click(); await run(9000);
  const rp = await page.evaluate(() => ({ off: window.__glOff, on: [...document.querySelectorAll('#directions .glyph')].filter((el) => el.classList.contains('is-on')).length }));
  if (!rp.off || rp.on !== 6) bad.push(`после ↻: гасли ${rp.off} раз, прорисованы ${rp.on} из 6`);
  errs.forEach((e) => bad.push(e));
  await page.close();
  // страница услуг: шесть мини-рисунков у подписей модулей
  {
    const pg = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await pg.goto('file://' + path.join(root, 'services.html') + '?intro=instant'); await pg.waitForTimeout(300);
    const m = await pg.evaluate(() => ({ n: document.querySelectorAll('.sv-lab .glyph-mini').length, on: document.querySelectorAll('.sv-lab .glyph-mini.is-on.is-now').length, icons: document.querySelectorAll('.svc-ic').length, dots: document.querySelectorAll('.sv-jump .sv-dot').length }));
    if (m.n !== 6 || m.on !== 6 || m.icons || m.dots !== 6) bad.push(`страница услуг: мини ${m.n}, на месте ${m.on}, иконок ${m.icons}, точек в переходах ${m.dots}`);
    await pg.evaluate(() => { const e = document.getElementById('sites'); window.scrollTo({ top: e.getBoundingClientRect().top + scrollY - 20, behavior: 'instant' }); }); await pg.waitForTimeout(300);
    await pg.screenshot({ path: path.join(shots, 's1440-sites.png') });
    await pg.close();
  }
  // reduced motion: сразу на месте, импульсов нет
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
    const pg = await ctx.newPage();
    await pg.goto('file://' + file); await pg.waitForTimeout(300);
    const r = await pg.evaluate(() => ({ now: document.querySelectorAll('.glyph.is-now').length, off: [...document.querySelectorAll('.glyph .d')].filter((d) => parseFloat(getComputedStyle(d).strokeDashoffset) > 0.01).length, pulses: [...document.querySelectorAll('.glyph .pulse')].filter((p) => getComputedStyle(p).display !== 'none').length }));
    if (r.now !== 6 || r.off || r.pulses) bad.push(`reduced motion: на месте ${r.now}, не прорисовано ${r.off}, импульсов видно ${r.pulses}`);
    await ctx.close();
  }
  if (bad.length) fail('рисунки: ' + bad.join('; '));
  else console.log('  ✓ шесть рисунков прорисовываются со сборкой секции и не пустые, вне экрана на паузе, после ↻ — заново; на странице услуг шесть мини и точки в переходах; reduced motion — сразу, без импульсов');
}

// Режимы сборки: каждый сценарий — отдельный контекст браузера; хранилища задаются addInitScript. Время виртуальное
// (2026-01-01 12:00 UTC), поэтому и метки pt-intro — от него. AUTO_MODE в engine.js выключен (владелец проверяет
// полную сборку) — тогда без ?intro= везде полная, а быстрая проверяется через ?intro=fast.
const AUTO = /var AUTO_MODE = true/.test(readFileSync(path.join(root, 'assets', 'engine.js'), 'utf8'));
console.log(`\nрежимы сборки: полная / быстрая / сразу (автовыбор ${AUTO ? 'включён' : 'выключен — всегда полная'})`);
{
  const T0 = Date.parse('2026-01-01T12:00:00Z'), bad = [], ok = [];
  const scene = async (name, url, init, fn) => {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    if (init) await ctx.addInitScript(init);
    const page = await ctx.newPage(), errs = [];
    page.on('pageerror', (e) => errs.push(e.message)); page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|ERR_/.test(m.text())) errs.push(m.text()); });
    await page.clock.install({ time: new Date(T0) });
    await page.goto('file://' + path.join(root, url));
    const mode = () => page.evaluate(() => document.getElementById('pt-site').getAttribute('data-intro'));
    try { const r = await fn(page, mode); if (r) bad.push(`${name}: ${r}`); else ok.push(name); } catch (e) { bad.push(`${name}: ${e.message.split('\n')[0]}`); }
    errs.forEach((e) => bad.push(`${name}: ${e}`));
    await ctx.close();
  };
  const h1on = (page) => page.evaluate(() => [...document.querySelectorAll('h1 .ptx')].every((el) => getComputedStyle(el).opacity === '1'));
  const doneAll = (page) => page.evaluate(() => [...document.querySelectorAll('[data-sec]')].every((x) => x.classList.contains('s-done')));
  await scene('пусто → полная', 'index.html', '', async (page, mode) => {
    await page.clock.runFor(1450);
    const r = { m: await mode(), intro: await page.evaluate(() => localStorage.getItem('pt-intro')), lines: await page.evaluate(() => document.querySelector('[data-scan-beam]').classList.contains('run')) };
    return r.m === 'full' && (r.intro || !AUTO) && r.lines ? '' : JSON.stringify(r);
  });
  const isFull = async (page, mode) => { await page.clock.runFor(200); const m = await mode(); return m === 'full' ? '' : m; };
  const fastCheck = async (page, mode) => {
    await page.clock.runFor(100); await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(shots, 's1440-fast-0.4.png') });
    await page.waitForTimeout(400);
    const r = { m: await mode(), h1: await h1on(page), lines: await page.evaluate(() => document.querySelector('[data-scan-beam]').classList.contains('run')) };
    const first = await page.evaluate(() => { const s = document.querySelectorAll('[data-sec]')[1]; window.scrollTo({ top: s.getBoundingClientRect().top + scrollY - 40, behavior: 'instant' }); return s.dataset.sec; });
    await page.waitForTimeout(150); await page.clock.runFor(900);
    r.sec = await page.evaluate((n) => document.querySelector(`[data-sec="${n}"]`).classList.contains('s-done'), first);
    return r.m === 'fast' && r.h1 && !r.lines && r.sec ? '' : JSON.stringify(r);
  };
  await scene('?intro=fast → быстрая', 'services.html?intro=fast', '', fastCheck);
  await scene(`pt-intro −1 день → ${AUTO ? 'быстрая' : 'полная'}`, 'services.html', `localStorage.setItem('pt-intro', '${T0 - 864e5}')`, AUTO ? fastCheck : isFull);
  await scene('pt-intro −31 день → полная', 'services.html', `localStorage.setItem('pt-intro', '${T0 - 31 * 864e5}')`, async (page, mode) => { await page.clock.runFor(200); const m = await mode(); return m === 'full' ? '' : m; });
  await scene(`страница в pt-seen → ${AUTO ? 'сразу' : 'полная'}`, 'index.html', `localStorage.setItem('pt-intro', '${T0 - 864e5}'); sessionStorage.setItem('pt-seen', '["index"]')`, !AUTO ? isFull : async (page, mode) => {
    const r = { m: await mode(), all: await doneAll(page) };
    await page.waitForTimeout(150);
    r.h1 = await h1on(page);
    return r.m === 'instant' && r.all && r.h1 ? '' : JSON.stringify(r);
  });
  if (AUTO) await scene('главная → «Все услуги» → назад → снова услуги', 'index.html', '', async (page, mode) => {
    await page.clock.runFor(6500);
    await page.evaluate(() => document.querySelector('#directions .more a[href="services.html"]').click());
    await page.waitForURL(/services\.html/);
    const f = { m: await mode() };
    await page.clock.runFor(100); await page.waitForTimeout(700); f.h1 = await h1on(page);
    await page.goBack(); await page.clock.runFor(100); await page.waitForTimeout(100);
    const b = { m: await mode(), all: await doneAll(page) };
    await page.goForward(); await page.clock.runFor(100); await page.waitForTimeout(100);
    const c = { m: await mode(), all: await doneAll(page) };
    return f.m === 'fast' && f.h1 && b.all && c.m === 'instant' && c.all ? '' : JSON.stringify({ f, b, c });
  });
  await scene('«Процесс» с главной → услуги, не под шапкой', 'index.html', '', async (page) => {
    await page.clock.runFor(6500);
    await page.click('.hero-hdr .nav a[href="services.html#process"]'); await page.waitForURL(/services\.html#process/);
    await page.clock.runFor(3000); await page.waitForTimeout(100);
    const r = await page.evaluate(() => ({ done: document.querySelector('[data-sec="process"]').classList.contains('s-done'), h2: Math.round(document.querySelector('[data-sec="process"] h2').getBoundingClientRect().top) }));
    return r.done && r.h2 >= 64 && r.h2 < 900 ? '' : JSON.stringify(r);
  });
  for (const m of ['full', 'fast', 'instant']) await scene(`?intro=${m}`, `index.html?intro=${m}`, `sessionStorage.setItem('pt-seen', '["index"]')`, async (page, mode) => { await page.clock.runFor(100); const got = await mode(); return got === m ? '' : got; });
  await scene('хранилище запрещено → полная', 'index.html', `Object.defineProperty(window, 'localStorage', { get() { throw new Error('denied'); } }); Object.defineProperty(window, 'sessionStorage', { get() { throw new Error('denied'); } });`, async (page, mode) => { await page.clock.runFor(4000); const r = { m: await mode(), hero: await page.evaluate(() => document.querySelector('[data-sec="hero"]').classList.contains('s-done')) }; return r.m === 'full' && r.hero ? '' : JSON.stringify(r); });
  if (bad.length) fail('режимы: ' + bad.join(' | '));
  else console.log(`  ✓ ${ok.join('; ')}`);
}

// Раскладка на промежуточных ширинах: ни кнопка, ни ссылка, ни строка текста не выходят за край окна. Документ вбок
// не листается в любом случае (корень .pt обрезает лишнее), поэтому меряем сами элементы. Липкую шапку на время
// замера показываем. Вкладки панели: слова видны, только если панель шире 540 px, и не вылезают из вкладки.
console.log('\nраскладка на промежуточных ширинах (главная и услуги, RU / EN, шапка и липкая шапка)');
{
  const bad = [];
  for (const pg of ['index.html', 'services.html']) for (const lang of ['ru', 'en']) for (const w of [320, 360, 375, 390, 414, 430, 768, 820, 1024, 1150, 1280, 1440, 1920]) {
    const page = await browser.newPage({ viewport: { width: w, height: 900 } });
    await page.goto('file://' + path.join(root, pg) + (lang === 'en' ? '?lang=en' : ''));
    await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(300);
    const out = await page.evaluate(() => {
      document.querySelector('[data-topbar]').classList.add('on');
      const W = innerWidth, res = [];
      document.querySelectorAll('#pt-site .sec a, #pt-site .sec button, #pt-site .sec h1, #pt-site .sec h2, #pt-site .sec h3, #pt-site .sec p, #pt-site .sec li, [data-topbar] a, [data-topbar] button').forEach((el) => {
        if (el.closest('template, [data-menu], .site-view, .an, .wf, .sv-jump')) return;
        const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden') return;
        const r = el.getBoundingClientRect(); if (!r.width) return;
        if (r.right > W + 1 || r.left < -1) res.push(`«${(el.textContent.trim() || el.getAttribute('aria-label') || el.tagName).slice(0, 24)}» ${Math.round(r.left)}..${Math.round(r.right)}`);
      });
      if (document.documentElement.scrollWidth > W) res.push(`документ шире окна: ${document.documentElement.scrollWidth}`);
      const obj = document.querySelector('[data-obj]');
      if (obj) {
        const pw = obj.getBoundingClientRect().width, words = [...document.querySelectorAll('.cx-w')].filter((x) => getComputedStyle(x).display !== 'none').length;
        if (pw < 540 ? words : words !== 5) res.push(`панель ${Math.round(pw)} px: видно слов на вкладках ${words}`);
        const clip = [...document.querySelectorAll('.cx-l')].filter((l) => l.scrollWidth > l.clientWidth + 1).length;
        if (clip) res.push(`вкладок, где подпись шире вкладки: ${clip}`);
      }
      // курсивный кусок заголовка на ширине от 761 — одной строкой («Один / дом.» рвалось)
      if (W > 760) document.querySelectorAll('.h2 .it, .sv-h1 .it').forEach((it) => { const n = it.getClientRects().length, r = it.getBoundingClientRect(); if (n !== 1 || r.right > W + 1) res.push(`курсив «${it.textContent.trim().slice(0, 20)}» — ${n} стр., край ${Math.round(r.right)}`); });
      return res;
    });
    out.forEach((x) => bad.push(`${pg} ${w} ${lang}: ${x}`));
    await page.close();
  }
  if (bad.length) fail('выходят за край окна: ' + bad.slice(0, 12).join(' | ') + (bad.length > 12 ? ` …ещё ${bad.length - 12}` : ''));
  else console.log('  ✓ главная и услуги на 320–430, 768, 820, 1024, 1150, 1280, 1440, 1920 (RU и EN): ничего не выходит за край окна, кнопки шапки целиком; слова вкладок — по ширине панели; курсив заголовков — одной строкой');
}

// Первый экран: шапка с первого кадра, H1 в три строки и курсив не рвётся, панель «Кодекс студии» в первом экране,
// плашка пульта по наведению ничего не перекрывает; пульт свёрнут при прокрутке сразу после сборки (390×844).
console.log('\nпервый экран: шапка, заголовок, панель, пульт');
{
  const bad = [];
  for (const lang of ['ru', 'en']) for (const [w, h] of [[1280, 720], [1440, 900], [1920, 1080], [390, 844]]) {
    const page = await browser.newPage({ viewport: { width: w, height: h } });
    const errs = [];
    page.on('pageerror', (e) => errs.push(e.message));
    await page.clock.install({ time: new Date('2026-01-01T12:00:00Z') });
    await page.clock.pauseAt(new Date('2026-01-01T12:00:01Z'));
    await page.goto('file://' + file + (lang === 'en' ? '?lang=en' : ''));
    const run = (ms) => page.clock.runFor(ms);
    const tag = `${w}×${h} ${lang}`;
    await run(300); await page.waitForTimeout(60);
    // шапка собирается из частиц вместе с первым экраном: на 0.3 с её текст скрыт, после сборки — виден
    const hd = () => page.evaluate(() => { const t = [...document.querySelectorAll('.hero-hdr .ptx')].filter((el) => el.offsetParent); return { n: t.length, shown: t.filter((el) => getComputedStyle(el).opacity === '1').length, fr: document.querySelectorAll('.hero-hdr .fr').length }; });
    const h0 = await hd();
    if (!h0.n || h0.shown || !h0.fr) bad.push(`${tag}: шапка на 0.3 с не собирается — текстов ${h0.n}, из них видно ${h0.shown}, рамок ${h0.fr}`);
    if (w === 390) {
      // прокрутка сразу после сборки первого экрана: пульт сворачивается, хотя секции ещё собираются
      await run(2900); await page.evaluate(() => window.scrollTo({ top: 1100, behavior: 'instant' })); await page.waitForTimeout(100);
      await run(2600);
      const pm = await page.evaluate(() => ({ mini: document.querySelector('[data-pult]').classList.contains('is-mini'), open: document.querySelector('[data-pult]').classList.contains('is-open') }));
      if (!pm.mini || pm.open) bad.push(`${tag}: пульт не свёрнут при прокрутке сразу после первого экрана`);
      // на телефоне ↻ — только на первом экране: ниже он лежал поверх карточек
      await page.evaluate(() => window.scrollTo({ top: document.querySelector('[data-sec="hero"]').getBoundingClientRect().bottom + scrollY + 400, behavior: 'instant' })); await page.waitForTimeout(150); await run(100);
      if (!(await page.evaluate(() => document.querySelector('[data-pult]').classList.contains('is-off')))) bad.push(`${tag}: ↻ виден ниже первого экрана`);
    } else {
      if (w === 1440 && lang === 'ru') {
        // вступление: вспышка на весь экран, потом вертикальная линия (каркас) и горизонтальная (стили)
        await page.screenshot({ path: path.join(shots, 'd1440-intro-burst.png') });
        await run(550); await page.waitForTimeout(60);
        const v = await page.evaluate(() => document.querySelector('[data-lang-beam]').classList.contains('run'));
        await page.screenshot({ path: path.join(shots, 'd1440-intro-line-v.png') });
        await run(550); await page.waitForTimeout(60);
        const hz = await page.evaluate(() => ({ run: document.querySelector('[data-scan-beam]').classList.contains('run'), scan: getComputedStyle(document.querySelector('.scan')).animationName }));
        await page.screenshot({ path: path.join(shots, 'd1440-intro-line-h.png') });
        if (!v || !hz.run || hz.scan !== 'none') bad.push(`${tag}: вступление — вертикальная линия ${v}, горизонтальная ${hz.run}, старый сканер ${hz.scan}`);
        await run(5100);
      } else await run(6200);
      await page.waitForTimeout(150);
      const r = await page.evaluate(() => {
        const h1 = document.querySelector('h1'), lh = parseFloat(getComputedStyle(h1).lineHeight), it = document.querySelector('.hero-h .it');
        return { lines: Math.round(h1.getBoundingClientRect().height / lh), it: it.getClientRects().length, obj: document.querySelector('[data-obj]').getBoundingClientRect().bottom };
      });
      if (lang === 'ru' ? r.lines !== 3 : r.lines > 3) bad.push(`${tag}: H1 в ${r.lines} строк`);
      if (r.it !== 1) bad.push(`${tag}: курсив H1 рвётся на ${r.it} строки`);
      if (r.obj > h + 1) bad.push(`${tag}: панель ниже первого экрана (низ ${Math.round(r.obj)})`);
      if (w !== 1920) {
        await run(2500);
        const b = await page.evaluate(() => { const r = document.querySelector('.pult-mini').getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; });
        await page.mouse.move(b[0], b[1]); await page.waitForTimeout(120);
        const hv = await page.evaluate(() => {
          const bar = document.querySelector('.pult-bar'), br = bar.getBoundingClientRect();
          const hit = [...document.querySelectorAll('.trust, .hero-act, [data-obj]')].filter((el) => { const r = el.getBoundingClientRect(); return r.right > br.left && r.left < br.right && r.bottom > br.top && r.top < br.bottom; }).map((el) => el.className.split(' ').slice(-1)[0]);
          return { shown: getComputedStyle(bar).display !== 'none', hit };
        });
        if (!hv.shown) bad.push(`${tag}: плашка пульта не показалась по наведению`);
        else if (hv.hit.length) bad.push(`${tag}: плашка пульта по наведению перекрывает ${hv.hit.join(', ')}`);
        if (lang === 'ru' && w === 1440) await page.screenshot({ path: path.join(shots, 'd1440-pult-hover.png') });
        await page.mouse.move(b[0], b[1] - 30, { steps: 6 }); await page.waitForTimeout(80);
        if (await page.evaluate(() => getComputedStyle(document.querySelector('.pult-bar')).display === 'none')) bad.push(`${tag}: плашка схлопнулась по пути курсора с кнопки на неё`);
      }
      if (lang === 'ru' && w === 1920) await page.screenshot({ path: path.join(shots, 'd1920-first-screen.png') });
      // объект крупнее, но не задевает вкладки и подпись: границы по пикселям за весь цикл объекта, без первой секунды —
      // там частицы перелетают из прошлого объекта по всей панели (текст и пыль на время замера скрыты)
      if (lang === 'ru' && w === 1280) for (const k of [0, 4]) {
        await page.mouse.move(2, 2);
        await page.evaluate((n) => document.querySelector(`[data-usp="${n}"]`).click(), k);
        let top = 1e9, bot = 0, lim = null;
        for (const ms of k === 4 ? [1200, 1500, 1500, 1500, 1500, 1500] : [1200, 1400, 1400, 1400, 1400, 1300]) {
          await run(ms); await page.waitForTimeout(60);
          const ob = await objBox(page); top = Math.min(top, ob.box[1]); bot = Math.max(bot, ob.box[3]); lim = ob;
        }
        if (top < lim.top || bot > lim.cap) bad.push(`${tag}: объект 0${k + 1} по вертикали ${top}..${bot}, подписи вкладок до ${lim.top}, подпись со стрелками с ${lim.cap}`);
      }
    }
    await page.waitForTimeout(1000);
    const h1 = await hd();
    if (h1.shown !== h1.n) bad.push(`${tag}: после сборки в шапке видно ${h1.shown} из ${h1.n} текстов`);
    errs.forEach((e) => bad.push(`${tag}: ${e}`));
    await page.close();
  }
  if (bad.length) fail(bad.join(' | '));
  else console.log('  ✓ вступление: две линии, старый сканер выключен; шапка собирается вместе с первым экраном; H1 — три строки, курсив целиком; панель в первом экране; плашка пульта не перекрывает контент; пульт свёрнут при прокрутке (RU и EN)');
}
await browser.close();
console.log(failed ? `\nИТОГ: ${failed} проблем(ы). Скриншоты: tools/shots/` : '\nИТОГ: всё чисто. Скриншоты: tools/shots/ — просмотри глазами.');
process.exit(failed ? 1 : 0);
