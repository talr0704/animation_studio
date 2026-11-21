"""Furniture buttons dispatch travel before interaction, cancellation, and clean responsive art."""
import sys
from playwright.sync_api import sync_playwright
URL=sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:4210/'
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':1440,'height':1000});errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.clock.install();page.goto(URL+'game.html',wait_until='networkidle');page.wait_for_selector('#loading',state='hidden')
 assert page.locator('.room-item').count()==8
 assert page.locator('#room img[src$=".svg"]').count()==0
 assert page.locator('#window-prop,#shelf-prop,#plant-prop,.wall-art,.home-dresser,#salon-mirror').count()==0
 def arrive(item):
  page.locator(f'[data-furniture="{item}"]').click()
  assert page.locator('#player').get_attribute('data-interaction')!=item
  for _ in range(120):
   page.clock.run_for(100)
   if page.locator('#player').get_attribute('data-interaction')==item:return
  raise AssertionError('Never arrived at '+item)
 arrive('sofa');assert page.locator('.cat-character').get_attribute('data-action')=='rest'
 page.keyboard.down('ArrowRight');page.clock.run_for(200);page.keyboard.up('ArrowRight');assert page.locator('#player').get_attribute('data-interaction') is None
 arrive('wardrobe');assert page.locator('.cat-character').get_attribute('data-action')=='wave';page.clock.run_for(1800);assert page.locator('#player').get_attribute('data-interaction') is None
 arrive('reading-books');assert page.locator('.cat-character').get_attribute('data-action')=='hold';assert page.locator('.cat-item-anchor img').count()==1
 page.locator('[data-furniture="toy-chest"]').click();assert page.locator('.cat-item-anchor img').count()==0
 for _ in range(120):
  page.clock.run_for(100)
  if page.locator('#player').get_attribute('data-interaction')=='toy-chest':break
 assert page.locator('.cat-character').get_attribute('data-action')=='happy'
 page.locator('#garden-tab').click();assert page.locator('#overlay').is_visible();assert page.locator('#player').get_attribute('data-interaction') is None
 page.locator('#dialog-secondary').click();page.set_viewport_size({'width':390,'height':844});page.clock.run_for(150)
 for button in page.locator('.room-item').all():
  r=button.bounding_box();assert r['x']>=-1 and r['x']+r['width']<=391 and r['y']>=51 and r['y']+r['height']<=845
 arrive('floor-lamp');assert page.locator('.cat-character').get_attribute('data-action')=='interact'
 arrive('mirror');page.clock.run_for(1300);page.wait_for_url('**/salon.html');page.wait_for_selector('#loading',state='hidden')
 assert not errors,errors
 page.goto(URL+'manicure.html',wait_until='networkidle');page.wait_for_selector('#loading',state='hidden');assert page.locator('input[type="range"]').count()==0
 page.locator('[data-nail="0"]').click();page.locator('[data-width="65"]').click();assert page.locator('#brush-size').input_value()=='65';assert page.locator('[data-width="65"]').get_attribute('aria-pressed')=='true'
 page.locator('#creative-toggle').click();assert page.locator('#creative-toggle').get_attribute('aria-pressed')=='true'
 assert page.evaluate('document.documentElement.scrollWidth<=innerWidth&&document.documentElement.scrollHeight<=innerHeight')
 b.close();print('PASS: all props are illustrated buttons, travel precedes correct clips, cancel/reset/held books, garden, mobile furniture bounds, manicure controls use buttons only')
