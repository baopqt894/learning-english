"use client";
import {useEffect,useRef,useState} from 'react';
import {Icon} from './icon';
import type {DistrictFrame} from '@/lib/campus-districts-layout';
export function DistrictPrompt({frame,onHold}:{frame:DistrictFrame;onHold:(hold:boolean)=>void}){
  const button=useRef<HTMLButtonElement>(null),[voiceStatus,setVoiceStatus]=useState('');
  const listen=()=>{if(!('speechSynthesis' in window)){setVoiceStatus('Audio is unavailable. Read the sentence above.');return;}speechSynthesis.cancel();const line=new SpeechSynthesisUtterance(frame.sentence);line.lang='en-US';line.rate=.85;line.onerror=()=>setVoiceStatus('Audio is unavailable. Read the sentence above.');speechSynthesis.speak(line);};
  useEffect(()=>()=>{onHold(false);if('speechSynthesis' in window)speechSynthesis.cancel();},[onHold]);
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
