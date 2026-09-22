// A pasted short Maps link redirects to a full URL like
//   https://www.google.com/maps/place/Buka+Restaurant/@5.55,-0.18,17z/...
// Pull the place name (and coordinates, to bias the search) out of it.
const location = $json.headers?.location || $json.headers?.Location || '';
const url = location || $('Read tip').first().json.tip.mapsLink;
let name = '';
const place = url.match(/\/maps\/place\/([^/@?]+)/);
if (place) name = decodeURIComponent(place[1].replace(/\+/g, ' '));
const query = url.match(/[?&]q=([^&]+)/);
if (!name && query && !/^-?\d/.test(decodeURIComponent(query[1]))) name = decodeURIComponent(query[1].replace(/\+/g, ' '));
const coords = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/) || url.match(/[?&](?:q|ll)=(-?\d+\.\d+),(-?\d+\.\d+)/);
const bias = coords ? { circle: { center: { latitude: Number(coords[1]), longitude: Number(coords[2]) }, radius: 500 } } : null;
return [{ json: { mode: 'search', textQuery: name ? `${name}, Ghana` : '', bias, resolvedUrl: url.slice(0, 500) } }];
