"""Corrected motion survives publication; face keys preview, edit, export and reload independently."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright
base='http://localhost:4206/animation_studio/'
corrected=json.loads(Path('source-art/characters/momo/animations/user-corrected.json').read_text())
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':1440,'height':1000});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(base+'character-studio.html?character=momo&mode=animation',wait_until='networkidle');page.wait_for_selector('[data-ready="true"]')
 # A stale animation draft must not mask the user-corrected published motion.
 old=json.loads(json.dumps(corrected));old['wave']['keyframes'][0]['values']['x']=900
 page.evaluate('(data)=>{localStorage.setItem("momoAnimationEditorDataV1",JSON.stringify(data));localStorage.setItem("momoAnimationEditorDataV1:source","old-source");}',old)
 page.reload(wait_until='networkidle');page.wait_for_selector('[data-ready="true"]')
 page.locator('[data-editor-section="export"] summary').click()
 with page.expect_download() as download:page.locator('[data-editor-action="downloadJson"]').click()
 data=json.loads(Path(download.value.path()).read_text())
 for id,clip in corrected.items():assert data[id]['keyframes']==clip['keyframes'];assert data[id]['duration']==clip['duration'];assert data[id]['loop']==clip['loop']
 def seek(clip,t):
  page.select_option('[data-editor="animationSelect"]',clip);page.locator('#momo-time').fill(str(t));page.locator('#momo-time').press('Tab')
 seek('happy',.6);assert page.locator('[data-sprite="eye_open_left"]').get_attribute('src').endswith('eye_happy_left.png');assert page.locator('[data-sprite="beak_closed"]').get_attribute('src').endswith('beak_smile.png');assert page.locator('[data-sprite="brow_left"]').evaluate('(e)=>e.style.visibility')=='hidden'
 seek('rest',1.5);assert page.locator('[data-sprite="eye_open_left"]').get_attribute('src').endswith('brow_left.png');assert page.locator('[data-sprite="eye_open_left"]').bounding_box()['height']>20
 seek('idle',1.16);assert page.locator('[data-sprite="eye_open_left"]').get_attribute('src').endswith('brow_left.png')
 seek('happy',.6);page.select_option('#momo-eyes','closed');page.select_option('#momo-beak','closed');page.locator('#momo-face-save').click()
 saved=page.evaluate('JSON.parse(localStorage.getItem("momoAnimationEditorDataV1"))');assert any(k['time']==.6 and k['eyes']=='closed' for k in saved['happy']['expressions'])
 for id,clip in corrected.items():assert saved[id]['keyframes']==clip['keyframes']
 page.reload(wait_until='networkidle');page.wait_for_selector('[data-ready="true"]');seek('happy',.6);assert page.input_value('#momo-eyes')=='closed'
 page.locator('[data-editor="duration"]').fill('.9');page.locator('[data-editor="duration"]').press('Tab');saved=page.evaluate('JSON.parse(localStorage.getItem("momoAnimationEditorDataV1"))');assert max(k['time'] for k in saved['happy']['expressions'])==.9
 page.locator('[data-momo-mode="layout"]').click();assert page.locator('[data-sprite="eye_open_left"]').get_attribute('src').endswith('eye_open_left.png');assert page.locator('[data-sprite="brow_left"]').evaluate('(e)=>e.style.visibility')=='hidden'
 page.goto(base+'game.html',wait_until='networkidle');page.wait_for_selector('#loading',state='hidden');assert page.locator('[data-character-part="eye_open_left"]').get_attribute('src').endswith('eye_open_left.png');assert page.locator('[data-character="momo"]').get_attribute('data-action')=='idle'
 for side in ['left','right']:assert not page.locator('[data-character-part="brow_'+side+'"]').is_visible()
 assert not errors,errors;b.close()
print('PASS exact corrected body keys, stale draft isolation, painted happy/sleep/blink eyes, editable facial keys, duration scaling, reload, layout restore and approved game motion')
