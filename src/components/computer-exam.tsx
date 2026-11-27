'use client';
import { useEffect, useRef, useState } from 'react';
import { examAnswerMatches, type ExamItem } from '@/lib/computer-exam';
import type { EnglishTier } from '@/lib/cadet-tiers';
import { englishLine } from '@/lib/student-support';
import type { EquipmentName } from '@/lib/campus-detail-layout';
import { useStudent } from './student-support';
import { Icon } from './icon';
import './place-practice.css';

export function ComputerExam({station, equipment, onOperate, tier, items, best, onFinish, onClose}:{
  station:string; equipment?:EquipmentName; onOperate?:(value:string)=>void; tier:EnglishTier; items:(ExamItem & {instruction?:string})[]; best?:number; onFinish:(correct:number)=>void; onClose:()=>void;
}) {
  const {t,settings} = useStudent();
  const instrument=useRef<AudioContext|null>(null);
  const [voiceError,setVoiceError]=useState(false);
  useEffect(()=>()=>{
    if(equipment)window.speechSynthesis?.cancel();
    if(instrument.current?.state!=='closed')void instrument.current?.close();
  },[equipment]);
  function operate(value:string){
    setDraft(value);
    if(!equipment)return;
    onOperate?.(value);
    if(equipment!=='Xylophone' && equipment!=='String instruments')return;
    const notes:Record<string,number>={C:261.63,D:293.66,E:329.63};
    const phrase=value.split(' ');
    if(!window.AudioContext)return;
    const ctx=instrument.current??=new AudioContext();
    void ctx.resume().then(()=>{
      if(ctx.state!=='running')return;
      const pitches=equipment==='Xylophone'?phrase.map(n=>notes[n]??0):
        [value==='Silent'?0:value==='Low C'?130.81:value==='High C'?523.25:261.63];
      pitches.forEach((hz,i)=>{
        if(!hz)return;
        const osc=ctx.createOscillator(),gain=ctx.createGain(),start=ctx.currentTime+i*.27;
        const duration=value==='Bow'?.58:value==='Tap'?.13:.27;
        osc.type=equipment==='Xylophone'||value==='Tap'?'sine':'triangle';osc.frequency.value=hz;
        gain.gain.setValueAtTime(.001,start);gain.gain.exponentialRampToValueAtTime(value==='Quiet'?.045:.12,start+(value==='Bow'?.16:.012));
        gain.gain.exponentialRampToValueAtTime(.001,start+duration);
        osc.connect(gain);gain.connect(ctx.destination);osc.onended=()=>{osc.disconnect();gain.disconnect();};osc.start(start);osc.stop(start+duration+.01);
      });
    }).catch(()=>{});
  }
  const [answers,setAnswers] = useState<string[]>([]);
  const [draft,setDraft] = useState('');
  const heading = useRef<HTMLHeadingElement>(null);
  const submitted = useRef(-1);
  const step = answers.length, item = items[step];
  const score = answers.filter((answer,i)=>examAnswerMatches(items[i],answer)).length;
  useEffect(()=>{ heading.current?.focus({preventScroll:true}); },[step]);
  return <div className={equipment?"practice-backdrop equipment-backdrop":"practice-backdrop"}><section className="practice-modal" role="dialog" aria-modal="true" aria-labelledby="exam-title">
    <header><div><h2 id="exam-title">{t(equipment??'Computer lab test')}</h2>
      <div className="practice-header-progress"><span>{equipment?t('Workshop assignment'):station+' · '+tier}</span>
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
      {step===0 && best!==undefined && <p>{t('Personal best')} · {best}/{items.length}{equipment?'':' ('+tier+')'}</p>}
      {item.instruction && <div className="equipment-order"><span>{t('Work order')} {Math.floor(step/2)+1}/2</span>
        <p lang="en">{item.instruction}</p><button type="button" onClick={()=>{
          const synth=window.speechSynthesis;
          if(!synth){setVoiceError(true);return;}
          synth.cancel();setVoiceError(false);const line=englishLine(item.instruction!,settings.pace,settings.voice);
          line.onerror=e=>{if(e.error!=='canceled' && e.error!=='interrupted')setVoiceError(true);};synth.speak(line);
        }}><Icon name="sound" size={15}/>{t('Listen')}</button>
        {voiceError && <small role="status">{t('Audio unavailable')}</small>}</div>}
      <p className="practice-mode">{t(equipment?(item.options?'Operate the equipment':'Complete the handover note'):(item.options?'Choose one answer':'Fill in the blank'))}</p>
      <h3 ref={heading} tabIndex={-1} lang="en">{item.prompt}</h3>
      {item.options ? <div className="practice-choices">{item.options.map((option,i)=>
        <button type="button" lang="en" key={option} aria-pressed={draft===option} onClick={()=>operate(option)}>
          <span className="answer-key" aria-hidden="true">{String.fromCharCode(65+i)}</span>{option}</button>)}</div>
        : <div className="practice-fill"><label htmlFor="exam-word">{t('Missing word')}</label>
          <input id="exam-word" value={draft} onChange={e=>setDraft(e.target.value)} autoComplete="off" autoCorrect="off" autoCapitalize="none" spellCheck={false} maxLength={64}/></div>}
      <button className="practice-primary" type="submit" disabled={!draft.trim()}>{t(step+1===items.length?'Submit test':'Next')} <Icon name="arrow" size={16}/></button>
    </form> : <>
      <h3 ref={heading} tabIndex={-1}>{t('Test result')} · {score}/{items.length}</h3>
      <p>{t('Personal best')} · {Math.max(best??0,score)}/{items.length}{equipment?'':' ('+tier+')'}</p>
      <details><summary>{t('Review answers')}</summary><ol>{items.map((q,i)=><li key={q.prompt}>
        <p lang="en"><strong>{q.prompt}</strong></p><p>{t('Your answer')} · {answers[i]}</p>
        {!examAnswerMatches(q,answers[i]) && <p>{t('Correct answer')} · <strong lang="en">{q.answer}</strong></p>}
        <p lang="en">{q.explanation}</p></li>)}</ol></details>
      <button className="practice-primary" onClick={onClose}>{t('Back to classroom')}</button>
    </>}
  </section></div>;
}
