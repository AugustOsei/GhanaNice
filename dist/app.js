const regions={
  'greater-accra':['Greater Accra','Ghana’s most kinetic corner: coastal history, creative studios, late-night food and neighbourhoods that change block by block.'],
  central:['Central','A coastline layered with memory, fishing towns, old forts and a rainforest canopy rising just inland.'],
  ashanti:['Ashanti','The cultural heartland of Asante history, kente craft, busy markets and deeply rooted food traditions.'],
  volta:['Volta','Mountain roads, cool waterfalls and communities stretched between Lake Volta and the Togo border.'],
  eastern:['Eastern','Green hills, botanical escapes and slower weekends within easy reach of Accra.'],
  western:['Western','Surf towns, quiet beaches, coastal forts and some of Ghana’s lushest landscapes.'],
  'western-north':['Western North','Dense forest, cocoa country and rewarding routes for travellers who like the long way round.'],
  oti:['Oti','Lake country and broad horizons, with wild landscapes made for unhurried exploration.'],
  bono:['Bono','Forest, farms and proud market towns with strong craft and food traditions.'],
  'bono-east':['Bono East','Waterfalls, caves and lake-edge communities at the meeting point of forest and savannah.'],
  ahafo:['Ahafo','Cocoa landscapes, forest reserves and small towns where local life sets the pace.'],
  northern:['Northern','Tamale’s creative energy opens onto sweeping savannah, craft villages and generous hospitality.'],
  savannah:['Savannah','Ghana at its widest: Mole’s wildlife, ancient mosques and long golden roads.'],
  'north-east':['North East','Rocky escarpments, living traditions and wide-open country shaped by the White Volta.'],
  'upper-east':['Upper East','Earth architecture, basketry, striking rock formations and borderland markets.'],
  'upper-west':['Upper West','Distinctive compounds, music traditions and resilient communities across the far northwest.']
};

const select=document.querySelector('#region-select');
const paths=[...document.querySelectorAll('[data-region]')];
const nameEl=document.querySelector('#region-name');
const copyEl=document.querySelector('#region-copy');
const countEl=document.querySelector('#region-count');
const regionButton=document.querySelector('.region-story .button');

function setRegion(key){
  const keys=Object.keys(regions); const data=regions[key]; if(!data)return;
  select.value=key; nameEl.textContent=data[0]; copyEl.textContent=data[1];
  countEl.textContent=`Region ${String(keys.indexOf(key)+1).padStart(2,'0')} / 16`;
  regionButton.firstChild.textContent=`Explore ${data[0]} `;
  paths.forEach(path=>path.classList.toggle('active',path.dataset.region===key));
}
select.addEventListener('change',e=>setRegion(e.target.value));
paths.forEach(path=>{path.setAttribute('tabindex','0');path.setAttribute('role','button');path.setAttribute('aria-label',regions[path.dataset.region][0]);path.addEventListener('click',()=>setRegion(path.dataset.region));path.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setRegion(path.dataset.region)}})});

const menu=document.querySelector('.menu-button');
const navLinks=document.querySelector('.nav-links');
menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')==='true';menu.setAttribute('aria-expanded',String(!open));navLinks.classList.toggle('open',!open)});
navLinks.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{menu.setAttribute('aria-expanded','false');navLinks.classList.remove('open')}));

const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const saveData=navigator.connection&&navigator.connection.saveData;
if(reduced||saveData){document.querySelectorAll('.reveal').forEach(el=>el.classList.add('visible'))}else{
  const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('visible');observer.unobserve(entry.target)}}),{threshold:.12});
  document.querySelectorAll('.reveal').forEach(el=>observer.observe(el));
}
requestAnimationFrame(()=>document.querySelector('.hero-copy').classList.add('visible'));

document.querySelectorAll('.filter-tabs button').forEach(button=>button.addEventListener('click',()=>{
  document.querySelectorAll('.filter-tabs button').forEach(b=>{b.classList.toggle('active',b===button);b.setAttribute('aria-selected',String(b===button))});
  document.querySelectorAll('.place-card').forEach(card=>card.classList.toggle('hidden',button.dataset.filter!=='all'&&card.dataset.type!==button.dataset.filter));
}));

document.querySelector('#listing-form').addEventListener('submit',e=>{
  e.preventDefault(); const form=e.currentTarget; const business=new FormData(form).get('business');
  form.classList.add('success');
  form.querySelector('.form-head span').textContent='Draft started';
  form.querySelector('.form-head i').textContent='Received';
  document.querySelector('#form-note').textContent=`Thanks — ${business} is in the queue. We’ll send a draft for review before anything goes live.`;
});
document.querySelector('#year').textContent=new Date().getFullYear();

// Expose the same discovery actions to browsers that support the WebMCP proposal.
if(document.modelContext?.registerTool){
  const lifecycle=new AbortController();
  const register=tool=>Promise.resolve(document.modelContext.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});
  register({
    name:'select_ghana_region',title:'Select a Ghana region',
    description:'Select one of Ghana’s 16 regions in the visible region explorer and return its introduction.',
    inputSchema:{type:'object',properties:{region:{type:'string',enum:Object.keys(regions)}},required:['region'],additionalProperties:false},
    annotations:{readOnlyHint:false,untrustedContentHint:false},
    execute(input){if(!input||!regions[input.region])throw new Error('Choose a valid Ghana region.');setRegion(input.region);document.querySelector('#regions').scrollIntoView({behavior:reduced?'auto':'smooth'});return{region:regions[input.region][0],introduction:regions[input.region][1]}}
  });
  register({
    name:'filter_discovery_cards',title:'Filter Ghana discoveries',
    description:'Filter the visible discovery cards by places, makers, or show all.',
    inputSchema:{type:'object',properties:{type:{type:'string',enum:['all','place','maker']}},required:['type'],additionalProperties:false},
    annotations:{readOnlyHint:false,untrustedContentHint:false},
    execute(input){const button=document.querySelector(`[data-filter="${input?.type}"]`);if(!button)throw new Error('Type must be all, place, or maker.');button.click();return{filter:input.type,visibleCards:document.querySelectorAll('.place-card:not(.hidden)').length}}
  });
}
