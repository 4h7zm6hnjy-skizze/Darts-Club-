/* Darts-Club 3.8.1 — local event organizer, read-only match/ledger overview. */
(function(){'use strict';
const $=id=>document.getElementById(id),E=window.DartsEveningEngine,G=window.DartsGameEngine;
if(!E||!G)return;
const esc=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const euro=c=>new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR'}).format(c/100);
let api=null,selected='',roster=new Set();
const state=()=>api.getState(),all=()=>state().clubEvenings||[];
const player=id=>state().players.find(p=>p.id===id)?.name||'Unbekannt';
const current=()=>all().find(x=>x.id===selected)||all().at(-1)||null;
const labelDay=s=>s.split('-').reverse().join('.');
const csvCell=v=>'"'+String(v??'').replaceAll('"','""')+'"';
function download(name,content,type){const a=document.createElement('a'),url=URL.createObjectURL(new Blob([content],{type}));a.href=url;a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(url);a.remove();},4000);}
function renderRoster(){const root=$('eveningRoster');if(!root)return;const known=new Set(state().players.map(p=>p.id));roster=new Set([...roster].filter(id=>known.has(id)));
 root.innerHTML=state().players.filter(p=>!p.archived||roster.has(p.id)).map(p=>`<label class="evening-person"><input type="checkbox" data-evening-player="${esc(p.id)}" ${roster.has(p.id)?'checked':''}><span>${esc(p.name)}</span></label>`).join('')||'<p class="game-muted">Bitte zuerst Spielerprofile anlegen.</p>';
}
function create(){try{const item=E.create({name:$('eveningName').value.trim(),date:$('eveningDate').value,playerIds:[...roster],note:$('eveningNote').value});if(all().length>=120)throw Error('Maximal 120 Dartabende gespeichert.');state().clubEvenings.push(item);selected=item.id;api.persist();api.render();api.toast('Dartabend mit '+item.fixtures.length+' Paarungen angelegt.');}
 catch(err){api.toast(err.message);}}
function startFixture(round,a,b){const evening=current();if(!evening||evening.archived)return;const f=evening.fixtures.find(f=>f.round===round&&f.a===a&&f.b===b);if(!f)return;
 if(f.matchId){const m=state().dartMatches.find(x=>x.id===f.matchId);if(m){api.goView('games');window.DartsGameUI.activateMatch(m.id);return;}if(!confirm('Die verknüpfte Partie wurde gelöscht. Neue Partie für diese Paarung starten?'))return;}
 const active=state().dartMatches.find(x=>x.id===state().activeDartMatchId);
 if(active&&!G.replay(active).finished&&!confirm('Eine andere Partie läuft noch. Sie bleibt gespeichert. Neue Begegnung starten?'))return;
 try{const m=G.createMatch({mode:'x01',playerIds:[a,b],options:{start:501,bestOfLegs:3,doubleOut:true}});
  // A single explicit link: opening the event later finds this exact match, even if its start date differs.
  state().dartMatches.push(m);state().activeDartMatchId=m.id;f.matchId=m.id;api.persist();api.goView('games');window.DartsGameUI.activateMatch(m.id);}
 catch(err){api.toast(err.message);}}
function exportCsv(){const evening=current();if(!evening)return;const r=E.report(evening,state().dartMatches,G),charges=E.chargesForDay(evening,state());
 const rows=[['Dartabend',evening.name],['Datum',evening.date],['Teilnehmer',evening.playerIds.map(player).join(' | ')],[],['Runde','Spieler A','Spieler B','Status','Sieger','Legs','Verknüpfte Partie']];
 for(const f of r.rows)rows.push([f.round,player(f.a),player(f.b),{geplant:'Geplant','läuft':'Läuft',beendet:'Beendet',fehlt:'Partie fehlt'}[f.status],f.winnerId?player(f.winnerId):'',f.legs,f.matchId||'']);
 rows.push([],['Jürgen-Buchungen am Kalendertag (nicht spielplanbezogen)'],['Nicht stornierte Jürgen-Gruppen',charges.groups],['Buchungszeilen',charges.entries],['Belastung EUR',(charges.amountCents/100).toFixed(2).replace('.',',')]);
 download('Dartabend-'+evening.date+'-'+evening.id.slice(-8)+'.csv','\ufeff'+rows.map(row=>row.map(csvCell).join(';')).join('\r\n'),'text/csv;charset=utf-8');}
function verify(){const target=$('eveningVerifyResult');if(!target)return;try{const result=window.DartAppIntegrity?.verify?.();if(!result)throw Error('Datenprüfung steht nicht zur Verfügung.');target.hidden=false;target.textContent=result.ok?`Datenprüfung bestanden. ${result.players} Spieler, ${result.events} Kassenbuchungen, ${result.matches} Dart-Partien, ${result.evenings} Dartabende. Originaldaten wurden nicht verändert. Ein externes Backup bleibt notwendig.`:`Datenprüfung fehlgeschlagen: ${result.error}. Bitte keine Daten löschen und ein bestehendes Backup sichern.`;}
 catch(err){target.hidden=false;target.textContent='Datenprüfung nicht möglich: '+err.message;}}
function render(){if(!api)return;renderRoster();const list=$('eveningList'),board=$('eveningBoard');if(!list||!board)return;
 list.innerHTML=all().length?all().slice().sort((a,b)=>b.date.localeCompare(a.date)).map(e=>{const r=E.report(e,state().dartMatches,G);return `<button type="button" class="club-duel-choice ${current()?.id===e.id?'active':''}" data-evening-select="${esc(e.id)}"><b>${esc(e.name)}</b><small>${labelDay(e.date)} · ${e.playerIds.length} Spieler · ${r.finished}/${r.total} Begegnungen${e.archived?' · Archiviert':''}</small></button>`;}).join(''):'<p class="game-muted">Noch kein Dartabend angelegt.</p>';
 const evening=current();if(!evening){board.innerHTML='<p class="game-muted">Hier erscheint der Spielplan mit Live-Fortschritt.</p>';return;}
 const result=E.report(evening,state().dartMatches,G),c=E.chargesForDay(evening,state());
 const rounds=[...new Set(result.rows.map(f=>f.round))];
 board.innerHTML=`<div class="evening-head"><div><h3>${esc(evening.name)}</h3><p>${labelDay(evening.date)} · ${evening.playerIds.length} Teilnehmer</p></div><div class="evening-controls"><button class="outline-btn small" data-evening-export>CSV-Bericht</button><button class="outline-btn small" data-evening-archive>${evening.archived?'Reaktivieren':'Archivieren'}</button><button class="outline-btn small" data-evening-delete>Entfernen</button></div></div><p class="game-muted">${evening.note?esc(evening.note):'Kein Hinweis hinterlegt.'}</p><div class="evening-metrics"><div><small>Begegnungen</small><strong>${result.finished} / ${result.total}</strong></div><div><small>Am Laufen</small><strong>${result.playing}</strong></div><div><small>Fortschritt</small><strong>${result.percent} %</strong></div></div><div class="club-progress" role="progressbar" aria-valuenow="${result.percent}" aria-valuemin="0" aria-valuemax="100"><span style="width:${result.percent}%"></span></div>${rounds.map(r=>`<section class="evening-round"><h4>Runde ${r}</h4>${result.rows.filter(f=>f.round===r).map(f=>{const status=f.status==='beendet'?`Sieger: ${esc(player(f.winnerId))}${f.legs?' · Legs '+esc(f.legs):''}`:f.status==='läuft'?'Partie läuft':f.status==='fehlt'?'Verknüpfte Partie wurde entfernt':'Noch nicht gespielt';return `<div class="evening-fixture"><div><b>${esc(player(f.a))} <span class="evening-vs">vs.</span> ${esc(player(f.b))}</b><small>${status}</small></div>${!evening.archived&&f.status!=='beendet'?`<button type="button" class="${f.status==='läuft'?'outline-btn':'primary-btn'} small" data-evening-start data-round="${f.round}" data-a="${esc(f.a)}" data-b="${esc(f.b)}">${f.status==='läuft'?'Fortsetzen':f.status==='fehlt'?'Neu starten':'501 starten'}</button>`:''}</div>`;}).join('')}</section>`).join('')}<div class="evening-day-ledger"><b>Jürgen-Buchungen am ${labelDay(evening.date)}</b><p>${c.groups} Jürgen-Gruppen · ${c.entries} Buchungszeilen · ${euro(c.amountCents)} gebucht</p><small>Nur nicht stornierte Jürgen-Einträge der Spieltage mit diesem Datum. Nicht automatisch diesem geplanten Dartabend zugeordnet. Keine Zahlungen oder Papierlisten-Schätzwerte enthalten.</small></div>`;
}
function init(p){api=p;const panel=$('clubEveningPanel');if(!panel)return;
 if(!$('eveningDate').value){const d=new Date();$('eveningDate').value=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
 panel.addEventListener('change',e=>{const id=e.target.dataset.eveningPlayer;if(id){if(e.target.checked)roster.add(id);else roster.delete(id);}});
 panel.addEventListener('click',e=>{const btn=e.target.closest('button');if(!btn)return;
 if(btn.id==='eveningCreate'){create();return;}
 if(btn.dataset.eveningSelect){selected=btn.dataset.eveningSelect;render();return;}
 if(btn.hasAttribute('data-evening-start')){startFixture(Number(btn.dataset.round),btn.dataset.a,btn.dataset.b);return;}
 if(btn.hasAttribute('data-evening-archive')){const t=current();if(!t)return;t.archived=!t.archived;api.persist();api.render();return;}
 if(btn.hasAttribute('data-evening-delete')){const t=current();if(!t)return;if(!confirm('Nur den Dartabend-Spielplan entfernen? Bereits gespielte Partien und sämtliche Kassenbuchungen bleiben erhalten.'))return;const arr=all(),i=arr.findIndex(x=>x.id===t.id);if(i>=0)arr.splice(i,1);selected='';api.persist();api.render();return;}
 if(btn.hasAttribute('data-evening-export')){exportCsv();return;}
 if(btn.id==='eveningVerify'){verify();return;}
 if(btn.id==='eveningBackup'){$('exportBackup')?.click();return;}
 });
 render();}
window.DartsEvenings={init,render};
})();
