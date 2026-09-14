(function(){
'use strict';
if(window.__NS_V421_GOLD_MASTER_CORRECTION__)return;
window.__NS_V421_GOLD_MASTER_CORRECTION__=true;
const KEEP_DESKTOP=new Set([2,11,19,28,37,46,57,68,79,91,103,113]);
const KEEP_MOBILE=new Set([3,14,27,40,54,65]);
let raf=0;
function installStyle(){
 if(document.getElementById('ns-v421-gold-master-correction'))return;
 const s=document.createElement('style');s.id='ns-v421-gold-master-correction';s.textContent=`
 #v421-cinematic-film-pro .nspro-focus-ring{display:none!important;opacity:0!important}
 #v421-cinematic-film-pro .nspro-nut{background:transparent!important;filter:drop-shadow(0 18px 24px rgba(0,0,0,.38))!important}
 #v421-cinematic-film-pro .nspro-nut img{background:transparent!important;filter:saturate(.96) contrast(1.03) brightness(.92)!important}
 #v421-cinematic-film-pro .nspro-nut[data-ns-natural-fall="0"]{display:none!important}
 #v421-cinematic-film-pro .nspro-nut[data-ns-natural-fall="1"]{max-width:92px!important}
 #v421-cinematic-film-pro .nspro-copy{width:min(620px,70vw)!important}
 #v421-cinematic-film-pro .nspro-copy h2{font-size:clamp(50px,5.4vw,92px)!important}
 #v421-cinematic-film-pro .nspro-knife{left:50%!important;top:53%!important;width:min(37vw,520px)!important;height:84px!important;transform-origin:56% 50%!important;filter:drop-shadow(0 18px 24px rgba(0,0,0,.44))!important}
 #v421-cinematic-film-pro .nspro-knife .blade{top:25px!important;height:34px!important;width:73%!important;border-radius:1px 30% 30% 1px!important;clip-path:polygon(0 40%,88% 6%,100% 50%,88% 94%,0 62%)!important}
 #v421-cinematic-film-pro .nspro-knife .handle{top:18px!important;height:50px!important;width:30%!important}
 #v421-cinematic-film-pro .nspro-main,#v421-cinematic-film-pro .nspro-body,#v421-cinematic-film-pro .nspro-cap{left:57%!important;top:56%!important;width:min(31vw,390px)!important}
 #v421-cinematic-film-pro .nspro-splash{width:min(58vw,840px)!important}
 #v421-cinematic-film-pro .nspro-note{display:none!important}
 @media(max-width:980px){#v421-cinematic-film-pro .nspro-main,#v421-cinematic-film-pro .nspro-body,#v421-cinematic-film-pro .nspro-cap{left:54%!important;top:57%!important;width:min(64vw,330px)!important}#v421-cinematic-film-pro .nspro-knife{left:48%!important;top:54%!important;width:min(72vw,360px)!important;height:64px!important}#v421-cinematic-film-pro .nspro-knife .blade{top:20px!important;height:26px!important}#v421-cinematic-film-pro .nspro-knife .handle{top:15px!important;height:38px!important}#v421-cinematic-film-pro .nspro-copy{width:auto!important;right:20px!important}}
 `;document.head.appendChild(s);
}
function setDistinctMedia(){
 const bg=document.querySelector('#v421-cinematic-film-pro .nspro-bg'),canopy=document.querySelector('#v421-cinematic-film-pro .nspro-canopy-photo');
 if(bg&&bg.getAttribute('src')!=='/assets/images/review/backwater-grove.png')bg.setAttribute('src','/assets/images/review/backwater-grove.png');
 if(canopy&&canopy.getAttribute('src')!=='/assets/images/review/coastal-grove.png')canopy.setAttribute('src','/assets/images/review/coastal-grove.png');
 const tradeBuy=document.querySelector('.trade-route.trade-buy img');if(tradeBuy){tradeBuy.setAttribute('src','/assets/images/freshness-coconut-splash.webp');tradeBuy.removeAttribute('srcset');tradeBuy.alt='Fresh coconut water served after a clean cut';}
}
function protectHomepageImageQuality(){
 if(!/^(?:\/|\/index\.html)$/i.test(location.pathname))return;
 document.querySelectorAll('img').forEach(img=>{
  const src=(img.currentSrc||img.getAttribute('src')||'').toLowerCase();
  if(!src.includes('/assets/images/website-media/ws001-fresh-cut-ocean.webp'))return;
  img.setAttribute('src','/assets/images/nariyal-hospitality.webp');
  img.removeAttribute('srcset');
  img.dataset.nsQualityFallback='ws001-homepage';
 });
}
function naturalizeRain(){
 const nuts=[...document.querySelectorAll('#v421-cinematic-film-pro .nspro-nut')];if(!nuts.length)return;const keep=innerWidth<=980?KEEP_MOBILE:KEEP_DESKTOP;
 nuts.forEach((nut,i)=>{const on=keep.has(i);nut.dataset.nsNaturalFall=on?'1':'0';if(!on)return;const depth=Number(nut.dataset.depth||.5);nut.style.setProperty('--w',`${Math.round(34+depth*48)}px`);nut.style.setProperty('--blur',`${((1-depth)*.45).toFixed(2)}px`);const img=nut.querySelector('img');if(img){img.src='/assets/images/story-coconut-hero.png';img.removeAttribute('srcset');}});
}
function polishCopy(){const p=document.querySelector('#v421-cinematic-film-pro .nspro-copy p');if(p)p.textContent='A small harvest releases from the canopy. One coconut stays in focus, meets the blade in a single clean cut, and the water takes over the frame.';}
function syncKnifeContact(){
 raf=0;const film=document.getElementById('v421-cinematic-film-pro'),knife=film?.querySelector('.nspro-knife');if(!film||!knife)return;const p=Number(window.__NS_V421_PRO_CINE?.progress||0);
 if(p<.47||p>.68){knife.style.removeProperty('transform');knife.dataset.nsCutContact='0';return;}
 const t=Math.max(0,Math.min(1,(p-.49)/.13)),x=26-(t*45),y=-54+(t*7),rot=-16+(t*8);knife.style.setProperty('transform',`translate(calc(-50% + ${x.toFixed(2)}vw),${y.toFixed(1)}%) rotate(${rot.toFixed(1)}deg)`,'important');knife.dataset.nsCutContact=(t>.48&&t<.78)?'1':'0';
}
function request(){if(!raf)raf=requestAnimationFrame(syncKnifeContact)}
function apply(){installStyle();setDistinctMedia();protectHomepageImageQuality();naturalizeRain();polishCopy();request();}
function init(){apply();let n=0;const timer=setInterval(()=>{apply();if(document.querySelector('#v421-cinematic-film-pro[data-ready="1"]')||++n>30)clearInterval(timer)},120);setTimeout(apply,900);setTimeout(apply,1800);addEventListener('scroll',request,{passive:true});addEventListener('resize',()=>{protectHomepageImageQuality();naturalizeRain();request()},{passive:true});addEventListener('nsv421:change',()=>setTimeout(apply,0));}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init,{once:true}):init();
})();
