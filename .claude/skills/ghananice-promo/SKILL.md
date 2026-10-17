---
name: ghananice-promo
description: Make a promotional motion clip (social video ad) for GhanaNice in motion/ with Remotion. Use when August asks for a promo, ad, reel, clip, motion graphic or video for the site, a section of it (festivals, regions, travel directory) or the newsletter.
---

# GhanaNice promo clips

Clips live in `motion/` (Remotion 4, React). Read `CLAUDE.md`, `docs/design-guideline.md` and
`motion/README.md` first, and look at the earlier clips' source in `motion/src/` to reuse their
pieces. The clips are not part of the website: Vercel only deploys `dist/`.

## 1. Ask before building (one AskUserQuestion)
- **Format:** 4:5 1080×1350 (feed; the default so far), 9:16 1080×1920 (Reels/TikTok/Shorts), 16:9.
- **Length:** about 20–26 s has worked.
- **Voice:** text only so far (most people watch muted).
- **Music:** render silent; August adds a track in the app.

## 2. Story: welcome first, then the news, then the ask
A first-time viewer must know what GhanaNice is before the clip shows a feature (August's
feedback on the festivals clip, 2026-10-17). The shape that worked:
1. **Welcome (~5 s):** "Ghana is *nice.*", a few postcards of real places from different regions,
   and the site's own description ("GhanaNice is a people-powered guide to good places, food,
   craft and experiences across Ghana's sixteen regions." / "For locals and visitors alike").
2. **The news:** a red "New on GhanaNice" stamp and the section's name.
3. **Show it:** rebuild the section's own look in Remotion (not just screenshots): the same
   colours, type, cut-outs, tiles. Big type that reads on a phone.
4. **The ask:** one clear call to action with the URL, held for the last ~2 s
   (e.g. ghananice.com/newsletter, "or the sign-up at the foot of every page").

## 3. Content rules (from the site's rules)
- Only wording that is already on the site, or plain labels. Never claim what the site doesn't have.
- Every photo is a real named place or event, from the site (`dist/`), credited on screen
  (author · licence) and in `motion/SOURCES.md`. Generated media must not invent landmarks.
- Festival dates move: say "usually in May", never exact dates.
- Copy photos into `motion/public/<clip>/`; use the site's captions (from `tools/festivals/*.json`,
  `dist/media.js`) rather than writing new ones.

## 4. Build
- New composition per clip in `src/Root.tsx`; source in `src/<clip>/`; add a
  `render:<clip>` script to `motion/package.json` and a section to `motion/README.md`.
- Brand: `src/brand.ts` (bone `#f1eee5`, ink `#11110f`, red, yellow, green, lilac; Arial 900 +
  Georgia italic). Reusable pieces: `src/festivals/parts.tsx` (taped `Print`, paper `Cutout`s with
  the white cut edge, split-flap `Flaps`, the newsletter `Drums`, `grain()` paper texture) and
  `src/festivals/Intro.tsx` (the welcome); the yarn, pencil filter and star in `src/components/`.
- Chain scenes with `<Sequence>`; each scene uses its own local frame.

## 5. Check, then show
- Quick draft: `npx remotion render src/index.ts <Id> out/<clip>/draft.mp4 --scale=0.5`, then a
  contact sheet: `ffmpeg -i draft.mp4 -vf "select='eq(n\,30)+eq(n\,120)+…',scale=300:-1,tile=5x2" -frames:v 1 -vsync vfr sheet.jpg`
  and Read it. Fix overflowing text and empty frames before rendering in full.
- Final: `npm --prefix motion run render:<clip>`, then
  `python3 motion/tools/check_flicker.py motion/out/<clip>.mp4` must say "none".
- **Known render pitfalls:**
  - Several tabs at once made Chrome capture half-drawn/tiled frames, so `remotion.config.ts` sets
    concurrency 1. Don't raise it.
  - Rendering uses the installed Chrome (Remotion's own crashes on the space in "Ghana Nice").
  - Avoid `clip-path` + `perspective` + `backface-visibility` on elements at rest: Chrome drops
    them on random frames. Only the moving part of a flip gets 3D styles.
- Send the mp4 with SendUserFile (display "render") and wait for August's review. Commit only
  with August's OK (`motion/out/` is gitignored, so only the source is committed).
- For the post caption, list the photo credits from `motion/SOURCES.md`.
