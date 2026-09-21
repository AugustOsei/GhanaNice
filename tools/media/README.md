# Media tooling

These scripts produced `dist/media.js` (region galleries, place-card photos and links), the photos in `dist/assets/photos/` and the footer engraving. They aren't part of the site. Nothing here is deployed.

Setup: `python3 -m venv venv && ./venv/bin/pip install pillow numpy scipy`

| File | Role |
|---|---|
| `wm.py` | Wikipedia / Wikidata / Commons API helpers (rate-limited; sleeps between calls) |
| `titles.py`, `resolved.json` | Place name → Wikipedia title, plus Wikidata image, website and Commons category |
| `gather.py` | Collects candidate Commons files per place (`places`) or per region (`gallery`) |
| `sheet.py` | Builds numbered contact sheets so picks can be made by eye |
| `manifest.json` | **Source of truth**: chosen `cards` (place → file), `gallery` (region → files), `leads`, and per-file credit metadata |
| `captions.json` | Hand-written caption per Commons file (overrides the Commons description) |
| `visitghana.txt` | Visit Ghana (tourism authority) pages checked to load, per place |
| `mv.json` | Credits for the most-visited flip-card photos (`dist/assets/photos/mv-*.webp`) |
| `build_media.py` | Writes `dist/media.js` from the files above. Deterministic |
| `engrave.py` | Turns a photo into the blue line engraving and water mask used by the footer |

## Rules we kept
- A photo goes under a region only if it shows a named place **inside** that region. Check the Commons description, because titles are often wrong. Real examples we caught: a "Fort San Antonio" in Manila, a "Banda Nkwanta" mosque filed under Oti.
- Every photo keeps author, licence, licence URL and source page. Region pages display them.
- Download Commons thumbnails at standard widths (e.g. 960, 1280). Non-standard widths get rate-limited (HTTP 429). Download one file at a time with pauses, and never reuse the previous response when a retry fails.
- After changing picks: run `build_media.py`, then add or refresh rows in `dist/assets/CREDITS.md`.
