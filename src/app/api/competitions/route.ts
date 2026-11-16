import { NextRequest } from 'next/server';
import { logCampusDatabaseError } from '@/lib/mongodb';
import { ACCOUNT_COOKIE, signedInAccount } from '@/lib/account-server';
import { competitionBoard, RoomError } from '@/lib/competition-server';
import { competitionFeed } from '@/lib/competition-feed';
import { changeCompetitionRoom, loadCompetitionRoom } from '@/lib/competition-storage';

const headers = { 'Cache-Control': 'no-store' };
const json = (body: unknown, status = 200) => Response.json(body, { headers, status });

async function playerAccount(request: NextRequest) {
  const account = await signedInAccount(request.cookies.get(ACCOUNT_COOKIE)?.value);
  if (!account) throw new RoomError('Sign in to play and view campus records.', 401);
  return account;
}

export async function GET(request: NextRequest) {
  const receivedAt = Date.now();
  try {
    const account = await playerAccount(request), query = request.nextUrl.searchParams;
    if (query.has('records')) return json(await competitionBoard(query.get('mode'), query.get('difficulty'), account.id));
    const token = request.headers.get('x-race-token');
    if (!token) throw new RoomError('Your seat token is required.', 401);
    const room = await loadCompetitionRoom(query.get('code'), token, account.id);
    if (query.get('stream') === '1' && room.format === 'online') {
      return new Response(competitionFeed(room, token, account.id, request.signal), {
        headers: { 'Content-Type': 'application/x-ndjson; charset=utf-8', 'Cache-Control': 'no-store, no-transform', 'X-Accel-Buffering': 'no' },
      });
    }
    return json({ room: { ...room, serverNow: Date.now() }, receivedAt });
  } catch (error) { return failure(error); }
}

export async function POST(request: NextRequest) {
  const receivedAt = Date.now();
  try {
    if (['cross-site', 'same-site'].includes(request.headers.get('sec-fetch-site') ?? '')) return json({ error: 'Use the game on the same server.' }, 403);
    if (Number(request.headers.get('content-length') ?? 0) > 8192) return json({ error: 'Request too large.' }, 413);
    const account = await playerAccount(request);
    const body = await request.json();
    if (!body || typeof body !== 'object' || Array.isArray(body)) return json({ error: 'Invalid request.' }, 400);
    const result = await changeCompetitionRoom(body, account.id);
    return json({ ...result, room: { ...result.room, serverNow: Date.now() }, receivedAt });
  } catch (error) { return failure(error); }
}

function failure(error: unknown) {
  if (error instanceof RoomError) return json({ error: error.message }, error.status);
  if (error instanceof SyntaxError) return json({ error: 'Invalid request.' }, 400);
  logCampusDatabaseError('CampusQuest race request', error);
  return json({ error: 'The race service is temporarily unavailable. Please try again.' }, 503);
}
