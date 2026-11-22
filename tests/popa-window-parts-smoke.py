"""Window frame, rod and both curtains move independently, including legacy draft migration."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':1280,'height':1000});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://localhost:4205/game.html',wait_until='networkidle');page.wait_for_selector('#loading',state='hidden');page.locator('#edit-room').click()
 ids=['window','window-rod','window-curtain-left','window-curtain-right']
 before={id:page.locator('[data-furniture="'+id+'"]').get_attribute('style') for id in ids}
 for i,id in enumerate(ids):
  page.select_option('#room-edit-item',id);x=float(page.input_value('#room-edit-x'));page.locator('#room-edit-x').fill(str(x+20));page.locator('#room-edit-x').press('Tab')
  for other in ids[i+1:]:assert page.locator('[data-furniture="'+other+'"]').get_attribute('style')==before[other]
 with page.expect_download() as d:page.locator('#room-edit-export').click()
 data=json.loads(Path(d.value.path()).read_text())
 for profile in ['wide','portrait']:
  for id in ids[1:]:data[profile]['items'].pop(id);data[profile]['layers'].pop(id)
  data[profile]['items']['window']=[100,100,250,200]
 page.evaluate('(data)=>localStorage.setItem("popa.home-layout.v1",JSON.stringify(data))',data)
 page.reload(wait_until='networkidle');page.wait_for_selector('#loading',state='hidden');page.locator('#edit-room').click();page.select_option('#room-edit-item','window-rod')
 assert float(page.input_value('#room-edit-width'))>200
 page.select_option('#room-edit-item','window');assert float(page.input_value('#room-edit-width'))<200
 assert not errors,errors
 b.close()
print('PASS independent window parts and migration of previous room arrangements')
