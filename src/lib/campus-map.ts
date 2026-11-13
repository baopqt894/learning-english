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
    | "pavilion";
};
export const EXPANSION_BUILDINGS: Building[] = [
  {
    x: -28,
    z: -13,
    w: 12,
    d: 8,
    h: 5.2,
    name: "NHÀ Ở HỌC VIÊN A",
    roof: 0x956044,
    kind: "housing",
  },
  {
    x: -28,
    z: 0,
    w: 12,
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
    x: 29,
    z: -25.5,
    w: 16,
    d: 11,
    h: 3.6,
    name: "PHÒNG TIN HỌC",
    roof: 0x536f76,
    kind: "computer",
  },
  {
    x: 29,
    z: -13.5,
    w: 16,
    d: 9,
    h: 3.6,
    name: "PHÒNG NGOẠI NGỮ",
    roof: 0x667c56,
    kind: "language",
  },
  {
    x: -29,
    z: 15,
    w: 16,
    d: 12,
    h: 3.8,
    name: "NHÀ ĂN HỌC VIÊN",
    roof: 0xac6744,
    kind: "dining",
  },
  {
    x: -28,
    z: 36,
    w: 20,
    d: 14,
    h: 5,
    name: "NHÀ ĐA NĂNG",
    roof: 0x607f77,
    kind: "hall",
  },
  {
    x: 0,
    z: 26,
    w: 9,
    d: 7,
    h: 3,
    name: "NHÀ CHÒI ĐỌC SÁCH",
    roof: 0x5c7750,
    kind: "pavilion",
  },
];
export const EXPLORATION_ZONES = [
  ...NEW_DISTRICT_ZONES,
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
    x: 29,
    z: -25,
    icon: "computer",
    color: "#7faab2",
  },
  {
    id: "language",
    name: "Phòng ngoại ngữ",
    english: "Language lab",
    x: 29,
    z: -11,
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
    x: 27,
    z: 6,
    icon: "ball",
    color: "#86ac78",
  },
  {
    id: "garden",
    name: "Vườn đọc sách",
    english: "Reading garden",
    x: 0,
    z: 21,
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
  (b.kind !== "housing" || b.z === 0) && b.kind !== "pavilion";
/** Furniture positions are shared by rendering and navigation. A clear centre aisle connects every room to its door. */
type Furniture = MapPoint & {
  w: number;
  d: number;
  kind: Building["kind"] | "stage";
};
export const ROOM_FURNITURE = EXPANSION_BUILDINGS.filter(
  isOpenRoom,
).flatMap<Furniture>((b) => {
  if (b.kind === 'housing') return [];
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
  const rows = b.kind === "dining" ? 5 : b.d>=10?4:3;
  return Array.from({ length: rows * 2 }, (_, i) => ({
    x: b.x + (i % 2 ? 1 : -1) * b.w * 0.28,
    z: b.z - b.d / 2 + 1.8 + Math.floor(i / 2) * 1.8,
    w: b.kind === "dining" ? 2.6 : 2.4,
    d: 0.8,
    kind: b.kind,
  }));
});
export const DORM_EXTRA_BEDS=[{x:-32,z:-2.6,w:1.35,d:2.45},{x:-32,z:1.6,w:1.35,d:2.45},{x:-26,z:2.1,w:1.35,d:2.45}];
export const STUDY_DESK=ROOM_FURNITURE.filter(f=>f.kind==='classroom'&&f.x<0).at(-2)!;
export const STUDY_POSITION={x:STUDY_DESK.x+.65,z:STUDY_DESK.z+.7};
export const ROOM_FIXTURES=EXPANSION_BUILDINGS.filter(isOpenRoom).flatMap(b=>b.kind==='dining'?[{x:b.x,z:b.z-b.d/2+.8,w:b.w-1.4,d:.7}]:(b.kind==='classroom'||b.kind==='language')?[{x:b.x,z:b.z-b.d/2+.9,w:1.5,d:.7}]:[]);
export const ROOM_EXHIBITS=EXPANSION_BUILDINGS.filter(b=>b.kind==='hall').flatMap(b=>['BOOKS & FIELD GUIDE','GARDEN HARVEST','OUR CAMPUS MAP','SAFE TEAMWORK'].map((label,i)=>({x:b.x+(i%2?1:-1)*(b.w/2-1.8),z:b.z-1.8+Math.floor(i/2)*3.5,w:2.8,d:1.2,label,kind:i})));
export const CORE_FRONT_FIXTURES=[{x:CORE_BUILDINGS[1].x+1.8,z:CORE_BUILDINGS[1].z+CORE_BUILDINGS[1].d/2+.25,w:1.15,d:.35},{x:CORE_BUILDINGS[2].x,z:CORE_BUILDINGS[2].z+CORE_BUILDINGS[2].d/2+.5,w:2.85,d:.85}];
export const MAP_OBSTACLES = [
  {x:85,z:-30.5,w:2,d:.7},{x:-11,z:-64.8,w:2,d:.7},{x:38.9,z:22.2,w:1.6,d:.6},
  ...CORE_FRONT_FIXTURES, ...ROOM_EXHIBITS,
  ...ROOM_FIXTURES,
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
      x: b.x + side * (b.w / 4 + 0.65),
      z: b.z + b.d / 2,
      w: b.w / 2 - 1.3,
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
export function canWalkSegment(a: MapPoint, b: MapPoint) {
  const count = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.z - a.z) / 0.2));
  for (let i = 0; i <= count; i++)
    if (
      !canWalkCampus(
        a.x + ((b.x - a.x) * i) / count,
        a.z + ((b.z - a.z) * i) / count,
      )
    )
      return false;
  return true;
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
  const h = (p: MapPoint) => Math.hypot(p.x - goal.x, p.z - goal.z);
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
      if (!canWalkCampus(next.x, next.z) || !canWalkSegment(current, next))
        continue;
      const g = current.g + Math.hypot(dx, dz);
      if (g >= (scores.get(key(next)) ?? Infinity)) continue;
      scores.set(key(next), g);
      parents.set(key(next), { x: current.x, z: current.z });
      push({ ...next, g, f: g + h(next) });
    }
  }
  return [];
}
export function campusAreaName(point: MapPoint) {
  if(point.z< -65&&point.z> -77&&Math.abs(point.x)<25)return "Đường chạy tiếng Anh";
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
