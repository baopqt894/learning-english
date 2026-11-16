"use client";
import {useEffect,useRef,useState} from 'react';
import {Icon} from './icon';
import type {DistrictFrame} from '@/lib/campus-districts-layout';
import { BALANCE_ANSWER_MS } from '@/lib/balance-challenge';

function BalancePrompt({frame,onStart,onAnswer,onCancel}:{frame:DistrictFrame;onStart:()=>void;onAnswer:(answer:string)=>void;onCancel:()=>void}) {
  const run = frame.balance?.run;
  const stage = run?.stage;
  const question = run?.questions[run.index];
  const active = stage?.kind === 'quiz' || stage?.kind === 'walk' || stage?.kind === 'fall';
  const heading = useRef<HTMLParagraphElement>(null);
  const questionIndex = stage?.kind === 'quiz' ? run!.index : -1;
  useEffect(() => { if (questionIndex >= 0) heading.current?.focus(); }, [questionIndex]);
  return <aside className="district-prompt balance-prompt" lang="en" aria-label={frame.title}>
    <div className="district-prompt-heading">
      <strong>{frame.title}</strong>
      {active && <button className="balance-close" type="button" aria-label="Leave balance challenge" onClick={onCancel}><Icon name="close" size={18}/></button>}
    </div>
    {stage?.kind === 'quiz' && question ? <>
      <div className="balance-quiz-meta"><span>Question {run!.index + 1} / {run!.questions.length}</span><strong>{frame.balance!.remaining}s</strong></div>
      <progress className="balance-timer" aria-label="Time remaining" max={BALANCE_ANSWER_MS / 1000} value={frame.balance!.remaining}/>
      <p className="balance-question" tabIndex={-1} ref={heading}>{question.prompt}</p>
      <div className="balance-choices">
        {question.choices.map((choice,i) => <button type="button" key={choice} onClick={()=>onAnswer(choice)}><kbd>{i+1}</kbd>{choice}</button>)}
      </div>
    </> : stage?.kind === 'walk' ? <p role="status">{run!.index ? 'Correct. Keep your balance!' : 'Stepping onto the beam…'}</p>
      : stage?.kind === 'fall' ? <p role="status">{stage.reason === 'timeout' ? 'Time’s up!' : 'Wrong answer.'} You lost your balance.</p>
      : <>
        <p role={stage?.kind === 'failed' || stage?.kind === 'done' ? 'status' : undefined}>
          {stage?.kind === 'failed' && question ? `${stage.reason === 'timeout' ? 'Time ran out.' : 'You fell off the beam.'} The answer was “${question.answer}”. ${question.explanation}`
            : stage?.kind === 'done' ? frame.instruction : 'Get three English answers right to cross. You have 8 seconds per question. A wrong answer or a timeout makes you fall.'}
        </p>
        <button type="button" className="balance-start" onClick={onStart} onKeyDown={event => {
          if (event.key.toLowerCase() === 'e' && !event.repeat) { event.preventDefault(); onStart(); }
        }}>{stage?.kind === 'done' ? 'Cross again' : stage ? 'Try again' : 'Start balance challenge'}<kbd>E</kbd></button>
      </>}
  </aside>;
}

export function DistrictPrompt({frame,onHold,onAnswer,onCancel}:{frame:DistrictFrame;onHold:(hold:boolean)=>void;onAnswer:(answer:string)=>void;onCancel:()=>void}){
  const button=useRef<HTMLButtonElement>(null),[voiceStatus,setVoiceStatus]=useState('');
  const listen=()=>{if(!('speechSynthesis' in window)){setVoiceStatus('Audio is unavailable. Read the sentence above.');return;}speechSynthesis.cancel();const line=new SpeechSynthesisUtterance(frame.sentence);line.lang='en-US';line.rate=.85;line.onerror=()=>setVoiceStatus('Audio is unavailable. Read the sentence above.');speechSynthesis.speak(line);};
  useEffect(()=>()=>{onHold(false);if('speechSynthesis' in window)speechSynthesis.cancel();},[onHold]);
  if(frame.id==='balance')return <BalancePrompt frame={frame} onStart={()=>onHold(true)} onAnswer={onAnswer} onCancel={onCancel}/>;
  return <aside className="district-prompt" lang="en" aria-label={frame.title}>
    <div className="district-prompt-heading"><strong>{frame.title}</strong><span>{frame.done?'Complete':`${frame.percent}%`}</span></div>
    <p>{frame.instruction}</p>
    <blockquote>{frame.sentence}<button type="button" className="district-listen" onClick={listen} aria-label="Listen to the English sentence"><Icon name="sound" size={14}/> Listen</button></blockquote>
    <button ref={button} type="button" className="district-hold" style={{'--action-progress':`${frame.percent}%`} as React.CSSProperties}
      onPointerDown={e=>{if(e.button!==0)return;e.currentTarget.setPointerCapture(e.pointerId);onHold(true);}}
      onPointerUp={()=>onHold(false)} onPointerCancel={()=>onHold(false)} onLostPointerCapture={()=>onHold(false)} onBlur={()=>onHold(false)}
      onKeyDown={e=>{if([' ','Enter','e','E'].includes(e.key)){e.preventDefault();if(!e.repeat)onHold(true);}}}
      onKeyUp={e=>{if([' ','Enter','e','E'].includes(e.key)){e.preventDefault();onHold(false);}}}>
      {frame.done?'Hold to practise again':frame.busy?frame.verb:`Hold to ${frame.verb.toLowerCase()}`}<kbd>E</kbd>
    </button>
    <small aria-live="polite">{voiceStatus||(frame.done?'Practice complete. You can repeat or explore another area.':'Release early to cancel.')}</small>
  </aside>;
}
