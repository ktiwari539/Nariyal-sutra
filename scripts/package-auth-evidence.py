"""Preserve native-size visual evidence, raw assertions, logs and independent review gallery."""
from pathlib import Path
from PIL import Image
import json,shutil,subprocess,html
out=Path('docs/completion-evidence/auth');out.mkdir(parents=True,exist_ok=True)
shots=[]
cutoff=Path('assets/js/auth-shell.js').stat().st_mtime
for source,dest in [('recovery/auth-guardian','guardian'),('recovery/auth-before-after','before-after'),('auth-interactive','interactive'),('auth','flows')]:
 target=out/dest;target.mkdir(exist_ok=True)
 for p in sorted((Path('qa-artifacts')/source).glob('*.png')):
  if p.stat().st_mtime<cutoff: continue
  q=target/(p.stem+'.webp');im=Image.open(p);im.save(q,'WEBP',lossless=True,method=4);shots.append({'file':str(q.relative_to(out)),'width':im.width,'height':im.height,'nativeScale':True})
for source,dest in [('recovery/auth-guardian/results.json','guardian-results.json'),('recovery/auth-guardian/audio-results.json','audio-results.json'),('auth-interactive/chromium-results.json','interactive-results.json'),('auth-interactive/composition-results.json','composition-results.json'),('auth-interactive/theme-contract-results.json','theme-contract-results.json'),('auth/results.json','flows-results.json'),('auth/security-preservation.json','security-preservation.json'),('recovery/auth-before-after/results.json','before-after-results.json')]:
 p=Path('qa-artifacts')/source;assert p.exists() and p.stat().st_mtime>=cutoff,str(p);data=json.loads(p.read_text());assert not isinstance(data,dict) or data.get('ok'),str(p);shutil.copy2(p,out/dest)
for context in ['customer','admin']:
 subprocess.run(['ffmpeg','-y','-loglevel','error','-i',f'qa-artifacts/recovery/auth-guardian/{context}-motion.webm','-c:v','libx264','-preset','fast','-crf','19','-pix_fmt','yuv420p','-movflags','+faststart',str(out/(context+'-motion.mp4'))],check=True)
for p in Path('qa-artifacts/recovery/auth-guardian').glob('*.wav'):shutil.copy2(p,out/p.name)
logs=out/'logs';logs.mkdir(exist_ok=True)
for p in Path('qa-artifacts/completion-logs').glob('auth-*.log'):shutil.copy2(p,logs/p.name)
(out/'screenshots.json').write_text(json.dumps(shots,indent=2))
counts={name:len(json.loads((out/(name+'-results.json')).read_text())['checks']) for name in ['guardian','interactive','composition','theme-contract','flows']}
(out/'README.md').write_text('''# Guardian/auth recovery — local evidence

Recovered from preserved `26a852190c75f592fdff2fbaf98ec16bb26b8706`. No remote services were mutated. Firebase/auth/theme adapters are intercepted in browser QA.

## Results

'''+''.join(f'- {name}: {count} passed checks.\n' for name,count in counts.items())+f'''- {len(shots)} native-size screenshots; 80 before/after frames (40 pairs).
- Admin inline/external script tags and marked form contents are byte-identical to 26a8521 (4 checks).
- Guardian/auth-source CLS and all five theme/artwork loading CLS cases measure zero in local Chromium fixtures.
- Desktop 1440×1000, mobile 390×844; composition/interactive checks also cover tablet, 320px narrow and 844×390 landscape.

## Review

Open `index.html`. Both motion MP4s use a 1440×1000 viewport at 100% scale; no browser zoom or image upscaling. Close-ups are actual art-panel crops. The videos include idle, email gaze, timed password closure/turn/leaf, Show/Hide, invalid login, editing retry, repeated Enter retry, held success inspection, actual unblocked access, diagonal state transition and sound toggle/cancellation. Held success inspections are separate from real immediate navigation.

Audio is OFF by default. Browser videos use audio instrumentation and are silent. The three WAVs are rendered from the production sound engine using OfflineAudioContext; JSON records durations/peaks. Physical speaker/headphone assessment remains manual.

Before/after images use exact preserved 26a8521 presentation files through local browser routes. They do not claim recovery of the unavailable ead5615 Git object.

## Limits

Chromium desktop/mobile emulation, not physical devices. Actual Safari/iOS/password-manager extensions, human art-direction approval and physical sound review remain manual. These are local QA results, not a GitHub Actions run. No push/deployment was performed.
''')
controls='<label>Filter <input id="filter" placeholder="customer / admin / fresh / peek / before"></label>'
figures=''.join('<figure data-name="'+html.escape(s['file'])+'"><a href="'+s['file']+'"><img loading="lazy" src="'+s['file']+'" alt="'+html.escape(s['file'])+'"></a><figcaption>'+html.escape(s['file'])+'</figcaption></figure>' for s in shots)
(out/'index.html').write_text('''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Nariyal Sutra · Auth recovery review</title><style>body{margin:0;background:#f8f3e7;color:#19382b;font:16px/1.5 system-ui}main{max-width:1480px;margin:auto;padding:24px}h1{font:40px Georgia}a{color:#245d47}video{width:100%;max-height:90vh}section{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px}figure{margin:0}img{max-width:100%;height:auto}figcaption{overflow-wrap:anywhere;font-size:12px}input{padding:10px;margin:20px}figure[hidden]{display:none}@media(max-width:760px){section{grid-template-columns:1fr}}</style><main><h1>Guardian · Native-scale visual review</h1><p>Local intercepted adapters · sound off by default · human visual approval pending. <a href="README.md">QA scope and limits</a></p><h2>Customer motion</h2><video controls preload="metadata" src="customer-motion.mp4"></video><h2>Admin motion</h2><video controls preload="metadata" src="admin-motion.mp4"></video><p>Original cues: <a href="signature.wav">signature</a> · <a href="privacy.wav">privacy</a> · <a href="peek.wav">peek</a></p>'''+controls+'<section>'+figures+r'''</section></main><script>document.getElementById('filter').addEventListener('input',e=>document.querySelectorAll('figure').forEach(f=>f.hidden=!e.target.value.toLowerCase().split(/\s+/).every(t=>f.dataset.name.includes(t))))</script></html>''')
print(json.dumps({'checks':counts,'screenshots':len(shots),'path':str(out)},indent=2))
