"""Viewport-sized destinations, illustrated navigation and optional studio controls."""
import sys
from playwright.sync_api import sync_playwright
URL=sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:4199/'
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 page=b.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 for width,height in [(1440,1000),(390,844),(844,390)]:
  page.set_viewport_size({'width':width,'height':height})
  for route in ['game.html','salon.html','index.html']:
   page.goto(URL+route,wait_until='networkidle')
   if route!='index.html':page.wait_for_selector('#loading',state='hidden')
   assert page.evaluate('document.documentElement.scrollHeight<=innerHeight+1 && document.documentElement.scrollWidth<=innerWidth+1'),(route,width)
   if route=='game.html':
    rect=page.locator('.world').bounding_box();assert abs(rect['y']+rect['height']-height)<2
    page.locator('#garden-tab').click();page.locator('#dialog-main').click();assert page.locator('#hud').is_visible()
    page.locator('#pause').click();page.locator('#dialog-secondary').click();assert page.locator('#room').is_visible()
    page.locator('.salon-link').click();page.wait_for_selector('#loading',state='hidden');assert 'salon.html' in page.url
   elif route=='index.html':
    assert not page.locator('.animation-editor').is_visible()
    page.locator('.studio-controls summary').click();page.locator('[data-action="wave"]').click()
    assert page.evaluate('document.documentElement.scrollHeight<=innerHeight+1')
 page.goto(URL+'index.html?edit=1',wait_until='networkidle');assert page.locator('.animation-editor').is_visible()
 assert not errors,errors
 b.close();print('PASS: all main screens fit desktop, portrait and landscape; illustrated routes, garden pause/home, studio controls and editor access')
