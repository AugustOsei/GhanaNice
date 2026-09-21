/* Deployment settings. Leave any of these blank and that feature falls back gracefully.
   See docs/tip-pipeline.md. */
window.GHANANICE_CONFIG = {
  /* n8n webhook, POST multipart: receives one tip plus up to three photos.
     Blank = preview mode: tips are kept in this browser only. */
  tipEndpoint: '',
  /* n8n webhook, GET ?region=<slug>: the published tips for that region. */
  directoryEndpoint: '',
  /* Browser key for Google place suggestions in the tip form. Restrict it in Google Cloud to
     the Places API (New) and to ghananice.com. Blank = a plain name + town form. */
  placesKey: '',
  /* Cloudflare Turnstile site key (public). Set = email becomes optional on the tip form. */
  turnstileSiteKey: ''
};
