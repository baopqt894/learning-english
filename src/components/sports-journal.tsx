'use client';
import { useStudent } from './student-support';

import { campusDayLabel, currentDaily, dailyMissions, type DailyProgress } from '@/lib/daily-missions';
import { SPORTS_VENUES, SPORTS_VENUE_IDS, type SportsVenueId } from '@/lib/sports-layout';
import { Icon } from './icon';
import './sports-journal.css';

const courses = {
  pool: '25 m freestyle',
  track: '40 m sprint and hurdles',
  field: 'Sack race and baton dash',
};

export function SportsJournal({ kind, day, progress, onClose, onWalk }: {
  kind: 'venues' | 'daily';
  day: number;
  progress?: DailyProgress;
  onClose: () => void;
  onWalk: (venue: SportsVenueId) => void;
}) {
  const { t } = useStudent();
  const daily = currentDaily(progress, day);
  const missions = dailyMissions(daily.day);
  return (
    <div className="modal-backdrop sports-backdrop">
      <section className="sports-journal" lang="en" role="dialog" aria-modal="true" aria-labelledby="sports-journal-title">
        <header>
          <div>
            <h2 id="sports-journal-title">{kind === 'venues' ? t('English competitions') : t('Daily missions')}</h2>
            <p>{kind === 'venues'
              ? 'Walk to a registration desk to start a practice or meet your friends.'
              : campusDayLabel(daily.day)}</p>
          </div>
          <button type="button" className="sports-journal-close" onClick={onClose} aria-label={t("Close")}><Icon name="close" size={21}/></button>
        </header>
        {kind === 'venues' ? (
          <ul className="sports-venues">
            {SPORTS_VENUE_IDS.map(id => (
              <li key={id}>
                <button onClick={() => onWalk(id)}>
                  <span className="sports-venue-icon" data-venue={id}><Icon name={SPORTS_VENUES[id].icon} size={24}/></span>
                  <span><strong>{SPORTS_VENUES[id].name}</strong><small>{courses[id]}</small></span>
                  <span className="sports-walk-label">{t("Walk there")} <Icon name="arrow" size={17}/></span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <>
            <p className="daily-summary"><strong>{daily.completed.length}/{missions.length} {t("complete")}</strong><span>New missions at midnight, Vietnam time</span></p>
            <ul className="sports-missions">
              {missions.map(mission => {
                const done = daily.completed.includes(mission.id);
                return <li key={mission.id} data-complete={done}>
                  <span className="daily-icon"><Icon name={done ? 'check' : mission.id === 'course' ? SPORTS_VENUES[mission.venue].icon : 'team' in mission ? 'users' : mission.id === 'streak' ? 'star' : 'book'} size={20}/></span>
                  <div><strong>{mission.title}</strong>{'team' in mission && <span className="daily-team-label">{t("Team")}</span>}<p>{mission.description}</p>
                    {mission.venue && !done && <button onClick={() => onWalk(mission.venue)}>{t("Walk to")} {SPORTS_VENUES[mission.venue].name.toLowerCase()} <Icon name="arrow" size={14}/></button>}
                  </div>
                  <span className="daily-xp">{done ? 'Earned ' : '+'}{mission.xp} XP</span>
                </li>;
              })}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}
