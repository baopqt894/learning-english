export const STADIUM = { x: 1, z: -93, straight: 48, innerRadius: 13.25, laneWidth: 1.9, lanes: 4 };
export const TRACK_OUTER_RADIUS = STADIUM.innerRadius + STADIUM.laneWidth * STADIUM.lanes;
export const STADIUM_FLOORS = { running: .093, pitch: .068 };
export const SPORTS_FIELD = { x: STADIUM.x, z: STADIUM.z, w: 43, d: 22 };
export const ATHLETICS_TRACK = {
  x: STADIUM.x, z: STADIUM.z + STADIUM.innerRadius + (TRACK_OUTER_RADIUS - STADIUM.innerRadius) / 2,
  w: STADIUM.straight, d: STADIUM.laneWidth * STADIUM.lanes,
  start: STADIUM.x - 20, finish: STADIUM.x + 20, laneWidth: STADIUM.laneWidth,
};
export const FIELD_GAMES_COURSE = { x: SPORTS_FIELD.x, z: SPORTS_FIELD.z, w: 24, d: SPORTS_FIELD.d, start: SPORTS_FIELD.z + 10 };
export const STADIUM_LOBBIES = { track: { x: -7, z: -68 }, field: { x: 16, z: -68 } };
export const PITCH_APPROACH = { x: SPORTS_FIELD.x, z: SPORTS_FIELD.z };
export const FOOTBALL_GOALS = [-1, 1].map(side => ({
  x: SPORTS_FIELD.x + side * (SPORTS_FIELD.w / 2 - .45),
  z: SPORTS_FIELD.z, back: side * 1.32, width: 5.6,
}));

export function stadiumDistance(x: number, z: number) {
  return Math.hypot(Math.max(0, Math.abs(x - STADIUM.x) - STADIUM.straight / 2), z - STADIUM.z);
}

export const SPORTS_VENUES = {
  pool: { name: 'Campus pool', sign: 'POOL REGISTRATION', icon: 'pool', desk: { x: 83, z: -34.8, w: 4.2, d: 1.35 }, approach: { x: 83, z: -32.45 }, radius: 2.25 },
  track: { name: 'Training track', sign: 'TRACK REGISTRATION', icon: 'run', desk: { x: -18, z: -69.55, w: 4.2, d: 1.35 }, approach: { x: -18, z: -67.1 }, radius: 2.25 },
  field: { name: 'School games field', sign: 'FIELD REGISTRATION', icon: 'ball', desk: { x: 23, z: -69.55, w: 3.8, d: 1.35 }, approach: { x: 23, z: -67.1 }, radius: 2.25 },
} as const;

export type SportsVenueId = keyof typeof SPORTS_VENUES;
export const SPORTS_VENUE_IDS = Object.keys(SPORTS_VENUES) as SportsVenueId[];
export const TRACK_STANDS = [-16, 1, 18].map(x => ({ x, z: -118, w: 14.6, d: 4.0 }));
export const TRACK_BENCHES = [-26, 30].map(x => ({ x, z: -70.8, w: 3.3, d: .8 }));
export const STADIUM_LIGHTS = [-32, 32].map(x => ({ x, z: -112, w: .18, d: .18 }));
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
  ...TRACK_STANDS, ...TRACK_BENCHES, ...STADIUM_LIGHTS, ...POOL_WATCH, POOL_TOWER,
  ...FOOTBALL_GOALS.flatMap(({ x, z, back, width }) => [
    { x: x + back / 2, z: z - width / 2, w: Math.abs(back), d: .10 },
    { x: x + back / 2, z: z + width / 2, w: Math.abs(back), d: .10 },
    { x: x + back, z, w: .10, d: width },
  ]),
];
