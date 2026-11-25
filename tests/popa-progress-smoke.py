"""Existing screens share migrated progress and do not erase future story/inventory data."""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);context=b.new_context(viewport={'width':1440,'height':1000});page=context.new_page();errors=[]
 context.on('page',lambda page:page.on('pageerror',lambda e:errors.append(str(e))))
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.add_init_script('''if(!localStorage.getItem('progress-seeded')){localStorage.setItem('popaWorldV1',JSON.stringify({coins:27,best:123,rounds:2,rug:true,outfit:'cloud'}));localStorage.setItem('popaSalonAlbumV1',JSON.stringify({total:0,entries:[]}));localStorage.setItem('progress-seeded','1');}''')
 page.goto('http://localhost:4205/game.html',wait_until='networkidle');page.wait_for_selector('#loading',state='hidden');assert page.locator('#coins').inner_text()=='27'
 page.evaluate('''async()=>{const {progressStore:s}=await import('./game/progress/store.js');s.commit('test:story',{grant:{strawberry:3},npc:{id:'milli',dialogue:'hello'},quest:{action:'start'},plot:{id:'front',crop:'strawberry',stage:'planted',plantedAt:100,wateredAt:null,readyAt:200,harvestedAt:null}});}''')
 care=context.new_page();care.goto('http://localhost:4205/manicure.html',wait_until='networkidle');care.wait_for_selector('#loading',state='hidden')
 amounts=care.evaluate('''async()=>{const {rewardOnce}=await import('./game/manicure/storage.js?v=progress2');return [rewardOnce('test-a'),rewardOnce('test-b'),rewardOnce('test-a')];}''');assert amounts==[8,8,0]
 # An older room tab changing clothes must not overwrite rewards from the care tab.
 page.evaluate('document.getElementById("wardrobe-panel").hidden=false');page.locator('[data-wear="peach"]').click();page.wait_for_function('document.querySelector(".cat-character").dataset.outfit==="peach"')
 data=page.evaluate('JSON.parse(localStorage.getItem("popaProgressV1"))');assert data['wallet']['coins']==43;assert data['inventory']=={'strawberry':3};assert data['story']['npcs']['milli']['met'];assert data['story']['firstCake']['status']=='active';assert data['farming']['plots']['front']['readyAt']==200
 care.goto('http://localhost:4205/salon.html',wait_until='networkidle');care.wait_for_selector('#loading',state='hidden');assert care.locator('#coins').inner_text()=='43'
 page.reload(wait_until='networkidle');page.wait_for_selector('#loading',state='hidden');assert page.locator('#coins').inner_text()=='43';assert page.locator('.cat-character').get_attribute('data-outfit')=='peach'
 assert page.evaluate('JSON.parse(localStorage.getItem("popaWorldV1")).coins')==43
 assert not errors,errors
 b.close()
print('PASS migration, shared wallet across three screens, durable receipt history, stale-tab outfit changes and retained story/crop/inventory state')
