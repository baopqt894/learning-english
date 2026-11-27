'use client';
import {useEffect,useRef,useState} from 'react';
import {listeningBank,roundScore,wordScore,type LabRecord,type LabReply,type ListeningLine} from '@/lib/listening-lab';
import {missionAudioPath} from '@/lib/mission-exercises';
import {SpeechRepeat} from './speech-repeat';
import {useStudent} from './student-support';
import {Icon} from './icon';

function Review({record}:{record:LabRecord}){
  const {t}=useStudent();
  const spoken=record.replies.every(r=>r.mode==='mic');
  return <article>
    <h3>{t(spoken?'Speaking result':'Practice result')} · {roundScore(record.replies)}/100</h3>
    <p>{t('Score measures how closely the words match the recording.')}</p>
    {record.best!==undefined && <p>{t('Best spoken score')} · {record.best}/100</p>}
    <ol>{record.replies.map(r=>{
      const q=listeningBank.find(line=>line.id===r.id)!;
      return <li key={r.id}><strong lang="en">{q.line}</strong><p>{t(r.mode==='mic'?'Heard':'Written response')} · {r.text} · {wordScore(q.line,r.text)}/100</p>
        <audio controls preload="none" aria-label={t('Listen again')} src={missionAudioPath(q.id)} /></li>;
    })}</ol>
  </article>;
}

function RepeatLine({item,next,last}:{item:ListeningLine;next:(reply:LabReply)=>void;last:boolean}){
  const {t,settings}=useStudent();
  const audio=useRef<HTMLAudioElement>(null);
  const [ready,setReady]=useState(false), [playing,setPlaying]=useState(false), [mic,setMic]=useState(false);
  const [error,setError]=useState(false), [reply,setReply]=useState<LabReply|null>(null);
  useEffect(()=>{const player=audio.current;return ()=>player?.pause();},[]);
  return <>
    <p>{t('Listen to the whole sentence, then say it into your microphone.')}</p>
    <audio ref={audio} src={missionAudioPath(item.id)} preload="auto" onPlaying={()=>{setError(false);setPlaying(true);}}
      onPause={()=>setPlaying(false)} onEnded={()=>{setPlaying(false);setReady(true);}} onError={()=>{setPlaying(false);setError(true);}}/>
    <button type="button" className="practice-audio-button" disabled={mic} onClick={()=>{
      const player=audio.current;if(!player)return;
      if(playing){player.pause();return;}
      if(player.error)player.load(); if(player.ended)player.currentTime=0;
      player.playbackRate=settings.pace==='slow'?.84:1;
      void player.play().catch(()=>setError(true));
    }}><Icon name="sound" size={16}/> {t(playing?'Pause audio':ready?'Listen again':'Listen')}</button>
    {error && <p role="status">{t('Audio couldn’t play. Try again or read the transcript to continue.')} <button onClick={()=>setReady(true)}>{t('Read transcript')}</button>{ready && <span lang="en">{item.line}</span>}</p>}
    <SpeechRepeat expected={item.line} ready={ready} playback={playing} passed={false} onMicrophone={setMic}
      onAnswer={(text,mode)=>setReply({id:item.id,text,mode})}/>
    {reply?.mode==='typed' && <p className="practice-heard" role="status">{t('Written response')} · <span lang="en">{reply.text}</span></p>}
    <button type="button" className="practice-primary" disabled={!reply || mic || playing}
      onClick={()=>reply&&next(reply)}>{t(last?'Submit test':'Next')}</button>
  </>;
}

export function ListeningLab({station,items,previous,onFinish,onExit}:{station:string;items:ListeningLine[];previous?:LabRecord;
  onFinish:(record:LabRecord)=>void;onExit:()=>void}){
  const {t}=useStudent(), tier=items[0].tier;
  const [replies,setReplies]=useState<LabReply[]>([]),[result,setResult]=useState<LabRecord|null>(null);
  const [review,setReview]=useState(false);
  const current=items[replies.length];
  return <div className="practice-backdrop language-backdrop"><section role="dialog" aria-modal="true" aria-labelledby="listening-title" className="practice-modal language-session">
    <header><div><h2 id="listening-title">{t('Headset practice')}</h2><div className="practice-header-progress">{station} · {tier}
      {!review && current && <><span>{t('Sentence')} {replies.length+1}/{items.length}</span><progress value={replies.length} max={items.length}/></>}
    </div></div><button aria-label={t('Close')} onClick={onExit}><Icon name="close"/></button></header>
    {review && previous ? <><Review record={previous}/><button onClick={()=>setReview(false)}>{t('Back to practice')}</button></>
      :result ? <><Review record={result}/><button className="practice-primary" onClick={onExit}>{t('Back to classroom')}</button></>
      :<>{previous && !replies.length && <button className="practice-text-action" onClick={()=>setReview(true)}>{t('Review last attempt')}</button>}
      <RepeatLine key={current.id} item={current} last={replies.length+1===items.length} next={reply=>{
        const answers=[...replies,reply]; setReplies(answers);
        if(answers.length===items.length){
          const best=answers.every(r=>r.mode==='mic')?Math.max(previous?.best??0,roundScore(answers)):previous?.best;
          const record={tier,replies:answers,best}; setResult(record);onFinish(record);
        }
      }}/></>}
  </section></div>;
}
