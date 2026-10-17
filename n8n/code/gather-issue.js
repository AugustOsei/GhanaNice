// Gather the facts for next month's issue from what is already published on the site, and ask
// Claude for the short connecting copy only: every name, date and link below comes from the data.
// GhanaNiceNewsletter (tools/newsletter-render.js) is pasted in above this by the builder.
const DAY = 864e5;
const R = GhanaNiceNewsletter;

/* The test webhook posts the site's data in its body; the schedule fetches it from the site. */
let posted = null;
try { posted = $('Run now').first().json.body; } catch { posted = null; }
const pick = (name, key) => posted ? posted[key] : $(name).first().json;
const source = pick('Site data', 'source');
const tipsFile = pick('Tips', 'tips') || {};
const servicesFile = pick('Services', 'services') || {};
const pastFile = pick('Past issues', 'issues') || {};

const now = posted?.now ? new Date(posted.now) : new Date();
const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
const monthIndex = next.getUTCMonth();
const month = `${next.getUTCFullYear()}-${String(monthIndex + 1).padStart(2, '0')}`;
const monthName = R.MONTHS[monthIndex];
const since = new Date(now.getTime() - 35 * DAY);
const past = pastFile.issues || [];
const usedPlaces = new Set(past.map(i => i.used?.place).filter(Boolean));
const usedTips = new Set(past.map(i => i.used?.tipId).filter(Boolean));
const regionName = Object.fromEntries(source.places.map(p => [p.regionSlug, p.region]));

/* Festivals that fall next month, and the Akwasidae Sundays (every 42 days from its anchor). */
const festivals = source.festivals.filter(f => !f.recurring && f.month === monthIndex)
  .map(f => ({ slug: f.slug, name: f.name, region: f.region, when: f.when, place: f.place, keeper: f.keeper, sum: f.sum, dateSetBy: f.dateSetBy, kind: f.kind }));
const akwasidae = source.festivals.filter(f => f.recurring).map(f => {
  const [y, m, d] = f.recurring.anchor.split('-').map(Number);
  const dates = [];
  for (let t = Date.UTC(y, m - 1, d); t < Date.UTC(next.getUTCFullYear(), monthIndex + 1, 1); t += f.recurring.days * DAY) {
    const date = new Date(t);
    if (date.getUTCMonth() === monthIndex && date.getUTCFullYear() === next.getUTCFullYear()) dates.push(`Sunday ${date.getUTCDate()} ${monthName}`);
  }
  return { slug: f.slug, name: f.name, region: f.region, place: f.place, sum: f.sum, dates };
}).filter(f => f.dates.length);

/* What was added in the last five weeks. */
const recent = value => value && new Date(value) >= since;
const newFestivals = source.festivals.filter(f => recent(f.added)).map(f => f.name);
const newTips = (tipsFile.listings || []).filter(t => recent(t.publishedAt))
  .map(t => ({ id: t.id, place: t.place, area: t.area, regionSlug: t.regionSlug, region: regionName[t.regionSlug] || '', category: t.category || '', note: t.note || '' }));
/* A published service carries the day it was checked ("16 Oct 2026"), which is when it went up. */
const newServices = (servicesFile.services || []).filter(s => recent(s.checked))
  .map(s => ({ name: s.name, category: s.categoryLabel || s.category, base: s.base || '', description: s.description || '' }));

/* One place worth the trip: a different one each month, never one used before. */
const fresh = source.places.filter(p => !usedPlaces.has(p.key));
const pool = fresh.length ? fresh : source.places;
const place = pool[((next.getUTCFullYear() * 12 + monthIndex) * 7) % pool.length];

/* A tip from a reader: the newest approved tip with something to say, not used before. */
const tip = (tipsFile.listings || []).filter(t => (t.note || '').trim().length >= 20 && !usedTips.has(t.id))
  .sort((a, b) => String(b.publishedAt).localeCompare(String(a.publishedAt)))[0] || null;
const tipFacts = tip && { id: tip.id, place: tip.place, area: tip.area, regionSlug: tip.regionSlug, region: regionName[tip.regionSlug] || '', note: tip.note, by: tip.submitterName || '' };

/* The featured tip isn't listed again under New on GhanaNice. */
const newTipsShown = tipFacts ? newTips.filter(t => t.id !== tipFacts.id) : newTips;
const facts = { month, monthName, year: next.getUTCFullYear(), festivals, akwasidae, newFestivals, newTips: newTipsShown, newServices, place, tip: tipFacts };

const system = `You write "What's on in Ghana", GhanaNice's monthly email (ghananice.com, a people-powered guide to good places across Ghana's 16 regions, for locals and visitors alike). Voice: plain, warm, specific and accurate. Concrete nouns, short sentences, no hype, no exclamation marks, no clichés ("vibrant", "rich tapestry", "hidden gem", "immerse", "journey"). British spelling.
Use ONLY the facts you are given. Never add a date, place, custom, number or claim that is not in the facts. Festival dates move from year to year, so never state an exact date for a festival unless it appears in the facts.
Reply with one JSON object and nothing else.`;
const ask = `Facts for the ${monthName} ${facts.year} issue:
${JSON.stringify(facts, null, 1)}

Return JSON with exactly these keys:
- "subject": email subject, at most 60 characters, naming one or two of next month's festivals if there are any.
- "preheader": one sentence, at most 100 characters.
- "headline": a short line for the top of the issue, at most 70 characters, ending with a full stop.
- "intro": two or three sentences opening the issue.
- "festivals": an object mapping each festival slug (including Akwasidae's, if listed) to one sentence (at most 28 words) on what happens or why to go, drawn from its facts.
- "newFestivals": one sentence about the festivals added this month, or "" if newFestivals is empty.
- "place": one or two sentences on why the place is worth the trip, drawn from its note.`;

return [{ json: {
  facts, month,
  claudeRequest: { model: 'claude-opus-5-5', max_tokens: 8000, system, messages: [{ role: 'user', content: ask }] }
} }];
