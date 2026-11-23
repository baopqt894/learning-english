'use client';
import { useStudent } from './student-support';

import { useEffect, useState } from 'react';
import { COMPETITIONS, COMPETITION_IDS, DIFFICULTIES, DIFFICULTY_IDS, RACE_QUESTION_COUNT, type CompetitionId, type RaceDifficulty } from '@/lib/competition-catalog';
import type { RaceBoard } from '@/lib/competition-records';

import { Icon } from './icon';
import { PersonalStanding, RankingAvatar } from './ranking-identity';
import type { SportsVenueId } from '@/lib/sports-layout';

type BoardState = 'loading' | 'error' | RaceBoard;

export function CompetitionRecordBoard({ mode, difficulty, avatar, nickname, onVenue, onBack }: {
  mode: CompetitionId;
  difficulty: RaceDifficulty;
  avatar:number; nickname:string; onVenue?:(venue:SportsVenueId)=>void;
  onBack?: () => void;
}) {
  const { t } = useStudent();
  const [event, setEvent] = useState(mode);
  const [level, setLevel] = useState(difficulty);
  return <div className="swim-panel competition-records">
    {onBack && <h3>{t("Campus records")}</h3>}
    <div className="records-filters">
      <div><label htmlFor="record-event">{t("Event")}</label>
        <select id="record-event" value={event} onChange={change => setEvent(change.target.value as CompetitionId)}>
          {COMPETITION_IDS.map(id => <option value={id} key={id}>{t(COMPETITIONS[id].title)}</option>)}
        </select>
      </div>
      <div><label htmlFor="record-difficulty">{t("Difficulty")}</label>
        <select id="record-difficulty" value={level} onChange={change => setLevel(change.target.value as RaceDifficulty)}>
          {DIFFICULTY_IDS.map(id => <option value={id} key={id}>{t(DIFFICULTIES[id].label)}</option>)}
        </select>
      </div>
    </div>
    <RecordedTimes key={`${event}-${level}`} mode={event} difficulty={level} avatar={avatar} nickname={nickname} onVenue={onVenue}/>
    <p className="rank-rule">Solo practice · Answer all {RACE_QUESTION_COUNT} questions correctly to post a time.</p>
    {onBack && <button onClick={onBack}>{t("Back")}</button>}
  </div>;
}

function RecordedTimes({ mode, difficulty, avatar, nickname, onVenue }: { mode: CompetitionId; difficulty: RaceDifficulty; avatar:number; nickname:string; onVenue?:(id:SportsVenueId)=>void }) {
  const { t } = useStudent();
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
    {board === 'loading' ? <p role="status">{t("Loading times…")}</p> : board === 'error' ? <>
      <p role="status">{t("Couldn’t load the records. Check your connection and try again.")}</p>
      <button onClick={() => { setBoard('loading'); setAttempt(attempt + 1); }}>{t("Retry")}</button>
    </> : <>
      <PersonalStanding avatar={avatar} name={nickname} title={t("Your best")} value={board.personal
        ? `#${board.personal.rank} · ${(board.personal.milliseconds / 1000).toFixed(3)} s` : 'Unranked'}/>
      {board.entries.length > 0 ? (
        <table className="records-table"><caption>{t("Fastest cadets")}</caption>
          <thead><tr><th scope="col">{t("Rank")}</th><th scope="col">{t("Cadet")}</th><th scope="col">{t("Time")}</th><th scope="col">{t("Correct")}</th></tr></thead>
          <tbody>{board.entries.map((entry, index) => (
            <tr key={index}><td>{index + 1}</td><td><div className="rank-cadet"><RankingAvatar avatar={entry.avatar}/><span>{entry.name}</span></div></td><td>{(entry.milliseconds / 1000).toFixed(3)} s</td><td>{entry.correct}</td></tr>
          ))}</tbody>
        </table>
      ) : <div className="rank-empty"><Icon name={mode==='swimming'?'pool':mode==='relay'?'flag':'run'} size={29}/><h3>{t("Set the first time")}</h3>
        <p>{t(COMPETITIONS[mode].subtitle)} · {t(DIFFICULTIES[difficulty].label)}</p>
        {onVenue && <button className="rank-go" onClick={()=>onVenue(COMPETITIONS[mode].station)}>{t("Walk to registration")} <Icon name="arrow" size={16}/></button>}</div>}
    </>}
  </>;
}
