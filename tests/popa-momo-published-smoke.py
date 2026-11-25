"""Published user calibration matches the game; old editor drafts do not override a changed source."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright
rig=json.loads(Path('assets/characters/momo/assembly.json').read_text());sprites={s['file']:s for s in rig['sprites']}
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':1440,'height':1000});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://localhost:4206/animation_studio/game.html',wait_until='networkidle');page.wait_for_selector('#loading',state='hidden')
 assert page.locator('[data-character="momo"] [data-character-part]').count()==18
 for layer in rig['layersBackToFront']:
  name=layer['file'].split('/')[-1].replace('.png','');image=page.locator('[data-character-part="'+name+'"]');w,h=sprites[layer['file']]['displaySize']
  pose=image.evaluate('(e)=>({x:parseFloat(e.style.left),y:parseFloat(e.style.top),w:parseFloat(e.style.width),h:parseFloat(e.style.height),pivot:e.style.transformOrigin,z:Number(e.style.zIndex),transform:e.style.transform})')
  assert abs(pose['x']-(layer['centerX']-w/2))<.001 and abs(pose['y']-(layer['centerY']-h/2))<.001
  assert abs(pose['w']-w)<.001 and abs(pose['h']-h)<.001 and pose['z']==layer['zIndex']
  assert 'rotate('+str(layer['clockwiseDegrees'])+'deg)' in pose['transform']
  pivot=[float(value.replace('px','')) for value in pose['pivot'].split()];assert abs(pivot[0]-(layer['pivotX']-pose['x']))<.001 and abs(pivot[1]-(layer['pivotY']-pose['y']))<.001
 assert page.locator('[data-character="momo"]').evaluate('(e)=>e.getBoundingClientRect().width')>0
 page.screenshot(path='/tmp/momo-published-room.png')
 page.evaluate('localStorage.setItem("momoAssemblyPositionsV1",JSON.stringify({head:{x:999,y:999,rotate:0}}));localStorage.setItem("momoAssemblyPositionsV1:source","old-source")')
 page.goto('http://localhost:4206/animation_studio/character-studio.html?character=momo',wait_until='networkidle');page.wait_for_selector('[data-ready="true"]')
 head=next(l for l in rig['layersBackToFront'] if l['file']=='parts/head.png');assert abs(float(page.input_value('[data-layout="x"]'))-head['centerX'])<.01
 page.locator('[data-layout="x"]').fill('235');page.locator('[data-layout="save"]').click();page.reload(wait_until='networkidle');page.wait_for_selector('[data-ready="true"]');assert float(page.input_value('[data-layout="x"]'))==235
 assert not errors,errors
 b.close()
print('PASS all 18 published positions, dimensions, rotations and layers; nested deployment, stale draft isolation and new draft restore')
