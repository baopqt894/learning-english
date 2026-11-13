import test from 'node:test';
import assert from 'node:assert/strict';
import {MAP_BOUNDS,MAP_OBSTACLES,canWalkCampus,findCampusPath,canWalkSegment,campusAreaName} from '../src/lib/campus-map.ts';
import {DISTRICT_STATIONS,NEW_DISTRICT_ZONES,FISH_POND,SWIMMING_POOL,LIVESTOCK_PENS,BALANCE_END} from '../src/lib/campus-districts-layout.ts';
import {sculptCadetHead,sculptCadetHair,sculptLoft} from '../src/lib/cadet-sculpt.ts';
test('broad-phase collision matches every solid footprint, including cell boundaries',()=>{
  const reference=(x,z)=>x>MAP_BOUNDS.minX&&x<MAP_BOUNDS.maxX&&z>MAP_BOUNDS.minZ&&z<MAP_BOUNDS.maxZ&&!MAP_OBSTACLES.some(b=>Math.abs(x-b.x)<b.w/2+.4&&Math.abs(z-b.z)<b.d/2+.4);
  for(let i=0;i<6000;i++){const x=MAP_BOUNDS.minX+(i*1.718)%(MAP_BOUNDS.maxX-MAP_BOUNDS.minX),z=MAP_BOUNDS.minZ+(i*2.419)%(MAP_BOUNDS.maxZ-MAP_BOUNDS.minZ);assert.equal(canWalkCampus(x,z),reference(x,z),`${x},${z}`);}
  for(const b of MAP_OBSTACLES)for(const x of [b.x-b.w/2-.4,b.x+b.w/2+.4])assert.equal(canWalkCampus(x,b.z),reference(x,b.z));
});
test('all practice positions connect to all districts, with dry, solid water boundaries',()=>{
  for(const s of [...DISTRICT_STATIONS,{id:'balance-exit',...BALANCE_END}])for(const zone of NEW_DISTRICT_ZONES){const path=findCampusPath(zone,s);assert.ok(path.length,`${zone.id} → ${s.id}`);let previous=zone;for(const p of path){assert.ok(canWalkSegment(previous,p));previous=p;}}
  for(const water of [FISH_POND,SWIMMING_POOL])assert.equal(canWalkCampus(water.x,water.z),false);
  for(const pen of LIVESTOCK_PENS)assert.equal(canWalkCampus(pen.x,pen.z),false);
  assert.equal(campusAreaName({x:75,z:38}),'Khu chăn nuôi');assert.equal(campusAreaName(BALANCE_END),'Sân tập');
});
test('sculpted head and hair have finite, continuous geometry with a visible swept fringe',()=>{
  const head=sculptCadetHead(),hair=sculptCadetHair(),leg=sculptLoft([{y:0,x:.08,z:.08},{y:-.4,x:.06,z:.06}]);
  for(const geo of [head,hair,leg]){for(const key of ['position','normal','uv'])for(const v of geo.attributes[key].array)assert.ok(Number.isFinite(v));geo.computeBoundingBox();assert.ok(geo.boundingBox.max.y>geo.boundingBox.min.y);}
  // The front hair extends past the forehead, rather than disappearing inside it.
  assert.ok(hair.boundingBox.max.z>.2);assert.ok(head.boundingBox.max.y-head.boundingBox.min.y<.5);
  const normals=leg.attributes.normal,positions=leg.attributes.position;let outward=0;for(let i=0;i<positions.count;i++)outward+=positions.getX(i)*normals.getX(i)+positions.getZ(i)*normals.getZ(i);assert.ok(outward>0,'Descending limb profiles need outward normals');
  for(const geo of [head,hair,leg])geo.dispose();
});

test('rooms and districts gain usable floor area without enlarging ordinary desks or the player',async()=>{
 const {EXPANSION_BUILDINGS,ROOM_FURNITURE,DORM_EXTRA_BEDS}=await import('../src/lib/campus-map.ts');
 const {FARM_LAYOUT}=await import('../src/lib/campus-spaces.ts');
 for(const b of EXPANSION_BUILDINGS.filter(b=>b.kind==='classroom'))assert.ok(b.w*b.d>=150);
 const dorm=EXPANSION_BUILDINGS.find(b=>b.kind==='housing'&&b.z===0);assert.ok(dorm.w*dorm.d>=120);assert.ok(DORM_EXTRA_BEDS.length>=3);
 assert.ok(ROOM_FURNITURE.filter(f=>f.kind==='classroom').length>=16);assert.ok(ROOM_FURNITURE.every(f=>f.kind==='stage'||f.w<=2.6));
 assert.ok(SWIMMING_POOL.w*SWIMMING_POOL.d>=480);assert.ok((FARM_LAYOUT.bounds.maxX-FARM_LAYOUT.bounds.minX)*(FARM_LAYOUT.bounds.maxZ-FARM_LAYOUT.bounds.minZ)>470);
});
