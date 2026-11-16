'use client';

import { useEffect, useState } from 'react';
import { COMPETITIONS, COMPETITION_IDS, DIFFICULTIES, DIFFICULTY_IDS, RECORD_MIN_CORRECT, type CompetitionId, type RaceDifficulty } from '@/lib/competition-catalog';
import type { RaceBoard } from '@/lib/competition-records';

type BoardState = 'loading' | 'error' | RaceBoard;

export function CompetitionRecordBoard({ mode, difficulty, onBack }: {
  mode: CompetitionId;
  difficulty: RaceDifficulty;
  onBack: () => void;
}) {
  const [event, setEvent] = useState(mode);
  const [level, setLevel] = useState(difficulty);
  return <div className="swim-panel competition-records">
    <h3>Campus records</h3>
    <p>Fastest solo practices with at least {RECORD_MIN_CORRECT} correct answers.</p>
    <div className="records-filters">
      <div><label htmlFor="record-event">Event</label>
        <select id="record-event" value={event} onChange={change => setEvent(change.target.value as CompetitionId)}>
          {COMPETITION_IDS.map(id => <option value={id} key={id}>{COMPETITIONS[id].title}</option>)}
        </select>
      </div>
      <div><label htmlFor="record-difficulty">Difficulty</label>
        <select id="record-difficulty" value={level} onChange={change => setLevel(change.target.value as RaceDifficulty)}>
          {DIFFICULTY_IDS.map(id => <option value={id} key={id}>{DIFFICULTIES[id].label}</option>)}
        </select>
      </div>
    </div>
    <RecordedTimes key={`${event}-${level}`} mode={event} difficulty={level}/>
    <button onClick={onBack}>Back</button>
  </div>;
}

function RecordedTimes({ mode, difficulty }: { mode: CompetitionId; difficulty: RaceDifficulty }) {
  const [board, setBoard] = useState<BoardState>('loading');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const abort = new AbortController();
    const query = new URLSearchParams({ records: '1', mode, difficulty });
    fetch(`/api/competitions?${query}`, {
      signal: AbortSignal.any([abort.signal, AbortSignal.timeout(10_000)]),
    }).then(async response => {
      if (!response.ok) throw new Error('Could not load records');
      const data: RaceBoard = await response.json();
      if (!abort.signal.aborted) setBoard(data);
    }).catch(() => { if (!abort.signal.aborted) setBoard('error'); });
    return () => abort.abort();
  }, [mode, difficulty, attempt]);
  return <>
    {board === 'loading' ? <p role="status">Loading times…</p> : board === 'error' ? <>
      <p role="status">Couldn’t load the records. Check your connection and try again.</p>
      <button onClick={() => { setBoard('loading'); setAttempt(attempt + 1); }}>Retry</button>
    </> : <>
      <p className="record-personal"><span>Your best</span><strong>{board.personal
        ? `#${board.personal.rank} · ${(board.personal.milliseconds / 1000).toFixed(3)} s`
        : 'No time recorded yet'}</strong></p>
      {board.entries.length > 0 ? (
        <table className="records-table">
          <thead><tr><th scope="col">Rank</th><th scope="col">Cadet</th><th scope="col">Time</th><th scope="col">Correct</th></tr></thead>
          <tbody>{board.entries.map((entry, index) => (
            <tr key={index}><td>{index + 1}</td><td>{entry.name}</td><td>{(entry.milliseconds / 1000).toFixed(3)} s</td><td>{entry.correct}</td></tr>
          ))}</tbody>
        </table>
      ) : <p>No results for this event and level yet. Finish a qualifying practice to set the first time.</p>}
    </>}
  </>;
}
