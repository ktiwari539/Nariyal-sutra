/* V42.1 compact cinematic runway.
   Keeps the full 100-coconut -> one -> cut -> splash -> water story without
   forcing customers through a long scroll section. */
(function(){
  'use strict';
  if(window.__NS_V421_CINEMATIC_COMPACT__)return;
  window.__NS_V421_CINEMATIC_COMPACT__=true;
  const style=document.createElement('style');
  style.id='ns-v421-cinematic-compact-style';
  style.textContent=`
    @media(min-width:769px){
      #v20-story-film{height:235vh!important;min-height:235vh!important}
    }
  `;
  document.head.appendChild(style);
  window.NSV421CinematicCompact={heightVh:235,version:'compact-235vh'};
})();
