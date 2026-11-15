/* JÜRGEN DARTKASSE — standalone offline-first app, v1.0.0 */
'use strict';
const APP_VERSION = '1.0.0';
const STORAGE_KEY = 'juergen-dartkasse-state-v1';
const RESTORE_KEY = 'juergen-dartkasse-before-import-v1';
const DB_NAME = 'juergen-dartkasse';
const HIT_TARGETS = [5,20,1];
const MULT_NAMES = {1:'Single',2:'Double',3:'Triple'};
const HIT_KEYS = HIT_TARGETS.flatMap(n=>[1,2,3].map(m=>`${n}-${m}`));
const $ = id => document.getElementById(id);
const moneyFmt = new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR'});
const intFmt = new Intl.NumberFormat('de-DE');
const esc = value => String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const uid = () => (typeof crypto!=='undefined' && crypto.randomUUID) ? crypto.randomUUID() : `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
const euro = cents => moneyFmt.format((cents||0)/100);
const when = iso => {const d=new Date(iso);return Number.isNaN(+d)?'–':d.toLocaleString('de-DE',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'});};
const today = iso => {const d=new Date(iso);return Number.isNaN(+d)?'–':d.toLocaleDateString('de-DE');};
const now = () => new Date().toISOString();
const makeInitial = () => {const s=uid();return {schema:'juergen-dartkasse',schemaVersion:1,revision:0,updatedAt:now(),players:[],sessions:[{id:s,name:'Spielabend 1',createdAt:now()}],activeSessionId:s,events:[],settings:{priceMode:'factor',baseCents:0,customPrices:Object.fromEntries(HIT_KEYS.map(k=>[k,0]))}};};
let state=makeInitial();
let selectedPlayerId=null;
let statsSession='active';
let currentView='play';
let cashMode='payment';
let toastTimer;
let idb=null;
let registration=null;
let updateReady=false;
let reloadAfterUpdate=false;

function parseMoney(raw){
  const t=String(raw).trim().replace(/\s/g,'').replace(/€$/,'');
  if(!/^\d+(?:[,.]\d{1,2})?$/.test(t))return null;
  const [a,b='']=t.replace(',','.').split('.');
  const c=Number(a)*100+Number(b.padEnd(2,'0'));
  return Number.isSafeInteger(c)&&c>=0&&c<=1000000000?c:null;
}
function inputMoney(c){return (c/100).toFixed(2).replace('.',',');}
function toast(msg){const el=$('toast');el.textContent=msg;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),3500);}
function goView(view){
  if(!['play','players','cash','settings'].includes(view))return;
  currentView=view;
  document.querySelectorAll('.view').forEach(el=>el.classList.toggle('active',el.id===`view-${view}`));
  document.querySelectorAll('[data-view]').forEach(el=>{const active=el.dataset.view===view;el.classList.toggle('active',active);if(active)el.setAttribute('aria-current','page');else el.removeAttribute('aria-current');});
  window.scrollTo({top:0,behavior:'auto'});
  render();
}
function activePlayers(){return state.players.filter(p=>!p.archived);}
function person(id){return state.players.find(p=>p.id===id);}
function eventValid(e){return !e.voided;}
function activeEvents(type){return state.events.filter(e=>eventValid(e)&&(!type||e.type===type));}
function getSession(){return state.sessions.find(s=>s.id===state.activeSessionId)||state.sessions[0];}
function currentHits(){return activeEvents('hit').filter(e=>e.sessionId===state.activeSessionId);}
function getRate(n,m){return state.settings.priceMode==='factor'?state.settings.baseCents*m:state.settings.customPrices[`${n}-${m}`]||0;}
function calcTotals(){
  let billed=0,paid=0,cash=0,hits=0;
  for(const e of state.events){if(e.voided)continue;
    if(e.type==='hit'){billed+=e.amount;hits++;}
    if(e.type==='payment'){paid+=e.amount;cash+=e.amount;}
    if(e.type==='income')cash+=e.amount;
    if(e.type==='expense')cash-=e.amount;
    if(e.type==='correction')cash+=e.amount;
  }
  return {billed,paid,cash,hits,owed:billed-paid};
}
function personStats(id,sessionId){
  const counts=Object.fromEntries(HIT_KEYS.map(k=>[k,0]));
  let billed=0,paid=0,hits=0;
  for(const e of state.events){if(e.voided||e.playerId!==id)continue;
    if(e.type==='payment')paid+=e.amount;
    if(e.type==='hit'&&(!sessionId||e.sessionId===sessionId)){
      counts[`${e.target}-${e.mult}`]++;
      billed+=e.amount;hits++;
    }
  }
  return {counts,billed,paid,owed:billed-paid,hits};
}
function recordEvent(e){state.events.push({id:uid(),at:now(),voided:false,...e});persist();render();}
function validateImported(obj){
  if(!obj||obj.schema!=='juergen-dartkasse'||obj.schemaVersion!==1||!Array.isArray(obj.players)||!Array.isArray(obj.events)||!Array.isArray(obj.sessions))throw Error('Unbekanntes oder inkompatibles Backup-Format.');
  if(obj.players.length>300||obj.events.length>100000||obj.sessions.length>10000||obj.sessions.length===0)throw Error('Backup enthält zu viele Einträge.');
  const validText=(v,max)=>typeof v==='string'&&v.length<=max;
  const isId=v=>validText(v,100)&&v.length>0;
  const isAmount=v=>Number.isSafeInteger(v)&&Math.abs(v)<=1000000000;
  const ids=new Set(),pids=new Set(),sids=new Set();
  const players=obj.players.map(p=>{
    if(!p||!isId(p.id)||!validText(p.name,40)||!p.name.trim()||pids.has(p.id))throw Error('Ungültige Spielerdaten.');
    pids.add(p.id);return {id:p.id,name:p.name.trim(),archived:!!p.archived,createdAt:validText(p.createdAt,50)?p.createdAt:now()};
  });
  const sessions=obj.sessions.map(s=>{
    if(!s||!isId(s.id)||!validText(s.name,70)||sids.has(s.id))throw Error('Ungültige Spielabende.');
    sids.add(s.id);return {id:s.id,name:s.name,createdAt:validText(s.createdAt,50)?s.createdAt:now()};
  });
  const events=obj.events.map(e=>{
    if(!e||!isId(e.id)||ids.has(e.id)||!['hit','payment','income','expense','correction'].includes(e.type)||!isAmount(e.amount)||!validText(e.at,50))throw Error('Ungültige Buchungsdaten.');
    ids.add(e.id);
    if(e.type==='hit'&&(!pids.has(e.playerId)||!sids.has(e.sessionId)||!HIT_TARGETS.includes(e.target)||![1,2,3].includes(e.mult)||e.amount<0))throw Error('Ungültige Treffer im Backup.');
    if(e.type==='payment'&&(!pids.has(e.playerId)||e.amount<=0))throw Error('Ungültige Spielerzahlung.');
    if(['income','expense'].includes(e.type)&&e.amount<=0)throw Error('Ungültige Kassenbuchung.');
    return {id:e.id,at:e.at,voided:!!e.voided,type:e.type,amount:e.amount,...(e.type==='hit'?{target:e.target,mult:e.mult,playerId:e.playerId,sessionId:e.sessionId}:{}),...(e.type==='payment'?{playerId:e.playerId}:{}),note:validText(e.note,100)?e.note:''};
  });
  const cfg=obj.settings||{};
  if(!['factor','custom'].includes(cfg.priceMode)||!isAmount(cfg.baseCents)||cfg.baseCents<0||!cfg.customPrices||typeof cfg.customPrices!=='object')throw Error('Ungültige Preise im Backup.');
  const prices={};for(const k of HIT_KEYS){if(!isAmount(cfg.customPrices[k])||cfg.customPrices[k]<0)throw Error('Ungültiger Feldpreis.');prices[k]=cfg.customPrices[k];}
  return {schema:'juergen-dartkasse',schemaVersion:1,revision:Number.isSafeInteger(obj.revision)?Math.max(0,obj.revision):0,updatedAt:validText(obj.updatedAt,50)?obj.updatedAt:now(),players,sessions,activeSessionId:sids.has(obj.activeSessionId)?obj.activeSessionId:sessions[0].id,events,settings:{priceMode:cfg.priceMode,baseCents:cfg.baseCents,customPrices:prices}};
}
function localGet(key){try{return localStorage.getItem(key);}catch{return null;}}
function localSet(key,val){try{localStorage.setItem(key,val);return true;}catch{return false;}}
function openIDB(){return new Promise(resolve=>{
  if(!('indexedDB' in window)){resolve(null);return;}
  let req;try{req=indexedDB.open(DB_NAME,1);}catch{resolve(null);return;}
  req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains('data'))req.result.createObjectStore('data');};
  req.onsuccess=()=>resolve(req.result);
  req.onerror=()=>resolve(null);req.onblocked=()=>resolve(null);
});}
function idbGet(){return new Promise(resolve=>{
  if(!idb){resolve(null);return;}try{const r=idb.transaction('data','readonly').objectStore('data').get('state');r.onsuccess=()=>resolve(r.result||null);r.onerror=()=>resolve(null);}catch{resolve(null);}
});}
function idbPut(value){return new Promise(resolve=>{
  if(!idb){resolve(false);return;}
  try{const t=idb.transaction('data','readwrite');t.objectStore('data').put(value,'state');t.oncomplete=()=>resolve(true);t.onerror=()=>resolve(false);t.onabort=()=>resolve(false);}catch{resolve(false);}
});}
function persist(){
  state.revision++;state.updatedAt=now();
  const saved=localSet(STORAGE_KEY,JSON.stringify(state));
  idbPut(state).then(ok=>{if(!ok&&!saved)$('storageStatus').textContent='Speicherung nicht möglich – Backup erstellen!';});
  if(!saved&&!idb)$('storageStatus').textContent='Speicherung nicht möglich – Backup erstellen!';
}
async function loadData(){
  idb=await openIDB();
  const fromLocal=localGet(STORAGE_KEY);const fromDb=await idbGet();let candidates=[];
  for(const raw of [fromLocal,fromDb]){try{if(raw)candidates.push(validateImported(typeof raw==='string'?JSON.parse(raw):raw));}catch{}}
  candidates.sort((a,b)=>b.revision-a.revision);
  if(candidates.length)state=candidates[0];
  localSet(STORAGE_KEY,JSON.stringify(state));await idbPut(state);
  if(!localGet(STORAGE_KEY)&&!idb)$('storageStatus').textContent='Speicherung blockiert! Backup verwenden';
  selectedPlayerId=activePlayers()[0]?.id||null;
  $('restorePrevious').hidden=!localGet(RESTORE_KEY);
}
function blobDownload(name,content,mime){
  const blob=new Blob([content],{type:mime});const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);
}
function backup(){
  const stamp=new Date().toISOString().replace(/[:.]/g,'-');
  blobDownload(`Juergen-Dartkasse-Backup-${stamp}.json`,JSON.stringify({backupType:'juergen-dartkasse',exportedAt:now(),appVersion:APP_VERSION,data:state},null,2),'application/json;charset=utf-8');
  toast('Backup heruntergeladen. Datei sicher aufbewahren.');
}
function csvEscape(value){let v=String(value??'');if(/^[=+@\-\t\r]/.test(v))v="'"+v;return '"'+v.replace(/"/g,'""')+'"';}
function exportCSV(){
  const rows=[['Datum','Art','Spieler','Feld','Multiplikator','Betrag EUR','Status','Notiz']];
  for(const e of state.events){rows.push([when(e.at),e.type==='hit'?'Treffer':e.type==='payment'?'Spielerzahlung':e.type==='income'?'Einnahme':e.type==='expense'?'Ausgabe':'Kassenkorrektur',person(e.playerId)?.name||'',e.type==='hit'?e.target:'',e.type==='hit'?MULT_NAMES[e.mult]:'',(e.amount/100).toFixed(2).replace('.',','),e.voided?'Storniert':'Aktiv',e.note||'']);}
  blobDownload(`Juergen-Dartkasse-Buchungen-${new Date().toISOString().slice(0,10)}.csv`,'\uFEFF'+rows.map(r=>r.map(csvEscape).join(';')).join('\r\n'),'text/csv;charset=utf-8');toast('CSV exportiert.');
}
function savePrices(){
  const mode=document.querySelector('input[name="priceMode"]:checked')?.value||'factor';
  if(mode==='factor'){const val=parseMoney($('basePrice').value);if(val===null){toast('Bitte einen gültigen Euro-Betrag eingeben.');return;}state.settings.baseCents=val;}
  else{const vals={};for(const key of HIT_KEYS){const inp=document.querySelector(`[data-price="${key}"]`);const val=parseMoney(inp?.value??'');if(val===null){toast(`Ungültiger Preis für ${key}.`);inp?.focus();return;}vals[key]=val;}state.settings.customPrices=vals;}
  state.settings.priceMode=mode;persist();render();toast('Preise für zukünftige Treffer gespeichert.');
}
function startNewSession(){
  const name=prompt('Name des neuen Spielabends:',`Spielabend ${state.sessions.length+1}`);
  if(name===null)return;const label=name.trim().slice(0,70);
  if(!label){toast('Bitte einen Namen eingeben.');return;}
  const s={id:uid(),name:label,createdAt:now()};state.sessions.push(s);state.activeSessionId=s.id;statsSession='active';persist();render();goView('play');toast('Neuer Spielabend begonnen. Die Kasse bleibt unverändert.');
}
function openPlayerDialog(id=null){
  const p=id?person(id):null;
  $('playerModalTitle').textContent=p?'Spieler bearbeiten':'Spieler hinzufügen';
  $('playerName').value=p?.name||'';$('editPlayerId').value=p?.id||'';
  $('playerDialog').showModal();setTimeout(()=>$('playerName').focus(),30);
}
function savePlayer(e){e.preventDefault();const name=$('playerName').value.trim().slice(0,40);const id=$('editPlayerId').value;
  if(!name){toast('Bitte Namen eingeben.');return;}
  if(id){const p=person(id);if(!p)return;p.name=name;}
  else{const p={id:uid(),name,archived:false,createdAt:now()};state.players.push(p);selectedPlayerId=p.id;}
  persist();$('playerDialog').close();render();toast('Spieler gespeichert.');
}
function toggleArchive(id){const p=person(id);if(!p)return;
  const action=p.archived?'reaktivieren':'archivieren';
  if(!confirm(`${p.name} ${action}? Bisherige Treffer und Buchungen bleiben erhalten.`))return;
  p.archived=!p.archived;
  if(selectedPlayerId===id&&p.archived)selectedPlayerId=activePlayers()[0]?.id||null;
  persist();render();toast(p.archived?'Spieler archiviert.':'Spieler reaktiviert.');
}
function deletePlayer(id){const p=person(id);if(!p)return;
  if(state.events.some(e=>e.playerId===id)){toast('Spieler hat Einträge und kann nur archiviert werden.');return;}
  if(!confirm(`Spieler „${p.name}“ löschen?`))return;
  state.players=state.players.filter(p=>p.id!==id);if(selectedPlayerId===id)selectedPlayerId=activePlayers()[0]?.id||null;
  persist();render();toast('Spieler gelöscht.');
}
function hit(target,mult){
  if(!person(selectedPlayerId)||person(selectedPlayerId).archived){toast('Bitte zuerst einen Spieler auswählen.');return;}
  recordEvent({type:'hit',playerId:selectedPlayerId,sessionId:state.activeSessionId,target,mult,amount:getRate(target,mult)});
  toast(`${MULT_NAMES[mult]} ${target} · ${euro(getRate(target,mult))} erfasst.`);
}
function voidEvent(id){const e=state.events.find(x=>x.id===id);if(!e||e.voided)return;
  if(e.type!=='hit'&&!confirm('Diese Kassenbuchung wirklich stornieren? Der Kassenstand wird neu berechnet.'))return;
  e.voided=true;persist();render();toast('Eintrag storniert. Im Backup und CSV nachvollziehbar.');
}
function undoHit(){const last=state.events.findLast(e=>!e.voided&&e.type==='hit'&&e.sessionId===state.activeSessionId);if(last)voidEvent(last.id);}
function openCashDialog(mode){
  cashMode=mode;
  const titles={payment:'Spielerzahlung buchen',income:'Sonstige Einnahme',expense:'Ausgabe buchen',correction:'Kassenbestand abgleichen'};
  $('cashModalTitle').textContent=titles[mode];$('cashAmountLabel').textContent=mode==='correction'?'Tatsächlich gezählter Kassenbestand in Euro':'Betrag in Euro';
  $('cashPlayerRow').hidden=mode!=='payment';
  $('cashNote').value='';$('cashAmount').value=mode==='correction'?inputMoney(calcTotals().cash):'';
  $('cashPlayer').innerHTML=state.players.map(p=>`<option value="${esc(p.id)}">${esc(p.name)}</option>`).join('');
  if(mode==='payment'){
    const payers=state.players.filter(p=>personStats(p.id).owed>0);
    if(!payers.length){toast('Zurzeit hat kein Spieler offene Beiträge.');return;}
    $('cashPlayer').value=payers[0].id;prefillPayment();
  }
  $('cashDialog').showModal();setTimeout(()=>$('cashAmount').focus(),30);
}
function prefillPayment(){const st=personStats($('cashPlayer').value);$('cashDebtHint').textContent=`Offen: ${euro(Math.max(0,st.owed))}`;$('cashAmount').value=inputMoney(Math.max(0,st.owed));}
function saveCash(e){e.preventDefault();const val=parseMoney($('cashAmount').value);if(val===null){toast('Bitte gültigen Betrag eingeben (z. B. 1,50).');return;}
  const note=$('cashNote').value.trim().slice(0,100);
  if(cashMode==='correction'){
    const diff=val-calcTotals().cash;if(!diff){$('cashDialog').close();toast('Der Kassenstand stimmt bereits.');return;}
    if(!confirm(`Kasse um ${euro(diff)} korrigieren, damit der Bestand ${euro(val)} beträgt?`))return;
    recordEvent({type:'correction',amount:diff,note:note||'Kassenbestandskorrektur'});
  }else{
    if(val<=0){toast('Betrag muss größer als 0 sein.');return;}
    if(cashMode==='payment'){
      const pid=$('cashPlayer').value;const owed=personStats(pid).owed;
      if(val>owed){toast(`Maximal offener Betrag: ${euro(Math.max(0,owed))}.`);return;}
      recordEvent({type:'payment',playerId:pid,amount:val,note});
    }else{
      if(cashMode==='expense'&&val>calcTotals().cash){toast('Die Ausgabe übersteigt den vorhandenen Kassenstand.');return;}
      recordEvent({type:cashMode,amount:val,note});
    }
  }
  $('cashDialog').close();toast('Buchung gespeichert.');
}
async function restoreBackup(file){
  if(!file)return;
  if(file.size>20*1024*1024){toast('Backup ist zu groß (max. 20 MB).');return;}
  try{
    const parsed=JSON.parse(await file.text());const raw=parsed?.backupType==='juergen-dartkasse'?parsed.data:parsed;
    const imported=validateImported(raw);
    const fee=imported.events.filter(e=>!e.voided&&e.type==='hit').reduce((a,e)=>a+e.amount,0);
    if(!confirm(`Backup vom ${parsed.exportedAt?when(parsed.exportedAt):'unbekannten Datum'} wiederherstellen?\n\n${imported.players.length} Spieler, ${imported.events.length} Einträge, ${euro(fee)} erfasste Treffergebühren.\n\nACHTUNG: Die aktuellen Daten werden ersetzt. Bitte vorher ein Backup speichern.`))return;
    const saved=localSet(RESTORE_KEY,JSON.stringify(state));
    if(!saved&&!confirm('Der vorherige Datenstand konnte nicht lokal gesichert werden. Trotzdem fortfahren?'))return;
    imported.revision=Math.max(state.revision,imported.revision)+1;imported.updatedAt=now();state=imported;
    selectedPlayerId=activePlayers()[0]?.id||null;statsSession='active';persist();$('restorePrevious').hidden=!saved;render();toast('Backup wiederhergestellt.');
  }catch(err){toast(`Backup nicht importiert: ${err.message||'ungültige Datei'}`);}
  finally{$('backupFile').value='';}
}
function restorePrevious(){const raw=localGet(RESTORE_KEY);if(!raw)return;
  if(!confirm('Datenstand vor dem letzten Backup-Import wiederherstellen?'))return;
  try{const prev=validateImported(JSON.parse(raw));prev.revision=state.revision+1;state=prev;localSet(RESTORE_KEY,'');$('restorePrevious').hidden=true;selectedPlayerId=activePlayers()[0]?.id||null;persist();render();toast('Vorheriger Datenstand wiederhergestellt.');}catch{toast('Vorheriger Stand ist beschädigt.');}
}
function render(){
  document.querySelectorAll('.version-value').forEach(el=>el.textContent=APP_VERSION);
  renderPlay();renderPlayers();renderCash();renderSettings();
}
function renderPlay(){
  const t=calcTotals(),session=getSession(),hits=currentHits();
  $('playCash').textContent=euro(t.cash);$('playOpen').textContent=euro(t.owed);
  $('playHits').textContent=intFmt.format(hits.length);$('playSessionName').textContent=session?.name||'Aktueller Abend';
  const players=activePlayers();
  if(!players.some(p=>p.id===selectedPlayerId))selectedPlayerId=players[0]?.id||null;
  $('playerChips').innerHTML=players.length?players.map(p=>`<button class="player-chip ${selectedPlayerId===p.id?'active':''}" data-select-player="${esc(p.id)}" aria-pressed="${selectedPlayerId===p.id}"><span class="avatar">${esc(p.name.slice(0,1).toUpperCase())}</span><span class="chip-name">${esc(p.name)}</span></button>`).join(''):'<div class="empty-hint">Noch keine Spieler vorhanden. „Hinzufügen“ wählen.</div>';
  $('hitPad').innerHTML=HIT_TARGETS.map(n=>`<div class="pad-row"><div class="target-number">${n}</div>${[1,2,3].map(m=>`<button class="hit-button" data-target="${n}" data-mult="${m}" ${selectedPlayerId?'':'disabled'} title="${MULT_NAMES[m]} ${n} verbuchen"><span class="code">${m===1?'S':m===2?'D':'T'}${n}</span><small>${euro(getRate(n,m))}</small></button>`).join('')}</div>`).join('');
  $('priceWarn').hidden=HIT_KEYS.some(k=>{const [n,m]=k.split('-').map(Number);return getRate(n,m)>0;});
  $('activePlayerCaption').textContent=selectedPlayerId?`Aktiv: ${person(selectedPlayerId)?.name||'–'}`:'Bitte Spieler hinzufügen';
  $('undoHit').disabled=!hits.length;
  const latest=hits.slice(-7).reverse();
  $('recentHits').innerHTML=latest.length?latest.map(e=>`<div class="event-row"><div class="event-icon">${e.mult===1?'S':e.mult===2?'D':'T'}${e.target}</div><div class="event-meta"><b>${esc(person(e.playerId)?.name||'Unbekannt')} · ${MULT_NAMES[e.mult]} ${e.target}</b><small>${when(e.at)}</small></div><div class="event-sum">+ ${euro(e.amount)}</div><button class="mini-remove" title="Treffer stornieren" aria-label="Treffer stornieren" data-void="${esc(e.id)}">×</button></div>`).join(''):'<div class="empty-state">Hier erscheinen deine letzten Treffer.<br>Wähle einen Spieler und tippe auf ein Feld.</div>';
  const per=players.map(p=>({p,num:hits.filter(e=>e.playerId===p.id).length})).filter(x=>x.num>0);
  $('sessionOverview').innerHTML=per.length?per.map(({p,num})=>`<div class="session-person"><span class="avatar">${esc(p.name.slice(0,1).toUpperCase())}</span><b>${esc(p.name)}</b><span>${num} ${num===1?'Treffer':'Treffer'}</span></div>`).join(''):'<div class="empty-state">Noch keine Treffer in diesem Spielabend.</div>';
}
function renderPlayers(){
  const options=`<option value="active">Aktueller Abend: ${esc(getSession()?.name||'')}</option><option value="all">Alle Spielabende</option>`+state.sessions.filter(s=>s.id!==state.activeSessionId).slice().reverse().map(s=>`<option value="${esc(s.id)}">${esc(s.name)} · ${today(s.createdAt)}</option>`).join('');
  $('statsSession').innerHTML=options;
  const valid=['active','all',...state.sessions.map(s=>s.id)].includes(statsSession);if(!valid)statsSession='active';$('statsSession').value=statsSession;
  const sessionId=statsSession==='all'?null:statsSession==='active'?state.activeSessionId:statsSession;
  const players=state.players;
  if(!players.length){$('playersList').innerHTML='<div class="panel empty-state">Noch keine Spieler angelegt. Tippe auf „Spieler hinzufügen“.</div>';return;}
  $('playersList').innerHTML=players.map(p=>{
    const total=personStats(p.id),session=personStats(p.id,sessionId),count=session.counts;
    const grid=`<span></span><span class="stat-cell head">Single</span><span class="stat-cell head">Double</span><span class="stat-cell head">Triple</span>`+HIT_TARGETS.map(n=>`<span class="target-head">${n}</span>${[1,2,3].map(m=>`<span class="stat-cell">${intFmt.format(count[`${n}-${m}`])}</span>`).join('')}`).join('');
    return `<div class="player-stat ${p.archived?'inactive':''}"><div class="stat-header"><div class="avatar">${esc(p.name.slice(0,1).toUpperCase())}</div><div class="name"><strong>${esc(p.name)}</strong><small>${p.archived?'Archiviert · ':''}${session.hits} Treffer in der Auswahl</small></div><div class="inline-actions"><button class="square-button" data-edit-player="${esc(p.id)}" title="Bearbeiten">✎</button><button class="square-button" data-archive-player="${esc(p.id)}" title="${p.archived?'Reaktivieren':'Archivieren'}">${p.archived?'↻':'▣'}</button>${!state.events.some(e=>e.playerId===p.id)?`<button class="square-button" data-delete-player="${esc(p.id)}" title="Löschen">×</button>`:''}</div></div><div class="stat-money"><div><b>${euro(total.billed)}</b><small>Gebühren gesamt</small></div><div><b>${euro(total.paid)}</b><small>Bezahlt</small></div><div class="owed"><b>${euro(total.owed)}</b><small>${total.owed<0?'Guthaben':'Offen'}</small></div></div><div class="stat-grid">${grid}</div><div class="stat-foot">Gesamt: ${total.hits} Treffer · ${session.hits} in der Auswahl</div></div>`;
  }).join('');
}
function renderCash(){
  const t=calcTotals();$('cashBalance').textContent=euro(t.cash);$('cashOwed').textContent=euro(t.owed);$('cashBilled').textContent=euro(t.billed);
  const log=state.events.filter(e=>!e.voided&&e.type!=='hit').slice(-100).reverse();
  const descriptions={payment:'Spielerzahlung',income:'Sonstige Einnahme',expense:'Ausgabe',correction:'Kassenkorrektur'};
  $('cashJournal').innerHTML=log.length?log.map(e=>{
    const negative=e.type==='expense'||(e.type==='correction'&&e.amount<0);
    const who=e.type==='payment'?` · ${esc(person(e.playerId)?.name||'Unbekannt')}`:'';
    return `<div class="event-row"><div class="event-icon ${e.type==='expense'?'expense':e.type==='payment'?'payment':''}">${negative?'−':'+'}</div><div class="event-meta"><b>${descriptions[e.type]}${who}</b><small>${when(e.at)}${e.note?' · '+esc(e.note):''}</small></div><div class="event-sum ${negative?'negative':''}">${negative?'−':'+'} ${euro(Math.abs(e.amount))}</div><button class="mini-remove" data-void="${esc(e.id)}" title="Buchung stornieren" aria-label="Buchung stornieren">×</button></div>`;
  }).join(''):'<div class="empty-state">Noch keine Kassenbuchungen vorhanden.<br>Treffer allein erhöhen den Kassenstand nicht.</div>';
}
function renderSettings(){
  const cfg=state.settings;
  document.querySelectorAll('input[name="priceMode"]').forEach(el=>el.checked=el.value===cfg.priceMode);
  $('basePrice').value=inputMoney(cfg.baseCents);
  $('factorPrices').hidden=cfg.priceMode!=='factor';$('customPrices').hidden=cfg.priceMode!=='custom';
  renderPricePreview();
  $('customPriceGrid').innerHTML=`<span></span><span class="custom-head">Single</span><span class="custom-head">Double</span><span class="custom-head">Triple</span>`+HIT_TARGETS.map(n=>`<span class="custom-target">${n}</span>`+[1,2,3].map(m=>`<input type="text" inputmode="decimal" autocomplete="off" data-price="${n}-${m}" aria-label="${MULT_NAMES[m]} ${n}" value="${inputMoney(cfg.customPrices[`${n}-${m}`]||0)}">`).join('')).join('');
  $('currentSessionInfo').textContent=`${getSession()?.name||'Spielabend'} · gestartet am ${when(getSession()?.createdAt)}`;
  $('restorePrevious').hidden=!localGet(RESTORE_KEY);
  $('networkStatus').textContent=navigator.onLine?'Online / offlinefähig':'Gerade offline';
}
function renderPricePreview(){let v=parseMoney($('basePrice').value);if(v===null)v=0;$('previewSingle').textContent=euro(v);$('previewDouble').textContent=euro(v*2);$('previewTriple').textContent=euro(v*3);}
function activatePriceMode(mode){$('factorPrices').hidden=mode!=='factor';$('customPrices').hidden=mode!=='custom';}
function semverParts(v){return String(v).split('.').map(x=>Number(x)||0);}
function newer(remote,local){const a=semverParts(remote),b=semverParts(local);for(let i=0;i<3;i++){if((a[i]||0)>(b[i]||0))return true;if((a[i]||0)<(b[i]||0))return false;}return false;}
function markUpdateAvailable(){updateReady=true;$('updateBanner').hidden=false;$('installUpdate').hidden=false;$('updateStatus').textContent='Eine neue Version wurde heruntergeladen und kann installiert werden. Deine lokalen Daten bleiben erhalten.';}
function installAvailableUpdate(){
  if(registration?.waiting){reloadAfterUpdate=true;registration.waiting.postMessage({type:'SKIP_WAITING'});return;}
  toast('Noch kein fertiges Update verfügbar. Bitte erneut prüfen.');
}
async function checkForUpdate(){
  const status=$('updateStatus');
  if(!['http:','https:'].includes(location.protocol)){status.textContent='Bei einer lokal geöffneten HTML-Datei kann kein Online-Update installiert werden. Dafür muss die App auf einer HTTPS-Website liegen.';toast('Update-Prüfung erfordert eine veröffentlichte Website.');return;}
  if(!navigator.onLine){status.textContent='Keine Internetverbindung. Die App bleibt offline nutzbar.';toast('Offline: Update-Prüfung nicht möglich.');return;}
  status.textContent='Prüfe die veröffentlichte Version …';
  try{
    const res=await fetch(`./version.json?check=${Date.now()}`,{cache:'no-store'});if(!res.ok)throw Error('Versionsdatei nicht erreichbar');
    const info=await res.json();if(typeof info.version!=='string'||!/^[0-9]+\.[0-9]+\.[0-9]+$/.test(info.version))throw Error('Ungültige Versionsdatei');
    if(registration)await registration.update();
    if(registration?.waiting){markUpdateAvailable();return;}
    if(newer(info.version,APP_VERSION)){status.textContent=`Neue Version ${info.version} gemeldet. Sobald der Download abgeschlossen ist, erscheint „Update installieren“. Gegebenenfalls erneut prüfen.`;toast(`Version ${info.version} auf dem Server erkannt.`);}
    else{status.textContent=`Version ${APP_VERSION} ist laut Server aktuell. Zuletzt geprüft: ${new Date().toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'})}.`;toast('App ist auf dem aktuellen Stand.');}
  }catch(err){status.textContent=`Update konnte nicht geprüft werden: ${err.message}`;toast('Update-Prüfung fehlgeschlagen.');}
}
function initServiceWorker(){
  if(!('serviceWorker' in navigator)||!['https:','http:'].includes(location.protocol))return;
  navigator.serviceWorker.addEventListener('controllerchange',()=>{if(reloadAfterUpdate){reloadAfterUpdate=false;location.reload();}});
  navigator.serviceWorker.register('./sw.js').then(reg=>{
    registration=reg;
    if(reg.waiting&&navigator.serviceWorker.controller)markUpdateAvailable();
    reg.addEventListener('updatefound',()=>{
      const installing=reg.installing;if(!installing)return;
      installing.addEventListener('statechange',()=>{if(installing.state==='installed'&&navigator.serviceWorker.controller)markUpdateAvailable();});
    });
  }).catch(()=>{$('installHint').textContent='Offline-Installation benötigt HTTPS und einen Browser mit Service-Worker-Unterstützung.';});
}
function setupEvents(){
  document.querySelectorAll('[data-view]').forEach(el=>el.addEventListener('click',()=>goView(el.dataset.view)));
  document.querySelectorAll('[data-close]').forEach(el=>el.addEventListener('click',()=>$(el.dataset.close).close()));
  for(const dialog of document.querySelectorAll('dialog')){dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});}
  $('headerBackup').addEventListener('click',backup);$('exportBackup').addEventListener('click',backup);
  $('quickAddPlayer').addEventListener('click',()=>openPlayerDialog());$('addPlayer').addEventListener('click',()=>openPlayerDialog());
  $('playerForm').addEventListener('submit',savePlayer);
  $('playNewSession').addEventListener('click',startNewSession);$('newSession').addEventListener('click',startNewSession);
  $('undoHit').addEventListener('click',undoHit);
  $('playerChips').addEventListener('click',e=>{const b=e.target.closest('[data-select-player]');if(!b)return;selectedPlayerId=b.dataset.selectPlayer;renderPlay();});
  $('hitPad').addEventListener('click',e=>{const b=e.target.closest('[data-target]');if(b)hit(Number(b.dataset.target),Number(b.dataset.mult));});
  for(const el of [$('recentHits'),$('cashJournal')])el.addEventListener('click',e=>{const b=e.target.closest('[data-void]');if(b)voidEvent(b.dataset.void);});
  $('playersList').addEventListener('click',e=>{const b=e.target.closest('[data-edit-player],[data-archive-player],[data-delete-player]');if(!b)return;
    if(b.dataset.editPlayer)openPlayerDialog(b.dataset.editPlayer);
    if(b.dataset.archivePlayer)toggleArchive(b.dataset.archivePlayer);
    if(b.dataset.deletePlayer)deletePlayer(b.dataset.deletePlayer);
  });
  $('statsSession').addEventListener('change',e=>{statsSession=e.target.value;renderPlayers();});
  $('addPayment').addEventListener('click',()=>openCashDialog('payment'));$('addIncome').addEventListener('click',()=>openCashDialog('income'));
  $('addExpense').addEventListener('click',()=>openCashDialog('expense'));$('cashCorrection').addEventListener('click',()=>openCashDialog('correction'));
  $('cashPlayer').addEventListener('change',prefillPayment);$('cashForm').addEventListener('submit',saveCash);
  $('cashExport').addEventListener('click',exportCSV);$('exportCsvSettings').addEventListener('click',exportCSV);
  document.querySelectorAll('input[name="priceMode"]').forEach(el=>el.addEventListener('change',()=>activatePriceMode(el.value)));
  $('basePrice').addEventListener('input',renderPricePreview);$('savePrices').addEventListener('click',savePrices);
  $('importBackup').addEventListener('click',()=>$('backupFile').click());$('backupFile').addEventListener('change',e=>restoreBackup(e.target.files[0]));
  $('restorePrevious').addEventListener('click',restorePrevious);
  $('checkUpdate').addEventListener('click',checkForUpdate);$('installUpdate').addEventListener('click',installAvailableUpdate);$('bannerInstall').addEventListener('click',installAvailableUpdate);
  window.addEventListener('online',()=>{$('networkStatus').textContent='Online / offlinefähig';});window.addEventListener('offline',()=>{$('networkStatus').textContent='Gerade offline';});
}
(async()=>{await loadData();setupEvents();render();initServiceWorker();})();
