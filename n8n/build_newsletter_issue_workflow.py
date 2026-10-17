"""Build, upload and activate the GhanaNice monthly newsletter issue workflow.

Flow: on the 24th of each month → read the site's own data (festivals, places, tips, services,
past issues) → Claude writes the short copy around the facts → assemble next month's issue →
create a draft campaign in MailerLite (subject, sender, group; the free plan can't take the body
through the API) → email August the issue laid out to paste into the draft → wait until August
says it has been sent → commit the issue page, archive, issue list and sitemap to main.
See docs/newsletter-pipeline.md.

Run:  python3 n8n/build_newsletter_issue_workflow.py
      python3 n8n/build_newsletter_issue_workflow.py --test   (adds a "Run now" webhook that
      takes the site data in its body; prints its URL. Rebuild without --test afterwards.)
"""
import json
import os
import re
import secrets
import sys

from n8n_api import api, find_workflow

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, '..')
NAME = 'GhanaNice — Newsletter issue'
TEST = '--test' in sys.argv
SITE = 'https://www.ghananice.com'
REPO = 'https://api.github.com/repos/AugustOsei/GhanaNice'
BRANCH = 'main'

CRED = {
    'gmail': {'gmailOAuth2': {'id': 'XSli9zjeTSRhQNLt', 'name': 'Gmail account'}},
    'github': {'githubApi': {'id': 'bZLd6GbkA1nT5I0K', 'name': 'GhanaNice — GitHub'}},
    'anthropic': {'anthropicApi': {'id': 'Ba67ZCNmLxMpnerv', 'name': 'Anthropic account'}},
}
mailerlite = next(c for c in api('GET', '/credentials?limit=250')['data'] if c['name'] == 'GhanaNice — MailerLite')
CRED['mailerlite'] = {'httpHeaderAuth': {'id': mailerlite['id'], 'name': mailerlite['name']}}

# The renderer shared with tools/build_newsletter.mjs, pasted above each Code node that needs it.
with open(os.path.join(ROOT, 'tools', 'newsletter-render.js')) as handle:
    RENDER = re.sub(r"\nif \(typeof module !== 'undefined'\).*\n?$", '\n', handle.read())

nodes, connections = [], {}


def add(name, type_, version, x, y, parameters, **extra):
    node = {'id': f'gni-{len(nodes) + 1}', 'name': name, 'type': type_, 'typeVersion': version,
            'position': [x * 240, y * 180], 'parameters': parameters}
    node.update(extra)
    nodes.append(node)
    return name


def link(source, target, output=0):
    outputs = connections.setdefault(source, {'main': []})['main']
    while len(outputs) <= output:
        outputs.append([])
    outputs[output].append({'node': target, 'type': 'main', 'index': 0})


def code(name, x, y, filename=None, js=None, render=False):
    if filename:
        with open(os.path.join(HERE, 'code', filename)) as handle:
            js = handle.read()
    return add(name, 'n8n-nodes-base.code', 2, x, y, {'jsCode': (RENDER + '\n' if render else '') + js})


def http(name, x, y, method, url, cred=None, body=None, headers=(), query=(), never_error=False, full=False, timeout=None):
    params = {'method': method, 'url': url, 'options': {}}
    if cred:
        kind = next(iter(CRED[cred]))
        if kind == 'httpHeaderAuth':
            params.update(authentication='genericCredentialType', genericAuthType='httpHeaderAuth')
        else:
            params.update(authentication='predefinedCredentialType', nodeCredentialType=kind)
    if headers:
        params.update(sendHeaders=True, headerParameters={'parameters': [{'name': k, 'value': v} for k, v in headers]})
    if query:
        params.update(sendQuery=True, queryParameters={'parameters': [{'name': k, 'value': v} for k, v in query]})
    if body is not None:
        params.update(sendBody=True, specifyBody='json', jsonBody=body)
    if never_error or full:
        params['options']['response'] = {'response': {'neverError': True, **({'fullResponse': True} if full else {})}}
    if timeout:
        params['options']['timeout'] = timeout
    return add(name, 'n8n-nodes-base.httpRequest', 4.2, x, y, params, **({'credentials': CRED[cred]} if cred else {}))


def gmail(name, x, y, to, subject, html):
    return add(name, 'n8n-nodes-base.gmail', 2.1, x, y, {
        'sendTo': to, 'subject': subject, 'emailType': 'html', 'message': html,
        'options': {'appendAttribution': False, 'senderName': 'GhanaNice'}},
        credentials=CRED['gmail'], onError='continueRegularOutput')


def branch(name, x, y, expression):
    return add(name, 'n8n-nodes-base.if', 2.2, x, y, {
        'conditions': {'options': {'caseSensitive': True, 'leftValue': '', 'typeValidation': 'loose', 'version': 2},
                       'conditions': [{'id': f'c{len(nodes)}', 'leftValue': '={{ ' + expression + ' }}', 'rightValue': '',
                                       'operator': {'type': 'boolean', 'operation': 'true', 'singleValue': True}}],
                       'combinator': 'and'}, 'options': {}})


A = "$('Assemble issue').first().json"
P = "$('Prepare emails').first().json"
FRESH = '{{ $now.toMillis() }}'

# --- Gather and draft ---------------------------------------------------------------------
add('Every 24th', 'n8n-nodes-base.scheduleTrigger', 1.2, 0, 0, {
    'rule': {'interval': [{'field': 'cronExpression', 'expression': '0 9 24 * *'}]}})
http('Site data', 1, 0, 'GET', f'={SITE}/data/newsletter-source.json?t={FRESH}')
http('Tips', 2, 0, 'GET', f'={SITE}/data/listings.json?t={FRESH}', never_error=True)
http('Services', 3, 0, 'GET', f'={SITE}/data/service-submissions.json?t={FRESH}', never_error=True)
http('Past issues', 4, 0, 'GET', f'={SITE}/data/newsletter-issues.json?t={FRESH}', never_error=True)
code('Gather issue', 5, 0, 'gather-issue.js', render=True)
http('Claude drafts', 6, 0, 'POST', 'https://api.anthropic.com/v1/messages', 'anthropic',
     headers=[('anthropic-version', '2023-06-01'), ('anthropic-beta', 'server-side-fallback-2026-07-01')],
     body='={{ JSON.stringify($json.claudeRequest) }}', never_error=True, timeout=180000)
code('Assemble issue', 7, 0, 'assemble-issue.js', render=True)
http('Create MailerLite draft', 8, 0, 'POST', 'https://connect.mailerlite.com/api/campaigns', 'mailerlite',
     headers=[('Accept', 'application/json')], body='={{ JSON.stringify($json.campaign) }}', full=True, timeout=30000)
code('Prepare emails', 9, 0, js=r"""
const a = $('Assemble issue').first().json;
const res = $input.first().json;
const ok = res.statusCode >= 200 && res.statusCode < 300 && res.body?.data?.id;
const esc = v => String(v ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const problems = [
  a.aiProblem ? `${a.aiProblem} The issue below uses the site’s own wording instead; read it through.` : '',
  ok ? '' : `MailerLite didn’t create the draft (${res.statusCode || 'no answer'}: ${esc(JSON.stringify(res.body || res.error || '').slice(0, 300))}). Create it by hand: Campaigns → Create campaign → Regular, subject below, sender hello@ghananice.com, group “GhanaNice newsletter”.`
].filter(Boolean);
const box = 'font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.5;background:#f1eee5;border:1px solid #11110f;padding:16px 18px;margin:0 0 28px;max-width:620px';
const html = `<div style="${box}">
<p style="margin:0 0 10px"><b>The ${esc(a.name)} issue is drafted.</b></p>
${problems.map(p => `<p style="margin:0 0 10px;color:#b3261e"><b>Check:</b> ${p}</p>`).join('\n')}
<ol style="margin:0 0 10px;padding-left:20px">
<li>In MailerLite, open <b>Campaigns → Drafts → “What’s on in Ghana – ${esc(a.name)}”</b>${ok ? '' : ' (once you’ve created it)'}. Subject, sender (hello@ghananice.com) and the GhanaNice newsletter group are already set.</li>
<li>Choose the design (the first time, pick a simple layout; after that, duplicate last month’s and swap the text), then paste the issue below. Check every link opens.</li>
<li>Preview text: <i>${esc(a.issue.preheader)}</i></li>
<li>Schedule it for the last days of the month, e.g. the 28th at 9:00.</li>
<li>After it has gone out, open the second email, “Publish the ${esc(a.name)} issue on the site?”, and click <b>Sent: publish it</b>.</li>
</ol>
<p style="margin:0">Subject: <b>${esc(a.issue.subject)}</b></p>
</div>
${a.email}`;
return [{ json: {
  campaignId: ok ? res.body.data.id : '',
  draftSubject: `Newsletter: the ${a.name} issue is ready to paste`,
  draftHtml: html,
  askSubject: `Publish the ${a.name} issue on the site?`,
  askText: `When the ${a.name} issue has gone out from MailerLite, click “Sent: publish it” and it goes on ghananice.com/newsletter/${a.issue.month}/ with the archive and sitemap. If you’re skipping this month, click “Don’t publish”. This request expires after 30 days.`
} }];
""")
gmail('Email August the issue', 10, 0, f'={{{{ {A}.reviewTo }}}}', f'={{{{ {P}.draftSubject }}}}', f'={{{{ {P}.draftHtml }}}}')
add('Ask August when it is sent', 'n8n-nodes-base.gmail', 2.1, 11, 0, {
    'operation': 'sendAndWait', 'sendTo': f'={{{{ {A}.reviewTo }}}}',
    'subject': f'={{{{ {P}.askSubject }}}}', 'message': f'={{{{ {P}.askText }}}}',
    'approvalOptions': {'values': {'approvalType': 'double', 'approveLabel': 'Sent: publish it', 'disapproveLabel': 'Don’t publish'}},
    'options': {'limitWaitTime': {'values': {'limitType': 'afterTimeInterval', 'resumeAmount': 30, 'resumeUnit': 'days'}}}},
    credentials=CRED['gmail'], webhookId='9c2d7e41-5b3a-4f86-b0d4-3000000000c1')
branch('Sent?', 12, 0, '$json.data?.approved === true')

# --- Publish on the site: one commit on main ------------------------------------------------
http('Git ref', 13, -1, 'GET', f'{REPO}/git/ref/heads/{BRANCH}', 'github')
http('Git commit', 14, -1, 'GET', f'={REPO}/git/commits/{{{{ $json.object.sha }}}}', 'github')
http('Page template', 15, -1, 'GET', f'{REPO}/contents/tools/page-template.html', 'github', query=[('ref', BRANCH)])
http('Issue list', 16, -1, 'GET', f'{REPO}/contents/dist/data/newsletter-issues.json', 'github', query=[('ref', BRANCH)], never_error=True)
http('Sitemap', 17, -1, 'GET', f'{REPO}/contents/dist/sitemap.xml', 'github', query=[('ref', BRANCH)])
code('Publish issue', 18, -1, 'publish-issue.js', render=True)
http('Upload blobs', 19, -1, 'POST', f'{REPO}/git/blobs', 'github',
     body='={{ JSON.stringify({ content: $json.content, encoding: "base64" }) }}')
code('Make tree', 20, -1, js=r"""
const files = $('Publish issue').all();
const tree = $input.all().map((blob, index) => {
  if (!blob.json.sha) throw new Error(`GitHub did not store ${files[index].json.path}`);
  return { path: files[index].json.path, mode: '100644', type: 'blob', sha: blob.json.sha };
});
const first = files[0].json;
return [{ json: { tree, baseTree: first.baseTree, head: first.head, message: first.message, url: first.url } }];
""")
http('Create tree', 21, -1, 'POST', f'{REPO}/git/trees', 'github',
     body='={{ JSON.stringify({ base_tree: $json.baseTree, tree: $json.tree }) }}')
http('Create commit', 22, -1, 'POST', f'{REPO}/git/commits', 'github',
     body="={{ JSON.stringify({ message: $('Make tree').first().json.message, tree: $json.sha, parents: [$('Make tree').first().json.head] }) }}")
http('Move branch', 23, -1, 'PATCH', f'{REPO}/git/refs/heads/{BRANCH}', 'github',
     body='={{ JSON.stringify({ sha: $json.sha }) }}')
gmail('Tell August it is published', 24, -1, f'={{{{ {A}.reviewTo }}}}',
      f"=Published: the {{{{ {A}.name }}}} issue",
      f"=<p>The {{{{ {A}.name }}}} issue is committed to main and will be at <a href=\"{{{{ $('Make tree').first().json.url }}}}\">{{{{ $('Make tree').first().json.url }}}}</a> once Vercel has deployed it (about a minute).</p>")

chain = ['Every 24th', 'Site data', 'Tips', 'Services', 'Past issues', 'Gather issue', 'Claude drafts', 'Assemble issue',
         'Create MailerLite draft', 'Prepare emails', 'Email August the issue', 'Ask August when it is sent', 'Sent?']
for source, target in zip(chain, chain[1:]):
    link(source, target)
publish = ['Sent?', 'Git ref', 'Git commit', 'Page template', 'Issue list', 'Sitemap', 'Publish issue', 'Upload blobs',
           'Make tree', 'Create tree', 'Create commit', 'Move branch', 'Tell August it is published']
for source, target in zip(publish, publish[1:]):
    link(source, target)

if TEST:
    path = f'ghananice-newsletter-test-{secrets.token_hex(8)}'
    add('Run now', 'n8n-nodes-base.webhook', 2, 4, 1, {'httpMethod': 'POST', 'path': path, 'responseMode': 'onReceived', 'options': {}},
        webhookId='9c2d7e41-5b3a-4f86-b0d4-3000000000c2')
    link('Run now', 'Gather issue')

workflow = {'name': NAME, 'nodes': nodes, 'connections': connections,
            'settings': {'executionOrder': 'v1', 'timezone': 'Africa/Accra',
                         'saveDataErrorExecution': 'all', 'saveDataSuccessExecution': 'all'}}
if not TEST:
    with open(os.path.join(HERE, 'ghananice-newsletter-issue.json'), 'w') as handle:
        json.dump(workflow, handle, indent=1, ensure_ascii=False)

existing = find_workflow(NAME)
if existing:
    api('POST', f"/workflows/{existing['id']}/deactivate")
    result = api('PUT', f"/workflows/{existing['id']}", workflow)
else:
    result = api('POST', '/workflows', workflow)
active = api('POST', f"/workflows/{result['id']}/activate").get('active')
print(f"{NAME}: {result['id']} active={active} ({len(nodes)} nodes)")
if TEST:
    print(f"TEST_URL=https://n8n.augustwheel.com/webhook/{path}")
