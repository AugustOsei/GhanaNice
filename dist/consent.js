/* Analytics only with consent. Google Analytics is not loaded at all until the visitor says
   yes; the choice is remembered in this browser. "Cookie settings" in the footer (any element
   with data-cookie-settings) opens the notice again. See /privacy/. */
(() => {
  const KEY = 'ghananice:analytics';
  const ID = 'G-07N1MXC0Q9';
  let choice = null;
  try { choice = localStorage.getItem(KEY); } catch {}

  function remember(value) {
    try { localStorage.setItem(KEY, value); } catch {}
  }

  function loadAnalytics() {
    window[`ga-disable-${ID}`] = false;
    if (window.ghanaNiceAnalytics) return;
    window.ghanaNiceAnalytics = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', ID);
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${ID}`;
    document.head.append(script);
  }

  /* Saying no after a yes: stop Analytics on this page and clear its cookies. */
  function stopAnalytics() {
    window[`ga-disable-${ID}`] = true;
    const base = location.hostname.replace(/^www\./, '');
    document.cookie.split(';').map(part => part.split('=')[0].trim()).filter(name => /^_ga/.test(name)).forEach(name => {
      ['', location.hostname, `.${base}`].forEach(domain => {
        document.cookie = `${name}=; Max-Age=0; path=/${domain ? `; domain=${domain}` : ''}`;
      });
    });
  }

  function notice() {
    document.querySelector('.consent')?.remove();
    const box = document.createElement('div');
    box.className = 'consent';
    box.setAttribute('role', 'region');
    box.setAttribute('aria-label', 'Cookie choice');
    box.innerHTML = `<p>GhanaNice uses analytics cookies to see how the site is used. They only run if you say yes. <a href="/privacy/">Privacy</a></p>
      <div class="consent-actions"><button type="button" data-consent="yes">Accept</button><button type="button" data-consent="no">No thanks</button></div>`;
    box.addEventListener('click', event => {
      const button = event.target.closest('[data-consent]');
      if (!button) return;
      const value = button.dataset.consent;
      remember(value);
      if (value === 'yes') loadAnalytics();
      else stopAnalytics();
      box.remove();
    });
    document.body.append(box);
    return box;
  }

  if (choice === 'yes') loadAnalytics();
  const ready = () => {
    if (choice !== 'yes' && choice !== 'no') notice();
    document.addEventListener('click', event => {
      const opener = event.target.closest('[data-cookie-settings]');
      if (!opener) return;
      event.preventDefault();
      notice().querySelector('button')?.focus();
    });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready);
  else ready();
})();
