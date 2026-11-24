"""Manual placement, pivots, keyframes, drafts, import/export and shared game preview."""
import json,sys
from pathlib import Path
from playwright.sync_api import sync_playwright
URL=sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:4201/'
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':1440,'height':1000});errors=[];bad=[]
 page.on('pageerror',lambda e:errors.append(str(e)));page.on('response',lambda r:bad.append(r.url) if r.status>=400 else None)
 page.goto(URL+'studio.html',wait_until='networkidle');page.wait_for_function('!document.querySelector("#prop-select").disabled')
 def change(id,value):page.locator('#'+id).fill(str(value));page.locator('#'+id).press('Tab')
 def draft():return page.evaluate('JSON.parse(localStorage.getItem("popaPropDraftV1:salon.scissors"))')
 change('time',.1);change('position-x',72);assert draft()['rig']['parts'][0]['position'][0]==65
 assert next(k for k in draft()['clip']['tracks'][0]['keys'] if k['time']==.1)['x']==7
 assert page.locator('#mode').count()==0
 page.locator('#undo').click();assert draft()['rig']['parts'][0]['position'][0]==65
 # Drag the pivot while the artwork remains in the same place.
 page.locator('#assembly-details summary').click();page.locator('#part').select_option('bolt');page.locator('#pivot-mode').check()
 image=page.locator('[data-prop-image="bolt"]');before=image.bounding_box();page.mouse.move(before['x']+before['width']/2,before['y']+before['height']/2);page.mouse.down();page.mouse.move(before['x']+before['width']/2+12,before['y']+before['height']/2+9,steps=4);page.mouse.up();after=image.bounding_box()
 assert abs(after['x']-before['x'])<.1 and abs(after['y']-before['y'])<.1,(before,after)
 assert draft()['rig']['parts'][2]['anchor']!=[70,70.5]
 page.locator('#undo').click();page.locator('#pivot-mode').uncheck()
 # A drag at a new time creates a track and preserves its starting pose.
 change('time',.12);box=image.bounding_box();page.mouse.move(box['x']+box['width']/2,box['y']+box['height']/2);page.mouse.down();page.mouse.move(box['x']+box['width']/2+18,box['y']+box['height']/2,steps=3);page.mouse.up()
 bolt_track=next(t for t in draft()['clip']['tracks'] if t['part']=='bolt');assert [k['time'] for k in bolt_track['keys']]==[0,.12];assert bolt_track['keys'][1]['x']>0
 page.locator('#undo').click()
 page.locator('#part').select_option('blade-left');change('base-rotation',7)
 change('time',.19);change('rotation',32)
 assert next(k for k in draft()['clip']['tracks'][0]['keys'] if k['time']==.19)['rotation']==25
 page.locator('#loop').uncheck();page.locator('#play').click();page.wait_for_function('document.querySelector("#play").textContent.includes("ניגון")')
 page.reload(wait_until='networkidle');page.wait_for_function('!document.querySelector("#prop-select").disabled');assert page.locator('#base-rotation').input_value()=='7'
 page.locator('#export-details summary').click()
 with page.expect_download() as d:page.locator('#export-rig').click()
 assert d.value.suggested_filename=='assembly.json';exported=json.loads(Path(d.value.path()).read_text());assert exported['parts'][0]['rotation']==7
 with page.expect_download() as d:page.locator('#export-clip').click()
 assert d.value.suggested_filename=='cut.json';assert json.loads(Path(d.value.path()).read_text())['tracks'][0]['keys'][1]['rotation']==25
 invalid=json.dumps({'version':1,'id':'bad','parts':[]}).encode();page.locator('#import').set_input_files({'name':'assembly.json','mimeType':'application/json','buffer':invalid});assert 'לא בוצע' in page.locator('#status').inner_text();assert draft()['rig']['parts'][0]['rotation']==7
 exported['parts'][0]['rotation']=11;page.locator('#import').set_input_files({'name':'assembly.json','mimeType':'application/json','buffer':json.dumps(exported).encode()});assert draft()['rig']['parts'][0]['rotation']==11
 with page.expect_popup() as popup:page.locator('#game-preview').click()
 game=popup.value;game.wait_for_selector('#loading',state='hidden');assert game.locator('#scissors [data-prop-part="blade-left"]').evaluate('(e)=>e.style.transform')=='rotate(11deg)'
 assert game.locator('a[href="studio.html"]').is_visible();game.close()
 # The normal game keeps the published data, regardless of the draft.
 game=b.new_page();game.goto(URL+'salon.html',wait_until='networkidle');game.wait_for_selector('#loading',state='hidden');assert game.locator('#scissors [data-prop-part="blade-left"]').evaluate('(e)=>e.style.transform')==f"rotate({json.loads(Path('assets/scenes/salon/props/scissors/assembly.json').read_text())['parts'][0]['rotation']}deg)";game.close()
 page.locator('#export-details summary').click()
 for width,height in [(390,844),(844,390)]:
  page.set_viewport_size({'width':width,'height':height});page.locator('#fit').click();assert page.evaluate('document.documentElement.scrollWidth<=innerWidth && document.documentElement.scrollHeight<=innerHeight')
 page.screenshot(path='/tmp/prop-studio-mobile.png');assert not errors and not bad,(errors,bad)
 b.close();print('PASS: precise placement, pivot drag preserves artwork, undo, keyframes/playback, persisted draft, JSON export/import validation, same rig in game preview, normal game isolated, mobile layout')
