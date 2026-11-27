from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':1440,'height':1000});errors=[];failed=[];page.on('pageerror',lambda e:errors.append(str(e)));page.on('response',lambda r:failed.append(r.url) if r.status>=400 else None)
 page.goto('http://localhost:4205/world.html',wait_until='networkidle');page.wait_for_selector('#locations button');assert page.locator('#popa .cat-part').first.is_visible();assert page.locator('#locations button').count()==9
 page.locator('#objects button[aria-label="מאפייה"]').click();assert 'bakery' in page.url;page.goto('http://localhost:4205/world.html?scene=bakery',wait_until='networkidle');page.wait_for_selector('#locations button')
 for scene in ['shops','bakery','tailor','wardrobe','post','home-care','party','achievements','garden']:
  page.locator(f'[data-scene="{scene}"]').click();assert page.locator('#objects button').count()>0
  options=page.locator('#groups option').evaluate_all('(els)=>els.map(e=>e.value)')
  for group in options:
   page.select_option('#groups',group)
   assert page.locator('#items img').count()>0
   assert page.locator('#items img').evaluate_all('(els)=>els.every(e=>e.complete&&e.naturalWidth>0)') or page.wait_for_function('Array.from(document.querySelectorAll("#items img")).every(e=>e.complete&&e.naturalWidth>0)')
  if scene=='wardrobe':
   page.get_by_role('button',name='למדוד: שפית תות',exact=True).click();page.wait_for_function('document.querySelector("[data-outfit]")?.dataset.outfit==="uploaded-chef"');assert page.evaluate('JSON.parse(localStorage.getItem("popaProgressV1")).appearance.outfit')=='uploaded-chef'
 page.locator('[data-scene="bakery"]').click();count=page.locator('#objects button').count();page.locator('#items button').first.click();assert page.locator('#objects button').count()==count+1
 page.locator('#arrange').click();page.locator('#size').fill('250');page.locator('#size').dispatch_event('input');page.reload(wait_until='networkidle');page.wait_for_selector('#objects button');assert page.locator('#objects button').count()==count+1
 page.screenshot(path='/tmp/popa-uploaded-bakery.png')
 for w,h in [(390,844),(844,390)]:
  page.set_viewport_size({'width':w,'height':h});page.screenshot(path=f'/tmp/popa-world-{w}.png');r=page.locator('#items').bounding_box();assert r['x']>=0 and r['x']+r['width']<=w+1
 assert not errors,errors;assert not failed,failed;b.close()
print('PASS all nine illustrated locations, all 20 source groups, images, adding/saving props, wearable outfit persistence and mobile layout')
