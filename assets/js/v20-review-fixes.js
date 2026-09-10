(function(){
'use strict';
/* V42.1 storefront repair.
   The legacy V20/mobile/grove/cut DOM stays hidden only for compatibility with older deferred scripts.
   Customers see exactly one cinematic harvest -> cut sequence. */
function install(){
  var root=document.getElementById('scroll-cinema');
  if(!root||root.querySelector('.ns-film42'))return;
  var film=document.createElement('div');
  film.className='ns-film42';
  film.setAttribute('aria-label','Nariyal Sutra harvest and fresh-cut journey');
  film.innerHTML='\
<section class="ns-film42-scene ns-film42-harvest" aria-labelledby="ns-film42-harvest-title">\
  <div class="ns-film42-media" aria-hidden="true"><img src="assets/images/nariyal-coconut-grove.webp" alt="" decoding="async" fetchpriority="high"></div>\
  <div class="ns-film42-copy">\
    <div class="ns-film42-kicker">Chapter 01 · The Harvest</div>\
    <h2 id="ns-film42-harvest-title">The grove lets go.<em>The harvest falls.</em></h2>\
    <p>Across coconut-growing regions, fresh coconuts move through the grove in a natural harvest. From that abundance, one stays with us for the next moment.</p>\
    <div class="ns-film42-meta">COASTAL GROVE · FRESH HARVEST · ONE SELECTED</div>\
  </div>\
</section>\
<section class="ns-film42-scene ns-film42-cut" aria-labelledby="ns-film42-cut-title">\
  <div class="ns-film42-copy">\
    <div class="ns-film42-kicker">Chapter 02 · The Cut</div>\
    <h2 id="ns-film42-cut-title">One clean motion.<em>Then nature pours.</em></h2>\
    <p>A selected tender coconut is opened for serving, bringing the fresh cut, natural texture and coconut water into one clear moment.</p>\
    <div class="ns-film42-meta">SELECTED COCONUT · FRESH CUT · NATURAL WATER</div>\
    <a class="ns-film42-link" href="#collection">Explore the collection</a>\
  </div>\
  <figure class="ns-film42-cut-media">\
    <picture>\
      <source srcset="https://nariyal-sutra.netlify.app/assets/images/story-coconut-body-cut.png" type="image/png">\
      <img src="https://nariyal-sutra.netlify.app/assets/images/story-coconut-hero.png" alt="Fresh tender coconut prepared for serving" decoding="async" loading="lazy">\
    </picture>\
  </figure>\
</section>';
  root.insertBefore(film,root.firstChild);
  /* Fail closed on missing cut photography: use the premium coconut image, never broken-image UI. */
  var cut=film.querySelector('.ns-film42-cut-media img');
  if(cut){cut.addEventListener('error',function(){if(cut.dataset.fallback)return;cut.dataset.fallback='1';cut.src='https://nariyal-sutra.netlify.app/assets/images/brand/coconut-premium.webp';},{once:true});}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
