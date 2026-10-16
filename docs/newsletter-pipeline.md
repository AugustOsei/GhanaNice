# Newsletter pipeline: "What's on in Ghana" (MailerLite + n8n)

One email a month: next month's festivals, what's new on GhanaNice, one place worth the trip and
a tip from a reader. MailerLite keeps the list and sends the email; n8n connects the site to it.

## Sign-ups (phase 1, live)

```text
site form (newsletter.js) → POST JSON → n8n "GhanaNice — Newsletter signup"
  → honeypot / email check → look up the address in MailerLite
  → upsert into the group "GhanaNice newsletter" → { ok: true } → "Check your inbox to confirm."
                                     └→ MailerLite emails the confirmation link (double opt-in)
```

- **Endpoint:** `POST https://n8n.augustwheel.com/webhook/ghananice-newsletter`, set as
  `newsletterEndpoint` in `dist/config.js`. Blank = preview mode: the forms say so and send nothing.
- **Body:** `{ email, source, page, website }`. `source` is `footer | festival | home | popup`;
  `page` is `location.pathname` only (never a query string); `website` is the honeypot.
- **Answers:** `200 {ok:true}` (also for a filled honeypot, which is silently dropped),
  `400 {ok:false,error:"email"}`, `502 {ok:false,error:"server"}`. CORS allows
  www.ghananice.com, ghananice.com and localhost/127.0.0.1:4173.
- **Status rule:** new, unconfirmed and unsubscribed addresses are sent with
  `status: "unconfirmed"`, which is what makes MailerLite send its confirmation email (with only the
  dashboard setting on, a new API subscriber came in as active). An address that is already
  active (or bounced/junk) keeps its status and is only added to the group, so signing up twice
  never un-confirms anyone.
- **Fields stored in MailerLite:** email, `signup_source`, `signup_page` (custom fields).
- **Privacy:** successful executions are not saved in n8n (they would hold the email). The
  privacy page's "The newsletter" section describes all of this; update it if the flow changes.
- **MailerLite IDs:** group `201520530803656462` ("GhanaNice newsletter"), n8n credential
  "GhanaNice — MailerLite" (header auth, created by the builder from `MAILERLITE_API_KEY` in
  `.env.local`).

Rebuild and redeploy the workflow with:

```sh
python3 n8n/build_newsletter_signup_workflow.py
```

### Dashboard settings (the API can't change these)

1. **Account settings → Subscribe settings → "Double opt-in for API and integrations": on.**
2. Same page, the API confirmation email: sender `hello@ghananice.com`, name GhanaNice.
   (Editing its wording needs a paid plan.)
3. **Welcome email** (MailerLite's API can only create an empty draft automation): Automations →
   Create → trigger "When subscriber joins a group" → GhanaNice newsletter → one email, from
   hello@ghananice.com. Suggested copy:
   *Subject:* You're in: What's on in Ghana
   *Body:* Thanks for confirming. Once a month, near the end of the month, we'll send you the
   festivals coming up, new places on GhanaNice and a tip from a reader. Until then:
   [the festivals](https://www.ghananice.com/festivals/) · [all 16 regions](https://www.ghananice.com/#regions).
   Every email has an unsubscribe link. — Augustine, GhanaNice

### The forms

`dist/newsletter.js` fills every `[data-newsletter]` element: the footer on every page
(`data-newsletter="footer"`), a band at the end of each festival page and the festivals list
(`festival`), and a band under the home page festivals (`home`). `tools/smoke.mjs` checks every page
with the site footer has the form and loads `newsletter.js` and `config.js`.

The slide-in card (`popup`) is a small fixed card, never a modal: it never appears on the first
page of a visit (sessionStorage page count); from the second page it appears at 70% scrolled or
after 8 seconds, not while another sign-up form is on screen or someone is typing in a form, at
most once per visit, never after signing up, and not for 60 days after it is closed
(`localStorage` `ghananice:newsletter`). Esc or × closes it. On phones it is a short strip and
the page gets matching bottom padding, so it never hides content. Reduced motion: no slide.

## The monthly issue (phase 2)

Not built yet. Plan: an n8n workflow around the 24th gathers next month's festivals
(`tools/festivals/*.json` from GitHub, Akwasidae every 42 days from its anchor), what was added in
the last month, one place from `data.js` and an approved tip; drafts the issue with the Anthropic
credential in the GhanaNice voice; creates a **draft** campaign in MailerLite for the group (never
sends) and emails August to review, edit and schedule it there. Once sent, the issue is published
on the site at `/newsletter/<yyyy-mm>/` with a `/newsletter/` archive.
