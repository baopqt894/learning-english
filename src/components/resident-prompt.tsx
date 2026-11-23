'use client';
import { englishLine } from '@/lib/student-support';
import { useStudent } from './student-support';

import { useEffect, useRef, useState } from 'react';
import { CHARACTER_PROFILES } from '@/lib/campus-character-profiles';
import type { CampusResident } from '@/lib/campus-residents';
import { RESIDENT_MISSIONS, type ResidentMissionStatus } from '@/lib/resident-missions';
import { Icon } from './icon';

export function ResidentPrompt({ resident, open, status, onOpen, onClose, onVoice, onAccept, onStart, onClaim }: {
  resident: CampusResident;
  open: boolean;
  status?: ResidentMissionStatus | 'complete';
  onOpen: () => void;
  onClose: () => void;
  onVoice: (speaking: boolean) => void;
  onAccept: () => void;
  onStart: () => void;
  onClaim: () => void;
}) {
  const { t, settings, remember } = useStudent();
  const [step, setStep] = useState(0);
  const [answer, setAnswer] = useState<string>();
  const [review, setReview] = useState(false);
  const [translation, setTranslation] = useState(false);
  const [audioStatus, setAudioStatus] = useState('');
  const name = CHARACTER_PROFILES[resident.kind].name;
  const mission = RESIDENT_MISSIONS[resident.kind];
  const closeButton = useRef<HTMLButtonElement>(null);
  const reporting = status === 'ready';
  const dialogue = reporting || !status || review;
  const turn = reporting ? mission.report : mission.dialogue[step];
  const correct = answer === turn.correct;
  const distractorFirst = (resident.kind.charCodeAt(0) + step + Number(reporting)) % 2 === 0;
  const options = distractorFirst ? [turn.other, turn.correct] : [turn.correct, turn.other];
  const prompt = dialogue ? turn.prompt : resident.line;
  const meaning = dialogue ? turn.meaning : resident.meaning;

  useEffect(() => {
    if (!open) return;
    closeButton.current?.focus({ preventScroll: true });
    return () => {
      window.speechSynthesis?.cancel();
      onVoice(false);
    };
  }, [open, onVoice]);

  function listen() {
    if (!('speechSynthesis' in window)) {
      setAudioStatus('Thiết bị này chưa phát được giọng đọc.');
      return;
    }
    speechSynthesis.cancel();
    const line = englishLine(prompt, settings.pace);
    line.onstart = () => onVoice(true);
    line.onend = () => onVoice(false);
    line.onerror = event => {
      onVoice(false);
      if (event.error !== 'canceled' && event.error !== 'interrupted') setAudioStatus('Chưa phát được giọng đọc.');
    };
    setAudioStatus('');
    speechSynthesis.speak(line);
  }

  function clearTurn() {
    window.speechSynthesis?.cancel();
    onVoice(false);
    setAnswer(undefined);
    setTranslation(false);
    setAudioStatus('');
  }

  function next() {
    if (!correct) return;
    clearTurn();
    if (reporting) { onClaim(); return; }
    if (step === 0) { setStep(1); return; }
    if (review) setReview(false);
    else onAccept();
    setStep(0);
  }

  if (!open) {
    const action = reporting ? 'Turn in mission' : !status ? 'Accept mission'
      : status === 'active' ? 'Continue mission' : 'Talk';
    return <button type="button" className="resident-open" data-mission-state={status ?? 'new'}
      aria-label={`${action} · ${name} · ${t(mission.title)}`} onClick={onOpen}>
      {reporting || !status ? <b className="resident-quest-sign" aria-hidden="true">!</b>
        : <Icon name={status === 'active' ? 'clock' : 'chat'} size={20}/>}
      <span><strong lang="en">{t(action)}</strong><small>{name} · {t(mission.title)}</small></span>
      <kbd>E</kbd><Icon name="chevron" size={16}/>
    </button>;
  }

  return <aside className="resident-card" aria-label={`Trò chuyện với ${name}`}>
    <div className="resident-card-heading">
      <span><strong>{name}</strong><small>{resident.role}</small></span>
      <button type="button" className="resident-close" ref={closeButton} onClick={onClose} aria-label={t("Đóng trò chuyện")}><Icon name="close" size={19}/></button>
    </div>
    <div className="resident-mission-heading">
      <h3 lang="en">{t(mission.title)}</h3>
      <span>{reporting ? t('Báo cáo') : status === 'active' ? t('Đang làm') : status === 'complete' && !review ? t('Đã hoàn thành') : `${step + 1}/2`}</span>
    </div>
    {dialogue || status === 'active' ? <>
      <blockquote lang="en">{prompt}</blockquote>
      {translation && <p>{meaning}</p>}
      {audioStatus && <p role="status">{audioStatus}</p>}
      <div className="resident-actions">
        <button type="button" onClick={listen}><Icon name="sound" size={17}/> {t("Nghe")}</button>
        <button type="button" aria-expanded={translation} onClick={() => {if (!translation) remember({en:prompt,vi:meaning});setTranslation(!translation);}}>
          {translation ? t('Ẩn nghĩa') : t('Xem nghĩa')}
        </button>
      </div>
    </> : <p lang="en">Thanks for your help!</p>}
    {dialogue && <>
      <div className="resident-replies" lang="en" aria-label={t("Chọn câu trả lời")}>
        {options.map(option => <button key={option} type="button" aria-pressed={answer === option} disabled={correct}
          onClick={() => setAnswer(option)}>{option}</button>)}
      </div>
      {answer && <p className="resident-feedback" role="status">{correct ? t('Đúng rồi.') : t('Thử lại. Câu trả lời cần khớp với lời của nhân vật.')}</p>}
      {correct && <button type="button" className="resident-primary" onClick={next}>
        {reporting ? `Nhận ${mission.xp} XP` : step === 0 ? t('Tiếp tục') : review ? t('Kết thúc ôn tập') : t('Nhận nhiệm vụ')}
      </button>}
    </>}
    {status === 'active' && <>
      <p className="resident-task">{t(mission.summary)}</p>
      <button type="button" className="resident-primary" onClick={onStart}>{t(mission.action)}<Icon name="arrow" size={17}/></button>
    </>}
    {status === 'complete' && !review && <button type="button" className="resident-primary" onClick={() => { clearTurn(); setStep(0); setReview(true); }}>{t("Ôn hội thoại")}</button>}
  </aside>;
}
