"""Real drawing journey plus mask, state, bottle and persistence invariants."""
import sys,json
from playwright.sync_api import sync_playwright
URL=sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:4207/'
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':1440,'height':1000});errors=[];bad=[]
 page.on('pageerror',lambda e:errors.append(str(e)));page.on('response',lambda r:bad.append(r.url) if r.status>=400 else None)
 page.goto(URL+'manicure.html',wait_until='networkidle');page.wait_for_selector('#loading',state='hidden');assert page.locator('[data-nail]').count()==4
 # Test the shared raster model independently: these are strokes, never presets.
 stats=page.evaluate('''async()=>{const {NailSurface,canvas}=await import('./game/manicure/surface.js'),a=window.manicure.assets,n=new NailSurface(a),count=c=>{const d=c.getContext('2d').getImageData(0,0,256,384).data;return d.reduce((v,x,i)=>v+(i%4===3&&x>32?1:0),0)};const base=a.images['nails/states/broken.png'].src,old=n.count(n.old),dirt=n.count(n.dirt);n.stroke('remove',{x:50,y:80},{x:50,y:110},{color:'rgba(255,255,255,.18)'});const local=n.count(n.old);if(!(local<old&&local>old*.5)||n.count(n.dirt)!==dirt)throw Error('local erase');n.stroke('file',{x:50,y:250},{x:200,y:250});if(n.repair!==0)throw Error('wrong edge repair');n.stroke('paint',{x:-30,y:30},{x:290,y:350},{width:70,color:'#f49fbc'});const mask=n.maskData(),data=n.paint.getContext('2d').getImageData(0,0,256,384).data;let leaks=0;for(let i=3;i<data.length;i+=4)if(mask[i]===0&&data[i]>0)leaks++;if(leaks)throw Error('paint outside mask');n.dried=true;n.addSticker('flower',{x:128,y:80});n.stickers[0].size=110;n.stickers[0].rotation=80;n.rebuildDecorations();const dec=n.decoration.getContext('2d').getImageData(0,0,256,384).data;for(let i=3;i<dec.length;i+=4)if(mask[i]===0&&dec[i]>0)throw Error('sticker outside mask');const saved=await n.serialize(),restored=await NailSurface.restore(a,saved);if(restored.paint.toDataURL()!==n.paint.toDataURL()||restored.old.toDataURL()!==n.old.toDataURL())throw Error('layer restore');return {coverage:n.coverage(),leaks,oldLeft:local/old,baseUnchanged:base===a.images['nails/states/broken.png'].src}}''')
 assert stats['leaks']==0 and 0<stats['coverage']<.8 and stats['baseUnchanged']
 page.locator('[data-nail="0"]').click()
 def point(x,y):return page.locator('#work').evaluate('''(c,p)=>{const r=c.getBoundingClientRect(),m=new DOMMatrix(getComputedStyle(c).transform==='none'?undefined:getComputedStyle(c).transform),v=new DOMPoint((p[0]/256-.5)*c.clientWidth,(p[1]/384-.5)*c.clientHeight).matrixTransform(m);return [r.x+r.width/2+v.x,r.y+r.height/2+v.y]}''',[x,y])
 def stroke(points):
  page.mouse.move(*point(*points[0]));page.mouse.down()
  for x,y in points[1:]:page.mouse.move(*point(x,y),steps=3)
  page.mouse.up()
 def grid():
  for x in range(30,236,40):stroke([(x,20),(x,365)])
 def phase():return page.evaluate('window.manicure.nails[window.manicure.selected].phase()')
 # Local removal changes one nail only and remains gradual.
 initial=page.evaluate('window.manicure.nails.map(n=>n.old.toDataURL())');stroke([(60,80),(60,140)]);assert page.evaluate('window.manicure.nails[0].remaining("old")')>.4
 assert page.evaluate('window.manicure.nails[1].old.toDataURL()')==initial[1]
 grid();assert phase()=='clean'
 page.locator('[data-tool="clean"]').click();grid();assert phase()=='file'
 page.locator('[data-tool="file"]').click();stroke([(40,270),(220,270)]);assert page.evaluate('window.manicure.nails[0].repair')==0
 for _ in range(12):stroke([(45,65),(210,65)])
 assert phase()=='paint';assert page.evaluate('window.manicure.nails[0].shape')=='clean'
 # Scaled/rotated drawing and separate strokes; actual drag starts outside mask.
 page.locator('[data-color="pink"]').click();page.locator('#view-rotation').evaluate("(e)=>e.value='22'");page.locator('#view-rotation').dispatch_event('input');page.locator('#view-zoom').evaluate("(e)=>e.value='1.2'");page.locator('#view-zoom').dispatch_event('input')
 stroke([(5,180),(110,180)]);coverage=page.evaluate('window.manicure.nails[0].coverage()');assert 0<coverage<.3
 first=page.evaluate('window.manicure.nails[0].paint.toDataURL()');stroke([(165,280),(180,290)]);page.locator('#undo').click();assert page.evaluate('window.manicure.nails[0].paint.toDataURL()')==first;page.locator('#redo').click();assert page.evaluate('window.manicure.nails[0].paint.toDataURL()')!=first
 page.locator('[data-color="mint"]').click();stroke([(150,110),(170,150)]);assert page.evaluate('window.manicure.nails[0].coverage()')>coverage
 await_save=page.evaluate('window.manicure.flush()');painted=page.evaluate('window.manicure.nails[0].paint.toDataURL()');page.reload(wait_until='networkidle');page.wait_for_selector('#loading',state='hidden');assert page.evaluate('window.manicure.nails[0].paint.toDataURL()')==painted
 page.locator('[data-nail="0"]').click();page.locator('[data-color="pink"]').click();grid();assert page.evaluate('window.manicure.nails[0].coverage()')>.65
 # All six caps lift out of the back/front layers and return to their mouths.
 for color in ['pink','lavender','mint','peach','yellow','topcoat']:
  page.locator(f'[data-color="{color}"]').click();page.wait_for_function('(c)=>document.querySelector(`[data-color="${c}"] .bottle-brush`).style.opacity==="0"',arg=color)
  button=page.locator(f'[data-color="{color}"]');assert button.locator('.bottle-brush').evaluate('(e)=>e.style.opacity')=='0'
  assert button.locator('.bottle-bottle-back').evaluate('(e)=>+e.style.zIndex')<button.locator('.bottle-brush').evaluate('(e)=>+e.style.zIndex')<button.locator('.bottle-bottle-front').evaluate('(e)=>+e.style.zIndex')
 page.locator('[data-tool="file"]').click();page.wait_for_timeout(600)
 assert page.locator('.bottle-brush').evaluate_all('(els)=>els.every(e=>e.style.opacity!=="0" && e.style.transform==="translateY(0px)")')
 page.locator('#dryer').click();page.wait_for_selector('#drying',state='visible');assert page.evaluate('!window.manicure.nails[0].dried');page.wait_for_timeout(700);page.screenshot(path='/tmp/manicure-dryer-tested.png');page.wait_for_selector('#drying',state='hidden');assert page.evaluate('window.manicure.nails[0].dried')
 page.locator('[data-sticker="flower"]').click();stroke([(128,150),(160,180)]);assert page.evaluate('window.manicure.nails[0].stickers.length')==1
 page.locator('#sticker-size').evaluate("(e)=>e.value='100'");page.locator('#sticker-size').dispatch_event('input');page.locator('#sticker-rotation').evaluate("(e)=>e.value='45'");page.locator('#sticker-rotation').dispatch_event('input')
 assert page.evaluate('window.manicure.nails[0].stickers[0].rotation')==45
 with page.expect_download() as d:page.locator('#photo').click()
 assert d.value.suggested_filename=='popa-nails.png'
 page.locator('#remove-sticker').click();assert page.evaluate('window.manicure.nails[0].stickers.length')==0
 page.evaluate('window.manicure.flush()');page.reload(wait_until='networkidle');page.wait_for_selector('#loading',state='hidden');assert page.evaluate('window.manicure.nails[0].dried')
 assert page.evaluate('window.manicure.nails.slice(1).every(n=>!n.dried&&n.coverage()===0)')
 # Finish the remaining three nails through the same real controls, including intentional partial painting.
 for index,color in [(1,'lavender'),(2,'mint'),(3,'peach')]:
  if index==1:page.locator(f'[data-nail="{index}"]').click()
  else:page.locator(f'#nail-strip [data-index="{index}"]').click()
  page.locator('[data-tool="remove"]').click();grid();page.locator('[data-tool="clean"]').click();grid();page.locator('[data-tool="file"]').click()
  for _ in range(12):stroke([(45,65),(210,65)])
  assert phase()=='paint',(index,page.evaluate('({phase:window.manicure.nails[window.manicure.selected].phase(),selected:window.manicure.selected,repair:window.manicure.nails[window.manicure.selected].repair,old:window.manicure.nails[window.manicure.selected].remaining("old"),dirt:window.manicure.nails[window.manicure.selected].remaining("dirt")})'));page.locator(f'[data-color="{color}"]').click()
  if index==2:
   stroke([(90,120),(140,200)]);assert page.locator('#dryer').is_disabled();page.locator('#creative-toggle').click();assert page.locator('#dryer').is_enabled()
  else:grid()
  page.locator('#dryer').click();page.wait_for_selector('#drying',state='visible');page.wait_for_selector('#drying',state='hidden');assert page.evaluate(f'window.manicure.nails[{index}].dried')
 assert page.locator('#finish').is_enabled();page.locator('#finish').click();page.wait_for_selector('#result',state='visible');coins=page.evaluate('JSON.parse(localStorage.getItem("popaWorldV1")).coins');assert coins==8
 page.locator('#result-close').click();page.locator('#finish').click();page.wait_for_selector('#result',state='visible');assert page.evaluate('JSON.parse(localStorage.getItem("popaWorldV1")).coins')==coins
 page.locator('#result-new').click();assert page.evaluate('window.manicure.nails.every(n=>!n.dried&&n.coverage()===0&&n.remaining("old")>.9)')
 assert not errors and not bad,(errors,bad)
 # A genuine touch stroke at phone dimensions uses the same coordinate conversion.
 mobile=b.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True);touch=mobile.new_page();touch.goto(URL+'manicure.html',wait_until='networkidle');touch.wait_for_selector('#loading',state='hidden');touch.locator('[data-nail="1"]').tap();r=touch.locator('#work').bounding_box();cdp=mobile.new_cdp_session(touch)
 for typ,y in [('touchStart',.25),('touchMove',.35),('touchMove',.45),('touchEnd',.45)]:cdp.send('Input.dispatchTouchEvent',{'type':typ,'touchPoints':[] if typ=='touchEnd' else [{'x':r['x']+r['width']*.5,'y':r['y']+r['height']*y}]})
 assert touch.evaluate('window.manicure.nails[1].remaining("old")')<1
 assert touch.evaluate('document.documentElement.scrollWidth<=innerWidth&&document.documentElement.scrollHeight<=innerHeight')
 touch.screenshot(path='/tmp/manicure-mobile-tested.png');mobile.close();b.close();print('PASS: mask isolation, local erase, edge-only repair, true multicolor strokes, undo/redo, rotation/scale, independent nails, IndexedDB restore, all six layered bottles animated, dryer, editable/clipped stickers, clean PNG, phone touch')
