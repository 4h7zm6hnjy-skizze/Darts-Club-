/* DARTS CLUB ELITE · pure offline analytics v3.2.0 */
(function(root,factory){const m=factory();if(typeof module==='object'&&module.exports)module.exports=m;if(root)root.DartsEliteEngine=m;})(typeof globalThis!=='undefined'?globalThis:null,function(){
'use strict';
const BOT='__dartbot__';
const finite=v=>typeof v==='number'&&Number.isFinite(v);
const safeDate=s=>{const n=Date.parse(s||'');return Number.isFinite(n)?n:0;};
const round=(v,n=1)=>Number(v.toFixed(n));
function matchesFor(players,matches,engine,now=Date.now(),windowDays=0){
 const ids=new Set((players||[]).map(p=>p.id)),from=windowDays>0?now-windowDays*86400000:0;
 return (matches||[]).filter(g=>g&&g.mode==='x01'&&Array.isArray(g.playerIds)&&g.playerIds.some(id=>ids.has(id))&&safeDate(g.createdAt)>=from).sort((a,b)=>safeDate(a.createdAt)-safeDate(b.createdAt)||String(a.id).localeCompare(String(b.id)));
}
function standings(players,matches,engine,now=Date.now(),windowDays=0){
 const allowed=(players||[]).filter(p=>p&&typeof p.id==='string'&&p.id!==BOT);
 const data=new Map(allowed.map(p=>[p.id,{id:p.id,name:p.name||'Spieler',rating:1000,rated:0,wins:0,losses:0,matches:0,darts:0,points:0,first9Darts:0,first9Points:0,tons:0,oneEighties:0,finishes:0,busts:0,checkoutHits:0,checkoutAttempts:0,form:[]}]));
 const list=matchesFor(allowed,matches,engine,now,windowDays);
 for(const match of list){
  let r;try{r=engine.replay(match);}catch{continue;}
  for(const id of match.playerIds){const x=data.get(id);if(!x||!r.players[id])continue;
   const s=r.players[id];x.matches++;x.darts+=s.darts||0;x.points+=s.pointsThrown||0;x.first9Darts+=s.first9Darts||0;x.first9Points+=s.first9Score||0;
   x.tons+=(s.scores100||0);x.oneEighties+=(s.scores180||0);x.finishes+=(s.legs||0);x.busts+=(s.busts||0);x.checkoutHits+=(s.checkoutHits||0);x.checkoutAttempts+=(s.checkoutAttempts||0);
  }
  const pair=match.playerIds.length===2&&match.playerIds.every(id=>data.has(id))&&r.finished&&data.has(r.winnerId);
  if(pair){
   const win=data.get(r.winnerId);const lose=data.get(match.playerIds.find(id=>id!==r.winnerId));
   const expected=1/(1+Math.pow(10,(lose.rating-win.rating)/400));const diff=24*(1-expected);
   win.rating+=diff;lose.rating-=diff;win.wins++;lose.losses++;win.rated++;lose.rated++;
   win.form.push('W');lose.form.push('L');if(win.form.length>5)win.form.shift();if(lose.form.length>5)lose.form.shift();
  }
 }
 return [...data.values()].map(x=>({...x,rating:Math.round(x.rating),average:x.darts?round(x.points/x.darts*3,2):null,first9:x.first9Darts?round(x.first9Points/x.first9Darts*3,2):null,checkoutPct:x.checkoutAttempts?round(x.checkoutHits/x.checkoutAttempts*100,1):null,winPct:x.rated?round(x.wins/x.rated*100,1):null})).sort((a,b)=>b.rating-a.rating||b.wins-a.wins||a.name.localeCompare(b.name,'de'));
}
function heatmap(matches,engine,playerId,now=Date.now(),windowDays=0){
 const from=windowDays>0?now-windowDays*86400000:0;
 const targets=new Map();for(let n=1;n<=20;n++)targets.set(String(n),{key:String(n),count:0,s:0,d:0,t:0,points:0});targets.set('25',{key:'Bull',count:0,s:0,d:0,t:0,points:0});targets.set('0',{key:'Daneben',count:0,s:0,d:0,t:0,points:0});
 for(const m of matches||[]){if(m?.mode!=='x01'||!m.playerIds?.includes(playerId)||safeDate(m.createdAt)<from)continue;
  for(const t of m.turns||[]){if(t.playerId!==playerId)continue;
   for(const d of t.darts||[]){const v=targets.get(String(d.n));if(!v)continue;v.count++;if(d.m===1)v.s++;if(d.m===2)v.d++;if(d.m===3)v.t++;v.points+=d.n===25?(d.m===2?50:25):d.n*d.m;}
  }
 }
 return [...targets.values()].sort((a,b)=>b.count-a.count||Number(b.key)-Number(a.key));
}
function headToHead(matches,engine,a,b){let aw=0,bw=0;
 for(const m of matches||[]){if(m.mode!=='x01'||m.playerIds?.length!==2||!m.playerIds.includes(a)||!m.playerIds.includes(b))continue;try{const r=engine.replay(m);if(!r.finished)continue;if(r.winnerId===a)aw++;if(r.winnerId===b)bw++;}catch{}}
 return {a:aw,b:bw,games:aw+bw};
}
function coach(stat,hits){
 if(!stat||stat.matches===0||stat.darts===0)return {ready:false,title:'Erst Partien erfassen',details:'Für persönliche Empfehlungen benötige ich gespeicherte X01-Aufnahmen. Starte eine Partie und erfasse deine Würfe.',mode:'scoring'};
 if(stat.darts<30)return {ready:false,title:'Weitere Würfe sammeln',details:`Bislang sind ${stat.darts} Darts erfasst. Für eine erste datenbasierte Empfehlung sollten es mindestens 30 sein.`,mode:'scoring'};
 // Predictable advice based on real observed visits, never an AI diagnosis.
 const miss=(hits||[]).find(x=>x.key==='Daneben')?.count||0;const missRate=miss/stat.darts;
 if(stat.checkoutAttempts>=6&&stat.checkoutPct<30)return {ready:true,title:'Checkout & Doppel trainieren',details:`${stat.checkoutHits} erfolgreiche Abschlüsse bei ${stat.checkoutAttempts} erfassten Checkout-Versuchen (${stat.checkoutPct} %). Regelmäßig Doppeltraining ergänzen.`,mode:'double'};
 if(missRate>=0.25)return {ready:true,title:'Zielgenauigkeit stabilisieren',details:`${miss} von ${stat.darts} protokollierten Darts gingen daneben (${round(missRate*100)} %). Empfehlung: Präzisionstraining und kontrollierter Stand.`,mode:'scoring'};
 if(stat.average!==null&&stat.average<45)return {ready:true,title:'Scoring-Konstanz aufbauen',details:`Dein 3-Dart-Average liegt bei ${stat.average}. Empfehlung: regelmäßig drei Darts auf die 20 und wiederholbare Aufnahmen trainieren.`,mode:'scoring'};
 return {ready:true,title:'Finishs gezielt verbessern',details:`Du hast ${stat.oneEighties} 180er und ${stat.tons} Aufnahmen ab 100 Punkten erzielt. Empfehlung: wechselnde Finish-Zahlen und Checkout-Routen üben.`,mode:'checkoutRandom'};
}
function matchTimeline(m,engine){if(!m)return null;const r=engine.replay(m);return {matchId:m.id,createdAt:m.createdAt,finished:r.finished,winnerId:r.winnerId,mode:m.mode,playerIds:m.playerIds,history:r.history.map((h,i)=>({index:i+1,playerId:h.playerId,score:h.score,remaining:h.remaining,points:h.points,bust:h.bust,win:h.win,darts:h.darts,leg:h.round,set:h.set})),reports:m.playerIds.map(id=>engine.playerReport(m,id))};}
return {standings,matchesFor,heatmap,headToHead,coach,matchTimeline};
});
