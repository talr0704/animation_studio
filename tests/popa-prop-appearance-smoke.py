"""Static prop layout saves independently of animation and is consumed by the game."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright
clip=json.loads(Path('assets/scenes/home/furniture/coastal/cabinet/animations/open.json').read_text())
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 context=b.new_context(viewport={'width':1440,'height':1000});page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://localhost:4205/studio.html?category=furniture&prop=home.coastal-cabinet',wait_until='networkidle')
 page.select_option('#part','door-left');page.locator('#time').fill('.7');page.locator('#time').press('Tab')
 assert page.locator('[data-prop-image="door-left"]').get_attribute('src').endswith('door-left-open.png')
 page.select_option('#edit-mode','appearance')
 assert page.locator('.timeline').is_hidden();assert page.locator('#play').is_disabled()
 assert page.locator('[data-prop-image="door-left"]').get_attribute('src').endswith('door-left.png')
 assert float(page.input_value('#position-x'))==37
 box=page.locator('[data-prop-image="door-left"]').bounding_box()
 page.mouse.move(box['x']+box['width']/2,box['y']+box['height']/2);page.mouse.down();page.mouse.move(box['x']+box['width']/2+20,box['y']+box['height']/2+12,steps=3);page.mouse.up()
 assert float(page.input_value('#position-x'))>37
 page.locator('#position-x').fill('52');page.locator('#position-x').press('Tab')
 page.locator('#position-y').fill('113');page.locator('#position-y').press('Tab')
 draft=page.evaluate('JSON.parse(localStorage.getItem("popaPropDraftV1:home.coastal-cabinet"))')
 assert draft['clip']==clip
 page.locator('#save-appearance').click()
 saved=page.evaluate('JSON.parse(localStorage.getItem("popaPropAppearanceV1:home.coastal-cabinet"))')
 assert all('image' not in p for p in saved['parts'])
 game=context.new_page();game.on('pageerror',lambda e:errors.append(str(e)))
 game.goto('http://localhost:4205/game.html',wait_until='networkidle');game.wait_for_selector('#loading',state='hidden')
 door=game.locator('[data-furniture="wardrobe"] [data-prop-part="door-left"]')
 assert door.evaluate('(e)=>e.style.left')=='52px';assert door.evaluate('(e)=>e.style.top')=='113px'
 game.reload(wait_until='networkidle');game.wait_for_selector('#loading',state='hidden');assert door.evaluate('(e)=>e.style.left')=='52px'
 # Invalid stored coordinates are ignored instead of breaking the game.
 game.evaluate('localStorage.setItem("popaPropAppearanceV1:home.coastal-cabinet",JSON.stringify({version:1,id:"home.coastal-cabinet",parts:[{id:"frame"},{id:"door-left",position:["bad",1]},{id:"door-right"}]}))')
 game.reload(wait_until='networkidle');game.wait_for_selector('#loading',state='hidden');assert door.evaluate('(e)=>e.style.left')=='37px'
 page.locator('#save-appearance').click();page.locator('#clear-appearance').click()
 game.reload(wait_until='networkidle');game.wait_for_selector('#loading',state='hidden');assert door.evaluate('(e)=>e.style.left')=='37px'
 assert not errors,errors
 b.close()
print('PASS static neutral editing, unchanged animation, game persistence, invalid layout fallback and reset')
