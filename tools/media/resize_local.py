"""Write small WebP copies of the hand-placed photos in dist/assets/real/.

The originals stay (the lightbox and CREDITS.md point at them). Next to each one this writes
  <name>-400.webp   postcards on the landing deck (~160px wide on screen)
  <name>-800.webp   gallery tiles, place cards, the reader's side photo
  <name>-1200.webp  hero reel, region hero, the reader's main photo
Run from anywhere: python3 tools/media/resize_local.py
"""
import os
from PIL import Image

REAL = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'dist', 'assets', 'real')
WIDTHS = (400, 800, 1200)

for folder in (REAL, os.path.join(REAL, 'regions')):
    for name in sorted(os.listdir(folder)):
        stem, ext = os.path.splitext(name)
        if ext.lower() not in ('.jpg', '.jpeg', '.png') or stem.endswith('-storm'):
            continue
        image = Image.open(os.path.join(folder, name)).convert('RGB')
        for width in WIDTHS:
            copy = image if image.width <= width else image.resize((width, round(image.height * width / image.width)), Image.LANCZOS)
            out = os.path.join(folder, f'{stem}-{width}.webp')
            copy.save(out, 'WEBP', quality=78, method=6)
            print(f'{os.path.relpath(out, REAL)}  {os.path.getsize(out) // 1024} KB')
