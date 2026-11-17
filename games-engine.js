/* JÜRGEN DARTKASSE · original offline Dart Spiel-Engine v3.1.0 */
(function(root,factory){
  const value=factory();
  if(typeof module==='object'&&module.exports)module.exports=value;
  if(root)root.DartsGameEngine=value;
})(typeof globalThis!=='undefined'?globalThis:null,function(){
'use strict';
const GAME_MODES=[
 {id:'x01',name:'X01 / 301 · 501 · 701',group:'Klassiker',detail:'Double-Out, Legs, Checkout und 3-Dart-Average'},
 {id:'cricket',name:'Cricket',group:'Klassiker',detail:'15–20 & Bull: schließen und punkten'},
 {id:'cricket-no',name:'No-Score Cricket',group:'Klassiker',detail:'Zahlen schließen ohne Punktwertung'},
 {id:'cricket-cut',name:'Cut-Throat Cricket',group:'Klassiker',detail:'Zusatzpunkte gehen an offene Gegner'},
 {id:'cricket-tactics',name:'Tactics Cricket',group:'Klassiker',detail:'10–20 & Bull – erweiterte Zahlen'},
 {id:'countup',name:'Count-Up',group:'Training',detail:'In festgelegten Runden möglichst viele Punkte'},
 {id:'around',name:'Around the Clock',group:'Training',detail:'1–20 der Reihe nach treffen'},
 {id:'shanghai',name:'Shanghai',group:'Party',detail:'Pro Runde eine Zahl, Shanghai gewinnt sofort'},
 {id:'halfit',name:'Half-It',group:'Training',detail:'Triff dein Ziel – sonst halbiert sich der Score'},
 {id:'bobs27',name:"Bob’s 27",group:'Training',detail:'Double-Training von D1 bis D-Bull'},
 {id:'finish170',name:'170 Checkout',group:'Training',detail:'170 Punkte mit neun Darts und Double-Out'},
];
const TARGETS_CRICKET=[20,19,18,17,16,15,25];
const TARGETS_TACTICS=[20,19,18,17,16,15,14,13,12,11,10,25];
const HALFIT=[20,19,18,17,16,15,25];
const MAX_MATCH_TURNS=10000;
const BOT_ID='__dartbot__';
const isX01=mode=>mode==='x01'||mode==='finish170';
const isCricket=mode=>['cricket','cricket-no','cricket-cut','cricket-tactics'].includes(mode);
const isPractice=mode=>['countup','around','shanghai','halfit','bobs27','finish170'].includes(mode);
const targetList=mode=>mode==='cricket-tactics'?TARGETS_TACTICS:TARGETS_CRICKET;
const dartValue=d=>d.n===25?(d.m===2?50:25):d.n*d.m;
const dartLabel=d=>d.n===0?(d.aim==='double'?'Doppel daneben':'Miss'):d.n===25?(d.m===2?'DBull':'Bull'):`${['','S','D','T'][d.m]}${d.n}`;
const isDouble=d=>d.m===2;
const normalDart=d=>d&&Number.isInteger(d.n)&&[0,25,...Array.from({length:20},(_,i)=>i+1)].includes(d.n)&&Number.isInteger(d.m)&&(
  d.n===0?d.m===0:d.n===25?[1,2].includes(d.m):[1,2,3].includes(d.m));
const validId=v=>typeof v==='string'&&v.length>0&&v.length<=120;
const inRange=(v,a,b)=>Number.isInteger(v)&&v>=a&&v<=b;
const unique=a=>new Set(a).size===a.length;
const numeric=(v,d=0)=>Number.isFinite(v)?v:d;
function matchOptions(mode,raw={}){
 const r=raw||{};
 const options={start:mode==='finish170'?170:inRange(r.start,210,1501)?r.start:501,
  doubleOut:mode==='finish170'?true:(r.masterOut===true?false:r.doubleOut!==false),
  masterOut:mode==='x01'&&r.masterOut===true,
  doubleIn:mode==='x01'&&r.doubleIn===true,
  starterIndex:mode==='x01'&&inRange(r.starterIndex,0,5)?r.starterIndex:0,
  botLevel:mode==='x01'&&['easy','medium','hard'].includes(r.botLevel)?r.botLevel:'medium',
  bestOfLegs:mode==='x01'&&[1,3,5,7,9].includes(r.bestOfLegs)?r.bestOfLegs:1,
  bestOfSets:mode==='x01'&&[1,3,5].includes(r.bestOfSets)?r.bestOfSets:1,
  rounds:inRange(r.rounds,1,100)?r.rounds:mode==='shanghai'?7:mode==='countup'?10:20,
  aroundBull:r.aroundBull===true};
 if(mode==='x01' && [170,210,301,401,501,601,701,801,901,1001,1501].includes(r.start))options.start=r.start;
 return options;
}
function createMatch(input){
 if(!GAME_MODES.some(x=>x.id===input?.mode))throw Error('Unbekannter Spielmodus.');
 if(!Array.isArray(input.playerIds)||input.playerIds.length<1||input.playerIds.length>6||!input.playerIds.every(validId)||!unique(input.playerIds)||input.playerIds.filter(x=>x===BOT_ID).length>1||(input.playerIds.includes(BOT_ID)&&input.mode!=='x01'))throw Error('Bitte 1 bis 6 unterschiedliche Spieler auswählen.');
 return {id:validId(input.id)?input.id:`game-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  mode:input.mode,options:matchOptions(input.mode,input.options),playerIds:[...input.playerIds],
  createdAt:typeof input.createdAt==='string'?input.createdAt:new Date().toISOString(),
  turns:[],finishedAt:null};
}
function sanitizeMatch(raw,existingPlayerIds){
 if(!raw||!validId(raw.id)||!GAME_MODES.some(x=>x.id===raw.mode)||!Array.isArray(raw.playerIds)||raw.playerIds.length<1||raw.playerIds.length>6||!unique(raw.playerIds)||!raw.playerIds.every(x=>validId(x)&&(existingPlayerIds.has(x)||(x===BOT_ID&&raw.mode==='x01'))))throw Error('Ungültige gespeicherte Dart-Partie.');
 if(!Array.isArray(raw.turns)||raw.turns.length>MAX_MATCH_TURNS)throw Error('Zu viele Dart-Würfe.');
 const turns=raw.turns.map(t=>{
  if(!t||!validId(t.playerId)||!raw.playerIds.includes(t.playerId)||!Array.isArray(t.darts)||t.darts.length<1||t.darts.length>3||!t.darts.every(normalDart))throw Error('Ungültiger Dart-Eintrag.');
  return {playerId:t.playerId,darts:t.darts.map(d=>({n:d.n,m:d.m,...(d.n===0&&d.aim==='double'?{aim:'double'}:{})})),at:typeof t.at==='string'&&t.at.length<=50?t.at:'',...(validId(t.juergenGroupId)?{juergenGroupId:t.juergenGroupId}:{}),...(validId(t.lanRequestId)?{lanRequestId:t.lanRequestId}:{})};
 });
 const m=createMatch({id:raw.id,mode:raw.mode,playerIds:raw.playerIds,options:raw.options,createdAt:raw.createdAt});m.turns=turns;m.finishedAt=typeof raw.finishedAt==='string'&&raw.finishedAt.length<=50?raw.finishedAt:null;
 // Reject impossible turn ownership or turns after completion.
 const playback=replay(m,{strict:true}); if(playback.invalid)throw Error('Dart-Partie enthält unplausible Spielzüge.');
 return m;
}
function makePlayer(id,m){return {id,remaining:isX01(m.mode)?m.options.start:0,score:m.mode==='halfit'?40:m.mode==='bobs27'?27:0,
 marks:Object.fromEntries(targetList(m.mode).map(t=>[t,0])),progress:1,visits:0,opened:!m.options.doubleIn,
 darts:0,pointsThrown:0,first9Score:0,first9Darts:0,first9LegDarts:0,
 highFinish:0,doublesAttempted:0,doublesHit:0,legs:0,sets:0,totalLegs:0,rounds:0,
 scores100:0,scores140:0,scores180:0,busts:0,eliminated:false,finished:false,
 cricketMarks:0,checkoutAttempts:0,checkoutHits:0,positiveVisits:0};}
function replay(match,{strict=false}={}){
 const p=Object.fromEntries(match.playerIds.map(id=>[id,makePlayer(id,match)]));
 const history=[],legHistory=[],setHistory=[]; let idx=Number.isInteger(match.options.starterIndex)?Math.min(match.playerIds.length-1,match.options.starterIndex):0,winnerId=null,leg=1,set=1,finished=false,invalid=false;
 const mode=match.mode,opt=match.options;
 const targetNums=targetList(mode);
 let current=match.playerIds[idx];
 let aroundWinners=[];
 function nextPlayer(){
  for(let i=0;i<match.playerIds.length;i++){
   idx=(idx+1)%match.playerIds.length;
   const pp=p[match.playerIds[idx]];
   if(mode==='bobs27'&&pp.eliminated)continue;
   if((mode==='around'||mode==='bobs27')&&pp.finished)continue;
   current=match.playerIds[idx];return;
  }
  current=match.playerIds[idx];
 }
 function startNextLeg(){
  for(const id of match.playerIds){p[id].remaining=opt.start;p[id].first9LegDarts=0;p[id].opened=!opt.doubleIn;}
  idx=((opt.starterIndex||0)+leg)%match.playerIds.length;
  current=match.playerIds[idx]; leg++;
 }
 function concludeTimedMode(){
  if(!match.playerIds.every(id=>p[id].visits>=opt.rounds))return;
  winnerId=match.playerIds.slice().sort((a,b)=>p[b].score-p[a].score)[0];
  finished=true;
 }
 for(let ti=0;ti<match.turns.length;ti++){
  const t=match.turns[ti];
  if(finished||t.playerId!==current){invalid=true;if(strict)break; else continue;}
  const throwerId=current;const turnLeg=leg,turnSet=set;const s=p[current];let sum=0,bust=false,checkout=false,win=false;
  const before={remaining:s.remaining,score:s.score,marks:{...s.marks},progress:s.progress};
  const target=mode==='shanghai'?Math.min(s.visits+1,opt.rounds):mode==='halfit'?HALFIT[Math.min(s.visits,6)]:mode==='bobs27'?Math.min(s.visits+1,21):s.progress;
  const playedDarts=[];
  let hitTarget=0;
  let first9VisitScore=0;
  let marksInVisit=0;
  const hitMultipliers=new Set();
  for(const d of t.darts){
   playedDarts.push(dartLabel(d));
   const val=dartValue(d);
   if(isX01(mode)){
    // Double-In: only a double (including inner bull) starts the player's scoring.
    const canScore=s.opened||!opt.doubleIn||isDouble(d);
    if(!s.opened&&canScore)s.opened=true;
    if(canScore){
     const left=s.remaining-val;
     const finishValid=(!opt.doubleOut||isDouble(d))&&(!opt.masterOut||isDouble(d)||d.m===3);
     // Do not finish without the required double/master; 1 is a bust under both rules.
     if(left<0||((opt.doubleOut||opt.masterOut)&&(left===1||(left===0&&!finishValid))))bust=true;
     if(opt.doubleOut && (d.n===0&&d.aim==='double'||s.remaining<=50&&isDouble(d))){s.doublesAttempted++;s.checkoutAttempts++;}
     if(!bust){s.remaining=left;sum+=val;if(s.remaining===0){checkout=true;win=true;s.checkoutHits++;s.doublesHit+=(isDouble(d)?1:0);s.highFinish=Math.max(s.highFinish,before.remaining);}}
    }
   }else if(isCricket(mode)){
    if(targetNums.includes(d.n)){
     const openCount=Math.max(0,3-s.marks[d.n]);
     const counted=Math.min(openCount,d.m);
     const extras=d.m-counted;
     s.marks[d.n]+=counted;
     marksInVisit+=d.m;
     if(extras && mode!=='cricket-no'){
      const opponents=match.playerIds.filter(id=>id!==current && p[id].marks[d.n]<3);
      if(opponents.length){
       if(mode==='cricket-cut')for(const id of opponents)p[id].score+=extras*(d.n===25?25:d.n);
       else s.score+=extras*(d.n===25?25:d.n);
      }
     }
    }
    sum+=val;
   }else if(mode==='countup'){sum+=val;s.score+=val;}
   else if(mode==='around'){
    const req=s.progress;
    if((req<=20&&d.n===req) || (req===21&&d.n===25)) {s.progress++;hitTarget++;}
   }else if(mode==='shanghai'){
    if(d.n===target){sum+=val;s.score+=val;hitMultipliers.add(d.m);}
   }else if(mode==='halfit'){
    if(d.n===target){sum+=val;hitTarget++;}
   }else if(mode==='bobs27'){
    if(d.n===target && d.m===2)hitTarget++;
   }
   s.darts++; if(s.first9LegDarts<9 && isX01(mode)){s.first9LegDarts++;s.first9Darts++;if(s.opened)first9VisitScore+=val;}
   if(bust||win)break;
  }
  if(isX01(mode)){
   if(bust){s.remaining=before.remaining;s.busts++;sum=0;}
   if(!bust){s.pointsThrown+=sum;}
   // The first-nine average uses scored points, so a bust scores zero for its visit.
   if(!bust)s.first9Score+=first9VisitScore;
   if(win){
    s.legs++; s.totalLegs++;
    legHistory.push({winnerId:current,leg,set,at:t.at,finish:before.remaining});
    if(mode==='finish170'){winnerId=current;finished=true;}
    else if(s.legs>=Math.ceil(opt.bestOfLegs/2)){
     s.sets++;setHistory.push({winnerId:current,set,at:t.at});
     if(s.sets>=Math.ceil(opt.bestOfSets/2)){winnerId=current;finished=true;}
     else {
      for(const id of match.playerIds)p[id].legs=0;
      set++;
      startNextLeg();
     }
    } else startNextLeg();
   }
  }else if(isCricket(mode)){
   s.cricketMarks+=marksInVisit;
   const closed=targetNums.every(n=>s.marks[n]>=3);
   const ahead=match.playerIds.every(id=>id===current||(
     mode==='cricket-no'||mode==='cricket-cut'? (mode==='cricket-cut'?s.score<=p[id].score:true):s.score>=p[id].score));
   if(closed&&ahead){winnerId=current;finished=true;win=true;}
  }else if(mode==='around'){
   if(s.progress>(opt.aroundBull?21:20)){s.finished=true;winnerId=current;finished=true;win=true;}
   s.score=Math.max(0,s.progress-1);
  }else if(mode==='shanghai'){
   if(hitMultipliers.size===3){winnerId=current;finished=true;win=true;}
  }else if(mode==='halfit'){
   s.score=hitTarget>0?s.score+sum:Math.floor(s.score/2);
  }else if(mode==='bobs27'){
   s.score+=hitTarget>0?hitTarget*2*target:-2*target;
   if(s.score<0)s.eliminated=true;
   if(s.visits===20)s.finished=true;
  }
  s.visits++;s.rounds++;if(sum>0)s.positiveVisits++;
  if(sum===180)s.scores180++; if(sum>=140)s.scores140++;if(sum>=100)s.scores100++;
  history.push({id:ti+1,playerId:throwerId,at:t.at,round:turnLeg,set:turnSet,score:sum,target,darts:playedDarts,bust,win,remaining:win?0:s.remaining,points:s.score});
  if(finished)break;
  if(mode==='countup'||mode==='shanghai') concludeTimedMode();
  if(mode==='halfit'&&match.playerIds.every(id=>p[id].visits>=HALFIT.length)){
   winnerId=match.playerIds.slice().sort((a,b)=>p[b].score-p[a].score)[0];finished=true;
  }
  if(mode==='bobs27'&&match.playerIds.every(id=>p[id].eliminated||p[id].finished)){
   winnerId=match.playerIds.slice().sort((a,b)=>p[b].score-p[a].score)[0];finished=true;
  }
  if(mode==='finish170'&&s.visits>=3&&s.remaining>0){
   // Training ends at nine darts, not an unbounded X01 match.
   if(match.playerIds.every(id=>p[id].visits>=3)){
    winnerId=match.playerIds.slice().sort((a,b)=>p[a].remaining-p[b].remaining)[0];finished=true;
   }
  }
  if(!finished && !(isX01(mode)&&win))nextPlayer();
 }
 const currentPlayerId=finished?null:current;
 return {players:p,currentPlayerId,winnerId,finished,history,legHistory,setHistory,leg,set,invalid,turnCount:match.turns.length,mode};
}
function nextTurn(match,darts){
 if(!Array.isArray(darts)||darts.length<1||darts.length>3||!darts.every(normalDart))throw Error('Bitte 1 bis 3 gültige Darts erfassen.');
 const r=replay(match,{strict:true});if(r.invalid)throw Error('Partie enthält widersprüchliche Würfe.');if(r.finished)throw Error('Partie ist bereits beendet.');
 const turn={playerId:r.currentPlayerId,darts:darts.map(d=>({n:d.n,m:d.m,...(d.n===0&&d.aim==='double'?{aim:'double'}:{})})),at:new Date().toISOString()};
 const updated={...match,turns:[...match.turns,turn]};
 const check=replay(updated,{strict:true});if(check.invalid)throw Error('Ungültiger Spielzug.');
 updated.finishedAt=check.finished?turn.at:null;
 return updated;
}
function undoTurn(match){const result={...match,turns:match.turns.slice(0,-1),finishedAt:null};const check=replay(result);result.finishedAt=check.finished?match.finishedAt:null;return result;}
function playerReport(match,id){
 const r=replay(match),s=r.players[id];if(!s)return null;
 const avg=isX01(match.mode)&&s.darts?s.pointsThrown/s.darts*3:0;
 const first9=s.first9Darts?s.first9Score/s.first9Darts*3:0;
 const mpr=isCricket(match.mode)&&s.darts?s.cricketMarks/s.darts*3:0;
 return {id,mode:match.mode,visits:s.visits,darts:s.darts,totalPoints:s.pointsThrown,average3:Number(avg.toFixed(2)),first9:Number(first9.toFixed(2)),mpr:Number(mpr.toFixed(2)),
  checkoutRate:s.checkoutAttempts?Number((s.checkoutHits/s.checkoutAttempts*100).toFixed(1)):0,checkoutAttempts:s.checkoutAttempts,checkoutHits:s.checkoutHits,
  scores100:s.scores100,scores140:s.scores140,scores180:s.scores180,busts:s.busts,legs:s.legs,score:s.score,
  highFinish:s.highFinish,sets:s.sets,totalLegs:s.totalLegs,winner:r.winnerId===id,finished:r.finished};
}
function juergenType(darts){
 if(!Array.isArray(darts)||darts.length!==3||!darts.every(normalDart))return null;
 const targets=darts.map(d=>d.n).sort((a,b)=>a-b);
 if(targets.join(',')!=='1,5,20')return null;
 if(darts.every(d=>d.m===3))return 'perfect';
 if(darts.every(d=>d.m===1||d.m===2))return 'juergen';
 return null;
}
// Deterministic double-out checkout recommendation. Search for 1-3 legal darts.
// Prioritize common tops/16/12/8 doubles and T20/T19 scoring; no speculative routes.
const CHECKOUT_DOUBLES=[20,16,12,8,18,10,4,14,6,2,1,5,7,9,11,13,15,17,19,3,25].map(n=>({n,m:2}));
const CHECKOUT_SETUP=[20,19,18,17,16,15,14,13,12,11,10,9,8,7,6,5,4,3,2,1].map(n=>({n,m:3}))
 .concat([{n:25,m:2}],CHECKOUT_DOUBLES,[{n:25,m:1}],Array.from({length:20},(_,i)=>({n:20-i,m:1})));
// Familiar optional routes are used only when the complete route fits in the available darts.
// They are suggestions, not claims that a checkout is guaranteed.
const PREFERRED_DOUBLE_CHECKOUTS={
  25:[{n:9,m:1},{n:8,m:2}],
  41:[{n:1,m:1},{n:20,m:2}],
  61:[{n:15,m:3},{n:8,m:2}],
  81:[{n:19,m:3},{n:12,m:2}],
  91:[{n:17,m:3},{n:20,m:2}],
  99:[{n:19,m:3},{n:10,m:1},{n:16,m:2}],
  100:[{n:20,m:3},{n:20,m:2}],
  121:[{n:20,m:3},{n:11,m:3},{n:14,m:2}],
  132:[{n:20,m:3},{n:16,m:3},{n:12,m:2}],
  161:[{n:20,m:3},{n:17,m:3},{n:25,m:2}],
  164:[{n:20,m:3},{n:18,m:3},{n:25,m:2}],
  167:[{n:20,m:3},{n:19,m:3},{n:25,m:2}],
  170:[{n:20,m:3},{n:20,m:3},{n:25,m:2}]
};
function checkoutRoute(remaining,available=3,doubleOut=true,masterOut=false){
 if(!Number.isInteger(remaining)||remaining<1||available<1)return null;
 const maxDarts=Math.min(3,available);
 if(remaining>(doubleOut?170:180))return null;
 if(doubleOut){const preferred=PREFERRED_DOUBLE_CHECKOUTS[remaining];
  if(preferred && preferred.length<=maxDarts && preferred.reduce((a,d)=>a+dartValue(d),0)===remaining)return preferred.map(d=>({...d}));
 }
 const finish=doubleOut?CHECKOUT_DOUBLES:masterOut?CHECKOUT_DOUBLES.concat(Array.from({length:20},(_,i)=>({n:20-i,m:3}))):CHECKOUT_SETUP;
 const routeSearch=(target,count)=>{
  if(count===1){const last=finish.find(d=>dartValue(d)===target);return last?[last]:null;}
  for(const d of CHECKOUT_SETUP){
   const val=dartValue(d);
   if(val>=target)continue;
   const tail=routeSearch(target-val,count-1);
   if(tail)return [d,...tail];
  }
  return null;
 };
 for(let count=1;count<=maxDarts;count++){
  const route=routeSearch(remaining,count);
  if(route&&(!doubleOut||route.at(-1).m===2))return route;
 }
 return null;
}

return {BOT_ID,checkoutRoute,juergenType,GAME_MODES,TARGETS_CRICKET,TARGETS_TACTICS,HALFIT,createMatch,sanitizeMatch,replay,nextTurn,undoTurn,playerReport,matchOptions,isX01,isCricket,isPractice,dartValue,dartLabel,normalDart,targetList};
});
