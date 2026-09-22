"""Tiny n8n public-API client for the GhanaNice workflows. Reads N8N_API_URL / N8N_API_KEY
from the repo's gitignored .env.local."""
import json, os, re, time, urllib.error, urllib.request

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
ENV = dict(re.findall(r'^(\w+)=(.*)$', open(os.path.join(ROOT, '.env.local')).read(), re.M))
BASE = ENV['N8N_API_URL'].rstrip('/')


def api(method, path, body=None):
    request = urllib.request.Request(
        f'{BASE}/api/v1{path}', method=method,
        data=json.dumps(body).encode() if body is not None else None,
        headers={'X-N8N-API-KEY': ENV['N8N_API_KEY'], 'Content-Type': 'application/json', 'Accept': 'application/json'})
    try:
        with urllib.request.urlopen(request) as response:
            raw = response.read()
            return json.loads(raw) if raw else {}
    except urllib.error.HTTPError as error:
        raise RuntimeError(f'{method} {path} -> {error.code}: {error.read()[:600].decode(errors="replace")}')


def find_workflow(name):
    return next((w for w in api('GET', '/workflows?limit=250')['data'] if w['name'] == name), None)


def run_temp(name, nodes, connections, call):
    """Create a throwaway webhook workflow, activate it, call it, then delete it.
    `call(base_url)` does the HTTP request and returns its result."""
    workflow = api('POST', '/workflows', {'name': name, 'nodes': nodes, 'connections': connections, 'settings': {'executionOrder': 'v1'}})
    try:
        api('POST', f"/workflows/{workflow['id']}/activate")
        time.sleep(1.5)
        return call(BASE)
    finally:
        api('DELETE', f"/workflows/{workflow['id']}")
