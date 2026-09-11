(()=>{
'use strict';
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const smooth=t=>{t=clamp(t);return t*t*(3-2*t)};
const FILM_ID='v20-story-film';

function injectStyle(){
  if(document.getElementById('v421-cinematic-rebuild-style'))return;
  const s=document.createElement('style');
  s.id='v421-cinematic-rebuild-style';
  s.textContent=`
html.ns-cinematic-rebuilt .mobile-story-reel{display:none!important}
#${FILM_ID}[data-rebuilt="1"]{display:block!important;position:relative!important;height:620vh!important;min-height:620vh!important;background:#020902!important;overflow:visible!important}
#${FILM_ID}[data-rebuilt="1"] .v421-cine-stage{display:block!important;position:sticky!important;top:0!important;height:100svh!important;min-height:100svh!important;overflow:hidden!important;background:#020902!important;isolation:isolate}
#${FILM_ID} .v421-cine-bg{position:absolute;inset:-3%;width:106%;height:106%;object-fit:cover;object-position:center 44%;filter:saturate(1.02) contrast(1.06) brightness(.62);transform:scale(1.03);z-index:0}
#${FILM_ID} .v421-cine-shade{position:absolute;inset:0;z-index:1;background:linear-gradient(90deg,rgba(2,8,1,.50),rgba(2,8,1,.04) 56%,rgba(2,8,1,.22)),linear-gradient(0deg,rgba(1,7,1,.46),transparent 52%);pointer-events:none}
#${FILM_ID} .v421-canopy{position:absolute;left:0;right:0;top:0;height:30vh;z-index:3;pointer-events:none;background:linear-gradient(180deg,rgba(2,17,4,.88),rgba(2,17,4,.16) 82%,transparent)}
#${FILM_ID} .v421-rain{position:absolute;inset:0;z-index:5;pointer-events:none;overflow:hidden}
#${FILM_ID} .v421-nut{position:absolute;left:var(--x);top:var(--y);width:var(--size);aspect-ratio:.82/1;transform:translate(-50%,-50%) rotate(var(--rot)) scale(var(--scale));transform-origin:center;opacity:var(--a);filter:brightness(var(--bright)) saturate(var(--sat)) drop-shadow(0 18px 20px rgba(0,0,0,.34)) blur(var(--blur));will-change:transform,opacity}
#${FILM_ID} .v421-nut img{width:100%;height:100%;object-fit:contain;display:block}
#${FILM_ID} .v421-hero-wrap{position:absolute;inset:0;z-index:8;pointer-events:none;opacity:var(--hero-a,0)}
#${FILM_ID} .v421-hero-coconut{position:absolute;left:50%;top:53%;width:min(31vw,410px);transform:translate(-50%,-50%) scale(var(--hero-scale,1));filter:drop-shadow(0 34px 42px rgba(0,0,0,.48));will-change:transform,opacity}
#${FILM_ID} .v421-cut-body,#${FILM_ID} .v421-cut-cap{position:absolute;left:50%;top:53%;width:min(31vw,410px);transform:translate(-50%,-50%);opacity:0;filter:drop-shadow(0 34px 42px rgba(0,0,0,.48))}
#${FILM_ID} .v421-knife{position:absolute;left:62%;top:42%;width:min(42vw,570px);height:84px;z-index:11;opacity:var(--knife-a,0);transform:translate(-50%,-50%) translateX(var(--knife-x,260px)) rotate(-24deg);transform-origin:15% 50%;filter:drop-shadow(0 20px 24px rgba(0,0,0,.48));will-change:transform,opacity}
#${FILM_ID} .v421-knife::before{content:'';position:absolute;left:0;top:19px;width:77%;height:42px;border-radius:4px 54% 54% 4px;background:linear-gradient(180deg,#faf8f2 0%,#cfd3d1 38%,#69716d 50%,#eeeae2 72%,#b5bbb7 100%);clip-path:polygon(0 13%,92% 0,100% 50%,92% 100%,0 87%);box-shadow:inset 0 1px 0 rgba(255,255,255,.9)}
#${FILM_ID} .v421-knife::after{content:'';position:absolute;right:0;top:14px;width:28%;height:52px;border-radius:16px;background:linear-gradient(90deg,#4d3320,#17100c 57%,#5b3c25);box-shadow:0 7px 13px rgba(0,0,0,.5)}
#${FILM_ID} .v421-splash{position:absolute;left:50%;top:52%;z-index:13;width:min(110vw,1580px);opacity:var(--splash-a,0);transform:translate(-50%,-50%) scale(var(--splash-scale,.62));filter:saturate(1.02) contrast(1.06) brightness(1.08);pointer-events:none;will-change:transform,opacity}
#${FILM_ID} .v421-water{position:absolute;inset:-22%;z-index:14;opacity:var(--water-a,0);transform:scale(var(--water-scale,.66));background:radial-gradient(circle at 50% 47%,rgba(235,255,252,.98),rgba(157,230,225,.97) 23%,rgba(74,171,181,.98) 48%,rgba(15,90,110,.99) 74%,rgba(3,36,52,1));filter:blur(var(--water-blur,0px));pointer-events:none;will-change:transform,opacity}
#${FILM_ID} .v421-water::before,#${FILM_ID} .v421-water::after{content:'';position:absolute;inset:-10%;background:radial-gradient(ellipse at 41% 46%,transparent 0 15%,rgba(255,255,255,.30) 16% 18%,transparent 19% 27%,rgba(255,255,255,.16) 28% 31%,transparent 32%);transform:rotate(-12deg) scale(1.34);mix-blend-mode:screen}
#${FILM_ID} .v421-water::after{transform:rotate(18deg) scale(1.58);opacity:.65}
#${FILM_ID} .v421-title{position:absolute;left:clamp(28px,6vw,110px);top:clamp(118px,17vh,175px);z-index:7;max-width:650px;color:#fff;opacity:var(--copy-a,1);pointer-events:none}
#${FILM_ID} .v421-title .eyebrow{font:600 11px/1.3 Jost,sans-serif;letter-spacing:6px;text-transform:uppercase;color:#d7ad42;margin-bottom:24px}
#${FILM_ID} .v421-title h2{font:400 clamp(54px,6vw,108px)/.92 'Playfair Display',serif;margin:0;color:#f7f4e9}
#${FILM_ID} .v421-title h2 em{display:block;color:#d7ad42;font-weight:400}
#${FILM_ID} .v421-title p{max-width:590px;margin-top:26px;font:400 14px/1.75 Jost,sans-serif;letter-spacing:1.7px;text-transform:uppercase;color:rgba(255,255,255,.70)}
#${FILM_ID} .v421-stage-label{position:absolute;right:34px;bottom:28px;z-index:15;font:600 9px/1 Jost,sans-serif;letter-spacing:3px;text-transform:uppercase;color:rgba(255,255,255,.65)}
@media(max-width:980px){
  #${FILM_ID}[data-rebuilt="1"]{display:block!important;height:480vh!important;min-height:480vh!important}
  #${FILM_ID} .v421-title{left:22px;right:22px;top:100px;max-width:none}
  #${FILM_ID} .v421-title h2{font-size:clamp(44px,12vw,76px)}
  #${FILM_ID} .v421-title p{font-size:11px;max-width:82vw}
  #${FILM_ID} .v421-hero-coconut,#${FILM_ID} .v421-cut-body,#${FILM_ID} .v421-cut-cap{width:min(62vw,340px)}
  #${FILM_ID} .v421-knife{width:min(76vw,460px)}
}
@media(prefers-reduced-motion:reduce){
  #${FILM_ID}[data-rebuilt="1"]{height:auto!important;min-height:0!important}
  #${FILM_ID} .v421-cine-stage{position:relative!important;height:92svh!important;min-height:92svh!important}
  #${FILM_ID} .v421-rain,#${FILM_ID} .v421-knife,#${FILM_ID} .v421-splash,#${FILM_ID} .v421-water{display:none!important}
}
`;
  document.head.appendChild(s);
}

function build(){
  const film=document.getElementById(FILM_ID);
  if(!film||film.dataset.rebuilt==='1')return;
  film.dataset.rebuilt='1';
  document.documentElement.classList.add('ns-cinematic-rebuilt');
  film.innerHTML=`<div class="v421-cine-stage"><img class="v421-cine-bg" src="assets/images/review/coastal-grove.png" alt="Coconut grove"><div class="v421-cine-shade"></div><div class="v421-canopy"></div><div class="v421-rain"></div><div class="v421-title"><div class="eyebrow">Chapter 01 · The harvest</div><h2>From the trees,<em>into the moment.</em></h2><p>Coconuts release from the canopy, one fruit moves into focus, it is cut fresh, and the water becomes the transition.</p></div><div class="v421-hero-wrap"><img class="v421-hero-coconut" src="assets/images/story-coconut-hero.png" alt="Selected coconut"><img class="v421-cut-body" src="assets/images/story-coconut-body-cut.png" alt="Fresh-cut coconut"><img class="v421-cut-cap" src="assets/images/story-coconut-cap-cut.png" alt="Coconut cap"></div><div class="v421-knife" aria-hidden="true"></div><img class="v421-splash" src="assets/images/freshness-coconut-splash.webp" alt="Coconut water splash"><div class="v421-water" aria-hidden="true"></div><div class="v421-stage-label">Harvest film</div></div>`;

  const stage=film.querySelector('.v421-cine-stage');
  const rain=film.querySelector('.v421-rain');
  const hero=film.querySelector('.v421-hero-coconut');
  const body=film.querySelector('.v421-cut-body');
  const cap=film.querySelector('.v421-cut-cap');
  const nuts=[];
  const count=innerWidth<=980?54:96;

  for(let i=0;i<count;i++){
    const d=document.createElement('div');
    d.className='v421-nut';
    const cols=innerWidth<=980?9:12;
    const lane=(i%cols)/(cols-1);
    const wave=Math.floor(i/cols);
    const depth=(i%7)/6;
    d.dataset.x=(5+lane*90+Math.sin(i*1.91)*2.4).toFixed(2);
    d.dataset.wave=wave;
    d.dataset.depth=depth.toFixed(3);
    d.dataset.spin=(-30+(i*43)%70).toFixed(1);
    d.innerHTML='<img src="assets/images/story-coconut-hero.png" alt="">';
    rain.appendChild(d);
    nuts.push(d);
  }

  let raf=0;
  function update(){
    raf=0;
    const r=film.getBoundingClientRect();
    const range=Math.max(1,film.offsetHeight-innerHeight);
    const p=clamp(-r.top/range);
    const rainP=clamp(p/.43);

    nuts.forEach((n,i)=>{
      const wave=+n.dataset.wave,depth=+n.dataset.depth;
      const start=.022*wave;
      const end=start+.28+.045*depth;
      const t=clamp((rainP-start)/(end-start));
      const e=smooth(t);
      const x=+n.dataset.x+Math.sin((i+1)*1.67+e*5.4)*(1+depth*2.3);
      const y=-9+e*(116+depth*28);
      const size=28+depth*70;
      const scale=.72+depth*.58+e*.10;
      const fadeIn=smooth(t/.10),fadeOut=1-smooth((t-.86)/.14);
      const a=t>0&&t<1?Math.min(.98,fadeIn*fadeOut):0;
      n.style.setProperty('--x',x+'%');
      n.style.setProperty('--y',y+'%');
      n.style.setProperty('--size',size+'px');
      n.style.setProperty('--rot',(+n.dataset.spin+e*(130+depth*250))+'deg');
      n.style.setProperty('--scale',scale.toFixed(3));
      n.style.setProperty('--a',a.toFixed(3));
      n.style.setProperty('--blur',((1-depth)*1.15).toFixed(2)+'px');
      n.style.setProperty('--bright',(0.72+depth*.30).toFixed(2));
      n.style.setProperty('--sat',(0.82+depth*.22).toFixed(2));
    });

    const heroIn=smooth((p-.39)/.075);
    const heroOut=1-smooth((p-.675)/.05);
    const ha=heroIn*heroOut;
    stage.style.setProperty('--hero-a',ha.toFixed(3));
    stage.style.setProperty('--hero-scale',(1.58-.53*heroIn+.12*smooth((p-.51)/.08)).toFixed(3));

    const cut=smooth((p-.575)/.042);
    hero.style.opacity=(ha*(1-cut)).toFixed(3);
    body.style.opacity=(ha*cut).toFixed(3);
    cap.style.opacity=(ha*cut).toFixed(3);
    body.style.transform=`translate(-50%,-50%) translateY(${(cut*14).toFixed(1)}px)`;
    cap.style.transform=`translate(-50%,-50%) translate(${(cut*52).toFixed(1)}px,${(-cut*58).toFixed(1)}px) rotate(${(cut*22).toFixed(1)}deg)`;

    const ka=smooth((p-.485)/.045)*(1-smooth((p-.645)/.04));
    const kt=smooth((p-.485)/.115);
    stage.style.setProperty('--knife-a',ka.toFixed(3));
    stage.style.setProperty('--knife-x',(260-kt*410).toFixed(1)+'px');

    const sa=smooth((p-.605)/.042)*(1-smooth((p-.835)/.06));
    const ss=.58+smooth((p-.605)/.14)*1.38;
    stage.style.setProperty('--splash-a',sa.toFixed(3));
    stage.style.setProperty('--splash-scale',ss.toFixed(3));

    const wa=smooth((p-.715)/.055);
    const ws=.66+wa*.92;
    stage.style.setProperty('--water-a',wa.toFixed(3));
    stage.style.setProperty('--water-scale',ws.toFixed(3));
    stage.style.setProperty('--water-blur',((1-wa)*2.2).toFixed(1)+'px');
    stage.style.setProperty('--copy-a',(1-smooth((p-.27)/.075)).toFixed(3));

    window.__NS_V421_CINEMATIC_REBUILD={progress:p,rain:rainP,hero:ha,knife:ka,splash:sa,water:wa,count};
  }

  const request=()=>{if(!raf)raf=requestAnimationFrame(update)};
  addEventListener('scroll',request,{passive:true});
  addEventListener('resize',request,{passive:true});
  update();
}

function init(){injectStyle();setTimeout(build,80)}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init,{once:true}):init();
})();
