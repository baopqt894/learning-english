import { WORKSHOPS,workshopPlans,type WorkshopId } from './workshop-wing.ts';

export const equipmentNames = {
  kitchen:['Bread oven','Soup station'],'light-lab':['Optical bench','Prism table'],
  'plant-lab':['Seed nursery','Growth bench'],weather:['Weather shelter','Wind meter'],
  art:['Print drying rack','Pottery wheel'],music:['String instruments','Xylophone'],
} as const;
export type EquipmentName=typeof equipmentNames[WorkshopId][number];
export const demonstrationBays=WORKSHOPS.flatMap(room=>workshopPlans[room.kind].bays.map(([dx,dz],i)=>{
  const x=room.x+dx,z=room.z+dz;
  return {room:room.kind,name:equipmentNames[room.kind][i],side:i===0?-1:1,x,z,w:5,d:2.4,approach:{x,z:z+2.12}};
}));
export function nearbyEquipment(p:{x:number;z:number}){
  return demonstrationBays.find(f=>Math.hypot(f.approach.x-p.x,f.approach.z-p.z)<1.18);
}
export const outdoorFacilities=[
  {kind:'team-bench',x:-12,z:-105.25,w:5.8,d:1.28},
  {kind:'team-bench',x:14,z:-105.25,w:5.8,d:1.28},
  {kind:'pool-rack',x:92.7,z:-39,w:3.2,d:1.36},
  {kind:'track-clock',x:-28.5,z:-64.75,w:3.15,d:.78},
  {kind:'relay-rack',x:30.75,z:-64.5,w:3.5,d:1.1},
  {kind:'farm-silo',x:99.5,z:35.5,w:3.4,d:3.4},
  {kind:'produce-table',x:183,z:-82.4,w:5.2,d:1.9},
  {kind:'ball-locker',x:101,z:103,w:3,d:1.2},
  {kind:'volley-shade',x:158.5,z:105.5,w:5.3,d:1.7},
  {kind:'signal-console',x:204,z:101.2,w:3,d:1.2},
] as const;

// Shade groups sit on grass outside the court envelopes, classroom doors and paved walks.
export const detailShadeTrees=[
  [76,78],[76,89],[76,101],[129,77],[135,102],[179,83],[185,105],[220,82],[225,97],
  [111,8],[234,-23],[232,54],[111,53],[52,-58],[52,-46],[95,7],[56,12],
  [-45,-73],[-43,-93],[-38,-114],[38,-116],[44,-104],[33,-62],[-32,-63],
].map(([x,z],i)=>({x,z,scale:.81+(i%4)*.087,flowering:i%4===0}));

// Portable supplies and instruments next to work groups. Keep their solid footprints in navigation.
const supportPositions:Record<WorkshopId,[number,number][]>={
  kitchen:[[-6,-8],[-19,7],[19,1]],'light-lab':[[-13,-7],[-6,2],[10.8,8.4]],
  'plant-lab':[[5,-10],[-20,9],[16,1]],weather:[[-5,-4],[5,-4],[-13,-1]],
  art:[[-13,-7],[12,-3.8],[-5,1]],music:[[-12,-2],[13,-1],[-5.5,-9.2]],
};
export const workshopSupplies=WORKSHOPS.flatMap(b=>supportPositions[b.kind].map(([x,z],index)=>({
  room:b.kind,index,x:b.x+x,z:b.z+z,w:3.1,d:1.56,
})));
