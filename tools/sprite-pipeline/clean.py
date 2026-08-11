"""Stage A: background removal + palette rebuild for parade sprite sheets.

Deterministic (no ML): pixel-art sheets have flat palettes, so we classify
background, despill, then snap every kept pixel to a per-sheet palette and
force binary alpha. Outputs full-res RGBA + dark-bg previews + a report.
"""
import sys, json, os
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = "/Users/elijah/projects/dasha-website"
OUT = os.path.join(ROOT, "sprite-work", "clean")
PREV = os.path.join(ROOT, "sprite-work", "preview-clean")
os.makedirs(OUT, exist_ok=True)
os.makedirs(PREV, exist_ok=True)

SHEETS = [
    ("parade-checkered/ChatGPT Image Jul 6, 2026, 07_32_22 PM.png", "oblomov", "checker"),
    ("parade-checkered/ChatGPT Image Jul 6, 2026, 08_35_56 PM.png", "katerina", "checker"),
    ("parade-checkered/ChatGPT Image Jul 6, 2026, 08_36_01 PM.png", "onegin", "checker"),
    ("parade-checkered/ChatGPT Image Jul 6, 2026, 08_36_03 PM.png", "raskolnikov", "checker"),
    ("parade-checkered/ChatGPT Image Jul 6, 2026, 08_36_06 PM.png", "behemoth", "checker"),
    ("parade-greenscreened/carriage-greenscreen.png", "carriage", "green"),
    ("parade-greenscreened/seagull-greenscreen.png", "seagull", "green"),
    ("parade-greenscreened/skyline-greenscreen.png", "skyline", "green"),
    ("parade-greenscreened/gas-lamp-greenscreen.png", "lamp", "green"),
    ("parade-greenscreened/moon-greenscreen.png", "moon", "green"),
    ("parade-greenscreened/mist-greenscreen.png", "mist", "green"),
    ("parade-greenscreened/cobblestones-greenscreen.png", "cobbles", "green"),
    ("parade-greenscreened/windows-greenscreen.png", "windows", "green"),
]

DARK = np.array([0x12, 0x0A, 0x0E], dtype=np.float64)  # site --bg

def quantize(colors, n):
    """Median-cut on unique colors weighted by count -> palette array."""
    uniq, counts = np.unique(colors.reshape(-1, 3), axis=0, return_counts=True)
    boxes = [(uniq, counts)]
    while len(boxes) < n:
        # Split the box with the largest weighted spread.
        best, bi = -1, -1
        for i, (u, c) in enumerate(boxes):
            if len(u) < 2:
                continue
            spread = (u.max(0) - u.min(0)).max() * c.sum()
            if spread > best:
                best, bi = spread, i
        if bi < 0:
            break
        u, c = boxes.pop(bi)
        ch = (u.max(0) - u.min(0)).argmax()
        order = np.argsort(u[:, ch], kind="stable")
        u, c = u[order], c[order]
        half = np.searchsorted(np.cumsum(c), c.sum() / 2)
        half = int(np.clip(half, 1, len(u) - 1))
        boxes += [(u[:half], c[:half]), (u[half:], c[half:])]
    pal = np.array([np.average(u, axis=0, weights=c) for u, c in boxes])
    return pal.round().astype(np.int16)

def snap(rgb, mask, pal):
    px = rgb[mask].astype(np.int16)
    d = ((px[:, None, :] - pal[None, :, :]) ** 2).sum(-1)
    rgb[mask] = pal[d.argmin(1)].astype(np.uint8)
    return rgb

report = {}
for src, slug, mode in SHEETS:
    im = Image.open(os.path.join(ROOT, src)).convert("RGB")
    rgb = np.asarray(im).astype(np.int16).copy()
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]

    if mode == "green":
        bg = (g - np.maximum(r, b)) >= 40
        # Include green-cream boundary pixels around the keyed area.
        ring = ndimage.binary_dilation(bg, iterations=3) & ((2 * g - r - b) > 60)
        bg |= ring
    else:
        neutral = (rgb.max(-1) - rgb.min(-1)) <= 10
        lab, _ = ndimage.label(neutral)
        border_ids = np.unique(np.concatenate([
            lab[0], lab[-1], lab[:, 0], lab[:, -1]]))
        border_ids = border_ids[border_ids != 0]
        bg = np.isin(lab, border_ids)
        # Include adjacent neutral halo pixels.
        halo = ndimage.binary_dilation(bg) & ((rgb.max(-1) - rgb.min(-1)) <= 20) & ~bg
        bg |= halo

    keep = ~bg

    if mode == "green":
        spill = keep & (g > np.maximum(r, b))
        rgb[..., 1] = np.where(spill, np.maximum(r, b), g)

    # Build the palette away from the keyed boundary.
    interior = keep & ~ndimage.binary_dilation(bg, iterations=2)
    src_px = rgb[interior] if interior.sum() > 500 else rgb[keep]
    pal = quantize(src_px, 10)
    rgb = snap(rgb, keep, pal)

    out = np.dstack([rgb.astype(np.uint8), np.where(keep, 255, 0).astype(np.uint8)])
    Image.fromarray(out, "RGBA").save(os.path.join(OUT, f"{slug}.png"))

    comp = np.where(keep[..., None], rgb, DARK).astype(np.uint8)
    Image.fromarray(comp, "RGB").save(os.path.join(PREV, f"{slug}.png"))

    kept = rgb[keep]
    green_dom = int((kept[:, 1] > np.maximum(kept[:, 0], kept[:, 2])).sum())
    neutral_light = int((((kept.max(1) - kept.min(1)) < 8) & (kept.mean(1) > 200)).sum())
    report[slug] = {
        "kept_px": int(keep.sum()),
        "kept_pct": round(100 * keep.sum() / keep.size, 1),
        "green_dominant_left": green_dom,
        "neutral_light_left": neutral_light,
        "palette": [f"#{c[0]:02x}{c[1]:02x}{c[2]:02x}" for c in pal],
    }
    print(slug, json.dumps(report[slug]))

bad = {k: v for k, v in report.items() if v["green_dominant_left"] > 0}
assert not bad, f"green spill survived: {bad}"
print("ALL CLEAN")
