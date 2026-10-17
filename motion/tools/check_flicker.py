"""Find single-frame flickers in a rendered clip: a frame that differs from both its neighbours
while they match each other (a half-drawn or tiled capture, a layer that dropped out).
Run: python3 tools/check_flicker.py out/<clip>.mp4   (needs ffmpeg and Pillow)"""
import glob, os, shutil, subprocess, sys, tempfile
from PIL import Image, ImageChops, ImageStat

src = sys.argv[1]
tmp = tempfile.mkdtemp(prefix='flicker-')
try:
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', src, '-vf', 'scale=270:-1', os.path.join(tmp, 'f%05d.png')], check=True)
    frames = [Image.open(f).convert('L') for f in sorted(glob.glob(os.path.join(tmp, '*.png')))]
    diff = lambda a, b: sum(ImageStat.Stat(ImageChops.difference(a, b)).mean)
    bad = []
    for i in range(1, len(frames) - 1):
        ab, bc, ac = diff(frames[i - 1], frames[i]), diff(frames[i], frames[i + 1]), diff(frames[i - 1], frames[i + 1])
        if ab > 1.5 and bc > 1.5 and ac < 0.5 * min(ab, bc):
            bad.append(f'{i} ({i / 30:.2f}s)')
    print(f'{len(frames)} frames; flickers: {", ".join(bad) or "none"}')
    sys.exit(1 if bad else 0)
finally:
    shutil.rmtree(tmp)
