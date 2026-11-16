import type { SportsVenueId } from './sports-layout.ts';

const DAY = 86_400_000;
const VIETNAM_OFFSET = 7 * 3_600_000;
export const campusDay = (time: number) => Math.floor((time + VIETNAM_OFFSET) / DAY);
export const campusDayLabel = (day: number) =>
  new Intl.DateTimeFormat('en-GB', { dateStyle: 'long', timeZone: 'UTC' }).format(day * DAY);

export type DailyMissionId = 'course' | 'streak' | 'practice' | 'team-finish' | 'team-english';
export type DailyProgress = { day: number; completed: DailyMissionId[]; pastXP: number };
export type DailyEvent = { type: 'race'; venue: SportsVenueId; streak: number; team?: { together: boolean; threeEach: boolean } } | { type: 'quiz' };

export function dailyMissions(day: number) {
  const venue = day % 2 === 0 ? 'pool' : 'track';
  return [
    { id: 'course', title: venue === 'pool' ? 'Make a splash' : 'Take to the track', description: venue === 'pool' ? 'Finish a swim. Practice and online races both count.' : 'Finish a sprint or hurdle race in either mode.', xp: 20, venue },
    { id: 'streak', title: 'On a roll', description: 'Get 3 English answers right in a row in one race.', xp: 25, venue: null },
    { id: 'practice', title: 'Words around campus', description: 'Pass a “Practise English here” quiz at any campus location.', xp: 15, venue: null },
    { id: 'team-finish', title: 'Finish together', description: 'You and a friend must both finish the same online race.', xp: 25, venue: null, team: true },
    { id: 'team-english', title: 'Team English', description: 'Finish an online race with a friend. Get at least 3 answers right each.', xp: 35, venue: null, team: true },
  ] as const;
}

export function dailyXP(progress?: DailyProgress) {
  return progress ? progress.pastXP + dailyMissions(progress.day).reduce((sum, mission) => sum + (progress.completed.includes(mission.id) ? mission.xp : 0), 0) : 0;
}

export function currentDaily(progress: DailyProgress | undefined, day: number): DailyProgress {
  return progress && progress.day >= day ? progress : { day, completed: [], pastXP: dailyXP(progress) };
}

export function recordDaily(progress: DailyProgress | undefined, day: number, event: DailyEvent): DailyProgress | undefined {
  if (progress && progress.day > day) return progress;
  const state = currentDaily(progress, day);
  const course = dailyMissions(day)[0];
  const earned: DailyMissionId[] = event.type === 'quiz' ? ['practice'] : [
    ...(event.venue === course.venue ? ['course' as const] : []),
    ...(event.streak >= 3 ? ['streak' as const] : []),
    ...(event.team?.together ? ['team-finish' as const] : []),
    ...(event.team?.together && event.team.threeEach ? ['team-english' as const] : []),
  ];
  const missing = earned.filter(id => !state.completed.includes(id));
  return missing.length ? { ...state, completed: [...state.completed, ...missing] } : progress;
}

export function restoreDaily(value: unknown): DailyProgress | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const { day, completed, pastXP } = value as Partial<DailyProgress>;
  if (typeof day !== 'number' || !Number.isSafeInteger(day) || day < 0 || day > 100_000_000) return undefined;
  const ids = dailyMissions(day).map(mission => mission.id);
  return {
    day,
    completed: Array.isArray(completed) ? [...new Set(completed.filter(id => ids.includes(id)))] : [],
    pastXP: typeof pastXP === 'number' && Number.isSafeInteger(pastXP) && pastXP > 0 ? pastXP : 0,
  };
}
