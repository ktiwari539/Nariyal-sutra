/* Nariyal Sutra V42.1 — photographic cinematic recovery.
   IMPORTANT: the historical story-coconut-*.png composites are intentionally
   NOT used here. They contain baked-in rectangular scenery and produced the
   floating-photo / giant-coconut regression reported during release QA.

   Desktop/laptop story:
   grove -> small photographic coconut rain -> one selected fruit -> restrained
   cut gesture -> real photographic pour frame. Phones <=768px keep the lighter reel.
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

  const FRUIT='/assets/images/green-round-coconut.jpg';
  const POUR='/assets/images/freshness-coconut-splash.webp';
  const TRADE='/assets/images/trade-logistics.svg';
  const CINEMATIC_MIN=769;

  function injectStyles(){
    if($('#ns-v421-visual-recovery-style')) return;
    const s=document.createElement('style');
    s.id='ns-v421-visual-recovery-style';
    s.textContent=`
      @media(min-width:769px){
        #v20-story-film{display:block!important;height:505vh!important;min-height:505vh!important;margin:0!important;padding:0!important}
        .mobile-story-reel{display:none!important}

        /* Remove every legacy layer responsible for the rectangular board,
           giant composite coconut, oversized knife and laser-like stream. */
        #v20-story-film .v21-real-rain,
        #v20-story-film #v20-story-coconut,
        #v20-story-film .v20-knife,
        #v20-story-film .knife.v20-knife,
        #v20-story-film .v20-water-fill,
        #v20-story-film .water-stream,
        #v20-story-film .splash-ring{display:none!important;visibility:hidden!important}

        #v20-story-film .v20-rain{display:block!important;position:absolute!important;inset:0!important;z-index:13!important;overflow:hidden!important;pointer-events:none!important;contain:layout paint}
        #v20-story-film .v421-photo-rain{
          position:absolute!important;left:0!important;top:0!important;height:auto!important;max-width:none!important;
          display:block!important;border:0!important;background:#17320e!important;opacity:0;
          object-fit:cover!important;object-position:center!important;will-change:transform,opacity;
          transform-origin:50% 50%;backface-visibility:hidden;
          clip-path:ellipse(43% 47% at 50% 50%);border-radius:50%;
          box-shadow:0 12px 28px rgba(0,0,0,.36);
          filter:saturate(.96) contrast(1.04) brightness(.91)!important
        }
        #v20-story-film .v421-photo-rain.depth-front{z-index:5!important;filter:saturate(1.02) contrast(1.05) brightness(.98)!important}
        #v20-story-film .v421-photo-rain.depth-mid{z-index:4!important}
        #v20-story-film .v421-photo-rain.depth-back{z-index:3!important;filter:saturate(.82) brightness(.70) blur(.3px)!important}
        #v20-story-film .v421-photo-rain.is-source{z-index:6!important;filter:saturate(1.03) contrast(1.05) brightness(1)!important}

        /* New selected-fruit stage: one bounded photographic fruit, never a board. */
        #v20-story-film .v421-product-stage{position:absolute;z-index:18;left:var(--v421-fruit-x,52%);top:var(--v421-fruit-y,50%);width:clamp(170px,18vw,260px);aspect-ratio:.80/1;transform:translate(-50%,-50%) scale(var(--v421-fruit-scale,.9)) rotate(var(--v421-fruit-rot,-1deg));opacity:var(--v421-fruit-alpha,0);pointer-events:none;will-change:left,top,transform,opacity}
        #v20-story-film .v421-product-stage .v421-fruit-photo{position:absolute;inset:0;width:100%;height:100%;display:block;object-fit:cover;object-position:center;clip-path:ellipse(43% 48% at 50% 50%);border-radius:50%;filter:saturate(1.02) contrast(1.05) brightness(.92);box-shadow:0 28px 65px rgba(0,0,0,.48)}
        #v20-story-film .v421-product-stage::after{content:'';position:absolute;inset:4% 5%;border-radius:50%;box-shadow:inset -22px -26px 34px rgba(0,0,0,.18),inset 12px 10px 26px rgba(255,255,255,.06);pointer-events:none}
        #v20-story-film .v421-opening{position:absolute;z-index:2;left:50%;top:15%;width:35%;height:8%;transform:translate(-50%,-50%) scale(var(--v421-opening-scale,.65));opacity:var(--v421-opening-alpha,0);border-radius:50%;background:radial-gradient(ellipse,#eef4df 0 24%,#a9b58a 25% 48%,#385526 50% 70%,rgba(6,16,5,.92) 72%);box-shadow:0 3px 12px rgba(0,0,0,.36)}

        /* The cut gesture is intentionally small and local to the fruit. */
        #v20-story-film .v421-knife{position:absolute;z-index:20;left:var(--v421-knife-left,50%);top:var(--v421-knife-top,42%);width:clamp(160px,20vw,270px);height:38px;opacity:var(--v421-knife-alpha,0);transform:translate(-50%,-50%) translateX(var(--v421-knife-x,-45px)) rotate(-8deg);filter:drop-shadow(0 12px 12px rgba(0,0,0,.42));pointer-events:none;will-change:transform,opacity}
        #v20-story-film .v421-knife .blade{position:absolute;left:0;top:9px;width:72%;height:21px;clip-path:polygon(0 18%,94% 0,100% 48%,92% 100%,0 82%);background:linear-gradient(180deg,#f5f7f4,#aeb8b1 45%,#5e6a63 48%,#d4dad6 72%,#7a8580)}
        #v20-story-film .v421-knife .handle{position:absolute;right:0;top:5px;width:31%;height:29px;border-radius:4px 13px 13px 4px;background:linear-gradient(180deg,#684326,#2b190d);box-shadow:inset 0 0 0 1px rgba(212,168,67,.18)}

        /* Real pour photography replaces the synthetic 125vh white beam. */
        #v20-story-film .v421-pour-frame{position:absolute;inset:0;z-index:17;opacity:var(--v421-pour-alpha,0);pointer-events:none;overflow:hidden;background:#041003;will-change:opacity}
        #v20-story-film .v421-pour-frame img{position:absolute;inset:-2%;width:104%;height:104%;display:block;object-fit:cover;object-position:center 48%;filter:saturate(.96) contrast(1.05) brightness(.72);transform:scale(1.025)}
        #v20-story-film .v421-pour-frame::after{content:'';position:absolute;inset:0;background:linear-gradient(90deg,rgba(2,8,1,.58),rgba(2,8,1,.08) 58%,rgba(2,8,1,.30)),linear-gradient(0deg,rgba(2,8,1,.52),transparent 52%)}

        /* Keep story copy inside the viewport. The previous transform clipped the
           chapter heading off the left edge on laptop widths. */
        #v20-story-film .v20-story-copy-cut{left:clamp(28px,5.4vw,82px)!important;right:auto!important;width:min(610px,52vw)!important;max-width:610px!important;transform:none!important}
        #v20-story-film .v20-story-copy-cut h2{font-size:clamp(42px,5.2vw,76px)!important;line-height:.94!important;max-width:100%!important}
        #v20-story-film .v20-story-copy-cut p{max-width:500px!important}
      }

      @media(min-width:769px) and (max-width:1080px){
        #v20-story-film .v20-story-copy-cut{width:min(520px,50vw)!important}
        #v20-story-film .v20-story-copy-cut h2{font-size:clamp(38px,5vw,58px)!important}
        #v20-story-film .v421-product-stage{width:clamp(160px,19vw,215px)}
        #v20-story-film .v421-knife{width:clamp(145px,19vw,220px)}
      }
      @media(max-width:768px){#v20-story-film .v421-photo-rain,#v20-story-film .v421-product-stage,#v20-story-film .v421-knife,#v20-story-film .v421-pour-frame{display:none!important}}
      @media(prefers-reduced-motion:reduce){#v20-story-film .v421-photo-rain,#v20-story-film .v421-product-stage,#v20-story-film .v421-knife{display:none!important}}
    `;
    document.head.appendChild(s);
  }

  function fixTradeVisuals(){
    const selectors=[
      '#export img',
      '.promise-portal.export img',
      '.trade-route.trade-export img',
      'body.export-world .w-hero-media img',
      'body.export-world .route-map img'
    ];
    selectors.forEach(sel=>$$(sel).forEach(img=>{
      if(img.dataset.nsTradeFixed==='1' && img.getAttribute('src')===TRADE) return;
      img.dataset.nsTradeFixed='1';
      img.removeAttribute('onerror');
      img.src=TRADE;
      img.alt='International container port and logistics';
    }));
    $$('.world-source-credits a[href*="30748600"]').forEach(a=>a.remove());
    if(document.body.classList.contains('export-world')){
      $$('.w-credit').forEach(c=>{
        if(/Wolfgang|Pexels|30748600|Photo:/i.test(c.textContent||'')) c.textContent='International logistics visual · destination reviewed case by case';
      });
    }
  }

  function ensureStoryStage(film){
    const sticky=$('.v20-story-sticky',film);
    if(!sticky) return null;
    let stage=$('.v421-product-stage',sticky);
    if(!stage){
      stage=document.createElement('div');
      stage.className='v421-product-stage';
      stage.setAttribute('aria-hidden','true');
      stage.innerHTML=`<img class="v421-fruit-photo" src="${FRUIT}" alt="" decoding="async"><span class="v421-opening"></span>`;
      sticky.appendChild(stage);
    }
    let knife=$('.v421-knife',sticky);
    if(!knife){
      knife=document.createElement('div');
      knife.className='v421-knife';
      knife.setAttribute('aria-hidden','true');
      knife.innerHTML='<span class="blade"></span><span class="handle"></span>';
      sticky.appendChild(knife);
    }
    let pour=$('.v421-pour-frame',sticky);
    if(!pour){
      pour=document.createElement('div');
      pour.className='v421-pour-frame';
      pour.setAttribute('aria-hidden','true');
      pour.innerHTML=`<img src="${POUR}" alt="" decoding="async">`;
      sticky.appendChild(pour);
    }
    return {stage,knife,pour};
  }

  function restoreRain(){
    const film=$('#v20-story-film'),rain=$('#v20-rain');
    if(!film||!rain||innerWidth<CINEMATIC_MIN||matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    film.classList.add('v421-cinematic-restored');
    $$('.v21-real-rain',film).forEach(x=>x.remove());
    rain.replaceChildren();
    const story=ensureStoryStage(film);
    if(!story) return;

    /* Exactly 35 small photographic fruit crops. Sizes are pixel-bounded so
       none can become a giant screen-covering object on wide displays. */
    const xRows=[
      [-4,12,28,45,62,80,97],
      [4,20,36,53,70,87,103],
      [-5,13,31,49,67,85,104],
      [3,19,35,52,69,86,101],
      [-4,14,32,50,68,88,105]
    ];
    const yRows=[11,28,46,65,84];
    const sourceRow=2,sourceCol=3,drops=[];

    xRows.forEach((row,r)=>row.forEach((x,c)=>{
      const source=r===sourceRow&&c===sourceCol;
      const y=yRows[r]+(((c+r)%3)-1)*1.8;
      let size=68+((r*11+c*7)%38); // 68–105px
      if(r>=3) size+=8;
      if(source) size=112;
      const rot=((c*7+r*5)%19)-9;
      const start=.055+r*.024+c*.009+((c+r)%2)*.006;
      const dur=.19+((c+r)%4)*.012;
      const drift=((c*5+r*7)%15)-7;
      const depth=source?'source':(r>=3||c%4===0?'front':(r===0||c%3===0?'back':'mid'));
      const fruit=document.createElement('img');
      fruit.className=`v25-rain-coconut v421-photo-rain ${source?'is-source':`depth-${depth}`}`;
      fruit.src=FRUIT;
      fruit.alt='';
      fruit.decoding='async';
      fruit.draggable=false;
      fruit.setAttribute('aria-hidden','true');
      Object.assign(fruit.dataset,{x,y,size,rot,start,dur,drift,depth});
      fruit.style.width=size+'px';
      fruit.addEventListener('error',()=>{fruit.dataset.failed='1';fruit.style.display='none';},{once:true});
      rain.appendChild(fruit);drops.push(fruit);
    }));
    rain.dataset.nsRainCount=String(drops.length);

    let raf=0;
    function progress(){const r=film.getBoundingClientRect(),range=Math.max(1,film.offsetHeight-innerHeight);return clamp(-r.top/range,0,1)}
    function update(){
      raf=0;
      const p=progress();

      drops.forEach((d,i)=>{
        const st=+d.dataset.start,dur=+d.dataset.dur,t=clamp((p-st)/dur,0,1),e=easeOut(t);
        const tx=+d.dataset.x,ty=+d.dataset.y,dr=+d.dataset.drift,rot=+d.dataset.rot,depth=d.dataset.depth;
        const startY=-25-(i%6)*5.5;
        const x=tx+Math.sin(t*Math.PI)*dr;
        const y=startY+(ty-startY)*e;
        const baseScale=depth==='front'?1.05:depth==='back'?.88:1;
        const scale=(.56+e*.44)*baseScale;
        let alpha=t<=0?0:clamp(t/.06,0,1)*(depth==='back'?.72:1);
        const clearOthers=smooth(clamp((p-.548)/.050,0,1));
        if(!d.classList.contains('is-source')) alpha*=1-clearOthers*.995;
        else alpha*=1-smooth(clamp((p-.625)/.035,0,1));
        d.style.transform=`translate3d(${x.toFixed(2)}vw,${y.toFixed(2)}vh,0) translate(-50%,-50%) rotate(${rot.toFixed(2)}deg) scale(${scale.toFixed(4)})`;
        d.style.opacity=clamp(alpha,0,1).toFixed(4);
      });

      /* Same photographic source fruit moves from harvest into preparation. */
      const fruitIn=smooth(clamp((p-.595)/.045,0,1));
      const fruitOut=1-smooth(clamp((p-.875)/.035,0,1));
      const travel=smooth(clamp((p-.64)/.105,0,1));
      const fx=50+travel*14;
      const fy=50+travel*5;
      film.style.setProperty('--v421-fruit-alpha',(fruitIn*fruitOut).toFixed(4));
      film.style.setProperty('--v421-fruit-x',fx.toFixed(2)+'%');
      film.style.setProperty('--v421-fruit-y',fy.toFixed(2)+'%');
      film.style.setProperty('--v421-fruit-scale',(.82+travel*.15).toFixed(4));
      film.style.setProperty('--v421-fruit-rot',(-1.5+travel*.8).toFixed(2)+'deg');

      /* Restrained local cut. */
      const knifeIn=smooth(clamp((p-.795)/.022,0,1));
      const knifeOut=1-smooth(clamp((p-.852)/.020,0,1));
      const knifeMove=smooth(clamp((p-.800)/.050,0,1));
      film.style.setProperty('--v421-knife-alpha',(knifeIn*knifeOut).toFixed(4));
      film.style.setProperty('--v421-knife-left',(fx-5).toFixed(2)+'%');
      film.style.setProperty('--v421-knife-top',(fy-10).toFixed(2)+'%');
      film.style.setProperty('--v421-knife-x',(-34+knifeMove*72).toFixed(2)+'px');
      const opening=smooth(clamp((p-.835)/.030,0,1));
      film.style.setProperty('--v421-opening-alpha',opening.toFixed(4));
      film.style.setProperty('--v421-opening-scale',(.65+opening*.35).toFixed(4));

      /* Natural photographic pour takes over; no synthetic beam. */
      const pourIn=smooth(clamp((p-.862)/.040,0,1));
      const pourOut=1-smooth(clamp((p-.985)/.014,0,1));
      film.style.setProperty('--v421-pour-alpha',(pourIn*pourOut).toFixed(4));
    }

    function req(){if(!raf)raf=requestAnimationFrame(update)}
    addEventListener('scroll',req,{passive:true});
    addEventListener('resize',req,{passive:true});
    update();
    window.NSV421Cinematic={count:drops.length,update,version:'v421-photo-safe',minWidth:CINEMATIC_MIN};
  }

  function localBuildMarker(){
    if(!/^(localhost|127\.0\.0\.1|\[::1\])$/i.test(location.hostname)) return;
    document.documentElement.dataset.nsV421Build='photo-safe-cinematic-20260910';
    window.NS_V421_BUILD='photo-safe-cinematic-20260910';
  }

  function init(){
    injectStyles();
    localBuildMarker();
    fixTradeVisuals();
    setTimeout(()=>{restoreRain();fixTradeVisuals();},220);
    setTimeout(fixTradeVisuals,900);
  }

  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init,{once:true}):init();
})();