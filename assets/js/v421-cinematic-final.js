/* Nariyal Sutra V42.1 — cinematic harvest rebuild.
   The visual sequence must read as a film, not as stickers over a photograph:
   grove canopy -> natural coconut fall/rain -> one selected fruit -> knife cut ->
   water burst toward camera -> full-screen water finish.
*/
(function(){
'use strict';
if(window.__NS_V421_CINEMATIC_FINAL__)return;
window.__NS_V421_CINEMATIC_FINAL__=true;

const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const smooth=v=>{v=clamp(v);return v*v*(3-2*v)};
const ease=v=>1-Math.pow(1-clamp(v),3);
const GROVE='/assets/images/nariyal-coconut-grove.webp';
const FRUIT='/assets/images/story-coconut-hero.png';
const CUT_HERO='/assets/images/story-coconut-hero.png';
const CUT_BODY='/assets/images/story-coconut-body-cut.png';
const CUT_CAP='/assets/images/story-coconut-cap-cut.png';
const WATER='/assets/images/freshness-coconut-splash.webp';
let raf=0;

function injectCss(){
 if($('#ns-v421-cinematic-final-style'))return;
 const s=document.createElement('style');
 s.id='ns-v421-cinematic-final-style';
 s.textContent=`
 #v20-story-film{position:relative!important;min-height:260vh!important;height:260vh!important;background:#020801!important}
 #v20-story-film #v20-rain,
 #v20-story-film .v21-real-rain,
 #v20-story-film #v20-story-coconut,
 #v20-story-film .v20-knife,
 #v20-story-film .water-stream,
 #v20-story-film .splash-ring,
 #v20-story-film .v421-product-stage,
 #v20-story-film .v421-knife,
 #v20-story-film .v421-splash-field,
 #v20-story-film .v421-pour-frame{display:none!important;visibility:hidden!important}
 #v20-story-film .v421-final-stage{position:absolute;inset:0;z-index:40;overflow:hidden;pointer-events:none;isolation:isolate;background:#020801}
 #v20-story-film .v421-grove-bg{position:absolute;inset:0;z-index:0;opacity:var(--grove-a,1);overflow:hidden;background:#041004}
 #v20-story-film .v421-grove-bg img{position:absolute;inset:-4%;width:108%;height:108%;object-fit:cover;object-position:center 42%;filter:saturate(1.08) contrast(1.06) brightness(.64);transform:scale(var(--grove-scale,1.03));will-change:transform}
 #v20-story-film .v421-grove-bg:after{content:'';position:absolute;inset:0;background:linear-gradient(90deg,rgba(1,7,1,.68),rgba(1,8,1,.08) 52%,rgba(1,7,1,.30)),linear-gradient(0deg,rgba(1,6,1,.62),transparent 52%),radial-gradient(circle at 50% 0,rgba(210,235,145,.10),transparent 37%)}
 #v20-story-film .v421-canopy-shade{position:absolute;left:-5%;right:-5%;top:-3%;height:28%;z-index:1;background:linear-gradient(180deg,rgba(0,0,0,.54),rgba(0,0,0,.08) 72%,transparent);filter:blur(.2px)}
 #v20-story-film .v421-natural-rain{position:absolute;inset:0;z-index:3;overflow:hidden}
 #v20-story-film .v421-fall-coconut{position:absolute;left:0;top:0;width:var(--w);height:var(--h);opacity:0;will-change:transform,opacity;transform-origin:50% 20%;filter:drop-shadow(0 16px 20px rgba(0,0,0,.42))}
 #v20-story-film .v421-fall-coconut img{display:block;width:100%;height:100%;object-fit:contain;border:0;filter:saturate(var(--sat,1.02)) brightness(var(--bri,.96)) contrast(1.04)}
 #v20-story-film .v421-fall-coconut.depth-back{filter:blur(.7px) drop-shadow(0 10px 14px rgba(0,0,0,.30));opacity:.86}
 #v20-story-film .v421-fall-coconut.depth-front{filter:drop-shadow(0 22px 30px rgba(0,0,0,.52))}
 #v20-story-film .v421-selected-fruit{position:absolute;z-index:6;left:var(--sel-x,54%);top:var(--sel-y,48%);width:clamp(205px,22vw,340px);height:clamp(280px,31vw,470px);opacity:var(--sel-a,0);transform:translate(-50%,-50%) scale(var(--sel-s,.72)) rotate(var(--sel-r,-3deg));filter:drop-shadow(0 36px 56px rgba(0,0,0,.62));will-change:transform,opacity,left,top}
 #v20-story-film .v421-selected-fruit img{display:block;width:100%;height:100%;object-fit:contain;filter:saturate(1.04) brightness(.98) contrast(1.04)}
 #v20-story-film .v421-cut-scene{position:absolute;inset:0;z-index:7;opacity:var(--cut-a,0);overflow:hidden;background:#020801;will-change:opacity}
 #v20-story-film .v421-cut-scene:before{content:'';position:absolute;inset:0;background:linear-gradient(90deg,rgba(1,7,1,.72),rgba(1,7,1,.16) 52%,rgba(1,7,1,.42)),url('${GROVE}') center 42%/cover no-repeat;filter:brightness(.50) saturate(.92) blur(.25px);transform:scale(1.045)}
 #v20-story-film .v421-cut-scene:after{content:'';position:absolute;inset:0;background:radial-gradient(circle at 61% 49%,rgba(235,211,139,.10),transparent 26%),linear-gradient(0deg,rgba(0,0,0,.48),transparent 55%)}
 #v20-story-film .v421-cut-coconut{position:absolute;z-index:3;left:61%;top:50%;width:clamp(250px,29vw,455px);height:clamp(345px,40vw,625px);transform:translate(-50%,-50%);filter:drop-shadow(0 45px 70px rgba(0,0,0,.64));will-change:opacity,transform}
 #v20-story-film .v421-cut-coconut img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;filter:saturate(1.04) contrast(1.04) brightness(.98);will-change:opacity,transform}
 #v20-story-film .v421-cut-whole{opacity:var(--whole-a,1)}
 #v20-story-film .v421-cut-body{opacity:var(--body-a,0)}
 #v20-story-film .v421-cut-cap{opacity:var(--cap-a,0);transform:translate(var(--cap-x,0),var(--cap-y,0)) rotate(var(--cap-r,0deg)) scale(var(--cap-s,1));transform-origin:55% 36%}
 #v20-story-film .v421-local-knife{position:absolute;z-index:12;left:var(--knife-x,78%);top:var(--knife-y,36%);width:clamp(340px,38vw,590px)!important;height:86px!important;opacity:var(--knife-a,0);transform:translate(-50%,-50%) translate3d(var(--knife-shift,220px),var(--knife-drop,-70px),0) rotate(var(--knife-r,-16deg));filter:drop-shadow(0 18px 22px rgba(0,0,0,.66));will-change:opacity,transform}
 #v20-story-film .v421-local-knife .blade{position:absolute;left:0;top:22px;width:73%;height:45px!important;clip-path:polygon(0 24%,90% 3%,100% 40%,94% 78%,0 90%);background:linear-gradient(180deg,#ffffff 0%,#d8dfdc 30%,#8b9691 47%,#f7f9f7 53%,#a4aea8 72%,#606a65 100%);box-shadow:inset 0 1px rgba(255,255,255,.9),inset 0 -2px rgba(35,43,39,.35)}
 #v20-story-film .v421-local-knife .blade:after{content:'';position:absolute;left:8%;right:8%;top:45%;height:1px;background:rgba(255,255,255,.72)}
 #v20-story-film .v421-local-knife .handle{position:absolute;right:0;top:13px;width:32%;height:63px!important;border-radius:7px 22px 22px 7px;background:linear-gradient(180deg,#8a5c33 0%,#4d2d18 42%,#21130b 100%);box-shadow:inset 0 0 0 2px rgba(255,210,142,.12)}
 #v20-story-film .v421-natural-splash{position:absolute;inset:0;z-index:14;overflow:hidden}
 #v20-story-film .v421-water-drop{position:absolute;left:61%;top:43%;width:var(--dw,10px);height:var(--dh,24px);opacity:0;border-radius:62% 38% 58% 42%/72% 46% 54% 28%;background:radial-gradient(circle at 32% 22%,rgba(255,255,255,.98) 0 8%,rgba(213,245,251,.95) 19%,rgba(105,194,214,.74) 48%,rgba(42,122,148,.38) 68%,transparent 78%);filter:drop-shadow(0 4px 6px rgba(0,0,0,.22));will-change:transform,opacity}
 #v20-story-film .v421-splash-camera{position:absolute;inset:-3%;z-index:13;opacity:var(--splash-photo-a,0);clip-path:circle(var(--splash-r,0vmax) at 61% 43%);will-change:clip-path,opacity,transform;transform:scale(var(--splash-scale,1.18))}
 #v20-story-film .v421-splash-camera img{width:106%;height:106%;object-fit:cover;object-position:center 47%;filter:saturate(1.12) contrast(1.04) brightness(.95)}
 #v20-story-film .v421-water-finish{position:absolute;inset:0;z-index:15;opacity:var(--water-a,0);overflow:hidden;background:#d9f3f6;will-change:opacity}
 #v20-story-film .v421-water-finish img{position:absolute;inset:-4%;width:108%;height:108%;object-fit:cover;object-position:center 48%;filter:saturate(1.14) contrast(1.03) brightness(1.02);transform:scale(var(--water-scale,1.13));will-change:transform}
 #v20-story-film .v421-water-finish:after{content:'';position:absolute;inset:0;background:radial-gradient(circle at 50% 42%,rgba(255,255,255,.15),transparent 28%),linear-gradient(180deg,rgba(225,249,252,.10),rgba(26,103,126,.10))}
 #v20-story-film .v20-story-copy-cut{z-index:20!important}
 @media(max-width:980px){
  #v20-story-film{height:225vh!important;min-height:225vh!important}
  #v20-story-film .v421-cut-coconut{left:57%;width:clamp(205px,46vw,360px);height:clamp(285px,64vw,500px)}
  #v20-story-film .v421-local-knife{width:clamp(270px,62vw,430px)!important;height:68px!important}
  #v20-story-film .v421-local-knife .blade{height:35px!important;top:17px}
  #v20-story-film .v421-local-knife .handle{height:50px!important;top:10px}
 }
 @media(max-width:640px){
  #v20-story-film{height:205vh!important;min-height:205vh!important}
  #v20-story-film .v421-selected-fruit{width:170px;height:235px}
  #v20-story-film .v421-cut-coconut{left:54%;top:52%;width:195px;height:270px}
  #v20-story-film .v421-local-knife{width:285px!important;height:62px!important;left:72%!important;top:39%!important}
 }
 @media(prefers-reduced-motion:reduce){#v20-story-film .v421-natural-rain,#v20-story-film .v421-local-knife,#v20-story-film .v421-natural-splash{display:none!important}}
 `;
 document.head.appendChild(s);
}

function build(){
 if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 const film=$('#v20-story-film');
 const sticky=$('.v20-story-sticky',film);
 if(!film||!sticky)return;
 $$('.v421-final-stage',film).forEach(x=>x.remove());
 const mobile=innerWidth<=640;
 const tablet=innerWidth>640&&innerWidth<=980;
 const total=mobile?36:(tablet?60:100);
 const stage=document.createElement('div');
 stage.className='v421-final-stage';
 stage.setAttribute('aria-hidden','true');
 stage.innerHTML=`
   <div class="v421-grove-bg"><img src="${GROVE}" alt=""></div>
   <div class="v421-canopy-shade"></div>
   <div class="v421-natural-rain"></div>
   <div class="v421-selected-fruit"><img src="${FRUIT}" alt=""></div>
   <div class="v421-cut-scene">
     <div class="v421-cut-coconut">
       <img class="v421-cut-whole" src="${CUT_HERO}" alt="">
       <img class="v421-cut-body" src="${CUT_BODY}" alt="">
       <img class="v421-cut-cap" src="${CUT_CAP}" alt="">
     </div>
   </div>
   <div class="v421-local-knife"><i class="blade"></i><i class="handle"></i></div>
   <div class="v421-natural-splash"></div>
   <div class="v421-splash-camera"><img src="${WATER}" alt=""></div>
   <div class="v421-water-finish"><img src="${WATER}" alt=""></div>`;
 sticky.appendChild(stage);

 const rain=$('.v421-natural-rain',stage);
 const splash=$('.v421-natural-splash',stage);
 const cutCap=$('.v421-cut-cap',stage);
 const items=[];
 const anchors=[[7,5],[15,11],[24,6],[34,13],[45,7],[55,12],[65,5],[75,11],[85,7],[94,12]];
 const perWave=mobile?6:10;
 const waves=Math.ceil(total/perWave);
 for(let i=0;i<total;i++){
   const wave=Math.floor(i/perWave),slot=i%perWave,anchor=anchors[(slot+wave*3)%anchors.length];
   const el=document.createElement('span');
   const depth=i%7;
   const size=(mobile?42:54)+((i*19)%(mobile?40:78));
   const start=.020+wave*(mobile?.045:.026)+(slot%5)*.0025;
   const dur=(mobile?.145:.125)+((i%4)*.008);
   const x=anchor[0]+(((i*7)%7)-3);
   const startY=anchor[1]+(((i*11)%7)-3);
   const endY=86+((i*13)%33);
   const drift=((i*17)%11)-5;
   const rot=((i*23)%26)-13;
   el.className='v421-fall-coconut '+(depth===0?'depth-back ':(depth>=5?'depth-front ':'depth-mid '));
   el.style.setProperty('--w',size+'px');
   el.style.setProperty('--h',Math.round(size*1.32)+'px');
   el.style.setProperty('--sat',String(.94+(i%5)*.03));
   el.style.setProperty('--bri',String(.91+(i%4)*.025));
   el.innerHTML=`<img src="${FRUIT}" alt="" decoding="async">`;
   Object.assign(el.dataset,{start,dur,x,startY,endY,drift,rot});
   rain.appendChild(el);items.push(el);
 }

 const vectors=[];
 for(let i=0;i<(mobile?18:34);i++){
   const a=(Math.PI*2*i)/(mobile?18:34)+(i%3)*.08;
   const d=80+(i%6)*28;
   vectors.push([Math.cos(a)*d,Math.sin(a)*d-45]);
 }
 splash.innerHTML=vectors.map((v,i)=>`<i class="v421-water-drop" data-vx="${v[0].toFixed(1)}" data-vy="${v[1].toFixed(1)}" data-i="${i}" style="--dw:${7+i%6}px;--dh:${16+i%9}px"></i>`).join('');
 const drops=$$('.v421-water-drop',splash);
 const count=$('#v20-count-num');

 function progress(){
   const r=film.getBoundingClientRect();
   const range=Math.max(1,film.offsetHeight-innerHeight);
   return clamp(-r.top/range);
 }

 function update(){
   raf=0;
   const p=progress();
   let visible=0;
   items.forEach((el,i)=>{
     const st=+el.dataset.start,dur=+el.dataset.dur,t=clamp((p-st)/dur);
     const hold=clamp(t/.16),drop=clamp((t-.10)/.90),g=drop*drop;
     let a=t<=0||t>=1?0:Math.min(1,t/.08,(1-t)/.10);
     if(p>.43)a*=1-smooth((p-.43)/.045);
     if(a>.12)visible++;
     const sway=Math.sin(drop*Math.PI*1.1)*(+el.dataset.drift);
     const x=+el.dataset.x+sway;
     const y=+el.dataset.startY+(+el.dataset.endY-(+el.dataset.startY))*g;
     const rot=+el.dataset.rot+drop*(55+(i%5)*16);
     const scale=.82+hold*.12+drop*.14;
     el.style.opacity=a.toFixed(4);
     el.style.transform=`translate3d(${x.toFixed(2)}vw,${y.toFixed(2)}vh,0) translate(-50%,-20%) rotate(${rot.toFixed(1)}deg) scale(${scale.toFixed(3)})`;
   });

   const rainProgress=clamp((p-.02)/.38);
   if(count&&p<.46)count.textContent=String(Math.min(100,Math.round(rainProgress*100))).padStart(2,'0');
   film.style.setProperty('--grove-scale',(1.03+p*.025).toFixed(3));

   const selIn=smooth((p-.34)/.045),selOut=1-smooth((p-.50)/.04),travel=smooth((p-.37)/.10);
   const selected=selIn*selOut;
   film.style.setProperty('--sel-a',selected.toFixed(4));
   film.style.setProperty('--sel-x',(51+travel*10).toFixed(2)+'%');
   film.style.setProperty('--sel-y',(45+travel*5).toFixed(2)+'%');
   film.style.setProperty('--sel-s',(.70+travel*.34).toFixed(3));
   film.style.setProperty('--sel-r',(-6+travel*7).toFixed(2)+'deg');

   const cut=smooth((p-.455)/.04)*(1-smooth((p-.94)/.035));
   film.style.setProperty('--cut-a',cut.toFixed(4));
   film.style.setProperty('--grove-a',(1-smooth((p-.46)/.055)*.54).toFixed(4));

   const knifeIn=smooth((p-.545)/.018),knifeOut=1-smooth((p-.675)/.035),knife=knifeIn*knifeOut;
   const knifeMove=smooth((p-.55)/.10);
   film.style.setProperty('--knife-a',knife.toFixed(4));
   film.style.setProperty('--knife-x','69%');
   film.style.setProperty('--knife-y',(34+knifeMove*10).toFixed(2)+'%');
   film.style.setProperty('--knife-shift',(220-knifeMove*420).toFixed(1)+'px');
   film.style.setProperty('--knife-drop',(-78+knifeMove*116).toFixed(1)+'px');
   film.style.setProperty('--knife-r',(-17+knifeMove*15).toFixed(1)+'deg');

   const opened=smooth((p-.635)/.035);
   const whole=1-opened;
   const body=opened*(1-smooth((p-.90)/.035));
   const cap=opened*(1-smooth((p-.82)/.05));
   film.style.setProperty('--whole-a',whole.toFixed(4));
   film.style.setProperty('--body-a',body.toFixed(4));
   film.style.setProperty('--cap-a',cap.toFixed(4));
   const capMove=smooth((p-.64)/.12);
   if(cutCap){
     cutCap.style.setProperty('--cap-x',(capMove*135).toFixed(1)+'px');
     cutCap.style.setProperty('--cap-y',(-capMove*120).toFixed(1)+'px');
     cutCap.style.setProperty('--cap-r',(capMove*28).toFixed(1)+'deg');
     cutCap.style.setProperty('--cap-s',(1-capMove*.10).toFixed(3));
   }

   const splashIn=smooth((p-.69)/.028),splashOut=1-smooth((p-.865)/.035),splash=splashIn*splashOut;
   const splashTravel=smooth((p-.695)/.115);
   drops.forEach((d,i)=>{
     const stagger=clamp((splashTravel-i*.007)/.78),e=ease(stagger),vx=+d.dataset.vx,vy=+d.dataset.vy;
     d.style.transform=`translate(-50%,-50%) translate(${(vx*e).toFixed(1)}px,${(vy*e+20*(1-e)).toFixed(1)}px) rotate(${i*19-80}deg) scale(${(.55+e*1.15).toFixed(3)})`;
     d.style.opacity=(splash*(.54+(i%4)*.12)).toFixed(4);
   });
   const splashPhoto=smooth((p-.735)/.045)*(1-smooth((p-.88)/.035));
   film.style.setProperty('--splash-photo-a',splashPhoto.toFixed(4));
   film.style.setProperty('--splash-r',(smooth((p-.735)/.12)*145).toFixed(1)+'vmax');
   film.style.setProperty('--splash-scale',(1.20-smooth((p-.735)/.12)*.17).toFixed(3));

   const water=smooth((p-.815)/.055);
   film.style.setProperty('--water-a',water.toFixed(4));
   film.style.setProperty('--water-scale',(1.13-water*.11).toFixed(3));

   window.__NS_V421_CINEMATIC_STATE={
     progress:p,
     visibleRain:visible,
     totalPassed:Math.min(100,Math.round(rainProgress*100)),
     selected,
     knife,
     splash,
     water,
     naturalFruitAsset:FRUIT,
     groveSource:GROVE,
     totalFruit:total
   };
 }

 function request(){if(!raf)raf=requestAnimationFrame(update)}
 addEventListener('scroll',request,{passive:true});
 addEventListener('resize',request,{passive:true});
 update();
 window.NSV421CinematicFinal={count:total,update,version:'grove-rain-knife-water-v2'};
}

function init(){injectCss();setTimeout(build,450)}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init,{once:true}):init();
})();
