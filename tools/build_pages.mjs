/* Writes the plain pages, dist/<name>/index.html, from
   tools/page-template.html and the content in tools/pages/*.html. Each content file starts with a
   comment holding its path, title and description as JSON.

   Re-run after editing the template or a page:  node tools/build_pages.mjs
   tools/smoke.mjs runs it with --check, so a stale page fails the Vercel build. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const SITE = 'https://www.ghananice.com';
const checkOnly = process.argv.includes('--check');
const esc = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const template = fs.readFileSync(path.join(root, 'tools/page-template.html'), 'utf8').replace(/<!-- Template for[\s\S]*?-->\n/, '');
const sources = fs.readdirSync(path.join(root, 'tools/pages')).filter(file => file.endsWith('.html')).sort();

export const PAGES = sources.map(file => {
  const source = fs.readFileSync(path.join(root, 'tools/pages', file), 'utf8');
  const head = source.match(/^<!--\s*(\{[\s\S]*?\})\s*-->\n/);
  if (!head) throw new Error(`tools/pages/${file} must start with a <!-- {json} --> header`);
  const meta = JSON.parse(head[1]);
  let html = template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    if (key === 'content') return source.slice(head[0].length).replace(/\n$/, '');
    if (key === 'url') return esc(SITE + meta.path);
    if (key in meta) return esc(meta[key]);
    throw new Error(`page-template.html: no value for ${match}`);
  });
  if (meta.stylesheet) html = html.replace('  <!-- Google Analytics', `  <link rel="stylesheet" href="${esc(meta.stylesheet)}">\n  <!-- Google Analytics`);
  if (meta.script) html = html.replace('</body>', `  <script src="${esc(meta.script)}" defer></script>\n</body>`);
  /* "scripts": several, loaded in order (all deferred, which keeps their order). */
  if (meta.scripts) html = html.replace('</body>', meta.scripts.map(src => `  <script src="${esc(src)}" defer></script>\n`).join('') + '</body>');
  return { file: path.join(dist, meta.path, 'index.html'), html, path: meta.path };
});

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (checkOnly) {
    const stale = PAGES.filter(({ file, html }) => !fs.existsSync(file) || fs.readFileSync(file, 'utf8') !== html);
    if (stale.length) {
      console.error(`Out of date (run node tools/build_pages.mjs): ${stale.map(({ file }) => path.relative(root, file)).join(', ')}`);
      process.exit(1);
    }
    console.log(`Plain pages up to date: ${PAGES.length}.`);
  } else {
    PAGES.forEach(({ file, html }) => {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, html);
    });
    console.log(`Wrote ${PAGES.map(p => p.path).join(', ')}.`);
  }
}
