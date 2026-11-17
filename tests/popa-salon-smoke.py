"""Exercise the uploaded salon assets, connected scissors, care sequence and rewards."""
import sys
from playwright.sync_api import sync_playwright
URL=sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:4173/'
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox']);page=b.new_page(viewport={'width':1440,'height':1100});errors=[];bad=[]
 page.on('pageerror',lambda e:errors.append(str(e)));page.on('response',lambda r:bad.append(r.url) if r.status>=400 else None)
 page.add_init_script('if(!localStorage.getItem("popaWorldV1"))localStorage.setItem("popaWorldV1",JSON.stringify({coins:7,best:100,rounds:2,rug:true}))')
 page.goto(URL+'salon.html',wait_until='networkidle');page.wait_for_selector('#loading',state='hidden')
 assert page.locator('#finish').is_disabled()
 def tool(name,strokes):
  page.locator(f'[data-tool="{name}"]').click();page.locator('#stage').focus()
  for _ in range(strokes):page.keyboard.press('Space')
 # The wrong tool cannot cut hair before washing.
 tool('scissors',1);assert page.locator('[data-hair="bangs"]').get_attribute('src').endswith('bangs_long.png')
 page.reload(wait_until='networkidle');page.wait_for_selector('#loading',state='hidden')
 for name in ['water','shampoo','water','dryer']:tool(name,3)
 before=page.locator('[data-hair="bangs"]').evaluate('(e)=>[e.style.left,e.style.top,e.style.transformOrigin]')
 tool('scissors',2)
 assert page.locator('[data-hair="bangs"]').get_attribute('src').endswith('bangs_short.png')
 assert before==page.locator('[data-hair="bangs"]').evaluate('(e)=>[e.style.left,e.style.top,e.style.transformOrigin]')
 page.locator('#scissors').evaluate('(e)=>e.getAnimations({subtree:true}).forEach(a=>{a.pause();a.currentTime=190})')
 points=page.locator('#scissors').evaluate('''e=>{
 const a=e.querySelector('.a').getBoundingClientRect(),b=e.querySelector('.b').getBoundingClientRect(),bolt=e.querySelector('.bolt').getBoundingClientRect();
 return [Math.hypot(a.x-b.x,a.y-b.y),Math.hypot(a.x-bolt.x-bolt.width/2,a.y-bolt.y-bolt.height/2)];}''')
 assert all(distance<.01 for distance in points),points
 for zone in ['side_left','side_right','back_left','back_right']:
  page.locator(f'[data-zone="{zone}"]').click();tool('scissors',1)
 tool('comb',3);tool('flower',1)
 assert page.locator('#accessory').is_visible()
 assert page.locator('#finish').is_enabled()
 page.locator('#finish').click();assert page.locator('#result').is_visible()
 assert page.locator('#coins').inner_text()=='25'
 state=page.evaluate('JSON.parse(localStorage.getItem("popaWorldV1"))');assert state['rug'] and state['best']==100 and state['rounds']==2
 page.locator('#next').click();assert page.locator('#finish').is_disabled();assert page.locator('#coins').inner_text()=='25'
 assert page.locator('#request-title').inner_text()=='קצר וקופצני'
 page.reload(wait_until='networkidle');page.wait_for_selector('#loading',state='hidden');assert page.locator('#coins').inner_text()=='25'
 page.set_viewport_size({'width':375,'height':900});page.wait_for_timeout(200)
 assert not page.evaluate('document.documentElement.scrollWidth>innerWidth')
 assert not errors and not bad,(errors,bad)
 mobile=b.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True);touch=mobile.new_page();touch.goto(URL+'salon.html',wait_until='networkidle');touch.wait_for_selector('#loading',state='hidden')
 touch.locator('[data-tool="water"]').tap();box=touch.locator('#stage').bounding_box();touch.touchscreen.tap(box['x']+box['width']*.5,box['y']+box['height']*.3)
 assert '1/3' in touch.locator('.care li.current').inner_text()
 mobile.close();b.close();print('PASS: original PNG assets, full care/cut/style order, stable hair anchors, shared scissor pivot, once-only reward, wallet persistence, mobile/touch')
