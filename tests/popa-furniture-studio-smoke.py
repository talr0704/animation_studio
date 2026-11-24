"""Character motion stays on the original timeline; furniture motion is separate."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':1440,'height':1000});errors=[];page.on('pageerror',lambda e:errors.append(e.stack))
 page.goto('http://localhost:4205/index.html?furniture=sofa',wait_until='networkidle');page.wait_for_selector('[data-editor="animationSelect"]');assert 'edit=1' in page.url
 assert page.locator('.animation-editor').count()==1 and page.locator('.furniture-panel').count()==0
 options=page.locator('[data-editor="animationSelect"] option').evaluate_all('(els)=>els.map(e=>e.value)');assert all(id in options for id in ['sit-enter','sit-hold','sit-exit'])
 before=page.evaluate('localStorage.getItem("popaAnimationEditorDataV2")');page.locator('.character-references summary').click();page.select_option('#cr-reference','lamp');page.wait_for_selector('.character-reference-rig [data-prop-image="shade"]')
 page.locator('#cr-x').fill('260');page.locator('#cr-x').press('Tab');assert page.evaluate('localStorage.getItem("popaAnimationEditorDataV2")')==before
 page.select_option('#cr-reference','');assert page.locator('.character-reference-rig').is_hidden();assert page.locator('[data-editor="animationSelect"]').input_value()=='sit-hold'
 page.reload(wait_until='networkidle');assert page.locator('[data-editor="animationSelect"]').input_value()=='sit-hold'
 # The existing exporter remains character-only data.
 page.locator('[data-editor-section="export"] summary').click()
 with page.expect_download() as d:page.locator('[data-editor-action="downloadJson"]').click()
 exported=json.loads(Path(d.value.path()).read_text());assert 'sit-hold' in exported and exported['sit-hold']['keyframes'];assert 'reference' not in exported
 page.goto('http://localhost:4205/studio.html?category=furniture',wait_until='networkidle');assert page.locator('#prop-select option').count()==4
 page.select_option('#prop-select','home.coastal-cabinet');page.wait_for_function('document.querySelector("#assembly-path").textContent.includes("cabinet")');page.select_option('#part','door-left');page.locator('#time').fill('.84');page.locator('#time').press('Tab');assert page.input_value('#image-frame')=='open';assert page.locator('[data-prop-image="door-left"]').get_attribute('src').endswith('door-left-open.png')
 page.locator('#motion-scale-x').fill('.3');page.locator('#motion-scale-x').press('Tab');assert '.3' in page.locator('[data-prop-motion="door-left"]').evaluate('(e)=>e.style.transform')
 with page.expect_download() as d:page.locator('#export-details summary').click();page.locator('#export-clip').click()
 clip=json.loads(Path(d.value.path()).read_text());assert clip['prop']=='home.coastal-cabinet' and clip['id']=='open';assert any(k.get('imageFrame')=='open' for t in clip['tracks'] for k in t['keys'])
 page.select_option('#prop-select','home.coastal-lamp');page.wait_for_function('document.querySelector("#assembly-path").textContent.includes("lamp")');assert page.locator('#part option').count()==2
 page.select_option('#prop-select','home.coastal-window');page.wait_for_function('document.querySelector("#assembly-path").textContent.includes("window")');assert page.locator('#part option').count()==3
 page.goto('http://localhost:4205/studio.html',wait_until='networkidle');assert page.locator('#prop-select option').count()==2
 assert not errors,errors;b.close()
print('PASS native character timeline, sitting clips, independent reference settings, character export, furniture layers, door scaling and separate prop tools')
