/* Nariyal Sutra V42.1 — storefront cinematic stabilization.
   Keeps the accepted live flow: grove -> natural rain -> one selected coconut ->
   restrained cut/open -> visible droplets -> photographic pour.

   Safety rules:
   - never show the historical story-coconut-*.png scene composites
   - never show the legacy oversized knife or white laser-like water stream
   - laptop/desktop sequence is compact; phone/tablet portrait keep the light reel
*/
(function(){
  'use strict';
  if(window.__NS_V421_VISUAL_RECOVERY__) return;
  window.__NS_V421_VISUAL_RECOVERY__=true;

  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const smooth=v=>{v=clamp(v,0,1);return v*v*(3-2*v)};
  const easeOut=v=>{v=clamp(v,0,1);return 1-Math.pow(1-v,3)};

  const FRUIT_ROUND='/assets/images/green-round-coconut.jpg';
  const FRUIT_PREMIUM='/assets/images/brand/coconut-premium.webp';
  const POUR='/assets/images/freshness-coconut-splash.webp';
  const TRADE='/assets/images/trade-logistics.svg';
  const CINEMATIC_MIN=769;
  const RAIN_ITEMS=30;
  const CLUSTER_ITEMS=5;

  function injectStyles(){
    if($('#ns-v421-visual-recovery-style')) return;
    const s=document.createElement('style');
    s.id='ns-v421-visual-recovery-style';
    s.textContent=`
      @media(min-width:769px){
        /* Accepted direction: readable but not a huge scrolling runway. */
        #v20-story-film{display:block!important;height:285vh!important;min-height:285vh!important;margin:0!important;padding:0!important}
        .mobile-story-reel{display:none!important}

        /* Hard-disable every known broken legacy visual. */
        #v20-story-film .v21-real-rain,
        #v20-story-film #v20-story-coconut,
        #v20-story-film .v20-knife,
        #v20-story-film .knife.v20-knife,
        #v20-story-film .v20-water-fill,
        #v20-story-film .water-stream,
        #v20-story-film .splash-ring{display:none!important;visibility:hidden!important;opacity:0!important}

        #v20-story-film .v20-rain{display:block!important;position:absolute!important;inset:0!important;z-index:13!important;overflow:hidden!important;pointer-events:none!important;contain:layout paint}
        #v20-story-film .v421-rain-item{position:absolute!important;left:0!important;top:0!important;display:block!important;opacity:0;pointer-events:none!important;will-change:transform,opacity;transform-origin:50% 50%}
        #v20-story-film .v421-rain-item .v421-photo-rain{
          position:absolute;left:50%;top:50%;width:100%;height:100%;display:block!important;
          object-fit:cover!important;object-position:50% 48%!important;border:0!important;background:#17320e!important;
          transform:translate(-50%,-50%);border-radius:50%;box-shadow:0 10px 24px rgba(0,0,0,.34);
          filter:saturate(.98) contrast(1.04) brightness(.91)
        }
        #v20-story-film .v421-rain-item.shape-round .v421-photo-rain{clip-path:ellipse(45% 47% at 50% 50%)}
        #v20-story-film .v421-rain-item.shape-tall .v421-photo-rain{clip-path:ellipse(38% 49% at 50% 50%)}
        #v20-story-film .v421-rain-item.shape-triangle .v421-photo-rain{clip-path:polygon(50% 2%,83% 22%,94% 66%,72% 95%,29% 96%,7% 66%,17% 24%)}
        #v20-story-film .v421-rain-item.tone-young .v421-photo-rain{filter:saturate(1.08) contrast(1.03) brightness(.98) hue-rotate(-4deg)}
        #v20-story-film .v421-rain-item.tone-deep .v421-photo-rain{filter:saturate(.92) contrast(1.07) brightness(.78)}
        #v20-story-film .v421-rain-item.tone-warm .v421-photo-rain{filter:saturate(.88) sepia(.20) hue-rotate(-12deg) brightness(.88)}
        #v20-story-film .v421-rain-item.depth-back{z-index:3!important;filter:blur(.25px)}
        #v20-story-film .v421-rain-item.depth-mid{z-index:4!important}
        #v20-story-film .v421-rain-item.depth-front{z-index:5!important}
        #v20-story-film .v421-rain-item.is-source{z-index:7!important}

        /* Small photographic bunches use real cropped fruit, not CSS coconuts. */
        #v20-story-film .v421-rain-item.is-cluster{width:118px!important;height:102px!important}
        #v20-story-film .v421-rain-item.is-cluster .v421-photo-rain{width:70px;height:82px}
        #v20-story-film .v421-rain-item.is-cluster .v421-photo-rain:nth-child(1){left:39%;top:48%;transform:translate(-50%,-50%) rotate(-12deg);clip-path:ellipse(42% 48% at 50% 50%)}
        #v20-story-film .v421-rain-item.is-cluster .v421-photo-rain:nth-child(2){left:66%;top:55%;transform:translate(-50%,-50%) rotate(10deg);clip-path:ellipse(39% 48% at 50% 50%);filter:saturate(.93) sepia(.12) brightness(.88)}

        /* One selected fruit. No rectangular scenery is allowed inside this stage. */
        #v20-story-film .v421-product-stage{position:absolute;z-index:18;left:var(--v421-fruit-x,52%);top:var(--v421-fruit-y,51%);width:clamp(158px,16vw,225px);aspect-ratio:.82/1;transform:translate(-50%,-50%) scale(var(--v421-fruit-scale,.9)) rotate(var(--v421-fruit-rot,-1deg));opacity:var(--v421-fruit-alpha,0);pointer-events:none;will-change:left,top,transform,opacity}
        #v20-story-film .v421-product-stage .v421-fruit-photo{position:absolute;inset:0;width:100%;height:100%;display:block;object-fit:cover;object-position:center;clip-path:ellipse(42% 48% at 50% 50%);border-radius:50%;filter:saturate(1.02) contrast(1.05) brightness(.91);box-shadow:0 24px 56px rgba(0,0,0,.46)}
        #v20-story-film .v421-product-stage::after{content:'';position:absolute;inset:5% 7%;border-radius:50%;box-shadow:inset -18px -24px 30px rgba(0,0,0,.18),inset 10px 8px 22px rgba(255,255,255,.055);pointer-events:none}
        #v20-story-film .v421-opening{position:absolute;z-index:3;left:50%;top:14%;width:33%;height:8%;transform:translate(-50%,-50%) scale(var(--v421-opening-scale,.65));opacity:var(--v421-opening-alpha,0);border-radius:50%;background:radial-gradient(ellipse,#f4f5e9 0 22%,#cfd6ba 23% 42%,#809267 44% 58%,#3a5828 60% 72%,rgba(4,12,3,.92) 74%);box-shadow:0 3px 12px rgba(0,0,0,.4)}

        /* Restrained cut gesture local to the selected fruit. */
        #v20-story-film .v421-knife{position:absolute;z-index:20;left:var(--v421-knife-left,50%);top:var(--v421-knife-top,42%);width:clamp(142px,17vw,220px);height:32px;opacity:var(--v421-knife-alpha,0);transform:translate(-50%,-50%) translateX(var(--v421-knife-x,-32px)) rotate(-8deg);filter:drop-shadow(0 9px 10px rgba(0,0,0,.42));pointer-events:none;will-change:transform,opacity}
        #v20-story-film .v421-knife .blade{position:absolute;left:0;top:8px;width:72%;height:17px;clip-path:polygon(0 18%,94% 0,100% 48%,92% 100%,0 82%);background:linear-gradient(180deg,#f7f8f4,#b7c0b9 45%,#65716a 49%,#d8ddd9 72%,#7c8781)}
        #v20-story-film .v421-knife .handle{position:absolute;right:0;top:4px;width:31%;height:24px;border-radius:4px 11px 11px 4px;background:linear-gradient(180deg,#684326,#2b190d);box-shadow:inset 0 0 0 1px rgba(212,168,67,.18)}

        /* A few physically restrained water droplets, visible long enough to read. */
        #v20-story-film .v421-splash-field{position:absolute;inset:0;z-index:22;overflow:hidden;pointer-events:none}
        #v20-story-film .v421-droplet{position:absolute;left:0;top:0;width:var(--drop-w,8px);height:var(--drop-h,15px);border-radius:65% 35% 58% 42%/72% 45% 55% 28%;opacity:0;background:radial-gradient(circle at 35% 24%,rgba(255,255,255,.98) 0 9%,rgba(208,241,247,.76) 22%,rgba(116,194,213,.42) 52%,rgba(58,132,159,.14) 73%,transparent 76%);box-shadow:0 0 10px rgba(189,232,243,.22);will-change:transform,opacity}
        #v20-story-film .v421-splash-halo{position:absolute;left:0;top:0;width:48px;height:14px;border:1px solid rgba(222,245,247,.58);border-radius:50%;opacity:0;box-shadow:0 0 18px rgba(187,229,239,.16);pointer-events:none}

        /* The water finish uses real photography instead of a synthetic white beam. */
        #v20-story-film .v421-pour-frame{position:absolute;inset:0;z-index:17;opacity:var(--v421-pour-alpha,0);pointer-events:none;overflow:hidden;background:#041003;will-change:opacity}
        #v20-story-film .v421-pour-frame img{position:absolute;inset:-2%;width:104%;height:104%;display:block;object-fit:cover;object-position:center 48%;filter:saturate(.96) contrast(1.05) brightness(.72);transform:scale(1.025)}
        #v20-story-film .v421-pour-frame::after{content:'';position:absolute;inset:0;background:linear-gradient(90deg,rgba(2,8,1,.58),rgba(2,8,1,.08) 58%,rgba(2,8,1,.30)),linear-gradient(0deg,rgba(2,8,1,.52),transparent 52%)}

        /* Keep cut copy readable on laptop widths. */
        #v20-story-film .v20-story-copy-cut{left:clamp(28px,5vw,76px)!important;right:auto!important;width:min(570px,48vw)!important;max-width:570px!important;transform:none!important}
        #v20-story-film .v20-story-copy-cut h2{font-size:clamp(40px,4.8vw,68px)!important;line-height:.95!important;max-width:100%!important}
        #v20-story-film .v20-story-copy-cut p{max-width:470px!important}
      }

      @media(min-width:769px) and (max-width:1080px){
        #v20-story-film .v20-story-copy-cut{width:min(470px,46vw)!important}
        #v20-story-film .v20-story-copy-cut h2{font-size:clamp(36px,4.6vw,52px)!important}
        #v20-story-film .v421-product-stage{width:clamp(150px,18vw,195px)}
        #v20-story-film .v421-knife{width:clamp(132px,17vw,190px)}
      }
      @media(max-width:768px){#v20-story-film .v421-rain-item,#v20-story-film .v421-product-stage,#v20-story-film .v421-knife,#v20-story-film .v421-pour-frame,#v20-story-film .v421-splash-field{display:none!important}}
      @media(prefers-reduced-motion:reduce){#v20-story-film .v421-rain-item,#v20-story-film .v421-knife,#v20-story-film .v421-splash-field{display:none!important}}
    `;
    document.head.appendChild(s);
  }

  function fixTradeVisuals(){
    const selectors=['#export img','.promise-portal.export img','.trade-route.trade-export img','body.export-world .w-hero-media img','body.export-world .route-map img'];
    selectors.forEach(sel=>$$(sel).forEach(img=>{
      if(img.dataset.nsTradeFixed==='1' && img.getAttribute('src')===TRADE) return;
      img.dataset.nsTradeFixed='1';
      img.removeAttribute('onerror');
      img.src=TRADE;
      img.alt='International container port and logistics';
    }));
    $$('.world-source-credits a[href*="30748600"]').forEach(a=>a.remove());
    if(document.body.classList.contains('export-world')){
      $$('.w-credit').forEach(c=>{if(/Wolfgang|Pexels|30748600|Photo:/i.test(c.textContent||''))c.textContent='International logistics visual · destination reviewed case by case'});
    }
  }

  function ensureStoryStage(film){
    const sticky=$('.v20-story-sticky',film);
    if(!sticky) return null;

    let stage=$('.v421-product-stage',sticky);
    if(!stage){
      stage=document.createElement('div');stage.className='v421-product-stage';stage.setAttribute('aria-hidden','true');
      stage.innerHTML=`<img class="v421-fruit-photo" src="${FRUIT_PREMIUM}" alt="" decoding="async"><span class="v421-opening"></span>`;
      sticky.appendChild(stage);
    }
    let knife=$('.v421-knife',sticky);
    if(!knife){
      knife=document.createElement('div');knife.className='v421-knife';knife.setAttribute('aria-hidden','true');knife.innerHTML='<span class="blade"></span><span class="handle"></span>';sticky.appendChild(knife);
    }
    let splash=$('.v421-splash-field',sticky);
    if(!splash){
      splash=document.createElement('div');splash.className='v421-splash-field';splash.setAttribute('aria-hidden','true');
      const vectors=[[-64,-74,7,15],[-42,-96,6,13],[-18,-112,8,17],[16,-108,6,12],[42,-90,8,16],[68,-62,7,14],[-78,-38,6,12],[78,-30,6,13],[4,-132,5,11]];
      splash.innerHTML=vectors.map((v,i)=>`<i class="v421-droplet" data-dx="${v[0]}" data-dy="${v[1]}" style="--drop-w:${v[2]}px;--drop-h:${v[3]}px" data-i="${i}"></i>`).join('')+'<i class="v421-splash-halo"></i>';
      sticky.appendChild(splash);
    }
    let pour=$('.v421-pour-frame',sticky);
    if(!pour){
      pour=document.createElement('div');pour.className='v421-pour-frame';pour.setAttribute('aria-hidden','true');pour.innerHTML=`<img src="${POUR}" alt="" decoding="async">`;sticky.appendChild(pour);
    }
    return {stage,knife,splash,pour};
  }

  function buildRain(rain){
    rain.replaceChildren();
    const items=[];
    const positions=[
      [4,12],[18,17],[33,10],[48,19],[64,11],[79,18],[94,12],
      [9,34],[24,29],[39,38],[55,31],[70,39],[86,30],[99,37],
      [2,57],[17,53],[32,62],[49,55],[65,64],[81,54],[96,61],
      [8,79],[24,73],[40,82],[56,75],[72,83],[88,74],[101,81],
      [35,46],[68,49]
    ];
    const clusterIndices=new Set([3,10,16,23,27]);
    const shapes=['shape-round','shape-tall','shape-triangle'];
    const tones=['tone-young','tone-deep','tone-warm','tone-young'];

    positions.slice(0,RAIN_ITEMS).forEach(([x,y],i)=>{
      const source=i===18;
      const cluster=clusterIndices.has(i);
      const item=document.createElement('span');
      const depth=i%5===0?'depth-back':i%4===0?'depth-front':'depth-mid';
      item.className=`v421-rain-item ${depth} ${cluster?'is-cluster':shapes[i%shapes.length]} ${tones[i%tones.length]} ${source?'is-source':''}`;
      const size=cluster?118:56+((i*13)%39);
      const rot=((i*11)%23)-11;
      const start=.035+(i%7)*.012+Math.floor(i/7)*.018;
      const dur=.17+(i%4)*.013;
      const drift=((i*7)%13)-6;
      const src=i%6===0?FRUIT_PREMIUM:FRUIT_ROUND;
      if(cluster){
        item.innerHTML=`<img class="v421-photo-rain" src="${FRUIT_ROUND}" alt="" decoding="async"><img class="v421-photo-rain" src="${FRUIT_PREMIUM}" alt="" decoding="async">`;
      }else{
        item.innerHTML=`<img class="v421-photo-rain" src="${src}" alt="" decoding="async">`;
        item.style.width=size+'px';item.style.height=Math.round(size*(i%3===1?1.18:.98))+'px';
      }
      Object.assign(item.dataset,{x,y,size,rot,start,dur,drift});
      rain.appendChild(item);items.push(item);
    });
    rain.dataset.nsRainItems=String(items.length);
    rain.dataset.nsRainClusters=String(clusterIndices.size);
    rain.dataset.nsRainFruitImages=String(rain.querySelectorAll('.v421-photo-rain').length);
    return items;
  }

  function restoreRain(){
    const film=$('#v20-story-film'),rain=$('#v20-rain');
    if(!film||!rain||innerWidth<CINEMATIC_MIN||matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    film.classList.add('v421-cinematic-restored');
    $$('.v21-real-rain',film).forEach(x=>x.remove());
    const story=ensureStoryStage(film);
    if(!story) return;
    const drops=buildRain(rain);
    const droplets=$$('.v421-droplet',story.splash),halo=$('.v421-splash-halo',story.splash);

    let raf=0;
    function progress(){const r=film.getBoundingClientRect(),range=Math.max(1,film.offsetHeight-innerHeight);return clamp(-r.top/range,0,1)}
    function update(){
      raf=0;const p=progress();

      drops.forEach((d,i)=>{
        const st=+d.dataset.start,dur=+d.dataset.dur,t=clamp((p-st)/dur,0,1),e=easeOut(t);
        const tx=+d.dataset.x,ty=+d.dataset.y,dr=+d.dataset.drift,rot=+d.dataset.rot;
        const startY=-20-(i%5)*5;
        const x=tx+Math.sin(t*Math.PI)*dr;
        const y=startY+(ty-startY)*e;
        const depthScale=d.classList.contains('depth-front')?1.06:d.classList.contains('depth-back')?.88:1;
        let alpha=t<=0?0:clamp(t/.055,0,1)*(d.classList.contains('depth-back')?.72:1);
        const clear=smooth(clamp((p-.405)/.060,0,1));
        if(!d.classList.contains('is-source'))alpha*=1-clear*.995;
        else alpha*=1-smooth(clamp((p-.485)/.035,0,1));
        d.style.transform=`translate3d(${x.toFixed(2)}vw,${y.toFixed(2)}vh,0) translate(-50%,-50%) rotate(${rot.toFixed(2)}deg) scale(${(.58+e*.42)*depthScale})`;
        d.style.opacity=clamp(alpha,0,1).toFixed(4);
      });

      /* The selected fruit takes over quickly after the rain clears. */
      const fruitIn=smooth(clamp((p-.445)/.042,0,1));
      const fruitOut=1-smooth(clamp((p-.805)/.040,0,1));
      const travel=smooth(clamp((p-.49)/.120,0,1));
      const fx=51+travel*13,fy=50+travel*4;
      film.style.setProperty('--v421-fruit-alpha',(fruitIn*fruitOut).toFixed(4));
      film.style.setProperty('--v421-fruit-x',fx.toFixed(2)+'%');
      film.style.setProperty('--v421-fruit-y',fy.toFixed(2)+'%');
      film.style.setProperty('--v421-fruit-scale',(.82+travel*.14).toFixed(4));
      film.style.setProperty('--v421-fruit-rot',(-1.5+travel*.8).toFixed(2)+'deg');

      const knifeIn=smooth(clamp((p-.635)/.025,0,1));
      const knifeOut=1-smooth(clamp((p-.715)/.025,0,1));
      const knifeMove=smooth(clamp((p-.64)/.065,0,1));
      film.style.setProperty('--v421-knife-alpha',(knifeIn*knifeOut).toFixed(4));
      film.style.setProperty('--v421-knife-left',(fx-4.5).toFixed(2)+'%');
      film.style.setProperty('--v421-knife-top',(fy-10).toFixed(2)+'%');
      film.style.setProperty('--v421-knife-x',(-30+knifeMove*62).toFixed(2)+'px');

      const opening=smooth(clamp((p-.685)/.035,0,1));
      film.style.setProperty('--v421-opening-alpha',opening.toFixed(4));
      film.style.setProperty('--v421-opening-scale',(.68+opening*.32).toFixed(4));

      /* Splash arc persists across a meaningful scroll range and works on fast jumps. */
      const splashIn=smooth(clamp((p-.695)/.025,0,1));
      const splashTravel=smooth(clamp((p-.70)/.105,0,1));
      const splashOut=1-smooth(clamp((p-.825)/.035,0,1));
      const splashAlpha=splashIn*splashOut;
      droplets.forEach((drop,i)=>{
        const dx=+drop.dataset.dx,dy=+drop.dataset.dy;
        const stagger=clamp((splashTravel-i*.018)/(.83),0,1);
        const e=easeOut(stagger);
        drop.style.left=fx.toFixed(2)+'%';
        drop.style.top=(fy-11).toFixed(2)+'%';
        drop.style.transform=`translate(-50%,-50%) translate(${(dx*e).toFixed(1)}px,${(dy*e+20*(1-e)).toFixed(1)}px) rotate(${(i*23-70).toFixed(1)}deg) scale(${(.5+e*.72).toFixed(3)})`;
        drop.style.opacity=(splashAlpha*(.58+(i%3)*.16)).toFixed(4);
      });
      if(halo){
        halo.style.left=fx.toFixed(2)+'%';halo.style.top=(fy-10).toFixed(2)+'%';
        halo.style.transform=`translate(-50%,-50%) scale(${(.55+splashTravel*1.45).toFixed(3)})`;
        halo.style.opacity=(splashAlpha*.58).toFixed(4);
      }

      const pourIn=smooth(clamp((p-.785)/.045,0,1));
      const pourOut=1-smooth(clamp((p-.985)/.012,0,1));
      film.style.setProperty('--v421-pour-alpha',(pourIn*pourOut).toFixed(4));
    }

    function req(){if(!raf)raf=requestAnimationFrame(update)}
    addEventListener('scroll',req,{passive:true});addEventListener('resize',req,{passive:true});update();
    window.NSV421Cinematic={items:drops.length,fruitImages:rain.querySelectorAll('.v421-photo-rain').length,clusters:CLUSTER_ITEMS,update,version:'v421-flow-safe',minWidth:CINEMATIC_MIN};
  }

  function localBuildMarker(){
    if(!/^(localhost|127\.0\.0\.1|\[::1\])$/i.test(location.hostname))return;
    document.documentElement.dataset.nsV421Build='flow-safe-cinematic-20260910';
    window.NS_V421_BUILD='flow-safe-cinematic-20260910';
  }

  function init(){injectStyles();localBuildMarker();fixTradeVisuals();setTimeout(()=>{restoreRain();fixTradeVisuals()},220);setTimeout(fixTradeVisuals,900)}
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init,{once:true}):init();
})();