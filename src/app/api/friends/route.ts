import { NextRequest } from 'next/server';
import { ACCOUNT_COOKIE, AccountError, signedInAccount } from '@/lib/account-server';
import { RoomError } from '@/lib/competition-server';
import { FriendsError, findFriend, friendInboxCount, friendsAction, listFriends } from '@/lib/friends-server';
import { logCampusDatabaseError } from '@/lib/mongodb';

const json = (data: unknown, status = 200) =>
  Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });

async function signedIn(request: NextRequest) {
  const account = await signedInAccount(request.cookies.get(ACCOUNT_COOKIE)?.value);
  if (!account) throw new FriendsError('Sign in to use your friends list.', 401);
  return account;
}

function failure(error: unknown) {
  if (error instanceof FriendsError || error instanceof RoomError || error instanceof AccountError)
    return json({ error: error.message }, error.status);
  if (error instanceof SyntaxError) return json({ error: 'Invalid request.' }, 400);
  logCampusDatabaseError('CampusQuest friends request', error);
  return json({ error: 'Friends are temporarily unavailable. Please try again.' }, 503);
}

export async function GET(request: NextRequest) {
  try {
    const account = await signedIn(request);
    const search = request.nextUrl.searchParams;
    if (search.has('inbox')) return json(await friendInboxCount(account));
    const username = search.get('username');
    return json(username === null ? await listFriends(account) : await findFriend(account, username));
  } catch (error) { return failure(error); }
}

export async function POST(request: NextRequest) {
  try {
    if (['cross-site', 'same-site'].includes(request.headers.get('sec-fetch-site') ?? ''))
      return json({ error: 'Open the game directly to use Friends.' }, 403);
    if (!request.headers.get('content-type')?.startsWith('application/json'))
      return json({ error: 'Invalid content type.' }, 415);
    if (Number(request.headers.get('content-length')) > 2048)
      return json({ error: 'Request is too large.' }, 413);
    const account = await signedIn(request);
    const raw = await request.text();
    if (raw.length > 2048) return json({ error: 'Request is too large.' }, 413);
    const body = JSON.parse(raw);
    if (!body || typeof body !== 'object' || Array.isArray(body)) return json({ error: 'Invalid request.' }, 400);
    return json(await friendsAction(account, body));
  } catch (error) { return failure(error); }
}
