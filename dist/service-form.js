(function initServiceForm() {
  const form = document.querySelector('#service-form');
  const button = document.querySelector('#service-submit-button');
  const note = document.querySelector('#service-form-note');
  const status = document.querySelector('#service-form-status');
  if (!form || !button) return;

  const endpoint = window.GHANANICE_CONFIG?.serviceSubmissionEndpoint || '';
  if (!endpoint) {
    button.querySelector('span').textContent = 'Save a draft';
    if (note) note.textContent = 'Preview mode: this draft stays in this browser until the review endpoint is connected.';
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    const values = new FormData(form);
    const payload = {
      id: crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      submittedAt: new Date().toISOString(),
      businessName: String(values.get('businessName') || '').trim(),
      category: String(values.get('category') || '').trim(),
      baseLocation: String(values.get('baseLocation') || '').trim(),
      primaryRegion: String(values.get('primaryRegion') || '').trim(),
      website: String(values.get('website') || '').trim(),
      coverage: String(values.get('coverage') || '').trim(),
      description: String(values.get('description') || '').trim(),
      listingType: String(values.get('listingType') || 'standard'),
      contactName: String(values.get('contactName') || '').trim(),
      email: String(values.get('email') || '').trim(),
      phone: String(values.get('phone') || '').trim(),
      companyFax: String(values.get('companyFax') || '').trim(),
      consent: values.get('consent') === 'on',
      source: 'list-your-service',
      pageUrl: location.href,
    };

    button.disabled = true;
    if (status) status.textContent = endpoint ? 'Sending your service for review…' : 'Saving your draft…';
    try {
      if (endpoint) {
        const response = await fetch(endpoint, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error(`Submission failed with ${response.status}`);
        if (status) status.textContent = 'Thanks — your request is in the review queue. Nothing is published automatically.';
        form.reset();
      } else {
        const storageKey = 'ghanaNiceTravelServiceDrafts';
        const drafts = JSON.parse(localStorage.getItem(storageKey) || '[]');
        drafts.push(payload);
        localStorage.setItem(storageKey, JSON.stringify(drafts.slice(-10)));
        if (status) status.textContent = 'Draft saved in this browser. It has not been sent for review.';
      }
    } catch {
      if (status) status.textContent = 'That did not go through. Your details are still here; please try again later.';
    } finally {
      button.disabled = false;
    }
  });
})();
