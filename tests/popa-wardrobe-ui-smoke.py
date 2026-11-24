from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':1440,'height':1000});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://localhost:4205/game.html',wait_until='networkidle');page.wait_for_selector('#loading',state='hidden')
 page.locator('[data-furniture="wardrobe"]').click();page.wait_for_selector('#wardrobe-panel',state='visible');page.wait_for_timeout(900)
 assert page.locator('#wardrobe-right').is_disabled()
 before=page.locator('.wardrobe-choices').evaluate('(e)=>e.scrollLeft')
 page.locator('#wardrobe-left').click();page.wait_for_timeout(700)
 assert page.locator('.wardrobe-choices').evaluate('(e)=>e.scrollLeft')<before
 assert page.locator('#wardrobe-right').is_enabled()
 page.locator('#wardrobe-right').click();page.wait_for_timeout(700)
 assert page.locator('.wardrobe-choices').evaluate('(e)=>e.scrollLeft')>before-10
 page.screenshot(path='/tmp/closet-new-desktop.png')
 page.set_viewport_size({'width':390,'height':844});page.wait_for_timeout(300)
 page.screenshot(path='/tmp/closet-new-mobile.png')
 assert page.locator('#wardrobe-left').bounding_box()['width']>=40
 page.locator('[data-wear="default"]').focus();page.keyboard.press('Enter');page.wait_for_selector('#wardrobe-panel',state='hidden')
 assert not errors,errors
 b.close()
print('PASS visible navigation, RTL scrolling both ways, responsive controls and outfit selection')
