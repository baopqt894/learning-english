// World units use the same metre scale as campus doorways and furniture.
export const WORKSHOPS = [
  { kind: 'kitchen', x: 137, z: -38, w: 48, d: 29, h: 5.2, roof: 0xa55e41,
    name: 'Bếp thực hành', english: 'Teaching kitchen', title: 'Prepare a class lunch', color: '#c79264', icon: 'food' },
  { kind: 'light-lab', x: 143, z: 1, w: 50, d: 30, h: 6.1, roof: 0x517778,
    name: 'Nhà thực hành ánh sáng', english: 'Light lab', title: 'Follow the light signals', color: '#72a6a4', icon: 'target' },
  { kind: 'plant-lab', x: 138, z: 40, w: 50, d: 29, h: 5.1, roof: 0x607f53,
    name: 'Nhà thực hành cây trồng', english: 'Plant science lab', title: 'Keep a plant diary', color: '#9bae78', icon: 'sprout' },
  { kind:'weather', x:204.5,z:-38,w:46,d:29,h:5.5,roof:0x587c85,name:'Trạm khí tượng',english:'Weather station',title:'Read the forecast',color:'#79a5b5',icon:'weather' },
  { kind:'art', x:209.5,z:1,w:47,d:30,h:5.3,roof:0xa57155,name:'Xưởng mỹ thuật',english:'Art studio',title:'Mix a colour palette',color:'#bc8866',icon:'palette' },
  { kind:'music', x:206.5,z:40,w:46,d:29,h:5.4,roof:0x5e7068,name:'Phòng hòa tấu',english:'Ensemble room',title:'Rehearse with the band',color:'#aba078',icon:'music' },
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
type Points=readonly (readonly [number,number])[];
type Plan={tables:Points;shelves:Points;fixtures:Points;project:Points;rack:Points;island:Points;bench:Points;bays:Points};
// Local metres, with the door at positive Z. Each plan also drives furniture collision and routing.
export const workshopPlans:Record<WorkshopId,Plan>={
  // The left production line ends at the ovens; tasting groups occupy the other half.
  kitchen:{tables:[[5.5,-6],[10.5,-6],[15.5,-6],[5.5,-2.6],[10.5,-2.6],[15.5,-2.6],[7.5,4.5],[12.5,4.5],[17.5,4.5]],shelves:[[18,10],[5,-10],[9.7,-10],[19.7,-1.4]],
    fixtures:[[-13,-6],[-13,-1],[-13,4]],project:[[-6,1]],rack:[[-19,-10]],island:[[-19,1]],bench:[[12,11]],
    bays:[[-13,9],[19.3,-8.9]]},
  // Parallel optical rails, with a dark observation gallery down one side.
  'light-lab':{tables:[[-19.5,4.4],[-14.5,4.4],[-9.5,4.4],[-19.5,7.8],[-14.5,7.8],[-9.5,7.8],[-4.5,7.8]],shelves:[[-20,-5],[-14.3,12],[-9.6,12],[-5,12]],
    fixtures:[[6,-8],[13,-8],[19,-8]],project:[[7,2],[14,2]],rack:[[-9,-10]],island:[[20,3]],bench:[[8,11],[18,11]],
    bays:[[-17,-1],[-7,-4]]},
  // Three growing rows and a separate potting and recording corner.
  'plant-lab':{tables:[[5.5,5.4],[10.5,5.4],[15.5,5.4],[20.5,5.4],[5.5,8.8],[10.5,8.8],[15.5,8.8]],shelves:[[19.8,10],[5.7,12.6],[10.4,12.6]],
    fixtures:[[5,-5],[12,-5],[19,-5]],project:[[-19,1],[-13,1],[-7,1]],rack:[[19,-10]],island:[[20,0]],bench:[[-14,11]],
    bays:[[-6,10],[10,0]]},
  // Observation instruments fan around a central weather-reading circle.
  weather:{tables:[[-17,6.4],[-12,4.5],[-7,5.3],[-12,7.9],[-7,8.7],[6.2,6.5],[10.9,5.3],[15.6,4.5],[10.9,8.8],[15.6,7.9]],shelves:[[19,9],[-18,10],[-12.4,12.2]],
    fixtures:[[-14,-6],[-6,-8],[7,-8],[15,-5]],project:[[19.4,2]],rack:[[-20,-10]],island:[[-19,1]],bench:[[8,12]],
    bays:[[-8,0],[9,0]]},
  // Perimeter gallery and drying racks; a ceramics island and a long row of drawing desks.
  art:{tables:[[-17,4.7],[-12,4.7],[-7,4.7],[-17,8.1],[-12,8.1],[-7,8.1],[13,-.9],[13,6.3],[8.3,6.3]],shelves:[[-17,12.1],[-12.3,12.1],[-7.6,12.1],[18,10]],
    fixtures:[[6,-8],[12,-8],[18,-8]],project:[[-20,-3]],rack:[[-6,-10],[17,-11]],island:[[17,1]],bench:[[6,10],[12,10]],
    bays:[[-9,-2],[8,2]]},
  // A performance platform at the back with music stands in a staggered audience arc.
  music:{tables:[[-16.8,3.7],[-11.3,5.4],[-6.6,7.1],[6.6,7.1],[11.3,5.4],[16.8,3.7],[-16.8,8.2],[-11.3,9.9],[-6.6,11.6],[6.6,11.6],[11.3,9.9],[16.8,8.2]],shelves:[[19.5,11.8],[-11.3,12.6],[11.3,12.6]],
    fixtures:[[-16,-6],[-9,-7],[9,-7]],project:[],rack:[[-19,12]],island:[[19,-4]],bench:[[-18,0]],
    bays:[[-6,-1],[7,-1]]},
};
export const workshopFixtures=WORKSHOPS.flatMap(b=>workshopPlans[b.kind].fixtures.map(([x,z])=>({
  kind:b.kind,x:b.x+x,z:b.z+z,w:4.2,d:1.5,
})));
export function doorwayHalfWidth(kind?:string) {
  if(kind==='language'||kind==='computer')return 2.5;
  return WORKSHOPS.some(b=>b.kind===kind)?2.65:1.3;
}
export const workshopFittings=WORKSHOPS.flatMap(b=>{
  const plan=workshopPlans[b.kind];
  return (['project','rack','island','bench'] as const).flatMap(unit=>plan[unit].map(([dx,dz])=>{
    const [w,d]=unit==='project'?[2.45,b.d*.42]:unit==='rack'?[5.2,1.25]:unit==='island'?[2.3,6]:[3.3,.75];
    return {kind:b.kind,unit,x:b.x+dx,z:b.z+dz,w,d};
  }));
});

// Paired exhibits sit against the rear wall; entrances and central aisles stay clear.
export const workshopDisplays=WORKSHOPS.flatMap(b=>[-1,1].map(side=>({
  kind:b.kind,x:b.x+side*b.w*.28,z:b.z-b.d/2+1.36,w:5.82,d:1.88,
})));
