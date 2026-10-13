// Validate and normalize a travel-directory submission. Nothing here makes the business
// "trusted": it only rejects malformed intake and prepares a conservative standard listing.
const SETTINGS = {
  reviewTo: 'augustministry@gmail.com',
  site: 'https://www.ghananice.com',
  sheetId: '1Af866rDXLZ1mnnHHVvqQ63HL9cs9CYYab2a6JBsdMq0',
  branch: 'main'
};
const CATEGORIES = {
  tours: 'Tours & guides',
  transport: 'Getting around',
  stay: 'Places to stay'
};
const REGIONS = {
  'greater-accra': 'Greater Accra', central: 'Central', volta: 'Volta', savannah: 'Savannah', western: 'Western',
  ashanti: 'Ashanti', eastern: 'Eastern', northern: 'Northern', 'upper-east': 'Upper East', 'upper-west': 'Upper West',
  'north-east': 'North East', oti: 'Oti', bono: 'Bono', 'bono-east': 'Bono East', ahafo: 'Ahafo', 'western-north': 'Western North'
};

const input = $input.first();
const raw = input.json.body && typeof input.json.body === 'object' ? input.json.body : input.json;
const text = (value, max) => String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
if (text(raw.companyFax, 100)) return [{ json: { verdict: 'drop', reason: 'honeypot' } }];

const email = text(raw.email, 180).toLowerCase();
let website = text(raw.website, 500);
try {
  const parsed = new URL(website);
  const privateHost = /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/i.test(parsed.hostname);
  website = parsed.protocol === 'https:' && !privateHost ? parsed.href : '';
} catch { website = ''; }

const businessName = text(raw.businessName, 100);
const category = CATEGORIES[raw.category] ? raw.category : '';
const primaryRegion = REGIONS[raw.primaryRegion] ? raw.primaryRegion : '';
const listingType = raw.listingType === 'featured' ? 'featured' : 'standard';
const idSeed = /^[0-9a-f-]{16,64}$/i.test(raw.id || '') ? raw.id.toLowerCase() : `${Date.now()}-${$execution.id}`;
const slug = businessName.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 54) || 'service';
const listingId = `${slug}-${idSeed.replace(/[^a-z0-9]/g, '').slice(0, 8)}`;
const submittedAt = /^\d{4}-\d\d-\d\dT/.test(raw.submittedAt || '') ? raw.submittedAt : new Date().toISOString();

const service = {
  id: idSeed,
  listingId,
  submittedAt,
  businessName,
  category,
  categoryLabel: CATEGORIES[category] || '',
  primaryRegion,
  regionName: REGIONS[primaryRegion] || '',
  baseLocation: text(raw.baseLocation, 100),
  coverage: text(raw.coverage, 180),
  description: text(raw.description, 600),
  website,
  listingType,
  featuredInterest: listingType === 'featured',
  contactName: text(raw.contactName, 100),
  email: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) ? email : '',
  phone: text(raw.phone, 40),
  consent: raw.consent === true,
  source: text(raw.source, 60),
  pageUrl: text(raw.pageUrl, 400)
};

let reason = '';
if (service.businessName.length < 2) reason = 'A business name is required.';
else if (!service.category) reason = 'Choose a supported service category.';
else if (!service.primaryRegion) reason = 'Choose the primary region.';
else if (service.baseLocation.length < 2) reason = 'A base location is required.';
else if (!service.website) reason = 'A public HTTPS website or social media page is required.';
else if (service.coverage.length < 2) reason = 'Service coverage is required.';
else if (service.description.length < 30) reason = 'The description is too short.';
else if (service.contactName.length < 2) reason = 'A contact name is required.';
else if (!service.email) reason = 'A valid email is required.';
else if (!service.consent) reason = 'The representative confirmation is required.';
if (reason) return [{ json: { verdict: 'invalid', reason } }];

const checked = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Africa/Accra' }).format(new Date()).replace(',', '');
const listing = {
  id: listingId,
  name: service.businessName,
  category: service.category,
  categoryLabel: service.categoryLabel,
  base: service.baseLocation,
  regions: [service.primaryRegion],
  coverage: service.coverage,
  description: service.description,
  goodFor: [],
  website: service.website,
  checked,
  featured: false
};

const now = new Date().toISOString();
const row = [service.id, service.submittedAt, 'received', service.businessName, service.category, service.primaryRegion,
  service.baseLocation, service.coverage, service.description, service.website, service.contactName, service.email,
  service.phone, service.listingType, '', '', service.source, now, '', '', service.listingId];

return [{ json: { verdict: 'ok', service, listing, settings: SETTINGS, row } }];
