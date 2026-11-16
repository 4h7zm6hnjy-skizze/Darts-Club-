/* JÜRGEN DARTKASSE · own Dart-Spielmodus (offline) v1.9.1 */
(function(){
'use strict';
const E=window.DartsGameEngine;
const $=id=>document.getElementById(id);
let api=null;
let selectedPlayers=[];
let ring=1;
let staged=[];
let statsMode='all';
let statsPeriod='all';
let gameMenuOpen=true;
let specialBooking='none';
let callerEnabled=false;
let statsWindow='10';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const fmt=n=>new Intl.NumberFormat('de-DE',{maximumFractionDigits:2}).format(n||0);
const getState=()=>api.getState();
const allGames=()=>getState().dartMatches||[];
const gameById=id=>allGames().find(g=>g.id===id);
const currentGame=()=>gameById(getState().activeDartMatchId);
const playerName=id=>getState().players.find(p=>p.id===id)?.name||'Spieler';
const playerRef=id=>getState().players.find(p=>p.id===id)||null;
const validGamePlayers=()=>getState().players.filter(p=>!p.archived);
const modeName=mode=>E.GAME_MODES.find(m=>m.id===mode)?.name||mode;
const gameDate=m=>new Date(m.createdAt).toLocaleDateString('de-DE');
function ensureChosen(){
 const ids=new Set(validGamePlayers().map(p=>p.id));
 selectedPlayers=selectedPlayers.filter(id=>ids.has(id));
 if(!selectedPlayers.length)selectedPlayers=validGamePlayers().slice(0,2).map(p=>p.id);
}
function avatar(player){
 if(!player)return '<span class="game-mini-avatar">?</span>';
 return `<span class="game-mini-avatar">${player.photo?`<img src="${esc(player.photo)}" alt="">`:esc(player.name.charAt(0).toUpperCase())}</span>`;
}
function liveAverage(report,playerState){return playerState.darts?report.average3:0;}
function projectedAverage(playerState,extraPoints,extraDarts){
 const darts=playerState.darts+extraDarts;
 return darts?Number((((playerState.pointsThrown||0)+extraPoints)/darts*3).toFixed(2)):0;
}
function refresh(){render();}
function toast(t){api.toast(t);}
// The game engine supplies verified double-out checkout routes for 1-3 darts.
function checkoutText(remaining,dartsLeft,doubleOut){
 if(!Number.isInteger(remaining))return '–';
 if(remaining===0)return 'Finish';
 if(remaining<0)return 'Bust – Aufnahme zählt nicht';
 if(doubleOut&&remaining===1)return 'Bust – 1 Restpunkt ist ungültig';
 const route=E.checkoutRoute(remaining,dartsLeft,doubleOut);
 if(route)return route.map(E.dartLabel).join(' · ');
 if(doubleOut&&remaining>170)return 'Kein direktes Finish. Punkte herunterspielen.';
 return 'Kein direktes Finish mit den übrigen Darts';
}
function draftStatus(match,p){
 let left=p.remaining,score=0,bust=false,win=false;
 for(const d of staged){
  const next=left-E.dartValue(d);
  if(next<0||(match.options.doubleOut&&(next===1||(next===0&&d.m!==2)))){bust=true;break;}
  score+=E.dartValue(d);left=next;
  if(left===0){win=true;break;}
 }
 return {remaining:bust?p.remaining:left,points:bust?0:score,bust,win};
}
function say(text){
 if(!callerEnabled||!('speechSynthesis' in window)||typeof SpeechSynthesisUtterance==='undefined')return;
 try{window.speechSynthesis.cancel();const utterance=new SpeechSynthesisUtterance(text);utterance.lang='de-DE';utterance.rate=1;window.speechSynthesis.speak(utterance);}catch{}
}
function turnAverageLabel(match,r){
 const id=r.currentPlayerId; const p=r.players[id]; const report=E.playerReport(match,id); const preview=E.isX01(match.mode)?draftStatus(match,p):null; const stagedPoints=preview?preview.points:staged.reduce((a,d)=>a+E.dartValue(d),0);
 if(E.isX01(match.mode))return {label:'Aktueller 3-Dart-Ø',value:fmt(liveAverage(report,p)),projected:staged.length?fmt(projectedAverage(p,stagedPoints,staged.length)):'–'};
 if(E.isCricket(match.mode))return {label:'Aktueller MPR',value:fmt(report.mpr),projected:'–'};
 const roundAvg=p.visits?fmt((p.score||0)/p.visits):'0';
 return {label:'Schnitt',value:roundAvg,projected:staged.length?fmt(((p.score||0)+stagedPoints)/(p.visits+1||1)):'–'};
}
function playerAggregate(games,id){
 const agg={games:0,finished:0,wins:0,legs:0,x01Games:0,x01Darts:0,x01Points:0,first9Score:0,first9Darts:0,bests:{avg:0,first9:0,checkout:0,finish:0,mpr:0},
  score60:0,score100:0,score140:0,score180:0,checkoutAttempts:0,checkoutHits:0,cricketMarks:0,cricketDarts:0};
 for(const g of games){
  if(!g.playerIds.includes(id))continue;
  const r=E.replay(g); const rep=E.playerReport(g,id); const p=r.players[id];
  agg.games++; if(rep.finished)agg.finished++; if(rep.winner&&rep.finished)agg.wins++; agg.legs+=rep.totalLegs||rep.legs||0;
  agg.checkoutAttempts+=rep.checkoutAttempts||0; agg.checkoutHits+=rep.checkoutHits||0;
  agg.bests.checkout=Math.max(agg.bests.checkout,rep.checkoutRate||0); agg.bests.finish=Math.max(agg.bests.finish,rep.highFinish||0);
  if(E.isX01(g.mode)){
   agg.x01Games++; agg.x01Darts+=rep.darts||0; agg.x01Points+=rep.totalPoints||0; agg.first9Score+=p.first9Score||0; agg.first9Darts+=p.first9Darts||0;
   agg.bests.avg=Math.max(agg.bests.avg,rep.average3||0); agg.bests.first9=Math.max(agg.bests.first9,rep.first9||0);
   for(const h of r.history.filter(h=>h.playerId===id)){
    if(h.score>=60)agg.score60++;
    if(h.score>=100)agg.score100++;
    if(h.score>=140)agg.score140++;
    if(h.score===180)agg.score180++;
   }
  }
  if(E.isCricket(g.mode)){
   agg.cricketMarks+=p.cricketMarks||0; agg.cricketDarts+=rep.darts||0; agg.bests.mpr=Math.max(agg.bests.mpr,rep.mpr||0);
  }
 }
 agg.avg=agg.x01Darts?Number((agg.x01Points/agg.x01Darts*3).toFixed(2)):0;
 agg.first9=agg.first9Darts?Number((agg.first9Score/agg.first9Darts*3).toFixed(2)):0;
 agg.checkout=agg.checkoutAttempts?Number((agg.checkoutHits/agg.checkoutAttempts*100).toFixed(1)):0;
 agg.winPct=agg.finished?Number((agg.wins/agg.finished*100).toFixed(1)):0;
 agg.mpr=agg.cricketDarts?Number((agg.cricketMarks/agg.cricketDarts*3).toFixed(2)):0;
 return agg;
}
function renderSetup(){
 const game=currentGame(); const root=$('dartsSetup'); if(!root)return;
 const modes=E.GAME_MODES; const selectedMode=$('dartsMode')?.value||'x01'; ensureChosen();
 $('dartsGameModeCards').innerHTML=modes.map(m=>`<button class="mode-card ${selectedMode===m.id?'selected':''}" data-mode="${esc(m.id)}"><span class="mode-type">${esc(m.group)}</span><strong>${esc(m.name)}</strong><small>${esc(m.detail)}</small></button>`).join('');
 $('dartsSelectedPlayers').innerHTML=validGamePlayers().length?validGamePlayers().map(p=>{
  const chosen=selectedPlayers.includes(p.id);
  return `<button type="button" class="game-player-toggle ${chosen?'selected':''}" data-game-player="${esc(p.id)}" aria-pressed="${chosen}">${avatar(p)}<span>${esc(p.name)}</span>${chosen?'<span class="game-check">✓</span>':''}</button>`;
 }).join(''):'<p class="game-muted">Du hast noch keinen Spieler angelegt. Öffne „Spieler“, um Spieler hinzuzufügen.</p>';
 const x01=selectedMode==='x01', finish=selectedMode==='finish170',countup=selectedMode==='countup',shanghai=selectedMode==='shanghai',around=selectedMode==='around';
 $('dartsX01Options').hidden=!x01;
 $('dartsRoundsOption').hidden=!(countup||shanghai);
 $('dartsAroundOption').hidden=!(around);
 $('dartsModeInfo').textContent=finish?'170 Checkout: Ein Spieler hat maximal neun Darts zum Checkout.':E.GAME_MODES.find(x=>x.id===selectedMode)?.detail||'';
 root.hidden=!!game&&!gameMenuOpen;
}
function renderScores(match,r){
 const showValue=p=>E.isX01(match.mode)?`${p.remaining}`:E.isCricket(match.mode)?`${p.score}`:match.mode==='around'?(p.progress<=20?`→ ${p.progress}`:p.progress===21?'→ Bull':'Fertig'):`${p.score}`;
 $('dartsScoreboard').innerHTML=match.playerIds.map(id=>{
  const p=r.players[id],selected=r.currentPlayerId===id,photo=playerRef(id);
  const report=E.playerReport(match,id);
  const caption=E.isX01(match.mode)?`Sets ${p.sets||0} · Legs ${p.legs} · Ø ${fmt(report.average3)}${report.highFinish?` · Best Finish ${report.highFinish}`:''}`:E.isCricket(match.mode)?`${p.cricketMarks} Marks · MPR ${fmt(report.mpr)}`:`${p.visits} Runden · ${p.darts} Darts`;
  return `<div class="game-score-card ${selected?'active':''} ${r.winnerId===id?'winner':''}"><div class="game-score-name">${avatar(photo)}<strong>${esc(playerName(id))}</strong>${selected?'<span class="game-turn-indicator">AM ZUG</span>':''}${r.winnerId===id?'<span class="game-trophy">Sieger</span>':''}</div><div class="game-score-number">${esc(showValue(p))}</div><div class="game-score-caption">${caption}</div></div>`;
 }).join('');
 if(E.isCricket(match.mode)){
  const targets=E.targetList(match.mode);
  $('dartsCricketTable').hidden=false;
  $('dartsCricketTable').innerHTML=`<table><thead><tr><th>Ziel</th>${match.playerIds.map(id=>`<th>${esc(playerName(id))}</th>`).join('')}</tr></thead><tbody>${targets.map(n=>`<tr><th>${n===25?'Bull':n}</th>${match.playerIds.map(id=>{const count=r.players[id].marks[n];return `<td class="marks ${count>=3?'closed':''}">${count===0?'–':count===1?'/':count===2?'X':'⊗'}</td>`;}).join('')}</tr>`).join('')}</tbody></table>`;
 } else $('dartsCricketTable').hidden=true;
}
function renderLiveMeta(match,r){
 const box=$('dartsLiveMeta'); if(!box||r.finished)return;
 const id=r.currentPlayerId, p=r.players[id], report=E.playerReport(match,id); const avg=turnAverageLabel(match,r);
 const draft=E.isX01(match.mode)?draftStatus(match,p):null;
 const stagedPoints=draft?draft.points:staged.reduce((a,d)=>a+E.dartValue(d),0);
 const remainingAfterStage=draft?draft.remaining:null;
 const dartsLeft=Math.max(1,3-staged.length);
 const checkout=E.isX01(match.mode)?(draft?.bust?'BUST':checkoutText(remainingAfterStage??p.remaining,dartsLeft,match.options.doubleOut)):'–';
 const cards=[];
 if(E.isX01(match.mode)){
  cards.push(['Rest',p.remaining]);
  cards.push([avg.label,avg.value]);
  cards.push(['Ø mit aktueller Aufnahme',avg.projected]);
  cards.push(['Checkout',checkout]);
 }
 else if(E.isCricket(match.mode)){
  cards.push(['Punkte',p.score]); cards.push(['Marks',p.cricketMarks]); cards.push([avg.label,avg.value]); cards.push(['Aufnahme',stagedPoints]);
 } else {
  cards.push(['Runden',p.visits]); cards.push(['Punkte',p.score]); cards.push([avg.label,avg.value]); cards.push(['Aufnahme',stagedPoints]);
 }
 cards.push(['Aufnahme',staged.length?staged.map(E.dartLabel).join(' · '):'–']);
 box.innerHTML=cards.map(([label,val])=>`<div class="live-meta-card"><small>${esc(label)}</small><strong>${esc(String(val))}</strong></div>`).join('');
}
function renderSpecialButtons(){
 const root=$('dartsSpecialBooking'); if(!root)return;
 const defs=[['none','Ohne'],['juergen','Jürgen'],['perfect','Perfekter Jürgen']];
 root.innerHTML=defs.map(([id,label])=>`<button class="special-toggle ${specialBooking===id?'active':''}" data-special="${id}" type="button">${id==='perfect'?'👑 ':id==='juergen'?'◎ ':''}${esc(label)}</button>`).join('');
}
function renderDartPad(match,r){
 $('dartsLive').hidden=r.finished; $('dartsWinner').hidden=!r.finished;
 if(r.finished){
  const w=r.winnerId;
  $('dartsWinner').innerHTML=`<div class="game-win-icon">🏆</div><h3>${esc(playerName(w))}</h3><p>${esc(modeName(match.mode))} beendet · ${match.turns.length} Aufnahmen erfasst</p><button id="dartsReplay" class="primary-btn">Neue Partie mit diesen Spielern</button>`;
  return;
 }
 const player=playerName(r.currentPlayerId); const ps=r.players[r.currentPlayerId];
 let notice='Pro Aufnahme bis zu drei Darts tippen und bestätigen.';
 if(match.mode==='around')notice=`Ziel: ${ps.progress>20?'Bull':ps.progress} · jede passende Zahl zählt einen Schritt`;
 if(match.mode==='shanghai')notice=`Rundenziel: ${Math.min(ps.visits+1,match.options.rounds)} · Single + Double + Triple = Shanghai`;
 if(match.mode==='halfit')notice=`Rundenziel: ${E.HALFIT[Math.min(ps.visits,6)]===25?'Bull':E.HALFIT[Math.min(ps.visits,6)]} · ohne Treffer wird halbiert`;
 if(match.mode==='bobs27')notice=`Ziel: Double ${Math.min(ps.visits+1,21)===21?'Bull':Math.min(ps.visits+1,21)} · Start 27`;
 if(E.isCricket(match.mode))notice='Schließe Zahlen mit drei Marks; Double zählt zwei, Triple drei.';
 if(match.mode==='finish170')notice=`Rest: ${ps.remaining} · ${Math.max(0,9-ps.darts)} Darts verbleiben`;
 $('dartsTurnTitle').textContent=`${player} ist am Zug`; $('dartsTurnInfo').textContent=notice;
 const caller=$('dartsCallerToggle');if(caller){caller.textContent=callerEnabled?'🔊 Caller an':'🔈 Caller aus';caller.setAttribute('aria-pressed',callerEnabled?'true':'false');}
 renderLiveMeta(match,r);
 $('dartsTurnPreview').innerHTML=staged.length?staged.map((d,i)=>`<span class="staged-dart">${i+1}. ${esc(E.dartLabel(d))}</span>`).join(''):'<span class="game-muted">Noch kein Dart ausgewählt.</span>';
 $('dartsDraftScore').textContent=staged.length?`${staged.reduce((a,d)=>a+E.dartValue(d),0)} Punkte`:'0 Punkte';
 $('dartsRingButtons').querySelectorAll('[data-ring]').forEach(b=>b.classList.toggle('active',Number(b.dataset.ring)===ring));
 $('dartsConfirmTurn').disabled=!staged.length; $('dartsRemoveStaged').disabled=!staged.length;
 renderSpecialButtons();
 $('dartsTargetButtons').innerHTML=Array.from({length:20},(_,i)=>20-i).map(n=>`<button class="dart-target" data-number="${n}">${n}</button>`).join('')+
 `<button class="dart-target bull25" data-number="25" data-force-m="1">25</button><button class="dart-target bull50" data-number="25" data-force-m="2">Bull</button><button class="dart-target miss" data-number="0" data-force-m="0">Miss</button>`;
}
function renderGameHistory(match,r){
 $('dartsTurnHistory').innerHTML=r.history.length?r.history.slice(-12).reverse().map(h=>`<div class="game-history-row"><strong>${esc(playerName(h.playerId))}</strong><span>${esc(h.darts.join(' · '))}</span><b>${h.bust?'BUST':h.win?'FINISH':E.isX01(match.mode)?`${h.score} Punkte`:E.isCricket(match.mode)?`+${h.score}`:`${h.score} Punkte`}</b></div>`).join(''):'<p class="game-muted">Noch keine Darts erfasst.</p>';
 $('dartsMatchStats').innerHTML=match.playerIds.map(id=>{
  const x=E.playerReport(match,id); const p=r.players[id];
  const lines=E.isX01(match.mode)?[['3-Dart-Ø',fmt(x.average3)],['First-9-Ø',fmt(x.first9)],['100+',String(x.scores100)],['140+',String(x.scores140)],['180',String(x.scores180)],['Checkout',x.checkoutAttempts?`${x.checkoutRate}%`:'–'],['Highest Finish',String(x.highFinish)],['Buste',String(x.busts)]]:
   E.isCricket(match.mode)?[['MPR',fmt(x.mpr)],['Marks',String(p.cricketMarks)],['Punkte',String(x.score)],['Darts',String(x.darts)]]:
   [['Runden',String(x.visits)],['Darts',String(x.darts)],['Punkte',String(x.score)]];
  return `<div class="match-stat-player"><h4>${esc(playerName(id))}</h4><div class="match-stat-grid">${lines.map(([name,value])=>`<div><small>${esc(name)}</small><strong>${esc(value)}</strong></div>`).join('')}</div></div>`;
 }).join('');
}
function renderCurrent(){
 const game=currentGame(); $('dartsCurrent').hidden=!game; $('dartsNoGame').hidden=!!game; if(!game)return;
 const r=E.replay(game),finished=r.finished;
 $('dartsCurrentTitle').textContent=modeName(game.mode);
 $('dartsCurrentMeta').textContent=`${gameDate(game)} · ${game.turns.length} Aufnahmen${game.mode==='x01'?' · Best of '+(game.options.bestOfSets||1)+' Sets, '+game.options.bestOfLegs+' Legs':''}`;
 $('dartsMatchStatus').textContent=finished?'Beendet':'Laufend';
 const legBoard=$('dartsLegSetBoard');
 if(legBoard){legBoard.hidden=!E.isX01(game.mode);if(E.isX01(game.mode))legBoard.innerHTML=`<div class="leg-set-title">Set ${r.set} · Leg ${r.leg} · Best of ${game.options.bestOfSets||1} Sets / ${game.options.bestOfLegs} Legs</div><div class="leg-set-row">${game.playerIds.map(id=>{const p=r.players[id];return `<div><b>${esc(playerName(id))}</b><span>Sets ${p.sets||0}</span><strong>Legs ${p.legs}</strong></div>`;}).join('')}</div>`;}
 $('dartsUndoTurn').disabled=!game.turns.length; $('dartsDeleteGame').hidden=false;
 renderScores(game,r); renderDartPad(game,r); renderGameHistory(game,r);
}
function legAverageSeries(games,id){
 const values=[];
 for(const g of games){
  if(g.mode!=='x01'||!g.playerIds.includes(id))continue;
  const r=E.replay(g);
  for(const finishedLeg of r.legHistory){
   const hist=r.history.filter(h=>h.round===finishedLeg.leg&&h.playerId===id);
   const score=hist.reduce((a,h)=>a+h.score,0);
   const darts=hist.reduce((a,h)=>a+h.darts.length,0);
   if(darts>0)values.push(Number((score/darts*3).toFixed(2)));
  }
 }
 return values;
}
function legTrendSvg(values){
 if(!values.length)return '<p class="game-muted">Noch keine abgeschlossenen X01-Legs für das Diagramm.</p>';
 const width=520,height=150,pad=12;
 const points=values.map((v,i)=>`${pad+i*(width-2*pad)/Math.max(1,values.length-1)},${(height-pad)-(Math.max(0,Math.min(180,v))/180)*(height-2*pad)}`);
 const dots=values.length===1?`<circle cx="${pad}" cy="${(height-pad)-(Math.max(0,Math.min(180,values[0]))/180)*(height-2*pad)}" r="5" fill="#f4c45f"/>`:'';
 const line=points.join(' ');
 const poly=`${pad},${height-pad} ${line} ${width-pad},${height-pad}`;
 return `<svg class="game-trend-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="PPR-Verlauf der abgeschlossenen X01-Legs mit ${values.length} Datenpunkten"><line x1="${pad}" y1="${height-pad}" x2="${width-pad}" y2="${height-pad}" stroke="#60819a" stroke-width="1" stroke-dasharray="4 6"/><line x1="${pad}" y1="${height/2}" x2="${width-pad}" y2="${height/2}" stroke="#60819a" stroke-width="1" stroke-dasharray="4 6"/><polygon points="${poly}" fill="rgba(233,175,68,.22)"/><polyline points="${line}" fill="none" stroke="#f2be5c" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>${dots}</svg>`;
}
function averageDelta(current,previous){
 if(!previous||!previous.x01Darts||!current.x01Darts)return '';
 const diff=Number((current.avg-previous.avg).toFixed(2));
 return `<span class="game-comparison ${diff>=0?'positive':'negative'}">${diff>=0?'▲':'▼'} ${fmt(Math.abs(diff))} PPR gegenüber vorheriger Auswahl</span>`;
}
function renderStats(){
 const games=allGames();
 $('dartsMatchList').innerHTML=games.length?games.slice().reverse().slice(0,15).map(g=>{const r=E.replay(g); return `<button class="game-history-match ${getState().activeDartMatchId===g.id?'selected':''}" data-open-game="${esc(g.id)}"><span class="game-match-main"><b>${esc(modeName(g.mode))}</b><small>${esc(g.playerIds.map(playerName).join(' · '))}</small></span><span><b>${r.finished?esc(playerName(r.winnerId)):'Läuft'}</b><small>${gameDate(g)}</small></span></button>`;}).join(''):'<p class="game-muted">Hier erscheinen deine gespeicherten Spiele.</p>';
 const periodSelect=$('dartsStatsPeriod');
 const availableMonths=[...new Set(games.map(g=>g.createdAt.slice(0,7)).filter(s=>/^\d{4}-\d{2}$/.test(s)))];
 const currentMonth=new Date().toISOString().slice(0,7); if(!availableMonths.includes(currentMonth))availableMonths.push(currentMonth);
 availableMonths.sort().reverse();
 const availableYears=[...new Set(availableMonths.map(m=>m.slice(0,4)))].sort().reverse();
 const choices=['all',...availableYears,...availableMonths]; if(!choices.includes(statsPeriod))statsPeriod='all';
 periodSelect.innerHTML=`<option value="all">Gesamter Zeitraum</option>`+availableYears.map(y=>`<option value="${y}">Jahr ${y}</option>`).join('')+availableMonths.map(m=>{const d=new Date(m+'-15T12:00:00');const label=d.toLocaleDateString('de-DE',{month:'long',year:'numeric'});return `<option value="${m}">${esc(label)}</option>`;}).join('');
 periodSelect.value=statsPeriod;
 const filtered=games.filter(g=>(statsMode==='all'||g.mode===statsMode)&&(statsPeriod==='all'||g.createdAt.startsWith(statsPeriod)));
 const playerIds=[...new Set(filtered.flatMap(g=>g.playerIds))];
 const totals={games:filtered.length,players:playerIds.length,x01:filtered.filter(g=>E.isX01(g.mode)).length,cricket:filtered.filter(g=>E.isCricket(g.mode)).length};
 $('dartsAllStats').innerHTML=filtered.length?`<article class="game-total-stat big"><h4>Übersicht</h4><div class="game-stat-chips"><span>${totals.games} Spiele</span><span>${totals.players} Spieler</span><span>${totals.x01} X01</span><span>${totals.cricket} Cricket</span><span>${filtered.filter(g=>g.finishedAt).length} beendet</span></div></article>`:'<p class="game-muted">Für diese Auswahl sind noch keine Spiele gespeichert.</p>';
 const playersRoot=$('dartsPlayerStats');
 const limit=statsWindow==='all'?Infinity:Number(statsWindow);
 $('dartsStatsWindowLabel').textContent=statsWindow==='all'?'Alle Spiele':`Letzte ${statsWindow} Spiele je Spieler`;
 document.querySelectorAll('[data-stats-window]').forEach(el=>el.classList.toggle('active',el.dataset.statsWindow===statsWindow));
 playersRoot.innerHTML=playerIds.length?playerIds.map(id=>{
  const history=filtered.filter(g=>g.playerIds.includes(id)).sort((a,b)=>a.createdAt.localeCompare(b.createdAt));
  const selected=Number.isFinite(limit)?history.slice(-limit):history;
  const previous=Number.isFinite(limit)?history.slice(Math.max(0,history.length-2*limit),Math.max(0,history.length-limit)):[];
  const a=playerAggregate(selected,id);
  const prior=previous.length?playerAggregate(previous,id):null;
  const series=legAverageSeries(selected,id);
  const player=playerRef(id)||{name:playerName(id),photo:null};
  const rows=[
   ['PPR / 3-Dart-Ø', a.avg?fmt(a.avg):'–', a.bests.avg?fmt(a.bests.avg):'–'],
   ['Erste 9 PPR', a.first9?fmt(a.first9):'–', a.bests.first9?fmt(a.bests.first9):'–'],
   ['Checkout %', a.checkoutAttempts?`${fmt(a.checkout)}%`:'–', a.bests.checkout?`${fmt(a.bests.checkout)}%`:'–'],
   ['Höchstes Finish', '–', a.bests.finish?fmt(a.bests.finish):'–'],
   ['Win %', a.finished?`${fmt(a.winPct)}% (${a.wins}/${a.finished})`:'–', '–'],
   ['Cricket MPR', a.mpr?fmt(a.mpr):'–', a.bests.mpr?fmt(a.bests.mpr):'–'],
  ];
  return `<article class="player-pro-card"><div class="player-pro-head">${avatar(player)}<div><h4>${esc(player.name)}</h4><small>${a.games} Spiele · ${a.wins} Siege · ${a.legs} gewonnene Legs</small></div></div><div class="game-trend-panel"><div class="game-trend-heading"><strong>PPR-Verlauf nach abgeschlossenen Legs</strong><span>${series.length} Legs · ${esc(statsWindow==='all'?'alle Spiele':'letzte '+statsWindow+' Spiele')}</span></div>${legTrendSvg(series)}${averageDelta(a,prior)}</div><div class="player-pro-table"><div class="player-pro-row head"><span>Statistik</span><span>Ø</span><span>Best</span></div>${rows.map(([n,v,b])=>`<div class="player-pro-row"><span>${esc(n)}</span><strong>${esc(String(v))}</strong><strong>${esc(String(b))}</strong></div>`).join('')}</div><div class="player-hit-grid"><div><small>60+</small><strong>${a.score60}</strong></div><div><small>100+</small><strong>${a.score100}</strong></div><div><small>140+</small><strong>${a.score140}</strong></div><div><small>180</small><strong>${a.score180}</strong></div></div><div class="game-muted game-stat-footnote">Alle Werte stammen aus gespeicherten Spielen. Keine hochgerechneten Ergebnisse.</div></article>`;
 }).join(''):'<div class="game-muted">Noch keine Spielerstatistiken in der Auswahl.</div>';
}
function render(){if(!api||!$('view-games'))return;renderSetup();renderCurrent();renderStats();}
function togglePlayer(id){ if(selectedPlayers.includes(id))selectedPlayers=selectedPlayers.filter(x=>x!==id); else if(selectedPlayers.length>=6){toast('Maximal sechs Spieler pro Partie.');return;} else selectedPlayers.push(id); refresh(); }
function newGame(){
 const mode=$('dartsMode').value;
 if(!selectedPlayers.length){toast('Bitte mindestens einen Spieler auswählen.');return;}
 if(mode==='finish170'&&selectedPlayers.length!==1){toast('170-Checkout-Training ist für einen Spieler ausgelegt.');return;}
 if(mode==='cricket-cut'&&selectedPlayers.length<2){toast('Cut-Throat braucht mindestens zwei Spieler.');return;}
 const opts={start:Number($('dartsStart').value),doubleOut:$('dartsDoubleOut').checked,bestOfLegs:Number($('dartsBestOf').value),bestOfSets:Number($('dartsBestOfSets').value),rounds:Number($('dartsRoundLimit').value),aroundBull:$('dartsAroundBull').checked};
 const current=currentGame(); if(current&&!E.replay(current).finished && !confirm('Aktuelle Partie verlassen und eine neue starten? Die alte Partie bleibt gespeichert.'))return;
 try{ const m=E.createMatch({mode,playerIds:selectedPlayers,options:opts}); getState().dartMatches.push(m); getState().activeDartMatchId=m.id; staged=[]; specialBooking='none'; gameMenuOpen=false; api.persist(); render(); toast(`${modeName(mode)} gestartet.`); $('dartsCurrent').scrollIntoView({block:'start',behavior:'smooth'});}catch(err){toast(err.message);} }
function recordTurn(){
 const game=currentGame();if(!game||!staged.length)return;
 const throwerId=E.replay(game).currentPlayerId;
 const isPerfect=specialBooking==='perfect';
 if(specialBooking!=='none'){
  if(E.juergenType(staged)!==(isPerfect?'perfect':'juergen')){
   toast(isPerfect?'Perfekter Jürgen benötigt T1, T5 und T20.':'Jürgen benötigt 1, 5 und 20, jeweils Single oder Double.');return;
  }
  if(!api.canBookDartJuergen?.(throwerId,isPerfect,game.createdAt)){
   toast('Jürgen kann für diesen Werfer nicht verbucht werden (abwesend, archiviert oder kein weiterer Spieler).');return;
  }
 }
 try{
  const updated=E.nextTurn(game,staged);
  const index=getState().dartMatches.findIndex(g=>g.id===game.id);
  getState().dartMatches[index]=updated;
  if(specialBooking!=='none'){
   const groupId=api.addJuergenForThrower(throwerId,isPerfect,game.createdAt);
   if(!groupId){getState().dartMatches[index]=game;toast('Jürgen-Buchung fehlgeschlagen. Spielzug nicht übernommen.');return;}
   updated.turns.at(-1).juergenGroupId=groupId;
  }
  const currentTurn=staged.map(E.dartLabel).join(', ');
  const points=staged.reduce((n,d)=>n+E.dartValue(d),0);
  staged=[];specialBooking='none';api.persist();render();
  const r=E.replay(updated);
  say(r.finished?`${playerName(r.winnerId)} gewinnt!`:`${playerName(throwerId)}: ${points} Punkte`);
  if(r.finished)toast(`${playerName(r.winnerId)} gewinnt die Partie!`);
 }catch(err){toast(err.message);}
}
function undoTurn(){
 const game=currentGame();if(!game?.turns.length)return;
 const groupId=game.turns.at(-1).juergenGroupId;
 if(!confirm(groupId?'Letzte Aufnahme und dazugehörigen Jürgen inklusive Gebühren zurücknehmen?':'Letzte Aufnahme wirklich zurücknehmen?'))return;
 const updated=E.undoTurn(game);
 const index=getState().dartMatches.findIndex(g=>g.id===game.id);
 getState().dartMatches[index]=updated;
 if(groupId)api.voidDartJuergenGroup?.(groupId);
 staged=[];specialBooking='none';api.persist();render();toast(groupId?'Aufnahme und Jürgen storniert.':'Letzte Aufnahme entfernt.');
}
function deleteGame(){
 const game=currentGame();if(!game)return;
 const linked=[...new Set(game.turns.map(t=>t.juergenGroupId).filter(Boolean))];
 const warning=linked.length?`Diese Partie löschen und ${linked.length} verknüpfte Jürgen-Buchung(en) ebenfalls stornieren?`:'Diese Partie mit allen Würfen dauerhaft löschen?';
 if(!confirm(warning))return;
 getState().dartMatches=getState().dartMatches.filter(g=>g.id!==game.id);
 getState().activeDartMatchId=getState().dartMatches.at(-1)?.id||null;
 for(const id of linked)api.voidDartJuergenGroup?.(id);
 staged=[];specialBooking='none';api.persist();render();toast('Partie gelöscht.');
}
function selectMode(id){$('dartsMode').value=id;renderSetup();}
function loadGame(id){ if(!gameById(id))return; getState().activeDartMatchId=id; staged=[]; specialBooking='none'; gameMenuOpen=false; api.persist(); render(); $('dartsCurrent').scrollIntoView({block:'start',behavior:'smooth'}); }
function init(obj){ api=obj; const view=$('view-games');
 view.addEventListener('click',e=>{
  const b=e.target.closest('button'); if(!b)return;
  if(b.dataset.mode){selectMode(b.dataset.mode);return;}
  if(b.dataset.gamePlayer){togglePlayer(b.dataset.gamePlayer);return;}
  if(b.dataset.ring){ring=Number(b.dataset.ring);renderDartPadIf();return;}
  if(b.id==='dartsCallerToggle'){callerEnabled=!callerEnabled;if(!callerEnabled&&'speechSynthesis' in window)window.speechSynthesis.cancel();renderDartPadIf();return;}
  if(b.dataset.special){specialBooking=(specialBooking===b.dataset.special?'none':b.dataset.special); renderDartPadIf(); return;}
  if(b.dataset.number!==undefined){
   if(staged.length>=3){toast('Maximal drei Darts pro Aufnahme.');return;}
   const n=Number(b.dataset.number); const forced=b.dataset.forceM!==undefined?Number(b.dataset.forceM):null; const m=forced!==null?forced:(n===0?0:n===25?Math.min(ring,2):ring);
   if(n===25 && m===3){toast('Triple 25 gibt es nicht.'); return;}
   staged.push({n,m}); renderDartPadIf(); return;
  }
  if(b.dataset.statsWindow){statsWindow=b.dataset.statsWindow;renderStats();return;}
  if(b.dataset.openGame){loadGame(b.dataset.openGame);return;}
  if(b.id==='dartsStartGame'){newGame();return;}
  if(b.id==='dartsConfirmTurn'){recordTurn();return;}
  if(b.id==='dartsRemoveStaged'){staged.pop();renderDartPadIf();return;}
  if(b.id==='dartsUndoTurn'){undoTurn();return;}
  if(b.id==='dartsDeleteGame'){deleteGame();return;}
  if(b.id==='dartsNewGame'){gameMenuOpen=!gameMenuOpen;renderSetup();return;}
  if(b.id==='dartsReplay'){const g=currentGame();if(!g)return;selectedPlayers=[...g.playerIds];$('dartsMode').value=g.mode;gameMenuOpen=true;renderSetup();$('dartsSetup').scrollIntoView({block:'start',behavior:'smooth'});return;}
 });
 $('dartsMode').addEventListener('change',renderSetup); $('dartsStatsMode').addEventListener('change',e=>{statsMode=e.target.value;renderStats();}); $('dartsStatsPeriod').addEventListener('change',e=>{statsPeriod=e.target.value;renderStats();}); render(); }
function renderDartPadIf(){ const g=currentGame(); if(g)renderDartPad(g,E.replay(g)); }
window.DartsGameUI={init,render};
})();
