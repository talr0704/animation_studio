"""First NPC conversation is reached by walking, supports choices, and survives reload."""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':1440,'height':1000});page.clock.install();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://localhost:4205/game.html',wait_until='networkidle');page.wait_for_selector('#loading',state='hidden')
 def talk(button='#milli-npc'):
  page.locator(button).click();assert page.locator('#story-dialog').is_hidden()
  for _ in range(100):
   page.clock.run_for(100)
   if page.locator('#story-dialog').is_visible():return
  raise AssertionError('Popa did not reach Milli')
 def state():return page.evaluate('JSON.parse(localStorage.getItem("popaProgressV1"))')
 talk();assert page.locator('#story-dialog').get_attribute('data-node')=='greeting';assert state()['story']['npcs']['milli']['met'];assert state()['story']['firstCake']['status']=='not-started'
 feet=page.locator('#player').evaluate('(e)=>[e.style.left,e.style.bottom]');page.keyboard.press('ArrowLeft');page.clock.run_for(300);assert page.locator('#player').evaluate('(e)=>[e.style.left,e.style.bottom]')==feet
 page.get_by_role('button',name='נדבר אחר כך',exact=True).click();assert page.locator('#story-dialog').is_hidden();assert state()['story']['firstCake']['status']=='not-started'
 talk();assert page.locator('#story-dialog').get_attribute('data-node')=='returning'
 page.get_by_role('button',name='כן, ספר לי',exact=True).click();page.get_by_role('button',name='מה נצטרך לעשות?',exact=True).click();assert page.locator('#story-dialog').get_attribute('data-node')=='plan'
 page.get_by_role('button',name='אני מצטרפת!',exact=True).click();assert state()['story']['firstCake']['step']=='grow-strawberries';assert state()['wallet']['coins']==0;assert state()['inventory']=={}
 assert 'לגדל תותים לעוגה' in page.locator('#first-quest').text_content();page.get_by_role('button',name='יוצאים לדרך',exact=True).click()
 receipts=state()['receipts'];page.reload(wait_until='networkidle');page.wait_for_selector('#loading',state='hidden');assert state()['story']['firstCake']['step']=='grow-strawberries'
 talk('#first-quest');assert page.locator('#story-dialog').get_attribute('data-node')=='growing';assert state()['receipts']==receipts
 page.locator('#story-close').focus();page.keyboard.press('Shift+Tab');assert page.locator('#story-choices button').last.evaluate('(e)=>e===document.activeElement')
 page.keyboard.press('Escape');assert page.locator('#story-dialog').is_hidden();assert not page.locator('.world-paths').evaluate('(e)=>e.inert')
 page.locator('#garden-tab').click();assert page.locator('#milli-npc').is_hidden();assert page.locator('#first-quest').is_hidden();page.locator('#dialog-secondary').click();assert page.locator('#milli-npc').is_visible()
 page.locator('#edit-room').click();assert page.locator('#milli-npc').is_hidden();page.locator('#room-edit-done').click();assert page.locator('#milli-npc').is_visible()
 for width,height in [(390,844),(844,390)]:
  page.set_viewport_size({'width':width,'height':height});page.clock.run_for(100);talk()
  box=page.locator('.story-conversation').bounding_box();assert box['x']>=0 and box['x']+box['width']<=width+1 and box['y']>=0 and box['y']+box['height']<=height+1
  page.keyboard.press('Escape')
 assert not errors,errors
 b.close()
print('PASS approach, postponed invitation, dialogue branches, atomic quest start, reload, repeat visit, focus/keyboard, mobile and garden/editor isolation')
