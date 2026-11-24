// Illustrative cost assumptions only. No live travel inventory or AI API is connected.
const destinations=[
{name:'San Juan, Puerto Rico',desc:'Beaches, colorful streets, and coastal adventures',flight:310,stay:65,food:30,local:55,activities:80,tags:['beach','culture','nature'],warm:true},
{name:'Lisbon, Portugal',desc:'Historic neighborhoods, coastal views, and great food',flight:430,stay:48,food:28,local:55,activities:70,tags:['culture','beach'],warm:false},
{name:'Medellín, Colombia',desc:'Mountain views, city culture, and hiking',flight:360,stay:33,food:23,local:45,activities:65,tags:['nature','culture'],warm:true},
{name:'Reykjavík, Iceland',desc:'Waterfalls, dramatic landscapes, and hot springs',flight:330,stay:95,food:55,local:135,activities:180,tags:['nature'],warm:false},
{name:'Panama City, Panama',desc:'Rainforests, coastline, and urban exploration',flight:390,stay:44,food:28,local:55,activities:90,tags:['nature','beach','culture'],warm:true},
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
function cheapestGround(airport,days){return demoAirportOptions[airport].map(x=>({...x,total:x.roundTrip+x.parkingDaily*days})).sort((a,b)=>a.total-b.total)[0];}
function destinationMatches(prompt){
 const p=prompt.toLowerCase();
 // Explicit place requests must never silently turn into a worldwide discovery search.
 const aliases=[
  {name:'Panama City, Panama',patterns:[/\bpanama city\b/,/\bpanama\b/]},
  {name:'Mexico City, Mexico',patterns:[/\bmexico city\b/]},
  {name:'Medellín, Colombia',patterns:[/\bmedell[ií]n\b/,/\bcolombia\b/]},
  {name:'San Juan, Puerto Rico',patterns:[/\bsan juan\b/,/\bpuerto rico\b/]},
  {name:'Lisbon, Portugal',patterns:[/\blisbon\b/,/\bportugal\b/]},
  {name:'Reykjavík, Iceland',patterns:[/\breykjav[ií]k\b/,/\biceland\b/]}
 ];
 return aliases.filter(a=>a.patterns.some(re=>re.test(p))).map(a=>a.name);
}
document.getElementById('tripForm').addEventListener('submit',event=>{
 event.preventDefault();
 const inputBudget=Number(document.getElementById('budget').value),budgetType=document.getElementById('budgetType').value,days=Number(document.getElementById('days').value),travelers=Number(document.getElementById('travelers').value),style=document.getElementById('style').value,prompt=document.getElementById('prompt').value,origin=document.getElementById('origin').value.trim(),raw=document.getElementById('airports').value.trim().toUpperCase(),airports=[...new Set(raw.split(/[,;\s]+/).filter(Boolean))],output=document.getElementById('results');
 if(!origin||!airports.length||!Number.isFinite(inputBudget)||inputBudget<100||days<1||days>30||travelers<1||travelers>10){output.textContent='Please enter a starting city, airports, valid budget, trip length and travelers.';return;}
 const budget=budgetType==='person'?inputBudget*travelers:inputBudget;
 const albany=/^albany(?:,?\s*(?:ny|new york))?$/i.test(origin);
 // For other origins, compare illustrative flights only. Never reuse Albany ground prices.

 const unknown=airports.filter(a=>!demoAirportOptions[a]);if(unknown.length){output.innerHTML=`<div class="none">No demo assumptions for ${escapeHtml(unknown.join(', '))}. Try ALB, BOS, JFK, EWR, or LGA. This does not mean other airports are unavailable in real life.</div>`;return;}
 const tags=inferredTags(prompt);if(['beach','nature','culture'].includes(style))tags.push(style);
 const requested=destinationMatches(prompt);
 const candidates=requested.length?destinations.filter(d=>requested.includes(d.name)):destinations;

 const tiers=requested.length===1?[
  {name:'Budget explorer',flightFactor:1,stayFactor:.72,foodFactor:.8,localFactor:.9,activityFactor:.65,desc:'Lower-cost lodging and activities'},
  {name:'Balanced adventure',flightFactor:1,stayFactor:1,foodFactor:1,localFactor:1,activityFactor:1,desc:'A balance of comfort and activities'},
  {name:'Comfort & experiences',flightFactor:1,stayFactor:1.55,foodFactor:1.35,localFactor:1.25,activityFactor:1.65,desc:'More comfort and activity spending'}
 ]:[{name:'Sample itinerary',flightFactor:1,stayFactor:1,foodFactor:1,localFactor:1,activityFactor:1,desc:'Illustrative baseline'}];
 const results=candidates.flatMap(d=>tiers.map(tier=>{
  const comparisons=airports.map(airport=>{
   const ground=albany?cheapestGround(airport,days):{mode:'Unavailable',total:null};
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
