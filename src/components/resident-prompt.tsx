'use client';

import { useEffect, useRef, useState } from 'react';
import { CHARACTER_PROFILES } from '@/lib/campus-character';
import type { CampusResident } from '@/lib/campus-residents';
import { Icon } from './icon';

export function ResidentPrompt({ resident, open, onOpen, onClose, onVoice }: {
  resident: CampusResident;
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  onVoice: (speaking: boolean) => void;
}) {
  const [translation, setTranslation] = useState(false);
  const [audioStatus, setAudioStatus] = useState('');
  const name = CHARACTER_PROFILES[resident.kind].name;
  const closeButton = useRef<HTMLButtonElement>(null);
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
    const line = new SpeechSynthesisUtterance(resident.line);
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

  if (!open) return <button type="button" className="resident-open" onClick={onOpen}
    aria-label={`Trò chuyện với ${name}`}>
    <Icon name="chat" size={19}/><span><strong>{name}</strong><small>{resident.role}</small></span><kbd>E</kbd>
  </button>;

  return <aside className="resident-card" aria-label={`Trò chuyện với ${name}`}>
    <div className="resident-card-heading">
      <span><strong>{name}</strong><small>{resident.role}</small></span>
      <button type="button" className="resident-close" ref={closeButton} onClick={onClose} aria-label="Đóng trò chuyện"><Icon name="close" size={19}/></button>
    </div>
    <blockquote lang="en">{resident.line}</blockquote>
    {translation && <p>{resident.meaning}</p>}
    {audioStatus && <p role="status">{audioStatus}</p>}
    <div className="resident-actions">
      <button type="button" onClick={listen}><Icon name="sound" size={17}/> Nghe</button>
      <button type="button" aria-expanded={translation} onClick={() => setTranslation(!translation)}>
        {translation ? 'Ẩn nghĩa' : 'Xem nghĩa'}
      </button>
    </div>
  </aside>;
}
