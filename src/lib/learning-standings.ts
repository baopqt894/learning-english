import { LEVEL_MISSIONS } from './cadet-tiers.ts';
import { RESIDENT_MISSIONS } from './resident-missions.ts';
import { PLACE_PRACTICE } from './place-practice.ts';
import { campusDatabase } from './mongodb.ts';

export type LearningRank = { name: string; avatar: number; points: number; rank: number; isMe: boolean };
export type LearningBoard = { entries: LearningRank[]; personal: LearningRank | null };

const counted = [
  ...Object.keys(PLACE_PRACTICE).map(id => 'quiz/' + id),
  ...Object.keys(LEVEL_MISSIONS).map(id => 'mission/' + id),
  ...Object.keys(RESIDENT_MISSIONS).map(id => 'resident/' + id),
];

export async function learningStandings(accountId: string): Promise<LearningBoard> {
  const publicRow = { _id: 0, rank: 1, name: 1, avatar: 1, points: 1, isMe: { $eq: ['$id', accountId] } };
  const [board] = await campusDatabase().collection('accounts')
    .aggregate<{ entries: LearningRank[]; personal: LearningRank[] }>([
      { $project: { _id: 0, id: 1, name: '$save.progress.name', avatar: { $cond: [{ $eq: ['$save.progress.avatar', 1] }, 1, 0] },
        points: { $size: { $setIntersection: [{ $ifNull: ['$save.progress.challenges', []] }, counted] } } } },
      { $match: { points: { $gt: 0 } } },
      { $setWindowFields: { sortBy: { points: -1 }, output: { rank: { $rank: {} } } } },
      { $facet: {
        entries: [{ $sort: { rank: 1, name: 1, id: 1 } }, { $limit: 10 }, { $project: publicRow }],
        personal: [{ $match: { id: accountId } }, { $project: publicRow }],
      } },
    ]).toArray();
  return { entries: board?.entries ?? [], personal: board?.personal[0] ?? null };
}
