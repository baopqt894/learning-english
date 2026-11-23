'use client';
import { useStudent } from './student-support';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { COMPETITIONS } from '@/lib/competition-catalog';
import type { FriendProfile, FriendsList, InvitedRace } from '@/lib/friends';
import { Icon } from './icon';
import './sports-journal.css';
import './friends-panel.css';

type Lookup = { profile: FriendProfile; relationship: 'none' | 'incoming' | 'outgoing' | 'friends' };
type ActionResult = { ok?: boolean; invite?: InvitedRace };

async function friendsFetch<T>(query = '', init?: RequestInit): Promise<T> {
  const response = await fetch('/api/friends' + query, { cache: 'no-store', signal: AbortSignal.timeout(8000), ...init });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Friends are unavailable. Try again.');
  return data;
}

export function sendFriendsAction<T = ActionResult>(body: Record<string, unknown>) {
  return friendsFetch<T>('', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
}

function messageFor(error: unknown) {
  return error instanceof Error ? error.message : 'Could not connect. Try again.';
}

function FriendRow({ profile, detail, children }: { profile: FriendProfile; detail?: string; children?: ReactNode }) {
  return <li className="friend-row">
    <span className={`cadet-portrait avatar-${profile.avatar === 1 ? 1 : 0} friend-avatar`} aria-hidden="true"/>
    <div className="friend-identity">
      <strong>{profile.nickname}</strong>
      <small>@{profile.username}{detail && <> · {detail}</>}</small>
    </div>
    <div className="friend-actions">{children}</div>
  </li>;
}

export function FriendsButton({ onOpen, muted }: { onOpen: () => void; muted: boolean }) {
  const { t } = useStudent();
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (muted) return;
    const abort = new AbortController();
    const check = () => {
      if (document.hidden) return;
      void friendsFetch<{ count: number }>('?inbox=1', { signal: abort.signal })
        .then(data => setCount(data.count)).catch(() => {});
    };
    check();
    const timer = window.setInterval(check, 30_000);
    document.addEventListener('visibilitychange', check);
    return () => {
      abort.abort();
      clearInterval(timer);
      document.removeEventListener('visibilitychange', check);
    };
  }, [muted]);

  return <button className="hud-button friends-launch" lang="en" onClick={onOpen}
    aria-label={count ? `Friends (${count} pending)` : t('Friends')} title={t("Friends")}>
    <Icon name="users" size={20}/>
    {count > 0 && <span className="friends-badge" aria-hidden="true">{count > 9 ? '9+' : count}</span>}
  </button>;
}

export function FriendsPanel({ username, onClose, onRace }: {
  username: string; onClose: () => void; onRace: (race: InvitedRace) => void;
}) {
  const { t } = useStudent();
  const [list, setList] = useState<FriendsList | null>(null);
  const [query, setQuery] = useState('');
  const [found, setFound] = useState<Lookup | null>(null);
  const [tab, setTab] = useState<'friends' | 'inbox'>('friends');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [remove, setRemove] = useState<string | null>(null);
  const requestActive = useRef(false);
  const refreshVersion = useRef(0);

  useEffect(() => {
    const abort = new AbortController();
    let first = true;
    const refresh = async () => {
      if (document.hidden || requestActive.current) return;
      const version = refreshVersion.current;
      try {
        const data = await friendsFetch<FriendsList>('', { signal: abort.signal });
        if (abort.signal.aborted || version !== refreshVersion.current) return;
        setList(data);
        if (first && (data.invitations.length || data.incoming.length)) setTab('inbox');
        first = false;
      } catch (err) {
        if (!abort.signal.aborted && first) setError(messageFor(err));
      }
    };
    void refresh();
    const timer = window.setInterval(() => void refresh(), 12_000);
    return () => { abort.abort(); clearInterval(timer); };
  }, []);

  async function run(task: () => Promise<void>) {
    if (requestActive.current) return;
    requestActive.current = true;
    refreshVersion.current++;
    setBusy(true);
    setError('');
    setMessage('');
    try { await task(); }
    catch (err) { setError(messageFor(err)); }
    finally { requestActive.current = false; setBusy(false); }
  }

  function mutate(action: string, person: string, confirmation?: string) {
    void run(async () => {
      await sendFriendsAction({ action, username: person });
      setRemove(null);
      setFound(null);
      if (confirmation) setMessage(confirmation);
      setList(await friendsFetch<FriendsList>());
    });
  }

  function openRace(id: string) {
    void run(async () => {
      const result = await sendFriendsAction({ action: 'open-invite', id });
      if (result.invite) onRace(result.invite);
    });
  }

  function dismiss(id: string) {
    void run(async () => {
      await sendFriendsAction({ action: 'dismiss-invite', id });
      setList(await friendsFetch<FriendsList>());
    });
  }

  const inboxCount = (list?.incoming.length ?? 0) + (list?.invitations.length ?? 0);

  return <div className="modal-backdrop sports-backdrop friends-backdrop" onClick={event => {
    if (event.target === event.currentTarget) onClose();
  }}>
    <section className="sports-journal friends-ledger" role="dialog" aria-modal="true" aria-labelledby="friends-title" lang="en">
      <header>
        <div><h2 id="friends-title">{t("Friends")}</h2><p>{t("Your username is")} <strong>@{username}</strong></p></div>
        <button type="button" className="sports-journal-close" aria-label={t("Close")} onClick={onClose}><Icon name="close" size={20}/></button>
      </header>
      <div className="friends-tabs" role="group" aria-label="Friends sections">
        <button aria-pressed={tab === 'friends'} onClick={() => { setTab('friends'); setRemove(null); }}>{t("Friends")} {list && <small>{list.friends.length}</small>}</button>
        <button aria-pressed={tab === 'inbox'} onClick={() => { setTab('inbox'); setRemove(null); }}>{t("Inbox")} {inboxCount > 0 && <small>{inboxCount}</small>}</button>
      </div>
      {tab === 'friends' && <>
        <form className="friends-search" onSubmit={event => {
          event.preventDefault();
          void run(async () => {
            setFound(null);
            setFound(await friendsFetch<Lookup>(`?username=${encodeURIComponent(query.trim())}`));
          });
        }}>
          <label>{t("Find by username")}
            <input maxLength={24} value={query} onChange={event => { setQuery(event.target.value); setFound(null); setError(''); }}
              placeholder="e.g. minh_08" autoCapitalize="none" autoComplete="off" spellCheck={false}
              disabled={busy}/>
          </label>
          <button className="friends-primary" disabled={busy || query.trim().length < 3}>{t("Search")}</button>
        </form>
        {found && <ul className="friend-list friends-search-result" aria-label={t("Search result")}>
          <FriendRow profile={found.profile}>
            {found.relationship === 'none' ? <button className="friends-primary" disabled={busy}
              onClick={() => mutate('request', found.profile.username, 'Friend request sent.')}>{t("Add friend")}</button>
              : found.relationship === 'friends' ? <span className="friend-status"><Icon name="check" size={15}/> {t("Friends")}</span>
              : <button onClick={() => setTab('inbox')}>{t("View request")}</button>}
          </FriendRow>
        </ul>}
      </>}
      {error && <p className="friends-error" role="alert">{error}{!list && <button onClick={() => void run(async () => setList(await friendsFetch<FriendsList>()))}>{t("Try again")}</button>}</p>}
      {message && <p className="friends-message" role="status">{message}</p>}
      {!list && !error && <p role="status" className="friends-empty">{t("Loading your friends…")}</p>}
      {list && (tab === 'friends' ? (
        list.friends.length ? <ul className="friend-list" aria-label={t("Friends list")}>
          {list.friends.map(friend => <FriendRow profile={friend} key={friend.username}>
            {remove === friend.username ? <>
              <button className="friends-danger" disabled={busy} onClick={() => mutate('remove', friend.username, 'Friend removed.')}>Confirm removal</button>
              <button disabled={busy} onClick={() => setRemove(null)}>{t("Keep friend")}</button>
            </> : <button aria-label={`Remove @${friend.username} from friends`} onClick={() => setRemove(friend.username)}>{t("Remove")}</button>}
          </FriendRow>)}
        </ul> : <p className="friends-empty">Find a classmate by username to add your first friend.</p>
      ) : (
        <>
          {list.invitations.length > 0 && <section className="friends-group">
            <h3>{t("Race invitations")}</h3>
            <ul className="friend-list">{list.invitations.map(invite => {
              const race = COMPETITIONS[invite.mode];
              return <FriendRow key={invite.id} profile={invite.from} detail={`${race.title} at ${race.venue}`}>
                <button className="friends-primary" disabled={busy} onClick={() => openRace(invite.id)}>{t("Walk there")}</button>
                <button disabled={busy} onClick={() => dismiss(invite.id)}>{t("Dismiss")}</button>
              </FriendRow>;
            })}</ul>
          </section>}
          {list.incoming.length > 0 && <section className="friends-group">
            <h3>{t("Friend requests")}</h3>
            <ul className="friend-list">{list.incoming.map(friend => <FriendRow profile={friend} key={friend.username}>
              <button className="friends-primary" disabled={busy} onClick={() => mutate('accept', friend.username, `You and ${friend.nickname} are now friends.`)}>{t("Accept")}</button>
              <button disabled={busy} onClick={() => mutate('decline', friend.username)}>{t("Decline")}</button>
            </FriendRow>)}</ul>
          </section>}
          {list.outgoing.length > 0 && <section className="friends-group">
            <h3>{t("Sent requests")}</h3>
            <ul className="friend-list">{list.outgoing.map(friend => <FriendRow profile={friend} key={friend.username} detail="Waiting for reply">
              <button disabled={busy} onClick={() => mutate('cancel', friend.username)}>{t("Cancel")}</button>
            </FriendRow>)}</ul>
          </section>}
          {!inboxCount && list.outgoing.length === 0 && <p className="friends-empty">You have no pending requests or race invitations.</p>}
        </>
      ))}
    </section>
  </div>;
}

export function RaceFriendInvites({ code, onClose }: { code: string; onClose: () => void }) {
  const { t } = useStudent();
  const [list, setList] = useState<FriendProfile[] | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [sent, setSent] = useState<string[]>([]);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
    const abort = new AbortController();
    void friendsFetch<FriendsList>('', { signal: abort.signal })
      .then(data => setList(data.friends))
      .catch(err => { if (!abort.signal.aborted) setError(messageFor(err)); });
    return () => abort.abort();
  }, []);

  async function invite(username: string) {
    if (busy) return;
    setError('');
    setBusy(username);
    try {
      await sendFriendsAction({ action: 'invite', username, code });
      setSent(previous => [...previous, username]);
    } catch (err) { setError(messageFor(err)); }
    finally { setBusy(null); }
  }

  return <div className="swim-panel competition-lobby race-friend-invites">
    <div className="race-friends-heading"><h3 ref={heading} tabIndex={-1}>{t("Invite friends")}</h3><button onClick={onClose}>{t("Back to lobby")}</button></div>
    {error && <p className="race-inline-error" role="alert">{error}</p>}
    {!list && !error && <p role="status">{t("Loading your friends…")}</p>}
    {list && (list.length ? <ul className="friend-list" aria-label={t("Friends to invite")}>
      {list.map(friend => <FriendRow key={friend.username} profile={friend}>
        {sent.includes(friend.username) ? <span className="friend-status" role="status"><Icon name="check" size={15}/> {t("Invited")}</span>
          : <button disabled={!!busy} onClick={() => void invite(friend.username)}>{busy === friend.username ? 'Sending…' : 'Invite'}</button>}
      </FriendRow>)}
    </ul> : <p>Add a classmate in Friends on the campus HUD. You can also share the room code from the lobby.</p>)}
  </div>;
}
