'use client';

import { StudentContext, LanguageSelect, useStudent } from './student-support';
import { defaultStudent, type StudentSettings } from '@/lib/student-support';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { ACCOUNT_USERNAME, MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH, type AccountSession } from '@/lib/account';
import { restoreProgress, STORAGE_KEY, type Progress } from '@/lib/game';
import { Icon } from './icon';
import './campus-account.css';

const Game = dynamic(() => import('./campus-game').then(module => module.CampusGame), {
  ssr: false,
  loading: () => <div className="account-game-loading" role="status">Đang mở khuôn viên…</div>,
});
const Turntable = dynamic(() => import('./entry-turntable'), { ssr: false });
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
  return packet.session ? { ...packet.session, receivedAt: Date.now() } : null;
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
  const [settings, setSettings] = useState(defaultStudent);
  useEffect(() => {
    try {
      if (localStorage.getItem('campus-interface-language') === 'en') {
        const frame = requestAnimationFrame(() => setSettings({...defaultStudent,language:'en'}));
        return () => cancelAnimationFrame(frame);
      }
    } catch { /* The language selector also works without device storage. */ }
  }, []);
  function change(value: StudentSettings) {
    setSettings(value);
    try { localStorage.setItem('campus-interface-language', value.language); } catch { /* Optional device default. */ }
  }
  return <StudentContext.Provider value={{settings, change, remember:()=>{}}}><AccountEntry/></StudentContext.Provider>;
}

function AccountEntry() {
  const { t, settings } = useStudent();
  const [session, setSession] = useState<AccountSession | null | undefined>(undefined);
  const [previous, setPrevious] = useState<Progress | null>(null);
  const [error, setError] = useState('');
  const [choice, setChoice] = useState<number | null>(null);
  const avatar = choice ?? previous?.avatar ?? 0;
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

  useEffect(() => {
    if (!session) document.documentElement.lang = settings.language;
  }, [settings.language, session]);
  if (session) return <Game key={session.id} account={session} onExpired={expire} onLogout={logout}/>;
  return (
    <main className="cadet-entry">
      <header className="entry-mast">
        <h1><Icon name="compass" size={25}/> CampusQuest <span>AI</span></h1>
        <div className="entry-language"><LanguageSelect disabled={session === undefined && !error}/></div>
      </header>
      <div className="entry-layout">
        <figure className="cadet-entry-scene">
          <figcaption><Icon name="map" size={18}/><span>{t('School courtyard')}</span></figcaption>
        </figure>
        <div className="cadet-entry-panel">
        {session === undefined ? (
          <div className="cadet-entry-form" role="status">
            <p>{error ? t(error) : t('Đang kiểm tra tài khoản…')}</p>
            {!!error && <button className="cadet-submit" onClick={() => { setError(''); setAttempt(attempt + 1); }}>{t("Thử lại")}</button>}
          </div>
        ) : (
          <AccountForm avatar={avatar} setAvatar={setChoice} previous={previous} notice={error} onSession={(account, imported) => {
            if (imported) {
              try { localStorage.setItem(IMPORTED, '1'); } catch { /* Import is already saved on the server. */ }
              setPrevious(null);
            }
            setError('');
            setSession(account);
          }}/>
        )}
        </div>
      </div>
    </main>
  );
}

function AccountForm({ avatar, setAvatar, previous, notice, onSession }: {
  avatar: number; setAvatar: (value:number) => void;
  previous: Progress | null;
  notice: string;
  onSession: (account: AccountSession, imported: boolean) => void;
}) {
  const { t, settings } = useStudent();
  const [mode, setMode] = useState<'register' | 'login'>('login');
  const [username, setUsername] = useState('');
  const [nickname, setNickname] = useState(previous?.name ?? '');
  const [password, setPassword] = useState('');
  const [importPrevious, setImportPrevious] = useState(!!previous);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(notice);
  const preview=useRef<HTMLDialogElement>(null);
  const [previewOpen,setPreviewOpen]=useState(false);
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
        ? { action: mode, username: key, nickname, password, avatar, language: settings.language, previous: importPrevious ? previous : undefined }
        : { action: mode, username: key, password });
      if (!account) throw new Error('Không mở được tài khoản.');
      onSession(account, creating && importPrevious && !!previous);
    } catch (e) {
      setError(e instanceof RequestError ? e.message : 'Không kết nối được. Hãy thử lại.');
    } finally { setBusy(false); }
  }

  return <form className="cadet-entry-form" onSubmit={submit}>
    <div className="cadet-entry-switch" role="group" aria-label={t("Chọn cách vào game")}>
      <button type="button" aria-pressed={!creating} disabled={busy} onClick={() => { setMode('login'); setPassword(''); setError(''); }}>{t("Đăng nhập")}</button>
      <button type="button" aria-pressed={creating} disabled={busy} onClick={() => { setMode('register'); setPassword(''); setError(''); }}>{t("Tạo tài khoản")}</button>
    </div>
    <h2>{creating ? t('Tạo hồ sơ học viên') : t('Chào mừng trở lại')}</h2>
    {creating && <fieldset className="cadet-entry-avatars" disabled={busy}>
      <legend>{t("Chọn nhân vật")}</legend>
      {[0, 1].map((variant) => <label key={variant}>
        <input type="radio" name="avatar" checked={avatar === variant} onChange={() => setAvatar(variant)}/>
        <span className={`cadet-portrait avatar-${variant}`} aria-hidden="true"/>
        <span>{variant === 0 ? t('An · Male') : t('Linh · Female')}</span>
      </label>)}
    </fieldset>}
    {creating && <button type="button" className="entry-preview-link" onClick={()=>{
      setPreviewOpen(true);preview.current?.showModal();
    }}><Icon name="user" size={16}/>{t('Preview character in 3D')}</button>}
    <dialog aria-label={t('Character preview')} ref={preview} className="entry-preview-dialog" onClose={()=>setPreviewOpen(false)}>
      {previewOpen && <><header><h3>{avatar===1?'Linh':'An'}</h3><button type="button" aria-label={t('Close')} onClick={()=>preview.current?.close()}><Icon name="close"/></button></header>
        <Turntable key={avatar} avatar={avatar}/></>}
    </dialog>
    {creating && <div className="cadet-entry-field">
      <label htmlFor="account-nickname">{t("Biệt danh trong game")}</label>
      <input id="account-nickname" autoComplete="nickname" value={nickname} maxLength={24} required disabled={busy} onChange={event => setNickname(event.target.value)}/>
    </div>}
    <div className="cadet-entry-field">
      <label htmlFor="account-username">{t("Tên đăng nhập")}</label>
      <input id="account-username" autoComplete="username" autoCapitalize="none" spellCheck={false} value={username} maxLength={24} required disabled={busy} onChange={event => setUsername(event.target.value)}/>
      {creating && <small>{t("3–24 ký tự, dùng chữ cái không dấu, số hoặc dấu gạch dưới.")}</small>}
    </div>
    <div className="cadet-entry-field">
      <label htmlFor="account-password">{t("Mật khẩu")}</label>
      <input key={mode} id="account-password" type="password" autoComplete={creating ? 'new-password' : 'current-password'} value={password} minLength={MIN_PASSWORD_LENGTH} maxLength={MAX_PASSWORD_LENGTH} required disabled={busy} onChange={event => setPassword(event.target.value)}/>
      {creating && <small>{t("Ít nhất")} {MIN_PASSWORD_LENGTH} {t("ký tự.")}</small>}
    </div>
    {creating && previous && <label className="cadet-entry-import">
      <input type="checkbox" checked={importPrevious} disabled={busy} onChange={event => setImportPrevious(event.target.checked)}/>
      <span>{t("Chuyển tiến độ của")} <strong>{previous.name}</strong> {t("từ trình duyệt này")}</span>
    </label>}
    {error && <p className="cadet-entry-error" role="alert">{t(error)}</p>}
    <button className="cadet-submit" disabled={busy || (creating && !nickname.trim())} type="submit">
      {busy ? t('Đang kết nối…') : creating ? t('Tạo tài khoản và chơi') : t('Vào khuôn viên')} <Icon name="arrow" size={18}/>
    </button>
  </form>;
}
