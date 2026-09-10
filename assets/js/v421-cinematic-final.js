/* Nariyal Sutra V42.1 — natural harvest cinematic.
   Roughly 100 coconuts pass through the harvest in staggered waves; they never
   appear as a wall of stickers. One fruit remains, then the protected source/cut
   frames take over full-screen for the knife/open/water sequence.
*/
(function(){
'use strict';
if(window.__NS_V421_CINEMATIC_FINAL__)return;
window.__NS_V421_CINEMATIC_FINAL__=true;
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const smooth=v=>{v=clamp(v);return v*v*(3-2*v)};
const ease=v=>1-Math.pow(1-clamp(v),3);
const FRUIT='/assets/images/green-round-coconut.jpg';
const CUT_HERO='/assets/images/story-coconut-hero.png';
const CUT_BODY='/assets/images/story-coconut-body-cut.png';
const CUT_CAP='/assets/images/story-coconut-cap-cut.png';
const WATER='/assets/images/freshness-coconut-splash.webp';
const COUNT=100;
let raf=0;

function injectCss(){
 if($('#ns-v421-cinematic-final-style'))return;
 const s=document.createElement('style');s.id='ns-v421-cinematic-final-style';s.textContent=`
 @media(min-width:769px){
  #v20-story-film{height:235vh!important;min-height:235vh!important}
  #v20-story-film #v20-rain,#v20-story-film .v21-real-rain,#v20-story-film #v20-story-coconut,#v20-story-film .v20-knife,#v20-story-film .water-stream,#v20-story-film .splash-ring,#v20-story-film .v421-product-stage,#v20-story-film .v421-knife,#v20-story-film .v421-splash-field,#v20-story-film .v421-pour-frame{display:none!important;visibility:hidden!important}
  #v20-story-film .v421-final-stage{position:absolute;inset:0;z-index:30;overflow:hidden;pointer-events:none}
  #v20-story-film .v421-natural-rain{position:absolute;inset:0;z-index:2;overflow:hidden}
  #v20-story-film .v421-fall-coconut{position:absolute;left:0;top:0;width:var(--w);height:var(--h);opacity:0;will-change:transform,opacity;transform-origin:50% 40%;mix-blend-mode:multiply;filter:drop-shadow(0 10px 12px rgba(0,0,0,.25))}
  #v20-story-film .v421-fall-coconut img{display:block;width:100%;height:100%;object-fit:cover;object-position:center;clip-path:ellipse(34% 43% at 50% 50%);border:0;border-radius:0;filter:saturate(var(--sat,1.05)) brightness(var(--bri,1.18)) contrast(1.08)}
  #v20-story-film .v421-fall-coconut.tall img{clip-path:ellipse(30% 45% at 50% 50%)}
  #v20-story-film .v421-fall-coconut.depth-back{filter:blur(.45px) drop-shadow(0 7px 9px rgba(0,0,0,.2))}
  #v20-story-film .v421-selected-fruit{position:absolute;z-index:5;left:var(--sel-x,53%);top:var(--sel-y,49%);width:clamp(120px,12vw,175px);height:clamp(150px,15vw,215px);opacity:var(--sel-a,0);transform:translate(-50%,-50%) scale(var(--sel-s,.78)) rotate(var(--sel-r,-2deg));mix-blend-mode:multiply;filter:drop-shadow(0 25px 45px rgba(0,0,0,.42));will-change:transform,opacity,left,top}
  #v20-story-film .v421-selected-fruit img{width:100%;height:100%;display:block;object-fit:cover;clip-path:ellipse(34% 43% at 50% 50%);filter:saturate(1.08) brightness(1.2) contrast(1.09)}
  #v20-story-film .v421-cut-scene{position:absolute;inset:0;z-index:6;opacity:var(--cut-a,0);background:#061004;overflow:hidden;will-change:opacity}
  #v20-story-film .v421-cut-frame{position:absolute;inset:-1.5%;width:103%;height:103%;object-fit:cover;object-position:center;opacity:0;transform:scale(1.015);filter:saturate(.98) contrast(1.04) brightness(.82);will-change:opacity}
  #v20-story-film .v421-cut-frame.hero{opacity:var(--hero-a,0)}
  #v20-story-film .v421-cut-frame.body{opacity:var(--body-a,0)}
  #v20-story-film .v421-cut-frame.cap{opacity:var(--cap-a,0)}
  #v20-story-film .v421-cut-scene:after{content:'';position:absolute;inset:0;background:linear-gradient(90deg,rgba(2,8,1,.45),rgba(2,8,1,.06) 52%,rgba(2,8,1,.30)),linear-gradient(0deg,rgba(2,8,1,.48),transparent 48%)}
  #v20-story-film .v421-local-knife{position:absolute;z-index:9;left:var(--knife-x,58%);top:var(--knife-y,37%);width:clamp(135px,14vw,205px);height:30px;opacity:var(--knife-a,0);transform:translate(-50%,-50%) translateX(var(--knife-shift,-40px)) rotate(-10deg);filter:drop-shadow(0 8px 9px rgba(0,0,0,.45));will-change:opacity,transform}
  #v20-story-film .v421-local-knife .blade{position:absolute;left:0;top:7px;width:73%;height:16px;clip-path:polygon(0 20%,94% 0,100% 48%,92% 100%,0 82%);background:linear-gradient(180deg,#fbfcf9,#c5cdc8 43%,#6d7771 49%,#e1e5e2 72%,#828d87)}
  #v20-story-film .v421-local-knife .handle{position:absolute;right:0;top:3px;width:31%;height:24px;border-radius:4px 11px 11px 4px;background:linear-gradient(180deg,#744b2b,#2e1b0f)}
  #v20-story-film .v421-natural-splash{position:absolute;inset:0;z-index:10;overflow:hidden}
  #v20-story-film .v421-water-drop{position:absolute;left:var(--drop-x,60%);top:var(--drop-y,40%);width:var(--dw,7px);height:var(--dh,14px);opacity:0;border-radius:65% 35% 58% 42%/72% 45% 55% 28%;background:radial-gradient(circle at 35% 24%,rgba(255,255,255,.98) 0 10%,rgba(210,241,247,.82) 23%,rgba(105,185,205,.42) 56%,transparent 77%);will-change:transform,opacity}
  #v20-story-film .v421-water-finish{position:absolute;inset:0;z-index:8;opacity:var(--water-a,0);overflow:hidden;background:#041003;will-change:opacity}
  #v20-story-film .v421-water-finish img{position:absolute;inset:-2%;width:104%;height:104%;object-fit:cover;object-position:center 48%;filter:saturate(.97) contrast(1.05) brightness(.73);transform:scale(1.02)}
  #v20-story-film .v421-water-finish:after{content:'';position:absolute;inset:0;background:linear-gradient(90deg,rgba(2,8,1,.48),rgba(2,8,1,.05) 58%,rgba(2,8,1,.24)),linear-gradient(0deg,rgba(2,8,1,.46),transparent 55%)}
  #v20-story-film .v20-story-copy-cut{left:clamp(28px,5vw,76px)!important;width:min(535px,46vw)!important;transform:none!important;z-index:12!important}
  #v20-story-film .v20-story-copy-cut h2{font-size:clamp(38px,4.5vw,64px)!important;line-height:.96!important}
 }
 @media(max-width:768px){#v20-story-film .v421-final-stage{display:none!important}}
 @media(prefers-reduced-motion:reduce){#v20-story-film .v421-natural-rain,#v20-story-film .v421-local-knife,#v20-story-film .v421-natural-splash{display:none!important}}
 `;document.head.appendChild(s);
}

function build(){
 if(innerWidth<769||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 const film=$('#v20-story-film'),sticky=$('.v20-story-sticky',film);if(!film||!sticky)return;
 $$('.v421-final-stage',film).forEach(x=>x.remove());
 const stage=document.createElement('div');stage.className='v421-final-stage';stage.setAttribute('aria-hidden','true');
 stage.innerHTML=`<div class="v421-natural-rain"></div><div class="v421-selected-fruit"><img src="${FRUIT}" alt=""></div><div class="v421-cut-scene"><img class="v421-cut-frame hero" src="${CUT_HERO}" alt=""><img class="v421-cut-frame body" src="${CUT_BODY}" alt=""><img class="v421-cut-frame cap" src="${CUT_CAP}" alt=""></div><div class="v421-local-knife"><i class="blade"></i><i class="handle"></i></div><div class="v421-natural-splash"></div><div class="v421-water-finish"><img src="${WATER}" alt=""></div>`;
 sticky.appendChild(stage);
 const rain=$('.v421-natural-rain',stage),splash=$('.v421-natural-splash',stage),items=[];
 const anchors=[[8,8],[18,11],[31,6],[45,10],[60,7],[73,12],[86,8],[96,10]];
 for(let i=0;i<COUNT;i++){
  /* Ten small waves instead of seven dense batches: roughly 10–25 fruits are
     visible at a time, while the total harvest still reaches 100. */
  const wave=Math.floor(i/10),slot=i%10,anchor=anchors[(slot+wave*3)%anchors.length];
  const el=document.createElement('span'),size=36+((i*17)%34),start=.030+wave*.030+(slot%5)*.003+Math.floor(slot/5)*.007,dur=.078+((i%4)*.006);
  const x=anchor[0]+(((i*7)%9)-4),startY=anchor[1]+(((i*11)%8)-4),endY=76+((i*13)%42),drift=((i*19)%15)-7,rot=((i*23)%34)-17;
  el.className='v421-fall-coconut '+(i%4===0?'tall ':'')+(i%6===0?'depth-back':'depth-mid');el.style.setProperty('--w',size+'px');el.style.setProperty('--h',Math.round(size*(i%4===0?1.22:1.05))+'px');el.style.setProperty('--sat',String(.92+(i%5)*.055));el.style.setProperty('--bri',String(1.05+(i%4)*.045));
  el.innerHTML=`<img src="${FRUIT}" alt="" decoding="async">`;Object.assign(el.dataset,{start,dur,x,startY,endY,drift,rot});rain.appendChild(el);items.push(el);
 }
 const vectors=[[-90,-48],[-72,-82],[-48,-112],[-22,-135],[8,-145],[38,-126],[66,-100],[88,-70],[105,-38],[-112,-16],[118,-10],[0,-166]];
 splash.innerHTML=vectors.map((v,i)=>`<i class="v421-water-drop" data-vx="${v[0]}" data-vy="${v[1]}" data-i="${i}" style="--dw:${5+i%4}px;--dh:${11+i%5}px"></i>`).join('');
 const drops=$$('.v421-water-drop',splash),count=$('#v20-count-num');
 function progress(){const r=film.getBoundingClientRect(),range=Math.max(1,film.offsetHeight-innerHeight);return clamp(-r.top/range)}
 function update(){
  raf=0;const p=progress();let visible=0;
  items.forEach((el,i)=>{
   const st=+el.dataset.start,dur=+el.dataset.dur,t=clamp((p-st)/dur),e=ease(t),landing=smooth((t-.78)/.22);let a=t<=0||t>=1?0:Math.min(1,t/.10,(1-t)/.10);if(p>.39)a*=1-smooth((p-.39)/.035);if(a>.12)visible++;
   const x=+el.dataset.x+Math.sin(t*Math.PI)*(+el.dataset.drift),y=+el.dataset.startY+(+el.dataset.endY-(+el.dataset.startY))*e+landing*7,rot=+el.dataset.rot+t*(50+(i%5)*14);
   el.style.opacity=a.toFixed(4);el.style.transform=`translate3d(${x.toFixed(2)}vw,${y.toFixed(2)}vh,0) translate(-50%,-50%) rotate(${rot.toFixed(1)}deg) scale(${(.72+e*.28).toFixed(3)})`;
  });
  const rainProgress=clamp((p-.030)/.34);if(count&&p<.43)count.textContent=String(Math.min(100,Math.round(rainProgress*100))).padStart(2,'0');
  const selIn=smooth((p-.38)/.035),selOut=1-smooth((p-.535)/.035),travel=smooth((p-.405)/.09);film.style.setProperty('--sel-a',(selIn*selOut).toFixed(4));film.style.setProperty('--sel-x',(51+travel*8).toFixed(2)+'%');film.style.setProperty('--sel-y',(49+travel*3).toFixed(2)+'%');film.style.setProperty('--sel-s',(.76+travel*.16).toFixed(3));film.style.setProperty('--sel-r',(-3+travel*2).toFixed(2)+'deg');
  const cut=smooth((p-.50)/.035)*(1-smooth((p-.92)/.035));film.style.setProperty('--cut-a',cut.toFixed(4));
  const hero=smooth((p-.50)/.025)*(1-smooth((p-.625)/.025)),body=smooth((p-.605)/.025)*(1-smooth((p-.725)/.025)),cap=smooth((p-.695)/.025)*(1-smooth((p-.805)/.025));film.style.setProperty('--hero-a',hero.toFixed(4));film.style.setProperty('--body-a',body.toFixed(4));film.style.setProperty('--cap-a',cap.toFixed(4));
  const ki=smooth((p-.57)/.02)*(1-smooth((p-.675)/.025)),km=smooth((p-.575)/.075);film.style.setProperty('--knife-a',ki.toFixed(4));film.style.setProperty('--knife-x','59%');film.style.setProperty('--knife-y','37%');film.style.setProperty('--knife-shift',(-42+km*78).toFixed(1)+'px');
  const si=smooth((p-.70)/.025),st=smooth((p-.705)/.09),so=1-smooth((p-.835)/.035),sa=si*so;drops.forEach((d,i)=>{const e=ease(clamp((st-i*.017)/.82)),vx=+d.dataset.vx,vy=+d.dataset.vy;d.style.setProperty('--drop-x','61%');d.style.setProperty('--drop-y','39%');d.style.transform=`translate(-50%,-50%) translate(${(vx*e).toFixed(1)}px,${(vy*e+18*(1-e)).toFixed(1)}px) rotate(${i*21-65}deg) scale(${(.5+e*.75).toFixed(3)})`;d.style.opacity=(sa*(.55+(i%3)*.16)).toFixed(4)});
  const water=smooth((p-.79)/.04)*(1-smooth((p-.985)/.012));film.style.setProperty('--water-a',water.toFixed(4));
  window.__NS_V421_CINEMATIC_STATE={progress:p,visibleRain:visible,totalPassed:Math.min(100,Math.round(rainProgress*100)),selected:selIn*selOut,knife:ki,splash:sa,water};
 }
 function request(){if(!raf)raf=requestAnimationFrame(update)}
 addEventListener('scroll',request,{passive:true});addEventListener('resize',request,{passive:true});update();
 window.NSV421CinematicFinal={count:COUNT,update,version:'natural-waves-protected-cut'};
 if(/^(localhost|127\.0\.0\.1|\[::1\])$/i.test(location.hostname))window.NS_V421_BUILD='natural-waves-protected-cut-20260910';
}
function init(){injectCss();setTimeout(build,650)}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init,{once:true}):init();
})();
