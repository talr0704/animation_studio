"""Approved motion follows actual dialogue, pauses off-room, and respects reduced motion."""
from playwright.sync_api import sync_playwright

URL='http://localhost:4205/'
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 for reduced in ['no-preference','reduce']:
  page=b.new_page(viewport={'width':1440,'height':1000},reduced_motion=reduced)
  page.clock.install();errors=[];requests=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.on('request',lambda r:requests.append(r.url))
  page.goto(URL+'game.html',wait_until='networkidle');page.wait_for_selector('#loading',state='hidden')
  actor=page.locator('[data-character="momo"]')
  assert actor.count()==1
  assert actor.get_attribute('data-action')=='idle'
  assert any('approved.json' in url for url in requests)
  assert not any('studio-drafts.json' in url for url in requests)
  before=actor.locator('[data-motion-part="head"]').get_attribute('style')
  page.clock.run_for(700)
  after=actor.locator('[data-motion-part="head"]').get_attribute('style')
  if reduced=='no-preference':assert before!=after
  else:assert before==after
  page.locator('#milli-npc').click()
  for _ in range(120):
   page.clock.run_for(100)
   if page.locator('#story-dialog').is_visible():break
  assert page.locator('#story-avatar [data-character="momo"]').count()==1
  assert actor.get_attribute('data-action')==('wave' if reduced=='no-preference' else 'talk')
  page.clock.run_for(2500)
  assert actor.get_attribute('data-action')=='talk'
  page.get_by_role('button',name='נעים להכיר! מה אפשר לעשות כאן?',exact=True).click()
  page.get_by_role('button',name='מה נצטרך לעשות?',exact=True).click()
  assert actor.get_attribute('data-action')==('curious' if reduced=='no-preference' else 'talk')
  page.get_by_role('button',name='אני מצטרפת!',exact=True).click()
  if reduced=='no-preference':
   assert actor.get_attribute('data-action')=='happy'
   page.clock.run_for(500)
   assert actor.locator('[data-character-part="eye_open_left"]').get_attribute('data-expression')=='happy'
  page.keyboard.press('Escape')
  assert page.locator('#milli-npc [data-character="momo"]').count()==1
  assert actor.get_attribute('data-action')=='idle'
  assert actor.locator('[data-character-part="brow_left"]').evaluate('(e)=>e.style.visibility')=='hidden'
  page.clock.run_for(24100)
  assert actor.get_attribute('data-action')=='rest'
  page.locator('#garden-tab').click()
  time=actor.get_attribute('data-motion-time');page.clock.run_for(1500)
  assert actor.get_attribute('data-motion-time')==time
  page.locator('#dialog-secondary').click()
  assert actor.get_attribute('data-action')=='idle'
  page.locator('#edit-room').click();time=actor.get_attribute('data-motion-time');page.clock.run_for(1500)
  assert actor.get_attribute('data-motion-time')==time
  page.locator('#room-edit-done').click()
  assert actor.get_attribute('data-action')=='idle'
  page.screenshot(path='/tmp/momo-integrated-'+reduced+'.png')
  assert not errors,errors
  page.close()
 b.close()
print('PASS approved snapshot, idle/wave/talk/curious/happy/rest, expressions, single live actor, pause and reduced motion')
