"""Furniture editing, shared playback and actual approach/sit/get-up in the room."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright
URL='http://localhost:4205/'
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);context=browser.new_context(viewport={'width':1440,'height':1000});page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(e.stack))
 page.goto(URL+'index.html?furniture=sofa',wait_until='networkidle');assert page.locator('.cat-character').get_attribute('data-ready')=='true';assert page.locator('.animation-editor').count()==0
 page.locator('#fi-x').fill('220');page.locator('#fi-x').press('Tab');boundary=page.evaluate('JSON.parse(localStorage.getItem("popa.furniture.sofa.sit.v1"))');assert boundary['phases']['enter']['keys'][-1]['placement']['x']==220 and boundary['phases']['exit']['keys'][0]['placement']['x']==220
 page.locator('#fi-undo').click()
 page.locator('#fi-time').evaluate('(e)=>{e.value=.5;e.dispatchEvent(new Event("input",{bubbles:true}))}');page.select_option('#fi-part','foot_left');page.locator('#fi-x').fill('-15');page.locator('#fi-x').press('Tab');assert page.locator('#fi-keys button').count()==4
 with page.expect_download() as download:page.locator('#fi-export').click()
 draft=json.loads(Path(download.value.path()).read_text());assert download.value.suggested_filename=='sofa-sit.json';assert next(k for k in draft['phases']['hold']['keys'] if k['time']==.5)['pose']['foot_left']['x']==-15
 for key in draft['phases']['hold']['keys']:key['placement']['x']=225
 page.locator('#fi-import').set_input_files({'name':'sit.json','mimeType':'application/json','buffer':json.dumps(draft).encode()});page.wait_for_function('JSON.parse(localStorage.getItem("popa.furniture.sofa.sit.v1")).phases.hold.keys[0].placement.x===225');page.reload(wait_until='networkidle');assert page.input_value('#fi-x')=='225'
 page.set_viewport_size({'width':390,'height':844});page.screenshot(path='/tmp/sofa-editor-mobile.png');assert page.locator('#fi-play').is_visible()
 # Explicit game preview uses the draft; normal gameplay still loads published data.
 page.evaluate('localStorage.setItem("popaWorldV1",JSON.stringify({outfit:"cloud"}))')
 preview=context.new_page();preview.on('pageerror',lambda e:errors.append(e.stack));preview.clock.install();preview.goto(URL+'game.html?interactionPreview=sofa',wait_until='networkidle');preview.wait_for_selector('#loading',state='hidden');preview.clock.run_for(10000)
 assert preview.locator('.cat-character').get_attribute('data-furniture-phase')=='hold';assert preview.locator('[data-worn-part]').count()==7;assert preview.locator('.furniture-game-actor').evaluate('(e)=>{const m=new DOMMatrix(e.style.transform);return Math.abs(m.e+220*m.a-225)<.01}')
 preview.set_viewport_size({'width':390,'height':844});preview.clock.run_for(100);assert preview.locator('.cat-character').get_attribute('data-furniture-phase')=='hold'
 preview.keyboard.down('ArrowRight');preview.clock.run_for(1500);preview.keyboard.up('ArrowRight');assert preview.locator('#player .popa-browser').count()==1;assert preview.locator('.interaction-foreground').count()==0
 preview.goto(URL+'game.html',wait_until='networkidle');preview.wait_for_selector('#loading',state='hidden');preview.locator('[data-furniture="sofa"]').click();preview.clock.run_for(10000);assert preview.locator('.cat-character').get_attribute('data-furniture-phase')=='hold'
 assert preview.locator('.furniture-game-actor').evaluate('(e)=>{const m=new DOMMatrix(e.style.transform);return Math.abs(m.e+220*m.a-210)<.01}')
 box=preview.locator('.world').bounding_box();preview.locator('#room').dispatch_event('pointerdown',{'clientX':box['width']*.6,'clientY':box['y']+box['height']*.95});preview.clock.run_for(1500);assert preview.locator('#player .popa-browser').count()==1
 assert not errors,errors;browser.close()
print('PASS furniture studio keyframes/import/export, mobile, draft preview isolation, sit loop, resize and get-up before walking')
