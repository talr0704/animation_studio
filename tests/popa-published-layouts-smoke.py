"""Published room and all clothing placements work in a browser without personal drafts."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright
catalog=json.loads(Path('assets/characters/popa/outfits/catalog.json').read_text())
layout=json.loads(Path('assets/scenes/home/furniture/layout.json').read_text())
assert all(look.get('placements') for look in catalog['looks'])
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':1440,'height':1000});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 # Simulate old personal data; a new published room and published fits must take precedence.
 old={'version':1,'scene':'home','background':layout['background'],'wide':layout['wide'],'portrait':layout['portrait']}
 old=json.loads(json.dumps(old));old['wide']['items']['window'][0]=50
 page.goto('http://localhost:4205/game.html',wait_until='networkidle');page.wait_for_selector('#loading',state='hidden')
 page.evaluate('(data)=>localStorage.setItem("popa.home-layout.v1",JSON.stringify(data))',old)
 page.reload(wait_until='networkidle');page.wait_for_selector('#loading',state='hidden')
 window=page.locator('[data-furniture="window"]')
 assert abs(window.evaluate('(e)=>parseFloat(e.style.left)')-layout['wide']['items']['window'][0]/1280*100)<.001
 assert page.locator('[data-furniture="window-curtain-right"]').evaluate('(e)=>e.style.zIndex')=='2'
 assert page.locator('[data-fitted="false"]').count()==0
 for look in catalog['looks']:
  fit=json.loads(Path(look['placements']).read_text())['looks'][0]
  page.evaluate('document.getElementById("wardrobe-panel").hidden=false')
  page.locator('[data-wear="'+look['id']+'"]').click()
  page.wait_for_function('(id)=>document.querySelector(".cat-character").dataset.outfit===id',arg=look['id'])
  assert page.locator('[data-worn-part]').count()==sum(part['visible'] for part in fit['parts'])
  for part in fit['parts']:
   if not part['visible']:continue
   original=next(p for p in look['parts'] if p['id']==part['id']);image=page.locator('[data-worn-part="'+part['id']+'"]')
   actual=image.evaluate('(e)=>({left:parseFloat(e.style.left),width:parseFloat(e.style.width),rotation:e.style.transform,layer:e.closest(".worn-layer").style.zIndex})')
   nw=original['naturalSize'][0];aw=original.get('artworkSize',original['naturalSize'])[0];dx=original.get('artworkOffset',[0,0])[0]
   assert abs(actual['left']-(part['x']-part['width']/2+dx*part['width']/nw))<.001
   assert abs(actual['width']-aw*part['width']/nw)<.001
   assert actual['layer']==str(round(part['layer']*1000))
 page.set_viewport_size({'width':390,'height':844});page.wait_for_timeout(100)
 assert abs(window.evaluate('(e)=>parseFloat(e.style.left)')-layout['portrait']['items']['window'][0]/390*100)<.001
 assert not errors,errors
 b.close()
print('PASS published room profiles/layers over stale draft and all 19 fitted looks in a clean browser')
