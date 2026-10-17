/* The monthly newsletter, "What's on in Ghana" (docs/newsletter-pipeline.md). Writes:
   - dist/newsletter/index.html, the archive, and dist/newsletter/<yyyy-mm>/index.html for each
     issue in tools/newsletter/*.json (rendered by tools/newsletter-render.js, which the n8n issue
     workflow also uses when it publishes an issue);
   - dist/data/newsletter-issues.json, the issue summaries the workflow reads;
   - dist/data/newsletter-source.json, what the workflow drafts each issue from: the festivals
     (tools/festivals/*.json) and the places on the region pages (dist/data.js).

   Re-run after editing an issue, the festivals, data.js or tools/page-template.html:
   node tools/build_newsletter.mjs   (tools/smoke.mjs runs it with --check) */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const checkOnly = process.argv.includes('--check');
const render = createRequire(import.meta.url)('./newsletter-render.js');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const json = (value) => JSON.stringify(value, null, 1) + '\n';

const template = read('tools/page-template.html');
const issueDir = path.join(root, 'tools/newsletter');
export const ISSUES = (fs.existsSync(issueDir) ? fs.readdirSync(issueDir) : []).filter((f) => /^\d{4}-\d\d\.json$/.test(f)).sort().reverse()
  .map((f) => JSON.parse(fs.readFileSync(path.join(issueDir, f), 'utf8')));
export const SUMMARIES = ISSUES.map(render.summary);

/* The workflow's source data: only public facts already on the site. */
const festivals = fs.readdirSync(path.join(root, 'tools/festivals')).filter((f) => f.endsWith('.json')).sort()
  .map((f) => JSON.parse(fs.readFileSync(path.join(root, 'tools/festivals', f), 'utf8')))
  .filter((f) => f.sections?.length)
  .map((f) => ({
    slug: f.slug, name: f.name, kind: f.kind, month: f.month ?? null, recurring: f.recurring || null,
    region: f.region, regionSlug: f.region.toLowerCase().replace(/ /g, '-'),
    when: f.card.when, place: f.card.place, keeper: f.card.keeper, sum: f.card.sum,
    dateSetBy: (f.facts.find(([label]) => label === 'Date set by') || [])[1] || '',
    added: f.added || f.checked, checked: f.checked
  }));
const sandbox = { window: {} };
vm.runInNewContext(read('dist/data.js'), sandbox, { filename: 'data.js' });
const places = sandbox.window.GHANA_REGIONS.flatMap((r) => (r.visit || []).map((p) => ({
  key: `${r.slug}/${p.name}`, name: p.name, note: p.note, region: r.name, regionSlug: r.slug
})));

const outputs = new Map();
outputs.set(path.join(dist, 'newsletter/index.html'), render.archivePage(SUMMARIES, template));
ISSUES.forEach((issue) => outputs.set(path.join(dist, `newsletter/${issue.month}/index.html`), render.issuePage(issue, template)));
outputs.set(path.join(dist, 'data/newsletter-issues.json'), json({ issues: SUMMARIES }));
outputs.set(path.join(dist, 'data/newsletter-source.json'), json({ festivals, places }));

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (checkOnly) {
    const stale = [...outputs].filter(([file, text]) => !fs.existsSync(file) || fs.readFileSync(file, 'utf8') !== text);
    if (stale.length) {
      console.error(`Out of date (run node tools/build_newsletter.mjs): ${stale.map(([file]) => path.relative(root, file)).join(', ')}`);
      process.exit(1);
    }
    console.log(`Newsletter pages up to date: ${ISSUES.length} issues.`);
  } else {
    outputs.forEach((text, file) => {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, text);
    });
    console.log(`Wrote the newsletter archive, ${ISSUES.length} issues and the workflow's source data.`);
  }
}
