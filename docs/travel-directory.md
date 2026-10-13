# Travel directory

The public page is `dist/travel-directory.html`. Its curated starting entries live in
`dist/travel-directory-data.js`; descriptions should come from a provider's official site or
a relevant public authority, and every entry needs a current `checked` date.

## Listing standard

- Use the provider's public trading name and an HTTPS link: its own website, or one Instagram or
  Facebook page if it has no website. The page labels every such link simply “Link”.
- Describe only services the provider currently publishes.
- Record the base and service regions without implying that the business has an office in
  every region it serves. Use `regions: ['all']` only for genuinely nationwide coverage.
- A listing is not a safety guarantee or paid endorsement. Do not use “verified” or “trusted.”
- Recheck entries periodically and remove services whose official details can no longer be
  confirmed.

## Featured placement

The directory has two display levels. Every approved provider appears in the compact “All services”
index with its name, base, short description, category and official link visible. Coverage stays in
the source data for filtering and search, but it is not repeated as a separate visual column. Any
number of businesses can also buy a richer featured profile; there is no one-per-category quota.

Featured businesses appear in a paged shelf: four profiles at a time on wider screens and two in one
row on phones. Twenty advertisers therefore occupy five desktop pages or ten phone pages without
creating a long strip or a tall stack. The initial order is shuffled on each page load rather than
permanently giving one advertiser the first position; category and region filters still apply. The
richer description, gallery, coverage and official link live inside the profile dialog.

Each business can be shared directly. Supporting phones use the system share sheet; other browsers
copy a business-specific GhanaNice URL. Opening a shared featured-business URL opens its profile,
while a standard listing URL moves the reader to that entry.

Each featured business supplies a square cover image or logo plus gallery images and grants GhanaNice
permission to display them. Record the permission or open licence in CREDITS.md. Label paid cards
“Sponsored”, keep the ordinary index complete, and do not imply that payment is a GhanaNice safety
endorsement. The current local prototype uses openly licensed photographs and labels the examples as
previews; Jolinaiko remains standard because its official gallery forbids reuse without permission.

## Business submissions

`dist/config.js` points `serviceSubmissionEndpoint` at the separate `ghananice-service` n8n
webhook. It must not point to the place-tip webhook: business submissions have their own fields,
review standard, emails and publishing path. When the endpoint is blank, the form calls itself a
draft and saves up to ten drafts in that browser only.

When connected, the form sends JSON:

```json
{
  "id": "uuid",
  "submittedAt": "2026-10-12T12:00:00.000Z",
  "businessName": "Example Tours",
  "category": "tours",
  "primaryRegion": "volta",
  "baseLocation": "Ho, Volta Region",
  "website": "https://example.com/",
  "coverage": "Volta and Oti regions",
  "description": "Guided hiking and cultural day trips.",
  "listingType": "featured",
  "contactName": "Ama",
  "email": "ama@example.com",
  "phone": "+233 …",
  "consent": true,
  "source": "travel-directory.html"
}
```

The active workflow stores the submission in the `Services` sheet, thanks the sender, emails
August an Approve/Reject decision, and publishes an approved **standard** listing to
`dist/data/service-submissions.json`. The page reads that file alongside the curated starting
entries. It never publishes at intake.

Selecting `featured` records commercial interest only. Approval still publishes the conservative
standard listing. Pricing, placement duration, start/end dates, supplied images and permission to
display them must be agreed personally before the record is upgraded to a sponsored profile.

See `docs/service-directory-pipeline.md` for the exact automated and manual checks.
