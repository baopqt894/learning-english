export const DORMITORY_B = {
  x: -28, z: 0, w: 16, d: 10, h: 4.6,
  name: 'NHÀ Ở HỌC VIÊN B', roof: 0x956044, kind: 'housing',
} as const;

export const DORMITORY_WALL = .2;
export const DORMITORY_FLOOR = .29;
export const DORMITORY_CLEAR = {
  width: DORMITORY_B.w - DORMITORY_WALL,
  depth: DORMITORY_B.d - DORMITORY_WALL,
};
export const BUNK_LEVELS = [.48, 1.82] as const;
export const MATTRESS_DEPTH = .17;
export const DORMITORY_DESKTOP = 1.19;
export const DORMITORY_BLANKET = { width: 1.15, length: 1.43 };

type Point = { x: number; z: number };
type Fixture = Point & { w: number; d: number; turn: -1 | 0 | 1 | 2 };
const sides = [-1, 1] as const;
const rear = -DORMITORY_CLEAR.depth / 2;

export const DORMITORY_LAYOUT = {
  bunks: [-3.25, -6.13, 3.25, 6.13].map(x => ({
    x, z: rear + 2.45 / 2, w: 1.32, d: 2.45, turn: 0 as const, ladderSide: 1,
  })),
  lockers: sides.map(side => ({ x: side * 4.68, z: rear + .34, w: 1.27, d: .68, turn: 0 as const })),
  linenCabinet: { x: 0, z: rear + .30, w: 2.79, d: .59, turn: 0 },
  wallCabinets: sides.map(side => ({ x: side * 7.60, z: .95, w: 3.72, d: .59, turn: -side as -1 | 1 })),
  desks: sides.flatMap(side => [-.35, 1.87].map(z => ({
    x: side * 5.118, z, w: 4.36, d: .77, turn: 0 as const,
  }))),
  bookShelves: sides.map(side => ({ x: side * 1.465, z: .62, w: 3.20, d: .60, turn: side })),
  shoeBench: { x: -5.48, z: 4.58, w: 3.24, d: .64, turn: 2 },
  towelShelf: { x: -2.63, z: 4.54, w: 1.78, d: .70, turn: 2 },
  seat: { x: 3.85, z: 4.56, w: 2.55, d: .66, turn: 2 },
  laundryShelf: { x: 6.45, z: 4.51, w: 2.18, d: .76, turn: 2 },
  rug: { x: 0, z: .17, w: 1.48, d: 7.40, turn: 0 },
  entryMat: { x: -5.50, z: 3.72, w: 2.73, d: .64, turn: 0 },
  notice: { x: 0, z: rear + .018, y: 1.87 },
} as const;

export const DORMITORY_CHAIRS = DORMITORY_LAYOUT.desks.flatMap(desk =>
  [-1.08, 1.08].map(dx => ({ x: desk.x + dx, z: desk.z + .65, w: .52, d: .53, turn: 0 as const })),
);

export function dormitoryPoint(x: number, z: number): Point {
  return { x: DORMITORY_B.x + x, z: DORMITORY_B.z + z };
}

function footprint(fixture: Fixture, forward = 0) {
  const turned = Math.abs(fixture.turn) === 1;
  const dirX = turned ? fixture.turn : 0;
  const dirZ = turned ? 0 : fixture.turn === 2 ? -1 : 1;
  return {
    ...dormitoryPoint(fixture.x + dirX * forward / 2, fixture.z + dirZ * forward / 2),
    w: turned ? fixture.d + forward : fixture.w,
    d: turned ? fixture.w : fixture.d + forward,
  };
}

const { bunks, lockers, linenCabinet, wallCabinets, desks, bookShelves, shoeBench, towelShelf, seat, laundryShelf, notice } = DORMITORY_LAYOUT;
export const DORMITORY_OBSTACLES = [
  ...bunks.map(bunk => footprint(bunk, .19)),
  ...[...lockers, linenCabinet, ...wallCabinets, ...desks, ...bookShelves, ...DORMITORY_CHAIRS, shoeBench, towelShelf, seat, laundryShelf].map(fixture => footprint(fixture)),
];

export const DORMITORY_DUTY = {
  blanket: { ...dormitoryPoint(bunks[0].x, bunks[0].z + .42), approach: dormitoryPoint(-2.12, -3.04), targetY: DORMITORY_FLOOR + BUNK_LEVELS[0] + MATTRESS_DEPTH + .06 },
  books: { ...dormitoryPoint(4.70, desks[2].z + .06), approach: dormitoryPoint(4.79, .82), targetY: DORMITORY_DESKTOP + .03 },
  shelf: { ...dormitoryPoint(1.58, -.18), approach: dormitoryPoint(2.21, -.07), targetY: DORMITORY_FLOOR + .78 },
  board: { ...dormitoryPoint(notice.x, notice.z), approach: dormitoryPoint(0, -3.77), targetY: notice.y },
  dust: [[.45, 2.97], [-4.71, -1.96], [2.2, 3.12]].map(([x, z]) => ({
    ...dormitoryPoint(x, z), approach: dormitoryPoint(x, z + .67), targetY: DORMITORY_FLOOR,
  })),
};
