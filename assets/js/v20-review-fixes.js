(function(){
'use strict';
var SEL='#v20-story-film,.mobile-story-reel,#grove-story,#cut-story,#live-coconut-motion';
function build(){
  var anchor=document.querySelector(SEL);if(!anchor)return false;
  var section=document.createElement('section');section.id='ns-film42';section.className='ns-film42';section.setAttribute('aria-label','From harvest to fresh cut coconut');
  section.innerHTML='\
<article class="ns-film42-scene ns-film42-harvest" data-ns-film42-scene="harvest">\
  <div class="ns-film42-copy"><div class="ns-film42-kicker">CHAPTER 01 · THE HARVEST</div><h2>The grove, <em>without the gimmick.</em></h2><p>Real coastal grove photography carries the harvest moment. No floating PNG coconuts, no artificial counter, and no duplicate story layer.</p><div class="ns-film42-meta"><span>COASTAL SOURCE</span><i></i><span>REAL GROVE</span><i></i><span>NATURAL DEPTH</span></div></div>\
  <figure class="ns-film42-visual"><img id="ns-film42-harvest-img" src="/assets/images/review/coastal-grove.png" alt="Coconut grove on the coast in warm natural light" decoding="async"><figcaption>HARVEST · REAL GROVE · NATURAL DEPTH</figcaption></figure>\
</article>\
<article class="ns-film42-scene ns-film42-cut" data-ns-film42-scene="cut">\
  <figure class="ns-film42-visual"><img id="ns-film42-cut-img" src="/assets/images/ns-cut-cinematic.jpg" alt="Fresh green coconut being cut open with a full-size blade" loading="lazy" decoding="async"><figcaption>SELECTED COCONUT · FULL-SIZE BLADE · FRESH CUT</figcaption></figure>\
  <div class="ns-film42-copy"><div class="ns-film42-kicker">CHAPTER 02 · THE CUT</div><h2>One coconut.<br><em>One real cut.</em></h2><p>A real coconut-cut photograph replaces the pasted coconut, tiny CSS knife and artificial splash composition that you rejected.</p><div class="ns-film42-meta"><span>SELECTED</span><i></i><span>REAL BLADE</span><i></i><span>FRESH CUT</span></div></div>\
</article>';
  anchor.parentNode.insertBefore(section,anchor);
  Array.prototype.slice.call(document.querySelectorAll(SEL)).forEach(function(n){if(n!==section&&n.parentNode)n.parentNode.removeChild(n);});
  var scenes=Array.prototype.slice.call(section.querySelectorAll('[data-ns-film42-scene]'));
  if(!('IntersectionObserver' in window)){scenes.forEach(function(x){x.classList.add('is-inview');});return true;}
  var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting)e.target.classList.add('is-inview');});},{threshold:.16,rootMargin:'0px 0px -8% 0px'});
  scenes.forEach(function(x){io.observe(x);});
  return true;
}
if(!build())document.addEventListener('DOMContentLoaded',build,{once:true});
})();
