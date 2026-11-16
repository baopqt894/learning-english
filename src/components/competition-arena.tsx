'use client';

import { useCallback, useEffect, useEffectEvent, useRef, useState } from 'react';
import { COMPETITIONS, DIFFICULTIES, DIFFICULTY_IDS, RECORD_MIN_CORRECT, venueCompetitions, type CompetitionId, type RaceDifficulty } from '@/lib/competition-catalog';
import { raceTime, raceQuestion, raceTeamProgress, openedAt, standings, FEEDBACK_SECONDS, questionSeconds, type CompetitionRoom, type CompetitionMember } from '@/lib/competition-engine';
import type { FeedMessage } from '@/lib/competition-feed';
import type { DailyEvent } from '@/lib/daily-missions';
import { SPORTS_VENUES, type SportsVenueId } from '@/lib/sports-layout';
import { CompetitionRecordBoard } from './competition-record-board';
import { Icon } from './icon';
import { RaceFriendInvites } from './friends-panel';
import type { InvitedRace } from '@/lib/friends';
import './swim-race.css';
import './competition-arena.css';

export type CompetitionView = { mode: CompetitionId; room: CompetitionRoom; playerId: string; clockOffset: number };
type Session = { code: string; token: string; playerId: string; venue: SportsVenueId };
type Packet = { room: CompetitionRoom; receivedAt?: number };
type NewSeat = Packet & Pick<Session, 'token' | 'playerId'>;
type Format = 'practice' | 'online';
const SEAT_KEY = 'campus-competition-seat';

function savedSeat(venue: SportsVenueId): Session | null {
  try {
    const seat = JSON.parse(sessionStorage.getItem(SEAT_KEY) || 'null') as Session | null;
    return seat?.venue === venue && seat.code && seat.token && seat.playerId ? seat : null;
  } catch { return null; }
}

async function getPacket<T extends Packet>(response: Response): Promise<T> {
  const packet = await response.json();
  if (!response.ok) throw new Error(packet.error || 'Please try again.');
  return packet;
}

async function post<T extends Packet>(body: Record<string, unknown>) {
  return getPacket<T>(await fetch('/api/competitions', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    signal: AbortSignal.timeout(8000),
  }));
}

function snapshot(seat: Session, signal: AbortSignal, stream = false) {
  return fetch(`/api/competitions?code=${encodeURIComponent(seat.code)}${stream ? '&stream=1' : ''}`, {
    headers: { 'x-race-token': seat.token }, cache: 'no-store', signal,
  });
}

const recordMessages = {
  'personal-best': 'New personal best. Your time is on the campus board.',
  'kept-best': 'Your faster personal best stays on the board.',
  'not-qualified': `Answer at least ${RECORD_MIN_CORRECT} questions correctly to post a time.`,
  retrying: 'The server is retrying your record save. Stay here to see the result.',
};

export function CompetitionArena({ name, avatar, venue, invitation, onInvitationJoined, onView, onExit, onFinish }: {
  name: string;
  avatar: number;
  venue: SportsVenueId;
  invitation: InvitedRace | null;
  onInvitationJoined: (id: string) => void;
  onView: (view: CompetitionView | null) => void;
  onExit: () => void;
  onFinish: (event: DailyEvent, at: number) => void;
}) {
  const venueInfo = SPORTS_VENUES[venue];
  const events = venueCompetitions(venue);
  const [selected, setSelected] = useState(invitation?.mode ?? events[0]);
  const [difficulty, setDifficulty] = useState<RaceDifficulty>('beginner');
  const [format, setFormat] = useState<Format>(invitation ? 'online' : 'practice');
  const [boardOpen, setBoardOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [room, setRoom] = useState<CompetitionRoom | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [resume, setResume] = useState<Session | null>(null);
  const [code, setCode] = useState(invitation?.code ?? '');
  const [displayName, setDisplayName] = useState(name || 'Cadet');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [pendingAnswer, setPendingAnswer] = useState<{ round: string; index: number; choice: number; remaining: number } | null>(null);
  const [connected, setConnected] = useState(true);
  const [live, setLive] = useState(false);
  const [now, setNow] = useState(0);
  const [offset, setOffset] = useState(0);
  const [help, setHelp] = useState(false);
  const root = useRef<HTMLElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const inviteLaunch = useRef<HTMLButtonElement>(null);
  const lastRevision = useRef(-1);
  const offsetRef = useRef(0);
  const calibrated = useRef(false);
  const actionPending = useRef(false);
  const creditedRound = useRef<string | null>(null);

  useEffect(() => {
    heading.current?.focus();
    const init = requestAnimationFrame(() => setResume(savedSeat(venue)));
    return () => cancelAnimationFrame(init);
  }, [venue]);

  const receive = useCallback((packet: Packet, sent?: number) => {
    const r = packet.room;
    if (r.revision < lastRevision.current) return;
    const received = Date.now();
    if (sent !== undefined) {
      const observed = ((packet.receivedAt ?? r.serverNow) - sent + r.serverNow - received) / 2;
      const correction = observed - offsetRef.current;
      if (!calibrated.current || Math.abs(correction) > 8) {
        const clock = calibrated.current ? offsetRef.current + Math.max(-20, Math.min(20, correction * .25)) : observed;
        calibrated.current = true;
        offsetRef.current = clock;
        setOffset(clock);
      }
    }
    if (r.revision > lastRevision.current) {
      lastRevision.current = r.revision;
      setRoom(r);
    }
    setNow(received + offsetRef.current);
    setConnected(true);
  }, []);

  const online = room?.format === 'online';
  useEffect(() => {
    if (!session) return;
    let timer: ReturnType<typeof setTimeout>;
    let stop = false, nextStream = 0;
    const abort = new AbortController();
    const expireSeat = () => {
      stop = true;
      try { sessionStorage.removeItem(SEAT_KEY); } catch { /* Storage may be disabled. */ }
      setSession(null);setRoom(null);setLive(false);
      setError('Your seat has expired. Register again to keep playing.');
    };

    const sync = async () => {
      let delay = 750;
      const sent = Date.now();
      try {
        const stream = online && sent >= nextStream;
        const response = await snapshot(session, AbortSignal.any([abort.signal, AbortSignal.timeout(stream ? 32_000 : 6000)]), stream);
        if (abort.signal.aborted) return;
        if (response.status === 401 || response.status === 404) { expireSeat(); return; }

        if (stream && response.ok && response.body && response.headers.get('Content-Type')?.includes('application/x-ndjson')) {
          let buffered = '';
          setLive(true);
          const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
          try {
            while (!abort.signal.aborted && !stop) {
              const data = await reader.read();
              if (data.done) break;
              buffered += data.value;
              const lines = buffered.split('\n');
              buffered = lines.pop() ?? '';
              for (const line of lines) {
                const packet = JSON.parse(line) as FeedMessage;
                if ('expired' in packet) { expireSeat(); break; }
                if ('room' in packet) receive(packet);
                else setConnected(true);
              }
            }
          } finally { await reader.cancel().catch(() => {}); }
          // A short stream with no updates usually means Atlas is reconnecting.
          if (Date.now() - sent < 1500) nextStream = Date.now() + 8000;
          else delay = 150;
        } else {
          if (stream) nextStream = Date.now() + 8000;
          const packet = await getPacket(response);
          if (!abort.signal.aborted) receive(packet, sent);
        }
      } catch {
        nextStream = Date.now() + 8000;
        if (!abort.signal.aborted) setConnected(false);
      } finally {
        if (!abort.signal.aborted) setLive(false);
        if (!stop && !abort.signal.aborted) timer = setTimeout(sync, delay);
      }
    };
    timer = setTimeout(sync, 100);
    return () => { abort.abort(); clearTimeout(timer); };
  }, [session, online, receive]);

  const mode = room?.mode ?? selected;
  const level = room?.difficulty ?? difficulty;
  const definition = COMPETITIONS[mode];
  const me = room?.members.find(m => m.id === session?.playerId);
  const isRacing = room?.phase === 'racing' && !!me && me.finishedAt === null;
  const roundId = room?.round?.id;
  const roundStart = room?.round?.startedAt;
  const finishedAt = me?.finishedAt;
  const bestStreak = Math.max(0, ...(me?.answers.map(answer => answer.streak) ?? []));
  const wasHuman = me?.kind === 'human' && me.takeoverAt === undefined && !me.botAssisted;
  const { together, threeEach } = raceTeamProgress(room, session?.playerId);
  const creditKey = `${roundId}:${together}:${threeEach}`;

  useEffect(() => {
    if (!isRacing) return;
    const timer = setInterval(() => setNow(Date.now() + offsetRef.current), 100);
    return () => clearInterval(timer);
  }, [isRacing]);

  useEffect(() => {
    onView(room && session ? { mode: room.mode, room, playerId: session.playerId, clockOffset: offset } : null);
  }, [room, session, onView, offset]);

  useEffect(() => {
    if (!roundId || roundStart === undefined || finishedAt == null || !wasHuman || creditedRound.current === creditKey) return;
    creditedRound.current = creditKey;
    onFinish({ type: 'race', venue, streak: bestStreak, team: { together, threeEach } }, roundStart + 3000 + Math.round(finishedAt * 1000));
  }, [roundId, roundStart, finishedAt, wasHuman, onFinish, venue, bestStreak, creditKey, together, threeEach]);

  const perform = useCallback(async (task: () => Promise<void>) => {
    if (actionPending.current) return;
    actionPending.current = true;
    setBusy(true);
    setError('');
    try { await task(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Connection failed.'); }
    finally { actionPending.current = false; setBusy(false); }
  }, []);
  const act = useCallback((action: string, extra: Record<string, unknown> = {}) => perform(async () => {
    if (!session) return;
    const sent = Date.now();
    receive(await post({ action, code: session.code, token: session.token, ...extra }), sent);
  }), [session, receive, perform]);

  const enter = (action: 'practice' | 'create' | 'join') => perform(async () => {
    const sent = Date.now();
    lastRevision.current = -1;
    calibrated.current = false;
    const packet = await post<NewSeat>({ action, mode: selected, difficulty, venue, code, name: displayName, avatar });
    const seat = { code: packet.room.code, token: packet.token, playerId: packet.playerId, venue };
    setSession(seat);
    setResume(null);
    setCopied(false);
    try { sessionStorage.setItem(SEAT_KEY, JSON.stringify(seat)); } catch { /* This seat can still play. */ }
    receive(packet, sent);
    if (action === 'join' && invitation?.code === seat.code) onInvitationJoined(invitation.id);
    heading.current?.focus();
  });

  function resumeSeat(seat: Session) {
    void perform(async () => {
      const sent = Date.now();
      const response = await snapshot(seat, AbortSignal.timeout(8000));
      if (response.status === 401 || response.status === 404) {
        setResume(null);
        sessionStorage.removeItem(SEAT_KEY);
      }
      const packet = await getPacket<Packet>(response);
      lastRevision.current = -1;
      calibrated.current = false;
      setSession(seat);
      setResume(null);
      receive(packet, sent);
      heading.current?.focus();
    });
  }

  const exit = useCallback((backToDesk = false) => perform(async () => {
    if (session) {
      try { await post({ action: 'leave', code: session.code, token: session.token }); }
      catch { /* Disconnected online seats expire on the server. */ }
      try { sessionStorage.removeItem(SEAT_KEY); } catch { /* Storage may be disabled. */ }
    }
    onView(null);
    if (!backToDesk) { onExit(); return; }
    setSession(null);
    setRoom(null);
    setBoardOpen(false);
    setHelp(false);
    lastRevision.current = -1;
    calibrated.current = false;
    heading.current?.focus();
  }), [session, onView, onExit, perform]);

  const time = room ? raceTime(room, now) : 0;
  const last = me?.answers.at(-1);
  const feedback = last && time < last.at + FEEDBACK_SECONDS ? last : null;
  const canAnswer = connected && isRacing && time >= 0 && !feedback && !busy && !help;
  const sending = pendingAnswer && pendingAnswer.round === roundId && pendingAnswer.index === me?.answers.length
    ? pendingAnswer : null;
  const submit = (choice: number) => {
    if (!canAnswer || actionPending.current || !room || !me || !roundId) return;
    const index = me.answers.length;
    setPendingAnswer({ round: roundId, index, choice, remaining: Math.max(0, questionSeconds(room) - (time - openedAt(me))) });
    void act('answer', { choice, questionIndex: index, roundId }).finally(() => setPendingAnswer(null));
  };
  function closeInvites() {
    setInviteOpen(false);
    requestAnimationFrame(() => inviteLaunch.current?.focus());
  }
  const onKey = useEffectEvent((event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        if (boardOpen) setBoardOpen(false);
        else if (inviteOpen && room?.phase === 'lobby') closeInvites();
        else if (help || room) setHelp(value => !value);
        else void exit();
      }
      if (!event.repeat && /^[1-4]$/.test(event.key) && canAnswer) {
        event.preventDefault();
        submit(Number(event.key) - 1);
      }
      if (event.key === 'Tab') {
        const focusable = Array.from(root.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), summary') ?? []);
        if (!focusable.length) return;
        const first = focusable[0], last = focusable.at(-1)!;
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
  });
  useEffect(() => {
    const key = (event: KeyboardEvent) => onKey(event);
    document.addEventListener('keydown', key);
    return () => document.removeEventListener('keydown', key);
  }, []);

  const ranking = room ? standings(room, Math.max(0, time)) : [];
  const isHost = !!session && session.playerId === room?.hostId;
  const isPractice = room?.format === 'practice';
  const inLobby = room?.phase === 'lobby';
  const finished = !!me && me.finishedAt !== null;
  const question = room && me && isRacing ? raceQuestion(room, me, me.answers.length - (feedback ? 1 : 0)) : null;
  const remaining = room && me ? Math.max(0, questionSeconds(room) - (Math.max(0, time) - openedAt(me))) : 0;
  const slots: (CompetitionMember | null)[] = Array.from({ length: 4 }, (_, i) => room?.members[i] ?? null);
  const title = room ? COMPETITIONS[room.mode].title : `${venueInfo.name} registration`;

  return (
    <section ref={root} className={`swim-race competition-arena${!room ? ' at-registration' : ''}`} role="dialog" aria-modal="true" aria-labelledby="competition-title" lang="en">
      <header className="swim-header">
        <div>
          <h2 ref={heading} tabIndex={-1} id="competition-title">{title}</h2>
          <p>{room
            ? `${definition.subtitle} · ${DIFFICULTIES[level].label} · ${isPractice ? 'Solo practice' : `Room ${room.code}${live ? ' · Live' : ''}`}`
            : 'Choose an event and mode'}</p>
        </div>
        <div className="swim-header-actions">
          <button onClick={() => { setBoardOpen(false); setHelp(!help); }} aria-expanded={help}>How to play</button>
          <button disabled={busy} onClick={() => void exit()} aria-label={room && !finished ? 'Leave race' : 'Back to campus'}><Icon name="close" size={18}/></button>
        </div>
      </header>
      {!connected && <div className="competition-error" role="status">Reconnecting. The race clock is still running.</div>}
      {help ? (
        <div className="swim-panel competition-help">
          <h3>How to play</h3>
          <ol>
            <li>Pick an event and a difficulty at the desk. Harder levels ask different questions and give you less time.</li>
            <li>In solo practice, you have the course to yourself. Get at least {RECORD_MIN_CORRECT} answers right to post a time. The board keeps your fastest time for each event and level.</li>
            <li>For online racing, create a room and share the code and venue. Friends join from the same venue and use the host’s difficulty. Everyone presses Ready.</li>
            <li>The host can add bots with the + button. Empty seats fill when the race starts.</li>
            <li>Tap a choice or press keys 1–4. Quick correct answers make you faster. Consecutive correct answers build a combo up to ×1.6.</li>
          </ol>
          <button className="swim-primary" onClick={() => setHelp(false)}>Got it</button>
        </div>
      ) : boardOpen ? (
        <CompetitionRecordBoard key={`${mode}-${level}`} mode={mode} difficulty={level} onBack={() => setBoardOpen(false)}/>
      ) : !room ? (
        <div className="swim-panel competition-desk">
          <fieldset className="race-event-picker">
            <legend>Event</legend>
            {events.map(event => <button key={event} aria-pressed={selected === event} onClick={() => setSelected(event)} disabled={busy}>
              <Icon name={venueInfo.icon} size={18}/><span><strong>{COMPETITIONS[event].title}</strong><small>{COMPETITIONS[event].subtitle}</small></span>
              {selected === event && <Icon name="check" size={15}/>}
            </button>)}
          </fieldset>
          <fieldset className="race-format-picker">
            <legend>Mode</legend>
            <button aria-pressed={format === 'practice'} onClick={() => setFormat('practice')} disabled={busy}><Icon name="user" size={17}/> Solo practice</button>
            <button aria-pressed={format === 'online'} onClick={() => setFormat('online')} disabled={busy}><Icon name="trophy" size={17}/> Race with friends</button>
          </fieldset>
          <label className="race-level">Difficulty
            <select value={difficulty} onChange={event => setDifficulty(event.target.value as RaceDifficulty)} disabled={busy}>
              {DIFFICULTY_IDS.map(id => <option value={id} key={id}>{DIFFICULTIES[id].label} ({DIFFICULTIES[id].level})</option>)}
            </select>
          </label>
          <p className="level-note">{DIFFICULTIES[difficulty].topic}. {DIFFICULTIES[difficulty].seconds} seconds per question.</p>
          <label className="competition-name">Nickname
            <input maxLength={24} value={displayName} onChange={event => setDisplayName(event.target.value)} disabled={busy}/>
          </label>
          <p className="level-note">{format === 'practice' ? 'Your nickname appears on the campus record board when you qualify.' : 'Your nickname is visible to other players in your room.'}</p>
          {error && <p className="race-inline-error" role="alert">{error}</p>}
          <div className="swim-result-actions">
            <button className="swim-primary" disabled={busy || !displayName.trim()} onClick={() => void enter(format === 'practice' ? 'practice' : 'create')}>
              {busy ? 'Connecting…' : format === 'practice' ? 'Start solo practice' : 'Create online room'} <Icon name="arrow" size={16}/>
            </button>
            <button disabled={busy} onClick={() => setBoardOpen(true)}>Campus records</button>
          </div>
          {format === 'online' && <>
          {invitation && code === invitation.code && <p className="level-note">Your friend’s room code is ready. Press Join room to enter.</p>}
          <form className="competition-join" onSubmit={event => { event.preventDefault(); void enter('join'); }}>
            <label>Join a friend’s room
              <input aria-label="Room code" maxLength={6} value={code} onChange={event => setCode(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))} placeholder="ABC123" autoComplete="off" disabled={busy} aria-describedby="race-join-note"/>
            </label>
            <button disabled={busy || code.length !== 6 || !displayName.trim()}>Join room</button>
          </form>
          <p className="level-note" id="race-join-note">Joined rooms use the host’s level.</p>
          </>}
          {resume && <button className="resume-race" disabled={busy} onClick={() => resumeSeat(resume)}>Resume previous race</button>}
        </div>
      ) : inLobby && inviteOpen && isHost ? (
        <RaceFriendInvites code={room.code} onClose={closeInvites}/>
      ) : inLobby ? (
        <div className="swim-panel competition-lobby">
          <div className="competition-room-code">
            <div><small>Invite your friends to {definition.venue}</small><strong>{room.code}</strong></div>
            <button onClick={() => { void navigator.clipboard?.writeText(room.code).then(() => setCopied(true), () => setCopied(false)); }}>{copied ? 'Copied' : 'Copy code'}</button>
          </div>
          <div className="competition-seats">
            {slots.map((member, index) => member ? (
              <div key={member.id} className="competition-seat">
                <span style={{ background: member.colour }}>{member.name.slice(0, 1)}</span>
                <strong>{member.name}{member.id === session?.playerId ? ' (you)' : ''}</strong>
                <small>{member.kind === 'bot' ? 'Bot · Ready' : member.ready ? 'Ready' : 'Not ready'}</small>
                {isHost && member.kind === 'bot' && <button aria-label={`Remove ${member.name}`} disabled={busy} onClick={() => void act('remove', { playerId: member.id })}><Icon name="close" size={14}/></button>}
              </div>
            ) : (
              <button key={index} disabled={!isHost || busy} className="competition-add-bot" aria-label={`Add bot to seat ${index + 1}`} onClick={() => void act('add-bot')}><Icon name="plus" size={22}/>{isHost ? 'Add bot' : 'Empty seat'}</button>
            ))}
          </div>
          {isHost && <button ref={inviteLaunch} className="competition-invite-friends" onClick={() => setInviteOpen(true)}><Icon name="users" size={17}/> Invite friends</button>}
          <p className="swim-help">Friends can replace bots while registration is open. Empty seats fill on Start.</p>
          {error && <p className="race-inline-error" role="alert">{error}</p>}
          <div className="swim-result-actions">
            <button disabled={busy} onClick={() => void act('ready', { ready: !me?.ready })}>{me?.ready ? 'Ready ✓' : 'I’m ready'}</button>
            {isHost ? <button className="swim-primary" disabled={busy || room.members.some(member => member.kind === 'human' && !member.ready)} onClick={() => void act('start')}>Start race</button>
              : <span>Waiting for the host to start…</span>}
          </div>
        </div>
      ) : finished && me ? (
        <div className="swim-panel swim-results">
          <h3>{isPractice ? 'Practice complete' : room.phase === 'finished' && ranking[0]?.id === me.id ? 'You won!' : 'Finish line reached!'}</h3>
          <p>{me.answers.filter(answer => answer.correct).length}/{me.answers.length} correct · Best combo {bestStreak} · {me.finishedAt?.toFixed(3)} s</p>
          {isPractice ? <p className="practice-record" role="status">{room.record ? recordMessages[room.record] : 'Checking your time…'}</p> : (
            <ol className="swim-finish-list">{ranking.map(member => <li key={member.id}><span>{member.name}{member.kind === 'bot' ? ' · Bot' : ''}</span><strong>{member.finishedAt === null ? `${member.metres.toFixed(1)} m` : `${member.finishedAt.toFixed(3)} s`}</strong></li>)}</ol>
          )}
          {online && (together
            ? <p>{threeEach ? 'Team missions complete.' : 'Team finish recorded.'}</p>
            : room.members.some(member => member.id !== me.id && member.kind === 'human' && !member.botAssisted)
              && room.phase === 'racing' && <p>Stay here until your teammate finishes to earn team credit.</p>)}
          <details>
            <summary>Review your answers</summary>
            {me.answers.map((answer, i) => {
              const prompt = raceQuestion(room, me, i);
              return <article key={i}><strong>{answer.correct ? 'Correct' : 'Practise'} · {prompt.sentence}</strong>
                <p>{answer.choice === null ? 'Time ran out.' : `Your answer: ${prompt.choices[answer.choice]}.`} Correct: {prompt.choices[prompt.answer]}.</p><small>{prompt.explanation}</small>
              </article>;
            })}
          </details>
          {error && <p className="race-inline-error" role="alert">{error}</p>}
          {isPractice ? <div className="swim-result-actions">
            <button className="swim-primary" disabled={busy} onClick={() => void exit(true)}>Back to registration</button>
            <button disabled={busy} onClick={() => setBoardOpen(true)}>Campus records</button>
          </div> : room.phase === 'finished'
            ? (isHost ? <button className="swim-primary" disabled={busy} onClick={() => void act('lobby')}>Return everyone to lobby</button> : <p>Waiting for the host to open the next lobby.</p>)
            : <p>Other players are still racing. You can review your answers.</p>}
        </div>
      ) : question && me ? (
        <>
          <ol className="swim-standings" aria-label="Live race positions">{ranking.map((member, index) => (
            <li key={member.id} style={{ '--swim-color': member.colour } as React.CSSProperties}>
              <span>{index + 1}</span><strong>{member.id === me.id ? 'You' : member.name}</strong><small>{member.metres.toFixed(1)} / {definition.distance} m</small>
            </li>
          ))}</ol>
          {time < 0 && <div className="swim-countdown">{Math.ceil(-time)}<small>Get ready</small></div>}
          <div className="swim-panel swim-question">
            <div className="swim-question-meta">
              <span>Question {me.answers.length + (feedback ? 0 : 1)}</span>
              <strong>{last?.streak ? `${last.streak} correct · ×${(1 + Math.min(4, last.streak - 1) * .15).toFixed(2)} combo` : 'Build a correct-answer streak'}</strong>
            </div>
            <progress max={questionSeconds(room)} value={feedback ? questionSeconds(room) : sending?.remaining ?? remaining} aria-label="Question time remaining"/>
            <h3>{question.sentence}</h3>
            <div className="swim-choices">{question.choices.map((choice, i) => (
              <button key={`${question.id}-${i}`} disabled={!canAnswer}
                className={feedback ? (i === question.answer ? 'is-correct' : i === feedback.choice ? 'is-wrong' : '') : sending?.choice === i ? 'is-sending' : ''}
                onClick={() => submit(i)}><kbd>{i + 1}</kbd>{choice}</button>
            ))}</div>
            <div className="swim-feedback" aria-live="polite">{feedback
              ? <><strong>{feedback.correct ? `Speed boost · ${feedback.streak} in a row` : 'Combo reset'}</strong><p>{question.explanation}</p></>
              : <p>{error || (sending ? 'Checking your answer…' : time < 0 ? 'The first question opens when the race starts.' : `${Math.ceil(remaining)} s left`)}</p>}
            </div>
          </div>
        </>
      ) : null}
    </section>
  );
}
