(function(){
'use strict';
function loadState(){try{return window.NSV421Store?.load?.()||{};}catch{return {};}}
function productByKey(s,key){return (s.products||[]).find(p=>String(p.key||p.id||p.sku||'').toLowerCase()===String(key||'').toLowerCase());}
function setText(sel,val){document.querySelectorAll(sel).forEach(e=>{if(val!==undefined&&val!==null&&val!=='')e.textContent=val;});}
function sync(){
  const s=loadState();
  const tender=productByKey(s,'tender')||(s.products||[]).find(p=>/tender/i.test(p.name||''));
  const green=productByKey(s,'green')||(s.products||[]).find(p=>/green/i.test(p.name||''));
  const bulk=productByKey(s,'bulk')||(s.products||[]).find(p=>/bulk/i.test(p.name||''));
  const p=tender||green||bulk;
  if(p){
    setText('[data-product-retail]',p.retail??p.price);
    setText('[data-product-bulk]',p.bulk??p.bulkPrice);
    setText('[data-product-bulk-min]',p.bulkMin??p.minQty);
  }
  document.querySelectorAll('[data-product-card]').forEach(card=>{
    const x=productByKey(s,card.dataset.productCard); if(!x)return;
    const stock=card.querySelector('[data-stock-pill]');
    if(stock){const n=Number(x.stock??x.available??0);stock.textContent=n>0?`${n} available`:'Check availability';}
  });
}
function init(){sync();window.addEventListener('storage',e=>{if((e.key||'').includes('nariyal'))sync();});}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init):init();
window.NSV421Catalog={sync};
})();
