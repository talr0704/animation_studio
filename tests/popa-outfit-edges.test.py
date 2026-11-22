"""All active source outlines survive extraction, including parts crossing grid cells."""
import json
from pathlib import Path
import numpy as np
from scipy import ndimage
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
manifest=json.loads((ROOT/'source-art/characters/popa/outfits/manifest.json').read_text())
catalog=json.loads((ROOT/'assets/characters/popa/outfits/catalog.json').read_text())
active={(look['id'],part['id']) for look in catalog['looks'] for part in look['parts']}
replaced=json.loads((ROOT/'source-art/characters/popa/outfits/cloud-pajamas-v2-manifest.json').read_text())
replacement_ids={(r['outfit'],r['part']) for r in replaced}
manifest=[r for r in manifest if (r['outfit'],r['part']) in active and (r['outfit'],r['part']) not in replacement_ids]+replaced
for r in manifest:
    original=Image.open(ROOT/'source-art/characters/popa/outfits'/r.get('source',f'Sources/{r["outfit"]}.png')).convert('RGBA')
    labels,_=ndimage.label(np.asarray(original.getchannel('A'))>16)
    sx,sy,_,_=r['source_cell'];x,y,right,bottom=r['crop_bbox']
    overlap=np.bincount(labels[sy+y:sy+bottom,sx+x:sx+right].ravel());overlap[0]=0
    ys,xs=ndimage.find_objects(labels)[overlap.argmax()-1]
    p=next(p for l in catalog['looks'] if l['id']==r['outfit'] for p in l['parts'] if p['id']==r['part'])
    image=Image.open(ROOT/p['asset']);dx,dy=p['artworkOffset'];ox=sx+x-r['padding']+dx;oy=sy+y-r['padding']+dy
    # Compare every original outline pixel, not just transparent image margins.
    source=np.array(original.crop((xs.start,ys.start,xs.stop,ys.stop)))
    actual=np.array(image.crop((xs.start-ox,ys.start-oy,xs.stop-ox,ys.stop-oy)))
    assert np.array_equal(source,actual),(r['outfit'],r['part'])
    assert xs.start-ox>=16 and ys.start-oy>=16
    assert image.width-(xs.stop-ox)>=16 and image.height-(ys.stop-oy)>=16
    assert list(image.size)==p['artworkSize'] and p['naturalSize']==r['size']
print(f'PASS: all {len(manifest)} complete outlines match their source pixels, with safe margins and placement reference sizes')
