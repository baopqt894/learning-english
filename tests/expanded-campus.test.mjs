import test from 'node:test';
import assert from 'node:assert/strict';
import {MAP_BOUNDS,MAP_OBSTACLES,canWalkCampus,findCampusPath,canWalkSegment,campusAreaName} from '../src/lib/campus-map.ts';
import {DISTRICT_STATIONS,NEW_DISTRICT_ZONES,FISH_POND,SWIMMING_POOL,LIVESTOCK_PENS,BALANCE_END} from '../src/lib/campus-districts-layout.ts';
import {sculptCadetHead,sculptCadetHair,sculptLoft} from '../src/lib/cadet-sculpt.ts';
import {DORMITORY_B,DORMITORY_CLEAR,DORMITORY_LAYOUT,DORMITORY_CHAIRS,DORMITORY_DUTY,dormitoryPoint} from '../src/lib/dormitory-layout.ts';
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
 const {EXPANSION_BUILDINGS,ROOM_FURNITURE}=await import('../src/lib/campus-map.ts');
 const {FARM_LAYOUT}=await import('../src/lib/campus-spaces.ts');
 for(const b of EXPANSION_BUILDINGS.filter(b=>b.kind==='classroom'))assert.ok(b.w*b.d>=150);
 assert.ok(EXPANSION_BUILDINGS.includes(DORMITORY_B));
 assert.ok(ROOM_FURNITURE.filter(f=>f.kind==='classroom').length>=16);assert.ok(ROOM_FURNITURE.every(f=>f.kind==='stage'||f.w<=(f.kind==='dining'?3.5:2.6)));
 assert.ok(SWIMMING_POOL.w*SWIMMING_POOL.d>=480);assert.ok((FARM_LAYOUT.bounds.maxX-FARM_LAYOUT.bounds.minX)*(FARM_LAYOUT.bounds.maxZ-FARM_LAYOUT.bounds.minZ)>470);
});

test('dormitory B fits the approved floor plan and all beds, study seats and duty stations are reachable',()=>{
  const {bunks,bookShelves,lockers}=DORMITORY_LAYOUT;
  assert.equal(DORMITORY_CLEAR.width,15.8);
  assert.equal(DORMITORY_CLEAR.depth,9.8);
  assert.equal(bunks.length,4);
  assert.equal(DORMITORY_CHAIRS.length,8);
  for(const bunk of bunks)assert.equal(bunk.z-bunk.d/2,-DORMITORY_CLEAR.depth/2);
  assert.equal((bookShelves[1].x-bookShelves[0].x-bookShelves[0].d).toFixed(2),'2.33');
  const spawn={x:0,z:6};
  const stops=[
    ...bunks.map(bunk=>dormitoryPoint(bunk.x+.29,bunk.z+1.99)),
    ...DORMITORY_CHAIRS.map(chair=>dormitoryPoint(chair.x,chair.z+chair.d/2+.42)),
    ...lockers.map(locker=>dormitoryPoint(locker.x,locker.z+locker.d/2+.49)),
    ...Object.values(DORMITORY_DUTY).flat().map(station=>station.approach),
  ];
  for(const stop of stops){
    for(const [from,to] of [[spawn,stop],[stop,spawn]]){
      const route=findCampusPath(from,to);
      assert.deepEqual(route.at(-1),to);
      for(const [index,point] of route.entries())assert.ok(canWalkSegment(route[index-1]??from,point));
    }
  }
});
