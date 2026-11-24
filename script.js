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
document.getElementById('tripForm').addEventListener('submit',event=>{
 event.preventDefault();
 const budget=Number(document.getElementById('budget').value),days=Number(document.getElementById('days').value),travelers=Number(document.getElementById('travelers').value),style=document.getElementById('style').value,prompt=document.getElementById('prompt').value,origin=document.getElementById('origin').value.trim(),raw=document.getElementById('airports').value.trim().toUpperCase(),airports=[...new Set(raw.split(/[,;\s]+/).filter(Boolean))],output=document.getElementById('results');
 if(!origin||!airports.length||!Number.isFinite(budget)||budget<100||days<1||days>30||travelers<1||travelers>10){output.textContent='Please enter a starting city, airports, valid budget, trip length and travelers.';return;}
 if(!/^albany(?:,?\s*(?:ny|new york))?$/i.test(origin)){output.innerHTML='<div class="none">This free demo currently has fictional ground transportation assumptions for Albany, NY only. Enter Albany, NY to try the comparison. Other origins will need route data integrations.</div>';return;}
 const unknown=airports.filter(a=>!demoAirportOptions[a]);if(unknown.length){output.innerHTML=`<div class="none">No demo assumptions for ${escapeHtml(unknown.join(', '))}. Try ALB, BOS, JFK, EWR, or LGA. This does not mean other airports are unavailable in real life.</div>`;return;}
 const tags=inferredTags(prompt);if(['beach','nature','culture'].includes(style))tags.push(style);
 const results=destinations.map(d=>{
  const comparisons=airports.map(airport=>{const ground=cheapestGround(airport,days),flight=Math.round(d.flight*demoFareFactors[airport])*travelers;return {airport,ground,flight,subtotal:ground.total+flight};}).sort((a,b)=>a.subtotal-b.subtotal);
  const best=comparisons[0],stay=d.stay*(days-1)*Math.ceil(travelers/2),food=d.food*days*travelers,local=d.local*travelers,activities=d.activities*travelers,total=best.subtotal+stay+food+local+activities,match=tags.filter(t=>d.tags.includes(t)).length;
  return {...d,best,comparisons,stay,food,local,activities,total,match,within:total<=budget};
 });
 results.sort((a,b)=>Number(b.within)-Number(a.within)||(style==='cheapest'?a.total-b.total:(b.match-a.match)*180+a.total-b.total));
 output.innerHTML=`<h2>Your trip comparisons</h2><p class="sub">Starting in Albany, NY · Airports: ${escapeHtml(airports.join(', '))} · ${travelers} traveler(s) · ${days} days · ${money(budget)} budget</p><div class="none">DEMO ASSUMPTIONS ONLY — all flight, bus, train, driving, parking and rideshare costs below are fictional examples, not researched prices. The demo assumes transport costs are shared by the party, and does not check route availability, dates, or schedules.</div><div class="cards">${results.slice(0,3).map((d,i)=>`<article class="card ${i===0&&d.within?'best':''}"><div class="flag">${i===0&&d.within?'✦ TOP DEMO MATCH':'SAMPLE DESTINATION'}</div><h3>${escapeHtml(d.name)}</h3><div class="desc">${escapeHtml(d.desc)}</div><div class="price">${money(d.total)}</div><div class="status ${d.within?'within':'over'}">${d.within?money(budget-d.total)+' under budget':money(d.total-budget)+' over budget'}</div><div class="costs"><div>Selected airport<strong>${d.best.airport}</strong></div><div>Suggested airport transfer<strong>${escapeHtml(d.best.ground.mode)}</strong></div><div>Round-trip flights (sample)<strong>${money(d.best.flight)}</strong></div><div>Round-trip airport transfer + parking (sample)<strong>${money(d.best.ground.total)}</strong></div><div>Lodging<strong>${money(d.stay)}</strong></div><div>Food<strong>${money(d.food)}</strong></div><div>Local transport<strong>${money(d.local)}</strong></div><div>Activities<strong>${money(d.activities)}</strong></div></div><h4>Airport comparisons (fictional)</h4><div class="costs">${d.comparisons.map(c=>`<div>${c.airport} · ${escapeHtml(c.ground.mode)}<strong>${money(c.subtotal)}</strong></div>`).join('')}</div><div class="note">Airport comparison includes sample flights + cheapest modeled airport transfer. No live fares or transport routes were verified.</div></article>`).join('')}</div><p class="note">Keyword matching, not live AI. These sample rankings do not represent real-world deals or the true cheapest airport.</p>`;
 output.scrollIntoView({behavior:'smooth',block:'start'});
});
