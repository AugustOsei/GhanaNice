/* The monthly newsletter sign-up ("Follow GhanaNice as it grows") on every page.
   Each page marks where a form goes with data-newsletter="footer | festival | home | newsletter"; this script
   fills them in and posts {email, source, page} as JSON to config.newsletterEndpoint (n8n, which
   adds the address to MailerLite; MailerLite sends the confirmation email). A blank endpoint is
   preview mode: nothing is sent or stored. See docs/newsletter-pipeline.md.

   It also adds a small slide-in card (source "popup"), never a modal. The card only appears from
   the second page of a visit (after 70% of the page is scrolled or a few seconds), at most once
   per visit, never after signing up, and not for 60 days after it is closed. */
(() => {
  const endpoint = (window.GHANANICE_CONFIG || {}).newsletterEndpoint || '';
  const KEY = 'ghananice:newsletter';
  const DAY = 864e5;
  const COPY = {
    footer: { title: 'Follow GhanaNice as it grows', button: 'Sign up' },
    festival: {
      title: 'Follow GhanaNice as it grows',
      lead: 'We’re building a guide to Ghana with the people who know it. Once a month, we’ll send you what’s new on the site, what’s on next month, a place worth the trip and a tip from a reader.',
      button: 'Sign me up'
    },
    home: {
      title: 'Follow GhanaNice as it grows',
      lead: 'We’re building a guide to Ghana with the people who know it. Once a month, we’ll send you what’s new on the site, what’s on next month, a place worth the trip and a tip from a reader.',
      button: 'Sign me up'
    },
    newsletter: {
      title: 'Get the next issue',
      lead: 'One email near the end of each month. We’ll ask you to confirm first.',
      button: 'Sign me up'
    },
    popup: {
      title: 'Follow GhanaNice as it grows',
      lead: 'Get one email a month with what’s new on GhanaNice and what’s on in Ghana.',
      button: 'Sign up'
    }
  };

  /* A pair of atumpan (Akan talking drums) and their hooked sticks, drawn flat like paper cut-outs.
     newsletter CSS plays a few beats when the card opens, and again on hover. */
  const DRUMS = `<svg viewBox="6 -46 108 166" preserveAspectRatio="xMidYMax meet" focusable="false">
    <defs>
      <clipPath id="nl-drum-a"><path d="M15 46C15 72 20 92 24 112h20c4-20 9-40 9-66z"/></clipPath>
      <clipPath id="nl-drum-b"><path d="M65 56c0 23 4 40 8 56h18c4-16 8-33 8-56z"/></clipPath>
    </defs>
    <circle class="nl-sun" cx="86" cy="-14" r="16"/>
    <path class="nl-ground" d="M4 112h112"/>
    <g class="nl-drum">
      <path class="nl-wood" d="M15 46C15 72 20 92 24 112h20c4-20 9-40 9-66z"/>
      <g clip-path="url(#nl-drum-a)">
        <path class="nl-cord" d="M15 50l8 24 8-24 8 24 8-24 8 24"/>
        <rect class="nl-cloth" x="10" y="78" width="48" height="11"/>
        <rect class="nl-stripe" x="10" y="82" width="48" height="2.5"/>
        <path class="nl-shade" d="M44 46c0 26-4 46-6 66h6c4-20 9-40 9-66z"/>
      </g>
      <path class="nl-outline" d="M15 46C15 72 20 92 24 112h20c4-20 9-40 9-66z"/>
      <ellipse class="nl-skin nl-skin-a" cx="34" cy="46" rx="19" ry="5.5"/>
    </g>
    <g class="nl-drum">
      <path class="nl-wood" d="M65 56c0 23 4 40 8 56h18c4-16 8-33 8-56z"/>
      <g clip-path="url(#nl-drum-b)">
        <path class="nl-cord" d="M65 60l7 21 7-21 7 21 7-21 7 21"/>
        <rect class="nl-cloth" x="60" y="86" width="44" height="10"/>
        <rect class="nl-stripe" x="60" y="90" width="44" height="2.2"/>
        <path class="nl-shade" d="M91 56c0 23-3 40-5 56h5c4-16 8-33 8-56z"/>
      </g>
      <path class="nl-outline" d="M65 56c0 23 4 40 8 56h18c4-16 8-33 8-56z"/>
      <ellipse class="nl-skin nl-skin-b" cx="82" cy="56" rx="17" ry="5"/>
    </g>
    <g class="nl-beat nl-beat-a"><path d="M10 36l-5-4M14 30l-2-6M21 27l1-6"/></g>
    <g class="nl-beat nl-beat-b"><path d="M104 50l6-3M102 44l4-5"/></g>
    <path class="nl-stick nl-stick-a" d="M66 14L47 30q-7 5-6 14"/>
    <path class="nl-stick nl-stick-b" d="M114 28L95 41q-8 5-8 14"/>
  </svg>`;

  const local = {
    get() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } },
    set(value) { try { localStorage.setItem(KEY, JSON.stringify({ ...local.get(), ...value })); } catch { /* private mode */ } }
  };
  const session = {
    get(key) { try { return sessionStorage.getItem(key); } catch { return null; } },
    set(key, value) { try { sessionStorage.setItem(key, value); } catch { /* private mode */ } }
  };

  let count = 0;
  function form(source) {
    const copy = COPY[source];
    const id = `nl-${++count}`;
    const node = document.createElement('form');
    node.className = `nl-form nl-${source}`;
    node.noValidate = true;
    node.innerHTML = `
      ${source === 'footer' ? '' : `<p class="nl-title" id="${id}-title">${copy.title}</p>`}
      ${copy.lead ? `<p class="nl-lead">${copy.lead}</p>` : ''}
      <label class="${source === 'footer' ? 'nl-label' : 'sr-only'}" for="${id}">${source === 'footer' ? copy.title : 'Your email'}</label>
      <div class="nl-row">
        <input id="${id}" name="email" type="email" autocomplete="email" inputmode="email" placeholder="you@example.com" maxlength="180" required aria-describedby="${id}-status ${id}-note">
        <button type="submit">${copy.button}</button>
      </div>
      <label class="nl-trap" aria-hidden="true">Leave this empty <input name="website" type="text" tabindex="-1" autocomplete="off"></label>
      <p class="nl-status" id="${id}-status" role="status" aria-live="polite"></p>
      <p class="nl-note" id="${id}-note">${endpoint
        ? 'Free. We’ll email you to confirm first. Unsubscribe any time. <a href="/privacy/#newsletter">Privacy</a>'
        : 'Preview mode: the newsletter isn’t connected yet, so nothing is sent or stored.'}</p>`;
    node.addEventListener('submit', event => submit(event, node, source));
    return node;
  }

  async function submit(event, node, source) {
    event.preventDefault();
    const input = node.elements.email;
    const button = node.querySelector('button[type="submit"]');
    const status = node.querySelector('.nl-status');
    const say = (message, isError) => {
      status.textContent = message;
      status.classList.toggle('is-error', !!isError);
      input.toggleAttribute('aria-invalid', !!isError);
      if (isError) input.focus();
    };
    const email = input.value.trim();
    if (!/^[^\s@]+@[^\s@.]+(\.[^\s@.]+)*\.[a-z]{2,}$/i.test(email)) {
      return say(email ? 'That email address doesn’t look right. Check it and try again.' : 'Type your email address first.', true);
    }
    if (!endpoint) return say('Preview mode: nothing was sent or stored. The real form will email you to confirm.');

    button.disabled = true;
    say('Sending…');
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source, page: location.pathname, website: node.elements.website.value })
      });
      const result = await response.json().catch(() => ({}));
      if (result.ok) {
        local.set({ signedUp: Date.now() });
        node.classList.add('is-done');
        say('Check your inbox to confirm.');
        input.value = '';
        input.blur();
        document.querySelectorAll('.nl-pop').forEach(pop => pop !== node.closest('.nl-pop') && pop.remove());
        return;
      }
      say(result.error === 'email' ? 'That email address doesn’t look right. Check it and try again.' : 'Something went wrong on our side. Please try again in a minute.', true);
    } catch {
      say('We couldn’t reach the sign-up. Check your connection and try again.', true);
    } finally {
      button.disabled = false;
    }
  }

  document.querySelectorAll('[data-newsletter]').forEach(host => {
    const source = COPY[host.dataset.newsletter] ? host.dataset.newsletter : 'footer';
    host.append(form(source));
  });

  /* The slide-in card. */
  const views = Number(session.get('ghananice:views') || 0) + 1;
  session.set('ghananice:views', String(views));
  const saved = local.get();
  const closedRecently = saved.closedAt && Date.now() - saved.closedAt < 60 * DAY;
  if (views < 2 || saved.signedUp || closedRecently || session.get('ghananice:nl-shown')) return;

  let card;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  function close() {
    if (!card) return;
    local.set({ closedAt: Date.now() });
    const hadFocus = card.contains(document.activeElement);
    card.classList.remove('is-open');
    document.documentElement.style.removeProperty('--nl-pop-space');
    const gone = card;
    card = null;
    document.removeEventListener('keydown', onKey);
    setTimeout(() => gone.remove(), reduced.matches ? 0 : 400);
    const main = document.querySelector('main');
    if (hadFocus && main) {
      main.setAttribute('tabindex', '-1');
      main.focus({ preventScroll: true });
    }
  }
  function onKey(event) {
    if (event.key !== 'Escape' || event.defaultPrevented) return;
    /* A lightbox or the region reader handles its own Esc first. */
    if (!card.contains(event.target) && document.querySelector('[aria-modal="true"]:not([hidden]), body.has-reader')) return;
    close();
  }
  function show() {
    if (card || session.get('ghananice:nl-shown')) return;
    /* Not while one of the page's own sign-up forms is on screen; scrolling tries again. */
    const inView = [...document.querySelectorAll('[data-newsletter]')].some(host => {
      const box = host.getBoundingClientRect();
      return box.height && box.bottom > 0 && box.top < innerHeight;
    });
    if (inView) return;
    /* Not while someone is typing in another form; try again when they leave it. */
    const active = document.activeElement;
    if (active && active.matches('input, textarea, select') && !active.closest('.nl-pop')) {
      active.addEventListener('blur', () => setTimeout(show, 1500), { once: true });
      return;
    }
    removeEventListener('scroll', onScroll);
    clearTimeout(timer);
    session.set('ghananice:nl-shown', '1');
    card = document.createElement('section');
    card.className = 'nl-pop';
    card.setAttribute('aria-label', 'Newsletter sign-up');
    const shut = document.createElement('button');
    shut.type = 'button';
    shut.className = 'nl-close';
    shut.setAttribute('aria-label', 'Close the newsletter sign-up');
    shut.innerHTML = '<span aria-hidden="true">×</span>';
    shut.addEventListener('click', close);
    const art = document.createElement('div');
    art.className = 'nl-pop-art';
    art.setAttribute('aria-hidden', 'true');
    art.innerHTML = DRUMS;
    card.append(shut, art, form('popup'));
    /* Early in the tab order, just after the skip link, so a keyboard reaches it quickly. */
    const skip = document.querySelector('.skip-link');
    if (skip) skip.after(card); else document.body.prepend(card);
    document.addEventListener('keydown', onKey);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (!card) return;
      card.classList.add('is-open');
      /* On phones the page gets room at the bottom so the card never hides its end. */
      document.documentElement.style.setProperty('--nl-pop-space', `${card.offsetHeight + 16}px`);
    }));
  }
  function onScroll() {
    const scrolled = (scrollY + innerHeight) / document.documentElement.scrollHeight;
    if (scrolled >= .7 && !onScroll.queued) {
      onScroll.queued = true;
      requestAnimationFrame(() => { onScroll.queued = false; show(); });
    }
  }
  const timer = setTimeout(show, 8000);
  addEventListener('scroll', onScroll, { passive: true });
})();
