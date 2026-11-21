"""Room keyboard movement, facing, floor limits, mouse and blur release."""
import sys
from playwright.sync_api import sync_playwright
URL=sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:4208/'
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':1280,'height':1000});errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.clock.install();page.goto(URL+'game.html',wait_until='networkidle');page.wait_for_selector('#loading',state='hidden')
 assert page.locator('[data-furniture]').count()==8
 assert page.locator('[data-furniture] img').evaluate_all('(els)=>els.every(e=>e.complete&&e.naturalWidth>0)')
 def pos():return page.locator('#player').evaluate('(e)=>({x:parseFloat(e.style.left),bottom:parseFloat(e.style.bottom),facing:e.dataset.facing})')
 start=pos();page.keyboard.down('ArrowLeft');page.clock.run_for(700);left=pos();assert left['x']<start['x'] and left['facing']=='left';assert page.locator('.player>.popa-browser').evaluate('(e)=>new DOMMatrix(getComputedStyle(e).transform).a')==-1
 page.keyboard.up('ArrowLeft');stopped=pos();page.clock.run_for(400);assert abs(pos()['x']-stopped['x'])<.01
 page.keyboard.down('ArrowRight');page.clock.run_for(700);page.keyboard.up('ArrowRight');assert pos()['x']>left['x'] and pos()['facing']=='right'
 page.keyboard.down('ArrowUp');page.clock.run_for(800);page.keyboard.up('ArrowUp');up=pos();assert up['bottom']>start['bottom'];page.keyboard.down('ArrowDown');page.clock.run_for(800);page.keyboard.up('ArrowDown');assert pos()['bottom']<up['bottom']
 page.keyboard.down('ArrowLeft');page.clock.run_for(250);page.evaluate('window.dispatchEvent(new Event("blur"))');stopped=pos();page.clock.run_for(500);assert abs(pos()['x']-stopped['x'])<.01;page.keyboard.up('ArrowLeft')
 r=page.locator('.world').bounding_box();page.mouse.click(r['x']+r['width']*.78,r['y']+r['height']*.9);page.clock.run_for(1700);assert pos()['facing']=='right'
 page.keyboard.down('ArrowRight');page.clock.run_for(12000);page.keyboard.up('ArrowRight');player=page.locator('#player').bounding_box();assert player['x']>=r['x']-1 and player['x']+player['width']<=r['x']+r['width']+1
 page.set_viewport_size({'width':390,'height':844});page.clock.run_for(200);r=page.locator('.world').bounding_box();
 for item in page.locator('[data-furniture]').all():
  box=item.bounding_box();assert box['x']>=r['x']-1 and box['x']+box['width']<=r['x']+r['width']+1 and box['y']>=r['y']-1 and box['y']+box['height']<=r['y']+r['height']+1
 player=page.locator('#player').bounding_box();assert player['x']>=r['x']-1 and player['x']+player['width']<=r['x']+r['width']+1
 page.locator('#garden-tab').click();page.locator('#dialog-main').click();assert page.locator('#player').get_attribute('data-facing')=='right';before=pos()['x'];page.keyboard.down('ArrowLeft');page.clock.run_for(500);page.keyboard.up('ArrowLeft');assert pos()['x']<before;page.locator('#pause').click();page.locator('#dialog-secondary').click()
 assert not errors,errors
 page.set_viewport_size({'width':390,'height':844});page.clock.run_for(100);page.keyboard.down('ArrowLeft');page.clock.run_for(15000);page.keyboard.up('ArrowLeft');r=page.locator('.world').bounding_box();
 for item in page.locator('[data-furniture]').all():
  box=item.bounding_box();assert box['x']>=r['x']-1 and box['x']+box['width']<=r['x']+r['width']+1 and box['y']>=r['y']-1 and box['y']+box['height']<=r['y']+r['height']+1
 player=page.locator('#player').bounding_box();assert player['x']>=r['x']-1
 b.close();print('PASS: facing follows room direction, four arrows, release/blur stop, click walk, desktop/mobile limits, garden keyboard preserved')
