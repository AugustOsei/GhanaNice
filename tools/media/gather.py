"""Collect candidate Commons images per place (and gallery queries per region)."""
import json, re, sys
from wm import *

resolved = json.load(open('resolved.json'))
BAD_CAT = {'greater-accra|Makola Market', 'northern|Tamale Central Market', 'northern|Daboya', 'upper-east|Sirigu',
           'bono-east|Techiman Market', 'ahafo|Mim', 'upper-east|Bolgatanga Market'}
SEARCH = {
    'greater-accra|Makola Market': 'Makola market Accra',
    'greater-accra|Arts Centre for National Culture': 'Arts Centre Accra craft',
    'central|Hans Cottage Botel': 'Hans Cottage Botel',
    'central|Assin Manso Ancestral Slave River': 'Assin Manso',
    'savannah|Mognori Eco Village': 'Mognori',
    'western|Busua Beach': 'Busua beach',
    'eastern|Umbrella Rock': 'Umbrella rock Boti',
    'northern|Central Mosque, Tamale': 'Tamale central mosque',
    'northern|Tamale Central Market': 'Tamale market',
    'northern|Daboya': 'Daboya',
    'upper-east|Sirigu': 'Sirigu',
    'upper-east|Navrongo Cathedral': 'Navrongo cathedral',
    'upper-east|Bolgatanga Market': 'Bolgatanga market',
    'upper-west|Wechiau Community Hippo Sanctuary': 'Wechiau hippo',
    'upper-west|Nandom': 'Nandom',
    'north-east|Gambaga Escarpment': 'Gambaga escarpment',
    'oti|Nkwanta': 'Nkwanta',
    'bono-east|Techiman Market': 'Techiman market',
    'bono-east|Fuller Falls': 'Fuller falls',
    'bono-east|Buoyem Caves': 'Buoyem',
    'ahafo|Mim': 'Mim Ahafo',
    'ahafo|Kenyasi': 'Kenyasi',
    'western-north|Sefwi Wiawso': 'Sefwi Wiawso',
    'western-north|Cocoa country': 'cocoa pods Ghana farm',
    'ashanti|Ntonso': 'Ntonso adinkra',
    'upper-west|Gwollu Defence Wall': 'Gwollu wall',
}

GALLERY = {
    'greater-accra': ['Accra skyline', 'Accra aerial view', 'Airport City Accra', 'Independence Square Accra', 'Accra night', 'Jamestown Accra fishing', 'Accra Ridge buildings', 'Kwame Nkrumah Mausoleum'],
    'central': ['Cape Coast town', 'Elmina fishing boats', 'Elmina harbour', 'Kakum canopy walkway', 'Anomabo'],
    'volta': ['Wli falls', 'Afadjato', 'Volta region landscape', 'Keta beach', 'Ho Ghana', 'Tafi Atome'],
    'savannah': ['Mole National Park elephants', 'Mole National Park', 'Larabanga', 'Damongo'],
    'western': ['Takoradi', 'Busua', 'Axim beach', 'Nzulezo', 'Cape Three Points'],
    'ashanti': ['Kumasi skyline', 'Kumasi city', 'Kumasi Kejetia', 'Lake Bosumtwi', 'kente weaving Bonwire', 'Manhyia palace'],
    'eastern': ['Aburi gardens', 'Akosombo', 'Adomi bridge', 'Boti falls', 'Koforidua', 'Lake Volta Akosombo'],
    'northern': ['Tamale Ghana', 'Tamale city', 'Yendi', 'Northern Ghana savanna'],
    'upper-east': ['Bolgatanga', 'Sirigu painting', 'Tiebele', 'Tongo hills', 'Paga crocodile', 'Bolga basket'],
    'upper-west': ['Wa Ghana', 'Wa Naa palace', 'Wechiau', 'Upper West Region Ghana'],
    'north-east': ['Nalerigu', 'Gambaga', 'Nakpanduri', 'Walewale'],
    'oti': ['Dambai', 'Kyabobo', 'Oti river', 'Lake Volta boat'],
    'bono': ['Sunyani', 'Boabeng Fiema monkeys', 'Bui dam', 'Berekum'],
    'bono-east': ['Kintampo falls', 'Techiman', 'Kintampo'],
    'ahafo': ['Goaso', 'Ahafo region', 'Kenyasi', 'Duayaw Nkwanta'],
    'western-north': ['Bia National Park', 'Sefwi', 'Juaboso', 'Bibiani'],
}

OK_EXT = re.compile(r'\.(jpe?g|png|webp|tiff?)$', re.I)
SKIP = re.compile(r'map|logo|flag|coat of arms|locator|svg|diagram|chart|seal|district|montage|constituency', re.I)


def candidates_for(key):
    r = resolved.get(key)
    files = []
    if r and key not in BAD_CAT:
        files += (r.get('image') or [])
        if r.get('pageimage'):
            files.append(r['pageimage'].replace('_', ' '))
        for cat in (r.get('commonscat') or [])[:1]:
            try:
                files += commons_category(cat, 40)
            except Exception as e:
                print('cat fail', cat, e, file=sys.stderr)
    if key in SEARCH:
        files += commons_search(SEARCH[key] + ' Ghana' if 'Ghana' not in SEARCH[key] else SEARCH[key], 24)
    seen, out = set(), []
    for f in files:
        if f in seen or not OK_EXT.search(f) or SKIP.search(f):
            continue
        seen.add(f)
        out.append(f)
    return out[:28]


if __name__ == '__main__':
    mode = sys.argv[1]
    cands = {}
    if mode == 'places':
        for key in resolved:
            cands[key] = candidates_for(key)
            print(key, len(cands[key]), file=sys.stderr)
    else:
        for slug, qs in GALLERY.items():
            files = []
            for q in qs:
                try:
                    files += commons_search(q + (' Ghana' if 'Ghana' not in q else ''), 14)
                except Exception as e:
                    print('search fail', q, e, file=sys.stderr)
            seen, out = set(), []
            for f in files:
                if f in seen or not OK_EXT.search(f) or SKIP.search(f):
                    continue
                seen.add(f); out.append(f)
            cands[slug] = out[:60]
            print(slug, len(cands[slug]), file=sys.stderr)
    json.dump(cands, open(f'cands_{mode}.json', 'w'), indent=1)
