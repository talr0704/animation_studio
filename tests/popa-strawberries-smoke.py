"""First meeting -> real planting/watering/timed harvest -> saved next quest step."""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':1440,'height':1000});page.clock.install();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 base='http://localhost:4205/'
 def load():
  page.goto(base+'game.html',wait_until='networkidle');page.wait_for_selector('#loading',state='hidden')
 def saved():return page.evaluate('JSON.parse(localStorage.getItem("popaProgressV1"))')
 load();page.locator('#milli-npc').click()
 for _ in range(120):
  page.clock.run_for(100)
  if page.locator('#story-dialog').is_visible():break
 page.get_by_role('button',name='נעים להכיר! מה אפשר לעשות כאן?',exact=True).click();page.get_by_role('button',name='כן, בוא נכין עוגה!',exact=True).click();page.get_by_role('button',name='יוצאים לדרך',exact=True).click()
 page.locator('#garden-tab').click();assert page.locator('.strawberry-garden').is_visible();assert page.locator('#overlay').is_hidden()
 assert page.locator('#milli-npc').is_hidden();assert page.locator('.farm-plot[data-stage=empty]').count()==3
 for i in range(3):
  plot=page.locator('.farm-plot').nth(i);plot.click();assert plot.get_attribute('data-stage')=='planted';plot.click();assert plot.is_disabled()
 assert not saved()['inventory'];page.clock.run_for(8000);dates=saved()['farming']['plots'];page.screenshot(path='/tmp/popa-farm-growing.png')
 page.locator('#home-tab').click();page.locator('#garden-tab').click();assert saved()['farming']['plots']==dates
 page.reload(wait_until='networkidle');page.wait_for_selector('#loading',state='hidden');page.locator('#garden-tab').click();assert saved()['farming']['plots']==dates
 page.clock.run_for(21000);assert page.locator('.farm-plot[data-stage=ready]').count()==3
 page.screenshot(path='/tmp/popa-farm-ready.png')
 for i in range(3):page.locator('.farm-plot').nth(i).click()
 assert saved()['inventory']=={'strawberry':3};assert saved()['story']['firstCake']['step']=='bake-with-bonnie';assert saved()['wallet']['coins']==0
 assert page.locator('.farm-plot:disabled').count()==3
 page.locator('#farm-home').click();assert 'לאפות עם מומו' in page.locator('#first-quest').text_content()
 page.reload(wait_until='networkidle');page.wait_for_selector('#loading',state='hidden');assert saved()['inventory']=={'strawberry':3}
 page.locator('#garden-tab').click();page.locator('#farm-fruit-game').click();assert page.locator('#overlay').is_visible();page.locator('#dialog-main').click();page.clock.run_for(200);assert page.locator('#basket').is_visible();page.locator('#pause').click();page.locator('#dialog-secondary').click()
 for width,height in [(390,844),(844,390)]:
  page.set_viewport_size({'width':width,'height':height});page.locator('#garden-tab').click()
  for button in page.locator('.farm-plot:visible').all():
   r=button.bounding_box();assert r['x']>=0 and r['x']+r['width']<=width+1 and r['height']>=44
  page.screenshot(path=f'/tmp/popa-farm-{width}.png');page.locator('#farm-home').click()
 assert not errors,errors;b.close()
print('PASS meeting -> planting/watering -> real timer/reload -> three harvests -> atomic inventory and next quest; legacy fruit game and mobile')
