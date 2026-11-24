"""Wardrobe overlay reuses decoded room artwork, including recovery from an initial image failure."""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':1440,'height':1000});requests=[];errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 def frame_request(route):
  requests.append(route.request.url)
  if len(requests)==1:route.abort()
  else:route.continue_()
 page.route('**/cabinet/images/frame.png*',frame_request)
 page.goto('http://localhost:4205/game.html',wait_until='networkidle');page.wait_for_selector('#loading',state='hidden')
 assert len(requests)>=2
 assert page.locator('.wardrobe-frame').evaluate('(e)=>e.complete&&e.naturalWidth===405')
 page.locator('[data-furniture="wardrobe"]').click();page.wait_for_selector('#wardrobe-panel',state='visible')
 assert page.locator('.wardrobe-frame').is_visible()
 assert page.locator('.wardrobe-frame').get_attribute('src')==page.locator('[data-furniture="wardrobe"] [data-prop-image="frame"]').get_attribute('src')
 assert not errors,errors
 b.close()
print('PASS wardrobe frame recovers from initial failure and uses decoded room artwork')
