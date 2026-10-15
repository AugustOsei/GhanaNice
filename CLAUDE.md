# GhanaNice

A people-powered guide to good places across Ghana's 16 regions, "for locals and visitors alike". Owner: Augustine Osei (credited in the footer; writes The August Dispatch).

## Stack and layout
- Plain static site: HTML, CSS and vanilla JS. No framework. **Everything deployed lives in `dist/`.** The only generated pages are committed: the region pages and sitemap (`node tools/build_regions.mjs`), the About/Contact/Privacy pages (`node tools/build_pages.mjs`) and `credits.html`.
- Live at **https://www.ghananice.com** (apex `ghananice.com` 308-redirects to www). Deployed on Vercel from `main` (auto-deploys on push). `vercel.json` sets `outputDirectory: "dist"`. Without it Vercel served the repo root and returned 404.
- Local preview: `.claude/launch.json` → `python3 -m http.server 4173 --directory dist`.
- Cache-busting is manual: bump `?v=N` on the `<link>` / `<script>` tags in `index.html`, `tools/region-template.html` and `tools/page-template.html` (then rebuild those pages) and `travel-directory.html` (and `credits.html`/`404.html` for CSS) when changing CSS or JS, and the matching pins in `tools/smoke.mjs`, which Vercel runs as the build. `vercel.json` caches CSS/JS for a day and `/assets/` for 30 days, so give a changed photo a new filename rather than overwriting it.
- Photos in `assets/real/` have `-400/-800/-1200.webp` copies made by `tools/media/resize_local.py` (cards, tiles, heroes). Pages use the copies; the lightbox and CREDITS.md use the originals. Re-run it after adding a photo there.
- `dist/credits.html` is generated from `assets/CREDITS.md` by `tools/media/build_credits.py`. Re-run after editing the credits.

| File | What it is |
|---|---|
| `dist/index.html` + `app.js` | Landing page: masked-map hero reel → video, region card field (one screen, lift/two-tap; no longer scroll-driven), 2025 most-visited flip cards, community wall, tip form |
| `dist/regions/<slug>/index.html` + `region.js` | The 16 region pages, **generated** by `tools/build_regions.mjs` from `tools/region-template.html`, `data.js` and `media.js` (also writes `dist/sitemap.xml`). Hero, facts, photo mosaic, place cards, head tags and TouristDestination structured data are in the HTML; `region.js` adds the lightbox, the community wall (approved tips from `data/listings.json`) and nav colour. Re-run the builder after editing the data or template: `tools/smoke.mjs` fails on a stale page. Paths in these pages are root-relative. `vercel.json` 301s `region.html?r=<slug>` here and sets `trailingSlash: true` |
| `dist/about/`, `dist/contact/`, `dist/privacy/` | The plain pages, **generated** by `tools/build_pages.mjs` from `tools/page-template.html` and `tools/pages/*.html` (each starts with a JSON comment: path, title, description). Same nav and footer as the region pages; `page.js` runs the menu. The privacy page describes exactly what the forms, n8n workflows and analytics do: update it (and its date) when any of that changes. `tools/smoke.mjs` fails on a stale page |
| `dist/consent.js` | Cookie notice. Google Analytics (G-07N1MXC0Q9) loads only after Accept; the choice is in `localStorage` (`ghananice:analytics`); any `[data-cookie-settings]` element reopens it. No page may load gtag directly (smoke checks) |
| `dist/data.js` | `GHANA_REGIONS` (copy, places) and `GhanaTips` (tip storage and submission) |
| `dist/media.js` | **Generated** by `tools/media/build_media.py`. Don't hand-edit |
| `dist/travel-directory.html` + `travel-directory.js` + `travel-directory.css` | Travel directory: rope-drawing hero, category cards + Category/Region filters, featured profiles, all services, "list your service" form |
| `dist/travel-directory-data.js` | The curated starting listings (`GHANA_TRAVEL_SERVICES`) |
| `dist/data/service-submissions.json` | Approved submitted listings. **Written by the n8n service workflow** through commits on `main` |
| `dist/config.js` | `tipEndpoint` / `directoryEndpoint` / `serviceSubmissionEndpoint` for n8n (blank = preview mode, drafts stay in the browser) |
| `dist/footer.js` | WebGL water animation over the engraved Volta footer |
| `dist/assets/CREDITS.md` | Credits for every image. Keep it complete |
| `docs/design-guideline.md` | Voice, visual and content rules. Read before changing UI or copy |
| `docs/tip-pipeline.md` | Contract for the active n8n tip intake, enrichment, review and publishing workflow |
| `docs/travel-directory.md`, `docs/service-directory-pipeline.md` | Listing standard for the travel directory, and the contract for its n8n intake workflow (`n8n/build_service_workflow.py` rebuilds and redeploys it) |

## Rules
- Imagery must show real named places in the region it's filed under. Credit every photo (author, licence, source). Generated media may change atmosphere but must not invent landmarks.
- Copy: plain, warm, accurate. Don't claim content the site doesn't have (we removed "workshops" and "there is room").
- The cards look like postcards but the copy calls them regions.
- Respect `prefers-reduced-motion`. Keep keyboard and screen-reader paths working.

## Open items (the one working list, updated 2026-10-14; work top to bottom)
Done 2026-10-14: placeholder "found it nice" counts hidden (votes are still browser-only; `niceCount` stays in the tip data); unused `independence-arch-storm.jpg` removed; code/behaviour/performance audit run, and its quick fixes made (directory listing clicks no longer change the filter, the home page only downloads the hero landmark it lands on, community wall reworded, "Leave a tip" footer link, cleanups); the 16 regions turned into static pages at `/regions/<slug>/` (see the file table); `https://www.ghananice.com/sitemap.xml` submitted in Google Search Console (Domain property, so it needs the full URL) and read successfully.

**Next**
1. Photos: 9 places still lack one (Arts Centre, Assin Manso, Fort San Antonio (Axim), Bunso, Daboya, Nandom, Nkwanta, Fuller Falls, Kenyasi). The Ahafo, Oti, Bono and Western North galleries are thin (3–5 photos).
2. Performance: phones download ~3 MB on a first home visit, 1.2 MB of it the hero loop video (make smaller phone encodes). The travel-directory pencil grain reseeds ~6×/s and the footer water runs at full frame rate while visible (slow both).

**Waiting on others**
3. Most-visited ranks 6–10 have no published 2025 figures (only the top five were reported). Replace when the full GTA 2025 report is online.
4. Manhyia Palace Museum's official site (linked on the Ashanti page) returned a server error on 2026-10-14. Recheck; swap to Wikipedia if it stays down.

Reference: the n8n tip pipeline is active (`docs/tip-pipeline.md`). Photos total ~57 MB (1600px + 800px WebP); pages load 800px, the lightbox 1600px.

## Planned features (agreed 2026-10-14, after the open items above are cleared)
1. **Travel directory**: done (`travel-directory.html`).
2. **History of Ghana**: an immersive, scroll-led story page. Not photos or photorealism. The look is illustrated and layered, like paper-cut scenes (parallax layers of cut-paper shapes and textures) that move, assemble and change as the reader scrolls, with short captions telling the story. Rough eras: early peoples and states (Bono, Dagbon, Mamprugu), Asante, coast trade and the forts/castles and the slave trade, colonial Gold Coast, the road to independence (6 March 1957), the republic today. Illustrations may be stylised but must stay historically accurate: no invented events, landmarks or symbols. Cite sources. Needs a reduced-motion version (static scenes plus text) and must read fully with a screen reader.
3. **Cultural calendar**: national holidays and key festivals and events through the year, month by month, each linked to its region (e.g. Homowo, Aboakyere, Hogbetsotso, Damba, Kundum, Chale Wote, PANAFEST / Emancipation Day). Mark dates that move each year (lunar, traditional-council set) as approximate and say who sets them.
