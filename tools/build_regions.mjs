/* Writes the 16 static region pages, dist/regions/<slug>/index.html, and dist/sitemap.xml
   (which also lists the plain pages, the festival pages and /december/).

   data.js (copy, places) and media.js (photos, credits, links) stay the source of truth, and
   tools/region-template.html holds the page. Everything a reader or a search engine needs is in
   the HTML; region.js only adds the photo viewer, the community wall and the tip form.

   Re-run after editing data.js, media.js or the template:  node tools/build_regions.mjs
   tools/smoke.mjs runs it with --check, so a stale page fails the Vercel build. */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { PAGES } from './build_pages.mjs';
import { SUMMARIES as NEWSLETTER_ISSUES } from './build_newsletter.mjs';
import { createRequire } from 'node:module';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const SITE = 'https://www.ghananice.com';
const checkOnly = process.argv.includes('--check');

function load(file, key) {
  const sandbox = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(dist, file), 'utf8'), sandbox, { filename: file });
  return sandbox.window[key];
}
const regions = load('data.js', 'GHANA_REGIONS');
const media = load('media.js', 'GHANA_MEDIA');
const template = fs.readFileSync(path.join(root, 'tools/region-template.html'), 'utf8');
/* The festivals (tools/build_festivals.mjs): each region page lists the ones filed under it, and
   the sitemap lists every festival with its own page. */
const festivals = fs.readdirSync(path.join(root, 'tools/festivals')).filter(f => f.endsWith('.json')).sort()
  .map(f => JSON.parse(fs.readFileSync(path.join(root, 'tools/festivals', f), 'utf8')))
  .filter(f => Array.isArray(f.sections) && f.sections.length > 0);

const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
/* The photos in assets/real/ ship with smaller WebP copies (tools/media/resize_local.py). */
const sized = (src, width) => src.replace(/\.(jpe?g|png)$/, `-${width}.webp`);
const abs = src => (/^(https?:|data:|\/)/.test(src) ? src : `/${src}`);
const regionUrl = slug => `${SITE}/regions/${slug}/`;

function localPhoto(src) {
  const credit = media.local?.[src];
  return credit ? { src, small: sized(src, 800), ...credit } : null;
}

/* "Photo: Name · CC BY-SA 4.0", with the licence and the source page linked, as the licences ask. */
function creditLine(photo, prefix = 'Photo: ') {
  const licence = photo.licenseUrl
    ? `<a href="${esc(photo.licenseUrl)}" target="_blank" rel="noopener license">${esc(photo.license)}</a>`
    : esc(photo.license);
  return `<span class="photo-credit">${esc(prefix)}<a href="${esc(photo.source)}" target="_blank" rel="noopener">${esc(photo.author)}</a> · ${licence}</span>`;
}

/* Most regions open on their hero photograph; a few lead with a stronger picked view
   (Accra's skyline, Kumasi's Kejetia) and put the hero photos after it. */
function galleryFor(region) {
  const regionPhotos = (media.regions[region.slug] || []).map(slug => media.photos[slug]).filter(Boolean);
  const heroPhotos = [region.image, region.side].filter(Boolean).map(localPhoto).filter(Boolean);
  return media.leads?.[region.slug]
    ? [...regionPhotos.slice(0, 1), ...heroPhotos, ...regionPhotos.slice(1)]
    : [...heroPhotos, ...regionPhotos];
}

function galleryTile(photo, index) {
  const ratio = (photo.w || 4) / (photo.h || 3);
  const shape = index === 0 ? ' is-lead' : ratio > 1.7 ? ' is-wide' : ratio < .85 ? ' is-tall' : '';
  return `        <button class="gallery-tile${shape}" type="button" data-index="${index}" aria-label="View photo: ${esc(photo.caption)}"><img src="${esc(abs(photo.small))}" alt="${esc(photo.caption)}" loading="lazy" decoding="async"><span class="gallery-label"><b>${esc(photo.caption)}</b><small>by ${esc(photo.author)}</small></span></button>`;
}

/* A card only carries a photograph when we actually have one of that specific place. */
function visitItem(region, item) {
  const info = media.places[`${region.slug}|${item.name}`] || {};
  const photo = item.image ? (localPhoto(item.image) || { src: item.image, small: sized(item.image, 800) }) : media.photos[info.photo];
  const figure = photo
    ? `<figure class="visit-image"><img src="${esc(abs(photo.small))}" alt="${esc(photo.caption || item.name)}" loading="lazy">${photo.author ? creditLine(photo, '') : ''}</figure>`
    : '';
  const links = [['site', 'Official site'], ['guide', 'Visit Ghana guide'], ['wiki', 'Wikipedia']]
    .filter(([key]) => info[key])
    .map(([key, label]) => `<a href="${esc(info[key])}" target="_blank" rel="noopener">${label} ↗</a>`);
  return `        <li class="visit-item${photo ? ' has-image' : ''}">${figure}<div class="visit-body"><h3>${esc(item.name)}</h3><p>${esc(item.note)}</p>${links.length ? `<p class="visit-links">${links.join('')}</p>` : ''}</div></li>`;
}

/* In calendar order, as on /festivals/: dated festivals by month, the every-six-weeks ones last. */
function festivalItems(region) {
  return festivals.filter(f => f.region === region.name)
    .sort((a, b) => (a.recurring ? 12 : a.month) - (b.recurring ? 12 : b.month) || a.name.localeCompare(b.name))
    .map(f => `        <li class="region-festival"><span class="region-festival-month">${esc(f.card.short)}</span><div><h3><a href="/festivals/${esc(f.slug)}/">${esc(f.name)}</a></h3><p>${esc(f.card.sum)}</p></div><p class="region-festival-when">${esc(f.card.when)}<span>${esc(f.card.place)}</span></p></li>`)
    .join('\n');
}

function render(region, index) {
  const url = regionUrl(region.slug);
  const gallery = galleryFor(region);
  const leadSlug = media.leads?.[region.slug];
  const leadPhoto = leadSlug && media.photos[leadSlug];
  const heroShot = leadPhoto ? leadPhoto.caption : region.shot;
  const heroCredit = leadPhoto || media.local?.[region.image];
  const heroSrc = leadPhoto ? leadPhoto.src : sized(region.image, 1200);
  const heroImage = `<img src="${esc(abs(heroSrc))}" alt="${esc(heroShot)}" fetchpriority="high" decoding="async">`;
  const description = `${region.name} Region, Ghana: ${region.intro}`;
  const next = [regions[(index + 1) % regions.length], regions[(index + 2) % regions.length]];

  /* Structured data: the region as a tourist destination, its places as attractions, and where
     it sits in the site. Only facts the page itself shows. */
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'TouristDestination',
        '@id': `${url}#destination`,
        name: `${region.name} Region`,
        description: region.intro,
        url,
        image: `${SITE}/${region.image}`,
        containedInPlace: { '@type': 'Country', name: 'Ghana' },
        includesAttraction: region.visit.map(item => ({ '@type': 'TouristAttraction', name: item.name, description: item.note })),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'GhanaNice', item: `${SITE}/` },
          { '@type': 'ListItem', position: 2, name: `${region.name} Region`, item: url },
        ],
      },
    ],
  };
  /* The photo viewer's data: full-size source and the credit for each gallery photo. */
  const galleryData = gallery.map(({ src, caption, author, source, license, licenseUrl }) => ({ src: abs(src), caption, author, source, license, licenseUrl }));
  /* JSON inside <script>: escape "<" so no value can close the element early. */
  const json = value => JSON.stringify(value).replace(/</g, '\\u003c');

  const values = {
    title: `${region.name} Region, Ghana: places to visit — GhanaNice`,
    description,
    url,
    ogTitle: `${region.name} — GhanaNice`,
    ogDescription: description,
    ogImage: `${SITE}/${region.image}`,
    ogImageAlt: region.shot,
    jsonLd: json(jsonLd),
    slug: region.slug,
    name: region.name,
    intro: region.intro,
    capital: region.capital,
    known: region.known,
    fact: region.fact,
    heroCaption: heroCredit ? `${heroShot} · Photo: ${heroCredit.author}` : heroShot,
  };
  const raw = {
    heroImage,
    galleryTiles: gallery.map(galleryTile).join('\n'),
    galleryCredits: gallery.map(photo => `          <li><span>${esc(photo.caption)}. </span>${creditLine(photo, '')}</li>`).join('\n'),
    galleryData: json(galleryData),
    visitItems: region.visit.map(item => visitItem(region, item)).join('\n'),
    festivalItems: festivalItems(region),
    nextLinks: next.map(r => `<a href="/regions/${r.slug}/">${esc(r.name)}</a>`).join(''),
  };
  return template
    .replace(/<!-- Template for[\s\S]*?-->\n/, '')
    .replace(/\{\{(\w+)\}\}/g, (match, key) => {
      if (key in raw) return raw[key];
      if (key in values) return key === 'jsonLd' ? values[key] : esc(values[key]);
      throw new Error(`region-template.html: no value for ${match}`);
    });
}

const festivalUrls = festivals.map(f => `${SITE}/festivals/${f.slug}/`);

function sitemap() {
  const pages = [`${SITE}/`, `${SITE}/travel-directory.html`, ...regions.map(r => regionUrl(r.slug)), ...PAGES.map(p => SITE + p.path), `${SITE}/festivals/`, ...festivalUrls, `${SITE}/december/`,
    /* Last, so the n8n issue workflow can add a new issue just before </urlset>. */
    ...createRequire(import.meta.url)('./newsletter-render.js').sitemapUrls(NEWSLETTER_ISSUES)];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(loc => `  <url><loc>${loc}</loc></url>`).join('\n')}
</urlset>
`;
}

const outputs = new Map(regions.map((region, index) => [path.join(dist, 'regions', region.slug, 'index.html'), render(region, index)]));
outputs.set(path.join(dist, 'sitemap.xml'), sitemap());

if (checkOnly) {
  const stale = [...outputs].filter(([file, html]) => !fs.existsSync(file) || fs.readFileSync(file, 'utf8') !== html);
  if (stale.length) {
    console.error(`Out of date (run node tools/build_regions.mjs): ${stale.map(([file]) => path.relative(root, file)).join(', ')}`);
    process.exit(1);
  }
  console.log(`Region pages up to date: ${regions.length}.`);
} else {
  outputs.forEach((html, file) => {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, html);
  });
  console.log(`Wrote ${regions.length} region pages and the sitemap.`);
}
