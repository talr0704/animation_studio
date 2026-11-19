const test=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync,existsSync}=require('node:fs');
const {join}=require('node:path');
const root=join(__dirname,'..');
const read=path=>JSON.parse(readFileSync(join(root,path),'utf8'));
test('catalog has unique stable IDs and every declared asset and assembly exists',()=>{
 const catalog=read('assets/catalog.json'),ids=new Set();
 for(const entry of [...catalog.characters,...catalog.scenes,...catalog.props]){
  assert.ok(!ids.has(entry.id),entry.id);ids.add(entry.id);
  for(const path of [entry.assembly,entry.animations,entry.animation,entry.rig,entry.sceneAssembly,...(entry.images??[])].filter(Boolean))assert.ok(existsSync(join(root,path)),path);
  if(entry.assemblyKey)assert.ok(read(entry.sceneAssembly)[entry.assemblyKey],entry.id);
 }
});
test('every migrated source asset has a canonical destination',()=>{
 const mapping=read('source-art/migration-map.json');
 assert.ok(Object.keys(mapping).length>100);
 for(const [old,path]of Object.entries(mapping)){
  assert.ok(existsSync(join(root,path)),`${old} -> ${path}`);
  assert.ok(!existsSync(join(root,old)),`obsolete duplicate ${old}`);
 }
});
