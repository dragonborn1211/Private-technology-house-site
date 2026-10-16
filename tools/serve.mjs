// Локальный просмотр сайта: node tools/serve.mjs [порт] → http://localhost:8080
// Отдаёт страницы корня и assets/ — ровно то, что уходит на хостинг, — и локальные эталоны tools/ref/. На несуществующий
// адрес (в том числе вложенный: /cases/abc) — 404.html со статусом 404, как GitHub Pages.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = +process.argv[2] || 8080;
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2', '.xml': 'application/xml; charset=utf-8', '.txt': 'text/plain; charset=utf-8' };

createServer(async (req, res) => {
  const rel = decodeURIComponent(new URL(req.url, 'http://x').pathname).replace(/^\/+/, '') || 'index.html';
  const file = path.resolve(root, rel);
  // tools/ref/ — эталоны (только локально, в .gitignore), на хостинг не идут
  const allowed = (path.dirname(file) === root && /\.(html|xml|txt)$/.test(file)) || file.startsWith(path.join(root, 'assets') + path.sep) || file.startsWith(path.join(root, 'tools', 'ref') + path.sep);
  try {
    if (!allowed) throw new Error('not allowed');
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' }).end(body);
  } catch {
    const body = await readFile(path.join(root, '404.html')).catch(() => 'not found');
    res.writeHead(404, { 'Content-Type': TYPES['.html'], 'Cache-Control': 'no-store' }).end(body);
  }
}).listen(port, () => console.log(`http://localhost:${port}`));
