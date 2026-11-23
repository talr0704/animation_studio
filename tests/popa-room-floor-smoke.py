"""Feet stay on wood floor, avoid standing furniture, and follow edited placements."""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':1440,'height':1000});errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.clock.install()
 page.goto('http://localhost:4205/game.html',wait_until='networkidle');page.wait_for_selector('#loading',state='hidden')
 page.evaluate('''()=>{window.floorSamples=[];function sample(){const world=document.querySelector('.world'),actor=document.querySelector('#player'),root=actor.firstElementChild,scale=parseFloat(root.style.width)/440,feet={x:parseFloat(actor.style.left)/100*world.clientWidth,y:world.clientHeight-parseFloat(actor.style.bottom)-24*scale};const blockers=['sofa','wardrobe','side-table'].map(id=>{const e=document.querySelector(`[data-furniture="${id}"]`),r=32*scale;return {left:e.offsetLeft+e.offsetWidth*.12-r,right:e.offsetLeft+e.offsetWidth*.88+r,top:e.offsetTop+e.offsetHeight*.82-5,bottom:e.offsetTop+e.offsetHeight*.98+5}});window.floorSamples.push({feet,top:world.clientHeight*.735+11,collision:blockers.some(r=>feet.x>r.left+.5&&feet.x<r.right-.5&&feet.y>r.top+.5&&feet.y<r.bottom-.5)});requestAnimationFrame(sample)}requestAnimationFrame(sample)}''')
 for key in ['ArrowUp','ArrowRight','ArrowUp','ArrowLeft','ArrowDown']:
  page.keyboard.down(key);page.clock.run_for(5000);page.keyboard.up(key)
 samples=page.evaluate('window.floorSamples');assert all(s['feet']['y']>=s['top'] for s in samples);assert not any(s['collision'] for s in samples)
 # Wall click cannot move Popa onto the wall.
 before=page.locator('#player').evaluate('(e)=>[e.style.left,e.style.bottom]');box=page.locator('.world').bounding_box();page.locator('#room').dispatch_event('pointerdown',{'clientX':box['x']+box['width']*.5,'clientY':box['y']+box['height']*.3});page.clock.run_for(1000);assert page.locator('#player').evaluate('(e)=>[e.style.left,e.style.bottom]')==before
 page.locator('[data-furniture="wardrobe"]').click();page.clock.run_for(10000);assert page.locator('#wardrobe-panel').is_visible();page.locator('#wardrobe-close').click()
 page.locator('#edit-room').click();page.select_option('#room-edit-item','sofa');page.locator('#room-edit-y').fill('10');page.locator('#room-edit-y').press('Tab');assert float(page.input_value('#room-edit-y'))>300
 page.locator('#room-edit-save').click();page.set_viewport_size({'width':390,'height':844});page.clock.run_for(200)
 for key in ['ArrowUp','ArrowRight','ArrowLeft']:
  page.keyboard.down(key);page.clock.run_for(4000);page.keyboard.up(key)
 assert all(s['feet']['y']>=s['top'] for s in page.evaluate('window.floorSamples'));assert not any(s['collision'] for s in page.evaluate('window.floorSamples'))
 page.screenshot(path='/tmp/floor-room-mobile.png');assert not errors,errors;b.close()
print('PASS floor edge, furniture collision, wall click, wardrobe approach, editor grounding and responsive bounds')
