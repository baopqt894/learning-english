export const SPORTS_VENUES = {
  pool: { name: 'Campus pool', sign: 'POOL REGISTRATION', icon: 'pool', desk: { x: 83, z: -34.8, w: 4.2, d: 1.35 }, approach: { x: 83, z: -32.45 }, radius: 2.25 },
  track: { name: 'Training track', sign: 'TRACK REGISTRATION', icon: 'run', desk: { x: -16, z: -65.15, w: 4.2, d: 1.35 }, approach: { x: -16, z: -63 }, radius: 2.25 },
  field: { name: 'School games field', sign: 'FIELD REGISTRATION', icon: 'ball', desk: { x: 40, z: 21.9, w: 3.4, d: 1.15 }, approach: { x: 40, z: 20 }, radius: 2.25 },
} as const;

export type SportsVenueId = keyof typeof SPORTS_VENUES;
export const SPORTS_VENUE_IDS = Object.keys(SPORTS_VENUES) as SportsVenueId[];
export const ATHLETICS_TRACK = { x: 0, z: -71, w: 46, d: 9, start: -20, finish: 20, laneWidth: 2 };
export const TRACK_STANDS = [-12, 0, 12].map(x => ({ x, z: -80, w: 10.8, d: 3.65 }));
export const TRACK_BENCHES = [{ x: 5, z: -64.6, w: 3.3, d: .8 }, { x: 11, z: -64.6, w: 3.3, d: .8 }];
export const POOL_WATCH = [{ x: 64, z: -37.65, w: 3.3, d: .8 }, { x: 69, z: -37.65, w: 3.3, d: .8 }];
export const POOL_TOWER = { x: 91.4, z: -45.5, w: 1.6, d: 1.58 };

export function nearbySportsVenue(x: number, z: number) {
  return SPORTS_VENUE_IDS.find(id => {
    const { approach, radius } = SPORTS_VENUES[id];
    return Math.hypot(x - approach.x, z - approach.z) <= radius;
  });
}

export const SPORTS_OBSTACLES = [
  ...SPORTS_VENUE_IDS.map(id => SPORTS_VENUES[id].desk),
  ...TRACK_STANDS, ...TRACK_BENCHES, ...POOL_WATCH, POOL_TOWER,
];
