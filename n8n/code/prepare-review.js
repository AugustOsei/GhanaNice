// Combine the tip, Google's match and the Claude check into: the listing as it would be
// published, the Sheet row, and the emails. The photos ride along for the attachments.
const read = $('Read tip').first();
const { tip, settings, isTest } = read.json;
const { google, how, ruleCategory, ruleKind } = $('Pick match').first().json;
const REGIONS = {
  'greater-accra': 'Greater Accra', central: 'Central', volta: 'Volta', savannah: 'Savannah', western: 'Western',
  ashanti: 'Ashanti', eastern: 'Eastern', northern: 'Northern', 'upper-east': 'Upper East', 'upper-west': 'Upper West',
  'north-east': 'North East', oti: 'Oti', bono: 'Bono', 'bono-east': 'Bono East', ahafo: 'Ahafo', 'western-north': 'Western North'
};

// Claude's answer: structured output guarantees JSON in the text block unless it refused or failed.
let ai = null;
const reply = $('Claude check').first().json;
if (reply && reply.stop_reason !== 'refusal') {
  const block = (reply.content || []).find(b => b.type === 'text');
  try { ai = JSON.parse(block?.text || ''); } catch { ai = null; }
}
const aiError = ai ? '' : (reply?.error?.message || reply?.stop_reason || 'no answer');

const trustGoogle = !!google && (how === 'picked on the site' || ai?.matchLooksRight !== false);
const g = trustGoogle ? google : null;
const region = g?.region || (REGIONS[ai?.region] ? ai.region : '') || tip.regionHint;
const category = ruleCategory || ai?.category || 'History & culture';
const kind = ruleKind || ai?.kind || 'Place';
const note = ai ? ai.cleanNote : tip.note;
const firstName = tip.name.split(/\s+/)[0] || '';
const placeName = g?.name || tip.place.replace(/^\[test\]\s*/i, '') || 'A place on Google Maps';

// The listing exactly as the site will read it from data/listings.json (photos added on publish).
const listing = {
  id: tip.id,
  place: isTest ? `[test] ${placeName}` : placeName,
  kind,
  category,
  regionSlug: region,
  area: g?.area || tip.town || tip.placeAddress,
  note,
  submitterName: firstName,
  placeId: g?.placeId || '',
  mapsUrl: g?.mapsUrl || '',
  website: /^https?:\/\//.test(g?.website || '') ? g.website : '',
  phoneUrl: g?.phone ? `tel:${g.phone.replace(/[^\d+]/g, '')}` : '',
  rating: g?.rating || null,
  reviewCount: g?.reviewCount || null,
  googleCheckedAt: g ? new Date().toISOString().slice(0, 10) : null
};

const photoKeys = Object.keys(read.binary || {}).filter(k => /^photo\d$/.test(k)).sort();
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const line = (label, value) => value ? `<tr><td style="padding:4px 14px 4px 0;color:#666;vertical-align:top">${esc(label)}</td><td style="padding:4px 0">${value}</td></tr>` : '';
const link = url => url ? `<a href="${esc(url)}">${esc(url.length > 60 ? url.slice(0, 57) + '…' : url)}</a>` : '';
const warn = ai?.spam ? `<p style="background:#fde2dc;padding:10px 12px"><b>Looks like spam:</b> ${esc(ai.spamReason)}</p>` : '';
const noMatch = !g ? `<p style="background:#fff3cd;padding:10px 12px">Google didn’t find a confident match${google ? ` (it suggested “${esc(google.name)}”, which Claude thinks is a different place)` : ''}. If you approve, it’s listed with the sender’s details only.</p>` : '';

const detailsHtml = `
<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.45;color:#111">
  ${warn}${noMatch}
  <h2 style="margin:0 0 4px">${esc(listing.place)}</h2>
  <p style="margin:0 0 14px;color:#555">${esc(category)} · ${esc(kind)} · ${esc(REGIONS[region] || 'Region unknown')}${listing.area ? ' · ' + esc(listing.area) : ''}</p>
  ${ai?.reviewerSummary ? `<p style="margin:0 0 14px"><i>${esc(ai.reviewerSummary)}</i></p>` : ''}
  <table style="border-collapse:collapse">
    ${line('Their words', esc(tip.note))}
    ${line('As listed', note !== tip.note ? esc(note) : '')}
    ${line('From', esc([tip.name, tip.email].filter(Boolean).join(' · ')) || 'No name or email')}
    ${line('Photos', photoKeys.length ? `${photoKeys.length} attached${tip.photoConsent ? ', they took them and agreed to show them' : ''}` : 'None')}
    ${line('Google', g ? `${esc(g.address)}<br>${g.rating ? `★ ${g.rating} (${g.reviewCount || 0} reviews) · ` : ''}${link(g.mapsUrl)}` : '')}
    ${line('Website', link(listing.website))}
    ${line('Phone', esc(g?.phone))}
    ${line('Found by', esc(g ? how : 'not found'))}
    ${line('Sent from', link(tip.pageUrl))}
    ${line('Claude', ai ? '' : `No answer (${esc(aiError)}), so the category comes from Google’s place type.`)}
  </table>
  ${isTest ? '<p style="color:#555">This is a <b>[test]</b> tip: approving it publishes to the listings-test branch, not the live site.</p>' : ''}
</div>`;

// The approval email is plain text (n8n puts it in its own template above the buttons).
const approvalText = [
  `${listing.place} (${category}, ${REGIONS[region] || 'region unknown'})`,
  ai?.spam ? `Looks like spam: ${ai.spamReason}` : '',
  note ? `“${note}”` : '',
  g ? `Google: ${g.address}` : 'Not found on Google.',
  `${photoKeys.length} photo${photoKeys.length === 1 ? '' : 's'}${photoKeys.length ? ' (see the other email)' : ''}. From ${firstName || 'someone who left no name'}.`,
  'Approve to publish it on GhanaNice now. Reject to drop it.'
].filter(Boolean).join('\n\n');

const now = new Date().toISOString();
const row = [tip.id, tip.submittedAt, 'waiting for review', listing.place, listing.area, region, category, kind, note,
  tip.name, tip.email, photoKeys.length, listing.placeId, listing.mapsUrl || tip.mapsLink, listing.website, g?.phone || '',
  listing.rating || '', listing.reviewCount || '', ai ? (ai.spam ? `spam: ${ai.spamReason}` : 'ok') : `no answer: ${aiError}`,
  ai?.reviewerSummary || '', tip.source, now];
const range = $('Log received').first().json.updates?.updatedRange || '';
const rowNumber = Number((range.match(/![A-Z]+(\d+)/) || [])[1]) || null;

// The sender's emails: thanks now, and "it's live" once approved. Plain, warm, short.
const hello = firstName ? `Hi ${esc(firstName)},` : 'Hello,';
const wrap = body => `<div style="font-family:Georgia,serif;font-size:16px;line-height:1.55;color:#11110f;max-width:520px">${body}<p style="margin-top:28px">August<br><span style="font-family:Arial,sans-serif;font-size:12px;color:#666">GhanaNice · <a href="${settings.site}">ghananice.com</a></span></p></div>`;
const thanksHtml = wrap(`<p>${hello}</p><p>Thank you for putting us on to <b>${esc(placeName)}</b>. We’ll look it up and check it, and it’ll go on the ${esc(REGIONS[region] || 'right')} region page once it has. We’ll email you when it’s live.</p><p>Good places are better when they’re shared.</p>`);
const liveHtml = wrap(`<p>${hello}</p><p><b>${esc(placeName)}</b> is now on GhanaNice${firstName ? ', with your name on it' : ''}. Thank you for sharing it.</p><p><a href="${region ? `${settings.site}/region.html?r=${region}#community` : settings.site}">See it on the ${esc(REGIONS[region] || '')} page</a></p><p>Know somewhere else? Send it our way any time.</p>`);

const subjectTag = ai?.spam ? '[Likely spam] ' : isTest ? '[test] ' : '';
return [{
  json: {
    listing, region, regionName: REGIONS[region] || '', category, note, firstName, email: tip.email, isTest, settings,
    detailsHtml, approvalText, thanksHtml, liveHtml, row, rowNumber,
    subjectThanks: `Thanks for the tip: ${placeName}`,
    subjectLive: `${placeName} is on GhanaNice`,
    hasPhotos: photoKeys.length > 0, photoList: photoKeys.join(','),
    subjectDetails: `${subjectTag}New tip: ${listing.place}`,
    subjectApproval: `${subjectTag}Approve “${listing.place}” for GhanaNice?`,
    regionUrl: region ? `${settings.site}/region.html?r=${region}#community` : settings.site
  },
  binary: read.binary
}];
