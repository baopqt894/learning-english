import test from 'node:test';
import assert from 'node:assert/strict';
import {FARM_LAYOUT,FARM_OBSTACLES,SPORTS_FIELD,PERGOLA,READING_PLANTERS,CAMPUS_BENCHES} from '../src/lib/campus-spaces.ts';
import {EXPLORATION_ZONES,EXPANSION_BUILDINGS,campusAreaName,canWalkCampus,canWalkSegment,findCampusPath} from '../src/lib/campus-map.ts';
import {WORK_STATIONS} from '../src/lib/fieldwork.ts';
const overlap=(a,b)=>Math.abs(a.x-b.x)<(a.w+b.w)/2&&Math.abs(a.z-b.z)<(a.d+b.d)/2;
test('vegetable garden is a separate district with a real, collision-aware gate',()=>{
 const f=FARM_LAYOUT;assert.equal(EXPLORATION_ZONES.find(z=>z.id==='vegetable-garden').english,'Vegetable garden');
 assert.equal(canWalkCampus(f.bounds.maxX,f.gate.z),false);assert.equal(canWalkCampus(24,f.bounds.minZ),false);assert.equal(canWalkCampus(24,f.bounds.maxZ),false);
 assert.ok(canWalkSegment(f.gate.approach,{x:18,z:f.gate.z}));
 assert.ok(findCampusPath(f.gate.approach,{x:17.8,z:36.4}).length,'The open shed aisle must connect to the entrance');
 assert.ok(f.bounds.minZ>SPORTS_FIELD.z+SPORTS_FIELD.d/2);assert.ok(f.gate.height-f.gate.headerHeight/2>2.35);
 for(const s of WORK_STATIONS.filter(s=>s.kind==='garden')){assert.ok(s.x>f.bounds.minX&&s.x<f.bounds.maxX);assert.ok(s.z>f.bounds.minZ&&s.z<f.bounds.maxZ);assert.ok(findCampusPath(f.gate.approach,s.approach).length,s.id);assert.equal(campusAreaName(s.approach),'Khu tăng gia');}
});
test('mission positions and collision footprints are derived from the same garden layout',()=>{
 const f=FARM_LAYOUT;for(let i=0;i<3;i++){const s=WORK_STATIONS.find(s=>s.id===`bed-${i}`);assert.deepEqual(s.approach,f.beds[i].approach);assert.equal(s.x,f.beds[i].x);assert.equal(s.z,f.beds[i].z);assert.ok(FARM_OBSTACLES.includes(f.beds[i]));if(i)assert.ok(f.beds[i].x-f.beds[i-1].x-f.beds[i].w>=1.2);}
 assert.deepEqual(WORK_STATIONS.find(s=>s.id==='tap').approach,f.tap.approach);
});
test('reading benches do not intersect planters and pergola does not intersect pavilion roof',()=>{
 for(const b of CAMPUS_BENCHES)for(const p of READING_PLANTERS)assert.equal(overlap({...b,w:b.angle?.8:2.2,d:b.angle?2.2:.8},p),false);
 const pavilion=EXPANSION_BUILDINGS.find(b=>b.kind==='pavilion');assert.ok(PERGOLA.centerZ+PERGOLA.depth/2<pavilion.z-pavilion.d/2-.3);
});

test('circulation forms one connected network and never cuts through buildings, the pitch or crop beds',async()=>{
 const {DISTRICT_PATHS}=await import('../src/lib/campus-districts-layout.ts');
 const {CORE_BUILDINGS}=await import('../src/lib/campus-map.ts');
 const protectedFootprints=[...CORE_BUILDINGS,...EXPANSION_BUILDINGS,SPORTS_FIELD,...FARM_LAYOUT.beds,...FARM_LAYOUT.reserve];
 for(const [i,path] of DISTRICT_PATHS.entries())for(const solid of protectedFootprints){
  assert.equal(Math.abs(path.x-solid.x)<(path.w+solid.w)/2-1e-6&&Math.abs(path.z-solid.z)<(path.d+solid.d)/2-1e-6,false,`Path ${i} crosses a protected area`);
 }
 const network=[...DISTRICT_PATHS,{x:0,z:1.8,w:28,d:16.6}],seen=new Set([0]),queue=[0];
 while(queue.length){const a=network[queue.shift()];for(let i=0;i<network.length;i++)if(!seen.has(i)){
  const b=network[i];if(Math.abs(a.x-b.x)<=(a.w+b.w)/2+.001&&Math.abs(a.z-b.z)<=(a.d+b.d)/2+.001){seen.add(i);queue.push(i);}
 }}
 assert.equal(seen.size,network.length,`Disconnected paths: ${network.map((_,i)=>i).filter(i=>!seen.has(i)).join(', ')}`);
 assert.ok(FARM_LAYOUT.beds.every(b=>b.w*b.d>=17));
 assert.ok(FARM_LAYOUT.reserve.filter(b=>b.d>=5).length>=3);
});
