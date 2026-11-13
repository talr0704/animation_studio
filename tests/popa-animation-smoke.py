"""Run against a local static server: python3 tests/popa-animation-smoke.py URL."""
import sys
from playwright.sync_api import sync_playwright

URL = sys.argv[1] if len(sys.argv) > 1 else 'http://127.0.0.1:4173/'
ACTIONS = ['idle', 'inspired', 'wave', 'floatWaveAndSway', 'lookAround',
           'nod', 'bounce', 'ponder', 'dance', 'talk', 'walk', 'roamAndDisappear']

with sync_playwright() as playwright:
    browser = playwright.chromium.launch(executable_path='/usr/bin/chromium', headless=True,
                                         args=['--no-sandbox'])
    page = browser.new_page(viewport={'width': 1400, 'height': 1100})
    errors, failed = [], []
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.on('response', lambda response: failed.append(response.url) if response.status >= 400 else None)
    page.goto(URL, wait_until='networkidle')
    page.wait_for_selector('[data-ready="true"]')

    def geometry():
        return page.evaluate('''() => [...document.querySelectorAll('.cat-part')].map(e => {
          const box = e.getBoundingClientRect();
          const round = value => Math.round(value * 100) / 100;
          return [e.dataset.sprite, ...[box.x, box.y, box.width, box.height].map(round),
                  e.style.transform, getComputedStyle(e.parentElement).transformOrigin.split(' ').map(parseFloat).map(round),
                  e.closest('.cat-layer').style.zIndex, e.src];
        })''')

    baseline = geometry()
    # Walk alternates support: one foot stays down while the other lifts.
    page.locator('[data-action="walk"]').click()
    samples = []
    for time in [275, 825]:
        page.locator('.cat-frame').evaluate('''(e, time) => e.getAnimations({subtree:true}).forEach(a => {
          a.pause(); a.currentTime = time;
        })''', time)
        samples.append(page.evaluate('''() => ['foot_left', 'foot_right'].map(name => {
          const matrix = new DOMMatrix(getComputedStyle(document.querySelector(`[data-sprite="${name}"]`).parentElement).transform);
          return { x: matrix.e, y: matrix.f };
        })'''))
    assert abs(samples[0][0]['y'] + 5) < .01 and abs(samples[0][1]['y']) < .01
    assert abs(samples[1][0]['y']) < .01 and abs(samples[1][1]['y'] + 5) < .01
    page.locator('[data-action="stop"]').click()
    assert geometry() == baseline
    for action in ACTIONS:
        page.locator(f'[data-action="{action}"]').click()
        assert page.locator('.cat-character').get_attribute('data-action') == action
        assert page.locator('.cat-frame').evaluate('(e)=>e.getAnimations({subtree:true}).length') > 0
        page.locator('.cat-frame').evaluate('''e => e.getAnimations({subtree:true}).forEach(a => {
          a.pause(); a.currentTime = a.effect.getTiming().duration * .5;
        })''')
        if action in ['idle', 'inspired']:
            for sprite in ['foot_left', 'foot_right']:
                current = next(item for item in geometry() if item[0] == sprite)
                assert current == next(item for item in baseline if item[0] == sprite)
        if action in ['nod', 'lookAround', 'talk']:
            assert page.evaluate('''getComputedStyle(document.querySelector('[data-sprite="head"]').parentElement).transform ===
              getComputedStyle(document.querySelector('[data-sprite="flower"]').closest('.cat-layer')).transform''')
        page.locator('[data-action="stop"]').click()
        assert page.locator('.cat-frame').evaluate('(e)=>e.getAnimations({subtree:true}).length') == 0
        assert geometry() == baseline, action

    for action in [name for name in ACTIONS if name not in ['idle', 'inspired', 'talk', 'walk']]:
        page.locator(f'[data-action="{action}"]').click()
        page.locator('.cat-frame').evaluate('(e)=>e.getAnimations({subtree:true}).forEach(a=>a.finish())')
        page.wait_for_function('document.querySelector(".cat-character").dataset.action === "stop"')
        assert geometry() == baseline, action

    # Interrupt every action with another; no layer or source changes may leak.
    for action in ACTIONS:
        page.locator(f'[data-action="{action}"]').click()
    page.locator('[data-action="stop"]').click()
    assert geometry() == baseline
    page.locator('[data-action="talk"]').click()
    page.wait_for_timeout(400)
    assert page.locator('[data-sprite="mouth_happy"]').get_attribute('src').endswith('mouth_closed.png')
    page.locator('[data-action="stop"]').click()
    page.wait_for_timeout(300)
    assert geometry() == baseline
    page.emulate_media(reduced_motion='reduce')
    page.locator('[data-action="wave"]').click()
    assert page.locator('.cat-frame').evaluate('(e)=>e.getAnimations({subtree:true}).length') == 0
    page.set_viewport_size({'width': 375, 'height': 900})
    assert not page.evaluate('document.documentElement.scrollWidth > innerWidth')
    assert not errors and not failed, (errors, failed)
    browser.close()
    print('PASS: 12 actions, planted feet, connected face, exact stop/interruption reset, speech cleanup, reduced motion, mobile')
