const test=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync,existsSync}=require('node:fs');
const {join}=require('node:path');
const root=join(__dirname,'..'),scene='assets/scenes/manicure/';
const json=p=>JSON.parse(readFileSync(join(root,p),'utf8'));
function pngSize(path){const data=readFileSync(join(root,path));assert.equal(data.toString('hex',0,8),'89504e470d0a1a0a',path);return [data.readUInt32BE(16),data.readUInt32BE(20)];}
test('uploaded manicure files have unique canonical destinations and no obsolete asset folders',()=>{
 const map=json('source-art/manicure/migration-map.json');assert.ok(Object.keys(map).length>=98);assert.equal(new Set(Object.values(map)).size,Object.keys(map).length);
 for(const [old,path]of Object.entries(map)){assert.ok(existsSync(join(root,path)),path);assert.ok(!existsSync(join(root,old)),old);}
});
test('all nail stages, masks and overlays share the calibrated frame and four paw anchors are valid',()=>{
 const assembly=json(scene+'assembly.json');assert.deepEqual(assembly.frame,[256,384]);assert.equal(assembly.paw.nails.length,4);
 for(const n of assembly.paw.nails){assert.ok(n.center[0]>0&&n.center[0]<546&&n.center[1]>0&&n.center[1]<1360);assert.ok(n.size.every(v=>v>0));assert.ok(Number.isFinite(n.rotation));}
 for(const shape of ['broken','partly-repaired','clean'])for(const dir of ['states','masks'])assert.deepEqual(pngSize(scene+`nails/${dir}/${shape}.png`),assembly.frame);
 for(const overlay of ['old-polish','dirt','shine'])assert.deepEqual(pngSize(scene+`nails/overlays/${overlay}.png`),assembly.frame);
});
test('all six polish rigs have separate back, brush and front PNGs',()=>{
 const rigs=json(scene+'props/nail-polish/rig.json');assert.equal(rigs.length,6);
 for(const r of rigs){assert.deepEqual(r.layer_order,['bottle_back','cap_stem_brush','bottle_front']);for(const part of ['bottle-back','brush','bottle-front'])assert.ok(pngSize(scene+`props/nail-polish/colors/${r.color}/${part}.png`).every(v=>v>0));assert.ok(r.lift_pixels>0);}
});
