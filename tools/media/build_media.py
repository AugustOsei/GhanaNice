"""Write dist/media.js (photos, galleries, place links) and a credits table from manifest.json."""
import json, re, os, urllib.parse

m = json.load(open('manifest.json'))
captions = json.load(open('captions.json')) if os.path.exists('captions.json') else {}
DIST = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'dist')

JUNK = re.compile(r'^(this is (an image|a file|a photo)|orig\. filename|dcim|parks$|mogli$|ghana$|en\.wikipedia|nice view|a glimpse|a view from the summit)', re.I)


def title_from_file(f):
    t = os.path.splitext(f)[0]
    t = re.sub(r'\(\d{6,}\)|\(P\d+\)|\bB00\d\w?\b|\d{4}-\d{2}-\d{2}|_', ' ', t)
    t = re.sub(r'\s+-\s+', ', ', t)
    return re.sub(r'\s+', ' ', t).strip(' ,')


def caption_for(f):
    if f in captions:
        return captions[f]
    d = m['meta'][f]['desc']
    if d and not JUNK.search(d):
        first = re.split(r'(?<=[.!?])\s', d)[0].rstrip('.')
        if 8 < len(first) <= 120:
            return first[0].upper() + first[1:]
    return title_from_file(f)


WIKI = {
    'greater-accra|Jamestown': 'Jamestown/Usshertown, Accra', 'greater-accra|Kwame Nkrumah Memorial Park': 'Kwame Nkrumah Memorial Park',
    'greater-accra|Makola Market': 'Makola, Ghana', 'greater-accra|Labadi Beach': 'Labadi Beach', 'greater-accra|Osu': 'Osu, Accra',
    'central|Cape Coast Castle': 'Cape Coast Castle', 'central|Kakum National Park': 'Kakum National Park', 'central|Elmina Castle': 'Elmina Castle',
    'central|Assin Manso Ancestral Slave River': 'Assin Manso Slave River Site',
    'volta|Wli Falls': 'Wli waterfalls', 'volta|Mount Afadja': 'Mount Afadja', 'volta|Tafi Atome Monkey Sanctuary': 'Tafi Atome Monkey Sanctuary',
    'volta|Amedzofe': 'Amedzofe, Ghana', 'volta|Keta Lagoon': 'Keta Lagoon',
    'savannah|Mole National Park': 'Mole National Park', 'savannah|Larabanga Mosque': 'Larabanga Mosque', 'savannah|Salaga': 'Salaga',
    'western|Nzulezu': 'Nzulezo', 'western|Busua Beach': 'Busua', 'western|Cape Three Points': 'Cape Three Points',
    'western|Fort San Antonio, Axim': 'Fort Saint Anthony', 'western|Ankasa Conservation Area': 'Ankasa Conservation Area',
    'ashanti|Manhyia Palace Museum': 'Manhyia Palace', 'ashanti|Kejetia Market': 'Kejetia Market',
    'ashanti|The Great Hall, KNUST': 'Kwame Nkrumah University of Science and Technology', 'ashanti|Lake Bosomtwe': 'Lake Bosumtwi',
    'ashanti|Bonwire': 'Bonwire', 'ashanti|Ntonso': 'Ntonso',
    'eastern|Aburi Botanical Gardens': 'Aburi Botanical Gardens', 'eastern|Akosombo Dam': 'Akosombo Dam', 'eastern|Boti Falls': 'Boti Falls',
    'eastern|Bunso Arboretum': 'Bunso Eco Park',
    'northern|Gbewaa Palace, Yendi': 'Gbewaa Palace',
    'upper-east|Paga Crocodile Pond': 'Paga Crocodile Pond', 'upper-east|Tongo Hills and Tengzug': 'Tongo Hills',
    "upper-west|Wa Naa's Palace": "Wa Naa's Palace", 'upper-west|Wechiau Community Hippo Sanctuary': 'Wechiau Community Hippo Sanctuary',
    'upper-west|Gwollu Defence Wall': 'Gwollu', 'upper-west|Nandom': 'Nandom',
    'north-east|Nalerigu': 'Nalerigu', 'north-east|Naa Jaringa Wall, Gambaga': 'Gambaga', 'north-east|Nakpanduri': 'Nakpanduri',
    'oti|Lake Volta at Dambai': 'Dambai', 'oti|Kyabobo National Park': 'Kyabobo National Park', 'oti|Nkwanta': 'Nkwanta',
    'bono|Boabeng-Fiema Monkey Sanctuary': 'Boabeng-Fiema Monkey Sanctuary', 'bono|Sunyani': 'Sunyani', 'bono|Bui National Park': 'Bui National Park',
    'bono-east|Kintampo Waterfalls': 'Kintampo waterfalls', 'bono-east|Techiman Market': 'Techiman', 'bono-east|Buoyem Caves': 'Buoyem',
    'ahafo|Goaso': 'Goaso', 'ahafo|Mim': 'Mim, Ahafo', 'ahafo|Kenyasi': 'Kenyasi', 'western-north|Bia National Park': 'Bia National Park',
}
VISIT = {}
for line in open('visitghana.txt'):
    r, v, u = [x.strip() for x in line.split('|', 2)]
    VISIT[f'{r}|{v}'] = u
SITES = {
    'ashanti|Manhyia Palace Museum': 'https://manhyiapalacemuseum.org/',
    'ashanti|The Great Hall, KNUST': 'https://www.knust.edu.gh/',
    'bono|Boabeng-Fiema Monkey Sanctuary': 'https://www.boabengfms.org/',
    'savannah|Mole National Park': 'https://www.molenationalpark.org/',
}

photos = {}
for f, x in m['meta'].items():
    if 'slug' not in x or 'size' not in x:
        continue
    photos[x['slug']] = {
        'src': f'assets/photos/{x["slug"]}.webp', 'small': f'assets/photos/{x["slug"]}-800.webp',
        'w': x['size'][0], 'h': x['size'][1], 'caption': caption_for(f),
        'author': x['artist'] or 'Unknown', 'license': x['license'], 'licenseUrl': x['licenseUrl'], 'source': x['page'],
    }
slug_of = lambda f: m['meta'][f]['slug']

places = {}
for k in sorted(set(WIKI) | set(VISIT) | set(SITES) | set(m["cards"])):
    entry = {}
    if k in m['cards']:
        entry['photo'] = slug_of(m['cards'][k])
    if k in WIKI:
        entry['wiki'] = 'https://en.wikipedia.org/wiki/' + urllib.parse.quote(WIKI[k].replace(' ', '_'))
    if k in VISIT:
        entry['guide'] = VISIT[k]
    if k in SITES:
        entry['site'] = SITES[k]
    places[k] = entry

regions = {}
for r, fs in m['gallery'].items():
    card_slugs = [slug_of(f) for k, f in m['cards'].items() if k.startswith(r + '|')]
    regions[r] = list(dict.fromkeys([slug_of(f) for f in fs] + card_slugs))

used = {s for v in regions.values() for s in v} | {p['photo'] for p in places.values() if 'photo' in p}
photos = {k: v for k, v in photos.items() if k in used}

LICENSE_URLS = {'CC BY 2.0': 'https://creativecommons.org/licenses/by/2.0/', 'CC BY 4.0': 'https://creativecommons.org/licenses/by/4.0/',
    'CC BY-SA 4.0': 'https://creativecommons.org/licenses/by-sa/4.0/', 'CC BY-SA 3.0': 'https://creativecommons.org/licenses/by-sa/3.0/',
    'CC0': 'https://creativecommons.org/publicdomain/zero/1.0/'}
local = {}
for line in open(DIST + '/assets/CREDITS.md'):
    cells = [c.strip() for c in line.strip().strip('|').split('|')]
    if len(cells) == 5 and cells[0].startswith('`real/') and cells[3].startswith('http'):
        path = 'assets/' + cells[0].strip('`')
        local[path] = {'caption': cells[1], 'author': cells[2], 'license': cells[4], 'licenseUrl': LICENSE_URLS.get(cells[4], ''), 'source': cells[3]}
        # approximate size for mosaic shape
        try:
            from PIL import Image
            local[path]['w'], local[path]['h'] = Image.open(DIST + '/' + path).size
        except Exception:
            pass

out = ('/* Generated from Wikimedia Commons picks (scratch build_media.py). Every photo carries its\n'
       '   author, licence and source page, and region pages show them. */\n'
       'window.GHANA_MEDIA = ' + json.dumps({'photos': photos, 'regions': regions, 'places': places, 'local': local, 'leads': {r: slug_of(f) for r, f in m.get('leads', {}).items()}}, ensure_ascii=False, indent=1) + ';\n')
open(f'{DIST}/media.js', 'w').write(out)

# credits table
rows = []
for r, slugs in regions.items():
    for s in slugs:
        p = photos[s]
        rows.append(f'| `photos/{s}.webp` | {p["caption"].replace("|", "/")} ({r}) | {p["author"].replace("|", "/")} | {p["source"]} | {p["license"]} |')
open('credits_rows.md', 'w').write('\n'.join(rows))
print(len(photos), 'photos', sum(len(v) for v in regions.values()), 'gallery slots', len(places), 'places')
