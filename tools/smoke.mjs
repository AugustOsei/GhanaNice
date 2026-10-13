import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
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
    if (!reference || /^(?:#|https?:|mailto:|tel:|data:)/.test(reference)) return;
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
const heroAssets = [...appSource.matchAll(/^\s+(?:poster|webm|mp4): '([^']+)'/gm)].map((match) => match[1]);
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

const htmlExpectations = {
  'dist/index.html': [
    'styles.css?v=35',
    'data.js?v=6',
    'app.js?v=29',
    'tip-form.js?v=5',
    'footer.js?v=2',
    'id="hero-video"',
    'id="region-reader" role="dialog"',
  ],
  'dist/region.html': [
    'styles.css?v=35',
    'data.js?v=6',
    'region.js?v=10',
    'tip-form.js?v=5',
    'footer.js?v=2',
  ],
  'dist/credits.html': ['styles.css?v=35'],
  'dist/404.html': ['styles.css?v=35'],
  'dist/travel-directory.html': [
    'styles.css?v=35',
    'travel-directory.css?v=15',
    'config.js?v=5',
    'travel-directory-data.js?v=4',
    'travel-directory.js?v=16',
    'footer.js?v=2',
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

if (failures.length) {
  console.error(`Smoke checks failed (${failures.length}):`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`Smoke checks passed: ${regions.length} regions, ${scriptFiles.length} scripts.`);
