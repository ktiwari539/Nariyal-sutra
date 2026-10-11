// Offline regression: programmatic product/quantity changes must notify the delivery recap.
// Run: node scripts/v421-checkout-recap-qa.mjs
import fs from 'node:fs';
import assert from 'node:assert/strict';
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const begin=html.indexOf("var ot='single';"),end=html.indexOf('function getCurrentPrice()',begin);
assert.ok(begin>0&&end>begin,'Find shipping checkout quantity handlers');
const handlers=html.slice(begin,end);
const prices={tender:77,green:70,bulk:72},results=[],state={main:0,recap:0,events:0};
const options=['tender','green','bulk'].map(value=>({value,dataset:{min:value==='bulk'?'10':value==='tender'?'5':'1',stock:value==='tender'?'150':value==='bulk'?'300':'100',mode:value==='bulk'?'bulk':'single'}}));
const select={value:'tender',options,get selectedIndex(){return options.findIndex(o=>o.value===this.value);}};
const qty={value:'5',dispatchEvent(event){
  assert.equal(event.type,'input');
  state.events++;
  state.recap=Number(qty.value)*prices[select.value];
  return true;
}};
const toggle={classList:{toggle(){}}};
const elements={oQ:qty,oPr:select,tS:toggle,tB:toggle};
class TestEvent{constructor(type){this.type=type;}}
const checkout=new Function('document','Event','calc','toast',handlers+
  '\nreturn {setT,chQ,syncProductSelection};')(
  {getElementById:id=>elements[id]},TestEvent,
  ()=>{state.main=Number(qty.value)*prices[select.value];},()=>{}
);
function verify(label,count,total){
  const result={label,qty:Number(qty.value),main:state.main,recap:state.recap};
  assert.equal(result.qty,count,label+' quantity');
  assert.equal(result.main,total,label+' subtotal');
  assert.equal(result.recap,total,label+' recap');
  results.push(result);
}
checkout.chQ(1);verify('Tender 5 to 6',6,462);
checkout.setT('bulk');verify('Bulk minimum',10,720);
select.value='green';checkout.syncProductSelection();verify('Switch to green',10,700);
assert.equal(state.events,3,'one recap input event per UI change');
console.log('PASS checkout recap synchronization: '+JSON.stringify(results));
