import type { CampusPosition } from './campus-map.ts';

export type CampusPeer = CampusPosition & { id: string; name: string; avatar: number };
export const PRESENCE_TTL = 15_000;
export const PRESENCE_RADIUS = 45;
export const MAX_VISIBLE_PEERS = 12;
