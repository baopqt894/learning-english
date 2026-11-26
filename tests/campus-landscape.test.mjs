import assert from 'node:assert/strict';
import test from 'node:test';
import { landscapeObstacles,nurseryPens,shadeGardens,toolStations } from '../src/lib/campus-landscape-layout.ts';
import { CAMPUS_TREES } from '../src/lib/campus-spaces.ts';
import { DISTRICT_PATHS,DISTRICT_STATIONS } from '../src/lib/campus-districts-layout.ts';
import { canWalkCampus,findCampusPath,campusAreaName } from '../src/lib/campus-map.ts';

const overlaps=(a,b)=>Math.abs(a.x-b.x)<(a.w+b.w)/2 && Math.abs(a.z-b.z)<(a.d+b.d)/2;
test('campus planting and solid props leave the paths and animal feeding stations accessible',()=>{
  for(const prop of landscapeObstacles){
    assert.equal(canWalkCampus(prop.x,prop.z),false);
    assert.ok(!DISTRICT_PATHS.some(path=>overlaps(path,prop)),JSON.stringify(prop));
  }
  for(const s of DISTRICT_STATIONS)assert.ok(findCampusPath({x:0,z:0},s).length,s.id);
  for(const s of [...toolStations,...nurseryPens,...shadeGardens.map(p=>({...p,w:7.7,d:4.95}))]){
    assert.ok(!CAMPUS_TREES.some(t=>overlaps(s,{...t,w:.8,d:.8})),JSON.stringify(s));
  }
  assert.equal(campusAreaName({x:75,z:55}),'Khu chăn nuôi');
  assert.ok(canWalkCampus(75,58),'The central nursery path is walkable');
});
