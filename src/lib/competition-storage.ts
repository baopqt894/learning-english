import { MongoServerError } from 'mongodb';
import { createCompetitionEngine, ROOM_IDLE_MS, RoomError, type Room } from './competition-server.ts';
import { campusDatabase } from './mongodb.ts';

type StoredRoom = Omit<Room, 'accountSeats' | 'tokens' | 'seen' | 'write'> & {
  accountSeats: [string, string][];
  tokens: [string, string][];
  seen: [string, number][];
};
type RoomDocument = { _id: string; version: number; expiresAt: Date; state: StoredRoom };
let expiryIndex: Promise<string> | undefined;

async function roomsCollection() {
  const rooms = campusDatabase().collection<RoomDocument>('competition_rooms');
  expiryIndex ??= rooms.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }).catch(error => {
    expiryIndex = undefined;
    throw error;
  });
  await expiryIndex;
  return rooms;
}

function serialize(room: Room): StoredRoom {
  const { view, profile, updated, retryAt, accountSeats, tokens, seen } = room;
  return { view, profile, updated, retryAt, accountSeats: [...accountSeats], tokens: [...tokens], seen: [...seen] };
}

function deserialize(state: StoredRoom): Room {
  return { ...state, accountSeats: new Map(state.accountSeats), tokens: new Map(state.tokens), seen: new Map(state.seen) };
}

const expiry = (room: Room) => new Date(room.updated + ROOM_IDLE_MS);
type Engine = ReturnType<typeof createCompetitionEngine>;
type Packet = ReturnType<Engine['roomAction']>;

async function updateRoom(code: unknown, requestedAt: number, run: (engine: Engine, now: number) => Promise<Packet>) {
  if (typeof code !== 'string' || !/^[A-F0-9]{6}$/i.test(code)) throw missingRoom();
  const _id = code.toUpperCase(), rooms = await roomsCollection();
  for (let attempt = 0; attempt < 10; attempt++) {
    const stored = await rooms.findOne({ _id, expiresAt: { $gt: new Date(requestedAt) } });
    if (!stored) throw missingRoom();
    const room = deserialize(stored.state);
    const map = new Map([[_id, room]]), engine = createCompetitionEngine(map);
    const now = Math.max(requestedAt, room.updated, room.view.serverNow);
    const version = room.view.revision, updated = room.updated;
    const result = await run(engine, now);
    const filter = { _id, version: stored.version };
    if (!map.has(_id)) {
      if ((await rooms.deleteOne(filter)).deletedCount) return result;
    } else if (version === room.view.revision && updated === room.updated) {
      return result;
    } else {
      const write = await rooms.updateOne(filter, {
        $set: { state: serialize(room), expiresAt: expiry(room) },
        $inc: { version: 1 },
      });
      if (write.matchedCount) return result;
    }
  }
  throw new RoomError('The room is busy. Try that again.', 409);
}

function missingRoom() {
  return new RoomError('Room not found. Check the code or create a new room.', 404);
}

export async function loadCompetitionRoom(code: unknown, token: string, accountId: string, now = Date.now()) {
  return (await updateRoom(code, now, async (engine, time) => {
    const view = engine.roomSnapshot(code, token, time, accountId);
    return { room: await engine.recordFinishedPractice(view, time) };
  })).room;
}

export async function changeCompetitionRoom(input: Record<string, unknown>, accountId: string, now = Date.now()) {
  if (input.action !== 'create' && input.action !== 'practice') {
    return updateRoom(input.code, now, async (engine, time) => {
      const result = engine.roomAction(input, time, accountId);
      return { ...result, room: await engine.recordFinishedPractice(result.room, time) };
    });
  }
  const rooms = await roomsCollection();
  for (let attempt = 0; attempt < 5; attempt++) {
    const map = new Map<string, Room>();
    const packet = createCompetitionEngine(map).roomAction(input, now, accountId);
    const _id = packet.room.code, room = map.get(_id)!;
    try {
      await rooms.insertOne({ _id, version: 0, expiresAt: expiry(room), state: serialize(room) });
      return packet;
    } catch (error) {
      if (!(error instanceof MongoServerError) || error.code !== 11000) throw error;
    }
  }
  throw new RoomError('Could not reserve a room code. Try again.', 503);
}
