// Проверка сайта после правок.
// Запуск:  npm install && npx playwright install chromium && node tools/check.mjs
// Что делает: открывает index.html в Chromium с виртуальными часами (анимации идут детерминированно),
// проходит первый экран по этапам и каждую секцию [data-sec] после её сборки на трёх ширинах,
// собирает ошибки консоли, проверяет запрещённые слова и горизонтальную прокрутку, кладёт скриншоты в tools/shots/.
// Сцены в карточках (canvas[data-mini|data-flow|data-flowlight]): до сборки секции пусты, после — нарисованы,
// вне экрана стоят на паузе.
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

const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
for (const [w, h, tag] of [[1440, 900, 'd1440'], [1700, 930, 'd1700'], [390, 844, 'm390']]) {
  console.log(`\n${tag} (${w}×${h})`);
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  const errs = [];
  page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|ERR_/.test(m.text())) errs.push(m.text()); });
  await page.clock.install({ time: new Date('2026-01-01T12:00:00Z') });
  await page.clock.pauseAt(new Date('2026-01-01T12:00:01Z'));
  await page.addInitScript(printsInit);
  await page.goto('file://' + file);
  const run = (ms) => page.clock.runFor(ms);
  const prints = (sel, visible) => page.evaluate(([q, v]) => window.__scenePrints(q, v), [sel, !!visible]);
  const shot = async (name) => { await page.waitForTimeout(400); await page.screenshot({ path: path.join(shots, `${tag}-${name}.png`) }); };
  const step = () => page.evaluate(() => document.querySelector('[data-pt-step]')?.textContent || '');

  // первый экран по этапам
  let t = 0;
  for (const m of [0.4, 1.8, 2.9, 4.2, 7.0]) { await run(Math.round((m - t) * 1000)); t = m; await shot('hero-' + m.toFixed(1)); }
  if (!/ready/.test(await step())) fail('первый экран не дошёл до «ready»');

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
  // догоняем всё, что ещё в очереди
  await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
  await run(8000);
  const notDone = await page.evaluate(() => [...document.querySelectorAll('[data-sec]')].filter((s) => !s.classList.contains('s-done')).map((s) => s.getAttribute('data-sec')));
  if (notDone.length) fail('не собрались секции: ' + notDone.join(', '));
  const hidden = await page.evaluate(() => [...document.querySelectorAll('.sec.s-done .ptx')].filter((el) => el.offsetParent && getComputedStyle(el).opacity === '0').length);
  if (hidden) fail(`${hidden} текстовых элементов остались невидимыми после сборки`);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  if (overflow > 1) fail(`горизонтальная прокрутка: ${overflow}px`);
  if (errs.length) { errs.forEach((e) => fail(e)); } else console.log('  ✓ ошибок в консоли нет');
  await page.close();
}
await browser.close();
console.log(failed ? `\nИТОГ: ${failed} проблем(ы). Скриншоты: tools/shots/` : '\nИТОГ: всё чисто. Скриншоты: tools/shots/ — просмотри глазами.');
process.exit(failed ? 1 : 0);
