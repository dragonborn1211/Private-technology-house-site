// Локальный просмотр сайта: node tools/serve.mjs [порт] → http://localhost:8080
// Отдаёт страницы корня и assets/ — ровно то, что уходит на хостинг, — и локальные эталоны tools/ref/. На несуществующий
// адрес (в том числе вложенный: /cases/abc) — 404.html со статусом 404, как GitHub Pages.
// Как на хостинге: текст (HTML, CSS, JS, SVG) сжат gzip — иначе локальный Lighthouse на медленной сети считает в три раза
// больше байт; Cache-Control: no-cache (перепроверка при каждом заходе), а не no-store — с no-store браузер не кладёт
// страницу в кэш «Назад» (bfcache).
import { createServer } from 'node:http';
import { gzipSync } from 'node:zlib';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = +process.argv[2] || 8080;
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2', '.ico': 'image/x-icon', '.xml': 'application/xml; charset=utf-8', '.txt': 'text/plain; charset=utf-8' };

createServer(async (req, res) => {
  const rel = decodeURIComponent(new URL(req.url, 'http://x').pathname).replace(/^\/+/, '') || 'index.html';
  const file = path.resolve(root, rel);
  // tools/ref/ — эталоны (только локально, в .gitignore), на хостинг не идут
  // в корне — страницы, sitemap / robots и иконки сайта
  const allowed = (path.dirname(file) === root && (/\.(html|xml|txt)$/.test(file) || /^(favicon\.(svg|ico)|apple-touch-icon\.png)$/.test(path.basename(file)))) || file.startsWith(path.join(root, 'assets') + path.sep) || file.startsWith(path.join(root, 'tools', 'ref') + path.sep);
  try {
    if (!allowed) throw new Error('not allowed');
    send(200, await readFile(file), path.extname(file));
  } catch {
    send(404, await readFile(path.join(root, '404.html')).catch(() => Buffer.from('not found')), '.html');
  }
  function send(code, body, ext) {
    const h = { 'Content-Type': TYPES[ext] || 'application/octet-stream', 'Cache-Control': 'no-cache', Vary: 'Accept-Encoding' };
    if (/\.(html|css|js|svg|xml|txt)$/.test(ext) && /\bgzip\b/.test(req.headers['accept-encoding'] || '')) { body = gzipSync(body); h['Content-Encoding'] = 'gzip'; }
    res.writeHead(code, h).end(body);
  }
}).listen(port, () => console.log(`http://localhost:${port}`));
