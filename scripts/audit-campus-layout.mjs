import {DISTRICT_STATIONS, DISTRICT_OBSTACLES, DISTRICT_PATHS, BALANCE_END} from '../src/lib/campus-districts-layout.ts';
import {writeFileSync} from 'node:fs';
import {FARM_LAYOUT,FARM_FENCES,FARM_OBSTACLES,SPORTS_FIELD,READING_PLANTERS,PERGOLA,CAMPUS_BENCHES,CAMPUS_TREES} from '../src/lib/campus-spaces.ts';
import {WORK_STATIONS} from '../src/lib/fieldwork.ts';
import {EXPLORATION_ZONES,MAP_BOUNDS,CORE_BUILDINGS,EXPANSION_BUILDINGS,MAP_OBSTACLES,canWalkCampus,canWalkSegment,findCampusPath} from '../src/lib/campus-map.ts';
import {PLACES} from '../src/lib/game.ts';
const failures=[];
const check=(ok,message)=>{if(!ok)failures.push(message);};
const overlaps=(a,b)=>Math.abs(a.x-b.x)<(a.w+b.w)/2-1e-6&&Math.abs(a.z-b.z)<(a.d+b.d)/2-1e-6;
const f=FARM_LAYOUT;
const farmBox={x:(f.bounds.minX+f.bounds.maxX)/2,z:(f.bounds.minZ+f.bounds.maxZ)/2,w:f.bounds.maxX-f.bounds.minX,d:f.bounds.maxZ-f.bounds.minZ};
check(!overlaps(farmBox,SPORTS_FIELD),'Farm overlaps sports pitch');
for(const b of [...EXPANSION_BUILDINGS,...READING_PLANTERS])check(!overlaps(farmBox,b),'Farm overlaps reading garden or building');
const physical=[...f.beds,...f.reserve,{...f.tap,w:.9,d:.7},f.tools,f.harvest,f.waterStore,f.nursery,f.compost,f.potting,f.frontBorder,...f.climbers,...f.helpers];
for(let i=0;i<physical.length;i++){
 const a=physical[i];check(a.x-a.w/2>f.bounds.minX&&a.x+a.w/2<f.bounds.maxX&&a.z-a.d/2>f.bounds.minZ&&a.z+a.d/2<f.bounds.maxZ,`Farm object ${i} crosses its fence`);
 for(let j=i+1;j<physical.length;j++)check(!overlaps(a,physical[j]),`Farm objects ${i}/${j} overlap`);
}
const gaps=f.beds.slice(1).map((b,i)=>b.x-f.beds[i].x-(b.w+f.beds[i].w)/2);
check(gaps.every(g=>g>=1.2),'Training-bed aisles narrower than 1.2 m');
check(f.gate.width>=2.4,'Farm gate is too narrow');
check(f.gate.height-f.gate.headerHeight/2>2.64,'Gate header clips cadet cap');
check(canWalkSegment(f.gate.approach,{x:18,z:f.gate.z}),'Farm gate passage blocked');
check(!canWalkCampus(f.bounds.maxX,f.gate.z),'East fence is walk-through');
check(!canWalkCampus(24,f.bounds.minZ),'North fence is walk-through');
check(!canWalkCampus(24,f.bounds.maxZ),'South fence is walk-through');
const pavilion=EXPANSION_BUILDINGS.find(b=>b.kind==='pavilion');
check(PERGOLA.centerZ+PERGOLA.depth/2<pavilion.z-pavilion.d/2-.3,'Pergola overlaps pavilion roof');
for(const b of CAMPUS_BENCHES){const footprint={...b,w:b.angle?.8:2.2,d:b.angle?2.2:.8};for(const p of READING_PLANTERS)check(!overlaps(footprint,p),'Reading bench overlaps flower bed');check(!overlaps(footprint,farmBox),'Bench intrudes into farm');}
const buildings=[...CORE_BUILDINGS,...EXPANSION_BUILDINGS];
for(const [i,road] of DISTRICT_PATHS.entries()){
 for(const b of buildings)check(!overlaps(road,b),`Circulation path ${i} crosses a building`);
 check(!overlaps(road,SPORTS_FIELD),`Circulation path ${i} crosses the football pitch`);
 for(const bed of [...f.beds,...f.reserve])check(!overlaps(road,bed),`Circulation path ${i} crosses a vegetable bed`);
}
for(let i=0;i<buildings.length;i++)for(let j=i+1;j<buildings.length;j++)check(!overlaps(buildings[i],buildings[j]),`Building footprints ${i}/${j} overlap`);
for(const tree of CAMPUS_TREES){const trunk={...tree,w:.65*tree.scale,d:.65*tree.scale};for(const b of buildings)check(!overlaps(trunk,b),'Tree trunk intersects building');check(!overlaps(trunk,SPORTS_FIELD),'Tree trunk intrudes into pitch');check(!overlaps(trunk,farmBox),'Tree trunk intrudes into farm');}
for(const bench of CAMPUS_BENCHES){const footprint={...bench,w:bench.angle?.8:2.2,d:bench.angle?2.2:.8};for(const b of buildings)check(!overlaps(footprint,b),'Bench intersects building');}
const points=[{name:'spawn',x:0,z:6},{name:'potting-shed',...f.shed.approach},{name:'potting-aisle',x:17.8,z:36.4},...Object.entries(PLACES).map(([id,p])=>({name:id,x:p.position[0],z:p.position[1]+1})),...EXPLORATION_ZONES.map(z=>({name:z.id,x:z.x,z:z.z})),...WORK_STATIONS.map(s=>({name:s.id,...s.approach})),...DISTRICT_STATIONS.map(s=>({name:s.id,x:s.x,z:s.z})),{name:'balance-exit',...BALANCE_END}];
for(const p of points)check(canWalkCampus(p.x,p.z),`${p.name}: blocked destination`);
let routes=0;
for(const a of points)for(const b of points){if(a===b)continue;routes++;const path=findCampusPath(a,b);check(path.length>0,`${a.name} → ${b.name}: no route`);let previous=a;for(const step of path){check(canWalkSegment(previous,step),`${a.name} → ${b.name}: segment crosses obstacle`);previous=step;}}
const report={scope:'Functional campus layout, district markers, farm segregation, furniture footprints, gate/header clearance and navigation between every named destination. Foliage canopy occlusion is visually checked separately; leaves/grass are not collision objects.',playableAreaMetresSquared:(MAP_BOUNDS.maxX-MAP_BOUNDS.minX)*(MAP_BOUNDS.maxZ-MAP_BOUNDS.minZ),roomAreas:EXPANSION_BUILDINGS.map(b=>({name:b.name,width:b.w,depth:b.d,area:b.w*b.d})),zones:EXPLORATION_ZONES.length,workStations:WORK_STATIONS.length,districtPracticeStations:DISTRICT_STATIONS.length,expandedDistrictObstacles:DISTRICT_OBSTACLES.length,namedDestinations:points.length,orderedRoutes:routes,solidFootprints:MAP_OBSTACLES.length,sharedTrees:CAMPUS_TREES.length,circulationPaths:DISTRICT_PATHS.length,productiveBeds:f.beds.length+f.reserve.length,productiveSoilArea:[...f.beds,...f.reserve].reduce((n,b)=>n+b.w*b.d,0),farmAreaMetresSquared:Number((farmBox.w*farmBox.d).toFixed(2)),trainingBedAislesMetres:gaps,gateWidthMetres:f.gate.width,gateHeadClearanceMetres:f.gate.height-f.gate.headerHeight/2-2.64,farmFenceSegments:FARM_FENCES.length,farmSolidObjects:FARM_OBSTACLES.length,failures,passed:failures.length===0};
writeFileSync(new URL('../docs/campus-layout-audit.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));if(failures.length)process.exitCode=1;
