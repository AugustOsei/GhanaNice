# GhanaNice

A people-powered guide to good places across Ghana's 16 regions, "for locals and visitors alike". Owner: Augustine Osei (credited in the footer; writes The August Dispatch).

## Stack and layout
- Plain static site: HTML, CSS and vanilla JS. No framework, no build. **Everything deployed lives in `dist/`.**
- Live at **https://www.ghananice.com** (apex `ghananice.com` 308-redirects to www). Deployed on Vercel from `main` (auto-deploys on push). `vercel.json` sets `outputDirectory: "dist"`. Without it Vercel served the repo root and returned 404.
- Local preview: `.claude/launch.json` → `python3 -m http.server 4173 --directory dist`.
- Cache-busting is manual: bump `?v=N` on the `<link>` / `<script>` tags in `index.html` and `region.html` when changing CSS or JS.

| File | What it is |
|---|---|
| `dist/index.html` + `app.js` | Landing page: masked-map hero reel → video, region card deck (scroll-driven, lift/two-tap), 2025 most-visited flip cards, community wall, tip form |
| `dist/region.html` + `region.js` | One template for all regions (`?r=<slug>`): hero, facts, photo mosaic + lightbox, place cards with links, businesses, community wall, tip form |
| `dist/data.js` | `GHANA_REGIONS` (copy, places) and `GhanaTips` (tip storage and submission) |
| `dist/media.js` | **Generated** by `tools/media/build_media.py`. Don't hand-edit |
| `dist/config.js` | `tipEndpoint` / `directoryEndpoint` for n8n (blank = preview mode, tips stay in the browser) |
| `dist/footer.js` | WebGL water animation over the engraved Volta footer |
| `dist/assets/CREDITS.md` | Credits for every image. Keep it complete |
| `docs/design-guideline.md` | Voice, visual and content rules. Read before changing UI or copy |
| `docs/tip-pipeline.md` | Contract for the (not yet built) n8n tip intake, enrichment and directory |

## Rules
- Imagery must show real named places in the region it's filed under. Credit every photo (author, licence, source). Generated media may change atmosphere but must not invent landmarks.
- Copy: plain, warm, accurate. Don't claim content the site doesn't have (we removed "workshops" and "there is room").
- The cards look like postcards but the copy calls them regions.
- Respect `prefers-reduced-motion`. Keep keyboard and screen-reader paths working.

## Open items (as of 2026-09-21)
- Share tags use absolute `https://www.ghananice.com/og-image.jpg`. The home page has a canonical link. `robots.txt` and `sitemap.xml` (home + 16 `region.html?r=` URLs) are in `dist/`. Submit the sitemap in Google Search Console.
- n8n pipeline not built. See `docs/tip-pipeline.md`. The "found it nice" counts on the landing wall are placeholders.
- Most-visited ranks 6–10 have no published 2025 figures yet (only the top five were reported). Replace when the full GTA 2025 report is online.
- 9 places still lack photos: Arts Centre, Assin Manso, Fort San Antonio (Axim), Bunso, Daboya, Nandom, Nkwanta, Fuller Falls, Kenyasi. Ahafo, Oti, Bono and Western North galleries are thin (3–5 photos).
- `dist/assets/real/independence-arch-storm.jpg` is no longer used.
- Photos total ~57 MB (1600px + 800px WebP). Pages load the 800px versions, and the lightbox loads 1600px.
- Planned next: full code/behaviour/performance audit and an SEO audit. **Main SEO gap:** `region.html` renders from `?r=` with JS. `region.js` sets title, description, canonical and og tags per region as a stopgap, but the 16 regions should become real static pages (e.g. `/regions/volta/`) with their own head tags and content in the HTML, plus redirects from `region.html?r=`, updated internal links and sitemap, and structured data (TouristDestination / Place).
