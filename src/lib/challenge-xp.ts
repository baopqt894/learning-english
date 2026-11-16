import { DISTRICT_STATIONS } from './campus-districts-layout.ts';
import { COMPETITIONS } from './competition-catalog.ts';
import { LEVEL_MISSIONS } from './cadet-tiers.ts';
import { PLACE_PRACTICE } from './place-practice.ts';

const awards = new Map<string, number>([
  ...DISTRICT_STATIONS.map(({ id }): [string, number] => [`station/${id}`, id === 'balance' ? 60 : 35]),
  ...Object.keys(PLACE_PRACTICE).map((id): [string, number] => [`quiz/${id}`, 20]),
  ...Object.keys(COMPETITIONS).flatMap((id): [string, number][] => [
    [`race/${id}`, 40], [`race/${id}/A2`, 55], [`race/${id}/B1`, 70],
  ]),
  ['station/balance/A2', 80],
  ['station/balance/B1', 110],
  ...Object.entries(LEVEL_MISSIONS).map(([id, mission]): [string, number] => [`mission/${id}`, mission.xp]),
]);

export function restoreChallenges(raw: unknown): string[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  return [...new Set(raw.filter((id): id is string => typeof id === 'string' && awards.has(id)))];
}

export function challengeXP(completed?: readonly string[]) {
  return [...new Set(completed)].reduce((sum, id) => sum + (awards.get(id) ?? 0), 0);
}

export function completeChallenge(completed: string[] | undefined, id: string) {
  return awards.has(id) && !completed?.includes(id) ? [...(completed ?? []), id] : completed;
}

export function cadetLevel(xp: number) {
  const perLevel = 150;
  return { level: Math.floor(xp / perLevel) + 1, earned: xp % perLevel, remaining: perLevel - xp % perLevel, perLevel };
}
