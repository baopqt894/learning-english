import {WORKSHOPS} from './workshop-wing.ts';
// Coordinates are shared by the scenery, routing and map.
export const nurseryPens = [
  { kind: 'rabbits', x: 65, z: 54.8, w: 12, d: 6.7 },
  { kind: 'sheep', x: 85, z: 54.8, w: 12, d: 6.7 },
] as const;

export const shadeGardens = [
  { x: 153.7, z: -80.8, flowers: 0xca5980 },
  { x: 180.8, z: -4.6, flowers: 0xc7944e },
  { x: 133.8, z: 83.7, flowers: 0xb4789f },
] as const;
export const orchardBeds=[121,139,153,173,190,207].map((x,i)=>({x,z:-90.2,w:i%2?6.7:8.4,d:1.45}));
export const fruitTrolley={x:163.6,z:-90.55,w:2.14,d:1.45};
export const harvestStand = {x:168.4,z:-81.4,w:5.6,d:3.2};
export const toolStations = [
  {x:147,z:-91.5,w:3.6,d:1.5}, {x:166,z:36.5,w:3.6,d:1.5},
  {x:128.6,z:92,w:3.6,d:1.5},
];
export const glasshouseEquipment=[
  {unit:'wash',x:-15.3,z:-9.7,w:5,d:2.0},
  {unit:'cart',x:4.5,z:8.2,w:2.25,d:1.25},
  {unit:'propagate',x:-5.6,z:-9.3,w:3.3,d:1.35},
] as const;

export const workshopBorders=WORKSHOPS.flatMap(b=>[-1,1].map(side=>({
  kind:b.kind,side,x:b.x+side*b.w*.29,z:b.z+b.d/2+.73,w:5,d:1.0,
})));

export const landscapeObstacles=[
  ...workshopBorders,...orchardBeds,fruitTrolley,
  ...nurseryPens,harvestStand,...toolStations,
  ...shadeGardens.flatMap(p=>[
    ...[-1,1].flatMap(s=>[-1,1].map(t=>({x:p.x+3.4*s,z:p.z+2.0*t,w:.26,d:.26}))),
    ...[-1,1].map(s=>({x:p.x+1.85*s,z:p.z,w:1.85,d:2.65})),
    ...[-1,1].map(s=>({x:p.x+3.4*s,z:p.z,w:.86,d:3.5})),
  ]),
];
