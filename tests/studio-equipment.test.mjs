import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {canWalkSegment,EXPANSION_BUILDINGS,MAP_OBSTACLES} from '../src/lib/campus-map.ts';
import {courtEquipment,PARK_COURTS,parkPaths} from '../src/lib/recreation-park.ts';
import {workshopDisplays,workshopFittings,workshopFixtures,WORKSHOPS} from '../src/lib/workshop-wing.ts';
import {glasshouseEquipment} from '../src/lib/campus-landscape-layout.ts';
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

test('storage racks and rear exhibits fit beside teaching and wash stations',()=>{
  for(const room of WORKSHOPS){
    const furniture=[...workshopDisplays,...workshopFittings,...workshopFixtures].filter(f=>f.kind===room.kind);
    if(room.kind==='plant-lab')furniture.push(...glasshouseEquipment.map(f=>({...f,x:f.x+room.x,z:f.z+room.z})));
    for(const object of furniture.filter(f=>f.unit==='rack'||workshopDisplays.includes(f)))
      for(const other of furniture.filter(f=>f!==object))
        assert.ok(Math.abs(object.x-other.x)>=(object.w+other.w)/2||Math.abs(object.z-other.z)>=(object.d+other.d)/2,room.kind);
  }
});

test('expanded language and computer labs have clear floor space and room-wide activity detection',async()=>{
  const {canWalkCampus,campusAreaName}=await import('../src/lib/campus-map.ts');
  const {roomContainsPlayer}=await import('../src/lib/campus-room-shell.ts');
  const {nearStoryLocation}=await import('../src/lib/campaign-locations.ts');
  for(const [kind,minClearArea] of [['language',335],['computer',210]]){
    const room=EXPANSION_BUILDINGS.find(b=>b.kind===kind);
    let clearArea=0;
    for(let x=room.x-room.w/2+.25;x<room.x+room.w/2;x+=.5){
      for(let z=room.z-room.d/2+.25;z<room.z+room.d/2;z+=.5){
        if(!canWalkCampus(x,z))continue;
        clearArea+=.25;
        assert.equal(campusAreaName({x,z}),kind==='language'?'Phòng ngoại ngữ':'Phòng tin học');
        assert.ok(nearStoryLocation(kind,{x,z})&&roomContainsPlayer(room,{x,z}));
      }
    }
    assert.ok(clearArea>=minClearArea,kind+' accessible floor area');
    for(const dx of [-1.8,0,1.8])assert.ok(canWalkSegment(
      {x:room.x+dx,z:room.z+room.d/2+1},{x:room.x+dx,z:room.z-room.d/2+1.25}),kind+' through aisle');
  }
});
