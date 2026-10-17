// Put the issue together: the facts from "Gather issue" with Claude's short copy laid over them.
// If Claude's reply is missing or unreadable, the data's own wording is used, so an issue is
// always drafted. Produces the issue (as stored in tools/newsletter/<yyyy-mm>.json), the
// paste-ready email for August and the MailerLite draft campaign.
// GhanaNiceNewsletter (tools/newsletter-render.js) is pasted in above this by the builder.
const R = GhanaNiceNewsletter;
const GROUP_ID = '201520530803656462';
const SENDER = { from: 'hello@ghananice.com', from_name: 'GhanaNice' };
const REVIEW_TO = 'augustministry@gmail.com';
const { facts, month } = $('Gather issue').first().json;

let ai = {};
let aiProblem = '';
const reply = $input.first().json;
const block = (reply.content || []).find(b => b.type === 'text');
try {
  const text = (block?.text || '').replace(/^```(?:json)?\s*|\s*```$/g, '');
  ai = JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1));
} catch {
  aiProblem = reply.error ? `Claude returned an error (${reply.error.message || reply.error.type}).` : 'Claude’s reply could not be read.';
}
const line = (value, max) => typeof value === 'string' && value.trim() ? value.trim().slice(0, max) : '';
const name = `${facts.monthName} ${facts.year}`;

const festivalItems = [
  ...facts.festivals.map(f => ({
    meta: `${f.region} · ${f.when}`,
    title: f.name,
    url: `/festivals/${f.slug}/`,
    text: [line(ai.festivals?.[f.slug], 260) || f.sum, f.dateSetBy ? `Dates set by ${f.dateSetBy.replace(/\.$/, '')}.` : ''].filter(Boolean).join(' ')
  })),
  ...facts.akwasidae.map(f => ({
    meta: `${f.region} · ${f.dates.join(' and ')}`,
    title: f.name,
    url: `/festivals/${f.slug}/`,
    text: `${line(ai.festivals?.[f.slug], 260) || f.sum} The dates follow the 42-day Akan calendar; check with Manhyia Palace before you travel.`
  }))
];

const newItems = [];
if (facts.newFestivals.length > 4) {
  newItems.push({ meta: 'Festivals', title: `${facts.newFestivals.length} festivals and cultural events`, url: '/festivals/',
    text: line(ai.newFestivals, 300) || `A month-by-month list of festivals across all 16 regions, from ${facts.newFestivals.slice(0, 3).join(', ')} and more.` });
} else {
  facts.newFestivals.forEach(n => newItems.push({ meta: 'Festivals', title: n, url: '/festivals/', text: '' }));
}
facts.newTips.forEach(t => newItems.push({
  meta: [t.category, t.area].filter(Boolean).join(' · '), title: t.place, url: t.regionSlug ? `/regions/${t.regionSlug}/` : '/', text: t.note || ''
}));
facts.newServices.forEach(s => newItems.push({
  meta: `Travel directory · ${s.category}`, title: s.name, url: '/travel-directory.html', text: s.description.slice(0, 220)
}));

const place = facts.place;
const tip = facts.tip;
const issue = {
  month,
  subject: line(ai.subject, 90) || `What’s on in Ghana: ${name}`,
  preheader: line(ai.preheader, 140) || `Festivals in ${facts.monthName}, what’s new on GhanaNice and a tip from a reader.`,
  headline: line(ai.headline, 100) || 'What’s on in Ghana this month.',
  intro: line(ai.intro, 600) || `Here is what’s coming up across Ghana in ${facts.monthName}, what we added to GhanaNice this month, one place worth the trip and a tip from a reader.`,
  sections: [
    { id: 'festivals', title: `Festivals in ${facts.monthName}`, items: festivalItems,
      empty: `None of the festivals on our list falls in ${facts.monthName}. See the whole year on ghananice.com/festivals.`,
      note: festivalItems.length ? 'Most festival dates are set each year by the chiefs and traditional councils who keep them, so treat these as approximate and check the festival page close to the time.' : '' },
    { id: 'new', title: 'New on GhanaNice', items: newItems,
      empty: 'Nothing new went up this month. Know a place we should add? Share it on GhanaNice.' },
    { id: 'place', title: 'One place worth the trip', items: [{
      meta: `${place.region} Region`, title: place.name, url: `/regions/${place.regionSlug}/`, text: line(ai.place, 400) || place.note }] },
    { id: 'tip', title: 'A tip from a reader', items: tip ? [{
      meta: [tip.region, tip.area].filter(Boolean).join(' · '), title: tip.place, url: tip.regionSlug ? `/regions/${tip.regionSlug}/` : '/',
      text: `“${tip.note}”${tip.by ? ` – ${tip.by}` : ''}` }] : [],
      empty: 'No new reader tips this month. Been somewhere good? Share it on GhanaNice and it could be here next month.' }
  ],
  used: { place: place.key, tipId: tip ? tip.id : '' }
};

const campaign = {
  name: `What’s on in Ghana – ${name}`,
  type: 'regular',
  emails: [{ subject: issue.subject, ...SENDER }],
  groups: [GROUP_ID]
};

return [{ json: { issue, campaign, aiProblem, name, reviewTo: REVIEW_TO, email: R.emailHtml(issue) } }];
