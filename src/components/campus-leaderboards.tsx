'use client';
import { useStudent } from './student-support';

import { useEffect, useState } from 'react';
import type { LearningBoard } from '@/lib/learning-standings';
import { CompetitionRecordBoard } from './competition-record-board';
import type { SportsVenueId } from '@/lib/sports-layout';
import { PersonalStanding, RankingAvatar } from './ranking-identity';
import { Icon } from './icon';
import './campus-rankings.css';

function ChallengeStandings({ flush, avatar, nickname }: { flush: () => Promise<boolean>; avatar:number; nickname:string }) {
  const { t } = useStudent();
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

    {!synced && <p role="status">Showing saved results. Your latest progress is still syncing.</p>}
    {board === 'loading' ? <p role="status">{t("Loading standings…")}</p>
      : board === 'error' ? <div role="status">Couldn’t load standings. <button onClick={() => { setBoard('loading'); setAttempt(n => n + 1); }}>{t("Retry")}</button></div>
      : <>
        <PersonalStanding avatar={avatar} name={nickname} title={t("Your standing")} value={board.personal ? `#${board.personal.rank} · ${board.personal.points} pts` : '0 pts'}/>
        {board.entries.length ? <table className="records-table"><caption>{t("Top 10 cadets")}</caption>
          <thead><tr><th scope="col">{t("Rank")}</th><th scope="col">{t("Cadet")}</th><th scope="col">{t("Points")}</th></tr></thead>
          <tbody>{board.entries.map((entry, i) => <tr key={i} data-me={entry.isMe}>
            <td>#{entry.rank}</td><td><div className="rank-cadet"><RankingAvatar avatar={entry.avatar}/><span>{entry.name}{entry.isMe && ' (you)'}</span></div></td><td>{entry.points}</td>
          </tr>)}</tbody></table> : <div className="rank-empty"><Icon name="book" size={24}/><h3>{t("No scores yet")}</h3><p>Finish an area quiz to post the first score.</p></div>}
      </>}
    <p className="rank-rule">Each new area quiz, level mission or NPC assignment earns one point.</p>
  </>;
}

export function CampusLeaderboards({ flush, avatar, nickname, onVenue, onClose }: { flush: () => Promise<boolean>; avatar: number; nickname: string; onVenue:(id: SportsVenueId)=>void; onClose: () => void }) {
  const { t } = useStudent();
  const [tab, setTab] = useState<'learning' | 'race'>('learning');
  return <div className="modal-backdrop"><section className="campus-rankings" role="dialog" aria-modal="true" aria-labelledby="rank-title" lang="en">
    <header><span className="rank-crest"><Icon name="trophy" size={25}/></span><h2 id="rank-title">{t("Leaderboards")}</h2><button aria-label="Close leaderboards" onClick={onClose}><Icon name="close"/></button></header>
    <div className="rank-tabs"><button aria-pressed={tab === 'learning'} onClick={() => setTab('learning')}><Icon name="book" size={16}/> {t("English challenges")}</button>
      <button aria-pressed={tab === 'race'} onClick={() => setTab('race')}><Icon name="clock" size={16}/> {t("Race times")}</button></div>
    <div className="rank-content">{tab === 'learning' ? <ChallengeStandings flush={flush} avatar={avatar} nickname={nickname}/> : <CompetitionRecordBoard mode="swimming" difficulty="beginner" avatar={avatar} nickname={nickname} onVenue={onVenue}/>}</div>
  </section></div>;
}
