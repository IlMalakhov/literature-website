"""Stage C: publish trimmed static backdrop assets + slice window sprites."""
import os
import numpy as np
from PIL import Image

ROOT = "/Users/elijah/projects/dasha-website"
NATIVE = os.path.join(ROOT, "sprite-work", "native")
PUB = os.path.join(ROOT, "public", "parade")

def trim(a):
    m = a[..., 3] > 0
    ys, xs = np.where(m)
    return a[ys.min(): ys.max() + 1, xs.min(): xs.max() + 1]

for slug in ["skyline", "lamp", "moon", "mist", "cobbles"]:
    a = np.asarray(Image.open(os.path.join(NATIVE, f"{slug}.png")))
    t = trim(a)
    Image.fromarray(t, "RGBA").save(os.path.join(PUB, f"{slug}.png"))
    print(slug, t.shape[1], "x", t.shape[0])

# windows -> 6 separate sprites, split on the 5 widest gaps
w = np.asarray(Image.open(os.path.join(NATIVE, "windows.png")))
cols = (w[..., 3] > 0).any(axis=0)
xs = np.where(cols)[0]
lo, hi = xs.min(), xs.max()
gaps, start = [], None
for x in range(lo, hi + 1):
    if not cols[x]:
        if start is None:
            start = x
    elif start is not None:
        gaps.append((x - start, start, x - 1)); start = None
gaps.sort(reverse=True)
cuts = sorted((g[1] + g[2]) // 2 for g in gaps[:5])
bounds = [lo] + cuts + [hi + 1]
for i in range(6):
    part = trim(w[:, bounds[i]: bounds[i + 1]])
    Image.fromarray(part, "RGBA").save(os.path.join(PUB, f"win{i + 1}.png"))
    print(f"win{i + 1}", part.shape[1], "x", part.shape[0])
