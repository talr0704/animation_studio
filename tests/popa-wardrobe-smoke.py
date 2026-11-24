"""Published cloud positions, wardrobe selection, rig following and persistent outfit choice."""
import json,sys
from pathlib import Path
from playwright.sync_api import sync_playwright
URL=sys.argv[1] if len(sys.argv)>1 else 'http://localhost:4205/'
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':1440,'height':1000});errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.clock.install()
 page.goto(URL+'game.html',wait_until='networkidle');page.wait_for_selector('#loading',state='hidden')
 page.locator('[data-furniture="wardrobe"]').click();page.clock.run_for(10000);assert page.locator('#wardrobe-panel').is_visible()
 page.locator('[data-wear="cloud"]').click();page.wait_for_function('document.querySelector(".cat-character").dataset.outfit==="cloud"')
 assert page.locator('[data-worn-part]').count()==7
 for side in ['left','right']:
  assert page.locator(f'[data-sprite="{side}_arm"]').get_attribute('src').split('?')[0].endswith(f'/{side}_arm_bare.png')
 assert page.locator('[data-sprite="torso"]').evaluate('(e)=>e.style.clipPath')=='inset(0px 20% 60%)'
 assert page.locator('[data-sprite="flower"]').evaluate('(e)=>getComputedStyle(e).visibility')=='hidden'
 shirt=page.locator('[data-worn-part="pajama_body"]');sleeve=page.locator('[data-worn-part="sleeve_left"]')
 assert shirt.evaluate('(e)=>+e.closest(".worn-layer").style.zIndex')>sleeve.evaluate('(e)=>+e.closest(".worn-layer").style.zIndex')
 assert shirt.evaluate('(e)=>Math.abs(parseFloat(e.style.left)+parseFloat(e.style.transformOrigin)-223.9)<.01')
 page.reload(wait_until='networkidle');page.wait_for_selector('#loading',state='hidden');assert page.locator('.cat-character').get_attribute('data-outfit')=='cloud'
 page.keyboard.down('ArrowLeft');page.clock.run_for(300);page.keyboard.up('ArrowLeft');page.clock.run_for(30)
 # Read both transforms together; a follower can be one display frame behind WAAPI.
 assert page.evaluate('''()=>{const worn=new DOMMatrix(getComputedStyle(document.querySelector('[data-worn-part="sleeve_left"]').parentElement).transform),arm=new DOMMatrix(getComputedStyle(document.querySelector('[data-sprite="left_arm"]').parentElement).transform);return ['a','b','c','d'].every(k=>Math.abs(worn[k]-arm[k])<.02)&&['e','f'].every(k=>Math.abs(worn[k]-arm[k])<.5)}''')
 page.screenshot(path='/tmp/popa-cloud-in-room.png')
 page.locator('[data-furniture="wardrobe"]').click();page.clock.run_for(10000);page.locator('[data-wear="default"]').click();page.wait_for_function('document.querySelector(".cat-character").dataset.outfit==="default"');assert page.locator('[data-worn-part]').count()==0
 assert page.locator('[data-sprite="flower"]').evaluate('(e)=>getComputedStyle(e).visibility')=='visible'
 assert page.locator('[data-sprite="torso"]').evaluate('(e)=>e.style.clipPath')=='inset(0px 20%)'
 for side in ['left','right']:
  assert page.locator(f'[data-sprite="{side}_arm"]').get_attribute('src').split('?')[0].endswith(f'/{side}_arm.png')
 # New sessions in the character studio start from the shared fitted file.
 page.goto(URL+'index.html?outfits=1',wait_until='networkidle');assert page.input_value('#outfit-x')=='223.9';assert page.input_value('#outfit-layer')=='9.1'
 assert page.locator('[data-sprite="torso"]').evaluate('(e)=>e.style.clipPath')=='inset(0px 20% 60%)'
 assert not errors,errors
 b.close()
print('PASS fitted cloud outfit in room, body layering, animation following, saved selection, default restore and published studio positions')
