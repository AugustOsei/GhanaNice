# Travel-service submission pipeline (n8n)

The public service form lives at `/list-your-service/` and sends requests to the existing
`GhanaNice — Travel services` workflow at `POST /webhook/ghananice-service`.
It deliberately shares the broad shape of the place-tip flow—
receive, store, acknowledge, review, publish, notify—but keeps the business contract separate.

```text
service form → validate → Services sheet → thank submitter → email August for a decision
                                                               │
                         reject / expiry ←──────────────────────┤
                                                               ▼ approve
                       email submitter ← publish standard JSON listing → Vercel deploy
```

## What is checked automatically

- The honeypot is empty; bot-looking submissions get a harmless `200` and are discarded.
- Required fields are present and within length limits.
- Category and primary region are values the directory supports.
- The link (the business's website, or one Instagram or Facebook page) is a public `https://` URL,
  not localhost or a private-network address.
- The email has a plausible address shape.
- The submitter confirms that they run or represent the service.
- A matching submitted business name or link is flagged as a possible duplicate. Websites are
  compared by domain; social pages by domain and page name, so two Instagram pages do not collide.

These checks make the intake usable; they do not establish that a business is safe, licensed or
trustworthy.

## What August checks before approval

1. The website or social page is the business's own current public source and identifies the
   submitted business.
2. The business actually offers a travel-relevant service in Ghana.
3. The name, category, base, claimed coverage and short description match that public source.
4. The named representative can be contacted and appears authorised to request the listing.
5. The business is not already listed under the same name or link.
6. The wording is factual and does not make unsupported safety, quality or endorsement claims.

Approval publishes the smallest useful standard record: business name, category, base, primary
region, coverage, description, link and review date (stored, not shown on the page). A directory listing is not a
GhanaNice guarantee of service, safety, licensing or availability.

## Standard and featured requests

`listingType: standard` follows the normal review above. `listingType: featured` adds a visible
note to the approval email and the Services sheet, but the Approve button still publishes only the
standard record. Featured placement requires a separate conversation and agreement covering:

- price and payment terms;
- placement start date, duration and expiry/renewal;
- the supplied logo, cover and gallery images;
- permission to display those assets and the required credits;
- the final profile copy and the `Sponsored` label.

No payment is taken by the form and selecting featured interest creates no commitment.

## Records and states

The workflow uses the `Services` tab in the existing GhanaNice intake spreadsheet. Typical states
are `received`, `waiting for review`, `featured interest: waiting for review`, `published`,
`rejected`, and `expired: no answer in 30 days`.

Approved entries are appended to `dist/data/service-submissions.json` through one GitHub commit on
`main`; Vercel then deploys the updated file. Duplicate approvals are idempotent by listing id and
link. Sender email and phone remain in the private sheet and are never written to the
public JSON.

The generated workflow is `n8n/ghananice-services.json`. Rebuild or update it with:

```sh
python3 n8n/build_service_workflow.py
```
