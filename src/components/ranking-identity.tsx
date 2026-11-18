import { Icon } from './icon';

export function RankingAvatar({ avatar }: { avatar?: number }) {
  return avatar===0 || avatar===1
    ? <span aria-hidden="true" className={`cadet-portrait ranking-avatar avatar-${avatar}`}/>
    : <span className="rank-unknown" aria-hidden="true"><Icon name="user" size={18}/></span>;
}

export function PersonalStanding({ avatar, name, title, value }: { avatar: number; name: string; title: string; value: string }) {
  return <div className="rank-personal"><RankingAvatar avatar={avatar}/>
    <div><small>{title}</small><strong>{name}</strong></div><b>{value}</b>
  </div>;
}
