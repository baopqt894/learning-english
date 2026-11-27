import {demonstrationBays,outdoorFacilities} from './campus-detail-layout.ts';
import {studyObstacles} from './group-study-layout.ts';
import {computerLab,computerDesks,examStations,teacherDesk,languageLab,listeningStations,languageFurniture} from './learning-room-layout.ts';
import { landscapeObstacles,glasshouseEquipment,nurseryPens } from './campus-landscape-layout.ts';
import { PARK_ZONES, nearbyPark, parkObstacles } from './recreation-park.ts';
import { WORKSHOPS, workshopZones, workshopDisplays, workshopFixtures, workshopFittings, doorwayHalfWidth, nearbyWorkshop, type WorkshopId } from './workshop-wing.ts';
import { READING_PAVILION, READING_APPROACH, READING_TABLES, READING_SEATS, BOOKCASES } from './reading-pavilion.ts';
import { diningLayout } from './dining-layout.ts';
import { PITCH_APPROACH, SPORTS_OBSTACLES, STADIUM, STADIUM_FLOORS, TRACK_OUTER_RADIUS, nearbySportsVenue, stadiumDistance } from './sports-layout.ts';
import { CAMPUS_EXTENT, DISTRICT_OBSTACLES, NEW_DISTRICT_ZONES, DISTRICT_AREAS } from './campus-districts-layout.ts';
import { FARM_LAYOUT, SITE_STATIC_OBSTACLES, ADDITIONAL_STATIC_OBSTACLES, FIXED_SITE_OBSTACLES } from './campus-spaces.ts';
import { WORK_OBSTACLES } from './fieldwork.ts';
export type MapPoint = { x: number; z: number };
export const MAP_BOUNDS = CAMPUS_EXTENT;
export const CORE_BUILDINGS = [
  { x: 0, z: -11.5, w: 13.5, d: 5, h: 4.6, roof: 0x9f4936 },
  { x: -9, z: -5.5, w: 7.5, d: 5.5, h: 3.5, roof: 0xb96442 },
  { x: 9.5, z: -4.2, w: 7.5, d: 5.5, h: 3.2, roof: 0x526f50 },
];
type Building = {
  x: number;
  z: number;
  w: number;
  d: number;
  h: number;
  name: string;
  roof: number;
  kind:
    | "housing"
    | "classroom"
    | "computer"
    | "language"
    | "dining"
    | "hall"
    | "pavilion" | WorkshopId;
};
export const EXPANSION_BUILDINGS: Building[] = [
  {
    x: -28,
    z: -13,
    w: 16,
    d: 9,
    h: 5.2,
    name: "NHÀ Ở HỌC VIÊN A",
    roof: 0x956044,
    kind: "housing",
  },
  {
    x: -28,
    z: 0,
    w: 16,
    d: 10,
    h: 4.6,
    name: "NHÀ Ở HỌC VIÊN B",
    roof: 0x956044,
    kind: "housing",
  },
  {
    x: -9,
    z: -25,
    w: 15,
    d: 10,
    h: 3.6,
    name: "PHÒNG HỌC A1",
    roof: 0xa5553e,
    kind: "classroom",
  },
  {
    x: 11,
    z: -25,
    w: 15,
    d: 10,
    h: 3.6,
    name: "PHÒNG HỌC A2",
    roof: 0xa5553e,
    kind: "classroom",
  },
  {
    ...computerLab,
    h: 3.6,
    name: "PHÒNG TIN HỌC",
    roof: 0x536f76,
    kind: "computer",
  },
  {
    ...languageLab,
    h: 3.6,
    name: "PHÒNG NGOẠI NGỮ",
    roof: 0x667c56,
    kind: "language",
  },
  {
    x: -29,
    z: 15,
    w: 19,
    d: 13,
    h: 3.8,
    name: "NHÀ ĂN HỌC VIÊN",
    roof: 0xac6744,
    kind: "dining",
  },
  {
    x: -29,
    z: 36,
    w: 24,
    d: 16,
    h: 5,
    name: "NHÀ ĐA NĂNG",
    roof: 0x607f77,
    kind: "hall",
  },
  READING_PAVILION,
  ...WORKSHOPS,
];
export const EXPLORATION_ZONES = [
  ...NEW_DISTRICT_ZONES,
  ...workshopZones, ...PARK_ZONES,
  {
    id: "dormitory",
    name: "Khu nội trú",
    english: "Dormitory",
    x: -28,
    z: 4,
    icon: "school",
    color: "#b9a474",
  },
  {
    id: "classrooms",
    name: "Phòng học A1",
    english: "Classroom A1",
    x: -9,
    z: -22,
    icon: "book",
    color: "#c18d72",
  },
  {
    id: "classroom-b",
    name: "Phòng học A2",
    english: "Classroom A2",
    x: 11,
    z: -22,
    icon: "book",
    color: "#c18d72",
  },
  {
    id: "computer",
    name: "Phòng tin học",
    english: "Computer lab",
    ...examStations[8].approach,
    icon: "computer",
    color: "#7faab2",
  },
  {
    id: "language",
    name: "Phòng ngoại ngữ",
    english: "Language lab",
    ...listeningStations[3].approach,
    icon: "sound",
    color: "#b6bc7d",
  },
  {
    id: "dining",
    name: "Nhà ăn",
    english: "Dining hall",
    x: -29,
    z: 20,
    icon: "food",
    color: "#d2a16c",
  },
  {
    id: "hall",
    name: "Nhà đa năng",
    english: "Multipurpose hall",
    x: -28,
    z: 40,
    icon: "school",
    color: "#87ada0",
  },
  {
    id: "sports",
    name: "Sân bóng đá",
    english: "Football field",
    ...PITCH_APPROACH,
    icon: "ball",
    color: "#86ac78",
  },
  {
    id: "garden",
    name: "Vườn đọc sách",
    english: "Reading garden",
    ...READING_APPROACH,
    icon: "leaf",
    color: "#97b990",
  },
  {id:"vegetable-garden",name:"Khu tăng gia",english:"Vegetable garden",x:FARM_LAYOUT.gate.approach.x,z:FARM_LAYOUT.gate.approach.z,icon:"leaf",color:"#7c9950"},
] as const;
export type ZoneId = (typeof EXPLORATION_ZONES)[number]["id"];
export const ZONE_ART: Partial<Record<ZoneId, number>> = {
  classrooms: 0,
  "classroom-b": 0,
  computer: 1,
  language: 2,
  dormitory: 3,
  dining: 4,
  hall: 5,
};
export const isOpenRoom = (b: Building) =>
  b.kind !== "housing" || b.z === 0;
/** Furniture positions are shared by rendering and navigation. A clear centre aisle connects every room to its door. */
type Furniture = MapPoint & {
  w: number;
  d: number;
  kind: Building["kind"] | "stage";
};
export const ROOM_FURNITURE = EXPANSION_BUILDINGS.filter(
  isOpenRoom,
).flatMap<Furniture>((b) => {
  if (WORKSHOPS.some(workshop => workshop.kind === b.kind)) return [];
  if (b.kind === 'housing' || b.kind === 'pavilion') return [];
  if (b.kind === 'language' || b.kind === 'computer')return [];
  if (b.kind === "hall")
    return [
      {
        x: b.x,
        z: b.z - b.d / 2 + 1.1,
        w: b.w - 1.2,
        d: 1.5,
        kind: "stage" as const,
      },
    ];
  if (b.kind === "dining") return diningLayout(b).tables.map(t=>({...t,kind:"dining" as const}));
  const rows = b.d>=10?4:3;
  return Array.from({ length: rows * 2 }, (_, i) => ({
    x: b.x + (i % 2 ? 1 : -1) * b.w * 0.28,
    z: b.z - b.d / 2 + 1.8 + Math.floor(i / 2) * 1.8,
    w: 2.4,
    d: 0.8,
    kind: b.kind,
  }));
});
export const DORM_EXTRA_BEDS=[{x:-32,z:-2.6,w:1.35,d:2.45},{x:-32,z:1.6,w:1.35,d:2.45},{x:-26,z:2.1,w:1.35,d:2.45}];
export const STUDY_DESK=ROOM_FURNITURE.filter(f=>f.kind==='classroom'&&f.x<0).at(-2)!;
export const STUDY_POSITION={x:STUDY_DESK.x+.65,z:STUDY_DESK.z+.7};
export const ROOM_FIXTURES=EXPANSION_BUILDINGS.filter(isOpenRoom).flatMap(b=>b.kind==='dining'?Object.values(diningLayout(b).stations):b.kind==='classroom'?[{x:b.x,z:b.z-b.d/2+.9,w:1.5,d:.7}]:[]);
export const ROOM_EXHIBITS=EXPANSION_BUILDINGS.filter(b=>b.kind==='hall').flatMap(b=>['BOOKS & FIELD GUIDE','GARDEN HARVEST','OUR CAMPUS MAP','SAFE TEAMWORK'].map((label,i)=>({x:b.x+(i%2?1:-1)*(b.w/2-1.8),z:b.z-1.8+Math.floor(i/2)*3.5,w:2.8,d:1.2,label,kind:i})));
export const CORE_FRONT_FIXTURES=[{x:CORE_BUILDINGS[1].x+1.8,z:CORE_BUILDINGS[1].z+CORE_BUILDINGS[1].d/2+.25,w:1.15,d:.35},{x:CORE_BUILDINGS[2].x,z:CORE_BUILDINGS[2].z+CORE_BUILDINGS[2].d/2+.5,w:2.85,d:.85}];
export const MAP_OBSTACLES = [
  ...demonstrationBays,...outdoorFacilities,
  ...computerDesks.map(f=>({x:computerLab.x+f.x,z:computerLab.z+f.z,w:f.w,d:f.d})),
  ...examStations.filter(s=>!s.laptop).map(s=>({x:s.x,z:s.z+.85,w:.64,d:.64})),
  {...teacherDesk,x:computerLab.x+teacherDesk.x,z:computerLab.z+teacherDesk.z},
  ...studyObstacles, ...SPORTS_OBSTACLES, ...workshopDisplays, ...workshopFixtures, ...workshopFittings, ...parkObstacles, ...landscapeObstacles,
  ...WORKSHOPS.filter(b=>b.kind==='plant-lab').flatMap(b=>glasshouseEquipment.map(f=>({...f,x:b.x+f.x,z:b.z+f.z}))),
  ...EXPANSION_BUILDINGS.filter(b=>b.kind==='language').flatMap(b=>languageFurniture.map(f=>({...f,x:b.x+f.x,z:b.z+f.z}))),
  ...EXPANSION_BUILDINGS.filter(b=>b.kind==='computer').flatMap(b=>[-1,1].map(side=>({x:b.x+side*6.75,z:b.z-b.d/2+.55,w:1.24,d:.73}))),
  ...CORE_FRONT_FIXTURES, ...ROOM_EXHIBITS,
  ...ROOM_FIXTURES, ...BOOKCASES, ...READING_TABLES, ...READING_SEATS,
  ...DISTRICT_OBSTACLES,
  ...SITE_STATIC_OBSTACLES, ...ADDITIONAL_STATIC_OBSTACLES, ...FIXED_SITE_OBSTACLES,
  ...WORK_OBSTACLES,
  ...DORM_EXTRA_BEDS,
  ...CORE_BUILDINGS,
  ...EXPANSION_BUILDINGS.filter((b) => !isOpenRoom(b)),
  ...EXPANSION_BUILDINGS.filter(isOpenRoom).flatMap((b) => [
    { x: b.x - b.w / 2, z: b.z, w: 0.2, d: b.d },
    { x: b.x + b.w / 2, z: b.z, w: 0.2, d: b.d },
    { x: b.x, z: b.z - b.d / 2, w: b.w, d: 0.2 },
    ...[-1, 1].map((side) => ({
      x: b.x + side * (b.w / 4 + doorwayHalfWidth(b.kind)/2),
      z: b.z + b.d / 2,
      w: b.w / 2 - doorwayHalfWidth(b.kind),
      d: 0.2,
    })),
  ]),
  ...ROOM_FURNITURE,
];

/** Rendered open-room floors are raised above the outdoor paths. */
export function campusFloorHeight(point:MapPoint){
  for(const b of EXPANSION_BUILDINGS){
    if(!isOpenRoom(b))continue;
    if(Math.abs(point.x-b.x)<b.w/2&&Math.abs(point.z-b.z)<b.d/2)return .31;
    if(Math.abs(point.x-b.x)<b.w/2+.25&&Math.abs(point.z-b.z)<b.d/2+.25)return .25;
  }
  if (point.z < -70) {
    const radius = stadiumDistance(point.x, point.z);
    if (radius < STADIUM.innerRadius) return STADIUM_FLOORS.pitch;
    if (radius <= TRACK_OUTER_RADIUS + .85) return STADIUM_FLOORS.running;
  }
  return .13;
}

// Broad-phase cells keep A* and continuous movement cheap on the larger campus.
const obstacleCells=new Map<string,(typeof MAP_OBSTACLES)[number][]>();
for(const b of MAP_OBSTACLES){for(let x=Math.floor((b.x-b.w/2-.4)/4);x<=Math.floor((b.x+b.w/2+.4)/4);x++)for(let z=Math.floor((b.z-b.d/2-.4)/4);z<=Math.floor((b.z+b.d/2+.4)/4);z++){const key=`${x},${z}`;if(!obstacleCells.has(key))obstacleCells.set(key,[]);obstacleCells.get(key)!.push(b);}}
export function canWalkCampus(x: number, z: number) {
  return (
    Number.isFinite(x) &&
    Number.isFinite(z) &&
    x > MAP_BOUNDS.minX &&
    x < MAP_BOUNDS.maxX &&
    z > MAP_BOUNDS.minZ &&
    z < MAP_BOUNDS.maxZ &&
    !(obstacleCells.get(`${Math.floor(x/4)},${Math.floor(z/4)}`)||[]).some(
      (b) =>
        Math.abs(x - b.x) < b.w / 2 + 0.4 && Math.abs(z - b.z) < b.d / 2 + 0.4,
    )
  );
}
export type CampusPosition = MapPoint & { heading: number };
export function restoreCampusPosition(value: unknown): CampusPosition | undefined {
  if (!value || typeof value !== 'object') return;
  const {x,z,heading} = value as Partial<CampusPosition>;
  if (typeof x === 'number' && typeof z === 'number' && canWalkCampus(x,z))
    return {x,z,heading: typeof heading === 'number' && Number.isFinite(heading) ? heading : 0};
}

export function canWalkSegment(a: MapPoint, b: MapPoint) {
  if (!canWalkCampus(a.x, a.z) || !canWalkCampus(b.x, b.z)) return false;
  const dx = b.x - a.x, dz = b.z - a.z;
  function crosses(box: (typeof MAP_OBSTACLES)[number]) {
    const x = a.x - box.x, z = a.z - box.z;
    const halfW = box.w / 2 + .4, halfD = box.d / 2 + .4;
    if ((!dx && Math.abs(x) >= halfW) || (!dz && Math.abs(z) >= halfD)) return false;
    const tx1 = dx ? (-halfW - x) / dx : -Infinity, tx2 = dx ? (halfW - x) / dx : Infinity;
    const tz1 = dz ? (-halfD - z) / dz : -Infinity, tz2 = dz ? (halfD - z) / dz : Infinity;
    return Math.max(0, Math.min(tx1, tx2), Math.min(tz1, tz2)) <
      Math.min(1, Math.max(tx1, tx2), Math.max(tz1, tz2));
  }
  const minX = Math.floor(Math.min(a.x, b.x) / 4), maxX = Math.floor(Math.max(a.x, b.x) / 4);
  const minZ = Math.floor(Math.min(a.z, b.z) / 4), maxZ = Math.floor(Math.max(a.z, b.z) / 4);
  if ((maxX - minX + 1) * (maxZ - minZ + 1) > 24) return !MAP_OBSTACLES.some(crosses);
  for (let x = minX; x <= maxX; x++) for (let z = minZ; z <= maxZ; z++) {
    if (obstacleCells.get(`${x},${z}`)?.some(crosses)) return false;
  }
  return true;
}

/** Follow the planned segments exactly, including tight turns along walls. */
export function advanceCampusRoute(position: MapPoint, route: MapPoint[], budget: number) {
  while (route.length && budget > 0) {
    const waypoint = route[0];
    const dx = waypoint.x - position.x, dz = waypoint.z - position.z;
    const distance = Math.hypot(dx, dz);
    const arrives = distance <= budget;
    const nextX = arrives ? waypoint.x : position.x + (dx / distance) * budget;
    const nextZ = arrives ? waypoint.z : position.z + (dz / distance) * budget;
    if (!canWalkCampus(nextX, nextZ)) { route.length = 0; return; }
    position.x = nextX;
    position.z = nextZ;
    if (!arrives) return;
    route.shift();
    budget -= distance;
  }
}

/** Small A* grid, followed by line-of-sight smoothing, for the whole campus. */
export function findCampusPath(from: MapPoint, to: MapPoint): MapPoint[] {
  if (!canWalkCampus(from.x, from.z) || !canWalkCampus(to.x, to.z)) return [];
  if (canWalkSegment(from, to)) return [{ ...to }];
  const gridAnchor = (point: MapPoint) => {
    const candidates: MapPoint[] = [];
    for (let dx = -2; dx <= 2; dx++)
      for (let dz = -2; dz <= 2; dz++)
        candidates.push({
          x: Math.round(point.x) + dx,
          z: Math.round(point.z) + dz,
        });
    candidates.sort(
      (a, b) =>
        Math.hypot(a.x - point.x, a.z - point.z) -
        Math.hypot(b.x - point.x, b.z - point.z),
    );
    return candidates.find((p) => canWalkSegment(point, p));
  };
  const start = gridAnchor(from),
    goal = gridAnchor(to);
  if (!start || !goal) return [];
  type Node = MapPoint & { g: number; f: number };
  const heap: Node[] = [];
  const push = (n: Node) => {
    heap.push(n);
    let i = heap.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (heap[p].f <= n.f) break;
      heap[i] = heap[p];
      i = p;
    }
    heap[i] = n;
  };
  const pop = () => {
    const first = heap[0],
      last = heap.pop()!;
    if (heap.length) {
      let i = 0;
      while (i * 2 + 1 < heap.length) {
        let c = i * 2 + 1;
        if (c + 1 < heap.length && heap[c + 1].f < heap[c].f) c++;
        if (heap[c].f >= last.f) break;
        heap[i] = heap[c];
        i = c;
      }
      heap[i] = last;
    }
    return first;
  };
  const key = (p: MapPoint) => `${p.x},${p.z}`;
  const scores = new Map<string, number>([[key(start), 0]]);
  const parents = new Map<string, MapPoint>();
  // Exact distance on an empty eight-way grid keeps long routes focused.
  const h = (p: MapPoint) => {
    const dx = Math.abs(p.x-goal.x), dz = Math.abs(p.z-goal.z);
    return Math.max(dx,dz) + (Math.SQRT2-1)*Math.min(dx,dz);
  };
  push({ ...start, g: 0, f: h(start) });
  const directions = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
    [-1, -1],
    [-1, 1],
    [1, -1],
    [1, 1],
  ];
  while (heap.length) {
    const current = pop();
    if (current.g !== scores.get(key(current))) continue;
    if (current.x === goal.x && current.z === goal.z) {
      const reversed: MapPoint[] = [to];
      let p: MapPoint = goal;
      while (key(p) !== key(start)) {
        reversed.push(p);
        p = parents.get(key(p))!;
      }
      reversed.push(start);
      const raw = [from, ...reversed.reverse()];
      const result: MapPoint[] = [];
      let anchor = 0;
      while (anchor < raw.length - 1) {
        let next = raw.length - 1;
        while (next > anchor + 1 && !canWalkSegment(raw[anchor], raw[next]))
          next--;
        result.push(raw[next]);
        anchor = next;
      }
      return result;
    }
    for (const [dx, dz] of directions) {
      const next = { x: current.x + dx, z: current.z + dz };
      const g = current.g + (dx && dz ? Math.SQRT2 : 1);
      if (g >= (scores.get(key(next)) ?? Infinity) || !canWalkSegment(current, next)) continue;
      scores.set(key(next), g);
      parents.set(key(next), { x: current.x, z: current.z });
      push({ ...next, g, f: g + h(next) });
    }
  }
  return [];
}
export function campusAreaName(point: MapPoint) {
  for(const [room,area] of [[languageLab,'Phòng ngoại ngữ'],[computerLab,'Phòng tin học']] as const){
    if(Math.abs(point.x-room.x)<room.w/2 && Math.abs(point.z-room.z)<room.d/2)return area;
  }
  const park=nearbyPark(point);
  if(park)return park.name;
  const workshop = nearbyWorkshop(point);
  if (workshop) return workshop.name;
  const venue = nearbySportsVenue(point.x, point.z);
  if (venue === 'track') return 'Đường chạy tiếng Anh';
  if (venue === 'pool') return 'Hồ bơi';
  if (venue === 'field') return 'Sân trò chơi tiếng Anh';
  const trackDistance = stadiumDistance(point.x, point.z);
  if (trackDistance < STADIUM.innerRadius) return 'Sân bóng đá';
  if (trackDistance <= TRACK_OUTER_RADIUS) return 'Đường chạy tiếng Anh';
  if(point.x>=nurseryPens[0].x-7&&point.x<=nurseryPens[1].x+7&&Math.abs(point.z-nurseryPens[0].z)<5)return NEW_DISTRICT_ZONES.find(z=>z.id==='livestock')!.name;
  const district=DISTRICT_AREAS.find(d=>point.x>=d.minX&&point.x<=d.maxX&&point.z>=d.minZ&&point.z<=d.maxZ);
  if(district)return NEW_DISTRICT_ZONES.find(z=>z.id===district.id)!.name;
  const farm = FARM_LAYOUT.bounds;
  if (point.x >= farm.minX && point.x <= farm.maxX && point.z >= farm.minZ && point.z <= farm.maxZ)
    return EXPLORATION_ZONES.find(zone => zone.id === 'vegetable-garden')!.name;
  let nearest: (typeof EXPLORATION_ZONES)[number] | undefined;
  let distance = 12;
  for (const zone of EXPLORATION_ZONES) {
    const d = Math.hypot(point.x - zone.x, point.z - zone.z);
    if (d < distance) {
      distance = d;
      nearest = zone;
    }
  }
  return nearest?.name ?? "Khu trung tâm";
}
