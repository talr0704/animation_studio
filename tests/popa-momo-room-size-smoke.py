from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':1440,'height':1000});page.goto('http://localhost:4205/game.html',wait_until='networkidle');page.wait_for_selector('#loading',state='hidden')
 for w,h in [(1440,1000),(1101,611),(390,844),(844,390)]:
  page.set_viewport_size({'width':w,'height':h});page.wait_for_timeout(100)
  world=page.locator('.world').bounding_box();momo=page.locator('#milli-npc').bounding_box();feet=page.locator('#milli-npc [data-character-part="foot_left"]').bounding_box();popa=page.locator('#player .popa-browser').bounding_box()
  assert momo['width']<=popa['width']*.85,(w,momo,popa)
  assert feet['y']+feet['height']>=world['y']+world['height']*.735-5,(w,feet,world)
  page.screenshot(path=f'/tmp/momo-floor-{w}.png')
 b.close()
print('PASS smaller room-scaled Momo and feet on the floor in desktop, portrait and landscape')
