"""Tools are picked directly from illustrated in-scene locations, not a toolbar."""
import sys
from playwright.sync_api import sync_playwright
URL=sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:4173/'
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox']);page=b.new_page(viewport={'width':1440,'height':1000});errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(URL+'salon.html',wait_until='networkidle');page.wait_for_selector('#loading',state='hidden')
 assert page.locator('aside,.salon-layout,.toolbox').count()==0
 assert page.locator('#scene [data-tool]').count()==8
 assert page.locator('#tool').is_hidden()
 def point(x,y):
  rect=page.locator('#scene').bounding_box();return rect['x']+x*rect['width']/800,rect['y']+y*rect['width']/800
 tool=page.locator('[data-tool="water"]').bounding_box();page.mouse.move(tool['x']+tool['width']/2,tool['y']+tool['height']/2);page.mouse.down();page.wait_for_timeout(100);page.mouse.move(*point(400,100),steps=10);page.mouse.up()
 assert page.locator('[data-tool="water"]').get_attribute('aria-pressed')=='true'
 assert page.locator('#tool').is_visible()
 assert page.locator('#care-progress').evaluate('(e)=>e.value')>0
 page.keyboard.press('Escape');assert page.locator('#tool').is_hidden()
 assert page.locator('[data-tool="water"]').get_attribute('aria-pressed')=='false'
 # Picking shampoo fixes both the inventory and held pump behind the bottle.
 page.locator('[data-tool="shampoo"]').click()
 assert page.locator('#pump').is_visible()
 assert page.locator('#pump').evaluate('(e)=>Number(getComputedStyle(e).zIndex)')<page.locator('#tool-image').evaluate('(e)=>Number(getComputedStyle(e).zIndex)')
 assert page.locator('.inventory-pump').evaluate('(e)=>Number(getComputedStyle(e).zIndex)')<page.locator('.inventory-bottle').evaluate('(e)=>Number(getComputedStyle(e).zIndex)')
 # A tool can be carried back to its own place and released.
 page.mouse.move(*point(400,140));page.mouse.down();page.wait_for_timeout(100)
 shelf=page.locator('[data-tool="shampoo"]').bounding_box();page.mouse.move(shelf['x']+shelf['width']/2,shelf['y']+shelf['height']/2,steps=10);page.mouse.up()
 assert page.locator('#tool').is_hidden()
 page.locator('#show-request').click();assert page.locator('#request-panel').is_visible();page.keyboard.press('Escape');assert page.locator('#request-panel').is_hidden()
 page.locator('#show-album').click();assert page.locator('#album-panel').is_visible();page.locator('[data-close="album-panel"]').first.click()
 page.set_viewport_size({'width':390,'height':844});page.wait_for_timeout(150)
 assert page.evaluate('document.documentElement.scrollWidth<=innerWidth && document.documentElement.scrollHeight<=innerHeight')
 page.screenshot(path='/tmp/popa-salon-pickup-mobile.png')
 assert not errors,errors
 # Actual touch pickup, movement and return on the portrait layout.
 context=b.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True);touch=context.new_page();touch.goto(URL+'salon.html',wait_until='networkidle');touch.wait_for_selector('#loading',state='hidden')
 item=touch.locator('[data-tool="water"]').bounding_box();rect=touch.locator('#scene').bounding_box()
 cdp=context.new_cdp_session(touch)
 start={'x':item['x']+item['width']/2,'y':item['y']+item['height']/2}
 target={'x':rect['x']+280*rect['width']/560,'y':rect['y']+170*rect['width']/560}
 cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[start]});touch.wait_for_timeout(100)
 for i in range(1,9):
  cdp.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':start['x']+(target['x']-start['x'])*i/8,'y':start['y']+(target['y']-start['y'])*i/8}]});touch.wait_for_timeout(20)
 cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
 assert touch.locator('#care-progress').evaluate('(e)=>e.value')>0
 assert touch.locator('[data-tool="water"]').get_attribute('aria-pressed')=='true'
 context.close();b.close();print('PASS: all tools live in scene, mouse/touch drag pickup, return, pump layering, in-world request/album, no page overflow')
