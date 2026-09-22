/* The tip form, shared by the landing page and every region page.
   Only the place is required. Picking it from Google's suggestions gives n8n an exact place
   ID (so the town, region and category are worked out for the sender); anything not on
   Google is typed as a name and a town. Up to three photos are shrunk in the browser before
   sending, which also drops their EXIF data, GPS position included. */
(() => {
  const forms = [...document.querySelectorAll('[data-tip-form]')];
  const tips = window.GhanaTips;
  if (!forms.length || !tips) return;
  const config = tips.config();
  const MAX_PHOTOS = 3;
  const MAX_SIDE = 1600;
  const MAX_FILE = 40 * 1024 * 1024;
  const emailOptional = !!config.turnstileSiteKey;

  const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`);
  const isUrl = value => /^https?:\/\//i.test(value.trim());
  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  /* A card like the ones on the walls, used for the "here's how it will look" preview and for
     the landing wall. Pending tips have no category yet: n8n works that out. */
  function tile(tip) {
    const card = el('article', tip.thumb ? 'place-tile place-photo' : 'place-tile');
    if (tip.thumb) card.style.setProperty('--image', `url("${tip.thumb}")`);
    const label = el('span', null, tip.location || 'Location to confirm');
    label.append(' ', el('i', 'kind is-pending', 'Waiting for review'));
    card.append(label, el('h3', null, tip.place));
    if (tip.note) card.append(el('p', 'tile-note', tip.note));
    if (tip.submitterName) card.append(el('p', 'tile-credit', `Suggested by ${tip.submitterName}`));
    return card;
  }
  window.GhanaTipTile = tile;

  /* Decoding through an <img> applies the photo's EXIF rotation in every current browser;
     re-encoding through a canvas then leaves all the EXIF data behind. */
  async function shrink(file) {
    if (file.size > MAX_FILE) throw new Error('too-big');
    const source = URL.createObjectURL(file);
    try {
      const image = new Image();
      image.src = source;
      await image.decode();
      const draw = side => {
        const scale = Math.min(1, side / Math.max(image.naturalWidth, image.naturalHeight));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(image.naturalWidth * scale);
        canvas.height = Math.round(image.naturalHeight * scale);
        canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
        return canvas;
      };
      const encode = side => new Promise(resolve => draw(side).toBlob(resolve, 'image/jpeg', .82));
      /* The full photo for the lightbox and an 800px copy for cards, so n8n needn't resize. */
      const [blob, small] = await Promise.all([encode(MAX_SIDE), encode(800)]);
      if (!blob || !small) throw new Error('encode');
      return { blob, small, url: URL.createObjectURL(blob), thumb: draw(360).toDataURL('image/jpeg', .7) };
    } finally {
      URL.revokeObjectURL(source);
    }
  }

  let turnstileLoading;
  function loadTurnstile() {
    turnstileLoading ||= new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.onload = () => resolve(window.turnstile);
      script.onerror = reject;
      document.head.append(script);
    });
    return turnstileLoading;
  }

  forms.forEach((form, formIndex) => {
    const id = `tip${formIndex}`;
    const hint = config.placesKey
      ? 'Start typing and pick it from the list. Not on Google? Type the name and the town.'
      : 'Type the name and the town, or paste a Google Maps link.';
    form.innerHTML = `
      <div class="tip-where">
        <p class="tip-sentence">I found <label class="tip-place"><span class="sr-only">Place or business name</span><input name="place" type="text" placeholder="a good spot" autocomplete="off" maxlength="200" required role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="${id}-list" aria-describedby="${id}-hint"></label><span class="tip-around"> around <label><span class="sr-only">Town or area</span><input name="town" type="text" placeholder="the town" maxlength="80" required></label></span>.</p>
        <ul class="tip-suggest" id="${id}-list" role="listbox" aria-label="Places found on Google" hidden></ul>
        <p class="tip-picked" hidden><span class="tip-pin" aria-hidden="true"></span><span class="tip-picked-text"></span><button type="button" class="tip-change">Change</button></p>
        <p class="tip-hint" id="${id}-hint">${hint}</p>
      </div>
      <div class="tip-photos">
        <p class="tip-label">Photos you took <em>Optional, up to ${MAX_PHOTOS}</em></p>
        <div class="tip-thumbs">
          <label class="tip-add"><input type="file" accept="image/*" multiple class="sr-only"><b>+</b><span>Add photos</span></label>
        </div>
        <p class="tip-photo-status" aria-live="polite"></p>
        <label class="tip-credit tip-consent" hidden><input name="photoConsent" type="checkbox" value="yes"> I took these photos, and GhanaNice may show them credited to me</label>
      </div>
      <label class="tip-line"><span class="tip-label">What makes it nice? <em>Optional</em></span><textarea name="note" rows="2" maxlength="280" placeholder="Food? People? Craft? The view?"></textarea></label>
      <fieldset class="tip-from">
        <legend>Who’s it from?</legend>
        <label><span>Name to credit <em>Optional</em></span><input name="name" type="text" autocomplete="name" placeholder="Ama Mensah" maxlength="80"></label>
        <label><span>${emailOptional ? 'Email, to hear when it’s live <em>Optional</em>' : 'Email, to hear when it’s live'}</span><input name="email" type="email" autocomplete="email" placeholder="you@example.com" maxlength="120"${emailOptional ? '' : ' required'}></label>
        <label class="tip-trap" aria-hidden="true"><span>Leave this empty</span><input name="website" type="text" tabindex="-1" autocomplete="off"></label>
      </fieldset>
      <div class="tip-turnstile"></div>
      <button type="submit">Send the tip <span>↗</span></button>
      <p class="form-note">${tips.isLive()
        ? 'Your email is never shown on the site. We check every tip before it’s listed.'
        : 'Preview mode: tips aren’t sent anywhere yet. Yours is saved in this browser only, so you can see how it looks.'}</p>
      <p class="form-status" aria-live="polite"></p>`;

    const q = selector => form.querySelector(selector);
    const placeInput = q('[name="place"]');
    const townInput = q('[name="town"]');
    const around = q('.tip-around');
    const list = q('.tip-suggest');
    const picked = q('.tip-picked');
    const fileInput = q('input[type="file"]');
    const addButton = q('.tip-add');
    const thumbs = q('.tip-thumbs');
    const photoStatus = q('.tip-photo-status');
    const consent = q('.tip-consent');
    const status = q('.form-status');
    const submit = q('button[type="submit"]');

    let choice = null;
    let suggestions = [];
    let active = -1;
    let session = null;
    let timer;
    let request;
    let photos = [];

    /* ---- Where: Google suggestions, a pasted Maps link, or a name and a town ---- */
    function syncPlace() {
      const needsTown = !choice && !isUrl(placeInput.value);
      around.hidden = !needsTown;
      townInput.required = needsTown;
      picked.hidden = !choice;
      if (choice) q('.tip-picked-text').textContent = choice.secondary ? `${choice.secondary} · on Google Maps` : 'On Google Maps';
    }

    function closeList() {
      list.hidden = true;
      list.textContent = '';
      placeInput.setAttribute('aria-expanded', 'false');
      placeInput.removeAttribute('aria-activedescendant');
      active = -1;
    }

    function highlight(index) {
      active = index;
      [...list.children].forEach((item, i) => item.setAttribute('aria-selected', String(i === index)));
      if (index >= 0) placeInput.setAttribute('aria-activedescendant', `${id}-opt${index}`);
      else placeInput.removeAttribute('aria-activedescendant');
    }

    function choose(index) {
      choice = suggestions[index];
      placeInput.value = choice.name;
      townInput.value = '';
      session = null;
      closeList();
      syncPlace();
    }

    function showSuggestions() {
      list.textContent = '';
      suggestions.forEach((item, index) => {
        const option = el('li', null);
        option.id = `${id}-opt${index}`;
        option.setAttribute('role', 'option');
        option.setAttribute('aria-selected', 'false');
        option.append(el('b', null, item.name), el('small', null, item.secondary));
        option.addEventListener('mousedown', event => event.preventDefault());
        option.addEventListener('click', () => choose(index));
        list.append(option);
      });
      list.hidden = !suggestions.length;
      placeInput.setAttribute('aria-expanded', String(!!suggestions.length));
      active = -1;
    }

    /* Places API (New) autocomplete, limited to Ghana. The session token groups one person's
       keystrokes for billing; n8n fetches the details from the place ID later. */
    async function suggest(text) {
      request?.abort();
      request = new AbortController();
      session ||= uuid();
      try {
        const response = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
          method: 'POST',
          signal: request.signal,
          headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': config.placesKey },
          body: JSON.stringify({ input: text, includedRegionCodes: ['gh'], languageCode: 'en', sessionToken: session })
        });
        if (!response.ok) throw new Error(String(response.status));
        const body = await response.json();
        suggestions = (body.suggestions || []).map(s => s.placePrediction).filter(Boolean).slice(0, 5).map(p => ({
          placeId: p.placeId,
          name: p.structuredFormat?.mainText?.text || p.text?.text || '',
          secondary: (p.structuredFormat?.secondaryText?.text || '').replace(/,?\s*Ghana$/, ''),
          types: p.types || []
        }));
        if (placeInput.value.trim() === text) showSuggestions();
      } catch (error) {
        if (error.name !== 'AbortError') closeList();
      }
    }

    placeInput.addEventListener('input', () => {
      choice = null;
      syncPlace();
      clearTimeout(timer);
      const text = placeInput.value.trim();
      if (!config.placesKey || text.length < 3 || isUrl(text)) return closeList();
      timer = setTimeout(() => suggest(text), 250);
    });
    placeInput.addEventListener('keydown', event => {
      if (list.hidden) return;
      if (event.key === 'ArrowDown') { event.preventDefault(); highlight(Math.min(active + 1, suggestions.length - 1)); }
      else if (event.key === 'ArrowUp') { event.preventDefault(); highlight(Math.max(active - 1, -1)); }
      else if (event.key === 'Enter' && active >= 0) { event.preventDefault(); choose(active); }
      else if (event.key === 'Escape') { event.stopPropagation(); closeList(); }
    });
    placeInput.addEventListener('blur', () => setTimeout(closeList, 120));
    q('.tip-change').addEventListener('click', () => {
      choice = null;
      syncPlace();
      placeInput.focus();
      placeInput.select();
    });

    /* ---- Photos ---- */
    function showPhotos() {
      thumbs.querySelectorAll('.tip-thumb').forEach(node => node.remove());
      photos.forEach((photo, index) => {
        const figure = el('figure', 'tip-thumb');
        const img = el('img');
        img.src = photo.url;
        img.alt = `Your photo ${index + 1}`;
        const remove = el('button', null, '×');
        remove.type = 'button';
        remove.setAttribute('aria-label', `Remove photo ${index + 1}`);
        remove.addEventListener('click', () => {
          URL.revokeObjectURL(photo.url);
          photos.splice(index, 1);
          photoStatus.textContent = '';
          showPhotos();
          (thumbs.querySelector('.tip-thumb button') || fileInput).focus();
        });
        figure.append(img, remove);
        thumbs.insertBefore(figure, addButton);
      });
      addButton.hidden = photos.length >= MAX_PHOTOS;
      consent.hidden = !photos.length;
      consent.querySelector('input').required = photos.length > 0;
    }

    fileInput.addEventListener('change', async () => {
      const files = [...fileInput.files];
      fileInput.value = '';
      const room = MAX_PHOTOS - photos.length;
      const taking = files.slice(0, room);
      photoStatus.textContent = 'Getting your photos ready…';
      let failed = 0;
      for (const file of taking) {
        try { photos.push(await shrink(file)); }
        catch { failed += 1; }
      }
      showPhotos();
      const notes = [];
      if (files.length > room) notes.push(`Only ${MAX_PHOTOS} photos for now, so we kept the first ${room === 1 ? 'one' : room}.`);
      if (failed) notes.push(failed === 1
        ? 'One photo wouldn’t open. Try a JPEG, or a screenshot of it.'
        : `${failed} photos wouldn’t open. Try JPEGs, or screenshots of them.`);
      photoStatus.textContent = notes.join(' ');
    });

    /* ---- Spam check (only when a Turnstile key is configured) ---- */
    let widget = null;
    if (config.turnstileSiteKey) {
      const mount = () => loadTurnstile().then(turnstile => {
        widget ??= turnstile.render(q('.tip-turnstile'), { sitekey: config.turnstileSiteKey, size: 'flexible', appearance: 'interaction-only' });
      }).catch(() => {});
      form.addEventListener('focusin', mount, { once: true });
    }

    /* ---- Send ---- */
    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const data = new FormData(form);
      const text = name => String(data.get(name) || '').trim();
      const place = text('place');
      const mapsLink = isUrl(place) ? place : '';
      const name = text('name');
      const tip = {
        id: uuid(),
        submittedAt: new Date().toISOString(),
        place: mapsLink ? '' : place,
        town: text('town'),
        mapsLink,
        placeId: choice?.placeId || '',
        placeAddress: choice?.secondary || '',
        placeTypes: choice?.types || [],
        regionSlug: form.dataset.region || '',
        note: text('note'),
        photoCount: photos.length,
        photoConsent: photos.length > 0 && data.get('photoConsent') === 'yes',
        submitter: { name, email: text('email').toLowerCase() },
        turnstileToken: widget != null ? window.turnstile?.getResponse(widget) || '' : '',
        source: location.pathname.split('/').pop() || 'index.html',
        pageUrl: location.href,
        website: text('website')
      };
      const localCopy = {
        id: tip.id,
        submittedAt: tip.submittedAt,
        place: tip.place || 'Your Google Maps pin',
        location: tip.placeAddress || tip.town,
        regionSlug: tip.regionSlug,
        note: tip.note,
        submitterName: name.split(/\s+/)[0] || '',
        thumb: photos[0]?.thumb || '',
        status: 'pending'
      };

      submit.disabled = true;
      status.textContent = photos.length ? 'Sending your tip and photos…' : 'Sending…';
      let result;
      try {
        result = await tips.submit(tip, photos.map(({ blob, small }) => ({ blob, small })), localCopy);
      } catch {
        status.textContent = 'That didn’t go through. Check your connection and try again. Nothing was lost.';
        submit.disabled = false;
        return;
      } finally {
        if (widget != null) window.turnstile?.reset(widget);
      }
      submit.disabled = false;
      status.textContent = '';
      document.dispatchEvent(new CustomEvent('ghananice:tip', { detail: { tip: localCopy, live: result.live } }));
      done(localCopy, result, tip.submitter.email);
    });

    /* A thank-you with a preview of the card, in place of the form. */
    function done(localCopy, result, email) {
      const panel = el('div', 'tip-done');
      const heading = el('h3', null, localCopy.submitterName ? `Thanks, ${localCopy.submitterName}.` : 'Thank you.');
      heading.tabIndex = -1;
      const message = result.live
        ? `We’ll look it up and check it${email ? ', then email you when it’s live' : ' before it goes on the site'}.`
        : result.ok
          ? 'Preview mode: nothing was sent. It’s saved in this browser so you can see how it looks.'
          : 'Preview mode, and this browser won’t let us save it, so it only shows here.';
      const again = el('button', 'tip-again', 'Share another place');
      again.type = 'button';
      again.addEventListener('click', () => {
        panel.remove();
        reset();
        form.hidden = false;
        placeInput.focus();
      });
      panel.append(heading, el('p', null, message), el('p', 'tip-label', 'How it will look once it’s checked'), tile(localCopy), again);
      form.hidden = true;
      form.after(panel);
      heading.focus();
    }

    function reset() {
      form.reset();
      photos.forEach(photo => URL.revokeObjectURL(photo.url));
      photos = [];
      choice = null;
      photoStatus.textContent = '';
      showPhotos();
      syncPlace();
    }

    syncPlace();
  });
})();
