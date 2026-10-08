import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import fs from 'node:fs';
import vm from 'node:vm';
const require=createRequire(import.meta.url),{handler,effective}=require('../netlify/functions/published-auth-theme.js');
const checks=[];function ok(name,value){assert.ok(value,name);checks.push(name);console.log('PASS '+name);}
const instant=new Date('2026-10-02T12:00:00Z');
const configs=[{}, {publishedTheme:'fresh-grove',draftTheme:'golden-harvest',publishedBy:'PRIVATE'}, {publishedTheme:'not-valid'},
 {publishedTheme:'fresh-grove',manualOverride:{themeId:'coastal-premium',active:true}},
 {publishedTheme:'fresh-grove',schedules:[{id:'future',themeId:'golden-harvest',enabled:true,startAt:'2030-01-01'}]},
 {publishedTheme:'fresh-grove',schedules:[{id:'disabled',themeId:'golden-harvest',enabled:false}]},
 {publishedTheme:'fresh-grove',schedules:[{id:'current',themeId:'golden-harvest',startAt:'2026-10-01',endAt:'2026-10-03'}]},
 {publishedTheme:'fresh-grove',schedules:[{id:'weekly',themeId:'coastal-premium',type:'weekly',daysOfWeek:[5],dailyStart:'10:00',dailyEnd:'20:00',timezone:'Asia/Kolkata'}]}];
const root={dataset:{},style:{}},window={NSV421Store:{load:()=>({})},dispatchEvent(){},addEventListener(){}};
vm.runInNewContext(fs.readFileSync('assets/js/storefront-theme-runtime.js','utf8'),{window,document:{documentElement:root},location:{search:''},URLSearchParams,CustomEvent:class{},setInterval(){},Intl,Date});
for(const [i,config] of configs.entries())ok(`Sanitized resolver matches storefront effective theme case ${i}`,effective(config,instant)===window.NSThemeResolver.resolve(config,instant).id);
function encoded(x){if(typeof x==='string')return{stringValue:x};if(typeof x==='boolean')return{booleanValue:x};if(typeof x==='number')return{integerValue:String(x)};if(Array.isArray(x))return{arrayValue:{values:x.map(encoded)}};return{mapValue:{fields:Object.fromEntries(Object.entries(x||{}).map(([k,v])=>[k,encoded(v)]))}};}
const original=global.fetch;let calls=[];
try{
 global.fetch=async(url,options)=>{calls.push({url,options});return{ok:true,json:async()=>({fields:{status:encoded('live'),themeConfig:encoded({publishedTheme:'fresh-grove',draftTheme:'golden-harvest',publishedBy:'PRIVATE',schedules:[{id:'SECRET',title:'PRIVATE',themeId:'coastal-premium',enabled:false}]})}})}};
 const result=await handler({httpMethod:'GET'});ok('Public response contains only allowlisted theme id',result.body==='{"themeId":"fresh-grove"}');
 ok('Theme endpoint reads only publicStories with no credentials or Admin bypass',calls.length===1&&calls[0].url.includes('/documents/publicStories/site-config?')&&!calls[0].options.headers);
 const count=calls.length;ok('Theme endpoint refuses all writes', (await handler({httpMethod:'POST'})).statusCode===405&&calls.length===count);
 global.fetch=async()=>({ok:false});ok('Permission/App Check failure falls back safely',JSON.parse((await handler({httpMethod:'GET'})).body).themeId==='nariyal-signature');
 global.fetch=async()=>{throw new Error('offline')};ok('Network failure falls back safely',JSON.parse((await handler({httpMethod:'GET'})).body).themeId==='nariyal-signature');
 global.fetch=async()=>({ok:true,json:async()=>({fields:{status:encoded('draft'),themeConfig:encoded({publishedTheme:'fresh-grove'})}})});ok('Unpublished source never affects auth',JSON.parse((await handler({httpMethod:'GET'})).body).themeId==='nariyal-signature');
}finally{global.fetch=original;}
const shell=fs.readFileSync('assets/js/auth-shell.js','utf8');ok('Animation code has no input-content/storage/analytics/network reads',!(/input\.value|\.selectionStart|\.selectionEnd|localStorage|sessionStorage|fetch\(|analytics|console\./.test(shell)));
fs.mkdirSync('qa-artifacts/auth-interactive',{recursive:true});fs.writeFileSync('qa-artifacts/auth-interactive/theme-contract-results.json',JSON.stringify({ok:true,checks},null,2));
