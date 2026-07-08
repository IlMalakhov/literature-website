# /// script
# requires-python = ">=3.11"
# dependencies = ["numpy", "pillow", "scipy"]
# ///
"""Chroma-key + packaging for the custom cursor sprites.

Illustrated sprites (quill, red pen) get a soft alpha matte — their edges are
anti-aliased into the green, so binary alpha would leave a jagged rim.
Pixel sprites get the parade treatment: binary alpha, native-grid resample.
Every sprite's hotspot (tool tip) is detected from the alpha mask and written
to public/cursors/cursors.json.
"""
import json, os
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = "/Users/elijah/projects/dasha-website"
SRC = os.path.join(ROOT, "cursors-generated")
OUT = os.path.join(ROOT, "public", "cursors")
PREV = os.path.join(ROOT, "sprite-work", "preview-cursors")
os.makedirs(OUT, exist_ok=True)
os.makedirs(PREV, exist_ok=True)

DARK = np.array([0x12, 0x0A, 0x0E], dtype=np.uint8)  # site --bg

# (file, slug, kind, css_size_longest, tip_corner)
# tip_corner: which corner of the cropped bbox the hotspot tip lives in
SPRITES = [
    ("dip.png",         "quill",       "soft",  48, "tl"),
    ("dip-hover.png",   "quill-hover", "soft",  48, "bl"),
    ("teacher-pen.png", "redpen",      "soft",  44, "tl"),
    ("dip-8b.png",      "pixel-quill", "pixel", 0,  "tl"),
    ("hand-8b.png",     "pixel-hand",  "pixel", 0,  "tl"),
]


def soft_matte(rgb):
    """Alpha from green dominance, smoothstepped; despill kept pixels."""
    f = rgb.astype(np.float64)
    r, g, b = f[..., 0], f[..., 1], f[..., 2]
    dom = g - np.maximum(r, b)          # >0 on green screen, <=0 on subject
    # dom ~ 60..255 on pure screen, ~0 at subject edge. Map 8..48 -> 1..0
    a = np.clip((48.0 - dom) / 40.0, 0.0, 1.0)
    a = a * a * (3 - 2 * a)             # smoothstep
    # solid interior: anything with no green dominance at all is fully opaque
    a[dom <= 0] = 1.0
    out = rgb.astype(np.int16).copy()
    # despill: subject palette (ivory/rose) never has green as max channel
    spill = (a > 0) & (g > np.maximum(r, b))
    out[..., 1] = np.where(spill, np.maximum(out[..., 0], out[..., 2]), out[..., 1])
    return out.astype(np.uint8), (a * 255).round().astype(np.uint8)


def native_cell(rgb, mask):
    """Estimate the pixel-art cell size from color-transition run lengths.

    Alpha runs span whole limbs, so they overshoot; color changes happen at
    every art-pixel boundary (outline/fill/shade alternate frequently).
    """
    runs = []
    for arr, m in ((rgb, mask), (rgb.transpose(1, 0, 2), mask.T)):
        step = max(1, arr.shape[0] // 128)
        for row, mrow in zip(arr[::step], m[::step]):
            if mrow.sum() < 32:
                continue
            change = (np.abs(np.diff(row.astype(np.int16), axis=0)) > 24).any(1)
            change &= mrow[1:] & mrow[:-1]      # transitions inside the sprite
            d = np.flatnonzero(change)
            if len(d) > 1:
                runs.extend(np.diff(d).tolist())
    runs = np.array([x for x in runs if 8 <= x <= 150])
    if not len(runs):
        return 40
    hist = np.bincount(runs)
    return int(hist.argmax())


def crop(arr, alpha, margin):
    ys, xs = np.nonzero(alpha > 8)
    y0, y1 = max(ys.min() - margin, 0), min(ys.max() + 1 + margin, arr.shape[0])
    x0, x1 = max(xs.min() - margin, 0), min(xs.max() + 1 + margin, arr.shape[1])
    return arr[y0:y1, x0:x1], alpha[y0:y1, x0:x1]


def find_tip(alpha, corner):
    """Opaque pixel closest to the given corner of the bbox."""
    ys, xs = np.nonzero(alpha > 128)
    h, w = alpha.shape
    score = {
        "tl": xs + ys,
        "bl": xs + (h - 1 - ys),
        "tr": (w - 1 - xs) + ys,
    }[corner]
    i = score.argmin()
    return int(xs[i]), int(ys[i])


def premultiplied_resize(rgb, alpha, size):
    f = rgb.astype(np.float64) * (alpha[..., None] / 255.0)
    im = Image.fromarray(np.dstack([f.round().astype(np.uint8), alpha]), "RGBA")
    im = im.resize(size, Image.LANCZOS)
    out = np.asarray(im).astype(np.float64)
    a = out[..., 3:4]
    rgbo = np.where(a > 0, out[..., :3] / np.maximum(a / 255.0, 1e-6), 0)
    return np.clip(rgbo, 0, 255).astype(np.uint8), out[..., 3].astype(np.uint8)


config = {}
for fname, slug, kind, css, corner in SPRITES:
    rgb = np.asarray(Image.open(os.path.join(SRC, fname)).convert("RGB"))

    if kind == "soft":
        rgb2, alpha = soft_matte(rgb)
        rgb2, alpha = crop(rgb2, alpha, margin=6)
        # export @2x of the CSS size, longest side
        h, w = alpha.shape
        scale = (css * 2) / max(h, w)
        size = (max(round(w * scale), 1), max(round(h * scale), 1))
        rgb2, alpha = premultiplied_resize(rgb2, alpha, size)
        disp_w, disp_h = size[0] / 2, size[1] / 2
    else:
        f = rgb.astype(np.float64)
        dom = f[..., 1] - np.maximum(f[..., 0], f[..., 2])
        keep = dom < 40
        # kill stray keyed specks
        lab, n = ndimage.label(keep)
        if n > 1:
            sizes = ndimage.sum(keep, lab, range(1, n + 1))
            keep = lab == (1 + sizes.argmax())
        alpha = np.where(keep, 255, 0).astype(np.uint8)
        rgb2 = rgb.astype(np.int16).copy()
        spill = keep & (f[..., 1] > np.maximum(f[..., 0], f[..., 2]))
        rgb2[..., 1] = np.where(spill, np.maximum(rgb2[..., 0], rgb2[..., 2]), rgb2[..., 1])
        rgb2 = rgb2.astype(np.uint8)
        cell = native_cell(rgb2, alpha > 128)
        rgb2, alpha = crop(rgb2, alpha, margin=0)
        h, w = alpha.shape
        nw, nh = max(w // cell, 1), max(h // cell, 1)
        # sample at cell centers via NEAREST on the cropped sprite
        im = Image.fromarray(np.dstack([rgb2, alpha]), "RGBA").resize(
            (nw, nh), Image.NEAREST)
        arr = np.asarray(im)
        rgb2, alpha = arr[..., :3], np.where(arr[..., 3] > 128, 255, 0).astype(np.uint8)
        disp = max(nw, nh)
        disp_scale = 2 if disp <= 20 else 1  # tiny native grids display at 2x
        disp_w, disp_h = nw * disp_scale, nh * disp_scale

    tx, ty = find_tip(alpha, corner)
    h, w = alpha.shape
    Image.fromarray(np.dstack([rgb2, alpha]), "RGBA").save(
        os.path.join(OUT, f"{slug}.png"))

    # dark-bg preview with a crosshair on the hotspot
    comp = np.where(alpha[..., None] > 8,
                    (rgb2.astype(np.float64) * (alpha[..., None] / 255.0)
                     + DARK * (1 - alpha[..., None] / 255.0)),
                    DARK).astype(np.uint8)
    comp[ty, :] = [0, 255, 255]
    comp[:, tx] = [0, 255, 255]
    Image.fromarray(comp, "RGB").resize((w * 4, h * 4), Image.NEAREST).save(
        os.path.join(PREV, f"{slug}.png"))

    green_left = int((alpha > 8).sum() and
                     ((rgb2[alpha > 8][:, 1].astype(int) -
                       np.maximum(rgb2[alpha > 8][:, 0], rgb2[alpha > 8][:, 2]).astype(int)) > 0).sum())
    config[slug] = {
        "src": f"/cursors/{slug}.png",
        "w": round(disp_w), "h": round(disp_h),
        # hotspot in display px
        "hx": round(tx / w * disp_w), "hy": round(ty / h * disp_h),
        "pixel": kind == "pixel",
    }
    print(slug, f"{w}x{h}px file, display {round(disp_w)}x{round(disp_h)}, "
          f"hotspot ({config[slug]['hx']},{config[slug]['hy']}), green_left={green_left}")

with open(os.path.join(OUT, "cursors.json"), "w") as fp:
    json.dump(config, fp, indent=2)
with open(os.path.join(ROOT, "src", "cursors.gen.ts"), "w") as fp:
    fp.write("// generated by tools/cursor-pipeline.py — do not edit\n")
    fp.write("export const CURSORS = " + json.dumps(config, indent=2) + " as const;\n")
print("OK ->", OUT)
