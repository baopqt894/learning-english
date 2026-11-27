// Dimensions and local fixture positions are in metres. All entrances face south (+z).
export const languageLab = {x:30.75,z:-2,w:31.5,d:21};
export const computerLab = {x:31,z:-27.25,w:20.8,d:24.5};
export const labEntrance = (room:typeof languageLab) => ({x:room.x,z:room.z+room.d/2});
export const languageMeetingPoint = {x:languageLab.x,z:labEntrance(languageLab).z-3.2};
// Desks face the teaching wall (-z). Each approach is behind its own chair.
export const computerDesks = [-8.20, -4.80, 4.0, 7.35].flatMap(z =>
  [-5.15, 5.15].map(x => ({ x, z, w: 5.64, d: 1.10 })));
export const laptopTables = [[-4.8, -.18], [4.8, -.18]] as const;
export const teacherDesk = {x: -4.95, z: -10.43, w: 3.48, d: 1.18};
export const examStations = [
  ...computerDesks.flatMap(desk => [-1.78, 0, 1.78].map(dx => ({
    x: desk.x + dx, z: desk.z, approachZ: desk.z + 1.70, laptop: false,
  }))),
  ...laptopTables.flatMap(([x,z]) => [-1, 1].flatMap(side => [-1, 1].map(end => ({
    x: x + side * .86, z: z + end * .45, approachZ: z + end * 2.04, laptop: true,
  })))),
].map((station, i) => ({
  id: 'PC-' + String(i + 1).padStart(2, '0'), laptop: station.laptop,
  x: computerLab.x + station.x, z: computerLab.z + station.z,
  approach: {x: computerLab.x + station.x, z: computerLab.z + station.approachZ},
}));
export type ExamStation = typeof examStations[number];
export function nearbyExamStation(point: {x: number; z: number}) {
  if (Math.abs(point.x - computerLab.x) > computerLab.w / 2 || Math.abs(point.z - computerLab.z) > computerLab.d / 2) return;
  let nearest: ExamStation | undefined;
  let best = 1.12;
  for (const station of examStations) {
    const distance = Math.hypot(point.x - station.approach.x, point.z - station.approach.z);
    if (distance < best) { best = distance; nearest = station; }
  }
  return nearest;
}

export const boothX=-languageLab.w/2+2.1;
export const listeningBooths=[-6.6,-4.15,-1.7,1.7,4.15,6.6];
export const listeningStations = [-1,1].flatMap(wall => listeningBooths.map((z,index) => {
  const x = wall * -boothX;
  return {id:(wall<0?'A':'B')+(index+1), wall, x, z, worldX:languageLab.x+x, worldZ:languageLab.z+z,
    approach:{x:languageLab.x+x-wall*2.58, z:languageLab.z+z}};
}));
export function nearbyListeningStation(point:{x:number;z:number}) {
  return listeningStations.find(s=>Math.hypot(point.x-s.approach.x,point.z-s.approach.z)<1.12);
}
export const conversationPods=[{x:7.00,z:-5.00},{x:7.00,z:5.30}];
export const shelf={x:8.8,z:-languageLab.d/2+1.0};
export const globe={x:4.5,z:-languageLab.d/2+1.24};
export const recordingDesk={x:-7.7,z:-languageLab.d/2+.85};
export const languageFurniture=[
  ...listeningStations.map(s=>({x:s.x-s.wall*.6,z:s.z,w:2.85,d:1.96})),
  ...conversationPods.map(p=>({...p,w:3.8,d:3.3})),
  {...shelf,w:3.36,d:1.2},
  {...globe,w:.94,d:1.02}, {...recordingDesk,w:2.3,d:.72},
];
