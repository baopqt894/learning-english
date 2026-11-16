'use client';

import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { ACCOUNT_USERNAME, MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH, type AccountSession } from '@/lib/account';
import { restoreProgress, STORAGE_KEY, type Progress } from '@/lib/game';
import { Icon } from './icon';
import './campus-account.css';

const Game = dynamic(() => import('./campus-game').then(module => module.CampusGame), {
  ssr: false,
  loading: () => <div className="account-game-loading" role="status">Đang mở khuôn viên…</div>,
});
const IMPORTED = 'campus-local-progress-imported';

class RequestError extends Error {
  constructor(message: string, readonly status: number) { super(message); }
}

async function accountRequest(payload?: Record<string, unknown>) {
  const signal = AbortSignal.timeout(12_000);
  const response = await fetch('/api/account', payload ? {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal,
  } : { cache: 'no-store', signal });
  const packet: { session?: AccountSession | null; error?: string } = await response.json();
  if (!response.ok) throw new RequestError(packet.error || 'Không kết nối được. Hãy thử lại.', response.status);
  return packet.session ?? null;
}

function legacyProgress() {
  try {
    if (localStorage.getItem(IMPORTED)) return null;
    const progress = restoreProgress(localStorage.getItem(STORAGE_KEY));
    return progress.name ? progress : null;
  } catch { return null; }
}

function clearRoomSeat() {
  try { sessionStorage.removeItem('campus-competition-seat'); } catch { /* Storage may be blocked. */ }
}

export function CampusAccount() {
  const [session, setSession] = useState<AccountSession | null | undefined>(undefined);
  const [previous, setPrevious] = useState<Progress | null>(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    accountRequest().then(account => {
      if (!active) return;
      setPrevious(account ? null : legacyProgress());
      setSession(account);
    }).catch(e => {
      if (active) setError(e instanceof RequestError ? e.message : 'Không kết nối được. Hãy thử lại.');
    });
    return () => { active = false; };
  }, [attempt]);

  const expire = useCallback(() => {
    clearRoomSeat();
    setSession(null);
    setError('Phiên đã hết hạn. Đăng nhập lại để tiếp tục.');
  }, []);
  const logout = useCallback(async () => {
    await accountRequest({ action: 'logout' });
    clearRoomSeat();
    setSession(null);
    setError('');
  }, []);

  if (session) return <Game key={session.id} account={session} onExpired={expire} onLogout={logout}/>;
  return (
    <main className="cadet-entry">
      <div className="cadet-entry-scene">
        <Image src="/art/chibi-campus-keyart.png" alt="" fill priority sizes="(max-width: 760px) 100vw, 62vw"/>
        <div className="cadet-entry-brand">
          <Icon name="compass" size={36}/>
          <h1>CampusQuest <span>AI</span></h1>
          <p>Phiêu lưu học đường bằng tiếng Anh</p>
        </div>
      </div>
      <div className="cadet-entry-panel">
        {session === undefined ? (
          <div className="cadet-entry-form" role="status">
            <p>{error || 'Đang kiểm tra tài khoản…'}</p>
            {!!error && <button className="cadet-submit" onClick={() => { setError(''); setAttempt(attempt + 1); }}>Thử lại</button>}
          </div>
        ) : (
          <AccountForm previous={previous} notice={error} onSession={(account, imported) => {
            if (imported) {
              try { localStorage.setItem(IMPORTED, '1'); } catch { /* Import is already saved on the server. */ }
              setPrevious(null);
            }
            setError('');
            setSession(account);
          }}/>
        )}
      </div>
    </main>
  );
}

function AccountForm({ previous, notice, onSession }: {
  previous: Progress | null;
  notice: string;
  onSession: (account: AccountSession, imported: boolean) => void;
}) {
  const [mode, setMode] = useState<'register' | 'login'>(notice ? 'login' : 'register');
  const [username, setUsername] = useState('');
  const [nickname, setNickname] = useState(previous?.name ?? '');
  const [password, setPassword] = useState('');
  const [avatar, setAvatar] = useState(previous?.avatar ?? 0);
  const [importPrevious, setImportPrevious] = useState(!!previous);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(notice);
  const creating = mode === 'register';

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const key = username.trim().toLowerCase();
    if (!ACCOUNT_USERNAME.test(key)) {
      setError('Tên đăng nhập dùng 3–24 chữ cái không dấu, số hoặc dấu gạch dưới.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const account = await accountRequest(creating
        ? { action: mode, username: key, nickname, password, avatar, previous: importPrevious ? previous : undefined }
        : { action: mode, username: key, password });
      if (!account) throw new Error('Không mở được tài khoản.');
      onSession(account, creating && importPrevious && !!previous);
    } catch (e) {
      setError(e instanceof RequestError ? e.message : 'Không kết nối được. Hãy thử lại.');
    } finally { setBusy(false); }
  }

  return <form className="cadet-entry-form" onSubmit={submit}>
    <div className="cadet-entry-switch" role="group" aria-label="Chọn cách vào game">
      <button type="button" aria-pressed={creating} disabled={busy} onClick={() => { setMode('register'); setPassword(''); setError(''); }}>Tạo tài khoản</button>
      <button type="button" aria-pressed={!creating} disabled={busy} onClick={() => { setMode('login'); setPassword(''); setError(''); }}>Đăng nhập</button>
    </div>
    <h2>{creating ? 'Tạo hồ sơ học viên' : 'Chào mừng trở lại'}</h2>
    {creating && <div className="cadet-entry-field">
      <label htmlFor="account-nickname">Biệt danh trong game</label>
      <input id="account-nickname" autoComplete="nickname" value={nickname} maxLength={24} required disabled={busy} onChange={event => setNickname(event.target.value)}/>
    </div>}
    <div className="cadet-entry-field">
      <label htmlFor="account-username">Tên đăng nhập</label>
      <input id="account-username" autoComplete="username" autoCapitalize="none" spellCheck={false} value={username} maxLength={24} required disabled={busy} onChange={event => setUsername(event.target.value)}/>
      {creating && <small>3–24 ký tự, dùng chữ cái không dấu, số hoặc dấu gạch dưới.</small>}
    </div>
    <div className="cadet-entry-field">
      <label htmlFor="account-password">Mật khẩu</label>
      <input key={mode} id="account-password" type="password" autoComplete={creating ? 'new-password' : 'current-password'} value={password} minLength={MIN_PASSWORD_LENGTH} maxLength={MAX_PASSWORD_LENGTH} required disabled={busy} onChange={event => setPassword(event.target.value)}/>
      {creating && <small>Ít nhất {MIN_PASSWORD_LENGTH} ký tự.</small>}
    </div>
    {creating && <fieldset className="cadet-entry-avatars" disabled={busy}>
      <legend>Chọn nhân vật</legend>
      {[0, 1].map((variant) => <label key={variant}>
        <input type="radio" name="avatar" checked={avatar === variant} onChange={() => setAvatar(variant)}/>
        <span className={`cadet-portrait avatar-${variant}`} aria-hidden="true"/>
        <span>{variant === 0 ? 'Học viên An' : 'Học viên Linh'}</span>
      </label>)}
    </fieldset>}
    {creating && previous && <label className="cadet-entry-import">
      <input type="checkbox" checked={importPrevious} disabled={busy} onChange={event => setImportPrevious(event.target.checked)}/>
      <span>Chuyển tiến độ của <strong>{previous.name}</strong> từ trình duyệt này</span>
    </label>}
    {error && <p className="cadet-entry-error" role="alert">{error}</p>}
    <button className="cadet-submit" disabled={busy || (creating && !nickname.trim())} type="submit">
      {busy ? 'Đang kết nối…' : creating ? 'Tạo tài khoản và chơi' : 'Vào khuôn viên'} <Icon name="arrow" size={18}/>
    </button>
  </form>;
}
