"""Trace landmark outlines from the site's own credited photos.

Each landmark is thresholded out of its photo (bright limewash against sky, white water against
cliff, dark timber and openings inside), the shapes are turned into contours and simplified,
and the result is written as SVG path data in the photo's own pixel space. An overlay PNG
(trace drawn over the photo) is saved next to it, so anyone can check the drawing against the
real building before it is animated.

    python tools/trace.py larabanga   (needs numpy, pillow, scikit-image)
"""
import json, sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw
from skimage import measure, morphology

ROOT = Path(__file__).resolve().parents[2]
OUT = Path(__file__).resolve().parents[1] / 'trace'


def load(rel):
    img = Image.open(ROOT / 'dist' / rel).convert('RGB')
    return img, np.asarray(img).astype(int)


def clean(mask, min_size, close=0):
    mask = morphology.remove_small_objects(mask, min_size)
    if close:
        mask = morphology.binary_closing(mask, morphology.disk(close))
    return morphology.remove_small_holes(mask, min_size)


def paths(mask, tolerance, min_len=12):
    """Outer and inner contours of a mask as simplified closed polylines."""
    padded = np.pad(mask, 1)
    out = []
    for contour in measure.find_contours(padded.astype(float), .5):
        poly = measure.approximate_polygon(contour - 1, tolerance)
        if len(poly) >= 3 and measure.perimeter if True else None:
            length = np.sum(np.hypot(*np.diff(poly, axis=0).T))
            if length >= min_len:
                out.append([(round(float(x), 1), round(float(y), 1)) for y, x in poly])
    return out


def to_d(polys):
    return ' '.join('M' + ' L'.join(f'{x} {y}' for x, y in p) + ' Z' for p in polys)


def overlay(img, layers, name):
    canvas = img.copy().convert('RGBA')
    shade = Image.new('RGBA', canvas.size, (255, 255, 255, 110))
    canvas = Image.alpha_composite(canvas, shade)
    draw = ImageDraw.Draw(canvas)
    for polys, colour, *open_ in layers:
        for p in polys:
            draw.line(p if open_ else p + [p[0]], fill=colour, width=3)
    canvas.convert('RGB').save(OUT / f'{name}-overlay.jpg', quality=82)


def profile_outline(top, bottom, xs, tolerance):
    """A closed outline from a top edge (left to right) and a bottom edge (right to left)."""
    pts = [(y, x) for x, y in zip(xs, top)] + [(y, x) for x, y in zip(xs[::-1], bottom[::-1])]
    poly = measure.approximate_polygon(np.array(pts, float), tolerance)
    return [[(round(float(x), 1), round(float(y), 1)) for y, x in poly]]


def runs_from(column, start, stop, step, need):
    """First index (scanning start→stop) where `column` is True for `need` pixels in a row."""
    count = 0
    for i in range(start, stop, step):
        count = count + 1 if column[i] else 0
        if count >= need:
            return i - step * (need - 1)
    return None


def larabanga():
    img, a = load('assets/real/larabanga-mosque.jpg')
    r, b = a[..., 0], a[..., 2]
    bright = a.mean(axis=2)
    warm = b - r
    h, w = bright.shape
    # Limewash is warm white (blue well below red); the sky is blue, the sand warmer still.
    wall = (bright > 135) & (warm < -10) & (warm > -62)
    dark = bright < 95
    x0, x1 = 200, 1500
    xs, top, bottom = [], [], []
    for x in range(x0, x1, 2):
        t_ = runs_from(wall[:, x], 120, 700, 1, 14)
        if t_ is None:
            continue
        # The plinth: a long dark run low on the wall (timber shadows are short); its foot is
        # the last dark pixel before the sand.
        p = runs_from(dark[:, x], max(t_, 560), 800, 1, 25)
        if p is None:
            continue
        foot = p
        while foot < h - 4 and (dark[foot + 1, x] or dark[foot + 4, x]):
            foot += 1
        xs.append(x); top.append(t_); bottom.append(foot)
    top = np.array(top, float); bottom = np.array(bottom, float)
    # Gentle smoothing of the foot only: the sand line is ragged, the pinnacles must stay sharp.
    from scipy.ndimage import median_filter
    bottom = median_filter(bottom, size=15, mode='nearest')
    outline = profile_outline(top, bottom, xs, 1.6)
    # Body mask from the outline, for the details inside it.
    from skimage.draw import polygon as fill
    body = np.zeros_like(wall)
    rr, cc = fill([y for x, y in outline[0]], [x for x, y in outline[0]], body.shape)
    body[rr, cc] = True
    inner = morphology.binary_erosion(body, morphology.disk(5))
    # The plinth line: where white wall meets the dark base, column by column.
    plinth = []
    for x, t_ in zip(xs, top):
        p = runs_from(dark[:, x], max(int(t_) + 30, 560), 800, 1, 25)
        if p:
            plinth.append((p, x))
    # Drop the doorway (a tall dark gap, not plinth), smooth, and split where columns are missing.
    level = np.median([p for p, _ in plinth])
    plinth = [(p, x) for p, x in plinth if p > level - 25]
    ys = median_filter(np.array([p for p, _ in plinth], float), size=21, mode='nearest')
    segments, current = [], []
    for y, (_, x) in zip(ys, plinth):
        if current and x - current[-1][1] > 12:
            segments.append(current); current = []
        current.append((y, x))
    segments.append(current)
    plinth_lines = [measure.approximate_polygon(np.array(s, float), 2.0) for s in segments if len(s) > 10]
    # The doorway: the large dark opening under the porch at the centre.
    door_zone = np.zeros_like(dark)
    door_zone[480:int(level) + 40, 820:1040] = True
    door = clean(dark & door_zone & body, 3000, close=2)
    door_labels = measure.label(door)
    door_shape = max(measure.regionprops(door_labels), key=lambda p: p.area).label if door_labels.max() else 0
    door_outline = paths(door_labels == door_shape, 2.0, 100) if door_shape else []
    # Timbers, the lattice openings and the door: grey-to-dark marks inside the wall.
    marks = inner & (bright < 140)
    for p, x in plinth:
        marks[p - 8:, x:x + 2] = False
    marks = clean(marks, 50, close=1)
    labels = measure.label(marks)
    keep = np.zeros_like(marks)
    for region in measure.regionprops(labels):
        if 50 <= region.area <= 9000:
            keep[labels == region.label] = True
    # Marks reaching into the plinth band are stray shadow, not timber.
    details = [d for d in paths(keep, 1.4, 16) if max(y for _, y in d) < level - 6]
    return img, {
        'outline': outline,
        'plinth': [[(round(float(x), 1), round(float(y), 1)) for y, x in line] for line in plinth_lines],
        'door': door_outline[:1],
        'details': details,
    }


def castle():
    img, a = load('assets/photos/a-daytime-view-of-cape-coast-castle.webp')
    r, b = a[..., 0], a[..., 2]
    bright = a.mean(axis=2)
    sky = (bright > 192) & ((b - r) > 14)
    # The wall's foot meets the rocks; read off the photo (gridded crop) where the rocks begin.
    foot_pts = [(190, 757), (400, 752), (700, 745), (1000, 742), (1130, 735), (1250, 712), (1350, 690), (1450, 675), (1599, 662)]
    fx, fy = zip(*foot_pts)
    xs = list(range(190, 1600, 2))
    top = []
    for x in xs:
        t_ = runs_from(~sky[:, x], 380, 760, 1, 10)
        top.append(t_ if t_ is not None else np.interp(x, fx, fy))
    top = np.array(top, float)
    bottom = np.interp(xs, fx, fy)
    outline = profile_outline(top, bottom, xs, 1.4)
    from skimage.draw import polygon as fill
    body = np.zeros(bright.shape, bool)
    rr, cc = fill([y for x, y in outline[0]], [x for x, y in outline[0]], body.shape)
    body[rr, cc] = True
    inner = morphology.binary_erosion(body, morphology.disk(4))
    # Windows, doors and the cannons on the sea wall: small dark shapes in the pale walls.
    marks = inner & (bright < 105)
    marks[:, :240] = False  # the left bastion's weathered face, not openings
    marks = clean(marks, 18, close=1)
    labels = measure.label(marks)
    keep = np.zeros_like(marks)
    for region in measure.regionprops(labels):
        y0, x0, y1, x1 = region.bbox
        # Openings are compact rectangles above the sea wall; weathering and plants are not.
        if 18 <= region.area <= 1600 and (y1 - y0) < 70 and (x1 - x0) < 60 and region.extent > .55 and y1 < 700:
            keep[labels == region.label] = True
    details = paths(keep, 1.0, 10)
    # Cannons on the sea wall: too small and low-contrast to threshold cleanly against the rust,
    # so their positions are read off the gridded crop and drawn as short barrels.
    cannons = [[(x + 5, 686.0), (x - 6, 676.0)] for x in (637.0, 677.0, 755.0, 797.0, 840.0, 882.0, 932.0, 980.0, 1032.0, 1085.0)]
    # The sea wall's top edge, where the cannons sit (read off the gridded crop).
    parapet = [[(400.0, 689.0), (1150.0, 687.0)]]
    return img, {'outline': outline, 'details': details, 'plinth': parapet + cannons}


def wli():
    img, a = load('assets/real/wli-falls.jpg')
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    bright = a.mean(axis=2)
    spread = a.max(axis=2) - a.min(axis=2)
    h, w = bright.shape
    # Falling water: bright and nearly colourless, in the band between the cliff top and the
    # spray at the foot.
    water = (bright > 168) & (spread < 48)
    water[: int(h * .21)] = False
    water[int(h * .8):] = False
    water[:, : int(w * .33)] = False
    water[:, int(w * .64):] = False
    water = clean(water, 3000, close=3)
    labels = measure.label(water)
    # The main fall and the thinner strand to its left.
    regions = sorted(measure.regionprops(labels), key=lambda p: p.area, reverse=True)[:2]
    falls = np.isin(labels, [p.label for p in regions if p.area > 8000])
    falls = morphology.binary_closing(falls, morphology.disk(5))
    outline = sorted(paths(falls, 2.5, 200), key=len, reverse=True)[:1]
    # The thinner left strand is dimmer and wispy: its own looser threshold, in its own band.
    strand = (bright > 128) & (spread < 22)
    zone = np.zeros_like(strand)
    zone[420:1250, 400:526] = True
    strand = clean(strand & zone & ~falls, 300, close=6)
    if strand.any():
        labels = measure.label(strand)
        thread = labels == max(measure.regionprops(labels), key=lambda p: p.area).label
        outline += sorted(paths(thread, 2.5, 150), key=len, reverse=True)[:1]
    # The skyline: where the blue sky ends over the cliffs and forest, column by column.
    sky = ((b - r) > 35) & (bright > 140)
    sky_line = []
    for x in range(0, w, 3):
        col = sky[:, x]
        ys = np.nonzero(col[: int(h * .4)])[0]
        if len(ys):
            sky_line.append((float(ys.max()), float(x)))
    from scipy.ndimage import median_filter
    sy = median_filter(np.array([y for y, _ in sky_line]), size=9, mode='nearest')
    skyline = measure.approximate_polygon(np.array([(y, x) for y, (_, x) in zip(sy, sky_line)]), 3.0)
    # Streaks inside the fall: the brightest threads of water, for the falling-line animation.
    core = (bright > 225) & falls
    core = clean(core, 400, close=1)
    streaks = paths(core, 2.0, 120)
    return img, {
        'outline': outline,
        'plinth': [[(round(float(x), 1), round(float(y), 1)) for y, x in skyline]],
        'details': streaks,
    }


LANDMARKS = {'larabanga': larabanga, 'castle': castle, 'wli': wli}

if __name__ == '__main__':
    OUT.mkdir(exist_ok=True)
    name = sys.argv[1]
    img, layers = LANDMARKS[name]()
    overlay(img, [(layers['outline'], (223, 74, 50)), (layers.get('details', []), (23, 106, 75)), (layers.get('plinth', []), (40, 40, 200), 'open'), (layers.get('door', []), (200, 40, 200))], name)
    data = {'width': img.width, 'height': img.height, **{k: to_d(v) for k, v in layers.items()}}
    (OUT / f'{name}.json').write_text(json.dumps(data))
    print(name, {k: len(v) for k, v in layers.items()})
