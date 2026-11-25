"""All Momo crops are padded, original-colour parts; alternate faces are separate assets."""
import json
from pathlib import Path
import numpy as np
from PIL import Image
root=Path('assets/characters/momo');manifest=json.loads(Path('source-art/characters/momo/parts-manifest.json').read_text());source=np.array(Image.open('source-art/characters/momo/rig-sheet.png'))
assert len(manifest['parts'])==24
for part in manifest['parts']:
 image=np.array(Image.open(part['destination']));x,y,w,h=part['rect'];assert image.shape[:2]==(h,w)
 visible=image[:,:,3]>0;assert np.array_equal(image[visible],source[y:y+h,x:x+w][visible])
 solid=image[:,:,3]>128;assert not solid[0].any() and not solid[-1].any() and not solid[:,0].any() and not solid[:,-1].any(),part['part']
rig=json.loads((root/'assembly.json').read_text());assert rig['id']=='momo';assert len(rig['layersBackToFront'])==18
for layer in rig['layersBackToFront']:
 assert (root/layer['file']).is_file();assert any(s['file']==layer['file'] for s in rig['sprites'])
print('PASS all 24 source-colour crops, padded edges and 18-part editable assembly')
