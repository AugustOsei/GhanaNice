// How to find the place on Google: by the place ID the sender picked, by resolving a pasted
// Maps link, or by searching the name and town they typed.
const { tip } = $('Read tip').first().json;
let mode = 'search';
if (tip.placeId) mode = 'details';
else if (!tip.place && tip.mapsLink) mode = 'link';
const textQuery = tip.place ? [tip.place.replace(/^\[test\]\s*/i, ''), tip.town, 'Ghana'].filter(Boolean).join(', ') : '';
return [{ json: { mode, placeId: tip.placeId, textQuery, bias: null } }];
