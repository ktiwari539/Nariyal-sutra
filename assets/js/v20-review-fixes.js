(function(){
'use strict';
var LEGACY='#v20-story-film,.mobile-story-reel,#grove-story,#cut-story,#live-coconut-motion';
function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
function smooth(v){v=clamp(v,0,1);return v*v*(3-2*v);}
function build(){
  var anchor=document.querySelector(LEGACY); if(!anchor) return false;
  var section=document.createElement('section');
  section.id='ns-film42'; section.className='ns-film42'; section.setAttribute('aria-label','From grove harvest to fresh cut coconut');
  section.innerHTML='\
  <div class="ns-film42-sticky">\
    <div class="ns-film42-bg"><img src="/assets/images/review/coastal-grove.png" alt="Sunlit coastal coconut grove" decoding="async"></div>\
    <div class="ns-film42-rain" id="ns-film42-rain" aria-hidden="true"></div>\
    <div class="ns-film42-shade" aria-hidden="true"></div>\
    <div class="ns-film42-copy ns-film42-copy-grove">\
      <div class="ns-film42-kicker">CHAPTER 01 · THE HARVEST</div>\
      <h2>The grove lets go.<br><em>The harvest gathers.</em></h2>\
      <p>Coastal groves move with the season. As the harvest gathers, one coconut is selected for a clean, fresh preparation.</p>\
      <div class="ns-film42-meta"><span>COASTAL SOURCE</span><i></i><span>NATURAL GROVE</span><i></i><span>SELECTED FRESH</span></div>\
    </div>\
    <div class="ns-film42-count"><b id="ns-film42-count">30</b><span>HARVEST MOMENT</span></div>\
    <div class="ns-film42-selected-wrap" aria-hidden="true"><img class="ns-film42-selected" src="/assets/images/cinematic/coconut-rain-1.png" alt=""></div>\
    <div class="ns-film42-cut-bg" aria-hidden="true"><img src="/assets/images/ns-cut-cinematic.jpg" alt=""></div>\
    <div class="ns-film42-copy ns-film42-copy-cut">\
      <div class="ns-film42-kicker">CHAPTER 02 · THE CUT</div>\
      <h2>One coconut.<br><em>One clean opening.</em></h2>\
      <p>A clean cut opens the fruit at its freshest moment, releasing the water naturally and readying it for a simple, beautiful serve.</p>\
      <div class="ns-film42-meta"><span>ONE SELECTED</span><i></i><span>FRESH CUT</span><i></i><span>NATURAL WATER</span></div>\
    </div>\
    <div class="ns-film42-progress" aria-hidden="true"><i></i></div>\
  </div>';
  anchor.parentNode.insertBefore(section,anchor);
  Array.prototype.slice.call(document.querySelectorAll(LEGACY)).forEach(function(n){if(n.parentNode)n.parentNode.removeChild(n);});

  var rain=section.querySelector('#ns-film42-rain');
  var count=section.querySelector('#ns-film42-count');
  var mobile=window.matchMedia('(max-width:700px)').matches;
  var tablet=window.matchMedia('(max-width:1024px)').matches;
  var total=mobile?10:(tablet?16:30);
  var sprites=['1','3','4','5'];
  var drops=[];
  for(var i=0;i<total;i++){
    var img=document.createElement('img');
    var depth=i%3;
    img.src='/assets/images/cinematic/coconut-rain-'+sprites[i%sprites.length]+'.png';
    img.alt=''; img.setAttribute('aria-hidden','true');
    var x=3+((i*37)%94); var size=(depth===0?54:depth===1?78:106)+((i*13)%28);
    img.style.left=x+'%'; img.style.width=size+'px';
    img.dataset.offset=((i*17)%100)/100; img.dataset.drift=(-42+((i*29)%84)); img.dataset.rot=(-28+((i*31)%56)); img.dataset.depth=depth;
    if(depth===0) img.classList.add('depth-back'); else if(depth===2) img.classList.add('depth-front');
    rain.appendChild(img); drops.push(img);
  }

  var raf=0;
  function update(){
    raf=0;
    var r=section.getBoundingClientRect(); var range=Math.max(1,section.offsetHeight-innerHeight); var p=clamp(-r.top/range,0,1);
    var groveExit=1-smooth((p-.12)/.12);
    var rainIn=smooth((p-.08)/.14); var rainOut=1-smooth((p-.56)/.12); var rainAlpha=clamp(rainIn*rainOut,0,1);
    var hero=smooth((p-.50)/.12)*(1-smooth((p-.70)/.10));
    var cut=smooth((p-.66)/.16);
    var cutCopy=smooth((p-.72)/.12);
    section.style.setProperty('--grove-copy',groveExit.toFixed(3));
    section.style.setProperty('--rain-alpha',rainAlpha.toFixed(3));
    section.style.setProperty('--hero-alpha',hero.toFixed(3));
    section.style.setProperty('--cut-alpha',cut.toFixed(3));
    section.style.setProperty('--cut-copy',cutCopy.toFixed(3));
    section.style.setProperty('--progress',(p*100).toFixed(2)+'%');
    section.style.setProperty('--bg-scale',(1.045-p*.025).toFixed(4));
    var cv=p<.10?30:Math.round(30+70*smooth((p-.10)/.34)); if(p>.54)cv=100; count.textContent=cv;
    drops.forEach(function(d,i){
      var off=+d.dataset.offset, drift=+d.dataset.drift, baseRot=+d.dataset.rot, depth=+d.dataset.depth;
      var phase=(p*2.05+off)%1; var y=-24+phase*142; var dx=Math.sin((phase+i*.13)*Math.PI*2)*drift;
      var rot=baseRot+phase*(depth===2?52:34);
      var scale=depth===0?.72:depth===1?.92:1.14;
      var opacity=rainAlpha*(depth===0?.62:depth===1?.82:.98);
      d.style.transform='translate3d('+dx.toFixed(1)+'px,'+y.toFixed(1)+'vh,0) rotate('+rot.toFixed(1)+'deg) scale('+scale+')';
      d.style.opacity=opacity.toFixed(3);
    });
  }
  function request(){if(!raf)raf=requestAnimationFrame(update);}
  addEventListener('scroll',request,{passive:true}); addEventListener('resize',request,{passive:true}); update();
  return true;
}
if(!build())document.addEventListener('DOMContentLoaded',build,{once:true});
})();
