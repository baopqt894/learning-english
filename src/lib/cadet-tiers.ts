export const ENGLISH_TIERS = ['A1', 'A2', 'B1'] as const;
export type EnglishTier = typeof ENGLISH_TIERS[number];

export const TIER_LEVEL: Record<EnglishTier, number> = { A1: 1, A2: 2, B1: 3 };

export function englishTier(level: number): EnglishTier {
  return level >= TIER_LEVEL.B1 ? 'B1' : level >= TIER_LEVEL.A2 ? 'A2' : 'A1';
}

export const LEVEL_MISSIONS = {
  'field-briefing': {
    title: 'Field readiness briefing', area: 'training', place: 'Training ground',
    level: 2, tier: 'A2', count: 4, xp: 65,
    brief: 'Read the instructions and duty notes. Choose what your team should do at the training ground.',
  },
  'team-leader': {
    title: 'Discovery Day team lead', area: 'hall', place: 'Assembly hall',
    level: 3, tier: 'B1', count: 5, xp: 100,
    brief: 'Interpret changes to the schedule, report what happened and guide your team through Discovery Day.',
  },
  'language-desk': {
    title: 'Open Day listening desk', area: 'language', place: 'Language lab',
    level: 4, tier: 'B1', count: 4, listen: 2, dictation: 0, xp: 150,
    brief: 'Listen for times and room changes. Complete short messages for the cadets at the welcome desk.',
  },
  'meal-coordinator': {
    title: 'Lunch service coordinator', area: 'dining', place: 'Dining hall',
    level: 5, tier: 'B1', count: 4, listen: 2, dictation: 0, xp: 150,
    brief: 'Listen to meal requests and changes. Fill in the notices the kitchen team will use at lunch.',
  },
  'tech-check': {
    title: 'Digital guide handover', area: 'computer', place: 'Computer lab',
    level: 6, tier: 'B1', count: 5, listen: 2, dictation: 1, xp: 150,
    brief: 'Listen to the tech team, then type the missing word in a voice note and complete the handover instructions.',
  },
  'garden-tour': {
    title: 'Reading garden guide', area: 'garden', place: 'Reading garden',
    level: 7, tier: 'B1', count: 5, listen: 2, dictation: 1, xp: 150,
    brief: 'Pick out directions and exceptions in spoken messages. Complete the instructions for your visitors.',
  },
  'harvest-handover': {
    title: 'Harvest delivery lead', area: 'vegetable-garden', place: 'Vegetable garden',
    level: 8, tier: 'B1', count: 6, listen: 3, dictation: 1, xp: 150,
    brief: 'Listen to changes in the harvest plan, then complete a handover for the next team.',
  },
  'animal-care-report': {
    title: 'Animal care shift lead', area: 'livestock', place: 'Animal care yard',
    level: 9, tier: 'B1', count: 6, listen: 3, dictation: 1, xp: 150,
    brief: 'Use spoken reports and written notes to decide what the incoming care team should do next.',
  },
  'open-day-debrief': {
    title: 'Open Day debrief', area: 'classroom-b', place: 'Classroom A2',
    level: 10, tier: 'B1', count: 6, listen: 3, dictation: 1, xp: 150,
    brief: 'Compare what was planned with what happened. Listen for causes and complete your team’s recommendations.',
  },
  'courtyard-radio': {
    title: 'Courtyard welcome relay', area: 'courtyard', place: 'Courtyard',
    level: 11, tier: 'B1', count: 4, listen: 1, dictation: 0, speak: 2, xp: 150,
    brief: 'Listen and repeat short directions for arriving visitors.',
  },
  'library-pickup': {
    title: 'Library booking desk', area: 'library', place: 'Library',
    level: 12, tier: 'B1', count: 4, listen: 1, dictation: 0, speak: 2, xp: 150,
    brief: 'Pass on collection times and changes to library bookings.',
  },
  'canteen-orders': {
    title: 'Canteen order handoff', area: 'canteen', place: 'Canteen',
    level: 13, tier: 'B1', count: 4, listen: 1, dictation: 0, speak: 2, xp: 150,
    brief: 'Repeat order changes while keeping the original request clear.',
  },
  'dormitory-brief': {
    title: 'Dormitory duty handover', area: 'dormitory', place: 'Dormitory',
    level: 14, tier: 'B1', count: 5, listen: 2, dictation: 0, speak: 2, xp: 150,
    brief: 'Relay duty instructions with a sequence or a time limit.',
  },
  'classroom-tutor': {
    title: 'Classroom peer tutor', area: 'classrooms', place: 'Classroom A1',
    level: 15, tier: 'B1', count: 5, listen: 2, dictation: 0, speak: 2, xp: 150,
    brief: 'Repeat explanations and clarify what a partner should do next.',
  },
  'pond-observer': {
    title: 'Fish pond observation log', area: 'fish-pond', place: 'Fish pond',
    level: 16, tier: 'B1', count: 5, listen: 2, dictation: 0, speak: 2, xp: 150,
    brief: 'Report observations and distinguish a change from its likely cause.',
  },
  'football-captain': {
    title: 'Football captain’s briefing', area: 'sports', place: 'Football pitch',
    level: 17, tier: 'B1', count: 5, listen: 2, dictation: 0, speak: 2, xp: 150,
    brief: 'Relay team decisions that include conditions and exceptions.',
  },
  'pool-announcer': {
    title: 'Pool safety announcer', area: 'swimming', place: 'Pool registration deck',
    level: 18, tier: 'B1', count: 6, listen: 2, dictation: 0, speak: 3, xp: 150,
    brief: 'Repeat announcements that combine a rule with an exception.',
  },
  'track-official': {
    title: 'Track meet official', area: 'athletics', place: 'Track registration',
    level: 19, tier: 'B1', count: 6, listen: 2, dictation: 0, speak: 3, xp: 150,
    brief: 'Report what happened before a race and explain what changes next.',
  },
  'field-final': {
    title: 'Field games broadcast', area: 'field-games', place: 'Field games registration',
    level: 20, tier: 'B1', count: 6, listen: 2, dictation: 0, speak: 3, xp: 150,
    brief: 'Relay multi-part announcements about changes, conditions and results.',
  },
} as const;
export type LevelMissionId = keyof typeof LEVEL_MISSIONS;
export const LEVEL_MISSION_IDS = Object.keys(LEVEL_MISSIONS) as LevelMissionId[];
