/* Darts-Club 3.6.0 · Vereinsmodus: reine Berechnungen, keine Netzwerkanfragen oder Kassenbuchungen. */
(function(root,factory){const engine=factory();if(typeof module==='object'&&module.exports)module.exports=engine;if(root)root.DartsClubEngine=engine;})(typeof globalThis!=='undefined'?globalThis:null,function(){
'use strict';
const idOK=v=>typeof v==='string'&&v.length>0&&v.length<=120;
const labelOK=(v,max=65)=>typeof v==='string'&&v.trim().length>0&&v.length<=max;
const uniq=arr=>new Set(arr).size===arr.length;
const stamp=()=>new Date().toISOString();
const genId=p=>`${p}-${Date.now()}-${Math.random().toString(36).slice(2,10)}`;
const validDart=d=>d&&Number.isInteger(d.n)&&Number.isInteger(d.m)&&(d.n===0?d.m===0:d.n===25?[1,2].includes(d.m):d.n>=1&&d.n<=20&&[1,2,3].includes(d.m));
const point=d=>d.n===25?(d.m===2?50:25):d.n*d.m;
const textDart=d=>d.n===0?'Miss':d.n===25?(d.m===2?'DBull':'Bull'):`${['','S','D','T'][d.m]}${d.n}`;
function options(raw={}){return {start:[301,501,701].includes(raw.start)?raw.start:501,outRule:['double','master','straight'].includes(raw.outRule)?raw.outRule:'double',bestOfLegs:[1,3,5,7].includes(raw.bestOfLegs)?raw.bestOfLegs:3};}
function createDuel({name='Teamduell',playerIds,options:raw={},tournamentId=null}={}){
 if(!Array.isArray(playerIds)||playerIds.length!==4||!playerIds.every(idOK)||!uniq(playerIds))throw Error('Für 2 gegen 2 vier unterschiedliche Spieler wählen.');
 return {id:genId('duel'),name:labelOK(name)?name.trim():'Teamduell',playerIds:[...playerIds],options:options(raw),tournamentId:idOK(tournamentId)?tournamentId:null,createdAt:stamp(),turns:[]};
}
function orderForLeg(ids,leg){const groups=leg%2===1?[[0,2,1,3],[1,3,0,2]]:[[2,0,3,1],[3,1,2,0]];return groups[Math.floor((leg-1)/2)%2].map(i=>ids[i]);}
function replayDuel(duel,{strict=true}={}){
 const ids=duel.playerIds,o=duel.options,remaining=[o.start,o.start],legs=[0,0],history=[],legHistory=[];
 let leg=1,order=orderForLeg(ids,leg),turnIndex=0,finished=false,winnerTeam=null,invalid=false;
 for(const turn of duel.turns){
  const expected=order[turnIndex];if(finished||!turn||turn.playerId!==expected||!Array.isArray(turn.darts)||turn.darts.length<1||turn.darts.length>3||!turn.darts.every(validDart)){invalid=true;if(strict)throw Error('Teamduell enthält einen ungültigen Wurf oder eine falsche Reihenfolge.');break;}
  const team=ids.indexOf(turn.playerId)<2?0:1,prev=remaining[team];let left=prev,bust=false,win=false,points=0,used=0;
  for(const dart of turn.darts){
   used++;const next=left-point(dart),outOK=o.outRule==='straight'||(o.outRule==='double'?dart.m===2:dart.m===2||dart.m===3);
   if(next<0||(o.outRule!=='straight'&&next===1)||(next===0&&!outOK)){bust=true;break;}
   left=next;points+=point(dart);if(next===0){win=true;break;}
  }
  if(used!==turn.darts.length){invalid=true;if(strict)throw Error('Wurf enthält Treffer nach Bust oder Checkout.');break;}
  if(!bust)remaining[team]=left;else points=0;
  history.push({playerId:turn.playerId,team:team===0?'teamA':'teamB',leg,score:points,remaining:bust?prev:left,darts:turn.darts.map(textDart),bust,win});
  if(win){legs[team]++;legHistory.push({leg,team:team===0?'teamA':'teamB',playerId:turn.playerId,darts:history.filter(h=>h.leg===leg).reduce((a,h)=>a+h.darts.length,0)});
   if(legs[team]>=Math.ceil(o.bestOfLegs/2)){finished=true;winnerTeam=team===0?'teamA':'teamB';}
   else {leg++;remaining[0]=o.start;remaining[1]=o.start;order=orderForLeg(ids,leg);turnIndex=0;}
  }else turnIndex=(turnIndex+1)%order.length;
 }
 return {remaining,legs,leg,finished,winnerTeam,invalid,history,legHistory,currentPlayerId:finished?null:order[turnIndex],nextTeam:finished?null:(ids.indexOf(order[turnIndex])<2?'teamA':'teamB'),totalDarts:history.reduce((a,h)=>a+h.darts.length,0)};
}
function nextDuelTurn(duel,darts){const r=replayDuel(duel);if(r.finished)throw Error('Das Teamduell ist bereits beendet.');if(!Array.isArray(darts)||!darts.length||darts.length>3||!darts.every(validDart))throw Error('Bitte 1 bis 3 gültige Darts erfassen.');const updated={...duel,turns:[...duel.turns,{playerId:r.currentPlayerId,darts:darts.map(d=>({n:d.n,m:d.m})),at:stamp()}]};replayDuel(updated);return updated;}
function validateDuel(raw,players,tournamentIds=new Set()){
 if(!raw||!idOK(raw.id)||!Array.isArray(raw.playerIds)||raw.playerIds.length!==4||!raw.playerIds.every(id=>idOK(id)&&players.has(id))||!uniq(raw.playerIds)||!labelOK(raw.name)||!raw.options||!Array.isArray(raw.turns)||raw.turns.length>5000)throw Error('Ungültiges gespeichertes Teamduell.');
 if(raw.tournamentId!==undefined&&raw.tournamentId!==null&&(!idOK(raw.tournamentId)||!tournamentIds.has(raw.tournamentId)))throw Error('Teamduell verweist auf ein unbekanntes Turnier.');
 if(![301,501,701].includes(raw.options.start)||!['double','master','straight'].includes(raw.options.outRule)||![1,3,5,7].includes(raw.options.bestOfLegs))throw Error('Ungültige Team-Spielregeln.');
 const parsed={id:raw.id,name:raw.name.trim(),playerIds:[...raw.playerIds],options:options(raw.options),tournamentId:raw.tournamentId||null,createdAt:typeof raw.createdAt==='string'&&raw.createdAt.length<50?raw.createdAt:stamp(),turns:raw.turns.map(t=>{
  if(!t||!raw.playerIds.includes(t.playerId)||!Array.isArray(t.darts)||t.darts.length<1||t.darts.length>3||!t.darts.every(validDart))throw Error('Ungültige Teamaufnahme.');
  return {playerId:t.playerId,darts:t.darts.map(d=>({n:d.n,m:d.m})),at:typeof t.at==='string'&&t.at.length<50?t.at:''};
 })};
 replayDuel(parsed);return parsed;
}
function createSeason(name){if(!labelOK(name))throw Error('Saisonname eingeben (maximal 65 Zeichen).');return {id:genId('season'),name:name.trim(),createdAt:stamp(),tournamentIds:[],dates:{},archived:false};}
function validateSeason(raw,tournaments){
 if(!raw||!idOK(raw.id)||!labelOK(raw.name)||!Array.isArray(raw.tournamentIds)||raw.tournamentIds.length>200||!uniq(raw.tournamentIds)||!raw.tournamentIds.every(x=>tournaments.has(x)))throw Error('Ungültige Vereinssaison.');
 const dates={};if(raw.dates!==undefined&&(!raw.dates||typeof raw.dates!=='object'||Array.isArray(raw.dates)))throw Error('Ungültiger Saisonkalender.');
 for(const [k,v] of Object.entries(raw.dates||{})){if(!raw.tournamentIds.includes(k)||typeof v!=='string'||!/^(20\d\d|2100)-(0[1-9]|1[0-2])-([0-2]\d|3[01])$/.test(v)||!Number.isFinite(Date.parse(`${v}T12:00:00Z`))||new Date(`${v}T12:00:00Z`).toISOString().slice(0,10)!==v)throw Error('Ungültiger Termin in der Vereinssaison.');dates[k]=v;}
 return {id:raw.id,name:raw.name.trim(),createdAt:typeof raw.createdAt==='string'&&raw.createdAt.length<50?raw.createdAt:stamp(),tournamentIds:[...raw.tournamentIds],dates,archived:raw.archived===true};
}
const DRILLS=['checkout121','checkoutRandom','double','scoring'];
function createPlan(playerId,mode,weeklyGoal){if(!idOK(playerId)||!DRILLS.includes(mode)||!Number.isInteger(weeklyGoal)||weeklyGoal<1||weeklyGoal>14)throw Error('Ungültiges Trainingsziel.');return {id:genId('plan'),playerId,mode,weeklyGoal,createdAt:stamp(),active:true};}
function validatePlan(raw,players){if(!raw||!idOK(raw.id)||!players.has(raw.playerId)||!DRILLS.includes(raw.mode)||!Number.isInteger(raw.weeklyGoal)||raw.weeklyGoal<1||raw.weeklyGoal>14)throw Error('Ungültiger Trainingsplan.');return {id:raw.id,playerId:raw.playerId,mode:raw.mode,weeklyGoal:raw.weeklyGoal,createdAt:typeof raw.createdAt==='string'&&raw.createdAt.length<50?raw.createdAt:stamp(),active:raw.active!==false};}
function planProgress(plan,training,reference=new Date()){const today=new Date(reference),weekday=(today.getDay()+6)%7,start=new Date(today.getFullYear(),today.getMonth(),today.getDate()-weekday,0,0,0,0).getTime(),created=Date.parse(plan.createdAt)||0,from=Math.max(start,created);
 const current=(training||[]).filter(x=>x.playerId===plan.playerId&&x.mode===plan.mode&&Number.isFinite(Date.parse(x.at))&&Date.parse(x.at)>=from&&Date.parse(x.at)<=today.getTime());return {done:current.length,goal:plan.weeklyGoal,percent:Math.min(100,Math.round(current.length/plan.weeklyGoal*100)),remaining:Math.max(0,plan.weeklyGoal-current.length),success:current.filter(x=>x.success).length};}
return {validDart,point,textDart,createDuel,replayDuel,nextDuelTurn,validateDuel,createSeason,validateSeason,createPlan,validatePlan,planProgress,orderForLeg};
});
