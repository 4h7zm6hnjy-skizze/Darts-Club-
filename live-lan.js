/* Jürgen Dartkasse – local, serverless iPhone/Android LAN session (beta) v3.4.0 */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const E=()=>window.DartsGameEngine;
const MAX_SIGNAL=12000;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const rnd=()=>{if(crypto?.randomUUID)return crypto.randomUUID();const a=new Uint8Array(16);crypto.getRandomValues(a);return Array.from(a).map(v=>v.toString(16).padStart(2,'0')).join('');};
let api=null,role='host',sessionId='',hostPeers=new Map(),guestPeer=null,lastOffer='',lastAnswer='',staged=[],ring=1,pendingThrow='',pendingPayload=null,currentSnapshot=null,spectator=false;
let importedCode='',recentMailbox='';
const PENDING_KEY='dart-lan-pending-3.4', LAST_PLAYER_KEY='dart-lan-last-player-3.4';
const PENDING_MAX_AGE=7*24*60*60*1000;
let lastHostMessageAt=0,heartbeatTimer=null,healthTimer=null,pendingCheck='none',lastRequestCheck='',healthWasLive=false;
function savedItem(key){try{return localStorage.getItem(key)}catch{return null}}
function saveItem(key,value){try{localStorage.setItem(key,value);return true}catch{return false}}
function deleteItem(key){try{localStorage.removeItem(key)}catch{}}
function validPending(value){const p=value?.payload;return Number.isFinite(value?.savedAt)&&Date.now()-value.savedAt>=0&&Date.now()-value.savedAt<PENDING_MAX_AGE&&p?.type==='turn'&&/^[-a-zA-Z0-9]{8,100}$/.test(p.rid)&&typeof p.matchId==='string'&&p.matchId.length<100&&Array.isArray(p.darts)&&p.darts.length>=1&&p.darts.length<=3&&p.darts.every(d=>E()?.normalDart(d))&&typeof p.juergen==='boolean';}
function restorePending(){try{const stored=JSON.parse(savedItem(PENDING_KEY)||'null');if(!validPending(stored))return;pendingPayload=stored.payload;pendingThrow=pendingPayload.rid;staged=pendingPayload.darts.map(d=>({...d}));$('liveGuestJuergen').checked=!!pendingPayload.juergen;pendingCheck='unknown';}catch{}}
function savePending(){return pendingPayload?saveItem(PENDING_KEY,JSON.stringify({savedAt:Date.now(),payload:pendingPayload})):false;}
function clearPending(){pendingThrow='';pendingPayload=null;pendingCheck='none';lastRequestCheck='';deleteItem(PENDING_KEY);staged=[];$('liveGuestJuergen').checked=false;renderGuest();}
function setHealth(id,state,message){const el=$(id);if(!el)return;el.dataset.connection=state;el.textContent=message;}
function refreshHealth(){
 if(!api)return;
 const n=[...hostPeers.values()].filter(p=>p.dc?.readyState==='open').length;
 setHealth('liveHostHealth',!sessionId?'off':n?'connected':'waiting',!sessionId?'Nicht gestartet':n===1?'1 Handy verbunden':n?`${n} Handys verbunden`:'Sitzung aktiv · noch kein Handy verbunden');
 const dc=guestPeer?.dc,online=dc?.readyState==='open',elapsed=lastHostMessageAt?Date.now()-lastHostMessageAt:Infinity;
 let state='off',info='Nicht verbunden';
 if(online&&elapsed<16000){state='connected';info='Verbunden · Spielstand wird empfangen';}
 else if(online){state='warning';info='Keine aktuellen Daten · Verbindung prüfen';}
 else if(guestPeer&&['connecting','checking','new'].includes(guestPeer.pc?.connectionState)){state='waiting';info='Verbindung wird aufgebaut';}
 else if(guestPeer){state='error';info='Verbindung unterbrochen · erneut koppeln';}
 setHealth('liveGuestHealth',state,info);
 const mini=$('liveGuestConnectionMini');if(mini){mini.textContent=info;mini.dataset.connection=state;}
}
function startHeartbeat(){if(heartbeatTimer)clearInterval(heartbeatTimer);heartbeatTimer=setInterval(()=>{if(sessionId)for(const p of hostPeers.values())send(p,{type:'heartbeat'});refreshHealth();},5000);}
function hostCheckRequest(p,msg){const rid=String(msg.rid||''),matchId=String(msg.matchId||'');if(!p.playerId||!/^[-a-zA-Z0-9]{8,100}$/.test(rid)||matchId.length>100)return;
 const revoked=(api.getState().lanVoidedRequests||[]).includes(rid);
 const committed=api.getState().dartMatches?.some(g=>g.id===matchId&&g.turns?.some(t=>t.lanRequestId===rid&&t.playerId===p.playerId));
 send(p,{type:'requestStatus',rid,status:revoked?'voided':committed?'committed':'unknown'});
}
function checkPending(){if(!pendingPayload||!guestPeer?.approved||guestPeer.dc?.readyState!=='open')return;
 const payload=pendingPayload;lastRequestCheck=payload.rid;pendingCheck='checking';
 if(!send(guestPeer,{type:'checkRequest',rid:payload.rid,matchId:payload.matchId})){pendingCheck='unknown';return;}
 setTimeout(()=>{if(pendingPayload?.rid===payload.rid&&pendingCheck==='checking'){pendingCheck='unknown';uiStatus('liveGuestState','Wurfstatus konnte nicht geprüft werden. Spielstand am Haupthandy kontrollieren, bevor du ihn erneut sendest.');renderGuest()}},5500);
}

// One authoritative deduplication store per local session, independent of peer reconnects.
const processedTurns=new Map();
const enc=new TextEncoder(),dec=new TextDecoder();
function uiStatus(id,msg){const el=$(id);if(el)el.textContent=msg;}
function ready(){return !!(window.RTCPeerConnection&&crypto?.getRandomValues&&window.DartQRCode);}
function toBase64(bytes){let r='';for(let i=0;i<bytes.length;i+=8192)r+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(r).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}
function fromBase64(s){if(!/^[A-Za-z0-9_-]{1,12000}$/.test(s))throw Error('Ungültiger QR-Code');const b=atob(s.replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-s.length%4)%4));return Uint8Array.from(b,c=>c.charCodeAt(0));}
async function packSignal(value){
 const text=enc.encode(JSON.stringify(value)); let bytes=text,compressed=false;
 if(typeof CompressionStream==='function'){
  try{const out=await new Response(new Blob([text]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer();bytes=new Uint8Array(out);compressed=true;}catch{}
 }
 const token=(compressed?'g':'r')+toBase64(bytes);
 if(token.length>MAX_SIGNAL)throw Error('Verbindungsdaten zu groß');return token;
}
async function unpackSignal(token){
 const code=String(token||'').trim().replace(/^.*?[#&]dlc=/,'');
 if(!/^[gr][A-Za-z0-9_-]{1,11999}$/.test(code))throw Error('Kein Dartkasse-Verbindungscode');
 let bytes=fromBase64(code.slice(1));
 if(code[0]==='g'){
  if(typeof DecompressionStream!=='function')throw Error('Dieses Gerät kann den QR-Code nicht entpacken. Browser aktualisieren.');
  const out=await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
  if(out.byteLength>30000)throw Error('Verbindungsdaten zu groß');bytes=new Uint8Array(out);
 }
 const raw=JSON.parse(dec.decode(bytes));
 if(raw?.v!==1||!['offer','answer'].includes(raw.kind)||typeof raw.sid!=='string'||raw.sid.length>90||typeof raw.peer!=='string'||raw.peer.length>90||typeof raw.sdp!=='string'||raw.sdp.length>20000)throw Error('Nicht unterstütztes Verbindungssignal');
 return raw;
}
function linkForCode(code){const u=new URL(location.href);u.search='';u.hash='dlc='+code;return u.href;}
function qr(elId,code){const el=$(elId);if(!el)return;el.innerHTML='';try{window.DartQRCode.render(linkForCode(code),el)}catch(e){el.textContent='QR-Code zu groß; Verbindungscode kopieren.';}}
function chooseRole(which){window.DartAllFocus?.exit?.();role=which; $('liveRoleHost').classList.toggle('active',which==='host');$('liveRoleGuest').classList.toggle('active',which==='guest');$('liveHostPanel').hidden=which!=='host';$('liveGuestPanel').hidden=which!=='guest';}
function displayIncoming(token,raw){
 importedCode=token;$('liveHandoffPanel').hidden=false;$('liveHandoffCode').value=token;
 if(raw.kind==='offer'){$('liveGuestOffer').value=token;chooseRole('guest');uiStatus('liveGuestState','Einladung empfangen. Jetzt „Verbindung vorbereiten“ drücken.');}
 else {$('liveHostAnswer').value=token;$('liveHostAnswerBox').hidden=false;chooseRole('host');uiStatus('liveHostState','Antwort erkannt. Zum bestehenden Haupthandy zurückkehren und „Antwort übernehmen“ tippen.');
  try{localStorage.setItem('dart-lan-answer-mailbox',token);}catch{}
 }
 queueMicrotask(()=>[...document.querySelectorAll('[data-view="live"]')].find(el=>el.getClientRects().length)?.click());
}
function stopPeer(p){try{p.dc?.close();p.pc?.close();}catch{}}
function stopHost(){if(heartbeatTimer){clearInterval(heartbeatTimer);heartbeatTimer=null;}for(const p of hostPeers.values())stopPeer(p);hostPeers.clear();processedTurns.clear();sessionId='';lastOffer='';$('liveHostOfferBox').hidden=true;$('liveHostAnswerBox').hidden=true;$('liveHostStart').disabled=false;$('liveHostStop').disabled=true;$('liveHostInvite').disabled=true;uiStatus('liveHostState','Live-Abend beendet. Gespeicherte Partien bleiben erhalten.');renderHostPeers();refreshHealth();}
function waitIce(pc){return new Promise(resolve=>{if(pc.iceGatheringState==='complete')return resolve();let done=false;const finish=()=>{if(done)return;done=true;pc.removeEventListener('icegatheringstatechange',check);clearTimeout(timeout);resolve();};const check=()=>{if(pc.iceGatheringState==='complete')finish()};pc.addEventListener('icegatheringstatechange',check);const timeout=setTimeout(finish,11000);});}
function send(p,data){if(p?.dc?.readyState!=='open')return false;try{p.dc.send(JSON.stringify(data));return true}catch{return false;}}
function miniSnapshot(){if(!api)return null;const s=api.getState();const match=(s.dartMatches||[]).find(g=>g.id===s.activeDartMatchId);
 const players=(s.players||[]).filter(p=>!p.archived).map(p=>({id:p.id,name:p.name}));
 if(!match)return {v:1,players,match:null};
 let r;try{r=E().replay(match);}catch{return {v:1,players,match:null};}
 return {v:1,players,match:{id:match.id,mode:match.mode,createdAt:match.createdAt,currentId:r.currentPlayerId,winnerId:r.winnerId,finished:r.finished,leg:r.leg,set:r.set,options:{doubleOut:!!match.options.doubleOut},last:r.history.at(-1)?.darts?.join(' · ')||'',scores:match.playerIds.map(id=>({id,remaining:r.players[id].remaining,score:r.players[id].score,legs:r.players[id].legs,sets:r.players[id].sets||0,average3:E().playerReport(match,id).average3,mpr:E().playerReport(match,id).mpr}))}};
}
function broadcast(){if(!sessionId)return;const snap=miniSnapshot();for(const p of hostPeers.values())send(p,{type:'snapshot',snapshot:snap});}
function hostStateUpdate(){if(!sessionId){refreshHealth();return;}const n=[...hostPeers.values()].filter(p=>p.dc?.readyState==='open').length;uiStatus('liveHostState',`Lokaler Dartabend aktiv · ${n} verbunden${n===1?'es Handy':'e Handys'} · Sitzung nur im WLAN`);refreshHealth();}
function renderHostPeers(){const root=$('liveHostPeers'); if(!root)return;
 const arr=[...hostPeers.values()];root.innerHTML=arr.length?arr.map(p=>{
 const player=api.getState().players.find(x=>x.id===p.playerId);const requesting=api.getState().players.find(x=>x.id===p.requestId);
 return `<div class="live-peer"><div><strong>${esc(player?.name||'Nicht zugewiesen')}</strong><div class="game-muted">${esc(p.pc?.connectionState==='failed'?'Verbindung gescheitert – WLAN-Isolation oder Browser prüfen':p.pc?.connectionState==='disconnected'?'Verbindung unterbrochen':p.dc?.readyState||'Warte auf Verbindung')}${requesting?' · Anfrage: '+esc(requesting.name):''}</div></div><div class="live-peer-actions">${requesting&&!p.playerId?`<button type="button" class="primary-btn small" data-live-approve="${esc(p.id)}">Profil zulassen</button>`:''}<button type="button" class="outline-btn small" data-live-remove="${esc(p.id)}" aria-label="Dieses Handy trennen">Trennen</button></div></div>`;
 }).join(''):'Noch keine Geräte verbunden.';
 hostStateUpdate();
}
function hostOnMessage(p,msg){if(!msg||typeof msg!=='object')return;
 if(msg.type==='checkRequest'){hostCheckRequest(p,msg);return;}
 if(msg.type==='sync'){send(p,{type:'snapshot',snapshot:miniSnapshot()});return;}
 if(msg.type==='claim'){
  const id=msg.playerId;
  const exists=api.getState().players.find(x=>x.id===id&&!x.archived);
  const taken=[...hostPeers.values()].some(x=>x!==p&&x.playerId===id&&x.dc?.readyState==='open');
  if(!exists||taken){send(p,{type:'error',message:'Profil nicht verfügbar oder bereits belegt.'});return;}
  p.requestId=id;renderHostPeers();send(p,{type:'status',message:'Warte auf Freigabe des Spielleiters.'});return;
 }
 if(msg.type==='turn'){
  const rid=String(msg.rid||'');if(!/^[-a-zA-Z0-9]{8,100}$/.test(rid))return;
  if((api.getState().lanVoidedRequests||[]).includes(rid)){
   send(p,{type:'error',rid,message:'Diese Aufnahme wurde vom Spielleiter zurückgenommen. Sie wird nicht erneut gebucht.'});return;
  }
  if(processedTurns.has(rid)){send(p,processedTurns.get(rid));return;}
   // Even after reconnect/reload, a confirmed throw must never be charged twice.
   const already=api.getState().dartMatches?.some(g=>g.id===msg.matchId && g.turns?.some(t=>t.lanRequestId===rid));
   if(already){const ack={type:'ack',rid};processedTurns.set(rid,ack);send(p,ack);return;}
  const match=api.getState().dartMatches?.find(g=>g.id===api.getState().activeDartMatchId);
  if(!match||!p.playerId||msg.matchId!==match.id){send(p,{type:'error',message:'Spiel ist nicht aktiv oder Profil nicht zugewiesen.',rid});return;}
  let r;try{r=E().replay(match);}catch{send(p,{type:'error',message:'Partie kann nicht geprüft werden.',rid});return;}
  if(r.finished||r.currentPlayerId!==p.playerId){send(p,{type:'error',message:'Du bist gerade nicht am Zug.',rid});return;}
  const darts=msg.darts;
  if(!Array.isArray(darts)||darts.length<1||darts.length>3||!darts.every(E().normalDart)){send(p,{type:'error',message:'Ungültige Darts.',rid});return;}
  const isJ=!!msg.juergen;const juergenKind=isJ?E().juergenType(darts):null;
  if(isJ&&!juergenKind){send(p,{type:'error',message:'Jürgen benötigt genau 1, 5 und 20 (Single/Double oder alle Triple).',rid});return;}
  if(isJ&&!api.canBookDartJuergen(p.playerId,juergenKind==='perfect',match.createdAt)){send(p,{type:'error',message:'Jürgen-Buchung für diesen Spieler nicht möglich.',rid});return;}
  try{
   const updated=E().nextTurn(match,darts);const s=api.getState();const idx=s.dartMatches.findIndex(g=>g.id===match.id);s.dartMatches[idx]=updated;updated.turns.at(-1).lanRequestId=rid;
   if(isJ){const groupId=api.addJuergenForThrower(p.playerId,juergenKind==='perfect',match.createdAt,true);if(!groupId){s.dartMatches[idx]=match;send(p,{type:'error',message:'Jürgen-Buchung fehlgeschlagen.',rid});return;}updated.turns.at(-1).juergenGroupId=groupId;}
   api.persist();api.render();const acknowledgement={type:'ack',rid};processedTurns.set(rid,acknowledgement);if(processedTurns.size>3000)processedTurns.delete(processedTurns.keys().next().value);send(p,acknowledgement);broadcast();
  }catch(err){send(p,{type:'error',message:err.message||'Wurf abgelehnt.',rid});}
 }
}
function attachHostDataChannel(p){const dc=p.dc;dc.onopen=()=>{send(p,{type:'welcome'});broadcast();renderHostPeers()};dc.onclose=()=>renderHostPeers();dc.onerror=()=>renderHostPeers();dc.onmessage=e=>{try{hostOnMessage(p,JSON.parse(e.data))}catch(err){console.warn('LAN-Nachricht:',err)}};}
async function startHost(){if(!ready()){uiStatus('liveHostState','WebRTC/QR-Code wird von diesem Browser nicht unterstützt.');return;}stopHost();sessionId=rnd();$('liveHostStart').disabled=true;$('liveHostStop').disabled=false;$('liveHostInvite').disabled=false;uiStatus('liveHostState','Sitzung gestartet. Jetzt „Weiteres Handy verbinden“ wählen.');startHeartbeat();refreshHealth();}
async function invite(){if(!sessionId)return;try{
 for(const [key,p] of hostPeers){if(['closed','failed'].includes(p.pc?.connectionState)){stopPeer(p);hostPeers.delete(key)}}
 if(hostPeers.size>=12)throw Error('Zu viele offene Einladungen. Nicht benötigte Handys trennen.');
 const pc=new RTCPeerConnection({iceServers:[]});const id=rnd();const dc=pc.createDataChannel('juergen-live',{ordered:true});const p={id,pc,dc,seen:new Set(),playerId:null,requestId:null};hostPeers.set(id,p);attachHostDataChannel(p);
 pc.onconnectionstatechange=()=>{renderHostPeers();refreshHealth();if(['failed','disconnected'].includes(pc.connectionState))uiStatus('liveHostState','Direkte Verbindung unterbrochen. Auf beiden Handys WLAN prüfen. Falls nötig neues Handy einladen und dasselbe Profil erneut freigeben. Keine Dart-Ergebnisse werden gelöscht.');};const offer=await pc.createOffer();await pc.setLocalDescription(offer);await waitIce(pc);
 lastOffer=await packSignal({v:1,kind:'offer',sid:sessionId,peer:id,sdp:pc.localDescription.sdp});
 $('liveHostOfferBox').hidden=false;$('liveHostAnswerBox').hidden=false;qr('liveHostQR',lastOffer);renderHostPeers();
 }catch(err){uiStatus('liveHostState','Einladung fehlgeschlagen: '+err.message);}}
async function applyAnswer(token){try{const signal=await unpackSignal(token);if(signal.kind!=='answer')throw Error('Bitte einen Antwort-Code verwenden.');const p=hostPeers.get(signal.peer);if(!p||!sessionId||signal.sid!==sessionId)throw Error('Code gehört nicht zu dieser laufenden Einladung.');await p.pc.setRemoteDescription({type:'answer',sdp:signal.sdp});uiStatus('liveHostState','Antwort übernommen. Warte auf direkte Verbindung …');$('liveHostAnswer').value='';lastOffer='';$('liveHostOfferBox').hidden=true;$('liveHostAnswerBox').hidden=true;renderHostPeers();}catch(err){uiStatus('liveHostState','Antwort nicht übernommen: '+err.message);}}
async function guestPrepare(token){try{
 if(pendingThrow){const proceed=confirm('Ein Wurf ist noch nicht bestätigt. Nach der neuen Kopplung kannst du denselben Wurf erneut senden. Vorher den Spielstand am Haupthandy prüfen. Jetzt neu koppeln?');if(!proceed)return;/* Keep the exact request ID and darts until the host confirms them. */}
 if(!ready())throw Error('WebRTC oder QR-Erzeugung fehlen in diesem Browser.');
 const signal=await unpackSignal(token);if(signal.kind!=='offer')throw Error('Bitte einen Einladungs-Code verwenden.');
 if(guestPeer)stopPeer(guestPeer);lastHostMessageAt=0;currentSnapshot=null;$('liveGuestGame').hidden=true;$('liveGuestClaimBox').hidden=true;
 const pc=new RTCPeerConnection({iceServers:[]});const g={pc,dc:null,session:signal.sid,id:signal.peer,approved:false};guestPeer=g;
 pc.ondatachannel=e=>{g.dc=e.channel;g.dc.onopen=()=>{if(guestPeer!==g)return;lastHostMessageAt=Date.now();refreshHealth();uiStatus('liveGuestState','Verbindung zum Spielleiter hergestellt. Spielerprofil wählen.');g.dc.send(JSON.stringify({type:'hello'}));};g.dc.onclose=()=>{if(guestPeer!==g)return;uiStatus('liveGuestState','Verbindung unterbrochen. Nicht bestätigte Würfe bleiben auf diesem Gerät erhalten.');refreshHealth();renderGuest()};g.dc.onerror=()=>{if(guestPeer===g){refreshHealth();renderGuest()}};g.dc.onmessage=ev=>{if(guestPeer!==g)return;lastHostMessageAt=Date.now();refreshHealth();try{guestOnMessage(JSON.parse(ev.data))}catch(err){console.warn('Live-Nachricht:',err)}}};
 pc.onconnectionstatechange=()=>{if(guestPeer!==g)return;refreshHealth();renderGuest();if(['failed','disconnected'].includes(pc.connectionState))uiStatus('liveGuestState','LAN-Verbindung unterbrochen. WLAN-Verbindung prüfen und neuen QR-Code anfordern. Ungesendete Daten werden nicht als Spielstand gebucht.');};
 await pc.setRemoteDescription({type:'offer',sdp:signal.sdp});const answer=await pc.createAnswer();await pc.setLocalDescription(answer);await waitIce(pc);
 lastAnswer=await packSignal({v:1,kind:'answer',sid:signal.sid,peer:signal.peer,sdp:pc.localDescription.sdp});
 $('liveGuestAnswerBox').hidden=false;qr('liveGuestQR',lastAnswer);uiStatus('liveGuestState','Antwort bereit. Der Spielleiter muss den Antwort-Code übernehmen.');
 }catch(err){uiStatus('liveGuestState','Verbindung konnte nicht vorbereitet werden: '+err.message);}}
function guestOnMessage(msg){if(msg.type==='heartbeat'){refreshHealth();return;}
 if(msg.type==='requestStatus'){if(!pendingPayload||msg.rid!==pendingPayload.rid)return;pendingCheck=msg.status==='committed'||msg.status==='voided'?msg.status:'unknown';if(pendingCheck==='committed'){clearPending();uiStatus('liveGuestState','Wurf bereits am Haupthandy gespeichert – nicht erneut gesendet.');}else if(pendingCheck==='voided'){clearPending();uiStatus('liveGuestState','Dieser Wurf wurde vom Spielleiter zurückgenommen. Keine erneute Buchung.');}else{uiStatus('liveGuestState','Haupthandy kennt diesen Wurf noch nicht. Erst den Spielstand kontrollieren, dann bei Bedarf denselben Wurf erneut senden.');renderGuest();}return;}
 if(msg.type==='welcome'){uiStatus('liveGuestState','Mit Haupthandy verbunden. Profil auswählen.');}
 else if(msg.type==='snapshot'){currentSnapshot=msg.snapshot;renderGuest();}
 else if(msg.type==='status'){uiStatus('liveGuestState',String(msg.message||''));}
 else if(msg.type==='approved'){guestPeer.approved=true;guestPeer.playerId=msg.playerId;saveItem(LAST_PLAYER_KEY,String(msg.playerId));uiStatus('liveGuestState','Profil freigegeben. Du kannst bei deinem Zug werfen.');renderGuest();checkPending();}
 else if(msg.type==='error'){if(pendingPayload&&msg.rid&&msg.rid!==pendingPayload.rid)return;const old=!!pendingPayload&&msg.rid===pendingPayload.rid; if(old)clearPending();uiStatus('liveGuestState','Vom Haupthandy abgelehnt: '+String(msg.message||'')+(old?' · Wurf nicht übernommen.':''));renderGuest();}
 else if(msg.type==='ack'){if(pendingThrow===msg.rid){clearPending();uiStatus('liveGuestState','Wurf auf dem Haupthandy gespeichert.');renderGuest();}}
}
function renderGuest(){refreshHealth();const g=guestPeer;
 const retry=$('liveGuestRetry'),discard=$('liveGuestDiscard'),warning=$('livePendingWarning');const live=!!g?.approved&&g.dc?.readyState==='open'&&Date.now()-lastHostMessageAt<16000;
 if(retry){retry.hidden=!pendingPayload;retry.disabled=!pendingPayload||!live||pendingCheck==='checking'||!currentSnapshot?.match||pendingPayload.matchId!==currentSnapshot.match.id||currentSnapshot.match.finished||currentSnapshot.match.currentId!==g.playerId;}
 if(discard)discard.hidden=!pendingPayload;
 if(warning){warning.hidden=!pendingPayload;if(pendingPayload){const same=currentSnapshot?.match?.id===pendingPayload.matchId;warning.textContent=`Nicht bestätigter Wurf: ${pendingPayload.darts.map(E().dartLabel).join(' · ')}. ${!same?'Er gehört zu einer anderen Partie; NICHT erneut senden.':pendingCheck==='checking'?'Warte auf Rückmeldung vom Haupthandy …':'Bitte vor erneutem Senden den Spielstand prüfen.'}`;}}
 if(!currentSnapshot||!g)return;
 const claim=$('liveGuestClaimBox');claim.hidden=!g.dc||g.dc.readyState!=='open'||g.approved;
 if(!claim.hidden){const sel=$('liveGuestPlayer');const existing=sel.value||savedItem(LAST_PLAYER_KEY);sel.innerHTML=currentSnapshot.players.map(p=>`<option value="${esc(p.id)}">${esc(p.name)}</option>`).join('');if(currentSnapshot.players.some(p=>p.id===existing))sel.value=existing;}
 const match=currentSnapshot.match;const readyMatch=!!match;
 $('liveGuestGame').hidden=!readyMatch;
 if(!readyMatch)return;
 $('liveGuestBoard').innerHTML=match.scores.map(p=>{const name=currentSnapshot.players.find(x=>x.id===p.id)?.name||'Spieler';return `<div class="live-score-person ${match.currentId===p.id?'active':''}"><b>${esc(name)}</b><strong>${esc(E().isX01(match.mode)?p.remaining:p.score)}</strong><small>Ø ${Number(p.average3).toFixed(2)} · Legs ${p.legs} · Sets ${p.sets}</small></div>`}).join('');
 const myTurn=live&&!match.finished&&match.currentId===g.playerId;
 $('liveGuestTurnInfo').textContent=match.finished?'Partie beendet. Sieger: '+(currentSnapshot.players.find(x=>x.id===match.winnerId)?.name||''):myTurn?'Du bist am Zug. Wurf erfassen.':'Aktueller Werfer: '+(currentSnapshot.players.find(x=>x.id===match.currentId)?.name||'–');
 $('liveGuestPad').hidden=!myTurn;
 window.DartAllFocus?.sync?.();
 $('liveGuestDarts').textContent=staged.length?staged.map(E().dartLabel).join(' · '):'Noch kein Dart';
 $('liveGuestSend').disabled=!myTurn||!staged.length||!!pendingThrow;
 $('liveGuestTargets').innerHTML=Array.from({length:20},(_,i)=>20-i).map(n=>`<button type="button" class="dart-target" data-lnum="${n}">${n}</button>`).join('')+'<button type="button" class="dart-target bull25" data-lnum="25" data-lmult="1">25</button><button type="button" class="dart-target bull50" data-lnum="25" data-lmult="2">Bull</button><button type="button" class="dart-target miss" data-lnum="0" data-lmult="0">Miss</button><button type="button" class="dart-target miss" data-lnum="0" data-lmult="0" data-laim="double">D-Miss</button>';
 $('liveGuestRings').querySelectorAll('[data-lring]').forEach(b=>b.classList.toggle('active',Number(b.dataset.lring)===ring));
}
function askClaim(){if(!guestPeer?.dc||guestPeer.dc.readyState!=='open')return;send(guestPeer,{type:'claim',playerId:$('liveGuestPlayer').value});}
function sendGuestTurn(){const m=currentSnapshot?.match;if(!m||!guestPeer?.approved||m.currentId!==guestPeer.playerId||pendingThrow||!staged.length)return;
 const kind=$('liveGuestJuergen').checked?E().juergenType(staged):null;
 if($('liveGuestJuergen').checked&&!kind){uiStatus('liveGuestState','Jürgen benötigt 1, 5 und 20 in einer gültigen Kombination.');return;}
 pendingThrow=rnd();pendingPayload={type:'turn',rid:pendingThrow,matchId:m.id,darts:staged.map(x=>({...x})),juergen:!!kind};pendingCheck='checking';const durable=savePending();const requestId=pendingThrow;setTimeout(()=>{if(pendingPayload?.rid===requestId&&pendingCheck==='checking'){pendingCheck='unknown';renderGuest()}},5500);if(!send(guestPeer,pendingPayload)){pendingCheck='unknown';uiStatus('liveGuestState','Verbindung verloren. Wurf mit derselben ID vorgemerkt – bitte nach Wiederverbindung prüfen.');renderGuest();return;}uiStatus('liveGuestState',durable?'Wurf gesendet. Warte auf Bestätigung – Aufnahme lokal vorgemerkt.':'Wurf gesendet. Warte auf Bestätigung. Lokale Sicherung ist nicht verfügbar.');renderGuest();}
async function copyCode(code){if(!code)return;try{await navigator.clipboard.writeText(code);api?.toast('Verbindungscode kopiert.');}catch{const el=$('liveHandoffCode');el.value=code;el.focus();el.select();api?.toast('Code markieren und kopieren.');}}
function startUI(){if(!$('view-live'))return;
 $('liveRoleHost').onclick=()=>chooseRole('host');$('liveRoleGuest').onclick=()=>chooseRole('guest');
 $('liveDeviceCheck').onclick=()=>{const ok=!!window.RTCPeerConnection,secure=!!window.isSecureContext,qr=!!window.DartQRCode,zip=typeof CompressionStream==='function'&&typeof DecompressionStream==='function';let storage=true;try{const v='probe-'+Date.now();localStorage.setItem('dart-lan-local-check',v);storage=localStorage.getItem('dart-lan-local-check')===v;localStorage.removeItem('dart-lan-local-check')}catch{storage=false;}const result=$('liveDeviceCheckResult');result.hidden=false;result.textContent=`Browser-Verbindung: ${ok?'verfügbar':'nicht verfügbar'}\nSichere Webseite (HTTPS): ${secure?'ja':'nein'}\nQR-Codes: ${qr?'verfügbar':'nicht verfügbar'}\nQR-Komprimierung: ${zip?'verfügbar':'nicht verfügbar – ggf. Code kopieren'}\nLokale Vormerkung: ${storage?'möglich':'nicht verfügbar – Wurf-ID kann beim Neustart verloren gehen'}\nHinweis: Ob Geräte im selben WLAN wirklich miteinander kommunizieren dürfen, kann nur der Verbindungstest bestätigen.`;};
 $('liveHostStart').onclick=startHost;$('liveHostStop').onclick=()=>{if(confirm('Verbindungen dieses Dartabends trennen?'))stopHost()};$('liveHostInvite').onclick=invite;
 $('liveHostApplyAnswer').onclick=()=>applyAnswer($('liveHostAnswer').value.trim()||lastMailbox());
 $('liveGuestConnect').onclick=()=>guestPrepare($('liveGuestOffer').value.trim());$('liveGuestClaim').onclick=askClaim;$('liveGuestSend').onclick=sendGuestTurn;
 $('liveGuestRetry').onclick=()=>{if(!pendingPayload||!guestPeer?.approved||pendingCheck==='checking'){uiStatus('liveGuestState','Zuerst Verbindung und Prüfung der Wurf-ID abschließen.');return;}const m=currentSnapshot?.match;if(!m||m.id!==pendingPayload.matchId||m.finished||m.currentId!==guestPeer.playerId){uiStatus('liveGuestState','Wurf gehört nicht zum aktuellen Zug. Nicht erneut senden.');return;}if(!confirm('Spielstand am Haupthandy kontrolliert? Diesen noch unbestätigten Wurf mit unveränderter Wurf-ID erneut senden?'))return;if(send(guestPeer,pendingPayload)){pendingCheck='checking';uiStatus('liveGuestState','Gleiche Aufnahme erneut gesendet. Warte auf Bestätigung – keine neue Wurf-ID.');renderGuest();const id=pendingPayload.rid;setTimeout(()=>{if(pendingPayload?.rid===id&&pendingCheck==='checking'){pendingCheck='unknown';renderGuest()}},5500);}};
 $('liveGuestDiscard').onclick=()=>{if(!pendingPayload)return;if(!confirm('Unbestätigten Wurf nur auf diesem Handy verwerfen? Falls er bereits am Haupthandy angekommen ist, bleibt er dort gespeichert. Vorher den Spielstand prüfen.'))return;clearPending();uiStatus('liveGuestState','Lokale Vormerkung gelöscht. Der Spielstand am Haupthandy wurde nicht verändert.');};
 $('liveSpectatorEnter').onclick=()=>{window.DartAllFocus?.exit?.();if(!currentSnapshot?.match){uiStatus('liveGuestState','Zuerst verbinden und eine Partie starten.');return;}spectator=true;document.body.classList.add('dart-spectator-on');};
 $('liveSpectatorExit').onclick=()=>{spectator=false;document.body.classList.remove('dart-spectator-on');};
 $('liveGuestUndo').onclick=()=>{staged.pop();renderGuest()};$('liveCopyOffer').onclick=()=>copyCode(lastOffer);$('liveCopyAnswer').onclick=()=>copyCode(lastAnswer);$('liveHandoffCopy').onclick=()=>copyCode(importedCode);
 $('liveHostPeers').addEventListener('click',ev=>{const remove=ev.target.closest('[data-live-remove]');if(remove){const p=hostPeers.get(remove.dataset.liveRemove);if(p&&confirm('Dieses Handy von der Live-Sitzung trennen? Gespeicherte Spielstände bleiben erhalten.')){stopPeer(p);hostPeers.delete(p.id);renderHostPeers();}return;}const b=ev.target.closest('[data-live-approve]');if(!b)return;const p=hostPeers.get(b.dataset.liveApprove);if(!p||!p.requestId)return;const existing=[...hostPeers.values()].find(x=>x!==p&&x.playerId===p.requestId);if(existing&&existing.dc?.readyState==='open'){api.toast('Profil ist bereits auf einem anderen verbundenen Handy aktiv.');return;}if(existing){stopPeer(existing);hostPeers.delete(existing.id);}p.playerId=p.requestId;p.requestId=null;send(p,{type:'approved',playerId:p.playerId});renderHostPeers();broadcast();});
 $('liveGuestTargets').addEventListener('click',ev=>{const b=ev.target.closest('[data-lnum]');if(!b||staged.length>=3||pendingThrow)return;const n=Number(b.dataset.lnum),m=b.dataset.lmult!==undefined?Number(b.dataset.lmult):ring;if(n===25&&m===3)return;staged.push({n,m,...(b.dataset.laim==='double'?{aim:'double'}:{})});renderGuest()});
 $('liveGuestRings').addEventListener('click',ev=>{const b=ev.target.closest('[data-lring]');if(!b)return;ring=Number(b.dataset.lring);renderGuest()});
 window.addEventListener('hashchange',importHash);document.addEventListener('visibilitychange',()=>{if(!document.hidden){tryMailbox();refreshHealth();if(guestPeer?.dc?.readyState==='open')send(guestPeer,{type:'sync'});if(sessionId)broadcast();}});
 if(!healthTimer)healthTimer=setInterval(()=>{const g=guestPeer;const isLive=!!g?.approved&&g.dc?.readyState==='open'&&Date.now()-lastHostMessageAt<16000;if(healthWasLive!==isLive){healthWasLive=isLive;renderGuest();}else refreshHealth();},3000);
 const hashCode=new URL(location.href).hash.match(/(?:^#|&)dlc=([^&]+)/)?.[1];if(hashCode){void importHash()}
}
function lastMailbox(){try{return localStorage.getItem('dart-lan-answer-mailbox')||''}catch{return ''}}
function tryMailbox(){const m=lastMailbox();if(m&&m!==recentMailbox&&sessionId){recentMailbox=m;$('liveHostAnswer').value=m;uiStatus('liveHostState','Antwort aus Safari übernommen – bitte auf „Antwort übernehmen“ tippen.');}}
async function importHash(){const code=new URL(location.href).hash.match(/(?:^#|&)dlc=([^&]+)/)?.[1];if(!code)return;
 try{const raw=await unpackSignal(code);displayIncoming(code,raw);}catch(err){uiStatus('liveHostState','QR-Code ungültig: '+err.message);}
 history.replaceState(null,'',location.pathname+location.search);}
function init(obj){api=obj;restorePending();startUI();refreshHealth();if(pendingPayload){uiStatus('liveGuestState','Unbestätigten Wurf vom letzten App-Start wiederhergestellt. Erst mit dem Haupthandy abgleichen, bevor du erneut sendest.');renderGuest();}}
window.DartLocalLive={init,broadcast,_test:{packSignal,unpackSignal,miniSnapshot,restorePending,validPending,hostCheckRequest,refreshHealth}};
})();
