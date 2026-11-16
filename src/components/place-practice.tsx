'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { PLACE_PRACTICE, type PlaceQuestion } from '@/lib/place-practice';
import { LEVEL_MISSIONS, type EnglishTier, type LevelMissionId } from '@/lib/cadet-tiers';
import { isTypedAnswerCorrect, missionAudioPath } from '@/lib/mission-exercises';
import { PETS, petStatus, type PetCare, type PetId } from '@/lib/pet-care';
import { Icon } from './icon';
import './place-practice.css';

type Props = {
  area: string;
  feeding?: PetId;
  care: PetCare;
  purpose?: 'work' | 'rescue';
  mission?: LevelMissionId;
  tier: EnglishTier;
  questions: PlaceQuestion[];
  onFeed: (id: PetId) => void;
  onComplete: () => void;
  onExit: () => void;
};

export function PlacePractice({ area, feeding, care, purpose, mission, tier, questions, onFeed, onComplete, onExit }: Props) {
  const [index, setIndex] = useState(0);
  const [showQuiz, setShowQuiz] = useState(!!feeding || !!mission || area !== 'livestock');
  const panel = useRef<HTMLElement>(null);
  const question = questions[index];
  const lesson = PLACE_PRACTICE[area] ?? PLACE_PRACTICE.courtyard;
  const assignment = mission ? LEVEL_MISSIONS[mission] : null;
  const title = feeding ? `Earn food for your ${PETS[feeding].name.toLowerCase()}` : assignment?.title ?? lesson.title;
  const brief = assignment?.brief ?? (feeding ? 'Answer all three questions, then feed directly in 3D.'
    : purpose === 'work' ? 'Pass the English quiz to start the 3D assignment.'
    : purpose === 'rescue' ? 'Pass the safety quiz to unlock the rescue throw.'
    : 'Practise English for this part of the school.');
  const nextAction = assignment ? 'Finish mission' : feeding ? 'Collect food and go to pen'
    : purpose === 'work' ? 'Start 3D assignment' : purpose === 'rescue' ? 'Unlock rescue throw' : 'Continue exploring';
  const result = assignment ? 'You completed the English exercises for this assignment.'
    : feeding ? 'Your food portion is ready. Walk to the highlighted feeding point and hold E to feed your animals.'
    : purpose === 'work' ? 'Your assignment is ready. Follow the instructions at the work site.'
    : purpose === 'rescue' ? 'Walk to the marked point on the dry deck to throw the ring.'
    : 'Well done. Use these words while exploring this area.';

  useEffect(() => { panel.current?.scrollTo(0, 0); }, [index, showQuiz]);

  return <div className="practice-backdrop">
    <section ref={panel} className="practice-modal" role="dialog" aria-modal="true" aria-labelledby="place-practice-title" lang="en">
      <header>
        <div><h2 id="place-practice-title">{title}</h2><p>{brief}</p></div>
        <button type="button" onClick={onExit} aria-label="Close place practice"><Icon name="close"/></button>
      </header>
      {!showQuiz ? <AnimalCare care={care} onFeed={onFeed} onPractice={() => setShowQuiz(true)}/>
        : question ? <PracticeStep key={index} question={question} index={index} count={questions.length} tier={tier} onNext={() => setIndex(index + 1)}/>
        : <div className="practice-complete">
          <Icon name="check" size={32}/><h3>{assignment ? 'Mission complete' : 'All three solved!'}</h3>
          <p>{result}</p>
          <button type="button" className="practice-primary" onClick={onComplete}>{nextAction}</button>
        </div>}
    </section>
  </div>;
}

function AnimalCare({ care, onFeed, onPractice }: { care: PetCare; onFeed: Props['onFeed']; onPractice: () => void }) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  return <>
    <h3>Your animal care</h3>
    <p className="care-explanation">Food and care help your animals grow. They become hungry after 6 hours and weak after 12 hours. Even a very weak animal can recover with care. Meals are spaced at least one minute apart in this game.</p>
    <div className="pet-care-list">{(Object.keys(PETS) as PetId[]).map(id => {
      const status = petStatus(care, id, now);
      return <article key={id}>
        <div>
          <strong>{PETS[id].name}</strong><span>{status.stage} · {status.state} · {status.meals} meals</span>
          <progress max={100} value={status.health} aria-label={`${PETS[id].name} health`}/>
          <small>{status.health}/100 health</small>
        </div>
        <button type="button" aria-label={`Earn food for ${PETS[id].name.toLowerCase()}`}
          disabled={status.nextMealIn > 0} onClick={() => onFeed(id)}>
          {status.nextMealIn > 0 ? `Next meal ${Math.ceil(status.nextMealIn / 1000)} s` : 'Earn food'}
        </button>
      </article>;
    })}</div>
    <button type="button" className="practice-primary" onClick={onPractice}>Practise animal vocabulary</button>
  </>;
}

function PracticeStep({ question, index, count, tier, onNext }: {
  question: PlaceQuestion; index: number; count: number; tier: EnglishTier; onNext: () => void;
}) {
  const [value, setValue] = useState('');
  const [words, setWords] = useState<number[]>([]);
  const [checked, setChecked] = useState(false);
  const [heard, setHeard] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [audioError, setAudioError] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const audio = useRef<HTMLAudioElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const isSpoken = 'transcript' in question;
  const isTyped = question.kind === 'fill' || question.kind === 'dictation';
  const ready = !isSpoken || heard || showTranscript;
  const answer = question.kind === 'order' ? words.map(i => question.options[i]).join(' ') : value;
  const correct = checked && (isTyped ? isTypedAnswerCorrect(question, answer) : answer === question.answer);
  const mode = question.kind === 'dictation' ? 'Listen and fill in the blank'
    : question.kind === 'listen' ? 'Listening' : question.kind === 'fill' ? 'Fill in the blank' : null;

  useEffect(() => {
    const player = audio.current;
    if (index > 0) heading.current?.focus({ preventScroll: true });
    return () => player?.pause();
  }, [index]);

  function playAudio() {
    const player = audio.current;
    if (!player) return;
    if (!player.paused) { player.pause(); return; }
    if (player.error) player.load();
    player.currentTime = 0;
    setAudioError(false);
    void player.play().catch(error => {
      if (error.name !== 'AbortError') setAudioError(true);
    });
  }

  function checkTyped(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (ready && value.trim() && !correct) setChecked(true);
  }

  return <>
    <div className="practice-meta">Challenge {index + 1} of {count} · {tier} · No time limit</div>
    {mode && <p className="practice-mode">{mode}</p>}
    <h3 tabIndex={-1} ref={heading}>{question.prompt}</h3>
    {isSpoken && <div className="practice-listen">
      <audio ref={audio} preload="none" src={missionAudioPath(question.id)}
        onPlaying={() => { setHeard(true); setPlaying(true); }}
        onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)}
        onError={() => { setPlaying(false); setAudioError(true); }}/>
      <div className="practice-listen-actions">
        <button type="button" className="practice-audio-button" onClick={playAudio}>
          <Icon name="sound" size={17}/> {playing ? 'Pause audio' : heard ? 'Listen again' : 'Listen'}
        </button>
        <button type="button" aria-expanded={showTranscript} onClick={() => {
          if (!showTranscript) setHeard(true);
          setShowTranscript(!showTranscript);
        }}>{showTranscript ? 'Hide transcript' : 'Read transcript'}</button>
      </div>
      {audioError && <p role="status">Audio couldn’t play. Try again or read the transcript to continue.</p>}
      {showTranscript && <blockquote>{question.transcript}</blockquote>}
      {!ready && !audioError && <p>Play the recording or read the transcript before answering.</p>}
    </div>}
    {isTyped ? <form className="practice-fill" onSubmit={checkTyped}>
      <label htmlFor="practice-missing-word">Missing word</label>
      <input id="practice-missing-word" type="text" value={value} disabled={!ready} readOnly={correct} maxLength={64}
        autoComplete="off" autoCorrect="off" autoCapitalize="none" spellCheck={false} enterKeyHint="done"
        onChange={event => { setValue(event.target.value); setChecked(false); }}/>
      <button type="submit" className="practice-primary" disabled={!ready || !value.trim() || correct}>Check answer</button>
    </form> : question.kind === 'order' ? <>
      <div className="practice-sentence" aria-live="polite">{words.length ? answer : 'Tap the words in the correct order.'}</div>
      <div className="practice-word-bank">{question.options.map((word, i) => <button key={i} type="button"
        disabled={words.includes(i) || correct} onClick={() => { setChecked(false); setWords([...words, i]); }}>{word}</button>)}</div>
      <button type="button" onClick={() => { setWords([]); setChecked(false); }}>Reset words</button>
      <button type="button" className="practice-primary" disabled={words.length !== question.options.length} onClick={() => setChecked(true)}>Check sentence</button>
    </> : <div className="practice-choices">{question.options.map(option => <button key={option} type="button"
      aria-pressed={value === option} className={(isSpoken ? correct : checked) && option === question.answer ? 'correct' : ''}
      disabled={!ready || correct} onClick={() => { setValue(option); setChecked(true); }}>{option}</button>)}</div>}
    {checked && <div className="practice-feedback" role="status">
      <strong>{correct ? 'Correct!' : 'Try again'}</strong>
      <p>{correct || (!isSpoken && !isTyped) ? question.explanation
        : isSpoken ? 'Listen again and check the detail in the question.' : 'Check your spelling and the words around the blank.'}</p>
    </div>}
    {correct && <button type="button" className="practice-primary" onClick={onNext}>Next <Icon name="arrow" size={16}/></button>}
  </>;
}
