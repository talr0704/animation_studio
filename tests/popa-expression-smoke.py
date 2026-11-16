"""Run: python3 tests/popa-expression-smoke.py http://127.0.0.1:4173/"""
import sys
from playwright.sync_api import sync_playwright
URL = sys.argv[1] if len(sys.argv) > 1 else 'http://127.0.0.1:4173/'
EXPECTED = {
    'idle': ('neutral', 'open', 'closed'), 'walk': ('neutral', 'open', 'closed'),
    'happy': ('happy', 'happy', 'happy'), 'wave': ('happy', 'happy', 'happy'),
    'curious': ('surprised', 'open', 'surprised'), 'interact': ('neutral', 'open', 'closed'),
    'hold': ('happy', 'happy', 'happy'), 'pet': ('content', 'sleep', 'happy'),
    'rest': ('sleepy', 'sleep', 'closed'),
}
with sync_playwright() as p:
    browser = p.chromium.launch(executable_path='/usr/bin/chromium', headless=True, args=['--no-sandbox'])
    page = browser.new_page(viewport={'width': 1400, 'height': 1200})
    errors, failures = [], []
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.on('response', lambda response: failures.append(response.url) if response.status >= 400 else None)
    page.add_init_script('localStorage.setItem("popaExpressionV1", "sleepy")')
    page.goto(URL, wait_until='networkidle')
    assert page.locator('button[data-expression], .expression-controls').count() == 0
    def assert_face(expression, eyes, mouth):
        assert page.locator('.cat-character').get_attribute('data-expression') == expression
        for side in ['left','right']:
            image = page.locator(f'[data-sprite="eye_happy_{side}"]')
            assert image.get_attribute('src').endswith(f'eye_{eyes}_{side}.png')
            size = image.evaluate('''e=>{const scale=e.style.scale ? e.style.scale.split(' ').map(Number):[1,1];
              return [parseFloat(e.style.width)*scale[0],parseFloat(e.style.height)*scale[1]]}''')
            target = [100,70.59] if eyes=='open' else [68,48]
            assert all(abs(a-b)<.001 for a,b in zip(size,target)), (size,target)
        assert page.locator('[data-sprite="mouth_happy"]').get_attribute('src').endswith(f'mouth_{mouth}.png')
        assert page.evaluate('[...document.querySelectorAll(".cat-part")].every(e=>e.complete&&e.naturalWidth>0)')
    assert_face('happy','happy','happy')
    for name, face in EXPECTED.items():
        page.locator(f'[data-action="{name}"]').click()
        page.wait_for_function('duration=>document.querySelector(".cat-frame").getAnimations({subtree:true}).some(a=>a.effect.getTiming().duration===duration)',arg=page.evaluate('(name)=>popa.clips[name].duration',name))
        assert_face(*face)
        page.locator('[data-action="stop"]').click()
        page.wait_for_function('document.querySelector(".cat-frame").getAnimations({subtree:true}).length===0')
        assert_face('happy','happy','happy')
    # The blink temporarily closes idle's eyes, then restores its open-eyed face.
    page.evaluate("{popa.play('idle')}")
    page.wait_for_function('document.querySelector("[data-sprite=eye_happy_left]").src.endsWith("eye_sleep_left.png")')
    page.evaluate("() => { popa.play('curious'); }")
    page.wait_for_timeout(350)
    assert_face('surprised','open','surprised')
    page.evaluate('popa.stop()')
    page.wait_for_timeout(350)
    assert_face('happy','happy','happy')
    # Faces still follow the action when motion is reduced.
    page.emulate_media(reduced_motion='reduce')
    page.locator('[data-action="rest"]').click()
    assert_face('sleepy','sleep','closed')
    page.reload(wait_until='networkidle')
    assert_face('happy','happy','happy')
    page.set_viewport_size({'width':375,'height':900})
    assert not page.evaluate('document.documentElement.scrollWidth>innerWidth')
    assert not errors and not failures,(errors,failures)
    browser.close()
    print('PASS: nine automatic faces, no face buttons, correct eye sizes, blink/interruption cleanup, stop reset, reduced motion, mobile')
