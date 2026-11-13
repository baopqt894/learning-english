import { CAMPUS_EXTENT, EXPANDED_TREES } from './campus-districts-layout.ts';
/** Shared spatial truth: rendering, navigation, minimap and layout audit use these coordinates. */
export const FARM_LAYOUT = {
  bounds: {minX:16.8,maxX:39.5,minZ:34.3,maxZ:55.4},
  center: {x:28.15,z:44.85},
  gate: {x:16.8,z:39.0,width:3.2,height:3.5,headerHeight:.6,approach:{x:15,z:39.0}},
  beds: [23,28.5,34].map(x=>({x,z:43.2,w:3.8,d:4.6,approach:{x,z:40.1}})),
  reserve: [...[23,28.5].map(x=>({x,z:36.8,w:3.8,d:2.2})),...[23,28.5,34].map(x=>({x,z:50.2,w:3.8,d:5.8}))],
  tap: {x:33,z:37.5,approach:{x:33,z:38.65},spout:{x:33,y:1.18,z:37.8}},
  tools: {x:18.7,z:35.15,w:2.5,d:.55},
  shed: {x:18.9,z:36.3,w:3.6,d:3.7,height:3.3,approach:{x:18.9,z:38.9}},
  potting: {x:19.85,z:36.25,w:.65,d:1.4},
  harvest: {x:18.9,z:45.5,w:2.3,d:1.05,approach:{x:18.9,z:44.3}},
  waterStore: {x:33,z:35.65,w:2.2,d:1.8},
  compost: {x:37.5,z:36.3,w:.9,d:1.3},
  nursery: {x:21,z:34.95,w:1.2,d:1.15},
  climbers: [{x:24.2,z:34.85,w:2.3,d:.5,kind:'bean'},{x:28.4,z:34.85,w:2.5,d:.5,kind:'tomato'}],
  helpers: [{x:26.2,z:35.05,w:.7,d:.7,kind:'cadet'},{x:19,z:36.35,w:.7,d:.7,kind:'linh'}],
  frontBorder: {x:28.5,z:54.6,w:16,d:.25},
  aisle: {x:27.4,z:39.2,w:19.5,d:1.6},
  sideAisle:{x:19.2,z:46.4,w:1.8,d:13.7},
  tapAccess:{x:32.8,z:38.25,w:1.2,d:1.2},
} as const;
const f=FARM_LAYOUT;
export const FARM_FENCES = [
  {x:(f.bounds.minX+f.bounds.maxX)/2,z:f.bounds.minZ,w:f.bounds.maxX-f.bounds.minX,d:.26},
  {x:(f.bounds.minX+f.bounds.maxX)/2,z:f.bounds.maxZ,w:f.bounds.maxX-f.bounds.minX,d:.26},
  {x:f.bounds.maxX,z:(f.bounds.minZ+f.bounds.maxZ)/2,w:.26,d:f.bounds.maxZ-f.bounds.minZ},
  ...[[f.bounds.minZ,f.gate.z-f.gate.width/2],[f.gate.z+f.gate.width/2,f.bounds.maxZ]].map(([start,end])=>({x:f.bounds.minX,z:(start+end)/2,w:.26,d:end-start})),
];
export const FARM_OBSTACLES = [
  ...f.beds,...f.reserve,...FARM_FENCES,
  {...f.tap,w:.9,d:.7},f.tools,f.harvest,f.waterStore,f.nursery,f.compost,f.potting,f.frontBorder,
  ...f.climbers,...f.helpers,
  // Open-front shed: solid walls, counters and posts, rather than a solid building box.
  {x:f.shed.x,z:f.shed.z-f.shed.d/2,w:f.shed.w,d:.12},
  {x:f.shed.x-f.shed.w/2,z:f.shed.z,w:.12,d:f.shed.d},
  ...[-1,1].map(side=>({x:f.shed.x+side*(f.shed.w/2-.04),z:f.shed.z+f.shed.d/2-.04,w:.14,d:.14})),
  // Both bamboo gate leaves are parked open along the passage sides.
  ...[-1,1].map(side=>({x:f.gate.x+.2,z:f.gate.z+side*(f.gate.width/2+.6),w:.1,d:1.2})),
];
export const SPORTS_FIELD={x:27,z:6,w:22,d:26};
export const READING_PLANTERS=[-10.5,10.5].map(x=>({x,z:23.5,w:4,d:6.6}));
export const PERGOLA={xs:[-4,4],zs:[19.7,21.5],centerZ:20.6,depth:2.4,height:2.85};
export const CAMPUS_BENCHES=[
  {x:-7,z:5.8,angle:0},{x:7,z:5.8,angle:0},{x:-3.7,z:-3,angle:Math.PI/2},
  {x:-18.4,z:8,angle:0},{x:-18.4,z:11,angle:0},
  {x:-7.6,z:24,angle:-Math.PI/2},{x:7.6,z:24,angle:Math.PI/2},
  {x:-5,z:-15.3,angle:0},{x:5,z:-15.3,angle:0},
  {x:40.5,z:12,angle:Math.PI/2},{x:40.5,z:16,angle:Math.PI/2},
];
export const DISTRICT_TREES=[[-39,-20],[-39,-6],[-39,6],[-41,23],[-21,-27],[-18,25],[20,-36],[40,-13],[40.5,24],[-5,29],[5,29],[-9,16],[9,16],[11,28.8]] as const;
export const SITE_STATIC_OBSTACLES=[
  ...READING_PLANTERS,
  ...PERGOLA.xs.flatMap(x=>PERGOLA.zs.map(z=>({x,z,w:.17,d:.17}))),
  ...CAMPUS_BENCHES.map(b=>({x:b.x,z:b.z,w:b.angle? .8:2.2,d:b.angle?2.2:.8})),
  ...DISTRICT_TREES.map(([x,z])=>({x,z,w:.65,d:.65})),
];
export const CORE_TREES=[[-14.5,-9],[-11,-1],[-11,5],[-8,9],[-4.7,9],[4.7,9],[9,8],[11.5,3],[11,-8],[-3.1,-5],[3.1,-5]].map(([x,z],i)=>({x,z,scale:.78+(i%3)*.14,flowering:i===3||i===8}));
export const PERIMETER_TREES=Array.from({length:64},(_,i)=>{const edge=i%4,t=Math.floor(i/4)/15;const x=edge===0?CAMPUS_EXTENT.minX-2:edge===1?CAMPUS_EXTENT.maxX+2:CAMPUS_EXTENT.minX+t*(CAMPUS_EXTENT.maxX-CAMPUS_EXTENT.minX);const z=edge===2?CAMPUS_EXTENT.minZ-2:edge===3?CAMPUS_EXTENT.maxZ+2:CAMPUS_EXTENT.minZ+t*(CAMPUS_EXTENT.maxZ-CAMPUS_EXTENT.minZ);return {x,z,scale:1.25+(i%3)*.18,flowering:i%11===0};});
export const CAMPUS_TREES=[...EXPANDED_TREES,...CORE_TREES,...PERIMETER_TREES,...DISTRICT_TREES.map(([x,z])=>({x,z,scale:.85+(Math.abs(x)%3)*.13,flowering:z>15}))];
export const COURTYARD_PLANTERS=[-10.7,10.7].flatMap(x=>[-.6,6].map(z=>({x,z,w:1.4,d:2.5})));
export const EDGE_PLANTERS=[-12.8,12.8].flatMap(x=>[-1,3,7].map(z=>({x,z,w:.85,d:1.9})));
export const BICYCLE_RACK={xs:Array.from({length:4},(_,i)=>-11+i*.85),z:-12,x:-9.725,w:3.85,d:.55};
export const BLEACHERS=Array.from({length:3},(_,i)=>({x:27,z:22+i*.8,w:20,d:.75,y:.17+i*.28}));
export const SPORT_GOAL_ZS=[SPORTS_FIELD.z-SPORTS_FIELD.d/2+.5,SPORTS_FIELD.z+SPORTS_FIELD.d/2-.5];
export const ADDITIONAL_STATIC_OBSTACLES=[...CORE_TREES,...PERIMETER_TREES].filter(t=>Math.abs(t.x)<36&&Math.abs(t.z)<30).map(t=>({x:t.x,z:t.z,w:.65*t.scale,d:.65*t.scale}));
export const FIXED_SITE_OBSTACLES=[...COURTYARD_PLANTERS,...EDGE_PLANTERS,BICYCLE_RACK,...BLEACHERS,
  {x:2.7,z:-1.9,w:1.9,d:1.9},{x:-3,z:-.7,w:1.9,d:1.9},
  ...SPORT_GOAL_ZS.flatMap(z=>[{x:SPORTS_FIELD.x-2.5,z,w:.09,d:.09},{x:SPORTS_FIELD.x+2.5,z,w:.09,d:.09},{x:SPORTS_FIELD.x,z:z+.5,w:5.1,d:.06}]),
];
