"""Turn the Lake Volta photograph into a blue toile-style engraving plus a water mask."""
import sys
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

SRC, OUT, MASK = sys.argv[1], sys.argv[2], sys.argv[3]
W = 2400
img = Image.open(SRC).convert('RGB')
H = round(img.height * W / img.width)
img = img.resize((W, H), Image.LANCZOS)
rgb = np.asarray(img).astype(np.float32) / 255
r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
lum = 0.3 * r + 0.59 * g + 0.11 * b
lum = ndimage.gaussian_filter(lum, 1.1)

# --- region masks -------------------------------------------------------
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
sc = W / 1400
# shoreline traced by hand on the 1400px source: water lies below it
shore_x = np.array([0, 280, 700, 900, 1100, 1250, 1400]) * sc
shore_y = np.array([582, 578, 588, 625, 645, 662, 668]) * sc
shore = np.interp(xx[0], shore_x, shore_y)[None, :]
water = yy > shore + 4 * sc
above = ~water
land = above & (ndimage.gaussian_filter(lum, 4) < 0.56) & (yy > 330 * sc)
land = ndimage.binary_closing(ndimage.binary_opening(land, iterations=3), iterations=8)
sky = above & ~land
boat = np.zeros_like(water)
boat[int(770*sc):int(855*sc), int(595*sc):int(765*sc)] = True
boat = ndimage.binary_dilation(boat, iterations=6)

# --- tone: pale sky with shaded cloud bases, mid water, deep foliage ------
tone = 1 - lum
tone = np.clip((tone - 0.18) / 0.7, 0, 1) ** 1.15
sky_t = np.clip((0.93 - lum) / 0.36, 0, 1) ** 1.4 * 0.62
tone = np.where(sky, sky_t, tone)
tone = np.where(water, np.clip((0.62 - lum) / 0.5, 0, 1) * 0.75 + 0.05, tone)

# --- engraving lines: angle and pitch vary by region ---------------------
def lines(angle_deg, pitch, wobble=0.0, seed=0):
    a = np.deg2rad(angle_deg)
    u = xx * np.sin(a) + yy * np.cos(a)
    if wobble:
        rng = np.random.default_rng(seed)
        n = ndimage.gaussian_filter(rng.standard_normal((H // 8 + 1, W // 8 + 1)), 3)
        n = np.kron(n, np.ones((8, 8)))[:H, :W]
        u = u + n * wobble
    return (np.sin(2 * np.pi * u / pitch) + 1) / 2   # 0..1 carrier

carrier = np.empty((H, W), np.float32)
carrier[:] = lines(0, 5.2, wobble=18, seed=1)                     # sky: soft horizontal
carrier[land] = (lines(-38, 4.2, wobble=6, seed=2)[land] * 0.6
                 + lines(52, 5.0, wobble=6, seed=3)[land] * 0.4)   # foliage cross-hatch
carrier[water] = lines(0, 4.6, wobble=4, seed=4)[water]  # water: tight horizontals

# soft threshold: line thickness varies continuously with tone instead of in steps
ink_line = np.clip((tone - carrier) / 0.32 + 0.5, 0, 1)
# blend hard engraving with continuous tone so it reads as print, not dither
ink = np.clip(ink_line * 0.72 + tone * 0.38, 0, 1)

# paper grain
rng = np.random.default_rng(7)
grain = ndimage.gaussian_filter(rng.standard_normal((H, W)), 0.8) * 0.035
ink = np.clip(ink + grain, 0, 1)

paper = np.array([0.945, 0.925, 0.878])        # warm bone
blue = np.array([0.14, 0.27, 0.66])             # delft ink
deep = np.array([0.08, 0.14, 0.40])
k = ink[..., None]
out = paper * (1 - k) + (blue * (1 - k ** 2) + deep * k ** 2) * k
Image.fromarray((out * 255).astype(np.uint8)).save(OUT, quality=82, method=6)

# water mask for the shader (white = ripple). Soft edge, boat excluded.
m = water & ~boat
m = ndimage.gaussian_filter(m.astype(np.float32), 6)
Image.fromarray((m * 255).astype(np.uint8)).resize((600, round(600 * H / W)), Image.LANCZOS).save(MASK)
print(W, H)
