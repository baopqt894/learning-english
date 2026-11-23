'use client';
import { useStudent } from './student-support';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { PLACE_PRACTICE, type PlaceQuestion } from '@/lib/place-practice';
import { LEVEL_MISSIONS, type EnglishTier, type LevelMissionId } from '@/lib/cadet-tiers';
import { RESIDENT_MISSIONS, type ResidentKind } from '@/lib/resident-missions';
import { isTypedAnswerCorrect, missionAudioPath } from '@/lib/mission-exercises';
import { PETS, petStatus, type PetCare, type PetId } from '@/lib/pet-care';
import { Icon } from './icon';
import { PAVILION_READINGS } from '@/lib/pavilion-reading';
import { SpeechRepeat } from './speech-repeat';
import { matchesSpokenAnswer } from '@/lib/speaking-answer';
import './place-practice.css';

type Props = {
  area: string;
  feeding?: PetId;
  care: PetCare;
  purpose?: 'work' | 'rescue' | 'reading';
  mission?: LevelMissionId;
  resident?: ResidentKind;
  tier: EnglishTier;
  questions: PlaceQuestion[];
  onFeed: (id: PetId) => void;
  onComplete: () => void;
  onExit: () => void;
};

export function PlacePractice({ area, feeding, care, purpose, mission, resident, tier, questions, onFeed, onComplete, onExit }: Props) {
  const { t } = useStudent();
  const [index, setIndex] = useState(0);
  const [showQuiz, setShowQuiz] = useState(!!feeding || !!mission || area !== 'livestock');
  const panel = useRef<HTMLElement>(null);
  const question = questions[index];
  const lesson = PLACE_PRACTICE[area] ?? PLACE_PRACTICE.courtyard;
  const assignment = mission ? LEVEL_MISSIONS[mission] : null;
  const residentMission = resident ? RESIDENT_MISSIONS[resident] : null;
  const passage = purpose === 'reading' ? PAVILION_READINGS[tier] : null;
  const title = passage ? 'Reading pavilion' : feeding ? `Earn food for your ${PETS[feeding].name.toLowerCase()}` : residentMission?.title ?? assignment?.title ?? lesson.title;
  const brief = residentMission?.summary ?? assignment?.brief ?? (feeding ? 'Answer all three questions, then feed directly in 3D.'
    : purpose === 'work' ? 'Pass the English quiz to start the 3D assignment.'
    : purpose === 'rescue' ? 'Pass the safety quiz to unlock the rescue throw.'
    : 'Practise English for this part of the school.');
  const nextAction = residentMission ? 'Finish assignment' : assignment ? 'Finish mission' : feeding ? 'Collect food and go to pen'
    : purpose === 'work' ? 'Start 3D assignment' : purpose === 'rescue' ? 'Unlock rescue throw' : 'Continue exploring';
  const result = residentMission ? 'Return to the person who gave you this assignment to report in English.' : assignment ? 'You completed the English exercises for this assignment.'
    : feeding ? 'Your food portion is ready. Walk to the highlighted feeding point and hold E to feed your animals.'
    : purpose === 'work' ? 'Your assignment is ready. Follow the instructions at the work site.'
    : purpose === 'rescue' ? 'Walk to the marked point on the dry deck to throw the ring.'
    : passage ? 'You finished the reading. Come back to the table for another round.'
    : 'Well done. Use these words while exploring this area.';

  useEffect(() => { panel.current?.scrollTo(0, 0); }, [index, showQuiz]);

  return <div className="practice-backdrop">
    <section ref={panel} className="practice-modal" role="dialog" aria-modal="true" aria-labelledby="place-practice-title">
      <header>
        <div><h2 id="place-practice-title">{t(title)}</h2>
          {question && showQuiz ? <div className="practice-header-progress">
            <span>{t("Question")} {index + 1} {t("of")} {questions.length}</span>
            <progress value={index} max={questions.length} aria-label={t("Questions answered")}/>
          </div> : <p>{t(brief)}</p>}
        </div>
        <button type="button" onClick={onExit} aria-label="Close place practice"><Icon name="close"/></button>
      </header>
      {passage && question && <article className="reading-passage">
        <h3>{passage.title}</h3><p>{passage.text}</p>
      </article>}
      {!showQuiz ? <AnimalCare care={care} onFeed={onFeed} onPractice={() => setShowQuiz(true)}/>
        : question ? <PracticeStep key={index} question={question} index={index} tier={tier} onNext={() => setIndex(index + 1)}/>
        : <div className="practice-complete">
          <Icon name="check" size={32}/><h3>{residentMission ? t('Ready to report') : assignment ? t('Mission complete') : t('All three solved!')}</h3>
          <p>{t(result)}</p>
          <button type="button" className="practice-primary" onClick={onComplete}>{t(nextAction)}</button>
        </div>}
    </section>
  </div>;
}

function AnimalCare({ care, onFeed, onPractice }: { care: PetCare; onFeed: Props['onFeed']; onPractice: () => void }) {
  const { t } = useStudent();
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  return <>
    <h3>{t("Your animal care")}</h3>
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
          {status.nextMealIn > 0 ? `Next meal ${Math.ceil(status.nextMealIn / 1000)} s` : t('Earn food')}
        </button>
      </article>;
    })}</div>
    <button type="button" className="practice-primary" onClick={onPractice}>{t("Practise animal vocabulary")}</button>
  </>;
}

function PracticeStep({ question, index, tier, onNext }: {
  question: PlaceQuestion; index: number; tier: EnglishTier; onNext: () => void;
}) {
  const { t, settings } = useStudent();
  const [value, setValue] = useState('');
  const [words, setWords] = useState<number[]>([]);
  const [checked, setChecked] = useState(false);
  const [heard, setHeard] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [audioError, setAudioError] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [micInUse, setMicInUse] = useState(false);
  const audio = useRef<HTMLAudioElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const isSpoken = 'transcript' in question;
  const isRepeat = question.kind === 'repeat';
  const isTyped = question.kind === 'fill' || question.kind === 'dictation';
  const ready = !isSpoken || heard || showTranscript;
  const answer = question.kind === 'order' ? words.map(i => question.options[i]).join(' ') : value;
  const correct = checked && (isRepeat ? matchesSpokenAnswer(question.answer, answer)
    : isTyped ? isTypedAnswerCorrect(question, answer) : answer === question.answer);
  const mode = isRepeat ? 'Listen and repeat' : question.kind === 'dictation' ? 'Listen and fill in the blank'
    : question.kind === 'listen' ? 'Listening' : question.kind === 'fill' ? 'Fill in the blank' : question.kind === 'order' ? 'Build a sentence' : 'Choose one answer';

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
    player.playbackRate = settings.pace === 'slow' ? .82 : 1;
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
    <p className="practice-mode">{mode} · {tier}</p>
    <h3 tabIndex={-1} ref={heading}>{question.prompt}</h3>
    {isSpoken && <div className="practice-listen">
      <audio ref={audio} preload="none" src={missionAudioPath(question.id)}
        onPlaying={() => { setHeard(true); setPlaying(true); }}
        onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)}
        onError={() => { setPlaying(false); setAudioError(true); }}/>
      <div className="practice-listen-actions">
        <button type="button" className={isRepeat && ready && !playing ? 'practice-secondary-audio' : 'practice-audio-button'} disabled={micInUse} onClick={playAudio}>
          <Icon name="sound" size={17}/> {playing ? t('Pause audio') : heard ? t('Listen again') : t('Listen')}
        </button>
        <button type="button" className="practice-text-action" aria-expanded={showTranscript} onClick={() => {
          if (!showTranscript) setHeard(true);
          setShowTranscript(!showTranscript);
        }}>{showTranscript ? t('Hide transcript') : t('Read transcript')}</button>
      </div>
      {audioError && <p role="status">{t("Audio couldn’t play. Try again or read the transcript to continue.")}</p>}
      {showTranscript && <blockquote>{question.transcript}</blockquote>}
      {!ready && !audioError && <p>{t("Play the recording or read the transcript before answering.")}</p>}
    </div>}
    {isRepeat ? <SpeechRepeat expected={question.answer} ready={ready} playback={playing} passed={correct}
      onAnswer={text => { setValue(text); setChecked(true); }} onMicrophone={setMicInUse}/>
      : isTyped ? <form className="practice-fill" onSubmit={checkTyped}>
      <label htmlFor="practice-missing-word">{t("Missing word")}</label>
      <input id="practice-missing-word" type="text" value={value} disabled={!ready} readOnly={correct} maxLength={64}
        autoComplete="off" autoCorrect="off" autoCapitalize="none" spellCheck={false} enterKeyHint="done"
        onChange={event => { setValue(event.target.value); setChecked(false); }}/>
      <button type="submit" className="practice-primary" disabled={!ready || !value.trim() || correct}>{t("Check answer")}</button>
    </form> : question.kind === 'order' ? <>
      <div className="practice-sentence" aria-live="polite">{words.length ? answer : 'Tap the words in the correct order.'}</div>
      <div className="practice-word-bank">{question.options.map((word, i) => <button key={i} type="button"
        disabled={words.includes(i) || correct} onClick={() => { setChecked(false); setWords([...words, i]); }}>{word}</button>)}</div>
      <button type="button" disabled={correct} onClick={() => { setWords([]); setChecked(false); }}>{t("Reset words")}</button>
      <button type="button" className="practice-primary" disabled={correct || words.length !== question.options.length} onClick={() => setChecked(true)}>{t("Check sentence")}</button>
    </> : 'options' in question && <>
      <div className="practice-choices">{question.options.map((option, i) =>
        <button key={option} type="button" aria-pressed={value === option}
          data-result={checked && value === option ? (correct ? 'correct' : 'retry') : undefined}
          disabled={!ready || correct} onClick={() => { setValue(option); setChecked(false); }}>
          <span className="answer-key" aria-hidden="true">{String.fromCharCode(65 + i)}</span>{option}
        </button>)}</div>
      {!correct && <button type="button" className="practice-primary" disabled={!ready || !value || checked}
        onClick={() => setChecked(true)}>{t("Check answer")}</button>}
    </>}
    {checked && <div className="practice-feedback" data-correct={correct} role="status">
      <strong>{correct ? t('Correct!') : t('Try again')}</strong>
      <p>{correct ? question.explanation : isRepeat ? t('Listen again and repeat the whole message in order.')
        : isSpoken ? t('Listen again for the detail in the question.') : isTyped ? t('Check your spelling and the words around the blank.')
        : question.kind === 'order' ? t('Reset the words and try a different order.') : t('Read the question again and choose another answer.')}</p>
    </div>}
    {correct && <button type="button" className="practice-primary" onClick={onNext}>{t("Next")} <Icon name="arrow" size={16}/></button>}
  </>;
}
