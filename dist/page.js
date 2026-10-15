/* The plain pages (About, Contact, Privacy): the phone menu and the footer year. */
const menu = document.querySelector('.menu-button');
const navLinks = document.querySelector('.nav-links');
menu?.addEventListener('click', () => {
  const open = menu.getAttribute('aria-expanded') === 'true';
  menu.setAttribute('aria-expanded', String(!open));
  navLinks.classList.toggle('open', !open);
});
navLinks?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
  menu?.setAttribute('aria-expanded', 'false');
  navLinks.classList.remove('open');
}));
const year = document.querySelector('#year');
if (year) year.textContent = new Date().getFullYear();
