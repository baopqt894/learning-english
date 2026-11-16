export const ENGLISH_TIERS = ['A1', 'A2', 'B1'] as const;
export type EnglishTier = typeof ENGLISH_TIERS[number];

export const TIER_LEVEL: Record<EnglishTier, number> = { A1: 1, A2: 2, B1: 3 };

export function englishTier(level: number): EnglishTier {
  return level >= TIER_LEVEL.B1 ? 'B1' : level >= TIER_LEVEL.A2 ? 'A2' : 'A1';
}

export const LEVEL_MISSIONS = {
  'field-briefing': {
    title: 'Field readiness briefing', area: 'training', place: 'Training ground',
    tier: 'A2', count: 4, xp: 65,
    brief: 'Read the instructions and duty notes. Choose what your team should do at the training ground.',
  },
  'team-leader': {
    title: 'Discovery Day team lead', area: 'hall', place: 'Assembly hall',
    tier: 'B1', count: 5, xp: 100,
    brief: 'Interpret changes to the schedule, report what happened and guide your team through Discovery Day.',
  },
} as const;
export type LevelMissionId = keyof typeof LEVEL_MISSIONS;
export const LEVEL_MISSION_IDS = Object.keys(LEVEL_MISSIONS) as LevelMissionId[];
