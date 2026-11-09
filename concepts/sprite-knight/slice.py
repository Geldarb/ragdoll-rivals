#!/usr/bin/env python3
"""Slice Bradley's 6x4 knight sheet into aligned, matted frames."""
from __future__ import annotations
import json
from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent
SRC = ROOT / 'reference' / 'main-sheet.png'
FRAMES = ROOT / 'frames'
FRAMES.mkdir(exist_ok=True)

CELL_NAMES = [
    ['idle', 'walk1', 'walk2', 'walk3', 'run1', 'run2'],
    ['run3', 'run4', 'run5', 'overhead_raise_a', 'sword_forward', 'slash_trail'],
    ['thrust_lunge', 'ready', 'high_guard', 'overhead_raise_b', 'overhead_chop', 'sweep_slash'],
    ['stagger', 'kneel', 'crouch_getup', 'walk_low', 'shield_guard', 'ground_strike'],
]
CELL_LABELS = [
    ['Idle', 'Walk 1', 'Walk 2', 'Walk 3', 'Run 1', 'Run 2'],
    ['Run 3', 'Run 4', 'Run 5', 'Overhead raise', 'Sword-forward step', 'Slash (trail)'],
    ['Thrust / lunge', 'Ready stance', 'High guard', 'Overhead raise 2', 'Overhead chop', 'Sweep-slash (trail)'],
    ['Stagger', 'Kneel', 'Crouch / get-up', 'Low walk', 'Shield guard', 'Ground strike'],
]

# Canonical frame: room for swords and debris, feet on a shared baseline.
FW, FH = 300, 320
PX, PY = 150, 286  # pivot: hip/torso x, foot baseline y
TARGET_HELM = 46.0  # pixels; set after measuring, we normalize to median


def load_sheet():
    im = Image.open(SRC).convert('RGBA')
    arr = np.array(im)
    h, w = arr.shape[:2]
    assert w % 6 == 0 and h % 4 == 0, (w, h)
    return arr, h // 4, w // 6


def is_spark(rgb, alpha):
    value = rgb.max(axis=2)
    sat = rgb.max(axis=2) - rgb.min(axis=2)
    return (alpha > 20) & (value >= 165) & (sat <= 55)


def clean_cell(cell):
    """Remove dark/black fringes, keep soft edges, no pale halo."""
    rgba = cell.astype(np.float32)
    rgb, a = rgba[:, :, :3], rgba[:, :, 3]
    # drop near-invisible dust
    a = np.where(a < 16, 0, a)
    # tighten: anything very transparent and very dark is a black-bg fringe
    dark = rgb.max(axis=2) < 28
    a = np.where((a < 90) & dark, 0, a)

    mask = a > 24
    # slight open to drop 1px specks
    from numpy.lib.stride_tricks import sliding_window_view
    # morphological open/close with a 3x3 all-true kernel via scipy-less pad
    def dilate(m):
        p = np.pad(m, 1, constant_values=False)
        out = np.zeros_like(m)
        for dy in (-1, 0, 1):
            for dx in (-1, 0, 1):
                out |= p[1+dy:1+dy+m.shape[0], 1+dx:1+dx+m.shape[1]]
        return out
    def erode(m):
        p = np.pad(m, 1, constant_values=True)
        out = np.ones_like(m, dtype=bool)
        for dy in (-1, 0, 1):
            for dx in (-1, 0, 1):
                out &= p[1+dy:1+dy+m.shape[0], 1+dx:1+dx+m.shape[1]]
        return out
    mask = dilate(erode(mask))  # open
    mask = erode(dilate(mask))  # close

    # distance-from-interior for soft edge (interior = eroded mask)
    interior = erode(mask)
    # nearest interior colour for fringe pixels
    yy, xx = np.indices(mask.shape)
    if interior.any():
        iy, ix = np.where(interior)
        # only recolour low-alpha or very-dark fringe (not sparks)
        fringe = mask & (~interior)
        if fringe.any():
            fy, fx = np.where(fringe)
            # downsample interior for speed
            step = max(1, len(iy) // 4000)
            iy_s, ix_s = iy[::step], ix[::step]
            # chunk to avoid huge memory
            nearest_rgb = rgb.copy()
            batch = 2000
            src_rgb = rgb[iy_s, ix_s]
            for i0 in range(0, len(fy), batch):
                yb, xb = fy[i0:i0+batch], fx[i0:i0+batch]
                dy = yb[:, None] - iy_s[None, :]
                dx = xb[:, None] - ix_s[None, :]
                j = (dy * dy + dx * dx).argmin(axis=1)
                nearest_rgb[yb, xb] = src_rgb[j]
            # blend fringe colour toward interior (kills black rim)
            fade = (a[:, :, None] / 255.0)
            rgb = np.where(fringe[:, :, None], nearest_rgb * 0.75 + rgb * 0.25, rgb)

    # rebuild alpha from mask with a 1px feather
    # exterior distance
    inv = ~mask
    # simple box feather: alpha 255 inside eroded, 140 on mask-only ring, 0 outside
    a2 = np.zeros_like(a)
    a2[interior] = 255
    ring = mask & (~interior)
    a2[ring] = np.clip(a[ring] * 1.15, 0, 230)
    # keep original alpha where it was already a deliberate soft trail/spark
    spark = is_spark(rgb, a)
    a2 = np.where(spark, np.maximum(a2, a), a2)
    # trails: bright pixels just outside the opened mask but originally visible
    extra = spark & (~mask) & (a > 30)
    a2[extra] = a[extra]
    rgb = np.where(extra[:, :, None], cell[:, :, :3], rgb)

    out = np.dstack([np.clip(rgb, 0, 255), np.clip(a2, 0, 255)]).astype(np.uint8)
    return out


def body_mask(cell):
    rgb = cell[:, :, :3].astype(np.int16)
    a = cell[:, :, 3]
    spark = is_spark(rgb, a)
    return (a > 40) & ~spark


def find_head(mask):
    """Top of the helm, skipping a thin raised sword or crest.

    A closed great-helm is itself ~24-36px wide, so a long narrow run is not
    enough to call something a weapon. A raised sword is a shaft that then
    jumps to a much wider blob (hands on the grip) before the real helm.
    """
    ys = np.where(mask.any(axis=1))[0]
    y0, y1 = int(ys.min()), int(ys.max())

    def rowinfo(y):
        cols = np.where(mask[y])[0]
        if len(cols) == 0:
            return 0, 0
        return int(mask[y].sum()), int(cols[-1] - cols[0] + 1)

    first = None
    for y in range(y0, y1):
        count, width = rowinfo(y)
        if count >= 16 and width >= 24:
            first = y
            break
    if first is None:
        return y0

    shaft = 0
    for y in range(first, min(first + 40, y1)):
        count, width = rowinfo(y)
        if 18 <= width <= 40 and count >= 12:
            shaft += 1
        else:
            break
    next_w = rowinfo(first + shaft)[1] if first + shaft < y1 else 0
    # raised sword: long shaft then a sudden jump to hands/guard
    if shaft >= 12 and next_w >= 55:
        y = first + shaft
        while y < y1 and rowinfo(y)[1] >= 48:
            y += 1
        for yy in range(y, min(y + 24, y1)):
            count, width = rowinfo(yy)
            if count >= 20 and 28 <= width <= 60:
                return yy
        return y
    return first


def find_foot(mask, head):
    """Lowest row that looks like a boot, not a sword tip or spark."""
    counts = mask.sum(axis=1)
    ys = np.where(mask.any(axis=1))[0]
    y1 = int(ys.max())
    for y in range(y1, head, -1):
        if counts[y] >= 16:
            return int(y)
    return y1


def torso_run(mask, head, foot):
    dense = []
    for frac in np.linspace(0.32, 0.58, 12):
        y = int(head + frac * (foot - head))
        y = int(np.clip(y, 0, mask.shape[0] - 1))
        cols = np.where(mask[y])[0]
        if len(cols) == 0:
            continue
        gaps = np.where(np.diff(cols) > 2)[0]
        starts = np.r_[0, gaps + 1]
        ends = np.r_[gaps, len(cols) - 1]
        dense.append(int(np.max(ends - starts + 1)))
    return float(np.median(dense)) if dense else 60.0


def measure(cell):
    m = body_mask(cell)
    if not m.any():
        return None
    ys, xs = np.where(m)
    y0, y1 = int(ys.min()), int(ys.max())
    head = find_head(m)
    foot = find_foot(m, head)
    char_h = int(foot - head + 1)
    # helm box from true head downward until silhouette widens into shoulders
    widths = []
    for y in range(head, min(head + 70, m.shape[0])):
        cols = np.where(m[y])[0]
        widths.append(0 if len(cols) == 0 else int(cols[-1] - cols[0] + 1))
    early = max(widths[:6]) if widths else 24
    helm_h = 18
    for i, w in enumerate(widths):
        if i > 8 and w > max(early * 1.7, early + 16):
            helm_h = i
            break
        helm_h = i + 1
    helm_w = max(widths[:helm_h]) if widths[:helm_h] else early

    ya, yb = int(head + 0.34 * (foot - head)), int(head + 0.64 * (foot - head))
    band = np.zeros_like(m)
    band[ya:yb] = m[ya:yb]
    hip_x = float(np.where(band)[1].mean()) if band.any() else float(xs.mean())

    return {
        'head': int(head),
        'raw_top': y0,
        'foot': int(foot),
        'body_h': char_h,
        'helm_h': int(np.clip(helm_h, 14, 70)),
        'helm_w': int(helm_w),
        'torso': torso_run(m, head, foot),
        'hip_x': hip_x,
        'bbox': (int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())),
    }


def place(cell, m, scale):
    """Scale around hip/foot and paste into the canonical frame."""
    src = Image.fromarray(cell, 'RGBA')
    nw, nh = max(1, int(round(src.width * scale))), max(1, int(round(src.height * scale)))
    scaled = src.resize((nw, nh), Image.Resampling.LANCZOS)
    sarr = np.array(scaled)
    # scale measurements
    hip_x = m['hip_x'] * scale
    foot = m['foot'] * scale
    frame = np.zeros((FH, FW, 4), np.uint8)
    # dest top-left so that (hip_x, foot) maps to (PX, PY)
    dx = int(round(PX - hip_x))
    dy = int(round(PY - foot))
    # paste with clipping
    sx0 = max(0, -dx); sy0 = max(0, -dy)
    dx0 = max(0, dx); dy0 = max(0, dy)
    sx1 = min(nw, FW - dx0 + sx0); sy1 = min(nh, FH - dy0 + sy0)
    if sx1 > sx0 and sy1 > sy0:
        patch = sarr[sy0:sy1, sx0:sx1]
        dest = frame[dy0:dy0 + (sy1 - sy0), dx0:dx0 + (sx1 - sx0)]
        pa = patch[:, :, 3:4].astype(np.float32) / 255.0
        dest[:, :, :3] = (patch[:, :, :3] * pa + dest[:, :, :3] * (1 - pa)).astype(np.uint8)
        dest[:, :, 3] = np.clip(dest[:, :, 3] + patch[:, :, 3] * (1 - dest[:, :, 3] / 255.0), 0, 255).astype(np.uint8)
        frame[dy0:dy0 + (sy1 - sy0), dx0:dx0 + (sx1 - sx0)] = dest
    return frame


def main():
    sheet, ch, cw = load_sheet()
    cells = []
    print(f'sheet {sheet.shape[1]}x{sheet.shape[0]} cell {cw}x{ch}')
    raw = []
    for r in range(4):
        for c in range(6):
            name = CELL_NAMES[r][c]
            cell = clean_cell(sheet[r * ch:(r + 1) * ch, c * cw:(c + 1) * cw])
            m = measure(cell)
            raw.append((name, r, c, cell, m))
            print(f'  [{r},{c}] {name:18s} char_h={m["body_h"]:3d} head={m["head"]:3d} foot={m["foot"]:3d} hip={m["hip_x"]:5.1f} torso={m["torso"]:5.1f}')

    # Two painted sizes live on the sheet: large 3/4 hero poses, and smaller side-on cycles.
    # Target the side-on walk/ready height so scale does not pop between those clips.
    TARGET = 192.0
    LARGE = {'idle', 'shield_guard', 'overhead_raise_a', 'overhead_chop'}
    SHORT = {'run1', 'run3', 'run5', 'slash_trail', 'kneel', 'crouch_getup',
             'walk_low', 'ground_strike'}
    print('char heights', {n: m['body_h'] for n, *_, m in raw})

    frames = {}
    for name, r, c, cell, m in raw:
        if name in LARGE:
            scale = TARGET / max(m['body_h'], 1)
        elif name in SHORT:
            scale = 1.02  # same world scale as the walks; shortness is pose, not drawing size
        else:
            scale = float(np.clip(TARGET / max(m['body_h'], 1), 0.90, 1.12))
        frame = place(cell, m, scale)
        Image.fromarray(frame, 'RGBA').save(FRAMES / f'{name}.png')
        frames[name] = {
            'file': f'frames/{name}.png',
            'cell': [r, c],
            'label': CELL_LABELS[r][c],
            'scale': round(scale, 4),
            'pivot': [PX, PY],
            'src_body_h': m['body_h'],
            'src_helm_h': m['helm_h'],
            'src_foot': m['foot'],
            'src_hip_x': round(m['hip_x'], 2),
        }
        print(f'    scale {scale:.3f} -> {name}.png')

    # atlas: 6x4 of canonical frames
    atlas = Image.new('RGBA', (FW * 6, FH * 4), (0, 0, 0, 0))
    for name, info in frames.items():
        r, c = info['cell']
        im = Image.open(FRAMES / f'{name}.png')
        atlas.paste(im, (c * FW, r * FH), im)
    atlas.save(ROOT / 'atlas.png')

    # contact sheet on mid-gray with labels and a foot-baseline
    gray = Image.new('RGBA', (FW * 6, FH * 4 + 8), (196, 192, 184, 255))
    g = np.array(gray)
    for x in range(0, FW * 6, 4):
        yy = PY
        if 0 <= yy < g.shape[0]:
            g[yy, :, :3] = (220, 80, 80)
    gray = Image.fromarray(g)
    from PIL import ImageDraw, ImageFont
    draw = ImageDraw.Draw(gray)
    try:
        font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 14)
    except Exception:
        font = ImageFont.load_default()
    for name, info in frames.items():
        r, c = info['cell']
        im = Image.open(FRAMES / f'{name}.png')
        gray.alpha_composite(im, (c * FW, r * FH))
        draw.text((c * FW + 8, r * FH + 6), info['label'], fill=(30, 26, 20, 255), font=font)
    # no red line through final export — rebuild without debug line
    contact = Image.new('RGBA', (FW * 6 + 40, FH * 4 + 60), (232, 228, 220, 255))
    cd = ImageDraw.Draw(contact)
    cd.text((20, 16), 'Ragdoll Rivals  ·  cleaned sprite frames (shared foot pivot, helm-normalised scale)', fill=(30, 26, 20, 255), font=font)
    for name, info in frames.items():
        r, c = info['cell']
        im = Image.open(FRAMES / f'{name}.png')
        contact.alpha_composite(im, (20 + c * FW, 44 + r * FH))
        cd.text((20 + c * FW + 8, 44 + r * FH + 6), info['label'], fill=(40, 34, 28, 255), font=font)
    contact.convert('RGB').save(ROOT / 'frames-sheet.png', quality=95)

    manifest = {
        'source': 'reference/main-sheet.png',
        'sourceSize': [int(sheet.shape[1]), int(sheet.shape[0])],
        'grid': [6, 4],
        'cellSize': [cw, ch],
        'frameSize': [FW, FH],
        'pivot': [PX, PY],
        'align': 'feet on baseline; horizontally centred on hip/torso; scale from helm height (standing also blended with body height)',
        'frames': frames,
        'clips': {
            'idle': ['idle'],
            'walk': ['walk1', 'walk2', 'walk3', 'walk2'],
            'run': ['run1', 'run2', 'run3', 'run4', 'run5'],
            'raise': ['overhead_raise_a'],
            'raise2': ['overhead_raise_b'],
            'chop': ['overhead_chop'],
            'ready': ['ready'],
            'sword_forward': ['sword_forward'],
            'slash': ['slash_trail'],
            'sweep': ['sweep_slash'],
            'lunge': ['thrust_lunge'],
            'high_guard': ['high_guard'],
            'shield_guard': ['shield_guard'],
            'stagger': ['stagger'],
            'kneel': ['kneel'],
            'crouch': ['crouch_getup'],
            'ground_strike': ['ground_strike'],
            'combo_chop': ['overhead_raise_a', 'overhead_chop'],
            'combo_slash': ['ready', 'slash_trail'],
            'combo_lunge': ['sword_forward', 'thrust_lunge'],
        },
    }
    (ROOT / 'manifest.json').write_text(json.dumps(manifest, indent=2))
    print('wrote', len(frames), 'frames, atlas, frames-sheet, manifest')


if __name__ == '__main__':
    main()
