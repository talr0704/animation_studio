"""Second editable prop, persistence, preview and shared pump/bottle layering."""
import sys,json
from pathlib import Path
from playwright.sync_api import sync_playwright
URL=sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:4205/'
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':1280,'height':900});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(URL+'studio.html',wait_until='networkidle');page.locator('#prop-select').select_option('salon.shampoo');page.wait_for_function('document.querySelector("#assembly-path").textContent.includes("shampoo")')
 assert page.locator('#part option').count()==3
 page.locator('#time').fill('.175');page.locator('#time').press('Tab');page.locator('#position-y').fill('-4');page.locator('#position-y').press('Tab')
 draft=page.evaluate('JSON.parse(localStorage.getItem("popaPropDraftV1:salon.shampoo"))');assert draft['clip']['tracks'][0]['keys'][1]['y']==17
 page.locator('#export-details summary').click()
 with page.expect_download() as d:page.locator('#export-clip').click()
 assert d.value.suggested_filename=='pump.json';assert json.loads(Path(d.value.path()).read_text())['prop']=='salon.shampoo'
 with page.expect_popup() as popup:page.locator('#game-preview').click()
 game=popup.value;game.wait_for_selector('#loading',state='hidden');game.locator('[data-tool="shampoo"]').click();assert game.locator('#shampoo').is_visible()
 for prefix in ['#shampoo','.inventory-shampoo']:
  assert game.locator(prefix+' [data-prop-part="pump"]').evaluate('(e)=>+e.style.zIndex')<game.locator(prefix+' [data-prop-part="bottle"]').evaluate('(e)=>+e.style.zIndex')
 game.close();page.locator('#prop-select').select_option('salon.scissors');page.wait_for_function('document.querySelector("#assembly-path").textContent.includes("scissors")');assert page.locator('#part option').count()==3
 page.locator('#prop-select').select_option('salon.shampoo');page.wait_for_function('document.querySelector("#assembly-path").textContent.includes("shampoo")');page.locator('#time').fill('.175');page.locator('#time').press('Tab');assert page.locator('#position-y').input_value()=='-4'
 page.goto(URL+'game.html',wait_until='networkidle');page.wait_for_selector('#loading',state='hidden');page.locator('#reading-books').click();assert 'סיפור' in page.locator('#toast').inner_text();page.locator('.dresser-mirror').click();page.wait_for_selector('#loading',state='hidden');assert 'salon.html' in page.url
 assert not errors,errors
 b.close();print('PASS: soap rig editing, separate draft, pump.json export, preview/layering, prop switching, room reading and mirror navigation')
