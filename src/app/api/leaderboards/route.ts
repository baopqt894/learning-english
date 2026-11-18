import { NextRequest, NextResponse } from 'next/server';
import { ACCOUNT_COOKIE, signedInAccount } from '@/lib/account-server';
import { learningStandings } from '@/lib/learning-standings';
import { logCampusDatabaseError } from '@/lib/mongodb';

const headers = { 'Cache-Control': 'private, no-store' };
export async function GET(request: NextRequest) {
  const cookie = request.cookies.get(ACCOUNT_COOKIE)?.value;
  try {
    const account = await signedInAccount(cookie);
    if (!account) return NextResponse.json({ error: 'Sign in to view standings.' }, { status: 401, headers });
    return NextResponse.json(await learningStandings(account.id), { headers });
  } catch (error) {
    logCampusDatabaseError('Load learning standings', error);
    return NextResponse.json({ error: 'Standings are temporarily unavailable.' }, { status: 503, headers });
  }
}
