"""Wardrobe gesture stays character-only and preserves saved edits."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright
clips=json.loads(Path('assets/characters/popa/animations/open-wardrobe.json').read_text())
clip=clips['open-wardrobe']
def pose(time):return {f['part']:f['values'] for f in clip['keyframes'] if f['time']==time}
assert pose(0)==pose(clip['duration'])
assert pose(.6)['right_arm']['rotate']!=pose(0)['right_arm']['rotate']
assert not any('door' in f['part'] for f in clip['keyframes'])
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 page=b.new_page(viewport={'width':1440,'height':1000});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://localhost:4205/index.html?edit=1&reference=cabinet&motion=open-wardrobe',wait_until='networkidle')
 assert page.locator('[data-editor="animationSelect"]').input_value()=='open-wardrobe'
 rig=page.locator('.character-reference-rig');before=rig.inner_html()
 page.wait_for_timeout(350)
 assert rig.inner_html()==before
 page.locator('[data-editor-action="pause"]').click()
 saved=page.evaluate('JSON.parse(localStorage.getItem("popaAnimationEditorDataV2"))')
 saved['open-wardrobe']['keyframes'][0]['values']['x']=7
 page.evaluate('(data)=>localStorage.setItem("popaAnimationEditorDataV2",JSON.stringify(data))',saved)
 page.reload(wait_until='networkidle')
 restored=page.evaluate('JSON.parse(localStorage.getItem("popaAnimationEditorDataV2"))')
 assert restored['open-wardrobe']['keyframes'][0]['values']['x']==7
 assert not errors,errors
 b.close()
print('PASS character-only wardrobe gesture, neutral endpoints, static reference and preserved edits')
