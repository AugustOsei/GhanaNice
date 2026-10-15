/* Google Analytics for every visit, unless this browser has turned it off on the privacy page
   (any element with data-analytics-toggle switches it). See /privacy/. */
(() => {
  const KEY = 'ghananice:analytics';
  const ID = 'G-07N1MXC0Q9';
  let off = false;
  try { off = localStorage.getItem(KEY) === 'off'; } catch {}

  if (!off) {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', ID);
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${ID}`;
    document.head.append(script);
  }

  /* Turning it off: stop it on this page, clear its cookies and remember the choice. */
  function setOff(value) {
    try { value ? localStorage.setItem(KEY, 'off') : localStorage.removeItem(KEY); } catch {}
    window[`ga-disable-${ID}`] = value;
    if (!value) return location.reload();
    const base = location.hostname.replace(/^www\./, '');
    document.cookie.split(';').map(part => part.split('=')[0].trim()).filter(name => /^_ga/.test(name)).forEach(name => {
      ['', location.hostname, `.${base}`].forEach(domain => {
        document.cookie = `${name}=; Max-Age=0; path=/${domain ? `; domain=${domain}` : ''}`;
      });
    });
  }

  const ready = () => {
    document.querySelectorAll('[data-analytics-toggle]').forEach(button => {
      const label = () => { button.textContent = off ? 'Turn analytics back on' : 'Turn off analytics'; };
      label();
      button.addEventListener('click', () => {
        off = !off;
        setOff(off);
        label();
        const status = document.querySelector('[data-analytics-status]');
        if (status) status.textContent = off ? 'Analytics is off in this browser.' : '';
      });
    });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready);
  else ready();
})();
