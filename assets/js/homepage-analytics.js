(function(){
  'use strict';
  const GA_ID='G-MXWV5S3CWY';
  const TEST_ORIGIN=/^(localhost|127\.0\.0\.1|\[::1\]|[a-z0-9-]+--nariyal-sutra\.netlify\.app)$/i.test(location.hostname);
  window.__nsEventQueue=[];
  window.nsAnalyticsEvent=function(name,params){
    params=params||{};
    if(window.__nsAnalyticsDispatch)window.__nsAnalyticsDispatch(name,params);
    else window.__nsEventQueue.push([name,params]);
  };
  window.trackEvent=function(action,category,label){
    window.nsAnalyticsEvent(action,{event_category:category||'site',event_label:label||''});
  };
  window.__nsFlushAnalytics=function(){
    if(!window.__nsAnalyticsDispatch)return;
    const q=window.__nsEventQueue.splice(0);
    q.forEach(function(x){window.__nsAnalyticsDispatch(x[0],x[1]);});
  };
  window.__nsLoadGA4=function(){
    if(TEST_ORIGIN||window.__nsGA4Loaded)return;
    window.__nsGA4Loaded=true;
    window.dataLayer=window.dataLayer||[];
    window.gtag=window.gtag||function(){window.dataLayer.push(arguments);};
    const s=document.createElement('script');
    s.async=true;
    s.src='https://www.googletagmanager.com/gtag/js?id='+encodeURIComponent(GA_ID);
    document.head.appendChild(s);
    window.gtag('js',new Date());
    window.gtag('config',GA_ID,{send_page_view:true});
    window.__nsAnalyticsDispatch=function(name,params){window.gtag('event',name,params||{});};
    window.__nsFlushAnalytics();
  };
})();
