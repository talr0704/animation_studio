"""Outfit fitting uses the character rig, saves independent drafts and round-trips JSON."""
import json, sys
from pathlib import Path
from playwright.sync_api import sync_playwright
URL=sys.argv[1] if len(sys.argv)>1 else 'http://localhost:4205/'
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':1440,'height':1000}); errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto(URL+'index.html?outfits=1',wait_until='networkidle')
    assert page.locator('.cat-character').get_attribute('data-ready')=='true'
    assert page.locator('#outfit-look option').count()==6
    for look in ['cloud','crab','duck','jellyfish','mermaid','strawberry']:
        page.select_option('#outfit-look',look)
        assert page.locator('.outfit-image').count()==(7 if look=='cloud' else 9)
        page.wait_for_function('[...document.querySelectorAll(".outfit-image")].every(i=>i.complete&&i.naturalWidth>0)')
    page.select_option('#outfit-look','cloud')
    def set_number(key,value):
        page.locator('#outfit-'+key).fill(str(value));page.locator('#outfit-'+key).press('Tab')
    set_number('x',242)
    set_number('width',198)
    set_number('rotation',12)
    set_number('layer',22)
    assert page.locator('[data-outfit-part="pajama_body"]').evaluate('(e)=>e.parentElement.parentElement.parentElement.parentElement.style.zIndex')=='22'
    with page.expect_download() as d: page.locator('#outfit-export').click()
    data=json.loads(Path(d.value.path()).read_text()); assert d.value.suggested_filename=='popa-look-cloud.json'
    first=data['looks'][0]['parts'][0];assert first['x']==242 and first['width']==198 and first['rotation']==12
    assert len(json.dumps(data))<20000 and 'base64' not in json.dumps(data)
    page.select_option('#outfit-look','duck');set_number('x',222)
    page.select_option('#outfit-look','cloud');assert page.input_value('#outfit-x')=='242'
    page.reload(wait_until='networkidle');assert page.input_value('#outfit-x')=='242'
    # Import is exact and refuses undeclared external artwork.
    set_number('x',260)
    page.locator('#outfit-import').set_input_files({'name':'positions.json','mimeType':'application/json','buffer':json.dumps(data).encode()})
    page.wait_for_function('document.querySelector("#outfit-x").value==="242"')
    bad=json.loads(json.dumps(data));bad['looks'][0]['parts'][0]['asset']='https://example.com/other.png'
    page.locator('#outfit-import').set_input_files({'name':'bad.json','mimeType':'application/json','buffer':json.dumps(bad).encode()})
    page.wait_for_function('document.querySelector("#outfit-status").textContent.includes("לא נטען")')
    # Sleeve follows the actual arm animation rather than a separate approximate clip.
    page.locator('[data-piece="sleeve_left"]').click();page.locator('[data-preview="wave"]').click();page.wait_for_timeout(450)
    assert page.evaluate('''()=>{const sleeve=document.querySelector('[data-outfit-part="sleeve_left"]').parentElement;
    const arm=document.querySelector('[data-sprite="left_arm"]').parentElement;return sleeve.style.transform===getComputedStyle(arm).transform}''')
    page.locator('#outfit-stop').click()
    # Pointer coordinates respect mobile display scaling. Move a piece into clear space first.
    page.set_viewport_size({'width':390,'height':844})
    page.locator('[data-piece="hat_body"]').click();set_number('x',70);set_number('y',50)
    image=page.locator('[data-outfit-part="hat_body"]');rect=image.bounding_box()
    page.mouse.move(rect['x']+rect['width']/2,rect['y']+rect['height']/2);page.mouse.down();page.mouse.move(rect['x']+rect['width']/2+24,rect['y']+rect['height']/2+12);page.mouse.up()
    assert abs(float(page.input_value('#outfit-x'))-110)<.2
    assert abs(float(page.input_value('#outfit-y'))-70)<.2
    page.locator('#outfit-undo').click();assert page.input_value('#outfit-x')=='70'
    page.locator('#outfit-locked').check();rect=image.bounding_box();page.mouse.move(rect['x']+rect['width']/2,rect['y']+rect['height']/2);page.mouse.down();page.mouse.move(rect['x']+rect['width']/2+24,rect['y']+rect['height']/2);page.mouse.up();assert page.input_value('#outfit-x')=='70'
    # Character animation mode remains separate and mounts the regular timeline.
    page.goto(URL+'index.html?edit=1',wait_until='networkidle');assert page.locator('.animation-editor').count()==1 and page.locator('.outfit-image').count()==0
    assert not errors,errors
    browser.close()
print('Outfit fitting: six looks, rig preview, numeric edits, drag, lock, persistence and JSON import/export passed')
