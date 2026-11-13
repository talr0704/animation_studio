"""Run: python3 tests/popa-expression-smoke.py http://127.0.0.1:4173/"""
import sys
from playwright.sync_api import sync_playwright

URL = sys.argv[1] if len(sys.argv) > 1 else 'http://127.0.0.1:4173/'
EXPECTED = {
    'happy': ('happy', 'happy'), 'neutral': ('open', 'closed'),
    'sleepy': ('sleep', 'closed'), 'surprised': ('open', 'surprised'),
    'playful': ('happy', 'tongue'),
}

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path='/usr/bin/chromium', headless=True,
                               args=['--no-sandbox'])
    page = browser.new_page(viewport={'width': 1400, 'height': 1100})
    errors, failures = [], []
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.on('response', lambda response: failures.append(response.url) if response.status >= 400 else None)
    page.goto(URL, wait_until='networkidle')

    def geometry():
        return page.evaluate('''() => [...document.querySelectorAll('.cat-part')].map(e =>
          [e.dataset.sprite, e.style.cssText, e.parentElement.style.transformOrigin,
           e.closest('.cat-layer').style.zIndex])''')

    def assert_expression(name):
        eyes, mouth = EXPECTED[name]
        assert page.locator('.cat-character').get_attribute('data-expression') == name
        assert page.locator(f'button[data-expression="{name}"][aria-pressed="true"]').count() == 1
        for side in ['left', 'right']:
            image = page.locator(f'[data-sprite="eye_happy_{side}"]')
            assert image.get_attribute('src').endswith(f'eye_{eyes}_{side}.png')
        assert page.locator('[data-sprite="mouth_happy"]').get_attribute('src').endswith(f'mouth_{mouth}.png')
        assert page.evaluate('[...document.querySelectorAll(".cat-part")].every(e=>e.complete&&e.naturalWidth>0)')

    baseline = geometry()
    for name in EXPECTED:
        page.locator(f'button[data-expression="{name}"]').click()
        assert_expression(name)
        assert geometry() == baseline
    page.reload(wait_until='networkidle')
    assert_expression('playful')
    page.locator('[data-action="walk"]').click()
    page.locator('button[data-expression="surprised"]').click()
    assert page.locator('.cat-character').get_attribute('data-action') == 'walk'
    page.locator('[data-action="stop"]').click()
    assert_expression('surprised')
    page.locator('[data-action="talk"]').click()
    page.wait_for_function('document.querySelector("[data-sprite=mouth_happy]").src.endsWith("mouth_closed.png")')
    page.locator('button[data-expression="sleepy"]').click()
    page.locator('[data-action="stop"]').click()
    assert_expression('sleepy')
    page.wait_for_timeout(400)
    assert_expression('sleepy')
    page.reload(wait_until='networkidle')
    assert_expression('sleepy')
    page.set_viewport_size({'width': 375, 'height': 900})
    assert not page.evaluate('document.documentElement.scrollWidth > innerWidth')
    assert not errors and not failures, (errors, failures)
    browser.close()
    print('PASS: five expressions, unchanged assembly, persistence, walking/speech integration, stop cleanup, mobile')
