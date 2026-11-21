"""Browser journey through room, game, rewards and the shop."""
import sys
from playwright.sync_api import sync_playwright
URL=sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:4173/'
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 page=b.new_page(viewport={'width':1280,'height':1100});errors=[];bad=[]
 page.on('pageerror',lambda e:errors.append(str(e)));page.on('response',lambda r:bad.append(r.url) if r.status>=400 else None)
 page.add_init_script('Math.random=()=>.5')
 page.clock.install()
 page.goto(URL+'game.html',wait_until='networkidle');page.wait_for_selector('#loading',state='hidden')
 assert page.locator('#coins').inner_text()=='0'
 page.locator('#buy-rug').click()
 for _ in range(80):
  page.clock.run_for(100)
  if '12' in page.locator('#toast').inner_text():break
 assert '12' in page.locator('#toast').inner_text()
 assert not page.locator('#buy-rug').is_disabled()
 room=page.locator('.world').bounding_box();page.mouse.click(room['x']+room['width']*.78,room['y']+room['height']*.9)
 page.clock.run_for(1800)
 assert float(page.locator('#player').evaluate('(e)=>parseFloat(e.style.left)'))>60
 page.locator('#garden-tab').click();assert page.locator('#overlay').is_visible()
 page.locator('#dialog-main').click();page.clock.run_for(8000)
 assert int(page.locator('#score').inner_text())>0
 page.locator('#pause').click();assert 'נשום' in page.locator('#dialog-title').inner_text()
 time=page.locator('#timer').inner_text();page.clock.run_for(5000);assert page.locator('#timer').inner_text()==time
 page.locator('#dialog-main').click();page.clock.run_for(39000)
 assert page.locator('#results').is_visible()
 coins=int(page.locator('#coins').inner_text());assert coins>=12
 page.clock.run_for(5000);assert int(page.locator('#coins').inner_text())==coins
 page.locator('#dialog-secondary').click();page.locator('#buy-rug').click()
 for _ in range(80):
  page.clock.run_for(100)
  if page.locator('#rug').evaluate('(e)=>e.classList.contains("upgraded")'):break
 assert page.locator('#rug').evaluate('(e)=>e.classList.contains("upgraded")')
 assert int(page.locator('#coins').inner_text())==coins-12
 assert not page.locator('#buy-rug').is_disabled()
 page.reload(wait_until='networkidle');page.wait_for_selector('#loading',state='hidden')
 assert int(page.locator('#coins').inner_text())==coins-12
 assert page.locator('#rug').evaluate('(e)=>e.classList.contains("upgraded")')
 page.set_viewport_size({'width':375,'height':900});page.clock.run_for(200)
 assert not page.evaluate('document.documentElement.scrollWidth>innerWidth')
 assert not errors and not bad,(errors,bad)
 mobile=b.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True)
 touch=mobile.new_page();touch.goto(URL+'game.html',wait_until='networkidle');touch.wait_for_selector('#loading',state='hidden')
 touch.locator('#garden-tab').tap();touch.locator('#dialog-main').tap()
 rect=touch.locator('.world').bounding_box();touch.touchscreen.tap(rect['x']+rect['width']*.8,rect['y']+rect['height']*.65)
 touch.wait_for_timeout(500)
 assert float(touch.locator('#player').evaluate('(e)=>parseFloat(e.style.left)'))>65
 touch.locator('#pause').tap();assert touch.locator('#overlay').is_visible()
 mobile.close();b.close()
 print('PASS: room walking, live catches, pause/resume, result reward once, purchase, persistence, mobile layout and touch control')
