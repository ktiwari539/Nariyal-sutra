import fs from 'node:fs';
const files=[
 'assets/images/ambassadors/campaign/AMB101-portrait.webp',
 'assets/images/ambassadors/campaign/AMB102-portrait.webp',
 'assets/images/ambassadors/campaign/AMB201-portrait-blue.webp'
];
let bad=0;
for(const file of files){
 const b=fs.readFileSync(file);
 const head=b.subarray(0,16);
 const riff=b.subarray(0,4).toString('ascii');
 const webp=b.subarray(8,12).toString('ascii');
 console.log(`CAMPAIGN ASSET ${file} bytes=${b.length} head=${head.toString('hex')} ascii=${JSON.stringify(head.toString('latin1'))} riff=${riff} webp=${webp}`);
 if(riff!=='RIFF'||webp!=='WEBP'){console.error(`INVALID WEBP SIGNATURE: ${file}`);bad++;}
}
if(bad)process.exit(1);
console.log('CAMPAIGN BINARY SIGNATURES: PASS');
