/* DARTS CLUB 3.5 · pure, read-only X01 trend stats */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.DartsTrend=api;})(typeof globalThis!=='undefined'?globalThis:null,function(){
 'use strict';
 function trend(matches,engine,playerId,{limit=12,days=0,now=Date.now()}={}){
  const earliest=days>0?now-days*86400000:0;
  return (matches||[]).filter(m=>m?.mode==='x01'&&m.playerIds?.includes(playerId)&&(Date.parse(m.createdAt)||0)>=earliest)
  .sort((a,b)=>(Date.parse(a.createdAt)||0)-(Date.parse(b.createdAt)||0)||String(a.id).localeCompare(String(b.id)))
  .flatMap(m=>{try{const p=engine.playerReport(m,playerId),r=engine.replay(m);if(!(p.darts>0))return [];return [{id:m.id,at:m.createdAt,darts:p.darts,average:p.average3,first9:p.first9||0,finished:r.finished,winner:r.winnerId===playerId,finish:p.highFinish||0,oneEighties:p.scores180||0,checkoutHits:p.checkoutHits||0,checkoutAttempts:p.checkoutAttempts||0}];}catch{return [];}}).slice(-Math.min(100,Math.max(1,limit)));
 }
 function summary(records){const valid=(records||[]).filter(x=>x.darts>=9),all=records||[];
  const totalDarts=all.reduce((v,x)=>v+x.darts,0);
  const weighted=totalDarts?all.reduce((v,x)=>v+x.average*x.darts,0)/totalDarts:0;
  const attempts=all.reduce((v,x)=>v+x.checkoutAttempts,0),hits=all.reduce((v,x)=>v+x.checkoutHits,0);
  const best=valid.length?Math.max(...valid.map(x=>x.average)):null;
  return {games:all.length,darts:totalDarts,average:totalDarts?Math.round(weighted*100)/100:null,bestGameAverage:best,checkoutPct:attempts?Math.round(hits/attempts*1000)/10:null,attempts,hits,winCount:all.filter(x=>x.finished&&x.winner).length,oneEighties:all.reduce((v,x)=>v+x.oneEighties,0),highFinish:all.length?Math.max(...all.map(x=>x.finish)):0};
 }
 return {trend,summary};
});
