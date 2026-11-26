import json
from pathlib import Path
manifest=json.load(open('assets/world/catalog.json'));groups={g['id']:g for g in manifest['groups']}
catalog=json.load(open('assets/characters/popa/outfits/catalog.json'));catalog['looks']=[l for l in catalog['looks'] if not l['id'].startswith('uploaded-')]
# The garment pixels remain unchanged; these initial fits can be adjusted in the existing studio.
def add(id,label,g,entries):
 parts=[]
 for role,name,x,y,width,layer,attachment in entries:
  source=next(p for p in groups[g]['parts'] if p['id']==name);w,h=source['size'];parts.append(dict(id=role,asset=source['asset'],naturalSize=[w,h],x=x,y=y,width=width,height=round(width*h/w,3),rotation=0,layer=layer,attachment=attachment,visible=True,locked=False))
 catalog['looks'].append(dict(id='uploaded-'+id,label=label,fittingStatus='initial',parts=parts))
def body(name,kind='shirt'):return (kind+'_body',name,220,350 if kind=='shirt' else 371,185,8,'body')
def sleeve(side,name):return ('sleeve_'+side,name,143 if side=='left' else 297,343,65,9,'left_arm' if side=='left' else 'right_arm')
def hat(name):return ('hat',name,220,43,225,20,'head')
def pants(side,name):return ('pants_'+side,name,191 if side=='left' else 249,419,58,6,'body')
def skirt(name):return ('skirt_body',name,220,410,185,8.1,'body')
g='21-profession-outfits-decorative'
for id,label,entries in [
 ('chef','שפית תות', [hat('chef-hat'),body('chef-shirt'),sleeve('left','chef-sleeve-left'),sleeve('right','chef-sleeve-right'),pants('left','chef-pants-left'),pants('right','chef-pants-right')]),
 ('salon','מעצבת שיער',[hat('salon-bow'),body('salon-dress','dress'),sleeve('left','salon-sleeve-left'),sleeve('right','salon-sleeve-right')]),
 ('tailor','תופרת',[body('tailor-jacket'),sleeve('left','tailor-sleeve-left'),sleeve('right','tailor-sleeve-right'),pants('left','tailor-pants-left'),pants('right','tailor-pants-right')]),
 ('gardener','גננית',[hat('garden-hat'),body('garden-dress','dress'),sleeve('left','garden-sleeve-left'),sleeve('right','garden-sleeve-right')]),
 ('post','שליחת דואר',[hat('post-hat'),body('post-jacket'),skirt('post-skirt'),sleeve('left','post-sleeve-left'),sleeve('right','post-sleeve-right')]),
 ('singer','זמרת',[hat('singer-bow'),body('singer-jacket'),skirt('singer-skirt'),sleeve('left','singer-sleeve-left'),sleeve('right','singer-sleeve-right')])]:add(id,label,g,entries)
g='18-starter-wardrobe'
add('starter-lilac','לילך ומנטה',g,[body('shirt-lilac'),sleeve('left','sleeve-lilac-left'),sleeve('right','sleeve-lilac-right'),pants('left','shorts-left'),pants('right','shorts-right')])
add('starter-cream','שמלת קרם',g,[body('dress-cream','dress'),sleeve('left','sleeve-cream-left'),sleeve('right','sleeve-cream-right')])
add('starter-chef','שפית קלאסית',g,[hat('chef-hat'),body('shirt-yellow'),sleeve('left','sleeve-yellow-left'),sleeve('right','sleeve-yellow-right'),skirt('pinafore-front')])
Path('assets/characters/popa/outfits/catalog.json').write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+'\n')
print('Added 9 looks to the existing game wardrobe and fitting studio')
