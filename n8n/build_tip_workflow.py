"""Build (or update) the "GhanaNice — Tips" n8n workflow from the code files in n8n/code/,
upload it through the n8n API and activate it. Also writes a copy to n8n/ghananice-tips.json.

    python3 n8n/build_tip_workflow.py

Flow: site form → Read tip → log to Sheet → answer the form → Google lookup → Claude check →
email August (photos + Approve/Reject) and thank the sender → wait → on Approve, commit the
listing and photos to GitHub in one commit (Vercel deploys it) and tell the sender it's live.
See docs/tip-pipeline.md.
"""
import json, os
from n8n_api import api, find_workflow

HERE = os.path.dirname(os.path.abspath(__file__))
NAME = 'GhanaNice — Tips'
REPO = 'https://api.github.com/repos/AugustOsei/GhanaNice'
SHEETS = 'https://sheets.googleapis.com/v4/spreadsheets/{{ $(\'Read tip\').first().json.settings.sheetId }}'
BRANCH = "{{ $('Read tip').first().json.settings.branch }}"
ORIGINS = 'https://www.ghananice.com,https://ghananice.com,http://localhost:4173'

CRED = {
    'places': {'httpHeaderAuth': {'id': 'BEBm6UcLhPMSPPAa', 'name': 'GhanaNice — Google Places'}},
    'sheets': {'googleSheetsOAuth2Api': {'id': 'zkOuPwkfg7PMvFPO', 'name': 'Google Sheets account'}},
    'gmail': {'gmailOAuth2': {'id': 'XSli9zjeTSRhQNLt', 'name': 'Gmail account'}},
    'anthropic': {'anthropicApi': {'id': 'Ba67ZCNmLxMpnerv', 'name': 'Anthropic account'}},
    'github': {'githubApi': {'id': 'bZLd6GbkA1nT5I0K', 'name': 'GhanaNice — GitHub'}},
}
FIELDS = ('id,displayName,formattedAddress,shortFormattedAddress,addressComponents,location,types,primaryType,'
          'primaryTypeDisplayName,rating,userRatingCount,googleMapsUri,websiteUri,nationalPhoneNumber,'
          'internationalPhoneNumber,regularOpeningHours.weekdayDescriptions,businessStatus')

nodes, connections = [], {}


def add(name, type_, version, x, y, parameters, **extra):
    node = {'id': f'gn-{len(nodes) + 1}', 'name': name, 'type': type_, 'typeVersion': version, 'position': [x * 240, y * 180], 'parameters': parameters}
    node.update(extra)
    nodes.append(node)
    return name


def link(source, target, output=0):
    outputs = connections.setdefault(source, {'main': []})['main']
    while len(outputs) <= output:
        outputs.append([])
    outputs[output].append({'node': target, 'type': 'main', 'index': 0})


def code(name, file, x, y):
    return add(name, 'n8n-nodes-base.code', 2, x, y, {'jsCode': open(os.path.join(HERE, 'code', file)).read()})


def http(name, x, y, method, url, cred, body=None, headers=(), never_error=False, options=None, query=(), on_error=None):
    params = {'method': method, 'url': url, 'options': dict(options or {})}
    kind = next(iter(CRED[cred])) if cred else None
    if not kind:
        pass
    elif kind == 'httpHeaderAuth':
        params.update(authentication='genericCredentialType', genericAuthType='httpHeaderAuth')
    else:
        params.update(authentication='predefinedCredentialType', nodeCredentialType=kind)
    if headers:
        params.update(sendHeaders=True, headerParameters={'parameters': [{'name': k, 'value': v} for k, v in headers]})
    if query:
        params.update(sendQuery=True, queryParameters={'parameters': [{'name': k, 'value': v} for k, v in query]})
    if body is not None:
        params.update(sendBody=True, specifyBody='json', jsonBody=body)
    if never_error:
        params['options'].setdefault('response', {'response': {}})['response']['neverError'] = True
    extra = {'credentials': CRED[cred]} if cred else {}
    if on_error:
        extra['onError'] = on_error
    return add(name, 'n8n-nodes-base.httpRequest', 4.2, x, y, params, **extra)


def branch(name, x, y, expression):
    """IF node: true when the expression is true."""
    return add(name, 'n8n-nodes-base.if', 2.2, x, y, {
        'conditions': {
            'options': {'caseSensitive': True, 'leftValue': '', 'typeValidation': 'loose', 'version': 2},
            'conditions': [{'id': f'c{len(nodes)}', 'leftValue': '={{ ' + expression + ' }}', 'rightValue': '',
                            'operator': {'type': 'boolean', 'operation': 'true', 'singleValue': True}}],
            'combinator': 'and'},
        'options': {}})


def gmail(name, x, y, to, subject, html, attachments=None):
    options = {'appendAttribution': False, 'senderName': 'GhanaNice'}
    if attachments:
        options['attachmentsUi'] = {'attachmentsBinary': [{'property': attachments}]}
    return add(name, 'n8n-nodes-base.gmail', 2.1, x, y, {
        'sendTo': to, 'subject': subject, 'emailType': 'html', 'message': html, 'options': options}, credentials=CRED['gmail'])


R = "$('Prepare review').first().json"

# --- Intake -------------------------------------------------------------------------------
add('Tip from the site', 'n8n-nodes-base.webhook', 2, 0, 0, {
    'httpMethod': 'POST', 'path': 'ghananice-tip', 'responseMode': 'responseNode',
    'options': {'allowedOrigins': ORIGINS}}, webhookId='6f4c1f2e-9a51-4c7e-8a8e-0000000000a1')
code('Read tip', 'read-tip.js', 1, 0)
branch('Valid tip?', 2, 0, "$json.verdict === 'ok'")
add('Answer: not accepted', 'n8n-nodes-base.respondToWebhook', 1.1, 3, 1, {
    'respondWith': 'json',
    'responseBody': "={{ JSON.stringify($json.verdict === 'drop' ? { ok: true } : { ok: false, error: $json.reason }) }}",
    'options': {'responseCode': "={{ $json.verdict === 'drop' ? 200 : 400 }}"}})
http('Log received', 3, 0, 'POST', f"={SHEETS}/values/Tips!A1:append", 'sheets',
     body='={{ JSON.stringify({ values: [$json.row] }) }}',
     query=[('valueInputOption', 'RAW'), ('insertDataOption', 'INSERT_ROWS')])
add('Answer: received', 'n8n-nodes-base.respondToWebhook', 1.1, 4, 0, {'respondWith': 'json', 'responseBody': '={ "ok": true }', 'options': {}})

# --- Look it up ---------------------------------------------------------------------------
code('Plan lookup', 'plan-lookup.js', 5, 0)
branch('Picked on the site?', 6, 0, "$json.mode === 'details'")
http('Place details', 7, -1, 'GET', "=https://places.googleapis.com/v1/places/{{ $json.placeId }}", 'places',
     headers=[('X-Goog-FieldMask', FIELDS)], query=[('languageCode', 'en'), ('regionCode', 'GH')], never_error=True)
branch('Maps link?', 7, 1, "$json.mode === 'link'")
http('Open Maps link', 8, 2, 'GET', "={{ $('Read tip').first().json.tip.mapsLink }}", None, never_error=True,
     options={'redirect': {'redirect': {'followRedirects': False}}, 'response': {'response': {'fullResponse': True, 'responseFormat': 'text'}}})
code('Read Maps link', 'read-maps-link.js', 9, 2)
http('Place search', 10, 1, 'POST', 'https://places.googleapis.com/v1/places:searchText', 'places',
     headers=[('X-Goog-FieldMask', ','.join('places.' + f for f in FIELDS.split(',')))],
     body="={{ JSON.stringify(Object.assign({ textQuery: $json.textQuery, regionCode: 'GH', languageCode: 'en', pageSize: 5 }, $json.bias ? { locationBias: $json.bias } : {})) }}",
     never_error=True)
code('Pick match', 'pick-match.js', 11, 0)
http('Claude check', 12, 0, 'POST', 'https://api.anthropic.com/v1/messages', 'anthropic',
     headers=[('anthropic-version', '2023-06-01'), ('anthropic-beta', 'server-side-fallback-2026-07-01')],
     body='={{ JSON.stringify($json.claudeRequest) }}', never_error=True, options={'timeout': 120000})
code('Prepare review', 'prepare-review.js', 13, 0)
http('Log for review', 14, -1, 'PUT', f"={SHEETS}/values/Tips!A{{{{ $json.rowNumber }}}}:V{{{{ $json.rowNumber }}}}", 'sheets',
     body='={{ JSON.stringify({ values: [$json.row] }) }}', query=[('valueInputOption', 'RAW')], on_error='continueRegularOutput')

# --- Emails and the wait ------------------------------------------------------------------
branch('Has photos?', 14, 0, '$json.hasPhotos')
gmail('Email August the photos', 15, 0, f"={{{{ {R}.settings.reviewTo }}}}", f"={{{{ {R}.subjectDetails }}}}",
      f"={{{{ {R}.detailsHtml }}}}", attachments='={{ $json.photoList }}')
branch('Has an email?', 16, 1, f"!!{R}.email")
gmail('Thank the sender', 17, 1, f"={{{{ {R}.email }}}}", f"={{{{ {R}.subjectThanks }}}}", f"={{{{ {R}.thanksHtml }}}}")
add('Ask August to approve', 'n8n-nodes-base.gmail', 2.1, 18, 0, {
    'operation': 'sendAndWait',
    'sendTo': f"={{{{ {R}.settings.reviewTo }}}}",
    'subject': f"={{{{ {R}.subjectApproval }}}}",
    'message': f"={{{{ {R}.approvalText }}}}",
    'approvalOptions': {'values': {'approvalType': 'double', 'approveLabel': 'Approve', 'disapproveLabel': 'Reject'}},
    'options': {'limitWaitTime': {'values': {'limitType': 'afterTimeInterval', 'resumeAmount': 30, 'resumeUnit': 'days'}}}},
    credentials=CRED['gmail'], webhookId='6f4c1f2e-9a51-4c7e-8a8e-0000000000a2')
branch('Approved?', 19, 0, '$json.data?.approved === true')

# --- Publish: one commit with the photos and the updated listings file ----------------------
add('Carry photos', 'n8n-nodes-base.code', 2, 20, -1, {'jsCode': "// Put the photos from the original tip back on the item so the next step can read them.\nreturn [{ json: {}, binary: $('Read tip').first().binary || {} }];"})
code('Encode photos', 'encode-photos.js', 21, -1)
http('Git ref', 22, -1, 'GET', f"={REPO}/git/ref/heads/{BRANCH}", 'github')
http('Git commit', 23, -1, 'GET', f"={REPO}/git/commits/{{{{ $json.object.sha }}}}", 'github')
http('Current listings', 24, -1, 'GET', f"={REPO}/contents/dist/data/listings.json", 'github', query=[('ref', '=' + BRANCH)], never_error=True)
code('Make blobs', 'make-blobs.js', 25, -1)
http('Upload blobs', 26, -1, 'POST', f"{REPO}/git/blobs", 'github', body="={{ JSON.stringify({ content: $json.content, encoding: 'base64' }) }}")
code('Make tree', 'make-tree.js', 27, -1)
http('Create tree', 28, -1, 'POST', f"{REPO}/git/trees", 'github', body='={{ JSON.stringify({ base_tree: $json.baseTree, tree: $json.tree }) }}')
http('Create commit', 29, -1, 'POST', f"{REPO}/git/commits", 'github',
     body="={{ JSON.stringify({ message: $('Make tree').first().json.message, tree: $json.sha, parents: [$('Make tree').first().json.head] }) }}")
http('Move branch', 30, -1, 'PATCH', f"={REPO}/git/refs/heads/{BRANCH}", 'github', body='={{ JSON.stringify({ sha: $json.sha }) }}')
http('Log published', 31, -1, 'POST', f"={SHEETS}/values:batchUpdate", 'sheets', on_error='continueRegularOutput',
     body=f"={{{{ JSON.stringify({{ valueInputOption: 'RAW', data: [{{ range: 'Tips!C' + {R}.rowNumber, values: [['published']] }}, {{ range: 'Tips!V' + {R}.rowNumber, values: [[new Date().toISOString()]] }}] }}) }}}}")
branch('Sender left an email?', 32, -1, f"!!{R}.email")
gmail('Tell the sender it’s live', 33, -1, f"={{{{ {R}.email }}}}", f"={{{{ {R}.subjectLive }}}}", f"={{{{ {R}.liveHtml }}}}")
http('Log rejected', 20, 1, 'POST', f"={SHEETS}/values:batchUpdate", 'sheets', on_error='continueRegularOutput',
     body=f"={{{{ JSON.stringify({{ valueInputOption: 'RAW', data: [{{ range: 'Tips!C' + {R}.rowNumber, values: [[$json.data?.approved === false ? 'rejected' : 'expired: no answer in 30 days']] }}, {{ range: 'Tips!V' + {R}.rowNumber, values: [[new Date().toISOString()]] }}] }}) }}}}")

for a, b, *out in [
    ('Tip from the site', 'Read tip'), ('Read tip', 'Valid tip?'), ('Valid tip?', 'Log received'), ('Valid tip?', 'Answer: not accepted', 1),
    ('Log received', 'Answer: received'), ('Answer: received', 'Plan lookup'), ('Plan lookup', 'Picked on the site?'),
    ('Picked on the site?', 'Place details'), ('Picked on the site?', 'Maps link?', 1),
    ('Maps link?', 'Open Maps link'), ('Maps link?', 'Place search', 1), ('Open Maps link', 'Read Maps link'), ('Read Maps link', 'Place search'),
    ('Place details', 'Pick match'), ('Place search', 'Pick match'), ('Pick match', 'Claude check'), ('Claude check', 'Prepare review'),
    ('Prepare review', 'Log for review'), ('Prepare review', 'Has photos?'),
    ('Has photos?', 'Email August the photos'), ('Has photos?', 'Has an email?', 1), ('Email August the photos', 'Has an email?'),
    ('Has an email?', 'Thank the sender'), ('Has an email?', 'Ask August to approve', 1), ('Thank the sender', 'Ask August to approve'),
    ('Ask August to approve', 'Approved?'), ('Approved?', 'Carry photos'), ('Approved?', 'Log rejected', 1),
    ('Carry photos', 'Encode photos'), ('Encode photos', 'Git ref'), ('Git ref', 'Git commit'), ('Git commit', 'Current listings'),
    ('Current listings', 'Make blobs'), ('Make blobs', 'Upload blobs'), ('Upload blobs', 'Make tree'), ('Make tree', 'Create tree'),
    ('Create tree', 'Create commit'), ('Create commit', 'Move branch'), ('Move branch', 'Log published'),
    ('Log published', 'Sender left an email?'), ('Sender left an email?', 'Tell the sender it’s live'),
]:
    link(a, b, *out)

workflow = {'name': NAME, 'nodes': nodes, 'connections': connections,
            'settings': {'executionOrder': 'v1', 'saveDataErrorExecution': 'all', 'saveDataSuccessExecution': 'all'}}
json.dump(workflow, open(os.path.join(HERE, 'ghananice-tips.json'), 'w'), indent=1, ensure_ascii=False)

existing = find_workflow(NAME)
if existing:
    api('POST', f"/workflows/{existing['id']}/deactivate")
    result = api('PUT', f"/workflows/{existing['id']}", workflow)
else:
    result = api('POST', '/workflows', workflow)
active = api('POST', f"/workflows/{result['id']}/activate").get('active')
print(f"{NAME}: {result['id']} active={active}  ({len(nodes)} nodes)")
