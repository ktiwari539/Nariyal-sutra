'use strict';
const ALLOWED_KINDS=new Set(['customer_request','owner_order','customer_status','customer_inquiry','owner_inquiry']);
const PUBLIC_KEY=process.env.EMAILJS_PUBLIC_KEY||'aDjTgmhSPrBeTpnOA';
const SERVICE_ID=process.env.EMAILJS_SERVICE_ID||'service_c24xpf8';
const TEMPLATE_ID=process.env.EMAILJS_TEMPLATE_ID||'template_y01paqk';
const OWNER_EMAIL=process.env.NS_OWNER_EMAIL||'nariyalsutra@gmail.com';
const SITE_URL=process.env.URL||'https://nariyal-sutra.netlify.app';
const ADMIN_URL=SITE_URL.replace(/\/$/,'')+'/admin';
const buckets=new Map();
const STATUS_COPY={
 pending:{headline:'Order received',label:'Pending review',message:'Your order request is recorded and waiting for review.'},
 confirmed:{headline:'Order confirmed',label:'Confirmed',message:'Your order has been confirmed.'},
 preparing:{headline:'Your order is being prepared',label:'Preparing',message:'We are preparing your order for dispatch.'},
 ready_for_dispatch:{headline:'Ready for dispatch',label:'Ready for dispatch',message:'Your order is prepared and ready for dispatch.'},
 out_for_delivery:{headline:'Out for delivery',label:'Out for delivery',message:'Your order is on the way. Use the private tracking link for the latest delivery update.'},
 delivered:{headline:'Delivered',label:'Delivered',message:'Your order has been marked delivered.'},
 cancelled:{headline:'Order cancelled',label:'Cancelled',message:'Your order has been cancelled. Contact us if you need help with the next step.'}
};
function json(status,body){return {statusCode:status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','access-control-allow-origin':SITE_URL,'vary':'Origin'},body:JSON.stringify(body)}}
function allowedOrigin(v){if(!v)return false;try{const u=new URL(v);if(u.protocol!=='https:')return false;if(u.hostname==='nariyal-sutra.netlify.app')return true;if(u.hostname.endsWith('--nariyal-sutra.netlify.app'))return true;if(process.env.URL&&u.origin===new URL(process.env.URL).origin)return true;return false;}catch{return false}}
function rateOk(ip){const now=Date.now(),key=String(ip||'unknown'),b=buckets.get(key)||[];const live=b.filter(x=>now-x<60000);if(live.length>=12)return false;live.push(now);buckets.set(key,live);return true;}
function money(v){return Number(v||0).toLocaleString('en-IN')}
function hasTracking(d){return /^[0-9a-f]{48}$/i.test(String(d?.trackingToken||''))}
function trackUrl(d){return hasTracking(d)?SITE_URL.replace(/\/$/,'')+'/track?t='+encodeURIComponent(d.trackingToken):''}
function params(kind,d){
 d=d||{};
 const isInquiry=kind.includes('inquiry'),isOwner=kind.startsWith('owner_');
 const id=d.orderId||d.inquiryId||'',customer=d.customerName||d.name||'Customer',email=d.email||'',phone=d.phone||'';
 const product=(d.productName||d.productPreference||'').toString().replaceAll('_',' '),qty=Number(d.quantity||d.qty||0),total=Number(d.total||0),status=String(d.status||'pending');
 let subject='',headline='',label='',message='',to=email,ctaText='',ctaUrl='',showOrder='',showTracking='',detailTitle='Details';
 if(kind==='customer_request'){
   subject='Order Request Received #'+id;headline='We received your order request';label='Pending review';
   message='Your request is safely recorded. We will review stock, serviceability and delivery timing, then confirm the order with you on WhatsApp.';
   ctaText=hasTracking(d)?'Track Your Order':'Visit Nariyal Sutra';ctaUrl=trackUrl(d)||SITE_URL;showOrder='1';showTracking=hasTracking(d)?'1':'';detailTitle='Order summary';
 }else if(kind==='owner_order'){
   to=OWNER_EMAIL;subject='New Order Request #'+id;headline='New website order request';label='Pending review';
   message=customer+' requested '+String(qty||0)+' × '+(product||'product')+' for ₹'+money(total)+'.';
   ctaText='Open Owner Dashboard';ctaUrl=ADMIN_URL;showOrder='1';detailTitle='Order summary';
 }else if(kind==='customer_status'){
   const copy=STATUS_COPY[status]||STATUS_COPY.pending;
   subject=copy.headline+' #'+id;headline=copy.headline;label=copy.label;message=d.statusNote||copy.message;
   ctaText=hasTracking(d)?'Track Your Order':'Visit Nariyal Sutra';ctaUrl=trackUrl(d)||SITE_URL;showOrder='1';showTracking=hasTracking(d)?'1':'';detailTitle='Order summary';
 }else if(kind==='customer_inquiry'){
   subject='Enquiry Received '+id;headline='Your enquiry is recorded';label='Reference '+id;
   message='Thank you. We received your Nariyal Sutra enquiry and will review availability, logistics and commercial requirements before confirming details.';
   ctaText='Continue on WhatsApp';ctaUrl='https://wa.me/919203831705';detailTitle='Enquiry details';
 }else if(kind==='owner_inquiry'){
   to=OWNER_EMAIL;subject='New Enquiry '+id;headline='New sales enquiry';label=d.inquiryTypeLabel||d.inquiryType||'New enquiry';
   message=customer+' · '+phone+' · '+(d.destination||'destination not specified')+' · '+(d.message||'');
   ctaText='Open Owner Dashboard';ctaUrl=ADMIN_URL;detailTitle='Enquiry details';
 }
 return {
   from_name:'Nariyal Sutra',reply_to:OWNER_EMAIL,to_email:to,email_subject:subject,subject,preheader:subject,headline,
   status_label:label,status_message:message,email_kind:kind,show_order_details:showOrder,show_tracking:showTracking,detail_title:detailTitle,
   order_id:id,customer_name:isOwner?'Nariyal Sutra Owner':customer,buyer_name:customer,email,phone,
   product_name:showOrder?product:'',quantity:showOrder&&qty?String(qty)+' pieces':'',rate:showOrder&&d.unitPrice?money(d.unitPrice)+'/pc':'',
   total:showOrder&&total?money(total):'',payment:showOrder?(d.paymentLabel||d.paymentType||''):'',address:showOrder?(d.address||''):'',city:showOrder?(d.city||''):'',
   notes:d.notes||d.message||'',order_date:new Date().toLocaleString('en-IN',{timeZone:'Asia/Kolkata'}),site_url:SITE_URL,admin_url:ADMIN_URL,
   account_url:SITE_URL.replace(/\/$/,'')+'/#account',tracking_url:showTracking?trackUrl(d):'',cta_text:ctaText,cta_url:ctaUrl,status,
   status_note:d.statusNote||''
 };
}
exports.handler=async function(event){
 if(event.httpMethod==='OPTIONS')return {statusCode:204,headers:{'access-control-allow-origin':SITE_URL,'access-control-allow-methods':'POST,OPTIONS','access-control-allow-headers':'content-type','vary':'Origin'},body:''};
 if(event.httpMethod!=='POST')return json(405,{error:'Method not allowed'});
 const origin=event.headers.origin||event.headers.Origin||event.headers.referer||event.headers.Referer||'';
 if(!allowedOrigin(origin))return json(403,{error:'Origin not allowed'});
 const ct=String(event.headers['content-type']||event.headers['Content-Type']||'');if(!ct.includes('application/json'))return json(415,{error:'JSON content type required'});
 if(Number(event.headers['content-length']||0)>32768||String(event.body||'').length>32768)return json(413,{error:'Request too large'});
 const ip=(event.headers['x-nf-client-connection-ip']||event.headers['x-forwarded-for']||'').split(',')[0].trim();if(!rateOk(ip))return json(429,{error:'Too many requests'});
 let body;try{body=JSON.parse(event.body||'{}')}catch{return json(400,{error:'Invalid JSON'})}
 if(body.website||body.companyWebsite)return json(200,{ok:true});
 if(!ALLOWED_KINDS.has(body.kind))return json(400,{error:'Unsupported email kind'});
 if(body.kind==='customer_status'&&!STATUS_COPY[String(body.data?.status||'')])return json(400,{error:'Unsupported order status'});
 const privateKey=process.env.EMAILJS_PRIVATE_KEY;if(!privateKey)return json(503,{error:'Email provider private key is not configured'});
 const payload={service_id:SERVICE_ID,template_id:TEMPLATE_ID,user_id:PUBLIC_KEY,accessToken:privateKey,template_params:params(body.kind,body.data)};
 try{const r=await fetch('https://api.emailjs.com/api/v1.0/email/send',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)});const t=await r.text();if(!r.ok)return json(502,{error:'Email provider rejected request',providerStatus:r.status});return json(200,{ok:true,provider:'emailjs',result:t||'OK'});}catch(e){return json(502,{error:'Email provider unavailable'});}
};
