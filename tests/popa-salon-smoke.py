"""Spatial care, manual cuts, creative scoring, album, unlocks, rewards and touch."""
import sys
from playwright.sync_api import sync_playwright
URL=sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:4173/'
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox']);page=b.new_page(viewport={'width':1440,'height':1100});errors=[];bad=[]
 page.on('pageerror',lambda e:errors.append(str(e)));page.on('response',lambda r:bad.append(r.url) if r.status>=400 else None)
 page.add_init_script('if(!localStorage.getItem("popaWorldV1"))localStorage.setItem("popaWorldV1",JSON.stringify({coins:7,best:100,rounds:2,rug:true}))')
 page.goto(URL+'salon.html',wait_until='networkidle');page.wait_for_selector('#loading',state='hidden')
 assert page.locator('#request-preview img').count()==7
 assert page.locator('[data-tool="bow"]').is_disabled();assert page.locator('[data-tool="brush"]').is_disabled()
 def choose(name):
  button=page.locator(f'[data-tool="{name}"]')
  if button.get_attribute('aria-pressed')!='true':button.click()
  page.locator('#stage').focus()
 def treat(name,label):
  choose(name)
  for _ in range(100):
   if label not in page.locator('#steps li.current').inner_text():return
   page.keyboard.press('Space')
  raise AssertionError('Care phase did not complete: '+label)
 def click_scene(x,y):
  page.locator('#stage').scroll_into_view_if_needed();rect=page.locator('#scene').bounding_box();page.mouse.click(rect['x']+x*rect['width']/800,rect['y']+y*rect['width']/800)
 # Same-position clicks saturate locally; they do not replace full-area care.
 choose('water')
 for _ in range(12):click_scene(400,100)
 assert 'הרטבה' in page.locator('#steps li.current').inner_text()
 treat('water','הרטבה');treat('shampoo','סיבון')
 before=page.locator('[data-care="foam"]').evaluate_all('(els)=>els.map(e=>Number(e.style.opacity))')
 assert max(before)>.8
 choose('water');click_scene(330,100)
 after=page.locator('[data-care="foam"]').evaluate_all('(els)=>els.map(e=>Number(e.style.opacity))')
 assert after[0]<before[0] and after[-1]==before[-1] and max(after)>.5
 treat('water','שטיפה');treat('dryer','ייבוש')
 original=page.locator('[data-hair="bangs"]').evaluate('(e)=>[e.style.left,e.style.top,e.style.transformOrigin]')
 choose('scissors');click_scene(545,270)
 assert page.locator('[data-hair="bangs"]').get_attribute('src').endswith('bangs_medium.png')
 assert page.locator('[data-hair="side_right"]').get_attribute('src').endswith('side_right_long.png')
 page.locator('#stage').focus();page.keyboard.press('Space')
 assert original==page.locator('[data-hair="bangs"]').evaluate('(e)=>[e.style.left,e.style.top,e.style.transformOrigin]')
 page.locator('#scissors').evaluate('(e)=>e.getAnimations({subtree:true}).forEach(a=>{a.pause();a.currentTime=190})')
 distances=page.locator('#scissors').evaluate('''e=>{const a=e.querySelector('.a').getBoundingClientRect(),b=e.querySelector('.b').getBoundingClientRect(),c=e.querySelector('.bolt').getBoundingClientRect();return[Math.hypot(a.x-b.x,a.y-b.y),Math.hypot(a.x-c.x-c.width/2,a.y-c.y-c.height/2)]}''')
 assert all(v<.01 for v in distances)
 for zone in ['side_left','side_right','back_left','back_right']:
  page.locator(f'[data-zone="{zone}"]').click();choose('scissors');page.keyboard.press('Space')
 assert 'תספורת' in page.locator('#steps li.current').inner_text()
 page.locator('#finish-cut').click();treat('comb','סירוק');choose('flower');page.keyboard.press('Space')
 assert page.locator('#finish').is_enabled();page.locator('#finish').click();page.wait_for_selector('#result',state='visible')
 assert page.locator('#before-preview img').count()==6 and page.locator('#after-preview img').count()==7
 assert page.locator('#score-breakdown>div').count()==3
 assert page.locator('.album-card').count()==1
 entry=page.evaluate('JSON.parse(localStorage.getItem("popaSalonAlbumV1")).entries[0]')
 assert int(page.locator('#coins').inner_text())==7+entry['reward']
 state=page.evaluate('JSON.parse(localStorage.getItem("popaWorldV1"))');assert state['rug'] and state['best']==100
 assert page.locator('[data-tool="bow"]').is_enabled()
 page.screenshot(path='/tmp/popa-salon-result-v2.png',full_page=True)
 # Two creative variants also finish and unlock a tool and a furniture reward.
 for visit in [2,3]:
  page.locator('#next').click()
  for name,label in [('water','הרטבה'),('shampoo','סיבון'),('water','שטיפה'),('dryer','ייבוש')]:treat(name,label)
  page.locator('#finish-cut').click();treat('comb','סירוק');choose('bow');page.keyboard.press('Space')
  page.locator('#finish').click();page.wait_for_selector('#result',state='visible')
  assert page.locator('.album-card').count()==visit
 assert page.locator('[data-tool="brush"]').is_enabled()
 coins=page.locator('#coins').inner_text();page.reload(wait_until='networkidle');page.wait_for_selector('#loading',state='hidden')
 assert page.locator('#coins').inner_text()==coins and page.locator('.album-card').count()==3
 page.set_viewport_size({'width':375,'height':900});page.wait_for_timeout(250)
 assert not page.evaluate('document.documentElement.scrollWidth>innerWidth')
 page.goto(URL+'game.html',wait_until='networkidle');page.wait_for_selector('#loading',state='hidden')
 assert page.locator('#salon-mirror').is_visible()
 assert not errors and not bad,(errors,bad)
 mobile=b.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True);touch=mobile.new_page();touch.goto(URL+'salon.html',wait_until='networkidle');touch.wait_for_selector('#loading',state='hidden')
 touch.locator('[data-tool="water"]').tap();touch.locator('#stage').scroll_into_view_if_needed();rect=touch.locator('#scene').bounding_box();touch.touchscreen.tap(rect['x']+400*rect['width']/800,rect['y']+100*rect['width']/800)
 assert '%' in touch.locator('#steps li.current').inner_text()
 mobile.close();b.close();print('PASS: local foam/rinse, spatial progress, manual-only cuts, anchors/scissor pivot, creative scoring, reveal, persisted album, 3 unlocks, shared wallet, mobile/touch')
