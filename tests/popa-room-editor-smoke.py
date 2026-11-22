"""Edit room objects without triggering interactions, persist profiles, round-trip placement JSON."""
import json,sys
from pathlib import Path
from playwright.sync_api import sync_playwright
URL=sys.argv[1] if len(sys.argv)>1 else 'http://localhost:4205/'
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':1440,'height':1000});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(URL+'game.html',wait_until='networkidle');page.wait_for_selector('#loading',state='hidden')
 assert 'coastal-room.png' in page.locator('#room').evaluate('(e)=>e.style.backgroundImage')
 page.locator('#edit-room').click();assert page.locator('.room-editor').is_visible()
 page.select_option('#room-edit-item','sofa');old=float(page.input_value('#room-edit-x'));sofa=page.locator('[data-furniture="sofa"]');r=sofa.bounding_box()
 page.mouse.move(r['x']+r['width']/2,r['y']+r['height']/2);page.mouse.down();page.mouse.move(r['x']+r['width']/2+60,r['y']+r['height']/2+20);page.mouse.up()
 assert abs(float(page.input_value('#room-edit-x'))-old-60*1280/1440)<1
 assert page.locator('#player').get_attribute('data-interaction') is None
 page.locator('#room-edit-width').fill('360');page.locator('#room-edit-width').press('Tab');assert page.input_value('#room-edit-height')=='272.7'
 page.locator('#room-edit-layer').fill('5');page.locator('#room-edit-layer').press('Tab');assert sofa.evaluate('(e)=>e.style.zIndex')=='5'
 x=page.input_value('#room-edit-x')
 with page.expect_download() as d:page.locator('#room-edit-export').click()
 data=json.loads(Path(d.value.path()).read_text());assert data['wide']['items']['sofa'][2]==360
 page.locator('#room-edit-save').click();assert page.locator('.room-editor').is_hidden()
 page.reload(wait_until='networkidle');page.wait_for_selector('#loading',state='hidden');page.locator('#edit-room').click();page.select_option('#room-edit-item','sofa');assert page.input_value('#room-edit-x')==x
 page.set_viewport_size({'width':390,'height':844});page.wait_for_timeout(100);assert page.input_value('#room-edit-x')=='10'
 page.locator('#room-edit-x').fill('25');page.locator('#room-edit-x').press('Tab');page.set_viewport_size({'width':1440,'height':1000});page.wait_for_timeout(100);assert page.input_value('#room-edit-x')==x
 page.locator('#room-edit-import').set_input_files({'name':'layout.json','mimeType':'application/json','buffer':json.dumps(data).encode()});page.wait_for_timeout(100)
 page.set_viewport_size({'width':390,'height':844});page.wait_for_timeout(100);assert page.input_value('#room-edit-x')=='10'
 page.screenshot(path='/tmp/room-editor-mobile.png');page.locator('#room-edit-done').click();page.set_viewport_size({'width':1440,'height':1000});page.wait_for_timeout(100);page.screenshot(path='/tmp/room-new-background.png')
 page.locator('#edit-room').click();page.locator('#garden-tab').click();assert page.locator('.room-editor').is_hidden();assert page.locator('#edit-room').is_hidden()
 assert not errors,errors
 b.close()
print('PASS room background, drag, sizing/layers, separate profiles, storage, JSON round-trip and garden exit')
