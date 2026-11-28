from playwright.sync_api import sync_playwright
from farm_pointer import water_first_plot,water_first_plot_keyboard,water_first_plot_touch,leave_garden
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':1440,'height':1000});page.clock.install();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://localhost:4205/game.html',wait_until='networkidle');page.wait_for_selector('#loading',state='hidden');page.evaluate('''async()=>{const {progressStore}=await import('./game/progress/store.js?v=3');progressStore.commit('test-invite',{npc:{id:'milli',dialogue:'first-meeting'},quest:{action:'accept-invitation'}});}''');page.locator('#garden-tab').click()
 assert page.locator('#player').is_hidden()
 first=page.locator('.farm-plot').first;first.click();assert first.is_disabled();assert first.get_attribute('data-stage')=='planted'
 def saved():return page.evaluate('JSON.parse(localStorage.getItem("popaProgressV1"))')
 assert page.locator('.farm-heading,.farm-controls,.can-caption:visible').count()==0
 assert page.locator('.topbar').is_hidden();assert page.locator('.world-paths').is_hidden();assert page.locator('main>footer').is_hidden()
 before=saved();page.locator('#farm-watering-can').click();page.clock.run_for(300);assert saved()==before
 box=page.locator('#farm-watering-can').bounding_box();page.mouse.move(box['x']+65,box['y']+45);page.mouse.down();page.mouse.move(300,120);page.clock.run_for(800);page.mouse.up();assert saved()==before
 water_first_plot(page);assert saved()['farming']['plots']['first-cake-1']['stage']=='growing';assert not saved()['inventory'];assert first.get_attribute('data-stage')=='growing'
 page.screenshot(path='/tmp/popa-watering-finished.png');leave_garden(page);assert page.locator('#player').is_visible();assert page.locator('.topbar').is_visible();page.locator('#garden-tab').click();assert page.locator('#player').is_hidden();assert saved()['farming']['plots']['first-cake-1']['stage']=='growing'
 canonical=saved();page.locator('#farm-watering-can').click();assert page.locator('#farm-watering-can').is_visible();water_first_plot(page);assert saved()==canonical;page.keyboard.press('Escape')
 page.locator('#farm-watering-can').click();water_first_plot_keyboard(page);assert saved()==canonical;assert page.locator('.strawberry-garden').get_attribute('data-practice')=='true';page.keyboard.press('Escape')
 page.set_viewport_size({'width':390,'height':844});page.evaluate('window.dispatchEvent(new Event("resize"))');page.locator('#farm-watering-can').click();water_first_plot(page);assert saved()==canonical;page.screenshot(path='/tmp/popa-watering-portrait.png')
 assert not errors,errors
 touch=b.new_page(viewport={'width':390,'height':844},has_touch=True,is_mobile=True);touch.clock.install();touch.on('pageerror',lambda e:errors.append(str(e)));touch.goto('http://localhost:4205/game.html',wait_until='networkidle');touch.wait_for_selector('#loading',state='hidden');touch.evaluate('''async()=>{const {progressStore}=await import('./game/progress/store.js?v=3');progressStore.commit('touch-invite',{npc:{id:'milli',dialogue:'first-meeting'},quest:{action:'accept-invitation'}});}''');touch.locator('#garden-tab').tap();touch.locator('.farm-plot').first.tap();water_first_plot_touch(touch);assert touch.locator('.farm-plot').first.get_attribute('data-stage')=='growing';assert not errors,errors;b.close()
print('PASS real aimed watering, no click/off-target progress, saved growth, practice without rewards, and portrait dragging')
