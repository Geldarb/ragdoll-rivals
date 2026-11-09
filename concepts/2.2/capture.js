import {chromium} from 'playwright';
import express from 'express';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import fs from 'node:fs';
import {createServer as createHttpServer} from 'node:http';
import {spawnSync} from 'node:child_process';
import {createMatch, isolateOpponent, stepMatch} from '../../server/combat.js';
import {DEFAULT_BUILD} from '../../shared/rules.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');
const out = path.join(root, 'concepts/2.2');
fs.mkdirSync(out, {recursive: true});

const app = express();
app.use((req, res, next) => { res.set('Access-Control-Allow-Origin', '*'); next(); });
app.use(express.static(path.join(root, 'public')));
app.use('/concepts/2.2', express.static(out));
const server = createHttpServer(app);
await new Promise(r => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;

const oldMatch = createMatch({...structuredClone(DEFAULT_BUILD), helmet: 'helm', armour: 'leather', shield: 'buckler', weapon: 'sword'}, DEFAULT_BUILD, {seed: 8});
isolateOpponent(oldMatch);
oldMatch.fighters[0].think = 1e9;
oldMatch.fighters[0].cooldown = 1e9;
oldMatch.fighters[0].guard = true;
oldMatch.fighters[0].movement = 0;
for (let i = 0; i < 50; i++) stepMatch(oldMatch);
const oldF = oldMatch.fighters[0];
const oldSnapshot = {
  build: oldF.build,
  facing: 1,
  parts: Object.fromEntries(Object.entries(oldF.parts).map(([k, p]) => [k, {x: p.position.x, y: p.position.y, a: p.angle}]))
};

const browser = await chromium.launch();
const errors = [];
const sizes = {
  'character-turnaround': [2200, 1280],
  'stance-sheet': [2460, 920],
  'walk-cycle': [2460, 840],
  'attack-keyframes': [2260, 1780],
  'moves-sheet': [2360, 1520],
  'side-by-side': [1800, 980]
};

async function shot(name) {
  const [w, h] = sizes[name];
  const page = await browser.newPage({viewport: {width: w, height: h}});
  page.on('pageerror', e => { errors.push(`${name}: ${e.message}`); console.error(name, e.message); });
  page.on('console', m => { if (m.type() === 'error') console.error(name, m.text()); });
  await page.addInitScript(old => { window.__old = old; }, oldSnapshot);
  await page.goto(`${base}/concepts/2.2/viewer.html?sheet=${name}`, {waitUntil: 'networkidle', timeout: 20000});
  await page.waitForFunction(() => window.__ready, {timeout: 20000});
  await page.screenshot({path: path.join(out, `${name}.png`), type: 'png'});
  await page.close();
  console.log('wrote', name + '.png');
}

for (const name of Object.keys(sizes)) await shot(name);

const previewDir = path.join(out, '_preview-frames');
fs.mkdirSync(previewDir, {recursive: true});
const page = await browser.newPage({viewport: {width: 1280, height: 720}});
page.on('pageerror', e => errors.push('preview: ' + e.message));
let frame = 0;
for (let i = 0; i < 24; i++, frame++) {
  await page.goto(`${base}/concepts/2.2/viewer.html?sheet=preview&kind=idle&t=${i / 24}`, {waitUntil: 'networkidle'});
  await page.waitForFunction(() => window.__ready);
  await page.screenshot({path: path.join(previewDir, `f${String(frame).padStart(3, '0')}.png`)});
}
for (let i = 0; i < 24; i++, frame++) {
  await page.goto(`${base}/concepts/2.2/viewer.html?sheet=preview&kind=walk&t=${i / 12}`, {waitUntil: 'networkidle'});
  await page.waitForFunction(() => window.__ready);
  await page.screenshot({path: path.join(previewDir, `f${String(frame).padStart(3, '0')}.png`)});
}
await page.close();
console.log('encoded preview frames', frame);
const ff = spawnSync('ffmpeg', ['-y', '-framerate', '12', '-i', path.join(previewDir, 'f%03d.png'), '-c:v', 'libvpx-vp9', '-pix_fmt', 'yuv420p', '-b:v', '1M', path.join(out, 'preview.webm')], {stdio: 'inherit'});
if (ff.status !== 0) {
  spawnSync('ffmpeg', ['-y', '-framerate', '12', '-i', path.join(previewDir, 'f%03d.png'), '-c:v', 'libvpx', '-pix_fmt', 'yuv420p', path.join(out, 'preview.webm')], {stdio: 'inherit'});
}

await browser.close();
await new Promise(r => server.close(r));
if (errors.length) { console.error(errors); process.exit(1); }
console.log('done', fs.readdirSync(out).filter(f => !f.startsWith('_') && (f.endsWith('.png') || f.endsWith('.webm'))));
