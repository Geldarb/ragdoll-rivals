import {chromium} from 'playwright';
import express from 'express';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import fs from 'node:fs';
import {createServer as createHttpServer} from 'node:http';
import {spawnSync} from 'node:child_process';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');
const out = path.join(root, 'concepts/2.2b');
fs.mkdirSync(out, {recursive: true});

const app = express();
app.use((req, res, next) => { res.set('Access-Control-Allow-Origin', '*'); next(); });
app.use(express.static(path.join(root, 'public')));
app.use('/concepts/2.2b', express.static(out));
const server = createHttpServer(app);
await new Promise(r => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;

const boxesPath = path.join(out, 'reference', 'boxes.json');
const refBoxes = fs.existsSync(boxesPath) ? JSON.parse(fs.readFileSync(boxesPath, 'utf8')) : null;

const browser = await chromium.launch();
const errors = [];
const sizes = {
  'pose-sheet': [2400, 1680],
  'gear-variants': [2360, 1280],
  'in-arena': [1860, 1080],
  'compare-reference': [1200, 4200]
};

async function shot(name) {
  const [w, h] = sizes[name];
  const page = await browser.newPage({viewport: {width: w, height: h}});
  page.on('pageerror', e => { errors.push(`${name}: ${e.message}`); console.error(name, e.message); });
  page.on('console', m => { if (m.type() === 'error') console.error(name, m.text()); });
  if (refBoxes) await page.addInitScript(boxes => { window.__refBoxes = boxes; }, refBoxes);
  await page.goto(`${base}/concepts/2.2b/viewer.html?sheet=${name}`, {waitUntil: 'networkidle', timeout: 20000});
  await page.waitForFunction(() => window.__ready, {timeout: 20000});
  await page.screenshot({path: path.join(out, `${name}.png`), type: 'png'});
  await page.close();
  console.log('wrote', name + '.png');
}

for (const name of Object.keys(sizes)) await shot(name);

const previewDir = path.join(out, '_preview-frames');
fs.mkdirSync(previewDir, {recursive: true});
const page = await browser.newPage({viewport: {width: 1280, height: 720}});
let frame = 0;
const seq = [
  ...Array.from({length: 18}, (_, i) => ({kind: 'walk', t: i / 18})),
  ...Array.from({length: 18}, (_, i) => ({kind: 'run', t: i / 18})),
  ...Array.from({length: 24}, (_, i) => ({kind: 'combo', t: i / 24}))
];
for (const step of seq) {
  await page.goto(`${base}/concepts/2.2b/viewer.html?sheet=preview&kind=${step.kind}&t=${step.t}`, {waitUntil: 'networkidle'});
  await page.waitForFunction(() => window.__ready);
  await page.screenshot({path: path.join(previewDir, `f${String(frame).padStart(3, '0')}.png`)});
  frame++;
}
await page.close();
const ff = spawnSync('ffmpeg', ['-y', '-framerate', '12', '-i', path.join(previewDir, 'f%03d.png'), '-c:v', 'libvpx-vp9', '-pix_fmt', 'yuv420p', '-b:v', '1.2M', path.join(out, 'preview.webm')], {stdio: 'inherit'});
if (ff.status !== 0) console.error('ffmpeg failed', ff.status);
await browser.close();
server.close();
if (errors.length) console.error(errors);
console.log('done', fs.readdirSync(out).filter(f => f.endsWith('.png') || f.endsWith('.webm')));
