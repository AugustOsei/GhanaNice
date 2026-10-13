// Prepare the owner approval and submitter emails, including a duplicate warning from the
// currently published service-submissions file. Approval publishes a standard listing only;
// a featured upgrade still requires a personal pricing, duration and media-rights agreement.
const read = $('Read service').first().json;
const { service, listing, settings } = read;
let published = [];
try {
  const encoded = $('Current published services').first().json.content || '';
  published = JSON.parse(Buffer.from(encoded, 'base64').toString('utf8')).services || [];
} catch { published = []; }

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
const duplicate = published.find(item => item.name?.toLowerCase() === listing.name.toLowerCase() || (linkKey(item.website) && linkKey(item.website) === linkKey(listing.website)));
const firstName = service.contactName.split(/\s+/)[0] || '';
const esc = value => String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const link = value => `<a href="${esc(value)}">${esc(value)}</a>`;
const wrap = body => `<div style="font-family:Georgia,serif;font-size:16px;line-height:1.55;color:#11110f;max-width:560px">${body}<p style="margin-top:28px">August<br><span style="font-family:Arial,sans-serif;font-size:12px;color:#666">GhanaNice · <a href="${settings.site}">ghananice.com</a></span></p></div>`;
const featuredNote = service.featuredInterest
  ? 'They are interested in featured placement. Contact them personally to agree pricing, duration and image permissions. Approving here publishes the standard listing; the featured upgrade remains manual.'
  : 'They requested a standard listing.';
const duplicateNote = duplicate ? `Possible duplicate: “${duplicate.name}” is already published at ${duplicate.website}.` : 'No matching name or link is already in the submitted-services file.';

const approvalText = [
  `${service.businessName} — ${service.categoryLabel}`,
  `${service.baseLocation}, ${service.regionName}`,
  service.description,
  `Coverage: ${service.coverage}`,
  `Link (website or social page): ${service.website}`,
  `Contact: ${service.contactName} · ${service.email}${service.phone ? ' · ' + service.phone : ''}`,
  featuredNote,
  duplicateNote,
  'Before approving, confirm the website or social page belongs to the business, the service is relevant to travel in Ghana, the location/category/claims match its public information, and the representative can be contacted. Approval publishes only the standard listing.'
].join('\n\n');

const hello = firstName ? `Hi ${esc(firstName)},` : 'Hello,';
const thanksHtml = wrap(`<p>${hello}</p><p>Thank you for submitting <b>${esc(service.businessName)}</b> to the GhanaNice travel directory. We’ll check the business, its website or social media page and the details you supplied before anything is published.</p>${service.featuredInterest ? '<p>You also expressed interest in featured placement. I’ll contact you personally about pricing, duration and suitable images; selecting it on the form does not commit you to anything.</p>' : ''}<p>We’ll email you after the review.</p>`);
const liveUrl = `${settings.site}/travel-directory.html?business=${encodeURIComponent(listing.id)}#service-${encodeURIComponent(listing.id)}`;
const liveHtml = wrap(`<p>${hello}</p><p><b>${esc(service.businessName)}</b> is now listed in the GhanaNice travel directory.</p><p><a href="${liveUrl}">View the listing</a></p>${service.featuredInterest ? '<p>Your standard listing is live. I’ll follow up separately about the optional featured placement.</p>' : ''}`);
const rejectedHtml = wrap(`<p>${hello}</p><p>Thank you for submitting <b>${esc(service.businessName)}</b>. We couldn’t add it to the GhanaNice directory after reviewing the public information supplied.</p><p>You can reply with an updated website or social media page, or corrected details, if something has changed.</p>`);

const range = $('Log received').first().json.updates?.updatedRange || '';
const rowNumber = Number((range.match(/![A-Z]+(\d+)/) || [])[1]) || null;
const checks = duplicate ? `possible duplicate: ${duplicate.name}` : 'manual checks pending';
const now = new Date().toISOString();
const row = [...read.row];
row[2] = service.featuredInterest ? 'featured interest: waiting for review' : 'waiting for review';
row[14] = checks;
row[17] = now;

return [{ json: {
  service, listing, settings, row, rowNumber, approvalText, thanksHtml, liveHtml, rejectedHtml,
  email: service.email,
  subjectThanks: `We received ${service.businessName} for GhanaNice`,
  subjectApproval: `${service.featuredInterest ? '[Featured interest] ' : ''}Approve “${service.businessName}” for GhanaNice?`,
  subjectLive: `${service.businessName} is on GhanaNice`,
  subjectRejected: `About your GhanaNice directory submission`,
  liveUrl
} }];
