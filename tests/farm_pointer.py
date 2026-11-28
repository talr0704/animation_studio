def water_first_plot(page):
 tool=page.locator('#farm-watering-can');tool.wait_for(state='visible');box=tool.bounding_box();target=page.locator('#farm-water-target').bounding_box()
 page.mouse.move(box['x']+65,box['y']+45);page.mouse.down()
 for zone in range(3):
  page.mouse.move(target['x']+target['width']*(zone+.5)/3-81,target['y']-112)
  page.clock.run_for(1100)
 page.mouse.up()

def water_first_plot_keyboard(page):
 tool=page.locator('#farm-watering-can');tool.focus();target=page.locator('#farm-water-target').bounding_box();scene=page.locator('.strawberry-garden').bounding_box()
 desired_y=target['y']-scene['y']-157
 for zone in range(3):
  desired_x=target['x']-scene['x']+target['width']*(zone+.5)/3-146
  for field,goal,positive,negative in [('left',desired_x,'ArrowRight','ArrowLeft'),('top',desired_y,'ArrowDown','ArrowUp')]:
   current=tool.evaluate('(e,field)=>parseFloat(e.style[field])',field)
   steps=round((goal-current)/14)
   for _ in range(abs(steps)):page.keyboard.press(positive if steps>0 else negative)
  page.keyboard.down('Space');page.clock.run_for(1100);page.keyboard.up('Space')
 page.keyboard.press('Escape')

def water_first_plot_touch(page):
 tool=page.locator('#farm-watering-can').bounding_box();target=page.locator('#farm-water-target').bounding_box();session=page.context.new_cdp_session(page)
 session.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':tool['x']+65,'y':tool['y']+45,'id':1}]})
 for zone in range(3):
  session.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':target['x']+target['width']*(zone+.5)/3-81,'y':target['y']-112,'id':1}]})
  page.clock.run_for(1100)
 session.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]});session.detach()
