import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {canWalkSegment,EXPANSION_BUILDINGS,MAP_OBSTACLES} from '../src/lib/campus-map.ts';
import {courtEquipment,PARK_COURTS,parkPaths} from '../src/lib/recreation-park.ts';
import {languageFurniture} from '../src/lib/learning-room-layout.ts';

test('sideline equipment leaves playing surfaces and meeting paths free',()=>{
  for(const object of courtEquipment){
    assert.ok(MAP_OBSTACLES.includes(object));
    for(const area of [...PARK_COURTS,...parkPaths])
      assert.ok(Math.abs(object.x-area.x)>=(object.w+area.w)/2 || Math.abs(object.z-area.z)>=(object.d+area.d)/2,object.unit);
  }
});
test('the speaking lab has room for parallel approaches from its doorway',()=>{
  const b=EXPANSION_BUILDINGS.find(room=>room.kind==='language');
  for(const dx of [-.8,0,.8])assert.ok(canWalkSegment({x:b.x+dx,z:b.z+b.d/2+1},{x:b.x+dx,z:b.z-2.5}));
  for(const f of languageFurniture)assert.ok(MAP_OBSTACLES.some(o=>o.x===b.x+f.x&&o.z===b.z+f.z&&o.w===f.w));
});
test('the supplied furniture ships with the source colour atlas and bounded mesh sizes',()=>{
  const file=readFileSync(new URL('../public/models/environment/school-props.glb',import.meta.url));
  const asset=JSON.parse(file.subarray(20,20+file.readUInt32LE(12)));
  assert.ok(file.length<2*1024*1024);
  assert.equal(asset.meshes.length,12);
  assert.equal(asset.images[0].mimeType,'image/jpeg');
  for (const mesh of asset.meshes){
    const p=mesh.primitives[0];
    assert.ok(p.attributes.TEXCOORD_0!==undefined);
    assert.ok(asset.accessors[p.indices].count<=6600);
  }
});
