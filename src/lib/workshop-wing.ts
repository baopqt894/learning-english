// World units use the same metre scale as campus doorways and furniture.
export const WORKSHOPS = [
  { kind: 'kitchen', x: 129, z: -32, w: 24, d: 16, h: 4.2, roof: 0xa55e41,
    name: 'Bếp thực hành', english: 'Teaching kitchen', title: 'Prepare a class lunch', color: '#c79264', icon: 'food' },
  { kind: 'light-lab', x: 153, z: 0, w: 28, d: 18, h: 5.2, roof: 0x517778,
    name: 'Nhà thực hành ánh sáng', english: 'Light lab', title: 'Follow the light signals', color: '#72a6a4', icon: 'target' },
  { kind: 'plant-lab', x: 129, z: 34, w: 22, d: 14, h: 4, roof: 0x607f53,
    name: 'Nhà thực hành cây trồng', english: 'Plant science lab', title: 'Keep a plant diary', color: '#9bae78', icon: 'sprout' },
] as const;
export type WorkshopId = typeof WORKSHOPS[number]['kind'];
export const workshopZones = WORKSHOPS.map(b => ({
  id: b.kind, name: b.name, english: b.english, icon: b.icon, color: b.color, x: b.x, z: b.z + 2,
}));
export function nearbyWorkshop(point: {x:number; z:number}) {
  return WORKSHOPS.find(b => Math.abs(point.x-b.x) < b.w/2-.4 && Math.abs(point.z-b.z) < b.d/2-.4);
}
export const workshopPaths = [
  {x:107,z:0,w:3.6,d:90}, // West promenade connects the two existing service streets.
  {x:105.5,z:-33,w:3,d:3}, {x:105.5,z:15.5,w:3,d:3},
  ...WORKSHOPS.flatMap(b => {
    const porch = b.z + b.d/2, z = porch + 3;
    return [{x:(107+b.x)/2,z,w:b.x-107,d:3},{x:b.x,z:porch+1.5,w:3,d:3}];
  }),
];
// Teaching islands leave a continuous aisle from the door to the demonstration wall.
export const workshopFixtures = WORKSHOPS.flatMap(b =>
  [-1,1].flatMap(side => [-1,1].map(row => ({
    kind:b.kind, x:b.x+side*b.w*.28, z:b.z+row*b.d*.23, w:4.2, d:1.5,
  }))));
