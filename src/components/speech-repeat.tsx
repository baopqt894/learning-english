'use client';
import { useStudent } from './student-support';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { matchesSpokenAnswer } from '@/lib/speaking-answer';
import { Icon } from './icon';

type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onresult: ((event: { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};
type SpeechWindow = Window & {
  SpeechRecognition?: new () => Recognition;
  webkitSpeechRecognition?: new () => Recognition;
};

function detach(recognizer: Recognition) {
  recognizer.onstart = recognizer.onresult = recognizer.onerror = recognizer.onend = null;
}

const errors: Record<string, string> = {
  'not-allowed': 'Microphone access was denied. Allow it in your browser or type the sentence.',
  'service-not-allowed': 'This browser blocked speech recognition. You can type the sentence.',
  'audio-capture': 'No microphone was available. Connect a mic or type the sentence.',
  'no-speech': 'No speech was detected. Try again or type the sentence.',
  'language-not-supported': 'English speech recognition is unavailable here. You can type the sentence.',
  network: 'The speech service could not connect. Try again or type the sentence.',
};

export function SpeechRepeat({ expected, ready, playback, passed, onAnswer, onMicrophone }: {
  expected: string; ready: boolean; playback: boolean; passed: boolean;
  onAnswer: (transcript: string) => void; onMicrophone: (active: boolean) => void;
}) {
  const { t } = useStudent();
  const [phase, setPhase] = useState<'idle' | 'starting' | 'listening' | 'checking'>('idle');
  const [message, setMessage] = useState('');
  const [typed, setTyped] = useState(false);
  const [draft, setDraft] = useState('');
  const [heard, setHeard] = useState('');
  const active = useRef<Recognition | null>(null);
  const deadline = useRef<number | undefined>(undefined);

  useEffect(() => () => {
    window.clearTimeout(deadline.current);
    const recognizer = active.current;
    if (recognizer) {
      detach(recognizer);
      recognizer.abort();
      active.current = null;
    }
  }, []);

  function finish(recognizer: Recognition, notice?: string, abort = false) {
    if (active.current !== recognizer) return;
    active.current = null;
    window.clearTimeout(deadline.current);
    detach(recognizer);
    if (abort) recognizer.abort();
    setPhase('idle');
    onMicrophone(false);
    if (notice) setMessage(notice);
  }

  function start() {
    if (!ready || playback || passed || active.current) return;
    const browser = window as SpeechWindow;
    const SpeechRecognition = browser.SpeechRecognition ?? browser.webkitSpeechRecognition;
    if (!window.isSecureContext || !SpeechRecognition) {
      setMessage('Microphone recognition is unavailable in this browser. You can type the sentence.');
      setTyped(true);
      return;
    }
    const recognizer = new SpeechRecognition();
    active.current = recognizer;
    recognizer.lang = 'en-US';
    recognizer.continuous = false;
    recognizer.interimResults = false;
    recognizer.maxAlternatives = 3;
    recognizer.onstart = () => { if (active.current === recognizer) setPhase('listening'); };
    recognizer.onresult = event => {
      if (active.current !== recognizer) return;
      const alternatives = Array.from(event.results[event.resultIndex] ?? [], result => result.transcript.trim()).filter(Boolean);
      const transcript = alternatives.find(item => matchesSpokenAnswer(expected, item)) ?? alternatives[0];
      if (!transcript) { finish(recognizer, errors['no-speech'], true); return; }
      finish(recognizer, undefined, true);
      setHeard(transcript);
      onAnswer(transcript);
    };
    recognizer.onerror = event => finish(recognizer, errors[event.error] ?? 'The microphone could not finish. Try again or type the sentence.');
    recognizer.onend = () => finish(recognizer, 'No words were recognised. Try again or type the sentence.');
    setPhase('starting');
    setMessage('');
    setHeard('');
    onMicrophone(true);
    deadline.current = window.setTimeout(() => finish(recognizer, 'The microphone took too long. Try again or type the sentence.', true), 35000);
    try { recognizer.start(); }
    catch { finish(recognizer, 'The microphone could not start. Try again or type the sentence.'); }
  }

  function stop() {
    const recognizer = active.current;
    if (!recognizer) return;
    if (phase === 'starting') { finish(recognizer, undefined, true); return; }
    try { recognizer.stop(); setPhase('checking'); }
    catch { finish(recognizer, 'The microphone could not finish. Try again or type the sentence.', true); }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (ready && draft.trim() && !passed) { setHeard(''); setMessage(''); onAnswer(draft); }
  }

  if (passed && !heard) return null;
  return <div className="practice-repeat">
    {!passed && <div className="practice-repeat-actions">
      <button className="practice-audio-button" type="button"
        disabled={(!ready || playback) || phase === 'checking'}
        onClick={phase === 'idle' ? start : stop}>
        <Icon name="mic" size={18}/>
        {phase === 'starting' ? t('Cancel mic') : phase === 'listening' ? t('Finish speaking') : phase === 'checking' ? t('Checking…') : t('Use microphone')}
      </button>
      <button className="practice-text-action" type="button" disabled={!ready}
        aria-expanded={typed} onClick={() => {
          if (active.current) finish(active.current, undefined, true);
          setTyped(!typed);
        }}>{typed ? t('Hide typing') : t('Type instead')}</button>
    </div>}
    {phase !== 'idle' && <p role="status">{phase === 'listening' ? t('Listening… repeat the whole message.') : phase === 'checking' ? t('Checking the words you said…') : t('Waiting for microphone access…')}</p>}
    {message && <p className="practice-mic-error" role="status">{message}</p>}
    {heard && <p className="practice-heard">Heard: <span>{heard}</span></p>}
    {!typed && !passed && phase === 'idle' && !message && !heard && <p className="practice-mic-note">{t("Your browser may use an online service to recognise your voice.")}</p>}
    {typed && !passed && <form className="practice-fill" onSubmit={submit}>
      <label htmlFor="practice-repeat-text">{t("Repeat the message in writing")}</label>
      <textarea id="practice-repeat-text" value={draft} onChange={event => setDraft(event.target.value)}
        rows={3} maxLength={350} autoComplete="off" autoCorrect="off" spellCheck={false} enterKeyHint="done"/>
      <button type="submit" className="practice-primary" disabled={!ready || !draft.trim()}>{t("Check answer")}</button>
    </form>}
  </div>;
}
