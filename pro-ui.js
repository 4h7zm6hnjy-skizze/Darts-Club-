/* JÜRGEN DARTKASSE · locally stored Profi-Center v3.1.0 */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const P=window.DartsProEngine;
const E=window.DartsGameEngine;
if(!P||!E)return;
P.setGameEngine(E);
let api=null,tab='tournaments',selectedTournament='',trainSession=null,trainStaged=[],trainRing=1,trainNotice='',cameraUrl='';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=v=>new Intl.NumberFormat('de-DE',{maximumFractionDigits:2}).format(v||0);
const stamp=()=>new Date().toISOString();
const rand=(min,max)=>min+Math.floor(Math.random()*(max-min+1));
const own=()=>api?.getState();
const player=id=>own().players.find(p=>p.id===id);
const name=id=>id===P.BOT_ID?'DartBot':player(id)?.name||'Spieler';
const matches=()=>own().dartMatches||[];
const tourneys=()=>own().proTournaments||[];
const trainings=()=>own().proTraining||[];
const toast=v=>api?.toast(v);
const slug=v=>String(v||'Report').replace(/[^\w\u00C0-\u017F-]+/g,'-').slice(0,50);
function download(name,content,type){const blob=new Blob([content],{type}),url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(url);a.remove();},900);}
function csvRows(rows){const escaped=s=>{const v=String(s??'');return /^[=+@-]/.test(v)?`'${v}`:v;};return '\ufeff'+rows.map(row=>row.map(v=>{const s=escaped(v);return /[;"\r\n]/.test(s)?'"'+s.replaceAll('"','""')+'"':s;}).join(';')).join('\r\n');}
function renderTabs(){document.querySelectorAll('[data-pro-tab]').forEach(el=>{el.classList.toggle('active',el.dataset.proTab===tab);el.setAttribute('aria-pressed',String(el.dataset.proTab===tab));});document.querySelectorAll('[data-pro-section]').forEach(el=>el.hidden=el.dataset.proSection!==tab);}
function updatePlayerCheckboxes(){const el=$('proTournamentPlayers');if(!el)return;const saved=new Set([...el.querySelectorAll('input:checked')].map(c=>c.value));el.innerHTML=own().players.filter(p=>!p.archived).map(p=>`<label class="pro-player-pick"><input type="checkbox" value="${esc(p.id)}" ${saved.has(p.id)?'checked':''}><span>${esc(p.name)}</span></label>`).join('')||'<p class="game-muted">Lege unter „Spieler“ zuerst mindestens zwei Profile an.</p>';}
function createTournament(){
 const type=$('proTournamentType').value,ids=[...$('proTournamentPlayers').querySelectorAll('input:checked')].map(x=>x.value),label=$('proTournamentName').value;
 try{const t=P.makeTournament({name:label,type,playerIds:ids,options:{start:Number($('proTournamentStart').value),bestOfLegs:Number($('proTournamentLegs').value)}});own().proTournaments.push(t);selectedTournament=t.id;api.persist();render();toast('Turnier erstellt.');}catch(err){toast(err.message);}
}
function tournamentItemHtml(t){const x=P.resolveFixtures(t,matches());return `<button type="button" class="pro-tournament-item ${selectedTournament===t.id?'active':''}" data-pro-select="${esc(t.id)}"><strong>${esc(t.name)}</strong><small>${esc({league:'Liga / Jeder gegen jeden',knockout:'K.-o.-Turnier',groups:'Gruppen + K.-o.',teams:'Teamduell'}[t.type])} · ${t.playerIds.length} Spieler · ${x.fixtures.filter(f=>f.winnerId).length}/${x.fixtures.length} entschieden</small></button>`;}
function tournamentStandings(t,res){if(t.type==='teams'||t.type==='knockout')return '';
 const groups=t.type==='groups'?Object.entries(P.groupIds?.(t)||{A:t.playerIds.filter((_,i)=>i%2===0),B:t.playerIds.filter((_,i)=>i%2===1)}):[['Liga',t.playerIds]];
 return `<div class="pro-tables">${groups.map(([key,ids])=>{const rows=t.type==='league'?P.leagueStandings(t,matches()):P.groupStandings(ids,res.fixtures,'Gruppe '+key);return `<div class="pro-table-card"><h4>${esc(key==='Liga'?key:'Gruppe '+key)}</h4><table><thead><tr><th>Spieler</th><th>Sp.</th><th>S</th><th>N</th><th>Pkt.</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${esc(name(r.id))}</td><td>${r.played}</td><td>${r.wins}</td><td>${r.losses}</td><td><strong>${r.points}</strong></td></tr>`).join('')}</tbody></table></div>`;}).join('')}</div>`;
}
function fixtureHtml(t,f){const a=t.type==='teams'?t.playerIds.slice(0,2).map(name).join(' & '):f.a?name(f.a):'Noch offen',b=t.type==='teams'?t.playerIds.slice(2,4).map(name).join(' & '):f.b?name(f.b):'Noch offen';
 const source=f.source==='bye'?'Freilos':f.source==='manual'?'Manuell erfasst':f.source==='game'?'Abgeschlossene Partie':'';
 const startAllowed=t.type!=='teams'&&f.ready&&!f.winnerId&&!f.matchId;
 const manualAllowed=f.ready&&!f.winnerId&&!f.matchId;
 const winnerLabel=f.winnerId?(t.type==='teams'?(f.winnerId==='teamA'?'Team A':'Team B'):name(f.winnerId)):'';
 return `<article class="pro-fixture"><div class="pro-fixture-info"><small>${esc(f.stage)}${f.group?' · '+esc(f.group):''}</small><div class="pro-versus"><span>${esc(a)}</span><b>VS</b><span>${esc(b)}</span></div>${f.winnerId?`<strong class="pro-win">Sieger: ${esc(winnerLabel)} ${source?' · '+source:''}</strong>`:f.matchId?'<small>Partie begonnen – Ergebnis wird nach Spielende übernommen</small>':!f.ready?'<small>Warten auf die Vorrunde</small>':''}</div><div class="pro-fixture-actions">${startAllowed?`<button type="button" data-pro-play="${esc(f.id)}" class="primary-btn small">Partie spielen</button>`:''}${f.matchId?`<button type="button" data-pro-openmatch="${esc(f.matchId)}" class="outline-btn small">Partie öffnen</button>`:''}${manualAllowed?`<button type="button" data-pro-result="${esc(f.id)}" data-pro-side="a" class="outline-btn small">${t.type==='teams'?'Team A':esc(a)} gewinnt</button><button type="button" data-pro-result="${esc(f.id)}" data-pro-side="b" class="outline-btn small">${t.type==='teams'?'Team B':esc(b)} gewinnt</button>`:''}${f.source==='manual'?`<button type="button" data-pro-clear="${esc(f.id)}" class="outline-btn small">Ergebnis korrigieren</button>`:''}</div></article>`;
}
function renderTournaments(){const list=$('proTournamentList'),details=$('proTournamentDetails');if(!list||!details)return;
 const all=tourneys();if(!all.some(t=>t.id===selectedTournament))selectedTournament=all.at(-1)?.id||'';
 list.innerHTML=all.length?all.slice().reverse().map(tournamentItemHtml).join(''):'<p class="game-muted">Noch kein Turnier angelegt. Wähle links die Spieler und den Turniertyp.</p>';
 const t=all.find(x=>x.id===selectedTournament);if(!t){details.innerHTML='<p class="game-muted">Wähle ein Turnier aus.</p>';return;}
 const res=P.resolveFixtures(t,matches());const order=[...new Set(res.fixtures.map(f=>f.stage))];const results=res.fixtures.filter(f=>f.winnerId).length;const next=res.fixtures.find(f=>f.ready&&!f.winnerId&&!f.matchId&&t.type!=='teams');
 details.innerHTML=`<div class="pro-details-head"><div><h3>${esc(t.name)}</h3><p class="game-muted">${results}/${res.fixtures.length} Begegnungen entschieden · lokal gespeichert</p></div><div class="pro-tools"><button class="outline-btn small" type="button" data-pro-export-tournament>CSV</button><button class="outline-btn small" type="button" data-pro-print-tournament>Drucken / PDF</button><button class="outline-btn small" type="button" data-pro-delete-tournament>Turnier löschen</button></div></div>${next?`<div class="pro-next-match"><div><small>NÄCHSTE BEGEGNUNG</small><strong>${esc(name(next.a))} gegen ${esc(name(next.b))}</strong><span>${esc(next.stage)}</span></div><button type="button" class="primary-btn" data-pro-next="${esc(next.id)}">Nächste Partie starten</button></div>`:''}${tournamentStandings(t,res)}${order.map(stage=>`<h4 class="pro-stage-head">${esc(stage)}</h4><div class="pro-fixtures">${res.fixtures.filter(f=>f.stage===stage).map(f=>fixtureHtml(t,f)).join('')}</div>`).join('')}`;
}
function selectedFixture(id){const t=tourneys().find(x=>x.id===selectedTournament);return {t,fixture:t?P.resolveFixtures(t,matches()).fixtures.find(x=>x.id===id):null};}
function startFixture(id){const {t,fixture:f}=selectedFixture(id);if(!t||!f||!f.ready||f.matchId||f.winnerId||t.type==='teams')return;
 const existing=own().dartMatches.find(x=>x.id===own().activeDartMatchId);if(existing&&!E.replay(existing).finished&&!confirm('Die aktuelle Partie bleibt gespeichert. Neue Turnierpartie starten?'))return;
 try{const m=E.createMatch({mode:'x01',playerIds:[f.a,f.b],options:{start:t.options.start,bestOfLegs:t.options.bestOfLegs,bestOfSets:1,doubleOut:true}});
 own().dartMatches.push(m);own().activeDartMatchId=m.id;t.results[f.id]={matchId:m.id};api.persist();api.render();api.goView('games');window.DartsGameUI?.activateMatch(m.id);
 }catch(err){toast(err.message);}}
function manualResult(id,side){const {t,fixture:f}=selectedFixture(id);if(!t||!f||!f.ready||f.winnerId||f.matchId)return;
 const winnerId=t.type==='teams'?'team'+side.toUpperCase():side==='a'?f.a:f.b;
 const label=t.type==='teams'?'Team '+side.toUpperCase():name(winnerId);
 if(!confirm(`${label} als Sieger erfassen? Das Ergebnis wird als manuell eingetragen und nicht als Dart-Partie gewertet.`))return;
 t.results[f.id]={manualWinnerId:winnerId};api.persist();render();}
function clearFixture(id){const {t,fixture:f}=selectedFixture(id);if(!t||f?.source!=='manual')return;if(!confirm('Manuelles Ergebnis entfernen? Spätere Runden können dadurch vorübergehend unvollständig werden.'))return;delete t.results[id];api.persist();render();}
function removeTournament(){const t=tourneys().find(x=>x.id===selectedTournament);if(!t||!confirm(`Turnier „${t.name}“ aus der Übersicht entfernen? Bereits gespeicherte Dart-Partien bleiben bestehen.`))return;own().proTournaments=own().proTournaments.filter(x=>x.id!==t.id);selectedTournament='';api.persist();render();}
function renderTraining(){const select=$('proTrainPlayer');if(!select)return;const current=select.value;
 select.innerHTML=own().players.filter(x=>!x.archived).map(p=>`<option value="${esc(p.id)}">${esc(p.name)}</option>`).join('');if([...select.options].some(o=>o.value===current))select.value=current;
 const root=$('proTrainingActive');if(!root)return;
 if(!trainSession){root.innerHTML='<div class="game-no-match">Wähle Spieler und Training, dann „Training starten“.</div>';}
 else{
  const s=trainSession,checkout=s.mode.startsWith('checkout'),remaining=checkout?s.remaining:null;
  const desc=checkout?`Noch ${s.remaining} Punkte · ${9-s.used} Darts verfügbar`:s.mode==='double'?`Ziel: D${s.target===25?'Bull':s.target}`:`Treffe die ${s.target} möglichst oft`;
  const hint=checkout?E.checkoutRoute(s.remaining,Math.min(3,9-s.used),true)?.map(E.dartLabel).join(' · ')||'Kein direktes Checkout':'–';
  root.innerHTML=`<div class="pro-training-top"><div><small>${esc(s.mode==='checkout121'?'121 Checkout':s.mode==='checkoutRandom'?'Zufalls-Checkout':s.mode==='double'?'Doppeltraining':'Präzision')}</small><h3>${esc(desc)}</h3><p class="game-muted">${checkout?'Checkout-Tipp: '+esc(hint):'Bis zu 3 Darts eingeben und Aufnahme werten'}</p></div><span>${s.used}/ ${checkout?'9':'3'} Darts</span></div><div class="pro-training-staged">${Array.from({length:3},(_,i)=>`<div><small>Dart ${i+1}</small><strong>${trainStaged[i]?esc(E.dartLabel(trainStaged[i])):'–'}</strong></div>`).join('')}</div><div class="game-ring-buttons" id="proTrainRings"><button data-train-ring="1" class="${trainRing===1?'active':''}">Single</button><button data-train-ring="2" class="${trainRing===2?'active':''}">Double</button><button data-train-ring="3" class="${trainRing===3?'active':''}">Triple</button></div><div class="game-target-buttons pro-train-targets">${Array.from({length:20},(_,i)=>20-i).map(n=>`<button type="button" class="dart-target" data-train-num="${n}">${n}</button>`).join('')}<button type="button" class="dart-target bull25" data-train-num="25" data-train-m="1">25</button><button type="button" class="dart-target bull50" data-train-num="25" data-train-m="2">Bull</button><button type="button" class="dart-target miss" data-train-num="0" data-train-m="0">Miss</button></div><div class="pro-training-actions"><button type="button" class="outline-btn" data-pro-train-undo ${!trainStaged.length?'disabled':''}>↶ Dart entfernen</button><button type="button" class="primary-btn" data-pro-train-commit ${!trainStaged.length?'disabled':''}>Aufnahme bestätigen</button><button type="button" class="outline-btn" data-pro-train-cancel>Training beenden</button></div>${trainNotice?`<p role="status" class="pro-practice-notice">${esc(trainNotice)}</p>`:''}`;
 }
 const history=$('proTrainingHistory');if(history){const p=select.value,items=trainings().filter(x=>x.playerId===p).slice(-12).reverse();const agg=P.trainingSummary(trainings(),p);
  history.innerHTML=`<h4>${esc(name(p))}: ${agg.attempts} Einheiten · ${agg.success} geschafft${agg.successPct===null?'':' · '+fmt(agg.successPct)+' %'}</h4>${items.map(x=>`<div class="pro-practice-history"><span>${esc(new Date(x.at).toLocaleDateString('de-DE'))} · ${esc(drillName(x.mode))} (${x.target})</span><b>${x.success?'Erreicht':'Nicht erreicht'}</b></div>`).join('')||'<p class="game-muted">Noch keine gespeicherten Trainingseinheiten.</p>'}`;}
}
const drillName=mode=>({checkout121:'121 Checkout',checkoutRandom:'Zufalls-Checkout',double:'Doppeltraining',scoring:'Präzision'})[mode]||mode;
function startTraining(){const playerId=$('proTrainPlayer').value,mode=$('proTrainMode').value;
 if(!player(playerId)){toast('Bitte Spielerprofil auswählen.');return;}
 if(trainSession && !confirm('Aktuelles Training ohne Eintrag abbrechen?'))return;
 const target=mode==='checkout121'?121:mode==='checkoutRandom'?rand(40,170):mode==='double'?rand(1,20):20;
 trainSession={mode,playerId,target,remaining:target,used:0,points:0,hits:0};trainStaged=[];trainRing=1;trainNotice='';renderTraining();}
function finishTraining(success){const s=trainSession;if(!s)return;const entry={id:'drill-'+Date.now()+'-'+Math.random().toString(36).slice(2,9),playerId:s.playerId,mode:s.mode,target:s.target,darts:Math.max(1,s.used),points:s.points,success:!!success,at:stamp()};own().proTraining.push(entry);trainSession=null;trainStaged=[];trainNotice=success?'Ziel geschafft und gespeichert.':'Versuch beendet und gespeichert.';api.persist();api.render();toast(success?'Training erfolgreich gespeichert.':'Trainingsergebnis gespeichert.');}
function commitTraining(){const s=trainSession;if(!s||!trainStaged.length)return;const darts=[...trainStaged];trainStaged=[];
 if(s.mode==='double'){
  const successes=darts.filter(d=>d.n===s.target&&d.m===2).length;s.hits+=successes;s.used+=darts.length;s.points+=successes*(s.target===25?50:s.target*2);finishTraining(successes>0);return;
 }
 if(s.mode==='scoring'){
  s.hits+=darts.filter(d=>d.n===s.target).length;s.used+=darts.length;s.points+=darts.filter(d=>d.n===s.target).reduce((a,d)=>a+E.dartValue(d),0);finishTraining(s.hits>=2);return;
 }
 let left=s.remaining,bust=false,win=false,actual=0,points=0;
 for(const dart of darts){actual++;const value=E.dartValue(dart),next=left-value;if(next<0||next===1||(next===0&&dart.m!==2)){bust=true;break;}left=next;points+=value;if(next===0){win=true;break;}}
 s.used+=win?actual:3;
 if(!bust){s.remaining=left;s.points+=points;}
 if(win){finishTraining(true);return;}
 if(s.used>=9){finishTraining(false);return;}
 trainNotice=bust?'Bust: Restpunktzahl für nächste Aufnahme wiederhergestellt.':'Aufnahme erfasst.';renderTraining();}
function reportTable(id){const all=matches().filter(g=>g.playerIds.includes(id));const a=P.playerAnalytics(all,id),dr=P.trainingSummary(trainings(),id);const summaries=all.map(g=>{const replay=E.replay(g),report=E.playerReport(g,id);return {date:g.createdAt.slice(0,10),mode:g.mode,opponents:g.playerIds.filter(x=>x!==id).map(name).join(', '),status:replay.finished?(replay.winnerId===id?'Sieg':'Niederlage'):'Läuft',average:report.average3,darts:report.darts,highFinish:report.highFinish};});
 return {a,dr,summaries};}
function moreStats(id,games){
 const xs=games.filter(g=>g.mode==='x01'&&g.playerIds.includes(id)).sort((a,b)=>a.createdAt.localeCompare(b.createdAt));
 const last=xs.slice(-5);let fiveDarts=0,fivePoints=0;
 let peak=0;let finishes=new Map();let won=0;
 for(const g of xs){const r=E.replay(g),rep=E.playerReport(g,id);peak=Math.max(peak,rep?.highFinish||0);
  if(r.finished&&r.winnerId===id)won++;
  for(const h of r.history){if(h.playerId===id&&h.win){const lastDart=h.darts?.at(-1);if(lastDart&&lastDart.startsWith('D'))finishes.set(lastDart,(finishes.get(lastDart)||0)+1);}}
 }
 for(const g of last){const x=E.playerReport(g,id);fiveDarts+=x.darts||0;fivePoints+=x.totalPoints||0;}
 const favorite=[...finishes].sort((a,b)=>b[1]-a[1])[0];
 return {five:last.length,form:fiveDarts?Number((fivePoints/fiveDarts*3).toFixed(2)):null,favorite:favorite?.[0]||null,finish:peak,wins:won,played:xs.length};
}
function renderClub(){
 const target=$('proClubLeaderboard');if(!target||!api)return;
 const records=matches().filter(g=>g.mode==='x01');const rows=own().players.map(player=>{
  const games=records.filter(g=>g.playerIds.includes(player.id));let pts=0,darts=0,firstPts=0,firstDarts=0,oneEighties=0;
  let highest=0,wins=0,finished=0;
  for(const g of games){const r=E.replay(g),report=E.playerReport(g,player.id);
   pts+=report.totalPoints||0;darts+=report.darts||0;firstPts+=(r.players[player.id].first9Score||0);firstDarts+=(r.players[player.id].first9Darts||0);
   oneEighties+=report.scores180||0;highest=Math.max(highest,report.highFinish||0);if(r.finished){finished++;if(r.winnerId===player.id)wins++;}
  }
  return {id:player.id,name:player.name,darts,games:games.length,avg:darts?pts/darts*3:null,first:firstDarts?firstPts/firstDarts*3:null,wins,finished,oneEighties,highest,form:moreStats(player.id,games).form};
 }).sort((a,b)=>{const tier=x=>x.darts>=9?2:x.darts>0?1:0;return tier(b)-tier(a)||(b.avg??-1)-(a.avg??-1)||b.wins-a.wins||a.name.localeCompare(b.name,'de');});
 target.innerHTML=rows.length?rows.map((x,i)=>`<article class="pro-rank-row"><div class="rank-number">${x.darts?i+1:"–"}</div><div class="rank-main"><strong>${esc(x.name)}</strong><small>${x.games} Partien · ${x.wins} Siege${x.darts<9?' · Average vorläufig':''}</small></div><div class="rank-metric"><b>${x.avg===null?'–':fmt(x.avg)}</b><small>3-Dart-Ø</small></div><div class="rank-metric"><b>${x.form===null?'–':fmt(x.form)}</b><small>Form 5 Spiele</small></div><div class="rank-metric"><b>${x.oneEighties}</b><small>180er</small></div><div class="rank-metric"><b>${x.highest||'–'}</b><small>High Finish</small></div></article>`).join(''):'<p class="game-muted">Noch keine Spieler vorhanden.</p>';
}
function playerAnalyticsMarkup(id,games){const extra=moreStats(id,games);const a=P.playerAnalytics(games,id);const dr=P.trainingSummary(trainings(),id);const list=a.headToHead||[];return `<div class="pro-profile-extras"><h4>Erweiterte Dart-Analyse</h4><div class="pro-extra-grid"><div><small>Aktuelle Form (letzte 5 X01-Partien)</small><strong>${extra.form===null?'–':fmt(extra.form)} PPR</strong></div><div><small>Lieblings-Finish-Doppel</small><strong>${esc(extra.favorite||'–')}</strong></div><div><small>Höchstes gespeichertes Finish</small><strong>${extra.finish||'–'}</strong></div><div><small>X01-Siege</small><strong>${extra.wins} / ${extra.played}</strong></div><div><small>Bestes gewonnenes Leg</small><strong>${a.bestLeg??'–'}${a.bestLeg?' Darts':''}</strong></div><div><small>Längstes gewonnenes Leg</small><strong>${a.worstLeg??'–'}${a.worstLeg?' Darts':''}</strong></div><div><small>Ø Darts pro gewonnenem Leg</small><strong>${a.legDarts??'–'}</strong></div><div><small>Training erfolgreich</small><strong>${dr.successPct===null?'–':fmt(dr.successPct)+' %'}</strong></div></div>${a.segments.length?`<h5>Trefferverteilung nach Zahlen</h5><div class="pro-segment-hits">${a.segments.map(([label,count])=>`<span>${esc(label)} <b>${count}</b></span>`).join('')}</div>`:''}${list.length?`<h5>Direkte Duelle</h5><div class="pro-h2h">${list.map(x=>`<div><span>${esc(name(x.id))}</span><strong>${x.wins} S · ${x.losses} N</strong></div>`).join('')}</div>`:''}<p class="game-muted">Trefferverteilung nach erfassten Zahlen; keine kameraerkannte Dartposition. Bestes und längstes Leg beziehen sich ausschließlich auf gewonnene X01-Legs.</p></div>`;}
function renderReports(){const el=$('proReportPlayer');if(!el)return;const old=el.value;el.innerHTML=own().players.map(p=>`<option value="${esc(p.id)}">${esc(p.name)}</option>`).join('');if([...el.options].some(o=>o.value===old))el.value=old;const id=el.value;if(!id)return;
 const r=reportTable(id);$('proReportPreview').innerHTML=`<div class="pro-report-stats"><span>${r.summaries.length} Partien</span><span>Bestes Leg: ${r.a.bestLeg??'–'}</span><span>${r.dr.attempts} Trainings</span></div><div class="pro-report-list">${r.summaries.slice(-6).reverse().map(x=>`<div><span>${esc(x.date)} · ${esc(x.mode)} · ${esc(x.opponents)}</span><b>${esc(x.status)}</b></div>`).join('')||'<p class="game-muted">Keine Partien für dieses Spielerprofil.</p>'}</div>`;
}
function csvPlayer(){const id=$('proReportPlayer').value;if(!player(id))return;const r=reportTable(id);const rows=[['Datum','Modus','Gegner','Ergebnis','3-Dart-Average','Darts','High Finish'],...r.summaries.map(x=>[x.date,x.mode,x.opponents,x.status,x.average,x.darts,x.highFinish])];download(`Dart-Bericht-${slug(name(id))}.csv`,csvRows(rows),'text/csv;charset=utf-8');toast('Spielerbericht als CSV erstellt.');}
function csvTournament(){const t=tourneys().find(x=>x.id===selectedTournament);if(!t)return;const f=P.resolveFixtures(t,matches()).fixtures;const rows=[['Turnier','Runde','Spieler A','Spieler B','Sieger','Quelle'],...f.map(x=>[t.name,x.stage,name(x.a),name(x.b),x.winnerId?(t.type==='teams'?x.winnerId:name(x.winnerId)):'',x.source||''])];download(`Turnier-${slug(t.name)}.csv`,csvRows(rows),'text/csv;charset=utf-8');toast('Turnierbericht als CSV erstellt.');}
function printMarkup(title,content){const print=$('proPrintSheet');if(!print)return;print.innerHTML=`<h1>${esc(title)}</h1><p>Jürgen Dartkasse · ${esc(new Date().toLocaleDateString('de-DE'))} · nur lokal erfasste Daten</p>${content}`;try{window.print();}catch{toast('Druckdialog konnte nicht geöffnet werden.');}}
function printPlayer(){const id=$('proReportPlayer').value;if(!player(id))return;const r=reportTable(id);const table=`<table><thead><tr><th>Datum</th><th>Spielart</th><th>Gegner</th><th>Ergebnis</th><th>Average</th></tr></thead><tbody>${r.summaries.map(x=>`<tr><td>${esc(x.date)}</td><td>${esc(x.mode)}</td><td>${esc(x.opponents)}</td><td>${esc(x.status)}</td><td>${fmt(x.average)}</td></tr>`).join('')}</tbody></table><p>Bestes gewonnenes Leg: ${r.a.bestLeg??'–'} Darts · Trainings: ${r.dr.attempts} / geschafft ${r.dr.success}</p>`;printMarkup('Dart-Bericht · '+name(id),table);}
function printTournament(){const t=tourneys().find(x=>x.id===selectedTournament);if(!t)return;const fixtures=P.resolveFixtures(t,matches()).fixtures;printMarkup('Dart-Turnier · '+t.name,`<table><thead><tr><th>Runde</th><th>Spieler A</th><th>Spieler B</th><th>Sieger</th></tr></thead><tbody>${fixtures.map(x=>`<tr><td>${esc(x.stage)}</td><td>${esc(name(x.a))}</td><td>${esc(name(x.b))}</td><td>${esc(x.winnerId?(t.type==='teams'?(x.winnerId==='teamA'?'Team A':'Team B'):name(x.winnerId)):'Offen')}</td></tr>`).join('')}</tbody></table>`);}
function updateCamera(file){if(cameraUrl){URL.revokeObjectURL(cameraUrl);cameraUrl='';}const image=$('proCameraPreview');if(!image)return;if(!file){image.hidden=true;image.removeAttribute('src');return;}if(!file.type.startsWith('image/')){toast('Bitte ein Foto auswählen.');return;}cameraUrl=URL.createObjectURL(file);image.src=cameraUrl;image.hidden=false;toast('Foto nur lokal geöffnet. Treffer müssen weiterhin manuell erfasst werden.');}
function render(){if(!api||!$('view-pro'))return;renderTabs();updatePlayerCheckboxes();renderTournaments();renderTraining();renderReports();renderClub();}
function init(o){api=o;const root=$('view-pro');if(!root)return;
 root.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
 if(b.dataset.proTab){tab=b.dataset.proTab;renderTabs();return;}
 if(b.dataset.proSelect){selectedTournament=b.dataset.proSelect;renderTournaments();return;}
 if(b.dataset.proPlay){startFixture(b.dataset.proPlay);return;}
 if(b.dataset.proNext){startFixture(b.dataset.proNext);return;}
 if(b.dataset.proOpenmatch){api.goView('games');window.DartsGameUI?.activateMatch(b.dataset.proOpenmatch);return;}
 if(b.dataset.proResult){manualResult(b.dataset.proResult,b.dataset.proSide);return;}
 if(b.dataset.proClear){clearFixture(b.dataset.proClear);return;}
 if(b.id==='proTournamentCreate'){createTournament();return;}
 if(b.dataset.proDeleteTournament!==undefined){removeTournament();return;}
 if(b.dataset.proExportTournament!==undefined){csvTournament();return;}
 if(b.dataset.proPrintTournament!==undefined){printTournament();return;}
 if(b.id==='proTrainStart'){startTraining();return;}
 if(b.dataset.trainRing){trainRing=Number(b.dataset.trainRing);renderTraining();return;}
 if(b.dataset.trainNum!==undefined){if(!trainSession||trainStaged.length>=3)return;const n=Number(b.dataset.trainNum),m=b.dataset.trainM!==undefined?Number(b.dataset.trainM):trainRing;trainStaged.push({n,m});renderTraining();return;}
 if(b.dataset.proTrainUndo!==undefined){trainStaged.pop();renderTraining();return;}
 if(b.dataset.proTrainCommit!==undefined){commitTraining();return;}
 if(b.dataset.proTrainCancel!==undefined){if(!confirm('Training ohne Speichereintrag abbrechen?'))return;trainSession=null;trainStaged=[];renderTraining();return;}
 if(b.id==='proReportCSV'){csvPlayer();return;}
 if(b.id==='proReportPrint'){printPlayer();return;}
 });
 root.addEventListener('change',e=>{if(e.target.id==='proTrainPlayer')renderTraining();if(e.target.id==='proReportPlayer')renderReports();if(e.target.id==='proCameraInput')updateCamera(e.target.files?.[0]);});
 window.addEventListener('pagehide',()=>{if(cameraUrl)URL.revokeObjectURL(cameraUrl);});
 render();}
window.DartsPro={init,render,renderProfileExtras:playerAnalyticsMarkup};
})();
