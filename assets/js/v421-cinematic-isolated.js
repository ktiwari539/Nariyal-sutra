(()=>{
'use strict';

const FILM_ID='v421-cinematic-film';
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const smooth=t=>{t=clamp(t);return t*t*(3-2*t)};
const home=()=>/(^|\/)index\.html$|\/$/.test(location.pathname);

function injectStyle(){
  if(document.getElementById('v421-isolated-cine-style'))return;
  const s=document.createElement('style');
  s.id='v421-isolated-cine-style';
  s.textContent=`
    #scroll-cinema{display:none!important;height:0!important;min-height:0!important;margin:0!important;padding:0!important;overflow:hidden!important}
    #${FILM_ID}{position:relative;height:560vh!important;min-height:560vh!important;background:#020902;isolation:isolate;overflow:visible}
    #${FILM_ID} .v421i-stage{position:sticky;top:0;height:100svh;min-height:100svh;overflow:hidden;background:#031003;isolation:isolate}
    #${FILM_ID} .v421i-bg{position:absolute;inset:-3%;width:106%;height:106%;object-fit:cover;object-position:center 43%;filter:saturate(.96) contrast(1.08) brightness(.66);transform:scale(1.035);z-index:0}
    #${FILM_ID} .v421i-grade{position:absolute;inset:0;z-index:1;background:linear-gradient(180deg,rgba(1,8,1,.18),rgba(1,8,1,.12) 42%,rgba(1,8,1,.58)),linear-gradient(90deg,rgba(1,8,1,.58),rgba(1,8,1,.05) 54%,rgba(1,8,1,.22));pointer-events:none}
    #${FILM_ID} .v421i-canopy{position:absolute;left:0;right:0;top:0;height:26vh;z-index:2;background:linear-gradient(180deg,rgba(1,15,3,.82),rgba(1,15,3,.15) 82%,transparent);pointer-events:none}
    #${FILM_ID} .v421i-copy{position:absolute;z-index:7;left:clamp(28px,6vw,108px);top:clamp(118px,16vh,168px);width:min(650px,74vw);opacity:var(--copy-a,1);transform:translateY(var(--copy-y,0));transition:opacity .08s linear;color:#f8f3e7;pointer-events:none}
    #${FILM_ID} .v421i-kicker{font:600 10px/1.25 Jost,sans-serif;letter-spacing:5px;text-transform:uppercase;color:#e1b94e;margin-bottom:20px}
    #${FILM_ID} .v421i-copy h2{font:400 clamp(58px,6.4vw,112px)/.9 'Playfair Display',serif;letter-spacing:-.045em;margin:0;color:#f8f3e7}
    #${FILM_ID} .v421i-copy h2 em{display:block;color:#d7ad42;font-weight:400}
    #${FILM_ID} .v421i-copy p{max-width:560px;margin:24px 0 0;font:400 13px/1.7 Jost,sans-serif;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,.68)}
    #${FILM_ID} .v421i-rain{position:absolute;inset:0;z-index:5;overflow:hidden;pointer-events:none}
    #${FILM_ID} .v421i-nut{position:absolute;left:0;top:0;width:var(--w,72px);opacity:0;will-change:transform,opacity;filter:brightness(var(--b,.9)) saturate(var(--s,.95)) blur(var(--blur,0px)) drop-shadow(0 18px 24px rgba(0,0,0,.42));transform-origin:center}
    #${FILM_ID} .v421i-nut img{display:block;width:100%;height:auto;object-fit:contain}
    #${FILM_ID} .v421i-hero{position:absolute;inset:0;z-index:9;pointer-events:none}
    #${FILM_ID} .v421i-hero-main,#${FILM_ID} .v421i-cut-body,#${FILM_ID} .v421i-cut-cap{position:absolute;left:50%;top:52%;width:min(33vw,430px);opacity:0;filter:drop-shadow(0 34px 42px rgba(0,0,0,.52));will-change:transform,opacity}
    #${FILM_ID} .v421i-knife{position:absolute;z-index:11;left:50%;top:49%;width:min(68vw,900px);height:124px;opacity:0;transform:translate(18vw,-50%) rotate(-18deg);transform-origin:75% 50%;filter:drop-shadow(0 24px 26px rgba(0,0,0,.5));will-change:transform,opacity}
    #${FILM_ID} .v421i-knife .blade{position:absolute;left:0;top:25px;width:76%;height:68px;background:linear-gradient(180deg,#fffdf7 0%,#d7dbd9 33%,#7d8581 50%,#f3efe7 69%,#a8afac 100%);clip-path:polygon(0 12%,90% 0,100% 50%,90% 100%,0 88%);border-radius:3px 55% 55% 3px;box-shadow:inset 0 1px 0 rgba(255,255,255,.9),inset 0 -1px 0 rgba(30,35,34,.45)}
    #${FILM_ID} .v421i-knife .handle{position:absolute;right:0;top:18px;width:29%;height:80px;border-radius:18px 34px 34px 18px;background:linear-gradient(90deg,#7a4f2d,#1b120d 62%,#6a4328);box-shadow:inset 0 2px 3px rgba(255,255,255,.14),0 10px 20px rgba(0,0,0,.42)}
    #${FILM_ID} .v421i-splash{position:absolute;z-index:13;left:50%;top:51%;width:min(120vw,1760px);opacity:0;transform:translate(-50%,-50%) scale(.55);filter:saturate(1.06) contrast(1.08) brightness(1.08);pointer-events:none;will-change:transform,opacity}
    #${FILM_ID} .v421i-water-photo{position:absolute;z-index:14;inset:-18%;width:136%;height:136%;object-fit:cover;object-position:center;opacity:0;transform:scale(.6);filter:saturate(1.12) contrast(1.02) brightness(.98) blur(1px);mix-blend-mode:screen;pointer-events:none;will-change:transform,opacity}
    #${FILM_ID} .v421i-water-fill{position:absolute;z-index:15;inset:-24%;opacity:0;transform:scale(.58);background:radial-gradient(circle at 50% 48%,rgba(238,255,252,.96),rgba(164,235,229,.94) 24%,rgba(74,181,190,.95) 49%,rgba(17,100,121,.97) 74%,rgba(3,38,55,.99));pointer-events:none;will-change:transform,opacity}
    #${FILM_ID} .v421i-stage-note{position:absolute;right:30px;bottom:24px;z-index:16;font:600 8px/1 Jost,sans-serif;letter-spacing:3px;text-transform:uppercase;color:rgba(255,255,255,.58)}
    @media(max-width:980px){
      #${FILM_ID}{height:430vh!important;min-height:430vh!important}
      #${FILM_ID} .v421i-copy{left:20px;right:20px;top:104px;width:auto}
      #${FILM_ID} .v421i-copy h2{font-size:clamp(46px,12.5vw,78px)}
      #${FILM_ID} .v421i-copy p{font-size:10px;max-width:84vw}
      #${FILM_ID} .v421i-hero-main,#${FILM_ID} .v421i-cut-body,#${FILM_ID} .v421i-cut-cap{width:min(66vw,350px)}
      #${FILM_ID} .v421i-knife{width:min(94vw,680px);height:96px}
      #${FILM_ID} .v421i-knife .blade{top:20px;height:52px}
      #${FILM_ID} .v421i-knife .handle{top:14px;height:64px}
    }
    @media(prefers-reduced-motion:reduce){
      #${FILM_ID}{height:auto!important;min-height:0!important}
      #${FILM_ID} .v421i-stage{position:relative;height:92svh;min-height:92svh}
      #${FILM_ID} .v421i-rain,#${FILM_ID} .v421i-knife,#${FILM_ID} .v421i-splash,#${FILM_ID} .v421i-water-photo,#${FILM_ID} .v421i-water-fill{display:none!important}
    }
  `;
  document.head.appendChild(s);
}

function placeFilm(film){
  const collection=document.getElementById('collection');
  if(collection && collection.parentNode && collection.nextElementSibling!==film){
    collection.insertAdjacentElement('afterend',film);
  }
}

function build(){
  if(!home())return;
  injectStyle();

  const legacy=document.getElementById('scroll-cinema');
  if(legacy){
    legacy.hidden=true;
    legacy.setAttribute('aria-hidden','true');
    legacy.style.setProperty('display','none','important');
    legacy.style.setProperty('height','0','important');
    legacy.style.setProperty('min-height','0','important');
  }

  let film=document.getElementById(FILM_ID);
  if(!film){
    film=document.createElement('section');
    film.id=FILM_ID;
    film.setAttribute('aria-label','Cinematic coconut harvest and fresh-cut water sequence');
    film.innerHTML=`
      <div class="v421i-stage">
        <img class="v421i-bg" src="/assets/images/review/coastal-grove.png" alt="Coconut palms beside the coast">
        <div class="v421i-grade"></div><div class="v421i-canopy"></div>
        <div class="v421i-copy"><div class="v421i-kicker">Nariyal Sutra · Harvest Film</div><h2>From the trees,<em>cut fresh.</em></h2><p>A natural fall through the grove. One coconut comes forward. One clean cut. Then the water takes over the frame.</p></div>
        <div class="v421i-rain" aria-hidden="true"></div>
        <div class="v421i-hero" aria-hidden="true">
          <img class="v421i-hero-main" src="/assets/images/story-coconut-hero.png" alt="">
          <img class="v421i-cut-body" src="/assets/images/story-coconut-body-cut.png" alt="">
          <img class="v421i-cut-cap" src="/assets/images/story-coconut-cap-cut.png" alt="">
        </div>
        <div class="v421i-knife" aria-hidden="true"><span class="blade"></span><span class="handle"></span></div>
        <img class="v421i-splash" src="/assets/images/freshness-coconut-splash.webp" alt="">
        <img class="v421i-water-photo" src="/assets/images/freshness-coconut-splash.webp" alt="">
        <div class="v421i-water-fill" aria-hidden="true"></div>
        <div class="v421i-stage-note">Tree → fall → cut → water</div>
      </div>`;
  }
  placeFilm(film);
  film.dataset.ready='1';

  const stage=film.querySelector('.v421i-stage');
  const rain=film.querySelector('.v421i-rain');
  const hero=film.querySelector('.v421i-hero-main');
  const body=film.querySelector('.v421i-cut-body');
  const cap=film.querySelector('.v421i-cut-cap');
  const knife=film.querySelector('.v421i-knife');
  const splash=film.querySelector('.v421i-splash');
  const waterPhoto=film.querySelector('.v421i-water-photo');
  const waterFill=film.querySelector('.v421i-water-fill');
  const copy=film.querySelector('.v421i-copy');
  const count=innerWidth<=980?54:96;
  const nuts=[];

  for(let i=0;i<count;i++){
    const d=document.createElement('div');
    d.className='v421i-nut';
    const depth=((i*37)%100)/100;
    const x=4+((i*31.7+(i%7)*6.3)%92);
    const start=.025+(i/Math.max(1,count-1))*.37;
    const dur=.060+(i%5)*.006;
    const w=(innerWidth<=980?28:34)+depth*(innerWidth<=980?58:82);
    const drift=((i*19)%70)-35;
    const rot=((i*47)%90)-45;
    d.dataset.x=x.toFixed(2);d.dataset.depth=depth.toFixed(3);d.dataset.start=start.toFixed(4);d.dataset.dur=dur.toFixed(4);d.dataset.drift=drift;d.dataset.rot=rot;
    d.style.setProperty('--w',w.toFixed(1)+'px');
    d.style.setProperty('--b',(0.72+depth*.28).toFixed(2));
    d.style.setProperty('--s',(0.80+depth*.24).toFixed(2));
    d.style.setProperty('--blur',((1-depth)*1.15).toFixed(2)+'px');
    d.innerHTML='<img src="/assets/images/story-coconut-hero.png" alt="">';
    rain.appendChild(d);nuts.push(d);
  }

  function render(){
    const rr=film.getBoundingClientRect();
    const range=Math.max(1,film.offsetHeight-innerHeight);
    const p=clamp(-rr.top/range);

    let visible=0;
    nuts.forEach((n,i)=>{
      const start=+n.dataset.start,dur=+n.dataset.dur;
      const t=clamp((p-start)/dur);
      const active=p>=start&&p<=start+dur;
      if(!active){n.style.opacity='0';return;}
      const e=smooth(t),depth=+n.dataset.depth;
      const x=+n.dataset.x+Math.sin((i+1)*.77+t*4.1)*(1.2+depth*2.6);
      const y=-18+e*(136+depth*18);
      const sway=(+n.dataset.drift)*Math.sin(t*Math.PI);
      const rot=+n.dataset.rot+e*(120+depth*240);
      const edge=Math.min(1,t/.10,(1-t)/.12);
      const alpha=clamp(edge)*(0.72+depth*.26);
      n.style.opacity=alpha.toFixed(3);
      n.style.transform=`translate3d(calc(${x.toFixed(2)}vw + ${sway.toFixed(1)}px),${y.toFixed(2)}vh,0) translate(-50%,-50%) rotate(${rot.toFixed(1)}deg) scale(${(.78+depth*.45).toFixed(3)})`;
      if(alpha>.15)visible++;
    });

    const heroIn=smooth((p-.395)/.06),heroOut=1-smooth((p-.66)/.045),ha=heroIn*heroOut;
    const heroScale=1.48-.44*heroIn+.08*smooth((p-.50)/.09);
    hero.style.opacity=(ha*(1-smooth((p-.57)/.045))).toFixed(3);
    hero.style.transform=`translate(-50%,-50%) scale(${heroScale.toFixed(3)})`;

    const cut=smooth((p-.565)/.045);
    body.style.opacity=(ha*cut).toFixed(3);cap.style.opacity=(ha*cut).toFixed(3);
    body.style.transform=`translate(-50%,-50%) translateY(${(cut*16).toFixed(1)}px) scale(1.04)`;
    cap.style.transform=`translate(-50%,-50%) translate(${(cut*62).toFixed(1)}px,${(-cut*72).toFixed(1)}px) rotate(${(cut*24).toFixed(1)}deg) scale(1.04)`;

    const knifeIn=smooth((p-.49)/.05),knifeOut=1-smooth((p-.64)/.035),ka=knifeIn*knifeOut;
    const knifeTravel=smooth((p-.49)/.105);
    knife.style.opacity=ka.toFixed(3);
    knife.style.transform=`translate(${(18-knifeTravel*38).toFixed(2)}vw,-50%) rotate(${(-18+knifeTravel*7).toFixed(2)}deg)`;

    const sa=smooth((p-.61)/.045)*(1-smooth((p-.80)/.05));
    const ss=.52+smooth((p-.61)/.13)*1.78;
    splash.style.opacity=sa.toFixed(3);splash.style.transform=`translate(-50%,-50%) scale(${ss.toFixed(3)})`;

    const wa=smooth((p-.735)/.06);
    waterPhoto.style.opacity=(wa*.78).toFixed(3);waterPhoto.style.transform=`scale(${(.60+wa*.95).toFixed(3)})`;
    waterFill.style.opacity=(wa*.95).toFixed(3);waterFill.style.transform=`scale(${(.58+wa*1.02).toFixed(3)})`;

    const ca=1-smooth((p-.25)/.08);copy.style.opacity=ca.toFixed(3);copy.style.transform=`translateY(${((1-ca)*-22).toFixed(1)}px)`;

    window.__NS_V421_ISOLATED_CINE={progress:p,rainVisible:visible,hero:ha,knife:ka,splash:sa,water:wa,count};
  }

  let raf=0;const request=()=>{if(!raf)raf=requestAnimationFrame(()=>{raf=0;render();});};
  addEventListener('scroll',request,{passive:true});addEventListener('resize',request,{passive:true});
  addEventListener('nsv421:change',()=>setTimeout(()=>placeFilm(film),60));
  setTimeout(()=>placeFilm(film),450);setTimeout(()=>placeFilm(film),1000);
  render();
}

function init(){setTimeout(build,460)}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init,{once:true}):init();
})();
