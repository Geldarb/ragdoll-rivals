import { chromium } from 'playwright';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import { createServer } from 'node:http';
import { spawnSync } from 'node:child_process';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');
const out = path.join(root, 'concepts/2.3');
const app = express();
app.use((req, res, next) => { res.set('Access-Control-Allow-Origin', '*'); next(); });
app.use(express.static(path.join(root, 'public')));
app.use('/concepts/2.3', express.static(out));
const server = createServer(app);
await new Promise(r => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;

const browser = await chromium.launch();

async function shot(pagePath, file, w, h) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  page.on('pageerror', e => console.error('pageerror', e.message));
  await page.goto(`${base}/concepts/2.3/viewer.html?${pagePath}`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForFunction(() => window.__ready, { timeout: 20000 });
  await page.screenshot({ path: path.join(out, file) });
  await page.close();
  console.log('wrote', file);
}

await shot('mode=lineup&w=1280&h=720', 'lineup.png', 1280, 720);
await shot('mode=duel&w=1280&h=720&t=5.85', 'arena-duel.png', 1280, 720);

async function record(tag, w, h, dest) {
  const dir = path.join(out, `_frames-${tag}`);
  fs.mkdirSync(dir, { recursive: true });
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  page.on('pageerror', e => console.error(tag, e.message));
  await page.goto(`${base}/concepts/2.3/viewer.html?w=${w}&h=${h}&t=0`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForFunction(() => window.__ready, { timeout: 20000 });
  const duration = await page.evaluate(() => window.DURATION);
  const fps = 60;
  const n = Math.round(duration * fps);
  const issues = [];
  for (let i = 0; i <= n; i++) {
    const t = i / fps;
    await page.evaluate(tt => window.seek(tt), t);
    await page.screenshot({ path: path.join(dir, `f${String(i).padStart(4, '0')}.png`) });
    if (i % 15 === 0) {
      const v = await page.evaluate(tt => window.validateAt(tt), t);
      for (const who of ['p1', 'p2']) {
        if (!v[who].knees.ok) issues.push(`t=${t.toFixed(2)} ${who} knees sR=${v[who].knees.sR.toFixed(1)} sL=${v[who].knees.sL.toFixed(1)}`);
        if (v[who].grip > 48) issues.push(`t=${t.toFixed(2)} ${who} weapon-hand ${v[who].grip.toFixed(1)}`);
      }
    }
  }
  await page.close();
  if (issues.length) {
    console.log('validation issues', issues.length);
    issues.slice(0, 20).forEach(x => console.log(' ', x));
  } else {
    console.log(tag, 'validation ok (knees forward, weapons in hand) at sampled frames');
  }
  const ff = spawnSync('ffmpeg', [
    '-y', '-framerate', String(fps), '-i', path.join(dir, 'f%04d.png'),
    '-c:v', 'libvpx-vp9', '-pix_fmt', 'yuv420p', '-g', '30',
    '-b:v', tag === '1280' ? '2.2M' : '800k',
    dest,
  ], { stdio: 'inherit' });
  if (ff.status !== 0) throw new Error('ffmpeg failed ' + tag);
  console.log('wrote', dest);
}

await record('1280', 1280, 720, path.join(out, 'preview.webm'));
await record('390', 390, 664, path.join(out, 'preview-390.webm'));
await browser.close();
server.close();
console.log('done');
