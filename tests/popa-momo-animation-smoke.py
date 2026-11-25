"""Native timeline, automatic pose keys and head followers are isolated from calibration and gameplay."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright
URL='http://localhost:4206/animation_studio/'
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);context=b.new_context(viewport={'width':1440,'height':1000});page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(URL+'character-studio.html?character=momo&mode=animation',wait_until='networkidle');page.wait_for_selector('[data-ready="true"]')
 assert page.locator('[data-editor="animationSelect"] option').count()==7;assert page.locator('#momo-layout-panel').is_hidden();assert page.locator('#momo-animation-panel').is_visible()
 page.evaluate('localStorage.setItem("popaAnimationEditorDataV2",JSON.stringify({existing:{name:"עבודה של פופה",duration:1,loop:false,keyframes:[]}}))')
 page.locator('[data-editor="animationSelect"]').select_option('wave');page.locator('[data-editor-action="play"]').click();page.wait_for_timeout(550);page.locator('[data-editor-action="pause"]').click()
 assert float(page.input_value('#momo-time'))>0
 page.locator('#momo-time').fill('1.2');page.locator('#momo-time').press('Tab')
 head=page.locator('[data-sprite="head"]');box=head.bounding_box();page.mouse.move(box['x']+20,box['y']+box['height']/2);page.mouse.down();page.mouse.move(box['x']+42,box['y']+box['height']/2+10,steps=3);page.mouse.up()
 data=page.evaluate('JSON.parse(localStorage.getItem("momoAnimationEditorDataV1"))');key=next(k for k in data['wave']['keyframes'] if k['part']=='head' and k['time']==1.2);assert key['values']['x']!=0
 head_motion=page.locator('[data-sprite="head"]').evaluate('(e)=>e.parentElement.style.transform')
 hat_motion=page.locator('[data-sprite="hat"]').evaluate('(e)=>e.parentElement.parentElement.style.transform');assert head_motion==hat_motion
 assert page.evaluate('JSON.parse(localStorage.getItem("popaAnimationEditorDataV2")).existing.name')=='עבודה של פופה';assert not page.evaluate('localStorage.getItem("momoAssemblyPositionsV1")')
 page.locator('[data-editor-section="export"] summary').click()
 with page.expect_download() as download:page.locator('[data-editor-action="downloadJson"]').click()
 exported=json.loads(Path(download.value.path()).read_text());assert download.value.suggested_filename=='momo-animation-drafts.json';assert exported==data
 invalid=json.loads(json.dumps(data));invalid['wave']['keyframes'][0]['part']='left_arm';page.locator('[data-editor="importText"]').fill(json.dumps(invalid));page.once('dialog',lambda dialog:dialog.accept());page.locator('[data-editor-action="importJson"]').click();assert page.evaluate('JSON.parse(localStorage.getItem("momoAnimationEditorDataV1"))')==data
 imported=json.loads(json.dumps(data));imported['wave']['name']='נפנוף מותאם';page.locator('[data-editor="importText"]').fill(json.dumps(imported));page.locator('[data-editor-action="importJson"]').click();assert page.evaluate('JSON.parse(localStorage.getItem("momoAnimationEditorDataV1")).wave.name')=='נפנוף מותאם'
 page.reload(wait_until='networkidle');page.wait_for_selector('[data-ready="true"]');assert page.evaluate('JSON.parse(localStorage.getItem("momoAnimationEditorDataV1")).wave.keyframes.some(k=>k.time===1.2&&k.part==="head")')
 page.locator('[data-editor="animationSelect"]').select_option('wave');page.locator('[data-editor="duration"]').fill('1.2');page.locator('[data-editor="duration"]').press('Tab');assert page.evaluate('JSON.parse(localStorage.getItem("momoAnimationEditorDataV1")).wave.keyframes.every(k=>k.time<=1.2)')
 page.locator('[data-momo-mode="layout"]').click();assert page.locator('#momo-animation-panel').is_hidden();page.locator('[data-momo-mode="animation"]').click();assert page.locator('#momo-animation-panel').is_visible()
 for w,h in [(390,844),(844,390)]:
  page.set_viewport_size({'width':w,'height':h});page.wait_for_timeout(150);assert page.evaluate('document.documentElement.scrollWidth<=innerWidth');assert page.locator('[data-editor="animationSelect"]').is_visible()
 requests=[];page.on('request',lambda r:requests.append(r.url))
 page.goto(URL+'game.html',wait_until='networkidle');page.wait_for_selector('#loading',state='hidden');assert not any('studio-drafts.json' in url for url in requests)
 head=next(l for l in json.loads(Path('assets/characters/momo/assembly.json').read_text())['layersBackToFront'] if l['file']=='parts/head.png');size=next(s['displaySize'] for s in json.loads(Path('assets/characters/momo/assembly.json').read_text())['sprites'] if s['file']=='parts/head.png')
 assert abs(page.locator('[data-character-part="head"]').evaluate('(e)=>parseFloat(e.style.left)')-(head['centerX']-size[0]/2))<.001
 assert page.locator('[data-character="momo"]').evaluate('(e)=>e.getAnimations({subtree:true}).length')==0
 assert not errors,errors;b.close()
print('PASS seven editable drafts, playback, automatic keys, head-following, JSON export, persistence, mobile and unchanged static game')
