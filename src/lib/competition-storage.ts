import { MongoServerError } from 'mongodb';
import { createCompetitionEngine, ROOM_IDLE_MS, RoomError, seatHash, type Room } from './competition-server.ts';
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
type RoomAccount = string | Promise<string>;

async function updateRoom(code: unknown, requestedAt: number, account: RoomAccount, run: (engine: Engine, now: number, accountId: string) => Promise<Packet>) {
  const _id = typeof code === 'string' && /^[A-F0-9]{6}$/i.test(code) ? code.toUpperCase() : null;
  async function initialRead() {
    if (!_id) return null;
    const rooms = await roomsCollection();
    const filter = { _id, expiresAt: { $gt: new Date(requestedAt) } };
    return { rooms, filter, stored: await rooms.findOne(filter) };
  }
  // Verify the session concurrently with the first room read. Writes still
  // require both the session and the seat token owned by that account.
  const [accountId, initial] = await Promise.all([account, initialRead()]);
  if (!initial || !_id) throw missingRoom();
  const { rooms } = initial;
  for (let attempt = 0; attempt < 10; attempt++) {
    const stored: RoomDocument | null = attempt === 0 ? initial.stored : await rooms.findOne(initial.filter);
    if (!stored) throw missingRoom();
    const room = deserialize(stored.state);
    const map: Map<string, Room> = new Map([[_id, room]]);
    const engine = createCompetitionEngine(map);
    const now = Math.max(requestedAt, room.updated, room.view.serverNow);
    const version = room.view.revision, updated = room.updated;
    const result = await run(engine, now, accountId);
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

export async function loadCompetitionRoom(code: unknown, token: string, account: RoomAccount, now = Date.now()) {
  return (await updateRoom(code, now, account, async (engine, time, accountId) => {
    const view = engine.roomSnapshot(code, token, time, accountId);
    return { room: await engine.recordFinishedPractice(view, time) };
  })).room;
}

export async function changeCompetitionRoom(input: Record<string, unknown>, account: RoomAccount, now = Date.now()) {
  if (input.action !== 'create' && input.action !== 'practice') {
    return updateRoom(input.code, now, account, async (engine, time, accountId) => {
      const result = engine.roomAction(input, time, accountId);
      return { ...result, room: await engine.recordFinishedPractice(result.room, time) };
    });
  }
  const [accountId, rooms] = await Promise.all([account, roomsCollection()]);
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

/** Read the shared MongoDB change stream without sending credentials or seat metadata to clients. */
export async function watchCompetitionRoom(
  code: string, token: string, accountId: string, signal: AbortSignal,
  onChange: (room: Room['view'] | null) => void,
) {
  const hash = seatHash(token), rooms = await roomsCollection();
  if (signal.aborted) return;
  const changes = rooms.watch([
    { $match: { 'documentKey._id': code } },
  ], { fullDocument: 'updateLookup', maxAwaitTimeMS: 2000 });
  const close = () => { void changes.close().catch(() => {}); };
  signal.addEventListener('abort', close, { once: true });
  try {
    for await (const change of changes) {
      if (signal.aborted) return;
      if (change.operationType === 'delete') { onChange(null); return; }
      if (!('fullDocument' in change)) continue;
      const stored = change.fullDocument;
      if (!stored) { onChange(null); return; }
      const seat = stored.state.tokens.find(([, tokenHash]) => tokenHash === hash)?.[0];
      if (!seat || !stored.state.accountSeats.some(([id, owner]) => id === seat && owner === accountId)) {
        onChange(null);
        return;
      }
      onChange(stored.state.view);
    }
  } finally {
    signal.removeEventListener('abort', close);
    await changes.close();
  }
}

/** A room invitation may only point to an open lobby owned by its sender. */
export async function invitableRace(code: unknown, sender: string, recipient: string, now: number) {
  if (typeof code !== 'string' || !/^[A-F0-9]{6}$/i.test(code)) throw missingRoom();
  const rooms = await roomsCollection();
  const stored = await rooms.findOne({ _id: code.toUpperCase(), expiresAt: { $gt: new Date(now) } });
  const room = stored?.state.view;
  const seats = stored?.state.accountSeats ?? [];
  if (room?.format !== 'online' || room.phase !== 'lobby'
      || !seats.some(([seat, account]) => seat === room.hostId && account === sender))
    throw new RoomError('This lobby is no longer open for invitations.', 409);
  if (seats.some(([, account]) => account === recipient))
    throw new RoomError('This friend already has a seat in the lobby.', 409);
  if (room.members.every(member => member.kind === 'human') && room.members.length >= 4)
    throw new RoomError('This lobby is full.', 409);
  return { code: room.code, mode: room.mode };
}
