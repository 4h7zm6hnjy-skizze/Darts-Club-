/* DARTS CLUB ELITE · purely read-only local game insights v3.2.1 */
(function(){
'use strict';
const $=id=>document.getElementById(id), A=window.DartsEliteEngine, E=window.DartsGameEngine;
if(!A||!E)return;
let api=null,period=0,playerId='',matchId='',tv=false,checkValue=121,checkRule='double',checkDarts=3;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=v=>new Intl.NumberFormat('de-DE',{maximumFractionDigits:2}).format(v);
const date=v=>{const x=new Date(v||'');return Number.isFinite(+x)?x.toLocaleDateString('de-DE'):'–';};
const state=()=>api.getState();
const players=()=>state().players||[];
const matches=()=>state().dartMatches||[];
const name=id=>id==='__dartbot__'?'DartBot':players().find(p=>p.id===id)?.name||'Spieler';
const escapeCSV=value=>{let x=String(value??'');if(/^[=+\-@]/.test(x))x="'"+x;return /[;\r\n"]/.test(x)?'"'+x.replace(/"/g,'""')+'"':x;};
function csv(rows){return '\ufeff'+rows.map(row=>row.map(escapeCSV).join(';')).join('\r\n');}
function saveFile(filename,body,mime){const url=URL.createObjectURL(new Blob([body],{type:mime}));const a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(url);a.remove();},1200);}
function getRows(){return A.standings(players(),matches(),E,Date.now(),period);}
function ownRow(){return getRows().find(p=>p.id===playerId);}
function renderScore(){const root=$('eliteRankings');if(!root)return;
 const standings=getRows();root.innerHTML=standings.length?standings.map((r,i)=>`<button type="button" class="elite-rank-row ${r.id===playerId?'elite-rank-self':''}" data-elite-pick="${esc(r.id)}" aria-label="Spieler ${esc(r.name)} auswerten"><span class="elite-rank-number">${i+1}</span><span class="elite-rank-person"><b>${esc(r.name)}</b><small>${r.rated} gewertete Duelle · ${r.matches} X01-Partien</small></span><span class="elite-rank-rating"><b>${r.rating}</b><small>Club-Elo</small></span><span class="elite-rank-average"><b>${r.average===null?'–':num(r.average)}</b><small>3-Dart-Ø</small></span></button>`).join(''):'<p class="game-muted">Lege zuerst Spielerprofile an.</p>';
 $('eliteEloInfo').textContent='Experimentelle Club-Wertung: Start 1000 Punkte, K-Faktor 24. Nur beendete X01-Partien zwischen genau zwei echten Spielern. DartBot, Training und manuelle Turnierergebnisse zählen nicht. Bei Zeitfilterung wird für diesen Zeitraum ab 1000 neu gerechnet.';
}
function renderPlayer(){const sel=$('elitePlayerSelect');if(!sel)return;const before=playerId||sel.value;sel.innerHTML=players().filter(p=>!p.archived).map(p=>`<option value="${esc(p.id)}">${esc(p.name)}</option>`).join('');playerId=players().some(p=>p.id===before)?before:sel.value;sel.value=playerId;
 const r=ownRow(),content=$('elitePersonal');if(!r){content.innerHTML='<p class="game-muted">Noch kein aktives Spielerprofil.</p>';return;}
 const heat=A.heatmap(matches(),E,playerId,Date.now(),period),coach=A.coach(r,heat),total=heat.reduce((s,x)=>s+x.count,0),hot=heat.filter(x=>x.count>0).slice(0,10);
 const max=Math.max(1,...hot.map(x=>x.count));const other=getRows().filter(x=>x.id!==playerId&&x.rated>0).sort((a,b)=>A.headToHead(matches(),E,playerId,b.id).games-A.headToHead(matches(),E,playerId,a.id).games).slice(0,4);
 content.innerHTML=`<div class="elite-summary-grid"><article><small>3-Dart-Average</small><strong>${r.average===null?'–':num(r.average)}</strong></article><article><small>First 9</small><strong>${r.first9===null?'–':num(r.first9)}</strong></article><article><small>100+ Aufnahmen</small><strong>${r.tons}</strong></article><article><small>180er</small><strong>${r.oneEighties}</strong></article><article><small>Siege / Duelle</small><strong>${r.wins} / ${r.rated}</strong></article><article><small>Form (letzte 5)</small><strong>${r.form.length?esc(r.form.join(' · ')):'–'}</strong></article></div>
 <div class="elite-subsection"><h3>Dein DartCoach</h3><div class="elite-coach"><b>${esc(coach.title)}</b><p>${esc(coach.details)}</p><button type="button" class="primary-btn small" data-elite-training="${esc(coach.mode)}">Passendes Training öffnen</button></div></div>
 <div class="elite-subsection"><h3>Trefferverteilung</h3><p class="game-muted">Aus ${total} erfassten Darts in X01-Partien${period?' im Zeitraum':''}; Treffer werden nach tatsächlich eingegebenem Segment gezählt, nicht durch Bilderkennung geschätzt.</p>${hot.length?`<div class="elite-hit-bars">${hot.map(x=>`<div class="elite-hit-row"><span>${esc(x.key)}</span><div class="elite-hit-track"><div style="width:${Math.max(1,Math.round(x.count/max*100))}%"></div></div><b>${x.count}</b><small>${x.t}T · ${x.d}D · ${x.s}S</small></div>`).join('')}</div>`:'<p class="game-muted">Noch keine Darts erfasst.</p>'}</div>
 <div class="elite-subsection"><h3>Direkte Duelle</h3>${other.length?other.map(x=>{const duel=A.headToHead(matches(),E,playerId,x.id);return `<div class="elite-duel"><span>${esc(x.name)}</span><strong>${duel.a} : ${duel.b}</strong><small>Siege · Niederlagen (alle Zeiten)</small></div>`}).join(''):'<p class="game-muted">Noch keine gewerteten Duelle mit anderen Spielern.</p>'}</div>`;
}
function accessibleMatches(){return matches().slice().sort((a,b)=>(Date.parse(b.createdAt)||0)-(Date.parse(a.createdAt)||0));}
function renderMatches(){const list=$('eliteMatchSelect');if(!list)return;const all=accessibleMatches();if(!all.some(x=>x.id===matchId))matchId=all[0]?.id||'';list.innerHTML=all.slice(0,100).map(m=>`<option value="${esc(m.id)}">${esc(date(m.createdAt))} · ${esc(m.playerIds.map(name).join(' / '))} · ${esc(m.mode)}</option>`).join('');list.value=matchId;
 const area=$('eliteMatchSummary');const m=all.find(x=>x.id===matchId);if(!m){area.innerHTML='<p class="game-muted">Noch keine Dart-Partien gespeichert.</p>';$('eliteMatchCSV').disabled=true;$('eliteMatchPrint').disabled=true;return;}
 $('eliteMatchCSV').disabled=false;$('eliteMatchPrint').disabled=false;
 try{const t=A.matchTimeline(m,E);
  area.innerHTML=`<div class="elite-match-result"><div><small>${esc(date(t.createdAt))} · ${esc(t.mode.toUpperCase())}</small><h3>${esc(t.playerIds.map(name).join(' – '))}</h3><p>${t.finished?'Beendet · Sieger: '+esc(name(t.winnerId)):'Noch nicht beendet'}</p></div><span>${t.history.length} Aufnahmen</span></div><div class="elite-summary-grid">${t.reports.map(x=>`<article><small>${esc(name(x.id))}</small><strong>${num(x.average3)} Ø</strong><small>${x.darts} Darts · ${x.scores180}× 180 · ${x.highFinish} High Finish</small></article>`).join('')}</div><div class="elite-match-table-wrap"><table class="elite-match-table"><thead><tr><th>#</th><th>Spieler</th><th>Darts</th><th>Punkte</th><th>Rest / Stand</th></tr></thead><tbody>${t.history.slice(-120).map(h=>`<tr><td>${h.index}</td><td>${esc(name(h.playerId))}</td><td>${esc(h.darts.join(' · '))}</td><td>${h.bust?'BUST':h.score}</td><td>${Number.isFinite(h.remaining)?h.remaining:'–'}${h.win?' · FINISH':''}</td></tr>`).join('')}</tbody></table></div>${t.history.length>120?'<p class="game-muted">Es werden die letzten 120 Aufnahmen angezeigt. Der CSV-Export enthält alle.</p>':''}`;
 }catch(err){area.innerHTML='<p class="game-muted">Diese Partie konnte nicht ausgewertet werden.</p>';console.warn('Elite match render',err)}
}
function renderCheckout(){const v=$('eliteCheckoutNumber'),rule=$('eliteCheckoutRule'),numD=$('eliteCheckoutDarts');if(!v)return;v.value=checkValue;rule.value=checkRule;numD.value=String(checkDarts);
 const holder=$('eliteCheckoutResult');if(!Number.isInteger(checkValue)||checkValue<1||checkValue>170){holder.innerHTML='<p>Bitte 1 bis 170 Restpunkte wählen.</p>';return;}
 const d=E.checkoutRoute(checkValue,checkDarts,checkRule==='double',checkRule==='master');
 holder.innerHTML=d?`<div class="elite-checkout-result">${d.map(x=>`<span>${esc(E.dartLabel(x))}</span>`).join('<span class="elite-plus">+</span>')}</div><p>Eine mögliche Route für <b>${checkValue}</b> Restpunkte mit höchstens ${checkDarts} Darts. Keine Treffer-Garantie.</p>`:`<p>Für <b>${checkValue}</b> Restpunkte gibt es mit dieser Regel und ${checkDarts} ${checkDarts===1?'Dart':'Darts'} keine gefundene direkte Checkout-Route. Erst herunterspielen.</p>`;
}
function renderTV(){const root=$('eliteTvOverlay');if(!root)return;root.hidden=!tv;document.body.classList.toggle('elite-tv-open',tv);if(!tv)return;
 const m=matches().find(x=>x.id===state().activeDartMatchId);if(!m){$('eliteTvBoard').innerHTML='<div class="elite-tv-empty"><span aria-hidden="true" class="elite-tv-empty-icon">🎯</span><h3>Keine Partie aktiv</h3><p>Starte im Spielcenter eine Dart-Partie. Danach werden hier die Spielernamen, Punkte und der aktuelle Werfer gut lesbar angezeigt.</p><button type="button" id="eliteTvStart" class="elite-tv-start">Zum Spielcenter</button></div>';$('eliteTvStatus').textContent='Zuschaueransicht';return;}
 try{const r=E.replay(m);$('eliteTvStatus').textContent=r.finished?'Partie beendet':'Aktive Partie · '+m.mode.toUpperCase();
  $('eliteTvBoard').innerHTML=m.playerIds.map(id=>{const s=r.players[id];if(!s)return '';const active=r.currentPlayerId===id&&!r.finished;return `<div class="elite-tv-card ${active?'elite-tv-active':''}"><small>${active?'AM ZUG':r.winnerId===id?'SIEGER':'SPIELER'}</small><strong>${esc(name(id))}</strong><b>${E.isX01(m.mode)?s.remaining:s.score}</b><span>Ø ${s.darts?num(s.pointsThrown/s.darts*3):'–'} · Legs ${s.legs} · Sets ${s.sets}</span></div>`;}).join('');}
 catch{$('eliteTvBoard').textContent='Spielstand konnte nicht geladen werden.';}
}
function render(){if(!api||!$('view-elite'))return;if(!$('view-elite').classList.contains('active')){if(tv)renderTV();return;}const sel=$('elitePeriod');if(sel)sel.value=String(period);renderScore();renderPlayer();renderMatches();renderCheckout();renderTV();}
function exportMatch(){const m=matches().find(x=>x.id===matchId);if(!m)return;let t;try{t=A.matchTimeline(m,E);}catch{return;}
 const rows=[['Partie','Datum','Spielmodus','Aufnahme','Spieler','Darts','Punkte','Rest','Bust','Finish'],...t.history.map(x=>[m.id,date(m.createdAt),m.mode,x.index,name(x.playerId),x.darts.join(' '),x.score,x.remaining,x.bust?'Ja':'Nein',x.win?'Ja':'Nein'])];saveFile('Dart-Partie-'+date(m.createdAt).replaceAll('.','-')+'.csv',csv(rows),'text/csv;charset=utf-8');}
function printMatch(){const m=matches().find(x=>x.id===matchId);if(!m)return;let t;try{t=A.matchTimeline(m,E);}catch{return;}
 const lines=t.history.map(x=>`<tr><td>${x.index}</td><td>${esc(name(x.playerId))}</td><td>${esc(x.darts.join(' · '))}</td><td>${x.bust?'BUST':x.score}</td><td>${x.remaining}</td></tr>`).join('');const html=`<!doctype html><html lang="de"><head><meta charset="utf-8"><title>Darts-Partiebericht</title><style>body{font:14px system-ui,sans-serif;margin:24px;color:#111}h1{font-size:23px}table{border-collapse:collapse;width:100%}td,th{padding:7px;border-bottom:1px solid #ccc;text-align:left}tr{break-inside:avoid}</style></head><body><h1>Darts-Partiebericht</h1><p>${esc(date(m.createdAt))} · ${esc(m.mode)} · ${esc(m.playerIds.map(name).join(' gegen '))}</p><p>${t.finished?'Gewinner: '+esc(name(t.winnerId)):'Partie noch offen'}</p><table><thead><tr><th>#</th><th>Spieler</th><th>Darts</th><th>Wertung</th><th>Rest</th></tr></thead><tbody>${lines}</tbody></table></body></html>`;
 const w=window.open('','_blank');if(!w){api.toast('Druckfenster blockiert. Browser-Pop-ups erlauben.');return;}w.document.open();w.document.write(html);w.document.close();w.focus();setTimeout(()=>{try{w.print();}catch{}},250);
}
function init(x){api=x;const root=$('view-elite');if(!root)return;
 root.addEventListener('click',event=>{const btn=event.target.closest('button,[data-elite-pick]');if(!btn)return;
 if(btn.dataset.elitePick){playerId=btn.dataset.elitePick;renderPlayer();renderScore();return;}
 if(btn.dataset.eliteTraining){api.goView('pro');document.querySelector('[data-pro-tab="training"]')?.click();const select=$('proTrainMode');if(select)select.value=btn.dataset.eliteTraining;return;}
 if(btn.id==='eliteMatchCSV'){exportMatch();return;}if(btn.id==='eliteMatchPrint'){printMatch();return;}if(btn.id==='eliteTvOpen'){tv=true;renderTV();return;} });
 $('elitePlayerSelect').addEventListener('change',e=>{playerId=e.target.value;renderPlayer();renderScore();});
 $('elitePeriod').addEventListener('change',e=>{period=Number(e.target.value)||0;renderScore();renderPlayer();});
 $('eliteMatchSelect').addEventListener('change',e=>{matchId=e.target.value;renderMatches();});
 [$('eliteCheckoutNumber'),$('eliteCheckoutRule'),$('eliteCheckoutDarts')].forEach(x=>x.addEventListener('change',()=>{checkValue=Number($('eliteCheckoutNumber').value);checkRule=$('eliteCheckoutRule').value;checkDarts=Number($('eliteCheckoutDarts').value);renderCheckout();}));
 $('eliteCheckoutNumber').addEventListener('input',()=>{checkValue=Number($('eliteCheckoutNumber').value);renderCheckout();});
 $('eliteTvClose').addEventListener('click',()=>{tv=false;renderTV();$('eliteTvOpen')?.focus();});
 $('eliteTvOverlay').addEventListener('click',e=>{if(e.target.closest('#eliteTvStart')){tv=false;renderTV();api.goView('games');}});
 document.addEventListener('keydown',e=>{if(tv&&e.key==='Escape'){tv=false;renderTV();}});
}
window.DartsElite={init,render};
})();
