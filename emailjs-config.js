/* Nariyal Sutra — transactional email layer.
   Primary path: same-origin Netlify Function (private EmailJS key stays server-side).
   Fallback path: EmailJS Browser SDK so an email attempt can still be made if the
   function is unavailable. Orders/enquiries remain saved in Firestore regardless.
*/
window.NS_EMAILJS_CONFIG = {
  enabled: true,
  publicKey: "aDjTgmhSPrBeTpnOA",
  serviceId: "service_c24xpf8",
  templateId: "template_y01paqk",
  ownerEmail: "nariyalsutra@gmail.com",
  siteUrl: "https://nariyal-sutra.netlify.app/",
  adminUrl: "https://nariyal-sutra.netlify.app/admin",
  accountUrl: "https://nariyal-sutra.netlify.app/#account",
  serverEndpoint: "/.netlify/functions/send-email",
  notifyOwnerOnNewOrder: true,
  notifyOwnerOnInquiry: true
};

(function(){
  const sent = new Set();
  const wait = ms => new Promise(r=>setTimeout(r,ms));
  function cfg(){ return window.NS_EMAILJS_CONFIG || {}; }
  function money(v){ return Number(v||0).toLocaleString('en-IN'); }
  function browserReady(){ return !!(cfg().enabled && window.emailjs && cfg().publicKey && cfg().serviceId && cfg().templateId); }
  function initBrowser(){
    if(!browserReady()) return false;
    if(!window.__NS_EMAILJS_INIT){ window.emailjs.init({publicKey:cfg().publicKey}); window.__NS_EMAILJS_INIT=true; }
    return true;
  }
  function rateLabel(o){ return String(o.unitPrice||'') + '/pc' + (o.productKey==='bulk'?' (Bulk)':' (Retail)'); }
  function orderTrackingToken(o){ return String((o&&o.trackingToken)||((window.NS_DELIVERY_EXTRA||{}).trackingToken)||'').trim(); }
  function trackingUrl(o){ const token=orderTrackingToken(o); return token ? (cfg().siteUrl.replace(/\/$/,'')+'/track?t='+encodeURIComponent(token)) : (cfg().siteUrl.replace(/\/$/,'')+'/track'); }
  function orderBase(o){
    return {
      from_name:'Nariyal Sutra', reply_to:cfg().ownerEmail,
      order_id:o.orderId||'', customer_name:o.customerName||'Customer', buyer_name:o.customerName||'Customer',
      email:o.email||'', phone:o.phone||'', product_name:o.productName||'', quantity:String(o.quantity||0)+' pieces',
      rate:rateLabel(o), total:money(o.total), payment:o.paymentLabel||o.paymentType||'', address:o.address||'', city:o.city||'',
      notes:o.notes||'None', order_date:new Date().toLocaleString('en-IN'), site_url:cfg().siteUrl, admin_url:cfg().adminUrl, account_url:cfg().accountUrl||cfg().siteUrl,
      tracking_url:trackingUrl(o), status:o.status||'pending', status_note:o.statusNote||'—'
    };
  }
  function statusCopy(status,o){
    const reason=o.statusNote?' Reason: '+o.statusNote:'';
    const map={
      pending:{subject:'Order Request Received #'+o.orderId,preheader:'We received your Nariyal Sutra order request.',headline:'We received your order request',label:'Pending review',message:'Your request is safely recorded. We will review stock, serviceability and delivery timing, then confirm the order with you on WhatsApp.'},
      confirmed:{subject:'Order Confirmed #'+o.orderId,preheader:'Your Nariyal Sutra order has been accepted.',headline:'Your order is confirmed',label:'Confirmed',message:'Your order has been accepted. We are preparing it and will share the next delivery update with you.'},
      preparing:{subject:'Order Preparing #'+o.orderId,preheader:'Your coconuts are being selected and packed.',headline:'Freshness in preparation',label:'Preparing',message:'Your coconuts are being selected and packed for fulfilment.'},
      ready_for_dispatch:{subject:'Ready for Dispatch #'+o.orderId,preheader:'Your order is packed and ready to leave.',headline:'Packed and ready',label:'Ready for dispatch',message:'Your order is packed and ready for dispatch. Delivery coordination will follow.'},
      out_for_delivery:{subject:'Out for Delivery #'+o.orderId,preheader:'Your Nariyal Sutra order is on the way.',headline:'Your coconuts are on the way',label:'Out for delivery',message:'Your order is out for delivery. Keep your phone available and share the delivery OTP only with the delivery agent at handover.'},
      arrived:{subject:'Delivery Is Nearby #'+o.orderId,preheader:'Your Nariyal Sutra delivery is nearby.',headline:'Almost there',label:'Arrived nearby',message:'Your delivery is nearby. Please keep the delivery OTP private until handover.'},
      delivered:{subject:'Order Delivered #'+o.orderId,preheader:'Your Nariyal Sutra order is marked delivered.',headline:'Freshness delivered',label:'Delivered',message:'Your order is marked as delivered. Thank you for choosing Nariyal Sutra.'},
      cancelled:{subject:'Order Update #'+o.orderId,preheader:'An update about your Nariyal Sutra order.',headline:'An update on your order',label:'Cancelled',message:'We are unable to fulfil this order at this time.'+reason+' If a payment was already made, contact us on WhatsApp so we can resolve it.'}
    };
    return map[status]||map.pending;
  }
  async function serverSend(kind,data){
    if(!cfg().serverEndpoint) throw new Error('Server email endpoint is not configured.');
    const controller=new AbortController(); const timer=setTimeout(()=>controller.abort(),8000);
    try{
      const res=await fetch(cfg().serverEndpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({kind,data}),signal:controller.signal});
      const body=await res.json().catch(()=>({}));
      if(!res.ok) throw new Error(body.error||('Email server returned '+res.status));
      return body;
    }finally{clearTimeout(timer)}
  }
  async function browserSend(params){
    if(!initBrowser()) throw new Error('EmailJS Browser SDK is unavailable.');
    return window.emailjs.send(cfg().serviceId,cfg().templateId,params);
  }
  async function dispatch(kind,data,params){
    try{return {channel:'server',result:await serverSend(kind,data)}}
    catch(serverError){
      try{return {channel:'browser-fallback',result:await browserSend(params)}}
      catch(browserError){const e=new Error('Email could not be sent by server or browser fallback.');e.serverError=serverError;e.browserError=browserError;throw e}
    }
  }
  async function settled(kind,promise){
    try{return {kind,status:'fulfilled',value:await promise}}
    catch(reason){return {kind,status:'rejected',reason}}
  }

  window.NS_SEND_ORDER_EMAILS=async function(order){
    if(!order||!order.orderId) throw new Error('Order ID is missing.');
    const key='new:'+order.orderId;if(sent.has(key))return [{kind:'all',status:'skipped',reason:'Already attempted in this page session'}];sent.add(key);
    const enriched={...order,trackingToken:orderTrackingToken(order)};
    const p=orderBase({...enriched,status:'pending'}),copy=statusCopy('pending',enriched),out=[];
    if(enriched.email){
      out.push(await settled('customer',dispatch('customer_request',enriched,{...p,to_email:enriched.email,email_subject:copy.subject,subject:copy.subject,preheader:copy.preheader,headline:copy.headline,status_label:copy.label,status_message:copy.message,cta_text:'Track Your Order',cta_url:trackingUrl(enriched),tracking_url:trackingUrl(enriched),account_url:cfg().accountUrl||cfg().siteUrl,email_kind:'customer_request'})));
      await wait(1100);
    }
    if(cfg().notifyOwnerOnNewOrder){
      const ownerParams={...p,to_email:cfg().ownerEmail,customer_name:'Nariyal Sutra Owner',email_subject:'New Order Request #'+enriched.orderId,subject:'New Order Request #'+enriched.orderId,preheader:'A new website order is waiting for review.',headline:'New website order request',status_label:'Pending review',status_message:(enriched.customerName||'Customer')+' requested '+String(enriched.quantity||0)+' × '+(enriched.productName||'product')+' for ₹'+money(enriched.total)+'. Open the owner dashboard to review it.',cta_text:'Open Owner Dashboard',cta_url:cfg().adminUrl,tracking_url:trackingUrl(enriched),account_url:cfg().accountUrl||cfg().siteUrl,email_kind:'owner'};
      out.push(await settled('owner',dispatch('owner_order',enriched,ownerParams)));
    }
    return out;
  };

  window.NS_SEND_STATUS_EMAIL=async function(order,status){
    if(!order||!order.email) return {skipped:true,reason:'Customer email is empty'};
    const key='status:'+order.orderId+':'+status;if(sent.has(key))return {skipped:true,reason:'Already attempted in this page session'};sent.add(key);
    const enriched={...order,status,trackingToken:orderTrackingToken(order)};
    const p=orderBase(enriched),copy=statusCopy(status,enriched);
    try{
      const result=await dispatch('customer_status',enriched,{...p,to_email:enriched.email,email_subject:copy.subject,subject:copy.subject,preheader:copy.preheader,headline:copy.headline,status_label:copy.label,status_message:copy.message,cta_text:'Track Your Order',cta_url:trackingUrl(enriched),tracking_url:trackingUrl(enriched),account_url:cfg().accountUrl||cfg().siteUrl,email_kind:'customer_status'});
      return {skipped:false,result};
    }catch(e){sent.delete(key);throw e}
  };

  window.NS_SEND_INQUIRY_EMAILS=async function(q){
    if(!q||!q.inquiryId) throw new Error('Enquiry reference is missing.');
    const key='inq:'+q.inquiryId;if(sent.has(key))return [{kind:'all',status:'skipped',reason:'Already attempted in this page session'}];sent.add(key);
    const common={from_name:'Nariyal Sutra',reply_to:cfg().ownerEmail,order_id:q.inquiryId,customer_name:q.name||'Customer',buyer_name:q.name||'Customer',email:q.email||'',phone:q.phone||'',product_name:(q.productPreference||'Not specified').replaceAll('_',' '),quantity:q.quantity?String(q.quantity)+' pieces':'Not specified',rate:'Custom quote',total:'To be quoted',payment:'No payment taken',address:q.destination||'',city:q.destination||'',notes:[q.role?'Intent: '+q.role:'',q.packaging?'Packaging: '+String(q.packaging).replaceAll('_',' '):'',q.postalCode?'Postal: '+q.postalCode:'',q.message||''].filter(Boolean).join(' · ')||'None',order_date:new Date().toLocaleString('en-IN'),site_url:cfg().siteUrl,admin_url:cfg().adminUrl,status:'new',status_note:q.inquiryTypeLabel||q.inquiryType||'Enquiry'};
    const out=[];
    if(q.email){
      const cp={...common,to_email:q.email,email_subject:'Enquiry Received '+q.inquiryId,subject:'Enquiry Received '+q.inquiryId,preheader:'We received your Nariyal Sutra enquiry.',headline:'Your enquiry is recorded',status_label:'Reference '+q.inquiryId,status_message:'Thank you. We received your '+(q.inquiryTypeLabel||'')+' enquiry for '+(q.destination||'your destination')+'. We will review quantity, availability, delivery/logistics and commercial requirements before confirming details.',cta_text:'Continue on WhatsApp',cta_url:'https://wa.me/919203831705',email_kind:'customer_inquiry'};
      out.push(await settled('customer',dispatch('customer_inquiry',q,cp)));await wait(1100);
    }
    if(cfg().notifyOwnerOnInquiry){
      const op={...common,to_email:cfg().ownerEmail,customer_name:'Nariyal Sutra Owner',email_subject:'New Enquiry '+q.inquiryId,subject:'New Enquiry '+q.inquiryId,preheader:'A new website enquiry needs follow-up.',headline:'New sales enquiry',status_label:q.inquiryTypeLabel||'New enquiry',status_message:(q.name||'Customer')+' · '+String(q.role||'buyer')+' · '+(q.phone||'')+' · '+(q.quantity||'quantity not specified')+' pcs · '+(q.destination||'destination not specified')+'. '+(q.message||''),cta_text:'Open Owner Dashboard',cta_url:cfg().adminUrl,email_kind:'owner_inquiry'};
      out.push(await settled('owner',dispatch('owner_inquiry',q,op)));
    }
    return out;
  };
})();
