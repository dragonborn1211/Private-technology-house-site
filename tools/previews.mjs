// Снимки сайтов для превью в «Объектах»: node tools/previews.mjs
// По умолчанию карточка показывает этот снимок, а живой iframe грузится только при наведении.
// Перезапускай, когда сайты заметно поменялись. Кадр 1440×966 — та же область, что видна в превью.
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const SITES = [
  ['resonara', 'https://resonara.ru/'],
  ['antares', 'https://useantares.com/'],
];
const out = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'previews');
mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
for (const [name, url] of SITES) {
  // масштаб 2/3: файл 960×644, хватает на превью шириной ~400 px при двойной плотности экрана
  const page = await browser.newPage({ viewport: { width: 1440, height: 966 }, deviceScaleFactor: 2 / 3 });
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(5000); // интро-анимации сайта доигрывают
  await page.screenshot({ path: path.join(out, name + '.jpg'), type: 'jpeg', quality: 82 });
  console.log('✓', name, url);
  await page.close();
}
await browser.close();
