import { computerLab, laptopTables, languageLab } from './learning-room-layout.ts';
import { WORKSHOPS, workshopPlans, type WorkshopId } from './workshop-wing.ts';

export type StudySubject = 'language' | 'computer' | WorkshopId;
type Location = readonly [number, number];
type Room = { x: number; z: number };

function studyLayout(subject: StudySubject, room: Room, tables: readonly Location[], shelves: readonly Location[]) {
  const furniture = [
    ...tables.map(([x,z],index)=>{
      // Join the long edges of paired work benches. Orchestra stands turn towards the conductor.
      const alongRoom=subject==='plant-lab'||subject==='light-lab'||subject==='kitchen'&&index<6||subject==='art'&&index<6;
      const yaw=alongRoom?Math.PI/2:subject==='music'?Math.atan2(x,z+15)*.28:0;
      const c=Math.abs(Math.cos(yaw)),s=Math.abs(Math.sin(yaw));
      const depth=subject==='music'?2.70:2.96;
      return {unit:'table' as const,index,x,z,yaw,w:3.32*c+depth*s,d:depth*c+3.32*s};
    }),
    ...shelves.map(([x, z], index) => ({ unit: 'shelf' as const, index, x, z, yaw:0, w: 2.50, d: .80 })),
  ];
  return furniture.map(item => ({ ...item, subject, worldX: room.x + item.x, worldZ: room.z + item.z }));
}

// Chairs are included in each table's footprint. Render and navigation share these anchors.
export const studyGroups = [
  ...studyLayout('language', languageLab,
    [[-4.65, -3.55], [-4.65, 2.85], [4.65, -.30]], [[-4.8, -7.55], [9.15, .65]]),
  ...studyLayout('computer', computerLab, laptopTables, [[8.12, .10]]),
  ...WORKSHOPS.flatMap(room => studyLayout(room.kind, room,
    workshopPlans[room.kind].tables, workshopPlans[room.kind].shelves)),
];

export const studyObstacles = studyGroups.map(f => ({ x: f.worldX, z: f.worldZ, w: f.w, d: f.d }));
