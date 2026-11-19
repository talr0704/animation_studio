"""Published/edited starting pose is shared by the rack, held tool and animation end."""
import sys
from playwright.sync_api import sync_playwright
URL=sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:4203/'
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':1200,'height':900});errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)));page.goto(URL+'salon.html',wait_until='networkidle');page.wait_for_selector('#loading',state='hidden')
 expected=page.evaluate('''async()=>{const {poseAt}=await import('./shared/prop-rig.js');const c=await(await fetch('./assets/scenes/salon/props/scissors/animations/cut.json')).json();const r=await(await fetch('./assets/scenes/salon/props/scissors/assembly.json')).json();return {duration:c.duration,parts:r.parts.map(p=>{const a=poseAt(c,p.id,0);return {id:p.id,transform:`translate(${a.x}px,${a.y}px) rotate(${a.rotation}deg)`}})}}''')
 def check():
  for part in expected['parts']:
   for prefix in ['#scissors','.inventory-scissors']:
    assert page.locator(prefix+f' [data-prop-motion="{part["id"]}"]').evaluate('''(e,expected)=>{const a=new DOMMatrix(e.style.transform),b=new DOMMatrix(expected);return ['a','b','c','d','e','f'].every(k=>Math.abs(a[k]-b[k])<.00001)}''',part['transform'])
 check()
 for tool,label in [('water','הרטבה'),('shampoo','סיבון'),('water','שטיפה'),('dryer','ייבוש')]:
  page.locator(f'[data-tool="{tool}"]').click();page.locator('#stage').focus()
  for _ in range(100):
   if label not in page.locator('#steps li.current').inner_text():break
   page.keyboard.press('Space')
  else:raise AssertionError('Phase did not finish')
 page.locator('[data-tool="scissors"]').click();page.locator('#stage').focus();check();page.keyboard.press('Space');page.wait_for_timeout(expected['duration']*1000+150);check()
 assert not errors,errors
 b.close();print('PASS: rack and held tool show published first-frame pose and return to it after a cut')
