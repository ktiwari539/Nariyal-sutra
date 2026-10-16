// V42.2 scoped regression: identity matching and truthful order subtotal.
// All tests are offline: no Firebase, orders, emails, browser credentials or deploy.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=name=>fs.readFileSync(new URL('../'+name,import.meta.url),'utf8');
const bridge=read('assets/js/v421-production-bridge.js');
const html=read('index.html');
const delivery=read('ns-delivery.js');
const adminOrders=read('assets/js/admin-v44-order-operations.js');
const login=read('admin-bcc-login.html');

assert.ok(login.includes("const returnedNotAuthorized=query.get('error')==='not-authorized'"));
assert.ok(login.includes("const returnedSessionMissing=query.get('error')==='session-not-restored'"),'Persisted Firebase auth failure must be explained');
assert.ok(login.includes('!returnedSessionMissing&&u)enter(u)'),'Do not auto-redirect back into Admin after a session restoration failure');
assert.ok(login.includes('if(explicitSignedOut||returnedSessionMissing)await enter(credential.user);'),'A manual sign-in can retry after session loss');
assert.ok(bridge.includes("?error=session-not-restored&next="),'Admin missing session must redirect with a diagnosable reason');
assert.ok(login.includes("if(u.uid===owner)return u.email===ownerEmail?'Owner':'';"),'Login role requires exact Owner email like Firestore rules');
assert.ok(bridge.includes("if(u.uid===ownerUid){if(u.email!==ownerEmail)return '';"),'Production bridge must match Firestore Owner email exactly');
const r0=bridge.indexOf('async function adminRole(u){');
const r1=bridge.indexOf('async function waitAuth()',r0);
assert.ok(r0>0&&r1>r0);
const roleSource=bridge.slice(r0,r1);
const roleFactory=new Function('roles',[
 "const STAFF_ROLES=['Admin','Manager','Operations','Content','Support','Sales'];",
 // Firestore security rules require exact case-sensitive token/role email matching.
 "const window={NS_ADMIN_CONFIG:{ownerUid:'owner-uid',ownerEmail:'owner@example.test'}};",
 "const db={};let roleRecord=null;",
 "const fsMod={doc:(_db,c,id)=>({c,id}),getDoc:async ref=>({exists:()=>!!roles[ref.id],data:()=>roles[ref.id]})};",
 roleSource,
 "return adminRole;"
].join('\n'));
const owner={uid:'owner-uid',email:'owner@example.test',emailVerified:true};
assert.equal(await roleFactory({})(owner),'Owner','Exact verified Owner email and UID must authenticate');
assert.equal(await roleFactory({})({...owner,email:'Owner@Example.Test'}),'','Case-mismatched email must fail closed to match Firestore rules');
assert.equal(await roleFactory({})({...owner,uid:'wrong-uid'}),'','Wrong UID cannot obtain Owner access');
assert.equal(await roleFactory({})({...owner,emailVerified:false}),'','Unverified account cannot obtain Owner access');
const enabled={'staff-uid':{role:'Support',email:'STAFF@example.test',status:'Active',active:true}};
assert.equal(await roleFactory(enabled)({uid:'staff-uid',email:'staff@example.test',emailVerified:true}),'','Case-mismatched staff role must fail closed to match Firestore rules');
assert.equal(await roleFactory(enabled)({uid:'staff-uid',email:'STAFF@example.test',emailVerified:true}),'Support','Matching verified staff role must authenticate');
assert.equal(await roleFactory({'staff-uid':{...enabled['staff-uid'],email:'different@example.test'}})({uid:'staff-uid',email:'staff@example.test',emailVerified:true}),'','Different email cannot gain role');

const c0=html.indexOf('function getCurrentPrice(){');
const c1=html.indexOf('function pick(name,',c0);
assert.ok(c0>0&&c1>c0);
const priceTable={tender:77,green:70,bulk:72};
const opts={
 tender:{value:'tender',textContent:'Fresh Tender Coconut',dataset:{name:'Fresh Tender Coconut',min:'5',stock:'150',active:'true'}},
 green:{value:'green',textContent:'Green Coconut',dataset:{name:'Green Coconut',min:'1',stock:'100',active:'true'}},
 bulk:{value:'bulk',textContent:'Bulk Pack',dataset:{name:'Bulk Pack',min:'10',stock:'300',active:'true'}}
};
let selected='tender',events=0;
const nodes={oQ:{value:'0',dispatchEvent(e){assert.equal(e.type,'input');events++;}},
 pAmt:{textContent:''},pNote:{textContent:''},orderSelectionSummary:{textContent:''}};
const calcFactory=new Function('document','window','currentProduct','productMin','productStock','Event',
 html.slice(c0,c1)+'\nreturn {calc,getCurrentTotal};');
const order=calcFactory({getElementById:id=>nodes[id]},
 {NSLiveCatalog:{status:'ready',price:key=>priceTable[key]}},
 ()=>opts[selected],o=>Number(o.dataset.min),o=>Number(o.dataset.stock),
 class TestEvent{constructor(type){this.type=type;}});
order.calc();
assert.equal(nodes.oQ.value,'5','Zero quantity must normalize to live minimum');
assert.equal(nodes.pAmt.textContent,'₹385','Five tender coconuts at ₹77 must total ₹385');
assert.equal(order.getCurrentTotal(),385);
assert.match(nodes.orderSelectionSummary.textContent,/live order preview/i);
assert.equal(events,1,'Updated quantity must refresh delivery recap exactly once');
selected='bulk';nodes.oQ.value='0';order.calc();
assert.equal(nodes.oQ.value,'10');
assert.equal(nodes.pAmt.textContent,'₹720','Ten bulk pieces at ₹72 must total ₹720');
assert.equal(events,2);
nodes.oQ.value='0';
assert.equal(order.getCurrentTotal(),null,'Zero quantity must not create a phantom one-piece subtotal');
opts.bulk.dataset.stock='0';order.calc();
assert.equal(nodes.pAmt.textContent,'—','Out-of-stock item must not show a charge');

const d0=delivery.indexOf('function nsDelUpdateSummary(){');
const d1=delivery.indexOf('function patchPlaceOrder()',d0);
assert.ok(d0>0&&d1>d0);
assert.ok(delivery.slice(d0,d1).includes("if(!Number.isInteger(q)||q<1)"),'Delivery preview needs explicit empty-quantity state');
assert.ok(!delivery.includes("parseInt((el('oQ')||{}).value)||1"),'No delivery/order hub fallback may fabricate a one-piece subtotal');
assert.ok(!delivery.slice(delivery.indexOf('function nsDelShowOptions(){'),delivery.indexOf('function handoverConfig(')).includes("getCurrentTotal()===null"),'Delivery preference must remain visible while live pricing/catalog state is still loading or unavailable');
assert.ok(delivery.includes('async function nsNominatimTransportPlaces('),'Railway/bus lookup must retain a browser-safe Nominatim fallback when Overpass is unavailable');
assert.ok(delivery.includes("source:'nominatim'"),'Fallback handover selections must record their real lookup source');
assert.ok(delivery.includes('window.nsFindNearestHandover=function(kind)'),'Transport choice must support an explicit nearest-from-current-location action');
assert.ok(delivery.includes("nsDelivery.locationSource='gps'"),'Nearest lookup must preserve that the buyer explicitly chose GPS');
assert.ok(delivery.includes("handoverPointName:String(nsDelivery.handoverPointName||'').slice(0,180)"),'Selected station/stand name must be attached to the private order payload');
assert.ok(delivery.includes("handoverPointAddress:String(nsDelivery.handoverPointAddress||'').slice(0,300)"),'Selected handover address must be attached to the private order payload');
assert.ok(adminOrders.includes("Preferred handover point"),'Seller/Admin order view must display the buyer-selected handover point');
assert.ok(adminOrders.includes("Handover location"),'Seller/Admin order view must display the selected handover location detail');
assert.ok(html.includes("'Preferred handover point: '+handoverPoint"),'Seller WhatsApp order summary must include the selected station/stand name');
assert.ok(login.includes("const returnedNotAuthorized=query.get('error')==='not-authorized'"),'Rejected Admin roles need an explicit explanatory login message');
assert.ok(html.includes('id="orderSelectionSummary" role="status" aria-live="polite"'),'Customer-visible live preview and screen-reader announcement');
console.log('PASS fix-forward auth UID/email guards, verified roles, live order-preview normalization, exact prices, empty and unavailable states');
