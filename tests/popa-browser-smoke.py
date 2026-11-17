"""Test the extracted ZIP served alone, e.g. URL http://127.0.0.1:4173/popa-browser/."""
import sys
from playwright.sync_api import sync_playwright
URL=sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:4173/popa-browser/'
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':1000,'height':900})
    errors,bad,requests=[],[],[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.on('response',lambda r:bad.append(r.url) if r.status>=400 else None)
    page.on('request',lambda r:requests.append(r.url))
    page.goto(URL+'example.html',wait_until='networkidle')
    page.wait_for_function('!!window.demoPopa')
    assert page.locator('.cat-part').count()==18
    assert page.locator('.animation-editor,.layout-editor,.expression-controls').count()==0
    assert page.evaluate('typeof window.gsap')=='undefined'
    assert all(url.startswith(URL) for url in requests),requests
    # A second instance must neither overwrite host content nor affect the first.
    page.evaluate('''async () => {
      const {createPopa}=await import('./popa-browser.js');window.createPopa=createPopa;
      const mount=document.createElement('div');mount.id='second';
      mount.innerHTML='<span id="existing">Game content</span>';document.body.append(mount);
      window.second=await createPopa(mount,{scale:.4,autoplay:false});
    }''')
    assert page.locator('#existing').inner_text()=='Game content'
    assert page.locator('#second .popa-browser').evaluate('(e)=>e.getBoundingClientRect().width')==176
    for name in ['idle','walk','happy','wave','curious','interact','hold','pet','rest']:
        page.evaluate('(name)=>{second.play(name)}',name)
        page.wait_for_function('''name=>second.root.getAnimations({subtree:true}).some(a=>
          a.effect.getTiming().duration===({idle:3000,walk:800,happy:1200,wave:1600,curious:2000,interact:1100,hold:2500,pet:1800,rest:4000})[name])''',arg=name)
        assert page.evaluate('demoPopa.action')=='idle'
        page.evaluate('second.stop()')
        page.wait_for_function('second.root.getAnimations({subtree:true}).length===0')
    page.evaluate('''() => {window.contacts=0;second.element.addEventListener('popa:interact',()=>contacts++);second.play('interact');}''')
    page.wait_for_function('contacts===1')
    page.evaluate('''() => {const item=document.createElement('span');item.textContent='★';second.attachItem(item);second.play('hold');}''')
    page.wait_for_function('second.itemAnchor.style.zIndex!==""')
    assert page.evaluate('second.itemAnchor.textContent')=='★'
    page.evaluate('''() => {second.setScale(.5);second.clearItem();second.destroy();second.destroy();}''')
    assert page.locator('#second .popa-browser').count()==0
    assert page.locator('#existing').count()==1
    page.wait_for_timeout(700)
    assert page.evaluate('contacts')==1
    page.evaluate('''async () => {window.second=await createPopa(document.querySelector('#second'),{autoplay:false});}''')
    assert page.locator('#second .popa-browser').count()==1
    page.evaluate('''() => {second.destroy();demoPopa.destroy();}''')
    assert page.locator('.popa-browser').count()==0
    page.set_viewport_size({'width':375,'height':800})
    assert not page.evaluate('document.documentElement.scrollWidth>innerWidth')
    assert not errors and not bad,(errors,bad)
    browser.close()
    print('PASS: isolated ZIP, all 9 clips, automatic faces, no dependencies/editors, multiple instances, events, held items, scale, destroy/remount')
