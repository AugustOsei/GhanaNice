"""Build, upload and activate the GhanaNice newsletter sign-up workflow.

Flow: site form → validate (honeypot, email shape) → upsert the subscriber into the MailerLite
group "GhanaNice newsletter" → answer the browser with JSON. MailerLite's own double opt-in
("Double opt-in for API and integrations" in Account settings → Subscribe settings) sends the
confirmation email. See docs/newsletter-pipeline.md.

Run:  python3 n8n/build_newsletter_signup_workflow.py
"""
import json
import os

from n8n_api import ENV, api, find_workflow

HERE = os.path.dirname(os.path.abspath(__file__))
NAME = 'GhanaNice — Newsletter signup'
CRED_NAME = 'GhanaNice — MailerLite'
ORIGINS = 'https://www.ghananice.com,https://ghananice.com,http://localhost:4173,http://127.0.0.1:4173'


def ensure_mailerlite_credential():
    """A header-auth credential holding the MailerLite API key from .env.local."""
    existing = next((c for c in api('GET', '/credentials?limit=250')['data'] if c['name'] == CRED_NAME), None)
    if existing:
        return existing['id']
    created = api('POST', '/credentials', {
        'name': CRED_NAME, 'type': 'httpHeaderAuth',
        'data': {'name': 'Authorization', 'value': 'Bearer ' + ENV['MAILERLITE_API_KEY'].strip().strip('"')}})
    return created['id']


CRED = {'httpHeaderAuth': {'id': ensure_mailerlite_credential(), 'name': CRED_NAME}}
nodes, connections = [], {}


def add(name, type_, version, x, y, parameters, **extra):
    node = {'id': f'gnn-{len(nodes) + 1}', 'name': name, 'type': type_, 'typeVersion': version,
            'position': [x * 240, y * 180], 'parameters': parameters}
    node.update(extra)
    nodes.append(node)
    return name


def link(source, target, output=0):
    outputs = connections.setdefault(source, {'main': []})['main']
    while len(outputs) <= output:
        outputs.append([])
    outputs[output].append({'node': target, 'type': 'main', 'index': 0})


def respond(name, x, y, body, status=200):
    return add(name, 'n8n-nodes-base.respondToWebhook', 1.1, x, y, {
        'respondWith': 'json', 'responseBody': body, 'options': {'responseCode': status}})


with open(os.path.join(HERE, 'code', 'read-signup.js')) as handle:
    read_signup = handle.read()

add('Sign-up from the site', 'n8n-nodes-base.webhook', 2, 0, 0, {
    'httpMethod': 'POST', 'path': 'ghananice-newsletter', 'responseMode': 'responseNode',
    'options': {'allowedOrigins': ORIGINS}}, webhookId='3b8e64c1-6f0a-4c58-9d21-2000000000b1')
add('Read sign-up', 'n8n-nodes-base.code', 2, 1, 0, {'jsCode': read_signup})
add('Which answer?', 'n8n-nodes-base.switch', 3.2, 2, 0, {
    'rules': {'values': [
        {'conditions': {'options': {'caseSensitive': True, 'typeValidation': 'strict', 'version': 2},
                        'conditions': [{'id': f'v{verdict}', 'leftValue': '={{ $json.verdict }}', 'rightValue': verdict,
                                        'operator': {'type': 'string', 'operation': 'equals'}}],
                        'combinator': 'and'}, 'renameOutput': True, 'outputKey': verdict}
        for verdict in ('ok', 'drop', 'reject')]},
    'options': {}})
HEADERS = {'parameters': [{'name': 'Accept', 'value': 'application/json'}]}
RESPONSE = {'response': {'response': {'fullResponse': True, 'neverError': True}}, 'timeout': 15000}
add('Look up subscriber', 'n8n-nodes-base.httpRequest', 4.2, 3, -1, {
    'method': 'GET', 'url': '=https://connect.mailerlite.com/api/subscribers/{{ encodeURIComponent($json.subscriber.email) }}',
    'authentication': 'genericCredentialType', 'genericAuthType': 'httpHeaderAuth',
    'sendHeaders': True, 'headerParameters': HEADERS, 'options': RESPONSE},
    credentials=CRED, onError='continueErrorOutput')
# New, unconfirmed and unsubscribed addresses are sent as "unconfirmed", which makes MailerLite
# email a confirmation link. Someone already confirmed is only added to the group, so signing up
# twice never sends them back to unconfirmed. Bounced or junk addresses keep their status.
add('Choose status', 'n8n-nodes-base.code', 2, 4, -1, {'jsCode': (
    "const signup = $('Read sign-up').first().json.subscriber;\n"
    "const found = $json.statusCode === 200 ? ($json.body?.data?.status || '') : '';\n"
    "const keep = ['active', 'bounced', 'junk'].includes(found);\n"
    "return [{ json: { subscriber: keep ? signup : { ...signup, status: 'unconfirmed' } } }];")})
add('Add to MailerLite', 'n8n-nodes-base.httpRequest', 4.2, 5, -1, {
    'method': 'POST', 'url': 'https://connect.mailerlite.com/api/subscribers',
    'authentication': 'genericCredentialType', 'genericAuthType': 'httpHeaderAuth',
    'sendHeaders': True, 'headerParameters': HEADERS,
    'sendBody': True, 'specifyBody': 'json', 'jsonBody': '={{ JSON.stringify($json.subscriber) }}', 'options': RESPONSE},
    credentials=CRED, onError='continueErrorOutput')
add('Read MailerLite answer', 'n8n-nodes-base.code', 2, 6, -1, {'jsCode': (
    "const code = Number($json.statusCode || 0);\n"
    "if (code === 200 || code === 201) return [{ json: { status: 200, body: { ok: true } } }];\n"
    "if (code === 422) return [{ json: { status: 400, body: { ok: false, error: 'email' } } }];\n"
    "return [{ json: { status: 502, body: { ok: false, error: 'server' } } }];")})
respond('Answer', 7, -1, '={{ JSON.stringify($json.body) }}', '={{ $json.status }}')
respond('Answer: unreachable', 4, -2, '={ "ok": false, "error": "server" }', 502)
respond('Answer: ignored', 3, 0, '={ "ok": true }')
respond('Answer: bad email', 3, 1, '={ "ok": false, "error": "email" }', 400)

for source, target, *output in [
    ('Sign-up from the site', 'Read sign-up'), ('Read sign-up', 'Which answer?'),
    ('Which answer?', 'Look up subscriber'), ('Which answer?', 'Answer: ignored', 1),
    ('Look up subscriber', 'Choose status'), ('Look up subscriber', 'Answer: unreachable', 1),
    ('Which answer?', 'Answer: bad email', 2),
    ('Choose status', 'Add to MailerLite'), ('Add to MailerLite', 'Read MailerLite answer'), ('Add to MailerLite', 'Answer: unreachable', 1),
    ('Read MailerLite answer', 'Answer'),
]:
    link(source, target, *output)

workflow = {'name': NAME, 'nodes': nodes, 'connections': connections,
            'settings': {'executionOrder': 'v1', 'saveDataErrorExecution': 'all', 'saveDataSuccessExecution': 'none'}}
with open(os.path.join(HERE, 'ghananice-newsletter-signup.json'), 'w') as handle:
    json.dump(workflow, handle, indent=1, ensure_ascii=False)

existing = find_workflow(NAME)
if existing:
    api('POST', f"/workflows/{existing['id']}/deactivate")
    result = api('PUT', f"/workflows/{existing['id']}", workflow)
else:
    result = api('POST', '/workflows', workflow)
active = api('POST', f"/workflows/{result['id']}/activate").get('active')
print(f"{NAME}: {result['id']} active={active} ({len(nodes)} nodes)")
