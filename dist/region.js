const regions = window.GHANA_REGIONS || [];
const tips = window.GhanaTips;

const slug = new URLSearchParams(location.search).get('r');
const region = regions.find(r => r.slug === slug) || regions[0];

/* Text from the data file and from submitted tips is inserted as textContent, never HTML. */
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

document.title = `${region.name} — GhanaNice`;
document.querySelector('#region-eyebrow').textContent = `${region.name} Region`;
document.querySelector('#region-name').textContent = region.name;
document.querySelector('#region-intro').textContent = region.intro;
document.querySelector('#fact-capital').textContent = region.capital;
document.querySelector('#fact-known').textContent = region.known;
document.querySelector('#fact-fact').textContent = region.fact;
document.querySelector('#tip-heading').innerHTML = `Know<br>somewhere in<br>${region.name}?`;

const heroImage = document.querySelector('#region-hero-image');
heroImage.src = region.image;
heroImage.alt = region.shot;
document.querySelector('#region-hero-caption').textContent = region.shot;

/* A card only carries a photograph when we actually have one of that specific place. */
function placeCard(item) {
  const li = el('li', item.image ? 'visit-item has-image' : 'visit-item');
  if (item.image) {
    const figure = el('figure', 'visit-image');
    const img = el('img');
    img.src = item.image;
    img.alt = item.name;
    img.loading = 'lazy';
    figure.append(img);
    li.append(figure);
  }
  const body = el('div', 'visit-body');
  body.append(el('h3', null, item.name), el('p', null, item.note));
  li.append(body);
  return li;
}

const visitList = document.querySelector('#visit-list');
region.visit.forEach(item => visitList.append(placeCard(item)));

const businessList = document.querySelector('#business-list');
const businessEmpty = document.querySelector('#business-empty');
if (region.businesses.length) region.businesses.forEach(item => businessList.append(placeCard(item)));
else businessEmpty.hidden = false;

/* Community wall: real submissions for this region, read back out of this browser. */
const wall = document.querySelector('#region-wall');
const communityEmpty = document.querySelector('#community-empty');

function renderWall() {
  const mine = tips.forRegion(region.slug);
  wall.textContent = '';
  communityEmpty.hidden = mine.length > 0;
  mine.forEach(tip => {
    const tile = el('article', 'place-tile');
    const label = el('span', null, tip.location || region.name);
    label.append(el('i', tip.kind === 'Local business' ? 'kind is-business' : 'kind', tip.kind || 'Place'));
    const title = el('h3', null, tip.place);
    tile.append(label, title);
    if (tip.note) tile.append(el('p', 'tile-note', tip.note));
    const nice = el('button', 'nice-button');
    nice.type = 'button';
    nice.dataset.count = '1';
    nice.setAttribute('aria-pressed', 'true');
    nice.append(document.createTextNode('♥ '), el('b', null, '1'), document.createTextNode(' found it nice'));
    wireNice(nice);
    tile.append(nice);
    wall.append(tile);
  });
  /* Keep the grid honest: a couple of open slots read as room to contribute. */
  const invite = el('a', 'place-tile place-tip-trigger');
  invite.href = '#region-tip';
  invite.append(el('span', null, `Know somewhere in ${region.name}?`), el('strong', null, 'Put us on ↘'));
  wall.append(invite);
}

function wireNice(button) {
  button.addEventListener('click', () => {
    const pressed = button.getAttribute('aria-pressed') === 'true';
    const base = Number(button.dataset.count || 0);
    button.setAttribute('aria-pressed', String(!pressed));
    button.firstChild.textContent = pressed ? '♡ ' : '♥ ';
    button.querySelector('b').textContent = String(base + (pressed ? 0 : 1));
  });
}

renderWall();

const regionSelect = document.querySelector('#region-select');
regions.forEach(r => {
  const option = el('option', null, r.name);
  option.value = r.slug;
  if (r.slug === region.slug) option.selected = true;
  regionSelect.append(option);
});

const form = document.querySelector('#region-form');
const status = document.querySelector('#region-form-status');
form.addEventListener('submit', event => {
  event.preventDefault();
  const data = new FormData(form);
  const place = String(data.get('place') || '').trim();
  if (!place) return;
  const chosen = String(data.get('region') || region.slug);
  const saved = tips.add({
    place,
    location: String(data.get('location') || '').trim(),
    note: String(data.get('note') || '').trim(),
    kind: String(data.get('kind') || 'Place'),
    regionSlug: chosen,
    regionName: (regions.find(r => r.slug === chosen) || region).name
  });
  form.reset();
  regionSelect.value = region.slug;
  if (!saved) {
    status.textContent = 'Could not save — this browser is blocking local storage.';
    return;
  }
  if (chosen === region.slug) {
    renderWall();
    status.textContent = `Thanks — “${place}” is on the wall below.`;
  } else {
    const name = (regions.find(r => r.slug === chosen) || region).name;
    status.textContent = `Thanks — “${place}” was added to ${name}.`;
  }
});

const nextLinks = document.querySelector('#region-next-links');
const index = regions.indexOf(region);
[regions[(index + 1) % regions.length], regions[(index + 2) % regions.length]].forEach(r => {
  const link = el('a', null, r.name);
  link.href = `region.html?r=${r.slug}`;
  nextLinks.append(link);
});

const menu = document.querySelector('.menu-button');
const navLinks = document.querySelector('.nav-links');
menu?.addEventListener('click', () => {
  const open = menu.getAttribute('aria-expanded') === 'true';
  menu.setAttribute('aria-expanded', String(!open));
  navLinks.classList.toggle('open', !open);
});

/* The nav is light-on-dark over the hero photograph and dark-on-paper past it. */
const heroEl = document.querySelector('.region-hero');
const navEl = document.querySelector('.nav');
addEventListener('scroll', () => {
  navEl.classList.toggle('is-over-image', heroEl.getBoundingClientRect().bottom > 76);
}, { passive: true });

document.querySelector('#year').textContent = new Date().getFullYear();
