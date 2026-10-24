// Версии стилей и скриптов в адресах (TASK-qa.md, 4.3): после публикации браузер посетителя не должен брать старый JS
// из кэша к новому HTML. У каждого assets/*.css и assets/*.js во всех HTML корня — ?v=<8 знаков хеша его содержимого>:
// файл поменялся — поменялся адрес. Запускать после любой правки в assets/ перед коммитом:  node tools/bump.mjs
// check.mjs сверяет версии с содержимым файлов — забытый запуск роняет проверку.
// Это не сборка: файлы не меняются, только адреса в разметке — и ссылки с меткой внутри assets/*.js: 'perf-hud.js?v=…' в
// nav.js (загрузчик панели замеров, TASK-hud2). Их обновляем первыми — от них зависит хеш самого nav.js.
// Следом (TASK-seo): английские страницы en/*.html — заново из русских (tools/build-en.mjs), и sitemap.xml — русские и
// английские адреса с парами hreflang, lastmod — дата последнего коммита страницы (есть незакоммиченные правки — сегодня).
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildAll, PAGES, SITE, ruPath, enPath } from './build-en.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// хеш по содержимому с переводами строк \n: клон на Windows приходит с CRLF, версия от этого меняться не должна
export function versions() {
  const v = {};
  for (const f of readdirSync(path.join(root, 'assets'))) {
    if (!/\.(css|js)$/.test(f)) continue;
    const body = readFileSync(path.join(root, 'assets', f), 'utf8').replace(/\r\n/g, '\n');
    v[f] = createHash('sha256').update(body).digest('hex').slice(0, 8);
  }
  return v;
}
// ссылка с меткой внутри assets/*.js: 'perf-hud.js?v=0123abcd' (только с меткой — новую ставим руками с любым ?v=)
export const INNER = /(['"])([\w.-]+\.(?:css|js))\?v=([0-9a-f]+)\1/g;
// src="assets/x.js", href="/assets/site.css", с версией или без
export const REF = /((?:src|href)=")(\/?assets\/)([\w.-]+\.(?:css|js))(?:\?v=[0-9a-f]+)?"/g;

// sitemap.xml: у каждой пары — те же три xhtml:link, что в <head> страниц (ru, en, x-default → русская); политика — без пар
function lastmod(file) {
  const git = (...a) => { try { return execFileSync('git', a, { cwd: root, encoding: 'utf8' }).trim(); } catch { return ''; } };
  const d = new Date(), today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  if (git('status', '--porcelain', '--', file)) return today;
  return git('log', '-1', '--format=%cs', '--', file) || today;
}
export function sitemap(mod = lastmod) {
  const alt = (n) => ['ru', 'en', 'x-default'].map((h) => `    <xhtml:link rel="alternate" hreflang="${h}" href="${SITE}${h === 'en' ? enPath(n) : ruPath(n)}"/>`).join('\n');
  const url = (loc, file, links) => `  <url>\n    <loc>${SITE}${loc}</loc>\n    <lastmod>${mod(file)}</lastmod>\n${links ? links + '\n' : ''}  </url>`;
  const list = [];
  for (const n of PAGES) list.push(url(ruPath(n), n + '.html', alt(n)), url(enPath(n), 'en/' + n + '.html', alt(n)));
  list.push(url('/privacy', 'privacy.html', ''));
  return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n' + list.join('\n') + '\n</urlset>\n';
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  // ссылки внутри assets — до стабильных хешей (цепочки нет, хватает двух проходов)
  let v = versions(), inner = 0;
  for (let pass = 0; pass < 3; pass++) {
    let changed = 0;
    for (const f of readdirSync(path.join(root, 'assets'))) {
      if (!f.endsWith('.js')) continue;
      const p = path.join(root, 'assets', f), s = readFileSync(p, 'utf8');
      const t = s.replace(INNER, (m, q, file) => (v[file] && file !== f ? `${q}${file}?v=${v[file]}${q}` : m));
      if (t !== s) { writeFileSync(p, t); changed++; inner++; }
    }
    if (!changed) break;
    v = versions();
  }
  let n = 0;
  for (const f of readdirSync(root)) {
    if (!f.endsWith('.html')) continue;
    const p = path.join(root, f), s = readFileSync(p, 'utf8');
    const t = s.replace(REF, (m, a, dir, file) => (v[file] ? `${a}${dir}${file}?v=${v[file]}"` : m));
    if (t !== s) { writeFileSync(p, t); n++; }
  }
  // английские страницы — из свежих русских
  mkdirSync(path.join(root, 'en'), { recursive: true });
  let en = 0;
  for (const [f, html] of Object.entries(buildAll())) {
    const p = path.join(root, f);
    let old = ''; try { old = readFileSync(p, 'utf8'); } catch {}
    if (old !== html) { writeFileSync(p, html); en++; }
  }
  const sm = sitemap(), smOld = readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
  if (sm !== smOld) writeFileSync(path.join(root, 'sitemap.xml'), sm);
  console.log(`версии: ${Object.entries(v).map(([f, h]) => `${f} ${h}`).join(', ')}; страниц обновлено: ${n}${inner ? `, ссылок в assets: ${inner}` : ''}; английских: ${en}${sm !== smOld ? '; sitemap.xml обновлён' : ''}`);
}
