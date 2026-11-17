/* Darts-Club 3.6.1 · unified mobile gameplay focus. Presentation only: no state writes. */
(function(){'use strict';
 const definitions={
  juergen:{panel:'juergenFocusPanel',view:'play',open:'juergenFocusEnter',close:'juergenFocusExit',valid:()=>true},
  team:{panel:'clubTeamFocusPanel',view:'club',open:'clubTeamFocusEnter',close:'clubTeamFocusExit',valid:()=>!!document.querySelector('#clubBoard .club-teams-board')},
  training:{panel:'proTrainingFocusPanel',view:'pro',open:'proTrainingFocusEnter',close:'proTrainingFocusExit',valid:()=>!!document.querySelector('#proTrainingActive .pro-training-top')},
  live:{panel:'liveGuestGame',view:'live',open:'liveGuestPlayFocusEnter',close:'liveGuestPlayFocusExit',valid:()=>!document.getElementById('liveGuestPanel')?.hidden&&!document.getElementById('liveGuestGame')?.hidden&&!document.getElementById('liveGuestPad')?.hidden&&!document.body.classList.contains('dart-spectator-on')}
 };
 const $=id=>document.getElementById(id);
 let active=null,priorFocus=null,scrollY=0;
 function valid(id){try{return !!definitions[id]?.valid();}catch{return false;}}
 function sync(){
  if(active&&!valid(active)){exit();}
  for(const [id,def] of Object.entries(definitions)){
   const enter=$(def.open),close=$(def.close);if(enter)enter.hidden=id===active||!valid(id);
   if(close)close.hidden=id!==active;
  }
 }
 function enter(id){const def=definitions[id];if(!def||!valid(id))return false;
  if(active===id)return true;
  exit();
  // Prevent any older standard game overlay from obscuring the new focused panel.
  window.DartsGameUI?.exitFocus?.();
  if(document.body.classList.contains('dart-spectator-on')){document.body.classList.remove('dart-spectator-on');}
  const panel=$(def.panel);if(!panel)return false;
  scrollY=window.scrollY;priorFocus=document.activeElement;
  active=id;panel.classList.add('all-focus-active');panel.setAttribute('role','region');panel.setAttribute('aria-label',id==='juergen'?'Jürgen im Vollbild':id==='team'?'Teamduell im Vollbild':id==='training'?'Training im Vollbild':'Mitspielen im Vollbild');
  document.documentElement.classList.add('dart-all-focus-on');document.body.classList.add('dart-all-focus-on');
  document.body.dataset.focusKind=id;
  sync();$(def.close)?.focus({preventScroll:true});return true;
 }
 function exit(){if(!active)return;
  const def=definitions[active],panel=$(def.panel);if(panel){panel.classList.remove('all-focus-active');panel.removeAttribute('role');panel.removeAttribute('aria-label');}
  active=null;document.documentElement.classList.remove('dart-all-focus-on');document.body.classList.remove('dart-all-focus-on');delete document.body.dataset.focusKind;
  sync();
  if(priorFocus?.isConnected&&typeof priorFocus.focus==='function')try{priorFocus.focus({preventScroll:true});}catch{}
  priorFocus=null;try{window.scrollTo(0,scrollY);}catch{}
 }
 document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
  if(b.hasAttribute('data-all-focus-exit')){exit();return;}
  const id=b.dataset.allFocusEnter;if(id)enter(id);
 });
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&active){e.preventDefault();exit();}});
 window.addEventListener('pagehide',exit);
 window.DartAllFocus={enter,exit,sync,current:()=>active};
 // Defer until the first app render has created the dynamic team/training DOM.
 document.addEventListener('DOMContentLoaded',sync,{once:true});
})();
