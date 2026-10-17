// After August has sent the issue: the files for one commit that puts it on the site.
// The same renderer as tools/build_newsletter.mjs, fed the same inputs (the plain-page template,
// the issue list and the sitemap as they are on main now), so smoke's --check stays green.
// GhanaNiceNewsletter (tools/newsletter-render.js) is pasted in above this by the builder.
const R = GhanaNiceNewsletter;
const head = $('Git ref').first().json.object?.sha;
const baseTree = $('Git commit').first().json.tree?.sha;
if (!head || !baseTree) throw new Error('Could not read main from GitHub (check the GhanaNice — GitHub credential).');
const text = name => {
  const file = $(name).first().json;
  if (!file.content) throw new Error(`${name}: GitHub returned no file (${file.message || 'unknown error'}).`);
  return Buffer.from(file.content, 'base64').toString('utf8');
};
const template = text('Page template');
const sitemap = text('Sitemap');
let listed = [];
try { listed = JSON.parse(text('Issue list')).issues || []; } catch { listed = []; }

const sentOn = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Africa/Accra' }).format(new Date());
const issue = { ...$('Assemble issue').first().json.issue, sentOn };
const summaries = [R.summary(issue), ...listed.filter(s => s.month !== issue.month)].sort((a, b) => (a.month < b.month ? 1 : -1));
const json = value => JSON.stringify(value, null, 1) + '\n';

const loc = `  <url><loc>${R.SITE}${R.issuePath(issue.month)}</loc></url>\n`;
const newSitemap = sitemap.includes(loc) ? sitemap : sitemap.replace('</urlset>', `${loc}</urlset>`);

const files = [
  [`tools/newsletter/${issue.month}.json`, json(issue)],
  [`dist/newsletter/${issue.month}/index.html`, R.issuePage(issue, template)],
  ['dist/newsletter/index.html', R.archivePage(summaries, template)],
  ['dist/data/newsletter-issues.json', json({ issues: summaries })],
  ['dist/sitemap.xml', newSitemap]
];
return files.map(([path, content]) => ({ json: {
  path, content: Buffer.from(content, 'utf8').toString('base64'), head, baseTree,
  message: `Newsletter: publish the ${R.monthName(issue.month)} issue\n\nSent from MailerLite and published by the n8n issue workflow.`,
  url: `${R.SITE}${R.issuePath(issue.month)}`
} }));
