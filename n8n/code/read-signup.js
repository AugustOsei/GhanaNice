// Validate a newsletter sign-up from the site's own forms. A filled honeypot is a bot: it gets
// a harmless "ok" and nothing is stored. Only the email, the form it came from and the page
// path go any further.
const GROUP_ID = '201520530803656462'; // MailerLite group "GhanaNice newsletter"
const SOURCES = ['footer', 'festival', 'home', 'newsletter', 'popup'];

const raw = $input.first().json.body && typeof $input.first().json.body === 'object' ? $input.first().json.body : {};
const text = (value, max) => String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
if (text(raw.website, 100)) return [{ json: { verdict: 'drop' } }];

const email = text(raw.email, 180).toLowerCase();
if (!/^[^\s@]+@[^\s@.]+(\.[^\s@.]+)*\.[a-z]{2,}$/i.test(email)) {
  return [{ json: { verdict: 'reject', reason: 'email' } }];
}
const source = SOURCES.includes(raw.source) ? raw.source : 'footer';
/* A path on ghananice.com only: never a query string, which could carry personal data. */
let page = text(raw.page, 200);
page = /^\/[\w\-./]*$/.test(page) ? page : '';

return [{ json: {
  verdict: 'ok',
  subscriber: { email, groups: [GROUP_ID], fields: { signup_source: source, signup_page: page } }
} }];
