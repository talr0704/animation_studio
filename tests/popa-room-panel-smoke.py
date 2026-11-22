"""Movable room editor, no floating labels or rod, and autosave without downloads."""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':1280,'height':1000});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://localhost:4205/game.html',wait_until='networkidle');page.wait_for_selector('#loading',state='hidden')
 assert page.locator('[data-furniture="window-rod"]').count()==0
 assert page.locator('.room-item>span').count()==0
 assert not page.locator('#rug-price').is_visible()
 page.locator('#edit-room').click();panel=page.locator('.room-editor');box=panel.bounding_box();handle=page.locator('#room-edit-move').bounding_box()
 page.mouse.move(handle['x']+30,handle['y']+10);page.mouse.down();page.mouse.move(handle['x']-450,handle['y']+30);page.mouse.up()
 moved=panel.bounding_box();assert moved['x']<box['x']-400
 page.locator('#room-edit-move').focus();page.keyboard.press('ArrowLeft');assert panel.bounding_box()['x']<moved['x']
 page.select_option('#room-edit-item','window-curtain-left');page.locator('#room-edit-x').fill('123');page.locator('#room-edit-x').press('Tab');page.locator('#room-edit-save').click()
 page.reload(wait_until='networkidle');page.wait_for_selector('#loading',state='hidden');page.locator('#edit-room').click();page.select_option('#room-edit-item','window-curtain-left');assert page.input_value('#room-edit-x')=='123'
 assert 'אין צורך' in page.locator('#room-edit-status').inner_text() or 'אוטומטית' in page.locator('#room-edit-status').inner_text()
 page.set_viewport_size({'width':390,'height':844});page.wait_for_timeout(100);handle=page.locator('#room-edit-move').bounding_box();page.mouse.move(handle['x']+30,handle['y']+10);page.mouse.down();page.mouse.move(20,100);page.mouse.up();box=panel.bounding_box();assert box['x']>=0 and box['x']+box['width']<=391 and box['y']>=52
 assert not errors,errors
 b.close()
print('PASS draggable panel, mobile bounds, no room labels/rod and autosave without export')
