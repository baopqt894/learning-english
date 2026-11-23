'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { defaultStudent, englishLine, translate, type Language, type Phrase, type StudentSettings } from '@/lib/student-support';
import { UI_PHRASES } from '@/lib/ui-phrases';
import { Icon } from './icon';

export const StudentContext = createContext({
  settings: defaultStudent,
  change: (_settings: StudentSettings) => { void _settings; },
  remember: (_phrase: Phrase) => { void _phrase; },
});

export function useStudent() {
  const context = useContext(StudentContext);
  return { ...context, t: (text: string) => translate(context.settings.language, text) };
}

export function LanguageSelect() {
  const { settings, change, t } = useStudent();
  return <label className="student-select">{t('Language')}
    <select value={settings.language} onChange={e => change({...settings, language: e.target.value as Language})}>
      <option lang="vi" value="vi">Tiếng Việt</option><option lang="en" value="en">English</option>
    </select>
  </label>;
}

const words = ['Mission journal','Walk to mission','Accept mission','Turn in mission','Hint','Speak','Type',
  'Listen again','Check answer','Next','Daily missions','Solo practice','Join room','Difficulty','Leaderboards','Friends'];

const searchablePhrases = Array.from(new Map(UI_PHRASES.filter(([en])=>en.length <= 65)).entries());

export function Phrasebook({onClose}: {onClose: () => void}) {
  const { settings, change, remember, t } = useStudent();
  const [saved, setSaved] = useState(false);
  const [revealed, setRevealed] = useState('');
  const [query, setQuery] = useState('');
  const [error, setError] = useState(false);
  useEffect(() => () => window.speechSynthesis?.cancel(), []);
  function listen(text: string) {
    setError(false);
    if (!window.speechSynthesis) {setError(true); return;}
    window.speechSynthesis.cancel();
    const line = englishLine(text, settings.pace);
    line.onerror = e => { if (e.error !== 'canceled' && e.error !== 'interrupted') setError(true); };
    window.speechSynthesis.speak(line);
  }
  const search = query.trim().toLocaleLowerCase();
  const matches = (phrase: Phrase) => [phrase.en,phrase.vi].some(text=>text.toLocaleLowerCase().includes(search));
  const list = saved ? settings.phrases.filter(matches) : search
    ? searchablePhrases.filter(([en,vi])=>matches({en,vi})).slice(0,40).map(([en,vi])=>({en,vi}))
    : words.map(en=>({en,vi:translate('vi',en)}));
  return <div className="modal-backdrop"><section className="student-book" role="dialog" aria-modal="true" aria-labelledby="phrasebook-title">
    <header><h2 id="phrasebook-title">{t('My phrasebook')}</h2><button className="hud-button" onClick={onClose} aria-label={t('Close')}><Icon name="close"/></button></header>
    <LanguageSelect/>
    <label className="student-select">{t('English reading speed')}<select value={settings.pace} onChange={e => change({...settings, pace: e.target.value === 'slow' ? 'slow' : 'normal'})}>
      <option value="normal">{t('Normal')}</option><option value="slow">{t('Slow')}</option></select></label>
    <button className="student-audio" onClick={() => listen('Hello! Welcome to our school.')}><Icon name="sound" size={16}/>{t('Listen to a sample')}</button>
    <nav>{[false,true].map(value => <button key={String(value)} aria-pressed={saved===value} onClick={() => {setSaved(value);setRevealed('');setQuery('');}}>{t(value?'Saved phrases':'Look up')}{value && ' · '+settings.phrases.length}</button>)}</nav>
    <p>{!saved ? t('Tap a phrase to see its meaning and save it here.') : settings.phrases.length ? null : t('Look up a phrase to start your list.')}</p>
    <input className="book-search" type="search" placeholder={t('Find a phrase…')} aria-label={t('Find a phrase…')} value={query} onChange={e=>setQuery(e.target.value)}/>
    {!list.length && query && <p role="status">{t('No matching phrases.')}</p>}
    <ul>{list.map(phrase=><li key={phrase.en}>
      <button aria-expanded={revealed===phrase.en} onClick={()=>{setRevealed(revealed===phrase.en?'':phrase.en);if(!saved)remember(phrase);}}>
        <strong lang="en">{phrase.en}</strong>{revealed===phrase.en && <span lang="vi">{phrase.vi}</span>}
      </button><button aria-label={t('Listen')+' · '+phrase.en} onClick={()=>listen(phrase.en)}><Icon name="sound" size={17}/></button>
    </li>)}</ul>{error && <p role="status">{settings.language==='vi'?'Thiết bị chưa phát được âm thanh.':'Audio is unavailable on this device.'}</p>}
  </section></div>;
}
