/* Nariyal Sutra V42.1 — final harvest cinematic override.
   Acceptance target: ~100 coconuts fall like rain -> one selected coconut remains ->
   a restrained knife cut opens it -> visible water/splash -> photographic water finish.
   This layer takes ownership after the older recovery layer and removes its visual stage.
*/
(function(){
  'use strict';
  if(window.__NS_V421_CINEMATIC_FINAL__) return;
  window.__NS_V421_CINEMATIC_FINAL__=true;

  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
  const smooth=v=>{v=clamp(v);return v*v*(3-2*v)};
  const ease=v=>1-Math.pow(1-clamp(v),3);
  const FRUIT_A='/assets/images/brand/coconut-premium.webp';
  const FRUIT_B='/assets/images/green-round-coconut.jpg';
  const WATER='/assets/images/freshness-coconut-splash.webp';
  const COUNT=100;
  let raf=0;

  function css(){
    if($('#ns-v421-cinematic-final-style')) return;
    const s=document.createElement('style');s.id='ns-v421-cinematic-final-style';s.textContent=`
      @media(min-width:769px){
        #v20-story-film{height:300vh!important;min-height:300vh!important}
        #v20-story-film .v421-product-stage,#v20-story-film .v421-knife,#v20-story-film .v421-splash-field,#v20-story-film .v421-pour-frame{display:none!important}
        #v20-story-film .v421-final-stage{position:absolute;inset:0;z-index:30;pointer-events:none;overflow:hidden}
        #v20-story-film .v421-final-rain{position:absolute;inset:0;z-index:1;overflow:hidden}
        #v20-story-film .v421-final-coconut{position:absolute;left:0;top:0;width:var(--cw);height:var(--ch);opacity:0;will-change:transform,opacity;filter:drop-shadow(0 9px 13px rgba(0,0,0,.34))}
        #v20-story-film .v421-final-coconut img{width:100%;height:100%;display:block;object-fit:cover;object-position:center;border-radius:50%;clip-path:ellipse(var(--cx,43%) var(--cy,48%) at 50% 50%);filter:saturate(var(--sat,1)) brightness(var(--bri,.92)) contrast(1.04)}
        #v20-story-film .v421-final-coconut.shape-tall img{clip-path:ellipse(36% 49% at 50% 50%)}
        #v20-story-film .v421-final-coconut.shape-angular img{clip-path:polygon(50% 2%,82% 20%,94% 66%,70% 96%,30% 96%,6% 65%,18% 22%)}
        #v20-story-film .v421-final-coconut.depth-back{filter:blur(.35px) drop-shadow(0 6px 10px rgba(0,0,0,.25))}
        #v20-story-film .v421-final-coconut.source{z-index:6!important}

        #v20-story-film .v421-final-selected{position:absolute;z-index:6;left:var(--fx,52%);top:var(--fy,52%);width:clamp(150px,15vw,220px);height:clamp(188px,19vw,275px);opacity:var(--fa,0);transform:translate(-50%,-50%) scale(var(--fs,.86)) rotate(var(--fr,-1deg));will-change:left,top,transform,opacity}
        #v20-story-film .v421-final-selected>img{width:100%;height:100%;display:block;object-fit:cover;object-position:center;border-radius:50%;clip-path:ellipse(41% 48% at 50% 50%);filter:saturate(1.03) brightness(.94) contrast(1.05);box-shadow:0 24px 55px rgba(0,0,0,.48)}
        #v20-story-film .v421-final-opening{position:absolute;left:50%;top:13%;width:34%;height:8%;border-radius:50%;opacity:var(--oa,0);transform:translate(-50%,-50%) scale(var(--os,.65));background:radial-gradient(ellipse,#f7f6e9 0 23%,#d5ddc2 24% 43%,#81996a 45% 61%,#345226 63% 74%,rgba(5,14,4,.92) 76%);box-shadow:0 2px 9px rgba(0,0,0,.38)}

        #v20-story-film .v421-final-knife{position:absolute;z-index:8;left:var(--kx,48%);top:var(--ky,43%);width:clamp(145px,16vw,215px);height:31px;opacity:var(--ka,0);transform:translate(-50%,-50%) translateX(var(--ks,-34px)) rotate(-8deg);filter:drop-shadow(0 9px 10px rgba(0,0,0,.42))}
        #v20-story-film .v421-final-knife .blade{position:absolute;left:0;top:7px;width:72%;height:17px;clip-path:polygon(0 18%,94% 0,100% 48%,92% 100%,0 82%);background:linear-gradient(180deg,#f8f9f6,#bcc6bf 44%,#67736c 49%,#dde2de 72%,#79847e)}
        #v20-story-film .v421-final-knife .handle{position:absolute;right:0;top:3px;width:31%;height:25px;border-radius:4px 11px 11px 4px;background:linear-gradient(180deg,#704a29,#2d1a0e)}

        #v20-story-film .v421-final-splash{position:absolute;inset:0;z-index:9;overflow:hidden}
        #v20-story-film .v421-final-drop{position:absolute;left:var(--dx0);top:var(--dy0);width:var(--dw);height:var(--dh);border-radius:65% 35% 58% 42%/72% 45% 55% 28%;opacity:0;background:radial-gradient(circle at 34% 25%,rgba(255,255,255,.98) 0 10%,rgba(209,241,247,.8) 24%,rgba(102,184,207,.43) 56%,transparent 76%);box-shadow:0 0 10px rgba(188,230,240,.2);will-change:transform,opacity}
        #v20-story-film .v421-final-water{position:absolute;inset:0;z-index:4;opacity:var(--wa,0);overflow:hidden;background:#041003;will-change:opacity}
        #v20-story-film .v421-final-water img{position:absolute;inset:-2%;width:104%;height:104%;object-fit:cover;object-position:center 48%;filter:saturate(.96) contrast(1.05) brightness(.7);transform:scale(1.025)}
        #v20-story-film .v421-final-water:after{content:'';position:absolute;inset:0;background:linear-gradient(90deg,rgba(2,8,1,.58),rgba(2,8,1,.06) 58%,rgba(2,8,1,.28)),linear-gradient(0deg,rgba(2,8,1,.52),transparent 54%)}
        #v20-story-film .v20-story-copy-cut{left:clamp(28px,5vw,76px)!important;width:min(550px,47vw)!important;transform:none!important}
        #v20-story-film .v20-story-copy-cut h2{font-size:clamp(38px,4.6vw,66px)!important;line-height:.96!important}
      }
      @media(max-width:768px){#v20-story-film .v421-final-stage{display:none!important}}
      @media(prefers-reduced-motion:reduce){#v20-story-film .v421-final-rain,#v20-story-film .v421-final-knife,#v20-story-film .v421-final-splash{display:none!important}}
    `;document.head.appendChild(s);
  }

  function build(){
    if(innerWidth<769||matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const film=$('#v20-story-film'),sticky=$('.v20-story-sticky',film),rain=$('#v20-rain',film);
    if(!film||!sticky||!rain) return;

    /* Remove every older generated coconut before creating the final 100. */
    rain.replaceChildren();
    $$('.v421-final-stage',film).forEach(x=>x.remove());
    const stage=document.createElement('div');stage.className='v421-final-stage';stage.setAttribute('aria-hidden','true');
    stage.innerHTML='<div class="v421-final-rain"></div><div class="v421-final-selected"><img src="'+FRUIT_A+'" alt=""><i class="v421-final-opening"></i></div><div class="v421-final-knife"><i class="blade"></i><i class="handle"></i></div><div class="v421-final-splash"></div><div class="v421-final-water"><img src="'+WATER+'" alt=""></div>';
    sticky.appendChild(stage);
    const rainHost=$('.v421-final-rain',stage),splash=$('.v421-final-splash',stage);
    const items=[];

    /* Deterministic 10x10 field. Start times are staggered so the page reads as
       continuous coconut rain instead of a static wall. */
    for(let i=0;i<COUNT;i++){
      const row=Math.floor(i/10),col=i%10;
      const x=-4+col*11.8+((row*7+col*3)%7)-3;
      const y=7+row*9.8+(((col+row)%3)-1)*2.4;
      const size=42+((i*17)%43); // 42-84px
      const h=Math.round(size*(i%3===0?1.18:(i%4===0?.9:1.04)));
      const source=i===54;
      const el=document.createElement('span');
      const shape=i%7===0?'shape-angular':i%3===0?'shape-tall':'';
      const depth=i%6===0?'depth-back':i%5===0?'depth-front':'depth-mid';
      el.className='v421-final-coconut '+shape+' '+depth+(source?' source':'');
      el.style.setProperty('--cw',size+'px');el.style.setProperty('--ch',h+'px');
      el.style.setProperty('--sat',String(.86+(i%5)*.055));el.style.setProperty('--bri',String(.76+(i%4)*.065));
      el.innerHTML='<img src="'+(i%5===0?FRUIT_A:FRUIT_B)+'" alt="" decoding="async">';
      Object.assign(el.dataset,{x,y,source:source?'1':'0',start:(.018+(i%10)*.006+row*.004).toFixed(4),dur:(.17+(i%5)*.012).toFixed(4),drift:String(((i*13)%15)-7),rot:String(((i*19)%25)-12)});
      rainHost.appendChild(el);items.push(el);
    }

    const drops=[[-92,-48,7,15],[-75,-86,6,13],[-50,-118,7,17],[-22,-136,6,12],[8,-142,8,17],[35,-128,6,13],[63,-104,8,16],[86,-72,7,14],[102,-38,6,12],[-112,-18,6,13],[116,-12,6,12],[0,-165,5,11]];
    splash.innerHTML=drops.map((d,i)=>'<i class="v421-final-drop" data-i="'+i+'" data-vx="'+d[0]+'" data-vy="'+d[1]+'" style="--dw:'+d[2]+'px;--dh:'+d[3]+'px"></i>').join('');
    const dropEls=$$('.v421-final-drop',splash);
    rain.dataset.nsRainCount=String(COUNT);rain.dataset.nsRainItems=String(COUNT);

    function progress(){const r=film.getBoundingClientRect(),range=Math.max(1,film.offsetHeight-innerHeight);return clamp(-r.top/range)}
    function update(){
      raf=0;const p=progress();
      items.forEach((el,i)=>{
        const st=+el.dataset.start,dur=+el.dataset.dur,t=clamp((p-st)/dur),e=ease(t);
        const tx=+el.dataset.x,ty=+el.dataset.y,dr=+el.dataset.drift,rot=+el.dataset.rot;
        const startY=-28-(i%8)*4.5;
        const x=tx+Math.sin(t*Math.PI)*dr;
        const y=startY+(ty-startY)*e;
        let a=t<=0?0:clamp(t/.045);
        const clear=smooth((p-.38)/.065);
        if(el.dataset.source!=='1')a*=1-clear*.998;
        else a*=1-smooth((p-.49)/.038);
        el.style.transform='translate3d('+x.toFixed(2)+'vw,'+y.toFixed(2)+'vh,0) translate(-50%,-50%) rotate('+rot+'deg) scale('+(0.55+e*.45).toFixed(3)+')';
        el.style.opacity=clamp(a).toFixed(4);
      });

      const fi=smooth((p-.43)/.045),fo=1-smooth((p-.82)/.04),travel=smooth((p-.49)/.12);
      const fx=50+travel*14,fy=50+travel*4;
      film.style.setProperty('--fa',(fi*fo).toFixed(4));film.style.setProperty('--fx',fx.toFixed(2)+'%');film.style.setProperty('--fy',fy.toFixed(2)+'%');film.style.setProperty('--fs',(.82+travel*.15).toFixed(3));film.style.setProperty('--fr',(-1.4+travel*.8).toFixed(2)+'deg');

      const ki=smooth((p-.62)/.025),ko=1-smooth((p-.71)/.025),km=smooth((p-.625)/.065);
      film.style.setProperty('--ka',(ki*ko).toFixed(4));film.style.setProperty('--kx',(fx-4).toFixed(2)+'%');film.style.setProperty('--ky',(fy-10).toFixed(2)+'%');film.style.setProperty('--ks',(-32+km*66).toFixed(1)+'px');
      const open=smooth((p-.675)/.035);film.style.setProperty('--oa',open.toFixed(4));film.style.setProperty('--os',(.66+open*.34).toFixed(3));

      const si=smooth((p-.69)/.025),st=smooth((p-.695)/.11),so=1-smooth((p-.825)/.04),sa=si*so;
      dropEls.forEach((d,i)=>{
        const vx=+d.dataset.vx,vy=+d.dataset.vy,e=ease(clamp((st-i*.018)/.82));
        d.style.setProperty('--dx0',fx.toFixed(2)+'%');d.style.setProperty('--dy0',(fy-10).toFixed(2)+'%');
        d.style.transform='translate(-50%,-50%) translate('+(vx*e).toFixed(1)+'px,'+(vy*e+18*(1-e)).toFixed(1)+'px) rotate('+(i*21-65)+'deg) scale('+(0.5+e*.75).toFixed(3)+')';
        d.style.opacity=(sa*(.58+(i%3)*.15)).toFixed(4);
      });
      const wi=smooth((p-.785)/.045),wo=1-smooth((p-.985)/.012);film.style.setProperty('--wa',(wi*wo).toFixed(4));
    }
    function request(){if(!raf)raf=requestAnimationFrame(update)}
    addEventListener('scroll',request,{passive:true});addEventListener('resize',request,{passive:true});update();
    window.NSV421CinematicFinal={count:COUNT,update,version:'100-rain-cut-water'};
    if(/^(localhost|127\.0\.0\.1|\[::1\])$/i.test(location.hostname))window.NS_V421_BUILD='100-rain-cut-water-20260910';
  }

  function init(){css();setTimeout(build,650)}
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init,{once:true}):init();
})();
