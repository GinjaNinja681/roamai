// Illustrative cost assumptions only. No live travel inventory or AI API is connected.
const destinations=[
{name:'San Juan, Puerto Rico',desc:'Beaches, colorful streets, and coastal adventures',flight:310,stay:65,food:30,local:55,activities:80,tags:['beach','culture','nature'],warm:true},
{name:'Lisbon, Portugal',desc:'Historic neighborhoods, coastal views, and great food',flight:430,stay:48,food:28,local:55,activities:70,tags:['culture','beach'],warm:false},
{name:'Medellín, Colombia',desc:'Mountain views, city culture, and hiking',flight:360,stay:33,food:23,local:45,activities:65,tags:['nature','culture'],warm:true},
{name:'Reykjavík, Iceland',desc:'Waterfalls, dramatic landscapes, and hot springs',flight:330,stay:95,food:55,local:135,activities:180,tags:['nature'],warm:false},
{name:'Panama City, Panama',desc:'Rainforests, coastline, and urban exploration',flight:390,stay:44,food:28,local:55,activities:90,tags:['nature','beach','culture'],warm:true},
{name:'Honolulu, Hawaii',desc:'Pacific beaches, volcanic scenery, hiking, and island culture',flight:720,stay:125,food:55,local:110,activities:150,tags:['beach','nature','culture'],warm:true},
{name:'Mexico City, Mexico',desc:'Art, architecture, museums, and food',flight:285,stay:42,food:25,local:35,activities:60,tags:['culture'],warm:true}
];
const money=n=>'$'+Math.round(n).toLocaleString('en-US');
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function inferredTags(prompt){const p=prompt.toLowerCase(),tags=[];if(/beach|ocean|warm|tropical|sun|swim/.test(p))tags.push('beach');if(/mountain|hik|nature|outdoor|park|adventure/.test(p))tags.push('nature');if(/city|cities|museum|historic|culture|food|art/.test(p))tags.push('culture');return tags;}
// DEMO ONLY: fictional airport transport and fare variations; not real fares, routes, or timetables.
const demoAirportOptions={
 ALB:[{mode:'Drive and park',roundTrip:32,parkingDaily:13},{mode:'Bus / train',roundTrip:40,parkingDaily:0},{mode:'Rideshare',roundTrip:65,parkingDaily:0}],
 BOS:[{mode:'Drive and park',roundTrip:95,parkingDaily:22},{mode:'Bus / train',roundTrip:110,parkingDaily:0},{mode:'Rideshare',roundTrip:330,parkingDaily:0}],
 JFK:[{mode:'Drive and park',roundTrip:110,parkingDaily:35},{mode:'Bus / train',roundTrip:100,parkingDaily:0},{mode:'Rideshare',roundTrip:390,parkingDaily:0}],
 EWR:[{mode:'Drive and park',roundTrip:105,parkingDaily:27},{mode:'Bus / train',roundTrip:85,parkingDaily:0},{mode:'Rideshare',roundTrip:340,parkingDaily:0}],
 LGA:[{mode:'Drive and park',roundTrip:105,parkingDaily:32},{mode:'Bus / train',roundTrip:100,parkingDaily:0},{mode:'Rideshare',roundTrip:370,parkingDaily:0}]
};
const demoFareFactors={ALB:1.18,BOS:.92,JFK:.89,EWR:.94,LGA:1.04};
function cheapestGround(airport,days,travelers){return demoAirportOptions[airport].map(x=>({...x,total:x.roundTrip*(x.mode==='Bus / train'?travelers:1)+x.parkingDaily*days})).sort((a,b)=>a.total-b.total)[0];}
function destinationMatches(prompt){
 const p=prompt.toLowerCase();
 // Explicit place requests must never silently turn into a worldwide discovery search.
 const aliases=[
  {name:'Honolulu, Hawaii',patterns:[/\bhawai(?:i|ian)?\b/,/\bhonolulu\b/,/\boahu\b/,/\bwaikiki\b/]},
  {name:'Panama City, Panama',patterns:[/\bpanama city\b/,/\bpanama\b/]},
  {name:'Mexico City, Mexico',patterns:[/\bmexico(?: city)?\b/]},
  {name:'Medellín, Colombia',patterns:[/\bmedell[ií]n\b/,/\bcolombia\b/]},
  {name:'San Juan, Puerto Rico',patterns:[/\bsan juan\b/,/\bpuerto rico\b/]},
  {name:'Lisbon, Portugal',patterns:[/\blisbon\b/,/\bportugal\b/]},
  {name:'Reykjavík, Iceland',patterns:[/\breykjav[ií]k\b/,/\biceland\b/]}
 ];
 return aliases.filter(a=>a.patterns.some(re=>re.test(p))).map(a=>a.name);
}
document.getElementById('tripForm').addEventListener('submit',async event=>{
 event.preventDefault();
 const inputBudget=Number(document.getElementById('budget').value),budgetType=document.getElementById('budgetType').value,days=Number(document.getElementById('days').value),travelers=Number(document.getElementById('travelers').value),style=document.getElementById('style').value,prompt=document.getElementById('prompt').value,origin=document.getElementById('origin').value.trim(),raw=document.getElementById('airports').value.trim().toUpperCase(),airports=[...new Set(raw.split(/[,;\s]+/).filter(Boolean))],output=document.getElementById('results');
 if(!origin||!Number.isFinite(inputBudget)||inputBudget<100||days<1||days>30||travelers<1||travelers>10){output.textContent='Please enter a starting city, airports, valid budget, trip length and travelers.';return;}
 const budget=budgetType==='person'?inputBudget*travelers:inputBudget;
 const albany=/^albany(?:,?\s*(?:ny|new york))?$/i.test(origin);
 // For other origins, compare illustrative flights only. Never reuse Albany ground prices.

 
 const tags=inferredTags(prompt);if(['beach','nature','culture'].includes(style))tags.push(style);
 const explicit=document.getElementById('destination').value.trim();
 const requested=destinationMatches(explicit||prompt);
 if(explicit && (!requested.length || !destinations.some(d=>normalize(d.name)===normalize(explicit)) && !demoAliases.has(normalize(explicit)))){await showGeography(explicit,origin,airports,output);return;}
 if(!explicit && prompt.trim() && !requested.length && !/^(?:anywhere|somewhere|open to anywhere|i want somewhere|i want to go somewhere|find me somewhere)\b/i.test(prompt.trim())){await showGeography(prompt.trim(),origin,airports,output);return;}
 if(!explicit && requested.length && /\b(?:avoid|exclude|not|except|no)\b/i.test(prompt)){output.textContent='Please enter your desired destination in the destination field. This prototype cannot reliably interpret exclusions.';return;}
 if(!airports.length || airports.some(a=>!demoAirportOptions[a])){await showGeography(explicit||requested.join(', ')||'',origin,airports,output);return;}
 const candidates=requested.length?destinations.filter(d=>requested.includes(d.name)):destinations;

 const tiers=requested.length===1?[
  {name:'Budget explorer',flightFactor:1,stayFactor:.72,foodFactor:.8,localFactor:.9,activityFactor:.65,desc:'Lower-cost lodging and activities'},
  {name:'Balanced adventure',flightFactor:1,stayFactor:1,foodFactor:1,localFactor:1,activityFactor:1,desc:'A balance of comfort and activities'},
  {name:'Comfort & experiences',flightFactor:1,stayFactor:1.55,foodFactor:1.35,localFactor:1.25,activityFactor:1.65,desc:'More comfort and activity spending'}
 ]:[{name:'Sample itinerary',flightFactor:1,stayFactor:1,foodFactor:1,localFactor:1,activityFactor:1,desc:'Illustrative baseline'}];
 const results=candidates.flatMap(d=>tiers.map(tier=>{
  const comparisons=airports.map(airport=>{
   const ground=albany?cheapestGround(airport,days,travelers):{mode:'Unavailable',total:null};
   const flight=Math.round(d.flight*demoFareFactors[airport]*tier.flightFactor)*travelers;
   return {airport,ground,flight,subtotal:flight+(ground.total??0)};
  }).sort((a,b)=>a.subtotal-b.subtotal);
  const best=comparisons[0];
  const stay=Math.round(d.stay*tier.stayFactor*(days-1)*Math.ceil(travelers/2));
  const food=Math.round(d.food*tier.foodFactor*days*travelers);
  const local=Math.round(d.local*tier.localFactor*travelers);
  const activities=Math.round(d.activities*tier.activityFactor*travelers);
  const total=best.subtotal+stay+food+local+activities;
  const match=tags.filter(t=>d.tags.includes(t)).length;
  return {...d,tier,best,comparisons,stay,food,local,activities,total,match,within:total<=budget};
 }));
 results.sort((a,b)=>Number(b.within)-Number(a.within)||(requested.length===1?a.total-b.total:style==='cheapest'?a.total-b.total:(b.match-a.match)*180+a.total-b.total));
 const airportNote=albany?'Includes fictional Albany-origin airport transfers.':'Airport transfers from this starting city are unavailable; totals are incomplete and should not be used for booking decisions.';
 output.innerHTML=`<h2>${requested.length===1?'Three sample packages for '+escapeHtml(requested[0]):'Your trip comparisons'}</h2>
 <p class="sub">Starting in ${escapeHtml(origin)} · Airports: ${escapeHtml(airports.join(', '))} · ${travelers} traveler(s) · ${days} days · ${money(budget)} ${budgetType==='person'?'combined group budget ('+money(inputBudget)+' per person)':'group budget'}</p>
 <div class="none">ILLUSTRATIVE DEMO ONLY — no real flights, hotels, transport schedules, availability or prices have been checked. Package tiers are hypothetical spending assumptions, not bookable offers. ${escapeHtml(airportNote)}</div>
 <div class="cards">${results.slice(0,3).map((d,i)=>`<article class="card ${i===0&&d.within&&albany?'best':''}">
 <div class="flag">${escapeHtml(d.tier.name.toUpperCase())}</div><h3>${escapeHtml(d.name)}</h3><div class="desc">${escapeHtml(d.tier.desc)} · ${escapeHtml(d.desc)}</div>
 <div class="price">${money(d.total)}${!albany?' + airport transfer':''}</div>
 <div class="status ${d.within&&albany?'within':'over'}">${albany?(d.within?money(budget-d.total)+' under budget':money(d.total-budget)+' over budget'):'Incomplete estimate — budget fit unknown'}</div>
 <div class="costs"><div>Selected airport (sample)<strong>${d.best.airport}</strong></div>
 <div>Airport transport<strong>${escapeHtml(d.best.ground.mode)}</strong></div>
 <div>Round-trip flights<strong>${money(d.best.flight)}</strong></div>
 <div>Airport transport & parking<strong>${d.best.ground.total===null?'Not available':money(d.best.ground.total)}</strong></div>
 <div>Lodging<strong>${money(d.stay)}</strong></div><div>Food<strong>${money(d.food)}</strong></div>
 <div>Local transport<strong>${money(d.local)}</strong></div><div>Activities<strong>${money(d.activities)}</strong></div></div>
 <h4>Airport comparisons (fictional)</h4><div class="costs">${d.comparisons.map(c=>`<div>${c.airport} · ${escapeHtml(c.ground.mode)}<strong>${money(c.subtotal)}${c.ground.total===null?' + transfer':''}</strong></div>`).join('')}</div>
 <div class="note">No actual bookings, prices, travel dates, or routes verified.</div></article>`).join('')}</div>
 <p class="note">${requested.length===1?'All three packages stay within the requested destination, using different hypothetical spending levels.':requested.length?'Only requested destinations are shown.':'Showing sample destinations because no recognized specific destination was provided.'} Keyword matching only; no AI model or live booking data connected.</p>`;
 output.scrollIntoView({behavior:'smooth',block:'start'});
});
const normalize=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
const demoAliases=new Set(['hawai','hawaii','honolulu','oahu','waikiki','panama','panama city','mexico','mexico city','colombia','medellin','san juan','puerto rico','lisbon','portugal','reykjavik','iceland']);
const cache=new Map();
async function places(q){if(q.length<2)return [];if(cache.has(q))return cache.get(q);const r=await fetch('https://geocoding-api.open-meteo.com/v1/search?name='+encodeURIComponent(q.split(',')[0].trim())+'&count=20&language=en&format=json',{signal:AbortSignal.timeout(12000)});if(!r.ok)throw Error('Location service unavailable');const a=(await r.json()).results||[];const suffix=normalize(q.split(',').slice(1).join(',')).replace(/^ny$/,'new york');const sorted=a.sort((x,y)=>Number(normalize([y.admin1,y.country].join(' ')).includes(suffix))-Number(normalize([x.admin1,x.country].join(' ')).includes(suffix)));cache.set(q,sorted);return sorted;}
const placeLabel=x=>[x.name,x.admin1,x.country].filter(Boolean).filter((v,i,a)=>a.indexOf(v)===i).join(', ');
for(const id of ['origin','destination']){const el=document.getElementById(id);let timer;el.addEventListener('input',()=>{clearTimeout(timer);const q=el.value.trim();timer=setTimeout(async()=>{try{const a=await places(q);if(el.value.trim()!==q)return;const list=document.getElementById(id+'List');list.replaceChildren(...a.map(x=>{const o=document.createElement('option');o.value=placeLabel(x);return o;}));}catch(e){document.getElementById(id+'Status').textContent='Location lookup temporarily unavailable.';}},450);});}
let airportPromise;
function parseCSV(line){const out=[];let v='',quoted=false;for(let i=0;i<line.length;i++){const c=line[i];if(c==='"'){if(quoted&&line[i+1]==='"'){v+='"';i++;}else quoted=!quoted;}else if(c===','&&!quoted){out.push(v);v='';}else v+=c;}out.push(v);return out;}
async function airportData(){if(!airportPromise)airportPromise=(async()=>{const r=await fetch('https://raw.githubusercontent.com/davidmegginson/ourairports-data/main/airports.csv',{signal:AbortSignal.timeout(25000)});if(!r.ok)throw Error('Airport data unavailable');const lines=(await r.text()).trim().split(/\r?\n/);const head=parseCSV(lines.shift());const ix=k=>head.indexOf(k);return lines.map(parseCSV).filter(a=>['large_airport','medium_airport'].includes(a[ix('type')])&&a[ix('scheduled_service')]==='yes'&&/^[A-Z]{3}$/.test(a[ix('iata_code')])).map(a=>({code:a[ix('iata_code')],name:a[ix('name')],lat:+a[ix('latitude_deg')],lon:+a[ix('longitude_deg')]}));})().catch(e=>{airportPromise=null;throw e;});return airportPromise;}
function km(a,b){const r=Math.PI/180;const h=Math.sin((b.lat-a.latitude)*r/2)**2+Math.cos(a.latitude*r)*Math.cos(b.lat*r)*Math.sin((b.lon-a.longitude)*r/2)**2;return 6371*2*Math.asin(Math.sqrt(Math.min(1,h)));}
async function nearby(q){const a=await places(q);if(!a.length)throw Error('City not found');const city=a.find(x=>normalize(placeLabel(x))===normalize(q))||a[0];const airports=(await airportData()).map(x=>({...x,distance:km(city,x)})).sort((a,b)=>a.distance-b.distance).slice(0,6);return {city,airports};}
document.getElementById('suggestAirports').addEventListener('click',async()=>{const status=document.getElementById('airportStatus');status.textContent=' Looking up airports…';try{const {city,airports}=await nearby(document.getElementById('origin').value.trim());const el=document.getElementById('airports');el.value=[...new Set([...el.value.toUpperCase().split(/[,;\s]+/).filter(Boolean),...airports.map(a=>a.code)])].join(', ');status.textContent=' '+placeLabel(city)+': '+airports.map(a=>a.code+' ('+Math.round(a.distance)+' km)').join(', ')+'. Straight-line distances, not driving routes.';}catch(e){status.textContent=' '+e.message+'. Enter airport codes manually.';}});
async function showGeography(q,origin,codes,out){out.textContent='Looking up geography…';let dest=[],country=null,near=null;const clean=q.replace(/^(?:trip to|travel to|visit|fly to|go to)\s+/i,'');const jobs=[(async()=>{if(!clean)return;try{const r=await fetch('https://restcountries.com/v3.1/name/'+encodeURIComponent(clean)+'?fullText=true&fields=name,capital',{signal:AbortSignal.timeout(10000)});if(r.ok){const a=await r.json();country=a[0];}}catch{}if(!country)try{dest=await places(clean);}catch{}})(),(async()=>{try{near=await nearby(origin);}catch{}})()];await Promise.all(jobs);out.innerHTML='<h2>Geographic search</h2><div class="none">No verified travel prices available for this request. No unrelated destinations or invented packages are shown.</div>'+(country?'<p>Country: '+escapeHtml(country.name.common)+' · Capital: '+escapeHtml((country.capital||[]).join(', '))+'</p>':dest.length?'<p>Possible destination matches: '+dest.slice(0,5).map(x=>escapeHtml(placeLabel(x))).join(' · ')+'</p>':q?'<p>Destination could not be confirmed. Try the city or country name alone, or select a suggestion.</p>':'')+(near?'<p>Starting city: '+escapeHtml(placeLabel(near.city))+'</p><p>Nearby airports (straight-line distance): '+near.airports.map(x=>escapeHtml(x.code+' — '+x.name+' ('+Math.round(x.distance)+' km)')).join(' · ')+'</p>':'<p>Starting city or airport lookup unavailable. Try again or enter airport codes manually.</p>')+'<p>Selected airports: '+escapeHtml(codes.join(', ')||'None')+'</p><p>Flight prices, lodging, and ground transport fares are not connected yet.</p>';out.scrollIntoView({behavior:'smooth'});}
