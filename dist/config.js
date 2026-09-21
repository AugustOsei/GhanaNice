/* Deployment settings. Both endpoints are n8n webhooks — see docs/tip-pipeline.md.
   Leave either blank and the site falls back to preview mode for that feature:
   tips are kept in this browser only, and region pages show only local tips. */
window.GHANANICE_CONFIG = {
  /* POST: receives one tip as JSON. e.g. https://n8n.example.com/webhook/ghananice-tip */
  tipEndpoint: '',
  /* GET ?region=<slug>: returns the published, enriched tips for that region. */
  directoryEndpoint: ''
};
