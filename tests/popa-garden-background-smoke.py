from farm_pointer import water_first_plot,focus_plot,leave_garden
"""The uploaded garden fills the portrait viewport and all three plots remain playable."""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':390,'height':844});page.clock.install();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://localhost:4205/game.html',wait_until='networkidle');page.wait_for_selector('#loading',state='hidden')
 page.evaluate('''async()=>{const {progressStore}=await import('./game/progress/store.js?v=2');progressStore.commit('test-invite',{npc:{id:'milli',dialogue:'first-meeting'},quest:{action:'accept-invitation'}});}''')
 page.locator('#garden-tab').click();image=page.locator('#orchard>.scene-backdrop');assert image.get_attribute('src').endswith('background/sunny-garden.png');assert image.evaluate('(e)=>e.complete&&e.naturalWidth===1672')
 assert image.evaluate('(e)=>getComputedStyle(e).objectFit')=='cover'
 for i in range(3):
  focus_plot(page,i);plot=page.locator('.farm-plot').nth(i);assert plot.is_visible();r=plot.bounding_box();assert r['x']>=-1 and r['x']+r['width']<=391
  plot.click()
  if i==0:water_first_plot(page)
  else:plot.click()
  assert plot.is_disabled()
 page.clock.run_for(21000)
 for i in range(3):focus_plot(page,i);page.locator('.farm-plot').nth(i).click()
 assert page.evaluate('JSON.parse(localStorage.getItem("popaProgressV1")).inventory.strawberry')==3
 for w,h in [(1440,1000),(844,390)]:
  page.set_viewport_size({'width':w,'height':h});page.clock.run_for(50);page.evaluate('window.dispatchEvent(new Event("resize"))');assert page.locator('.farm-plot:visible').count()==3
 assert not errors,errors;b.close()
print('PASS uploaded background, portrait camera and three real harvests, all plots visible in desktop/landscape')
