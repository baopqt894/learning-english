// World units use the same metre scale as campus doorways and furniture.
export const WORKSHOPS = [
  { kind: 'kitchen', x: 137, z: -38, w: 38, d: 25, h: 5.2, roof: 0xa55e41,
    name: 'Bếp thực hành', english: 'Teaching kitchen', title: 'Prepare a class lunch', color: '#c79264', icon: 'food' },
  { kind: 'light-lab', x: 143, z: 1, w: 42, d: 24, h: 6.1, roof: 0x517778,
    name: 'Nhà thực hành ánh sáng', english: 'Light lab', title: 'Follow the light signals', color: '#72a6a4', icon: 'target' },
  { kind: 'plant-lab', x: 138, z: 40, w: 42, d: 26, h: 5.1, roof: 0x607f53,
    name: 'Nhà thực hành cây trồng', english: 'Plant science lab', title: 'Keep a plant diary', color: '#9bae78', icon: 'sprout' },
  { kind:'weather', x:202,z:-38,w:30,d:22,h:5.5,roof:0x587c85,name:'Trạm khí tượng',english:'Weather station',title:'Read the forecast',color:'#79a5b5',icon:'weather' },
  { kind:'art', x:205,z:1,w:39,d:25,h:5.3,roof:0xa57155,name:'Xưởng mỹ thuật',english:'Art studio',title:'Mix a colour palette',color:'#bc8866',icon:'palette' },
  { kind:'music', x:202,z:40,w:36,d:24,h:5.4,roof:0x5e7068,name:'Phòng hòa tấu',english:'Ensemble room',title:'Rehearse with the band',color:'#aba078',icon:'music' },
] as const;
export type WorkshopId = typeof WORKSHOPS[number]['kind'];
export const workshopZones = WORKSHOPS.map(b => ({
  id: b.kind, name: b.name, english: b.english, icon: b.icon, color: b.color, x: b.x, z: b.z + 2,
}));
export function nearbyWorkshop(point: {x:number; z:number}) {
  return WORKSHOPS.find(b => Math.abs(point.x-b.x) < b.w/2-.4 && Math.abs(point.z-b.z) < b.d/2-.4);
}
export const workshopPaths = [
  {x:107,z:1,w:4.8,d:116}, // West promenade connects the two existing service streets.
  {x:105.5,z:-33,w:3,d:3}, {x:105.5,z:15.5,w:3,d:3},
  {x:173,z:1,w:5,d:116}, // Eastern teaching court.
  {x:140,z:-56,w:66,d:4}, {x:140,z:58,w:66,d:4},
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

export function doorwayHalfWidth(kind?:string) {
  if(kind==='language'||kind==='computer')return 1.78;
  return WORKSHOPS.some(b=>b.kind===kind)?2.65:1.3;
}
export const workshopFittings=WORKSHOPS.flatMap(b=>{
  const row=b.z-b.d*.34;
  return [
    ...[-1,1].map(side=>({kind:b.kind,unit:'project' as const,x:b.x+side*5.6,z:b.z+side*1.4,w:2.45,d:b.d*.42})),
    ...[-1,1].map(side=>({kind:b.kind,unit:'rack' as const,x:b.x+side*b.w*.23,z:row,w:5.2,d:1.25})),
    ...[-1,1].map(side=>({kind:b.kind,unit:'island' as const,x:b.x+side*b.w*.40,z:b.z,w:2.3,d:6})),
    ...[-1,1].map(side=>({kind:b.kind,unit:'bench' as const,x:b.x+side*b.w*.22,z:b.z+b.d*.40,w:3.3,d:.75})),
  ];
});

// Paired exhibits sit against the rear wall; entrances and central aisles stay clear.
export const workshopDisplays=WORKSHOPS.flatMap(b=>[-1,1].map(side=>({
  kind:b.kind,x:b.x+side*b.w*.28,z:b.z-b.d/2+1.36,w:5.82,d:1.88,
})));
