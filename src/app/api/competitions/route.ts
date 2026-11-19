import { NextRequest } from 'next/server';
import { logCampusDatabaseError } from '@/lib/mongodb';
import { ACCOUNT_COOKIE, accountSession, signedInAccount } from '@/lib/account-server';
import { TIER_LEVEL } from '@/lib/cadet-tiers';
import { DIFFICULTIES, type RaceDifficulty } from '@/lib/competition-catalog';
import { cadetLevel } from '@/lib/challenge-xp';
import { earnedXP } from '@/lib/game';
import { competitionBoard, RoomError } from '@/lib/competition-server';
import { competitionFeed } from '@/lib/competition-feed';
import { changeCompetitionRoom, loadCompetitionRoom } from '@/lib/competition-storage';

const headers = { 'Cache-Control': 'no-store' };
const json = (body: unknown, status = 200, timing?: string) => Response.json(body, {
  headers: timing ? { ...headers, 'Server-Timing': timing } : headers, status,
});

function sessionCookie(request: NextRequest) {
  const cookie = request.cookies.get(ACCOUNT_COOKIE)?.value;
  if (!cookie) throw new RoomError('Sign in to play and view campus records.', 401);
  return cookie;
}

async function playerAccount(cookie: string) {
  const account = await signedInAccount(cookie);
  if (!account) throw new RoomError('Sign in to play and view campus records.', 401);
  return account;
}

export async function GET(request: NextRequest) {
  const receivedAt = Date.now();
  try {
    const query = request.nextUrl.searchParams;
    const account = playerAccount(sessionCookie(request)).then(player => player.id);
    if (query.has('records')) return json(await competitionBoard(query.get('mode'), query.get('difficulty'), await account));
    const token = request.headers.get('x-race-token');
    if (!token) { await account; throw new RoomError('Your seat token is required.', 401); }
    const room = await loadCompetitionRoom(query.get('code'), token, account);
    if (query.get('stream') === '1' && room.format === 'online') {
      return new Response(competitionFeed(room, token, await account, request.signal), {
        headers: { 'Content-Type': 'application/x-ndjson; charset=utf-8', 'Cache-Control': 'no-store, no-transform', 'X-Accel-Buffering': 'no' },
      });
    }
    return json({ room: { ...room, serverNow: Date.now() }, receivedAt });
  } catch (error) { return failure(error); }
}

export async function POST(request: NextRequest) {
  const receivedAt = Date.now();
  const requestStart = performance.now();
  try {
    if (['cross-site', 'same-site'].includes(request.headers.get('sec-fetch-site') ?? '')) return json({ error: 'Use the game on the same server.' }, 403);
    if (Number(request.headers.get('content-length') ?? 0) > 8192) return json({ error: 'Request too large.' }, 413);
    const cookie = sessionCookie(request);
    const body = await request.json();
    if (!body || typeof body !== 'object' || Array.isArray(body)) return json({ error: 'Invalid request.' }, 400);
    const authStart = performance.now();
    let authMs = 0;
    const account = playerAccount(cookie).then(async player => {
      if ((body.action === 'create' || body.action === 'practice' || body.action === 'difficulty')
        && typeof body.difficulty === 'string' && Object.hasOwn(DIFFICULTIES, body.difficulty)) {
        const tier = DIFFICULTIES[body.difficulty as RaceDifficulty].level;
        const required = TIER_LEVEL[tier];
        if (required > 1) {
          const { save } = await accountSession(player);
          if (cadetLevel(earnedXP(save.progress)).level < required) {
            throw new RoomError(`Reach Level ${required} to unlock ${tier} racing.`, 403);
          }
        }
      }
      authMs = performance.now() - authStart;
      return player.id;
    });
    const result = await changeCompetitionRoom(body, account, body.action === 'answer' ? receivedAt : undefined);
    return json({ ...result, room: { ...result.room, serverNow: Date.now() }, receivedAt }, 200,
      `app;dur=${(performance.now() - requestStart).toFixed(1)}, auth;dur=${authMs.toFixed(1)}`);
  } catch (error) { return failure(error); }
}

function failure(error: unknown) {
  if (error instanceof RoomError) return json({ error: error.message }, error.status);
  if (error instanceof SyntaxError) return json({ error: 'Invalid request.' }, 400);
  logCampusDatabaseError('CampusQuest race request', error);
  return json({ error: 'The race service is temporarily unavailable. Please try again.' }, 503);
}
