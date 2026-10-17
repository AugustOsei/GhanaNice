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

## The monthly issue (phase 2, live)

n8n workflow **"GhanaNice — Newsletter issue"**, built by `n8n/build_newsletter_issue_workflow.py`.

```text
24th of the month, 09:00 Accra
  → read the site's data: /data/newsletter-source.json, /data/listings.json,
    /data/service-submissions.json, /data/newsletter-issues.json
  → Gather issue: next month's festivals (+ Akwasidae Sundays, every 42 days from its anchor),
    what went up in the last 5 weeks, one place worth the trip, the newest unused reader tip
  → Claude writes the short copy around those facts (subject, preheader, headline, intro,
    one line per festival, the place)          ← if its reply is unusable, the data's own wording is used
  → Assemble issue → MailerLite draft campaign (subject, hello@ghananice.com, the group; no body)
  → email August the issue laid out to paste into the draft
  → second email, "Publish the <month> issue on the site?" (waits up to 30 days)
      Sent: publish it → one commit on main: tools/newsletter/<yyyy-mm>.json,
                         dist/newsletter/<yyyy-mm>/index.html, dist/newsletter/index.html,
                         dist/data/newsletter-issues.json, dist/sitemap.xml → email "Published"
      Don't publish   → nothing
```

**Why the body is pasted by hand:** MailerLite's API only accepts email content on its paid
Advanced plan. On the free plan the workflow creates the draft with subject, sender and group,
and August pastes the issue into MailerLite's editor (the first time pick a simple layout; after
that, duplicate last month's campaign and swap the text). Edits made in MailerLite don't flow back
to the site page, which is published from the drafted issue; edit `tools/newsletter/<month>.json`
and run `node tools/build_newsletter.mjs` if the site version should change.

**Accuracy rules:** every name, date and link comes from the site's data; Claude only writes
connecting copy and is told not to add facts or exact festival dates. Festival dates are shown as
the festival page gives them ("Usually the first Saturday of November") with a note that dates
are set each year by the chiefs and traditional councils. Akwasidae's Sundays are computed and
carry "check with Manhyia Palace". More than four new festivals collapse into one item. A place or
tip used in an earlier issue isn't used again (`used` in each issue). A tip needs at least 20
characters of note to be featured.

**Shared renderer:** `tools/newsletter-render.js` renders the issue page, the archive, the sitemap
entries and the paste-ready email. `tools/build_newsletter.mjs` uses it to write the pages, and the
builder pastes it into the workflow's Code nodes, so a page committed by n8n is byte-for-byte what
the builder writes and smoke's `--check` passes. The newsletter URLs are the last entries in the
sitemap, so the workflow appends a new issue just before `</urlset>`.

**Site data the workflow reads:** `node tools/build_newsletter.mjs` writes
`dist/data/newsletter-source.json` (festivals from `tools/festivals/*.json`, places from `data.js`)
and `dist/data/newsletter-issues.json`. Re-run it after changing festivals, places or the page
template (smoke fails if it is stale). New festivals need an `added` date (YYYY-MM-DD) for
"New on GhanaNice".

**Testing:** `python3 n8n/build_newsletter_issue_workflow.py --test` adds a "Run now" webhook that
takes `{source, tips, services, issues}` in its body (the four files) and prints its URL; rebuild
without `--test` afterwards. Delete the test draft in MailerLite and the waiting execution in n8n.

**Depends on:** Vercel deploying pushes to `main` automatically (the publish step is a commit).
