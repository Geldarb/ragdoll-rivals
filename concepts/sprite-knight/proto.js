import {drawBackdrop, drawGround} from '/art.js';

export const DURATION = 8.4;
const PX = 150, PY = 286;

const fpsWalk = 1 / 0.13;
const fpsRun = 1 / 0.11;

function smooth(t) { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); }
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      default: h = (r - g) / d + 4;
    }
    h /= 6;
  }
  return [h, s, l];
}
function hslToRgb(h, s, l) {
  const hue = (p, q, t) => {
    if (t < 0) t += 1; if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  let r, g, b;
  if (s === 0) r = g = b = l;
  else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue(p, q, h + 1 / 3); g = hue(p, q, h); b = hue(p, q, h - 1 / 3);
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

export function tintGold(img, hueShiftDeg) {
  const c = document.createElement('canvas');
  c.width = img.width; c.height = img.height;
  const ctx = c.getContext('2d');
  ctx.drawImage(img, 0, 0);
  const id = ctx.getImageData(0, 0, c.width, c.height);
  const d = id.data;
  const shift = ((hueShiftDeg % 360) + 360) % 360 / 360;
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i], g = d[i + 1], b = d[i + 2], a = d[i + 3];
    if (a < 24) continue;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const sat = max === 0 ? 0 : (max - min) / max;
    const lum = max / 255;
    const gold = r > 72 && g > 48 && r >= g - 8 && (r - b) > 18 && (g - b) > 6 && sat > 0.16 && lum > 0.22 && lum < 0.88;
    if (!gold) continue;
    const [h, s, l] = rgbToHsl(r, g, b);
    const [nr, ng, nb] = hslToRgb((h + shift) % 1, Math.min(1, s * 1.08), l);
    d[i] = nr; d[i + 1] = ng; d[i + 2] = nb;
  }
  ctx.putImageData(id, 0, 0);
  return c;
}

export async function loadKit() {
  const manifest = await fetch('./manifest.json').then(r => r.json());
  const images = {};
  await Promise.all(Object.keys(manifest.frames).map(name => new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => { images[name] = img; res(); };
    img.onerror = rej;
    img.src = './' + manifest.frames[name].file;
  })));
  const tinted = {};
  for (const [name, img] of Object.entries(images)) tinted[name] = tintGold(img, 148);
  return { manifest, images, tinted };
}

function pick(seq, t, frameDur, fade = 0.045) {
  if (seq.length === 1) return { a: seq[0], b: seq[0], k: 0 };
  const total = seq.length * frameDur;
  const u = ((t % total) + total) % total;
  const i = Math.min(seq.length - 1, Math.floor(u / frameDur));
  const local = (u - i * frameDur) / frameDur;
  const next = seq[(i + 1) % seq.length];
  const k = local > 1 - fade / frameDur ? (local - (1 - fade / frameDur)) / (fade / frameDur) : 0;
  return { a: seq[i], b: k > 0 ? next : seq[i], k: clamp(k, 0, 1) };
}

function between(t, a, b) { return t >= a && t < b; }
function span(t, a, b) { return clamp((t - a) / (b - a), 0, 1); }

export function sample(t) {
  const T = DURATION;
  t = clamp(t, 0, T - 0.0001);

  const walk = ['walk1', 'walk2', 'walk3', 'walk2'];
  const run = ['run1', 'run2', 'run3', 'run4', 'run5'];

  // Shared world targets
  const p1Start = 318, p1End = 398;
  const p2Start = 602, p2End = 522;

  let p1 = { name: 'p1', facing: 1, frame: 'idle', fade: 0, frameB: 'idle', x: p1Start, flash: 0 };
  let p2 = { name: 'p2', facing: -1, frame: 'idle', fade: 0, frameB: 'idle', x: p2Start, flash: 0 };

  // 0 – 0.35  idle
  // 0.35 – 1.85  walk in
  // 1.85 – 2.75  run in
  // 2.75 – 3.00  ready
  // 3.00 – 3.35  P1 raise, P2 ready
  // 3.35 – 3.85  P1 chop, P2 shield (block)
  // 3.85 – 4.15  recover
  // 4.15 – 4.50  P2 ready/sword_forward
  // 4.50 – 5.05  P2 slash, P1 stagger (hit)
  // 5.05 – 5.40  recover
  // 5.40 – 5.70  P1 sword_forward
  // 5.70 – 6.25  P1 lunge, P2 stagger
  // 6.25 – end   idle

  const approach = (who, start, end) => {
    if (t < 0.35) return start;
    if (t < 1.85) return start + (end - start) * 0.58 * smooth(span(t, 0.35, 1.85));
    if (t < 2.75) return start + (end - start) * (0.58 + 0.42 * smooth(span(t, 1.85, 2.75)));
    return end;
  };
  p1.x = approach(p1, p1Start, p1End);
  p2.x = approach(p2, p2Start, p2End);

  const apply = (who, rec) => { who.frame = rec.a; who.frameB = rec.b; who.fade = rec.k; };

  if (t < 0.35) {
    apply(p1, { a: 'idle', b: 'idle', k: 0 });
    apply(p2, { a: 'idle', b: 'idle', k: 0 });
  } else if (t < 1.85) {
    apply(p1, pick(walk, t - 0.35, 0.13));
    apply(p2, pick(walk, t - 0.35, 0.13));
  } else if (t < 2.75) {
    apply(p1, pick(run, t - 1.85, 0.11));
    apply(p2, pick(run, t - 1.85, 0.11));
  } else if (t < 3.00) {
    const k = smooth(span(t, 2.75, 2.95));
    apply(p1, { a: 'run5', b: 'ready', k });
    apply(p2, { a: 'run5', b: 'ready', k });
  } else if (t < 3.35) {
    apply(p1, { a: 'overhead_raise_a', b: 'overhead_raise_a', k: 0 });
    apply(p2, { a: 'ready', b: 'ready', k: 0 });
  } else if (t < 3.85) {
    const k = smooth(span(t, 3.35, 3.48));
    apply(p1, { a: 'overhead_raise_a', b: 'overhead_chop', k });
    apply(p2, { a: 'ready', b: 'shield_guard', k });
    p1.x += 10 * smooth(span(t, 3.35, 3.85));
  } else if (t < 4.15) {
    const k = smooth(span(t, 3.85, 4.10));
    apply(p1, { a: 'overhead_chop', b: 'ready', k });
    apply(p2, { a: 'shield_guard', b: 'ready', k });
  } else if (t < 4.50) {
    apply(p1, { a: 'ready', b: 'ready', k: 0 });
    apply(p2, { a: 'sword_forward', b: 'sword_forward', k: 0 });
  } else if (t < 5.05) {
    const k = smooth(span(t, 4.50, 4.62));
    apply(p2, { a: 'sword_forward', b: 'slash_trail', k });
    apply(p1, { a: 'ready', b: 'stagger', k: smooth(span(t, 4.62, 4.78)) });
    p2.x -= 12 * smooth(span(t, 4.50, 5.05));
    p1.x -= 22 * smooth(span(t, 4.68, 5.05));
    p1.flash = t < 4.85 ? 1 - span(t, 4.68, 4.85) : 0;
  } else if (t < 5.40) {
    const k = smooth(span(t, 5.05, 5.32));
    apply(p1, { a: 'stagger', b: 'ready', k });
    apply(p2, { a: 'slash_trail', b: 'ready', k });
  } else if (t < 5.70) {
    apply(p1, { a: 'sword_forward', b: 'sword_forward', k: 0 });
    apply(p2, { a: 'ready', b: 'ready', k: 0 });
  } else if (t < 6.25) {
    const k = smooth(span(t, 5.70, 5.84));
    apply(p1, { a: 'sword_forward', b: 'thrust_lunge', k });
    apply(p2, { a: 'ready', b: 'stagger', k: smooth(span(t, 5.86, 6.02)) });
    p1.x += 26 * smooth(span(t, 5.70, 6.25));
    p2.x += 20 * smooth(span(t, 5.90, 6.25));
    p2.flash = t < 6.15 ? 1 - span(t, 5.92, 6.15) : 0;
  } else {
    const k = smooth(span(t, 6.25, 6.60));
    apply(p1, { a: 'thrust_lunge', b: 'idle', k });
    apply(p2, { a: 'stagger', b: 'idle', k });
  }

  return { t, p1, p2 };
}

function drawSprite(ctx, kit, who, groundY) {
  const set = who.name === 'p2' ? kit.tinted : kit.images;
  const imgA = set[who.frame], imgB = set[who.frameB] || imgA;
  ctx.save();
  ctx.translate(who.x, groundY);
  ctx.scale(who.facing, 1);
  ctx.fillStyle = 'rgba(18,14,10,0.30)';
  ctx.beginPath(); ctx.ellipse(0, 5, 40, 8, 0, 0, Math.PI * 2); ctx.fill();
  const draw = (img, alpha) => {
    if (!img) return;
    ctx.globalAlpha = alpha;
    ctx.drawImage(img, -PX, -PY);
  };
  draw(imgA, 1 - who.fade);
  if (who.fade > 0.01) draw(imgB, who.fade);
  if (who.flash > 0) {
    ctx.globalAlpha = who.flash * 0.45;
    ctx.globalCompositeOperation = 'lighter';
    draw(imgB, who.flash * 0.45);
    ctx.globalCompositeOperation = 'source-over';
  }
  ctx.restore();
}

export function drawScene(ctx, kit, t, w, h) {
  const camX = 460;
  const zoom = w < 500 ? Math.min(0.92, w / 400) : Math.min(1.18, w / 980, h / 560);
  drawBackdrop(ctx, w, h, camX);
  ctx.save();
  ctx.translate(w / 2, h * (w < 500 ? 0.60 : 0.57));
  ctx.scale(zoom, zoom);
  ctx.translate(-camX, -340);
  drawGround(ctx);
  const pose = sample(t);
  // draw far (left/right by x) — p2 is usually to the right
  const order = pose.p1.x < pose.p2.x ? [pose.p1, pose.p2] : [pose.p2, pose.p1];
  for (const who of order) drawSprite(ctx, kit, who, 458);
  ctx.restore();
}
