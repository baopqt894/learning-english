import { createHash } from 'node:crypto';
import { MongoServerError, type Filter } from 'mongodb';
import { campusDatabase } from './mongodb.ts';
import type { CompetitionId, RaceDifficulty } from './competition-catalog.ts';

export type RaceRecord = {
  name: string;
  avatar?: number;
  milliseconds: number;
  correct: number;
  achievedAt: number;
};
export type StoredRecord = RaceRecord & { swimPacing?: 3; profile: string; mode: CompetitionId; difficulty: RaceDifficulty };
export type RaceBoard = { entries: RaceRecord[]; personal: (RaceRecord & { rank: number }) | null };
export type RecordStore = {
  save(record: StoredRecord): Promise<boolean>;
  board(mode: CompetitionId, difficulty: RaceDifficulty, profile: string | null): Promise<RaceBoard>;
};

type RecordRow = StoredRecord & { _id: string };
const byTime = { milliseconds: 1, correct: -1, achievedAt: 1, _id: 1 } as const;
const key = (mode: CompetitionId, difficulty: RaceDifficulty, profile: string, swimPacing?: 3) => `${mode}:${difficulty}:${profile}${swimPacing ? ":ten-correct" : ""}`;
let index: Promise<string> | undefined;

async function records() {
  const collection = campusDatabase().collection<RecordRow>('race_records');
  index ??= collection.createIndex({ mode: 1, difficulty: 1, ...byTime }).catch(error => {
    index = undefined;
    throw error;
  });
  await index;
  return collection;
}

export function raceProfile(value: unknown) {
  return typeof value === 'string' && /^[a-f0-9]{32}$/i.test(value)
    ? createHash('sha256').update(value.toLowerCase()).digest('hex')
    : null;
}

function publicRecord({ name, avatar, milliseconds, correct, achievedAt }: RecordRow): RaceRecord {
  return { name, avatar, milliseconds, correct, achievedAt };
}

export const raceRecords: RecordStore = {
  async board(mode, difficulty, profile) {
    const collection = await records(), event = { mode, difficulty, swimPacing: 3 as const };
    const [rows, mine] = await Promise.all([
      collection.find(event).sort(byTime).limit(10).toArray(),
      profile ? collection.findOne({ _id: key(mode, difficulty, profile,event.swimPacing) }) : null,
    ]);
    if (!mine) return { entries: rows.map(publicRecord), personal: null };
    const { milliseconds, correct, achievedAt } = mine;
    const rank = 1 + await collection.countDocuments({ ...event, $or: [
      { milliseconds: { $lt: milliseconds } },
      { milliseconds, correct: { $gt: correct } },
      { milliseconds, correct, achievedAt: { $lt: achievedAt } },
      { milliseconds, correct, achievedAt, _id: { $lt: mine._id } },
    ] });
    return { entries: rows.map(publicRecord), personal: { ...publicRecord(mine), rank } };
  },
  async save(record) {
    const collection = await records();
    const { mode, difficulty, profile, milliseconds, correct, achievedAt } = record;
    const _id = key(mode, difficulty, profile,record.swimPacing), row = { ...record, _id };
    const faster: Filter<RecordRow> = { _id, $or: [
      { milliseconds: { $gt: milliseconds } },
      { milliseconds, correct: { $lt: correct } },
      { milliseconds, correct, achievedAt: { $gt: achievedAt } },
    ] };
    if ((await collection.replaceOne(faster, row)).matchedCount) return true;
    try {
      await collection.insertOne(row);
      return true;
    } catch (error) {
      if (!(error instanceof MongoServerError) || error.code !== 11000) throw error;
      if ((await collection.replaceOne(faster, row)).matchedCount) return true;
      // A second polling request may have already saved this exact finish.
      return !!await collection.findOne({ _id, milliseconds, correct, achievedAt }, { projection: { _id: 1 } });
    }
  },
};
