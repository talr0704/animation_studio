"""Extract the user's transparent sprite sheets; retain pixel scale and a padded edge."""
import json
from pathlib import Path
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
spec=json.loads((ROOT/'source-art/world/sheets/catalog.json').read_text())
groups=[]
for sheet in spec['sheets']:
 source=ROOT/'source-art/world/sheets'/sheet['source']
 if not source.exists():
  (ROOT/'assets'/sheet['source']).rename(source)
 im=Image.open(source).convert('RGBA');parts=[]
 for part in sheet['parts']:
  rect=part['rect'];crop=im.crop(rect);sprite=Image.new('RGBA',(crop.width+16,crop.height+16));sprite.paste(crop,(8,8))
  asset=f"assets/scenes/{sheet['scene']}/props/{sheet['id']}/images/{part['id']}.png"
  path=ROOT/asset;path.parent.mkdir(parents=True,exist_ok=True);sprite.save(path,optimize=True)
  parts.append(dict(id=part['id'],asset=asset,size=list(sprite.size),sourceRect=rect))
 groups.append(dict(id=sheet['id'],scene=sheet['scene'],title=sheet['title'],source=str(source.relative_to(ROOT)),parts=parts))
manifest=ROOT/'assets/world/catalog.json';manifest.parent.mkdir(parents=True,exist_ok=True);manifest.write_text(json.dumps({'version':1,'groups':groups},ensure_ascii=False,indent=2)+'\n')
print(f"Extracted {sum(len(g['parts']) for g in groups)} parts from {len(groups)} user sheets")
