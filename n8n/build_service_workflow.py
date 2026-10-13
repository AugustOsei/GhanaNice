"""Build, upload and activate the GhanaNice travel-service intake workflow.

Flow: website form → validate → log in the Services sheet → thank the sender → email
August for approval → publish an approved standard listing to the repository → notify the
sender. Featured interest is recorded and highlighted for a separate personal agreement.
"""
import json
import os
import urllib.request
import uuid

from n8n_api import api, find_workflow, run_temp

HERE = os.path.dirname(os.path.abspath(__file__))
NAME = 'GhanaNice — Travel services'
REPO = 'https://api.github.com/repos/AugustOsei/GhanaNice'
BRANCH = 'main'
SHEET_ID = '1Af866rDXLZ1mnnHHVvqQ63HL9cs9CYYab2a6JBsdMq0'
SHEETS = f'https://sheets.googleapis.com/v4/spreadsheets/{SHEET_ID}'
ORIGINS = 'https://www.ghananice.com,https://ghananice.com,http://localhost:4173,http://127.0.0.1:4173'
HEADERS = ['id', 'submittedAt', 'status', 'businessName', 'category', 'primaryRegion', 'baseLocation',
           'coverage', 'description', 'website', 'contactName', 'email', 'phone', 'listingType',
           'checks', 'reviewerNote', 'source', 'updatedAt', 'publishedAt', 'decision', 'listingId']

CRED = {
    'sheets': {'googleSheetsOAuth2Api': {'id': 'zkOuPwkfg7PMvFPO', 'name': 'Google Sheets account'}},
    'gmail': {'gmailOAuth2': {'id': 'XSli9zjeTSRhQNLt', 'name': 'Gmail account'}},
    'github': {'githubApi': {'id': 'bZLd6GbkA1nT5I0K', 'name': 'GhanaNice — GitHub'}},
}


def temp_call(base, path):
    with urllib.request.urlopen(f'{base}/webhook/{path}') as response:
        return json.loads(response.read() or b'{}')


def temp_webhook(path):
    return {'id': 'setup-webhook', 'name': 'Setup webhook', 'type': 'n8n-nodes-base.webhook',
            'typeVersion': 2, 'position': [0, 0], 'parameters': {
                'httpMethod': 'GET', 'path': path, 'responseMode': 'responseNode', 'options': {}}}


def temp_response(x=480):
    return {'id': 'setup-response', 'name': 'Setup response', 'type': 'n8n-nodes-base.respondToWebhook',
            'typeVersion': 1.1, 'position': [x, 0], 'parameters': {
                'respondWith': 'json', 'responseBody': '={{ JSON.stringify($json) }}', 'options': {}}}


def setup_http(name, x, method, url, body=None):
    params = {'method': method, 'url': url, 'authentication': 'predefinedCredentialType',
              'nodeCredentialType': 'googleSheetsOAuth2Api', 'options': {}}
    if body is not None:
        params.update(sendBody=True, specifyBody='json', jsonBody=body)
    return {'id': f'setup-{x}', 'name': name, 'type': 'n8n-nodes-base.httpRequest', 'typeVersion': 4.2,
            'position': [x, 0], 'parameters': params, 'credentials': CRED['sheets']}


def chain(names):
    return {name: {'main': [[{'node': names[index + 1], 'type': 'main', 'index': 0}]]}
            for index, name in enumerate(names[:-1])}


def ensure_services_sheet():
    path = f'gn-services-sheet-{uuid.uuid4().hex[:10]}'
    names = ['Setup webhook', 'Sheet metadata', 'Setup response']
    metadata = run_temp(
        'GhanaNice service sheet check',
        [temp_webhook(path), setup_http('Sheet metadata', 240, 'GET', f'{SHEETS}?fields=sheets.properties'), temp_response()],
        chain(names), lambda base: temp_call(base, path))
    titles = [sheet.get('properties', {}).get('title') for sheet in metadata.get('sheets', [])]
    if 'Services' in titles:
        return

    path = f'gn-services-sheet-create-{uuid.uuid4().hex[:10]}'
    add_body = '={{ JSON.stringify({ requests: [{ addSheet: { properties: { title: "Services" } } }] }) }}'
    header_body = '={{ JSON.stringify({ values: [' + json.dumps(HEADERS) + '] }) }}'
    names = ['Setup webhook', 'Add Services sheet', 'Write headers', 'Setup response']
    run_temp(
        'GhanaNice service sheet setup',
        [temp_webhook(path),
         setup_http('Add Services sheet', 240, 'POST', f'{SHEETS}:batchUpdate', add_body),
         setup_http('Write headers', 480, 'PUT', f'{SHEETS}/values/Services!A1:U1?valueInputOption=RAW', header_body),
         temp_response(720)],
        chain(names), lambda base: temp_call(base, path))


nodes, connections = [], {}


def add(name, type_, version, x, y, parameters, **extra):
    node = {'id': f'gns-{len(nodes) + 1}', 'name': name, 'type': type_, 'typeVersion': version,
            'position': [x * 240, y * 180], 'parameters': parameters}
    node.update(extra)
    nodes.append(node)
    return name


def link(source, target, output=0):
    outputs = connections.setdefault(source, {'main': []})['main']
    while len(outputs) <= output:
        outputs.append([])
    outputs[output].append({'node': target, 'type': 'main', 'index': 0})


def code(name, filename, x, y):
    with open(os.path.join(HERE, 'code', filename)) as handle:
        return add(name, 'n8n-nodes-base.code', 2, x, y, {'jsCode': handle.read()})


def http(name, x, y, method, url, cred, body=None, query=(), on_error=None, never_error=False):
    params = {'method': method, 'url': url, 'options': {}}
    if cred:
        kind = next(iter(CRED[cred]))
        params.update(authentication='predefinedCredentialType', nodeCredentialType=kind)
    if query:
        params.update(sendQuery=True, queryParameters={'parameters': [{'name': key, 'value': value} for key, value in query]})
    if body is not None:
        params.update(sendBody=True, specifyBody='json', jsonBody=body)
    if never_error:
        params['options'].setdefault('response', {'response': {}})['response']['neverError'] = True
    extra = {'credentials': CRED[cred]} if cred else {}
    if on_error:
        extra['onError'] = on_error
    return add(name, 'n8n-nodes-base.httpRequest', 4.2, x, y, params, **extra)


def branch(name, x, y, expression):
    return add(name, 'n8n-nodes-base.if', 2.2, x, y, {
        'conditions': {'options': {'caseSensitive': True, 'leftValue': '', 'typeValidation': 'loose', 'version': 2},
                       'conditions': [{'id': f'c{len(nodes)}', 'leftValue': '={{ ' + expression + ' }}', 'rightValue': '',
                                       'operator': {'type': 'boolean', 'operation': 'true', 'singleValue': True}}],
                       'combinator': 'and'}, 'options': {}})


def gmail(name, x, y, to, subject, html):
    return add(name, 'n8n-nodes-base.gmail', 2.1, x, y, {
        'sendTo': to, 'subject': subject, 'emailType': 'html', 'message': html,
        'options': {'appendAttribution': False, 'senderName': 'GhanaNice'}},
        credentials=CRED['gmail'], onError='continueRegularOutput')


R = "$('Prepare review').first().json"

# Intake and persistence.
add('Service from the site', 'n8n-nodes-base.webhook', 2, 0, 0, {
    'httpMethod': 'POST', 'path': 'ghananice-service', 'responseMode': 'responseNode',
    'options': {'allowedOrigins': ORIGINS}}, webhookId='7f5d2a3f-3e41-4d62-9a72-1000000000a1')
code('Read service', 'read-service.js', 1, 0)
branch('Valid service?', 2, 0, "$json.verdict === 'ok'")
add('Answer: not accepted', 'n8n-nodes-base.respondToWebhook', 1.1, 3, 1, {
    'respondWith': 'json',
    'responseBody': "={{ JSON.stringify($json.verdict === 'drop' ? { ok: true } : { ok: false, error: $json.reason }) }}",
    'options': {'responseCode': "={{ $json.verdict === 'drop' ? 200 : 400 }}"}})
http('Log received', 3, 0, 'POST', f'{SHEETS}/values/Services!A1:append', 'sheets',
     body='={{ JSON.stringify({ values: [$json.row] }) }}',
     query=[('valueInputOption', 'RAW'), ('insertDataOption', 'INSERT_ROWS')])
add('Answer: received', 'n8n-nodes-base.respondToWebhook', 1.1, 4, 0, {
    'respondWith': 'json', 'responseBody': '={ "ok": true }', 'options': {}})

# Check duplicates, notify both sides, and wait for August's decision.
http('Current published services', 5, 0, 'GET', f'{REPO}/contents/dist/data/service-submissions.json', 'github',
     query=[('ref', BRANCH)], never_error=True)
code('Prepare review', 'prepare-service-review.js', 6, 0)
http('Log for review', 7, -1, 'PUT', f'={SHEETS}/values/Services!A{{{{ $json.rowNumber }}}}:U{{{{ $json.rowNumber }}}}', 'sheets',
     body='={{ JSON.stringify({ values: [$json.row] }) }}', query=[('valueInputOption', 'RAW')],
     on_error='continueRegularOutput')
gmail('Thank the sender', 7, 0, f'={{{{ {R}.email }}}}', f'={{{{ {R}.subjectThanks }}}}', f'={{{{ {R}.thanksHtml }}}}')
add('Ask August to approve', 'n8n-nodes-base.gmail', 2.1, 8, 0, {
    'operation': 'sendAndWait', 'sendTo': f'={{{{ {R}.settings.reviewTo }}}}',
    'subject': f'={{{{ {R}.subjectApproval }}}}', 'message': f'={{{{ {R}.approvalText }}}}',
    'approvalOptions': {'values': {'approvalType': 'double', 'approveLabel': 'Approve standard listing', 'disapproveLabel': 'Reject'}},
    'options': {'limitWaitTime': {'values': {'limitType': 'afterTimeInterval', 'resumeAmount': 30, 'resumeUnit': 'days'}}}},
    credentials=CRED['gmail'], webhookId='7f5d2a3f-3e41-4d62-9a72-1000000000a2')
branch('Approved?', 9, 0, '$json.data?.approved === true')

# Publish the standard listing as one JSON-file commit.
http('Git ref', 11, -1, 'GET', f'{REPO}/git/ref/heads/{BRANCH}', 'github')
http('Git commit', 12, -1, 'GET', f'={REPO}/git/commits/{{{{ $json.object.sha }}}}', 'github')
http('Current service file', 13, -1, 'GET', f'{REPO}/contents/dist/data/service-submissions.json', 'github',
     query=[('ref', BRANCH)], never_error=True)
code('Build service file', 'build-service-file.js', 14, -1)
branch('Already published?', 15, -1, '$json.alreadyPublished === true')
http('Upload blob', 16, -2, 'POST', f'{REPO}/git/blobs', 'github',
     body='={{ JSON.stringify({ content: $json.content, encoding: "base64" }) }}')
add('Make tree', 'n8n-nodes-base.code', 2, 17, -2, {'jsCode': "const built = $('Build service file').first().json; return [{ json: { baseTree: built.baseTree, head: built.head, message: built.message, tree: [{ path: built.path, mode: '100644', type: 'blob', sha: $json.sha }] } }];"})
http('Create tree', 18, -2, 'POST', f'{REPO}/git/trees', 'github',
     body='={{ JSON.stringify({ base_tree: $json.baseTree, tree: $json.tree }) }}')
http('Create commit', 19, -2, 'POST', f'{REPO}/git/commits', 'github',
     body="={{ JSON.stringify({ message: $('Make tree').first().json.message, tree: $json.sha, parents: [$('Make tree').first().json.head] }) }}")
http('Move branch', 20, -2, 'PATCH', f'{REPO}/git/refs/heads/{BRANCH}', 'github',
     body='={{ JSON.stringify({ sha: $json.sha }) }}')
http('Log published', 21, -1, 'POST', f'{SHEETS}/values:batchUpdate', 'sheets', on_error='continueRegularOutput',
     body=f"={{{{ JSON.stringify({{ valueInputOption: 'RAW', data: [{{ range: 'Services!C' + {R}.rowNumber, values: [['published']] }}, {{ range: 'Services!R' + {R}.rowNumber + ':T' + {R}.rowNumber, values: [[[new Date().toISOString(), new Date().toISOString(), 'approved']]] }}] }}) }}}}")
gmail('Tell the sender it is live', 22, -1, f'={{{{ {R}.email }}}}', f'={{{{ {R}.subjectLive }}}}', f'={{{{ {R}.liveHtml }}}}')

# Rejection and timeout handling.
http('Log closed', 10, 1, 'POST', f'{SHEETS}/values:batchUpdate', 'sheets', on_error='continueRegularOutput',
     body=f"={{{{ JSON.stringify({{ valueInputOption: 'RAW', data: [{{ range: 'Services!C' + {R}.rowNumber, values: [[$json.data?.approved === false ? 'rejected' : 'expired: no answer in 30 days']] }}, {{ range: 'Services!R' + {R}.rowNumber + ':T' + {R}.rowNumber, values: [[[new Date().toISOString(), '', $json.data?.approved === false ? 'rejected' : 'expired']]] }}] }}) }}}}")
branch('Explicitly rejected?', 11, 1, '$json.data?.approved === false')
gmail('Tell the sender it was not selected', 12, 1, f'={{{{ {R}.email }}}}', f'={{{{ {R}.subjectRejected }}}}', f'={{{{ {R}.rejectedHtml }}}}')

for source, target, *output in [
    ('Service from the site', 'Read service'), ('Read service', 'Valid service?'),
    ('Valid service?', 'Log received'), ('Valid service?', 'Answer: not accepted', 1),
    ('Log received', 'Answer: received'), ('Answer: received', 'Current published services'),
    ('Current published services', 'Prepare review'), ('Prepare review', 'Log for review'),
    ('Prepare review', 'Thank the sender'), ('Thank the sender', 'Ask August to approve'),
    ('Ask August to approve', 'Approved?'), ('Approved?', 'Git ref'), ('Approved?', 'Explicitly rejected?', 1),
    ('Git ref', 'Git commit'), ('Git commit', 'Current service file'), ('Current service file', 'Build service file'),
    ('Build service file', 'Already published?'), ('Already published?', 'Log published'),
    ('Already published?', 'Upload blob', 1), ('Upload blob', 'Make tree'), ('Make tree', 'Create tree'),
    ('Create tree', 'Create commit'), ('Create commit', 'Move branch'), ('Move branch', 'Log published'),
    ('Log published', 'Tell the sender it is live'),
    ('Explicitly rejected?', 'Log closed'), ('Explicitly rejected?', 'Tell the sender it was not selected'),
    ('Explicitly rejected?', 'Log closed', 1)
]:
    link(source, target, *output)

workflow = {'name': NAME, 'nodes': nodes, 'connections': connections,
            'settings': {'executionOrder': 'v1', 'saveDataErrorExecution': 'all', 'saveDataSuccessExecution': 'all'}}
with open(os.path.join(HERE, 'ghananice-services.json'), 'w') as handle:
    json.dump(workflow, handle, indent=1, ensure_ascii=False)

ensure_services_sheet()
existing = find_workflow(NAME)
if existing:
    api('POST', f"/workflows/{existing['id']}/deactivate")
    result = api('PUT', f"/workflows/{existing['id']}", workflow)
else:
    result = api('POST', '/workflows', workflow)
active = api('POST', f"/workflows/{result['id']}/activate").get('active')
print(f"{NAME}: {result['id']} active={active} ({len(nodes)} nodes)")
