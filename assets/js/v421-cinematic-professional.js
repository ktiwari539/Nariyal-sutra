(()=>{
'use strict';

const ID='v421-cinematic-film-pro';
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const smooth=t=>{t=clamp(t);return t*t*(3-2*t)};
const home=()=>/(^|\/)index\.html$|\/$/.test(location.pathname);

function injectStyle(){
  if(document.getElementById('v421-cinematic-pro-style'))return;
  const s=document.createElement('style');
  s.id='v421-cinematic-pro-style';
  s.textContent=`
  #scroll-cinema,#v421-cinematic-film{display:none!important;height:0!important;min-height:0!important;margin:0!important;padding:0!important;overflow:hidden!important}
  #${ID}{position:relative;height:575vh!important;min-height:575vh!important;background:#020802;isolation:isolate;overflow:visible}
  #${ID} .nspro-stage{position:sticky;top:0;height:100svh;min-height:100svh;overflow:hidden;isolation:isolate;background:#031003}
  #${ID} .nspro-bg{position:absolute;inset:-3%;width:106%;height:106%;object-fit:cover;object-position:center 43%;z-index:0;filter:saturate(1.06) contrast(1.08) brightness(.71);transform:scale(var(--bg-scale,1.04)) translate3d(0,var(--bg-y,0),0);will-change:transform}
  #${ID} .nspro-grade{position:absolute;inset:0;z-index:1;background:linear-gradient(180deg,rgba(1,7,1,.17),rgba(1,7,1,.05) 42%,rgba(1,7,1,.62)),linear-gradient(90deg,rgba(1,7,1,.60),rgba(1,7,1,.04) 54%,rgba(1,7,1,.28));pointer-events:none}
  #${ID} .nspro-rain{position:absolute;inset:0;z-index:4;overflow:hidden;pointer-events:none;perspective:1200px}
  #${ID} .nspro-nut{position:absolute;left:0;top:0;width:var(--w,72px);opacity:0;transform-origin:center;will-change:transform,opacity;filter:brightness(var(--b,.9)) saturate(var(--s,.95)) contrast(1.03) blur(var(--blur,0px)) drop-shadow(0 18px 25px rgba(0,0,0,.46))}
  #${ID} .nspro-nut img{display:block;width:100%;height:auto;object-fit:contain}
  #${ID} .nspro-nut.near{filter:brightness(1.03) saturate(1.06) contrast(1.05) drop-shadow(0 30px 36px rgba(0,0,0,.54))}
  #${ID} .nspro-canopy-photo{position:absolute;left:-3%;right:-3%;top:-3%;width:106%;height:40vh;z-index:5;object-fit:cover;object-position:center 14%;opacity:.90;filter:saturate(1.06) contrast(1.07) brightness(.68);pointer-events:none;-webkit-mask-image:linear-gradient(180deg,#000 0%,#000 48%,rgba(0,0,0,.78) 67%,transparent 100%);mask-image:linear-gradient(180deg,#000 0%,#000 48%,rgba(0,0,0,.78) 67%,transparent 100%)}
  #${ID} .nspro-canopy-shade{position:absolute;left:0;right:0;top:0;height:30vh;z-index:6;background:linear-gradient(180deg,rgba(1,13,3,.48),rgba(1,13,3,.05) 76%,transparent);pointer-events:none}
  #${ID} .nspro-copy{position:absolute;left:clamp(26px,6vw,108px);top:clamp(108px,15vh,164px);z-index:8;width:min(680px,76vw);color:#fff;opacity:var(--copy-a,1);transform:translateY(var(--copy-y,0px));pointer-events:none}
  #${ID} .nspro-kicker{font:600 10px/1.2 Jost,sans-serif;letter-spacing:5px;text-transform:uppercase;color:#e2bb52;margin-bottom:20px}
  #${ID} .nspro-copy h2{font:400 clamp(56px,6.5vw,112px)/.9 'Playfair Display',serif;letter-spacing:-.045em;margin:0;color:#f7f3e8;text-shadow:0 18px 60px rgba(0,0,0,.45)}
  #${ID} .nspro-copy h2 em{display:block;color:#d7ad42;font-weight:400}
  #${ID} .nspro-copy p{max-width:590px;margin:24px 0 0;font:400 13px/1.75 Jost,sans-serif;letter-spacing:1.8px;text-transform:uppercase;color:rgba(255,255,255,.70)}
  #${ID} .nspro-hero{position:absolute;inset:0;z-index:10;pointer-events:none}
  #${ID} .nspro-main,#${ID} .nspro-body,#${ID} .nspro-cap{position:absolute;left:50%;top:53%;width:min(34vw,440px);opacity:0;transform:translate(-50%,-50%);filter:drop-shadow(0 38px 46px rgba(0,0,0,.54));will-change:transform,opacity}
  #${ID} .nspro-focus-ring{position:absolute;left:50%;top:53%;width:min(40vw,520px);aspect-ratio:1;border-radius:50%;z-index:9;opacity:0;transform:translate(-50%,-50%) scale(.72);background:radial-gradient(circle,rgba(218,255,229,.11),rgba(218,255,229,.03) 42%,transparent 68%);filter:blur(3px);pointer-events:none;will-change:opacity,transform}
  #${ID} .nspro-knife{position:absolute;z-index:12;left:50%;top:48%;width:min(70vw,930px);height:128px;opacity:0;transform:translate(19vw,-50%) rotate(-17deg);transform-origin:75% 50%;filter:drop-shadow(0 25px 30px rgba(0,0,0,.52));will-change:transform,opacity}
  #${ID} .nspro-knife .blade{position:absolute;left:0;top:26px;width:77%;height:70px;background:linear-gradient(180deg,#fffdf8 0%,#dadddb 34%,#747c78 50%,#f3eee5 70%,#9ea6a2 100%);clip-path:polygon(0 12%,91% 0,100% 50%,91% 100%,0 88%);border-radius:3px 58% 58% 3px;box-shadow:inset 0 1px rgba(255,255,255,.95),inset 0 -1px rgba(30,35,34,.45)}
  #${ID} .nspro-knife .handle{position:absolute;right:0;top:18px;width:29%;height:82px;border-radius:18px 36px 36px 18px;background:linear-gradient(90deg,#76502f,#1a110c 62%,#674126);box-shadow:inset 0 2px 3px rgba(255,255,255,.14),0 12px 20px rgba(0,0,0,.42)}
  #${ID} .nspro-splash{position:absolute;z-index:14;left:50%;top:51%;width:min(122vw,1780px);opacity:0;transform:translate(-50%,-50%) scale(.52);filter:saturate(1.08) contrast(1.08) brightness(1.08);pointer-events:none;will-change:transform,opacity}
  #${ID} .nspro-water-photo{position:absolute;z-index:15;inset:-18%;width:136%;height:136%;object-fit:cover;object-position:center;opacity:0;transform:scale(.62);filter:saturate(1.12) contrast(1.04) brightness(.99);mix-blend-mode:screen;pointer-events:none;will-change:transform,opacity}
  #${ID} .nspro-water{position:absolute;z-index:16;inset:-25%;opacity:0;transform:scale(.58);background:radial-gradient(circle at 50% 48%,rgba(239,255,253,.98),rgba(166,236,230,.96) 24%,rgba(70,179,190,.97) 49%,rgba(16,98,121,.98) 74%,rgba(3,37,54,1));pointer-events:none;will-change:transform,opacity}
  #${ID} .nspro-water:before,#${ID} .nspro-water:after{content:'';position:absolute;inset:-8%;background:radial-gradient(ellipse at 40% 48%,transparent 0 14%,rgba(255,255,255,.26) 15% 17%,transparent 18% 26%,rgba(255,255,255,.13) 27% 30%,transparent 31%);mix-blend-mode:screen;transform:rotate(-11deg) scale(1.35)}
  #${ID} .nspro-water:after{transform:rotate(19deg) scale(1.58);opacity:.68}
  #${ID} .nspro-note{position:absolute;right:30px;bottom:24px;z-index:17;font:600 8px/1 Jost,sans-serif;letter-spacing:3px;text-transform:uppercase;color:rgba(255,255,255,.60)}
  @media(max-width:980px){
    #${ID}{height:455vh!important;min-height:455vh!important}
    #${ID} .nspro-copy{left:20px;right:20px;top:98px;width:auto}
    #${ID} .nspro-copy h2{font-size:clamp(44px,12.5vw,78px)}
    #${ID} .nspro-copy p{font-size:10px;max-width:86vw}
    #${ID} .nspro-main,#${ID} .nspro-body,#${ID} .nspro-cap{width:min(68vw,350px)}
    #${ID} .nspro-focus-ring{width:min(82vw,420px)}
    #${ID} .nspro-knife{width:min(95vw,700px);height:98px}
    #${ID} .nspro-knife .blade{top:20px;height:54px}
    #${ID} .nspro-knife .handle{top:14px;height:66px}
    #${ID} .nspro-canopy-photo{height:34vh}
  }
  @media(prefers-reduced-motion:reduce){
    #${ID}{height:auto!important;min-height:0!important}
    #${ID} .nspro-stage{position:relative;height:92svh;min-height:92svh}
    #${ID} .nspro-rain,#${ID} .nspro-knife,#${ID} .nspro-splash,#${ID} .nspro-water-photo,#${ID} .nspro-water{display:none!important}
  }`;
  document.head.appendChild(s);
}

function putAfterCollection(film){
  const collection=document.getElementById('collection');
  if(collection&&collection.parentNode&&collection.nextElementSibling!==film){
    collection.insertAdjacentElement('afterend',film);
  }
}

function hideLegacy(){
  ['scroll-cinema','v421-cinematic-film'].forEach(id=>{
    const el=document.getElementById(id);
    if(!el)return;
    el.hidden=true;
    el.setAttribute('aria-hidden','true');
    el.style.setProperty('display','none','important');
    el.style.setProperty('height','0','important');
    el.style.setProperty('min-height','0','important');
    el.style.setProperty('margin','0','important');
    el.style.setProperty('padding','0','important');
  });
}

function build(){
  if(!home())return;
  injectStyle();
  hideLegacy();

  let film=document.getElementById(ID);
  if(!film){
    film=document.createElement('section');
    film.id=ID;
    film.setAttribute('aria-label','Cinematic coconut harvest, cut and water sequence');
    film.innerHTML=`<div class="nspro-stage">
      <img class="nspro-bg" src="/assets/images/review/coastal-grove.png" alt="Coconut palms beside the coast">
      <div class="nspro-grade"></div>
      <div class="nspro-rain" aria-hidden="true"></div>
      <img class="nspro-canopy-photo" src="/assets/images/review/coastal-grove.png" alt="" aria-hidden="true">
      <div class="nspro-canopy-shade"></div>
      <div class="nspro-copy"><div class="nspro-kicker">Nariyal Sutra · Harvest Film</div><h2>The grove lets go.<em>One coconut stays.</em></h2><p>Fresh coconuts fall through the palms in depth. One moves into focus, is opened in one clean motion, and the water takes over the frame.</p></div>
      <div class="nspro-focus-ring" aria-hidden="true"></div>
      <div class="nspro-hero" aria-hidden="true"><img class="nspro-main" src="/assets/images/story-coconut-hero.png" alt=""><img class="nspro-body" src="/assets/images/story-coconut-body-cut.png" alt=""><img class="nspro-cap" src="/assets/images/story-coconut-cap-cut.png" alt=""></div>
      <div class="nspro-knife" aria-hidden="true"><span class="blade"></span><span class="handle"></span></div>
      <img class="nspro-splash" src="/assets/images/freshness-coconut-splash.webp" alt="">
      <img class="nspro-water-photo" src="/assets/images/freshness-coconut-splash.webp" alt="">
      <div class="nspro-water" aria-hidden="true"></div>
      <div class="nspro-note">Grove → fall → cut → water</div>
    </div>`;
  }

  putAfterCollection(film);

  const stage=film.querySelector('.nspro-stage');
  const rain=film.querySelector('.nspro-rain');
  const hero=film.querySelector('.nspro-main');
  const body=film.querySelector('.nspro-body');
  const cap=film.querySelector('.nspro-cap');
  const focus=film.querySelector('.nspro-focus-ring');
  const knife=film.querySelector('.nspro-knife');
  const splash=film.querySelector('.nspro-splash');
  const waterPhoto=film.querySelector('.nspro-water-photo');
  const water=film.querySelector('.nspro-water');
  const copy=film.querySelector('.nspro-copy');

  const count=innerWidth<=980?66:116;
  const nuts=[];
  const variants=[
    {b:.82,s:.88,ratio:1},
    {b:.92,s:1.02,ratio:.91},
    {b:.76,s:.82,ratio:1.10},
    {b:1.02,s:1.06,ratio:.96}
  ];

  for(let i=0;i<count;i++){
    const d=document.createElement('div');
    const v=variants[i%variants.length];
    d.className='nspro-nut'+(i%14===0?' near':'');
    const depth=((i*37)%100)/100;
    const x=3+((i*31.7+(i%9)*5.1)%94);
    const start=.014+(i/Math.max(1,count-1))*.38;
    const dur=.125+(i%6)*.008;
    const w=((innerWidth<=980?28:36)+depth*(innerWidth<=980?66:96))*v.ratio;
    const drift=((i*23)%88)-44;
    const rot=((i*47)%116)-58;
    Object.assign(d.dataset,{x:x.toFixed(2),depth:depth.toFixed(3),start:start.toFixed(4),dur:dur.toFixed(4),drift:String(drift),rot:String(rot)});
    d.style.setProperty('--w',w.toFixed(1)+'px');
    d.style.setProperty('--b',(v.b+depth*.16).toFixed(2));
    d.style.setProperty('--s',(v.s+depth*.12).toFixed(2));
    d.style.setProperty('--blur',((1-depth)*1.2).toFixed(2)+'px');
    d.innerHTML='<img src="/assets/images/story-coconut-hero.png" alt="">';
    rain.appendChild(d);
    nuts.push(d);
  }

  let raf=0;
  let ready=false;

  function render(){
    raf=0;
    const rect=film.getBoundingClientRect();
    const range=Math.max(1,film.offsetHeight-innerHeight);
    const p=clamp(-rect.top/range);

    let visible=0;
    nuts.forEach((n,i)=>{
      const start=+n.dataset.start;
      const dur=+n.dataset.dur;
      const active=p>=start&&p<=start+dur;
      if(!active){n.style.opacity='0';return;}
      const t=clamp((p-start)/dur);
      const e=smooth(t);
      const depth=+n.dataset.depth;
      const x=+n.dataset.x+Math.sin((i+1)*.81+t*4.8)*(1.2+depth*2.9);
      const y=-28+e*(150+depth*20);
      const sway=(+n.dataset.drift)*Math.sin(t*Math.PI);
      const rot=+n.dataset.rot+e*(145+depth*285);
      const edge=Math.min(1,t/.11,(1-t)/.14);
      const alpha=clamp(edge)*(0.72+depth*.27);
      const scale=.72+depth*.52+e*.10;
      const tiltX=((i%5)-2)*2.3;
      const tiltY=((i%7)-3)*2.0;
      n.style.opacity=alpha.toFixed(3);
      n.style.transform=`translate3d(calc(${x.toFixed(2)}vw + ${sway.toFixed(1)}px),${y.toFixed(2)}vh,0) translate(-50%,-50%) rotateX(${tiltX.toFixed(1)}deg) rotateY(${tiltY.toFixed(1)}deg) rotateZ(${rot.toFixed(1)}deg) scale(${scale.toFixed(3)})`;
      if(alpha>.15)visible++;
    });

    const heroIn=smooth((p-.385)/.07);
    const heroOut=1-smooth((p-.685)/.05);
    const ha=heroIn*heroOut;
    const cut=smooth((p-.575)/.045);
    const heroScale=1.62-.57*heroIn+.08*smooth((p-.51)/.09);
    hero.style.opacity=(ha*(1-cut)).toFixed(3);
    hero.style.transform=`translate(-50%,-50%) scale(${heroScale.toFixed(3)}) rotate(${((1-heroIn)*-4).toFixed(1)}deg)`;
    focus.style.opacity=(ha*.72).toFixed(3);
    focus.style.transform=`translate(-50%,-50%) scale(${(.72+heroIn*.36).toFixed(3)})`;

    body.style.opacity=(ha*cut).toFixed(3);
    cap.style.opacity=(ha*cut).toFixed(3);
    body.style.transform=`translate(-50%,-50%) translateY(${(cut*14).toFixed(1)}px) scale(1.05)`;
    cap.style.transform=`translate(-50%,-50%) translate(${(cut*68).toFixed(1)}px,${(-cut*82).toFixed(1)}px) rotate(${(cut*26).toFixed(1)}deg) scale(1.05)`;

    const knifeIn=smooth((p-.485)/.055);
    const knifeOut=1-smooth((p-.66)/.045);
    const ka=knifeIn*knifeOut;
    const kt=smooth((p-.485)/.125);
    knife.style.opacity=ka.toFixed(3);
    knife.style.transform=`translate(${(21-kt*43).toFixed(2)}vw,-50%) rotate(${(-18+kt*9).toFixed(2)}deg)`;

    const sa=smooth((p-.61)/.045)*(1-smooth((p-.845)/.06));
    const ss=.50+smooth((p-.61)/.155)*1.62;
    splash.style.opacity=sa.toFixed(3);
    splash.style.transform=`translate(-50%,-50%) scale(${ss.toFixed(3)})`;

    const wa=smooth((p-.72)/.055);
    water.style.opacity=wa.toFixed(3);
    water.style.transform=`scale(${(.58+wa*1.10).toFixed(3)})`;
    waterPhoto.style.opacity=(wa*.70).toFixed(3);
    waterPhoto.style.transform=`scale(${(.62+wa*.74).toFixed(3)})`;

    const ca=1-smooth((p-.26)/.08);
    copy.style.opacity=ca.toFixed(3);
    copy.style.transform=`translateY(${(smooth((p-.20)/.12)*-36).toFixed(1)}px)`;
    stage.style.setProperty('--bg-scale',(1.04+p*.06).toFixed(3));
    stage.style.setProperty('--bg-y',(-p*1.8).toFixed(2)+'%');

    window.__NS_V421_PRO_CINE={progress:p,rainVisible:visible,hero:ha,knife:ka,splash:sa,water:wa,count,ready};
  }

  const request=()=>{if(!raf)raf=requestAnimationFrame(render)};
  addEventListener('scroll',request,{passive:true});
  addEventListener('resize',request,{passive:true});

  /* Stabilize placement only before the film becomes test/user ready. Once ready,
     no runtime is allowed to move the section while somebody is scrolling it. */
  [0,120,320,700,1100].forEach(ms=>setTimeout(()=>{hideLegacy();putAfterCollection(film);request();},ms));
  setTimeout(()=>{
    hideLegacy();
    putAfterCollection(film);
    ready=true;
    film.dataset.ready='1';
    request();
  },1350);

  render();
}

function init(){setTimeout(build,120)}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init,{once:true}):init();
})();