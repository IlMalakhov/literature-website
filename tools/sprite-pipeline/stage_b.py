"""Stage B: native-grid downsampling, frame slicing, baseline alignment, strip packing.

Downsampling to the native pixel grid matters for display: the browser will
scale these with image-rendering:pixelated, and nearest-neighbour DOWNscaling
of full-res sheets would shimmer during animation. Serving near-native
resolution means the browser only ever upscales.
"""
import os, json
import numpy as np
from PIL import Image

ROOT = "/Users/elijah/projects/dasha-website"
CLEAN = os.path.join(ROOT, "sprite-work", "clean")
NATIVE = os.path.join(ROOT, "sprite-work", "native")
PREV = os.path.join(ROOT, "sprite-work", "preview-b")
PUB = os.path.join(ROOT, "public", "parade")
for d in (NATIVE, PREV, PUB):
    os.makedirs(d, exist_ok=True)

DARK = (18, 10, 14)
CREAM = (236, 220, 200)

ANIMATED = {  # slug: (frames, anchor mode)
    "oblomov": (8, "bottom"), "katerina": (8, "bottom"), "onegin": (8, "bottom"),
    "raskolnikov": (8, "bottom"), "behemoth": (8, "bottom"),
    "carriage": (8, "bottom"), "seagull": (4, "center"),
}
STATIC = ["skyline", "lamp", "moon", "mist", "cobbles"]  # + windows handled apart

def load(slug):
    a = np.asarray(Image.open(os.path.join(CLEAN, f"{slug}.png")).convert("RGBA"))
    return a

def over_dark(rgba):
    a = rgba[..., 3:4].astype(np.float64) / 255
    rgb = rgba[..., :3].astype(np.float64) * a + np.array(DARK) * (1 - a)
    return rgb.astype(np.uint8)

def detect_scale(rgba, smax=14):
    """Largest integer s whose box-down + nearest-up round trip stays faithful."""
    base = Image.fromarray(over_dark(rgba), "RGB")
    w, h = base.size
    ref = np.asarray(base).astype(np.int16)
    errs = {}
    for s in range(2, smax + 1):
        d = base.resize((max(1, round(w / s)), max(1, round(h / s))), Image.BOX)
        u = np.asarray(d.resize((w, h), Image.NEAREST)).astype(np.int16)
        errs[s] = float(np.abs(ref - u).mean())
    return errs

def downsample(rgba, s, palette):
    im = Image.fromarray(rgba, "RGBA")
    w, h = im.size
    if s == 1:
        d = rgba.copy()
    else:
        d = np.asarray(im.resize((round(w / s), round(h / s)), Image.BOX)).copy()
    alpha = d[..., 3] >= 128
    px = d[..., :3][alpha].astype(np.int16)
    dist = ((px[:, None, :] - palette[None, :, :]) ** 2).sum(-1)
    d[..., :3][alpha] = palette[dist.argmin(1)].astype(np.uint8)
    d[..., :3][~alpha] = 0
    d[..., 3] = np.where(alpha, 255, 0)
    return d

def split_frames(alpha, n):
    cols = alpha.any(axis=0)
    xs = np.where(cols)[0]
    lo, hi = xs.min(), xs.max()
    # Find empty column runs inside the occupied bounds.
    gaps, start = [], None
    for x in range(lo, hi + 1):
        if not cols[x]:
            if start is None:
                start = x
        elif start is not None:
            gaps.append((x - start, start, x - 1))
            start = None
    gaps.sort(reverse=True)
    cuts = sorted((g[1] + g[2]) // 2 for g in gaps[: n - 1])
    bounds = [lo] + cuts + [hi + 1]
    return [(bounds[i], bounds[i + 1]) for i in range(n)], [g[0] for g in gaps[: n - 1]]

def pack(slug, sheet, n, anchor_mode):
    alpha = sheet[..., 3] > 0
    spans, gapw = split_frames(alpha, n)
    frames, meta = [], []
    for x0, x1 in spans:
        sub = sheet[:, x0:x1]
        a = sub[..., 3] > 0
        ys, xs = np.where(a)
        f = sub[ys.min(): ys.max() + 1, xs.min(): xs.max() + 1]
        fa = f[..., 3] > 0
        com_x = float(np.where(fa)[1].mean())
        com_y = float(np.where(fa)[0].mean())
        frames.append(f)
        meta.append({"w": f.shape[1], "h": f.shape[0], "com_x": com_x, "com_y": com_y})

    left = max(int(round(m["com_x"])) for m in meta) + 1
    right = max(m["w"] - int(round(m["com_x"])) for m in meta) + 1
    cw = left + right
    if anchor_mode == "bottom":
        ch = max(m["h"] for m in meta) + 1
    else:
        up = max(int(round(m["com_y"])) for m in meta) + 1
        dn = max(m["h"] - int(round(m["com_y"])) for m in meta) + 1
        ch = up + dn

    strip = np.zeros((ch, cw * n, 4), np.uint8)
    onion = np.zeros((ch, cw, 4), np.float64)
    for i, (f, m) in enumerate(zip(frames, meta)):
        ax = int(round(m["com_x"]))
        x = i * cw + left - ax
        y = ch - 1 - m["h"] if anchor_mode == "bottom" else (up - int(round(m["com_y"])))
        strip[y: y + m["h"], x - i * cw + i * cw: x + m["w"]] = f  # noqa: simple paste
        cell = np.zeros((ch, cw, 4), np.float64)
        cell[y: y + m["h"], (left - ax): (left - ax) + m["w"]] = f
        onion += cell * 0.22
    Image.fromarray(strip, "RGBA").save(os.path.join(PUB, f"{slug}.png"))

    prev = Image.fromarray(over_dark(strip), "RGB")
    prev = prev.resize((prev.width * 2, prev.height * 2), Image.NEAREST)
    prev.save(os.path.join(PREV, f"{slug}-strip.png"))
    on = np.clip(onion, 0, 255).astype(np.uint8)
    op = Image.fromarray(over_dark(on), "RGB")
    op = op.resize((op.width * 3, op.height * 3), Image.NEAREST)
    op.save(os.path.join(PREV, f"{slug}-onion.png"))
    return {"cell": [cw, ch], "gaps": gapw,
            "frame_heights": [m["h"] for m in meta], "frame_widths": [m["w"] for m in meta]}

report = {}
sheets = list(ANIMATED.items()) + [(s, None) for s in STATIC + ["windows"]]
# Keep animated sprites at or above native resolution on screen.
OVERRIDE = {"onegin": 5, "carriage": 2, "seagull": 7, "mist": 1}
for slug, anim in sheets:
    rgba = load(slug)
    errs = detect_scale(rgba)
    tol = 3.5
    ok = [s for s, e in errs.items() if e <= tol]
    s = OVERRIDE.get(slug, max(ok) if ok else 2)
    palette = np.unique(rgba[rgba[..., 3] == 255][:, :3], axis=0).astype(np.int16)
    native = downsample(rgba, s, palette)
    if slug == "mist":
        native[..., :3][native[..., 3] > 0] = CREAM
    Image.fromarray(native, "RGBA").save(os.path.join(NATIVE, f"{slug}.png"))
    entry = {"scale": s, "err": round(errs.get(s, 0.0), 2),
             "err_curve": {k: round(v, 1) for k, v in errs.items()},
             "native_size": [native.shape[1], native.shape[0]]}
    if anim:
        entry.update(pack(slug, native, anim[0], anim[1]))
    report[slug] = entry
    print(slug, json.dumps({k: v for k, v in entry.items() if k != "err_curve"}))

with open(os.path.join(ROOT, "sprite-work", "report_b.json"), "w") as f:
    json.dump(report, f, indent=1)
print("curves:", json.dumps({k: v["err_curve"] for k, v in report.items()}))
