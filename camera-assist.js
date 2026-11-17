/* JÜRGEN DARTKASSE – lokale Foto-Kalibrierung v3.1.0. Keine automatische Erkennung. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const numbers=[20,1,18,4,13,6,10,15,2,17,3,19,7,16,8,11,14,9,12,5];
let canvas,ctx,img,phase=0,center=null,radius=0,topAngle=0,mark=null,candidate=null;
const TWO=Math.PI*2;
function status(s){const el=$('cameraAssistStatus');if(el)el.textContent=s;}
function distance(a,b){return Math.hypot(a.x-b.x,a.y-b.y);}
function angle(c,t){return Math.atan2(t.x-c.x,c.y-t.y);}
function inRange(n,a,b){return n>=a&&n<=b;}
function reset(){phase=0;center=null;radius=0;topAngle=0;mark=null;candidate=null;draw();status('1. Zuerst den Mittelpunkt des Bulls auf dem Foto antippen.');$('cameraAssistConfirm').disabled=true;}
function detect(t){
 const rel=distance(t,center)/radius;
 if(rel>1)return {n:0,m:0,label:'Miss – außerhalb der Doppelringkante'};
 if(rel<0.037)return {n:25,m:2,label:'Bullseye · 50'};
 if(rel<0.094)return {n:25,m:1,label:'Single Bull · 25'};
 let a=(angle(center,t)-topAngle+TWO)%TWO;
 const index=Math.floor((a+Math.PI/20)/(Math.PI/10))%20;
 const n=numbers[index];
 const m=inRange(rel,0.953,1)?2:inRange(rel,0.582,0.629)?3:1;
 const d={n,m,label:`${m===1?'Single':m===2?'Double':'Triple'} ${n} · ${n*m} Punkte`};
 return d;
}
function draw(){if(!canvas||!ctx||!img?.complete||!img.naturalWidth)return;
 const maxWidth=900;const w=Math.min(img.naturalWidth,maxWidth),h=Math.round(w*img.naturalHeight/img.naturalWidth);
 if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
 ctx.clearRect(0,0,w,h);ctx.drawImage(img,0,0,w,h);
 if(center){ctx.strokeStyle='#69f6e5';ctx.lineWidth=Math.max(2,w/300);for(const r of radius?[0.037,0.094,0.582,0.629,0.953,1]:[0.03]){ctx.beginPath();ctx.arc(center.x,center.y,radius?radius*r:9,0,TWO);ctx.stroke();}}
 if(center&&radius){ctx.strokeStyle='#e5c67177';ctx.lineWidth=1;for(let k=0;k<20;k++){const a=topAngle+(k-.5)*TWO/20;ctx.beginPath();ctx.moveTo(center.x+radius*0.095*Math.sin(a),center.y-radius*0.095*Math.cos(a));ctx.lineTo(center.x+radius*Math.sin(a),center.y-radius*Math.cos(a));ctx.stroke();}}
 if(mark){ctx.fillStyle='#f9dc82';ctx.strokeStyle='#1c2332';ctx.lineWidth=3;ctx.beginPath();ctx.arc(mark.x,mark.y,8,0,TWO);ctx.fill();ctx.stroke();}
}
function tap(ev){if(!img?.naturalWidth)return;ev.preventDefault();const box=canvas.getBoundingClientRect();const t={x:(ev.clientX-box.left)*canvas.width/box.width,y:(ev.clientY-box.top)*canvas.height/box.height};
 if(phase===0){center=t;phase=1;mark=t;draw();status('2. Jetzt den Mittelpunkt des äußeren Doppel-20-Rings oben antippen.');return;}
 if(phase===1){const r=distance(t,center)/0.976;if(r<canvas.width*0.06){status('Kalibrierpunkt zu nah am Bull. Bitte erneut D20 oben antippen.');return;}radius=r;topAngle=angle(center,t);phase=2;mark=t;draw();status('3. Nun den Einschlagpunkt eines Darts antippen. Das Ergebnis vor Übernahme prüfen.');return;}
 mark=t;candidate=detect(t);$('cameraAssistConfirm').disabled=false;status(`Vorschlag: ${candidate.label}. Nur bei korrekter Anzeige „Ins Spiel übernehmen“ tippen.`);draw();
}
function confirmDart(){if(!candidate)return;const {n,m}=candidate;
 if(!confirm(`${candidate.label} zur aktuellen Dart-Aufnahme hinzufügen? Der Wurf wird erst durch „Nächster Spieler“ gebucht.`))return;
 if(window.DartsGameUI?.stagePhotoDart({n,m})){status('Übernommen. Im Spiel den Treffer prüfen und die Aufnahme bestätigen.');}
 else status('Keine aktive Partie verfügbar oder bereits drei Darts erfasst.');
}
function loadImage(){img=$('proCameraPreview');if(!img)return;img.hidden=true;canvas.hidden=false;reset();if(img.complete&&img.naturalWidth)draw();}
function init(){canvas=$('cameraAssistCanvas');if(!canvas)return;ctx=canvas.getContext('2d');img=$('proCameraPreview');img?.addEventListener('load',loadImage);canvas.addEventListener('pointerup',tap);$('cameraAssistReset').addEventListener('click',reset);$('cameraAssistConfirm').addEventListener('click',confirmDart);$('cameraAssistConfirm').disabled=true;}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
window.DartCameraAssist={init,loadImage,detectPoint:(point,calibration)=>{const saved={center,radius,topAngle};center=calibration.center;radius=calibration.radius;topAngle=calibration.topAngle;const result=detect(point);center=saved.center;radius=saved.radius;topAngle=saved.topAngle;return result;}};
})();
