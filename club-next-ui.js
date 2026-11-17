/* Darts-Club 3.6 · Vereinsmodus und 2v2, offline und ohne Fremdserver */
(function(){'use strict';
const $=id=>document.getElementById(id), E=window.DartsClubEngine, P=window.DartsProEngine;
if(!E)return;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const modes={checkout121:'121 Checkout',checkoutRandom:'Zufalls-Checkout',double:'Doppeltraining',scoring:'T20-Präzision'};
const outNames={double:'Double-Out',master:'Master-Out',straight:'Straight-Out'};
let api=null,selectedDuelId='',selectedSeasonId='',staged=[],ring=1,tab='teams';
const state=()=>api.getState(),duels=()=>state().clubDuels||[],seasons=()=>state().clubSeasons||[],plans=()=>state().clubPlans||[];
const name=id=>state().players.find(x=>x.id===id)?.name||'Unbekannt';
const toast=s=>api.toast(s);
const date=s=>{try{return new Date(s).toLocaleDateString('de-DE')}catch{return '–'}};
function chosenDuel(){return duels().find(d=>d.id===selectedDuelId)||duels().at(-1)||null;}
function choices(selected){return state().players.filter(p=>!p.archived||p.id===selected).map(p=>`<option value="${esc(p.id)}" ${p.id===selected?'selected':''}>${esc(p.name)}</option>`).join('');}
function renderTabs(){document.querySelectorAll('[data-club-tab]').forEach(b=>{b.classList.toggle('active',b.dataset.clubTab===tab);b.setAttribute('aria-pressed',String(b.dataset.clubTab===tab));});document.querySelectorAll('[data-club-panel]').forEach(p=>p.hidden=p.dataset.clubPanel!==tab);}
function renderOptions(){
 const current=Array.from({length:4},(_,i)=>$('clubTeamPlayer'+i)?.value||'');const available=state().players.filter(p=>!p.archived);
 for(let i=0;i<4;i++){const el=$('clubTeamPlayer'+i);if(!el)continue;el.innerHTML=choices(current[i]);if(!current[i]&&available[i])el.value=available[i].id;}
 const player=$('clubPlanPlayer');if(player){const keep=player.value;player.innerHTML=choices(keep);if(keep&&available.some(p=>p.id===keep))player.value=keep;}
 const tournaments=$('clubSeasonTournament');if(tournaments){const keep=tournaments.value;tournaments.innerHTML='<option value="">Turnier auswählen</option>'+state().proTournaments.map(t=>`<option value="${esc(t.id)}">${esc(t.name)}</option>`).join('');if(state().proTournaments.some(t=>t.id===keep))tournaments.value=keep;}
}
function syncTeamTournament(duel){if(!duel.tournamentId)return;const t=state().proTournaments.find(x=>x.id===duel.tournamentId&&x.type==='teams');if(!t)return;
 const previous=t.results?.['team-0'];if(previous?.teamDuelId&&previous.teamDuelId!==duel.id)throw Error('Das Turnier ist bereits einem anderen Teamduell zugeordnet.');
 const replay=E.replayDuel(duel);if(!t.results)t.results={};
 if(replay.finished)t.results['team-0']={manualWinnerId:replay.winnerTeam,teamDuelId:duel.id};
 else if(previous?.teamDuelId===duel.id)delete t.results['team-0'];
}
function startTeamTournament(tournamentId){const t=state().proTournaments.find(x=>x.id===tournamentId&&x.type==='teams');if(!t)return;
 const existing=duels().find(d=>d.tournamentId===tournamentId);if(existing){selectedDuelId=existing.id;staged=[];tab='teams';api.goView('club');return;}
 if(t.results?.['team-0']){toast('Das Teamduell hat bereits ein Ergebnis. Vor einer neuen Partie zuerst das bestehende Turnierergebnis klären.');return;}
 const d=E.createDuel({name:t.name,playerIds:t.playerIds,options:t.options,tournamentId:t.id});state().clubDuels.push(d);selectedDuelId=d.id;staged=[];tab='teams';api.persist();api.goView('club');toast('Teamduell aus dem Turnier gestartet.');
}
function createTeam(){const ids=Array.from({length:4},(_,i)=>$('clubTeamPlayer'+i).value);try{const duel=E.createDuel({name:$('clubTeamName').value.trim()||'2 gegen 2',playerIds:ids,options:{start:Number($('clubTeamStart').value),bestOfLegs:Number($('clubTeamLegs').value),outRule:$('clubTeamOut').value}});state().clubDuels.push(duel);selectedDuelId=duel.id;staged=[];api.persist();api.render();toast('Teamduell angelegt. Die Kasse bleibt unverändert.');}catch(err){toast(err.message);}}
function recordTeam(){const d=chosenDuel();if(!d||!staged.length)return;try{const next=E.nextDuelTurn(d,staged);syncTeamTournament(next);const index=duels().findIndex(x=>x.id===d.id);state().clubDuels[index]=next;staged=[];api.persist();api.render();const result=E.replayDuel(next);toast(result.finished?'Teamduell abgeschlossen – Sieger gespeichert.':'Teamaufnahme gespeichert.');}catch(err){toast(err.message);}}
function undoTeam(){const d=chosenDuel();if(!d||!d.turns.length)return;if(!confirm('Letzte Teamaufnahme zurücknehmen? Ein eventuell verknüpfter Turniersieg wird entsprechend korrigiert.'))return;const next={...d,turns:d.turns.slice(0,-1)};try{syncTeamTournament(next);state().clubDuels[duels().findIndex(x=>x.id===d.id)]=next;staged=[];api.persist();api.render();toast('Letzte Teamaufnahme zurückgenommen.');}catch(err){toast(err.message);}}
function renderTeams(){const list=$('clubDuels'),board=$('clubBoard');if(!list||!board)return;
 list.innerHTML=duels().length?duels().slice().reverse().map(d=>{const r=E.replayDuel(d);return `<button class="club-duel-choice ${chosenDuel()?.id===d.id?'active':''}" data-club-duel="${esc(d.id)}"><b>${esc(d.name)}</b><small>${esc(outNames[d.options.outRule])} · ${r.legs.join(':')} Legs · ${r.finished?'Abgeschlossen':'Läuft'}${d.tournamentId?' · Turnier':''}</small></button>`;}).join(''):'<p class="game-muted">Noch kein Teamduell. Wähle oben vier Spieler.</p>';
 const d=chosenDuel();if(!d){board.innerHTML='<p class="game-muted">Hier erscheinen Teamstände, Werfer und Treffer-Eingabe.</p>';return;}
 const r=E.replayDuel(d),teamName=(i)=>`${name(d.playerIds[i*2])} & ${name(d.playerIds[i*2+1])}`;
 const preview=staged.length&&!r.finished?(()=>{try{return E.replayDuel({...d,turns:[...d.turns,{playerId:r.currentPlayerId,darts:staged}]});}catch{return null;}})():null;
 const endOfVisit=!!preview?.history?.at(-1)?.win||!!preview?.history?.at(-1)?.bust;
 board.innerHTML=`<div class="club-teams-board"><div class="club-duel-title"><b>${esc(d.name)}</b><small>${d.options.start} · ${esc(outNames[d.options.outRule])} · Best of ${d.options.bestOfLegs}</small></div><div class="club-scores">${[0,1].map(i=>`<article class="club-score ${r.nextTeam===(i?'teamB':'teamA')?'club-on-turn':''}"><small>TEAM ${i?'B':'A'}</small><b>${esc(teamName(i))}</b><strong>${r.remaining[i]}</strong><span>${r.legs[i]} ${r.legs[i]===1?'Leg':'Legs'} gewonnen</span></article>`).join('')}</div>${r.finished?`<div class="club-team-winner"><strong>Team ${r.winnerTeam==='teamA'?'A':'B'} gewinnt!</strong><p>${esc(teamName(r.winnerTeam==='teamA'?0:1))} · ${r.legs.join(':')} Legs</p><button class="outline-btn" data-club-report="${esc(d.id)}">Aufnahmen als CSV</button></div>`:`<p class="club-current">Am Zug: <strong>${esc(name(r.currentPlayerId))}</strong> · Leg ${r.leg}</p><div class="club-staged">${staged.length?staged.map(E.textDart).join(' · '):'Noch kein Dart eingegeben'}${preview?` · ${preview.history.at(-1).bust?'BUST':preview.history.at(-1).score+' Punkte'}`:''}</div><div class="club-rings"><span>Ring wählen:</span>${['S','D','T'].map((v,i)=>`<button type="button" data-club-ring="${i+1}" class="outline-btn small ${ring===i+1?'active':''}" aria-pressed="${ring===i+1}">${v}</button>`).join('')}</div><div class="club-numbers">${Array.from({length:20},(_,i)=>20-i).map(n=>`<button type="button" data-club-target="${n}" ${staged.length===3||endOfVisit?'disabled':''}>${n}</button>`).join('')}<button type="button" data-club-target="25" ${staged.length===3||endOfVisit?'disabled':''}>Bull</button><button type="button" data-club-target="50" ${staged.length===3||endOfVisit?'disabled':''}>DBull</button><button type="button" data-club-target="0" ${staged.length===3||endOfVisit?'disabled':''}>Miss</button></div><div class="club-actions"><button type="button" data-club-unstage class="outline-btn" ${staged.length?'':'disabled'}>Letzten Dart entfernen</button><button type="button" data-club-record class="primary-btn" ${staged.length?'':'disabled'}>Aufnahme speichern</button></div>`}<div class="club-actions"><button type="button" data-club-undo class="outline-btn" ${d.turns.length?'':'disabled'}>Letzte Aufnahme rückgängig</button></div><div class="club-history"><h3>Wurfverlauf</h3>${r.history.length?r.history.slice(-12).reverse().map(h=>`<div><span>${esc(name(h.playerId))} · Leg ${h.leg}</span><b>${esc(h.darts.join(' · '))}</b><strong>${h.bust?'BUST':h.score+' P.'}</strong></div>`).join(''):'<p class="game-muted">Noch keine Aufnahmen.</p>'}</div></div>`;
}
function exportTeam(id){const d=duels().find(x=>x.id===id);if(!d)return;const r=E.replayDuel(d),rows=[['Spiel','Spieler','Team','Leg','Darts','Punkte','Rest','Bust','Finish'],...r.history.map(h=>[d.name,name(h.playerId),h.team,h.leg,h.darts.join(' '),h.score,h.remaining,h.bust?'Ja':'Nein',h.win?'Ja':'Nein'])];const csv='\ufeff'+rows.map(row=>row.map(v=>`"${String(v??'').replaceAll('"','""')}"`).join(';')).join('\r\n');const blob=new Blob([csv],{type:'text/csv;charset=utf-8'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='Teamduell-'+new Date().toISOString().slice(0,10)+'.csv';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),2000);}
function createSeason(){try{const season=E.createSeason($('clubSeasonName').value);state().clubSeasons.push(season);selectedSeasonId=season.id;api.persist();api.render();toast('Vereinssaison angelegt.');}catch(err){toast(err.message);}}
function selectedSeason(){return seasons().find(x=>x.id===selectedSeasonId)||seasons().at(-1)||null;}
function addTournament(){const season=selectedSeason(),tid=$('clubSeasonTournament').value,day=$('clubSeasonDate').value;if(!season||!tid)return toast('Saison und Turnier auswählen.');if(!state().proTournaments.some(t=>t.id===tid))return toast('Turnier nicht gefunden.');if(season.tournamentIds.includes(tid))return toast('Turnier ist bereits zugeordnet.');if(day&&!/^\d{4}-\d\d-\d\d$/.test(day))return toast('Ungültiges Datum.');season.tournamentIds.push(tid);if(day)season.dates[tid]=day;api.persist();api.render();toast('Turnier zum Saisonkalender hinzugefügt.');}
function renderSeasons(){const cards=$('clubSeasons');if(!cards)return;
 cards.innerHTML=seasons().length?seasons().slice().reverse().map(s=>`<button class="club-duel-choice ${selectedSeason()?.id===s.id?'active':''}" data-club-season="${esc(s.id)}"><b>${esc(s.name)}</b><small>${s.tournamentIds.length} Turniere · ${s.archived?'Archiviert':'Aktiv'}</small></button>`).join(''):'<p class="game-muted">Noch keine Vereinssaison angelegt.</p>';
 const season=selectedSeason(),details=$('clubSeasonDetails');if(!details)return;
 if(!season){details.innerHTML='';return;}
 const t=state().proTournaments;
 details.innerHTML=`<div class="club-duel-title"><b>${esc(season.name)}</b><span>${season.archived?'Archiviert':'Aktiv'}</span></div><button type="button" class="outline-btn small" data-club-archive="${esc(season.id)}">${season.archived?'Saison reaktivieren':'Saison archivieren'}</button><div class="club-calendar">${season.tournamentIds.map(id=>{const item=t.find(t=>t.id===id);if(!item)return '';const p=P?.tournamentProgress?.(item,state().dartMatches||[])||null;return `<article><div><b>${esc(item.name)}</b><small>${season.dates[id]?esc(season.dates[id].split('-').reverse().join('.')):'Kein Termin'} · ${p?p.done+'/'+p.total+' Begegnungen':'–'} · ${p?.finished?'Beendet':'Offen'}</small></div><button type="button" data-club-remove-season="${esc(id)}" class="outline-btn small">Entfernen</button></article>`;}).join('')||'<p class="game-muted">Noch keine Turniere zugeordnet.</p>'}</div>`;
}
function createPlan(){try{const plan=E.createPlan($('clubPlanPlayer').value,$('clubPlanMode').value,Number($('clubPlanGoal').value));if(!state().players.some(p=>p.id===plan.playerId))throw Error('Bitte einen vorhandenen Spieler wählen.');if(plans().some(p=>p.active&&p.playerId===plan.playerId&&p.mode===plan.mode))throw Error('Für diesen Spieler und diese Übung gibt es bereits ein aktives Wochenziel.');state().clubPlans.push(plan);api.persist();api.render();toast('Wochenziel gespeichert.');}catch(err){toast(err.message);}}
function renderPlans(){const root=$('clubPlans');if(!root)return;root.innerHTML=plans().length?plans().slice().reverse().map(p=>{const progress=E.planProgress(p,state().proTraining||[]);return `<article class="club-plan"><div><b>${esc(name(p.playerId))} · ${esc(modes[p.mode])}</b><small>${p.active?'Diese Woche':'Beendet'} · ${progress.done} / ${progress.goal} Einheiten · ${progress.success} erfolgreich</small></div><div class="club-progress" role="progressbar" aria-valuenow="${progress.percent}" aria-valuemin="0" aria-valuemax="100"><span style="width:${progress.percent}%"></span></div><div class="club-plan-actions">${p.active?`<button type="button" class="primary-btn small" data-club-train="${esc(p.id)}">Training öffnen</button>`:''}<button type="button" class="outline-btn small" data-club-plan-toggle="${esc(p.id)}">${p.active?'Plan beenden':'Reaktivieren'}</button></div></article>`;}).join(''):'<p class="game-muted">Noch kein Wochenziel angelegt. Trainings werden wie bisher im Profi-Center erfasst.</p>';}
function render(){if(!api||!$('view-club'))return;renderTabs();renderOptions();renderTeams();renderSeasons();renderPlans();}
function init(x){api=x;const root=$('view-club');if(!root)return;
 root.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
 if(b.dataset.clubTab){tab=b.dataset.clubTab;renderTabs();return;}
 if(b.id==='clubTeamCreate'){createTeam();return;}if(b.dataset.clubDuel){selectedDuelId=b.dataset.clubDuel;staged=[];renderTeams();return;}
 if(b.dataset.clubRing){ring=Number(b.dataset.clubRing);renderTeams();return;}
 if(b.dataset.clubTarget!==undefined){const num=Number(b.dataset.clubTarget);if(staged.length>=3)return;const d={n:num===50?25:num,m:num===50?2:num===25?1:num===0?0:ring};if(!E.validDart(d))return;const match=chosenDuel();if(!match||E.replayDuel(match).finished)return;const earlier=staged.length?(()=>{try{const r=E.replayDuel({...match,turns:[...match.turns,{playerId:E.replayDuel(match).currentPlayerId,darts:staged}]});return r.history.at(-1)?.win||r.history.at(-1)?.bust;}catch{return true;}})():false;if(earlier)return;staged.push(d);renderTeams();return;}
 if(b.hasAttribute('data-club-unstage')){staged.pop();renderTeams();return;}if(b.hasAttribute('data-club-record')){recordTeam();return;}if(b.hasAttribute('data-club-undo')){undoTeam();return;}
 if(b.dataset.clubReport){exportTeam(b.dataset.clubReport);return;}
 if(b.id==='clubSeasonCreate'){createSeason();return;}if(b.dataset.clubSeason){selectedSeasonId=b.dataset.clubSeason;renderSeasons();return;}
 if(b.id==='clubSeasonAdd'){addTournament();return;}
 if(b.dataset.clubRemoveSeason){const s=selectedSeason();if(!s)return;s.tournamentIds=s.tournamentIds.filter(id=>id!==b.dataset.clubRemoveSeason);delete s.dates[b.dataset.clubRemoveSeason];api.persist();api.render();return;}
 if(b.dataset.clubArchive){const s=seasons().find(x=>x.id===b.dataset.clubArchive);if(!s)return;s.archived=!s.archived;api.persist();api.render();return;}
 if(b.id==='clubPlanCreate'){createPlan();return;}if(b.dataset.clubPlanToggle){const p=plans().find(x=>x.id===b.dataset.clubPlanToggle);if(!p)return;p.active=!p.active;api.persist();api.render();return;}
 if(b.dataset.clubTrain){const p=plans().find(x=>x.id===b.dataset.clubTrain);if(!p)return;api.goView('pro');window.DartsPro?.openTraining?.(p.playerId,p.mode);return;}
 if(b.id==='clubCheckDevice'){
  const items=[];
  items.push(`Gesicherte App-Umgebung: ${window.isSecureContext?'Ja':'Nicht bestätigt'}`);
  items.push(`WebRTC verfügbar: ${typeof RTCPeerConnection==='function'?'Ja':'Nein'}`);
  items.push(`QR-Erzeugung vorhanden: ${!!window.DartQRCode?'Ja':'Nein'}`);
  items.push(`QR-Code-Komprimierung: ${typeof CompressionStream==='function'&&typeof DecompressionStream==='function'?'Ja':'Nicht verfügbar'}`);
  let storage=false;try{const key='dartclub-360-probe';localStorage.setItem(key,'ok');storage=localStorage.getItem(key)==='ok';localStorage.removeItem(key);}catch{}
  items.push(`Lokale Browser-Speicherung: ${storage?'Beschreibbar':'Nicht bestätigt'}`);
  items.push('Zwei-Geräte-Verbindung: Nicht getestet. Für den echten LAN-Test wird ein zweites Handy benötigt.');
  const el=$('clubDeviceResult');el.hidden=false;el.textContent=items.join('\n');return;
 }
 if(b.id==='clubBackupNow'){$('exportBackup')?.click();return;}
 if(b.id==='clubOpenLive'){api.goView('live');return;}if(b.id==='clubOpenBackup'){api.goView('settings');return;}if(b.id==='clubOpenCamera'){api.goView('pro');window.DartsPro?.openReports?.();return;}
 });
 render();}
window.DartsClub={init,render,startTeamTournament};
})();
