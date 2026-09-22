// Read the multipart tip from the site (docs/tip-pipeline.md) and keep only what we trust.
// Output verdict: 'ok' (carry on), 'drop' (honeypot: answer 200, store nothing), 'invalid' (400).
const SETTINGS = {
  owner: 'AugustOsei',
  repo: 'GhanaNice',
  reviewTo: 'augustministry@gmail.com',
  site: 'https://www.ghananice.com',
  sheetId: '1Af866rDXLZ1mnnHHVvqQ63HL9cs9CYYab2a6JBsdMq0'
};
const REGIONS = ['greater-accra', 'central', 'volta', 'savannah', 'western', 'ashanti', 'eastern', 'northern', 'upper-east', 'upper-west', 'north-east', 'oti', 'bono', 'bono-east', 'ahafo', 'western-north'];

const input = $input.first();
const text = (value, max) => String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
let raw;
try { raw = JSON.parse(input.json.body?.tip || ''); } catch { raw = null; }
if (!raw || typeof raw !== 'object') return [{ json: { verdict: 'invalid', reason: 'The tip was not readable.' } }];
if (text(raw.website, 200)) return [{ json: { verdict: 'drop', reason: 'honeypot' } }];

const email = text(raw.submitter?.email, 120).toLowerCase();
const tip = {
  id: /^[0-9a-f-]{16,64}$/i.test(raw.id || '') ? raw.id.toLowerCase() : `${Date.now()}-${$execution.id}`,
  submittedAt: /^\d{4}-\d\d-\d\dT/.test(raw.submittedAt || '') ? raw.submittedAt : new Date().toISOString(),
  place: text(raw.place, 200),
  town: text(raw.town, 80),
  mapsLink: /^https:\/\/(maps\.app\.goo\.gl|goo\.gl\/maps|(www\.)?google\.[a-z.]+\/maps)/i.test(raw.mapsLink || '') ? text(raw.mapsLink, 500) : '',
  placeId: /^[\w-]{10,300}$/.test(raw.placeId || '') ? raw.placeId : '',
  placeAddress: text(raw.placeAddress, 200),
  placeTypes: Array.isArray(raw.placeTypes) ? raw.placeTypes.slice(0, 12).map(t => text(t, 50)) : [],
  regionHint: REGIONS.includes(raw.regionSlug) ? raw.regionSlug : '',
  note: text(raw.note, 280),
  photoConsent: raw.photoConsent === true,
  name: text(raw.submitter?.name, 80),
  email: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) ? email : '',
  turnstile: text(raw.turnstileToken, 2048),
  source: text(raw.source, 40),
  pageUrl: text(raw.pageUrl, 300)
};

if (!tip.place && !tip.mapsLink && !tip.placeId) return [{ json: { verdict: 'invalid', reason: 'No place was given.' } }];
if (!tip.placeId && !tip.mapsLink && !tip.town) return [{ json: { verdict: 'invalid', reason: 'No town was given.' } }];
// Without Turnstile the site requires an email; a tip with neither came from somewhere else.
if (!tip.email && !tip.turnstile) return [{ json: { verdict: 'invalid', reason: 'An email is needed.' } }];

// Photos: only with the sender's say-so, only JPEGs (the site re-encodes every photo), at most three.
const binary = {};
let photos = 0;
if (tip.photoConsent) {
  for (const n of [1, 2, 3]) {
    const big = input.binary?.[`photo${n}`];
    if (!big || !/^image\/jpe?g$/i.test(big.mimeType || '')) continue;
    photos += 1;
    binary[`photo${photos}`] = { ...big, fileName: `photo-${photos}.jpg` };
    const small = input.binary?.[`photo${n}_small`];
    if (small && /^image\/jpe?g$/i.test(small.mimeType || '')) binary[`photo${photos}_small`] = { ...small, fileName: `photo-${photos}-800.jpg` };
  }
}
tip.photoCount = photos;

// "[test] …" tips run the whole pipeline but publish to the listings-test branch, not main.
const isTest = /^\[test\]/i.test(tip.place);
const settings = { ...SETTINGS, branch: isTest ? 'listings-test' : 'main' };
const now = new Date().toISOString();
const row = [tip.id, tip.submittedAt, 'received', tip.place || tip.mapsLink, tip.town || tip.placeAddress, tip.regionHint, '', '', tip.note,
  tip.name, tip.email, photos, tip.placeId, tip.mapsLink, '', '', '', '', '', '', tip.source, now];

return [{ json: { verdict: 'ok', tip, settings, isTest, row }, binary }];
