// Approved: turn the photos (carried on this item from "Read tip") into base64 for GitHub.
// Paths: dist/assets/listings/<id>/<n>.jpg (1600px) and <n>-800.jpg (cards).
const review = $('Prepare review').first().json;
const id = review.listing.id;
const item = $input.first();
const files = [];
const photos = [];
for (const n of [1, 2, 3]) {
  if (!item.binary?.[`photo${n}`]) continue;
  const base = `assets/listings/${id}/${n}`;
  files.push({ path: `dist/${base}.jpg`, content: (await this.helpers.getBinaryDataBuffer(0, `photo${n}`)).toString('base64') });
  let small = `${base}.jpg`;
  if (item.binary[`photo${n}_small`]) {
    files.push({ path: `dist/${base}-800.jpg`, content: (await this.helpers.getBinaryDataBuffer(0, `photo${n}_small`)).toString('base64') });
    small = `${base}-800.jpg`;
  }
  photos.push({ src: `${base}.jpg`, small });
}
return [{ json: { files, photos } }];
