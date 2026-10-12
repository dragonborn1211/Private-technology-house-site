"""Night-sky overlay for the dark windows of the Antares site.

Draws a transparent star field with a faint Milky Way band and writes
antares/assets/img/stars.webp (and stars-960.webp for phones).
The image sits on top of the navy gradient of .screen panels.
Usage: python3 tools/build_stars.py
"""
import math
import numpy as np
from PIL import Image, ImageFilter

W, H = 1600, 1000
rng = np.random.default_rng(550)  # Antares: ~550 light years


def smooth_noise(w, h, scale, octaves=5):
    out = np.zeros((h, w))
    amp, total = 1.0, 0.0
    for o in range(octaves):
        s = max(2, int(scale / (2 ** o)))
        small = rng.random((h // s + 2, w // s + 2))
        img = Image.fromarray((small * 255).astype(np.uint8)).resize((w + 2 * s, h + 2 * s), Image.BICUBIC)
        out += np.asarray(img, dtype=float)[s:s + h, s:s + w] / 255 * amp
        total += amp
        amp *= 0.55
    return out / total


yy, xx = np.mgrid[0:H, 0:W].astype(float)
# Milky Way: a soft diagonal band with clumps and a dark dust lane
angle = math.radians(-28)
d = (xx - W * 0.52) * math.sin(angle) + (yy - H * 0.5) * math.cos(angle)
band = np.exp(-(d / (H * 0.20)) ** 2)
clumps = smooth_noise(W, H, 220)
lane = np.exp(-((d + H * 0.03 + (smooth_noise(W, H, 300) - .5) * 90) / (H * 0.035)) ** 2)
glow = band * (0.35 + 0.9 * clumps ** 2) * (1 - 0.65 * lane)

rgb = np.zeros((H, W, 3))
alpha = np.zeros((H, W))
rgb[...] = (205, 222, 232)
alpha += np.clip(glow * 0.11, 0, 1)


def add_star(x, y, r, a, col):
    x0, x1 = int(max(0, x - r * 4)), int(min(W, x + r * 4 + 1))
    y0, y1 = int(max(0, y - r * 4)), int(min(H, y + r * 4 + 1))
    if x0 >= x1 or y0 >= y1:
        return
    gx, gy = np.meshgrid(np.arange(x0, x1), np.arange(y0, y1))
    g = np.exp(-((gx - x) ** 2 + (gy - y) ** 2) / (2 * r * r)) * a
    sl = (slice(y0, y1), slice(x0, x1))
    na = g + alpha[sl] * (1 - g)
    for c in range(3):
        rgb[sl + (c,)] = (col[c] * g + rgb[sl + (c,)] * alpha[sl] * (1 - g)) / np.maximum(na, 1e-6)
    alpha[sl] = na


palette = [((236, 243, 248), .62), ((214, 230, 255), .2), ((255, 232, 205), .14), ((255, 205, 170), .04)]
cols = [p[0] for p in palette]
probs = np.array([p[1] for p in palette]); probs /= probs.sum()

# faint stars everywhere, denser inside the band
n = 2600
xs = rng.random(n) * W
ys = rng.random(n) * H
keep = rng.random(n) < 0.35 + 0.65 * band[ys.astype(int), xs.astype(int)]
for x, y in zip(xs[keep], ys[keep]):
    m = rng.random() ** 3.2
    add_star(x, y, 0.55 + 0.5 * m, 0.25 + 0.7 * m, cols[rng.choice(len(cols), p=probs)])

# a dozen bright ones with a soft halo
for _ in range(14):
    x, y = rng.random() * W, rng.random() * H
    col = cols[rng.choice(len(cols), p=probs)]
    add_star(x, y, 4.5, 0.10, col)
    add_star(x, y, 1.25, 0.95, col)

img = Image.fromarray(np.dstack([np.clip(rgb, 0, 255), np.clip(alpha * 255, 0, 255)]).astype(np.uint8), 'RGBA')
img.save('antares/assets/img/stars.webp', 'WEBP', quality=82, method=6)
img.resize((960, 600), Image.LANCZOS).save('antares/assets/img/stars-960.webp', 'WEBP', quality=82, method=6)
print('ok')
