const regionData={
  'greater-accra':['Greater<br>Accra','Coastal history, studio culture, late-night food and neighbourhoods that shift mood from block to block.'],
  central:['Central','A shoreline layered with memory, fishing towns, old forts and a rainforest canopy rising just inland.'],
  ashanti:['Ashanti','The cultural heartland of Asante history, kente craft, busy markets and deeply rooted food traditions.'],
  volta:['Volta','Mountain roads, cool waterfalls and communities stretched between Lake Volta and the Togo border.'],
  eastern:['Eastern','Green hills, botanical escapes and slower weekends within easy reach of Accra.'],
  western:['Western','Surf towns, quiet beaches, coastal forts and some of Ghana’s lushest landscapes.'],
  'western-north':['Western<br>North','Dense forest, cocoa country and rewarding routes for travellers who prefer the long way round.'],
  oti:['Oti','Lake country and broad horizons, with wild landscapes made for unhurried exploration.'],bono:['Bono','Forest, farms and proud market towns with strong craft and food traditions.'],
  'bono-east':['Bono East','Waterfalls, caves and lake-edge communities where forest meets savannah.'],ahafo:['Ahafo','Cocoa landscapes, forest reserves and small towns where local life sets the pace.'],
  northern:['Northern','Tamale’s creative energy opens onto sweeping savannah, craft villages and generous hospitality.'],savannah:['Savannah','Ghana at its widest: Mole’s wildlife, ancient mosques and long golden roads.'],
  'north-east':['North East','Rocky escarpments, living traditions and wide-open country shaped by the White Volta.'],'upper-east':['Upper East','Earth architecture, basketry, striking rock formations and borderland markets.'],'upper-west':['Upper West','Distinctive compounds, music traditions and resilient communities across the far northwest.']
};

const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const saveData=Boolean(navigator.connection&&navigator.connection.saveData);
const video=document.querySelector('#hero-video');
if(reduced||saveData){video.pause();video.removeAttribute('autoplay');video.querySelectorAll('source').forEach(source=>source.remove());video.load()}

const menu=document.querySelector('.menu-button'),nav=document.querySelector('.nav-links');
menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')==='true';menu.setAttribute('aria-expanded',String(!open));nav.classList.toggle('open',!open)});
nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{menu.setAttribute('aria-expanded','false');nav.classList.remove('open')}));

const reveals=[...document.querySelectorAll('.reveal')];
if(reduced){reveals.forEach(el=>el.classList.add('visible'))}else{const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('visible');observer.unobserve(entry.target)}}),{threshold:.12});reveals.forEach(el=>observer.observe(el))}

const dispatch=document.querySelector('.dispatches'),rail=document.querySelector('#film-rail'),progressBar=document.querySelector('#dispatch-progress'),depthEls=[...document.querySelectorAll('[data-depth]')];
let raf=false;
function motionFrame(){
  const vh=innerHeight;
  if(!reduced){
    const rect=dispatch.getBoundingClientRect();
    const travel=Math.max(1,dispatch.offsetHeight-vh);
    const p=Math.min(1,Math.max(0,-rect.top/travel));
    const railTravel=Math.max(0,rail.scrollWidth-innerWidth+innerWidth*.08);
    rail.style.transform=`translate3d(${-p*railTravel}px,0,0)`;
    progressBar.style.width=`${p*100}%`;
    depthEls.forEach(el=>{const parent=el.parentElement.getBoundingClientRect(),speed=Number(el.dataset.depth||.05);const local=(vh-parent.top)/(vh+parent.height)-.5;el.style.transform=`translate3d(0,${(local*parent.height*speed).toFixed(1)}px,0)`});
    const title=document.querySelector('.hero-title');
    const fade=Math.max(0,1-scrollY/(vh*.82));title.style.opacity=fade;title.style.transform=`translate3d(0,calc(-47% + ${(scrollY*.07).toFixed(1)}px),0)`;
  }
  raf=false;
}
addEventListener('scroll',()=>{if(!raf){requestAnimationFrame(motionFrame);raf=true}},{passive:true});addEventListener('resize',motionFrame);motionFrame();

const keys=Object.keys(regionData),select=document.querySelector('#region-select'),paths=[...document.querySelectorAll('.map-shape [data-region]')];
const regionName=document.querySelector('#region-name'),regionDescription=document.querySelector('#region-description'),regionNumber=document.querySelector('#region-number');let currentRegion=0;
function setRegion(key){const index=keys.indexOf(key);if(index<0)return;currentRegion=index;const [name,copy]=regionData[key];select.value=key;regionName.innerHTML=name;regionDescription.textContent=copy;regionNumber.textContent=String(index+1).padStart(2,'0');paths.forEach(path=>path.classList.toggle('active',path.dataset.region===key));document.querySelector('.ghana-map').style.transform=`translate3d(${(index%3-1)*5}px,${(index%4-1.5)*-5}px,0) rotate(${(index%3-1)*.5}deg)`}
select.addEventListener('change',e=>setRegion(e.target.value));document.querySelector('#region-prev').addEventListener('click',()=>setRegion(keys[(currentRegion-1+keys.length)%keys.length]));document.querySelector('#region-next').addEventListener('click',()=>setRegion(keys[(currentRegion+1)%keys.length]));
paths.forEach(path=>{path.setAttribute('tabindex','0');path.setAttribute('role','button');path.setAttribute('aria-label',regionData[path.dataset.region][0].replace('<br>',' '));const activate=()=>setRegion(path.dataset.region);path.addEventListener('click',activate);path.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();activate()}})});

const form=document.querySelector('#ai-form'),flow=document.querySelector('.signal-flow'),status=document.querySelector('#ai-status');let timers=[];
function buildListing(business){timers.forEach(clearTimeout);timers=[];flow.classList.add('working');status.textContent='READING';['FINDING','SHAPING','REVIEW'].forEach((label,i)=>timers.push(setTimeout(()=>status.textContent=label,(i+1)*520)));timers.push(setTimeout(()=>{document.querySelector('#listing-name').textContent=business;document.querySelector('#listing-meta').textContent='Independent maker / Greater Accra';document.querySelector('#listing-copy').textContent=`${business} becomes a clear Ghana-made listing with its category, location and story structured for the owner to check before publication.`;status.textContent='DRAFT READY';flow.classList.remove('working')},2200))}
form.addEventListener('submit',e=>{e.preventDefault();buildListing(new FormData(form).get('business').trim()||'Local business')});document.querySelector('#year').textContent=new Date().getFullYear();

if(document.modelContext?.registerTool){const lifecycle=new AbortController(),register=tool=>Promise.resolve(document.modelContext.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});register({name:'select_ghana_region',title:'Select a Ghana region',description:'Select one of Ghana’s sixteen regions in the visible field atlas.',inputSchema:{type:'object',properties:{region:{type:'string',enum:keys}},required:['region'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute(input){if(!input||!regionData[input.region])throw new Error('Choose a valid Ghana region.');setRegion(input.region);document.querySelector('#regions').scrollIntoView({behavior:reduced?'auto':'smooth'});return{region:regionData[input.region][0].replace('<br>',' '),introduction:regionData[input.region][1]}}});register({name:'preview_ai_listing',title:'Preview an AI-enriched listing',description:'Run the on-page AI enrichment demonstration for a local Ghanaian business.',inputSchema:{type:'object',properties:{business:{type:'string',minLength:1,maxLength:80}},required:['business'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:true},execute(input){if(!input?.business?.trim())throw new Error('Business name is required.');buildListing(input.business.trim());document.querySelector('#studio').scrollIntoView({behavior:reduced?'auto':'smooth'});return{status:'drafting',business:input.business.trim(),note:'Interactive preview only; no information was sent.'}}})}
