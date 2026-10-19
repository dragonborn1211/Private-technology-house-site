// QA-прогон сайта (TASK-qa.md, раздел 7). Владелец запускает после любых правок, вместе с check.mjs:
//   node tools/qa.mjs                 — всё: ссылки, матрица (Chromium + WebKit), производительность главной
//   node tools/qa.mjs links matrix    — только выбранные части (links, matrix, perf)
//   QA_PAGES=index.html,cases.html node tools/qa.mjs matrix   — только эти страницы
// Нужны браузеры Playwright: npx playwright install chromium webkit
// Что проверяет:
// - ссылки: все внутренние адреса со всех страниц отвечают 200, якоря существуют на целевой странице (хеши фильтров —
//   свои), внешние — только известного вида (t.me, wa.me, max.ru, tel:, сайты работ), у target=_blank есть noopener,
//   черновики сообщений — на языке страницы;
// - матрица: каждая страница × 1440 / 390 × RU / EN × первый заход / reduced motion в Chromium, 1440 / 390 RU в WebKit:
//   ошибки и предупреждения консоли, неудачные запросы, все секции собраны, горизонтальная прокрутка, кнопки и текст за
//   краем окна, зоны нажатия меньше 44 px на телефоне (с невидимым расширением ::before), текст мельче 11 px (11 px —
//   сведения: 12 px на решении владельца), контраст мелкого текста ниже 4.5:1 (кроме декоративного aria-hidden), кириллица
//   в EN;
// - производительность главной (Chromium, первый заход, CPU ×1 и ×4): долгие задачи за вступление, когда читается H1,
//   CLS, LCP, кадры при прокрутке (p50 / p95 / > 50 мс), работа главного потока на кадр в покое.
// Итог — таблица в консоль и tools/ref/qa/summary.json; код выхода 1, если нарушен бюджет или есть ошибка.
import { chromium, webkit } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url)), root = path.resolve(here, '..');
const OUT = path.join(root, 'tools', 'ref', 'qa');
mkdirSync(OUT, { recursive: true });
const PARTS = process.argv.slice(2).filter((a) => !a.startsWith('-'));
const want = (p) => !PARTS.length || PARTS.includes(p);
const ENGINE_PAGES = ['index.html', 'services.html', 'process.html', 'cases.html', 'automations.html'];
const ALL_PAGES = (process.env.QA_PAGES ? process.env.QA_PAGES.split(',') : [...ENGINE_PAGES, 'privacy.html', '404']);
const BUDGET = {
  introLongTasksDesktop: 3, introLongTasksX4: 8, h1Desktop: 2500, h1X4: 3500, cls: 0.05,
  scrollP95Desktop: 20, scrollP95X4: 34, idleDesktop: 4, idleX4: 12,
};
// Chromium с видеокартой (по умолчанию headless рисует программно — SwiftShader, и кадры частиц с ним в разы дольше)
const GPU = process.platform === 'win32' ? ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] : ['--enable-gpu', '--ignore-gpu-blocklist'];

const port = 8180 + Math.floor(Math.random() * 60), BASE = `http://localhost:${port}/`;
const srv = spawn(process.execPath, [path.join(here, 'serve.mjs'), String(port)], { stdio: 'pipe' });
await new Promise((r) => srv.stdout.once('data', r));
const summary = { date: new Date().toISOString(), links: [], matrix: [], perf: [], fails: [] };
const fail = (where, what) => { summary.fails.push(`${where}: ${what}`); };
const urlOf = (pg, lang) => BASE + (pg === '404' ? 'nope/a/b/c.html' : pg === 'index.html' ? '' : pg) + (lang === 'en' ? '?lang=en' : '');

// ---------------------------------------------------------------- ссылки
async function links() {
  console.log('\nссылки');
  const browser = await chromium.launch();
  const html = {}, status = {};
  async function get(u) {
    if (!(u in status)) { const r = await fetch(u); status[u] = r.status; html[u] = r.headers.get('content-type')?.includes('html') ? await r.text() : ''; }
    return status[u];
  }
  const ids = (h) => new Set([...h.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
  // хеши фильтров: на работах — категории, в каталоге — #f-<категория>
  const FILTER = { 'cases.html': /^(sites|automation|ai|integrations)$/, 'automations.html': /^f-[a-z]+$/ };
  const EXT = [/^https:\/\/t\.me\/dragonborne0(\?text=.+)?$/, /^https:\/\/wa\.me\/79090243995(\?text=.+)?$/, /^https:\/\/max\.ru\/u\/[A-Za-z0-9_-]{20,}$/, /^tel:\+79090243995$/, /^https:\/\/resonara\.ru\/$/, /^https:\/\/useantares\.com\/$/];
  const bad = [], seen = new Set();
  let n = 0;
  for (const pg of ALL_PAGES) for (const lang of (pg === 'privacy.html' ? ['ru'] : ['ru', 'en'])) {
    const page = await browser.newPage();
    const u0 = urlOf(pg, lang);
    await page.goto(u0); await page.waitForTimeout(600);
    const items = await page.evaluate(() => {
      const out = [];
      document.querySelectorAll('a[href]').forEach((a) => out.push({ k: 'a', href: a.href, raw: a.getAttribute('href'), blank: a.target === '_blank', rel: a.rel, text: (a.textContent.trim() || a.getAttribute('aria-label') || '').slice(0, 40) }));
      document.querySelectorAll('link[href]').forEach((l) => { if (!/canonical|alternate/.test(l.rel)) out.push({ k: 'link', href: l.href, raw: l.getAttribute('href') }); });
      document.querySelectorAll('script[src], img[src], iframe[data-src]').forEach((e) => out.push({ k: e.tagName.toLowerCase(), href: e.src || new URL(e.dataset.src, location.href).href, raw: e.getAttribute('src') || e.dataset.src }));
      document.querySelectorAll('[srcset]').forEach((e) => e.getAttribute('srcset').split(',').forEach((s) => { const u = s.trim().split(/\s+/)[0]; if (u) out.push({ k: 'srcset', href: new URL(u, location.href).href, raw: u }); }));
      document.querySelectorAll('template').forEach((t) => t.content.querySelectorAll('a[href]').forEach((a) => out.push({ k: 'a', href: new URL(a.getAttribute('href'), location.href).href, raw: a.getAttribute('href'), blank: a.target === '_blank', rel: a.rel, tpl: 1 })));
      // ссылки на эту же страницу (#main, ?lang=ru на 404) проверяются по ней самой
      out.forEach((o) => { try { const u = new URL(o.href); if (u.origin === location.origin && u.pathname === location.pathname) { o.self = 1; o.ok = !u.hash || u.hash.length < 2 || !!document.getElementById(decodeURIComponent(u.hash.slice(1))); } } catch (e) {} });
      return out;
    });
    for (const it of items) {
      n++;
      const where = `${pg}${lang === 'en' ? '?en' : ''}`;
      let u; try { u = new URL(it.href); } catch (e) { bad.push(`${where}: плохой адрес ${it.raw}`); continue; }
      if (it.self) { if (!it.ok) bad.push(`${where}: якорь ${it.raw} — нет такого id на странице`); continue; }
      if (u.origin === new URL(BASE).origin) {
        const file = u.origin + u.pathname;
        const key = file + u.hash;
        if (seen.has(key + where)) continue; seen.add(key + where);
        const st = await get(file);
        if (st !== 200) bad.push(`${where}: ${it.k} ${it.raw} → ${st}`);
        if (u.hash.length > 1 && st === 200) {
          const id = decodeURIComponent(u.hash.slice(1)), name = u.pathname.split('/').pop() || 'index.html';
          if (!ids(html[file]).has(id) && !(FILTER[name] && FILTER[name].test(id))) bad.push(`${where}: якорь ${it.raw} — нет id «${id}» на ${name}`);
        }
      } else if (/^(https?|tel|mailto):/.test(u.protocol)) {
        const href = it.href;
        if (!EXT.some((re) => re.test(href))) bad.push(`${where}: незнакомая внешняя ссылка ${href.slice(0, 80)}`);
        if (it.blank && !/noopener/.test(it.rel)) bad.push(`${where}: target=_blank без noopener — ${href.slice(0, 60)}`);
        const m = href.match(/[?&]text=([^&]+)/);
        if (m) {
          const t = decodeURIComponent(m[1]);
          if (lang === 'en' && /[а-яё]/i.test(t)) bad.push(`${where}: черновик по-русски в EN — «${t.slice(0, 50)}» (${it.text})`);
          if (lang === 'ru' && !/[а-яё]/i.test(t)) bad.push(`${where}: черновик не по-русски — «${t.slice(0, 50)}» (${it.text})`);
        }
      }
    }
    await page.close();
  }
  await browser.close();
  summary.links = { checked: n, bad };
  if (bad.length) { bad.forEach((b) => fail('ссылки', b)); console.log(`  ✗ ${bad.length} из ${n}:\n    ` + bad.slice(0, 40).join('\n    ')); }
  else console.log(`  ✓ ${n} ссылок и ресурсов: внутренние 200, якоря на месте, внешние известного вида, черновики на языке страницы`);
}

// ---------------------------------------------------------------- матрица
// Проверки на странице после сборки всех секций (в браузере)
function pageChecks(opts) {
  const { mob, en } = opts, W = innerWidth, res = { edge: [], tap: [], small: [], small11: [], contrast: [], cyr: [], notDone: [], docOver: 0 };
  const vis = (el) => { for (let e = el; e && e.nodeType === 1; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden' || e.inert || e.hidden) return false; } return true; };
  const skip = (el) => el.closest('template, .an, .wf, .site-view, [data-menu]:not(.on), [data-topbar]:not(.on), .cm-pop[hidden], [aria-hidden="true"] canvas');
  const label = (el) => (el.textContent.trim() || el.getAttribute('aria-label') || el.tagName).replace(/\s+/g, ' ').slice(0, 30);
  res.docOver = document.documentElement.scrollWidth - W;
  document.querySelectorAll('[data-sec]').forEach((s) => { if (!s.classList.contains('s-done')) res.notDone.push(s.dataset.sec); });
  // за краем окна: кнопки, ссылки, заголовки, абзацы, пункты (ленты с прокруткой вбок — свои)
  document.querySelectorAll('a, button, h1, h2, h3, h4, p, li, summary, .btn, .ck').forEach((el) => {
    if (skip(el) || !vis(el)) return;
    const sx = el.closest('.sv-paths, .cx'); if (sx && /auto|scroll/.test(getComputedStyle(sx).overflowX)) return;
    const r = el.getBoundingClientRect(); if (!r.width || !r.height) return;
    if (r.right > W + 1 || r.left < -1) res.edge.push(`«${label(el)}» ${Math.round(r.left)}..${Math.round(r.right)}`);
  });
  // зоны нажатия на телефоне: ссылки внутри строки текста — исключение (WCAG 2.5.8)
  if (mob) document.querySelectorAll('a[href], button, summary, [role="button"], input, select, textarea').forEach((el) => {
    if (skip(el) || !vis(el)) return;
    const r = el.getBoundingClientRect(); if (!r.width || !r.height) return;
    const cs = getComputedStyle(el);
    if (cs.display === 'inline') { const p = el.parentElement, txt = [...p.childNodes].some((n) => n !== el && n.nodeType === 3 && n.textContent.trim()); if (txt) return; }
    // зона больше видимой рамки: ::after ссылки-карточки растянут на всю карточку
    if (el.matches('a.card-link')) { const c = el.closest('.obj, .glass'); if (c && c.getBoundingClientRect().height >= 44) return; }
    // невидимое расширение зоны ::before (слой «зоны нажатия» в site.css) — зона больше рамки элемента
    let tw = r.width, th = r.height; const pb = getComputedStyle(el, '::before');
    if (pb.content !== 'none' && pb.position === 'absolute') { tw = Math.max(tw, parseFloat(pb.width) || 0); th = Math.max(th, parseFloat(pb.height) || 0); }
    if (th < 43.5 || tw < 43.5) res.tap.push(`«${label(el)}» ${Math.round(tw)}×${Math.round(th)}`);
  });
  // текст: размер и контраст (фон — первый непрозрачный предок, полупрозрачные слои смешиваются с фоном страницы)
  const parse = (c) => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const v = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return [v[0], v[1], v[2], v.length > 3 ? v[3] : 1]; };
  const lum = (c) => { const f = (x) => { x /= 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
  const bgOf = (el) => {
    const layers = [];
    for (let e = el; e && e.nodeType === 1; e = e.parentElement) { const c = parse(getComputedStyle(e).backgroundColor); if (c && c[3] > 0) { layers.push(c); if (c[3] >= 1) break; } }
    let base = [10, 18, 26];
    for (let i = layers.length - 1; i >= 0; i--) { const c = layers[i]; base = [0, 1, 2].map((k) => c[k] * c[3] + base[k] * (1 - c[3])); }
    return base;
  };
  const seenEl = new Set();
  const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let t; (t = tw.nextNode());) {
    if (!t.textContent.trim()) continue;
    const el = t.parentElement; if (!el || seenEl.has(el)) continue; seenEl.add(el);
    // декоративное (aria-hidden: разделители крошек, подписи внутри рисунков, адресная строка превью) — не текст страницы
    if (el.closest('script, style, template, noscript, .an, .wf, [aria-hidden="true"], [data-menu]:not(.on), [data-topbar]:not(.on), .cm-pop[hidden], .ck[hidden]') || !vis(el)) continue;
    const r = el.getBoundingClientRect(); if (!r.width || !r.height) continue;
    const cs = getComputedStyle(el), fs = parseFloat(cs.fontSize), txt = t.textContent.trim().replace(/\s+/g, ' ').slice(0, 30);
    // мельче 11 px — ошибка; ровно 11 px — моноширинные подписи сайта (кикеры, крошки, RU / EN): 12 px — на решение
    // владельца (TASK-qa.md, отчёт), пока в сводке как сведения
    if (fs < 10.95) res.small.push(`«${txt}» ${fs}px`); else if (fs < 11.95) res.small11.push(`«${txt}» ${fs}px`);
    const fg = parse(cs.color), bold = parseInt(cs.fontWeight, 10) >= 700, large = fs >= 24 || (bold && fs >= 18.66);
    if (fg && fg[3] > 0 && !large && cs.webkitTextFillColor !== 'rgba(0, 0, 0, 0)' && !/text/.test(cs.backgroundClip + cs.webkitBackgroundClip)) {
      let o = 1; for (let e = el; e && e.nodeType === 1; e = e.parentElement) o *= parseFloat(getComputedStyle(e).opacity);
      const bg = bgOf(el), a = fg[3] * o, mix = [0, 1, 2].map((k) => fg[k] * a + bg[k] * (1 - a));
      const L1 = lum(mix), L2 = lum(bg), cr = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
      if (cr < 4.5 && o > 0.5) res.contrast.push(`«${txt}» ${cr.toFixed(2)}:1 (${fs}px)`);
    }
  }
  if (en) {
    const re = /[А-Яа-яЁё]/;
    const tw2 = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let t; (t = tw2.nextNode());) { if (re.test(t.textContent) && !t.parentElement.closest('script, style, [lang="ru"]')) res.cyr.push(t.textContent.trim().slice(0, 40)); }
    document.querySelectorAll('[aria-label], [title], [alt], [placeholder]').forEach((e) => ['aria-label', 'title', 'alt', 'placeholder'].forEach((a) => { const v = e.getAttribute(a); if (v && re.test(v) && !e.closest('[lang="ru"]')) res.cyr.push(`${a}=${v.slice(0, 40)}`); }));
    if (re.test(document.title)) res.cyr.push('title: ' + document.title);
    const md = document.querySelector('meta[name="description"]'); if (md && re.test(md.content)) res.cyr.push('description');
  }
  return res;
}

async function runOne(browserType, b, cfg) {
  const { pg, w, h, lang, mode } = cfg, mob = w < 760;
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: mob ? 3 : 1, isMobile: mob && browserType !== 'firefox', hasTouch: mob, reducedMotion: mode === 'rm' ? 'reduce' : 'no-preference' });
  await ctx.addInitScript(() => { try { localStorage.setItem('pt-consent', 'no'); } catch (e) {} });
  const page = await ctx.newPage();
  const cons = [], net = [];
  // 404 — сам документ со статусом 404 (так и задумано), его «Failed to load resource» не ошибка
  page.on('console', (m) => { if ((m.type() === 'error' || m.type() === 'warning') && !(pg === '404' && /status of 404/.test(m.text()) && /\/nope\//.test(m.location().url || ''))) cons.push(`${m.type()}: ${m.text().slice(0, 140)}`); });
  page.on('pageerror', (e) => cons.push('pageerror: ' + e.message.slice(0, 140)));
  page.on('response', (r) => { if (r.status() >= 400 && !(pg === '404' && r.url().includes('/nope/'))) net.push(`${r.status()} ${r.url().replace(BASE, '/')}`); });
  page.on('requestfailed', (r) => { if (!/resonara|useantares/.test(r.url())) net.push(`failed ${r.url().replace(BASE, '/')}: ${r.failure() && r.failure().errorText}`); });
  await page.goto(urlOf(pg, lang), { waitUntil: 'load' });
  await page.waitForTimeout(mode === 'rm' ? 600 : 3600);
  // вниз до конца ступенями: секции собираются по прокрутке
  const H = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < H; y += Math.round(h * 0.8)) { await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), y); await page.waitForTimeout(mode === 'rm' ? 80 : 900); }
  await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
  await page.waitForTimeout(mode === 'rm' ? 300 : 2000);
  const r = await page.evaluate(pageChecks, { mob, en: lang === 'en' });
  await ctx.close();
  return { ...cfg, browser: browserType, cons, net, ...r };
}

async function matrix() {
  console.log('\nматрица');
  const runs = [];
  // QA_MODES=rm — только reduced motion (быстро: раскладка та же), QA_BROWSERS=chromium — без WebKit
  const MODES = (process.env.QA_MODES || 'full,rm').split(','), BRS = (process.env.QA_BROWSERS || 'chromium,webkit').split(',');
  if (BRS.includes('chromium')) for (const pg of ALL_PAGES) for (const w of [1440, 390]) for (const lang of (pg === 'privacy.html' ? ['ru'] : ['ru', 'en'])) for (const mode of MODES) runs.push({ bt: 'chromium', pg, w, h: w < 760 ? 844 : 900, lang, mode });
  if (BRS.includes('webkit')) for (const pg of ALL_PAGES) for (const w of [1440, 390]) for (const mode of MODES) runs.push({ bt: 'webkit', pg, w, h: w < 760 ? 844 : 900, lang: 'ru', mode });
  const B = { chromium: BRS.includes('chromium') ? await chromium.launch({ args: GPU }) : null, webkit: BRS.includes('webkit') ? await webkit.launch() : null };
  const res = [], CONC = +(process.env.QA_CONC || 3);
  let k = 0;
  await Promise.all(Array.from({ length: CONC }, async () => {
    while (k < runs.length) {
      const cfg = runs[k++];
      try { res.push(await runOne(cfg.bt, B[cfg.bt], cfg)); }
      catch (e) { res.push({ ...cfg, browser: cfg.bt, err: e.message.slice(0, 200) }); }
    }
  }));
  if (B.chromium) await B.chromium.close(); if (B.webkit) await B.webkit.close();
  const rows = [];
  for (const r of res.sort((a, b) => (a.pg + a.w + a.lang + a.mode + a.browser).localeCompare(b.pg + b.w + b.lang + b.mode + b.browser))) {
    const tag = `${r.pg} · ${r.w} · ${r.lang} · ${r.mode} · ${r.browser}`;
    const probs = [];
    if (r.err) probs.push('сбой прогона: ' + r.err);
    else {
      if (r.cons.length) probs.push('консоль: ' + [...new Set(r.cons)].slice(0, 4).join(' | '));
      if (r.net.length) probs.push('сеть: ' + [...new Set(r.net)].slice(0, 4).join(' | '));
      if (r.notDone.length) probs.push('не собраны: ' + r.notDone.join(','));
      if (r.docOver > 1) probs.push(`прокрутка вбок ${r.docOver}px`);
      if (r.edge.length) probs.push('за краем: ' + r.edge.slice(0, 4).join(', '));
      if (r.tap.length) probs.push(`нажатие < 44: ${r.tap.length} — ` + r.tap.slice(0, 6).join(', '));
      if (r.small.length) probs.push(`текст < 11px: ${r.small.length} — ` + [...new Set(r.small)].slice(0, 5).join(', '));
      if (r.contrast.length) probs.push(`контраст < 4.5: ${r.contrast.length} — ` + [...new Set(r.contrast)].slice(0, 5).join(', '));
      if (r.cyr.length) probs.push('кириллица в EN: ' + r.cyr.slice(0, 4).join(' | '));
    }
    rows.push({ tag, ok: !probs.length, probs, detail: r.err ? null : { cons: r.cons, net: r.net, notDone: r.notDone, edge: r.edge, tap: r.tap, small: r.small, small11: r.small11, contrast: r.contrast, cyr: r.cyr } });
    probs.forEach((p) => fail(tag, p));
  }
  summary.matrix = rows;
  const okN = rows.filter((r) => r.ok).length;
  console.log(`  ${okN} из ${rows.length} без замечаний`);
  rows.filter((r) => !r.ok).forEach((r) => console.log(`  ✗ ${r.tag}\n      ` + r.probs.join('\n      ')));
}

// ---------------------------------------------------------------- производительность
async function perfRun(rate) {
  const b = await chromium.launch({ args: GPU });
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.addInitScript(() => {
    try { localStorage.setItem('pt-consent', 'no'); } catch (e) {}
    window.__qa = { lt: [], cls: 0, lcp: 0, h1: 0, fr: [], rec: false };
    try { new PerformanceObserver((l) => l.getEntries().forEach((e) => window.__qa.lt.push([Math.round(e.startTime), Math.round(e.duration)]))).observe({ type: 'longtask', buffered: true }); } catch (e) {}
    try { new PerformanceObserver((l) => l.getEntries().forEach((e) => { if (!e.hadRecentInput) window.__qa.cls += e.value; })).observe({ type: 'layout-shift', buffered: true }); } catch (e) {}
    try { new PerformanceObserver((l) => l.getEntries().forEach((e) => { window.__qa.lcp = Math.round(e.startTime); })).observe({ type: 'largest-contentful-paint', buffered: true }); } catch (e) {}
    let prev = 0;
    const f = (t) => {
      const q = window.__qa;
      if (!q.h1) { const h = document.querySelector('h1 .ptx, h1.ptx'); if (h && parseFloat(getComputedStyle(h).opacity) > 0.9) q.h1 = Math.round(t); }
      if (q.rec && prev) q.fr.push(t - prev);
      prev = t; requestAnimationFrame(f);
    };
    requestAnimationFrame(f);
  });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate });
  await cdp.send('Performance.enable');
  await page.goto(BASE);
  await page.waitForTimeout(rate > 1 ? 6000 : 4000);
  const intro = await page.evaluate(() => ({ lt: window.__qa.lt.filter((x) => x[0] < 4000 * (window.__rate || 1)), h1: window.__qa.h1, lite: document.getElementById('pt-site').classList.contains('pt-lite') }));
  // прокрутка колесом до конца
  await page.mouse.move(720, 450);
  await page.evaluate(() => { window.__qa.fr = []; window.__qa.rec = true; });
  const H = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  for (let y = 0; y < H + 200; y += 100) { await page.mouse.wheel(0, 100); await page.waitForTimeout(60); }
  await page.waitForTimeout(2500);
  const fr = await page.evaluate(() => { window.__qa.rec = false; return window.__qa.fr; });
  // покой: 10 с без действий посреди страницы, потом 3 с замера — время главного потока на кадр
  await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight * 0.4, behavior: 'instant' }));
  await page.waitForTimeout(10000);
  const m0 = Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map((m) => [m.name, m.value]));
  const n0 = await page.evaluate(() => { window.__qa.fr = []; window.__qa.rec = true; return 0; });
  await page.waitForTimeout(3000);
  const m1 = Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map((m) => [m.name, m.value]));
  const idleFr = await page.evaluate(() => { window.__qa.rec = false; return window.__qa.fr.length; });
  const q = await page.evaluate(() => ({ cls: window.__qa.cls, lcp: window.__qa.lcp, lite: document.getElementById('pt-site').classList.contains('pt-lite') }));
  await b.close();
  const so = [...fr].sort((a, b) => a - b), pc = (p) => so.length ? so[Math.min(so.length - 1, Math.floor(so.length * p))] : 0;
  return { rate, introLongTasks: intro.lt.filter((x) => x[1] > 50).length, h1: intro.h1, cls: +q.cls.toFixed(4), lcp: q.lcp, frames: so.length, p50: +pc(0.5).toFixed(1), p95: +pc(0.95).toFixed(1), over50: so.filter((x) => x > 50).length, idleMsPerFrame: +(((m1.TaskDuration - m0.TaskDuration) * 1000) / Math.max(1, idleFr) / rate).toFixed(2), idleRaw: +(((m1.TaskDuration - m0.TaskDuration) * 1000) / Math.max(1, idleFr)).toFixed(2), lite: q.lite, liteIntro: intro.lite };
}
async function perf() {
  console.log('\nпроизводительность главной (Chromium, первый заход)');
  for (const rate of [1, 4]) {
    const r = await perfRun(rate), x4 = rate > 1;
    summary.perf.push(r);
    const lim = { lt: x4 ? BUDGET.introLongTasksX4 : BUDGET.introLongTasksDesktop, h1: x4 ? BUDGET.h1X4 : BUDGET.h1Desktop, p95: x4 ? BUDGET.scrollP95X4 : BUDGET.scrollP95Desktop, idle: x4 ? BUDGET.idleX4 : BUDGET.idleDesktop };
    const tag = `главная · CPU ×${rate}`, bad = [];
    if (r.introLongTasks > lim.lt) bad.push(`долгих задач за вступление ${r.introLongTasks} > ${lim.lt}`);
    if (!r.h1 || r.h1 > lim.h1) bad.push(`H1 читается на ${r.h1} мс > ${lim.h1}`);
    if (r.cls > BUDGET.cls) bad.push(`CLS ${r.cls} > ${BUDGET.cls}`);
    if (r.p95 > lim.p95) bad.push(`p95 кадра при прокрутке ${r.p95} мс > ${lim.p95}`);
    if (r.idleRaw > lim.idle) bad.push(`покой: главный поток ${r.idleRaw} мс на кадр > ${lim.idle}`);
    bad.forEach((x) => fail(tag, x));
    console.log(`  ${bad.length ? '✗' : '✓'} ${tag}: H1 ${r.h1} мс, долгих задач ${r.introLongTasks}, CLS ${r.cls}, LCP ${r.lcp} мс, кадры p50 ${r.p50} / p95 ${r.p95} мс, > 50 мс: ${r.over50} из ${r.frames}, покой ${r.idleRaw} мс/кадр${r.lite ? ', облегчённый режим' : ''}${bad.length ? '\n      ' + bad.join('\n      ') : ''}`);
  }
}

try {
  if (want('links')) await links();
  if (want('matrix')) await matrix();
  if (want('perf')) await perf();
} finally { srv.kill(); }
writeFileSync(path.join(OUT, 'summary.json'), JSON.stringify(summary, null, 2));
console.log(`\nитог: ${summary.fails.length ? `✗ замечаний ${summary.fails.length}` : '✓ без замечаний'} — tools/ref/qa/summary.json`);
process.exit(summary.fails.length ? 1 : 0);
