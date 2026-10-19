// Снимки сайтов для превью в «Объектах»: node tools/previews.mjs
// По умолчанию карточка показывает этот снимок, а живой iframe грузится только при наведении.
// Перезапускай, когда сайты заметно поменялись. Кадр 1440×966 — та же область, что видна в превью.
// К каждому JPEG — WebP 960 и 480 px (TASK-qa.md, 4.3: <picture> в разметке, браузер берёт размер под карточку; JPEG —
// для браузеров без WebP). node tools/previews.mjs --webp — только пересобрать WebP из лежащих JPEG, сайты не снимать.
import { chromium } from 'playwright';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const SITES = [
  ['resonara', 'https://resonara.ru/'],
  ['antares', 'https://useantares.com/'],
];
const WEBP = [960, 480], Q = 0.8;
const out = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'previews');
mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
// WebP — через холст браузера: без лишних зависимостей
async function webp(name) {
  const page = await browser.newPage();
  const jpg = 'data:image/jpeg;base64,' + readFileSync(path.join(out, name + '.jpg')).toString('base64');
  for (const w of WEBP) {
    const data = await page.evaluate(async ({ jpg, w, Q }) => {
      const img = new Image(); img.src = jpg; await img.decode();
      const c = document.createElement('canvas'); c.width = w; c.height = Math.round(img.naturalHeight * w / img.naturalWidth);
      const g = c.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(img, 0, 0, c.width, c.height);
      return c.toDataURL('image/webp', Q);
    }, { jpg, w, Q });
    writeFileSync(path.join(out, `${name}-${w}.webp`), Buffer.from(data.split(',')[1], 'base64'));
  }
  await page.close();
  console.log('✓', name, 'webp', WEBP.join(' / '));
}
for (const [name, url] of SITES) {
  if (!process.argv.includes('--webp')) {
    // масштаб 2/3: файл 960×644, хватает на превью шириной ~400 px при двойной плотности экрана
    const page = await browser.newPage({ viewport: { width: 1440, height: 966 }, deviceScaleFactor: 2 / 3 });
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
    await page.waitForTimeout(5000); // интро-анимации сайта доигрывают
    await page.screenshot({ path: path.join(out, name + '.jpg'), type: 'jpeg', quality: 82 });
    console.log('✓', name, url);
    await page.close();
  }
  await webp(name);
}
await browser.close();
