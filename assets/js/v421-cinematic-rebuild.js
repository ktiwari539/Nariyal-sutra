(()=>{
'use strict';
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const smooth=t=>{t=clamp(t);return t*t*(3-2*t)};
const FILM_ID='v421-story-film';
function injectStyle(){
 if(document.getElementById('v421-cinematic-rebuild-style')) return;
 const s=document.createElement('style');
 s.id='v421-cinematic-rebuild-style';
 s.textContent=`
#${FILM_ID}{position:relative;height:620vh!important;background:#020902!important;overflow:visible!important}
#${FILM_ID} .v421-cine-stage{position:sticky;top:0;height:100svh;overflow:hidden;background:#020902;isolation:isolate}
#${FILM_ID} .v421-cine-bg{position:absolute;inset:-2%;width:104%;height:104%;object-fit:cover;object-position:center 44%;filter:saturate(1.02) contrast(1.06) brightness(.64);transform:scale(1.03);z-index:0}
#${FILM_ID} .v421-cine-shade{position:absolute;inset:0;z-index:1;background:linear-gradient(90deg,rgba(2,8,1,.52),rgba(2,8,1,.05) 55%,rgba(2,8,1,.26)),linear-gradient(0deg,rgba(1,7,1,.56),transparent 50%);pointer-events:none}
#${FILM_ID} .v421-canopy{position:absolute;left:0;right:0;top:0;height:32vh;z-index:3;pointer-events:none;background:linear-gradient(180deg,rgba(3,18,4,.86),rgba(3,18,4,.18) 78%,transparent)}
#${FILM_ID} .v421-rain{position:absolute;inset:0;z-index:5;pointer-events:none}
#${FILM_ID} .v421-nut{position:absolute;left:var(--x);top:var(--y);width:var(--size);aspect-ratio:.82/1;transform:translate(-50%,-50%) rotate(var(--rot)) scale(var(--scale));transform-origin:center;opacity:var(--a);filter:drop-shadow(0 16px 18px rgba(0,0,0,.28)) blur(var(--blur));will-change:transform,opacity}
#${FILM_ID} .v421-nut img{width:100%;height:100%;object-fit:contain;display:block}
#${FILM_ID} .v421-hero-wrap{position:absolute;inset:0;z-index:8;pointer-events:none;opacity:var(--hero-a,0)}
#${FILM_ID} .v421-hero-coconut{position:absolute;left:50%;top:52%;width:min(29vw,390px);transform:translate(-50%,-50%) scale(var(--hero-scale,1));filter:drop-shadow(0 34px 38px rgba(0,0,0,.42));will-change:transform,opacity}
#${FILM_ID} .v421-cut-body,#${FILM_ID} .v421-cut-cap{position:absolute;left:50%;top:52%;width:min(29vw,390px);transform:translate(-50%,-50%);opacity:0;filter:drop-shadow(0 34px 38px rgba(0,0,0,.42))}
#${FILM_ID} .v421-knife{position:absolute;left:62%;top:42%;width:min(38vw,520px);height:72px;z-index:11;opacity:var(--knife-a,0);transform:translate(-50%,-50%) translateX(var(--knife-x,220px)) rotate(-22deg);transform-origin:15% 50%;filter:drop-shadow(0 18px 22px rgba(0,0,0,.4));will-change:transform,opacity}
#${FILM_ID} .v421-knife::before{content:'';position:absolute;left:0;top:19px;width:76%;height:34px;border-radius:5px 50% 50% 5px;background:linear-gradient(180deg,#f5f1e8 0%,#aeb5b2 46%,#5c6461 50%,#e7e2d8 100%);clip-path:polygon(0 15%,92% 0,100% 50%,92% 100%,0 85%);box-shadow:inset 0 1px 0 rgba(255,255,255,.8)}
#${FILM_ID} .v421-knife::after{content:'';position:absolute;right:0;top:16px;width:27%;height:42px;border-radius:14px;background:linear-gradient(90deg,#3a2719,#18110d 58%,#4b3421);box-shadow:0 5px 10px rgba(0,0,0,.45)}
#${FILM_ID} .v421-splash{position:absolute;left:50%;top:50%;z-index:13;width:min(96vw,1400px);opacity:var(--splash-a,0);transform:translate(-50%,-50%) scale(var(--splash-scale,.72));mix-blend-mode:screen;filter:saturate(.92) brightness(1.12);pointer-events:none;will-change:transform,opacity}
#${FILM_ID} .v421-water{position:absolute;inset:-10%;z-index:14;opacity:var(--water-a,0);transform:scale(var(--water-scale,.72));background:radial-gradient(circle at 50% 48%,rgba(232,255,250,.96),rgba(150,224,221,.94) 25%,rgba(70,168,175,.95) 47%,rgba(14,88,107,.98) 76%,rgba(3,37,53,1));filter:blur(var(--water-blur,0px));pointer-events:none;will-change:transform,opacity}
#${FILM_ID} .v421-water::before,#${FILM_ID} .v421-water::after{content:'';position:absolute;inset:-12%;background:radial-gradient(ellipse at 40% 45%,transparent 0 16%,rgba(255,255,255,.24) 17% 19%,transparent 20% 27%,rgba(255,255,255,.13) 28% 31%,transparent 32%);transform:rotate(-12deg) scale(1.3);mix-blend-mode:screen}
#${FILM_ID} .v421-water::after{transform:rotate(17deg) scale(1.55);opacity:.58}
#${FILM_ID} .v421-title{position:absolute;left:clamp(28px,6vw,110px);top:clamp(120px,18vh,180px);z-index:7;max-width:650px;color:#fff;opacity:var(--copy-a,1);pointer-events:none}
#${FILM_ID} .v421-title .eyebrow{font:600 11px/1.3 Jost,sans-serif;letter-spacing:6px;text-transform:uppercase;color:#d7ad42;margin-bottom:24px}
#${FILM_ID} .v421-title h2{font:400 clamp(54px,6vw,112px)/.92 'Playfair Display',serif;margin:0;color:#f7f4e9}
#${FILM_ID} .v421-title h2 em{display:block;color:#d7ad42;font-weight:400}
#${FILM_ID} .v421-title p{max-width:590px;margin-top:26px;font:400 15px/1.75 Jost,sans-serif;letter-spacing:1.8px;text-transform:uppercase;color:rgba(255,255,255,.72)}
#${FILM_ID} .v421-stage-label{position:absolute;right:36px;bottom:30px;z-index:15;font:600 9px/1 Jost,sans-serif;letter-spacing:3px;text-transform:uppercase;color:rgba(255,255,255,.68)}
#${FILM_ID} .v421-dark-reset{display:none!important}
@media(max-width:980px){#${FILM_ID}{height:440vh!important}#${FILM_ID} .v421-title{left:22px;right:22px;top:110px}#${FILM_ID} .v421-title h2{font-size:clamp(48px,13vw,78px)}#${FILM_ID} .v421-hero-coconut,#${FILM_ID} .v421-cut-body,#${FILM_ID} .v421-cut-cap{width:min(58vw,330px)}#${FILM_ID} .v421-knife{width:min(68vw,430px)}}
@media(prefers-reduced-motion:reduce){#${FILM_ID}{height:auto!important}#${FILM_ID} .v421-cine-stage{position:relative;height:92svh}#${FILM_ID} .v421-rain,#${FILM_ID} .v421-knife,#${FILM_ID} .v421-splash,#${FILM_ID} .v421-water{display:none!important}}
`;
 document.head.appendChild(s);
}
function build(){
 const film=document.getElementById(FILM_ID);
 if(!film||film.dataset.rebuilt==='1') return;
 film.dataset.rebuilt='1';
 const existing=[...film.children]; existing.forEach(el=>el.style.display='none');
 film.innerHTML=`<div class="v421-cine-stage"><img class="v421-cine-bg" src="assets/images/review/coastal-grove.png" alt="Coconut grove"><div class="v421-cine-shade"></div><div class="v421-canopy"></div><div class="v421-rain"></div><div class="v421-title"><div class="eyebrow">Chapter 01 · The harvest</div><h2>From the trees,<em>into the moment.</em></h2><p>Natural coconuts release from the canopy, one fruit is selected, cut fresh, and the water becomes the transition.</p></div><div class="v421-hero-wrap"><img class="v421-hero-coconut" src="assets/images/story-coconut-hero.png" alt="Selected coconut"><img class="v421-cut-body" src="assets/images/story-coconut-body-cut.png" alt="Fresh-cut coconut"><img class="v421-cut-cap" src="assets/images/story-coconut-cap-cut.png" alt="Coconut cap"></div><div class="v421-knife"></div><img class="v421-splash" src="assets/images/freshness-coconut-splash.webp" alt="Coconut water splash"><div class="v421-water"></div><div class="v421-stage-label">Harvest film</div></div>`;
 const stage=film.querySelector('.v421-cine-stage'), rain=film.querySelector('.v421-rain'), hero=film.querySelector('.v421-hero-coconut'), body=film.querySelector('.v421-cut-body'), cap=film.querySelector('.v421-cut-cap'), knife=film.querySelector('.v421-knife'), splash=film.querySelector('.v421-splash'), water=film.querySelector('.v421-water'), title=film.querySelector('.v421-title');
 const nuts=[];
 const count=96;
 for(let i=0;i<count;i++){
  const d=document.createElement('div'); d.className='v421-nut';
  const lane=(i%12)/11, wave=Math.floor(i/12), depth=(i%5)/4;
  d.dataset.x=(7+lane*86 + ((wave%2)?2.6:-2.2)).toFixed(2);
  d.dataset.wave=wave; d.dataset.depth=depth;
  d.dataset.spin=(-28+(i*37)%56).toFixed(1);
  d.innerHTML='<img src="assets/images/story-coconut-hero.png" alt="">'; rain.appendChild(d); nuts.push(d);
 }
 let raf=0;
 function update(){raf=0;const r=film.getBoundingClientRect(),range=Math.max(1,film.offsetHeight-innerHeight),p=clamp(-r.top/range); 
  const rainP=clamp(p/.43); nuts.forEach((n,i)=>{const wave=+n.dataset.wave,depth=+n.dataset.depth,start=.018*wave,end=start+.30+.025*depth,t=clamp((rainP-start)/(end-start)); const e=t*t*(3-2*t), x=+n.dataset.x + Math.sin((i+1)*1.73+e*5.1)*(1.2+depth*2.2); const y=7 + e*(92+depth*38); const size=34+depth*54; const scale=.7+depth*.72+(e*.1); const a=t>0&&t<1?Math.min(1,smooth(t/.09)*smooth((1-t)/.11)):0; n.style.setProperty('--x',x+'%');n.style.setProperty('--y',y+'%');n.style.setProperty('--size',size+'px');n.style.setProperty('--rot',(+n.dataset.spin+e*(150+depth*210))+'deg');n.style.setProperty('--scale',scale);n.style.setProperty('--a',a);n.style.setProperty('--blur',(1-depth)*1.35+'px'); });
  const heroIn=smooth((p-.39)/.07),heroOut=1-smooth((p-.66)/.055),ha=heroIn*heroOut; stage.style.setProperty('--hero-a',ha.toFixed(3)); stage.style.setProperty('--hero-scale',(1.48-.46*heroIn+.13*smooth((p-.52)/.08)).toFixed(3));
  const cut=smooth((p-.57)/.045); hero.style.opacity=(ha*(1-cut)).toFixed(3); body.style.opacity=(ha*cut).toFixed(3); cap.style.opacity=(ha*cut).toFixed(3); body.style.transform=`translate(-50%,-50%) translateY(${(cut*12).toFixed(1)}px)`; cap.style.transform=`translate(-50%,-50%) translate(${(cut*38).toFixed(1)}px,${(-cut*46).toFixed(1)}px) rotate(${(cut*18).toFixed(1)}deg)`;
  const ka=smooth((p-.49)/.045)*(1-smooth((p-.64)/.045)),kt=smooth((p-.49)/.12); stage.style.setProperty('--knife-a',ka.toFixed(3));stage.style.setProperty('--knife-x',(220-kt*340).toFixed(1)+'px');
  const sa=smooth((p-.61)/.04)*(1-smooth((p-.82)/.06)),ss=.62+smooth((p-.61)/.13)*1.15;stage.style.setProperty('--splash-a',sa.toFixed(3));stage.style.setProperty('--splash-scale',ss.toFixed(3));
  const wa=smooth((p-.72)/.055),ws=.72+wa*.7;stage.style.setProperty('--water-a',wa.toFixed(3));stage.style.setProperty('--water-scale',ws.toFixed(3));stage.style.setProperty('--water-blur',((1-wa)*2.4).toFixed(1)+'px');
  stage.style.setProperty('--copy-a',(1-smooth((p-.28)/.07)).toFixed(3));
  window.__NS_V421_CINEMATIC_REBUILD={progress:p,rain:rainP,hero:ha,knife:ka,splash:sa,water:wa};
 }
 addEventListener('scroll',()=>{if(!raf)raf=requestAnimationFrame(update)},{passive:true});addEventListener('resize',()=>{if(!raf)raf=requestAnimationFrame(update)},{passive:true});update();
}
function init(){injectStyle();setTimeout(build,150)}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init,{once:true}):init();
})();
