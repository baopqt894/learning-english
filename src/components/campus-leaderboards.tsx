'use client';

import { useEffect, useState } from 'react';
import type { LearningBoard } from '@/lib/learning-standings';
import { CompetitionRecordBoard } from './competition-record-board';
import { Icon } from './icon';
import './campus-rankings.css';

function ChallengeStandings({ flush }: { flush: () => Promise<boolean> }) {
  const [board, setBoard] = useState<LearningBoard | 'loading' | 'error'>('loading');
  const [attempt, setAttempt] = useState(0);
  const [synced, setSynced] = useState(true);
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      const saved = await flush();
      if (controller.signal.aborted) return;
      setSynced(saved);
      const response = await fetch('/api/leaderboards', {
        cache: 'no-store', signal: AbortSignal.any([controller.signal, AbortSignal.timeout(12000)]),
      });
      if (!response.ok) throw new Error('Standings unavailable');
      const data: LearningBoard = await response.json();
      if (!controller.signal.aborted) setBoard(data);
    }
    void load().catch(() => { if (!controller.signal.aborted) setBoard('error'); });
    return () => controller.abort();
  }, [attempt, flush]);
  return <>
    <p>Earn one point for each different area quiz, level mission or NPC assignment you complete.</p>
    {!synced && <p role="status">Showing saved results. Your latest progress is still syncing.</p>}
    {board === 'loading' ? <p role="status">Loading standings…</p>
      : board === 'error' ? <div role="status">Couldn’t load standings. <button onClick={() => { setBoard('loading'); setAttempt(n => n + 1); }}>Retry</button></div>
      : <>
        <div className="rank-personal"><span>Your standing</span><strong>{board.personal ? '#' + board.personal.rank + ' · ' + board.personal.points + ' pts' : 'Complete your first challenge'}</strong></div>
        {board.entries.length ? <table className="records-table"><caption>Top 10 cadets</caption>
          <thead><tr><th scope="col">Rank</th><th scope="col">Cadet</th><th scope="col">Points</th></tr></thead>
          <tbody>{board.entries.map((entry, i) => <tr key={i} data-me={entry.isMe}>
            <td>#{entry.rank}</td><td>{entry.name}{entry.isMe && ' (you)'}</td><td>{entry.points}</td>
          </tr>)}</tbody></table> : <p>No completed challenges yet. Finish an area quiz to set the first score.</p>}
      </>}
  </>;
}

export function CampusLeaderboards({ flush, onClose }: { flush: () => Promise<boolean>; onClose: () => void }) {
  const [tab, setTab] = useState<'learning' | 'race'>('learning');
  return <div className="modal-backdrop"><section className="campus-rankings" role="dialog" aria-modal="true" aria-labelledby="rank-title" lang="en">
    <header><h2 id="rank-title">Leaderboards</h2><button aria-label="Close leaderboards" onClick={onClose}><Icon name="close"/></button></header>
    <div className="rank-tabs"><button aria-pressed={tab === 'learning'} onClick={() => setTab('learning')}>English challenges</button>
      <button aria-pressed={tab === 'race'} onClick={() => setTab('race')}>Race times</button></div>
    {tab === 'learning' ? <ChallengeStandings flush={flush}/> : <CompetitionRecordBoard mode="swimming" difficulty="beginner"/>}
  </section></div>;
}
