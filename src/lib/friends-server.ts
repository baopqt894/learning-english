import { createHash } from 'node:crypto';
import { MongoServerError } from 'mongodb';
import { ACCOUNT_USERNAME, type Account } from './account.ts';
import { findCadetProfile } from './account-server.ts';
import { invitableRace } from './competition-storage.ts';
import type { CompetitionId } from './competition-catalog.ts';
import type { FriendProfile, FriendsList } from './friends.ts';
import { campusDatabase } from './mongodb.ts';

type Friendship = {
  _id: string;
  members: [string, string];
  profiles: [FriendProfile, FriendProfile];
  sender: string;
  state: 'pending' | 'accepted';
};
type Invitation = {
  _id: string;
  from: string;
  to: string;
  code: string;
  mode: CompetitionId;
  expiresAt: Date;
};

export class FriendsError extends Error {
  constructor(message: string, readonly status = 400) { super(message); }
}

const friendships = () => campusDatabase().collection<Friendship>('friendships');
const invitations = () => campusDatabase().collection<Invitation>('race_invitations');
let indexReady: Promise<unknown> | undefined;

function prepareFriends() {
  indexReady ??= Promise.all([
    friendships().createIndex({ members: 1, state: 1, sender: 1 }),
    invitations().createIndex({ to: 1, expiresAt: 1 }),
    invitations().createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
  ]).catch(error => { indexReady = undefined; throw error; });
  return indexReady;
}

const pairKey = (a: string, b: string) => [a, b].sort().join(':');

async function cadet(value: unknown) {
  const username = typeof value === 'string' ? value.trim().toLowerCase() : '';
  if (!ACCOUNT_USERNAME.test(username)) throw new FriendsError('Enter a valid username (3–24 letters, numbers or underscores).');
  return findCadetProfile(username);
}

async function requestFriend(account: Account, other: Awaited<ReturnType<typeof cadet>>) {
  const self = await findCadetProfile(account.username);
  const _id = pairKey(account.id, other.id);
  try {
    await friendships().updateOne({ _id }, { $setOnInsert: {
      members: [account.id, other.id],
      profiles: [self.profile, other.profile],
      sender: account.id,
      state: 'pending',
    } }, { upsert: true });
  } catch (error) {
    if (!(error instanceof MongoServerError) || error.code !== 11000) throw error;
  }
}

export async function findFriend(account: Account, username: unknown) {
  const other = await cadet(username);
  if (other.id === account.id) throw new FriendsError('That is your own username.');
  const friendship = await friendships().findOne({ _id: pairKey(account.id, other.id) });
  const relationship = !friendship ? 'none' : friendship.state === 'accepted' ? 'friends'
    : friendship.sender === account.id ? 'outgoing' : 'incoming';
  return { profile: other.profile, relationship };
}

export async function listFriends(account: Account, now = Date.now()): Promise<FriendsList> {
  await prepareFriends();
  const [links, invites] = await Promise.all([
    friendships().find({ members: account.id }).toArray(),
    invitations().find({ to: account.id, expiresAt: { $gt: new Date(now) } }).sort({ expiresAt: -1 }).toArray(),
  ]);
  const result: FriendsList = { friends: [], incoming: [], outgoing: [], invitations: [] };
  const accepted = new Map<string, FriendProfile>();
  for (const link of links) {
    const index = link.members[0] === account.id ? 1 : 0;
    const profile = link.profiles[index];
    if (link.state === 'accepted') {
      result.friends.push(profile);
      accepted.set(link.members[index], profile);
    } else if (link.sender === account.id) result.outgoing.push(profile);
    else result.incoming.push(profile);
  }
  result.friends.sort((a, b) => a.nickname.localeCompare(b.nickname));
  for (const invite of invites) {
    const profile = accepted.get(invite.from);
    if (profile) result.invitations.push({ id: invite._id, from: profile, mode: invite.mode });
  }
  return result;
}

export async function friendsAction(account: Account, input: Record<string, unknown>, now = Date.now()) {
  await prepareFriends();
  if (input.action === 'open-invite' || input.action === 'dismiss-invite') {
    if (typeof input.id !== 'string' || !/^[0-9a-f]{32}$/.test(input.id)) throw new FriendsError('Invalid race invitation.');
    const filter = { _id: input.id, to: account.id };
    if (input.action === 'dismiss-invite') {
      await invitations().deleteOne(filter);
      return { ok: true };
    }
    const invite = await invitations().findOne({ ...filter, expiresAt: { $gt: new Date(now) } });
    if (!invite || !await friendships().findOne({ _id: pairKey(account.id, invite.from), state: 'accepted' }))
      throw new FriendsError('This invitation has expired.', 404);
    const race = await invitableRace(invite.code, invite.from, account.id, now);
    return { invite: { ...race, id: invite._id } };
  }

  const other = await cadet(input.username);
  if (other.id === account.id) throw new FriendsError('That is your own username.');
  const _id = pairKey(account.id, other.id);
  switch (input.action) {
    case 'request':
      await requestFriend(account, other);
      break;
    case 'accept': {
      const accepted = await friendships().updateOne({ _id, sender: other.id, state: 'pending' }, { $set: { state: 'accepted' } });
      if (!accepted.matchedCount && !await friendships().findOne({ _id, state: 'accepted' }))
        throw new FriendsError('This friend request is no longer pending.', 409);
      break;
    }
    case 'decline':
      await friendships().deleteOne({ _id, sender: other.id, state: 'pending' });
      break;
    case 'cancel':
      await friendships().deleteOne({ _id, sender: account.id, state: 'pending' });
      break;
    case 'remove': {
      const removed = await friendships().deleteOne({ _id, state: 'accepted' });
      if (removed.deletedCount) await invitations().deleteMany({ $or: [
        { from: account.id, to: other.id }, { from: other.id, to: account.id },
      ] });
      break;
    }
    case 'invite': {
      if (!await friendships().findOne({ _id, state: 'accepted' }))
        throw new FriendsError('Add this cadet as a friend first.', 403);
      const race = await invitableRace(input.code, account.id, other.id, now);
      const id = createHash('sha256').update(JSON.stringify([account.id, other.id, race.code])).digest('hex').slice(0, 32);
      await invitations().updateOne({ _id: id }, { $set: {
        from: account.id, to: other.id, ...race, expiresAt: new Date(now + 15 * 60_000),
      } }, { upsert: true });
      break;
    }
    default:
      throw new FriendsError('Unknown friends action.');
  }
  return { ok: true };
}

export async function friendInboxCount(account: Account, now = Date.now()) {
  await prepareFriends();
  const [requests, invites] = await Promise.all([
    friendships().countDocuments({ members: account.id, sender: { $ne: account.id }, state: 'pending' }),
    invitations().countDocuments({ to: account.id, expiresAt: { $gt: new Date(now) } }),
  ]);
  return { count: requests + invites };
}
