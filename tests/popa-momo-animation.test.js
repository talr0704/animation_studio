const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const root='assets/characters/momo/',rig=JSON.parse(fs.readFileSync(root+'assembly.json','utf8')),clips=JSON.parse(fs.readFileSync(root+'animations/studio-drafts.json','utf8')),parts=rig.layersBackToFront.map(p=>p.file.split('/').at(-1).replace('.png','')).concat('robot');
const runtime=import('../studio/momo-animation.js');
test('all seven approved Momo motions are valid and preserve user motion keys',async()=>{
 const {validateMomoAnimations}=await runtime;validateMomoAnimations(clips,parts);assert.equal(Object.keys(clips).length,7);
 for(const clip of Object.values(clips)){
  assert.ok(clip.keyframes.some(k=>k.time>0&&k.time<clip.duration&&(k.values.rotate!==0||k.values.y!==0||k.values.scaleY!==1)));
 }
 const corrected=JSON.parse(fs.readFileSync('source-art/characters/momo/animations/user-corrected.json','utf8'));for(const [id,clip]of Object.entries(clips)){assert.deepEqual(clip.keyframes,corrected[id].keyframes);assert.equal(clip.duration,corrected[id].duration);assert.equal(clip.loop,corrected[id].loop);}
 const review=JSON.parse(fs.readFileSync(root+'animations/review.json','utf8'));assert.deepEqual(JSON.parse(fs.readFileSync(root+'animations/approved.json','utf8')),clips);assert.equal(review.status,'approved');assert.equal(review.gameEnabled,true);assert.deepEqual(review.approvedClips,Object.keys(clips));
});
test('animation import rejects foreign parts, invalid scales and invalid time ranges',async()=>{
 const {validateMomoAnimations}=await runtime;
 for(const mutate of [c=>c.idle.keyframes[0].part='left_arm',c=>c.idle.keyframes[0].values.scaleY=-1,c=>c.idle.keyframes[0].time=99,c=>c.idle.name='<script>',c=>c.idle.keyframes[0].values.x=NaN]){
  const value=structuredClone(clips);mutate(value);assert.throws(()=>validateMomoAnimations(value,parts));
 }
});

test('happy, smiling and resting clips use painted expressions held at exact times',async()=>{
 const {expressionAt,validateExpressions}=await import('../studio/momo-expressions.js');
 assert.deepEqual(expressionAt(clips.happy,.5),{eyes:'happy',beak:'smile'});assert.deepEqual(expressionAt(clips.rest,1.5),{eyes:'closed',beak:'closed'});assert.deepEqual(expressionAt(clips.idle,1.16),{eyes:'closed',beak:'closed'});assert.equal(expressionAt(clips.talk,.6).eyes,'happy');
 assert.deepEqual(expressionAt(clips.happy,clips.happy.duration),{eyes:'open',beak:'closed'});
 for(const mutate of [c=>c.expressions[0].eyes='wrong',c=>c.expressions[0].time=99,c=>c.expressions.reverse()]){const c=structuredClone(clips.happy);mutate(c);assert.throws(()=>validateExpressions(c));}
});
