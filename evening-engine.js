/* Darts-Club 3.7.0 — offline Dartabend planner: creates no cash or thrown scores. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.DartsEveningEngine=api;})(typeof globalThis!=='undefined'?globalThis:null,function(){'use strict';
const idOk=id=>typeof id==='string'&&id.length>0&&id.length<=120;
const isoOk=v=>typeof v==='string'&&v.length<=50&&!Number.isNaN(Date.parse(v));
const dateOk=v=>{if(typeof v!=='string'||!/^20\d\d-\d\d-\d\d$/.test(v))return false;const d=new Date(`${v}T12:00:00Z`);return !Number.isNaN(+d)&&d.toISOString().slice(0,10)===v;};
const uid=prefix=>prefix+'-'+Date.now()+'-'+Math.random().toString(36).slice(2,12);
function rounds(ids){
 if(!Array.isArray(ids)||ids.length<2||ids.length>12||new Set(ids).size!==ids.length||!ids.every(idOk))throw Error('Ein Dartabend benötigt 2 bis 12 unterschiedliche Spieler.');
 const ring=ids.length%2?[...ids,null]:ids.slice(),n=ring.length,result=[];
 for(let r=0;r<n-1;r++){for(let i=0;i<n/2;i++){const a=ring[i],b=ring[n-1-i];if(a&&b)result.push({round:r+1,a,b,matchId:null});}
 ring.splice(1,0,ring.pop());}
 return result;
}
function create({name,date,playerIds,note=''}){
 if(typeof name!=='string'||!name.trim()||name.trim().length>65)throw Error('Bitte einen Namen mit maximal 65 Zeichen eingeben.');
 if(!dateOk(date))throw Error('Bitte ein gültiges Datum wählen.');
 if(typeof note!=='string'||note.length>300)throw Error('Notiz darf höchstens 300 Zeichen enthalten.');
 const fixtures=rounds(playerIds);
 return {id:uid('evening'),name:name.trim(),date,playerIds:[...playerIds],note:note.trim(),createdAt:new Date().toISOString(),archived:false,fixtures};
}
function validate(raw,knownPlayers){
 if(!raw||!idOk(raw.id)||typeof raw.name!=='string'||!raw.name.trim()||raw.name.length>65||!dateOk(raw.date)||typeof raw.note!=='string'||raw.note.length>300||!isoOk(raw.createdAt))throw Error('Ungültige Dartabend-Daten.');
 if(!Array.isArray(raw.playerIds)||!raw.playerIds.every(id=>knownPlayers.has(id)))throw Error('Dartabend enthält unbekannte Spieler.');
 const expected=rounds(raw.playerIds);
 if(!Array.isArray(raw.fixtures)||raw.fixtures.length!==expected.length)throw Error('Ungültiger Dartabend-Spielplan.');
 const fixtures=expected.map((f,i)=>{const x=raw.fixtures[i];if(!x||x.round!==f.round||x.a!==f.a||x.b!==f.b||(x.matchId!=null&&!idOk(x.matchId)))throw Error('Ungültige Dartabend-Paarung.');return {...f,matchId:x.matchId||null};});
 const linked=fixtures.filter(f=>f.matchId).map(f=>f.matchId);if(new Set(linked).size!==linked.length)throw Error('Doppelte Dartabend-Spielzuordnung.');
 return {id:raw.id,name:raw.name.trim(),date:raw.date,playerIds:[...raw.playerIds],note:raw.note.trim(),createdAt:raw.createdAt,archived:raw.archived===true,fixtures};
}
function report(evening,matches,engine){
 const found=new Map((matches||[]).map(m=>[m.id,m]));let finished=0,playing=0,missing=0;const rows=evening.fixtures.map(f=>{
  const match=f.matchId?found.get(f.matchId):null;let status='geplant',winnerId=null,legs='';
  if(f.matchId&&!match){status='fehlt';missing++;}
  if(match){let r=null;try{r=engine.replay(match);}catch{}if(r?.finished){status='beendet';finished++;winnerId=r.winnerId;legs=(r.players[f.a]?.legs||0)+':'+(r.players[f.b]?.legs||0);}else{status='läuft';playing++;}}
  return {...f,status,winnerId,legs};
 });
 return {rows,total:rows.length,finished,playing,missing,percent:rows.length?Math.round(finished/rows.length*100):0};
}
function chargesForDay(evening,state){
 // Cash is never calculated from a planned match. Display only existing, non-voided hit events for this date, across all sessions on that date.
 const sessions=new Set((state.sessions||[]).filter(s=>s.date===evening.date).map(s=>s.id));
 const hits=(state.events||[]).filter(e=>e.type==='hit'&&!e.voided&&sessions.has(e.sessionId));
 return {entries:hits.length,groups:new Set(hits.map(x=>x.groupId||x.id)).size,amountCents:hits.reduce((s,e)=>s+e.amount,0)};
}
return {rounds,create,validate,report,chargesForDay,dateOk};
});
