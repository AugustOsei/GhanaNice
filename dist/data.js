/* Shared region data for the landing page and the per-region pages.
   `shot`/`shot2` describe exactly what is in each photograph — they become alt text and
   on-page captions. `visit` lists real, named places inside the region. `businesses` is
   deliberately only populated where we have a documented one: the wall is meant to fill up
   with real submissions, not with invented shops. */
window.GHANA_REGIONS = [
  {
    slug: 'greater-accra', name: 'Greater Accra', capital: 'Accra',
    known: 'City neighbourhoods, Atlantic coast and creative culture',
    fact: "Ghana's smallest region by area, with the capital at its centre.",
    intro: 'Start by the sea, move through old neighbourhoods, then follow the food, music and new ideas shaping the capital.',
    image: 'assets/real/jamestown-lighthouse.jpg', shot: 'Jamestown Lighthouse, Accra',
    side: 'assets/real/accra-seamstress.jpg', shot2: 'A seamstress taking measurements in Alajo, Accra',
    visit: [
      { name: 'Jamestown', note: "Fishing harbour, boxing gyms and one of Accra's oldest quarters.", image: 'assets/real/jamestown-lighthouse.jpg' },
      { name: 'Kwame Nkrumah Memorial Park', note: "Ghana's most visited attraction: the mausoleum and museum of the first president." },
      { name: 'Makola Market', note: "The city's central market. Cloth, food, and most other things." },
      { name: 'Labadi Beach', note: "Accra's busiest stretch of sand, liveliest at the weekend." },
      { name: 'Osu', note: 'Food, bars and late-night Accra around Oxford Street.' },
      { name: 'Arts Centre for National Culture', note: 'Carving, kente and craft stalls near the sea.' }
    ],
    businesses: [
      { name: 'Made in Accra', note: 'A seamstress taking measurements in her Alajo workshop.', image: 'assets/real/accra-seamstress.jpg' }
    ]
  },
  {
    slug: 'central', name: 'Central', capital: 'Cape Coast',
    known: 'Coast, castles and rainforest canopy',
    fact: 'Home to Kakum National Park and a coastline layered with difficult history.',
    intro: 'A trip here can move from forest canopy to fishing towns and the forts that hold some of Ghana’s most important history.',
    image: 'assets/real/cape-coast-castle.jpg', shot: 'Cape Coast Castle',
    side: 'assets/real/kakum-walkway.jpg', shot2: 'The canopy walkway at Kakum National Park',
    visit: [
      { name: 'Cape Coast Castle', note: 'A UNESCO World Heritage site, and a place of difficult, necessary history.', image: 'assets/real/cape-coast-castle.jpg' },
      { name: 'Kakum National Park', note: 'Rainforest, and a canopy walkway strung between the trees.', image: 'assets/real/kakum-walkway.jpg' },
      { name: 'Elmina Castle', note: 'Begun in 1482, the oldest European-built structure in sub-Saharan Africa.' },
      { name: 'Assin Manso Ancestral Slave River', note: 'The last bathing place before the coast, now a site of return.' },
      { name: 'Hans Cottage Botel', note: 'Crocodiles and birdlife a short drive from Cape Coast.' }
    ],
    businesses: []
  },
  {
    slug: 'volta', name: 'Volta', capital: 'Ho',
    known: 'Waterfalls, mountains and quiet roads',
    fact: "Wli Falls is Ghana's highest waterfall.",
    intro: 'Go for the cooler air, green ridges, long walks and roads where the view keeps asking you to stop.',
    image: 'assets/real/wli-falls.jpg', shot: 'Wli Falls, near Hohoe',
    visit: [
      { name: 'Wli Falls', note: "Ghana's highest waterfall, reached on a walk through forest.", image: 'assets/real/wli-falls.jpg' },
      { name: 'Mount Afadja', note: "The country's highest peak. Steep, but a short climb." },
      { name: 'Tafi Atome Monkey Sanctuary', note: 'Mona monkeys living alongside the village that protects them.' },
      { name: 'Amedzofe', note: 'One of Ghana’s highest settlements, with the Ote waterfall below it.' },
      { name: 'Keta Lagoon', note: 'Sandbars, salt and birds between the lagoon and the sea.' }
    ],
    businesses: []
  },
  {
    slug: 'savannah', name: 'Savannah', capital: 'Damongo',
    known: 'Mole, Larabanga and wide northern skies',
    fact: "Larabanga Mosque is among Ghana's oldest surviving mosques.",
    intro: 'Wildlife, earth-built landmarks and enormous skies make this a region worth giving more than a day.',
    image: 'assets/real/larabanga-mosque.jpg', shot: 'Larabanga Mosque',
    side: 'assets/real/regions/savannah-mole.jpg', shot2: 'Elephants at Mole National Park, West Gonja',
    visit: [
      { name: 'Mole National Park', note: "Ghana's largest park: elephants, antelope and walking safaris.", image: 'assets/real/regions/savannah-mole.jpg' },
      { name: 'Larabanga Mosque', note: 'Sudanese-style mud and stick architecture, among the oldest in the country.', image: 'assets/real/larabanga-mosque.jpg' },
      { name: 'Mognori Eco Village', note: 'Canoe safaris and village stays on the edge of Mole.' },
      { name: 'Salaga', note: 'A town carrying a heavy history as a trading and slave-market centre.' }
    ],
    businesses: []
  },
  {
    slug: 'western', name: 'Western', capital: 'Sekondi-Takoradi',
    known: 'Surf, rainforest, beaches and cocoa country',
    fact: 'Coastal towns and inland forest share the same rain-rich landscape.',
    intro: 'Follow the coast for beaches and surf, or turn inland toward forest, farms and working towns.',
    image: 'assets/real/regions/western-nzulezo.jpg', shot: 'Nzulezu, the stilt village on the Amansuri wetland',
    side: 'assets/real/regions/western-busua.jpg', shot2: 'Busua Beach',
    visit: [
      { name: 'Nzulezu', note: 'A village built on stilts over the Amansuri wetland, reached by canoe.', image: 'assets/real/regions/western-nzulezo.jpg' },
      { name: 'Busua Beach', note: 'Surf lessons, slow afternoons and a walkable beach town.', image: 'assets/real/regions/western-busua.jpg' },
      { name: 'Cape Three Points', note: 'The southernmost point of Ghana, with a lighthouse and forest reserve.' },
      { name: 'Fort San Antonio, Axim', note: 'A Portuguese fort of 1515, above the sea.' },
      { name: 'Ankasa Conservation Area', note: 'Dense rainforest in the far southwest.' }
    ],
    businesses: []
  },
  {
    slug: 'ashanti', name: 'Ashanti', capital: 'Kumasi',
    known: 'Kumasi, markets, kente and Asante history',
    fact: 'The region is the historic heartland of Asante culture.',
    intro: 'Come for Kumasi’s energy, then look closer at the craft, history and market knowledge that give the region its depth.',
    image: 'assets/real/regions/ashanti-knust-great-hall.jpg', shot: 'The Great Hall at KNUST, Kumasi',
    visit: [
      { name: 'Manhyia Palace Museum', note: "The Asantehene's former palace, now a museum of Asante history." },
      { name: 'Kejetia Market', note: 'One of the largest markets in West Africa.' },
      { name: 'The Great Hall, KNUST', note: 'A landmark of Ghanaian modernist architecture.', image: 'assets/real/regions/ashanti-knust-great-hall.jpg' },
      { name: 'Lake Bosomtwe', note: 'A meteorite crater lake ringed by villages.' },
      { name: 'Bonwire', note: 'The kente weaving village.' },
      { name: 'Ntonso', note: 'Adinkra cloth, stamped by hand.' }
    ],
    businesses: []
  },
  {
    slug: 'eastern', name: 'Eastern', capital: 'Koforidua',
    known: 'Hill towns, gardens and easy escapes from Accra',
    fact: 'The road from Accra quickly climbs into cooler air.',
    intro: 'This is where many city weekends begin: garden towns, mountain views and short trips that feel much farther away.',
    image: 'assets/real/regions/eastern-akosombo.jpg', shot: 'Akosombo Dam',
    side: 'assets/real/regions/eastern-aburi.jpg', shot2: 'Aburi Botanical Gardens',
    visit: [
      { name: 'Aburi Botanical Gardens', note: 'Long-established gardens in cool hill air above Accra.', image: 'assets/real/regions/eastern-aburi.jpg' },
      { name: 'Akosombo Dam', note: 'The dam that made Lake Volta.', image: 'assets/real/regions/eastern-akosombo.jpg' },
      { name: 'Boti Falls', note: 'Twin falls, fullest in the rainy season.' },
      { name: 'Umbrella Rock', note: 'A mushroom-shaped rock formation on the walk near Boti.' },
      { name: 'Bunso Arboretum', note: 'Forest, birds and a canopy walkway.' }
    ],
    businesses: []
  },
  {
    slug: 'northern', name: 'Northern', capital: 'Tamale',
    known: 'Tamale, food, art and a strong creative scene',
    fact: "It is one of Ghana's largest regions by area.",
    intro: 'Tamale sets the pace, with good food, generous streets and a creative community making the north visible on its own terms.',
    image: 'assets/real/regions/northern-tamale-mosque.jpg', shot: 'The Central Mosque, Tamale',
    visit: [
      { name: 'Central Mosque, Tamale', note: 'The landmark at the centre of the city.', image: 'assets/real/regions/northern-tamale-mosque.jpg' },
      { name: 'Tamale Central Market', note: 'Smocks, shea butter and northern produce.' },
      { name: 'Gbewaa Palace, Yendi', note: 'The seat of the Dagbon kingdom.' },
      { name: 'Daboya', note: 'Known for smock weaving and for salt.' }
    ],
    businesses: []
  },
  {
    slug: 'upper-east', name: 'Upper East', capital: 'Bolgatanga',
    known: 'Bolgatanga, basketry and earth-built homes',
    fact: 'Bolgatanga is renowned for weaving and market craft.',
    intro: 'The details matter here: handwoven baskets, painted compounds, busy markets and the intelligence of things made to last.',
    image: 'assets/real/regions/upper-east-paga.jpg', shot: 'A crocodile at the Paga pond',
    side: 'assets/real/regions/upper-east-baskets.jpg', shot2: 'Basket weavers at work in Bolgatanga',
    visit: [
      { name: 'Paga Crocodile Pond', note: 'Crocodiles that live alongside the community around them.', image: 'assets/real/regions/upper-east-paga.jpg' },
      { name: 'Bolgatanga Market', note: 'The home of the Bolga basket.', image: 'assets/real/regions/upper-east-baskets.jpg' },
      { name: 'Sirigu', note: 'Painted compound walls, and a women’s pottery and art collective.' },
      { name: 'Tongo Hills and Tengzug', note: 'Rock formations and a long-standing shrine.' },
      { name: 'Navrongo Cathedral', note: 'An earth-built cathedral with painted interior walls.' }
    ],
    businesses: []
  },
  {
    slug: 'upper-west', name: 'Upper West', capital: 'Wa',
    known: 'Courtyards, craft and community architecture',
    fact: "The region sits at Ghana's far northwest.",
    intro: 'Long roads lead to towns and compounds designed around shade, gathering and the rhythms of daily life.',
    image: 'assets/real/regions/upper-west-wa-palace.jpg', shot: "Wa Naa's Palace",
    visit: [
      { name: "Wa Naa's Palace", note: 'Sudanese-style earth architecture in the regional capital.', image: 'assets/real/regions/upper-west-wa-palace.jpg' },
      { name: 'Wechiau Community Hippo Sanctuary', note: 'Hippos on the Black Volta, run by the communities along it.' },
      { name: 'Gwollu Defence Wall', note: 'A wall built to resist slave raiders.' },
      { name: 'Nandom', note: 'Known for its cathedral and its harvest festival.' }
    ],
    businesses: []
  },
  {
    slug: 'north-east', name: 'North East', capital: 'Nalerigu',
    known: 'Escarpments, markets and old trading routes',
    fact: 'North East became a region in 2019.',
    intro: 'A newer administrative region with old routes, dramatic landforms and markets that connect communities across the north.',
    image: 'assets/real/regions/north-east-nalerigu.jpg', shot: 'An old earth-built church at Nalerigu',
    side: 'assets/real/regions/north-east-gambaga.jpg', shot2: 'A surviving stretch of the Naa Jaringa wall, Gambaga',
    visit: [
      { name: 'Nalerigu', note: 'The regional capital, with old earth-built architecture.', image: 'assets/real/regions/north-east-nalerigu.jpg' },
      { name: 'Naa Jaringa Wall, Gambaga', note: 'What survives of the defensive wall around old Gambaga.', image: 'assets/real/regions/north-east-gambaga.jpg' },
      { name: 'Gambaga Escarpment', note: 'A long ridge with views out over the plains.' },
      { name: 'Nakpanduri', note: 'Escarpment views at the eastern edge of the region.' }
    ],
    businesses: []
  },
  {
    slug: 'oti', name: 'Oti', capital: 'Dambai',
    known: 'Lake Volta, fishing towns and forest',
    fact: 'The region reaches deep into the Lake Volta basin.',
    intro: 'Water shapes the journeys here, linking lakeside communities, working boats and green inland roads.',
    image: 'assets/real/regions/oti-lake-volta.jpg', shot: 'A boat crossing Lake Volta',
    visit: [
      { name: 'Lake Volta at Dambai', note: 'The ferry crossing, and the working life of the lake.', image: 'assets/real/regions/oti-lake-volta.jpg' },
      { name: 'Kyabobo National Park', note: 'Hills, forest and wildlife near the Togo border.' },
      { name: 'Nkwanta', note: 'A base for walking in the Kyabobo hills.' }
    ],
    businesses: []
  },
  {
    slug: 'bono', name: 'Bono', capital: 'Sunyani',
    known: 'Sunyani, forest country and market towns',
    fact: 'Sunyani is the regional capital.',
    intro: 'Tree-lined streets, farm country and early markets make Bono a region best explored at an unhurried pace.',
    image: 'assets/real/regions/bono-sunyani-cocoa-house.jpg', shot: 'Cocoa House and the street beside it, Sunyani',
    side: 'assets/real/regions/bono-boabeng-fiema.jpg', shot2: 'A mona monkey at the Boabeng-Fiema sanctuary',
    visit: [
      { name: 'Boabeng-Fiema Monkey Sanctuary', note: 'Mona and colobus monkeys protected by the villages around them.', image: 'assets/real/regions/bono-boabeng-fiema.jpg' },
      { name: 'Sunyani', note: 'A green regional capital with a steady pace.', image: 'assets/real/regions/bono-sunyani-cocoa-house.jpg' },
      { name: 'Bui National Park', note: 'Forest, the Black Volta and hippos.' }
    ],
    businesses: []
  },
  {
    slug: 'bono-east', name: 'Bono East', capital: 'Techiman',
    known: 'Kintampo, caves, waterfalls and road trips',
    fact: 'The Kintampo Falls area is one of the region’s best-known stops.',
    intro: 'Sitting near the middle of the country, Bono East rewards the traveller who turns a through-route into a proper stop.',
    image: 'assets/real/regions/bono-east-kintampo.jpg', shot: 'Kintampo Waterfalls',
    side: 'assets/real/regions/bono-east-techiman.jpg', shot2: 'The Holy Family roundabout, Techiman',
    visit: [
      { name: 'Kintampo Waterfalls', note: 'Steps down through forest to the falls.', image: 'assets/real/regions/bono-east-kintampo.jpg' },
      { name: 'Techiman Market', note: 'One of the biggest produce markets in the country.', image: 'assets/real/regions/bono-east-techiman.jpg' },
      { name: 'Fuller Falls', note: 'A quieter waterfall near Kintampo.' },
      { name: 'Buoyem Caves', note: 'Bat caves and rock formations.' }
    ],
    businesses: []
  },
  {
    slug: 'ahafo', name: 'Ahafo', capital: 'Goaso',
    known: 'Cocoa roads, forest reserves and working towns',
    fact: 'Ahafo became a region in 2019.',
    intro: 'The landscape is deeply green and closely tied to the farms and towns that keep Ghana’s cocoa story moving.',
    image: 'assets/real/regions/ahafo-goaso.jpg', shot: 'Goaso, the regional capital',
    side: 'assets/real/regions/ahafo-goaso-town.jpg', shot2: 'Road works on the edge of Goaso',
    visit: [
      { name: 'Goaso', note: 'The regional capital, in the middle of cocoa country.', image: 'assets/real/regions/ahafo-goaso.jpg' },
      { name: 'Mim', note: 'A timber and cocoa town.' },
      { name: 'Kenyasi', note: 'A growing town in the Asutifi district.' }
    ],
    businesses: []
  },
  {
    slug: 'western-north', name: 'Western North', capital: 'Sefwi Wiawso',
    known: 'Sefwi country, cocoa farms and green roads',
    fact: 'Sefwi Wiawso is the regional capital.',
    intro: 'Rain, forest and cocoa country make this a quieter route into a part of Ghana central to how the country grows and trades.',
    image: 'assets/real/regions/western-north-bia.jpg', shot: 'Bia National Park',
    visit: [
      { name: 'Bia National Park', note: 'Forest reserve and national park in the far west.', image: 'assets/real/regions/western-north-bia.jpg' },
      { name: 'Sefwi Wiawso', note: 'The regional capital, above the cocoa country.' },
      { name: 'Cocoa country', note: "Some of Ghana's most productive cocoa farmland." }
    ],
    businesses: []
  }
];

/* Tips go to the n8n intake webhook when one is configured (config.js): n8n thanks the
   sender, looks the place up, and sends it to August for approval. A copy is always kept in
   this browser (no email, one small thumbnail) so the sender sees their tip straight away,
   marked as waiting for review. The form itself lives in tip-form.js. */
window.GhanaTips = {
  KEY: 'ghananice:tips:v1',
  config() {
    return window.GHANANICE_CONFIG || {};
  },
  isLive() {
    return !!this.config().tipEndpoint;
  },
  /* Sends one tip as multipart form data: the JSON in a `tip` field, and up to three
     already-shrunk JPEGs as photo1…photo3 (1600px) with photo1_small… (800px).
     See docs/tip-pipeline.md. */
  async submit(tip, photos = [], localCopy = {}) {
    /* Honeypot: people never see this field, form-filling bots do. Pretend it worked. */
    if (tip.website) return { ok: true, live: this.isLive() };
    if (!this.isLive()) return { ok: this.add(localCopy), live: false };
    const body = new FormData();
    body.append('tip', JSON.stringify(tip));
    photos.forEach(({ blob, small }, index) => {
      body.append(`photo${index + 1}`, blob, `photo-${index + 1}.jpg`);
      if (small) body.append(`photo${index + 1}_small`, small, `photo-${index + 1}-800.jpg`);
    });
    const response = await fetch(this.config().tipEndpoint, { method: 'POST', body });
    if (!response.ok) throw new Error(`Tip endpoint answered ${response.status}`);
    this.add(localCopy);
    return { ok: true, live: true };
  },
  /* Published listings for one region. Approved tips are committed by n8n to
     data/listings.json and deployed with the site; a directoryEndpoint overrides that. */
  async directory(slug) {
    const endpoint = this.config().directoryEndpoint;
    if (!endpoint) {
      const response = await fetch('data/listings.json', { cache: 'no-cache' });
      if (!response.ok) return [];
      const body = await response.json();
      return (body.listings || []).filter(item => item.regionSlug === slug);
    }
    const url = new URL(endpoint, location.href);
    url.searchParams.set('region', slug);
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Directory endpoint answered ${response.status}`);
    const body = await response.json();
    return Array.isArray(body) ? body : (body.items || []);
  },
  all() {
    try { return JSON.parse(localStorage.getItem(this.KEY) || '[]'); }
    catch { return []; }
  },
  forRegion(slug) {
    return this.all().filter(tip => tip.regionSlug === slug);
  },
  add(tip) {
    try {
      const tips = this.all().filter(item => item.id !== tip.id);
      tips.unshift({ ...tip, at: Date.now() });
      /* Thumbnails make each entry ~20 KB, so keep the list well inside the storage quota. */
      localStorage.setItem(this.KEY, JSON.stringify(tips.slice(0, 60)));
      return true;
    } catch { return false; }
  }
};
