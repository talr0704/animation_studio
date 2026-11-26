"""Every registered cutout preserves the exact source pixels and a clear padded edge."""
import json
from pathlib import Path
from PIL import Image
import numpy as np
catalog=json.loads(Path('assets/world/catalog.json').read_text());sources={};count=0;paths=set()
assert len(catalog['groups'])==20
for group in catalog['groups']:
 source=Image.open(group['source']).convert('RGBA');sources[group['source']]=source
 for part in group['parts']:
  assert part['asset'] not in paths;paths.add(part['asset'])
  image=Image.open(part['asset']).convert('RGBA');rect=part['sourceRect'];expected=source.crop(rect)
  assert image.size==(expected.width+16,expected.height+16)
  assert np.array_equal(np.array(image.crop((8,8,image.width-8,image.height-8))),np.array(expected)),part['asset']
  pixels=np.array(image);assert not pixels[:8,:,3].any() and not pixels[-8:,:,3].any() and not pixels[:,:8,3].any() and not pixels[:,-8:,3].any()
  count+=1
looks=json.loads(Path('assets/characters/popa/outfits/catalog.json').read_text())['looks'];uploaded=[l for l in looks if l['id'].startswith('uploaded-')];assert len(uploaded)==9
for look in uploaded:
 for part in look['parts']:assert part['asset'] in paths
assert set(g['scene'] for g in catalog['groups'])=={'garden','bakery','shops','tailor','wardrobe','post','home-care','party','achievements'}
print(f'PASS {count} source-exact padded PNGs, 20 originals, nine scene categories and nine wearable studio looks')
