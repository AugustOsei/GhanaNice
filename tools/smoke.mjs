import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const failures = [];

function check(condition, message) {
  if (!condition) failures.push(message);
}

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function checkLocalReferences(relativePath, html) {
  const references = [...html.matchAll(/(?:src|href)=["']([^"']*)["']/g)].map((match) => match[1]);

  references.forEach((reference) => {
    if (!reference || reference.includes('{{') || /^(?:#|https?:|mailto:|tel:|data:)/.test(reference)) return;
    const localPath = reference.split(/[?#]/)[0];
    if (!localPath || localPath.startsWith('/')) return;
    check(
      fs.existsSync(path.resolve(path.dirname(path.join(root, relativePath)), localPath)),
      `${relativePath} references missing file: ${localPath}`,
    );
  });
}

const scriptFiles = fs.readdirSync(dist).filter((file) => file.endsWith('.js'));
scriptFiles.forEach((file) => {
  const source = read(`dist/${file}`);
  try {
    new vm.Script(source, { filename: file });
  } catch (error) {
    failures.push(`${file} does not parse: ${error.message}`);
  }
});

const appSource = read('dist/app.js');
/* The loops are listed in app.js; their posters in index.html, where the reel picks one. */
const heroPosters = JSON.parse(read('dist/index.html').match(/data-posters='([^']+)'/)?.[1] || '{}');
const heroAssets = [...appSource.matchAll(/^\s+(?:webm|mp4): '([^']+)'/gm)].map((match) => match[1]).concat(Object.values(heroPosters));
check(heroAssets.length === 9, `Expected 9 hero destination assets, found ${heroAssets.length}`);
heroAssets.forEach((asset) => {
  check(fs.existsSync(path.join(dist, asset)), `Hero destination references missing asset: ${asset}`);
});

const travelDataSource = read('dist/travel-directory-data.js');
const travelSandbox = { window: {} };
vm.runInNewContext(travelDataSource, travelSandbox, { filename: 'travel-directory-data.js' });
const travelServices = travelSandbox.window.GHANA_TRAVEL_SERVICES;
check(Array.isArray(travelServices), 'travel-directory-data.js must expose window.GHANA_TRAVEL_SERVICES');
check(travelServices?.length >= 9, `Expected at least 9 travel services, found ${travelServices?.length ?? 0}`);
travelServices?.forEach((service, index) => {
  const label = service?.name || `travel service ${index + 1}`;
  check(Boolean(service?.id), `${label} has no id`);
  check(Boolean(service?.category), `${label} has no category`);
  check(/^https:\/\//.test(service?.website || ''), `${label} does not have an HTTPS website or social page link`);
  check(Array.isArray(service?.regions) && service.regions.length > 0, `${label} has no service regions`);
  if (service?.featured) {
    check(Array.isArray(service?.media) && service.media.length > 0, `${label} is featured but has no media`);
    service.media?.forEach((item) => {
      const asset = String(item?.src || '').split('?')[0];
      check(Boolean(item?.alt), `${label} has featured media without alt text`);
      check(Boolean(item?.credit) && /^https:\/\//.test(item?.source || ''), `${label} has uncredited featured media`);
      check(fs.existsSync(path.join(dist, asset)), `${label} references missing featured media: ${asset}`);
    });
  }
});

const submittedServices = JSON.parse(read('dist/data/service-submissions.json'));
check(Array.isArray(submittedServices.services), 'service-submissions.json must contain a services array');
submittedServices.services?.forEach((service, index) => {
  const label = service?.name || `submitted travel service ${index + 1}`;
  check(Boolean(service?.id), `${label} has no id`);
  check(['tours', 'transport', 'stay'].includes(service?.category), `${label} has an unsupported category`);
  check(/^https:\/\//.test(service?.website || ''), `${label} does not have an HTTPS website or social page link`);
  check(service?.featured === false, `${label} must enter the directory as a standard listing`);
});

const dataSource = read('dist/data.js');
const sandbox = { window: {} };
vm.runInNewContext(dataSource, sandbox, { filename: 'data.js' });

const regions = sandbox.window.GHANA_REGIONS;
check(Array.isArray(regions), 'data.js must expose window.GHANA_REGIONS');
check(regions?.length === 16, `Expected 16 regions, found ${regions?.length ?? 0}`);

const slugs = new Set();
regions?.forEach((region, index) => {
  const label = region?.name || `region ${index + 1}`;
  check(Boolean(region?.slug), `${label} has no slug`);
  check(Boolean(region?.name), `Region ${index + 1} has no name`);
  check(Boolean(region?.image), `${label} has no lead image`);
  check(!slugs.has(region?.slug), `Duplicate region slug: ${region?.slug}`);
  slugs.add(region?.slug);

  const images = [
    region?.image,
    region?.side,
    ...(region?.visit || []).map((place) => place.image),
    ...(region?.businesses || []).map((business) => business.image),
  ].filter(Boolean);
  images.forEach((image) => {
    check(fs.existsSync(path.join(dist, image)), `${label} references missing image: ${image}`);

    if (!image.startsWith('assets/real/')) return;
    const extension = path.extname(image);
    const base = image.slice(0, -extension.length);
    [400, 800, 1200].forEach((width) => {
      check(
        fs.existsSync(path.join(dist, `${base}-${width}.webp`)),
        `${label} is missing ${width}px image: ${base}-${width}.webp`,
      );
    });
  });
});

/* Analytics loads through analytics.js, which honours the privacy page's opt-out: no page
   carries the tag itself. */
const analyticsPages = ['dist/index.html', 'dist/travel-directory.html', 'dist/credits.html', 'dist/404.html', 'tools/region-template.html', 'tools/page-template.html', 'tools/festivals-template.html', 'tools/festival-template.html'];
analyticsPages.forEach((file) => {
  const html = read(file);
  check(html.includes('/analytics.js?v=1'), `${file} does not load analytics.js`);
  check(!html.includes('googletagmanager.com/gtag'), `${file} loads Google Analytics directly, bypassing the opt-out`);
});

/* The newsletter sign-up (newsletter.js) sits in every footer, and config.js gives it its endpoint.
   Festival pages and the home page also carry their own sign-up band. */
const footerPages = [];
(function walk(dir) {
  fs.readdirSync(dir, { withFileTypes: true }).forEach((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    if (entry.name.endsWith('.html') && fs.readFileSync(full, 'utf8').includes('class="site-footer"')) footerPages.push(path.relative(root, full));
  });
})(dist);
check(footerPages.length >= 60, `Expected the footer on at least 60 pages, found ${footerPages.length}`);
footerPages.forEach((file) => {
  const html = read(file);
  check(html.includes('data-newsletter="footer"'), `${file} has no newsletter form in its footer`);
  check(/src="\/?newsletter\.js\?v=2"/.test(html), `${file} does not load newsletter.js?v=2`);
  check(/src="\/?config\.js\?v=6"/.test(html), `${file} does not load config.js?v=6 (the newsletter endpoint)`);
  if (file.startsWith('dist/festivals/')) check(html.includes('data-newsletter="festival"'), `${file} has no festival newsletter band`);
});
check(read('dist/index.html').includes('data-newsletter="home"'), 'dist/index.html has no newsletter band under the festivals');
check(/newsletterEndpoint:/.test(read('dist/config.js')), 'config.js has no newsletterEndpoint');
check(sitemapXmlEarly().includes('<loc>https://www.ghananice.com/newsletter/</loc>'), 'sitemap.xml does not list /newsletter/');
check(/<loc>https:\/\/www\.ghananice\.com\/newsletter\/[^<]*<\/loc><\/url>\n<\/urlset>/.test(sitemapXmlEarly()), 'sitemap.xml must end with the newsletter entries (the issue workflow appends there)');
function sitemapXmlEarly() { return read('dist/sitemap.xml'); }

const htmlExpectations = {
  'dist/index.html': [
    'styles.css?v=56',
    'data.js?v=9',
    'app.js?v=33',
    'tip-form.js?v=5',
    'footer.js?v=3',
    'id="hero-video"',
    'id="region-reader" role="dialog"',
  ],
  'tools/region-template.html': [
    '/styles.css?v=56',
    '/data.js?v=9',
    '/region.js?v=12',
    '/tip-form.js?v=5',
    '/footer.js?v=3',
  ],
  'dist/credits.html': ['styles.css?v=56'],
  'dist/404.html': ['styles.css?v=56'],
  'dist/travel-directory.html': [
    'styles.css?v=56',
    'travel-directory.css?v=16',
    'config.js?v=6',
    'travel-directory-data.js?v=4',
    'travel-directory.js?v=18',
    'footer.js?v=3',
    'id="featured-count"',
    'id="featured-page"',
    'id="featured-prev"',
    'id="featured-next"',
    'id="prime-grid"',
    'id="service-list"',
    'id="service-form"',
    'name="primaryRegion"',
    'name="listingType" value="featured"',
    'Phone or WhatsApp',
  ],
};

Object.entries(htmlExpectations).forEach(([file, expectations]) => {
  const html = read(file);
  expectations.forEach((value) => check(html.includes(value), `${file} is missing ${value}`));
  checkLocalReferences(file, html);

  const ids = [...html.matchAll(/\sid=["']([^"']+)["']/g)].map((match) => match[1]);
  const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
  check(duplicates.length === 0, `${file} has duplicate IDs: ${[...new Set(duplicates)].join(', ')}`);
});

/* The static region pages must match data.js, media.js and the template. */
const festivalData = fs.readdirSync(path.join(root, 'tools/festivals')).filter((f) => f.endsWith('.json'))
  .map((f) => JSON.parse(read(`tools/festivals/${f}`)));
regions?.forEach((region) => {
  const file = `dist/regions/${region.slug}/index.html`;
  if (!fs.existsSync(path.join(root, file))) return check(false, `${file} is missing`);
  const html = read(file);
  check(html.includes(`<link rel="canonical" href="https://www.ghananice.com/regions/${region.slug}/">`), `${file} has the wrong canonical link`);
  check(html.includes('application/ld+json'), `${file} has no structured data`);
  [...html.matchAll(/(?:src|href)="(\/[^"#?]*)/g)].forEach(([, reference]) => {
    const local = reference.endsWith('/') ? `${reference}index.html` : reference;
    check(fs.existsSync(path.join(dist, local)), `${file} references missing file: ${reference}`);
  });
  /* Each region page lists every festival filed under it, linked to its page. */
  const filed = festivalData.filter((f) => f.region === region.name && f.sections?.length);
  check(filed.length > 0, `${region.name} has no festivals`);
  filed.forEach((f) => check(html.includes(`<a href="/festivals/${f.slug}/">`), `${file} does not link its festival ${f.name}`));
  check(html.includes('href="/festivals/">All festivals and cultural events'), `${file} does not link to all festivals`);
});
/* The plain pages (About, Contact, Privacy) must match their sources too. */
['about', 'contact', 'privacy'].forEach((name) => {
  const file = `dist/${name}/index.html`;
  if (!fs.existsSync(path.join(root, file))) return check(false, `${file} is missing`);
  [...read(file).matchAll(/(?:src|href)="(\/[^"#?]*)/g)].forEach(([, reference]) => {
    const local = reference.endsWith('/') ? `${reference}index.html` : reference;
    check(fs.existsSync(path.join(dist, local)), `${file} references missing file: ${reference}`);
  });
});
/* The festivals list and festival pages (tools/build_festivals.mjs): live, indexable, linked from
   every nav, and with no broken local links or photos. */
const sitemapXml = read('dist/sitemap.xml');
const festivalPages = [['festivals/', 'dist/festivals/index.html'],
  ...festivalData.filter((f) => f.sections?.length).map((f) => [`festivals/${f.slug}/`, `dist/festivals/${f.slug}/index.html`])];
festivalPages.forEach(([urlPath, file]) => {
  if (!fs.existsSync(path.join(root, file))) return check(false, `${file} is missing`);
  const html = read(file);
  const url = `https://www.ghananice.com/${urlPath}`;
  check(html.includes(`<link rel="canonical" href="${url}">`), `${file} has the wrong canonical link`);
  check(html.includes('/analytics.js?v=1'), `${file} does not load analytics.js`);
  check(!html.includes('googletagmanager.com/gtag'), `${file} loads Google Analytics directly, bypassing the opt-out`);
  check(!html.includes('noindex') && !html.includes('/prototypes/'), `${file} still carries prototype settings`);
  check(sitemapXml.includes(`<loc>${url}</loc>`), `sitemap.xml does not list ${url}`);
  const ld = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  check(ld.length > 0, `${file} has no structured data`);
  ld.forEach(([, json]) => { try { JSON.parse(json); } catch (error) { failures.push(`${file} has invalid JSON-LD: ${error.message}`); } });
  [...html.matchAll(/(?:src|href)="([^"]*)"/g)].forEach(([, reference]) => {
    if (!reference || /^(?:#|https?:|mailto:|tel:|data:)/.test(reference)) return;
    const local = reference.split(/[?#]/)[0];
    if (!local) return;
    const resolved = local.startsWith('/') ? path.join(dist, local) : path.resolve(path.dirname(path.join(root, file)), local);
    check(fs.existsSync(local.endsWith('/') ? path.join(resolved, 'index.html') : resolved), `${file} references missing file: ${reference}`);
  });
});
['dist/index.html', 'dist/travel-directory.html', 'tools/region-template.html', 'tools/page-template.html'].forEach((file) => {
  check((read(file).match(/href="\/festivals\/"/g) || []).length >= 2, `${file} does not link to /festivals/ in the nav and footer`);
});

['build_regions.mjs', 'build_pages.mjs', 'build_festivals.mjs', 'build_newsletter.mjs'].forEach((builder) => {
  try {
    execFileSync(process.execPath, [path.join(root, 'tools', builder), '--check'], { stdio: 'pipe' });
  } catch (error) {
    failures.push(String(error.stderr || error.message).trim());
  }
});

if (failures.length) {
  console.error(`Smoke checks failed (${failures.length}):`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`Smoke checks passed: ${regions.length} regions, ${festivalPages.length - 1} festival pages, ${scriptFiles.length} scripts.`);
