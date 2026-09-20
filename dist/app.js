const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;

const regions=[
  {name:'Greater Accra',stat:'City energy & Atlantic coast',fact:"Ghana's smallest region by area, and one of its loudest cultural engines.",intro:'Salt air, concrete, old neighbourhoods and new ideas moving at the same speed.',image:'assets/real/jamestown-lighthouse.jpg',side:'assets/real/accra-seamstress.jpg',tone:'#d94731'},
  {name:'Central',stat:'Coast, castles & canopy',fact:'Home to Kakum National Park and a coastline layered with difficult history.',intro:'Atlantic light, forest canopy and places that ask you to look longer.',image:'assets/real/cape-coast-castle.jpg',side:'assets/real/kakum-walkway.jpg',tone:'#f1c63c'},
  {name:'Volta',stat:'Waterfalls & mountain roads',fact:"Wli Falls is Ghana's highest waterfall.",intro:'A long green rhythm of water, ridges, craft and road-side discoveries.',image:'assets/real/wli-falls.jpg',side:'assets/real/independence-arch-storm.jpg',tone:'#197450'},
  {name:'Savannah',stat:'Mole, mosques & wide skies',fact:"Larabanga Mosque is among Ghana's oldest surviving mosques.",intro:'Earth architecture, patient roads and skies that make distance feel beautiful.',image:'assets/real/larabanga-mosque.jpg',side:'assets/real/wli-falls.jpg',tone:'#a892e8'},
  {name:'Western',stat:'Surf, cocoa & coast',fact:'Beaches, rainforest and working towns share the same horizon.',intro:'The country leans into the Atlantic here—green, rain-washed and unhurried.',image:'assets/real/kakum-walkway.jpg',side:'assets/real/jamestown-lighthouse.jpg',tone:'#e58b65'},
  {name:'Ashanti',stat:'Kente, craft & Kumasi',fact:'The historic heartland of Asante culture.',intro:'A region of gold-weight histories, market intelligence and living craft.',image:'assets/real/accra-seamstress.jpg',side:'assets/real/cape-coast-castle.jpg',tone:'#e8d1a4'},
  {name:'Eastern',stat:'Hills & botanical escapes',fact:'A favourite route out of Accra, climbing quickly into cooler air.',intro:'Switchback roads, garden towns and small escapes hiding beyond the city.',image:'assets/real/independence-arch-storm.jpg',side:'assets/real/wli-falls.jpg',tone:'#dd4a3d'},
  {name:'Northern',stat:'Tamale & creative energy',fact:"One of Ghana's largest regions by area.",intro:'Warm streets, ambitious kitchens and a creative scene setting its own tempo.',image:'assets/real/larabanga-mosque.jpg',side:'assets/real/accra-seamstress.jpg',tone:'#efc443'},
  {name:'Upper East',stat:'Earth homes & basketry',fact:'Bolgatanga is renowned for weaving and market craft.',intro:'Graphic compounds, bright baskets and the fine intelligence of handwork.',image:'assets/real/accra-seamstress.jpg',side:'assets/real/larabanga-mosque.jpg',tone:'#1c7959'},
  {name:'Upper West',stat:'Compounds & craft',fact:"A gateway to Ghana's far northwest.",intro:'Courtyards, long roads and traditions built to hold both heat and community.',image:'assets/real/larabanga-mosque.jpg',side:'assets/real/kakum-walkway.jpg',tone:'#b197ed'},
  {name:'North East',stat:'Escarpments & markets',fact:'Created as a region in 2019.',intro:'A young region with old trading routes and landscapes cut in bold lines.',image:'assets/real/wli-falls.jpg',side:'assets/real/larabanga-mosque.jpg',tone:'#e7573f'},
  {name:'Oti',stat:'Lake country',fact:'Its landscape reaches deep into the Lake Volta basin.',intro:'Water redraws the map here, joining fishing towns, forest and open distance.',image:'assets/real/wli-falls.jpg',side:'assets/real/kakum-walkway.jpg',tone:'#6bb68d'},
  {name:'Bono',stat:'Forest & market towns',fact:'Sunyani is its capital.',intro:'Tree-lined streets, farm country and markets that reward an early start.',image:'assets/real/kakum-walkway.jpg',side:'assets/real/accra-seamstress.jpg',tone:'#e8d1a4'},
  {name:'Bono East',stat:'Caves & waterfalls',fact:'Known for the Kintampo Falls area.',intro:'A hinge in the middle of the country, full of water, movement and stopping places.',image:'assets/real/wli-falls.jpg',side:'assets/real/kakum-walkway.jpg',tone:'#f0c138'},
  {name:'Ahafo',stat:'Cocoa & forest reserve',fact:'A newer region, formed in 2019.',intro:'Cocoa roads disappear into deep green and re-emerge in hard-working towns.',image:'assets/real/kakum-walkway.jpg',side:'assets/real/accra-seamstress.jpg',tone:'#1c7959'},
  {name:'Western North',stat:'Cocoa country & green roads',fact:'Sefwi Wiawso is its capital.',intro:'Rain, forest and cocoa country—quietly central to how Ghana tastes and trades.',image:'assets/real/kakum-walkway.jpg',side:'assets/real/cape-coast-castle.jpg',tone:'#d94731'}
];

const menu=document.querySelector('.menu-button'),navLinks=document.querySelector('.nav-links');
menu?.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')==='true';menu.setAttribute('aria-expanded',String(!open));navLinks.classList.toggle('open',!open)});
navLinks?.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{menu?.setAttribute('aria-expanded','false');navLinks.classList.remove('open')}));

/* Eight quick views live inside the Ghana silhouette, then hand off to the film. */
const heroWindow=document.querySelector('#hero-window'),heroVideo=document.querySelector('#hero-video');
const scenes=[...document.querySelectorAll('.map-scene')],sequenceCount=document.querySelector('#sequence-count'),sequenceName=document.querySelector('#sequence-name'),sequenceLedger=document.querySelector('#sequence-ledger'),sequenceSkip=document.querySelector('#sequence-skip');
const sceneNames=['JAMESTOWN','WLI','CAPE COAST','MADE IN ACCRA','LARABANGA','KAKUM','WEATHER / ACCRA','INDEPENDENCE ARCH'];
let sceneTimer,sceneIndex=0,sequenceFinished=false;
function showScene(index){sceneIndex=index;scenes.forEach((scene,i)=>scene.classList.toggle('is-active',i===index));sequenceCount.textContent=`${String(index+1).padStart(2,'0')} / 08`;sequenceName.textContent=sceneNames[index]}
function finishSequence(){if(sequenceFinished)return;sequenceFinished=true;clearTimeout(sceneTimer);showScene(7);sequenceCount.textContent='08 / 08';sequenceName.textContent='INDEPENDENCE ARCH';sequenceLedger.querySelector('span').textContent='SETTLED';sequenceLedger.classList.add('is-settled');sequenceSkip.classList.add('is-hidden');setTimeout(()=>{heroWindow.classList.remove('is-sequencing');heroWindow.classList.add('is-settled');heroVideo?.play().catch(()=>{})},280)}
function playSequence(){const holds=[135,135,150,165,190,230,320,620];showScene(sceneIndex);sceneTimer=setTimeout(()=>{if(sceneIndex===7)finishSequence();else{sceneIndex++;playSequence()}},holds[sceneIndex])}
if(reduced)finishSequence();else playSequence();sequenceSkip?.addEventListener('click',finishSequence);

const hero=document.querySelector('.hero'),heroStage=document.querySelector('.hero-stage'),siteNav=document.querySelector('.hero .nav');
const regionSection=document.querySelector('.regions'),regionRail=document.querySelector('#region-rail'),reader=document.querySelector('#region-reader');
const footfall=document.querySelector('.footfall'),rankingRows=[...document.querySelectorAll('.ranking li')],orbit=document.querySelector('.footfall-orbit');
let cards=[],selectedIndex=null,raf=false;

regions.forEach((region,index)=>{const card=document.createElement('button');card.className='region-card has-image';card.type='button';card.style.setProperty('--image',`url('${region.image}')`);card.style.setProperty('--tone',region.tone);card.innerHTML=`<span class="card-no">${String(index+1).padStart(2,'0')}</span><strong class="card-name">${region.name}</strong><small class="card-note">${region.stat}</small>`;card.setAttribute('aria-label',`Open ${region.name}`);card.addEventListener('click',()=>openRegion(index));regionRail.append(card);cards.push(card)});

function clamp(n,min=0,max=1){return Math.min(max,Math.max(min,n))}function mix(a,b,t){return a+(b-a)*t}
function layoutCards(p){
  const mobile=innerWidth<680,cardW=mobile?122:Math.min(152,innerWidth*.1),lineGap=cardW*1.08;
  const settle=clamp((p-.57)/.33),eased=1-Math.pow(1-settle,3),sweep=mix(innerWidth*.9,-innerWidth*.5,clamp(p/.57));
  const cols=mobile?4:8,gapX=mobile?140:Math.min(158,innerWidth*.122),gapY=mobile?174:Math.min(250,innerHeight*.34);
  cards.forEach((card,i)=>{const lineX=(i-7.5)*lineGap+sweep,lineY=Math.sin(i*1.7)*24,col=i%cols,row=Math.floor(i/cols),gridX=(col-(cols-1)/2)*gapX,gridY=(row-(mobile?1.5:.5))*gapY+55;card.style.setProperty('--x',mix(lineX,gridX,eased).toFixed(1));card.style.setProperty('--y',mix(lineY,gridY,eased).toFixed(1));card.style.setProperty('--r',mix((i%2?1:-1)*6,((i*7)%9)-4,eased).toFixed(2));if(selectedIndex===null)card.style.zIndex=String(i+1)})
}
function layoutDeck(active){const mobile=innerWidth<680,baseX=mobile?0:-innerWidth*.365,baseY=mobile?-innerHeight*.25:45;cards.forEach((card,i)=>{const offset=i-active;card.style.setProperty('--deck-x',(baseX+offset*1.7).toFixed(1));card.style.setProperty('--deck-y',(baseY+Math.abs(offset)*1.15).toFixed(1));card.style.setProperty('--deck-r',(offset*1.35).toFixed(2));card.style.zIndex=String(card.classList.contains('is-selected')?40:20+i)})}
function openRegion(index){
  selectedIndex=index;const region=regions[index];cards.forEach((card,i)=>card.classList.toggle('is-selected',i===index));regionSection.classList.add('has-selection');layoutDeck(index);
  document.querySelector('#reader-index').textContent=`${String(index+1).padStart(2,'0')} / 16`;document.querySelector('#reader-title').innerHTML=region.name.replace(' ','<br>');document.querySelector('#reader-intro').textContent=region.intro;document.querySelector('#reader-signal').textContent=region.stat;document.querySelector('#reader-fact').textContent=region.fact;
  const main=document.querySelector('#reader-image-main'),side=document.querySelector('#reader-image-side');main.src=region.image;main.alt=`A scene from ${region.name}`;side.src=region.side;side.alt=`Another Ghanaian scene connected to ${region.name}`;document.querySelector('#reader-caption').textContent=`Field view / ${region.name}`;
  reader.classList.add('is-open');document.querySelector('#reader-close').focus({preventScroll:true})
}
function closeReader(){selectedIndex=null;reader.classList.remove('is-open');regionSection.classList.remove('has-selection');cards.forEach(card=>card.classList.remove('is-selected'));renderScroll()}
document.querySelector('#reader-close')?.addEventListener('click',closeReader);addEventListener('keydown',e=>{if(e.key==='Escape'&&selectedIndex!==null)closeReader()});

function renderScroll(){
  if(!reduced&&hero&&heroStage){const travel=Math.max(1,hero.offsetHeight-innerHeight),p=clamp(-hero.getBoundingClientRect().top/travel),start=Math.min(innerWidth*.27,440),end=Math.max(innerWidth,innerHeight)*1.9;heroStage.style.setProperty('--mask-size',`${mix(start,end,p).toFixed(1)}px`);heroStage.style.setProperty('--map-label-opacity',String(Math.max(0,1-p*2.3)));const copy=clamp((p-.54)/.24);heroStage.style.setProperty('--hero-copy-opacity',copy);heroStage.style.setProperty('--hero-copy-y',`${(1-copy)*34}px`);siteNav?.classList.toggle('is-over-image',p>.16)}
  if(regionSection){const travel=Math.max(1,regionSection.offsetHeight-innerHeight),p=clamp(-regionSection.getBoundingClientRect().top/travel);if(selectedIndex===null)layoutCards(p);else layoutDeck(selectedIndex)}
  if(footfall&&!reduced){const travel=Math.max(1,footfall.offsetHeight-innerHeight),p=clamp(-footfall.getBoundingClientRect().top/travel),settle=1-Math.pow(1-clamp((p-.05)/.38),3);rankingRows.forEach((row,i)=>{const direction=i%2?1:-1,start=direction*(innerWidth*.48+i*18),float=Math.sin((p*3+i)*.8)*6;row.style.setProperty('--row-x',`${mix(start,float,settle).toFixed(1)}px`);row.style.setProperty('--reveal',String(clamp((p-.2-i*.018)/.38)))});orbit.style.setProperty('--orbit',(p*160).toFixed(1))}
  raf=false
}
addEventListener('scroll',()=>{if(!raf){requestAnimationFrame(renderScroll);raf=true}},{passive:true});addEventListener('resize',renderScroll);renderScroll();
document.querySelector('#year').textContent=new Date().getFullYear();
