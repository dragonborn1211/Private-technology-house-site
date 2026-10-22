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
// Автоматизация (TASK-automation.md): на главной — site-leads, voice-task, reviews, your-process в две колонки (одна на
// телефоне), окно схемы в крупном режиме (≥ 520 / ≥ 400 px), номера объектов не повторяются; на странице услуг — кейсы
// catalog и b24-digest в «Автоматизации», call-audit и dept-agents в «AI», схемы нарисованы и на паузе вне экрана;
// строки схем из scenes.js переведены (холсты, не DOM); снимки ряда и модулей.
// Чистка (TASK-cleanup.md): на странице услуг нет чипов-дублей и ряда переходов, направления — ссылками в карточке
// форматов (порядок, зона нажатия 40 px), нет сроков автоматизации, «код и доступ» — не больше 3 раз. Облегчённый режим
// включается при кадрах ~150 мс (≤ 20 с), снимает размытие со стёкол и не включается в обычном прогоне.
// Страницы (TASK-pages.md): кейсы — на cases.html (фильтр кликом и по хешу, схемы после смены фильтра нарисованы, NDA
// видна всегда, два кейса в <template>), каталог automations.html (восемь шаблонов и «Под ваш процесс», фильтр, ссылки с
// главной и услуг на существующие карточки, «Работает у клиента» → существующие кейсы, вопросы = JSON-LD), 404.html через
// tools/serve.mjs (статус 404 на вложенном адресе, ресурсы от корня грузятся, EN); меню из четырёх пунктов в трёх местах
// каждой страницы, общий подвал (разметка совпадает); услуги без кейсов и схем, не длиннее 7,0 / 13,5 экрана; главная —
// «02 / Кейсы» (число в плитке = кейсам cases.html) и «03 / Готовые автоматизации» без «Объект №», не длиннее 6,2 экрана;
// «Потока» нет ни в одном HTML; JSON-LD в EN переведён; новые страницы собираются на трёх ширинах RU и двух EN.
// Шлифовка (TASK-polish.md): главная короче (Кейсы — Resonara, ИИ-аудитор, демо-сайты; две готовые автоматизации;
// ≤ 5,2 / 8,5 экрана), в заголовках нет служебных подписей каркаса (они в атрибутах, aria-hidden), курсив с переливом только
// в h1, без номеров разделов, моно ≤ 20 % на главной, тире ≤ 1,5 на 100 слов, без штампов; демо-сайты сменяют друг друга;
// на cases.html рядов из одной карточки нет.
// Структура (TASK-structure.md): меню «Что делаем · Работы · Готовые решения · Как работаем» (с 1200 px в шапке, ниже —
// кнопка меню), страница process.html, новый порядок услуг, сборка без разлёта в конце (data-pt-burst нет), повторный переход
// в вкладке — быстрая сборка (data-repeat), подпись над названием карточки — Manrope 15/500.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
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

// 1а. Версии стилей и скриптов в адресах (TASK-qa.md, 4.3; tools/bump.mjs): у каждого assets/*.css|js во всех HTML —
//     ?v= = хеш его содержимого, одинаковый на всех страницах. Поменял файл и не запустил bump — проверка падает.
{
  const { versions } = await import('./bump.mjs');
  const v = versions(), bad = [];
  for (const f of readdirSync(root).filter((x) => x.endsWith('.html') && !x.startsWith('yandex'))) {
    const s = readFileSync(path.join(root, f), 'utf8');
    for (const m of s.matchAll(/(?:src|href)="\/?assets\/([\w.-]+\.(?:css|js))(\?v=([0-9a-f]+))?"/g)) {
      if (!m[3]) bad.push(`${f}: ${m[1]} без ?v=`);
      else if (v[m[1]] && m[3] !== v[m[1]]) bad.push(`${f}: ${m[1]}?v=${m[3]}, а файл — ${v[m[1]]}`);
    }
  }
  if (bad.length) fail(`версии ресурсов (запусти node tools/bump.mjs): ${bad.slice(0, 8).join('; ')}`);
  else console.log('  ✓ версии стилей и скриптов в адресах совпадают с файлами на всех страницах');
}

// отпечатки холстов-сцен, попавших под селектор (0 — холст пустой); кладётся в страницу до её скриптов
const SCENES = ':is(canvas[data-mini], canvas[data-flow], canvas[data-flowlight])';
const printsInit = () => {
  window.__scenePrints = (sel, visible) => [...document.querySelectorAll(sel)].filter((cv) => {
    const r = cv.getBoundingClientRect();
    return !visible || (r.bottom > 0 && r.top < window.innerHeight);
  }).map((cv) => {
    // первое чтение холста, долго лежавшего вне экрана, Chrome делает из видеопамяти и переводит холст в обычную —
    // пиксели округляются иначе, и отпечаток «меняется» без единого вызова рисования. Считаем по второму чтению
    const g = cv.getContext('2d'); g.getImageData(0, 0, cv.width, cv.height);
    const d = g.getImageData(0, 0, cv.width, cv.height).data;
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

// фильтр карточек анимируется (FLIP, ~0.6 с; под SwiftShader — дольше): ждём, пока доедут его анимации (WAAPI, не CSS-переходы)
const filterIdle = (page) => page.waitForFunction(() => !document.getAnimations().some((a) => a.constructor.name === 'Animation' && a.playState === 'running'), null, { timeout: 8000 }).catch(() => {});
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
    // плашка cookie (consent.js) лежит в углу поверх панели — её белые буквы и кнопка считались бы объектом
    document.querySelectorAll('.obj-top, .obj-foot, [data-pt-canvas], .ck').forEach((e) => { e.style.visibility = 'hidden'; });
    return { o: [o.left, o.top, o.width, o.height], top: Math.round(t.bottom - o.top), cap: Math.round(Math.min(c.top, n.top) - o.top) };
  });
  await page.waitForTimeout(40);
  const png = (await page.screenshot({ clip: { x: Math.round(g.o[0]) + 6, y: Math.round(g.o[1]) + 6, width: Math.round(g.o[2]) - 12, height: Math.round(g.o[3]) - 12 } })).toString('base64');
  const b = await page.evaluate(async (b64) => {
    const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const x2 = c.getContext('2d'); x2.drawImage(img, 0, 0);
    const d = x2.getImageData(0, 0, c.width, c.height).data, W = c.width, H = c.height, rows = new Array(H).fill(0);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = (y * W + x) * 4; if (d[i] * 0.3 + d[i + 1] * 0.5 + d[i + 2] * 0.2 > 105) rows[y]++; }
    // границы — по строкам, где ярких точек ≥ 3; одиночные искры у края (ход ферзя, перелёт частиц) — не объект: кусок за пустой
    // полосой от 16 строк, в котором меньше 40 ярких точек, отбрасываем. Раньше такая искра под доской на миг заходила в полосу
    // подписи и роняла проверку в зависимости от фазы хода (сам объект кончался на ~50 px выше)
    let a = rows.findIndex((v) => v >= 3), z = H - 1 - [...rows].reverse().findIndex((v) => v >= 3);
    const trim = (from, dir) => {
      let y = from, sum = 0, gap = 0;
      for (; y >= 0 && y < H; y += dir) { if (rows[y]) { gap = 0; sum += rows[y]; } else if (++gap >= 16) break; }
      if (gap < 16 || sum >= 40) return from;
      for (; y >= 0 && y < H && rows[y] < 3; y += dir);
      return y >= 0 && y < H ? y : from;
    };
    for (let k = 0; k < 3 && a >= 0; k++) { const t = trim(a, 1); if (t === a) break; a = t; }
    for (let k = 0; k < 3 && z >= 0; k++) { const t = trim(z, -1); if (t === z) break; z = t; }
    return [a, z];
  }, png);
  await page.evaluate(() => document.querySelectorAll('.obj-top, .obj-foot, [data-pt-canvas], .ck').forEach((e) => { e.style.visibility = ''; }));
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
  // preload шрифтов (crossorigin) со страницы, открытой с диска (file://), Chrome блокирует как кросс-доменный запрос — это
  // артефакт проверки: на сайте шрифты идут по https с того же адреса (их загрузку проверяет «ревью, 2–3» через сервер)
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|ERR_|Access to font at 'file:/.test(m.text())) errs.push(m.text()); });
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
        tgBad: tg.filter((a) => !(a.hasAttribute('data-tg') ? /^https:\/\/t\.me\/dragonborne0\?text=\S+$/ : /^https:\/\/t\.me\/dragonborne0$/).test(a.getAttribute('href')) || a.target !== '_blank' || !/noopener/.test(a.rel)).length,
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
    if (lx.nav !== 'Что делаем,Работы,Готовые решения,Как работаем') bad.push(`меню: ${lx.nav}`);
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
        font: getComputedStyle(document.querySelector('.cx-l')).fontFamily, num: document.querySelectorAll('.cx-n').length,
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
    // клик по вкладке 04: активна она, «Защита данных», мята; через 1 с всё ещё 04 — клик не всплывает до панели
    await page.click('[data-usp="3"]'); await settle(1000);
    let st = await state(); want(st, 4, 'rgb(159, 229, 209)', 'клик по вкладке 04');
    if (st.title !== 'Защита данных') bad.push(`подпись после клика по 04: «${st.title}»`);
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
    // номеров на вкладках нет (просьба владельца) — только слово
    if (!/Manrope/.test(hx.font) || hx.num) bad.push(`шрифт вкладок «${hx.font}», номеров ${hx.num}`);
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
    const bar = () => page.evaluate(() => { const b = document.querySelector('[data-topbar]'); return { on: b.classList.contains('on') && getComputedStyle(b).visibility !== 'hidden', hrefs: [...b.querySelectorAll('.nav a')].map((a) => a.getAttribute('href')).join(',') }; });
    const go = async (y) => { await page.evaluate((v) => window.scrollTo({ top: v, behavior: 'instant' }), y); await page.waitForTimeout(80); await run(150); await page.waitForTimeout(120); await run(50); };
    await go(0); const b0 = await bar();
    const py = await page.evaluate(() => document.querySelector('#automation').getBoundingClientRect().top + window.scrollY);
    await go(py + 300); const b1 = await bar();
    await go(py + 100); const b2 = await bar();
    await go(py + 400); const b3 = await bar();
    if (b0.on || b1.on || !b2.on || b3.on) fail(`липкая шапка: в первом экране ${b0.on}, вниз ${b1.on}, вверх ${b2.on}, снова вниз ${b3.on}`);
    else if (b2.hrefs !== 'services,cases,automations,process') fail(`липкая шапка: пункты меню ведут на ${b2.hrefs}`);
    else console.log('  ✓ липкая шапка: скрыта в первом экране, вверх — видна, вниз — прячется; пункты меню — на страницы');
  }
  if (tag === 'm390') {
    // меню на телефоне: «Обсудить проект» (каналы связи) и кнопка меню в шапке, Esc, фокус, пункт меню, язык
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' })); await page.waitForTimeout(100); await run(300);
    const st = () => page.evaluate(() => ({ on: document.querySelector('[data-menu]').classList.contains('on'), lock: document.documentElement.classList.contains('pt-lock'), inMenu: document.querySelector('[data-menu]').contains(document.activeElement), lang: document.documentElement.lang }));
    const hb = await page.evaluate(() => { const v = (sel) => { const el = document.querySelector(sel), r = el && el.getBoundingClientRect(); return !!r && r.width > 0 && r.bottom > 0 && r.top < innerHeight; }; return v('[data-sec="hero"] header .cm-btn') && v('[data-sec="hero"] [data-menu-open]'); });
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
    await page.evaluate(() => document.addEventListener('click', (e) => { if (e.target.closest('[data-menu] .menu-nav a')) e.preventDefault(); }, { once: true }));
    await page.click('[data-menu] .menu-nav a[href="cases"]'); await run(400);
    const m3 = await st(), mh = await page.evaluate(() => [...document.querySelectorAll('[data-menu] .menu-nav a')].map((a) => a.getAttribute('href')).join(','));
    // страница осталась на первом экране (пункт меню ведёт на страницу, переход погашен) — липкой шапки нет, меню — из шапки
    await page.click(opener); await run(400);
    await page.click('[data-menu] [data-lang="en"]'); await run(4200);
    const m4 = await st();
    await page.keyboard.press('Escape'); await run(400);
    await page.evaluate(() => document.querySelector('[data-menu] [data-lang="ru"]').click()); await run(4200);
    const bad = [];
    if (!hb) bad.push('в шапке не видно «Обсудить проект» (каналы связи) или кнопки меню');
    if (!m1.on || !m1.lock || !m1.inMenu || exp !== 'true') bad.push(`открытие: ${JSON.stringify(m1)}, aria-expanded ${exp}`);
    if (under !== 'hidden') bad.push('под открытым меню видна страница (светлое пятно)');
    if (m2.on || m2.lock || !back) bad.push(`Esc: меню ${m2.on ? 'открыто' : 'закрыто'}, фокус на кнопке ${back}`);
    if (m3.on || mh !== 'services,cases,automations,process') bad.push(`пункт меню: меню ${m3.on ? 'открыто' : 'закрыто'}, пункты ведут на ${mh}`);
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
  // обычный прогон (быстрые кадры): облегчённый режим не включился
  if (!rm) { const lite = await page.evaluate(() => sessionStorage.getItem('pt-q')); if (lite) fail(`облегчённый режим включился в обычном прогоне: pt-q = ${lite}`); }
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
      procLinks: all('a').filter((a) => a.textContent.trim() === 'Как работаем').map((a) => a.getAttribute('href')), contact: document.querySelector('#contact .mono.k').textContent.trim() };
  });
  const bad = [];
  if (r.cards.length !== 6 || r.cards.some((h) => !/^services#/.test(h) || !ids.has(h.split('#')[1]))) bad.push(`карточки: ${r.cards.join(', ')}`);
  if (r.more.join() !== 'services') bad.push(`«Все услуги» → ${r.more.join()}`);
  if (r.h2 !== 'Делаем один раз. Держим всегда.') bad.push(`заголовок «${r.h2}»`);
  if (r.nums) bad.push(`номера 01–04 в блоке: ${r.nums}`);
  if (r.old.length) bad.push(`старые пункты: ${r.old.join(', ')}`);
  if (r.pricing || !r.tpl || r.pricingLinks) bad.push(`«Цены»: секция на странице ${r.pricing}, в <template> ${r.tpl}, ссылок #pricing ${r.pricingLinks}`);
  if (r.dead) bad.push(`ссылок на objects.html: ${r.dead}`);
  if (r.canonical !== 'https://privatechouse.ru/') bad.push(`canonical «${r.canonical}»`);
  if (r.glyphs !== 6 || r.icons) bad.push(`рисунков в карточках ${r.glyphs}, иконок в квадратах ${r.icons}`);
  if (r.process || r.procLinks.length !== 4 || r.procLinks.some((h) => h !== 'process') || r.contact !== 'Контакт') bad.push(`«Как работаем»: секция ${r.process}, ссылки ${r.procLinks.join(', ')}, контакт «${r.contact}»`);
  const sv = readFileSync(path.join(root, 'services.html'), 'utf8');
  if ((sv.match(/class="glyph glyph-mini"/g) || []).length !== 6 || /svc-ic/.test(sv) || (sv.match(/<a href="process"[^>]*>Как работаем<\/a>/g) || []).length !== 4) bad.push('страница услуг: шесть мини-рисунков, нет иконок, «Как работаем» → process.html (три меню и подвал)');
  for (const f of readdirSync(path.join(root, 'assets')).filter((x) => x.endsWith('.js'))) if (/addEventListener\(\s*['"](before)?unload['"]/.test(readFileSync(path.join(root, 'assets', f), 'utf8'))) bad.push(`${f}: unload / beforeunload отключает кэш «Назад»`);
  const sm = readFileSync(path.join(root, 'sitemap.xml'), 'utf8'), rb = readFileSync(path.join(root, 'robots.txt'), 'utf8');
  if (['', 'services', 'cases', 'automations', 'process'].some((u) => !sm.includes(`<loc>https://privatechouse.ru/${u}</loc>`)) || (sm.match(/hreflang="en"/g) || []).length !== 5 || /404/.test(sm)) bad.push('sitemap.xml: нет страницы или EN-версии (или есть 404)');
  if (!/User-agent: \*/.test(rb) || !/Sitemap: https:\/\/privatechouse\.ru\/sitemap\.xml/.test(rb)) bad.push('robots.txt');
  await page.close();
  if (bad.length) fail('главная: ' + bad.join('; '));
  else console.log('  ✓ «Делаем один раз. Держим всегда.»: шесть карточек с рисунками на существующие якоря services.html, «Все услуги», без старых пунктов и иконок в квадратах; «Цены» в <template>; «Как работаем» → process.html (три меню и подвал), контакт без номера; нет objects.html и unload; canonical, sitemap.xml, robots.txt');
}

// Страница услуг: как главная — сборка всех секций на трёх ширинах RU и двух EN, ошибки консоли, кириллица в EN.
// На 1440 RU: якоря (существуют, модуль после перехода не под липкой шапкой), <details>, JSON-LD, смена языка, снимки.
console.log('\nстраница услуг (services.html)');
const sfile = path.join(root, 'services.html');
for (const [w, h, tag, lang] of [[1440, 900, 's1440', 'ru'], [1700, 930, 's1700', 'ru'], [390, 844, 's390', 'ru'], [1440, 900, 's1440-en', 'en'], [390, 844, 's390-en', 'en']]) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  const errs = [], bad = [];
  page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|ERR_|Access to font at 'file:/.test(m.text())) errs.push(m.text()); });
  await page.clock.install({ time: new Date('2026-01-01T12:00:00Z') });
  await page.clock.pauseAt(new Date('2026-01-01T12:00:01Z'));
  await page.goto('file://' + sfile + (lang === 'en' ? '?lang=en' : ''));
  const run = (ms) => page.clock.runFor(ms), done = (n) => page.evaluate((q) => document.querySelector(`[data-sec="${q}"]`).classList.contains('s-done'), n);
  await run(4000);
  if (!(await done('hero'))) bad.push('шапка страницы не собралась за 4 с');
  if (tag === 's1440-en') await page.screenshot({ path: path.join(shots, 's1440-en-head.png') });
  if (w === 390) {
    // ↻ на телефоне: видна, только пока её угол лежит на первом экране и не на карточке форматов (первый экран услуг
    // короче окна — под кнопкой уже следующая секция, поэтому кнопка спрятана); ниже — спрятана
    await run(2600); await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' })); await page.waitForTimeout(120); await run(100);
    const p0 = await page.evaluate(() => {
      const p = document.querySelector('[data-pult]'), b = p.getBoundingClientRect(), m = { l: b.left, r: b.left + 44, t: b.bottom - 44, b: b.bottom };
      const h = document.querySelector('[data-sec="hero"]').getBoundingClientRect(), f = document.querySelector('[data-sec="hero"] .sv-fmt').getBoundingClientRect();
      const ok = h.bottom >= m.b && !(f.right > m.l && f.left < m.r && f.bottom > m.t && f.top < m.b);
      return { cls: p.className, ok };
    });
    await page.evaluate(() => window.scrollTo({ top: 3000, behavior: 'instant' })); await page.waitForTimeout(120); await run(100);
    const p1 = await page.evaluate(() => document.querySelector('[data-pult]').className);
    if (!/is-mini/.test(p0.cls) || /is-off/.test(p0.cls) === p0.ok || !/is-off/.test(p1)) bad.push(`↻ на телефоне: в первом экране «${p0.cls}» (место ${p0.ok ? 'свободно' : 'занято'}), ниже «${p1}»`);
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
      return { missing, errs: ld.filter((x) => x.error).length, types: ld.map((x) => x['@type']).join(','), offers: org && org.hasOfferCatalog ? org.hasOfferCatalog.itemListElement.length : 0, faqOk: qs.length === 5 && qs.join('|') === sums.join('|'), qs: qs.length, sums: sums.length };
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

// Автоматизация: ряд главной (порядок схем, колонки, крупный режим, номера объектов), кейсы на странице услуг (схемы
// нарисованы после сборки, на паузе вне экрана), перевод строк схем, снимки.
console.log('\nавтоматизация: «Готовые автоматизации» главной, строки схем, модули услуг');
{
  const bad = [];
  // номера объектов во всём index.html, включая <template>, не повторяются
  const nums = [...readFileSync(file, 'utf8').matchAll(/Объект №(\d+)/g)].map((m) => m[1]);
  const dup = nums.filter((n, i) => nums.indexOf(n) !== i);
  if (dup.length) bad.push(`повторяются номера объектов: ${[...new Set(dup)].join(', ')}`);
  for (const [w, h] of [[1440, 900], [1100, 900], [390, 844]]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await page.goto('file://' + file); await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(300);
    const r = await page.evaluate(() => {
      const a = document.querySelector('#automation'), cards = [...a.querySelectorAll('canvas[data-flow]')].map((c) => c.closest('.obj') || c.parentElement);
      return { flows: [...a.querySelectorAll('canvas[data-flow]')].map((c) => c.dataset.flow).join(','), tops: cards.map((c) => Math.round(c.getBoundingClientRect().top)), win: Math.round(a.querySelector('.flow-win').getBoundingClientRect().width),
        old: /Объект №/.test(a.textContent), text: a.textContent };
    });
    if (r.flows !== 'site-leads,voice-task') bad.push(`${w}: схемы в ряду ${r.flows}`);
    if (w === 1440 && r.tops[0] !== r.tops[1]) bad.push(`1440: карточки 1 и 2 не в одной строке (${r.tops[0]} / ${r.tops[1]})`);
    if (w === 390 && !(r.tops[1] > r.tops[0])) bad.push('390: карточки не друг под другом');
    if ((w === 1440 && r.win < 520) || (w === 1100 && r.win < 400) || (w === 390 && r.win >= 340)) bad.push(`${w}: окно схемы ${r.win} px — не тот режим`);
    if (r.old) bad.push(`${w}: в «Готовых автоматизациях» есть «Объект №»`);
    if (/\d+\s*(дн|час|мин|недел)|не работает|работает/i.test(r.text)) bad.push(`${w}: в текстах секции сроки или «работает»`);
    // снимок ряда: холсты частиц на время снимка скрыты
    const b = await page.evaluate(() => { const e = document.querySelector('#automation').getBoundingClientRect(); return { y: e.top + scrollY, h: e.height }; });
    await page.addStyleTag({ content: '[data-pt-canvas],[data-pt-smoke]{display:none!important}' });
    await page.screenshot({ path: path.join(shots, `home-auto-${w}.png`), fullPage: true, clip: { x: 0, y: Math.round(b.y), width: w, height: Math.round(b.h) } });
    await ctx.close();
  }
  // EN: снимок ряда; строки схем из scenes.js (от var FLOWS до function pickOne) переведены словарём
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await page.goto('file://' + file + '?lang=en'); await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(300);
    const src = readFileSync(path.join(root, 'assets', 'scenes.js'), 'utf8'), part = src.slice(src.indexOf('var FLOWS'), src.indexOf('function pickOne'));
    const lits = [...new Set([...part.matchAll(/'([^'\n]*[А-Яа-яЁё][^'\n]*)'/g)].map((m) => m[1]))];
    const miss = await page.evaluate((l) => l.filter((x) => window.PTI18N.t(x) === x), lits);
    if (!lits.length || miss.length) bad.push(`строки схем без перевода (${miss.length} из ${lits.length}): ${miss.slice(0, 6).join(' | ')}`);
    const b = await page.evaluate(() => { const e = document.querySelector('#automation').getBoundingClientRect(); return { y: e.top + scrollY, h: e.height }; });
    await page.addStyleTag({ content: '[data-pt-canvas],[data-pt-smoke]{display:none!important}' });
    await page.screenshot({ path: path.join(shots, 'home-auto-en-1440.png'), fullPage: true, clip: { x: 0, y: Math.round(b.y), width: 1440, height: Math.round(b.h) } });
    await ctx.close();
    if (!miss.length) console.log(`  ✓ строки схем переведены: ${lits.length} кириллических строк в FLOWS и пулах «Вашего процесса»`);
  }
  // снимки модулей «Автоматизация» и «AI» страницы услуг (теперь — «Готовые шаблоны» и ссылки на кейсы)
  {
    for (const w of [1440, 390]) {
      const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, reducedMotion: 'reduce' });
      const pg = await ctx.newPage();
      await pg.goto('file://' + path.join(root, 'services.html')); await pg.evaluate(() => document.fonts.ready); await pg.waitForTimeout(300);
      await pg.addStyleTag({ content: '[data-pt-canvas],[data-pt-smoke]{display:none!important}' });
      for (const id of ['automation', 'ai']) {
        const b = await pg.evaluate((i) => { const e = document.getElementById(i).getBoundingClientRect(); return { y: e.top + scrollY, h: e.height }; }, id);
        await pg.screenshot({ path: path.join(shots, `services-${id}-${w}.png`), fullPage: true, clip: { x: 0, y: Math.round(b.y), width: w, height: Math.round(b.h) } });
      }
      await ctx.close();
    }
  }
  if (bad.length) fail('автоматизация: ' + bad.join('; '));
  else console.log('  ✓ «Готовые автоматизации» главной: site-leads и voice-task, две колонки на 1440, одна на 390, окно схемы 520+ / 400+ / <340 px, без сроков и «Объект №», номера объектов не повторяются');
}

// Страницы (TASK-pages.md): новые страницы открываются через tools/serve.mjs — так же, как на хостинге (404.html — на
// любой несуществующий адрес, пути от корня).
console.log('\nстраницы: меню, подвал, «Поток»');
const PAGES = ['index.html', 'services.html', 'cases.html', 'automations.html', 'process.html', '404.html'];
const srv = spawn(process.execPath, [path.join(here, 'serve.mjs'), '8097'], { stdio: 'pipe' });
await new Promise((r) => srv.stdout.once('data', r));
const BASE = 'http://localhost:8097/';
// переводы строк — к \n: в клоне на Windows (core.autocrlf) файлы приходят с CRLF, а проверки ищут разметку построчно
const src = Object.fromEntries(PAGES.map((f) => [f, readFileSync(path.join(root, f), 'utf8').replace(/\r\n/g, '\n')]));
const idsOf = (f) => new Set([...src[f].matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
// меню: шапка первого экрана, липкая шапка, меню телефона — четыре пункта, текущая страница — aria-current="page";
// подвал: один footer.foot, разметка совпадает (без aria-current, адресов RU / EN и «/» в начале адресов у 404)
{
  const bad = [];
  const MENU = {
    'index.html': ['services', 'cases', 'automations', 'process'],
    'services.html': ['services', 'cases', 'automations', 'process'],
    'cases.html': ['services', 'cases', 'automations', 'process'],
    'automations.html': ['services', 'cases', 'automations', 'process'],
    'process.html': ['services', 'cases', 'automations', 'process'],
    '404.html': ['/services', '/cases', '/automations', '/process'] };
  const CUR = { 'services.html': 0, 'cases.html': 1, 'automations.html': 2, 'process.html': 3 };
  for (const f of PAGES) {
    const navs = [...src[f].matchAll(/<nav class="(nav|menu-nav)" aria-label="Разделы">([\s\S]*?)<\/nav>/g)];
    if (navs.length !== 3) bad.push(`${f}: меню ${navs.length} из 3`);
    for (const [, kind, body] of navs) {
      const as = [...body.matchAll(/<a href="([^"]+)"([^>]*)>([^<]+)<\/a>/g)];
      const got = as.map((m) => m[1]).join(','), names = as.map((m) => m[3]).join(','), cur = as.findIndex((m) => /aria-current="page"/.test(m[2]));
      if (got !== MENU[f].join(',') || names !== 'Что делаем,Работы,Готовые решения,Как работаем') bad.push(`${f} ${kind}: ${names} → ${got}`);
      if (cur !== (f in CUR ? CUR[f] : -1)) bad.push(`${f} ${kind}: текущий пункт ${cur}`);
    }
    for (const w of ['flow-lock', 'Поток', 'Сетевой сервис', 'data-hidden-section="integrations"']) if (src[f].includes(w)) bad.push(`${f}: «${w}»`);
  }
  const foot = (f) => { const m = src[f].match(/<footer[\s\S]*?<\/footer>/g) || []; return m.length === 1 && /<footer[^>]*class="[^"]*\bfoot\b/.test(m[0]) ? m[0].replace(/ aria-current="page"/g, '').replace(/(<a href=")[^"]*(" hreflang=)/g, '$1$2').replace(/href="\//g, 'href="').replace(/src="\//g, 'src="') : `(подвалов ${m.length})`; };
  const f0 = foot('index.html');
  PAGES.forEach((f) => { if (foot(f) !== f0) bad.push(`${f}: подвал отличается от главной`); });
  const fl = [...f0.matchAll(/<a href="([^"]+)"/g)].map((m) => m[1]).filter((h) => !/t\.me|max\.ru|wa\.me|^tel:|^#top$|^#about$|^privacy$|^$/.test(h));
  const sid = idsOf('services.html');
  fl.forEach((h) => { const [p0, id] = h.split('#'), pg = p0 + '.html'; if (!PAGES.includes(pg) || (id && !(pg === 'services.html' ? sid : idsOf(pg)).has(id))) bad.push(`подвал: ссылка ${h} ведёт в никуда`); });
  if (fl.join(',') !== 'services,cases,automations,process,services#faq' || !/t\.me\/dragonborne0/.test(f0)) bad.push(`подвал: разделы ${fl.join(', ')}`);
  // меню на 1024–1280 — одна строка и не наезжает на логотип и кнопки (RU и EN)
  for (const f of ['index.html', 'cases.html', 'process.html']) for (const lang of ['', '?lang=en']) for (const w of [1024, 1199, 1200, 1280]) {
    const page = await browser.newPage({ viewport: { width: w, height: 800 } });
    await page.goto(BASE + f + lang); await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(250);
    const r = await page.evaluate(() => [...document.querySelectorAll('.hero-hdr, .topbar-in')].map((h) => {
      const n = h.querySelector('.nav'), nr = n.getBoundingClientRect(), lt = h.querySelector('.logo-t').getBoundingClientRect(), ar = h.querySelector('.hdr-act').getBoundingClientRect();
      const as = [...n.querySelectorAll('a')], tops = new Set(as.map((a) => Math.round(a.getBoundingClientRect().top))), hi = Math.max(...as.map((a) => a.getBoundingClientRect().height));
      const shown = getComputedStyle(n).display !== 'none', btn = getComputedStyle(h.querySelector('.menu-btn')).display !== 'none';
      if (!shown) return btn && innerWidth < 1200 ? 'ok' : 'меню скрыто, кнопки меню нет';
      return innerWidth >= 1200 && tops.size === 1 && hi < 30 && nr.left - lt.right >= 12 && ar.left - nr.right >= 12 ? 'ok' : `строк ${tops.size}, высота пункта ${Math.round(hi)}, зазоры ${Math.round(nr.left - lt.right)} / ${Math.round(ar.left - nr.right)}`;
    }).filter((x) => x !== 'ok'));
    r.forEach((x) => bad.push(`${f}${lang} ${w}: меню ${x}`));
    await page.close();
  }
  if (bad.length) fail('меню и подвал: ' + bad.join('; '));
  else console.log('  ✓ меню: четыре пункта в трёх местах каждой страницы, адреса по ТЗ, текущая — aria-current; с 1200 px в одну строку без переносов внутри пунктов (ниже — кнопка меню); подвал одинаковый на всех страницах, ссылки на существующие якоря; «Потока» и скрытых «Интеграций» нет');
}

// услуги: без кейсов, схем и «Стоимость: после созвона»; ссылки «Кейсы: …» и «Готовые шаблоны»; длина
console.log('\nуслуги без кейсов, главная: «Кейсы» и «Готовые автоматизации»');
{
  const bad = [], aid = idsOf('automations.html'), cid = idsOf('cases.html');
  const filtersC = new Set([...src['cases.html'].matchAll(/data-filter="([a-z]+)"/g)].map((m) => m[1]));
  // TASK-clarity.md: на телефоне «Что входит» свёрнуто; с «Кто делает» (TASK-about-analytics.md) — +0.6 экрана на телефоне
  for (const [w, h, lim] of [[1440, 900, 7.6], [390, 844, 11.6]]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await page.goto(BASE + 'services.html'); await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(300);
    const r = await page.evaluate(() => ({ n: document.querySelectorAll('.sv-ex, .sv-cases, .sv-nda, canvas[data-flow]').length, len: document.documentElement.scrollHeight / innerHeight,
      cost: [...document.querySelectorAll('.sv-meta div')].filter((d) => /Стоимость/.test(d.textContent)).map((d) => d.closest('[id]').id + ':' + d.querySelector('dd').textContent).join(','),
      cases: [...document.querySelectorAll('a[href^="cases#"]')].map((a) => a.getAttribute('href').split('#')[1]).join(','),
      tpl: [...document.querySelectorAll('.sv-tl a')].map((a) => a.getAttribute('href')).join(','), all: document.querySelectorAll('a.sv-go[href="automations"]').length,
      rows: ['projects', 'subscription'].map((i) => document.getElementById(i)).filter((e) => e && e.classList.contains('row-h') && parseFloat(getComputedStyle(e).scrollMarginTop) === 88).length }));
    if (r.n) bad.push(`услуги ${w}: кейсы и схемы на странице (${r.n})`);
    if (r.len > lim) bad.push(`услуги ${w}: ${r.len.toFixed(2)} экрана (не больше ${lim})`);
    // «Стоимость» до цен владельца нет нигде (TASK-review.md 4.3: «фиксированная» ничего не сообщала)
    if (r.cost) bad.push(`услуги: «Стоимость» — ${r.cost}`);
    if (r.cases !== 'sites,automation,ai' || r.cases.split(',').some((c) => !filtersC.has(c))) bad.push(`услуги: «Кейсы: …» → ${r.cases}`);
    const tp = r.tpl.split(',').map((x) => x.split('#')[1]);
    if (tp.join(',') !== 'site-leads,b24-report,price-monitor,voice-task,reviews,avito-bot' || tp.some((x) => !aid.has(x)) || r.all !== 2) bad.push(`услуги: «Готовые решения» ${r.tpl}, «Все готовые решения» ${r.all}`);
    if (r.rows !== 2) bad.push('услуги: заголовки групп #projects / #subscription — не тонкие строки с отступом 88 px');
    if (w === 1440) console.log(`  · услуги: ${r.len.toFixed(2)} экрана на 1440`); else console.log(`  · услуги: ${r.len.toFixed(2)} экрана на 390`);
    await ctx.close();
  }
  // главная (TASK-polish.md): «Кейсы» — один ряд (Resonara, ИИ-аудитор, демо-сайты) и «Все кейсы →»; «Готовые
  // автоматизации» — две карточки и «Все шаблоны →»; заголовки разделов без кикеров с номером; длина ≤ 5,2 / 8,5 экрана
  const lens = {};
  for (const [w, h] of [[1440, 900], [390, 844]]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await page.goto(BASE + 'index.html'); await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(300);
    const m = await page.evaluate(() => {
      const o = document.querySelector('#objects'), a = document.querySelector('#automation'), nb = (t) => t.replace(/\s+/g, ' ').trim();
      const cards = [...o.querySelectorAll('.obj-grid .obj')].map((c) => ({ k: nb((c.querySelector('.win-tag') || { textContent: '' }).textContent), t: nb((c.querySelector('.obj-h, .card-link') || { textContent: '' }).textContent), mini: !!c.querySelector('canvas[data-mini]') }));
      return { h2: nb(o.querySelector('h2').textContent), cards, more: [...o.querySelectorAll('.more a')].map((x) => x.getAttribute('href') + ' ' + nb(x.textContent)).join(','),
        len: document.documentElement.scrollHeight / innerHeight, ah2: nb(a.querySelector('h2').textContent), aobj: /Объект №/.test(document.body.innerText),
        titles: [...a.querySelectorAll('a.obj-h')].map((x) => x.getAttribute('href')).join(','), amore: [...a.querySelectorAll('.more a')].map((x) => x.getAttribute('href') + ' ' + nb(x.textContent)).join(','),
        dk: nb(document.querySelector('#directions .mono.k').textContent), dmore: [...document.querySelectorAll('#directions .more a')].map((x) => x.getAttribute('href') + ' ' + nb(x.textContent)).join(','),
        btn: nb(document.querySelector('.hero-act .lnk').textContent) + ' → ' + document.querySelector('.hero-act .lnk').getAttribute('href'),
        contact: nb(document.querySelector('#contact .mono.k').textContent) + ' / ' + nb(document.querySelector('#contact h2').textContent),
        price: nb(document.querySelector('template[data-hidden-section="pricing"]').content.querySelector('h2').textContent) };
    });
    lens[w] = m.len;
    if (w === 1440) {
      if (m.h2 !== 'Наши работы' || m.cards.map((c) => c.k).join(' | ') !== 'Сайт игры · интерактив | AI · Битрикс24 | Демо · ваш проект' || m.cards.slice(0, 2).map((c) => c.t).join(' | ') !== 'Resonara: Soulstrings | Разбор каждого звонка' || !m.cards[2].mini || m.more !== 'cases Все работы →') bad.push(`главная «Работы»: ${m.h2}; ${m.cards.map((c) => c.k + ' ' + c.t + (c.mini ? ' (демо)' : '')).join(' | ')}; ${m.more}`);
      m.cards.slice(0, 2).forEach((c) => { if (!src['cases.html'].replace(/&nbsp;/g, ' ').includes('>' + c.t + '<')) bad.push(`главная: кейса «${c.t}» нет на cases.html`); });
      if (m.ah2 !== 'Готовые решения' || m.aobj || m.titles !== 'automations#site-leads,automations#voice-task' || m.amore !== 'automations Все решения →' || m.dmore !== 'services Все направления →' || m.dk !== 'Что делаем') bad.push(`главная «Готовые решения» и «Что делаем»: ${m.dk}, ${m.dmore}, «${m.ah2}», «Объект №» ${m.aobj}, заголовки ${m.titles}, ${m.amore}`);
      m.titles.split(',').forEach((x) => { if (!aid.has(x.split('#')[1])) bad.push(`главная: ${x} — нет такой карточки`); });
      if (m.btn !== 'Смотреть работы → #objects') bad.push(`кнопка первого экрана: ${m.btn}`);
      if (m.contact !== 'Контакт / Расскажите о задаче' || m.price !== 'Цены') bad.push(`контакт «${m.contact}», «Цены» «${m.price}»`);
    }
    if (m.len > (w === 1440 ? 5.4 : 9.0)) bad.push(`главная ${w}: ${m.len.toFixed(2)} экрана (не больше ${w === 1440 ? 5.4 : 9.0})`);
    // снимки: главная целиком и «Кейсы»
    await page.addStyleTag({ content: '[data-pt-canvas],[data-pt-smoke]{display:none!important}' });
    await page.evaluate(() => document.querySelectorAll('img[loading="lazy"]').forEach((i) => { i.loading = 'eager'; })); await page.waitForTimeout(300);
    await fullShot(page, path.join(shots, `home-${w}.png`));
    const b = await page.evaluate(() => { const e = document.querySelector('#objects').getBoundingClientRect(); return { y: e.top + scrollY, h: e.height }; });
    await page.screenshot({ path: path.join(shots, `home-cases-${w}.png`), fullPage: true, clip: { x: 0, y: Math.round(b.y), width: w, height: Math.round(b.h) } });
    await ctx.close();
  }
  [...src['index.html'].matchAll(/href="cases#([^"]+)"/g)].forEach((mm) => { if (!cid.has(mm[1])) bad.push(`главная: cases.html#${mm[1]} — нет такого кейса`); });
  console.log(`  · главная: ${lens[1440].toFixed(2)} экрана на 1440, ${lens[390].toFixed(2)} на 390`);
  if (bad.length) fail(bad.join('; '));
  else console.log('  ✓ услуги: без кейсов, снимков, NDA и схем, «Стоимости» нет, «Кейсы: …» и «Готовые шаблоны» — на существующие якоря; главная: «Наши работы» — Resonara и «Разбор каждого звонка» (как на cases.html, ссылки на панели кейсов) и демо-сайты, «Все работы →»; «Готовые автоматизации» — две карточки, «Все шаблоны →»; ≤ 5,2 / 8,5 экрана');
}

// кейсы: фильтр кликом и по хешу, схемы после смены фильтра в правильном размере, NDA всегда видна, без JS — все
// карточки; два кейса в <template>; каталог: восемь шаблонов и «Под ваш процесс», фильтр, якоря с главной и услуг
console.log('\nкейсы и готовые автоматизации');
{
  const bad = [];
  const open = async (url, w = 1440, h = 900) => {
    const page = await browser.newPage({ viewport: { width: w, height: h } });
    const errs = [];
    page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
    page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|ERR_|Access to font at 'file:/.test(m.text())) errs.push(m.text()); });
    await page.clock.install({ time: new Date('2026-01-01T12:00:00Z') });
    await page.clock.pauseAt(new Date('2026-01-01T12:00:01Z'));
    await page.addInitScript(printsInit);
    await page.goto(BASE + url);
    page.errs = errs;
    return page;
  };
  const state = (page) => page.evaluate(() => ({
    vis: [...document.querySelectorAll('[data-cat]')].filter((c) => !c.hidden && c.getBoundingClientRect().height > 0).map((c) => c.id),
    pressed: [...document.querySelectorAll('[data-filter][aria-pressed="true"]')].map((b) => b.dataset.filter).join(','),
    btns: [...document.querySelectorAll('[data-filter]')].filter((b) => !b.hidden).map((b) => b.dataset.filter || 'all').join(','),
    always: [...document.querySelectorAll('.obj[id]:not([data-cat])')].filter((c) => c.getBoundingClientRect().height > 0).map((c) => c.id).join(','), hash: location.hash }));
  // схемы видимых карточек: каждая нарисована, холст — по размеру окна (после показа из hidden он был нулевым)
  const flowsOk = async (page) => {
    const ids = await page.evaluate(() => [...document.querySelectorAll('[data-cat]')].filter((c) => !c.hidden && c.querySelector('canvas[data-flow]')).map((c) => c.id));
    const out = [];
    for (const id of ids) {
      await page.evaluate((i) => { const e = document.getElementById(i); window.scrollTo({ top: e.getBoundingClientRect().top + scrollY - 120, behavior: 'instant' }); }, id);
      await page.waitForTimeout(120); await page.clock.runFor(2500);
      const r = await page.evaluate((i) => { const cv = document.querySelector(`#${i} canvas[data-flow]`); return { p: window.__scenePrints(`#${i} canvas[data-flow]`)[0], w: cv.width, cw: cv.clientWidth }; }, id);
      if (!r.p || r.cw < 100 || r.w < r.cw - 2) out.push(`${id}: отпечаток ${r.p}, холст ${r.w} при окне ${r.cw}`);
    }
    return out;
  };
  // --- cases.html
  let page = await open('cases.html');
  await page.clock.runFor(4000);
  let st = await state(page);
  const caseIds = st.vis;
  if (caseIds.join(',') !== 'case-resonara,case-antares,case-call-audit,case-studio-os,case-seo-report,case-catalog,case-agents,case-tg-crm' || st.always !== 'case-nda,case-demo' || st.pressed !== '' || st.btns !== 'all,sites,automation,ai,integrations') bad.push(`кейсы: ${JSON.stringify(st)}`);
  const tpl = await page.evaluate(() => { const t = document.querySelector('template[data-hidden-cases]'); return t ? [...t.content.querySelectorAll('.obj')].map((c) => c.querySelector('canvas').dataset.flow + ':' + c.querySelector('.win-tag').textContent.trim()).join(',') : ''; });
  if (tpl !== 'ai-gateway:Инфраструктура · Cloudflare') bad.push(`скрытые кейсы: ${tpl}`);
  const clash = await page.evaluate(() => ['sites', 'automation', 'ai', 'integrations'].filter((i) => document.getElementById(i)));
  if (clash.length) bad.push(`на cases.html есть id, совпадающие с фильтром: ${clash.join(', ')}`);
  await page.click('[data-filter="ai"]'); await page.clock.runFor(800);
  st = await state(page);
  if (st.vis.join(',') !== 'case-call-audit,case-studio-os,case-seo-report,case-agents' || st.always !== 'case-nda,case-demo' || st.pressed !== 'ai' || st.hash !== '#ai') bad.push(`кейсы, фильтр «AI»: ${JSON.stringify(st)}`);
  bad.push(...(await flowsOk(page)).map((x) => 'после «AI» ' + x));
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' })); await page.waitForTimeout(100); await page.clock.runFor(300);
  await page.screenshot({ path: path.join(shots, 'cases-ai-1440.png'), fullPage: true });
  await page.click('[data-filter=""]'); await page.clock.runFor(800);
  st = await state(page);
  if (st.vis.length !== 8 || st.hash !== '') bad.push(`кейсы, «Все»: ${JSON.stringify(st)}`);
  await page.click('[data-filter="integrations"]'); await page.clock.runFor(800);
  st = await state(page);
  if (st.vis.join(',') !== 'case-tg-crm' || st.hash !== '#integrations') bad.push(`кейсы, «Интеграции»: ${JSON.stringify(st)}`);
  await page.click('[data-filter=""]'); await page.clock.runFor(800);
  page.errs.forEach((e) => bad.push('cases.html: ' + e));
  await page.close();
  // по хешу: схемы автоматизации скрыты с самого начала (нулевой размер), потом фильтр «Автоматизация» — нарисованы в размер
  page = await open('cases.html#ai');
  await page.clock.runFor(4000);
  st = await state(page);
  if (st.vis.join(',') !== 'case-call-audit,case-studio-os,case-seo-report,case-agents' || st.pressed !== 'ai') bad.push(`cases.html#ai: ${JSON.stringify(st)}`);
  await page.click('[data-filter="automation"]'); await page.clock.runFor(800);
  st = await state(page);
  if (st.vis.join(',') !== 'case-studio-os,case-seo-report,case-catalog' || st.hash !== '#automation') bad.push(`cases.html#ai → «Автоматизация»: ${JSON.stringify(st)}`);
  bad.push(...(await flowsOk(page)).map((x) => 'cases.html#ai → «Автоматизация» ' + x));
  page.errs.forEach((e) => bad.push('cases.html#ai: ' + e));
  await page.close();
  page = await open('cases.html#automation');
  await page.clock.runFor(1500);
  st = await state(page);
  if (st.vis.join(',') !== 'case-studio-os,case-seo-report,case-catalog' || st.always !== 'case-nda,case-demo' || st.pressed !== 'automation') bad.push(`cases.html#automation: ${JSON.stringify(st)}`);
  await page.close();
  // без JS: все карточки видны, фильтра нет
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, javaScriptEnabled: false });
    const pg = await ctx.newPage();
    await pg.goto(BASE + 'cases.html');
    const r = await pg.locator('[data-cat]').evaluateAll((els) => els.filter((e) => !e.hidden && getComputedStyle(e).display !== 'none').length);
    const fh = await pg.locator('[data-filters]').evaluate((e) => e.hidden);
    if (r !== 8 || !fh) bad.push(`без JS: видно кейсов ${r}, фильтр скрыт ${fh}`);
    await ctx.close();
  }
  // --- automations.html
  page = await open('automations.html');
  await page.clock.runFor(4000);
  st = await state(page);
  const T = ['site-leads', 'voice-task', 'reviews', 'b24-report', 'seo-report', 'catalog', 'avito-bot', 'price-monitor'];
  if (st.vis.join(',') !== T.join(',') || st.always !== 'your-process' || st.btns !== 'all,leads,tasks,goods,reports,ai') bad.push(`каталог: ${JSON.stringify(st)}`);
  const cards = await page.evaluate(() => [...document.querySelectorAll('[data-cat]')].map((c) => ({ id: c.id, flow: c.querySelector('canvas[data-flow]').dataset.flow, need: /^Нужно от\s+вас: \S/.test(c.querySelector('.tp-need').textContent), go: !!c.querySelector('a.tp-go[data-tg^="Хочу подключить «"]'), cases: [...c.querySelectorAll('a[href^="cases#"], a[href^="cases.html#"]')].map((a) => a.getAttribute('href').split('#')[1]), obj: /Объект №/.test(c.textContent) })));
  const cid = idsOf('cases.html');
  cards.forEach((c) => { if (!c.need || !c.go || c.obj || c.cases.some((x) => !cid.has(x))) bad.push(`шаблон ${c.id}: «Нужно от вас» ${c.need}, «Подключить» ${c.go}, «Объект №» ${c.obj}, кейсы ${c.cases.join(',')}`); });
  const links = cards.filter((c) => c.cases.length).map((c) => c.id + '→' + c.cases.join('')).join(',');
  if (links !== 'site-leads→case-tg-crm,seo-report→case-seo-report,catalog→case-catalog') bad.push(`«Работает у клиента»: ${links}`);
  if (cards.map((c) => c.flow).join(',') !== 'site-leads,voice-task,reviews,b24-digest,seo-report,catalog,avito-bot,price-monitor') bad.push(`схемы шаблонов: ${cards.map((c) => c.flow).join(',')}`);
  await page.click('[data-filter="reports"]'); await page.clock.runFor(800);
  st = await state(page);
  if (st.vis.join(',') !== 'b24-report,seo-report,price-monitor' || st.always !== 'your-process' || st.hash !== '#f-reports') bad.push(`каталог, «Отчёты»: ${JSON.stringify(st)}`);
  bad.push(...(await flowsOk(page)).map((x) => 'каталог «Отчёты» ' + x));
  await page.click('[data-filter=""]'); await page.clock.runFor(800);
  const faq = await page.evaluate(() => { const nb = (t) => t.replace(/\s+/g, ' ').trim(); const ld = [...document.querySelectorAll('script[type="application/ld+json"]')].map((x) => JSON.parse(x.textContent)); const f = ld.find((x) => x['@type'] === 'FAQPage'); return { types: ld.map((x) => x['@type']).join(','), ok: !!f && f.mainEntity.map((q) => nb(q.name) + '|' + nb(q.acceptedAnswer.text)).join('#') === [...document.querySelectorAll('.sv-q')].map((d) => nb(d.querySelector('summary').textContent) + '|' + nb(d.querySelector('p').textContent)).join('#'), n: f ? f.mainEntity.length : 0 }; });
  if (faq.types !== 'BreadcrumbList,FAQPage' || !faq.ok || faq.n !== 5) bad.push(`каталог, JSON-LD: ${JSON.stringify(faq)}`);
  if (/\d+\s*(дн|час|недел)|₽/.test(await page.evaluate(() => document.body.innerText))) bad.push('каталог: сроки или цены в тексте');
  page.errs.forEach((e) => bad.push('automations.html: ' + e));
  await page.close();
  // якоря с главной и услуг: карточка существует; переход — карточка собрана и не под липкой шапкой
  const aid = idsOf('automations.html');
  const refs = [...new Set(['index.html', 'services.html', 'cases.html'].flatMap((f) => [...src[f].matchAll(/href="automations#([^"]+)"/g)].map((m) => m[1])))];
  refs.forEach((r) => { if (!aid.has(r)) bad.push(`automations.html#${r} — нет такой карточки`); });
  for (const id of ['reviews', 'price-monitor']) {
    page = await open('automations.html#' + id);
    await page.clock.runFor(3500); await page.waitForTimeout(100);
    const r = await page.evaluate((i) => ({ top: Math.round(document.getElementById(i).getBoundingClientRect().top), done: document.querySelector('[data-sec="templates"]').classList.contains('s-done') }), id);
    if (!r.done || r.top < 64 || r.top > 300) bad.push(`automations.html#${id}: секция ${r.done ? 'собрана' : 'не собрана'}, карточка на ${r.top}px`);
    await page.close();
  }
  // EN: разметка для поисковиков переведена
  for (const f of ['services.html', 'cases.html', 'automations.html']) {
    const pg = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await pg.goto(BASE + f + '?lang=en'); await pg.waitForTimeout(200);
    const left = await pg.evaluate(() => [...document.querySelectorAll('script[type="application/ld+json"]')].map((x) => x.textContent).join('').match(/[А-Яа-яЁё][^"]{0,30}/g) || []);
    if (left.length) bad.push(`${f}?lang=en: в JSON-LD кириллица — ${left.slice(0, 3).join(' | ')}`);
    await pg.close();
  }
  // снимки: кейсы 1440 / 390, каталог 1440 / 390 (reduced motion — всё собрано, схемы — статичный кадр)
  for (const [f, w] of [['cases.html', 1440], ['cases.html', 390], ['automations.html', 1440], ['automations.html', 390]]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, reducedMotion: 'reduce' });
    const pg = await ctx.newPage();
    await pg.goto(BASE + f); await pg.evaluate(() => document.fonts.ready); await pg.waitForTimeout(300);
    await pg.addStyleTag({ content: '[data-pt-canvas],[data-pt-smoke]{display:none!important}' });
    await pg.evaluate(() => document.querySelectorAll('img[loading="lazy"]').forEach((i) => { i.loading = 'eager'; })); await pg.waitForTimeout(400);
    await fullShot(pg, path.join(shots, `${f.replace('.html', '')}-${w}.png`));
    await ctx.close();
  }
  if (bad.length) fail('кейсы и каталог: ' + bad.join('; '));
  else console.log('  ✓ кейсы: восемь, «Под NDA» и демо-сайты, фильтр кликом и по хешу (#ai, #automation, «Интеграции»), схемы после смены фильтра нарисованы в размер, без JS видны все, AI-шлюз в <template>; каталог: восемь шаблонов и «Под ваш процесс», «Нужно от вас», «Подключить», «Работает у клиента» → существующие кейсы, фильтр «Отчёты» (#f-reports), якоря с главной и услуг — на карточки не под шапкой, вопросы = JSON-LD; JSON-LD в EN без кириллицы');
}

// новые страницы, как страница услуг: секции собираются на трёх ширинах RU и двух EN, ошибок нет, кириллицы в EN нет
for (const f of ['cases.html', 'automations.html', 'process.html']) for (const [w, h, lang] of [[1440, 900, 'ru'], [1700, 930, 'ru'], [390, 844, 'ru'], [1440, 900, 'en'], [390, 844, 'en']]) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  const errs = [], bad = [];
  page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|ERR_|Access to font at 'file:/.test(m.text())) errs.push(m.text()); });
  await page.clock.install({ time: new Date('2026-01-01T12:00:00Z') });
  await page.clock.pauseAt(new Date('2026-01-01T12:00:01Z'));
  await page.goto(BASE + f + (lang === 'en' ? '?lang=en' : ''));
  const run = (ms) => page.clock.runFor(ms), done = (n) => page.evaluate((q) => document.querySelector(`[data-sec="${q}"]`).classList.contains('s-done'), n);
  await run(4000);
  if (!(await done('hero'))) bad.push('шапка страницы не собралась за 4 с');
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
  errs.forEach((e) => bad.push(e));
  await page.close();
  const tag = `${f} ${w}×${h} ${lang}`;
  if (bad.length) fail(`${tag}: ` + bad.join('; '));
  else console.log(`  ✓ ${tag}: ${secs.length} секций собраны, ошибок нет${lang === 'en' ? ', кириллицы нет' : ''}`);
}

// 404: через tools/serve.mjs — на вложенном адресе статус 404, стили и скрипты от корня загружены, страница собирается;
// ?lang=en; раскладка без выхода за край; снимок
console.log('\n404');
{
  const bad = [];
  for (const [w, h, q] of [[1440, 900, ''], [390, 844, ''], [1440, 900, '?lang=en']]) {
    const page = await browser.newPage({ viewport: { width: w, height: h } });
    const errs = [], miss = [];
    page.on('pageerror', (e) => errs.push(e.message));
    page.on('response', (r) => { if (r.status() >= 400 && !/nonexistent/.test(r.url())) miss.push(`${r.status()} ${r.url()}`); });
    await page.clock.install({ time: new Date('2026-01-01T12:00:00Z') });
    await page.clock.pauseAt(new Date('2026-01-01T12:00:01Z'));
    const resp = await page.goto(BASE + 'nonexistent/deep/path' + q);
    await page.clock.runFor(4500);
    await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' })); await page.waitForTimeout(150); await page.clock.runFor(3000);
    const r = await page.evaluate(() => ({ nd: [...document.querySelectorAll('[data-sec]')].filter((s) => !s.classList.contains('s-done')).map((s) => s.dataset.sec), robots: (document.querySelector('meta[name="robots"]') || {}).content, h1: document.querySelector('h1 .it').textContent, css: getComputedStyle(document.body).backgroundColor, btns: [...document.querySelectorAll('.nf-act a')].map((a) => a.getAttribute('href')).join(','), sw: document.documentElement.scrollWidth - innerWidth }));
    const tag = `${w} ${q || 'ru'}`;
    if (resp.status() !== 404) bad.push(`${tag}: статус ${resp.status()}`);
    if (miss.length) bad.push(`${tag}: не загрузились ${miss.slice(0, 4).join(', ')}`);
    if (r.nd.length || r.robots !== 'noindex' || r.css !== 'rgb(10, 18, 26)' || r.btns !== '/,/services,/cases,/automations' || r.sw > 1) bad.push(`${tag}: ${JSON.stringify(r)}`);
    if (q) { const left = await page.evaluate(cyrillic); if (left.length || r.h1 !== 'page.') bad.push(`${tag}: кириллица ${left.slice(0, 4).join(' | ')}, H1 «${r.h1}»`); }
    errs.forEach((e) => bad.push(`${tag}: ${e}`));
    if (w === 1440 && !q) { await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' })); await page.waitForTimeout(200); await page.clock.runFor(300); await page.screenshot({ path: path.join(shots, '404-1440.png') }); }
    await page.close();
  }
  for (const w of [320, 390, 768, 1024, 1440, 1920]) {
    const page = await browser.newPage({ viewport: { width: w, height: 900 } });
    await page.goto(BASE + 'cases/abc'); await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(300);
    const out = await page.evaluate(() => [...document.querySelectorAll('#pt-site .sec a, #pt-site .sec p, #pt-site .sec h1')].filter((el) => !el.closest('.an, .wf') && getComputedStyle(el).display !== 'none').filter((el) => { const r = el.getBoundingClientRect(); return r.width && (r.right > innerWidth + 1 || r.left < -1); }).map((el) => el.textContent.trim().slice(0, 20)));
    if (out.length) bad.push(`/cases/abc ${w}: за краем ${out.join(', ')}`);
    await page.close();
  }
  if (bad.length) fail('404: ' + bad.join('; '));
  else console.log('  ✓ /nonexistent/deep/path → 404, ресурсы от корня загружены, секции собраны, noindex, кнопки на /, услуги, кейсы, каталог; ?lang=en без кириллицы; /cases/abc на 320–1920 — ничего за краем');
}
// TASK-polish.md: заголовки без служебных подписей (.an / .wf снаружи и скрыты от чтилок, подписи — в атрибутах), курсив
// с переливом только в h1, нет кикеров с номером раздела, на главной моноширинного текста ≤ 20 %, тире ≤ 1,5 на 100 слов
// (без подвала), штампов нет; демо-сайты на главной и cases.html сменяют друг друга; на cases.html рядов из одной карточки
// нет; снимки последнего ряда кейсов и карточки шаблона с русскими ролями.
console.log('\nтексты и типографика (TASK-polish.md)');
{
  const bad = [], stat = [];
  for (const [f, url] of [['index.html', 'index.html'], ['services.html', 'services.html'], ['cases.html', 'cases.html'], ['automations.html', 'automations.html'], ['process.html', 'process.html'], ['404.html', 'nonexistent/deep/path']]) for (const lang of ['', '?lang=en']) {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await page.goto(BASE + url + lang); await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(300);
    const r = await page.evaluate(() => {
      const nb = (t) => t.replace(/\s+/g, ' ').trim();
      const heads = [...document.querySelectorAll('h1, h2, h3')].filter((h) => h.querySelector('.an, .wf') || /<h|font:|clamp\(|shimmer|×/.test(h.textContent)).map((h) => nb(h.textContent).slice(0, 40));
      const tpl = [...document.querySelectorAll('template')].flatMap((t) => [...t.content.querySelectorAll('h1, h2, h3')]).filter((h) => h.querySelector('.an, .wf')).length;
      const all = [...document.querySelectorAll('.an, .wf'), ...[...document.querySelectorAll('template')].flatMap((t) => [...t.content.querySelectorAll('.an, .wf')])];
      const aria = all.filter((x) => x.getAttribute('aria-hidden') !== 'true').length, txt = all.filter((x) => x.textContent.trim()).length;
      const an = [...document.querySelectorAll('.an')].map((x) => x.getAttribute('data-an')).join('|');
      const it = [...document.querySelectorAll('.it[data-grad]'), ...[...document.querySelectorAll('template')].flatMap((t) => [...t.content.querySelectorAll('.it[data-grad]')])].filter((x) => !x.closest('h1')).length;
      const numK = [...document.querySelectorAll('.mono, .k')].map((x) => nb(x.textContent)).filter((t) => /^\d{2} \//.test(t));
      // моно — доля видимых символов в JetBrains Mono (меню телефона, липкая шапка и пульт не считаются)
      let mono = 0, chars = 0; const tw = document.createTreeWalker(document.getElementById('pt-site'), NodeFilter.SHOW_TEXT); let n;
      while ((n = tw.nextNode())) {
        const pe = n.parentElement; if (!pe || pe.closest('[data-menu], [data-topbar], .pult, template')) continue;
        const cs = getComputedStyle(pe), rc = pe.getBoundingClientRect(); if (!rc.width || cs.visibility === 'hidden' || cs.display === 'none') continue;
        const t = n.nodeValue.replace(/\s+/g, ''); chars += t.length; if (/JetBrains/.test(cs.fontFamily)) mono += t.length;
      }
      const body = [...document.querySelectorAll('.sec:not(.foot)')].map((s) => s.innerText).join('\n');
      const words = (body.match(/[A-Za-zА-Яа-яЁё0-9]+/g) || []).length, dashes = (body.match(/—/g) || []).length;
      const phr = ['а не на баннерах', 'Коротко о', 'Каждый проект', 'без шаблонов'].filter((x) => body.includes(x));
      // исключение — «Каталог, который заполняется сам»: название кейса из TASK-cases-panel.md, тексты владельца финальные
      const which = [...document.querySelectorAll('h2, h3, .obj-h')].map((x) => nb(x.textContent)).filter((t) => /, котор/.test(t) && t !== 'Каталог, который заполняется сам');
      return { heads, tpl, aria, txt, an, it, numK, mono: 100 * mono / Math.max(1, chars), dash: 100 * dashes / Math.max(1, words), phr, which, h1: nb(document.querySelector('h1').textContent) };
    });
    const tag = f + (lang ? ' EN' : '');
    if (r.heads.length || r.tpl) bad.push(`${tag}: служебные подписи в заголовках — ${r.heads.join(' | ') || r.tpl}`);
    if (r.aria || r.txt) bad.push(`${tag}: .an / .wf без aria-hidden ${r.aria}, с текстом в DOM ${r.txt}`);
    if (r.it) bad.push(`${tag}: курсив с переливом вне h1 — ${r.it}`);
    if (r.numK.length) bad.push(`${tag}: кикеры с номером — ${r.numK.join(', ')}`);
    if (!lang) {
      if (r.dash > 1.5) bad.push(`${tag}: тире ${r.dash.toFixed(2)} на 100 слов`);
      if (r.phr.length || r.which.length) bad.push(`${tag}: штампы ${r.phr.join(', ')} ${r.which.join(', ')}`);
      if (f === 'index.html') { if (r.mono > 20) bad.push(`главная: моноширинного ${r.mono.toFixed(1)} %`); if (r.h1 !== 'Сайты, интеграции и автоматизация — с холодной точностью.') bad.push(`H1 главной «${r.h1}»`); }
      stat.push(`${f.replace('.html', '')} тире ${r.dash.toFixed(2)}${f === 'index.html' ? `, моно ${r.mono.toFixed(1)} %` : ''}`);
    }
    // EN: подписи сборки не переводятся (data-an как в RU)
    if (lang && stat.anRu !== undefined && r.an !== stat.anRu) bad.push(`${tag}: data-an изменился в EN`);
    if (!lang) stat.anRu = r.an;
    await ctx.close();
  }
  // демо-сайты: за 30 с подпись [data-mini-label] показывает три разных сайта — на главной и на cases.html
  for (const [url, sel] of [['index.html', '#objects canvas[data-mini]'], ['cases.html', '#case-demo canvas[data-mini]']]) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.clock.install({ time: new Date('2026-01-01T12:00:00Z') });
    await page.clock.pauseAt(new Date('2026-01-01T12:00:01Z'));
    await page.goto(BASE + url); await page.clock.runFor(4000);
    await page.evaluate((q) => { const e = document.querySelector(q); window.scrollTo({ top: e.getBoundingClientRect().top + scrollY - 200, behavior: 'instant' }); }, sel);
    await page.waitForTimeout(150); await page.clock.runFor(3000);
    const names = new Set();
    for (let k = 0; k < 30; k++) { await page.clock.runFor(1000); const t = await page.evaluate((q) => document.querySelector(q).parentElement.querySelector('[data-mini-label]').textContent, sel); const nm = t.split(' · ')[0].trim(); if (nm && !/^\[/.test(nm)) names.add(nm); }
    if (names.size < 3) bad.push(`${url}: за 30 с демо-сайтов ${names.size} (${[...names].join(', ')})`);
    else stat.push(`${url.replace('.html', '')}: демо ${[...names].slice(0, 3).join(', ')}`);
    await page.close();
  }
  // cases.html: при каждом фильтре число видимых карточек чётное, «Под NDA» и демо видны всегда; снимки последнего ряда
  for (const w of [1440, 390]) {
    const page = await browser.newPage({ viewport: { width: w, height: 900 } });
    await page.goto(BASE + 'cases.html?intro=instant'); await page.waitForTimeout(500);
    for (const f of await page.evaluate(() => [...document.querySelectorAll('[data-filter]')].filter((b) => !b.hidden).map((b) => b.dataset.filter))) {
      await page.click(`[data-filter="${f}"]`); await page.waitForTimeout(250); await filterIdle(page);
      const r = await page.evaluate(() => { const v = [...document.querySelectorAll('.obj-grid .obj')].filter((c) => c.getBoundingClientRect().height > 0); return { n: v.length, ids: v.map((c) => c.id), wide: document.getElementById('case-demo').getBoundingClientRect().width > document.getElementById('case-nda').getBoundingClientRect().width * 1.5 }; });
      if ((w > 900 && r.n % 2 && !r.wide) || !r.ids.includes('case-nda') || !r.ids.includes('case-demo')) bad.push(`cases ${w}, фильтр «${f || 'Все'}»: карточек ${r.n}, демо на всю ширину ${r.wide} (${r.ids.join(', ')})`);
    }
    await page.click('[data-filter=""]'); await page.waitForTimeout(250); await filterIdle(page);
    await page.addStyleTag({ content: '[data-pt-canvas],[data-pt-smoke]{display:none!important}' });
    const b = await page.evaluate(() => { const a = document.getElementById('case-nda').getBoundingClientRect(), d = document.getElementById('case-demo').getBoundingClientRect(); return { y: Math.min(a.top, d.top) + scrollY - 16, h: Math.max(a.bottom, d.bottom) - Math.min(a.top, d.top) + 32 }; });
    await page.screenshot({ path: path.join(shots, `cases-last-${w}.png`), fullPage: true, clip: { x: 0, y: Math.round(b.y), width: w, height: Math.round(b.h) } });
    await page.close();
  }
  // карточка шаблона со схемой и русскими ролями (1440)
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(BASE + 'automations.html?intro=instant#site-leads'); await page.waitForTimeout(3500);
    await page.addStyleTag({ content: '[data-pt-canvas],[data-pt-smoke]{display:none!important}' });
    await page.locator('#site-leads').screenshot({ path: path.join(shots, 'tpl-roles-1440.png') });
    await page.close();
  }
  if (bad.length) fail('тексты и типографика: ' + bad.join('; '));
  else console.log(`  ✓ заголовки без служебных подписей, .an / .wf — в атрибутах и aria-hidden (в EN не переводятся), курсив только в h1, кикеров с номером нет, штампов нет; ${stat.join('; ')}; на cases.html рядов из одной карточки нет`);
}
// Структура (TASK-structure.md): data-pt-burst нет ни в одном HTML (конец сборки — тихий); услуги — новый порядок секций,
// «Когда сайт готов» и «Как устроена подписка» по три карточки, раздела «После запуска» нет, вопросов пять; process.html —
// четыре секции по пять шагов (#apps и #ai — метки в общих секциях), одно «Нужно от вас», ссылки на существующие якоря,
// ≤ 3,2 / 6,5 экрана; повторный переход
// в вкладке — data-repeat (не на первой странице и не с ?intro=); sitemap — шесть адресов (политика — без EN); снимки.
console.log('\nструктура: услуги, «Как работаем», сборка без разлёта, повторный переход');
{
  const bad = [], info = [];
  // разлёта нет ни у одной секции; у подвала — небольшой взрыв data-pt-burst="pop"
  readdirSync(root).filter((f) => f.endsWith('.html')).forEach((f) => { if (/data-pt-burst/.test(readFileSync(path.join(root, f), 'utf8').replace(/<footer data-sec="foot" class="sec foot" data-pt-burst="pop">/, ''))) bad.push(`${f}: data-pt-burst`); });
  // услуги
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(BASE + 'services.html?intro=instant'); await page.waitForTimeout(300);
    const r = await page.evaluate(() => ({ order: [...document.querySelectorAll('[data-sec]')].map((s) => s.dataset.sec).join(','),
      after: document.querySelectorAll('#after .sv-path').length, subs: document.querySelectorAll('#sub-how .sv-path').length,
      h2: [...document.querySelectorAll('h2')].map((h) => h.textContent.trim()), q: document.querySelectorAll('.sv-q').length,
      quit: /отказаться от\s+подписки/.test([...document.querySelectorAll('.sv-q summary')].map((x) => x.textContent).join(' ')),
      proc: [...document.querySelectorAll('[data-sec="process"] a')].filter((a) => a.getAttribute('href') === 'process').length,
      steps: document.querySelectorAll('[data-sec="process"] .sv-step').length, care: !!document.querySelector('#after a[href="#care"]'),
      sm: ['after', 'sub-how', 'process'].map((i) => getComputedStyle(document.getElementById(i).querySelector('[style*="scroll-margin-top"]') || document.getElementById(i)).scrollMarginTop).join(',') }));
    if (r.order !== 'hero,process,sites,apps,servers,after,care,automation,ai,subs,faq,contact,foot') bad.push(`услуги: порядок ${r.order}`);
    if (r.after !== 3 || r.subs !== 3 || r.h2.includes('После запуска') || r.q !== 5 || r.quit || r.proc !== 1 || r.steps !== 4 || !r.care || r.sm !== '88px,88px,88px') bad.push(`услуги: ${JSON.stringify({ after: r.after, subs: r.subs, q: r.q, quit: r.quit, proc: r.proc, steps: r.steps, care: r.care, sm: r.sm })}`);
    await page.close();
  }
  // «Как работаем»
  const pid = idsOf('process.html');
  for (const [w, h, lim] of [[1440, 900, 3.45], [390, 844, 7.2]]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await page.goto(BASE + 'process.html'); await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(300);
    const r = await page.evaluate(() => {
      const ids = ['sites', 'servers', 'care', 'automation'];
      return { dirs: ids.map((i) => { const s = document.getElementById(i); return s ? `${i}:${s.querySelectorAll('.sv-step').length}:${s.querySelectorAll('.tp-need').length}:${s.querySelector('h2') ? 1 : 0}` : i + ':нет'; }).join(' '),
        links: [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href')).filter((x) => !/^(https?:|tel:|#top$|\?lang|\.\/)/.test(x) && !/\?lang=/.test(x)),
        len: document.documentElement.scrollHeight / innerHeight, cur: [...document.querySelectorAll('[aria-current="page"]')].map((a) => a.textContent.trim()).join(','),
        h1: document.querySelector('h1').textContent.replace(/\s+/g, ' ').trim(), alias: ['apps', 'ai'].map((i) => { const e = document.getElementById(i); return e ? i + '>' + e.closest('[data-sec]').id : i + ':нет'; }).join(' '),
        secs: document.querySelectorAll('[data-sec^="p-"]').length };
    });
    if (w === 1440) {
      if (r.dirs !== 'sites:5:1:1 servers:5:1:1 care:5:1:1 automation:5:1:1' || r.secs !== 4 || r.alias !== 'apps>sites ai>automation') bad.push(`process.html: направления ${r.dirs}, секций ${r.secs}, якоря ${r.alias}`);
      if (r.h1 !== 'Как мы работаем.' || !/Как работаем/.test(r.cur)) bad.push(`process.html: H1 «${r.h1}», текущий пункт ${r.cur}`);
      r.links.forEach((x) => {
        const [p0, id] = x.split('#'), pg = p0 && !/\.html$/.test(p0) ? p0 + '.html' : p0;
        const ok = !pg ? pid.has(id) : pg === 'automations.html' && /^f-/.test(id || '') ? true : pg === 'privacy.html' ? !id : PAGES.includes(pg) && (!id || idsOf(pg).has(id));
        if (!ok) bad.push(`process.html: ссылка ${x} — нет цели`);
      });
    }
    if (r.len > lim) bad.push(`process.html ${w}: ${r.len.toFixed(2)} экрана (не больше ${lim})`);
    info.push(`process ${w}: ${r.len.toFixed(2)}`);
    await page.addStyleTag({ content: '[data-pt-canvas],[data-pt-smoke]{display:none!important}' });
    await fullShot(page, path.join(shots, `process-${w}.png`));
    await ctx.close();
  }
  // карточка Resonara на «Работах» — подпись над названием крупнее (Manrope 15/500)
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(BASE + 'cases.html?intro=instant'); await page.waitForTimeout(500);
    const k = await page.evaluate(() => { const cs = getComputedStyle(document.querySelector('#case-resonara .site > .win-tag')); return cs.fontFamily.split(',')[0] + ' ' + cs.fontSize + ' ' + cs.fontWeight + ' ' + cs.textTransform; });
    if (!/Manrope 13px 500 none/.test(k)) bad.push(`подпись карточки (плашка в окне): ${k}`);
    await page.addStyleTag({ content: '[data-pt-canvas],[data-pt-smoke]{display:none!important}' });
    await page.locator('#case-resonara').screenshot({ path: path.join(shots, 'cases-resonara-1440.png') });
    await page.close();
  }
  // повторный переход в одной вкладке: первая страница — полная сборка, вторая — быстрая (data-repeat); с ?intro= — без ускорения.
  // Кадры конца сборки первого экрана главной: сразу после «✓ ready» и через 2 с (частицы гаснут на месте, без разлёта)
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.clock.install({ time: new Date('2026-01-01T12:00:00Z') });
    await page.clock.pauseAt(new Date('2026-01-01T12:00:01Z'));
    await page.goto(BASE + 'index.html');
    const rep = () => page.evaluate(() => document.getElementById('pt-site').hasAttribute('data-repeat'));
    const r0 = await rep();
    await page.clock.runFor(2700); await page.waitForTimeout(150);
    const ready = await page.evaluate(() => /ready/.test(document.querySelector('[data-pt-step]').textContent));
    await page.screenshot({ path: path.join(shots, 'd1440-end-ready.png') });
    await page.clock.runFor(2000); await page.waitForTimeout(150);
    await page.screenshot({ path: path.join(shots, 'd1440-end-2s.png') });
    await page.goto(BASE + 'services.html'); await page.clock.runFor(100); const r1 = await rep();
    await page.goto(BASE + 'cases.html?intro=full'); await page.clock.runFor(100); const r2 = await rep();
    if (r0 || !r1 || r2 || !ready) bad.push(`повторный переход: главная ${r0}, услуги ${r1}, ?intro=full ${r2}; «ready» к 2.7 с ${ready}`);
    await page.close();
  }
  const sm = readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
  if (['', 'services', 'cases', 'automations', 'process'].some((u) => !sm.includes(`<loc>https://privatechouse.ru/${u}</loc>`)) || (sm.match(/<url>/g) || []).length !== 6 || (sm.match(/hreflang="en"/g) || []).length !== 5 || !/<url>\s*<loc>https:\/\/privatechouse\.ru\/privacy(\.html)?<\/loc>\s*<\/url>/.test(sm)) bad.push('sitemap.xml: не пять адресов с EN');
  if (bad.length) fail('структура: ' + bad.join('; '));
  else console.log(`  ✓ разлёта (data-pt-burst) нет нигде, у подвала — мягкий выдох; услуги — новый порядок, «Когда сайт готов» и «Как устроена подписка» по три карточки, вопросов пять; «Как работаем» — четыре секции по пять шагов, ссылки на существующие якоря (${info.join(', ')} экрана); подпись карточки — плашка Manrope 13/500 в окне; повторный переход — data-repeat (кроме первой страницы и ?intro=); sitemap — шесть адресов (политика — без EN)`);
}
// Ясность (TASK-clarity.md), часть A: на услугах «Разово» / «Ежемесячно» — крупные заголовки групп; в «Варианте 03» нет
// пересказа сопровождения; «Как устроена подписка» — по три строки «Сайт / Сценарий / Агент» с <b>; блок порядка на
// услугах — «Порядок работы»; «Нужно от вас» в каталоге 14 px, на process.html 15; шапка направления на телефоне —
// рисунок под названием у всех; сводка «Разово / Ежемесячно» на 390 и 414 — направления в одну строку.
console.log('\nясность, часть A: заголовки групп услуг, подписка, «Порядок работы», мелочи');
{
  const bad = [];
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(BASE + 'services.html?intro=instant'); await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(300);
    const r = await page.evaluate(() => ({
      gh: ['projects', 'subscription'].map((i) => { const w = document.querySelector(`#${i} .gh-w`); return w ? w.textContent.trim() + ':' + Math.round(parseFloat(getComputedStyle(w).fontSize)) : i + ':нет'; }),
      oldRow: [...document.querySelectorAll('h2.mono')].map((h) => h.textContent.trim()),
      after: document.getElementById('after').textContent.replace(/\s+/g, ' '),
      subs: [...document.querySelectorAll('#sub-how .sv-path')].map((p) => [...p.querySelectorAll('.list li')].map((li) => (li.querySelector('b') || {}).textContent || '-').join('/')),
      proc: document.querySelector('#process h2').textContent.trim() }));
    if (r.gh.join(',') !== 'Разово:72,Ежемесячно:72') bad.push(`услуги: заголовки групп ${r.gh.join(', ')}`);
    if (r.oldRow.length) bad.push(`услуги: остались мелкие заголовки групп ${r.oldRow.join(', ')}`);
    if (/Хостинг в\s+России и\s+SSL|Техническая часть 152/.test(r.after)) bad.push('услуги: «Вариант 03» пересказывает сопровождение');
    if (r.subs.join(' | ') !== 'Сайт/Сценарий/Агент | Сайт/Сценарий/Агент | Сайт/Сценарий/Данные') bad.push(`услуги: «Как устроена подписка» ${r.subs.join(' | ')}`);
    if (r.proc !== 'Порядок работы') bad.push(`услуги: блок порядка — «${r.proc}»`);
    await page.close();
  }
  // «Нужно от вас»: каталог 14 px, «Как работаем» 15 px
  for (const [f, sel, px] of [['automations.html', '#site-leads .tp-need', '14px'], ['process.html', '.pr-foot .tp-need', '15px']]) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(BASE + f + '?intro=instant'); await page.waitForTimeout(200);
    const fs = await page.evaluate((s) => getComputedStyle(document.querySelector(s)).fontSize, sel);
    if (fs !== px) bad.push(`${f}: «Нужно от вас» ${fs} (нужно ${px})`);
    await page.close();
  }
  // телефон: шапки направлений на process.html — рисунок под названием; сводка форматов — строка направлений одна
  for (const w of [390, 414]) {
    const page = await browser.newPage({ viewport: { width: w, height: 844 } });
    for (const f of ['services.html', 'process.html']) {
      await page.goto(BASE + f + '?intro=instant'); await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(200);
      const r = await page.evaluate(() => ({
        rows: [...document.querySelectorAll('.sv-fl')].map((n) => new Set([...n.querySelectorAll('a')].map((a) => Math.round(a.getBoundingClientRect().top))).size),
        heads: [...document.querySelectorAll('.pr-head')].map((h) => { const t = h.querySelector('.sv-t').getBoundingClientRect(), g = h.querySelector('.sv-lab').getBoundingClientRect(); return g.top >= t.bottom - 1 ? 1 : 0; }) }));
      if (r.rows.some((n) => n !== 1)) bad.push(`${f} ${w}: строки направлений в сводке ${r.rows.join(',')}`);
      if (r.heads.some((x) => !x)) bad.push(`${f} ${w}: рисунок не под названием в шапках ${r.heads.join('')}`);
    }
    await page.close();
  }
  if (bad.length) fail('ясность A: ' + bad.join('; '));
  else console.log('  ✓ «Разово» / «Ежемесячно» — крупные заголовки групп, «Вариант 03» без пересказа, подписка — «Сайт / Сценарий / Агент», «Порядок работы», «Нужно от вас» 14 / 15 px, на 390 и 414 сводка в одну строку и рисунок под названием');
}
// Ясность, B1–B3: фильтры с FLIP-анимацией (через 700 мс у видимых карточек нет transform, resize — один раз и после
// анимаций; reduced motion — сразу; считаются только анимации фильтра — WAAPI, не CSS-переходы сборки); якорь на этой же странице и с другой — отклик на цели (.pt-arrive); подпись карточки —
// плашкой .win-tag в окне (в .obj-tx подписи нет; в каталоге и «Готовых решениях» главной без «Шаблон»); «Нет нужного
// шаблона?» — на всю ширину при нечётном числе видимых карточек.
console.log('\nясность, B1–B3: фильтры и якоря с анимацией, подпись в окне, широкая карточка');
{
  const bad = [];
  // замеры времени — в обычном headless-браузере: под SwiftShader (основной браузер проверки) страница рисуется рывками
  // по 0.2–0.7 с, и анимация на 0.6 с там идёт секунды
  const quick = await chromium.launch();
  // отклики на целях якорей: класс pt-arrive / pt-arrive-x хоть раз появился — запоминаем id или класс цели
  const arriveSpy = () => {
    window.__arr = [];
    new MutationObserver((ms) => ms.forEach((m) => { const t = m.target; if (t.classList && (t.classList.contains('pt-arrive') || t.classList.contains('pt-arrive-x'))) window.__arr.push(t.id || t.className.split(' ')[0]); }))
      .observe(document, { subtree: true, attributes: true, attributeFilter: ['class'] });
  };
  // фильтр каталога: «Заявки» — анимация, итог, один resize после анимаций, широкая «Нет нужного шаблона?»; «Все» — обычная
  {
    const page = await quick.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(BASE + 'automations.html?intro=instant'); await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(600);
    await page.evaluate(() => { document.querySelector('.fl').scrollIntoView(); window.__rz = []; window.addEventListener('resize', () => window.__rz.push(performance.now())); });
    await page.waitForTimeout(200);
    const t0 = await page.evaluate(() => { const t = performance.now(); document.querySelector('[data-filter="leads"]').click(); return t; });
    await page.waitForTimeout(120);
    const mid = await page.evaluate(() => document.getAnimations().filter((a) => a.constructor.name === 'Animation').length);
    await page.waitForTimeout(580);
    const r = await page.evaluate((t0) => {
      const g = document.querySelector('.obj-grid'), vis = [...g.querySelectorAll('.obj')].filter((c) => !c.hidden), own = document.getElementById('your-process');
      return { rz: window.__rz.map((t) => Math.round(t - t0)), tr: vis.filter((c) => getComputedStyle(c).transform !== 'none' || c.getAnimations().some((a) => a.constructor.name === 'Animation')).length,
        vis: vis.map((c) => c.id).join(','), wide: own.classList.contains('is-wide'), ww: Math.round(own.getBoundingClientRect().width), gw: Math.round(g.getBoundingClientRect().width) };
    }, t0);
    if (!mid) bad.push('каталог: смена фильтра без анимации');
    if (r.tr) bad.push(`каталог: через 700 мс у ${r.tr} карточек ещё transform`);
    if (r.rz.length !== 1 || r.rz[0] < 480) bad.push(`каталог: resize ${r.rz.length} раз (${r.rz.join(', ')} мс после клика) — нужен один, после анимаций`);
    if (r.vis !== 'site-leads,avito-bot,your-process' || !r.wide || Math.abs(r.ww - r.gw) > 2) bad.push(`каталог, «Заявки»: ${r.vis}, широкая ${r.wide} (${r.ww} из ${r.gw})`);
    await page.addStyleTag({ content: '[data-pt-canvas],[data-pt-smoke]{display:none!important}' });
    await page.waitForTimeout(1500);
    await page.locator('.obj-grid').screenshot({ path: path.join(shots, 'automations-leads-1440.png') });
    await page.click('[data-filter=""]'); await page.waitForTimeout(900);
    // восемь шаблонов + «Нет нужного шаблона?» — девять карточек, нечётно: последняя на всю ширину (TASK-seo-case.md, 2.2)
    if (!(await page.evaluate(() => document.getElementById('your-process').classList.contains('is-wide')))) bad.push('каталог, «Все» (девять карточек): «Нет нужного шаблона?» не на всю ширину');
    // быстрые клики подряд: итог — последний фильтр, без зависших трансформаций
    await page.click('[data-filter="tasks"]'); await page.waitForTimeout(60); await page.click('[data-filter="ai"]'); await page.waitForTimeout(40); await page.click('[data-filter="reports"]'); await page.waitForTimeout(900);
    const q = await page.evaluate(() => ({ vis: [...document.querySelectorAll('.obj-grid .obj')].filter((c) => !c.hidden).map((c) => c.id).join(','), tr: [...document.querySelectorAll('.obj-grid .obj')].filter((c) => getComputedStyle(c).transform !== 'none' || getComputedStyle(c).opacity !== '1').length }));
    if (q.vis !== 'b24-report,seo-report,price-monitor,your-process' || q.tr) bad.push(`каталог, быстрые клики: ${JSON.stringify(q)}`);
    await page.close();
  }
  // reduced motion: сразу, resize один
  {
    const ctx = await quick.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await page.goto(BASE + 'cases.html'); await page.waitForTimeout(400);
    await page.evaluate(() => { window.__rz = 0; window.addEventListener('resize', () => window.__rz++); document.querySelector('[data-filter="ai"]').click(); });
    const r = await page.evaluate(() => ({ rz: window.__rz, an: document.querySelector('.obj-grid').getAnimations({ subtree: true }).filter((a) => a.constructor.name === 'Animation').length, vis: [...document.querySelectorAll('.obj-grid .obj')].filter((c) => !c.hidden).length }));
    if (r.rz !== 1 || r.an || r.vis !== 6) bad.push(`кейсы, reduced motion: ${JSON.stringify(r)}`);
    await ctx.close();
  }
  // якорь на этой же странице: доезжает быстрее секунды и цель откликается; с другой страницы — отклик после сборки цели
  {
    const page = await quick.newPage({ viewport: { width: 1440, height: 900 } });
    await page.addInitScript(arriveSpy);
    await page.goto(BASE + 'services.html?intro=instant'); await page.waitForTimeout(500);
    const t = await page.evaluate(async () => {
      const t0 = performance.now(), el = document.getElementById('care');
      document.querySelector('.sv-fl a[href="#care"]').click();
      for (let k = 0; k < 120; k++) { await new Promise((r) => setTimeout(r, 25)); if (Math.abs(el.getBoundingClientRect().top - 88) < 2) return Math.round(performance.now() - t0); }
      return -1;
    });
    await page.waitForTimeout(300);
    const a = await page.evaluate(() => window.__arr);
    if (t < 0 || t > 1000) bad.push(`услуги: якорь «Сопровождение» доехал за ${t} мс (не больше 950)`);
    if (!a.includes('care')) bad.push(`услуги: у #care нет отклика по прибытии (${a.join(',')})`);
    await page.evaluate(() => { window.__arr = []; document.querySelector('.sv-fw[href="#subscription"]').click(); }); await page.waitForTimeout(1300);
    const b = await page.evaluate(() => window.__arr);
    if (!b.includes('gh-w')) bad.push(`услуги: «Ежемесячно» — нет отклика заголовка группы (${b.join(',')})`);
    await page.close();
    const p2 = await quick.newPage({ viewport: { width: 1440, height: 900 } });
    await p2.addInitScript(arriveSpy);
    await p2.goto(BASE + 'automations.html?intro=fast#b24-report'); await p2.waitForTimeout(3500);
    const c = await p2.evaluate(() => ({ arr: window.__arr, done: document.getElementById('b24-report').closest('[data-sec]').classList.contains('s-done') }));
    if (!c.done || !c.arr.includes('b24-report')) bad.push(`automations.html#b24-report: собран ${c.done}, отклик ${c.arr.join(',')}`);
    await p2.close();
  }
  // подписи карточек — в окне
  for (const f of ['index.html', 'cases.html', 'automations.html']) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(BASE + f + '?intro=instant'); await page.waitForTimeout(300);
    const r = await page.evaluate(() => {
      const objs = [...document.querySelectorAll('.obj')].concat(...[...document.querySelectorAll('template')].map((t) => [...t.content.querySelectorAll('.obj')]));
      const win = (c) => c.querySelector('.flow-win, .site, canvas[data-mini]');
      return { no: objs.filter((c) => win(c) && c.id !== 'your-process' && c.id !== 'case-nda' && !c.querySelector('.win-tag')).map((c) => c.id || (c.querySelector('.obj-h, .card-link') || {}).textContent),
        mono: objs.filter((c) => c.querySelector('.obj-tx .mono')).length, outside: [...document.querySelectorAll('.win-tag')].filter((t) => !t.parentElement.matches('.flow-win, .site, .fr')).length,
        tpl: [...document.querySelectorAll(/\/automations(\.html)?$/.test(location.pathname) ? '.win-tag' : '#automation .win-tag')].map((t) => t.textContent).filter((x) => /Шаблон/.test(x)) };
    });
    if (r.no.length || r.mono || r.outside || r.tpl.length) bad.push(`${f}: без плашки ${r.no.join(', ') || 0}, подписей в .obj-tx ${r.mono}, плашек вне окна ${r.outside}, «Шаблон» ${r.tpl.join(', ') || 0}`);
    await page.close();
  }
  await quick.close();
  if (bad.length) fail('ясность B1–B3: ' + bad.join('; '));
  else console.log('  ✓ фильтр — FLIP за ~0.6 с, resize один и после анимаций, быстрые клики и reduced motion без зависаний; якорь доезжает быстрее секунды, цель откликается (и после перехода с другой страницы); подписи карточек — плашкой в окне, без «Шаблон»; «Нет нужного шаблона?» широкая при нечётном числе карточек');
}
// Ясность, B4 / B5 / B8: курсор подсвечивает частицы (слабый толчок, закручивание, R 110, на телефоне выключен); пульт после
// сборки первого экрана укатывается в левый угол (сжатие плашки clip-path, затем сдвиг и поворот кнопки); подвал всех шести
// страниц — data-pt-burst="pop" (небольшой взрыв phPop, был мягкий выдох — его не было видно), у остальных секций атрибута нет.
console.log('\nясность, B4 / B5 / B8: свет курсора, пульт укатывается, взрыв в конце страницы');
{
  const bad = [];
  const eng = readFileSync(path.join(root, 'assets', 'engine.js'), 'utf8');
  if (!/R = mob \? 0 : 110/.test(eng) || !/\* 0\.35 \* f/.test(eng) || /\* 1\.6 \* f/.test(eng)) bad.push('engine.js: курсор всё ещё выметает частицы (нужны R 110, толчок 0.35, на телефоне 0)');
  if (!/function phPop\(/.test(eng) || !/s\.burst === 'pop'\) popWait = s/.test(eng) || !/phPop\(BLD, ps\)/.test(eng) || /phPuff/.test(eng)) bad.push('engine.js: нет phPop или финал подвала не через него');
  for (const f of PAGES) {
    const h = src[f], all = (h.match(/data-pt-burst/g) || []).length, pop = (h.match(/<footer data-sec="foot" class="sec foot" data-pt-burst="pop">/g) || []).length;
    if (all !== 1 || pop !== 1) bad.push(`${f}: data-pt-burst ${all}, у подвала pop ${pop}`);
  }
  // пульт: в обычном headless-браузере (под SwiftShader кадры рывками)
  const quick = await chromium.launch();
  const page = await quick.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(BASE + 'index.html');
  const r = await page.evaluate(() => new Promise((res) => {
    const p = document.querySelector('[data-pult]'), bar = p.querySelector('.pult-bar'), mini = p.querySelector('.pult-mini'), seen = { clip: 0, move: 0, rot: 0 }, t0 = performance.now();
    let x0 = null;
    const f = () => {
      bar.getAnimations().forEach((a) => { if (a.effect.getKeyframes().some((k) => k.clipPath)) seen.clip = 1; });
      p.getAnimations().forEach((a) => { if (a.effect.getKeyframes().some((k) => /translateX/.test(k.transform || ''))) { seen.move = 1; if (x0 == null) x0 = Math.round(p.getBoundingClientRect().left); } });
      mini.getAnimations().forEach((a) => { if (a.effect.getKeyframes().some((k) => /rotate\((\d{3,})/.test(k.transform || ''))) seen.rot = 1; });
      if (seen.move && !p.getAnimations().length && !mini.getAnimations().length) res({ ...seen, x0, left: Math.round(p.getBoundingClientRect().left), cls: p.className, tr: getComputedStyle(mini).transform });
      else if (performance.now() - t0 > 9000) res({ ...seen, x0, cls: p.className, timeout: 1 });
      else requestAnimationFrame(f);
    };
    requestAnimationFrame(f);
  }));
  if (!r.clip || !r.move || !r.rot || r.timeout || !/is-mini/.test(r.cls) || r.left !== 18 || r.tr !== 'none' || !(r.x0 > 300)) bad.push(`пульт не укатился в угол: ${JSON.stringify(r)}`);
  await page.close(); await quick.close();
  if (bad.length) fail('ясность B4 / B5 / B8: ' + bad.join('; '));
  else console.log(`  ✓ курсор — свет (R 110, толчок 0.35, закручивание, на телефоне нет); пульт сжимается и укатывается в угол (от ${r.x0} px до 18, с поворотом); у подвала шести страниц — взрыв, у остальных секций финал тихий`);
}
// Фоновая пыль и взрыв подвала (просьба владельца: «всегда на заднем фоне частицы; при анимации чуть меньше, после каждой —
// обратно»; «на футере небольшой взрыв, попроще»). У пыли свой запас AMB: после сборки на экране почти вся (≥ 85 %), пока
// собирается секция — реже (45–80 %), после — снова ≥ 85 %. Подвал кончается взрывом phPop: частицы вылетают из середины
// подвала — по всему подвалу (с его букв, облако шире половины подвала; просьба владельца: «не концентрируй в одной области,
// пусть разлетаются»), по высоте растёт и за ~1 с гаснет. Пыль не жмётся к краям: в середине экрана (50 % × 50 %) ≥ 15 % точек, над текстом
// первого экрана она приглушена, а не пропадает; курсор посреди экрана её не выметает (через 3 с в круге 110 px — не меньше
// половины равномерного). Счёт — через отладочный крючок: проверка дописывает его в копию engine.js, и
// страница грузит её вместо настоящей (обычный headless-браузер: под SwiftShader кадры рывками).
console.log('\nфоновая пыль и взрыв подвала');
{
  const bad = [], info = [];
  let eng = readFileSync(path.join(root, 'assets', 'engine.js'), 'utf8').replace(/\r\n/g, '\n');
  const at = '      return {\n        setActive';
  if (!eng.includes(at) || !/var AMB = \[\]|AMB = \[\]/.test(eng)) bad.push('engine.js: нет запаса пыли AMB или места для отладочного крючка');
  else if (/inCalm\(x, y\)\) continue/.test(eng)) bad.push('engine.js: пыль над текстом первого экрана не рисуется (дыра посреди экрана)');
  else {
    // dust — видимые точки пыли на экране; pop — свободные видимые частицы сборки (бывают только во вспышке и во взрыве), их центр и разброс
    eng = eng.replace(at, `      window.__dbg = function () { var v = 0, n = 0, sx = 0, sy = 0, sd = 0, pm = -1e9, nb = N - AMB.length;
        for (var i = 0; i < N; i++) { var x = P[i * 2], y = P[i * 2 + 1] + rootTop;
          if (i >= nb) { if (A[i] > 0.05 && y > 0 && y < VH && x > 0 && x < W) v++; } else if (M[i] && A[i] > 0.08) { n++; sx += x; sy += y; if (y > pm) pm = y; } }
        var xs = [], ys = [];
        if (n) { sx /= n; sy /= n; for (i = 0; i < nb; i++) if (M[i] && A[i] > 0.08) { sd += Math.hypot(P[i * 2] - sx, P[i * 2 + 1] + rootTop - sy); xs.push(P[i * 2] + rootLeft); ys.push(P[i * 2 + 1] + rootTop); } sd /= n; }
        xs.sort(function (a, b) { return a - b; }); ys.sort(function (a, b) { return a - b; });
        var q = function (a, f) { return a.length ? a[Math.min(a.length - 1, (a.length * f) | 0)] : 0; };
        return { dust: v / Math.max(1, AMB.length), pop: n, px: sx, py: sy, pd: sd, pm: pm, ex: q(xs, 0.95) - q(xs, 0.05), ey: q(ys, 0.95) - q(ys, 0.05), W: W };
      };
      window.__near = function (cx, cy, rr) { var n = 0, t = 0, c = 0;
        for (var i = N - AMB.length; i < N; i++) { var x = P[i * 2] + rootLeft, y = P[i * 2 + 1] + rootTop; if (!(A[i] > 0.05 && y > 0 && y < VH && x > 0 && x < W)) continue; t++;
          if (x > W * 0.25 && x < W * 0.75 && y > VH * 0.25 && y < VH * 0.75) c++; if (Math.hypot(x - cx, y - cy) < rr) n++; }
        return { n: n, exp: t * Math.PI * rr * rr / (W * VH), mid: t ? c / t : 0 }; };\n` + at);
    const quick = await chromium.launch();
    for (const [w, h] of [[1440, 900], [390, 844]]) {
      const ctx = await quick.newContext({ viewport: { width: w, height: h }, isMobile: w < 760, hasTouch: w < 760 });
      const page = await ctx.newPage();
      await page.route('**/assets/engine.js*', (r) => r.fulfill({ body: eng, contentType: 'application/javascript' }));
      await page.goto(BASE + 'index.html');
      await page.waitForFunction(() => document.querySelector('[data-sec="hero"]').classList.contains('s-done'), null, { timeout: 15000 });
      await page.waitForTimeout(2200);
      const d0 = await page.evaluate(() => window.__dbg().dust);
      const mid = await page.evaluate(() => window.__near(0, 0, 0).mid);
      if (mid < 0.15) bad.push(`${w} px: в середине экрана ${Math.round(mid * 100)} % пыли (равномерно 25)`);
      if (w > 760) {
        await page.mouse.move(700, 440); await page.mouse.move(720, 450, { steps: 5 }); await page.waitForTimeout(3000);
        const nr = await page.evaluate(() => window.__near(720, 450, 110));
        if (nr.n < nr.exp * 0.5) bad.push(`курсор выметает пыль: в круге 110 px ${nr.n} при равномерных ${nr.exp.toFixed(1)}`);
        info.push(`у курсора ${nr.n} точек (равномерно ${Math.round(nr.exp)})`);
        await page.mouse.move(5, 5);
      }
      // секция ниже: доля пыли, пока собирается, и через 2 с после
      const sec = await page.evaluate(() => new Promise((res) => {
        const s = document.querySelectorAll('[data-sec]')[1]; window.scrollTo({ top: s.getBoundingClientRect().top + scrollY - 40, behavior: 'instant' });
        let lo = 1; const t0 = performance.now();
        const f = () => { lo = Math.min(lo, window.__dbg().dust); if (performance.now() - t0 < 1800) requestAnimationFrame(f); else setTimeout(() => res({ lo, after: window.__dbg().dust, done: s.classList.contains('s-done') }), 2000); };
        requestAnimationFrame(f);
      }));
      // подвал: взрыв из его середины, облако растёт и гаснет
      const pop = await page.evaluate(() => new Promise((res) => {
        window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' });
        const foot = document.querySelector('[data-sec="foot"]'); let t1 = 0, max = 0, ey1 = 0, ey2 = 0, ex = 0, cy = 0, fw = 0, end = 0; const t0 = performance.now();
        const f = () => {
          const d = window.__dbg(), now = performance.now();
          const r = foot.getBoundingClientRect();
          if (!t1 && d.pop > 50 && foot.classList.contains('s-done')) { t1 = now; ey1 = d.ey; fw = r.width; }
          if (t1) { max = Math.max(max, d.pop); if (!ey2 && now - t1 > 400) { ey2 = d.ey; ex = d.ex; cy = d.py < r.top ? d.py - r.top : d.py > r.bottom ? d.py - r.bottom : 0; } if (!end && now - t1 > 300 && d.pop === 0) end = Math.round(now - t1); }
          if (end || now - t0 > 12000) res({ max, ey1: Math.round(ey1), ey2: Math.round(ey2), ex: Math.round(ex), fw: Math.round(fw), cy: Math.round(cy), end, after: d.dust }); else requestAnimationFrame(f);
        };
        requestAnimationFrame(f);
      }));
      const tag = w + ' px';
      if (d0 < 0.85) bad.push(`${tag}: после первого экрана видно ${Math.round(d0 * 100)} % пыли`);
      if (!sec.done || sec.lo > 0.8 || sec.lo < 0.45 || sec.after < 0.85) bad.push(`${tag}: пыль на сборке секции — минимум ${Math.round(sec.lo * 100)} %, после ${Math.round(sec.after * 100)} %`);
      // взрыв по всему подвалу (просьба владельца: «не концентрируй все частицы в одной области, пусть разлетаются»): облако
      // шире половины подвала, его центр — на подвале, по высоте оно растёт
      if (pop.max < (w < 760 ? 1000 : 2000) || !pop.end || pop.end > 1500 || pop.ex < pop.fw * (w < 760 ? 0.4 : 0.45) || Math.abs(pop.cy) > 40 || !(pop.ey2 > pop.ey1 + (w < 760 ? 15 : 30))) bad.push(`${tag}: взрыв подвала ${JSON.stringify(pop)}`);
      info.push(`${tag}: пыль ${Math.round(d0 * 100)} % (в середине ${Math.round(mid * 100)} %) → на сборке ${Math.round(sec.lo * 100)} % → ${Math.round(sec.after * 100)} %; взрыв ${pop.max} частиц по ${pop.ex} px из ${pop.fw} ширины подвала, по высоте ${pop.ey1} → ${pop.ey2} px, погас за ${pop.end} мс`);
      await ctx.close();
    }
    await quick.close();
  }
  if (bad.length) fail('пыль и взрыв: ' + bad.join('; '));
  else console.log('  ✓ ' + info.join('; '));
}
// Ревью (TASK-review.md), раздел 1 — первые секунды: до вспышки пульт невидим (visibility: hidden), со вспышкой — виден;
// подпись — «Собрать заново»; объект первого экрана запускается на стадии рамок (.obj-go у секции до s-done, холсты видны);
// заливка главной кнопки первого экрана проявляется вместе с её текстом (90 % — не дальше 150 мс друг от друга).
console.log('\nревью, 1: первые секунды');
{
  const bad = [];
  for (const f of PAGES) {
    const h = src[f];
    if (/Пересобрать блок/.test(h) || !/class="pult-btn" data-pt-replay>Собрать заново</.test(h) || !/aria-label="Собрать этот блок заново"/.test(h)) bad.push(`${f}: подпись пульта не «Собрать заново»`);
  }
  const quick = await chromium.launch();
  const page = await quick.newPage({ viewport: { width: 1440, height: 900 } });
  await page.addInitScript(() => {
    window.__r = []; let t0 = 0;
    const f = () => {
      const p = document.querySelector('[data-pult]'), r = document.getElementById('pt-site'), hs = document.querySelector('[data-sec="hero"]'), b = hs && hs.querySelector('.hero-act a.btn-p'), sp = b && b.querySelector('span'), gl = hs && hs.querySelector('canvas[data-gl]');
      if (p && r) {
        const bg = b ? getComputedStyle(b).backgroundColor : '', a = /rgba\([^)]*?,\s*([\d.]+)\)$/.exec(bg);
        if (!t0 && r.classList.contains('pt-on')) t0 = performance.now();
        window.__r.push({ t: t0 ? Math.round(performance.now() - t0) : -1, on: r.classList.contains('pt-on'), vis: getComputedStyle(p).visibility, cls: hs.className, fill: a ? +a[1] : (bg.startsWith('rgb(') ? 1 : 0), txt: sp ? +getComputedStyle(sp).opacity : 0, gl: gl ? +getComputedStyle(gl).opacity : 0 });
      }
      if (window.__r.length < 600) requestAnimationFrame(f);
    };
    requestAnimationFrame(f);
  });
  await page.goto(BASE + 'index.html');
  await page.waitForFunction(() => document.querySelector('[data-sec="hero"]').classList.contains('s-done'), null, { timeout: 15000 });
  await page.waitForTimeout(800);
  const r = await page.evaluate(() => window.__r);
  const before = r.filter((x) => !x.on), after = r.filter((x) => x.on);
  if (before.some((x) => x.vis !== 'hidden')) bad.push('пульт виден до вспышки');
  if (!after.length || after[after.length - 1].vis !== 'visible') bad.push('после вспышки пульт не виден');
  const go = r.find((x) => /obj-go/.test(x.cls) && !/s-done/.test(x.cls) && x.gl > 0.05);
  if (!go) bad.push('объект первого экрана не виден до s-done (запускается после текста)');
  const t90 = (k) => { const x = after.find((y) => y[k] >= 0.9); return x ? x.t : -1; };
  const tf = t90('fill'), tt = t90('txt');
  if (tf < 0 || tt < 0 || Math.abs(tf - tt) > 150) bad.push(`заливка главной кнопки ${tf} мс, её текст ${tt} мс`);
  await quick.close();
  if (bad.length) fail('ревью, 1: ' + bad.join('; '));
  else console.log(`  ✓ пульт скрыт до вспышки, подпись «Собрать заново»; объект виден с ${go.t} мс (стадия рамок, до s-done); заливка кнопки ${tf} мс, её текст ${tt} мс`);
}
// Ревью, разделы 2–3: шрифты со своего сервера — ни одного запроса к googleapis / gstatic, Manrope 300 и JetBrains Mono
// загрузились из assets/fonts; TASK-one-font.md: Cormorant нет — ни файла, ни preload, ни элемента, у которого он первый в
// font-family (все страницы RU / EN, на «Работах» — и с открытой панелью кейса); иконки сайта и превью ссылки — у всех страниц иконки и theme-color, у всех, кроме 404, og:*
// (og:title = <title>, og:description = description, og:url = canonical); /favicon.svg, /favicon.ico, /apple-touch-icon.png,
// /assets/og.jpg и иконки 192 / 512 отдают 200; в EN og:title и og:description переведены, og:locale — en_US.
console.log('\nревью, 2–3: свои шрифты, иконка сайта, превью ссылки');
{
  const bad = [], info = [];
  for (const f of PAGES) {
    const h = src[f], head = h.slice(0, h.indexOf('</head>'));
    if (/googleapis|gstatic/.test(h)) bad.push(`${f}: ссылка на Google Fonts`);
    const pre = [...head.matchAll(/<link rel="preload" href="([^"]+)" as="font" type="font\/woff2" crossorigin>/g)].map((m) => m[1].replace(/^\//, ''));
    // TASK-qa.md: ещё начертание H1 — Manrope 300 latin (пробелы и латиница в H1): иначе H1 сначала набирался вперемешку со
    // шрифтом-заменой и на 412 px переносился иначе (сдвиг раскладки). Cormorant больше нет (TASK-one-font.md)
    if (pre.join() !== 'assets/fonts/manrope-cyrillic-300-normal.woff2,assets/fonts/manrope-cyrillic-400-normal.woff2,assets/fonts/manrope-latin-300-normal.woff2') bad.push(`${f}: preload шрифтов ${pre.join(', ') || 'нет'}`);
    for (const re of [/<link rel="icon" href="\/?favicon\.svg" type="image\/svg\+xml">/, /<link rel="icon" href="\/?favicon\.ico" sizes="any">/, /<link rel="apple-touch-icon" href="\/?apple-touch-icon\.png">/, /<meta name="theme-color" content="#0A121A">/]) if (!re.test(head)) bad.push(`${f}: нет ${re.source.slice(0, 40)}`);
    const og = (k) => (new RegExp(`<meta property="og:${k}" content="([^"]*)">`).exec(head) || [])[1];
    if (f === '404.html') { if (/og:/.test(head)) bad.push('404.html: og:* не нужны'); continue; }
    const t = (/<title>(.*?)<\/title>/.exec(head) || [])[1], d = (/<meta name="description" content="([^"]*)">/.exec(head) || [])[1], c = (/<link rel="canonical" href="([^"]*)">/.exec(head) || [])[1];
    if (og('title') !== t || og('description') !== d || og('url') !== c || og('image') !== 'https://privatechouse.ru/assets/og.jpg' || og('image:width') !== '1200' || og('image:height') !== '630' || og('type') !== 'website' || og('locale') !== 'ru_RU' || !/<meta name="twitter:card" content="summary_large_image">/.test(head)) bad.push(`${f}: og:* не совпадают с title / description / canonical`);
  }
  if (/Cormorant/i.test(readFileSync(new URL('../assets/site.css', import.meta.url), 'utf8'))) bad.push('site.css: Cormorant ещё упомянут');
  for (const u of ['favicon.svg', 'favicon.ico', 'apple-touch-icon.png', 'assets/og.jpg', 'assets/icons/icon-192.png', 'assets/icons/icon-512.png']) {
    const r = await fetch(BASE + u); if (r.status !== 200) bad.push(`/${u}: ${r.status}`);
  }
  const quick = await chromium.launch();
  for (const f of PAGES) {
    for (const q of f === '404.html' ? [''] : ['', '?lang=en']) {
      const page = await quick.newPage({ viewport: { width: 1440, height: 900 } });
      const ext = [], fonts = [];
      page.on('request', (r) => { const u = r.url(); if (/googleapis|gstatic/.test(u)) ext.push(u); if (/\.woff2(\?|$)/.test(u)) fonts.push(u); });
      await page.goto(BASE + (f === '404.html' ? 'nonexistent/deep/path' : f) + q);
      const r = await page.evaluate(async () => {
        await document.fonts.ready;
        await Promise.all([document.fonts.load('300 16px Manrope', 'Аб'), document.fonts.load('400 16px "JetBrains Mono"', 'Аб')]);
        if (window.PTCases) { window.PTCases.open('case-resonara'); await new Promise((ok) => setTimeout(ok, 300)); }
        // первым в font-family нигде не Cormorant (и в псевдоэлементах)
        const corm = []; for (const e of document.querySelectorAll('*')) for (const ps of [null, '::before', '::after']) { const ff = getComputedStyle(e, ps).fontFamily; if (/^\s*["']?Cormorant/i.test(ff)) corm.push((e.className && e.className.baseVal === undefined ? e.tagName.toLowerCase() + '.' + String(e.className).split(' ')[0] : e.tagName.toLowerCase()) + (ps || '')); }
        const og = (k) => { const m = document.querySelector(`meta[property="og:${k}"]`); return m ? m.content : null; };
        return { m3: document.fonts.check('300 16px Manrope', 'Аб'), jb: document.fonts.check('400 16px "JetBrains Mono"', 'Аб'), corm: [...new Set(corm)].slice(0, 6), t: og('title'), d: og('description'), loc: og('locale') };
      });
      if (ext.length) bad.push(`${f}${q}: запросы к Google — ${ext.length}`);
      if (!r.m3 || !r.jb) bad.push(`${f}${q}: шрифты не загрузились (${JSON.stringify(r)})`);
      if (r.corm.length) bad.push(`${f}${q}: Cormorant у ${r.corm.join(', ')}`);
      if (fonts.some((u) => /cormorant/i.test(u))) bad.push(`${f}${q}: грузится Cormorant`);
      if (fonts.some((u) => !/\/assets\/fonts\//.test(u))) bad.push(`${f}${q}: шрифт не из assets/fonts`);
      if (q && (/[А-Яа-яЁё]/.test(r.t + r.d) || r.loc !== 'en_US')) bad.push(`${f}${q}: og:* не переведены (${r.t} / ${r.loc})`);
      if (f === 'index.html' && !q) info.push(`главная: ${fonts.length} файлов шрифтов из assets/fonts`);
      await page.close();
    }
  }
  await quick.close();
  if (bad.length) fail('ревью, 2–3: ' + bad.join('; '));
  else console.log(`  ✓ запросов к Google нет, шрифты из assets/fonts (${info.join('; ')}), preload — начертания первого экрана (Manrope 300 / 400), Cormorant нет ни у одного элемента (RU / EN, панель кейса); иконки, theme-color и og:* на местах (404 — без og), файлы отдают 200, в EN og:* переведены`);
}
// Ревью, раздел 4 — тексты: «ИИ-» нигде (в названиях и подписях — «AI»); описание главной и лид каталога (с его описанием)
// — новые; у «Приложений» — «Формат: разово», у «Сопровождения» нет «Стоимости», теги автоматизации — с чем соединяем
// (не инструменты); демо-карточка — «Ваш сайт — следующий»; вкладка 04 — «Защита», её название — «Защита данных»; в EN —
// «Six services, two formats.» и «…and it's on us.» вместо «accountable / responsible».
console.log('\nревью, 4: тексты');
{
  const bad = [], strip = (h) => h.replace(/&nbsp;/g, ' ');
  const I = readFileSync(path.join(root, 'assets', 'i18n.js'), 'utf8'), HO = readFileSync(path.join(root, 'assets', 'hero-objects.js'), 'utf8');
  for (const f of PAGES) if (/ИИ/.test(src[f])) bad.push(`${f}: «ИИ»`);
  if (/ИИ/.test(I) || /'Безопасность'/.test(HO)) bad.push('i18n.js / hero-objects.js: «ИИ» или «Безопасность»');
  const D = 'Сайты, приложения, интеграции с Битрикс24 и Telegram, автоматизация и AI-ассистенты. Смета до старта, код ваш.';
  if (!src['index.html'].includes(`<meta name="description" content="${D}">`)) bad.push('описание главной');
  const L = 'Типовые сценарии для Битрикс24, Telegram и маркетплейсов. Выберите подходящий — подключим под ваши поля и правила.';
  if (!src['automations.html'].includes(`<meta name="description" content="${L}">`) || !strip(src['automations.html']).includes(`<span>${L}</span>`) || /Запускаем по/.test(src['automations.html'])) bad.push('лид и описание каталога');
  const sv = strip(src['services.html']);
  const meta = (id) => { const m = new RegExp(`<article[^>]*id="${id}"[\\s\\S]*?<dl class="sv-meta">([\\s\\S]*?)</dl>`).exec(sv); return m ? m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : ''; };
  if (meta('apps') !== 'Формат разово') bad.push(`«Приложения»: ${meta('apps')}`);
  if (meta('care') !== 'Формат ежемесячно') bad.push(`«Сопровождение»: ${meta('care')}`);
  const chips = (/<article[^>]*id="automation"[\s\S]*?<ul class="sv-chips"[^>]*>([\s\S]*?)<\/ul>/.exec(sv) || [])[1] || '';
  if (chips.replace(/<\/li><li>/g, ' · ').replace(/<\/?li>/g, '') !== 'Битрикс24 · Telegram · Wildberries · Ozon · Авито · Таблицы') bad.push(`теги автоматизации: ${chips}`);
  if (!/<h3 class="sv-sh">Сборка<\/h3><p class="sv-sd">[^<]*n8n/.test(strip(src['process.html']))) bad.push('инструменты на «Как работаем», шаг «Сборка»');
  for (const f of ['index.html', 'cases.html']) if (!strip(src[f]).includes('<span class="obj-h">Ваш сайт — следующий</span>') || !strip(src[f]).includes('<span class="obj-d">Соберём такой же под вашу компанию →</span>') || /Следующий объект/.test(src[f])) bad.push(`${f}: демо-карточка`);
  if (!/<span class="cx-w">Защита<\/span><\/span><span class="usp-n" hidden>Защита данных<\/span>/.test(src['index.html'])) bad.push('вкладка 04 «Кодекса»');
  for (const [k, v] of [['Защита данных', 'Data protection'], ['Защита', 'Security'], ['Шесть направлений в двух форматах.', 'Six services, two formats.'], ['Ваш сайт — следующий', 'Your site could be next'], [D, 'Websites, apps, Bitrix24 and Telegram integrations, automation and AI assistants. Estimate before we start, the code is yours.']])
    if (!I.includes(`'${k}': '${v.replace(/'/g, "\\'")}'`)) bad.push(`EN: ${k} → ${v}`);
  if (/accountable|responsible for it/.test(I) || (I.match(/and it\\'s on us\./g) || []).length !== 2) bad.push('EN: «…and it\'s on us.» не в двух местах (третья строка ушла с группами главной)');
  if (bad.length) fail('ревью, 4: ' + bad.join('; '));
  else console.log('  ✓ «AI» вместо «ИИ», описания главной и каталога, лид каталога, «Формат: разово» у приложений, без «Стоимости», теги автоматизации — с чем соединяем, демо-карточка, «Защита данных», английский');
}
// Ревью, разделы 5–9: на главной в «Что делаем» — два .gh-w («Разово» / «Ежемесячно») со строками как на услугах; у #case-nda
// нет тега в углу, в окне — силуэт (три телефона) и плашка; вторая кнопка контакта внутренних страниц — следующий шаг; ссылка
// «Перейти к содержанию» — первая в <body>, ведёт на #main (он есть, с tabindex), видна только в фокусе; ссылки карточек — от
// 44 px; длина страниц не выросла больше чем на 0.2 экрана (было по TASK-review.md: главная 4.9 / 7.9, услуги 7.2 / 10.8,
// «Как работаем» 3.1 / 6.4, работы 3.7 / 5.8, готовые решения 4.7 / 7.8).
console.log('\nревью, 5–9: группы на главной, NDA, следующий шаг, «к содержанию», зоны нажатия, длина');
{
  const bad = [], info = [], strip = (h) => h.replace(/&nbsp;/g, ' ');
  const dir = (/data-sec="directions"[\s\S]*?<\/section>/.exec(strip(src['index.html'])) || [''])[0];
  const gw = [...dir.matchAll(/<h3 class="gh"><span class="gh-w">([^<]+)<\/span> <span class="gh-m">([^<]+)<\/span><\/h3>\n<p class="row-t">([^<]+)<\/p>/g)].map((m) => m.slice(1).join('/'));
  if (gw.join(' | ') !== 'Разово/проекты/Смета и сроки до старта. Код ваш. | Ежемесячно/подписка/Работает на наших серверах, мы за это отвечаем.') bad.push(`группы на главной: ${gw.join(' | ') || 'нет'}`);
  const nda = (/<article class="glass fr obj" id="case-nda">[\s\S]*?<\/article>/.exec(src['cases.html']) || [''])[0];
  if (/win-tag/.test(nda) || (nda.match(/<i>/g) || []).length !== 3 || !/class="nda-ph" aria-hidden="true"/.test(nda) || !/\[ под NDA \]/.test(nda)) bad.push('карточка «Под NDA»');
  for (const [f, href, t] of [['services.html', 'automations', 'Готовые решения →'], ['process.html', 'services', 'Что делаем →'], ['cases.html', 'services', 'Что делаем →'], ['automations.html', 'cases', 'Работы →']]) {
    // стрелка — через &nbsp; (TASK-qa.md: «→» не уходит на строку одна)
    const c = ((/data-sec="contact"[\s\S]*?<\/section>/.exec(src[f]) || [''])[0]).replace(/&nbsp;/g, ' ');
    if (!c.includes(`<a href="${href}" class="btn btn-g fr"><span>${t}</span></a>`) || /На главную/.test(c)) bad.push(`${f}: вторая кнопка контакта`);
  }
  // на главной второй кнопки нет («Почта» закомментирована до почты владельца)
  if (/class="btn btn-g/.test(((/data-sec="contact"[\s\S]*?<\/section>/.exec(src['index.html']) || [''])[0]).replace(/<!--[\s\S]*?-->/g, ''))) bad.push('index.html: у контакта появилась вторая кнопка');
  for (const f of PAGES) if (!/<body>\n<a class="skip" href="#main">Перейти к(?: |&nbsp;)содержанию<\/a>\n/.test(src[f]) || (src[f].match(/ id="main" tabindex="-1"/g) || []).length !== 1) bad.push(`${f}: «Перейти к содержанию» / #main`);
  // с «Кто делает» (TASK-about-analytics.md): на десктопе заголовок контакта — две строки (+0.18), на телефоне карточка (+0.6)
  // база — после TASK-polish-2.md (карточка основателя и строка «Или:» в контакте: +76 px на телефоне, +60 на десктопе);
  // «Работы» — после TASK-cases-panel.md (седьмая карточка и «Смотреть работу →» / «Как устроено →» под каждой); «Работы» и
  // «Готовые решения» — после TASK-seo-case.md (восьмая работа и восьмой шаблон: на телефоне ещё карточка, на 1440 у каталога ряд)
  const LEN = { 'index.html': [5.25, 8.8], 'services.html': [7.4, 11.55], 'process.html': [3.3, 7.15], 'cases.html': [4.7, 7.95], 'automations.html': [5.35, 9.35] };
  const quick = await chromium.launch();
  for (const [w, h] of [[1440, 900], [390, 844]]) {
    const page = await quick.newPage({ viewport: { width: w, height: h } });
    const len = [];
    for (const f of Object.keys(LEN)) {
      await page.goto(BASE + f + '?intro=instant'); await page.waitForTimeout(400);
      const r = await page.evaluate(() => ({ len: document.documentElement.scrollHeight / innerHeight, skip: getComputedStyle(document.querySelector('.skip')).top, small: [...document.querySelectorAll('a.card-link')].filter((a) => a.getBoundingClientRect().height && a.getBoundingClientRect().height < 43.5).map((a) => a.textContent.trim().slice(0, 20)) }));
      const lim = LEN[f][w < 760 ? 1 : 0] + 0.2;
      if (r.len > lim) bad.push(`${f} ${w}: ${r.len.toFixed(2)} экрана (было ${LEN[f][w < 760 ? 1 : 0]})`);
      if (parseFloat(r.skip) >= 0) bad.push(`${f} ${w}: «к содержанию» видна без фокуса`);
      if (r.small.length) bad.push(`${f} ${w}: ссылки карточек ниже 44 px — ${r.small.join(', ')}`);
      if (f === 'cases.html' && w < 760) {
        await page.keyboard.press('Tab');
        const fx = await page.evaluate(() => ({ cls: document.activeElement.className, top: document.activeElement.getBoundingClientRect().top }));
        if (fx.cls !== 'skip' || fx.top < 0) bad.push(`первый Tab: ${JSON.stringify(fx)}`);
      }
      len.push(`${f.replace('.html', '')} ${r.len.toFixed(2)}`);
    }
    info.push(`${w}: ${len.join(', ')}`);
    await page.close();
  }
  await quick.close();
  if (bad.length) fail('ревью, 5–9: ' + bad.join('; '));
  else console.log(`  ✓ «Разово / Ежемесячно» на главной, NDA без тега, следующий шаг в контакте, «Перейти к содержанию» → #main, ссылки карточек от 44 px; длина ${info.join('; ')}`);
}
// «Кто делает» (TASK-about-analytics.md, раздел 1): на всех страницах, кроме 404, в #contact — карточка #about (имя, три пункта
// .who-l, монограмма, пока нет фото); в подвале последним пунктом «О студии» → #about (на 404 — /#about); на 1440 карточка справа
// от «Расскажите о задаче», на 390 — под кнопкой; в EN — по-английски.
console.log('\nкто делает: карточка в контакте, «О студии» в подвале');
{
  const bad = [];
  for (const f of PAGES) {
    const h = src[f], c = (/<section data-sec="contact"[\s\S]*?<\/section>/.exec(h) || [''])[0];
    const nav = (/<nav class="foot-col foot-nav"[\s\S]*?<\/nav>/.exec(h) || [''])[0], last = [...nav.matchAll(/<a href="([^"]+)"[^>]*>([^<]+)<\/a>/g)].pop();
    if (!last || last[2].replace(/&nbsp;/g, ' ') !== 'О студии' || last[1] !== (f === '404.html' ? '/#about' : '#about')) bad.push(`${f}: последний пункт подвала — ${last ? last[2] + ' → ' + last[1] : 'нет'}`);
    if (f === '404.html') { if (/id="about"/.test(h)) bad.push('404.html: карточка «Кто делает»'); continue; }
    const who = (/<aside class="blk glass fr who" data-blk id="about"[\s\S]*?<\/aside>/.exec(c) || [''])[0];
    if (!who || !/<div class="ct-grid">/.test(c)) { bad.push(`${f}: нет карточки #about в #contact`); continue; }
    if ((who.match(/<li>/g) || []).length !== 3 || !/<p class="who-n" id="who-n">Даниил (<span class="hx" data-grad="[^"]+">)?Давыдовский(<\/span>)?<\/p>/.test(who) || !/class="who-ph mono"[^>]*><b>Д<\/b>/.test(who) || /\[|ЗАПОЛНИТЬ|Каждый проект/.test(who)) bad.push(`${f}: карточка основателя — ${who.slice(0, 80)}`);
    // TASK-founder.md: не «работаю один» — основатель студии, голос «мы»
    if (!/<p class="who-k mono">Основатель студии<\/p>/.test(who) || /веду сам|держу сам|Без(&nbsp;| )менеджеров|Мой налог|Кто делает/.test(h)) bad.push(`${f}: карточка говорит «работаю один»`);
  }
  const quick = await chromium.launch();
  for (const [w, h, q] of [[1440, 900, ''], [390, 844, ''], [1440, 900, '&lang=en']]) {
    const page = await quick.newPage({ viewport: { width: w, height: h } });
    await page.goto(BASE + 'cases.html?intro=instant' + q); await page.waitForTimeout(500);
    const r = await page.evaluate(() => {
      const a = document.getElementById('about').getBoundingClientRect(), b = document.querySelector('#contact .ct-grid > .blk:not(.who)').getBoundingClientRect(), btn = document.querySelector('#contact .btn-p').getBoundingClientRect();
      return { right: a.left > b.left + b.width * 0.5, below: a.top >= btn.bottom, w: Math.round(a.width), n: document.getElementById('who-n').textContent, k: document.querySelector('.who-k').textContent, mono: document.querySelector('.who-ph b').textContent };
    });
    if (w === 1440 && (!r.right || r.w > 521)) bad.push(`1440${q}: карточка не справа (${JSON.stringify(r)})`);
    if (w === 390 && !r.below) bad.push(`390: карточка не под кнопкой (${JSON.stringify(r)})`);
    if (q && (r.n !== 'Daniil Davydovsky' || r.k !== 'Founder' || r.mono !== 'D')) bad.push(`EN: ${JSON.stringify(r)}`);
    await page.close();
  }
  await quick.close();
  if (bad.length) fail('кто делает: ' + bad.join('; '));
  else console.log('  ✓ карточка #about в контакте пяти страниц (справа на 1440, под кнопкой на 390, по-английски в EN), «О студии» последним пунктом подвала');
}
// Реквизиты и политика (TASK-about-analytics.md, раздел 2; TASK-founder.md): в подвале всех страниц (и политики) под .foot-tag —
// одна ссылка «Политика конфиденциальности», без ФИО, ИНН и кнопки [data-ck-open]; «ИНН», «самозанят…», полное ФИО — только в
// политике (оператора ПД закон требует назвать), она — от лица «Оператора», без «я» / «мне»; в ней кнопка «Настройки cookie»
// (скрыта без JS, вместо неё фраза в <noscript>); заглушек [ЗАПОЛНИТЬ] / [ФИО] / [ИНН] нет нигде; privacy.html отдаёт 200, без
// engine.js, scenes.js, i18n.js, data-sec и переключателя языка, «Политика конфиденциальности», колонка до 720 px, текст 16 px.
console.log('\nреквизиты и политика конфиденциальности');
{
  const bad = [];
  const pv = readFileSync(path.join(root, 'privacy.html'), 'utf8').replace(/\r\n/g, '\n');
  const all = { ...src, 'privacy.html': pv };
  for (const [f, h] of Object.entries(all)) {
    if (/\[(ЗАПОЛНИТЬ|ФИО|ИНН|Имя)/.test(h)) bad.push(`${f}: заглушка данных владельца`);
    const pre = f === '404.html' ? '/' : '';
    if (!h.includes(`<p class="foot-req"><a href="${pre}privacy">Политика конфиденциальности</a></p>`)) bad.push(`${f}: ссылка на политику в подвале`);
    const ft = (/<footer[\s\S]*?<\/footer>/.exec(h) || [''])[0];
    if (/data-ck-open/.test(ft)) bad.push(`${f}: «Настройки cookie» в подвале`);
    if (f !== 'privacy.html' && /ИНН|[Сс]амозанят|Давыдовский Даниил Дмитриевич/.test(h)) bad.push(`${f}: ФИО / ИНН / «самозанятый» вне политики`);
  }
  if (!/Оператор&nbsp;— Давыдовский Даниил Дмитриевич, ИНН 027816319319 \(далее&nbsp;— «Оператор»\)/.test(pv) || /[Сс]амозанят|«я»| мне |[Яя]&nbsp;|\bя\b/.test(pv.replace(/<!--[\s\S]*?-->/g, '')) || !/<span class="pv-ck" hidden>[^<]*<button type="button" class="pv-ckb" data-ck-open>Настройки cookie<\/button>[^<]*<\/span><noscript>[^<]*очистите cookie сайта в(&nbsp;| )настройках браузера/.test(pv)) bad.push('privacy.html: оператор, «я» / «самозанятый» или «Настройки cookie»');
  if (/engine\.js|scenes\.js|i18n\.js|data-sec=|data-lang=|data-pt-canvas/.test(pv.replace(/<!--[\s\S]*?-->/g, '')) || !/<h1>Политика конфиденциальности<\/h1>/.test(pv) || /name="robots"/.test(pv)) bad.push('privacy.html: движок, словарь, переключатель языка, noindex или нет заголовка');
  if (!/пишете студии в&nbsp;Telegram, Max или WhatsApp либо звоните по&nbsp;телефону/.test(pv) || !/Max&nbsp;— российский сервис, Telegram и&nbsp;WhatsApp&nbsp;— зарубежные/.test(pv) || (pv.match(/href="tel:\+79090243995"/g) || []).length < 3) bad.push('privacy.html: не все каналы обращения (Telegram, Max, WhatsApp, телефон)');
  const r = await fetch(BASE + 'privacy.html'); if (r.status !== 200) bad.push(`privacy.html: ${r.status}`);
  const quick = await chromium.launch();
  for (const [w, h] of [[1440, 900], [390, 844]]) {
    const page = await quick.newPage({ viewport: { width: w, height: h } });
    const errs = []; page.on('pageerror', (e) => errs.push(e.message));
    await page.goto(BASE + 'privacy.html'); await page.waitForTimeout(400);
    const d = await page.evaluate(() => ({ w: document.querySelector('.doc-in').getBoundingClientRect().width, fs: getComputedStyle(document.querySelector('.doc-in p')).fontSize, lh: parseFloat(getComputedStyle(document.querySelector('.doc-in p')).lineHeight) / 16, h2: getComputedStyle(document.querySelector('.doc-in h2')).fontSize, over: document.documentElement.scrollWidth > innerWidth + 1, menu: document.querySelectorAll('.nav a, .menu-nav a').length }));
    if (d.w > 720.5 || d.fs !== '16px' || Math.abs(d.lh - 1.7) > 0.02 || d.h2 !== '22px' || d.over || d.menu !== 12) bad.push(`privacy.html ${w}: ${JSON.stringify(d)}`);
    if (errs.length) bad.push(`privacy.html ${w}: ${errs.join(' | ')}`);
    await page.close();
  }
  await quick.close();
  if (bad.length) fail('реквизиты и политика: ' + bad.join('; '));
  else console.log('  ✓ в подвале — только ссылка на политику; ФИО и ИНН — только в политике, от лица «Оператора», «Настройки cookie» в ней; privacy.html — 200, без движка и EN, колонка 720 px, текст 16 / 1.7, h2 22 px');
}
// Cookie и Метрика (TASK-about-analytics.md, раздел 3–4): consent.js последним на всех страницах; первый заход — до клика нет
// запросов к mc.yandex.ru и cookie _ym*, плашка появляется после сборки первого экрана (не раньше); «Отклонить» — после
// перезагрузки плашки нет, запросов нет; «Принять» — после первого экрана запрос mc.yandex.ru/metrika/tag.js; при 'yes' клик по
// Telegram — reachGoal('tg', …) (заглушка window.ym); YM_ID = 0 — плашки нет; EN — плашка по-английски; privacy.html — плашка
// сразу; на главной — yandex-verification. Метрику по-настоящему не грузим: запросы перехватываются.
console.log('\ncookie и Метрика');
{
  const bad = [];
  for (const f of PAGES) { const sc = [...src[f].matchAll(/<script src="([^"]+)"/g)].map((m) => m[1]); if (!/assets\/consent\.js(\?v=[0-9a-f]+)?$/.test(sc[sc.length - 1] || '')) bad.push(`${f}: consent.js не последним`); }
  if (!/<meta name="viewport"[^>]*>\n<meta name="yandex-verification" content="e874bedbdb6c48e1">/.test(src['index.html'])) bad.push('index.html: нет yandex-verification');
  const cjs = readFileSync(path.join(root, 'assets', 'consent.js'), 'utf8');
  if (!/var YM_ID = [1-9]\d+;/.test(cjs) || /['"]<noscript/.test(cjs)) bad.push('consent.js: номер счётчика или noscript-пиксель');
  const quick = await chromium.launch();
  const mk = async (opts = {}) => {
    const ctx = await quick.newContext({ viewport: { width: 1440, height: 900 } });
    const mc = [];
    await ctx.route('**/mc.yandex.ru/**', (r) => { mc.push(r.request().url()); r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }); });
    if (opts.js) await ctx.route('**/assets/consent.js*', (r) => r.fulfill({ status: 200, contentType: 'application/javascript', body: opts.js }));
    await ctx.addInitScript((o) => {
      if (o.consent) try { localStorage.setItem('pt-consent', o.consent); } catch (e) { /* нет хранилища */ }
      if (o.stub) window.ym = function () { (window.__ym = window.__ym || []).push([].slice.call(arguments)); };
      window.__ck = {}; const t0 = performance.now();
      new MutationObserver(() => {
        const h = document.querySelector('[data-sec="hero"]');
        if (h && h.classList.contains('s-done') && !window.__ck.hero) window.__ck.hero = performance.now() - t0;
        if (document.querySelector('.ck') && !window.__ck.ck) window.__ck.ck = performance.now() - t0;
      }).observe(document, { subtree: true, childList: true, attributes: true, attributeFilter: ['class'] });
    }, opts);
    return { ctx, page: await ctx.newPage(), mc };
  };
  const ckWait = (page, ms = 7000) => page.waitForSelector('.ck', { timeout: ms }).then(() => true, () => false);
  // первый заход, «Отклонить»
  {
    const { ctx, page, mc } = await mk();
    await page.goto(BASE + 'index.html');
    const shown = await ckWait(page);
    const t = await page.evaluate(() => window.__ck), cookies = (await ctx.cookies()).filter((c) => /^_ym/.test(c.name));
    if (!shown) bad.push('первый заход: плашки нет');
    else if (!(t.hero > 0 && t.ck >= t.hero)) bad.push(`плашка раньше сборки первого экрана: ${JSON.stringify(t)}`);
    if (mc.length || cookies.length) bad.push(`до согласия: запросов к Метрике ${mc.length}, cookie _ym ${cookies.length}`);
    const txt = shown ? await page.evaluate(() => document.querySelector('.ck').textContent) : '';
    if (shown && !/Принять/.test(txt)) bad.push(`текст плашки: ${txt}`);
    if (shown) await page.click('.ck .n');
    await page.reload(); await page.waitForTimeout(5500);
    if (await page.$('.ck') || mc.length) bad.push(`после «Отклонить»: плашка ${!!(await page.$('.ck'))}, запросов ${mc.length}`);
    // «Настройки cookie» — в политике (TASK-founder.md): после скрипта видна, клик открывает плашку снова
    await page.goto(BASE + 'privacy.html'); await page.waitForTimeout(600);
    const reopen = await page.evaluate(() => { const b = document.querySelector('[data-ck-open]'); if (document.querySelector('.ck')) return 'плашка уже открыта'; if (!b || b.closest('[hidden]') || !b.offsetParent) return 'скрыта'; b.click(); return document.querySelector('.ck') ? 'ok' : 'нет'; });
    if (reopen !== 'ok') bad.push(`«Настройки cookie»: ${reopen}`);
    await ctx.close();
  }
  // «Принять» — Метрика после первого экрана
  {
    const { ctx, page, mc } = await mk();
    await page.goto(BASE + 'index.html');
    if (await ckWait(page)) { await page.click('.ck .y'); await page.waitForTimeout(3500); }
    if (!mc.some((u) => /mc\.yandex\.ru\/metrika\/tag\.js/.test(u))) bad.push(`после «Принять» нет запроса tag.js (${mc.join(', ') || 'запросов нет'})`);
    if (await page.evaluate(() => localStorage.getItem('pt-consent')) !== 'yes') bad.push('после «Принять» выбор не запомнен');
    await ctx.close();
  }
  // 'yes': цель tg по клику на Telegram
  {
    const { ctx, page } = await mk({ consent: 'yes', stub: true });
    // Метрика — после первого экрана и в простое браузера (requestIdleCallback, не дольше 3 с)
    await page.goto(BASE + 'index.html'); await page.waitForTimeout(7000);
    const calls = await page.evaluate(() => { document.addEventListener('click', (e) => e.preventDefault()); document.querySelector('#contact a[href*="t.me/dragonborne0"]').click(); document.querySelector('footer .foot-ico a[href*="max.ru"]').click(); document.querySelector('footer .foot-ico a[href*="wa.me"]').click(); document.querySelector('footer .foot-ico a[href^="tel:"]').click(); document.querySelector('#contact .ct-alt a[href*="wa.me"]').click(); return (window.__ym || []).map((c) => c[1] + ':' + (c[2] || '') + ':' + JSON.stringify(c[3] || {})); });
    if (!calls.some((c) => /^init:/.test(c)) || !calls.some((c) => /^reachGoal:tg:\{"place":"contact","text":"Хочу обсудить проект\."\}/.test(c)) || !calls.includes('reachGoal:max:{"place":"foot"}') || !calls.includes('reachGoal:wa:{"place":"foot"}') || !calls.includes('reachGoal:phone:{"place":"foot"}') || !calls.includes('reachGoal:wa:{"place":"contact"}')) bad.push(`цели: ${calls.join(' | ')}`);
    if (await page.$('.ck')) bad.push('при согласии плашка показана');
    await ctx.close();
  }
  // YM_ID = 0 — плашки нет
  {
    const { ctx, page } = await mk({ js: cjs.replace(/var YM_ID = \d+;/, 'var YM_ID = 0;') });
    await page.goto(BASE + 'index.html');
    if (await ckWait(page, 5500)) bad.push('YM_ID = 0: плашка показана');
    await ctx.close();
  }
  // EN; privacy.html — сразу
  {
    const { ctx, page } = await mk();
    await page.goto(BASE + 'index.html?lang=en');
    const en = (await ckWait(page)) ? await page.evaluate(() => document.querySelector('.ck').textContent) : '';
    if (!/Accept/.test(en) || /[А-Яа-яЁё]/.test(en)) bad.push(`EN: плашка «${en}»`);
    await page.goto(BASE + 'privacy.html');
    if (!(await ckWait(page, 1500))) bad.push('privacy.html: плашки нет сразу');
    await ctx.close();
  }
  await quick.close();
  if (bad.length) fail('cookie и Метрика: ' + bad.join('; '));
  else console.log('  ✓ до согласия нет Метрики и cookie _ym, плашка после первого экрана, «Отклонить» запоминается, «Настройки cookie» открывают снова, «Принять» грузит tag.js, цели tg (место и текст), max, wa и phone, YM_ID = 0 — без плашки, EN — по-английски, политика — сразу; yandex-verification на главной');
}
// Связь (просьбы владельца): в подвале — иконки Telegram (t.me/dragonborne0), MAX (max.ru), WhatsApp (wa.me/79090243995) и
// телефон (tel:+79090243995) — 44 px, с подписями; в обеих шапках «Обсудить проект» — список [data-cm] из тех же четырёх каналов
// (Telegram и WhatsApp — с черновиком), открывается кнопкой, закрывается Esc (фокус — на кнопку), в окне; в меню — MAX, WhatsApp,
// «Позвонить». Иконки — Tabler (лицензия в assets/icons), знак MAX — присланный владельцем, assets/icons/max.svg (4 раза).
console.log('\nсвязь: подвал, «Обсудить проект», меню');
{
  const bad = [];
  if (!existsSync(path.join(root, 'assets', 'icons', 'max.svg')) || !existsSync(path.join(root, 'assets', 'icons', 'LICENSE-tabler.txt'))) bad.push('нет assets/icons/max.svg или лицензии Tabler');
  const pv = readFileSync(path.join(root, 'privacy.html'), 'utf8').replace(/\r\n/g, '\n');
  for (const [f, h] of Object.entries({ ...src, 'privacy.html': pv })) {
    const ic = (/<p class="foot-ico">([\s\S]*?)<\/p>/.exec(h) || [])[1] || '';
    const a = [...ic.matchAll(/<a href="([^"]+)"[^>]*class="ico fr" aria-label="([^"]+)"[^>]*><(svg|img|span)/g)].map((m) => m[1]);
    if (a.join(' ').replace(/max\.ru\/\S+/, 'max.ru/…') !== 'https://t.me/dragonborne0 https://max.ru/… https://wa.me/79090243995 tel:+79090243995' || /Telegram · @dragonborne0/.test(h)) bad.push(`${f}: подвал ${JSON.stringify(a)}`);
    const cms = [...h.matchAll(/<div class="cm" data-cm>[\s\S]*?<\/div>\n<\/div>/g)].map((m) => m[0]);
    if (cms.length !== 2 || cms.some((c) => !/data-tg="Хочу обсудить проект\."/.test(c) || !/href="https:\/\/max\.ru\//.test(c) || !/href="https:\/\/wa\.me\/79090243995" target="_blank" rel="noopener" data-wa=/.test(c) || !/href="tel:\+79090243995"/.test(c))) bad.push(`${f}: списков «Обсудить проект» ${cms.length} или в них не все каналы`);
    const alt = (/<p class="ct-alt foot-ico">([\s\S]*?)<\/p>/.exec(h) || [])[1];
    if ((h.match(/<img class="ic-max" src="\/?assets\/icons\/max\.svg"/g) || []).length !== (alt ? 5 : 4)) bad.push(`${f}: знак MAX не в ${alt ? 'пяти' : 'четырёх'} местах`);
    if (/class="ico( fr)?" aria-label="Написать в (Telegram|Max)"/.test(h.replace(/<p class="foot-ico">[\s\S]*?<\/p>/, '').replace(/<p class="ct-alt foot-ico">[\s\S]*?<\/p>/, ''))) bad.push(`${f}: в шапке остались отдельные иконки`);
    // контакт: «Или:» — MAX, WhatsApp с черновиком, телефон; Telegram в строке нет (он — главная кнопка)
    if (/data-sec="contact"/.test(h) && (!alt || [...alt.matchAll(/<a href="([^"]+)"/g)].map((m) => m[1].replace(/max\.ru\/\S+/, 'max.ru/…')).join(' ') !== 'https://max.ru/… https://wa.me/79090243995 tel:+79090243995' || !/data-wa="Хочу обсудить проект\."/.test(alt))) bad.push(`${f}: строка «Или:» в контакте`);
  }
  const quick = await chromium.launch();
  for (const [w, h, q] of [[1440, 900, ''], [390, 844, ''], [390, 844, '&lang=en']]) {
    const page = await quick.newPage({ viewport: { width: w, height: h } });
    await page.goto(BASE + 'index.html?intro=instant' + q); await page.waitForTimeout(500);
    const [ft, ca] = await page.evaluate(() => ['footer .foot-ico a', '#contact .ct-alt a'].map((sel) => [...document.querySelectorAll(sel)].map((a) => { const b = a.getBoundingClientRect(); return { l: a.getAttribute('aria-label'), w: Math.round(b.width), h: Math.round(b.height) }; })));
    if (ft.length !== 4 || ft.some((x) => x.w < 44 || x.h < 44 || (q && /[А-Яа-яЁё]/.test(x.l)))) bad.push(`${w}${q}: подвал ${JSON.stringify(ft)}`);
    if (ca.length !== 3 || ca.some((x) => x.w < 44 || x.h < 44 || (q && /[А-Яа-яЁё]/.test(x.l)))) bad.push(`${w}${q}: «Или:» в контакте ${JSON.stringify(ca)}`);
    const btn = '.hero-hdr .cm-btn';
    await page.click(btn); await page.waitForTimeout(250);
    const op = await page.evaluate(() => {
      const p = document.querySelector('.hero-hdr .cm-pop'), r = p.getBoundingClientRect(), as = [...p.querySelectorAll('a')];
      return { open: !p.hidden, exp: document.querySelector('.hero-hdr .cm-btn').getAttribute('aria-expanded'), inView: r.left >= 0 && r.right <= innerWidth && r.top >= 0, n: as.length, tg: as[0].href, wa: as[2].href, cyr: as.some((a) => /[А-Яа-яЁё]/.test(a.textContent)), small: as.filter((a) => a.getBoundingClientRect().height < 44).length, bw: Math.round(document.querySelector('.hero-hdr .cm-btn').getBoundingClientRect().width) };
    });
    if (!op.open || op.exp !== 'true' || !op.inView || op.n !== 4 || op.small) bad.push(`${w}${q}: список не открылся как надо ${JSON.stringify(op)}`);
    if (!/^https:\/\/t\.me\/dragonborne0\?text=/.test(op.tg) || !new RegExp(`^https://wa\\.me/79090243995\\?text=${q ? 'Hello' : '%D0%97'}`).test(op.wa)) bad.push(`${w}${q}: черновики ${op.tg} | ${op.wa}`);
    if (w < 760 && op.bw !== 44) bad.push(`${w}: на телефоне кнопка «Обсудить проект» не круглая (${op.bw} px)`);
    await page.keyboard.press('Escape'); await page.waitForTimeout(150);
    const cl = await page.evaluate(() => ({ hidden: document.querySelector('.hero-hdr .cm-pop').hidden, focus: document.activeElement === document.querySelector('.hero-hdr .cm-btn') }));
    if (!cl.hidden || !cl.focus) bad.push(`${w}${q}: Esc ${JSON.stringify(cl)}`);
    await page.close();
  }
  await quick.close();
  if (bad.length) fail('связь: ' + bad.join('; '));
  else console.log('  ✓ подвал — Telegram, MAX, WhatsApp, телефон (44 px); «Обсудить проект» в обеих шапках — список из четырёх каналов с черновиками, в окне, Esc закрывает; на телефоне — круглая кнопка; знак MAX — файл владельца в цветах сайта');
}
// Ясность, B7 / B9: на «Что делаем» цвет направления — у условий, главной ссылки модуля и подписей карточек, «Проект» и
// «Подписка» в лиде — цветами форматов; демо-сайтов пять, первым — тёмный «Северный юрист», фон чередуется тёмный / светлый.
console.log('\nясность, B7 / B9: цвет на «Что делаем», демо-сайты');
{
  const bad = [];
  const sc = readFileSync(path.join(root, 'assets', 'scenes.js'), 'utf8');
  const tpl = [...sc.slice(sc.indexOf('var TPL = ['), sc.indexOf('TPL.forEach')).matchAll(/\{ name: '([^']+)', bg: '(#[0-9A-Fa-f]{6})'/g)].map((m) => {
    const n = parseInt(m[2].slice(1), 16), lum = 0.2126 * (n >> 16) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255);
    return { name: m[1], dark: lum < 128 };
  });
  if (tpl.length !== 5 || tpl[0].name !== 'Северный юрист' || tpl.some((t, i) => t.dark !== (i % 2 === 0)) || !tpl.some((t) => t.name === 'Посёлок «Сосны»')) bad.push(`демо-сайты: ${tpl.map((t) => t.name + (t.dark ? ' (тёмный)' : ' (светлый)')).join(', ')}`);
  for (const f of ['index.html', 'cases.html']) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.clock.install({ time: new Date('2026-01-01T12:00:00Z') });
    await page.goto(BASE + f + '?intro=instant'); await page.clock.runFor(1500);
    const nm = await page.evaluate(() => document.querySelector('[data-mini-label]').textContent.split(' · ')[0]);
    if (nm !== 'Северный юрист') bad.push(`${f}: первым собирается «${nm}»`);
    await page.close();
  }
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(BASE + 'services.html?intro=instant'); await page.waitForTimeout(400);
    const r = await page.evaluate(() => {
      const rgb = (hex) => `rgb(${parseInt(hex.slice(1, 3), 16)}, ${parseInt(hex.slice(3, 5), 16)}, ${parseInt(hex.slice(5, 7), 16)})`;
      const c = (el) => getComputedStyle(el).getPropertyValue('--c').trim();
      const mods = [...document.querySelectorAll('.sv-mod')].filter((m) => getComputedStyle(m.querySelector('.sv-meta dd')).color !== rgb(c(m)) || getComputedStyle(m.querySelector('.sv-info a.sv-go')).color !== rgb(c(m))).map((m) => m.id);
      const lc = [...document.querySelectorAll('.sv-head .lead .lc')].map((b) => b.textContent + ':' + getComputedStyle(b).color);
      const pf = [...document.querySelectorAll('#after .sv-pf, #sub-how .sv-pf')].map((p) => getComputedStyle(p).color === rgb(c(p.closest('.sv-path'))) ? 1 : 0).join('');
      return { mods, lc, pf };
    });
    if (r.mods.length) bad.push(`услуги: условия и ссылка не цветом направления в ${r.mods.join(', ')}`);
    if (r.lc.join(' | ') !== 'Проект:rgb(142, 216, 248) | Подписка:rgb(159, 229, 209)') bad.push(`услуги, лид: ${r.lc.join(' | ')}`);
    if (r.pf !== '111111') bad.push(`услуги: подписи карточек «Когда сайт готов» / «Как устроена подписка» не цветом карточки (${r.pf})`);
    await page.addStyleTag({ content: '[data-pt-canvas],[data-pt-smoke]{display:none!important}' });
    // снимки видимой области по прямоугольнику: locator.screenshot под SwiftShader не дожидается «стабильного» элемента, а
    // снимок всей длинной страницы с размытыми стёклами не укладывался в 30 с
    for (const [sel, name] of [['.sv-head', 'services-color-top-1440.png'], ['#sites', 'services-color-sites-1440.png']]) {
      await page.evaluate((q) => document.querySelector(q).scrollIntoView({ block: 'center', behavior: 'instant' }), sel);
      await page.waitForTimeout(300);
      const b = await page.evaluate((q) => { const r = document.querySelector(q).getBoundingClientRect(); return { x: Math.max(0, r.left), y: Math.max(0, r.top), width: Math.min(r.width, innerWidth), height: Math.min(r.height, innerHeight - Math.max(0, r.top)) }; }, sel);
      await page.screenshot({ path: path.join(shots, name), clip: b, timeout: 60000 });
    }
    await page.close();
  }
  if (bad.length) fail('ясность B7 / B9: ' + bad.join('; '));
  else console.log('  ✓ условия, главная ссылка модуля и подписи карточек — цветом направления, «Проект» / «Подписка» в лиде — цветами форматов; демо-сайтов пять, первым — тёмный «Северный юрист», тёмный и светлый чередуются');
}
// Ясность, B10 / B11: «Как работаем» — четыре секции, сводка из четырёх ссылок; кнопки действия — сразу в Telegram с
// черновиком (t.me/dragonborne0?text=…; в EN — по-английски, и после смены языка на лету); на телефоне «Что входит»
// свёрнуто до двух строк (кнопка «Ещё N» раскрывает), на десктопе всё видно; «Готовые решения» — одно название везде.
console.log('\nясность, B10 / B11: «Как работаем», кнопки в Telegram, «Что входит» на телефоне, одни слова');
{
  const bad = [], tgText = (h) => { try { return new URL(h).searchParams.get('text') || ''; } catch (e) { return ''; } };
  // кнопки действия на всех страницах: адрес с черновиком; RU — «Здравствуйте!», EN — «Hello!» и без кириллицы
  for (const f of PAGES) for (const lang of ['', '&lang=en']) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(BASE + (f === '404.html' ? 'nonexistent/x' : f) + '?intro=instant' + lang); await page.waitForTimeout(200);
    const r = await page.evaluate(() => [...document.querySelectorAll('[data-tg]')].map((a) => a.getAttribute('href')));
    if (!r.length) bad.push(`${f}: нет кнопок [data-tg]`);
    r.forEach((h) => {
      const t = tgText(h);
      if (!h.startsWith('https://t.me/dragonborne0?text=') || (lang ? !/^Hello! \S/.test(t) || /[А-Яа-яЁё]/.test(t) : !/^Здравствуйте! \S/.test(t))) bad.push(`${f}${lang}: ${t.slice(0, 50) || h}`);
    });
    await page.close();
  }
  // смена языка на лету — черновики пересобираются
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(BASE + 'services.html?intro=instant'); await page.waitForTimeout(400);
    await page.click('.hero-hdr [data-lang="en"]'); await page.waitForTimeout(3500);
    const t = tgText(await page.evaluate(() => document.querySelector('#sites a.sv-go[data-tg]').getAttribute('href')));
    if (t !== "Hello! I'd like to discuss a website.") bad.push(`смена языка: черновик «${t}»`);
    await page.close();
  }
  // «Как работаем»: четыре секции, сводка — четыре ссылки на них
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(BASE + 'process.html?intro=instant'); await page.waitForTimeout(200);
    const r = await page.evaluate(() => ({ secs: [...document.querySelectorAll('[data-sec^="p-"]')].map((s) => s.id + ':' + s.querySelectorAll('.sv-step').length).join(','),
      fmt: [...document.querySelectorAll('.sv-fl a')].map((a) => a.getAttribute('href')).join(','), apps: !!document.getElementById('apps'), ai: !!document.getElementById('ai') }));
    if (r.secs !== 'sites:5,servers:5,care:5,automation:5' || r.fmt !== '#sites,#servers,#care,#automation' || !r.apps || !r.ai) bad.push(`process.html: ${JSON.stringify(r)}`);
    await page.close();
  }
  // «Что входит»: на телефоне две строки и «Ещё N», по нажатию — все; на десктопе всё видно, кнопки нет
  for (const w of [390, 1440]) {
    const page = await browser.newPage({ viewport: { width: w, height: 900 } });
    await page.goto(BASE + 'services.html?intro=instant'); await page.waitForTimeout(400);
    const r = await page.evaluate(() => [...document.querySelectorAll('.sv-rows')].map((u) => {
      const b = document.querySelector(`[aria-controls="${u.id}"]`), n = u.children.length;
      return { id: u.id, n, vis: [...u.children].filter((li) => li.offsetHeight).length, btn: b && b.offsetHeight ? [...b.querySelectorAll('span')].filter((x) => x.offsetWidth).map((x) => x.textContent).join('') + ' ' + b.querySelector('i').textContent : '' };
    }));
    r.forEach((x) => {
      if (w === 390 && (x.vis !== 2 || x.btn !== `Ещё ${x.n - 2} ↓`)) bad.push(`услуги 390, ${x.id}: видно ${x.vis} из ${x.n}, кнопка «${x.btn}»`);
      if (w === 1440 && (x.vis !== x.n || x.btn)) bad.push(`услуги 1440, ${x.id}: видно ${x.vis} из ${x.n}, кнопка «${x.btn}»`);
    });
    if (w === 390) {
      await page.click('#sites .sv-more'); await page.waitForTimeout(500);
      const o = await page.evaluate(() => ({ e: document.querySelector('#sites .sv-more').getAttribute('aria-expanded'), vis: [...document.querySelectorAll('#rows-sites li')].filter((li) => li.offsetHeight).length, op: getComputedStyle(document.querySelector('#rows-sites li:last-child .sv-rn')).opacity }));
      if (o.e !== 'true' || o.vis !== 5 || o.op !== '1') bad.push(`услуги 390: после «Ещё» ${JSON.stringify(o)}`);
    }
    await page.close();
  }
  // одни слова: «Готовые решения» над плашками в модулях услуг и H1 каталога
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(BASE + 'services.html?intro=instant'); await page.waitForTimeout(200);
    const a = await page.evaluate(() => [...document.querySelectorAll('.sv-tpl > .mono')].map((m) => m.textContent.trim()).join(','));
    await page.goto(BASE + 'automations.html?intro=instant'); await page.waitForTimeout(200);
    const h = await page.evaluate(() => document.querySelector('h1').textContent.replace(/\s+/g, ' ').trim());
    if (a !== 'Готовые решения,Готовые решения' || h !== 'Готовые решения.') bad.push(`названия: над плашками «${a}», H1 каталога «${h}»`);
    await page.close();
  }
  if (bad.length) fail('ясность B10 / B11: ' + bad.slice(0, 14).join('; ') + (bad.length > 14 ? ` …ещё ${bad.length - 14}` : ''));
  else console.log('  ✓ «Как работаем» — четыре секции, #apps и #ai живы; кнопки действия — в Telegram с черновиком (RU / EN, и после смены языка); на телефоне «Что входит» — две строки и «Ещё N»; «Готовые решения» везде');
}
// Слабые телефоны (просьба владельца: «на дешёвых телефонах лагает самая первая анимация»): ранняя оценка на вступлении —
// при CPU ×6 (эмуляция дешёвого телефона, 390×844, DPR 3) облегчение включается ещё до стадии рамок (до 0.8 с от старта
// сборки), при обычной скорости — нет; на старте сборки нет чередования «замер, запись» (lineDelays, updateSizes).
console.log('\nслабые телефоны: ранняя оценка на вступлении');
{
  const bad = [], info = [];
  const quick = await chromium.launch();
  for (const rate of [6, 1]) {
    const ctx = await quick.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
    const page = await ctx.newPage(); const cdp = await ctx.newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate });
    // момент, когда первый экран дошёл до стадии рамок, и момент включения облегчения
    await page.addInitScript(() => {
      window.__t = {};
      new MutationObserver(() => {
        const r = document.getElementById('pt-site'), h = document.querySelector('[data-sec="hero"]'), now = performance.now();
        if (r && r.classList.contains('pt-lite') && !window.__t.lite) window.__t.lite = now;
        if (h && h.classList.contains('s-skel') && !window.__t.skel) window.__t.skel = now;
      }).observe(document, { subtree: true, attributes: true, attributeFilter: ['class'] });
    });
    await page.goto(BASE + 'index.html'); await page.waitForTimeout(rate > 1 ? 9000 : 5000);
    const r = await page.evaluate(() => ({ ...window.__t, ss: sessionStorage.getItem('pt-q') }));
    if (rate > 1 && !(r.lite && r.skel && r.lite < r.skel && +r.ss >= 1)) bad.push(`CPU ×${rate}: облегчение ${Math.round(r.lite) || 'нет'} мс, стадия рамок ${Math.round(r.skel) || 'нет'} мс`);
    if (rate === 1 && (r.lite || r.ss)) bad.push(`CPU ×1: облегчение включилось (${Math.round(r.lite)} мс, уровень ${r.ss})`);
    info.push(`×${rate}: ${r.ss ? 'уровень ' + r.ss + ' за ' + Math.round(r.skel - r.lite) + ' мс до рамок' : 'без облегчения'}`);
    await ctx.close();
  }
  await quick.close();
  const eng = readFileSync(path.join(root, 'assets', 'engine.js'), 'utf8');
  if (!/function probeStart\(/.test(eng) || /\w\.toLocaleString\(/.test(eng)) bad.push('engine.js: нет ранней оценки или остался toLocaleString');
  if (bad.length) fail('слабые телефоны: ' + bad.join('; '));
  else console.log(`  ✓ ранняя оценка на вступлении: ${info.join(', ')}`);
}

// Чистка страницы услуг: чипы-дубли, ряд переходов, карточка форматов со ссылками, сроки и повторы в текстах; снимки.
console.log('\nстраница услуг без повторов');
{
  const bad = [];
  if (/\.sv-jump/.test(readFileSync(path.join(root, 'assets', 'site.css'), 'utf8'))) bad.push('в site.css остались стили .sv-jump');
  for (const [w, h] of [[1440, 900], [390, 844]]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await page.goto('file://' + path.join(root, 'services.html')); await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(300);
    const r = await page.evaluate(() => {
      const chips = ['sites', 'apps', 'servers', 'care', 'automation', 'ai'].map((id) => id + ':' + (document.querySelector(`#${id} .sv-chips`) ? 1 : 0)).join(' ');
      const links = [...document.querySelectorAll('.sv-fmt .sv-fl a')].map((a) => ({ h: a.getAttribute('href'), ok: !!document.getElementById(a.getAttribute('href').slice(1)), ht: Math.round(a.getBoundingClientRect().height) }));
      const vis = document.body.innerText;
      return { chips, jump: !!document.querySelector('.sv-jump'), links, fw: [...document.querySelectorAll('.sv-fmt a.sv-fw')].map((a) => a.getAttribute('href')).join(','),
        terms: /от 2 дней|от двух дней/.test(vis), code: (vis.match(/код и\s+доступ/gi) || []).length };
    });
    if (r.chips !== 'sites:1 apps:0 servers:0 care:0 automation:1 ai:0') bad.push(`${w}: чипы ${r.chips}`);
    if (r.jump) bad.push(`${w}: ряд переходов .sv-jump на странице`);
    if (r.links.map((l) => l.h).join(',') !== '#sites,#apps,#servers,#care,#automation,#ai' || r.links.some((l) => !l.ok || l.ht < 40)) bad.push(`${w}: ссылки карточки форматов ${r.links.map((l) => `${l.h}${l.ok ? '' : '?'}:${l.ht}`).join(' ')}`);
    if (r.fw !== '#projects,#subscription') bad.push(`${w}: слова форматов ведут на ${r.fw}`);
    if (r.terms) bad.push(`${w}: остались сроки автоматизации`);
    if (r.code > 3) bad.push(`${w}: «код и доступ» в тексте ${r.code} раз`);
    await page.addStyleTag({ content: '[data-pt-canvas],[data-pt-smoke]{display:none!important}' });
    await page.screenshot({ path: path.join(shots, `services-hero-${w}.png`) });
    if (w === 1440) {
      const b = await page.evaluate(() => { const e = document.getElementById('ai').getBoundingClientRect(); return { y: e.top + scrollY, h: e.height }; });
      await page.screenshot({ path: path.join(shots, 'services-ai-1440.png'), fullPage: true, clip: { x: 0, y: Math.round(b.y), width: w, height: Math.round(b.h) } });
    }
    await ctx.close();
  }
  if (bad.length) fail('страница услуг без повторов: ' + bad.join('; '));
  else console.log('  ✓ чипы только в «Сайтах» и «Автоматизации», ряда переходов нет, шесть направлений — ссылки карточки форматов (≥ 40 px, на существующие id), «Разово» / «Ежемесячно» → #projects / #subscription, сроков автоматизации нет, «код и доступ» ≤ 3 (1440 и 390)');
}

// Облегчённый режим: кадры ~150 мс (настоящий rAF вызывается из setTimeout 140 мс; часы — настоящие, без page.clock,
// чтобы кадры и окна watchQuality шли в реальном времени) — через ≤ 20 с у корня .pt-lite, sessionStorage pt-q ≥ 1,
// размытие со стёкол снято. Обычный прогон (быстрые кадры) облегчение не включает.
console.log('\nоблегчённый режим');
{
  const bad = [];
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.addInitScript(() => { const raf = window.requestAnimationFrame.bind(window); window.requestAnimationFrame = (cb) => setTimeout(() => raf(cb), 140); });
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', (e) => errs.push(e.message));
  await page.goto('file://' + file);
  const t0 = Date.now(); let st = null;
  while (Date.now() - t0 < 20000) {
    await page.waitForTimeout(500);
    st = await page.evaluate(() => ({ lite: document.getElementById('pt-site').classList.contains('pt-lite'), ss: sessionStorage.getItem('pt-q'), bar: getComputedStyle(document.querySelector('.topbar')).backdropFilter, glass: getComputedStyle(document.querySelector('.glass')).backdropFilter }));
    if (st.lite) break;
  }
  const sec = ((Date.now() - t0) / 1000).toFixed(1);
  if (!st.lite || !(+st.ss >= 1) || st.bar !== 'none' || st.glass !== 'none') bad.push(`за ${sec} с: ${JSON.stringify(st)}`);
  errs.forEach((e) => bad.push(e));
  await ctx.close();
  if (bad.length) fail('облегчённый режим при кадрах ~150 мс: ' + bad.join('; '));
  else console.log(`  ✓ при кадрах ~150 мс облегчение включилось за ${sec} с: .pt-lite, pt-q = ${st.ss}, у липкой шапки и стекла размытия нет`);
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
  // петли и импульсы — CSS (SMIL больше нет): вне экрана ни одна петля рисунка не идёт (однократная прорисовка и переходы
  // прозрачности доигрывают сами — их пауза не касается)
  const off = await page.evaluate(() => [...document.querySelectorAll('#directions .glyph')].filter((el) => el.classList.contains('is-vis') || el.getAnimations({ subtree: true }).some((a) => a.playState === 'running' && a.effect && a.effect.getTiming().iterations === Infinity)).length);
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
    const m = await pg.evaluate(() => ({ n: document.querySelectorAll('.sv-lab .glyph-mini').length, on: document.querySelectorAll('.sv-lab .glyph-mini.is-on.is-now').length, icons: document.querySelectorAll('.svc-ic').length, dots: document.querySelectorAll('.sv-fmt .sv-fl .sv-dot').length }));
    if (m.n !== 6 || m.on !== 6 || m.icons || m.dots !== 6) bad.push(`страница услуг: мини ${m.n}, на месте ${m.on}, иконок ${m.icons}, точек в карточке форматов ${m.dots}`);
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
    page.on('pageerror', (e) => errs.push(e.message)); page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|ERR_|Access to font at 'file:/.test(m.text())) errs.push(m.text()); });
    await page.clock.install({ time: new Date(T0) });
    // с диска — как раньше; сценарии с переходом по ссылке — с сервера: ссылки без .html (адреса без расширения) с диска ведут
    // на несуществующий файл
    await page.goto(/^https?:/.test(url) ? url : 'file://' + path.join(root, url));
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
  if (AUTO) await scene('главная → «Все услуги» → назад → снова услуги', BASE + 'index.html', '', async (page, mode) => {
    await page.clock.runFor(6500);
    await page.evaluate(() => document.querySelector('#directions .more a[href="services"]').click());
    await page.waitForURL(/\/services/);
    const f = { m: await mode() };
    await page.clock.runFor(100); await page.waitForTimeout(700); f.h1 = await h1on(page);
    await page.goBack(); await page.clock.runFor(100); await page.waitForTimeout(100);
    const b = { m: await mode(), all: await doneAll(page) };
    await page.goForward(); await page.clock.runFor(100); await page.waitForTimeout(100);
    const c = { m: await mode(), all: await doneAll(page) };
    return f.m === 'fast' && f.h1 && b.all && c.m === 'instant' && c.all ? '' : JSON.stringify({ f, b, c });
  });
  // повторный заход в вкладке — быстрая сборка (просьба владельца): без вспышки и двух линий, H1 виден к ~0.7 с
  await scene('повторный заход: «Как работаем» с главной → process.html — быстрая', BASE + 'index.html', '', async (page, mode) => {
    await page.clock.runFor(6500);
    await page.click('.hero-hdr .nav a[href="process"]'); await page.waitForURL(/\/process/);
    await page.clock.runFor(100); await page.waitForTimeout(700);
    const r = await page.evaluate(() => ({ rep: document.getElementById('pt-site').hasAttribute('data-repeat'), h1: document.querySelector('h1').textContent.replace(/\s+/g, ' ').trim() }));
    r.m = await mode(); r.on = await h1on(page);
    return r.m === 'fast' && r.rep && r.on && r.h1 === 'Как мы работаем.' ? '' : JSON.stringify(r);
  });
  for (const m of ['full', 'fast', 'instant']) await scene(`?intro=${m}`, `index.html?intro=${m}`, `sessionStorage.setItem('pt-seen', '["index"]')`, async (page, mode) => { await page.clock.runFor(100); const got = await mode(); return got === m ? '' : got; });
  await scene('хранилище запрещено → полная', 'index.html', `Object.defineProperty(window, 'localStorage', { get() { throw new Error('denied'); } }); Object.defineProperty(window, 'sessionStorage', { get() { throw new Error('denied'); } });`, async (page, mode) => { await page.clock.runFor(4000); const r = { m: await mode(), hero: await page.evaluate(() => document.querySelector('[data-sec="hero"]').classList.contains('s-done')) }; return r.m === 'full' && r.hero ? '' : JSON.stringify(r); });
  if (bad.length) fail('режимы: ' + bad.join(' | '));
  else console.log(`  ✓ ${ok.join('; ')}`);
}

// Раскладка на промежуточных ширинах: ни кнопка, ни ссылка, ни строка текста не выходят за край окна. Документ вбок
// не листается в любом случае (корень .pt обрезает лишнее), поэтому меряем сами элементы. Липкую шапку на время
// замера показываем. Вкладки панели: слова видны, только если панель шире 540 px, и не вылезают из вкладки.
console.log('\nраскладка на промежуточных ширинах (главная, услуги, кейсы, каталог; RU / EN, шапка и липкая шапка)');
{
  const bad = [];
  for (const pg of ['index.html', 'services.html', 'cases.html', 'automations.html', 'process.html']) for (const lang of ['ru', 'en']) for (const w of [320, 360, 375, 390, 414, 430, 768, 820, 1024, 1150, 1280, 1440, 1920]) {
    const page = await browser.newPage({ viewport: { width: w, height: 900 } });
    await page.goto('file://' + path.join(root, pg) + (lang === 'en' ? '?lang=en' : ''));
    await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(300);
    const out = await page.evaluate(() => {
      document.querySelector('[data-topbar]').classList.add('on');
      const W = innerWidth, res = [];
      document.querySelectorAll('#pt-site .sec a, #pt-site .sec button, #pt-site .sec h1, #pt-site .sec h2, #pt-site .sec h3, #pt-site .sec p, #pt-site .sec li, [data-topbar] a, [data-topbar] button').forEach((el) => {
        if (el.closest('template, [data-menu], .site-view, .an, .wf')) return;
        const sx = el.closest('.sv-paths, .cx, .fl'); if (sx && getComputedStyle(sx).overflowX === 'auto') return;
        const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden') return;
        const r = el.getBoundingClientRect(); if (!r.width) return;
        if (r.right > W + 1 || r.left < -1) res.push(`«${(el.textContent.trim() || el.getAttribute('aria-label') || el.tagName).slice(0, 24)}» ${Math.round(r.left)}..${Math.round(r.right)}`);
      });
      if (document.documentElement.scrollWidth > W) res.push(`документ шире окна: ${document.documentElement.scrollWidth}`);
      const obj = document.querySelector('[data-obj]');
      if (obj) {
        const pw = obj.getBoundingClientRect().width, words = [...document.querySelectorAll('.cx-w')].filter((x) => getComputedStyle(x).display !== 'none').length;
        // номеров на вкладках нет — слова видны всегда (на узкой панели ряд листается вбок)
        if (words !== 5 || document.querySelectorAll('.cx-n').length) res.push(`панель ${Math.round(pw)} px: видно слов на вкладках ${words}`);
        const clip = [...document.querySelectorAll('.cx-l')].filter((l) => l.scrollWidth > l.clientWidth + 1).length;
        if (clip) res.push(`вкладок, где подпись шире вкладки: ${clip}`);
      }
      // курсивный кусок заголовка на ширине от 761 — одной строкой («Один / дом.» рвалось); .hx — акцент в H2 (вариант B владельца)
      if (W > 760) document.querySelectorAll('.h2 .it, .sv-h1 .it, h2 .hx').forEach((it) => { const n = it.getClientRects().length, r = it.getBoundingClientRect(); if (n !== 1 || r.right > W + 1) res.push(`курсив «${it.textContent.trim().slice(0, 20)}» — ${n} стр., край ${Math.round(r.right)}`); });
      return res;
    });
    out.forEach((x) => bad.push(`${pg} ${w} ${lang}: ${x}`));
    await page.close();
  }
  if (bad.length) fail('выходят за край окна: ' + bad.slice(0, 12).join(' | ') + (bad.length > 12 ? ` …ещё ${bad.length - 12}` : ''));
  else console.log('  ✓ главная, услуги, кейсы и каталог на 320–430, 768, 820, 1024, 1150, 1280, 1440, 1920 (RU и EN): ничего не выходит за край окна, кнопки шапки целиком; слова вкладок — по ширине панели; курсив заголовков — одной строкой');
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
        // пульт укатывается в угол анимацией (TASK-clarity.md, B5): она идёт в реальном времени, а часы проверки виртуальные —
        // ждём, пока кнопка доедет, иначе курсор наводится туда, где её уже нет
        for (let k = 0; k < 40 && await page.evaluate(() => document.querySelector('[data-pult]').getAnimations({ subtree: true }).some((a) => a.constructor.name === 'Animation' && a.playState === 'running')); k++) await page.waitForTimeout(50);
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
        // плашка — справа от кнопки, на её уровне: курсор идёт с кнопки вправо, на плашку
        await page.mouse.move(b[0] + 40, b[1], { steps: 6 }); await page.waitForTimeout(80);
        if (await page.evaluate(() => getComputedStyle(document.querySelector('.pult-bar')).display === 'none')) bad.push(`${tag}: плашка схлопнулась по пути курсора с кнопки на неё`);
      }
      if (lang === 'ru' && w === 1920) await page.screenshot({ path: path.join(shots, 'd1920-first-screen.png') });
      // объект крупнее, но не задевает вкладки и подпись: границы по пикселям за весь цикл объекта, без первой секунды —
      // там частицы перелетают из прошлого объекта по всей панели (текст и пыль на время замера скрыты). В каждой точке цикла
      // — медиана трёх кадров через 300 мс (TASK-qa-decisions.md, 5): искра хода ферзя живёт долю секунды и в одном кадре
      // заходила в полосу подписи — замер падал в зависимости от фазы хода (1 из ~10 прогонов). Точки — до смены принципа
      // (ферзь 8.5 с, «Дизайн» 10 с от клика)
      if (lang === 'ru' && w === 1280) for (const k of [0, 4]) {
        await page.mouse.move(2, 2);
        await page.evaluate((n) => document.querySelector(`[data-usp="${n}"]`).click(), k);
        let top = 1e9, bot = 0, lim = null, el = 0;
        const med = (a) => a.slice().sort((x, y) => x - y)[1];
        for (const t0 of k === 4 ? [1200, 2700, 4200, 5700, 7200, 8700] : [1200, 2600, 4000, 5400, 6800, 7800]) {
          const bs = [];
          for (const t of [t0, t0 + 300, t0 + 600]) { await run(t - el); el = t; await page.waitForTimeout(60); bs.push(await objBox(page)); }
          top = Math.min(top, med(bs.map((x) => x.box[1]))); bot = Math.max(bot, med(bs.map((x) => x.box[3]))); lim = bs[2];
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
// TASK-polish-2.md, 1: подпись окна схемы (.win-tag в левом верхнем углу) не задевает узлы — на главной, в работах и каталоге,
// 320 / 390 / 1440. Узлы — прямоугольники из графа сцены (canvas.__ptBoxes, scenes.js)
console.log('\nсхемы: подпись окна и узлы');
{
  const bad = [], seen = [];
  for (const w of [320, 390, 1440]) for (const pg of ['index.html', 'cases.html', 'automations.html']) {
    const page = await browser.newPage({ viewport: { width: w, height: 900 } });
    await page.goto(BASE + pg + '?intro=instant'); await page.waitForTimeout(600);
    const H = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < H; y += 600) { await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), y); await page.waitForTimeout(200); }
    await page.waitForTimeout(1500);
    const r = await page.evaluate(() => [...document.querySelectorAll('canvas[data-flow]')].filter((c) => c.getClientRects().length && c.__ptBoxes).map((c) => {
      const t = c.parentNode.querySelector('.win-tag'); if (!t) return null;
      const a = t.getBoundingClientRect(), b = c.getBoundingClientRect(), tb = [a.left - b.left, a.top - b.top, a.width, a.height], boxes = c.__ptBoxes();
      const hit = boxes.filter(([x, y, bw, bh]) => Math.min(tb[0] + tb[2], x + bw) > Math.max(tb[0], x) && Math.min(tb[1] + tb[3], y + bh) > Math.max(tb[1], y)).length;
      return { flow: c.dataset.flow, n: boxes.length, hit };
    }).filter(Boolean));
    r.forEach((x) => { seen.push(x.flow); if (!x.n) bad.push(`${pg} ${w}: ${x.flow} — узлов нет`); else if (x.hit) bad.push(`${pg} ${w}: ${x.flow} — подпись окна на ${x.hit} узл.`); });
    await page.close();
  }
  if (!seen.length) bad.push('схем с подписью окна не найдено');
  if (bad.length) fail('схемы: ' + bad.join('; '));
  else console.log(`  ✓ подпись окна не задевает узлы: ${new Set(seen).size} схем на 320 / 390 / 1440`);
}
// Панель разбора работы (TASK-cases-panel.md, assets/cases.js): каждая из семи карточек «Работ» открывает свою статью;
// ← → и клавиши листают видимые при фильтре (на краях стрелка неактивна, счётчик); Esc / «Назад» закрывают, фокус — на
// карточку, адрес — без кейса (хеш фильтра на месте); пока панель открыта, схемы сетки не рисуют (счётчик clearRect по
// холсту), схема статьи рисует; страница стоит, колесо крутит тело панели; телефон — шторка, свайп вниз закрывает; EN — без
// кириллицы; прямая ссылка cases#case-… — панель после сборки секции; без JS статьи под сеткой; Метрика — case_open только
// после «Принять». Снимки — tools/shots/panel-*.png
console.log('\nпанель разбора работы');
{
  const bad = [];
  const mkp = async (vp, opts = {}) => {
    const ctx = await browser.newContext({ viewport: vp, ...(opts.ctx || {}) });
    await ctx.route('**/mc.yandex.ru/**', (r) => r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }));
    await ctx.addInitScript((o) => {
      try { localStorage.setItem('pt-consent', o.consent || 'no'); } catch (e) { /* нет хранилища */ }
      if (o.stub) window.ym = function () { (window.__ym = window.__ym || []).push([].slice.call(arguments)); };
      const cnt = new WeakMap(), orig = CanvasRenderingContext2D.prototype.clearRect;
      CanvasRenderingContext2D.prototype.clearRect = function () { cnt.set(this.canvas, (cnt.get(this.canvas) || 0) + 1); return orig.apply(this, arguments); };
      window.__cr = (sel) => [...document.querySelectorAll(sel)].reduce((a, c) => a + (cnt.get(c) || 0), 0);
      window.__ev = [];
      addEventListener('pt:secdone', (e) => { if (e.detail && e.detail.dataset && e.detail.dataset.sec === 'cases') window.__ev.push('secdone'); });
      addEventListener('pt:case', (e) => window.__ev.push('open:' + e.detail));
    }, opts);
    const page = await ctx.newPage(); page.errs = [];
    page.on('pageerror', (e) => page.errs.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|ERR_/.test(m.text())) page.errs.push(m.text()); });
    return { ctx, page };
  };
  const cst = (page) => page.evaluate(() => {
    const cp = document.querySelector('[data-cp]'), a = cp.querySelector('.cp-art:not([hidden])'), ae = document.activeElement;
    return { open: cp.classList.contains('is-open'), art: a ? a.dataset.case : '', hash: location.hash, n: cp.querySelector('[data-cp-n]').textContent + '/' + cp.querySelector('[data-cp-total]').textContent,
      prev: cp.querySelector('[data-cp-prev]').disabled, next: cp.querySelector('[data-cp-next]').disabled, lock: document.documentElement.classList.contains('cp-lock'), y: Math.round(scrollY),
      focus: ae === cp.querySelector('.cp-sheet') ? 'sheet' : (ae.closest('[id^="case-"]') || {}).id || ae.tagName, title: document.title, label: cp.querySelector('.cp-sheet').getAttribute('aria-labelledby') };
  });
  const IDS = ['case-resonara', 'case-antares', 'case-call-audit', 'case-studio-os', 'case-seo-report', 'case-catalog', 'case-agents', 'case-tg-crm'];
  // 1440: открыть каждую, закрыть Esc
  {
    const { ctx, page } = await mkp({ width: 1440, height: 900 });
    await page.goto(BASE + 'cases.html?intro=instant'); await page.waitForTimeout(1500);
    const ids = await page.evaluate(() => [...document.querySelectorAll('.obj-grid-2 > .obj [data-cp-open]')].map((a) => a.closest('.obj').id));
    if (ids.join(',') !== IDS.join(',')) bad.push('карточки с панелью: ' + ids.join(','));
    for (const [i, id] of IDS.entries()) {
      await page.evaluate((id) => document.getElementById(id).scrollIntoView({ block: 'center', behavior: 'instant' }), id); await page.waitForTimeout(250);
      const y0 = await page.evaluate(() => Math.round(scrollY));
      await page.click(`#${id} [data-cp-open]`); await page.waitForTimeout(900);
      const s = await cst(page);
      if (!s.open || s.art !== id || s.hash !== '#' + id || s.n !== `0${i + 1}/08` || !s.lock || s.focus !== 'sheet' || s.y !== y0 || s.label !== 'cp-t-' + id.slice(5) || !/ — Работы \| Private Technology House$/.test(s.title)) bad.push(`${id}: открыта ${JSON.stringify(s)}`);
      if (id === 'case-call-audit' || id === 'case-resonara' || id === 'case-studio-os' || id === 'case-seo-report') { await page.waitForTimeout(1500); await page.screenshot({ path: path.join(shots, `panel-1440-${id.slice(5)}.png`) }); }
      await page.keyboard.press('Escape'); await page.waitForTimeout(800);
      const c = await cst(page);
      if (c.open || c.hash !== '' || c.lock || c.focus !== id || c.y !== y0 || !/^Работы — /.test(c.title) || !(await page.evaluate(() => document.querySelector('[data-cp]').hidden))) bad.push(`${id}: закрыта Esc ${JSON.stringify(c)}`);
    }
    // листание: края, клавиши, «Следующая работа», подвал последней — только призыв; Tab не уходит из панели
    await page.click('#case-resonara [data-cp-open]'); await page.waitForTimeout(700);
    let s = await cst(page); if (!s.prev || s.next) bad.push('первая: ← должна быть неактивна');
    await page.keyboard.press('ArrowRight'); await page.waitForTimeout(200); s = await cst(page);
    if (s.art !== 'case-antares' || s.n !== '02/08' || s.hash !== '#case-antares') bad.push('→: ' + JSON.stringify(s));
    await page.click('.cp-nx'); await page.waitForTimeout(200); s = await cst(page);
    if (s.art !== 'case-call-audit') bad.push('«Следующая работа»: ' + s.art);
    for (let k = 0; k < 6; k++) await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(200); s = await cst(page);
    const foot = await page.evaluate(() => [...document.querySelectorAll('.cp-foot > *')].map((x) => x.className).join(','));
    if (s.art !== 'case-tg-crm' || s.n !== '08/08' || !s.next || foot !== 'cp-cta') bad.push(`последняя: ${JSON.stringify(s)}, подвал ${foot}`);
    let out = 0;
    for (let k = 0; k < 14; k++) { await page.keyboard.press('Tab'); if (!(await page.evaluate(() => !!document.activeElement.closest('[data-cp]')))) out++; }
    if (out) bad.push(`Tab ушёл из панели ${out} раз`);
    // пока открыта: схемы сетки не рисуют, схема статьи рисует; колесо крутит тело, страница стоит
    await page.keyboard.press('ArrowLeft'); await page.waitForTimeout(1200);
    const g1 = await page.evaluate(() => __cr('.obj-grid-2 canvas')), a1 = await page.evaluate(() => __cr('.cp canvas'));
    await page.waitForTimeout(1000);
    const g2 = await page.evaluate(() => __cr('.obj-grid-2 canvas')), a2 = await page.evaluate(() => __cr('.cp canvas'));
    if (g2 !== g1 || a2 <= a1) bad.push(`под открытой панелью: кадров сетки ${g2 - g1} (нужно 0), схемы статьи ${a2 - a1}`);
    const w0 = await page.evaluate(() => [scrollY, document.querySelector('[data-cp-body]').scrollTop]);
    await page.mouse.move(1100, 500); await page.mouse.wheel(0, 600); await page.waitForTimeout(500);
    const w1 = await page.evaluate(() => [scrollY, document.querySelector('[data-cp-body]').scrollTop]);
    if (w1[0] !== w0[0] || w1[1] < w0[1] + 100) bad.push(`колесо над панелью: страница ${w0[0]} → ${w1[0]}, тело ${w0[1]} → ${w1[1]}`);
    await page.click('.cp-x'); await page.waitForTimeout(800);
    s = await cst(page); if (s.open || s.focus !== 'case-resonara') bad.push('× : ' + JSON.stringify(s));
    const g3 = await page.evaluate(() => __cr('.obj-grid-2 canvas')); await page.waitForTimeout(800); const g4 = await page.evaluate(() => __cr('.obj-grid-2 canvas'));
    if (g4 <= g3) bad.push('после закрытия схемы сетки не проснулись');
    // «Назад» браузера закрывает; клик по подложке закрывает
    await page.click('#case-catalog [data-cp-open]'); await page.waitForTimeout(700); await page.goBack(); await page.waitForTimeout(700);
    s = await cst(page); if (s.open || s.hash !== '') bad.push('«Назад»: ' + JSON.stringify(s));
    await page.click('#case-catalog [data-cp-open]'); await page.waitForTimeout(700); await page.mouse.click(200, 450); await page.waitForTimeout(700);
    if ((await cst(page)).open) bad.push('клик по подложке не закрыл');
    page.errs.forEach((e) => bad.push('1440: ' + e));
    await ctx.close();
  }
  // фильтр «AI»: три кейса, счётчик / 03, после закрытия хеш фильтра на месте
  {
    const { ctx, page } = await mkp({ width: 1440, height: 900 });
    await page.goto(BASE + 'cases.html?intro=instant#ai'); await page.waitForTimeout(1500);
    await page.click('#case-call-audit [data-cp-open]'); await page.waitForTimeout(700);
    let s = await cst(page); const n0 = s.n;
    for (let k = 0; k < 3; k++) await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(200); s = await cst(page);
    const n1 = s.n, art = s.art, nx = s.next;
    await page.keyboard.press('Escape'); await page.waitForTimeout(700); s = await cst(page);
    const fl = await page.evaluate(() => document.querySelector('.fl-b[aria-pressed="true"]').dataset.filter);
    if (n0 !== '01/04' || n1 !== '04/04' || art !== 'case-agents' || !nx || s.hash !== '#ai' || fl !== 'ai') bad.push(`фильтр «AI»: ${n0} → ${n1} ${art}, закрыта: ${s.hash} ${fl}`);
    await ctx.close();
  }
  // прямая ссылка: панель — после сборки секции cases
  {
    const { ctx, page } = await mkp({ width: 1440, height: 900 });
    await page.goto(BASE + 'cases.html#case-studio-os'); await page.waitForTimeout(5500);
    const ev = await page.evaluate(() => __ev.join(' → ')), s = await cst(page);
    if (ev !== 'secdone → open:studio-os' || !s.open) bad.push(`cases.html#case-studio-os: ${ev}, ${JSON.stringify(s)}`);
    page.errs.forEach((e) => bad.push('прямая ссылка: ' + e));
    await ctx.close();
  }
  // телефон: шторка снизу, свайп вниз закрывает, короткий — пружинит; снимки
  {
    const { ctx, page } = await mkp({ width: 390, height: 844 }, { ctx: { isMobile: true, hasTouch: true, deviceScaleFactor: 2 } });
    await page.goto(BASE + 'cases.html?intro=instant'); await page.waitForTimeout(1500);
    for (const id of ['case-resonara', 'case-call-audit', 'case-studio-os', 'case-seo-report']) {
      await page.evaluate((id) => document.getElementById(id).scrollIntoView({ block: 'center', behavior: 'instant' }), id); await page.waitForTimeout(250);
      await page.tap(`#${id} [data-cp-open]`); await page.waitForTimeout(2600);
      // SEO-кейс (TASK-seo-case.md, 1.2): телефон с сообщением — под отчётом по центру, а не поверх; подпись «Пример на тестовых данных» есть
      if (id === 'case-seo-report') {
        const k = await page.evaluate(() => { const a = document.querySelector('[data-case="case-seo-report"]'), sh = a.querySelector('.cp-shot.is-stack'), im = sh.querySelector(':scope > img').getBoundingClientRect(), ph = sh.querySelector('.cp-phone').getBoundingClientRect(), n = sh.nextElementSibling; return { below: Math.round(ph.top - im.bottom), mid: Math.round(ph.left + ph.width / 2 - (im.left + im.width / 2)), w: Math.round(ph.width), note: n && n.classList.contains('cp-shot-note') ? n.textContent.replace(/\s+/g, ' ').trim() : '' }; });
        if (k.below < 0 || Math.abs(k.mid) > 2 || k.w < 180 || k.note !== 'Пример на тестовых данных.') bad.push('SEO на 390: телефон и отчёт ' + JSON.stringify(k));
        await page.evaluate(() => { const ph = document.querySelector('[data-case="case-seo-report"] .cp-phone'); ph.scrollIntoView({ block: 'center', behavior: 'instant' }); }); await page.waitForTimeout(400);
        await page.screenshot({ path: path.join(shots, 'panel-390-seo-report-phone.png') });
        await page.evaluate(() => { document.querySelector('[data-cp-body]').scrollTop = 0; }); await page.waitForTimeout(200);
      }
      if (id === 'case-resonara') {
        const g = await page.evaluate(() => { const r = document.querySelector('.cp-sheet').getBoundingClientRect(); return { l: r.left, r: Math.round(r.right), b: Math.round(r.bottom), t: Math.round(r.top) }; });
        if (g.l !== 0 || g.r !== 390 || g.b !== 844 || g.t < 30 || g.t > 120) bad.push('шторка на 390: ' + JSON.stringify(g));
      }
      await page.screenshot({ path: path.join(shots, `panel-390-${id.slice(5)}.png`) });
      await page.keyboard.press('Escape'); await page.waitForTimeout(600);
    }
    await page.tap('#case-catalog [data-cp-open]'); await page.waitForTimeout(800);
    const swipe = (d) => page.evaluate(async (d) => {
      const bar = document.querySelector('.cp-bar'), r = bar.getBoundingClientRect(), x = r.left + 60, y = r.top + 14;
      const ev = (t, yy) => bar.dispatchEvent(new PointerEvent(t, { pointerId: 7, pointerType: 'touch', clientX: x, clientY: yy, bubbles: true }));
      ev('pointerdown', y); for (let k = 1; k <= 6; k++) { ev('pointermove', y + (d * k) / 6); await new Promise((res) => setTimeout(res, 50)); } ev('pointerup', y + d);
    }, d);
    await swipe(60); await page.waitForTimeout(600); const o1 = (await cst(page)).open;
    await swipe(200); await page.waitForTimeout(600); const o2 = (await cst(page)).open;
    if (!o1 || o2) bad.push(`свайп: короткий оставил открытой ${o1}, длинный закрыл ${!o2}`);
    page.errs.forEach((e) => bad.push('390: ' + e));
    await ctx.close();
  }
  // EN: в открытой панели нет кириллицы, заголовок вкладки по-английски
  {
    const { ctx, page } = await mkp({ width: 1440, height: 900 });
    await page.goto(BASE + 'cases.html?intro=instant&lang=en'); await page.waitForTimeout(1500);
    for (const id of IDS) {
      await page.evaluate((id) => document.getElementById(id).scrollIntoView({ block: 'center', behavior: 'instant' }), id); await page.waitForTimeout(150);
      await page.click(`#${id} [data-cp-open]`); await page.waitForTimeout(500);
      const r = await page.evaluate(() => { const cp = document.querySelector('[data-cp]'), t = cp.innerText + ' ' + [...cp.querySelectorAll('[aria-label],[alt]')].map((e) => (e.getAttribute('aria-label') || '') + ' ' + (e.getAttribute('alt') || '')).join(' ') + ' ' + [...cp.querySelectorAll('a[href*="t.me"]')].map((a) => decodeURIComponent(a.href)).join(' '); return { cyr: (t.match(/[А-Яа-яЁё][^ ]*/g) || []).slice(0, 4), title: document.title }; });
      if (r.cyr.length || !/ — Work \| Private Technology House$/.test(r.title)) bad.push(`EN ${id}: ${JSON.stringify(r)}`);
      await page.keyboard.press('Escape'); await page.waitForTimeout(500);
    }
    await ctx.close();
  }
  // без JS: статьи панели — под сеткой обычным блоком, подложка, полоса и подвал скрыты
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, javaScriptEnabled: false });
    const pg = await ctx.newPage(); await pg.goto(BASE + 'cases.html');
    const r = await pg.evaluate(() => ({ arts: [...document.querySelectorAll('.cp-art')].filter((a) => a.getBoundingClientRect().height > 100).length, bar: getComputedStyle(document.querySelector('.cp-bar')).display, scrim: getComputedStyle(document.querySelector('.cp-scrim')).display, pos: getComputedStyle(document.querySelector('.cp')).position }));
    if (r.arts !== 8 || r.bar !== 'none' || r.scrim !== 'none' || r.pos !== 'static') bad.push('без JS: ' + JSON.stringify(r));
    await ctx.close();
  }
  // Метрика: case_open только после «Принять»
  for (const consent of ['yes', 'no']) {
    const { ctx, page } = await mkp({ width: 1440, height: 900 }, { consent, stub: true });
    await page.goto(BASE + 'cases.html?intro=instant'); await page.waitForTimeout(4500);
    await page.click('#case-studio-os [data-cp-open]'); await page.waitForTimeout(500);
    const goals = await page.evaluate(() => (window.__ym || []).filter((c) => c[1] === 'reachGoal' && c[2] === 'case_open').map((c) => JSON.stringify(c[3])));
    if (consent === 'yes' ? goals.join() !== '{"case":"studio-os"}' : goals.length) bad.push(`Метрика (${consent}): case_open ${goals.join(' | ') || 'нет'}`);
    await ctx.close();
  }
  if (bad.length) fail('панель разбора работы: ' + bad.join('; '));
  else console.log('  ✓ восемь карточек открывают свои статьи (адрес, счётчик, фокус, заголовок вкладки), ← → и клавиши листают видимые при фильтре, края и подвал последней; Esc, ×, подложка и «Назад» закрывают, фокус на карточке, хеш фильтра на месте; под панелью схемы сетки не рисуют, схема статьи рисует, колесо крутит тело; телефон — шторка и свайп; EN без кириллицы; прямая ссылка — после сборки секции; без JS — статьи под сеткой; case_open — только после «Принять»');
}
await browser.close();
// сервер — до самого конца: им пользуются и последние блоки (режимы сборки, схемы, панель разбора работы)
srv.kill();
console.log(failed ? `\nИТОГ: ${failed} проблем(ы). Скриншоты: tools/shots/` : '\nИТОГ: всё чисто. Скриншоты: tools/shots/ — просмотри глазами.');
process.exit(failed ? 1 : 0);
