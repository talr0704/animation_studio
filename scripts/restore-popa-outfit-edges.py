"""Restore original source pixels beyond sprite-sheet cells, never generate artwork.

Original manifest is kept unchanged. Old logical canvases remain the placement
reference. Expanded images record their pixel offset so saved transforms survive.
Requires Pillow, NumPy and SciPy (asset tooling only, no browser dependency).
"""
from pathlib import Path
import json
import numpy as np
from PIL import Image
from scipy import ndimage
ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'source-art/characters/popa/outfits'
DEST=ROOT/'assets/characters/popa/outfits'
manifest=json.loads((SOURCE/'manifest.json').read_text())
catalog=json.loads((DEST/'catalog.json').read_text())
cache={};audit=[]
for record in manifest:
    look,name=record['outfit'],record['part']
    if look not in cache:
        source=Image.open(SOURCE/'Sources'/f'{look}.png').convert('RGBA')
        labels,_=ndimage.label(np.asarray(source.getchannel('A'))>16)
        cache[look]=(source,labels,ndimage.find_objects(labels))
    source,labels,objects=cache[look]
    sx,sy,_,_=record['source_cell'];x,y,right,bottom=record['crop_bbox'];padding=record['padding']
    old=(sx+x,sy+y,sx+right,sy+bottom)
    hits=np.bincount(labels[old[1]:old[3],old[0]:old[2]].ravel());hits[0]=0
    component=int(hits.argmax());ys,xs=objects[component-1]
    # Include the complete outline and antialiased edge, with a clean safe margin.
    full=(max(0,xs.start-3),max(0,ys.start-3),min(source.width,xs.stop+3),min(source.height,ys.stop+3))
    origin=(old[0]-padding,old[1]-padding)
    bounds=(min(origin[0],full[0]-padding),min(origin[1],full[1]-padding),max(old[2]+padding,full[2]+padding),max(old[3]+padding,full[3]+padding))
    restored=source.crop(bounds)
    restored.save(DEST/look/'parts'/f'{name}.png')
    part=next(p for l in catalog['looks'] if l['id']==look for p in l['parts'] if p['id']==name)
    part['artworkSize']=list(restored.size)
    part['artworkOffset']=[bounds[0]-origin[0],bounds[1]-origin[1]]
    audit.append({'look':look,'part':name,'sourceBounds':list(bounds),'originalLogicalSize':record['size'],'artworkSize':list(restored.size),'artworkOffset':part['artworkOffset'],'completeOutlineBounds':[xs.start,ys.start,xs.stop,ys.stop],'crossedSourceCell':xs.start<sx or ys.start<sy or xs.stop>record['source_cell'][2] or ys.stop>record['source_cell'][3]})
catalog['artworkRevision']=2
(DEST/'catalog.json').write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+'\n')
(DEST/'edge-audit.json').write_text(json.dumps({'version':1,'method':'lossless original source pixels; complete connected outline plus antialias margin','parts':audit},ensure_ascii=False,indent=2)+'\n')
print(f'Restored and checked {len(audit)} parts; {sum(p["crossedSourceCell"] for p in audit)} crossed their original source cells.')
