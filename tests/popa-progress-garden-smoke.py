"""Garden rewards and the existing rug purchase update shared progress without deleting inventory."""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':1280,'height':1100});page.clock.install();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.add_init_script("Math.random=()=>.5;if(!localStorage.getItem('popaProgressV1'))localStorage.setItem('popaWorldV1',JSON.stringify({coins:20,rug:false}));")
 page.goto('http://localhost:4205/game.html',wait_until='networkidle');page.wait_for_selector('#loading',state='hidden')
 page.evaluate("async()=>{const {progressStore}=await import('./game/progress/store.js');progressStore.commit('test:inventory',{grant:{strawberry:2}});}")
 page.locator('#garden-tab').click();page.locator('#dialog-main').click();page.clock.run_for(8000);assert int(page.locator('#score').inner_text())>0
 page.locator('#pause').click();before=page.locator('#timer').inner_text();page.clock.run_for(1000);assert page.locator('#timer').inner_text()==before
 page.locator('#dialog-main').click();page.clock.run_for(39000);assert page.locator('#results').is_visible()
 state=page.evaluate('JSON.parse(localStorage.getItem("popaProgressV1"))');coins=state['wallet']['coins'];assert coins>20;assert state['activities']['garden']['rounds']==1;assert state['inventory']=={'strawberry':2};assert len([id for id in state['receipts'] if id.startswith('garden:')])==1
 page.clock.run_for(3000);assert page.evaluate('JSON.parse(localStorage.getItem("popaProgressV1")).wallet.coins')==coins
 page.locator('#dialog-secondary').click();box=page.locator('#buy-rug').bounding_box()
 # Use the exposed lower edge: the pre-existing room layout covers the centre with the sofa.
 page.mouse.click(box['x']+box['width']/2,box['y']+box['height']-5);page.clock.run_for(10000)
 state=page.evaluate('JSON.parse(localStorage.getItem("popaProgressV1"))');assert state['home']['rug'];assert state['wallet']['coins']==coins-12;assert state['inventory']=={'strawberry':2}
 page.reload(wait_until='networkidle');page.wait_for_selector('#loading',state='hidden');assert int(page.locator('#coins').inner_text())==coins-12
 assert not errors,errors
 b.close()
print('PASS real garden rewards, pause, one-time completion, shared inventory, rug purchase and reload')
