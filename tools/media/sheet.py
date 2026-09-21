"""Contact sheets: python sheet.py <cands.json> <key-prefix> <out.jpg> [per_key]"""
import io, json, os, sys, time, urllib.request, hashlib
from PIL import Image, ImageDraw, ImageFont
from wm import commons_info, UA

cands = json.load(open(sys.argv[1]))
prefix, out = sys.argv[2], sys.argv[3]
per_key = int(sys.argv[4]) if len(sys.argv) > 4 else 12
INFO = 'info.json'
info = json.load(open(INFO)) if os.path.exists(INFO) else {}
os.makedirs('thumbs', exist_ok=True)

keys = [k for k in cands if k == prefix or k.startswith(prefix + '|')]
groups = [(k, cands[k][:per_key]) for k in keys]
need = [f for _, fs in groups for f in fs if f not in info]
if need:
    got = commons_info(need, width=330)
    info.update(got)
    json.dump(info, open(INFO, 'w'))


def thumb(f):
    meta = info.get(f)
    if not meta or not meta.get('thumb'):
        return None
    path = 'thumbs/' + hashlib.md5(f.encode()).hexdigest() + '.jpg'
    if not os.path.exists(path):
        for i in range(3):
            try:
                req = urllib.request.Request(meta['thumb'], headers={'User-Agent': UA})
                data = urllib.request.urlopen(req, timeout=30).read()
                Image.open(io.BytesIO(data)).convert('RGB').save(path)
                time.sleep(0.25)
                break
            except Exception:
                time.sleep(4 * (i + 1))
        else:
            return None
    return Image.open(path)


TW, TH, COLS = 250, 180, 8
font = ImageFont.load_default(size=15)
rows = []
for gi, (k, fs) in enumerate(groups):
    tiles = [(i, f) for i, f in enumerate(fs)]
    nrows = max(1, (len(tiles) + COLS - 1) // COLS)
    rows.append((gi, k, tiles, nrows))
H = sum(30 + r[3] * (TH + 22) for r in rows) + 10
sheet = Image.new('RGB', (COLS * TW, H), (245, 245, 240))
d = ImageDraw.Draw(sheet)
y = 5
for gi, k, tiles, nrows in rows:
    d.text((6, y + 6), f'[{chr(65 + gi)}] {k}', fill=(200, 30, 30), font=font)
    y += 30
    for n, (i, f) in enumerate(tiles):
        x0, y0 = (n % COLS) * TW, y + (n // COLS) * (TH + 22)
        im = thumb(f)
        if im:
            im.thumbnail((TW - 6, TH))
            sheet.paste(im, (x0 + 3, y0))
        m = info.get(f, {})
        lic = (m.get('license') or '?')[:12]
        d.text((x0 + 4, y0 + TH + 2), f'{chr(65 + gi)}{i} {m.get("w", "?")}px {lic}', fill=(0, 0, 0), font=font)
    y += nrows * (TH + 22)
sheet.save(out, quality=80)
print(out, sheet.size)
