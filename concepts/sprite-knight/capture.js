import {chromium} from 'playwright';
import express from 'express';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import fs from 'node:fs';
import {createServer as createHttpServer} from 'node:http';
import {spawnSync} from 'node:child_process';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');
const out = path.join(root, 'concepts/sprite-knight');
const app = express();
app.use((req, res, next) => { res.set('Access-Control-Allow-Origin', '*'); next(); });
app.use(express.static(path.join(root, 'public')));
app.use('/concepts/sprite-knight', express.static(out));
const server = createHttpServer(app);
await new Promise(r => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;

const browser = await chromium.launch();

async function record(tag, w, h, dest) {
  const dir = path.join(out, `_frames-${tag}`);
  fs.mkdirSync(dir, {recursive: true});
  const page = await browser.newPage({viewport: {width: w, height: h}});
  page.on('pageerror', e => console.error(tag, e.message));
  await page.goto(`${base}/concepts/sprite-knight/viewer.html?w=${w}&h=${h}&t=0`, {waitUntil: 'networkidle', timeout: 30000});
  await page.waitForFunction(() => window.__ready, {timeout: 20000});
  const duration = await page.evaluate(() => window.DURATION);
  const fps = 24;
  const n = Math.round(duration * fps);
  for (let i = 0; i <= n; i++) {
    const t = i / fps;
    await page.evaluate(tt => window.seek(tt), t);
    await page.screenshot({path: path.join(dir, `f${String(i).padStart(4, '0')}.png`)});
  }
  if (tag === '1280') {
    await page.evaluate(() => window.seek(3.55));
    await page.screenshot({path: path.join(out, 'arena-still.png')});
    console.log('wrote arena-still.png');
  }
  await page.close();
  const ff = spawnSync('ffmpeg', [
    '-y', '-framerate', String(fps), '-i', path.join(dir, 'f%04d.png'),
    '-c:v', 'libvpx-vp9', '-pix_fmt', 'yuv420p', '-g', '12', '-b:v', tag === '1280' ? '1.6M' : '700k',
    dest
  ], {stdio: 'inherit'});
  if (ff.status !== 0) throw new Error('ffmpeg failed ' + tag);
  console.log('wrote', dest);
}

await record('1280', 1280, 720, path.join(out, 'test-knight.webm'));
await record('390', 390, 664, path.join(out, 'test-knight-390.webm'));
await browser.close();
server.close();
console.log('done');
