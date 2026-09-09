/**
 * Nariyal Sutra — Owner customer directory helpers (V42)
 * Pure aggregation only: no Firebase calls and no writes.
 * Registered profiles come from /customers; guest buyers are derived from /orders.
 */
(function(root,factory){
  var api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.NS_ADMIN_CUSTOMERS=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  var TERMINAL={delivered:true,cancelled:true};
  var PAID={paid:true,refunded:true};

  function clean(v){return String(v==null?'':v).trim()}
  function normalizeEmail(v){return clean(v).toLowerCase()}
  function normalizePhone(v){
    var d=clean(v).replace(/\D/g,'');
    if(d.length===12&&d.indexOf('91')===0)return d.slice(2);
    if(d.length===11&&d.charAt(0)==='0')return d.slice(1);
    return d;
  }
  function millis(v){
    try{
      if(v&&typeof v.toMillis==='function')return v.toMillis();
      if(v&&typeof v.toDate==='function')return v.toDate().getTime();
      if(v&&typeof v.seconds==='number')return v.seconds*1000+Math.floor(Number(v.nanoseconds||0)/1e6);
      if(v instanceof Date)return v.getTime();
      var n=new Date(v).getTime();return Number.isFinite(n)?n:0;
    }catch(_e){return 0}
  }
  function newest(a,b){return millis(a)>=millis(b)?a:b}
  function oldest(a,b){if(!a)return b;if(!b)return a;return millis(a)<=millis(b)?a:b}
  function uniq(arr){return Array.from(new Set(arr.filter(Boolean)))}
  function displayNameFromOrders(list,fallback){
    for(var i=0;i<list.length;i++){var n=clean(list[i].customerName);if(n)return n}
    return clean(fallback)||'Customer';
  }
  function orderContact(order){return {email:normalizeEmail(order&&order.email),phone:normalizePhone(order&&order.phone)}}
  function profileContact(profile){return {email:normalizeEmail(profile&&(profile.contactEmail||profile.email)),loginEmail:normalizeEmail(profile&&profile.email),phone:normalizePhone(profile&&profile.phone)}}
  function pushMap(map,key,uid){if(!key)return;if(!map[key])map[key]=[];if(map[key].indexOf(uid)<0)map[key].push(uid)}
  function orderSort(a,b){return millis(b&&b.createdAt)-millis(a&&a.createdAt)}
  function orderPaymentStatus(o){
    var s=clean(o&&o.paymentStatus).toLowerCase();
    if(s)return s;
    var method=clean(o&&o.paymentType).toLowerCase();
    if(method==='cod')return 'cod';
    return 'untracked';
  }
  function dateInside(v,from,to){
    var m=millis(v);if(!m)return false;
    if(from&&m<from)return false;if(to&&m>to)return false;return true;
  }

  function buildDirectory(profiles,orders){
    profiles=Array.isArray(profiles)?profiles:[];orders=Array.isArray(orders)?orders:[];
    var profileByUid=Object.create(null), emailMap=Object.create(null), phoneMap=Object.create(null), peopleByKey=Object.create(null);

    profiles.forEach(function(raw){
      var uid=clean(raw.uid||raw.id);if(!uid)return;
      var p=Object.assign({},raw,{uid:uid});profileByUid[uid]=p;
      var c=profileContact(p);pushMap(emailMap,c.email,uid);if(c.loginEmail&&c.loginEmail!==c.email)pushMap(emailMap,c.loginEmail,uid);pushMap(phoneMap,c.phone,uid);
      peopleByKey['registered:'+uid]={key:'registered:'+uid,type:'registered',uid:uid,profile:p,linkedOrders:[],guestHistory:[],matchSignals:[],dataSignals:[]};
    });

    var collisionUids=Object.create(null),contactCollisionCount=0;
    [emailMap,phoneMap].forEach(function(map){Object.keys(map).forEach(function(k){if(map[k].length>1){contactCollisionCount++;map[k].forEach(function(uid){collisionUids[uid]=true})}})});
    Object.keys(collisionUids).forEach(function(uid){var person=peopleByKey['registered:'+uid];if(person)person.dataSignals.push('Duplicate contact across profiles')});

    var guestMatchedOrders=0,unresolvedUids=Object.create(null),ambiguousGuestOrders=0,possibleGuestMatches=0;
    orders.slice().sort(orderSort).forEach(function(order){
      var uid=clean(order.customerUid);
      if(uid){
        var linked=peopleByKey['registered:'+uid];
        if(linked){linked.linkedOrders.push(order);return}
        var uk='unresolved:'+uid;
        if(!peopleByKey[uk])peopleByKey[uk]={key:uk,type:'unresolved',uid:uid,profile:null,linkedOrders:[],guestHistory:[],matchSignals:[],dataSignals:['Account-linked order has no customer profile']};
        peopleByKey[uk].linkedOrders.push(order);unresolvedUids[uid]=true;return;
      }

      var oc=orderContact(order),emailUids=oc.email?(emailMap[oc.email]||[]):[],phoneUids=oc.phone?(phoneMap[oc.phone]||[]):[];
      var candidates=uniq(emailUids.concat(phoneUids)),matchedUid='',possibleMatch=false;
      if(oc.email&&oc.phone){
        if(emailUids.length===1&&phoneUids.length===1&&emailUids[0]===phoneUids[0])matchedUid=emailUids[0];
        else if(candidates.length===1)possibleMatch=true;
      }else if(candidates.length===1){matchedUid=candidates[0]}
      if(matchedUid&&peopleByKey['registered:'+matchedUid]){
        var rp=peopleByKey['registered:'+matchedUid];rp.guestHistory.push(order);guestMatchedOrders++;
        if(rp.matchSignals.indexOf('Previous guest order matched by contact')<0)rp.matchSignals.push('Previous guest order matched by contact');
        return;
      }
      if(candidates.length>1)ambiguousGuestOrders++;if(possibleMatch)possibleGuestMatches++;
      var guestIdentity=oc.phone?('phone:'+oc.phone):(oc.email?('email:'+oc.email):('order:'+clean(order.orderId||order.id)));
      var gk='guest:'+guestIdentity;
      if(!peopleByKey[gk])peopleByKey[gk]={key:gk,type:'guest',uid:'',profile:null,linkedOrders:[],guestHistory:[],matchSignals:[],dataSignals:[]};
      peopleByKey[gk].guestHistory.push(order);
      if(candidates.length>1&&peopleByKey[gk].dataSignals.indexOf('Contact matches multiple registered profiles')<0)peopleByKey[gk].dataSignals.push('Contact matches multiple registered profiles');
      if(possibleMatch&&peopleByKey[gk].dataSignals.indexOf('Possible profile match · not auto-merged')<0)peopleByKey[gk].dataSignals.push('Possible profile match · not auto-merged');
    });

    var people=Object.keys(peopleByKey).map(function(key){
      var p=peopleByKey[key],all=p.linkedOrders.concat(p.guestHistory).sort(orderSort),profile=p.profile||{},pc=profileContact(profile),first=all.length?all[all.length-1]:null,last=all.length?all[0]:null;
      var email=clean(profile.contactEmail)||clean(profile.email)||clean(last&&last.email),loginEmail=clean(profile.email),phone=clean(profile.phone)||clean(last&&last.phone),name=clean(profile.displayName)||displayNameFromOrders(all,profile.email);
      var active=all.filter(function(o){return !TERMINAL[clean(o.status||'pending')]});
      var nonCancelled=all.filter(function(o){return clean(o.status)!=='cancelled'});
      var lifetime=nonCancelled.reduce(function(sum,o){return sum+Number(o.total||0)},0);
      var totalQty=nonCancelled.reduce(function(sum,o){return sum+Number(o.quantity||0)},0);
      var delivered=all.filter(function(o){return clean(o.status)==='delivered'}).length,cancelled=all.filter(function(o){return clean(o.status)==='cancelled'}).length;
      var paymentCounts={};all.forEach(function(o){var s=orderPaymentStatus(o);paymentCounts[s]=(paymentCounts[s]||0)+1});
      var pendingPayment=all.filter(function(o){return ['awaiting','requested','failed','partial','refund_pending'].indexOf(orderPaymentStatus(o))>=0});
      var profileAt=profile.updatedAt||profile.createdAt||null,lastActivity=last?newest(last.createdAt,profileAt):profileAt;
      var orderNames=all.map(function(o){return clean(o.orderId||o.id)}),orderCities=all.map(function(o){return clean(o.city)}),orderProducts=all.map(function(o){return clean(o.productName)});
      var signals=p.dataSignals.slice();
      if(p.type==='guest'&&all.length>1){
        var guestEmails=uniq(all.map(function(o){return normalizeEmail(o.email)})),guestNames=uniq(all.map(function(o){return clean(o.customerName).toLowerCase()}));
        if(guestEmails.length>1)signals.push('Guest contact used with multiple emails');
        if(guestNames.length>1)signals.push('Guest contact used with multiple names');
      }
      if(p.type==='registered'&&!all.length)signals.push('Profile created · no orders yet');
      if(p.type==='registered'&&(!email||!phone))signals.push('Profile contact incomplete');
      if(p.type==='registered'&&profile.notifyTelegram===true&&!clean(profile.telegramUsername))signals.push('Telegram updates selected · username missing');
      if(p.type==='registered'&&(!email||!phone))signals.push('Profile contact incomplete');
      if(p.type==='registered'&&profile.notifyTelegram===true&&!clean(profile.telegramUsername))signals.push('Telegram updates selected · username missing');
      if(p.type==='registered'&&p.guestHistory.length)signals.push('Has guest-order history');
      if(all.length>=2)signals.push('Repeat buyer');
      if(active.length)signals.push(active.length+' active order'+(active.length===1?'':'s'));
      if(pendingPayment.length)signals.push(pendingPayment.length+' payment follow-up'+(pendingPayment.length===1?'':'s'));
      var currentType=p.type==='registered'?'Registered':(p.type==='unresolved'?'Account needs review':'Guest');
      var city=clean(profile.primaryCity)||clean(last&&last.city),state=clean(profile.primaryState)||clean(last&&last.state),country=clean(profile.primaryCountry)||clean(last&&last.country)||'India',pin=clean(profile.primaryPin)||clean(last&&last.pin);
      var telegram=clean(profile.telegramUsername).replace(/^@/,'');
      return {
        key:key,type:p.type,typeLabel:currentType,uid:p.uid,profile:p.profile,
        name:name,email:email,loginEmail:loginEmail,contactEmail:email,emailVerified:profile.emailVerified===true&&!!loginEmail&&normalizeEmail(email)===normalizeEmail(loginEmail),phoneVerified:profile.phoneVerified===true,phone:phone,photoURL:clean(profile.photoURL),telegramUsername:telegram,
        preferredChannel:clean(profile.preferredChannel)||'whatsapp',notifyEmail:profile.notifyEmail!==false,notifyWhatsapp:profile.notifyWhatsapp!==false,notifyTelegram:profile.notifyTelegram===true,
        city:city,state:state,country:country,pin:pin,
        orders:all,linkedOrders:p.linkedOrders,guestHistory:p.guestHistory,
        orderCount:all.length,activeCount:active.length,deliveredCount:delivered,cancelledCount:cancelled,lifetimeValue:lifetime,averageOrderValue:nonCancelled.length?lifetime/nonCancelled.length:0,totalQuantity:totalQty,
        firstOrderAt:first&&first.createdAt,lastOrderAt:last&&last.createdAt,lastActivityAt:lastActivity,profileCreatedAt:profile.createdAt||null,lastLoginAt:profile.lastLoginAt||null,
        repeat:all.length>=2,hasGuestHistory:!!p.guestHistory.length,
        preferredProduct:clean(profile.preferredProduct),recurringPreference:clean(profile.recurringPreference),
        latestPaymentStatus:last?orderPaymentStatus(last):'none',paymentCounts:paymentCounts,paymentFollowUpCount:pendingPayment.length,
        matchSignals:p.matchSignals.slice(),signals:uniq(signals),
        searchText:[name,email,loginEmail,phone,telegram,city,state,country,pin,p.uid,clean(profile.preferredChannel)].concat(orderNames,orderCities,orderProducts).join(' ').toLowerCase(),
        normalizedEmail:pc.email||normalizeEmail(email),normalizedPhone:pc.phone||normalizePhone(phone)
      };
    });

    people.sort(function(a,b){if(a.activeCount!==b.activeCount)return b.activeCount-a.activeCount;return millis(b.lastActivityAt)-millis(a.lastActivityAt)});
    var registered=people.filter(function(p){return p.type==='registered'}),guests=people.filter(function(p){return p.type==='guest'}),unresolved=people.filter(function(p){return p.type==='unresolved'});
    return {people:people,stats:{
      totalPeople:people.length,registered:registered.length,guests:guests.length,unresolved:unresolved.length,
      repeat:people.filter(function(p){return p.repeat}).length,active:people.filter(function(p){return p.activeCount>0}).length,
      paymentFollowUp:people.filter(function(p){return p.paymentFollowUpCount>0}).length,
      highValue:people.filter(function(p){return p.lifetimeValue>=5000}).length,
      noOrderProfiles:registered.filter(function(p){return p.orderCount===0}).length,guestMatchedOrders:guestMatchedOrders,contactCollisionCount:contactCollisionCount,
      ambiguousGuestOrders:ambiguousGuestOrders,possibleGuestMatches:possibleGuestMatches,totalOrders:orders.length
    }};
  }

  function filterDirectory(people,query,type,activity,filters){
    people=Array.isArray(people)?people:[];query=clean(query).toLowerCase();type=clean(type);activity=clean(activity);filters=filters||{};
    var createdFrom=filters.createdFrom?new Date(filters.createdFrom+'T00:00:00').getTime():0;
    var createdTo=filters.createdTo?new Date(filters.createdTo+'T23:59:59.999').getTime():0;
    var orderFrom=filters.lastOrderFrom?new Date(filters.lastOrderFrom+'T00:00:00').getTime():0;
    var orderTo=filters.lastOrderTo?new Date(filters.lastOrderTo+'T23:59:59.999').getTime():0;
    var minValue=Number(filters.minLifetime||0)||0,location=clean(filters.location).toLowerCase(),payment=clean(filters.paymentStatus).toLowerCase(),channel=clean(filters.channel).toLowerCase(),verification=clean(filters.verification).toLowerCase();
    return people.filter(function(p){
      if(type&&p.type!==type)return false;
      if(query&&String(p.searchText||'').indexOf(query)<0)return false;
      if(activity==='active'&&!(p.activeCount>0))return false;
      if(activity==='repeat'&&!p.repeat)return false;
      if(activity==='high_value'&&!(p.lifetimeValue>=5000))return false;
      if(activity==='payment_followup'&&!(p.paymentFollowUpCount>0))return false;
      if(activity==='no_orders'&&!(p.type==='registered'&&p.orderCount===0))return false;
      if(activity==='review'&&!(p.type==='unresolved'||(p.signals||[]).some(function(s){return /multiple registered|duplicate contact|needs review|possible profile match/i.test(s)})))return false;
      if(createdFrom||createdTo){if(!dateInside(p.profileCreatedAt||p.firstOrderAt,createdFrom,createdTo||Number.MAX_SAFE_INTEGER))return false}
      if(orderFrom||orderTo){if(!dateInside(p.lastOrderAt,orderFrom,orderTo||Number.MAX_SAFE_INTEGER))return false}
      if(minValue&&Number(p.lifetimeValue||0)<minValue)return false;
      if(location&&[p.city,p.state,p.country,p.pin].join(' ').toLowerCase().indexOf(location)<0)return false;
      if(payment&&payment!=='all'&&String(p.latestPaymentStatus||'').toLowerCase()!==payment)return false;
      if(channel&&channel!=='all'&&String(p.preferredChannel||'').toLowerCase()!==channel)return false;
      if(verification==='email_verified'&&!p.emailVerified)return false;
      if(verification==='phone_verified'&&!p.phoneVerified)return false;
      if(verification==='telegram_saved'&&!p.telegramUsername)return false;
      if(verification==='contact_missing'&&p.email&&p.phone)return false;
      return true;
    });
  }

  return {buildDirectory:buildDirectory,filterDirectory:filterDirectory,normalizeEmail:normalizeEmail,normalizePhone:normalizePhone,millis:millis,orderPaymentStatus:orderPaymentStatus};
});
