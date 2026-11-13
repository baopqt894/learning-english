'use client';
import {useEffect,useRef,useState} from 'react';
import {SWIM_DISTANCE,SWIM_RACERS,SWIM_QUESTION_SECONDS,startSwimRace,swimClock,swimQuestion,swimQuestionAt,swimQuestionOpenedAt,swimFeedback,swimStandings,advanceSwimRace,answerSwimRace,pauseSwimRace,resumeSwimRace,type SwimRaceState} from '@/lib/swim-race';
import {Icon} from './icon';
import './swim-race.css';

export function SwimRace({onState,onExit}:{onState:(s:SwimRaceState|null)=>void;onExit:()=>void}){
 const [state,setState]=useState<SwimRaceState|null>(null),[now,setNow]=useState(0);
 const root=useRef<HTMLElement>(null),title=useRef<HTMLHeadingElement>(null);
 useEffect(()=>{title.current?.focus();},[]);
 useEffect(()=>{onState(state);},[state,onState]);
 useEffect(()=>{
  const tick=window.setInterval(()=>{const t=performance.now();setNow(t);setState(s=>s?advanceSwimRace(s,t):s);},80);
  const hide=()=>{if(document.hidden)setState(s=>s?pauseSwimRace(s,performance.now()):s);};
  document.addEventListener('visibilitychange',hide);
  return()=>{window.clearInterval(tick);document.removeEventListener('visibilitychange',hide);};
 },[]);
 useEffect(()=>{
  const key=(e:KeyboardEvent)=>{
   if(e.key==='Escape'){e.preventDefault();if(state&&state.finishedAt===null)setState(s=>s?(s.pausedAt===null?pauseSwimRace(s,performance.now()):resumeSwimRace(s,performance.now())):s);else onExit();}
   if(!e.repeat&&/^[1-4]$/.test(e.key)&&state){e.preventDefault();setState(s=>s?answerSwimRace(s,Number(e.key)-1,performance.now()):s);}
   if(e.key==='Tab'){
    const items=Array.from(root.current?.querySelectorAll<HTMLElement>('button:not([disabled]), summary, [tabindex="0"]')||[]).filter(el=>el.getClientRects().length);
    const first=items[0],last=items.at(-1);if(e.shiftKey&&(document.activeElement===first||document.activeElement===title.current)){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}
   }
  };document.addEventListener('keydown',key);return()=>document.removeEventListener('keydown',key);
 },[state,onExit]);
 const start=()=>{const t=performance.now();setNow(t);setState(startSwimRace(t));};
 const time=state?Math.max(0,state.finishedAt??swimClock(state,now)):0;
 const countdown=state&&swimClock(state,now)<0;
 const feedback=state?swimFeedback(state,time):null;
 const question=state?(feedback?swimQuestionAt(state,state.answers.length-1):swimQuestion(state)):null;
 const standings=state?swimStandings(state,time):[];
 const remaining=state?Math.max(0,SWIM_QUESTION_SECONDS-(time-swimQuestionOpenedAt(state))):12;
 const finished=state?.finishedAt!==null&&!!state,paused=state?.pausedAt!==null&&!!state;
 const rank=standings.findIndex(r=>r.index===0)+1;
 useEffect(()=>{root.current?.querySelector('.swim-panel')?.scrollTo({top:0});},[state?.answers.length,finished,paused]);
 return <section ref={root} className="swim-race" lang="en" role="dialog" aria-modal="true" aria-labelledby="swim-title">
  <header className="swim-header"><div><h2 ref={title} tabIndex={-1} id="swim-title">Swim &amp; solve</h2><p>25 m · English sprint</p></div><div className="swim-header-actions">{state&&!finished&&<button onClick={()=>setState(s=>s?(paused?resumeSwimRace(s,performance.now()):pauseSwimRace(s,performance.now())):s)}>{paused?'Resume':'Pause'}</button>}<button onClick={onExit} aria-label="Leave swimming race"><Icon name="close" size={18}/></button></div></header>
  {state&&<ol className="swim-standings" aria-label="Live race positions">{standings.map((r,i)=><li key={r.index} style={{'--swim-color':r.color} as React.CSSProperties}><span>{i+1}</span><strong>{r.name}</strong><small>{r.metres.toFixed(1)} m</small></li>)}</ol>}
  {countdown&&!paused&&<div className="swim-countdown" aria-live="polite">{Math.ceil(-swimClock(state!,now))}<small>Get ready</small></div>}
  {!state?<div className="swim-panel swim-brief"><h3>Think fast. Swim faster.</h3><p>Race Minh, Linh and An, three computer-controlled teammates, in the campus pool.</p><ol><li>Choose the missing word or answer the English question.</li><li>A correct answer gives you a speed boost. Faster answers give stronger boosts.</li><li>A wrong answer adds no boost. Read the explanation and try the next question.</li></ol><p className="swim-help">12 seconds per question · Keys 1–4 or tap an answer · Pause any time</p><button className="swim-primary" onClick={start}>Start the 25 m race <Icon name="arrow" size={17}/></button></div>:
   finished?<div className="swim-panel swim-results"><h3>{rank===1?'First to the wall!':'Race complete!'}</h3><p>You finished {rank===1?'1st':rank===2?'2nd':rank===3?'3rd':'4th'} in <strong>{state.finishedAt!.toFixed(1)} seconds</strong>, with {state.answers.filter(a=>a.correct).length}/{state.answers.length} correct answers.</p><ol className="swim-finish-list">{[...standings].sort((a,b)=>a.finishTime-b.finishTime).map((r,i)=><li key={r.index}><span>{i+1}. {r.name}</span><strong>{r.finishTime.toFixed(1)} s</strong></li>)}</ol><details><summary>Review your English ({state.answers.filter(a=>!a.correct).length} to practise)</summary>{state.answers.map((a,i)=>{const q=swimQuestionAt(state,i);return <article key={i}><strong>{a.correct?'Correct':'Practise'} · {q.sentence}</strong><p>{a.choice===null?'Time ran out.':`Your answer: ${q.choices[a.choice]}.`} Correct: <b>{q.choices[q.answer]}</b>.</p><small>{q.explanation}</small></article>;})}</details><div className="swim-result-actions"><button className="swim-primary" onClick={start}>Race again</button><button onClick={onExit}>Back to campus</button></div></div>:
   paused?<div className="swim-panel swim-paused"><h3>Race paused</h3><p>All four swimmers and the question timer are paused.</p>{question&&<p><strong>{question.sentence}</strong></p>}{feedback&&<p>{question?.explanation}</p>}<button className="swim-primary" onClick={()=>setState(s=>s?resumeSwimRace(s,performance.now()):s)}>Resume race</button></div>:
   <div className="swim-panel swim-question"><div className="swim-question-meta"><span>Question {state.answers.length+(feedback?0:1)} · {time.toFixed(1)} s elapsed</span><strong>{countdown?'Ready?':feedback?'Answer checked':`${Math.ceil(remaining)} s to answer`}</strong></div><progress max={12} value={countdown||feedback?12:remaining} aria-label="Time remaining for this question"/><h3>{question?.sentence}</h3><div className="swim-choices">{question?.choices.map((choice,i)=><button key={`${question.id}-${i}`} disabled={!!feedback||!!countdown} className={feedback?(i===question.answer?'is-correct':i===feedback.choice?'is-wrong':''):''} onClick={()=>setState(s=>s?answerSwimRace(s,i,performance.now()):s)}><kbd>{i+1}</kbd>{choice}</button>)}</div><div className={`swim-feedback ${feedback?.correct?'is-correct':''}`} aria-live="polite">{feedback?<><strong>{feedback.correct?`Correct! +${feedback.boost.toFixed(1)} m boost` : feedback.choice===null?'Time’s up — keep going!':'No boost this time.'}</strong><p>{question?.explanation}</p></>:<p>{countdown?'The question timer starts when the countdown ends.':'Correct + quick = a stronger burst of speed.'}</p>}</div></div>}
  <div className="swim-lane-key" aria-label="Swimmer cap colours">{SWIM_RACERS.map(r=><span key={r.name}><i style={{background:r.color}}/>{r.name}</span>)}<span>{SWIM_DISTANCE} m to the finish</span></div>
 </section>;
}
