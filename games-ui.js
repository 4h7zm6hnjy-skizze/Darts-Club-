/* JÜRGEN DARTKASSE · own Dart-Spielmodus (offline) v1.7.0 */
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
let lastGameId=null;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const fmt=n=>new Intl.NumberFormat('de-DE',{maximumFractionDigits:2}).format(n||0);
const getState=()=>api.getState();
const allGames=()=>getState().dartMatches||[];
const gameById=id=>allGames().find(g=>g.id===id);
const currentGame=()=>gameById(getState().activeDartMatchId);
const playerName=id=>getState().players.find(p=>p.id===id)?.name||'Spieler';
const validGamePlayers=()=>getState().players.filter(p=>!p.archived);
const modeName=mode=>E.GAME_MODES.find(m=>m.id===mode)?.name||mode;
const gameDate=m=>new Date(m.createdAt).toLocaleDateString('de-DE');
function refresh(){render();}
function toast(t){api.toast(t);}
function ensureChosen(){
 const ids=new Set(validGamePlayers().map(p=>p.id));selectedPlayers=selectedPlayers.filter(id=>ids.has(id));
 if(!selectedPlayers.length)selectedPlayers=validGamePlayers().slice(0,2).map(p=>p.id);
}
function renderSetup(){
 const game=currentGame();
 const root=$('dartsSetup');if(!root)return;
 const modes=E.GAME_MODES;
 const selectedMode=$('dartsMode')?.value||'x01';
 ensureChosen();
 $('dartsGameModeCards').innerHTML=modes.map(m=>`<button class="mode-card ${selectedMode===m.id?'selected':''}" data-mode="${esc(m.id)}"><span class="mode-type">${esc(m.group)}</span><strong>${esc(m.name)}</strong><small>${esc(m.detail)}</small></button>`).join('');
 $('dartsSelectedPlayers').innerHTML=validGamePlayers().length?validGamePlayers().map(p=>{
  const chosen=selectedPlayers.includes(p.id);
  return `<button type="button" class="game-player-toggle ${chosen?'selected':''}" data-game-player="${esc(p.id)}" aria-pressed="${chosen}"><span class="game-mini-avatar">${p.photo?`<img src="${esc(p.photo)}" alt="">`:esc(p.name.charAt(0).toUpperCase())}</span><span>${esc(p.name)}</span>${chosen?'<span class="game-check">✓</span>':''}</button>`;
 }).join(''):'<p class="game-muted">Du hast noch keinen Spieler angelegt. Öffne „Spieler“, um Spieler hinzuzufügen.</p>';
 const x01=selectedMode==='x01', finish=selectedMode==='finish170',countup=selectedMode==='countup',shanghai=selectedMode==='shanghai',around=selectedMode==='around';
 $('dartsX01Options').hidden=!x01;
 $('dartsRoundsOption').hidden=!(countup||shanghai);
 $('dartsAroundOption').hidden=!around;
 $('dartsModeInfo').textContent=finish?'170 Checkout: Ein Spieler hat maximal neun Darts zum Checkout.':E.GAME_MODES.find(x=>x.id===selectedMode)?.detail||'';
 $('dartsSetup').hidden=!!game&&!game.finished&&!gameMenuOpen;
}
function renderScores(match,r){
 const showValue=(p)=>{
   if(E.isX01(match.mode))return `${p.remaining}`;
   if(E.isCricket(match.mode))return `${p.score}`;
   if(match.mode==='around')return p.progress<=20?`→ ${p.progress}`:p.progress===21?'→ Bull':'Fertig';
   return `${p.score}`;
 };
 $('dartsScoreboard').innerHTML=match.playerIds.map(id=>{
  const p=r.players[id],selected=r.currentPlayerId===id;
  const caption=E.isX01(match.mode)?`Legs ${p.legs} · Ø ${fmt(E.playerReport(match,id).average3)}`:E.isCricket(match.mode)?`${p.cricketMarks} Marks · MPR ${fmt(E.playerReport(match,id).mpr)}`:`${p.visits} Runden · ${p.darts} Darts`;
  const photo=getState().players.find(x=>x.id===id)?.photo;
  return `<div class="game-score-card ${selected?'active':''} ${r.winnerId===id?'winner':''}"><div class="game-score-name"><span class="game-mini-avatar">${photo?`<img src="${esc(photo)}" alt="">`:esc(playerName(id).slice(0,1))}</span><strong>${esc(playerName(id))}</strong>${selected?'<span class="game-turn-indicator">AM ZUG</span>':''}${r.winnerId===id?'<span class="game-trophy">Sieger</span>':''}</div><div class="game-score-number">${esc(showValue(p))}</div><div class="game-score-caption">${caption}</div></div>`;
 }).join('');
 if(E.isCricket(match.mode)){
  const targets=E.targetList(match.mode);
  $('dartsCricketTable').hidden=false;
  $('dartsCricketTable').innerHTML=`<table><thead><tr><th>Ziel</th>${match.playerIds.map(id=>`<th>${esc(playerName(id))}</th>`).join('')}</tr></thead><tbody>${targets.map(n=>`<tr><th>${n===25?'Bull':n}</th>${match.playerIds.map(id=>{const count=r.players[id].marks[n];return `<td class="marks ${count>=3?'closed':''}">${count===0?'–':count===1?'/':count===2?'X':'⊗'}</td>`;}).join('')}</tr>`).join('')}</tbody></table>`;
 }else $('dartsCricketTable').hidden=true;
}
function renderDartPad(match,r){
 $('dartsLive').hidden=r.finished;
 $('dartsWinner').hidden=!r.finished;
 if(r.finished){
  const w=r.winnerId;
  $('dartsWinner').innerHTML=`<div class="game-win-icon">🏆</div><h3>${esc(playerName(w))}</h3><p>${esc(modeName(match.mode))} beendet · ${match.turns.length} Aufnahmen erfasst</p><button id="dartsReplay" class="primary-btn">Neue Partie mit diesen Spielern</button>`;
  return;
 }
 const player=playerName(r.currentPlayerId);
 const ps=r.players[r.currentPlayerId];
 let notice='Pro Aufnahme bis zu drei Darts tippen und bestätigen.';
 if(match.mode==='around')notice=`Ziel: ${ps.progress>20?'Bull':ps.progress} · jede passende Zahl zählt einen Schritt`;
 if(match.mode==='shanghai')notice=`Rundenziel: ${Math.min(ps.visits+1,match.options.rounds)} · Single + Double + Triple = Shanghai`;
 if(match.mode==='halfit')notice=`Rundenziel: ${E.HALFIT[Math.min(ps.visits,6)]===25?'Bull':E.HALFIT[Math.min(ps.visits,6)]} · ohne Treffer wird halbiert`;
 if(match.mode==='bobs27')notice=`Ziel: Double ${Math.min(ps.visits+1,21)===21?'Bull':Math.min(ps.visits+1,21)} · Start 27`;
 if(E.isCricket(match.mode))notice='Schließe Zahlen mit drei Marks; Double zählt zwei, Triple drei.';
 if(match.mode==='finish170')notice=`Rest: ${ps.remaining} · ${Math.max(0,9-ps.darts)} Darts verbleiben`;
 $('dartsTurnTitle').textContent=`${player} ist am Zug`;
 $('dartsTurnInfo').textContent=notice;
 $('dartsTurnPreview').innerHTML=staged.length?staged.map((d,i)=>`<span class="staged-dart">${i+1}. ${esc(E.dartLabel(d))}</span>`).join(''):'<span class="game-muted">Noch kein Dart ausgewählt.</span>';
 $('dartsDraftScore').textContent=staged.length?`${staged.reduce((a,d)=>a+E.dartValue(d),0)} Punkte`:'0 Punkte';
 $('dartsRingButtons').querySelectorAll('[data-ring]').forEach(b=>b.classList.toggle('active',Number(b.dataset.ring)===ring));
 $('dartsConfirmTurn').disabled=!staged.length;
 $('dartsRemoveStaged').disabled=!staged.length;
 $('dartsTargetButtons').innerHTML=Array.from({length:20},(_,i)=>20-i).map(n=>`<button class="dart-target" data-number="${n}">${n}</button>`).join('')+`<button class="dart-target bull" data-number="25">Bull</button><button class="dart-target miss" data-number="0">Miss</button>`;
}
function renderGameHistory(match,r){
 $('dartsTurnHistory').innerHTML=r.history.length?r.history.slice(-12).reverse().map(h=>`<div class="game-history-row"><strong>${esc(playerName(h.playerId))}</strong><span>${esc(h.darts.join(' · '))}</span><b>${h.bust?'BUST':h.win?'FINISH':E.isX01(match.mode)?`${h.score} Punkte`:E.isCricket(match.mode)?`+${h.score}`:`${h.score} Punkte`}</b></div>`).join(''):'<p class="game-muted">Noch keine Darts erfasst.</p>';
 $('dartsMatchStats').innerHTML=match.playerIds.map(id=>{
  const x=E.playerReport(match,id);
  const lines=E.isX01(match.mode)?[
   ['3-Dart-Ø',fmt(x.average3)],['First-9-Ø',fmt(x.first9)],['100+',String(x.scores100)],['140+',String(x.scores140)],['180',String(x.scores180)],['Checkout',x.checkoutAttempts?`${x.checkoutRate}%`:'–'],['Highest Finish',String(x.highFinish)],['Buste',String(x.busts)]
  ]:E.isCricket(match.mode)?[['MPR',fmt(x.mpr)],['Marks',String(r.players[id].cricketMarks)],['Punkte',String(x.score)],['Darts',String(x.darts)]]:
   [['Runden',String(x.visits)],['Darts',String(x.darts)],['Punkte',String(x.score)]];
  return `<div class="match-stat-player"><h4>${esc(playerName(id))}</h4><div class="match-stat-grid">${lines.map(([name,value])=>`<div><small>${esc(name)}</small><strong>${esc(value)}</strong></div>`).join('')}</div></div>`;
 }).join('');
}
function renderCurrent(){
 const game=currentGame();
 $('dartsCurrent').hidden=!game;
 $('dartsNoGame').hidden=!!game;
 if(!game)return;
 const r=E.replay(game),finished=r.finished;
 $('dartsCurrentTitle').textContent=modeName(game.mode);
 $('dartsCurrentMeta').textContent=`${gameDate(game)} · ${game.turns.length} Aufnahmen${game.mode==='x01'?' · '+game.options.bestOfLegs+' Legs (Best of)':''}`;
 $('dartsMatchStatus').textContent=finished?'Beendet':'Laufend';
 $('dartsUndoTurn').disabled=!game.turns.length;
 $('dartsDeleteGame').hidden=false;
 renderScores(game,r);renderDartPad(game,r);renderGameHistory(game,r);
}
function renderStats(){
 const games=allGames();
 $('dartsMatchList').innerHTML=games.length?games.slice().reverse().slice(0,15).map(g=>{
  const r=E.replay(g);
  return `<button class="game-history-match ${getState().activeDartMatchId===g.id?'selected':''}" data-open-game="${esc(g.id)}"><span class="game-match-main"><b>${esc(modeName(g.mode))}</b><small>${esc(g.playerIds.map(playerName).join(' · '))}</small></span><span><b>${r.finished?esc(playerName(r.winnerId)):'Läuft'}</b><small>${gameDate(g)}</small></span></button>`;
 }).join(''):'<p class="game-muted">Hier erscheinen deine gespeicherten Spiele.</p>';
 const periodSelect=$('dartsStatsPeriod');
 const availableMonths=[...new Set(games.map(g=>g.createdAt.slice(0,7)).filter(s=>/^\d{4}-\d{2}$/.test(s)))];
 const currentMonth=new Date().toISOString().slice(0,7);
 if(!availableMonths.includes(currentMonth))availableMonths.push(currentMonth);
 availableMonths.sort().reverse();
 const availableYears=[...new Set(availableMonths.map(m=>m.slice(0,4)))].sort().reverse();
 const choices=['all',...availableYears,...availableMonths];
 if(!choices.includes(statsPeriod))statsPeriod='all';
 periodSelect.innerHTML=`<option value="all">Gesamter Zeitraum</option>`+availableYears.map(y=>`<option value="${y}">Jahr ${y}</option>`).join('')+availableMonths.map(m=>{const d=new Date(m+'-15T12:00:00');const label=d.toLocaleDateString('de-DE',{month:'long',year:'numeric'});return `<option value="${m}">${esc(label)}</option>`;}).join('');
 periodSelect.value=statsPeriod;
 const mode=statsMode,period=statsPeriod;
 const filtered=games.filter(g=>(mode==='all'||g.mode===mode)&&(period==='all'||g.createdAt.startsWith(period)));
 const totals={};
 for(const g of filtered){
  const r=E.replay(g);for(const id of g.playerIds){
   const x=E.playerReport(g,id),v=totals[id]||(totals[id]={games:0,wins:0,legs:0,darts:0,x01Darts:0,points:0,first9:0,first9Darts:0,scores100:0,scores140:0,scores180:0,checkoutAttempts:0,checkoutHits:0,cricketMarks:0,cricketDarts:0});
   v.games++;if(x.winner&&x.finished)v.wins++;v.legs+=x.legs;v.darts+=x.darts;
   v.points+=x.totalPoints;v.scores100+=x.scores100;v.scores140+=x.scores140;v.scores180+=x.scores180;
   v.checkoutAttempts+=x.checkoutAttempts;v.checkoutHits+=x.checkoutHits;
   if(E.isX01(g.mode)){v.x01Darts+=x.darts;v.first9+=r.players[id].first9Score;v.first9Darts+=r.players[id].first9Darts;}
   if(E.isCricket(g.mode)){v.cricketMarks+=r.players[id].cricketMarks;v.cricketDarts+=x.darts;}
  }
 }
 $('dartsAllStats').innerHTML=Object.entries(totals).length?Object.entries(totals).sort((a,b)=>b[1].wins-a[1].wins).map(([id,s])=>{
  const avg=s.x01Darts?fmt(s.points/s.x01Darts*3):'–';
  const mpr=s.cricketDarts?fmt(s.cricketMarks/s.cricketDarts*3):'–';
  return `<article class="game-total-stat"><h4>${esc(playerName(id))}</h4><div class="game-stat-chips"><span>${s.games} Spiele</span><span>${s.wins} Siege</span><span>${s.legs} Legs</span><span>Ø ${avg}</span><span>180er ${s.scores180}</span><span>140+ ${s.scores140}</span><span>Checkout ${s.checkoutAttempts?fmt(s.checkoutHits/s.checkoutAttempts*100)+'%':'–'}</span><span>Cricket MPR ${mpr}</span></div></article>`;
 }).join(''):'<p class="game-muted">Für diese Auswahl sind noch keine Spiele gespeichert.</p>';
}
function render(){if(!api||!$('view-games'))return;renderSetup();renderCurrent();renderStats();}
function togglePlayer(id){
 if(selectedPlayers.includes(id))selectedPlayers=selectedPlayers.filter(x=>x!==id);
 else if(selectedPlayers.length>=6){toast('Maximal sechs Spieler pro Partie.');return;}
 else selectedPlayers.push(id);
 refresh();
}
function newGame(){
 const mode=$('dartsMode').value;
 if(!selectedPlayers.length){toast('Bitte mindestens einen Spieler auswählen.');return;}
 if(mode==='finish170'&&selectedPlayers.length!==1){toast('170-Checkout-Training ist für einen Spieler ausgelegt.');return;}
 if(mode==='cricket-cut'&&selectedPlayers.length<2){toast('Cut-Throat braucht mindestens zwei Spieler.');return;}
 const opts={start:Number($('dartsStart').value),doubleOut:$('dartsDoubleOut').checked,bestOfLegs:Number($('dartsBestOf').value),rounds:Number($('dartsRoundLimit').value),aroundBull:$('dartsAroundBull').checked};
 const current=currentGame();if(current&&!E.replay(current).finished && !confirm('Aktuelle Partie verlassen und eine neue starten? Die alte Partie bleibt gespeichert.'))return;
 try{
  const m=E.createMatch({mode,playerIds:selectedPlayers,options:opts});
  getState().dartMatches.push(m);getState().activeDartMatchId=m.id;staged=[];gameMenuOpen=false;
  api.persist();render();toast(`${modeName(mode)} gestartet.`);
  $('dartsCurrent').scrollIntoView({block:'start',behavior:'smooth'});
 }catch(err){toast(err.message);}
}
function recordTurn(){
 const game=currentGame();if(!game||!staged.length)return;
 try{
  const updated=E.nextTurn(game,staged);
  const index=getState().dartMatches.findIndex(g=>g.id===game.id);
  getState().dartMatches[index]=updated;staged=[];api.persist();render();
  const r=E.replay(updated); if(r.finished)toast(`${playerName(r.winnerId)} gewinnt die Partie!`);
 }catch(err){toast(err.message);}
}
function undoTurn(){const game=currentGame();if(!game?.turns.length)return;if(!confirm('Letzte Aufnahme wirklich zurücknehmen?'))return;
 const updated=E.undoTurn(game);const index=getState().dartMatches.findIndex(g=>g.id===game.id);getState().dartMatches[index]=updated;staged=[];api.persist();render();toast('Letzte Aufnahme entfernt.');}
function deleteGame(){const game=currentGame();if(!game)return;
 if(!confirm('Diese Partie mit allen dazugehörigen Würfen dauerhaft löschen? Deine Jürgen-Kasse bleibt unverändert.'))return;
 getState().dartMatches=getState().dartMatches.filter(g=>g.id!==game.id);
 getState().activeDartMatchId=getState().dartMatches.at(-1)?.id||null;
 staged=[];api.persist();render();toast('Partie gelöscht.');}
function selectMode(id){$('dartsMode').value=id;renderSetup();}
function loadGame(id){if(!gameById(id))return;getState().activeDartMatchId=id;staged=[];gameMenuOpen=false;api.persist();render();$('dartsCurrent').scrollIntoView({block:'start',behavior:'smooth'});}
function init(obj){api=obj;
 const view=$('view-games');
 view.addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b)return;
  if(b.dataset.mode){selectMode(b.dataset.mode);return;}
  if(b.dataset.gamePlayer){togglePlayer(b.dataset.gamePlayer);return;}
  if(b.dataset.ring){ring=Number(b.dataset.ring);renderDartPadIf();return;}
  if(b.dataset.number!==undefined){
   if(staged.length>=3){toast('Maximal drei Darts pro Aufnahme.');return;}
   const n=Number(b.dataset.number),m=n===0?0:n===25?Math.min(ring,2):ring;
   staged.push({n,m});renderDartPadIf();return;
  }
  if(b.dataset.openGame){loadGame(b.dataset.openGame);return;}
  if(b.id==='dartsStartGame'){newGame();return;}
  if(b.id==='dartsConfirmTurn'){recordTurn();return;}
  if(b.id==='dartsRemoveStaged'){staged.pop();renderDartPadIf();return;}
  if(b.id==='dartsUndoTurn'){undoTurn();return;}
  if(b.id==='dartsDeleteGame'){deleteGame();return;}
  if(b.id==='dartsNewGame'){gameMenuOpen=!gameMenuOpen;renderSetup();return;}
  if(b.id==='dartsReplay'){const g=currentGame();if(!g)return;selectedPlayers=[...g.playerIds];$('dartsMode').value=g.mode;gameMenuOpen=true;renderSetup();$('dartsSetup').scrollIntoView({block:'start',behavior:'smooth'});return;}
 });
 $('dartsMode').addEventListener('change',renderSetup);
 $('dartsStatsMode').addEventListener('change',e=>{statsMode=e.target.value;renderStats();});
 $('dartsStatsPeriod').addEventListener('change',e=>{statsPeriod=e.target.value;renderStats();});
 render();
}
function renderDartPadIf(){const g=currentGame();if(g)renderDartPad(g,E.replay(g));}
window.DartsGameUI={init,render};
})();
