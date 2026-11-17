'use client';

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
    const line = new SpeechSynthesisUtterance(prompt);
    line.lang = 'en-US';
    line.rate = .86;
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

  if (!open) return <button type="button" className="resident-open" onClick={onOpen}
    aria-label={`Trò chuyện với ${name}`}>
    <Icon name={status === 'ready' ? 'check' : 'chat'} size={19}/>
    <span><strong>{name}</strong><small>{status === 'ready' ? 'Sẵn sàng báo cáo' : resident.role}</small></span><kbd>E</kbd>
  </button>;

  return <aside className="resident-card" aria-label={`Trò chuyện với ${name}`}>
    <div className="resident-card-heading">
      <span><strong>{name}</strong><small>{resident.role}</small></span>
      <button type="button" className="resident-close" ref={closeButton} onClick={onClose} aria-label="Đóng trò chuyện"><Icon name="close" size={19}/></button>
    </div>
    <div className="resident-mission-heading">
      <h3 lang="en">{mission.title}</h3>
      <span>{reporting ? 'Báo cáo' : status === 'active' ? 'Đang làm' : status === 'complete' && !review ? 'Đã hoàn thành' : `${step + 1}/2`}</span>
    </div>
    {dialogue || status === 'active' ? <>
      <blockquote lang="en">{prompt}</blockquote>
      {translation && <p>{meaning}</p>}
      {audioStatus && <p role="status">{audioStatus}</p>}
      <div className="resident-actions">
        <button type="button" onClick={listen}><Icon name="sound" size={17}/> Nghe</button>
        <button type="button" aria-expanded={translation} onClick={() => setTranslation(!translation)}>
          {translation ? 'Ẩn nghĩa' : 'Xem nghĩa'}
        </button>
      </div>
    </> : <p lang="en">Thanks for your help!</p>}
    {dialogue && <>
      <div className="resident-replies" lang="en" aria-label="Chọn câu trả lời">
        {options.map(option => <button key={option} type="button" aria-pressed={answer === option} disabled={correct}
          onClick={() => setAnswer(option)}>{option}</button>)}
      </div>
      {answer && <p className="resident-feedback" role="status">{correct ? 'Đúng rồi.' : 'Thử lại. Câu trả lời cần khớp với lời của nhân vật.'}</p>}
      {correct && <button type="button" className="resident-primary" onClick={next}>
        {reporting ? `Nhận ${mission.xp} XP` : step === 0 ? 'Tiếp tục' : review ? 'Kết thúc ôn tập' : 'Nhận nhiệm vụ'}
      </button>}
    </>}
    {status === 'active' && <>
      <p className="resident-task">{mission.summary}</p>
      <button type="button" className="resident-primary" onClick={onStart}>{mission.action}<Icon name="arrow" size={17}/></button>
    </>}
    {status === 'complete' && !review && <button type="button" className="resident-primary" onClick={() => { clearTurn(); setStep(0); setReview(true); }}>Ôn hội thoại</button>}
  </aside>;
}
