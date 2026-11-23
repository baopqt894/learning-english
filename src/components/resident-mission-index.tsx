import { useStudent } from './student-support';
import { CAMPUS_RESIDENTS } from '@/lib/campus-residents';
import { CHARACTER_PROFILES } from '@/lib/campus-character-profiles';
import { RESIDENT_MISSIONS, type ResidentKind } from '@/lib/resident-missions';
import type { Progress } from '@/lib/game';
import { Icon } from './icon';

export function ResidentMissionIndex({ progress, onWalk }: { progress: Progress; onWalk: (id: ResidentKind) => void }) {
  const { t } = useStudent();
  const entries = CAMPUS_RESIDENTS.map(({ kind, role }) => ({
    kind, role, complete: progress.challenges?.includes(`resident/${kind}`) ?? false,
    status: progress.residentMissions?.[kind],
  }));
  const ready = entries.filter(entry => !entry.complete && entry.status === 'ready').length;
  const completed = entries.filter(entry => entry.complete).length;
  const rank = (entry: typeof entries[number]) => entry.complete ? 3 : entry.status === 'ready' ? 0 : entry.status === 'active' ? 1 : 2;
  entries.sort((a, b) => rank(a) - rank(b));

  return <details className="mission-disclosure" lang="vi">
    <summary><span>{t("Nhiệm vụ NPC")} <small>{ready ? `${ready} chờ báo cáo` : `${completed}/${entries.length}`}</small></span><Icon name="chevron" size={18}/></summary>
    <ul className="mission-index-list">
      {entries.map(({ kind, role, status, complete }) => {
        const mission = RESIDENT_MISSIONS[kind];
        return <li key={kind} data-status={status === 'ready' ? 'ready' : complete ? 'complete' : 'available'}>
          <span className="mission-index-level" aria-hidden="true"><Icon name={complete || status === 'ready' ? 'check' : 'chat'} size={16}/></span>
          <div>
            <h4>{CHARACTER_PROFILES[kind].name}</h4>
            <p lang="en">{t(mission.title)}</p>
            <p>{complete ? t('Đã hoàn thành') : status === 'ready' ? 'Chờ báo cáo' : status === 'active' ? t('Đang làm') : role} · {mission.xp} XP</p>
          </div>
          <button type="button" className={status === 'ready' ? 'activity-button' : 'activity-back'}
            onClick={() => onWalk(kind)} aria-label={`Đi tới ${CHARACTER_PROFILES[kind].name}`}>{t("Đi tới")} <Icon name="arrow" size={15}/></button>
        </li>;
      })}
    </ul>
  </details>;
}
