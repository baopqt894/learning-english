// World-space footprints are shared by the map, the furniture and the desk prompt.
export const READING_PAVILION = {
  x: 0, z: 26, w: 9, d: 7, h: 3, name: 'NHÀ CHÒI ĐỌC SÁCH', roof: 0x5c7750, kind: 'pavilion',
} as const;
const {x, z, d} = READING_PAVILION;
export const READING_TABLES = [-2.2, 2.2].map(dx => ({x:x+dx, z, w:2.15, d:1.12}));
export const READING_SEATS = READING_TABLES.flatMap(t =>
  [-1, 1].map(side => ({x:t.x, z:t.z+side*.98, w:1.52, d:.39})));
export const BOOKCASES = [-2.08, 2.08].map(dx => ({x:x+dx, z:z-d/2+.55, w:3.18, d:.64}));
export const READING_APPROACH = {x:x+.55, z};

export function nearReadingTable(point: {x:number; z:number}) {
  return READING_TABLES.some(t => {
    const dx = Math.max(0, Math.abs(point.x-t.x) - t.w/2);
    const dz = Math.max(0, Math.abs(point.z-t.z) - t.d/2);
    return Math.hypot(dx,dz) <= .95;
  });
}
