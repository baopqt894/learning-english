import { NextRequest, NextResponse } from 'next/server';
import {
  ACCOUNT_COOKIE, SESSION_LIFETIME, AccountError, accountSession, endSession,
  registerAccount, saveAccountProgress, signInAccount, signedInAccount,
} from '@/lib/account-server';

const headers = { 'Cache-Control': 'no-store' };
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers });

function failure(error: unknown) {
  if (error instanceof AccountError) return json({ error: error.message, current: error.current }, error.status);
  return json({ error: 'Dữ liệu tạm thời chưa truy cập được. Hãy thử lại.' }, 503);
}

export async function GET(request: NextRequest) {
  try {
    const account = await signedInAccount(request.cookies.get(ACCOUNT_COOKIE)?.value);
    return json({ session: account ? await accountSession(account) : null });
  } catch (error) { return failure(error); }
}

const maxSize = 192_000;
async function readBody(request: NextRequest) {
  if (Number(request.headers.get('content-length')) > maxSize) throw new AccountError('Tiến độ vượt kích thước cho phép.', 413);
  const reader = request.body?.getReader();
  if (!reader) throw new AccountError('Yêu cầu còn thiếu thông tin.');
  const decoder = new TextDecoder();
  let size = 0, raw = '';
  for (;;) {
    const chunk = await reader.read();
    if (chunk.done) break;
    size += chunk.value.length;
    if (size > maxSize) {
      await reader.cancel();
      throw new AccountError('Tiến độ vượt kích thước cho phép.', 413);
    }
    raw += decoder.decode(chunk.value, { stream: true });
  }
  try {
    const data = JSON.parse(raw + decoder.decode());
    if (data && typeof data === 'object' && !Array.isArray(data)) return data as Record<string, unknown>;
  } catch { /* Respond with the same validation error for malformed JSON. */ }
  throw new AccountError('Dữ liệu gửi lên không hợp lệ.');
}

export async function POST(request: NextRequest) {
  try {
    if (['cross-site', 'same-site'].includes(request.headers.get('sec-fetch-site') ?? ''))
      throw new AccountError('Hãy đăng nhập trực tiếp từ trang game.', 403);
    if (!request.headers.get('content-type')?.startsWith('application/json'))
      throw new AccountError('Định dạng yêu cầu không hợp lệ.', 415);
    const body = await readBody(request);
    const cookie = request.cookies.get(ACCOUNT_COOKIE)?.value;
    const secure = request.nextUrl.protocol === 'https:' || request.headers.get('x-forwarded-proto') === 'https';
    const cookieOptions = { httpOnly: true, sameSite: 'lax' as const, secure, path: '/' };
    if (body.action === 'register' || body.action === 'login') {
      const result = body.action === 'register' ? await registerAccount(body) : await signInAccount(body);
      if (cookie && cookie !== result.cookie) await endSession(cookie);
      const response = json({ session: result.session }, body.action === 'register' ? 201 : 200);
      response.cookies.set(ACCOUNT_COOKIE, result.cookie, { ...cookieOptions, maxAge: SESSION_LIFETIME });
      return response;
    }
    if (body.action === 'logout') {
      await endSession(cookie);
      const response = json({ session: null });
      response.cookies.set(ACCOUNT_COOKIE, '', { ...cookieOptions, maxAge: 0 });
      return response;
    }
    if (body.action === 'save') {
      const account = await signedInAccount(cookie);
      if (!account) throw new AccountError('Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại.', 401);
      return json({ save: await saveAccountProgress(account, body.revision, body.progress) });
    }
    throw new AccountError('Thao tác tài khoản không hợp lệ.');
  } catch (error) { return failure(error); }
}
