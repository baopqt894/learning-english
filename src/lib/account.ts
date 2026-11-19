import type { CampusPosition } from './campus-map.ts';
import type { Progress } from './game.ts';

export const ACCOUNT_USERNAME = /^[a-z0-9_]{3,24}$/;
export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 128;

export type SavedProgress = { revision: number; progress: Progress };
export type Account = { id: string; username: string };
export type PositionCheckpoint = { position: CampusPosition; at: number };
export type AccountSession = Account & { save: SavedProgress; positionSavedAt?: number; serverNow: number; receivedAt?: number };
