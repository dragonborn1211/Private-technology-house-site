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
// панель целиком в первом экране на 1280×720 и 1440×900; скриншот паузы.
import { chromium } from 'playwright';
import { readFileSync, readdirSync, mkdirSync, rmSync, existsSync } from 'node:fs';
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
const siteFiles = ['index.html', ...readdirSync(path.join(root, 'assets'), { recursive: true })
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
    if (lx.nav !== 'Услуги,Работы,Процесс,Цены') bad.push(`меню: ${lx.nav}`);
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
    await run(1000); await shot(name + '-building');
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
    const py = await page.evaluate(() => document.querySelector('#process').getBoundingClientRect().top + window.scrollY);
    await go(py + 300); const b1 = await bar();
    await go(py + 100); const b2 = await bar();
    await go(py + 400); const b3 = await bar();
    if (b0.on || b1.on || !b2.on || b3.on) fail(`липкая шапка: в первом экране ${b0.on}, вниз ${b1.on}, вверх ${b2.on}, снова вниз ${b3.on}`);
    else if (b2.cur !== 'process') fail(`липкая шапка: активный пункт «${b2.cur}», ждали process`);
    else console.log('  ✓ липкая шапка: скрыта в первом экране, вверх — видна (активен «Процесс»), вниз — прячется');
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
    await page.click('[data-menu] .menu-nav a[href="#process"]'); await run(2600); await page.waitForTimeout(150); await run(100);
    const m3 = await st(), ptop = await page.evaluate(() => Math.round(document.querySelector('#process').getBoundingClientRect().top));
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
    if (m3.on || Math.abs(ptop) > 8) bad.push(`пункт меню: меню ${m3.on ? 'открыто' : 'закрыто'}, «Процесс» на ${ptop}px`);
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
// Раскладка на промежуточных ширинах: ни кнопка, ни ссылка, ни строка текста не выходят за край окна. Документ вбок
// не листается в любом случае (корень .pt обрезает лишнее), поэтому меряем сами элементы. Липкую шапку на время
// замера показываем. Вкладки панели: слова видны, только если панель шире 540 px, и не вылезают из вкладки.
console.log('\nраскладка на промежуточных ширинах (RU / EN, шапка и липкая шапка)');
{
  const bad = [];
  for (const lang of ['ru', 'en']) for (const w of [320, 360, 375, 390, 414, 430, 768, 820, 1024, 1150, 1280, 1440]) {
    const page = await browser.newPage({ viewport: { width: w, height: 900 } });
    await page.goto('file://' + file + (lang === 'en' ? '?lang=en' : ''));
    await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(300);
    const out = await page.evaluate(() => {
      document.querySelector('[data-topbar]').classList.add('on');
      const W = innerWidth, res = [];
      document.querySelectorAll('#pt-site .sec a, #pt-site .sec button, #pt-site .sec h1, #pt-site .sec h2, #pt-site .sec h3, #pt-site .sec p, #pt-site .sec li, [data-topbar] a, [data-topbar] button').forEach((el) => {
        if (el.closest('template, [data-menu], .site-view, .an, .wf')) return;
        const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden') return;
        const r = el.getBoundingClientRect(); if (!r.width) return;
        if (r.right > W + 1 || r.left < -1) res.push(`«${(el.textContent.trim() || el.getAttribute('aria-label') || el.tagName).slice(0, 24)}» ${Math.round(r.left)}..${Math.round(r.right)}`);
      });
      if (document.documentElement.scrollWidth > W) res.push(`документ шире окна: ${document.documentElement.scrollWidth}`);
      const pw = document.querySelector('[data-obj]').getBoundingClientRect().width, words = [...document.querySelectorAll('.cx-w')].filter((x) => getComputedStyle(x).display !== 'none').length;
      if (pw < 540 ? words : words !== 5) res.push(`панель ${Math.round(pw)} px: видно слов на вкладках ${words}`);
      const clip = [...document.querySelectorAll('.cx-l')].filter((l) => l.scrollWidth > l.clientWidth + 1).length;
      if (clip) res.push(`вкладок, где подпись шире вкладки: ${clip}`);
      return res;
    });
    out.forEach((x) => bad.push(`${w} ${lang}: ${x}`));
    await page.close();
  }
  if (bad.length) fail('выходят за край окна: ' + bad.slice(0, 12).join(' | ') + (bad.length > 12 ? ` …ещё ${bad.length - 12}` : ''));
  else console.log('  ✓ на 320–430, 768, 820, 1024, 1150, 1280, 1440 (RU и EN) ничего не выходит за край окна, кнопки шапки целиком; слова вкладок — по ширине панели');
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
    const op = await page.evaluate(() => { let o = 1, el = document.querySelector('.hero-hdr'); while (el) { o *= +getComputedStyle(el).opacity; el = el.parentElement; } return { o, ptx: document.querySelectorAll('.hero-hdr .ptx, .hero-hdr .fr').length }; });
    if (op.o !== 1 || op.ptx) bad.push(`${tag}: шапка на 0.3 с — прозрачность ${op.o}, собираемых элементов ${op.ptx}`);
    if (w === 390) {
      // прокрутка сразу после сборки первого экрана: пульт сворачивается, хотя секции ещё собираются
      await run(2900); await page.evaluate(() => window.scrollTo({ top: 1100, behavior: 'instant' })); await page.waitForTimeout(100);
      await run(2600);
      const pm = await page.evaluate(() => ({ mini: document.querySelector('[data-pult]').classList.contains('is-mini'), open: document.querySelector('[data-pult]').classList.contains('is-open') }));
      if (!pm.mini || pm.open) bad.push(`${tag}: пульт не свёрнут при прокрутке сразу после первого экрана`);
    } else {
      await run(6200); await page.waitForTimeout(150);
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
    }
    errs.forEach((e) => bad.push(`${tag}: ${e}`));
    await page.close();
  }
  if (bad.length) fail(bad.join(' | '));
  else console.log('  ✓ шапка видна с первого кадра; H1 — три строки, курсив целиком; панель в первом экране; плашка пульта не перекрывает контент; пульт свёрнут при прокрутке (RU и EN)');
}
await browser.close();
console.log(failed ? `\nИТОГ: ${failed} проблем(ы). Скриншоты: tools/shots/` : '\nИТОГ: всё чисто. Скриншоты: tools/shots/ — просмотри глазами.');
process.exit(failed ? 1 : 0);
