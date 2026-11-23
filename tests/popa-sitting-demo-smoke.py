"""Native sitting animation is editable, continuous, and does not overwrite user work."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright
clips=json.loads(Path('assets/characters/popa/animations/sitting-demo.json').read_text())
assert set(clips)=={'sit-demo-down','sit-demo','sit-demo-up'}
def pose(id,time):return {f['part']:f['values'] for f in clips[id]['keyframes'] if f['time']==time}
assert pose('sit-demo-down',1.35)==pose('sit-demo',0)==pose('sit-demo-up',0)
assert pose('sit-demo',0)==pose('sit-demo',2.6)
assert pose('sit-demo',0)['torso']['scaleY']<1
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':1440,'height':1000});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://localhost:4205/index.html?edit=1&reference=sofa&motion=sit-demo',wait_until='networkidle')
 assert page.locator('[data-editor="animationSelect"]').input_value()=='sit-demo'
 page.wait_for_timeout(300);first=page.locator('[data-editor="timeDisplay"]').text_content();page.wait_for_timeout(350);assert page.locator('[data-editor="timeDisplay"]').text_content()!=first
 page.locator('[data-editor-action="pause"]').click()
 assert page.locator('.character-reference-rig [data-prop-image="seat-cushion"]').count()==1
 assert page.locator('[data-sprite="foot_left"]').bounding_box()['height']>0
 saved=page.evaluate('JSON.parse(localStorage.getItem("popaAnimationEditorDataV2"))');saved['my-animation']={'name':'עבודה קיימת','duration':1,'loop':False,'keyframes':[]};saved['sit-demo']['keyframes'][0]['values']['x']=7
 page.evaluate('(data)=>localStorage.setItem("popaAnimationEditorDataV2",JSON.stringify(data))',saved);page.reload(wait_until='networkidle');restored=page.evaluate('JSON.parse(localStorage.getItem("popaAnimationEditorDataV2"))');assert 'my-animation' in restored;assert restored['sit-demo']['keyframes'][0]['values']['x']==7
 assert not errors,errors;b.close()
print('PASS complete sitting clips, seamless transitions/loop, native playback, editable keys and preserved user animations')
