const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const clips=JSON.parse(fs.readFileSync('assets/characters/momo/animations/approved.json'));
const rig=JSON.parse(fs.readFileSync('assets/characters/momo/assembly.json'));
test('runtime preserves every approved authored pose at its timestamp',async()=>{
 const {sampleMotion,baseMotionPoses}=await import('../shared/momo-motion.js');
 const base=baseMotionPoses(rig);
 for(const clip of Object.values(clips))for(const part of Object.keys(base)){
  const keys=clip.keyframes.filter(k=>k.part===part).sort((a,b)=>a.time-b.time);
  for(const key of keys){const pose=sampleMotion(keys,clip,key.time,base[part]);for(const field in key.values)assert.ok(Math.abs(pose[field]-key.values[field])<1e-8,`${clip.name} ${part} ${key.time} ${field}`);}
 }
});
test('hold frames and sine interpolation match the studio without changing keys',async()=>{
 const {motionEase,sampleMotion}=await import('../shared/momo-motion.js');
 assert.equal(motionEase('none',.999),0);assert.equal(motionEase('none',1),1);assert.ok(Math.abs(motionEase('sine.inOut',.5)-.5)<1e-8);
 const a=clips.wave.keyframes[0],b=structuredClone(a);b.time=1;b.ease='sine.inOut';b.values.x+=20;
 const pose=sampleMotion([{...a,time:0},b],{loop:false,duration:1},.5,a.values);assert.ok(Math.abs(pose.x-a.values.x-10)<1e-8);
 assert.deepEqual(sampleMotion([],{loop:false,duration:1},0,a.values),a.values);
});
