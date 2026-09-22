// Add the listing to dist/data/listings.json (newest first) and list every file for one
// commit: the photos plus the updated JSON. One commit means one Vercel deploy.
const review = $('Prepare review').first().json;
const { files, photos } = $('Encode photos').first().json;
const head = $('Git ref').first().json.object?.sha;
const baseTree = $('Git commit').first().json.tree?.sha;
if (!head || !baseTree) throw new Error('Could not read the branch from GitHub (check the GhanaNice — GitHub credential).');

let data = { updated: null, listings: [] };
const current = $input.first().json;
if (current.content) {
  try { data = JSON.parse(Buffer.from(current.content, 'base64').toString('utf8')); } catch { throw new Error('dist/data/listings.json is not valid JSON; fix it before publishing.'); }
}
const now = new Date().toISOString();
const listing = { ...review.listing, photos, photoCredit: photos.length ? (review.firstName || 'a GhanaNice reader') : '', publishedAt: now };
data.listings = [listing, ...(data.listings || []).filter(item => item.id !== listing.id)];
data.updated = now;

const all = [...files, { path: 'dist/data/listings.json', content: Buffer.from(JSON.stringify(data, null, 1) + '\n').toString('base64') }];
return all.map(file => ({ json: { path: file.path, content: file.content, head, baseTree } }));
