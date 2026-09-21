"""Write dist/credits.html from dist/assets/CREDITS.md.

CREDITS.md stays the source of truth; this turns its headings, paragraphs and tables into a
readable page. Re-run after editing CREDITS.md: python3 tools/media/build_credits.py
"""
import html, os, re

DIST = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'dist')
source = open(os.path.join(DIST, 'assets', 'CREDITS.md'), encoding='utf-8').read()


def inline(text):
    text = html.escape(text.strip(), quote=False)
    text = re.sub(r'`([^`]+)`', r'<code>\1</code>', text)
    return re.sub(r'(https?://[^\s<|]+)', lambda m: f'<a href="{m.group(1)}" rel="noopener">{"Source" if "commons.wikimedia" in m.group(1) else m.group(1)}</a>', text)


def cells(line):
    return [c for c in line.strip().strip('|').split('|')]


body, table = [], None
for line in source.splitlines() + ['']:
    if line.startswith('|'):
        if re.match(r'^\|[-\s|]+\|$', line):
            continue
        if table is None:
            table = ['<div class="credits-table"><table><thead><tr>' + ''.join(f'<th scope="col">{inline(c)}</th>' for c in cells(line)) + '</tr></thead><tbody>']
        else:
            table.append('<tr>' + ''.join(f'<td>{inline(c)}</td>' for c in cells(line)) + '</tr>')
        continue
    if table is not None:
        body.append(''.join(table) + '</tbody></table></div>')
        table = None
    if line.startswith('# '):
        body.append(f'<h1>Photo credits</h1>')
    elif line.startswith('## '):
        body.append(f'<h2>{inline(line[3:])}</h2>')
    elif line.strip():
        body.append(f'<p>{inline(line)}</p>')

page = f'''<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="Who took the photographs on GhanaNice, with the licence and source for every image.">
  <meta name="theme-color" content="#f1eee5">
  <title>Photo credits — GhanaNice</title>
  <link rel="icon" href="/favicon.ico" sizes="48x48">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">
  <link rel="canonical" href="https://www.ghananice.com/credits.html">
  <link rel="stylesheet" href="styles.css?v=20">
</head>
<body class="doc-page">
  <nav class="nav" aria-label="Primary navigation">
    <a class="wordmark" href="/" aria-label="GhanaNice home">Ghana<span>Nice</span><i>★</i></a>
  </nav>
  <main class="doc-main" id="main">
    <a class="region-back" href="/">← GhanaNice</a>
    {chr(10).join('    ' + b for b in body)}
  </main>
</body>
</html>
'''
open(os.path.join(DIST, 'credits.html'), 'w', encoding='utf-8').write(page)
print('wrote dist/credits.html')
