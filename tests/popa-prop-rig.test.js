const test=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const root=require('node:path').join(__dirname,'..');
const load=p=>JSON.parse(readFileSync(root+'/'+p,'utf8'));
const runtime=import('data:text/javascript;base64,'+Buffer.from(readFileSync(root+'/shared/prop-rig.js','utf8')).toString('base64'));
const rig=load('assets/scenes/salon/props/scissors/assembly.json'),clip=load('assets/scenes/salon/props/scissors/animations/cut.json');
test('the scene and catalog reference the same editable scissors files',async()=>{
 const {validateProp,validateClip}=await runtime;validateProp(rig);validateClip(clip,rig);
 const scene=load('assets/scenes/salon/assembly.json'),entry=load('assets/catalog.json').props.find(p=>p.id===rig.id);
 assert.equal(entry.assembly,scene.scissors.assembly);assert.equal(entry.animation,scene.scissors.animation);
 assert.deepEqual(rig.parts.map(p=>p.position),[[65,90],[65,90],[65,90]]);
});
test('interpolated motion holds its endpoints and the rendered keyframes use the same poses',async()=>{
 const {poseAt,partFrames}=await runtime;
 assert.equal(poseAt(clip,'blade-left',0).rotation,18);assert.equal(poseAt(clip,'blade-left',.19).rotation,0);assert.equal(poseAt(clip,'blade-right',.38).rotation,-18);
 assert.deepEqual(poseAt(clip,'bolt',.1),{x:0,y:0,rotation:0});
 for(const frame of partFrames(clip,'blade-left')){const pose=poseAt(clip,'blade-left',frame.offset*clip.duration);const angle=Number(frame.transform.match(/rotate\(([-\d.e+]+)deg\)/)[1]);assert.ok(Math.abs(angle-pose.rotation)<1e-10);}
});
test('invalid imported structures cannot create cycles, missing tracks, paths or non-finite values',async()=>{
 const {validateProp,validateClip}=await runtime;
 for(const mutate of [r=>r.parts[0].parent='blade-right'&&(r.parts[1].parent='blade-left'),r=>r.parts[0].scale=NaN,r=>r.parts[0].image='../outside.png',r=>r.parts[1].id=r.parts[0].id]){
  const value=structuredClone(rig);mutate(value);assert.throws(()=>validateProp(value));
 }
 for(const mutate of [c=>c.prop='salon.other',c=>c.tracks[0].keys.reverse(),c=>c.duration=.01,c=>c.tracks[0].part='missing']){
  const value=structuredClone(clip);mutate(value);assert.throws(()=>validateClip(value,rig));
 }
});
