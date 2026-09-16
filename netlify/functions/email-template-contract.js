'use strict';

/* Canonical parameter contract for the single EmailJS transactional template.
   Every sender completes this shape so template edits cannot silently depend on
   fields that only one code path provides. */
const TEMPLATE_FIELDS=Object.freeze([
  'from_name','reply_to','to_email','email_subject','subject','preheader','headline',
  'status_label','status_message','email_kind','show_order_details','show_tracking','detail_title','order_id','customer_name','buyer_name',
  'email','phone','product_name','quantity','rate','total','payment','address','city',
  'notes','order_date','site_url','admin_url','account_url','tracking_url','cta_text',
  'cta_url','status','status_note'
]);

function completeTemplateParams(input){
  const src=input&&typeof input==='object'?input:{},out={};
  for(const key of TEMPLATE_FIELDS)out[key]=src[key]===undefined||src[key]===null?'':String(src[key]);
  if(!out.to_email||!out.email_subject||!out.headline||!out.status_message||!out.email_kind)throw new Error('Email template parameters are incomplete');
  return out;
}

function orderStatusCopy(status,orderId,note){
  const id=String(orderId||''),reason=String(note||'').trim(),rows={
    pending:['Order Request Received #'+id,'We received your order request','Pending review','Your request is safely recorded. We will review stock, serviceability and delivery timing, then confirm the order with you on WhatsApp.'],
    confirmed:['Order Confirmed #'+id,'Your order is confirmed','Confirmed','Your order has been accepted. We are preparing it and will share the next delivery update with you.'],
    preparing:['Order Preparing #'+id,'Freshness in preparation','Preparing','Your coconuts are being selected and packed for fulfilment.'],
    ready_for_dispatch:['Ready for Dispatch #'+id,'Packed and ready','Ready for dispatch','Your order is packed and ready for dispatch. Delivery coordination will follow.'],
    out_for_delivery:['Out for Delivery #'+id,'Your coconuts are on the way','Out for delivery','Your order is out for delivery. Keep your phone available and share the delivery OTP only with the delivery agent at handover.'],
    delivered:['Order Delivered #'+id,'Freshness delivered','Delivered','Your order is marked as delivered. Thank you for choosing Nariyal Sutra.'],
    cancelled:['Order Update #'+id,'An update on your order','Cancelled','We are unable to fulfil this order at this time.'+(reason?' Reason: '+reason:'')+' If a payment was already made, contact us on WhatsApp so we can resolve it.']
  },row=rows[String(status||'').toLowerCase()]||rows.pending;
  return {subject:row[0],preheader:row[0],headline:row[1],label:row[2],message:row[3]};
}

module.exports={TEMPLATE_FIELDS,completeTemplateParams,orderStatusCopy};
