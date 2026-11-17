"""Check the actual parent-child attachment points while illustrated props rotate."""
import sys
from playwright.sync_api import sync_playwright
URL=sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:4173/'
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox']);page=b.new_page(viewport={'width':1440,'height':1100})
 page.goto(URL+'game.html',wait_until='networkidle');page.wait_for_selector('#loading',state='hidden')
 assert page.locator('#plant-prop img').count()==4
 assert page.locator('#window-prop img').count()==3
 assert page.locator('#shelf-prop img').count()==3
 page.locator('#plant-prop').click()
 for time in [0,400,800,1200,1599]:
  page.locator('#plant-prop').evaluate('(e,t)=>e.getAnimations({subtree:true}).forEach(a=>{a.pause();a.currentTime=t})',time)
  errors=page.locator('#plant-prop').evaluate('''root=>{
   const stem=root.querySelector('[data-joint="stem"]'),origin=stem.getBoundingClientRect();
   const matrix=new DOMMatrix(getComputedStyle(stem).transform);
   return ['leftLeaf','rightLeaf'].map(name=>{
    const leaf=root.querySelector(`[data-joint="${name}"]`),rect=leaf.getBoundingClientRect();
    const p=new DOMPoint(parseFloat(leaf.style.left),parseFloat(leaf.style.top)).matrixTransform(matrix);
    return Math.hypot(rect.left-origin.left-p.x,rect.top-origin.top-p.y);
   });
  }''')
  assert all(error<.01 for error in errors),errors
  assert page.locator('#plant-prop [data-joint="pot"]').evaluate('e=>getComputedStyle(e).transform')=='none'
 page.locator('#window-prop').click()
 assert page.locator('#window-prop').evaluate('(e)=>e.getAnimations({subtree:true}).length')==2
 page.set_viewport_size({'width':375,'height':900})
 assert not page.evaluate('document.documentElement.scrollWidth>innerWidth')
 assert page.evaluate('[...document.querySelectorAll(".prop-sprite,.scene-backdrop,.rug")].every(i=>i.complete&&i.naturalWidth>0)')
 b.close();print('PASS: image-based props, anchored child joints at five poses, fixed pot, curtain joints and mobile assets')
