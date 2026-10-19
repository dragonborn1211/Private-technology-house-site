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
const summary = { date: new Date().toISOString(), links: [], matrix: [], perf: [], fails: [], notes: [] };
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
async function perfRun(rate, pg = '') {
  const home = !pg;
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
      if (q.rec && prev) q.fr.push([Math.round(t), t - prev]);
      prev = t; requestAnimationFrame(f);
    };
    requestAnimationFrame(f);
    // когда включился облегчённый режим: бюджет p95 при CPU ×4 — по кадрам после него (TASK-qa.md, 4.1)
    document.addEventListener('DOMContentLoaded', () => {
      const r = document.getElementById('pt-site'); if (!r) return;
      const chk = () => { if (!window.__qa.liteAt && r.classList.contains('pt-lite')) window.__qa.liteAt = Math.round(performance.now()); };
      chk(); new MutationObserver(chk).observe(r, { attributes: true, attributeFilter: ['class'] });
    });
  });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate });
  await cdp.send('Performance.enable');
  await page.goto(BASE + pg);
  await page.waitForTimeout(rate > 1 ? 6000 : 4000);
  const intro = await page.evaluate(() => ({ lt: window.__qa.lt.filter((x) => x[0] < 4000 * (window.__rate || 1)), h1: window.__qa.h1, lite: document.getElementById('pt-site').classList.contains('pt-lite') }));
  // прокрутка колесом до конца
  await page.mouse.move(720, 450);
  await page.evaluate(() => { window.__qa.fr = []; window.__qa.rec = true; });
  const H = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  for (let y = 0; y < H + 200; y += 100) { await page.mouse.wheel(0, 100); await page.waitForTimeout(60); }
  await page.waitForTimeout(2500);
  const { fr, liteAt } = await page.evaluate(() => { window.__qa.rec = false; return { fr: window.__qa.fr, liteAt: window.__qa.liteAt || 0 }; });
  // покой: 10 с без действий, потом 3 с трассы — время главного потока на кадр. Курсор — у левого края, ни над чем
  // (над карточкой схемы чаще идут импульсы — это уже не покой). Два места: первый экран (посетитель открыл сайт и читает)
  // и середина страницы
  await page.mouse.move(5, 450);
  const idleAt = async (frac) => {
    if (!home) return { med: 0, p90: 0, n: 0 };
    await page.evaluate((f) => window.scrollTo({ top: (document.documentElement.scrollHeight - innerHeight) * f, behavior: 'instant' }), frac);
    await page.waitForTimeout(10000);
    const chunks = [], onData = (e) => chunks.push(...e.value); cdp.on('Tracing.dataCollected', onData);
    const tdone = new Promise((r) => cdp.once('Tracing.tracingComplete', r));
    await cdp.send('Tracing.start', { categories: 'toplevel,cc,devtools.timeline,disabled-by-default-devtools.timeline,disabled-by-default-devtools.timeline.frame', transferMode: 'ReportEvents' });
    await page.waitForTimeout(3000);
    await cdp.send('Tracing.end'); await tdone; cdp.off('Tracing.dataCollected', onData);
    const thr = chunks.find((e) => e.name === 'thread_name' && e.args.name === 'CrRendererMain');
    const mev = chunks.filter((e) => thr && e.pid === thr.pid && e.tid === thr.tid);
    // границы кадров — ProxyMain::BeginMainFrame; задачи — только верхнего уровня (RunTask и вложенный в него
    // ThreadControllerImpl::RunTask — одна и та же задача)
    const bmf = mev.filter((e) => e.name === 'ProxyMain::BeginMainFrame').map((e) => e.ts).sort((x, y) => x - y);
    const all = mev.filter((e) => e.ph === 'X' && e.dur && (e.name === 'RunTask' || e.name === 'ThreadControllerImpl::RunTask')).sort((x, y) => x.ts - y.ts || y.dur - x.dur);
    const tasks = []; let endT = -1;
    for (const t of all) if (t.ts >= endT) { tasks.push(t); endT = t.ts + t.dur; }
    // кадр — задача главного потока, внутри которой BeginMainFrame (rAF движка и сцен, стили, раскладка, отрисовка)
    const per = [];
    for (const ts of bmf) { const t = tasks.find((x) => x.ts <= ts && x.ts + x.dur >= ts); if (t) per.push(t.dur / 1000); }
    per.sort((x, y) => x - y);
    return { med: per.length ? per[per.length >> 1] : 0, p90: per.length ? per[Math.floor(per.length * 0.9)] : 0, n: per.length };
  };
  const idleTop = await idleAt(0), idleMid = await idleAt(0.4);
  const idleMed = Math.max(idleTop.med, idleMid.med), idleP90 = Math.max(idleTop.p90, idleMid.p90);
  const q = await page.evaluate(() => ({ cls: window.__qa.cls, lcp: window.__qa.lcp, lite: document.getElementById('pt-site').classList.contains('pt-lite') }));
  await b.close();
  const pcOf = (arr, p) => { const a = [...arr].sort((x, y) => x - y); return a.length ? a[Math.min(a.length - 1, Math.floor(a.length * p))] : 0; };
  const so = fr.map((x) => x[1]), pc = (p) => pcOf(so, p);
  const aft = liteAt ? fr.filter((x) => x[0] >= liteAt).map((x) => x[1]) : [];
  return { rate, introLongTasks: intro.lt.filter((x) => x[1] > 50).length, h1: intro.h1, cls: +q.cls.toFixed(4), lcp: q.lcp, page: pg || 'index', frames: so.length, p50: +pc(0.5).toFixed(1), p95: +pc(0.95).toFixed(1), p95lite: aft.length >= 30 ? +pcOf(aft, 0.95).toFixed(1) : null, liteAt, over50: so.filter((x) => x > 50).length, idleRaw: +idleMed.toFixed(2), idleP90: +idleP90.toFixed(2), idleTop: +idleTop.med.toFixed(2), idleMid: +idleMid.med.toFixed(2), idleFrames: idleTop.n + idleMid.n, lite: q.lite, liteIntro: intro.lite };
}
async function perf() {
  console.log('\nпроизводительность (Chromium, первый заход): главная — вступление, прокрутка, покой; услуги и каталог — прокрутка');
  for (const pg of ['', 'services.html', 'automations.html']) for (const rate of [1, 4]) {
    const r = await perfRun(rate, pg), x4 = rate > 1, home = !pg;
    summary.perf.push(r);
    const lim = { lt: x4 ? BUDGET.introLongTasksX4 : BUDGET.introLongTasksDesktop, h1: x4 ? BUDGET.h1X4 : BUDGET.h1Desktop, p95: x4 ? BUDGET.scrollP95X4 : BUDGET.scrollP95Desktop, idle: x4 ? BUDGET.idleX4 : BUDGET.idleDesktop };
    // при CPU ×4 бюджет прокрутки — после включения облегчённого режима (если он включился)
    const p95 = x4 && r.p95lite != null ? r.p95lite : r.p95;
    const tag = `${home ? 'главная' : pg} · CPU ×${rate}`, bad = [];
    if (home && r.introLongTasks > lim.lt) bad.push(`долгих задач за вступление ${r.introLongTasks} > ${lim.lt}`);
    if (!r.h1 || r.h1 > lim.h1) bad.push(`H1 читается на ${r.h1} мс > ${lim.h1}`);
    if (r.cls > BUDGET.cls) bad.push(`CLS ${r.cls} > ${BUDGET.cls}`);
    if (p95 > lim.p95) bad.push(`p95 кадра при прокрутке ${p95} мс > ${lim.p95}`);
    if (home && r.idleRaw > lim.idle) bad.push(`покой: медиана работы главного потока ${r.idleRaw} мс на кадр > ${lim.idle}`);
    bad.forEach((x) => fail(tag, x));
    console.log(`  ${bad.length ? '✗' : '✓'} ${tag}: H1 ${r.h1} мс, ${home ? `долгих задач ${r.introLongTasks}, ` : ''}CLS ${r.cls}, LCP ${r.lcp} мс, кадры p50 ${r.p50} / p95 ${r.p95}${r.p95lite != null ? ` (после облегчённого режима ${r.p95lite})` : ''} мс, > 50 мс: ${r.over50} из ${r.frames}${home ? `, покой: медиана ${r.idleRaw} (первый экран ${r.idleTop}, середина ${r.idleMid}) / p90 ${r.idleP90} мс на кадр` : ''}${r.lite ? ', облегчённый режим' : ''}${bad.length ? '\n      ' + bad.join('\n      ') : ''}`);
  }
}

// ---------------------------------------------------------------- сценарии (инвентарь TASK-qa.md, раздел 2)
// Только то, чего нет в check.mjs, — в Chromium и WebKit (Safari, встроенный браузер Telegram на iPhone)
async function open(b, url, o = {}) {
  const w = o.w || 1440, mob = w < 760;
  const ctx = await b.newContext({ viewport: { width: w, height: o.h || (mob ? 844 : 900) }, deviceScaleFactor: mob ? 3 : 1, isMobile: mob, hasTouch: mob, reducedMotion: o.rm ? 'reduce' : 'no-preference' });
  if (o.consent !== false) await ctx.addInitScript(() => { try { localStorage.setItem('pt-consent', 'no'); } catch (e) {} });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push('pageerror: ' + e.message.slice(0, 120)));
  page.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text().slice(0, 120)); });
  await page.goto(BASE + url);
  return { ctx, page, errs };
}
const SCEN = {
  // RU / EN на лету: тексты, подписи, черовики, плашка cookie; ?lang=en сохраняется при переходе
  async lang(b) {
    const bad = [], { ctx, page, errs } = await open(b, 'index.html', { consent: false });
    await page.waitForTimeout(4800);
    await page.click('[data-sec="hero"] [data-lang="en"]'); await page.waitForTimeout(4200);
    const r = await page.evaluate(() => {
      const re = /[А-Яа-яЁё]/, out = [];
      const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      for (let t; (t = tw.nextNode());) if (re.test(t.textContent) && !t.parentElement.closest('script, style, template, [lang="ru"]')) out.push(t.textContent.trim().slice(0, 30));
      document.querySelectorAll('[aria-label], [title], [alt]').forEach((e) => ['aria-label', 'title', 'alt'].forEach((a) => { const v = e.getAttribute(a); if (v && re.test(v) && !e.closest('[lang="ru"], template')) out.push(a + ': ' + v.slice(0, 30)); }));
      const drafts = [...document.querySelectorAll('a[href*="?text="]')].map((a) => decodeURIComponent(a.href.split('?text=')[1])).filter((t) => re.test(t));
      const ck = document.querySelector('.ck'); return { lang: document.documentElement.lang, cyr: out, drafts, ck: ck && !ck.hidden ? re.test(ck.textContent) : null, url: location.search };
    });
    if (r.lang !== 'en' || r.url.indexOf('lang=en') < 0) bad.push(`язык ${r.lang}, адрес ${r.url}`);
    if (r.cyr.length) bad.push('кириллица после переключения: ' + r.cyr.slice(0, 4).join(' | '));
    if (r.drafts.length) bad.push('черновики по-русски: ' + r.drafts.slice(0, 2).join(' | '));
    if (r.ck) bad.push('плашка cookie по-русски');
    // переход по пункту меню сохраняет язык
    const w = page.viewportSize().width;
    if (w >= 1200) { await Promise.all([page.waitForNavigation(), page.click('[data-sec="hero"] .nav a[href="cases.html"]')]); }
    else { await page.click('[data-sec="hero"] [data-menu-open]'); await page.waitForTimeout(400); await Promise.all([page.waitForNavigation(), page.click('[data-menu] .menu-nav a[href="cases.html"]')]); }
    await page.waitForTimeout(600);
    const u = page.url(), hl = await page.evaluate(() => document.documentElement.lang);
    if (!/cases\.html\?lang=en/.test(u) || hl !== 'en') bad.push(`переход из EN: ${u.replace(BASE, '/')}, lang=${hl}`);
    bad.push(...errs); await ctx.close(); return bad;
  },
  // «Обсудить проект»: клавиатура, Esc и фокус, клик мимо, второй клик, aria-expanded; в липкой шапке — так же
  async channels(b, w) {
    const bad = [], { ctx, page, errs } = await open(b, 'services.html?intro=instant', { w });
    await page.waitForTimeout(700);
    const st = (sel) => page.evaluate((sel) => { const c = document.querySelector(sel), p = c.querySelector('.cm-pop'), btn = c.querySelector('.cm-btn'), r = p.getBoundingClientRect(); return { open: !p.hidden, exp: btn.getAttribute('aria-expanded'), focusIn: p.contains(document.activeElement), focusBtn: document.activeElement === btn, inView: p.hidden || (r.left >= 0 && r.right <= innerWidth + 0.5) }; }, sel);
    const H = '[data-sec="hero"] .cm';
    await page.focus(H + ' .cm-btn'); await page.keyboard.press('Enter'); await page.waitForTimeout(250);
    let s = await st(H); if (!s.open || s.exp !== 'true' || !s.inView) bad.push(`Enter: ${JSON.stringify(s)}`);
    await page.keyboard.press('Escape'); await page.waitForTimeout(200);
    s = await st(H); if (s.open || s.exp !== 'false' || !s.focusBtn) bad.push(`Esc: ${JSON.stringify(s)}`);
    await page.click(H + ' .cm-btn'); await page.waitForTimeout(200); await page.mouse.click(5, 300); await page.waitForTimeout(200);
    s = await st(H); if (s.open) bad.push('клик мимо не закрыл');
    await page.click(H + ' .cm-btn'); await page.waitForTimeout(150); await page.click(H + ' .cm-btn'); await page.waitForTimeout(200);
    s = await st(H); if (s.open) bad.push('второй клик не закрыл');
    // липкая шапка: вниз, потом немного вверх
    await page.evaluate(() => window.scrollTo({ top: 2600, behavior: 'instant' })); await page.waitForTimeout(250);
    await page.evaluate(() => window.scrollTo({ top: 2400, behavior: 'instant' })); await page.waitForTimeout(500);
    const T = '[data-topbar] .cm';
    await page.click(T + ' .cm-btn'); await page.waitForTimeout(250);
    s = await st(T); if (!s.open || !s.inView) bad.push(`липкая шапка: ${JSON.stringify(s)}`);
    bad.push(...errs); await ctx.close(); return bad;
  },
  // «к содержанию» — первый Tab; меню телефона: закрытое не фокусируется, открытое держит фокус, Esc закрывает
  async focus(b) {
    const bad = [], { ctx, page, errs } = await open(b, 'cases.html?intro=instant', { w: 390 });
    await page.waitForTimeout(700);
    // Safari по умолчанию водит Tab только по кнопкам и полям (ссылки — с Option+Tab) — клавиатурные проверки в Chromium,
    // в WebKit — только запертая страница под меню
    const wk = b.browserType().name() === 'webkit';
    if (wk) {
      summary.notes.push('WebKit: Tab по умолчанию пропускает ссылки (настройка Safari) — порядок фокуса и ловушка меню проверены в Chromium');
      await page.click('[data-sec="hero"] [data-menu-open]'); await page.waitForTimeout(450);
      const lk = await page.evaluate(() => document.documentElement.classList.contains('pt-lock') && getComputedStyle(document.documentElement).overflow === 'hidden' && document.querySelector('[data-menu]').classList.contains('on'));
      if (!lk) bad.push('меню не открылось или страница под ним не заперта');
      await page.keyboard.press('Escape'); await page.waitForTimeout(350);
      if (await page.evaluate(() => document.querySelector('[data-menu]').classList.contains('on'))) bad.push('Esc не закрыл меню');
      bad.push(...errs); await ctx.close(); return bad;
    }
    await page.keyboard.press('Tab');
    let a = await page.evaluate(() => document.activeElement.className);
    if (!/\bskip\b/.test(a)) bad.push(`первый Tab — «${a}», а не «к содержанию»`);
    await page.keyboard.press('Enter'); await page.waitForTimeout(900);
    a = await page.evaluate(() => document.activeElement.id);
    if (a !== 'main') bad.push(`«к содержанию» → фокус на «${a}»`);
    for (let i = 0; i < 25; i++) { await page.keyboard.press('Tab'); if (await page.evaluate(() => !!document.activeElement.closest('[data-menu]'))) { bad.push('фокус зашёл в закрытое меню'); break; } }
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' })); await page.waitForTimeout(200);
    await page.click('[data-sec="hero"] [data-menu-open]'); await page.waitForTimeout(450);
    for (let i = 0; i < 30; i++) { await page.keyboard.press('Tab'); if (!(await page.evaluate(() => !!document.activeElement.closest('[data-menu]')))) { bad.push(`фокус ушёл из открытого меню на ${i + 1}-м Tab`); break; } }
    // колесо (мобильный WebKit колеса не знает — там страницу держит html.pt-lock с overflow: hidden)
    const y0 = await page.evaluate(() => scrollY);
    try { await page.mouse.wheel(0, 600); await page.waitForTimeout(300); if ((await page.evaluate(() => scrollY)) !== y0) bad.push('страница под меню прокрутилась'); }
    catch (e) { const lk = await page.evaluate(() => document.documentElement.classList.contains('pt-lock') && getComputedStyle(document.documentElement).overflow === 'hidden'); if (!lk) bad.push('страница под меню не заперта (pt-lock / overflow)'); }
    await page.keyboard.press('Escape'); await page.waitForTimeout(350);
    if (await page.evaluate(() => document.querySelector('[data-menu]').classList.contains('on'))) bad.push('Esc не закрыл меню');
    bad.push(...errs); await ctx.close(); return bad;
  },
  // якоря на странице: цель не под шапкой и вспыхивает; «Назад» возвращает; прямой заход по ссылке с хешем
  async anchors(b, w) {
    const bad = [];
    for (const pg of ['services.html', 'process.html', 'index.html']) {
      const { ctx, page, errs } = await open(b, pg, { w });
      await page.waitForTimeout(4200);
      await page.evaluate(() => { window.__fl = 0; new MutationObserver((ms) => ms.forEach((m) => { if (/pt-arrive/.test(m.target.className && m.target.className.baseVal === undefined ? m.target.className : '')) window.__fl++; })).observe(document.body, { subtree: true, attributes: true, attributeFilter: ['class'] }); });
      const links = await page.evaluate(() => [...document.querySelectorAll('#pt-site .sec a[href^="#"]')].filter((a) => !/^#(main|top)$/.test(a.getAttribute('href')) && a.getClientRects().length && getComputedStyle(a).visibility !== 'hidden').map((a) => a.getAttribute('href')));
      for (const href of [...new Set(links)].slice(0, 8)) {
        await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' })); await page.waitForTimeout(300);
        const before = await page.evaluate(() => window.__fl);
        const el = page.locator(`#pt-site .sec a[href="${href}"]`).first();
        await el.scrollIntoViewIfNeeded(); const y0 = await page.evaluate(() => scrollY);
        await el.click(); await page.waitForTimeout(2600);
        // верх цели — её первый заголовок (у секции сверху свой отступ, он может уйти под шапку), пустая метка — её секция
        const r = await page.evaluate((h) => { const t = document.getElementById(h.slice(1)); const sec = t.closest('[data-sec]'), ar = (t.children.length || t.textContent.trim()) ? t : sec; const hd = ar.matches('h1, h2, h3, h4') ? ar : ar.querySelector('h1, h2, h3, h4, .gh-w, .sv-t') || ar; const rr = hd.getBoundingClientRect(), tb = document.querySelector('[data-topbar]'); const top = tb && tb.classList.contains('on') ? tb.getBoundingClientRect().bottom : 0; return { top: Math.round(rr.top), bar: Math.round(top), hash: location.hash, fl: window.__fl, vh: innerHeight }; }, href);
        if (r.top < r.bar - 2 || r.top > r.vh * 0.6) bad.push(`${pg} ${href}: цель на ${r.top} (шапка ${r.bar})`);
        if (r.fl === before) bad.push(`${pg} ${href}: цель не вспыхнула`);
        if (r.hash !== href) bad.push(`${pg} ${href}: в адресе ${r.hash}`);
        await page.goBack(); await page.waitForTimeout(1200);
        const yb = await page.evaluate(() => scrollY);
        if (Math.abs(yb - y0) > 80) bad.push(`${pg} ${href}: «Назад» → ${Math.round(yb)}, было ${Math.round(y0)}`);
      }
      bad.push(...errs.map((e) => pg + ': ' + e)); await ctx.close();
    }
    // прямой заход по ссылке с хешем: модуль собран и не под шапкой
    const { ctx, page, errs } = await open(b, 'services.html#automation', { w });
    await page.waitForTimeout(3800);
    const r = await page.evaluate(() => { const t = document.getElementById('automation'); return { top: Math.round(t.getBoundingClientRect().top), done: t.closest('[data-sec]').classList.contains('s-done') }; });
    if (!r.done || r.top < 40 || r.top > 300) bad.push(`прямой заход services.html#automation: ${JSON.stringify(r)}`);
    bad.push(...errs); await ctx.close();
    return bad;
  },
  // фильтры: хеш, прямой заход, быстрые клики подряд — карточки не налезают, видимых чётное число
  async filters(b, w) {
    const bad = [];
    for (const [pg, direct, want] of [['cases.html', '#ai', 'ai'], ['automations.html', '#f-reports', 'reports']]) {
      const { ctx, page, errs } = await open(b, pg + direct + (direct ? '' : ''), { w });
      await page.waitForTimeout(4500);
      let pressed = await page.evaluate(() => (document.querySelector('.fl-b[aria-pressed="true"]') || {}).dataset?.filter);
      if (pressed !== want) bad.push(`${pg}${direct}: нажата «${pressed}»`);
      const btns = page.locator('.fl-b:visible'), n = await btns.count();
      for (let k = 0; k < n * 2; k++) await btns.nth(k % n).click({ delay: 0 });
      await page.waitForTimeout(1300);
      const r = await page.evaluate(() => {
        const cards = [...document.querySelectorAll('.obj-grid .obj')].filter((c) => !c.hidden && c.getClientRects().length).map((c) => c.getBoundingClientRect());
        let over = 0; for (let i = 0; i < cards.length; i++) for (let j = i + 1; j < cards.length; j++) { const a = cards[i], c = cards[j]; if (a.left < c.right - 2 && c.left < a.right - 2 && a.top < c.bottom - 2 && c.top < a.bottom - 2) over++; }
        const grid = document.querySelector('.obj-grid').getBoundingClientRect(), low = Math.max(...cards.map((c) => c.bottom));
        return { n: cards.length, over, hash: location.hash, cut: low > grid.bottom + 2, pressed: (document.querySelector('.fl-b[aria-pressed="true"]') || {}).dataset?.filter };
      });
      if (r.over) bad.push(`${pg}: после быстрых кликов карточки налезают (${r.over})`);
      if (r.cut) bad.push(`${pg}: сетка ниже карточек обрезана`);
      if (pg === 'cases.html' && r.n % 2) bad.push(`${pg}: видно ${r.n} — нечётно`);
      if ((r.pressed || '') !== (r.hash.replace(/^#(f-)?/, '') || '')) bad.push(`${pg}: нажата «${r.pressed}», хеш «${r.hash}»`);
      bad.push(...errs.map((e) => pg + ': ' + e)); await ctx.close();
    }
    return bad;
  },
  // «Ещё N» на телефоне: раскрывает, фокус остаётся на кнопке, «Свернуть» возвращает
  async more(b) {
    const bad = [], { ctx, page, errs } = await open(b, 'services.html?intro=instant', { w: 390 });
    await page.waitForTimeout(700);
    const btn = page.locator('.sv-more').first();
    await btn.scrollIntoViewIfNeeded(); await btn.focus(); await page.keyboard.press('Enter'); await page.waitForTimeout(500);
    let r = await page.evaluate(() => { const b = document.querySelector('.sv-more'), id = b.getAttribute('aria-controls'), rows = [...document.getElementById(id).children].filter((li) => li.getClientRects().length && getComputedStyle(li).visibility !== 'hidden'); return { exp: b.getAttribute('aria-expanded'), focus: document.activeElement === b, rows: rows.length, all: document.getElementById(id).children.length }; });
    if (r.exp !== 'true' || !r.focus || r.rows !== r.all) bad.push(`«Ещё»: ${JSON.stringify(r)}`);
    await page.keyboard.press('Enter'); await page.waitForTimeout(500);
    r = await page.evaluate(() => { const b = document.querySelector('.sv-more'); return { exp: b.getAttribute('aria-expanded'), focus: document.activeElement === b }; });
    if (r.exp !== 'false' || !r.focus) bad.push(`«Свернуть»: ${JSON.stringify(r)}`);
    bad.push(...errs); await ctx.close(); return bad;
  },
  // клавиатура и свой скроллбар
  async scroll(b) {
    const bad = [], { ctx, page, errs } = await open(b, 'services.html?intro=instant');
    await page.waitForTimeout(700); await page.mouse.click(5, 450);
    const y = () => page.evaluate(() => Math.round(scrollY));
    const H = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
    for (const [key, test] of [['PageDown', (a, c) => c - a > 500], ['Space', (a, c) => c - a > 500], ['ArrowDown', (a, c) => c > a], ['End', (a, c) => c > H - 5], ['Home', (a, c) => c < 5]]) {
      const a = await y(); await page.keyboard.press(key); await page.waitForTimeout(900); const c = await y();
      if (!test(a, c)) bad.push(`${key}: ${a} → ${c}`);
    }
    await page.mouse.wheel(0, 400); await page.waitForTimeout(900);
    const sb = await page.evaluate(() => { const t = document.querySelector('[data-sbar-thumb]').getBoundingClientRect(), bar = document.querySelector('[data-sbar]'); return { on: bar.classList.contains('on'), x: t.left + t.width / 2, y: t.top + t.height / 2, bot: t.bottom }; });
    if (!sb.on) bad.push('свой скроллбар не появился при прокрутке');
    else {
      const a = await y(); await page.mouse.move(sb.x, sb.y); await page.mouse.down(); await page.mouse.move(sb.x, sb.y + 120, { steps: 6 }); await page.mouse.up(); await page.waitForTimeout(300);
      const c = await y(); if (c - a < 300) bad.push(`перетаскивание ползунка: ${a} → ${c}`);
      const s2 = await page.evaluate(() => { const t = document.querySelector('[data-sbar-thumb]').getBoundingClientRect(); return { x: t.left + t.width / 2, bot: t.bottom }; });
      const d = await y(); await page.mouse.click(s2.x, Math.min(880, s2.bot + 60)); await page.waitForTimeout(1300);
      const e = await y(); if (e - d < 400) bad.push(`клик по дорожке: ${d} → ${e}`);
    }
    bad.push(...errs); await ctx.close(); return bad;
  },
  // Быстрая прокрутка до конца и обратно: видимые секции собраны не позже 1.8 с. Секции собираются по очереди в одном
  // темпе (~0.78 с): если на экране сразу две несобранные (контакт и подвал), вторая готова к ~1.5 с. Ускорять очередь
  // владелец отказался («соседние блоки собирались вразнобой») — порог на две сборки; ≤ 1 с — на решение владельца
  async fast(b) {
    const bad = [], { ctx, page, errs } = await open(b, 'index.html');
    await page.waitForTimeout(4200);
    for (const to of ['bottom', 'mid', 'top']) {
      await page.evaluate((to) => window.scrollTo({ top: to === 'bottom' ? document.documentElement.scrollHeight : to === 'mid' ? document.documentElement.scrollHeight * 0.45 : 0, behavior: 'instant' }), to);
      await page.waitForTimeout(1800);
      const nd = await page.evaluate(() => [...document.querySelectorAll('[data-sec]')].filter((s) => { const r = s.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight && !s.classList.contains('s-done'); }).map((s) => s.dataset.sec));
      if (nd.length) bad.push(`${to}: через 1.8 с не собраны ${nd.join(', ')}`);
    }
    bad.push(...errs); await ctx.close(); return bad;
  },
  // жизненный цикл: скрытая вкладка, «назад» из кэша, обновление и переход посреди сборки, ресайз посреди сборки
  async life(b) {
    const bad = [];
    { // скрытая вкладка — кадры не идут
      const { ctx, page, errs } = await open(b, 'index.html?intro=instant');
      await page.waitForTimeout(800);
      await page.evaluate(() => { window.__raf = 0; const f = () => { window.__raf++; requestAnimationFrame(f); }; requestAnimationFrame(f); });
      const other = await ctx.newPage(); await other.goto(BASE + 'privacy.html'); await other.bringToFront(); await page.waitForTimeout(300);
      const vis = await page.evaluate(() => document.visibilityState);
      const a = await page.evaluate(() => window.__raf); await page.waitForTimeout(1000); const c = await page.evaluate(() => window.__raf);
      if (vis === 'hidden' && c - a > 3) bad.push(`скрытая вкладка: ${c - a} кадров за 1 с`);
      // headless не прячет вкладку; кадры на скрытой вкладке браузер и так не даёт, таймеров-циклов в коде нет
      if (vis !== 'hidden') summary.notes.push('скрытая вкладка: в headless не скрывается — проверено по коду (rAF, setInterval только у печати статуса)');
      bad.push(...errs); await ctx.close();
    }
    { // «назад» из кэша: страница оживает
      const { ctx, page, errs } = await open(b, 'index.html?intro=instant');
      await page.waitForTimeout(1200);
      await page.evaluate(() => { window.__bf = 'x'; addEventListener('pageshow', (e) => { window.__ps = e.persisted; }); });
      await Promise.all([page.waitForNavigation(), page.evaluate(() => { location.href = 'privacy.html'; })]); await page.waitForTimeout(600);
      await page.goBack(); await page.waitForTimeout(1200);
      const r = await page.evaluate(() => new Promise((ok) => { const c0 = document.querySelector('[data-pt-canvas]'); let n = 0; const f = () => { if (++n < 20) requestAnimationFrame(f); else ok({ bf: window.__bf, ps: window.__ps, alive: !!c0 }); }; requestAnimationFrame(f); }));
      // Playwright запускает Chromium с --disable-back-forward-cache, и даже без него управляемый браузер bfcache не
      // даёт (BackForwardCacheDisabledForDelegate) — только сведения; блокеров (unload / beforeunload) проверяет check.mjs
      if (r.bf !== 'x') summary.notes.push('«назад» из кэша (bfcache): в управляемом браузере недоступен — проверить в Chrome вручную (DevTools → Application → Back/forward cache)');
      bad.push(...errs); await ctx.close();
    }
    { // обновление и переход посреди сборки, ресайз посреди сборки
      const { ctx, page, errs } = await open(b, 'index.html');
      await page.waitForTimeout(1000); await page.reload(); await page.waitForTimeout(1200);
      await page.setViewportSize({ width: 1024, height: 768 }); await page.waitForTimeout(4000);
      const r = await page.evaluate(() => ({ hero: document.querySelector('[data-sec="hero"]').classList.contains('s-done'), over: document.documentElement.scrollWidth - innerWidth }));
      if (!r.hero || r.over > 1) bad.push(`обновление и ресайз посреди сборки: ${JSON.stringify(r)}`);
      await page.waitForTimeout(200); await page.reload(); await page.waitForTimeout(900);
      await Promise.all([page.waitForNavigation(), page.evaluate(() => { location.href = 'services.html'; })]); await page.waitForTimeout(4200);
      const s = await page.evaluate(() => document.querySelector('[data-sec="hero"]').classList.contains('s-done'));
      if (!s) bad.push('переход посреди сборки: услуги не собрались');
      bad.push(...errs); await ctx.close();
    }
    return bad;
  },
};
async function interact() {
  console.log('\nсценарии (инвентарь)');
  const plan = [['lang', [1440]], ['channels', [1440, 390, 320]], ['focus', [390]], ['anchors', [1440, 390]], ['filters', [1440, 390]], ['more', [390]], ['scroll', [1440]], ['fast', [1440]], ['life', [1440]]];
  const only = process.env.QA_SCEN ? process.env.QA_SCEN.split(',') : null;
  summary.inventory = [];
  for (const [bn, bt] of [['chromium', chromium], ['webkit', webkit]]) {
    if (process.env.QA_BROWSERS && !process.env.QA_BROWSERS.split(',').includes(bn)) continue;
    const b = await bt.launch(bn === 'chromium' ? { args: GPU } : {});
    for (const [name, widths] of plan) {
      if (only && !only.includes(name)) continue;
      for (const w of widths) {
        let bad; try { bad = await SCEN[name](b, w); } catch (e) { bad = ['сбой: ' + e.message.split('\n')[0].slice(0, 160)]; }
        const tag = `${name} · ${w} · ${bn}`;
        summary.inventory.push({ tag, ok: !bad.length, bad });
        bad.forEach((x) => fail(tag, x));
        console.log(`  ${bad.length ? '✗' : '✓'} ${tag}${bad.length ? '\n      ' + bad.join('\n      ') : ''}`);
      }
    }
    await b.close();
  }
}

try {
  if (want('links')) await links();
  if (want('matrix')) await matrix();
  if (want('interact')) await interact();
  if (want('perf')) await perf();
} finally { srv.kill(); }
summary.notes = [...new Set(summary.notes)];
writeFileSync(path.join(OUT, 'summary.json'), JSON.stringify(summary, null, 2));
if (summary.notes.length) console.log('\nсведения (не ошибки):\n  ' + summary.notes.join('\n  '));
console.log(`\nитог: ${summary.fails.length ? `✗ замечаний ${summary.fails.length}` : '✓ без замечаний'} — tools/ref/qa/summary.json`);
process.exit(summary.fails.length ? 1 : 0);
