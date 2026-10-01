(function(){
'use strict';
const FALLBACK='nariyal-signature';
const THEMES={
 'nariyal-signature':{name:'Nariyal Signature',description:'The approved deep-forest storefront with premium dark surfaces, cream typography and restrained gold accents.'},
 'fresh-grove':{name:'Fresh Grove',description:'A bright, botanical expression built around coconut cream, natural greens, clean surfaces and daytime freshness.'},
 'coastal-premium':{name:'Coastal Premium',description:'A luxury editorial interpretation with deep green, warm ivory, muted gold and refined photographic framing.'}
};
function valid(id){return Object.prototype.hasOwnProperty.call(THEMES,id)?id:FALLBACK;}
function requestedPreview(){
 try{const q=new URLSearchParams(location.search),id=q.get('themePreview');return id&&THEMES[id]?id:null;}catch(_){return null;}
}
function published(){
 try{return valid(window.NSV421Store?.load?.()?.themeConfig?.publishedTheme);}catch(_){return FALLBACK;}
}
function apply(){
 const preview=requestedPreview(),id=preview||published(),root=document.documentElement;
 root.dataset.nsTheme=id;root.dataset.nsThemeMode=preview?'preview':'published';root.style.colorScheme=id==='fresh-grove'?'light':'dark';
 window.NSStorefrontTheme={id,mode:root.dataset.nsThemeMode,isPreview:!!preview,themes:THEMES,fallback:FALLBACK,apply};
 window.dispatchEvent(new CustomEvent('ns:theme-applied',{detail:{id,preview:!!preview}}));
}
apply();
window.addEventListener('nsv421:change',apply);
window.addEventListener('nsv421:production-ready',apply);
})();
