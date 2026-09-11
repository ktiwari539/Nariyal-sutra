from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageOps
import re

root=Path('dist')
images=root/'assets/images'
(images/'brand').mkdir(parents=True,exist_ok=True)
(images/'cinematic').mkdir(parents=True,exist_ok=True)
coastal=Image.open(images/'review/coastal-grove.png').convert('RGB')
backwater=Image.open(images/'review/backwater-grove.png').convert('RGB')
harvest=Image.open(images/'harvest-wall-organic.jpg').convert('RGB')
cut=Image.open(images/'ns-cut-cinematic.jpg').convert('RGB')
def fit(im,size): return ImageOps.fit(im,size,method=Image.Resampling.LANCZOS,centering=(.5,.5))

rgba=Image.open(images/'review/coastal-grove.png').convert('RGBA')
boxes=[(380,190,452,280),(365,278,435,365),(305,302,382,390),(430,260,505,355)]
for i,b in enumerate(boxes,1):
    cr=rgba.crop(b)
    mask=Image.new('L',cr.size,0)
    ImageDraw.Draw(mask).ellipse((3,3,cr.width-3,cr.height-3),fill=255)
    mask=mask.filter(ImageFilter.GaussianBlur(.5))
    cr.putalpha(mask)
    cr=cr.resize((cr.width*3,cr.height*3),Image.Resampling.LANCZOS)
    cr.save(images/'cinematic'/f'coconut-rain-{i}.png',optimize=True)
b=(395,350,468,445)
cr=rgba.crop(b)
mask=Image.new('L',cr.size,0)
ImageDraw.Draw(mask).ellipse((3,3,cr.width-3,cr.height-3),fill=255)
mask=mask.filter(ImageFilter.GaussianBlur(.5))
cr.putalpha(mask)
cr=cr.resize((cr.width*3,cr.height*3),Image.Resampling.LANCZOS)
cr.save(images/'cinematic'/'coconut-rain-5.png',optimize=True)

fit(coastal,(1600,1000)).save(images/'nariyal-premium-hero.webp','WEBP',quality=88)
fit(backwater,(1600,1000)).save(images/'nariyal-hospitality.webp','WEBP',quality=88)
fit(coastal,(1600,1000)).save(images/'nariyal-sutra-hero.jpg','JPEG',quality=90)
fit(harvest,(1600,1000)).save(images/'nariyal-product-collection.webp','WEBP',quality=88)
fit(coastal.crop((250,120,650,500)),(1200,1200)).save(images/'green-round-coconut.jpg','JPEG',quality=90)
fit(harvest,(1400,900)).save(images/'bulk-coconut-pack.jpg','JPEG',quality=90)
fit(coastal,(1600,1000)).save(images/'coconut-farm.jpg','JPEG',quality=90)
fit(backwater,(1200,1200)).save(images/'brand'/'sourcing-portrait.webp','WEBP',quality=88)
fit(cut,(1200,1200)).save(images/'brand'/'coconut-premium.webp','WEBP',quality=90)
fit(coastal,(1600,900)).save(images/'intro-film-01.webp','WEBP',quality=86)
fit(cut,(1600,900)).save(images/'intro-film-02.webp','WEBP',quality=86)
fit(backwater,(1600,900)).save(images/'intro-film-03.webp','WEBP',quality=86)
Image.open(images/'cinematic'/'coconut-rain-1.png').save(images/'story-coconut-hero.png',optimize=True)
fit(cut,(1200,1200)).save(images/'story-coconut-body-cut.png','PNG',optimize=True)
fit(cut,(900,700)).save(images/'story-coconut-cap-cut.png','PNG',optimize=True)

old='https://6a9bfce307bb9f014e510b7d--nariyal-sutra.netlify.app/'
text_ext={'.html','.css','.js','.json','.webmanifest'}
for p in root.rglob('*'):
    if not p.is_file() or p.suffix.lower() not in text_ext: continue
    t=p.read_text(errors='ignore'); before=t
    t=t.replace(old,'/')
    t=t.replace('https://nariyal-sutra.netlify.app/assets/images/','/assets/images/')
    t=t.replace('https://nariyal-sutra.netlify.app/assets/js/','/assets/js/')
    t=re.sub(r'<source[^>]+(?:/assets/video/nariyal-coconut-motion\.mp4)[^>]*/?>','',t,flags=re.I)
    t=re.sub(r'\s+src=["\']/assets/video/nariyal-coconut-motion\.mp4["\']','',t,flags=re.I)
    if p.name=='index.html':
        t=re.sub(r'<script[^>]+src=["\']/assets/js/v17-cinematic\.js["\'][^>]*></script>','',t,flags=re.I)
        t=re.sub(r'<script[^>]+src=["\']/assets/js/ns-smart-location\.js["\'][^>]*></script>','',t,flags=re.I)
    if t!=before: p.write_text(t)

missing=[]
attr=re.compile(r'(?:src|href|poster)=["\']([^"\']+)["\']',re.I)
cssurl=re.compile(r'url\(["\']?([^\)"\']+)',re.I)
for p in root.rglob('*.html'):
    t=p.read_text(errors='ignore')
    for u in attr.findall(t):
        if not (u.startswith('/assets/') or u.startswith('assets/')): continue
        clean=u.split('?',1)[0].split('#',1)[0]
        target=(root/clean.lstrip('/')) if clean.startswith('/') else (p.parent/clean)
        if not target.exists(): missing.append((str(p.relative_to(root)),u))
for p in root.rglob('*.css'):
    t=p.read_text(errors='ignore')
    for u in cssurl.findall(t):
        if u.startswith(('http:','https:','data:','#')): continue
        target=(p.parent/u.split('?',1)[0].split('#',1)[0]).resolve()
        try: target.relative_to(root.resolve())
        except ValueError: continue
        if not target.exists(): missing.append((str(p.relative_to(root)),u))
if missing:
    print('MISSING LOCAL ASSETS:')
    for row in missing: print(row)
    raise SystemExit(2)
if any(old in p.read_text(errors='ignore') for p in root.rglob('*') if p.is_file() and p.suffix.lower() in text_ext):
    raise SystemExit('stale immutable Netlify reference remains')
expected=['nariyal-premium-hero.webp','nariyal-hospitality.webp','nariyal-sutra-hero.jpg','nariyal-product-collection.webp','green-round-coconut.jpg','bulk-coconut-pack.jpg','brand/coconut-premium.webp','story-coconut-hero.png','story-coconut-body-cut.png','story-coconut-cap-cut.png','cinematic/coconut-rain-1.png','cinematic/coconut-rain-3.png','cinematic/coconut-rain-4.png','cinematic/coconut-rain-5.png']
for name in expected:
    p=images/name
    if not p.exists() or p.stat().st_size<1000: raise SystemExit('missing generated asset '+name)
print('asset audit passed; files=',sum(1 for p in root.rglob('*') if p.is_file()))
