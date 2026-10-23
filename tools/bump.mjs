// Версии стилей и скриптов в адресах (TASK-qa.md, 4.3): после публикации браузер посетителя не должен брать старый JS
// из кэша к новому HTML. У каждого assets/*.css и assets/*.js во всех HTML корня — ?v=<8 знаков хеша его содержимого>:
// файл поменялся — поменялся адрес. Запускать после любой правки в assets/ перед коммитом:  node tools/bump.mjs
// check.mjs сверяет версии с содержимым файлов — забытый запуск роняет проверку.
// Это не сборка: файлы не меняются, только адреса в разметке — и ссылки с меткой внутри assets/*.js: 'perf-hud.js?v=…' в
// nav.js (загрузчик панели замеров, TASK-hud2). Их обновляем первыми — от них зависит хеш самого nav.js.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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
  console.log(`версии: ${Object.entries(v).map(([f, h]) => `${f} ${h}`).join(', ')}; страниц обновлено: ${n}${inner ? `, ссылок в assets: ${inner}` : ''}`);
}
