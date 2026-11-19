import { createHash, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { MongoServerError } from 'mongodb';
import { ACCOUNT_USERNAME, MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH, type Account, type AccountSession, type SavedProgress } from './account.ts';
import { freshProgress, restoreProgress } from './game.ts';
import { restoreCampusPosition, type CampusPosition } from './campus-map.ts';
import { MAX_VISIBLE_PEERS, PRESENCE_RADIUS, PRESENCE_TTL, type CampusPeer } from './campus-presence.ts';
import { campusDatabase } from './mongodb.ts';

export const ACCOUNT_COOKIE = 'campus_session';
export const SESSION_LIFETIME = 30 * 24 * 60 * 60;
const SESSION_MILLIS = SESSION_LIFETIME * 1000;
const WINDOW = 10 * 60 * 1000;
const DUMMY_SALT = randomBytes(16).toString('hex');
const attempts = new Map<string, { count: number; until: number }>();
let hashesInProgress = 0;

type LoginSession = { hash: string; expires: number; presence?: CampusPosition & { seen: number } };
type StoredAccount = { _id: string; id: string; salt: string; digest: string; sessions: LoginSession[]; save: SavedProgress };

export class AccountError extends Error {
  constructor(message: string, readonly status = 400, readonly current?: SavedProgress) { super(message); }
}

const accounts = () => campusDatabase().collection<StoredAccount>('accounts');
const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

function keyFor(value: unknown) {
  const username = typeof value === 'string' ? value.trim().toLowerCase() : '';
  if (!ACCOUNT_USERNAME.test(username)) throw new AccountError('Tên đăng nhập dùng 3–24 chữ cái không dấu, số hoặc dấu gạch dưới.');
  return username;
}

function passwordFor(value: unknown) {
  if (typeof value !== 'string' || value.trim().length < MIN_PASSWORD_LENGTH || value.length > MAX_PASSWORD_LENGTH)
    throw new AccountError('Mật khẩu phải có từ 8 đến 128 ký tự.');
  return value;
}

function allowAttempt(username: string, now: number) {
  if (hashesInProgress >= 4) throw new AccountError('Máy chủ đang bận. Hãy thử lại sau vài giây.', 429);
  const existing = attempts.get(username);
  if (existing && existing.until > now) {
    if (existing.count >= 8) throw new AccountError('Bạn đã thử nhiều lần. Hãy thử lại sau ít phút.', 429);
    existing.count++;
    return;
  }
  if (attempts.size >= 2000) {
    for (const [key, attempt] of attempts) if (attempt.until <= now) attempts.delete(key);
    if (attempts.size >= 2000) throw new AccountError('Có quá nhiều lượt đăng nhập. Hãy thử lại sau.', 429);
  }
  attempts.set(username, { count: 1, until: now + WINDOW });
}

async function passwordDigest(password: string, salt: string): Promise<Buffer> {
  hashesInProgress++;
  try {
    return await new Promise((resolve, reject) => {
      scrypt(password, salt, 64, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 },
        (error, digest) => error ? reject(error) : resolve(digest));
    });
  } finally { hashesInProgress--; }
}

function newSession(username: string, now: number) {
  const token = randomBytes(32).toString('hex');
  return {
    cookie: `${username}.${token}`,
    entry: { hash: hashToken(token), expires: now + SESSION_MILLIS },
  };
}

export async function registerAccount(input: Record<string, unknown>, now = Date.now()) {
  const username = keyFor(input.username), password = passwordFor(input.password);
  const nickname = typeof input.nickname === 'string'
    ? input.nickname.normalize('NFKC').replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, 24) : '';
  if (!nickname) throw new AccountError('Nhập biệt danh để vào game.');
  allowAttempt(username, now);
  const salt = randomBytes(16).toString('hex');
  const digest = (await passwordDigest(password, salt)).toString('hex');
  const id = randomBytes(16).toString('hex');
  const previous = input.previous ? restoreProgress(JSON.stringify(input.previous)) : freshProgress();
  const save = { revision: 0, progress: { ...previous, name: nickname, avatar: input.avatar === 1 ? 1 : 0 } };
  const { cookie, entry } = newSession(username, now);
  try {
    await accounts().insertOne({ _id: username, id, salt, digest, sessions: [entry], save });
  } catch (error) {
    if (error instanceof MongoServerError && error.code === 11000)
      throw new AccountError('Tên đăng nhập này đã được sử dụng.', 409);
    throw error;
  }
  attempts.delete(username);
  return { cookie, session: { id, username, save } };
}

export async function signInAccount(input: Record<string, unknown>, now = Date.now()) {
  const username = keyFor(input.username), password = passwordFor(input.password);
  allowAttempt(username, now);
  const collection = accounts();
  const stored = await collection.findOne({ _id: username }, { projection: { id: 1, salt: 1, digest: 1 } });
  if (hashesInProgress >= 4) throw new AccountError('Máy chủ đang bận. Hãy thử lại sau vài giây.', 429);
  const digest = await passwordDigest(password, stored?.salt ?? DUMMY_SALT);
  if (!stored || !timingSafeEqual(digest, Buffer.from(stored.digest, 'hex')))
    throw new AccountError('Tên đăng nhập hoặc mật khẩu chưa đúng.', 401);
  const { cookie, entry } = newSession(username, now);
  const updated = await collection.findOneAndUpdate(
    { _id: username, id: stored.id },
    { $push: { sessions: { $each: [entry], $slice: -16 } } },
    { returnDocument: 'after', projection: { id: 1, save: 1 } },
  );
  if (!updated) throw new AccountError('Phiên đăng nhập đã thay đổi.', 401);
  attempts.delete(username);
  return { cookie, session: { id: updated.id, username, save: updated.save } };
}

function cookieParts(cookie: string | undefined) {
  const [username, token, extra] = cookie?.split('.') ?? [];
  if (!username || !token || extra !== undefined || !ACCOUNT_USERNAME.test(username) || !/^[a-f0-9]{64}$/.test(token)) return null;
  return { username, hash: hashToken(token) };
}

export async function signedInAccount(cookie?: string, now = Date.now()): Promise<Account | null> {
  const parts = cookieParts(cookie);
  if (!parts) return null;
  const stored = await accounts().findOne({
    _id: parts.username, sessions: { $elemMatch: { hash: parts.hash, expires: { $gt: now } } },
  }, { projection: { id: 1 } });
  return stored && { id: stored.id, username: parts.username };
}

export async function endSession(cookie?: string) {
  const parts = cookieParts(cookie);
  if (!parts) return;
  await accounts().updateOne({ _id: parts.username }, { $pull: { sessions: { hash: parts.hash } } });
}

export async function accountSession(account: Account): Promise<AccountSession> {
  const stored = await accounts().findOne({ _id: account.username, id: account.id }, { projection: { save: 1 } });
  if (!stored) throw new AccountError('Không đọc được tiến độ. Hãy thử lại sau.', 503);
  return { id: account.id, username: account.username, save: stored.save };
}

export async function saveAccountProgress(account: Account, revision: unknown, data: unknown) {
  if (typeof revision !== 'number' || !Number.isSafeInteger(revision) || revision < 0 || !data || typeof data !== 'object')
    throw new AccountError('Tiến độ gửi lên không hợp lệ.');
  const progress = restoreProgress(JSON.stringify(data));
  if (!progress.name) throw new AccountError('Tiến độ không khớp hồ sơ học viên.');
  const saved = { revision: revision + 1, progress };
  const result = await accounts().updateOne({
    _id: account.username, id: account.id, 'save.revision': revision,
    'save.progress.name': progress.name, 'save.progress.avatar': progress.avatar,
  }, { $set: { save: saved } });
  if (result.matchedCount) return saved;
  const current = (await accountSession(account)).save;
  if (current.progress.name !== progress.name || current.progress.avatar !== progress.avatar)
    throw new AccountError('Tiến độ không khớp hồ sơ học viên.');
  if (JSON.stringify(progress) === JSON.stringify(restoreProgress(JSON.stringify(current.progress)))) return current;
  throw new AccountError('Tiến độ đã được cập nhật ở thiết bị khác.', 409, current);
}

export async function findCadetProfile(username: unknown) {
  const key = keyFor(username);
  const stored = await accounts().findOne({ _id: key }, {
    projection: { id: 1, 'save.progress.name': 1, 'save.progress.avatar': 1 },
  });
  if (!stored) throw new AccountError('No cadet found with that username.', 404);
  return {
    id: stored.id,
    profile: { username: key, nickname: stored.save.progress.name, avatar: stored.save.progress.avatar },
  };
}

let presenceIndex: Promise<string> | undefined;

export async function nearbyCadets(cookie: string | undefined, value: unknown, now = Date.now()) {
  const session = cookieParts(cookie);
  if (!session) throw new AccountError('Please sign in.', 401);
  const point = restoreCampusPosition(value);
  if (value !== null && !point) throw new AccountError('Invalid campus position.');
  const collection = accounts();
  const written = await collection.updateOne({
    _id: session.username, sessions: { $elemMatch: { hash: session.hash, expires: { $gt: now } } },
  }, point ? { $set: { 'sessions.$.presence': { ...point, seen: now } } } : { $unset: { 'sessions.$.presence': '' } });
  if (!written.matchedCount) throw new AccountError('Please sign in.', 401);

  if (!point) return [];
  presenceIndex ??= collection.createIndex({ 'sessions.presence.seen': -1 }).catch(error => {
    presenceIndex = undefined;
    throw error;
  });
  await presenceIndex;
  const active = { $gt: now - PRESENCE_TTL };
  // Use the newest online session per account and return only public, nearby avatars.
  return collection.aggregate<CampusPeer>([
    { $match: { _id: { $ne: session.username }, 'sessions.presence.seen': active } },
    { $unwind: '$sessions' },
    { $match: { 'sessions.presence.seen': active, 'sessions.expires': { $gt: now } } },
    { $sort: { 'sessions.presence.seen': -1 } },
    { $group: { _id: '$id', name: { $first: '$save.progress.name' }, avatar: { $first: '$save.progress.avatar' }, p: { $first: '$sessions.presence' } } },
    { $set: { distance: { $add: [
      { $pow: [{ $subtract: ['$p.x', point.x] }, 2] },
      { $pow: [{ $subtract: ['$p.z', point.z] }, 2] },
    ] } } },
    { $match: { distance: { $lte: PRESENCE_RADIUS ** 2 } } },
    { $sort: { distance: 1, _id: 1 } },
    { $limit: MAX_VISIBLE_PEERS },
    { $project: { _id: 0, id: '$_id', name: 1, avatar: 1, x: '$p.x', z: '$p.z', heading: '$p.heading' } },
  ]).toArray();
}
