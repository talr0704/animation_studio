"""Momo reuses Popa's placement editor, with isolated saves, drag, pivot, layers and JSON round-trip."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':1440,'height':1000});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://localhost:4205/index.html?character=momo&edit=1',wait_until='networkidle');page.wait_for_selector('.cat-character[data-ready="true"]');assert 'character-studio.html' in page.url
 assert page.locator('.cat-part').count()==18
 assert page.locator('.cat-part').evaluate_all('(els)=>els.every(e=>e.complete&&e.naturalWidth>0)')
 page.evaluate('localStorage.setItem("popaAssemblyPositionsV5",JSON.stringify({sentinel:1}))')
 field=lambda name:page.locator('[data-layout="'+name+'"]')
 field('part').select_option('head');field('x').fill('250');field('width').fill('300')
 before=page.locator('[data-sprite="head"]').bounding_box();page.mouse.move(before['x']+20,before['y']+before['height']/2);page.mouse.down();page.mouse.move(before['x']+40,before['y']+before['height']/2,steps=3);page.mouse.up();assert field('part').input_value()=='head';assert float(field('x').input_value())>250
 field('forward').click();field('previewPivot').click();assert page.locator('.cat-character').evaluate('(e)=>e.getAnimations({subtree:true}).length')>0
 field('save').click();saved=page.evaluate('JSON.parse(localStorage.getItem("momoAssemblyPositionsV1"))');assert saved['head']['x']>250
 assert page.evaluate('JSON.parse(localStorage.getItem("popaAssemblyPositionsV5")).sentinel')==1
 page.reload(wait_until='networkidle');page.wait_for_selector('[data-ready="true"]');assert abs(float(field('x').input_value())-saved['head']['x'])<.01
 with page.expect_download() as download:field('download').click()
 data=json.loads(Path(download.value.path()).read_text());assert download.value.suggested_filename=='momo-assembly.json';assert data['id']=='momo';assert len(data['layersBackToFront'])==18
 head=next(layer for layer in data['layersBackToFront'] if layer['file']=='parts/head.png');assert abs(head['centerX']-saved['head']['x'])<.001
 head['centerX']=205
 field('import').set_input_files({'name':'momo-assembly.json','mimeType':'application/json','buffer':json.dumps(data).encode()});assert float(field('x').input_value())==205
 data['id']='popa';field('import').set_input_files({'name':'wrong.json','mimeType':'application/json','buffer':json.dumps(data).encode()});page.wait_for_function('document.querySelector("[data-layout=status]").textContent.includes("לא בוצע")');assert float(field('x').input_value())==205
 field('save').click();page.reload(wait_until='networkidle');page.wait_for_selector('[data-ready="true"]');assert float(field('x').input_value())==205
 for w,h in [(390,844),(844,390)]:
  page.set_viewport_size({'width':w,'height':h});page.wait_for_timeout(100);assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
 assert not errors,errors
 b.close()
print('PASS 18 assembled parts, direct editor route, drag/size/layer/pivot, independent save, JSON export/import validation and mobile layout')
