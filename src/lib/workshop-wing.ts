// World units use the same metre scale as campus doorways and furniture.
export const WORKSHOPS = [
  { kind: 'kitchen', x: 129, z: -32, w: 24, d: 16, h: 4.2, roof: 0xa55e41,
    name: 'Bếp thực hành', english: 'Teaching kitchen', title: 'Prepare a class lunch', color: '#c79264', icon: 'food' },
  { kind: 'light-lab', x: 153, z: 0, w: 28, d: 18, h: 5.2, roof: 0x517778,
    name: 'Nhà thực hành ánh sáng', english: 'Light lab', title: 'Follow the light signals', color: '#72a6a4', icon: 'target' },
  { kind: 'plant-lab', x: 129, z: 34, w: 22, d: 14, h: 4, roof: 0x607f53,
    name: 'Nhà thực hành cây trồng', english: 'Plant science lab', title: 'Keep a plant diary', color: '#9bae78', icon: 'sprout' },
  { kind:'weather', x:194,z:-32,w:18,d:12,h:4.7,roof:0x587c85,name:'Trạm khí tượng',english:'Weather station',title:'Read the forecast',color:'#79a5b5',icon:'weather' },
  { kind:'art', x:198,z:0,w:23,d:16,h:4.4,roof:0xa57155,name:'Xưởng mỹ thuật',english:'Art studio',title:'Mix a colour palette',color:'#bc8866',icon:'palette' },
  { kind:'music', x:194,z:34,w:20,d:15,h:4.6,roof:0x5e7068,name:'Phòng hòa tấu',english:'Ensemble room',title:'Rehearse with the band',color:'#aba078',icon:'music' },
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
  {x:173,z:0,w:4,d:93}, // Eastern teaching court.
  {x:140,z:-44,w:66,d:3}, {x:140,z:44,w:66,d:3},
  ...WORKSHOPS.flatMap(b => {
    const spine=b.x>173?173:107;
    const porch = b.z + b.d/2, z = porch + 3;
    return [{x:(spine+b.x)/2,z,w:b.x-spine,d:3},{x:b.x,z:porch+1.5,w:3,d:3}];
  }),
];
// Teaching islands leave a continuous aisle from the door to the demonstration wall.
export const workshopFixtures = WORKSHOPS.flatMap(b =>
  [-1,1].flatMap(side => [-1,1].map(row => ({
    kind:b.kind, x:b.x+side*b.w*.28, z:b.z+row*b.d*.23, w:4.2, d:1.5,
  }))));
