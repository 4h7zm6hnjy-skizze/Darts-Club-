/* DARTS CLUB Ultimate · optional local-only dart caller v3.5.0 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.DartsCaller=api;})(typeof globalThis!=='undefined'?globalThis:null,function(){
 'use strict';
 const KEY='darts-club-caller-settings-v1';
 const initial={enabled:false,rate:1,announceScore:true,announce180:true,announceWinner:true,announceCheckout:true};
 let cfg={...initial},lastError='';
 try{
  const raw=JSON.parse(localStorage.getItem(KEY)||'{}');
  if(raw&&typeof raw==='object'){
   for(const [key,v] of Object.entries(raw)){
    if(!(key in initial))continue;
    if(key==='rate'){if(typeof v==='number'&&v>=.75&&v<=1.25)cfg.rate=v;}
    else if(typeof v==='boolean')cfg[key]=v;
   }
  }
 }catch{}

 // Never begin reading out loud after a reload without a fresh user gesture.
 cfg.enabled=false;
 function save(){try{localStorage.setItem(KEY,JSON.stringify({...cfg,enabled:false}));}catch{}}
 function localGermanVoice(){if(typeof speechSynthesis==='undefined')return null;let voices=[];try{voices=speechSynthesis.getVoices?.()||[];}catch{return null;}return voices.find(v=>v.localService===true && /^de([_-]|$)/i.test(v.lang))||null;}
 function available(){return typeof speechSynthesis!=='undefined' && typeof SpeechSynthesisUtterance!=='undefined' && !!localGermanVoice();}
 function configure(change){if(!change||typeof change!=='object')return status();for(const [key,v] of Object.entries(change)){if(!(key in initial))continue;if(key==='rate'){if(typeof v==='number'&&v>=.75&&v<=1.25)cfg.rate=v;}else if(typeof v==='boolean')cfg[key]=v;}if(cfg.enabled&&!available()){cfg.enabled=false;lastError='Keine nachweislich lokale deutsche Systemstimme verfügbar. Der Caller bleibt aus.';}if(!cfg.enabled)stop();save();return status();}
 function stop(){try{if(typeof speechSynthesis!=='undefined')speechSynthesis.cancel();}catch{}}
 function speak(text,type='score'){if(!cfg.enabled||!cfg[type==='score'?'announceScore':type==='winner'?'announceWinner':type==='180'?'announce180':'announceCheckout'])return false;
  const voice=localGermanVoice();if(!voice){cfg.enabled=false;lastError='Keine lokale deutsche Stimme vorhanden.';return false;}
  try{stop();const utterance=new SpeechSynthesisUtterance(String(text||'').slice(0,180));utterance.voice=voice;utterance.lang=voice.lang;utterance.rate=cfg.rate;utterance.volume=1;speechSynthesis.speak(utterance);return true;}catch{lastError='Sprachausgabe auf diesem Gerät nicht möglich.';return false;}
 }
 function status(){return {...cfg,available:available(),voice:localGermanVoice()?.name||null,error:lastError};}
 return {available,status,configure,speak,stop,localGermanVoice};
});
