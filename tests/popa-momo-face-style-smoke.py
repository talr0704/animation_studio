"""Calm eyelid arcs and independent 8% mouth sizing preserve the closed-mouth calibration."""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':1440,'height':1000});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://localhost:4206/animation_studio/character-studio.html?character=momo&mode=animation',wait_until='networkidle');page.wait_for_selector('[data-ready="true"]')
 image=page.locator('[data-sprite="beak_closed"]')
 def geometry():
  r=image.bounding_box();return r['width'],r['height'],r['x']+r['width']/2,r['y']+r['height']/2
 before=geometry();calibration=image.evaluate('(e)=>[e.style.left,e.style.top,e.style.width,e.style.height,e.style.transform]')
 for state in ['smile','open']:
  page.select_option('#momo-beak',state);after=geometry()
  assert abs(after[0]/before[0]-1.08)<.0001 and abs(after[1]/before[1]-1.08)<.0001
  assert abs(after[2]-before[2])<.01 and abs(after[3]-before[3])<.01
  assert image.evaluate('(e)=>[e.style.left,e.style.top,e.style.width,e.style.height,e.style.transform]')==calibration
 page.select_option('#momo-beak','closed');after=geometry();assert all(abs(a-b)<.01 for a,b in zip(after,before));assert image.evaluate('(e)=>e.parentElement.style.transform')=='none'
 page.select_option('#momo-eyes','closed');assert page.locator('[data-sprite="eye_open_left"]').get_attribute('src').endswith('brow_left.png');assert page.locator('[data-sprite="eye_open_right"]').get_attribute('src').endswith('brow_right.png');assert page.locator('[data-sprite="eye_open_left"]').evaluate('(e)=>e.style.scale')=='1 -1'
 page.screenshot(path='/tmp/momo-calm-arcs.png')
 page.locator('[data-momo-mode="layout"]').click();assert page.locator('[data-sprite="eye_open_left"]').get_attribute('src').endswith('eye_open_left.png');assert page.locator('[data-sprite="eye_open_left"]').evaluate('(e)=>e.style.scale')=='none';assert image.evaluate('(e)=>[e.style.left,e.style.top,e.style.width,e.style.height,e.style.transform]')==calibration;assert image.evaluate('(e)=>e.parentElement.style.transform')=='none'
 assert not errors,errors;b.close()
print('PASS thin inverted painted arcs, smile/open exactly 8% larger about unchanged centre, closed beak unchanged and layout reset')
