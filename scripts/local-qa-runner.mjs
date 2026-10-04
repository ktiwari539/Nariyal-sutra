// Isolated local origin; child suites intercept external adapters before navigation.
import {spawn} from 'node:child_process';
import fs from 'node:fs';
const args=process.argv.slice(2),parallel=args.includes('--parallel'),scripts=args.filter(x=>x!=='--parallel');
fs.mkdirSync('qa-artifacts/completion-logs',{recursive:true});
const server=spawn('python3',['-m','http.server','4173','--bind','127.0.0.1'],{stdio:'ignore'});
async function run(spec){const [file,...extra]=spec.split('::'),path='qa-artifacts/completion-logs/'+file.split('/').pop().replace('.mjs','')+extra.join('')+'.log',log=fs.openSync(path,'w');console.log('START '+spec);const child=spawn(process.execPath,[file,...extra],{stdio:['ignore',log,log],env:{...process.env,NS_QA_BASE_URL:'http://127.0.0.1:4173'}});const code=await new Promise((resolve,reject)=>{child.on('error',reject);child.on('exit',resolve)});fs.closeSync(log);console.log('FINISH '+spec+' exit='+code+' log='+path);if(code!==0)throw Error(spec+' failed: '+fs.readFileSync(path,'utf8').slice(-4000));}
try{let ready=false;for(let i=0;i<40;i++){try{if((await fetch('http://127.0.0.1:4173/index.html')).ok){ready=true;break}}catch{}await new Promise(r=>setTimeout(r,100));}if(!ready)throw Error('Local server unavailable');if(parallel){const results=await Promise.allSettled(scripts.map(run));for(const r of results)if(r.status==='rejected')throw r.reason;}else for(const s of scripts)await run(s);}finally{server.kill();}
