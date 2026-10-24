// Английские страницы для поиска (TASK-seo): en/index.html, en/services.html… — из русских страниц тем же словарём и правилами,
// что на сайте. Сам assets/i18n.js выполняется над разобранной страницей (linkedom): PTI18N.apply('en') переводит текстовые
// узлы, aria-label / title / alt, заголовок, описание, og:*, JSON-LD и переписывает ссылки на свои страницы на /en/…;
// PTI18N.conv — черновики сообщений (data-tg, data-wa), PTI18N.langHref — адреса переключателя. Своего словаря здесь нет.
// Дальше то, чего на сайте при переключении нет: <html lang="en">, canonical и og:url — на себя, og:locale:alternate, пути к
// файлам — от корня (/assets/…: страница лежит в /en/), предзагрузка — латинские начертания шрифтов, без комментариев
// разметки и комментариев во встроенных скриптах (русские), JSON-LD — адреса английских страниц и inLanguage.
// Запуск: node tools/build-en.mjs (его зовёт tools/bump.mjs при каждой выкладке); check.mjs собирает в памяти и сверяет с файлами.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { parseHTML } from 'linkedom';

const here = path.dirname(fileURLToPath(import.meta.url));
export const root = path.resolve(here, '..');
export const SITE = 'https://privatechouse.ru';
export const PAGES = ['index', 'services', 'cases', 'automations', 'process'];
export const ruPath = (name) => '/' + (name === 'index' ? '' : name);
export const enPath = (name) => '/en/' + (name === 'index' ? '' : name);
const ABS = /^(?:[a-z][a-z0-9+.-]*:|\/|#|\?)/i;

// i18n.js над страницей: свой location (русский адрес страницы на сайте), заглушки истории и событий
function runI18n(win, document, name, src) {
  const href = SITE + ruPath(name);
  const location = { href, origin: SITE, protocol: 'https:', pathname: ruPath(name), search: '', hash: '' };
  const history = { replaceState() {} };
  function CustomEvent(type, o) { this.type = type; this.detail = o && o.detail; }
  new Function('window', 'document', 'NodeFilter', 'location', 'history', 'CustomEvent', 'URL', src)(win, document, { SHOW_TEXT: 4 }, location, history, CustomEvent, URL);
  return win.PTI18N;
}

// относительный адрес файла — от корня (страница в /en/)
const rootUrl = (u) => (!u || ABS.test(u) ? u : '/' + u.replace(/^\.\//, ''));

export function buildEn(name, ruHtml, i18nSrc) {
  const { document } = parseHTML(ruHtml);
  // linkedom режет текст на узлы у каждой сущности (&nbsp;) — браузер даёт один узел; склеиваем, как в браузере
  document.documentElement.normalize();
  const I = runI18n({}, document, name, i18nSrc);
  I.apply('en');
  const head = document.head, de = document.documentElement;
  de.setAttribute('lang', 'en');
  // canonical, og:url — на себя; og:locale en_US (apply), рядом og:locale:alternate ru_RU
  const self = SITE + enPath(name);
  head.querySelector('link[rel="canonical"]').setAttribute('href', self);
  head.querySelector('meta[property="og:url"]').setAttribute('content', self);
  const loc = head.querySelector('meta[property="og:locale"]');
  loc.setAttribute('content', 'en_US');
  if (!head.querySelector('meta[property="og:locale:alternate"]')) {
    const alt = document.createElement('meta'); alt.setAttribute('property', 'og:locale:alternate'); alt.setAttribute('content', 'ru_RU');
    loc.after(alt);
  }
  // предзагрузка — латинские начертания тех же шрифтов (кириллические на английской странице не нужны)
  const seen = new Set();
  for (const l of [...head.querySelectorAll('link[rel="preload"][as="font"]')]) {
    const h = l.getAttribute('href').replace(/-cyrillic-/, '-latin-');
    if (seen.has(h)) { l.remove(); continue; }
    seen.add(h); l.setAttribute('href', h);
  }
  // переключатель: RU — русская страница, EN — эта
  for (const a of document.querySelectorAll('a[data-lang]')) a.setAttribute('href', a.getAttribute('data-lang') === 'ru' ? ruPath(name) : enPath(name));
  // черновики сообщений в Telegram / WhatsApp — тем же словарём; внутри скрытых <template> (их apply на сайте не видит) — и
  // aria-label / title / alt: страница в /en/ английская целиком
  const els = [...document.querySelectorAll('[data-tg],[data-wa]')].map((el) => [el, false]);
  for (const t of document.querySelectorAll('template')) { const q = [t]; while (q.length) { const n = q.shift(); for (const c of n.childNodes || []) if (c.nodeType === 1) { els.push([c, true]); q.push(c); } } }
  for (const [el, inT] of els) {
    for (const k of ['data-tg', 'data-wa'].concat(inT ? ['aria-label', 'title', 'alt'] : [])) {
      if (!el.hasAttribute(k)) continue;
      const v = I.conv(el.getAttribute(k)); if (v != null) el.setAttribute(k, v);
    }
    // ссылки в <template> — как на странице: свои — на английские, остальное — от корня
    if (inT && el.tagName === 'A' && el.hasAttribute('href') && !/^#/.test(el.getAttribute('href'))) { const h = I.langHref(el.getAttribute('href'), 'en'); if (h) el.setAttribute('href', h); }
    if (inT) for (const k of ['href', 'src', 'data-src']) if (el.hasAttribute(k)) el.setAttribute(k, rootUrl(el.getAttribute(k)));
  }
  // пути к файлам и оставшиеся относительные ссылки (политика) — от корня
  for (const el of document.querySelectorAll('[href],[src],[data-src],[srcset]')) {
    for (const k of ['href', 'src', 'data-src']) if (el.hasAttribute(k)) el.setAttribute(k, rootUrl(el.getAttribute(k)));
    if (el.hasAttribute('srcset')) el.setAttribute('srcset', el.getAttribute('srcset').split(',').map((p) => { const [u, ...w] = p.trim().split(/\s+/); return [rootUrl(u), ...w].join(' '); }).join(', '));
  }
  // JSON-LD: адреса страниц — английские (кроме адреса самой студии), язык сайта — en
  for (const sc of document.querySelectorAll('script[type="application/ld+json"]')) {
    const fix = (o) => {
      if (Array.isArray(o)) return o.map(fix);
      if (!o || typeof o !== 'object') return o;
      for (const k of Object.keys(o)) {
        const v = o[k];
        if ((k === 'item' || (k === 'url' && o['@type'] !== 'Organization')) && typeof v === 'string' && v.startsWith(SITE)) {
          const n = PAGES.find((p) => SITE + ruPath(p) === v); if (n) o[k] = SITE + enPath(n);
        } else if (k === 'inLanguage') o[k] = 'en';
        else o[k] = fix(v);
      }
      return o;
    };
    sc.textContent = JSON.stringify(fix(JSON.parse(sc.textContent)));
  }
  // комментарии разметки и встроенных скриптов (русские) — не нужны
  const walk = (n) => { for (const c of [...n.childNodes]) { if (c.nodeType === 8) c.remove(); else walk(c); } };
  walk(document);
  for (const sc of document.querySelectorAll('script:not([src]):not([type])')) sc.textContent = sc.textContent.replace(/\/\*[\s\S]*?\*\//g, '');
  return '<!doctype html>\n' + de.outerHTML + '\n';
}

export function buildAll() {
  const src = readFileSync(path.join(root, 'assets', 'i18n.js'), 'utf8');
  const out = {};
  for (const name of PAGES) out[path.join('en', name + '.html')] = buildEn(name, readFileSync(path.join(root, name + '.html'), 'utf8'), src);
  return out;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  mkdirSync(path.join(root, 'en'), { recursive: true });
  const out = buildAll();
  for (const [f, html] of Object.entries(out)) writeFileSync(path.join(root, f), html);
  console.log('английские страницы: ' + Object.keys(out).join(', '));
}
