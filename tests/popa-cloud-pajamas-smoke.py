"""Five new garments load independently and old cloud drafts upgrade safely."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright
catalog=json.loads(Path('assets/characters/popa/outfits/catalog.json').read_text())
cloud=next(l for l in catalog['looks'] if l['id']=='cloud')
cloud['parts']=[p for p in cloud['parts'] if not p['id'].startswith('pants_')]
for id in ['collar_left','collar_right','slipper_left','slipper_right']:
    part=dict(cloud['parts'][0]);part.update(id=id,asset=f'assets/characters/popa/outfits/cloud/parts/{id}.png');cloud['parts'].append(part)
cloud['hiddenBase']=['shirt','pinafore'];cloud['parts'][0]['x']=245;cloud['parts'][0]['rotation']=14
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':1280,'height':1000});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://localhost:4205/index.html?outfits=1',wait_until='networkidle');page.evaluate('(data)=>localStorage.setItem("popa.outfit-placements.v1",JSON.stringify(data))',{'version':1,'character':'popa','canvas':[440,475],'looks':[cloud]});page.reload(wait_until='networkidle')
 assert page.locator('[data-sprite="flower"]').evaluate('(e)=>getComputedStyle(e).visibility')=='hidden'
 assert page.input_value('#outfit-x')=='245' and page.input_value('#outfit-rotation')=='14'
 assert page.locator('[data-piece]').count()==7
 for id in ['pajama_body','sleeve_left','sleeve_right','pants_left','pants_right']:
  page.locator('[data-piece="'+id+'"]').click();assert page.locator('[data-outfit-part="'+id+'"]').evaluate('(e)=>e.complete&&e.naturalWidth>0')
 for id in ['collar_left','collar_right','slipper_left','slipper_right']:assert page.locator('[data-piece="'+id+'"]').count()==0
 page.locator('#outfit-x').fill('260');page.locator('#outfit-x').press('Tab');page.reload(wait_until='networkidle');page.locator('[data-piece="pants_right"]').click();assert page.input_value('#outfit-x')=='260'
 assert not errors,errors
 b.close()
print('PASS new shirt, two sleeves and two pant legs; legacy draft migration and subsequent reload')
