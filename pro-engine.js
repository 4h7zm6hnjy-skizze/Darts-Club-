/* JÜRGEN DARTKASSE · offline tournament, bot and statistics engine v3.1.0 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.DartsProEngine=api;})(typeof globalThis!=='undefined'?globalThis:null,function(){
'use strict';
const BOT_ID='__dartbot__';
const TYPES=['league','knockout','groups','teams'];
const DRILLS=['checkout121','checkoutRandom','double','scoring'];
const idOK=v=>typeof v==='string'&&v.length>0&&v.length<=120;
const num=(n,a,b)=>Number.isInteger(n)&&n>=a&&n<=b;
const unique=a=>new Set(a).size===a.length;
const asMatchMap=matches=>new Map((matches||[]).map(m=>[m.id,m]));
const safeLabel=v=>String(v||'').slice(0,65);
function makeTournament({name,type,playerIds,options={}}){
 if(!TYPES.includes(type))throw Error('Unbekannter Turniertyp.');
 if(!Array.isArray(playerIds)||!playerIds.every(idOK)||!unique(playerIds))throw Error('Ungültige Spielerauswahl.');
 const min=type==='teams'||type==='groups'?4:2;
 if(playerIds.length<min||playerIds.length>16|| (type==='teams'&&playerIds.length!==4))throw Error(type==='teams'?'Teamduell benötigt genau vier Spieler.':`Bitte ${min} bis 16 Spieler wählen.`);
 return {id:'t-'+Date.now()+'-'+Math.random().toString(36).slice(2,9),name:safeLabel(name).trim()||'Dart-Turnier',type,playerIds:[...playerIds],createdAt:new Date().toISOString(),options:{start:[301,501,701].includes(options.start)?options.start:501,bestOfLegs:[1,3,5,7].includes(options.bestOfLegs)?options.bestOfLegs:3,outRule:['double','master','straight'].includes(options.outRule)?options.outRule:'double'},results:{}};
}
function validateTournament(value,playerIds){
 if(!value||!idOK(value.id)||!TYPES.includes(value.type)||!Array.isArray(value.playerIds)||!unique(value.playerIds)||value.playerIds.some(id=>!playerIds.has(id))||value.playerIds.length<2||value.playerIds.length>16)throw Error('Ungültiges Turnier.');
 if(['groups','teams'].includes(value.type)&&value.playerIds.length<4)throw Error('Ungültiges Gruppen-/Teamturnier.');
 if(value.type==='teams'&&value.playerIds.length!==4)throw Error('Teamduell muss vier Spieler enthalten.');
 const base={...makeTournament({name:value.name,type:value.type,playerIds:value.playerIds,options:value.options}),id:value.id,createdAt:typeof value.createdAt==='string'&&value.createdAt.length<=50?value.createdAt:new Date().toISOString()};
 const results={};if(value.results!==undefined && (typeof value.results!=='object'||!value.results||Array.isArray(value.results)))throw Error('Ungültige Turnierergebnisse.');
 const possibleIds=new Set(generateBaseFixtures(base).map(f=>f.id));
 for(const [k,res] of Object.entries(value.results||{})){
  if(!possibleIds.has(k)||!res||typeof res!=='object')throw Error('Ungültiger Turniereintrag.');
  const matchId=idOK(res.matchId)?res.matchId:null;
  const manualWinnerId=value.playerIds.includes(res.manualWinnerId)|| (value.type==='teams'&&['teamA','teamB'].includes(res.manualWinnerId))?res.manualWinnerId:null;
  const teamDuelId=value.type==='teams'&&idOK(res.teamDuelId)?res.teamDuelId:null;
  if(matchId||manualWinnerId)results[k]={...(matchId?{matchId}:{}),...(manualWinnerId?{manualWinnerId}:{}),...(teamDuelId&&manualWinnerId?{teamDuelId}:{})};
 }
 base.results=results;
 return base;
}
function pairFixtures(ids,prefix,group=''){
 const f=[];for(let i=0;i<ids.length;i++)for(let j=i+1;j<ids.length;j++)f.push({id:`${prefix}-${i}-${j}`,stage:group||'Liga',group,a:ids[i],b:ids[j]});return f;
}
function groupIds(t){return {A:t.playerIds.filter((_,i)=>i%2===0),B:t.playerIds.filter((_,i)=>i%2===1)};}
function generateBaseFixtures(t){
 if(t.type==='league')return pairFixtures(t.playerIds,'liga');
 if(t.type==='teams')return [{id:'team-0',stage:'Teamduell',group:'',teamA:t.playerIds.slice(0,2),teamB:t.playerIds.slice(2,4),a:t.playerIds[0],b:t.playerIds[2]}];
 if(t.type==='groups'){
  const g=groupIds(t);return [...pairFixtures(g.A,'grp-A','Gruppe A'),...pairFixtures(g.B,'grp-B','Gruppe B'),
    {id:'semi-0',stage:'Halbfinale',aSeed:['A',1],bSeed:['B',2]},
    {id:'semi-1',stage:'Halbfinale',aSeed:['B',1],bSeed:['A',2]},
    {id:'final',stage:'Finale',aRef:'semi-0',bRef:'semi-1'}];
 }
 const len=2**Math.ceil(Math.log2(t.playerIds.length));
 const round0=[];for(let i=0;i<len/2;i++)round0.push({id:`ko-0-${i}`,stage:'Runde 1',round:0,a:t.playerIds[i]||null,b:t.playerIds[len-1-i]||null});
 const all=[...round0];let prev=round0,round=1;
 while(prev.length>1){const next=[];for(let i=0;i<prev.length;i+=2)next.push({id:`ko-${round}-${i/2}`,round,stage:prev.length===2?'Finale':prev.length===4?'Halbfinale':`Runde ${round+1}`,aRef:prev[i].id,bRef:prev[i+1].id});all.push(...next);prev=next;round++;}
 return all;
}
function resultFor(f,t,matchMap){
 const r=t.results?.[f.id];if(!r)return null;
 if(r.matchId){const m=matchMap.get(r.matchId);if(m && m.playerIds.includes(f.a) && m.playerIds.includes(f.b)){
   try{const replay=globalDarts()?.replay(m);if(replay?.finished && [f.a,f.b].includes(replay.winnerId))return {winnerId:replay.winnerId,source:'game',matchId:m.id,match:m};
   }catch{}
 }}
 if(r.manualWinnerId && (r.manualWinnerId===f.a||r.manualWinnerId===f.b|| (t.type==='teams'&&['teamA','teamB'].includes(r.manualWinnerId))))return {winnerId:r.manualWinnerId,source:r.teamDuelId?'team':'manual',matchId:null};
 return null;
}
// Optional use of game engine from browsers or tests.
let gameEngine=null;
function setGameEngine(engine){gameEngine=engine;}
function globalDarts(){return gameEngine||(typeof globalThis!=='undefined'?globalThis.DartsGameEngine:null);}
function groupStandings(ids,fixtures,group){
 const rows=ids.map((id,index)=>({id,wins:0,losses:0,played:0,points:0,legDiff:0,index}));
 const byId=new Map(rows.map(row=>[row.id,row]));
 for(const f of fixtures.filter(x=>x.group===group && x.winnerId && x.a && x.b)){
  const a=byId.get(f.a),b=byId.get(f.b);if(!a||!b)continue;
  a.played++;b.played++;const w=byId.get(f.winnerId),l=byId.get(f.winnerId===f.a?f.b:f.a);
  if(w&&l){w.wins++;w.points+=2;l.losses++;}
  if(f.match){try{const e=globalDarts()?.replay(f.match),diff=(e.players[f.a].totalLegs||0)-(e.players[f.b].totalLegs||0);a.legDiff+=diff;b.legDiff-=diff;}catch{}}
 }
 return rows.sort((a,b)=>b.points-a.points||b.legDiff-a.legDiff||a.index-b.index);
}
function resolveFixtures(t,matches=[]){
 const map=asMatchMap(matches),raw=generateBaseFixtures(t),completed=new Map();const g=groupIds(t);
 const groupBase=t.type==='groups'?raw.filter(f=>f.group):[];
 for(const f of groupBase){const res=resultFor(f,t,map);completed.set(f.id,{...f,winnerId:res?.winnerId||null,match:res?.match||null,source:res?.source||null,matchId:map.has(t.results?.[f.id]?.matchId)?t.results[f.id].matchId:null});}
 const groupDone=t.type==='groups'&&groupBase.every(f=>completed.get(f.id)?.winnerId);
 const standingA=groupDone?groupStandings(g.A,[...completed.values()],'Gruppe A'):[],standingB=groupDone?groupStandings(g.B,[...completed.values()],'Gruppe B'):[];
 function seed(spec){if(!spec||!groupDone)return null;const rows=spec[0]==='A'?standingA:standingB;return rows[spec[1]-1]?.id||null;}
 const resolved=[];
 for(const f of raw){
  if(completed.has(f.id)){resolved.push(completed.get(f.id));continue;}
  const a=f.aRef?completed.get(f.aRef)?.winnerId||null:f.aSeed?seed(f.aSeed):f.a||null;
  const b=f.bRef?completed.get(f.bRef)?.winnerId||null:f.bSeed?seed(f.bSeed):f.b||null;
  const isFirstRoundBye=t.type==='knockout'&&f.round===0&&!b&&!!a;
  let res=a&&b?resultFor({...f,a,b},t,map):null;
  const winnerId=isFirstRoundBye?a:res?.winnerId||null;
  const resolvedFixture={...f,a,b,winnerId,source:isFirstRoundBye?'bye':res?.source||null,matchId:map.has(t.results?.[f.id]?.matchId)?t.results[f.id].matchId:null,match:res?.match||null,ready:!!a&&!!b};
  completed.set(f.id,resolvedFixture);resolved.push(resolvedFixture);
 }
 return {fixtures:resolved,groupStandings:groupDone?{A:standingA,B:standingB}:null,finished:resolved.length>0 && !!resolved.at(-1)?.winnerId && (t.type!=='league'||resolved.every(f=>f.winnerId)),championId:t.type==='league'?null:resolved.at(-1)?.winnerId||null};
}
function leagueStandings(t,matches){return groupStandings(t.playerIds,resolveFixtures(t,matches).fixtures,'');}
function tournamentProgress(t,matches=[]){
 const resolved=resolveFixtures(t,matches),fixtures=resolved.fixtures;
 const done=fixtures.filter(f=>!!f.winnerId).length;
 const playing=fixtures.filter(f=>!!f.matchId&&!f.winnerId).length;
 const next=fixtures.find(f=>f.ready&&!f.winnerId&&!f.matchId)||null;
 const active=fixtures.find(f=>f.matchId&&!f.winnerId)||null;
 const upcoming=fixtures.filter(f=>f.ready&&!f.winnerId&&!f.matchId).slice(0,4);
 return {done,total:fixtures.length,playing,percent:fixtures.length?Math.round(done/fixtures.length*100):0,next,active,upcoming,finished:resolved.finished,championId:resolved.championId};
}
function botDarts(engine,remaining,{level='medium',doubleOut=true,masterOut=false,doubleIn=false,opened=true}={}){
 if(!num(remaining,0,1501))throw Error('Ungültiger Bot-Reststand.');
 const accuracy=level==='easy'?0.23:level==='hard'?0.76:0.47;
 const darts=[];let left=remaining;let started=opened;
 for(let i=0;i<3 && left>0;i++){
  let goal;
  if(doubleIn&&!started){goal={n:20,m:2};}
  else if(left<=170 && (doubleOut||masterOut)){
   const route=engine.checkoutRoute(left,3-i,doubleOut,masterOut);
   goal=route?.[0]||{n:20,m:3};
  }else if(left<=60&&!doubleOut&&!masterOut){goal={n:Math.min(20,left),m:1};}
  else goal={n:20,m:3};
  if(Math.random()>accuracy){const n=1+Math.floor(Math.random()*20);goal=Math.random()<0.20?{n:0,m:0}:{n,m:1};}
  darts.push(goal);if(doubleIn&&!started){if(goal.m===2&&goal.n!==0)started=true;else continue;}
  const val=engine.dartValue(goal);const next=left-val;
  const validFinish=!doubleOut||goal.m===2;const validMaster=!masterOut||goal.m===2||goal.m===3;
  if(next<0||(next===1&&(doubleOut||masterOut))||(next===0&&(!validFinish||!validMaster)))break;
  left=next;
 }
 return darts;
}
function validatePractice(record,players){
 if(!record||!idOK(record.id)||!players.has(record.playerId)||!DRILLS.includes(record.mode)||!num(record.target,1,170)||!num(record.darts,1,60)||!num(record.points,0,2000)||typeof record.success!=='boolean')throw Error('Ungültiger Trainingseintrag.');
 return {id:record.id,playerId:record.playerId,mode:record.mode,target:record.target,darts:record.darts,points:record.points,success:record.success,at:typeof record.at==='string'&&record.at.length<50?record.at:new Date().toISOString()};
}
function trainingSummary(records,id){const r=(records||[]).filter(x=>x.playerId===id);const success=r.filter(x=>x.success).length;return {attempts:r.length,success,successPct:r.length?Number((success/r.length*100).toFixed(1)):null,points:r.reduce((a,x)=>a+x.points,0),darts:r.reduce((a,x)=>a+x.darts,0)};}
function playerAnalytics(games,id){
 const engine=globalDarts();if(!engine)return {bestLeg:null,worstLeg:null,segments:[],headToHead:[]};
 const legs=[],segmentCounts=new Map(),opponents=new Map();
 for(const match of games||[]){if(!match.playerIds.includes(id))continue;
  let r;try{r=engine.replay(match)}catch{continue;}
  if(match.mode==='x01'){
   for(const leg of r.legHistory||[]){if(leg.winnerId!==id)continue;
    const darts=r.history.filter(x=>x.playerId===id&&x.set===leg.set&&x.round===leg.leg).reduce((a,h)=>a+h.darts.length,0);
    if(darts>0)legs.push(darts);
   }
  }
  for(const turn of match.turns.filter(t=>t.playerId===id))for(const dart of turn.darts){const key=dart.n===0?'Miss':dart.n===25?'Bull':String(dart.n);segmentCounts.set(key,(segmentCounts.get(key)||0)+1);}
  if(r.finished){for(const opponentId of match.playerIds.filter(p=>p!==id&&p!==BOT_ID)){
   const v=opponents.get(opponentId)||{id:opponentId,played:0,wins:0,losses:0};v.played++;if(r.winnerId===id)v.wins++;if(r.winnerId===opponentId)v.losses++;opponents.set(opponentId,v);
  }}
 }
 return {bestLeg:legs.length?Math.min(...legs):null,worstLeg:legs.length?Math.max(...legs):null,legDarts:legs.length?Number((legs.reduce((a,b)=>a+b,0)/legs.length).toFixed(1)):null,
  segments:[...segmentCounts].sort((a,b)=>b[1]-a[1]).slice(0,12),headToHead:[...opponents.values()].sort((a,b)=>b.played-a.played)};
}
return {BOT_ID,TYPES,DRILLS,makeTournament,validateTournament,generateBaseFixtures,groupIds,groupStandings,resolveFixtures,leagueStandings,tournamentProgress,botDarts,setGameEngine,validatePractice,trainingSummary,playerAnalytics};
});
