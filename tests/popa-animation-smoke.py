"""Run against a local static server: python3 tests/popa-animation-smoke.py URL."""
import sys
from playwright.sync_api import sync_playwright
URL = sys.argv[1] if len(sys.argv) > 1 else 'http://127.0.0.1:4173/'
DURATIONS = dict(idle=3000, walk=800, happy=1200, wave=1600, curious=2000,
                 interact=1100, hold=2500, pet=1800, rest=4000)
LOOPS = {'idle', 'walk', 'hold', 'rest'}
with sync_playwright() as p:
    browser = p.chromium.launch(executable_path='/usr/bin/chromium', headless=True, args=['--no-sandbox'])
    page = browser.new_page(viewport={'width': 1400, 'height': 1200})
    errors, bad = [], []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.on('response', lambda r: bad.append(r.url) if r.status >= 400 else None)
    page.goto(URL, wait_until='networkidle')
    page.wait_for_function('!!window.popa')
    def settled():
        page.wait_for_function('document.getAnimations().every(a=>a.effect.getTiming().iterations!==Infinity)')
        page.wait_for_function('document.querySelector(".cat-frame").getAnimations({subtree:true}).length===0')
    def geometry():
        return page.evaluate('''() => [...document.querySelectorAll('.cat-part')].map(e=> {
          const b=e.getBoundingClientRect();
          return [e.dataset.sprite, ...[b.x,b.y,b.width,b.height].map(v=>Math.round(v*100)/100),e.src,e.closest('.cat-layer').style.zIndex];
        })''')
    page.evaluate("popa.setExpression('playful')")
    base = geometry()
    shadow_center = page.locator('.cat-floor-shadow').evaluate('e=>{const r=e.getBoundingClientRect();return r.y+r.height/2}')
    for name, duration in DURATIONS.items():
        page.locator(f'[data-action="{name}"]').click()
        page.wait_for_function('''duration => document.querySelector('.cat-frame').getAnimations({subtree:true})
          .some(a=>a.effect.getTiming().duration===duration)''', arg=duration)
        effects = page.locator('.cat-frame').evaluate('''e=>e.getAnimations({subtree:true}).map(a=>({
          duration:a.effect.getTiming().duration, frames:a.effect.getKeyframes(),loop:a.effect.getTiming().iterations===Infinity}))''')
        assert effects and all(a['duration']==duration for a in effects), name
        for effect in effects:
            assert effect['loop'] == (name in LOOPS)
            assert effect['frames'][0]['transform'] == effect['frames'][-1]['transform'], name
        for fraction in [.1, .25, .5, .75, .9]:
            page.locator('.cat-frame').evaluate('''(e,time)=>e.getAnimations({subtree:true}).forEach(a=>{a.pause();a.currentTime=time})''', duration*fraction)
            assert page.evaluate('''() => {
              const head=document.querySelector('[data-sprite="head"]').parentElement;
              return ['flower','eye_happy_left','mouth_happy','ear_left','whiskers_left'].every(name=>{
                const e=document.querySelector(`[data-sprite="${name}"]`);
                return getComputedStyle(e.closest('.cat-head-motion')).transform===getComputedStyle(head).transform &&
                  getComputedStyle(e.closest('.cat-body-motion')).transform===getComputedStyle(head.closest('.cat-body-motion')).transform;
              });
            }'''), name
            assert page.locator('[data-sprite="mouth_happy"]').get_attribute('src').endswith('mouth_tongue.png')
            if name != 'rest':
                assert page.locator('[data-sprite="eye_happy_left"]').get_attribute('src').endswith('eye_happy_left.png')
            if name == 'happy':
                center = page.locator('.cat-floor-shadow').evaluate('e=>{const r=e.getBoundingClientRect();return r.y+r.height/2}')
                assert abs(center-shadow_center) < .01
            if name == 'hold':
                assert page.evaluate('''getComputedStyle(popa.itemAnchor).transform===getComputedStyle(document.querySelector('[data-sprite="pinafore"]').closest('.cat-body-motion')).transform''')
            if name in ['idle','hold','rest']:
                now=geometry()
                for foot in ['foot_left','foot_right']:
                    assert next(row[:5] for row in now if row[0]==foot)==next(row[:5] for row in base if row[0]==foot)
        if name not in LOOPS:
            page.locator('.cat-frame').evaluate('(e)=>e.getAnimations({subtree:true}).forEach(a=>a.finish())')
            page.wait_for_function('document.querySelector(".cat-character").dataset.action==="stop"')
        else:
            page.locator('[data-action="stop"]').click()
        settled()
        assert geometry()==base, name
    # Game contact marker fires once, and cancellation prevents stale markers.
    page.evaluate("window.contacts=[];popa.element.addEventListener('popa:interact',e=>contacts.push(e.detail));popa.play('interact')")
    page.wait_for_function('contacts.length===1')
    assert page.evaluate('contacts[0]')=={'animation':'interact','time':.55}
    page.wait_for_timeout(650)
    assert page.evaluate('contacts.length')==1
    page.evaluate("popa.play('interact');popa.stop()")
    settled();page.wait_for_timeout(650)
    assert page.evaluate('contacts.length')==1
    # Item remains between costume and hands and follows the same breathing rig.
    page.evaluate("const item=document.createElement('span');item.textContent='★';popa.attachItem(item);popa.play('hold')")
    page.wait_for_function('document.querySelector(".cat-frame").getAnimations({subtree:true}).some(a=>a.effect.getTiming().duration===2500)')
    assert page.evaluate('''Number(popa.itemAnchor.style.zIndex)>Number(document.querySelector('[data-sprite="pinafore"]').closest('.cat-layer').style.zIndex) &&
      Number(popa.itemAnchor.style.zIndex)<Number(document.querySelector('[data-sprite="left_arm"]').closest('.cat-layer').style.zIndex)''')
    page.evaluate('popa.stop();popa.clearItem()');settled()
    # Interrupted transitions do not resurrect canceled clips.
    page.evaluate("popa.play('hold');popa.play('rest');popa.play('happy');popa.stop()")
    settled();page.wait_for_timeout(300)
    assert geometry()==base
    page.emulate_media(reduced_motion='reduce');page.evaluate("popa.play('walk')")
    assert page.locator('.cat-frame').evaluate('(e)=>e.getAnimations({subtree:true}).length')==0
    page.set_viewport_size({'width':375,'height':900})
    assert not page.evaluate('document.documentElement.scrollWidth>innerWidth')
    assert not errors and not bad,(errors,bad)
    browser.close()
    print('PASS: nine clip timings, loop seams, rigid face/costume, planted feet, exact reset, contact event/cancellation, hold attachment, transitions, reduced motion, mobile')
