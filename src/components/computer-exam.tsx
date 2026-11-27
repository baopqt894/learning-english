'use client';
import { useEffect, useRef, useState } from 'react';
import { examAnswerMatches, type ExamItem } from '@/lib/computer-exam';
import type { EnglishTier } from '@/lib/cadet-tiers';
import { useStudent } from './student-support';
import { Icon } from './icon';
import './place-practice.css';

export function ComputerExam({station, tier, items, best, onFinish, onClose}:{
  station:string; tier:EnglishTier; items:ExamItem[]; best?:number; onFinish:(correct:number)=>void; onClose:()=>void;
}) {
  const {t} = useStudent();
  const [answers,setAnswers] = useState<string[]>([]);
  const [draft,setDraft] = useState('');
  const heading = useRef<HTMLHeadingElement>(null);
  const submitted = useRef(-1);
  const step = answers.length, item = items[step];
  const score = answers.filter((answer,i)=>examAnswerMatches(items[i],answer)).length;
  useEffect(()=>{ heading.current?.focus({preventScroll:true}); },[step]);
  return <div className="practice-backdrop"><section className="practice-modal" role="dialog" aria-modal="true" aria-labelledby="exam-title">
    <header><div><h2 id="exam-title">{t('Computer lab test')}</h2>
      <div className="practice-header-progress"><span>{station} · {tier}</span>
        {item && <><span>{t('Question')} {step+1}/{items.length}</span><progress value={step} max={items.length} aria-label={t('Questions answered')}/></>}
      </div></div><button onClick={onClose} aria-label={t('Close')}><Icon name="close"/></button></header>
    {item ? <form onSubmit={event=>{
      event.preventDefault();
      if (!draft.trim() || submitted.current===step) return;
      submitted.current=step;
      const answer=draft.trim();
      setAnswers([...answers,answer]); setDraft('');
      if(step+1===items.length) onFinish(score+Number(examAnswerMatches(item,answer)));
    }}>
      {step===0 && best!==undefined && <p>{t('Personal best')} · {best}/{items.length} ({tier})</p>}
      <p className="practice-mode">{t(item.options?'Choose one answer':'Fill in the blank')}</p>
      <h3 ref={heading} tabIndex={-1} lang="en">{item.prompt}</h3>
      {item.options ? <div className="practice-choices">{item.options.map((option,i)=>
        <button type="button" lang="en" key={option} aria-pressed={draft===option} onClick={()=>setDraft(option)}>
          <span className="answer-key" aria-hidden="true">{String.fromCharCode(65+i)}</span>{option}</button>)}</div>
        : <div className="practice-fill"><label htmlFor="exam-word">{t('Missing word')}</label>
          <input id="exam-word" value={draft} onChange={e=>setDraft(e.target.value)} autoComplete="off" autoCorrect="off" autoCapitalize="none" spellCheck={false} maxLength={64}/></div>}
      <button className="practice-primary" type="submit" disabled={!draft.trim()}>{t(step+1===items.length?'Submit test':'Next')} <Icon name="arrow" size={16}/></button>
    </form> : <>
      <h3 ref={heading} tabIndex={-1}>{t('Test result')} · {score}/{items.length}</h3>
      <p>{t('Personal best')} · {Math.max(best??0,score)}/{items.length} ({tier})</p>
      <details><summary>{t('Review answers')}</summary><ol>{items.map((q,i)=><li key={q.prompt}>
        <p lang="en"><strong>{q.prompt}</strong></p><p>{t('Your answer')} · {answers[i]}</p>
        {!examAnswerMatches(q,answers[i]) && <p>{t('Correct answer')} · <strong lang="en">{q.answer}</strong></p>}
        <p lang="en">{q.explanation}</p></li>)}</ol></details>
      <button className="practice-primary" onClick={onClose}>{t('Back to classroom')}</button>
    </>}
  </section></div>;
}
