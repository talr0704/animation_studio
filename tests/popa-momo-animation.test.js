const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const root='assets/characters/momo/',rig=JSON.parse(fs.readFileSync(root+'assembly.json','utf8')),clips=JSON.parse(fs.readFileSync(root+'animations/studio-drafts.json','utf8')),parts=rig.layersBackToFront.map(p=>p.file.split('/').at(-1).replace('.png','')).concat('robot');
const runtime=import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync('studio/momo-animation.js','utf8').replace(/^import[^\n]+\n/,'')).toString('base64'));
test('all seven Momo motions are valid drafts with complete neutral endpoints',async()=>{
 const {validateMomoAnimations}=await runtime;validateMomoAnimations(clips,parts);assert.equal(Object.keys(clips).length,7);
 for(const clip of Object.values(clips)){
  const pose=t=>Object.fromEntries(clip.keyframes.filter(k=>k.time===t).map(k=>[k.part,k.values]));
  assert.deepEqual(pose(0),pose(clip.duration));assert.equal(Object.keys(pose(0)).length,parts.length);
  assert.ok(clip.keyframes.some(k=>k.time>0&&k.time<clip.duration&&(k.values.rotate!==0||k.values.y!==0||k.values.scaleY!==1)));
 }
 const review=JSON.parse(fs.readFileSync(root+'animations/review.json','utf8'));assert.equal(review.status,'draft');assert.equal(review.gameEnabled,false);assert.deepEqual(review.approvedClips,[]);
});
test('animation import rejects foreign parts, invalid scales and invalid time ranges',async()=>{
 const {validateMomoAnimations}=await runtime;
 for(const mutate of [c=>c.idle.keyframes[0].part='left_arm',c=>c.idle.keyframes[0].values.scaleY=-1,c=>c.idle.keyframes[0].time=99,c=>c.idle.name='<script>',c=>c.idle.keyframes[0].values.x=NaN]){
  const value=structuredClone(clips);mutate(value);assert.throws(()=>validateMomoAnimations(value,parts));
 }
});
