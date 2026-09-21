# Tip pipeline (n8n)

What happens after someone presses **Send the tip**. The site side is built; the n8n side is
still to be set up. Until `dist/config.js` has both URLs, the site runs in preview mode:
tips stay in the visitor's browser, and the form says so.

```
site form ──POST──▶ [1 Intake webhook] ─▶ store as "received" ─▶ thank-you email
                                              │
                                              ▼
                               [2 Enrich] Google Places lookup ─▶ store as "enriched"
                                              │
                                              ▼
                               [3 Review] you approve / reject ─▶ "published" (+ "it's live" email)
                                              │
region page ──GET ?region=slug──▶ [4 Directory webhook] ─▶ published rows for that region
```

## 1. Intake — `tipEndpoint`

`POST` with `Content-Type: application/json`. The site sends:

```json
{
  "id": "b0b8c246-040d-4331-a49f-a3092e903442",
  "submittedAt": "2026-09-21T15:37:54.568Z",
  "place": "Buka Restaurant",
  "location": "Osu, Accra",
  "kind": "Local business",
  "regionSlug": "greater-accra",
  "regionName": "Greater Accra",
  "note": "Great jollof",
  "photoUrl": "https://drive.google.com/…",
  "photoConsent": true,
  "submitter": { "name": "Ama Mensah", "email": "ama@example.com", "credit": true },
  "source": "index.html",
  "pageUrl": "https://…/index.html",
  "website": ""
}
```

- `kind` is `"Place"` or `"Local business"`. `regionSlug` can be empty ("we can work it out").
- `location` is free text: a town, a Google Maps link or a website.
- `photoUrl` is an optional link to a photo the sender took (Drive, Dropbox, Instagram…). Only use it when `photoConsent` is true, and credit the sender by name. Download and re-host it at review time; don't hot-link.
- `website` is a honeypot. If it is not empty, answer `200` and drop the tip.
- `id` is made in the browser. Use it as the record key, so a double-submit doesn't create two rows.
- Answer `2xx` once the tip is stored. Any other status makes the form show "didn't go through".
- CORS: the webhook must allow the site's origin (n8n Webhook node → Options → Allowed Origins).

Steps in the workflow:

1. **Webhook** (POST, respond via *Respond to Webhook*).
2. **Validate**: place, location, name and a well-formed email are present. Lower-case the email and cap text lengths.
3. **Store** the row with `status = received`. Anything works: n8n Data Tables, Google Sheets, Airtable or Supabase. Keep the email in its own column. It is never returned to the site.
4. **Respond** `200 {"ok": true}`.
5. **Thank-you email** (Gmail / SMTP / Resend node) to `submitter.email`: thank them by first name, name the place, say it'll be checked and listed in its region.

## 2. Enrich

Runs straight after intake (or on a schedule over `received` rows).

1. **Google Places API (New) → Text Search**:
   `POST https://places.googleapis.com/v1/places:searchText`
   body `{"textQuery": "<place>, <location>, Ghana", "regionCode": "GH"}`,
   header `X-Goog-FieldMask: places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.googleMapsUri,places.websiteUri,places.addressComponents,places.photos`.
   If `location` is a Google Maps link, pull the place name or coordinates out of it first.
2. **Pick the match.** Take the top result only if its name looks like `place`. Otherwise mark the row `needs_review` and don't guess.
3. **Work out the region.** If `regionSlug` is empty, map the result's `administrative_area_level_1` onto the 16 slugs in `dist/data.js`.
4. **Photo (optional).** Places photos need your API key on every request, so don't put the raw photo URL on the site. Either skip photos, or download one and re-host it (with its `authorAttributions`, which Google requires you to show).
5. **Store** `rating`, `reviewCount`, `address`, `mapsUrl`, `website`, `placeId`, `lat`, `lng` and `status = enriched`.

Google's terms don't allow storing most Places content long-term. You can keep the
`place_id` indefinitely, but refresh rating, review count etc. from it rather than treating
them as your own data. Check the current Places API policies before launch.

## 3. Review

Don't auto-publish. It's a public page and anyone can post the form. Two simple options:

- a Google Sheet or Data Table view where you set `status` to `published` or `rejected`, or
- an email to you with Approve / Reject links pointing at a second n8n webhook.

When a row becomes `published`, optionally send the submitter an "it's live" email with a link
to `region.html?r=<slug>`.

## 4. Directory — `directoryEndpoint`

`GET <directoryEndpoint>?region=<slug>` returns published rows for that region, newest first,
as a JSON array (or `{ "items": [...] }`). **Never include the email.**

```json
[
  {
    "id": "b0b8c246-040d-4331-a49f-a3092e903442",
    "place": "Buka Restaurant",
    "location": "Osu, Accra",
    "kind": "Local business",
    "note": "Great jollof",
    "submitterName": "Ama",
    "rating": 4.4,
    "reviewCount": 2310,
    "address": "10th Lane, Osu, Accra",
    "mapsUrl": "https://maps.google.com/?cid=…",
    "website": "https://…",
    "photoUrl": "https://…"
  }
]
```

`submitterName` is the first name, and only when `submitter.credit` was true. The region page
(`dist/region.js`) shows these rows with rating, credit and Map/Website links. It also shows
the visitor's own tips from this browser, marked "Waiting for review", until the same `id`
comes back published. Links that aren't `http(s)` and photos that aren't `https` are ignored.
Allow the site's origin for CORS here too.

## Switching it on

```js
// dist/config.js
window.GHANANICE_CONFIG = {
  tipEndpoint: 'https://<your-n8n>/webhook/ghananice-tip',
  directoryEndpoint: 'https://<your-n8n>/webhook/ghananice-directory'
};
```
