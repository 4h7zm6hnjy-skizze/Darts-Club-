/* JÜRGEN DARTKASSE — standalone offline-first app, v1.3.1 */
'use strict';
const APP_VERSION = '1.3.1';
const STORAGE_KEY = 'juergen-dartkasse-state-v1';
const RESTORE_KEY = 'juergen-dartkasse-before-import-v1';
const DB_NAME = 'juergen-dartkasse';
const $ = id => document.getElementById(id);
const moneyFmt = new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR'});
const intFmt = new Intl.NumberFormat('de-DE');
const esc = value => String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const uid = () => (typeof crypto!=='undefined' && crypto.randomUUID) ? crypto.randomUUID() : `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
const euro = cents => moneyFmt.format((cents||0)/100);
const when = iso => { const d=new Date(iso); return Number.isNaN(+d)?'–':d.toLocaleString('de-DE',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}); };
const today = iso => { const d=new Date(iso); return Number.isNaN(+d)?'–':d.toLocaleDateString('de-DE'); };
const now = () => new Date().toISOString();
const dateKey = date => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
const prettyDate = key => /^\d{4}-\d{2}-\d{2}$/.test(key)?key.split('-').reverse().join('.'):'–';
const dateFromTimestamp = iso => { const d=new Date(iso); return Number.isNaN(+d)?dateKey(new Date()):dateKey(d); };
const currentMonthDefault = ()=>{ const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; };
const currentYearDefault = ()=>String(new Date().getFullYear());
const CHAMPION_SLOTS = {
  undisputed: {title:'Undisputed Darts Champion', subtitle:'Der unangefochtene Champion'},
  summerslam: {title:'Summerslam Champion', subtitle:'Der Champion des Sommers'}
};

function validDateKey(key){
  if(typeof key!=='string'||!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(key))return false;
  const [y,m,d]=key.split('-').map(Number);
  const parsed=new Date(y,m-1,d,12);
  return parsed.getFullYear()===y&&parsed.getMonth()===m-1&&parsed.getDate()===d&&y>=2000&&y<=2100;
}
function sessionDate(session){return validDateKey(session?.date)?session.date:dateFromTimestamp(session?.createdAt);}
function monthOf(iso){const d=new Date(iso);return Number.isNaN(+d)?'':`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;}
function yearOf(iso){const d=new Date(iso);return Number.isNaN(+d)?'':String(d.getFullYear());}
function championDefaults(){return {
  undisputed:{name:'Noch offen',image:''},
  summerslam:{name:'Noch offen',image:''}
};}
function makeInitial(){
  const s=uid();
  const todayKey=dateKey(new Date());
  return {
    schema:'juergen-dartkasse',
    schemaVersion:1,
    revision:0,
    updatedAt:now(),
    players:[],
    sessions:[{id:s,name:`Spieltag ${prettyDate(todayKey)}`,date:todayKey,createdAt:now()}],
    activeSessionId:s,
    events:[],
    settings:{baseCents:0,champions:championDefaults()}
  };
}
let state = makeInitial();
let selectedPlayerId = null;
let statsSession = 'active';
let statsMonthValue = currentMonthDefault();
let statsYearValue = currentYearDefault();
let currentView = 'play';
let cashMode = 'payment';
let toastTimer;
let idb = null;
let registration = null;
let reloadAfterUpdate = false;

function parseMoney(raw){
  const t=String(raw).trim().replace(/\s/g,'').replace(/€$/,'');
  if(!/^\d+(?:[,.]\d{1,2})?$/.test(t))return null;
  const [a,b='']=t.replace(',','.').split('.');
  const cents=Number(a)*100+Number(b.padEnd(2,'0'));
  return Number.isSafeInteger(cents)&&cents>=0&&cents<=1000000000?cents:null;
}
function inputMoney(c){return ((c||0)/100).toFixed(2).replace('.',',');}
function toast(msg){const el=$('toast'); if(!el) return; el.textContent=msg; el.classList.add('show'); clearTimeout(toastTimer); toastTimer=setTimeout(()=>el.classList.remove('show'),3500);}
function localGet(key){try{return localStorage.getItem(key);}catch{return null;}}
function localSet(key,val){try{localStorage.setItem(key,val);return true;}catch{return false;}}
function goView(view){
  if(!['play','players','cash','settings'].includes(view))return;
  currentView=view;
  document.querySelectorAll('.view').forEach(el=>el.classList.toggle('active',el.id===`view-${view}`));
  document.querySelectorAll('[data-view]').forEach(el=>{const active=el.dataset.view===view;el.classList.toggle('active',active);active?el.setAttribute('aria-current','page'):el.removeAttribute('aria-current');});
  window.scrollTo({top:0,behavior:'auto'});
  render();
}

function throwerPlayers(){return state.players.filter(p=>!p.archived && !p.absent);}
function visiblePlayers(){return state.players.filter(p=>!p.archived);}
function person(id){return state.players.find(p=>p.id===id);}
function eventValid(e){return !e.voided;}
function activeEvents(type){return state.events.filter(e=>eventValid(e)&&(!type||e.type===type));}
function getSession(){return state.sessions.find(s=>s.id===state.activeSessionId)||state.sessions[0];}
function currentHits(){return activeEvents('hit').filter(e=>e.sessionId===state.activeSessionId);}
function pointPrice(){return state.settings.baseCents||0;}
function getChampion(slot){
  const base=CHAMPION_SLOTS[slot];
  const current=state.settings?.champions?.[slot]||{};
  return {title:base.title,subtitle:base.subtitle,name:current.name||'Noch offen',image:current.image||''};
}

function calcTotals(){
  let billed=0,paid=0,cash=0,points=0;
  for(const e of state.events){
    if(e.voided)continue;
    if(e.type==='hit'){billed+=e.amount;points+=(e.points||1);}
    if(e.type==='payment'){paid+=e.amount;cash+=e.amount;}
    if(e.type==='income')cash+=e.amount;
    if(e.type==='expense')cash-=e.amount;
    if(e.type==='correction')cash+=e.amount;
  }
  return {billed,paid,cash,points,owed:billed-paid};
}
function logicalThrows(sessionId=null){
  const groups=new Map();
  for(const e of activeEvents('hit')){
    if(sessionId && e.sessionId!==sessionId)continue;
    const key=e.groupId||e.id;
    if(!groups.has(key))groups.set(key,{id:key,at:e.at,sessionId:e.sessionId,kind:e.kind||(e.perfect?'perfect':'juergen'),perfect:!!e.perfect,thrownBy:e.thrownBy||e.playerId,points:0,amount:0,recipients:[],eventIds:[]});
    const g=groups.get(key);
    g.points+=(e.points||1);
    g.amount+=e.amount||0;
    g.recipients.push(e.playerId);
    g.eventIds.push(e.id);
    if(String(e.at)>String(g.at))g.at=e.at;
  }
  return [...groups.values()].sort((a,b)=>String(a.at).localeCompare(String(b.at)));
}
function collectStats(id, predicate=null){
  let billed=0,paid=0,points=0;
  const perfectThrown=new Set(), juergenThrown=new Set();
  for(const e of state.events){
    if(e.voided)continue;
    if(e.type==='payment' && e.playerId===id)paid+=e.amount;
    if(e.type==='hit'){
      if(predicate && !predicate(e))continue;
      const key=e.groupId||e.id;
      const thrownBy=e.thrownBy||e.playerId;
      if(thrownBy===id){ if(e.perfect) perfectThrown.add(key); else juergenThrown.add(key); }
      if(e.playerId===id){ billed+=e.amount; points+=(e.points||1); }
    }
  }
  return {billed,paid,owed:billed-paid,points,perfectThrown:perfectThrown.size,juergenThrown:juergenThrown.size};
}
function personStats(id,sessionId=null){return collectStats(id, e=>!sessionId || e.sessionId===sessionId);}
function monthStats(id,monthKey){return collectStats(id, e=>monthOf(e.at)===monthKey);}
function yearStats(id,yearKey){return collectStats(id, e=>yearOf(e.at)===yearKey);}

function recordEvents(list){state.events.push(...list.map(e=>({id:uid(),at:now(),voided:false,...e}))); persist(); render();}
function recordEvent(e){recordEvents([e]);}

function validateImported(obj){
  if(!obj||obj.schema!=='juergen-dartkasse'||obj.schemaVersion!==1||!Array.isArray(obj.players)||!Array.isArray(obj.events)||!Array.isArray(obj.sessions))throw Error('Unbekanntes oder inkompatibles Backup-Format.');
  if(obj.players.length>300||obj.events.length>100000||obj.sessions.length===0||obj.sessions.length>10000)throw Error('Backup enthält zu viele Einträge.');
  const validText=(v,max)=>typeof v==='string'&&v.length<=max;
  const isId=v=>validText(v,120)&&v.length>0;
  const isAmount=v=>Number.isSafeInteger(v)&&Math.abs(v)<=1000000000;
  const ids=new Set(), pids=new Set(), sids=new Set();
  const players=obj.players.map(p=>{
    if(!p||!isId(p.id)||!validText(p.name,40)||!p.name.trim()||pids.has(p.id))throw Error('Ungültige Spielerdaten.');
    pids.add(p.id);
    return {id:p.id,name:p.name.trim(),archived:!!p.archived,absent:!!p.absent,createdAt:validText(p.createdAt,50)?p.createdAt:now()};
  });
  const sessions=obj.sessions.map(s=>{
    if(!s||!isId(s.id)||!validText(s.name,70)||sids.has(s.id))throw Error('Ungültige Spieltage.');
    sids.add(s.id);
    return {id:s.id,name:s.name,createdAt:validText(s.createdAt,50)?s.createdAt:now(),...(validDateKey(s.date)?{date:s.date}:{})};
  });
  const events=obj.events.map(e=>{
    if(!e||!isId(e.id)||ids.has(e.id)||!['hit','payment','income','expense','correction'].includes(e.type)||!isAmount(e.amount)||!validText(e.at,50))throw Error('Ungültige Buchungsdaten.');
    ids.add(e.id);
    if(e.type==='hit'){
      if(!pids.has(e.playerId)||!sids.has(e.sessionId)||e.amount<0)throw Error('Ungültige Jürgen-Buchung im Backup.');
      const thrownBy=pids.has(e.thrownBy)?e.thrownBy:e.playerId;
      return {id:e.id,at:e.at,voided:!!e.voided,type:'hit',amount:e.amount,target:e.target??null,mult:e.mult??null,kind:['juergen','perfect'].includes(e.kind)?e.kind:(e.perfect?'perfect':'juergen'),playerId:e.playerId,thrownBy,groupId:isId(e.groupId)?e.groupId:e.id,perfect:!!e.perfect,points:Number.isSafeInteger(e.points)&&e.points>0?e.points:1,sessionId:e.sessionId,note:validText(e.note,100)?e.note:''};
    }
    if(e.type==='payment'&&(!pids.has(e.playerId)||e.amount<=0))throw Error('Ungültige Spielerzahlung.');
    if(['income','expense'].includes(e.type)&&e.amount<=0)throw Error('Ungültige Kassenbuchung.');
    return {id:e.id,at:e.at,voided:!!e.voided,type:e.type,amount:e.amount,...(e.type==='payment'?{playerId:e.playerId}:{}),note:validText(e.note,100)?e.note:''};
  });
  const cfg=obj.settings||{};
  const championsDefault=championDefaults();
  const champions={
    undisputed:{name:validText(cfg?.champions?.undisputed?.name,60)?cfg.champions.undisputed.name:championsDefault.undisputed.name,image:validText(cfg?.champions?.undisputed?.image,2000000)?cfg.champions.undisputed.image:''},
    summerslam:{name:validText(cfg?.champions?.summerslam?.name,60)?cfg.champions.summerslam.name:championsDefault.summerslam.name,image:validText(cfg?.champions?.summerslam?.image,2000000)?cfg.champions.summerslam.image:''}
  };
  return {schema:'juergen-dartkasse',schemaVersion:1,revision:Number.isSafeInteger(obj.revision)?Math.max(0,obj.revision):0,updatedAt:validText(obj.updatedAt,50)?obj.updatedAt:now(),players,sessions,activeSessionId:sids.has(obj.activeSessionId)?obj.activeSessionId:sessions[0].id,events,settings:{baseCents:isAmount(cfg.baseCents)&&cfg.baseCents>=0?cfg.baseCents:0,champions}};
}

function openIDB(){return new Promise(resolve=>{
  if(!('indexedDB' in window)){resolve(null);return;}
  let req; try{req=indexedDB.open(DB_NAME,1);}catch{resolve(null);return;}
  req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains('data'))req.result.createObjectStore('data');};
  req.onsuccess=()=>resolve(req.result); req.onerror=()=>resolve(null); req.onblocked=()=>resolve(null);
});}
function idbGet(){return new Promise(resolve=>{if(!idb){resolve(null);return;} try{const r=idb.transaction('data','readonly').objectStore('data').get('state'); r.onsuccess=()=>resolve(r.result||null); r.onerror=()=>resolve(null);}catch{resolve(null);}});}
function idbPut(value){return new Promise(resolve=>{if(!idb){resolve(false);return;} try{const t=idb.transaction('data','readwrite'); t.objectStore('data').put(value,'state'); t.oncomplete=()=>resolve(true); t.onerror=()=>resolve(false); t.onabort=()=>resolve(false);}catch{resolve(false);}});}
function persist(){
  state.revision++; state.updatedAt=now();
  const saved=localSet(STORAGE_KEY,JSON.stringify(state));
  idbPut(state).then(ok=>{if(!ok&&!saved)$('storageStatus').textContent='Speicherung nicht möglich – Backup erstellen!';});
  if(!saved&&!idb)$('storageStatus').textContent='Speicherung nicht möglich – Backup erstellen!';
}
async function loadData(){
  idb=await openIDB();
  const fromLocal=localGet(STORAGE_KEY); const fromDb=await idbGet(); let candidates=[];
  for(const raw of [fromLocal,fromDb]){ try{ if(raw) candidates.push(validateImported(typeof raw==='string'?JSON.parse(raw):raw)); }catch{} }
  candidates.sort((a,b)=>b.revision-a.revision);
  if(candidates.length)state=candidates[0];
  if(!state.settings.champions) state.settings.champions = championDefaults();
  selectedPlayerId = throwerPlayers()[0]?.id || null;
  localSet(STORAGE_KEY,JSON.stringify(state)); if(idb) await idbPut(state);
}

function blobDownload(name,text,type){const blob=new Blob([text],{type}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=name; document.body.appendChild(a); a.click(); setTimeout(()=>{URL.revokeObjectURL(a.href); a.remove();},1000);}
function backup(){ const payload={backupType:'juergen-dartkasse',version:APP_VERSION,exportedAt:now(),data:state}; blobDownload(`Juergen-Dartkasse-Backup-${new Date().toISOString().slice(0,10)}.json`,JSON.stringify(payload,null,2),'application/json'); toast('Backup gespeichert.'); }
function csvEscape(v){const s=String(v??''); return /[;"\n\r]/.test(s)?'"'+s.replaceAll('"','""')+'"':s;}
function exportCSV(){
  const rows=[['Datum','Art','Werfer','Empfänger','Punkte','Betrag EUR','Status','Notiz']];
  for(const e of state.events){
    if(e.type==='hit') rows.push([when(e.at),e.perfect?'Perfekter Jürgen':'Jürgen',person(e.thrownBy||e.playerId)?.name||'',person(e.playerId)?.name||'',e.points||1,(e.amount/100).toFixed(2).replace('.',','),e.voided?'Storniert':'Aktiv',e.note||'']);
    else rows.push([when(e.at),e.type==='payment'?'Spielerzahlung':e.type==='income'?'Einnahme':e.type==='expense'?'Ausgabe':'Kassenkorrektur','',person(e.playerId)?.name||'','',(e.amount/100).toFixed(2).replace('.',','),e.voided?'Storniert':'Aktiv',e.note||'']);
  }
  blobDownload(`Juergen-Dartkasse-Buchungen-${new Date().toISOString().slice(0,10)}.csv`,'\uFEFF'+rows.map(r=>r.map(csvEscape).join(';')).join('\r\n'),'text/csv;charset=utf-8');
  toast('CSV exportiert.');
}
function savePrices(){ const val=parseMoney($('basePrice').value); if(val===null){toast('Bitte einen gültigen Euro-Betrag eingeben.'); return;} state.settings.baseCents=val; persist(); render(); toast('Preis gespeichert.'); }
function openDateDialog(){ $('sessionDateInput').value=sessionDate(getSession()); $('dateDialog').showModal(); }
function applySelectedDate(e){
  e.preventDefault();
  const chosen=$('sessionDateInput').value;
  if(!validDateKey(chosen)){toast('Bitte ein gültiges Datum auswählen.');return;}
  const existing=state.sessions.find(s=>sessionDate(s)===chosen);
  if(existing){state.activeSessionId=existing.id; statsSession='active'; persist(); $('dateDialog').close(); render(); goView('play'); toast(`Spieltag ${prettyDate(chosen)} geöffnet.`); return;}
  const session={id:uid(),name:`Spieltag ${prettyDate(chosen)}`,date:chosen,createdAt:now()};
  state.sessions.push(session); state.activeSessionId=session.id; statsSession='active'; persist(); $('dateDialog').close(); render(); goView('play'); toast(`Spieltag ${prettyDate(chosen)} angelegt.`);
}
function openPlayerDialog(id=null){ const p=id?person(id):null; $('playerModalTitle').textContent=p?'Spieler bearbeiten':'Spieler hinzufügen'; $('playerName').value=p?.name||''; $('editPlayerId').value=p?.id||''; $('playerDialog').showModal(); setTimeout(()=>$('playerName').focus(),30); }
function savePlayer(e){
  e.preventDefault();
  const name=$('playerName').value.trim().slice(0,40); const id=$('editPlayerId').value;
  if(!name){toast('Bitte Namen eingeben.'); return;}
  if(id){const p=person(id); if(!p) return; p.name=name;}
  else{const p={id:uid(),name,archived:false,absent:false,createdAt:now()}; state.players.push(p); if(!selectedPlayerId) selectedPlayerId=p.id;}
  persist(); $('playerDialog').close(); render(); toast('Spieler gespeichert.');
}
function toggleArchive(id){ const p=person(id); if(!p) return; const action=p.archived?'reaktivieren':'archivieren'; if(!confirm(`${p.name} ${action}? Bisherige Treffer und Buchungen bleiben erhalten.`))return; p.archived=!p.archived; if(p.archived) p.absent=false; if(selectedPlayerId===id && (p.archived||p.absent)) selectedPlayerId=throwerPlayers()[0]?.id||null; persist(); render(); toast(p.archived?'Spieler archiviert.':'Spieler reaktiviert.'); }
function toggleAbsent(id){ const p=person(id); if(!p||p.archived) return; p.absent=!p.absent; if(selectedPlayerId===id && p.absent) selectedPlayerId=throwerPlayers()[0]?.id||null; if(!selectedPlayerId) selectedPlayerId=throwerPlayers()[0]?.id||null; persist(); render(); toast(p.absent?`${p.name} als abwesend markiert.`:`${p.name} ist wieder anwesend.`); }
function deletePlayer(id){ const p=person(id); if(!p) return; if(state.events.some(e=>e.playerId===id||e.thrownBy===id)){toast('Spieler hat Einträge und kann nur archiviert werden.'); return;} if(!confirm(`Spieler „${p.name}“ löschen?`))return; state.players=state.players.filter(x=>x.id!==id); if(selectedPlayerId===id) selectedPlayerId=throwerPlayers()[0]?.id||null; persist(); render(); toast('Spieler gelöscht.'); }
function addJuergen(perfect){
  const thrower=person(selectedPlayerId);
  if(!thrower || thrower.archived || thrower.absent){toast('Bitte zuerst einen anwesenden Spieler auswählen.'); return;}
  const recipients = perfect ? state.players.filter(p=>p.id!==thrower.id) : [thrower];
  if(!recipients.length){toast('Für einen perfekten Jürgen muss mindestens ein weiterer Spieler gespeichert sein.'); return;}
  const price=pointPrice(); const groupId=uid();
  recordEvents(recipients.map(p=>({type:'hit',kind:perfect?'perfect':'juergen',playerId:p.id,thrownBy:thrower.id,sessionId:state.activeSessionId,target:null,mult:null,points:1,perfect,groupId,amount:price})));
  toast(perfect?`Perfekter Jürgen! ${recipients.length} andere Spieler bekommen je 1 Punkt.`:`Jürgen! 1 Punkt für ${thrower.name}.`);
}
function voidEvent(key){
  const hitMatches=state.events.filter(e=>!e.voided&&e.type==='hit'&&((e.groupId||e.id)===key));
  if(hitMatches.length){ if(hitMatches.length>1&&!confirm('Diesen perfekten Jürgen mit allen verteilten Punkten wirklich stornieren?'))return; for(const e of hitMatches)e.voided=true; persist(); render(); toast(hitMatches.length>1?'Perfekter Jürgen storniert.':'Jürgen storniert.'); return; }
  const e=state.events.find(x=>x.id===key); if(!e||e.voided) return; if(e.type!=='hit'&&!confirm('Diese Kassenbuchung wirklich stornieren? Der Kassenstand wird neu berechnet.'))return; e.voided=true; persist(); render(); toast('Eintrag storniert.');
}
function undoHit(){ const last=logicalThrows(state.activeSessionId).at(-1); if(last) voidEvent(last.id); }
function openCashDialog(mode){
  cashMode=mode;
  const titles={payment:'Spielerzahlung buchen',income:'Sonstige Einnahme',expense:'Ausgabe buchen',correction:'Kassenbestand abgleichen'};
  $('cashModalTitle').textContent=titles[mode]; $('cashAmountLabel').textContent=mode==='correction'?'Tatsächlich gezählter Kassenbestand in Euro':'Betrag in Euro';
  $('cashPlayerRow').hidden=mode!=='payment'; $('cashNote').value=''; $('cashAmount').value=mode==='correction'?inputMoney(calcTotals().cash):'';
  $('cashPlayer').innerHTML=state.players.map(p=>`<option value="${esc(p.id)}">${esc(p.name)}</option>`).join('');
  if(mode==='payment'){ const payers=state.players.filter(p=>personStats(p.id).owed>0); if(!payers.length){toast('Zurzeit hat kein Spieler offene Beiträge.');return;} $('cashPlayer').value=payers[0].id; prefillPayment(); }
  $('cashDialog').showModal(); setTimeout(()=>$('cashAmount').focus(),30);
}
function prefillPayment(){ const st=personStats($('cashPlayer').value); $('cashDebtHint').textContent=`Offen: ${euro(Math.max(0,st.owed))}`; $('cashAmount').value=inputMoney(Math.max(0,st.owed)); }
function saveCash(e){
  e.preventDefault(); const val=parseMoney($('cashAmount').value); if(val===null){toast('Bitte gültigen Betrag eingeben (z. B. 1,50).'); return;}
  const note=$('cashNote').value.trim().slice(0,100);
  if(cashMode==='correction'){
    const diff=val-calcTotals().cash; if(!diff){$('cashDialog').close(); toast('Der Kassenstand stimmt bereits.'); return;} if(!confirm(`Kasse um ${euro(diff)} korrigieren, damit der Bestand ${euro(val)} beträgt?`)) return; recordEvent({type:'correction',amount:diff,note:note||'Kassenbestandskorrektur'});
  }else{
    if(val<=0){toast('Betrag muss größer als 0 sein.'); return;}
    if(cashMode==='payment'){ const pid=$('cashPlayer').value; const owed=personStats(pid).owed; if(val>owed){toast(`Maximal offener Betrag: ${euro(Math.max(0,owed))}.`); return;} recordEvent({type:'payment',playerId:pid,amount:val,note}); }
    else{ if(cashMode==='expense'&&val>calcTotals().cash){toast('Die Ausgabe übersteigt den vorhandenen Kassenstand.'); return;} recordEvent({type:cashMode,amount:val,note}); }
  }
  $('cashDialog').close(); toast('Buchung gespeichert.');
}
async function restoreBackup(file){
  if(!file)return; if(file.size>20*1024*1024){toast('Backup ist zu groß (max. 20 MB).'); return;}
  try{
    const parsed=JSON.parse(await file.text()); const raw=parsed?.backupType==='juergen-dartkasse'?parsed.data:parsed; const imported=validateImported(raw); const fee=imported.events.filter(e=>!e.voided&&e.type==='hit').reduce((a,e)=>a+e.amount,0);
    if(!confirm(`Backup vom ${parsed.exportedAt?when(parsed.exportedAt):'unbekannten Datum'} wiederherstellen?\n\n${imported.players.length} Spieler, ${imported.events.length} Einträge, ${euro(fee)} erfasste Punktegebühren.\n\nACHTUNG: Die aktuellen Daten werden ersetzt. Bitte vorher ein Backup speichern.`))return;
    const saved=localSet(RESTORE_KEY,JSON.stringify(state)); if(!saved&&!confirm('Der vorherige Datenstand konnte nicht lokal gesichert werden. Trotzdem fortfahren?')) return;
    imported.revision=Math.max(state.revision,imported.revision)+1; imported.updatedAt=now(); state=imported; selectedPlayerId=throwerPlayers()[0]?.id||null; statsSession='active'; persist(); $('restorePrevious').hidden=!saved; render(); toast('Backup wiederhergestellt.');
  }catch(err){ toast(`Backup nicht importiert: ${err.message||'ungültige Datei'}`);} finally{$('backupFile').value='';}
}
function restorePrevious(){ const raw=localGet(RESTORE_KEY); if(!raw)return; if(!confirm('Datenstand vor dem letzten Backup-Import wiederherstellen?'))return; try{ const prev=validateImported(JSON.parse(raw)); prev.revision=state.revision+1; state=prev; localSet(RESTORE_KEY,''); $('restorePrevious').hidden=true; selectedPlayerId=throwerPlayers()[0]?.id||null; persist(); render(); toast('Vorheriger Datenstand wiederhergestellt.'); }catch{ toast('Vorheriger Stand ist beschädigt.'); } }
function crowns(count){ if(!count) return ''; return count<=4?'👑'.repeat(count):`👑×${count}`; }

function ensureChampionState(){ if(!state.settings.champions) state.settings.champions=championDefaults(); }
function renderChampions(){
  ensureChampionState();
  const root=$('championsBoard'); if(!root) return;
  root.innerHTML=Object.keys(CHAMPION_SLOTS).map(slot=>{ const c=getChampion(slot); return `<div class="champion-card ${slot}"><div class="champion-head"><span class="champion-label">Champion Slot</span><b>${esc(c.title)}</b><small>${esc(c.subtitle)}</small></div><div class="champion-body"><div class="champion-photo ${c.image?'filled':''}">${c.image?`<img src="${c.image}" alt="${esc(c.title)}">`:`<div class="champion-placeholder">🏆</div>`}</div><div class="champion-meta"><div class="champion-name">${esc(c.name||'Noch offen')}</div><div class="champion-actions"><button class="tiny-btn" data-champion-name="${slot}">Name</button><button class="tiny-btn" data-champion-upload="${slot}">Bild</button>${c.image?`<button class="tiny-btn danger" data-champion-remove="${slot}">Entfernen</button>`:''}</div></div></div></div>`; }).join('');
}
function setChampionName(slot){ const current=getChampion(slot); const value=prompt(`Name für „${current.title}“:`, current.name==='Noch offen'?'':current.name); if(value===null)return; state.settings.champions[slot].name=value.trim().slice(0,60)||'Noch offen'; persist(); render(); toast('Champion gespeichert.'); }
function openChampionUpload(slot){ const input=$(slot==='undisputed'?'championUndisputedUpload':'championSummerslamUpload'); if(input){ input.value=''; input.click(); } }
function uploadChampionFile(slot,file){ if(!file) return; if(!file.type.startsWith('image/')){toast('Bitte ein Bild auswählen.'); return;} if(file.size>3*1024*1024){toast('Bild ist zu groß (max. 3 MB).'); return;} const reader=new FileReader(); reader.onload=()=>{ state.settings.champions[slot].image=String(reader.result||''); persist(); render(); toast('Champion-Bild gespeichert.'); }; reader.onerror=()=>toast('Bild konnte nicht geladen werden.'); reader.readAsDataURL(file); }
function removeChampionImage(slot){ state.settings.champions[slot].image=''; persist(); render(); toast('Champion-Bild entfernt.'); }

function render(){ document.querySelectorAll('.version-value').forEach(el=>el.textContent=APP_VERSION); renderPlay(); renderPlayers(); renderCash(); renderSettings(); }
function renderPlay(){
  ensureChampionState(); renderChampions();
  const totals=calcTotals(), session=getSession(), throws=logicalThrows(state.activeSessionId), present=throwerPlayers(), visible=visiblePlayers();
  if(!present.some(p=>p.id===selectedPlayerId)) selectedPlayerId=present[0]?.id||null;
  $('playCash').textContent=euro(totals.cash); $('playOpen').textContent=euro(totals.owed); $('playHits').textContent=intFmt.format(currentHits().reduce((sum,e)=>sum+(e.points||1),0)); $('playSessionName').textContent=session?.name||'Aktueller Spieltag'; $('currentDateLabel').textContent=prettyDate(sessionDate(session));
  if(!visible.length) $('playerChips').innerHTML='<div class="empty-hint">Noch keine Spieler vorhanden. „Hinzufügen“ wählen.</div>';
  else $('playerChips').innerHTML=visible.map(p=>`<button class="player-chip ${selectedPlayerId===p.id?'active':''} ${p.absent?'absent':''}" data-select-player="${esc(p.id)}" ${p.absent?'disabled':''} aria-pressed="${selectedPlayerId===p.id}"><span class="avatar">${esc(p.name.slice(0,1).toUpperCase())}</span><span class="chip-name">${esc(p.name)}</span><small>${p.absent?'abwesend':'anwesend'}</small></button>`).join('');
  const otherCount=selectedPlayerId?state.players.filter(p=>p.id!==selectedPlayerId).length:0;
  $('hitPad').innerHTML=`<button class="juergen-action action-normal" data-kind="juergen" ${selectedPlayerId?'':'disabled'}><span class="action-icon">◎</span><b>Jürgen</b><small>+1 Punkt für den Werfer</small><strong>${euro(pointPrice())}</strong></button><button class="juergen-action action-perfect" data-kind="perfect" ${selectedPlayerId?'':'disabled'}><span class="action-icon crown">👑</span><b>Perfekter Jürgen</b><small>+1 Punkt für jeden anderen gespeicherten Spieler</small><strong>${otherCount} × ${euro(pointPrice())}</strong></button>`;
  $('priceWarn').hidden=pointPrice()>0;
  $('undoHit').disabled=!throws.length;
  if(!visible.length) $('activePlayerCaption').textContent='Bitte Spieler hinzufügen';
  else if(!present.length) $('activePlayerCaption').textContent='Alle nicht archivierten Spieler sind aktuell als abwesend markiert.';
  else $('activePlayerCaption').textContent=selectedPlayerId?`Aktiv: ${person(selectedPlayerId)?.name||'–'}`:'Bitte einen anwesenden Spieler wählen';
  const latest=throws.slice(-7).reverse();
  $('recentHits').innerHTML=latest.length?latest.map(g=>{ const thrower=person(g.thrownBy)?.name||'Unbekannt'; const recipients=g.recipients.map(id=>person(id)?.name||'Unbekannt'); return `<div class="event-row"><div class="event-icon ${g.perfect?'perfect':''}">${g.perfect?'👑':'◎'}</div><div class="event-meta"><b>${g.perfect?'Perfekter Jürgen':'Jürgen'} · ${esc(thrower)}</b><small>${when(g.at)} · ${g.perfect?`Punkte für: ${esc(recipients.join(', '))}`:`Punkt für: ${esc(recipients[0]||thrower)}`}</small></div><div class="event-sum">${g.points} Punkt${g.points===1?'':'e'} · ${euro(g.amount)}</div><button class="mini-remove" title="Eintrag stornieren" aria-label="Eintrag stornieren" data-void="${esc(g.id)}">×</button></div>`; }).join(''):'<div class="empty-state">Hier erscheinen deine letzten Jürgen.</div>';
  const overview=state.players.map(p=>({player:p,stats:personStats(p.id,state.activeSessionId)})).filter(x=>x.stats.points>0||x.stats.juergenThrown>0||x.stats.perfectThrown>0);
  $('sessionOverview').innerHTML=overview.length?overview.map(({player:p,stats})=>`<div class="session-person ${p.absent?'is-absent':''}"><span class="avatar">${esc(p.name.slice(0,1).toUpperCase())}</span><div class="meta"><b>${esc(p.name)}</b><small>${stats.points} Punkt${stats.points===1?'':'e'} erhalten · ${stats.juergenThrown} Jürgen geworfen${p.absent?' · abwesend':''}</small></div><span class="crown-stack">${crowns(stats.perfectThrown)}</span></div>`).join(''):'<div class="empty-state">Noch keine Jürgen an diesem Spieltag.</div>';
}
function renderPlayers(){
  const players=state.players;
  const options=`<option value="active">Aktueller Spieltag: ${esc(getSession()?.name||'')}</option><option value="all">Alle Spieltage</option>`+state.sessions.filter(s=>s.id!==state.activeSessionId).slice().reverse().map(s=>`<option value="${esc(s.id)}">${esc(s.name)} · ${prettyDate(sessionDate(s))}</option>`).join('');
  $('statsSession').innerHTML=options; if(!['active','all',...state.sessions.map(s=>s.id)].includes(statsSession)) statsSession='active'; $('statsSession').value=statsSession;
  const yearSet=new Set([currentYearDefault(), ...state.events.filter(e=>e.type==='hit').map(e=>yearOf(e.at)).filter(Boolean)]);
  const years=[...yearSet].sort((a,b)=>Number(b)-Number(a));
  $('statsYear').innerHTML=years.map(y=>`<option value="${y}">${y}</option>`).join(''); if(!years.includes(statsYearValue)) statsYearValue=years[0]||currentYearDefault(); $('statsYear').value=statsYearValue; $('statsMonth').value=statsMonthValue;
  const sessionId=statsSession==='all'?null:statsSession==='active'?state.activeSessionId:statsSession;
  if(!players.length){$('playersList').innerHTML='<div class="panel empty-state">Noch keine Spieler angelegt. Tippe auf „Spieler hinzufügen“.</div>'; return;}
  $('playersList').innerHTML=players.map(p=>{ const total=personStats(p.id), session=personStats(p.id,sessionId), month=monthStats(p.id,statsMonthValue), year=yearStats(p.id,statsYearValue); const deleteBtn=!state.events.some(e=>e.playerId===p.id||e.thrownBy===p.id)?`<button class="square-button" data-delete-player="${esc(p.id)}" title="Löschen">×</button>`:''; return `<div class="player-stat ${p.archived?'inactive':''} ${p.absent?'absent-card':''}"><div class="stat-header"><div class="avatar">${esc(p.name.slice(0,1).toUpperCase())}</div><div class="name"><strong>${esc(p.name)}</strong><small>${p.archived?'Archiviert · ':p.absent?'Abwesend · ':''}${session.points} Punkte in der Auswahl</small></div><div class="inline-actions"><button class="square-button" data-edit-player="${esc(p.id)}" title="Bearbeiten">✎</button>${!p.archived?`<button class="square-button" data-absent-player="${esc(p.id)}" title="${p.absent?'Als anwesend markieren':'Als abwesend markieren'}">${p.absent?'☀':'☾'}</button>`:''}<button class="square-button" data-archive-player="${esc(p.id)}" title="${p.archived?'Reaktivieren':'Archivieren'}">${p.archived?'↻':'▣'}</button>${deleteBtn}</div></div><div class="flag-row"><span class="flag-pill">Jürgen: ${session.juergenThrown}</span><span class="flag-pill crown">👑 Perfekte: ${session.perfectThrown}</span>${p.absent?'<span class="flag-pill absent-pill">Abwesend</span>':''}</div><div class="stat-money"><div><b>${euro(total.billed)}</b><small>Gebühren gesamt</small></div><div><b>${euro(total.paid)}</b><small>Bezahlt</small></div><div class="owed"><b>${euro(total.owed)}</b><small>${total.owed<0?'Guthaben':'Offen'}</small></div></div><div class="period-grid"><div class="period-box"><span>Monat ${esc(statsMonthValue)}</span><b>${month.points}</b><small>Punkte · ${month.juergenThrown} Jürgen · ${month.perfectThrown} Kronen</small></div><div class="period-box"><span>Jahr ${esc(statsYearValue)}</span><b>${year.points}</b><small>Punkte · ${year.juergenThrown} Jürgen · ${year.perfectThrown} Kronen</small></div></div><div class="player-point-summary"><div><b>${session.points}</b><small>Punkte in der Auswahl</small></div><div><b>${total.points}</b><small>Punkte gesamt</small></div></div></div>`; }).join('');
}
function renderCash(){ const t=calcTotals(); $('cashBalance').textContent=euro(t.cash); $('cashOwed').textContent=euro(t.owed); $('cashBilled').textContent=euro(t.billed); const log=state.events.filter(e=>!e.voided&&e.type!=='hit').slice(-100).reverse(); const descriptions={payment:'Spielerzahlung',income:'Sonstige Einnahme',expense:'Ausgabe',correction:'Kassenkorrektur'}; $('cashJournal').innerHTML=log.length?log.map(e=>{const negative=e.type==='expense'||(e.type==='correction'&&e.amount<0); const who=e.type==='payment'?` · ${esc(person(e.playerId)?.name||'Unbekannt')}`:''; return `<div class="event-row"><div class="event-icon ${e.type==='expense'?'expense':e.type==='payment'?'payment':''}">${negative?'−':'+'}</div><div class="event-meta"><b>${descriptions[e.type]}${who}</b><small>${when(e.at)}${e.note?' · '+esc(e.note):''}</small></div><div class="event-sum ${negative?'negative':''}">${negative?'−':'+'} ${euro(Math.abs(e.amount))}</div><button class="mini-remove" data-void="${esc(e.id)}" title="Buchung stornieren" aria-label="Buchung stornieren">×</button></div>`; }).join(''):'<div class="empty-state">Noch keine Kassenbuchungen vorhanden.</div>'; }
function renderSettings(){ $('basePrice').value=inputMoney(state.settings.baseCents); renderPricePreview(); $('currentSessionInfo').textContent=`Aktives Datum: ${prettyDate(sessionDate(getSession()))} · ${getSession()?.name||'Spieltag'}`; $('restorePrevious').hidden=!localGet(RESTORE_KEY); $('networkStatus').textContent=navigator.onLine?'Online / offlinefähig':'Gerade offline'; }
function renderPricePreview(){ let v=parseMoney($('basePrice').value); if(v===null)v=0; if($('previewSingle'))$('previewSingle').textContent=euro(v); if($('previewTriple'))$('previewTriple').textContent=`${euro(v)} pro anderem Spieler`; }
function semverParts(v){return String(v).split('.').map(x=>Number(x)||0);} function newer(remote,local){const a=semverParts(remote),b=semverParts(local); for(let i=0;i<3;i++){if((a[i]||0)>(b[i]||0))return true; if((a[i]||0)<(b[i]||0))return false;} return false;}
function markUpdateAvailable(){$('updateBanner').hidden=false; $('installUpdate').hidden=false; $('updateStatus').textContent='Eine neue Version wurde heruntergeladen und kann installiert werden. Deine lokalen Daten bleiben erhalten.';}
function installAvailableUpdate(){
  if(registration?.waiting){reloadAfterUpdate=true; registration.waiting.postMessage({type:'SKIP_WAITING'}); return;}
  forceUpdateNow();
}
async function forceUpdateNow(){
  if(!navigator.onLine){toast('Ohne Internet kann keine neue Version geladen werden.');return;}
  const status=$('updateStatus');
  status.textContent='Lade App-Dateien erneut. Gespeicherte Daten bleiben erhalten …';
  try { if(registration) await registration.update(); }
  catch(err){ /* Older Safari can reject update checks. Direct page reload still works. */ }
  const u=new URL(location.href);
  u.searchParams.set('app-refresh',APP_VERSION);
  u.searchParams.set('timestamp',String(Date.now()));
  location.replace(u.href);
}
async function checkForUpdate(){ const status=$('updateStatus'); if(!['http:','https:'].includes(location.protocol)){status.textContent='Bei einer lokal geöffneten HTML-Datei kann kein Online-Update installiert werden.'; toast('Update-Prüfung erfordert eine veröffentlichte Website.'); return;} if(!navigator.onLine){status.textContent='Keine Internetverbindung. Die App bleibt offline nutzbar.'; toast('Offline: Update-Prüfung nicht möglich.'); return;} status.textContent='Prüfe die veröffentlichte Version …'; try{ const res=await fetch(`./version.json?check=${Date.now()}`,{cache:'no-store'}); if(!res.ok) throw Error('Versionsdatei nicht erreichbar'); const info=await res.json(); if(typeof info.version!=='string'||!/^[0-9]+\.[0-9]+\.[0-9]+$/.test(info.version)) throw Error('Ungültige Versionsdatei'); if(registration) await registration.update(); if(registration?.waiting){markUpdateAvailable(); return;} if(newer(info.version,APP_VERSION)){status.textContent=`Neue Version ${info.version} erkannt. Über „Aktualisierte App-Dateien neu laden“ kannst du die Version direkt öffnen.`; toast(`Version ${info.version} auf dem Server erkannt.`);} else{status.textContent=`Version ${APP_VERSION} ist laut Server aktuell. Zuletzt geprüft: ${new Date().toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'})}.`; toast('App ist auf dem aktuellen Stand.');} }catch(err){status.textContent=`Update konnte nicht geprüft werden: ${err.message}`; toast('Update-Prüfung fehlgeschlagen.');} }
function initServiceWorker(){ if(!('serviceWorker' in navigator)||!['https:','http:'].includes(location.protocol)) return; navigator.serviceWorker.addEventListener('controllerchange',()=>{if(reloadAfterUpdate){reloadAfterUpdate=false; location.reload();}}); navigator.serviceWorker.register('./sw.js').then(reg=>{ registration=reg; if(reg.waiting&&navigator.serviceWorker.controller) markUpdateAvailable(); reg.addEventListener('updatefound',()=>{const installing=reg.installing; if(!installing)return; installing.addEventListener('statechange',()=>{if(installing.state==='installed'&&navigator.serviceWorker.controller)markUpdateAvailable();});}); }).catch(()=>{$('installHint').textContent='Offline-Installation benötigt HTTPS und einen Browser mit Service-Worker-Unterstützung.';}); }
function setupEvents(){
  document.querySelectorAll('[data-view]').forEach(el=>el.addEventListener('click',()=>goView(el.dataset.view)));
  document.querySelectorAll('[data-close]').forEach(el=>el.addEventListener('click',()=>$(el.dataset.close).close()));
  document.querySelectorAll('dialog').forEach(dialog=>dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();}));
  $('headerBackup').addEventListener('click',backup); $('exportBackup').addEventListener('click',backup);
  $('quickAddPlayer').addEventListener('click',()=>openPlayerDialog()); $('addPlayer').addEventListener('click',()=>openPlayerDialog()); $('playerForm').addEventListener('submit',savePlayer);
  $('playNewSession').addEventListener('click',openDateDialog); $('newSession').addEventListener('click',openDateDialog); $('dateForm').addEventListener('submit',applySelectedDate);
  $('undoHit').addEventListener('click',undoHit);
  $('playerChips').addEventListener('click',e=>{const b=e.target.closest('[data-select-player]'); if(!b||b.disabled)return; selectedPlayerId=b.dataset.selectPlayer; renderPlay();});
  $('hitPad').addEventListener('click',e=>{const b=e.target.closest('[data-kind]'); if(b&&!b.disabled) addJuergen(b.dataset.kind==='perfect');});
  $('championsBoard').addEventListener('click',e=>{const nameBtn=e.target.closest('[data-champion-name]'); const uploadBtn=e.target.closest('[data-champion-upload]'); const removeBtn=e.target.closest('[data-champion-remove]'); if(nameBtn) setChampionName(nameBtn.dataset.championName); if(uploadBtn) openChampionUpload(uploadBtn.dataset.championUpload); if(removeBtn) removeChampionImage(removeBtn.dataset.championRemove);});
  $('championUndisputedUpload').addEventListener('change',e=>uploadChampionFile('undisputed',e.target.files[0]));
  $('championSummerslamUpload').addEventListener('change',e=>uploadChampionFile('summerslam',e.target.files[0]));
  [$('recentHits'),$('cashJournal')].forEach(el=>el.addEventListener('click',e=>{const b=e.target.closest('[data-void]'); if(b) voidEvent(b.dataset.void);}));
  $('playersList').addEventListener('click',e=>{const b=e.target.closest('[data-edit-player],[data-archive-player],[data-delete-player],[data-absent-player]'); if(!b)return; if(b.dataset.editPlayer)openPlayerDialog(b.dataset.editPlayer); if(b.dataset.archivePlayer)toggleArchive(b.dataset.archivePlayer); if(b.dataset.deletePlayer)deletePlayer(b.dataset.deletePlayer); if(b.dataset.absentPlayer)toggleAbsent(b.dataset.absentPlayer);});
  $('statsSession').addEventListener('change',e=>{statsSession=e.target.value; renderPlayers();}); $('statsMonth').addEventListener('change',e=>{statsMonthValue=e.target.value||currentMonthDefault(); renderPlayers();}); $('statsYear').addEventListener('change',e=>{statsYearValue=e.target.value||currentYearDefault(); renderPlayers();});
  $('addPayment').addEventListener('click',()=>openCashDialog('payment')); $('addIncome').addEventListener('click',()=>openCashDialog('income')); $('addExpense').addEventListener('click',()=>openCashDialog('expense')); $('cashCorrection').addEventListener('click',()=>openCashDialog('correction')); $('cashPlayer').addEventListener('change',prefillPayment); $('cashForm').addEventListener('submit',saveCash);
  $('cashExport').addEventListener('click',exportCSV); $('exportCsvSettings').addEventListener('click',exportCSV);
  $('basePrice').addEventListener('input',renderPricePreview); $('savePrices').addEventListener('click',savePrices);
  $('importBackup').addEventListener('click',()=>$('backupFile').click()); $('backupFile').addEventListener('change',e=>restoreBackup(e.target.files[0])); $('restorePrevious').addEventListener('click',restorePrevious);
  $('forceUpdate').addEventListener('click',forceUpdateNow); $('checkUpdate').addEventListener('click',checkForUpdate); $('installUpdate').addEventListener('click',installAvailableUpdate); $('bannerInstall').addEventListener('click',installAvailableUpdate);
  window.addEventListener('online',()=>{$('networkStatus').textContent='Online / offlinefähig';}); window.addEventListener('offline',()=>{$('networkStatus').textContent='Gerade offline';});
}

(async()=>{ await loadData(); setupEvents(); render(); initServiceWorker(); })();
