export type MapPoint = { x: number; z: number };
export const MAP_BOUNDS = { minX: -36, maxX: 36, minZ: -30, maxZ: 30 };
export const CORE_BUILDINGS = [
  { x: 0, z: -8.6, w: 9.5, d: 3.2, h: 3.7, roof: 0x9f4936 },
  { x: -7, z: -5.2, w: 5.3, d: 3.5, h: 2.7, roof: 0xb96442 },
  { x: 7.4, z: -3.7, w: 5.5, d: 3.6, h: 2.2, roof: 0x526f50 },
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
    x: -27,
    z: -11,
    w: 9,
    d: 5,
    h: 4.6,
    name: "NHÀ Ở HỌC VIÊN A",
    roof: 0x956044,
    kind: "housing",
  },
  {
    x: -27,
    z: -3,
    w: 9,
    d: 5,
    h: 4.6,
    name: "NHÀ Ở HỌC VIÊN B",
    roof: 0x956044,
    kind: "housing",
  },
  {
    x: -8,
    z: -24,
    w: 10,
    d: 6,
    h: 3,
    name: "PHÒNG HỌC A1",
    roof: 0xa5553e,
    kind: "classroom",
  },
  {
    x: 8,
    z: -24,
    w: 10,
    d: 6,
    h: 3,
    name: "PHÒNG HỌC A2",
    roof: 0xa5553e,
    kind: "classroom",
  },
  {
    x: 27,
    z: -25,
    w: 10,
    d: 7,
    h: 3.2,
    name: "PHÒNG TIN HỌC",
    roof: 0x536f76,
    kind: "computer",
  },
  {
    x: 27,
    z: -14,
    w: 10,
    d: 7,
    h: 3.2,
    name: "PHÒNG NGOẠI NGỮ",
    roof: 0x667c56,
    kind: "language",
  },
  {
    x: -27,
    z: 10,
    w: 11,
    d: 8,
    h: 3.2,
    name: "NHÀ ĂN HỌC VIÊN",
    roof: 0xac6744,
    kind: "dining",
  },
  {
    x: -26,
    z: 23,
    w: 12,
    d: 10,
    h: 4.4,
    name: "NHÀ ĐA NĂNG",
    roof: 0x607f77,
    kind: "hall",
  },
  {
    x: 0,
    z: 26,
    w: 5,
    d: 4.5,
    h: 2.4,
    name: "NHÀ CHÒI ĐỌC SÁCH",
    roof: 0x5c7750,
    kind: "pavilion",
  },
];
export const EXPLORATION_ZONES = [
  {
    id: "dormitory",
    name: "Khu nội trú",
    english: "Dormitory",
    x: -24,
    z: 4,
    icon: "school",
    color: "#b9a474",
  },
  {
    id: "classrooms",
    name: "Phòng học A1",
    english: "Classroom A1",
    x: -8,
    z: -22,
    icon: "book",
    color: "#c18d72",
  },
  {
    id: "classroom-b",
    name: "Phòng học A2",
    english: "Classroom A2",
    x: 8,
    z: -22,
    icon: "book",
    color: "#c18d72",
  },
  {
    id: "computer",
    name: "Phòng tin học",
    english: "Computer lab",
    x: 27,
    z: -23,
    icon: "computer",
    color: "#7faab2",
  },
  {
    id: "language",
    name: "Phòng ngoại ngữ",
    english: "Language lab",
    x: 27,
    z: -12,
    icon: "sound",
    color: "#b6bc7d",
  },
  {
    id: "dining",
    name: "Nhà ăn",
    english: "Dining hall",
    x: -27,
    z: 12.5,
    icon: "food",
    color: "#d2a16c",
  },
  {
    id: "hall",
    name: "Nhà đa năng",
    english: "Multipurpose hall",
    x: -26,
    z: 25,
    icon: "school",
    color: "#87ada0",
  },
  {
    id: "sports",
    name: "Sân bóng đá",
    english: "Football field",
    x: 24,
    z: 3,
    icon: "ball",
    color: "#86ac78",
  },
  {
    id: "garden",
    name: "Vườn học tập",
    english: "Learning garden",
    x: 0,
    z: 21,
    icon: "leaf",
    color: "#97b990",
  },
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
  b.kind !== "housing" && b.kind !== "pavilion";
/** Furniture positions are shared by rendering and navigation. A clear centre aisle connects every room to its door. */
type Furniture = MapPoint & {
  w: number;
  d: number;
  kind: Building["kind"] | "stage";
};
export const ROOM_FURNITURE = EXPANSION_BUILDINGS.filter(
  isOpenRoom,
).flatMap<Furniture>((b) => {
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
  const rows = b.kind === "dining" ? 3 : 2;
  return Array.from({ length: rows * 2 }, (_, i) => ({
    x: b.x + (i % 2 ? 1 : -1) * b.w * 0.28,
    z: b.z - b.d / 2 + 1.8 + Math.floor(i / 2) * 1.8,
    w: b.kind === "dining" ? 2.6 : 2.4,
    d: 0.8,
    kind: b.kind,
  }));
});
export const MAP_OBSTACLES = [
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

export function canWalkCampus(x: number, z: number) {
  return (
    Number.isFinite(x) &&
    Number.isFinite(z) &&
    x > MAP_BOUNDS.minX &&
    x < MAP_BOUNDS.maxX &&
    z > MAP_BOUNDS.minZ &&
    z < MAP_BOUNDS.maxZ &&
    !MAP_OBSTACLES.some(
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
