# GhanaNice motion graphic

A 25-second announcement film for ghananice.com (1080×1350, 30 fps, silent), built with
[Remotion](https://www.remotion.dev/). One strand of yarn writes "nice.", draws a phone showing the
site, dives into its spinning Ghana window, traces the real Larabanga Mosque into a drawing, pulls
back to the Savannah page on a laptop, circles three features, and ends on the invitations, the
star and the partners. Not part of the website: Vercel only deploys `dist/`.

## Run

```bash
npm install
npm run studio    # preview and scrub in Remotion Studio
npm run render    # writes out/ghananice.mp4
```

Rendering uses the installed Google Chrome (`remotion.config.ts`): Remotion's own headless Chrome
crashes when the project path contains a space ("Ghana Nice").

## Layout

- `src/Film.tsx`: the timeline. Scenes in `src/scenes/`: `Opening` (write, phone, dive), `Mosque`
  (photo to drawing), `Laptop` (pull-back and features), `Finale` (invitations, star, partners).
- `src/components/`: the yarn strand (`Yarn.tsx`) and the hand-drawn "nice." (`niceStroke.ts`), the
  rope and yarn ball (`rope.ts`), the traced landmark (`Landmark.tsx`), the pencil filter and star.
- `tools/trace.py`: traces landmarks from photos (needs numpy, pillow, scikit-image, scipy).
  `tools/build_data.mjs` turns the trace and the site's Ghana outline into `src/data/generated.ts`.
  `tools/capture_site.mjs` refreshes the site screenshots in `public/site/`.
- `SOURCES.md`: where every image comes from, and the photo credits for the post caption.

Only wording already on the site appears on screen.

## Festivals and newsletter clip

`src/festivals/`: a 26-second clip (composition `Festivals`, 1080×1350, 30 fps, silent) for the
festivals section and the "What's on in Ghana" newsletter. The split-flap count turns to 46, the
festivals board assembles and its "To do this year" list is ticked, the month tiles flip through
Aboakyer, Chale Wote, Ngmayem and Hogbetsotso, and the newsletter card's drums play under the
sign-up. `npm run render:festivals` writes `out/ghananice-festivals.mp4`. The pieces in
`parts.tsx` redraw the board's (`dist/festivals/index.html`) and the card's (`dist/newsletter.js`).
Months are said as "usually", like the site; no exact dates.
