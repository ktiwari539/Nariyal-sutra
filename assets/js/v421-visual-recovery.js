/* Nariyal Sutra V42.1 — locked visual-story recovery.
   Desktop choreography:
   grove -> 35 photographic falling coconuts -> dense harvest -> one remains ->
   same coconut moves to cut -> knife/cap/opening -> water stream -> takeover.
   Mobile/tablet keep the lighter story reel.
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
  const FRUIT='/assets/images/story-coconut-hero.png';
  const TRADE='/assets/images/trade-logistics.svg';

  function injectStyles(){
    if($('#ns-v421-visual-recovery-style')) return;
    const s=document.createElement('style');
    s.id='ns-v421-visual-recovery-style';
    s.textContent=`
      @media(min-width:981px){
        /* Keep enough runway for every accepted beat to be readable. */
        #v20-story-film{height:505vh!important}
        #v20-story-film .v21-real-rain{display:none!important}
        #v20-story-film .v20-rain{display:block!important;position:absolute!important;inset:0!important;z-index:13!important;overflow:hidden!important;pointer-events:none!important;contain:layout paint}
        #v20-story-film .v25-rain-coconut.v421-photo-rain{
          position:absolute!important;left:0!important;top:0!important;height:auto!important;max-width:none!important;
          display:block!important;border:0!important;background:transparent!important;opacity:0;
          object-fit:contain!important;will-change:transform,opacity;transform-origin:50% 50%;backface-visibility:hidden;
          filter:saturate(.98) contrast(1.03) brightness(.96) drop-shadow(0 1.25vw 1.7vw rgba(0,0,0,.38))!important
        }
        #v20-story-film .v25-rain-coconut.v421-photo-rain.depth-front{z-index:5!important;filter:saturate(1.03) contrast(1.04) brightness(1.01) drop-shadow(0 1.45vw 1.8vw rgba(0,0,0,.42))!important}
        #v20-story-film .v25-rain-coconut.v421-photo-rain.depth-mid{z-index:4!important}
        #v20-story-film .v25-rain-coconut.v421-photo-rain.depth-back{z-index:3!important;filter:saturate(.82) brightness(.72) blur(.35px) drop-shadow(0 1vw 1.35vw rgba(0,0,0,.3))!important}
        #v20-story-film .v25-rain-coconut.v421-photo-rain.is-source{z-index:6!important;filter:saturate(1.03) contrast(1.04) brightness(1.02) drop-shadow(0 1.4vw 1.9vw rgba(0,0,0,.45))!important}
      }
      @media(max-width:980px){#v20-story-film .v25-rain-coconut{display:none!important}}
      @media(prefers-reduced-motion:reduce){#v20-story-film .v25-rain-coconut{display:none!important}}
    `;
    document.head.appendChild(s);
  }

  function fixTradeVisuals(){
    const selectors=['#export img','.promise-portal.export img','body.export-world .w-hero-media img','body.export-world .route-map img'];
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

  function restoreRain(){
    const film=$('#v20-story-film'),rain=$('#v20-rain');
    if(!film||!rain||innerWidth<981||matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    film.classList.add('v421-cinematic-restored');
    $$('.v21-real-rain',film).forEach(x=>x.remove());
    rain.replaceChildren();

    /* Five rows x seven fruits = exactly 35. The centre fruit in row 3 is
       the selected source fruit that hands off to the photographic cut asset. */
    const xRows=[
      [-5,12,29,47,66,84,103],
      [-7,9,26,44,62,80,99],
      [-6,13,32,51,70,89,107],
      [-8,10,28,46,64,82,101],
      [-5,14,34,54,74,94,108]
    ];
    const yRows=[8,27,47,68,90];
    const sourceRow=2,sourceCol=3,drops=[];

    xRows.forEach((row,r)=>row.forEach((x,c)=>{
      const source=r===sourceRow&&c===sourceCol;
      const y=yRows[r]+(((c+r)%3)-1)*2.2;
      let size=(r>=3?19:r===2?18:16.5)+((c*2+r)%4)*1.0;
      if(source) size=19.5;
      let rot=((c*7+r*5)%19)-9;if(source)rot=-1.2;
      const start=.055+r*.024+c*.009+((c+r)%2)*.006;
      const dur=.19+((c+r)%4)*.012;
      const drift=((c*5+r*7)%17)-8;
      const depth=source?'source':(r>=3||c%4===0?'front':(r===0||c%3===0?'back':'mid'));
      const fruit=document.createElement('img');
      fruit.className=`v25-rain-coconut v421-photo-rain ${source?'is-source':`depth-${depth}`}`;
      fruit.src=FRUIT;
      fruit.alt='';
      fruit.decoding='async';
      fruit.draggable=false;
      fruit.setAttribute('aria-hidden','true');
      Object.assign(fruit.dataset,{x,y,size,rot,start,dur,drift,depth});
      fruit.style.width=size+'vw';
      fruit.addEventListener('error',()=>{fruit.dataset.failed='1';fruit.style.display='none';},{once:true});
      rain.appendChild(fruit);drops.push(fruit);
    }));
    rain.dataset.nsRainCount=String(drops.length);

    let raf=0;
    function progress(){const r=film.getBoundingClientRect(),range=Math.max(1,film.offsetHeight-innerHeight);return clamp(-r.top/range,0,1)}
    function update(){
      raf=0;const p=progress();
      drops.forEach((d,i)=>{
        const st=+d.dataset.start,dur=+d.dataset.dur,t=clamp((p-st)/dur,0,1),e=easeOut(t);
        const tx=+d.dataset.x,ty=+d.dataset.y,dr=+d.dataset.drift,rot=+d.dataset.rot,depth=d.dataset.depth;
        const startY=-38-(i%6)*6.5;
        const x=tx+Math.sin(t*Math.PI)*dr;
        let y=startY+(ty-startY)*e;
        if(t>.72){const bt=(t-.72)/.28;y+=Math.sin(bt*Math.PI)*2.8*(1-bt)}
        const baseScale=depth==='front'?1.08:depth==='back'?.86:1;
        const scale=(.48+e*.52)*baseScale;
        let alpha=t<=0?0:clamp(t/.06,0,1)*(depth==='back'?.78:1);

        /* Dense harvest holds through ~53%. Then all but one disappear quickly,
           leaving a clear selected fruit before the main cut coconut takes over. */
        const clearOthers=smooth(clamp((p-.548)/.050,0,1));
        if(!d.classList.contains('is-source')) alpha*=1-clearOthers*.995;
        else{
          const sourceFade=smooth(clamp((p-.625)/.035,0,1));
          alpha*=1-sourceFade;
        }

        d.style.transform=`translate3d(${x.toFixed(2)}vw,${y.toFixed(2)}vh,0) translate(-50%,-50%) rotate(${rot.toFixed(2)}deg) scale(${scale.toFixed(4)})`;
        d.style.opacity=clamp(alpha,0,1).toFixed(4);
      });
    }
    function req(){if(!raf)raf=requestAnimationFrame(update)}
    addEventListener('scroll',req,{passive:true});
    addEventListener('resize',req,{passive:true});
    update();
    window.NSV421Cinematic={count:drops.length,update,version:'v27-restored'};
  }

  function init(){
    injectStyles();
    fixTradeVisuals();
    /* Legacy V21 may build its old layer first; replace it after all inline
       scripts have initialized so there is only one rain system. */
    setTimeout(()=>{restoreRain();fixTradeVisuals();},220);
    setTimeout(fixTradeVisuals,900);
  }

  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init,{once:true}):init();
})();