import { computerLab, languageLab } from './learning-room-layout.ts';
import { WORKSHOPS, type WorkshopId } from './workshop-wing.ts';

export type StudySubject = 'language' | 'computer' | WorkshopId;
type Location = readonly [number, number];
type Room = { x: number; z: number };

function studyLayout(subject: StudySubject, room: Room, tables: readonly Location[], shelves: readonly Location[]) {
  const furniture = [
    ...tables.map(([x, z], index) => ({ unit: 'table' as const, index, x, z, w: 3.32, d: 2.96 })),
    ...shelves.map(([x, z], index) => ({ unit: 'shelf' as const, index, x, z, w: 2.50, d: .80 })),
  ];
  return furniture.map(item => ({ ...item, subject, worldX: room.x + item.x, worldZ: room.z + item.z }));
}

// Chairs are included in each table's footprint. Render and navigation share these anchors.
export const studyGroups = [
  ...studyLayout('language', languageLab,
    [[-4.65, -3.55], [-4.65, 2.85], [4.65, -.30]], [[-4.8, -7.55], [9.15, .65]]),
  ...studyLayout('computer', computerLab, [[-4.8, -.18], [4.8, -.18]], [[8.12, .10]]),
  ...WORKSHOPS.flatMap(room => studyLayout(room.kind, room,
    [[-4.55, -3.75], [4.55, -3.75], [-4.55, 3.75], [4.55, 3.75]],
    [[4.55, -9.65], [-4.55, 9.65]])),
];

export const studyObstacles = studyGroups.map(f => ({ x: f.worldX, z: f.worldZ, w: f.w, d: f.d }));
