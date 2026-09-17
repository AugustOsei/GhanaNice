const regionData={
  'greater-accra':['Greater<br>Accra','Coastal history, studio culture, late-night food and neighbourhoods that shift mood from block to block.'],
  central:['Central','A shoreline layered with memory, fishing towns, old forts and a rainforest canopy rising just inland.'],
  ashanti:['Ashanti','The cultural heartland of Asante history, kente craft, busy markets and deeply rooted food traditions.'],
  volta:['Volta','Mountain roads, cool waterfalls and communities stretched between Lake Volta and the Togo border.'],
  eastern:['Eastern','Green hills, botanical escapes and slower weekends within easy reach of Accra.'],
  western:['Western','Surf towns, quiet beaches, coastal forts and some of Ghana’s lushest landscapes.'],
  'western-north':['Western<br>North','Dense forest, cocoa country and rewarding routes for travellers who prefer the long way round.'],
  oti:['Oti','Lake country and broad horizons, with wild landscapes made for unhurried exploration.'],
  bono:['Bono','Forest, farms and proud market towns with strong craft and food traditions.'],
  'bono-east':['Bono East','Waterfalls, caves and lake-edge communities where forest meets savannah.'],
  ahafo:['Ahafo','Cocoa landscapes, forest reserves and small towns where local life sets the pace.'],
  northern:['Northern','Tamale’s creative energy opens onto sweeping savannah, craft villages and generous hospitality.'],
  savannah:['Savannah','Ghana at its widest: Mole’s wildlife, ancient mosques and long golden roads.'],
  'north-east':['North East','Rocky escarpments, living traditions and wide-open country shaped by the White Volta.'],
  'upper-east':['Upper East','Earth architecture, basketry, striking rock formations and borderland markets.'],
  'upper-west':['Upper West','Distinctive compounds, music traditions and resilient communities across the far northwest.']
};

const keys=Object.keys(regionData),select=document.querySelector('#region-select'),paths=[...document.querySelectorAll('.map-shape [data-region]')];
const regionName=document.querySelector('#region-name'),regionDescription=document.querySelector('#region-description'),regionNumber=document.querySelector('#region-number');
let currentRegion=0;
function setRegion(key){
  const index=keys.indexOf(key);if(index<0)return;currentRegion=index;
  const [name,copy]=regionData[key];select.value=key;regionName.innerHTML=name;regionDescription.textContent=copy;regionNumber.textContent=String(index+1).padStart(2,'0');
  paths.forEach(path=>path.classList.toggle('active',path.dataset.region===key));
  document.querySelector('.ghana-map').style.transform=`translate3d(${(index%3-1)*3}px,${(index%4-1.5)*-3}px,0) scale(1.01)`;
}
select.addEventListener('change',e=>setRegion(e.target.value));
document.querySelector('#region-prev').addEventListener('click',()=>setRegion(keys[(currentRegion-1+keys.length)%keys.length]));
document.querySelector('#region-next').addEventListener('click',()=>setRegion(keys[(currentRegion+1)%keys.length]));
paths.forEach(path=>{path.setAttribute('tabindex','0');path.setAttribute('role','button');path.setAttribute('aria-label',regionData[path.dataset.region][0].replace('<br>',' '));const activate=()=>setRegion(path.dataset.region);path.addEventListener('click',activate);path.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();activate()}})});

const menu=document.querySelector('.menu-button'),nav=document.querySelector('.nav-links');
menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')==='true';menu.setAttribute('aria-expanded',String(!open));nav.classList.toggle('open',!open)});
nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{menu.setAttribute('aria-expanded','false');nav.classList.remove('open')}));

const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,saveData=Boolean(navigator.connection&&navigator.connection.saveData),video=document.querySelector('#hero-video');
if(reduced||saveData){video.pause();video.removeAttribute('autoplay');video.querySelectorAll('source').forEach(source=>source.remove());video.load()}

const reveals=[...document.querySelectorAll('.reveal')];
if(reduced){reveals.forEach(el=>el.classList.add('visible'))}else{const revealObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('visible');revealObserver.unobserve(entry.target)}}),{threshold:.13});reveals.forEach(el=>revealObserver.observe(el))}

if(!reduced&&!saveData){
  const parallax=[...document.querySelectorAll('[data-parallax]')],heroCopy=document.querySelector('.hero-copy');let ticking=false;
  const update=()=>{const view=innerHeight,scroll=scrollY;parallax.forEach(el=>{const rect=el.parentElement.getBoundingClientRect(),speed=Number(el.dataset.speed||.08),progress=(view-rect.top)/(view+rect.height),y=(progress-.5)*rect.height*speed;el.style.transform=`translate3d(0,${y.toFixed(1)}px,0)`});const heroFade=Math.max(0,1-scroll/(view*.72));heroCopy.style.opacity=heroFade;heroCopy.style.transform=`translate3d(0,calc(-48% + ${(scroll*.08).toFixed(1)}px),0)`;ticking=false};
  addEventListener('scroll',()=>{if(!ticking){requestAnimationFrame(update);ticking=true}},{passive:true});update();
}

const form=document.querySelector('#ai-form'),steps=[...document.querySelectorAll('.process-steps>div')],preview=document.querySelector('#listing-preview'),status=document.querySelector('#ai-status');let aiTimers=[];
function runPreview(business){
  aiTimers.forEach(clearTimeout);aiTimers=[];steps.forEach(step=>step.className='');preview.classList.add('processing');status.textContent='READING';
  const labels=['READING','CLASSIFYING','WRITING','READY'];
  steps.forEach((step,index)=>{
    const timer=setTimeout(()=>{
      steps.slice(0,index).forEach(done=>done.className='done');
      step.className='running';status.textContent=labels[index];
      if(index===3){
        const finish=setTimeout(()=>{
          step.className='done';preview.classList.remove('processing');
          document.querySelector('#listing-name').textContent=business;
          document.querySelector('.listing-art>span').textContent=(business.trim()[0]||'G').toUpperCase();
          document.querySelector('#listing-meta').textContent='Independent maker · Greater Accra';
          document.querySelector('#listing-copy').textContent=`${business} is presented as a Ghana-made studio with a concise story, clear category and location—ready for the owner to review before publication.`;
          status.textContent='DRAFT READY';
        },500);
        aiTimers.push(finish);
      }
    },index*620);
    aiTimers.push(timer);
  });
}
form.addEventListener('submit',e=>{e.preventDefault();runPreview(new FormData(form).get('business').trim()||'Local business')});
document.querySelector('#year').textContent=new Date().getFullYear();

if(document.modelContext?.registerTool){
  const lifecycle=new AbortController(),register=tool=>Promise.resolve(document.modelContext.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});
  register({name:'select_ghana_region',title:'Select a Ghana region',description:'Select one of Ghana’s sixteen regions in the visible explorer.',inputSchema:{type:'object',properties:{region:{type:'string',enum:keys}},required:['region'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute(input){if(!input||!regionData[input.region])throw new Error('Choose a valid Ghana region.');setRegion(input.region);document.querySelector('#regions').scrollIntoView({behavior:reduced?'auto':'smooth'});return{region:regionData[input.region][0].replace('<br>',' '),introduction:regionData[input.region][1]}}});
  register({name:'preview_ai_listing',title:'Preview an AI-enriched listing',description:'Run the on-page AI enrichment demonstration for a local business name.',inputSchema:{type:'object',properties:{business:{type:'string',minLength:1,maxLength:80}},required:['business'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:true},execute(input){if(!input?.business?.trim())throw new Error('Business name is required.');runPreview(input.business.trim());document.querySelector('#ai-studio').scrollIntoView({behavior:reduced?'auto':'smooth'});return{status:'drafting',business:input.business.trim(),note:'Interactive preview only; no information was sent.'}}});
}
