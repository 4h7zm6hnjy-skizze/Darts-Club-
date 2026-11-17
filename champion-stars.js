/* Champion titles, dated awards and automatic reconciliation. */
(function(root){
'use strict';
const kinds={undisputed:{title:'Undisputed Darts Champion',symbol:'★♛'},summerslam:{title:'Summerslam Champion',symbol:'★☀'}};
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const today=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
const dateOK=d=>typeof d==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d)&&Number.isFinite(Date.parse(d))&&new Date(d).toISOString().slice(0,10)===d;
let api;
function validate(items,pids){
 if(items===undefined)return [];
 if(!Array.isArray(items)||items.length>20000)throw Error('Ungültige Siegersterne.');
 const seen=new Set();return items.map(a=>{
 if(!a||typeof a.id!=='string'||!a.id||a.id.length>160||seen.has(a.id)||!pids.has(a.playerId)||!Object.hasOwn(kinds,a.kind)||!dateOK(a.date)||!['manual','tournament'].includes(a.source))throw Error('Ungültiger Siegerstern.');
 if(a.source==='tournament'&&(typeof a.tournamentId!=='string'||!a.tournamentId||a.tournamentId.length>120))throw Error('Ungültige Turnierzuordnung.');
 seen.add(a.id);return {id:a.id,playerId:a.playerId,kind:a.kind,date:a.date,source:a.source,...(a.source==='tournament'?{tournamentId:a.tournamentId}:{})};
 });
}
function sync(s){
 const old=s.championAwards||[],awards=old.filter(a=>a.source==='manual');
 for(const t of s.proTournaments||[]){
 if(!Object.hasOwn(kinds,t.championKind)||!['knockout','groups'].includes(t.type))continue;
 const r=root.DartsProEngine.resolveFixtures(t,s.dartMatches||[]);
 if(!r.finished||!s.players.some(p=>p.id===r.championId)){delete t.awardDate;continue;}
 const previous=old.find(a=>a.tournamentId===t.id&&a.playerId===r.championId);
 t.awardDate=previous?.date||(dateOK(t.awardDate)?t.awardDate:today());
 awards.push({id:'auto-'+t.id,kind:t.championKind,playerId:r.championId,date:t.awardDate,source:'tournament',tournamentId:t.id});
 }
 s.championAwards=awards;
}
function badge(kind){const k=kinds[kind];return `<span class="champion-star ${kind}" aria-label="${esc(k.title)}">${k.symbol}</span>`;}
function profile(s,id){const a=(s.championAwards||[]).filter(a=>a.playerId===id);if(!a.length)return '';
 return `<details class="star-profile"><summary>Siegersterne ${Object.keys(kinds).map(k=>{const n=a.filter(x=>x.kind===k).length;return n?`${badge(k)} × ${n}`:'';}).join(' ')}</summary>${a.slice().sort((x,y)=>y.date.localeCompare(x.date)).map(x=>`<p>${badge(x.kind)} ${esc(kinds[x.kind].title)} · ${x.date.split('-').reverse().join('.')} · ${x.source==='manual'?'Manuell':'Turniersieg'}</p>`).join('')}</details>`;
}
function render(){if(!api)return;const el=document.getElementById('championAwardsPanel');if(!el)return;const s=api.getState();
 if(!el.querySelector('form'))el.innerHTML=`<h2>Siegersterne vergeben</h2><p>Goldener Kronenstern: Undisputed · Orangefarbener Sonnenstern: Summerslam. Jeder Turniersieg zählt einmal. Historische Siege kannst du mit Datum nachtragen.</p><div class="champion-actions"><button type="button" data-star-preset="undisputed" class="outline-btn">${badge('undisputed')} Undisputed vorbereiten</button><button type="button" data-star-preset="summerslam" class="outline-btn">${badge('summerslam')} Summerslam vorbereiten</button></div><form id="starAwardForm"><label>Spieler<select id="starPlayer" required></select></label><label>Titel<select id="starKind"><option value="undisputed">Undisputed Darts Champion</option><option value="summerslam">Summerslam Champion</option></select></label><label>Datum des Sieges<input id="starDate" type="date" required value="${today()}"></label><button type="submit" class="primary-btn">Stern vergeben</button></form><p class="game-muted">Automatische Sterne folgen dem Turnierergebnis. Korrektur oder Löschen des Turniers passt diese Sterne an. Manuelle Sterne lassen sich hier entfernen.</p><div id="starHistory"></div>`;
 const select=document.getElementById('starPlayer'),keep=select.value;select.innerHTML=s.players.map(p=>`<option value="${esc(p.id)}">${esc(p.name)}${p.archived?' (archiviert)':''}</option>`).join('');if(s.players.some(p=>p.id===keep))select.value=keep;
 document.getElementById('starHistory').innerHTML=(s.championAwards||[]).slice().sort((a,b)=>b.date.localeCompare(a.date)).map(a=>`<div class="star-history-row"><span>${badge(a.kind)} <b>${esc(s.players.find(p=>p.id===a.playerId)?.name||'Spieler')}</b> · ${esc(kinds[a.kind].title)} · ${a.date.split('-').reverse().join('.')}<small>${a.source==='manual'?'Manuell':'Automatischer Turniersieg'}</small></span>${a.source==='manual'?`<button type="button" class="outline-btn" data-star-remove="${esc(a.id)}">Entfernen</button>`:''}</div>`).join('')||'<p>Noch keine Siegersterne vergeben.</p>';
}
function init(a){api=a;const el=document.getElementById('championAwardsPanel');if(!el)return;
 el.addEventListener('submit',e=>{if(e.target.id!=='starAwardForm')return;e.preventDefault();const s=api.getState(),playerId=document.getElementById('starPlayer').value,kind=document.getElementById('starKind').value,date=document.getElementById('starDate').value;
 if(!s.players.some(p=>p.id===playerId)||!Object.hasOwn(kinds,kind)||!dateOK(date))return api.toast('Bitte Spieler, Titel und gültiges Datum wählen.');
 if((s.championAwards||[]).some(x=>x.playerId===playerId&&x.kind===kind&&x.date===date)&&!confirm('Für diesen Spieler gibt es an diesem Datum bereits einen Stern dieses Titels. Einen weiteren Sieg eintragen?'))return;
 (s.championAwards||=[]).push({id:'star-'+Date.now()+'-'+Math.random().toString(36).slice(2),playerId,kind,date,source:'manual'});api.persist();api.render();api.toast('Siegerstern gespeichert.');});
 el.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.starRemove&&confirm('Diesen manuell vergebenen Stern entfernen?')){const s=api.getState();s.championAwards=s.championAwards.filter(x=>x.id!==b.dataset.starRemove||x.source!=='manual');api.persist();api.render();}
 if(b.dataset.starPreset){api.goView('pro');root.DartsPro.openTournaments();const sel=document.getElementById('championPreset');sel.value=b.dataset.starPreset;sel.dispatchEvent(new Event('change',{bubbles:true}));document.getElementById('proTournamentName').focus();}});
 render();}
const out={validate,sync,profile,init,render};root.DartStars=out;if(typeof module==='object')module.exports=out;
})(typeof window==='undefined'?globalThis:window);
