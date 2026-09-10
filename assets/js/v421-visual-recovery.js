/* Nariyal Sutra V42.1 — locked visual-story recovery.
   Restores the accepted desktop choreography:
   grove -> 35 falling coconuts -> dense harvest -> one remains -> same coconut
   moves to cut -> knife/cap/opening -> visible water stream -> water takeover.
   It also prevents International Trade from falling back to a coconut product
   photograph when the intended logistics photograph is unavailable.
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
  const TRADE='/assets/images/trade-logistics.svg';

  function injectStyles(){
    if($('#ns-v421-visual-recovery-style')) return;
    const s=document.createElement('style');
    s.id='ns-v421-visual-recovery-style';
    s.textContent=`
      @media(min-width:981px){
        /* V27 accepted runway. V36's 175/185vh compression made the story unreadable. */
        #v20-story-film{height:505vh!important}
        #v20-story-film .v21-real-rain{display:none!important}
        #v20-story-film .v20-rain{display:block!important;position:absolute!important;inset:0!important;z-index:13!important;overflow:hidden!important;pointer-events:none!important;contain:layout paint}
        #v20-story-film .v25-rain-coconut.v25-css-coconut{position:absolute!important;left:0!important;top:0!important;height:auto!important;max-width:none!important;display:block!important;border:0!important;opacity:0;will-change:transform,opacity;transform-origin:50% 50%;backface-visibility:hidden;aspect-ratio:.92/1!important;border-radius:49% 51% 47% 53%!important;background:
          radial-gradient(ellipse at 32% 23%,rgba(255,255,255,.27) 0 4.5%,transparent 15%),
          radial-gradient(ellipse at 46% 40%,rgba(177,214,83,.9) 0 14%,transparent 34%),
          radial-gradient(ellipse at 52% 48%,#79b642 0 22%,#4a8b2b 46%,#255f1c 72%,#113a10 100%)!important;
          box-shadow:inset -1.2vw -1.5vw 2.2vw rgba(0,0,0,.24),inset .7vw .6vw 1.1vw rgba(255,255,255,.08),0 1.2vw 2.2vw rgba(0,0,0,.3)!important;filter:saturate(.96) contrast(1.03)!important}
        #v20-story-film .v25-rain-coconut.v25-css-coconut::before{content:'';position:absolute;left:44%;top:-7%;width:13%;height:16%;border-radius:65% 35% 42% 40%;background:linear-gradient(90deg,#173a10,#617b2b 52%,#263e13);transform:rotate(9deg);transform-origin:50% 100%;box-shadow:0 4px 4px rgba(0,0,0,.18)}
        #v20-story-film .v25-rain-coconut.v25-css-coconut::after{content:'';position:absolute;left:18%;top:11%;width:24%;height:43%;border-radius:50%;background:linear-gradient(112deg,rgba(255,255,255,.12),transparent 70%);transform:rotate(15deg)}
        #v20-story-film .v25-rain-coconut.variant-1{border-radius:52% 48% 46% 54%!important;background:radial-gradient(ellipse at 29% 22%,rgba(255,255,255,.23) 0 4%,transparent 15%),radial-gradient(ellipse at 50% 46%,#9fc95a 0 20%,#5e9835 46%,#2b681e 72%,#123f11 100%)!important}
        #v20-story-film .v25-rain-coconut.variant-2{border-radius:47% 53% 52% 48%!important;background:radial-gradient(ellipse at 34% 24%,rgba(255,255,255,.22) 0 4%,transparent 16%),radial-gradient(ellipse at 50% 47%,#78b640 0 21%,#3f8427 49%,#1c5918 75%,#0c340c 100%)!important}
        #v20-story-film .v25-rain-coconut.variant-3{border-radius:50% 50% 45% 55%!important;background:radial-gradient(ellipse at 31% 23%,rgba(255,255,255,.2) 0 4%,transparent 15%),radial-gradient(ellipse at 52% 48%,#b8b451 0 18%,#7d8d32 45%,#435f21 70%,#183d12 100%)!important}
        #v20-story-film .v25-rain-coconut.depth-front{z-index:5!important;filter:saturate(1.03) brightness(1.01) contrast(1.04)!important}
        #v20-story-film .v25-rain-coconut.depth-mid{z-index:4!important}
        #v20-story-film .v25-rain-coconut.depth-back{z-index:3!important;filter:saturate(.82) brightness(.72) blur(.3px)!important}
        #v20-story-film .v25-rain-coconut.is-source{z-index:6!important}
      }
      @media(max-width:980px){#v20-story-film .v25-rain-coconut{display:none!important}}
      @media(prefers-reduced-motion:reduce){#v20-story-film .v25-rain-coconut{display:none!important}}
    `;
    document.head.appendChild(s);
  }

  function fixTradeVisuals(){
    const selectors=[
      '#export img',
      '.promise-portal.export img',
      'body.export-world .w-hero-media img',
      'body.export-world .route-map img'
    ];
    selectors.forEach(sel=>$$(sel).forEach(img=>{
      if(img.dataset.nsTradeFixed==='1') return;
      img.dataset.nsTradeFixed='1';
      img.removeAttribute('onerror');
      img.src=TRADE;
      img.alt='International container port and logistics';
    }));
    $$('.world-source-credits a[href*="30748600"]').forEach(a=>a.remove());
    if(document.body.classList.contains('export-world')){
      $$('.w-credit').forEach(c=>{
        if(/Wolfgang|Pexels|30748600|Photo:/i.test(c.textContent||'')) c.textContent='Illustrative international logistics visual · destination reviewed case by case';
      });
    }
  }

  function restoreRain(){
    const film=$('#v20-story-film'),rain=$('#v20-rain');
    if(!film||!rain||innerWidth<981||matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    film.classList.add('v421-cinematic-restored');
    $$('.v21-real-rain',film).forEach(x=>x.remove());
    rain.innerHTML='';

    const xRows=[
      [-5,12,29,47,66,84,103],
      [3,21,39,58,77,96],
      [-6,13,32,51,70,89,107],
      [4,23,42,61,80,99],
      [-5,14,34,54,74,94,108]
    ];
    const yRows=[7,27,48,69,91];
    const sourceRow=2,sourceCol=3,drops=[];
    xRows.forEach((row,r)=>row.forEach((x,c)=>{
      const source=r===sourceRow&&c===sourceCol;
      const variant=(r*3+c)%4;
      const y=yRows[r]+(((c+r)%3)-1)*2.4;
      let size=(r>=3?25:r===2?23:21)+((c*2+r)%4)*1.25;
      if(source)size=22;
      let rot=((c*7+r*5)%17)-8;if(source)rot=-1;
      const start=.055+r*.026+c*.010+((c+r)%2)*.008;
      const dur=.185+((c+r)%4)*.012;
      const drift=((c*5+r*7)%15)-7;
      const depth=source?'source':(r>=3||c%4===0?'front':(r===0||c%3===0?'back':'mid'));
      const fruit=document.createElement('span');
      fruit.className=`v25-rain-coconut v25-css-coconut variant-${variant} ${source?'is-source':`depth-${depth}`}`;
      fruit.setAttribute('aria-hidden','true');
      Object.assign(fruit.dataset,{x,y,size,rot,start,dur,drift,depth});
      fruit.style.width=size+'vw';
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
        const startY=-42-(i%6)*7;
        const x=tx+Math.sin(t*Math.PI)*dr;
        let y=startY+(ty-startY)*e;
        if(t>.72){const bt=(t-.72)/.28;y+=Math.sin(bt*Math.PI)*3.1*(1-bt)}
        const baseScale=depth==='front'?1.08:depth==='back'?.88:1;
        let scale=(.50+e*.50)*baseScale;
        let alpha=t<=0?0:clamp(t/.055,0,1)*(depth==='back'?.76:1);
        const select=smooth(clamp((p-.555)/.085,0,1));
        if(!d.classList.contains('is-source')){alpha*=1-select*.985;scale*=1-select*.025}
        else{const sourceFade=smooth(clamp((p-.615)/.038,0,1));alpha*=1-sourceFade}
        d.style.transform=`translate3d(${x.toFixed(2)}vw,${y.toFixed(2)}vh,0) translate(-50%,-50%) rotate(${rot.toFixed(2)}deg) scale(${scale.toFixed(4)})`;
        d.style.opacity=clamp(alpha,0,1).toFixed(4);
      });
    }
    function req(){if(!raf)raf=requestAnimationFrame(update)}
    addEventListener('scroll',req,{passive:true});addEventListener('resize',req,{passive:true});update();
    window.NSV421Cinematic={count:drops.length,update,version:'v27-restored'};
  }

  function init(){
    injectStyles();fixTradeVisuals();
    /* Run after legacy V21 has had a chance to build its old 9-image layer. */
    setTimeout(()=>{restoreRain();fixTradeVisuals();},180);
    setTimeout(fixTradeVisuals,800);
  }
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init,{once:true}):init();
})();
