"""Add hand-picked Commons photos to the site: download each one (a standard 1920px thumbnail, so
Commons doesn't rate-limit it), save dist/assets/photos/<slug>.webp (1600px) and <slug>-800.webp,
and record its credit in manifest.json's `meta`. Then point a card or gallery at it in
manifest.json and run build_media.py.

    ./venv/bin/python fetch.py "File name.jpg" ["Another.jpg" ...]
Needs Pillow."""
import io, json, os, re, sys, time, urllib.request
from PIL import Image
from wm import UA, commons_info

DIST = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'dist')
strip = lambda s: re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', ' ', s or '')).strip()
slugify = lambda f: re.sub(r'-+', '-', re.sub(r'[^a-z0-9]+', '-', os.path.splitext(f)[0].lower())).strip('-')

m = json.load(open('manifest.json'))
files = sys.argv[1:]
info = commons_info(files, width=1920)
for f in files:
    i = info[f]
    slug = slugify(f)
    for attempt in range(4):
        try:
            time.sleep(2)
            data = urllib.request.urlopen(urllib.request.Request(i['thumb'], headers={'User-Agent': UA}), timeout=60).read()
            break
        except Exception:
            if attempt == 3:
                raise
            time.sleep(20 * (attempt + 1))
    image = Image.open(io.BytesIO(data)).convert('RGB')
    for width, name in ((1600, f'{slug}.webp'), (800, f'{slug}-800.webp')):
        copy = image if image.width <= width else image.resize((width, round(image.height * width / image.width)), Image.LANCZOS)
        copy.save(os.path.join(DIST, 'assets', 'photos', name), 'WEBP', quality=82)
        if width == 1600:
            size = list(copy.size)
    m['meta'][f] = {'artist': strip(i['artist']), 'license': i['license'], 'licenseUrl': i['licenseUrl'], 'page': i['desc'],
                    'w': i['w'], 'h': i['h'], 'desc': strip(i['caption']), 'slug': slug, 'size': size}
    print(f'{slug}  {size}  {i["license"]}  {strip(i["artist"])}')
json.dump(m, open('manifest.json', 'w'), indent=1)
