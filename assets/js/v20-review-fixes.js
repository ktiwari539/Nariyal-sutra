(function(){
'use strict';
var SEL='#v20-story-film,.mobile-story-reel,#grove-story,#cut-story,#live-coconut-motion';
function loadB64(path,img,fallback){
  if(fallback)img.src=fallback;
  fetch(path,{cache:'force-cache'}).then(function(r){if(!r.ok)throw new Error('asset');return r.text();}).then(function(t){t=t.trim();if(t)img.src='data:image/webp;base64,'+t;}).catch(function(){});
}
function build(){
  var anchor=document.querySelector(SEL);if(!anchor)return false;
  var section=document.createElement('section');section.id='ns-film42';section.className='ns-film42';section.setAttribute('aria-label','From harvest to fresh cut coconut');
  section.innerHTML='\
<article class="ns-film42-scene ns-film42-harvest" data-ns-film42-scene="harvest">\
  <div class="ns-film42-copy"><div class="ns-film42-kicker">CHAPTER 01 · THE HARVEST</div><h2>The grove lets go.<br><em>The harvest falls.</em></h2><p>Coconuts move through real grove depth, warm coastal light and natural perspective. One is selected from the harvest for the next moment.</p><div class="ns-film42-meta"><span>COASTAL SOURCE</span><i></i><span>NATURAL GROVE</span><i></i><span>ONE SELECTED</span></div></div>\
  <figure class="ns-film42-visual"><img id="ns-film42-harvest-img" alt="Coconut harvest in a sunlit tropical grove" decoding="async"><figcaption>HARVEST · NATURAL DEPTH · ONE SELECTED</figcaption></figure>\
</article>\
<article class="ns-film42-scene ns-film42-cut" data-ns-film42-scene="cut">\
  <figure class="ns-film42-visual"><img id="ns-film42-cut-img" alt="Fresh green coconut opened with a full-size blade and natural water splash" loading="lazy" decoding="async"><figcaption>SELECTED COCONUT · CLEAN CUT · FRESH WATER</figcaption></figure>\
  <div class="ns-film42-copy"><div class="ns-film42-kicker">CHAPTER 02 · THE CUT</div><h2>One coconut.<br><em>One clean opening.</em></h2><p>The selected coconut moves into a properly scaled cut with the blade, shell and water splash in one photographic composition.</p><div class="ns-film42-meta"><span>SELECTED</span><i></i><span>FRESH CUT</span><i></i><span>NATURAL WATER</span></div></div>\
</article>';
  anchor.parentNode.insertBefore(section,anchor);
  Array.prototype.slice.call(document.querySelectorAll(SEL)).forEach(function(n){if(n!==section&&n.parentNode)n.parentNode.removeChild(n);});
  loadB64('assets/images/ns-harvest-cinematic.webp.b64',document.getElementById('ns-film42-harvest-img'),'assets/images/review/coastal-grove.png');
  loadB64('assets/images/ns-cut-cinematic.webp.b64',document.getElementById('ns-film42-cut-img'),'assets/images/story-coconut-body-cut.png');
  var scenes=Array.prototype.slice.call(section.querySelectorAll('[data-ns-film42-scene]'));
  if(!('IntersectionObserver' in window)){scenes.forEach(function(x){x.classList.add('is-inview');});return true;}
  var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting)e.target.classList.add('is-inview');});},{threshold:.16,rootMargin:'0px 0px -8% 0px'});
  scenes.forEach(function(x){io.observe(x);});
  return true;
}
if(!build())document.addEventListener('DOMContentLoaded',build,{once:true});
})();
