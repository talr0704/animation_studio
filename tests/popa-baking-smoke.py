from farm_pointer import water_first_plot
"""Real harvests -> kitchen with Momo -> persistent ingredients/timer -> one cake."""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':1440,'height':1000});page.clock.install();errors=[];failed=[];page.on('pageerror',lambda e:errors.append(str(e)));page.on('response',lambda r:failed.append(r.url) if r.status>=400 else None)
 base='http://localhost:4205/'
 page.goto(base+'game.html',wait_until='networkidle');page.wait_for_selector('#loading',state='hidden');page.evaluate('''async()=>{const {progressStore}=await import('./game/progress/store.js?v=3');progressStore.commit('test-invite',{npc:{id:'milli',dialogue:'first-meeting'},quest:{action:'accept-invitation'}});}''');page.locator('#garden-tab').click()
 for i,plot in enumerate(page.locator('.farm-plot').all()):
  plot.click()
  if i==0:water_first_plot(page)
  else:plot.click()
 page.clock.run_for(21000)
 for plot in page.locator('.farm-plot').all():plot.click()
 page.locator('#farm-kitchen').click();page.wait_for_selector('body[data-ready=true]');assert page.locator('#momo [data-character=momo]').count()==1
 def state():return page.evaluate('JSON.parse(localStorage.getItem("popaProgressV1"))')
 page.locator('#basket').click();assert state()['baking']['strawberries']==1;assert state()['inventory']['strawberry']==2
 page.reload(wait_until='networkidle');page.wait_for_selector('body[data-ready=true]');assert state()['baking']['strawberries']==1
 page.locator('#basket').drag_to(page.locator('#bowl'));assert state()['baking']['strawberries']==2
 page.locator('#basket').click();assert state()['baking']['strawberries']==3
 for ingredient in ['flour','egg','milk']:page.locator('#'+ingredient).click()
 for _ in range(3):page.locator('#bowl').click()
 assert page.locator('#oven').is_enabled();page.locator('#oven').click();ready=state()['baking']['readyAt'];page.reload(wait_until='networkidle');page.wait_for_selector('body[data-ready=true]');assert state()['baking']['readyAt']==ready
 page.clock.run_for(8100);page.locator('#oven').click();page.locator('#finish').click();page.locator('#finish').click()
 assert state()['inventory']=={'strawberry-cake':1};assert state()['story']['firstCake']['step']=='deliver-cake';assert not state()['story']['npcs']['bonnie']['met'];assert page.locator('#finish').is_disabled()
 page.screenshot(path='/tmp/popa-baking-packed.png')
 page.reload(wait_until='networkidle');page.wait_for_selector('body[data-ready=true]');assert state()['inventory']=={'strawberry-cake':1}
 for w,h in [(390,844),(844,390)]:
  page.set_viewport_size({'width':w,'height':h});page.evaluate('window.dispatchEvent(new Event("resize"))');page.screenshot(path=f'/tmp/popa-baking-{w}.png');assert page.evaluate('document.documentElement.scrollWidth')<=w
  if h<520:assert page.locator('footer').bounding_box()['y']+page.locator('footer').bounding_box()['height']<=h+1
 page.locator('#return').click();page.wait_for_selector('#loading',state='hidden');assert 'למסור את העוגה' in page.locator('#first-quest').text_content()
 assert not errors,errors;assert not failed,failed;b.close()
print('PASS real crop-to-kitchen journey, click/drag ingredients, reload, mixing, persistent oven, decoration and single packaged cake with Momo')
