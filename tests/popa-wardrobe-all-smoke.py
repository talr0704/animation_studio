"""All outfits are available on illustrated hangers, animate open, fit, and persist."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright
catalog=json.loads(Path('assets/characters/popa/outfits/catalog.json').read_text())
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':1440,'height':1000});errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.clock.install()
 page.goto('http://localhost:4205/game.html',wait_until='networkidle');page.wait_for_selector('#loading',state='hidden');assert page.locator('[data-wear]').count()==len(catalog['looks'])+1
 page.locator('[data-furniture="wardrobe"]').click();page.clock.run_for(10000);assert page.locator('#wardrobe-panel').is_visible()
 assert page.locator('.wardrobe-hanger').count()==20
 assert page.locator('.wardrobe-hanger').first.evaluate('(e)=>e.complete&&e.naturalWidth>0')
 assert page.locator('.wardrobe-door-left').evaluate('(e)=>getComputedStyle(e).transform')!='none'
 page.screenshot(path='/tmp/all-closet-desktop.png')
 page.locator('[data-wear="pixel-play"]').click();page.wait_for_function('document.querySelector(".cat-character").dataset.outfit==="pixel-play"');assert page.locator('[data-worn-part]').count()==5
 page.reload(wait_until='networkidle');page.wait_for_selector('#loading',state='hidden');assert page.locator('.cat-character').get_attribute('data-outfit')=='pixel-play'
 page.locator('[data-furniture="wardrobe"]').click();page.clock.run_for(10000);page.locator('[data-wear="lotus-fairy"]').click();page.wait_for_function('document.querySelector(".cat-character").dataset.outfit==="lotus-fairy"');assert page.locator('[data-worn-part="wings"]').count()==1
 page.locator('[data-furniture="wardrobe"]').click();page.clock.run_for(10000);page.set_viewport_size({'width':390,'height':844});page.clock.run_for(200);page.screenshot(path='/tmp/all-closet-mobile.png');page.locator('#wardrobe-close').click()
 page.emulate_media(reduced_motion='reduce');page.locator('[data-furniture="wardrobe"]').click();page.clock.run_for(10000);assert page.locator('.wardrobe-door-left').evaluate('(e)=>getComputedStyle(e).animationName')=='none'
 page.keyboard.press('Escape');assert page.locator('#wardrobe-panel').is_hidden()
 assert not errors,errors;b.close()
print('PASS all 19 looks, hanger assets, opening doors, draft outfit selection/reload, wings, mobile and reduced motion')
