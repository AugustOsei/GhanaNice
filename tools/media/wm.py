"""Small Wikimedia helpers (stdlib only)."""
import json, time, urllib.parse, urllib.request

UA = 'GhanaNice-research/0.1 (static tourism site; contact via site)'


def get(url, params, tries=4):
    q = url + '?' + urllib.parse.urlencode(params)
    for i in range(tries):
        try:
            time.sleep(1.2)
            req = urllib.request.Request(q, headers={'User-Agent': UA})
            with urllib.request.urlopen(req, timeout=30) as r:
                return json.load(r)
        except Exception as e:
            if i == tries - 1:
                raise
            time.sleep(15 * (i + 1))


def wp_search(query, limit=3):
    d = get('https://en.wikipedia.org/w/api.php', {'action': 'query', 'list': 'search', 'srsearch': query, 'srlimit': limit, 'format': 'json'})
    return [h['title'] for h in d['query']['search']]


def wp_pages(titles):
    """title -> {title, qid, pageimage, desc}"""
    d = get('https://en.wikipedia.org/w/api.php', {'action': 'query', 'titles': '|'.join(titles), 'prop': 'pageprops|pageimages|description', 'piprop': 'name', 'redirects': 1, 'format': 'json'})
    out = {}
    norm = {n['from']: n['to'] for n in d['query'].get('normalized', [])}
    redir = {n['from']: n['to'] for n in d['query'].get('redirects', [])}
    pages = {p['title']: p for p in d['query']['pages'].values()}
    for t in titles:
        tt = redir.get(norm.get(t, t), norm.get(t, t))
        p = pages.get(tt, {})
        out[t] = {'title': tt, 'qid': p.get('pageprops', {}).get('wikibase_item'), 'pageimage': p.get('pageimage'), 'desc': p.get('description'), 'missing': 'missing' in p}
    return out


def wd_claims(qids):
    d = get('https://www.wikidata.org/w/api.php', {'action': 'wbgetentities', 'ids': '|'.join(qids), 'props': 'claims|sitelinks', 'format': 'json'})
    out = {}
    for q, e in d['entities'].items():
        c = e.get('claims', {})
        val = lambda p: [x['mainsnak'].get('datavalue', {}).get('value') for x in c.get(p, [])]
        out[q] = {'image': val('P18'), 'website': val('P856'), 'commonscat': val('P373'), 'coord': val('P625')}
    return out


def commons_info(files, width=1600):
    """File names (no 'File:') -> url, thumb, artist, license, descurl, w, h"""
    out = {}
    for i in range(0, len(files), 40):
        chunk = files[i:i + 40]
        d = get('https://commons.wikimedia.org/w/api.php', {'action': 'query', 'titles': '|'.join('File:' + f for f in chunk), 'prop': 'imageinfo', 'iiprop': 'url|extmetadata|size|mime', 'iiurlwidth': width, 'redirects': 1, 'format': 'json'})
        norm = {n['to']: n['from'] for n in d['query'].get('normalized', [])}
        for p in d['query']['pages'].values():
            if 'imageinfo' not in p:
                continue
            ii = p['imageinfo'][0]
            m = ii.get('extmetadata', {})
            g = lambda k: (m.get(k) or {}).get('value', '')
            name = p['title'][5:]
            out[norm.get(p['title'], p['title'])[5:]] = {
                'file': name, 'thumb': ii.get('thumburl'), 'url': ii['url'], 'desc': ii['descriptionurl'],
                'w': ii['width'], 'h': ii['height'], 'mime': ii.get('mime'),
                'artist': g('Artist'), 'license': g('LicenseShortName'), 'licenseUrl': g('LicenseUrl'),
                'caption': g('ImageDescription'), 'date': g('DateTimeOriginal'),
            }
    return out


def commons_category(cat, limit=60):
    d = get('https://commons.wikimedia.org/w/api.php', {'action': 'query', 'list': 'categorymembers', 'cmtitle': 'Category:' + cat, 'cmtype': 'file', 'cmlimit': limit, 'format': 'json'})
    return [m['title'][5:] for m in d['query']['categorymembers']]


def commons_search(query, limit=30):
    d = get('https://commons.wikimedia.org/w/api.php', {'action': 'query', 'list': 'search', 'srsearch': query, 'srnamespace': 6, 'srlimit': limit, 'format': 'json'})
    return [h['title'][5:] for h in d['query']['search']]
