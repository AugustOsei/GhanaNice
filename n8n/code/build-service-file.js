// Add the approved standard listing to the JSON file read by the directory. Re-read the file
// after the approval wait so concurrent approvals cannot overwrite one another.
const review = $('Prepare review').first().json;
const current = $input.first().json;
let body = { services: [] };
try { body = JSON.parse(Buffer.from(current.content || '', 'base64').toString('utf8')); } catch { body = { services: [] }; }
if (!Array.isArray(body.services)) body.services = [];

// Two businesses can share instagram.com or facebook.com, so a social page is identified by
// its host and page name; an ordinary website is identified by its host alone.
const SOCIAL_HOSTS = ['instagram.com', 'facebook.com', 'fb.com', 'tiktok.com', 'x.com', 'twitter.com', 'youtube.com', 'linktr.ee', 'wa.me'];
const linkKey = value => {
  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^(www|m|web)\./, '').toLowerCase();
    if (!SOCIAL_HOSTS.includes(host)) return host;
    return `${host}/${url.pathname.replace(/^\/+|\/+$/g, '').toLowerCase()}`;
  } catch { return ''; }
};
const exists = body.services.some(item => item.id === review.listing.id || (linkKey(item.website) && linkKey(item.website) === linkKey(review.listing.website)));
if (!exists) body.services.push(review.listing);
body.updatedAt = new Date().toISOString();

return [{ json: {
  path: 'dist/data/service-submissions.json',
  content: Buffer.from(JSON.stringify(body, null, 2) + '\n').toString('base64'),
  baseTree: $('Git commit').first().json.tree.sha,
  head: $('Git ref').first().json.object.sha,
  alreadyPublished: exists,
  message: `Add travel service: ${review.listing.name}\n\nApproved through the GhanaNice service intake.`
} }];
