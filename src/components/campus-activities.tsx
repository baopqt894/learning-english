'use client';
import { useEffect, useRef, useState } from 'react';
import { ACTIVITIES, ACTIVITY_IDS, activityRounds, activityUnlocked, type ActivityAnswer, type ActivityId } from '@/lib/activities';
import { LEVEL_MISSIONS, LEVEL_MISSION_IDS, englishTier, type EnglishTier, type LevelMissionId } from '@/lib/cadet-tiers';
import type { QuizHistory } from '@/lib/browser-quiz-history';
import type { Progress } from '@/lib/game';
import { Icon } from './icon';
import { ResidentMissionIndex } from './resident-mission-index';
import type { ResidentKind } from '@/lib/resident-missions';
import type { ZoneId } from '@/lib/campus-map';

type Props={level:number;quizHistory:QuizHistory;onLevelMission:(id:LevelMissionId)=>void;onWalkToBeam:()=>void;onWalkToResident:(id:ResidentKind)=>void;onStudy:(active:boolean)=>void;onFieldwork:(kind:'garden'|'duty')=>void;inClassroom:boolean;onStudyTravel:()=>void;progress:Progress;saveAvailable:boolean;onClose:()=>void;onTravel:(zone:ZoneId)=>void;onComplete:(id:ActivityId,answers:ActivityAnswer[],tier:EnglishTier)=>void;initial?:ActivityId};
export function CampusActivities({progress,saveAvailable,onClose,onTravel,onComplete,initial,onFieldwork,inClassroom,onStudyTravel,onStudy,level,quizHistory,onLevelMission,onWalkToBeam,onWalkToResident}:Props){
 const panelRef=useRef<HTMLElement>(null);
 const [selected,setSelected]=useState<ActivityId|null>(initial||null);
 const [runTier,setRunTier]=useState<EnglishTier>(()=>englishTier(level));
 const [run,setRun]=useState<ReturnType<typeof activityRounds>|null>(null);
 const [answers,setAnswers]=useState<ActivityAnswer[]>([]);
 const [choice,setChoice]=useState<string|null>(null);
 const [checked,setChecked]=useState(false);
 const [done,setDone]=useState(false);
 const [earned,setEarned]=useState(0);
 const [voiceNotice,setVoiceNotice]=useState('');
 useEffect(()=>{panelRef.current?.scrollTo(0,0);},[selected,run,answers.length,done]);
 const activity=selected?ACTIVITIES[selected]:null;
 const question=run?.[answers.length];
 const score=run?Math.round(answers.filter(a=>run.find(q=>q.id===a.questionId)?.answer===a.answer).length/run.length*100):0;
 function start() {
  if (!selected || !activityUnlocked(selected,progress.activities)) return;
  if (selected !== 'academy') { onFieldwork(selected); return; }
  if (!inClassroom && !run) { onStudyTravel(); return; }
  const tier = englishTier(level), key = `academy/${tier}`;
  const questions = activityRounds(selected, tier, quizHistory.previous(key));
  quizHistory.record(key, questions.map(question => question.id));
  onStudy(true);
  setRunTier(tier);
  setRun(questions);
  setAnswers([]);
  setChoice(null);
  setChecked(false);
  setDone(false);
  setVoiceNotice('');
 }
 function next(){if(!selected||!question||!choice||!run)return;const updated=[...answers,{questionId:question.id,answer:choice}];
  if(updated.length===run.length){const result=Math.round(updated.filter(a=>run.find(q=>q.id===a.questionId)?.answer===a.answer).length/run.length*100);setEarned(result>=ACTIVITIES[selected].pass&&!progress.activities?.[selected]?.passed?ACTIVITIES[selected].xp:0);onComplete(selected,updated,runTier);setDone(true);}
  setAnswers(updated);setChoice(null);setChecked(false);setVoiceNotice('');
 }
 function listen(){if(!question)return;if(!('speechSynthesis' in window)){setVoiceNotice('Audio is unavailable. Read the instruction below.');return;}window.speechSynthesis.cancel();const utterance=new SpeechSynthesisUtterance(question.instruction);utterance.lang='en-US';utterance.rate=.85;utterance.onerror=()=>setVoiceNotice('Audio is unavailable. You can still read and play.');window.speechSynthesis.speak(utterance);}
 function back(){onStudy(false);window.speechSynthesis?.cancel();setSelected(null);setRun(null);setDone(false);}
 return <div className={`modal-backdrop${run&&selected==='academy'?' academy-in-world':''}`}><section ref={panelRef} className={`cadet-activities${selected?'':' cadet-mission-index'}`} role="dialog" aria-modal="true" aria-labelledby="activities-title" lang="en">
  <header className="activities-heading"><div><h2 id="activities-title">{activity?.title||'Cadet activities'}</h2><p>{activity?`${activity.location} · ${activity.minutes}`:`Level ${level} · ${englishTier(level)} English`}</p></div><button className="hud-button" aria-label="Close activities" onClick={onClose}><Icon name="close"/></button></header>
  {!saveAvailable&&<p className="activity-warning" role="status">Progress cannot be saved on this browser. Keep this page open.</p>}
  {!selected ? <>
    <LevelMissionIndex level={level} challenges={progress.challenges} onChoose={onLevelMission}/>
    <ResidentMissionIndex progress={progress} onWalk={onWalkToResident}/>
    <details className="mission-disclosure campus-practice-disclosure">
      <summary><span>Campus practice</span><Icon name="chevron" size={18}/></summary>
      <p>Finish garden and dormitory duty to unlock the classroom challenge.</p>
      <ol className="activity-list">{ACTIVITY_IDS.map(id=>{
        const a=ACTIVITIES[id], record=progress.activities?.[id], unlocked=activityUnlocked(id,progress.activities);
        return <li key={id}>
          <Icon name={a.icon} size={22}/><div><h3>{a.title}</h3><p>{a.location} · +{a.xp} XP once</p>
            {record && <small>Best {record.best}/100</small>}</div>
          <button className="activity-button" disabled={!unlocked} onClick={()=>setSelected(id)}>
            {id!=='academy' ? 'Enter 3D practice' : record?.passed ? 'Replay' : unlocked ? 'Explore' : 'Locked'}
          </button>
        </li>;
      })}</ol>
      <button className="activity-back" onClick={onWalkToBeam}>Walk to balance beam <Icon name="arrow" size={16}/></button>
    </details>
  </> :
  !run?<div className="activity-brief"><button className="activity-back" onClick={back}>← All activities</button><h3>Your assignment</h3><p>{activity!.brief}</p><div className="activity-words"><strong>Useful English</strong><p>{activity!.pattern}</p><ul>{activity!.words.map(w=><li key={w}>{w}</li>)}</ul></div><p>{selected==='academy'?'Read or listen → answer → learn from feedback.':'Pass a short English quiz → do the work in 3D → report in English.'} {selected==='academy'?'10 questions are drawn from the question bank.':'Work directly in the 3D campus: walk to the objects, equip tools and hold to perform each action. Physical progress is saved after every completed action.'} {selected==='academy'?'Each first answer counts; reach 80/100 to pass.':'Finish the practical actions, then write an English report at the work board.'} There is no time limit.</p>{selected==='academy'&&<details className="activity-words" open><summary>Study before the challenge</summary><ul className="activity-study"><li><strong>Meet &amp; ask:</strong> My name is An. / Could you repeat that, please?</li><li><strong>Find &amp; borrow:</strong> Turn left at the courtyard. / Could I borrow this book, please?</li><li><strong>Check details:</strong> I will return it next Monday. / Do you have another book?</li><li><strong>Buy:</strong> Sandwich 20,000 + water 5,000 = 25,000 dong. Change from 30,000 = 5,000.</li><li><strong>Work together:</strong> Prepare soil → sow seeds → water. Sweep with a broom. Ask: Could you help me carry this basket, please?</li><li><strong>Read the schedule:</strong> Study at 14:00 = study at two in the afternoon.</li></ul></details>}<div className="activity-actions"><button className="activity-button" onClick={start} disabled={!activityUnlocked(selected,progress.activities)}>{selected!=='academy'?'Start English quiz':inClassroom?'Start classroom challenge':'Go to classroom'} <Icon name="arrow" size={17}/></button><button className="activity-back" onClick={()=>onTravel(activity!.zone)}>Visit {activity!.location}</button></div></div>:
  done?<div className="activity-result" role="status"><Icon name={score>=activity!.pass?'trophy':'book'} size={42}/><h3>{score>=activity!.pass?'Assignment complete':'A little more practice'}</h3><p className="activity-score">{score}<span>/100</span></p><p>{score>=activity!.pass?activity!.badge:'You need 80/100. Review the words and try a new attempt.'}</p><p>{earned?`+${earned} XP earned`:'Your best score is saved. Each activity awards XP only once.'}</p><p className="activity-pattern">{activity!.pattern}</p><div className="activity-actions"><button className="activity-button" onClick={start}>Try again</button><button className="activity-back" onClick={back}>All activities</button></div></div>:
  question&&<div className="activity-play"><div className="activity-meter"><span>Step {answers.length+1} of {run.length} · {runTier}</span><span>{answers.filter(a=>run.find(q=>q.id===a.questionId)?.answer===a.answer).length} correct</span></div><progress max={run.length} value={answers.length} aria-label="Activity progress"/>{selected!=='academy'&&<ol className="activity-checklist" aria-label="Assignment steps">{run.map((q,i)=><li key={q.id} aria-current={i===answers.length?'step':undefined} data-complete={i<answers.length}><Icon name={i<answers.length?'check':'target'} size={14}/>{selected==='garden'?['Prepare','Plant','Water','Harvest','Report'][i]:['Sweep','Fold','Organise','Help','Report'][i]}</li>)}</ol>}<div className="activity-instruction"><h3>{question.instruction}</h3><button className="activity-back" onClick={listen}><Icon name="sound" size={17}/> Listen</button></div>{voiceNotice&&<p role="status">{voiceNotice}</p>}<fieldset className="activity-choices" disabled={checked}><legend>Choose the best {selected==='academy'?'answer':'action'}</legend>{question.choices.map(c=><label key={c} data-selected={choice===c} data-correct={checked&&c===question.answer}><input type="radio" name="activity-answer" checked={choice===c} onChange={()=>setChoice(c)}/><span>{c}</span>{checked&&c===question.answer&&<Icon name="check" size={18}/>}</label>)}</fieldset>{checked&&<div className="activity-feedback" role="status"><strong>{choice===question.answer?'Well done!':'Let’s learn from this.'}</strong><p>{question.explanation}</p>{question.word&&<small>{question.word}</small>}</div>}<div className="activity-actions">{!checked?<button className="activity-button" disabled={!choice} onClick={()=>setChecked(true)}>Check {selected==='academy'?'answer':'action'}</button>:<button className="activity-button" onClick={next}>{answers.length===run.length-1?'See result':'Next step'}<Icon name="arrow" size={17}/></button>}<button className="activity-back" onClick={back}>Leave attempt</button></div><small className="activity-save-note">Completed attempts are saved. Leaving early restarts this attempt.</small></div>}
 </section></div>;
}
function LevelMissionIndex({ level, challenges, onChoose }: {
  level: number; challenges?: readonly string[]; onChoose: (id: LevelMissionId) => void;
}) {
  const completed = new Set(challenges);
  const ready = LEVEL_MISSION_IDS.filter(id => LEVEL_MISSIONS[id].level <= level && !completed.has(`mission/${id}`)).reverse();
  const locked = LEVEL_MISSION_IDS.filter(id => LEVEL_MISSIONS[id].level > level);
  const done = LEVEL_MISSION_IDS.filter(id => completed.has(`mission/${id}`)).reverse();
  const next = locked[0];

  function list(ids: LevelMissionId[], status: 'ready' | 'complete' | 'locked') {
    return <ul className="mission-index-list">
      {ids.map(id => {
        const mission = LEVEL_MISSIONS[id];
        return <li key={id} data-status={status}>
          <span className="mission-index-level" aria-hidden="true">{status === 'complete' ? <Icon name="check" size={17}/> : mission.level}</span>
          <div><h4>{mission.title}</h4><p>Level {mission.level} · {mission.place}</p>
            {status === 'ready' && ready[0] === id && <p className="mission-index-brief">{mission.brief}</p>}</div>
          {status !== 'locked' && <button className={status === 'ready' ? 'activity-button' : 'activity-back'} type="button"
            onClick={() => onChoose(id)}>{status === 'ready' ? 'Go to mission' : 'Replay'}</button>}
        </li>;
      })}
    </ul>;
  }

  return <section className="level-missions" aria-labelledby="level-missions-title">
    <div className="mission-index-title">
      <h3 id="level-missions-title">Level missions</h3>
      <span>{done.length}/{LEVEL_MISSION_IDS.length} complete</span>
    </div>
    {ready.length ? list(ready.slice(0, 3), 'ready') : <p className="mission-index-empty">
      {next ? `Reach Level ${LEVEL_MISSIONS[next].level} to unlock your next mission.` : 'All level missions complete.'}</p>}
    {ready.length > 3 && <details className="mission-disclosure">
      <summary><span>More available <small>{ready.length - 3}</small></span><Icon name="chevron" size={18}/></summary>
      {list(ready.slice(3), 'ready')}
    </details>}
    {next && <details className="mission-disclosure">
      <summary><span>Upcoming <small>Next at Level {LEVEL_MISSIONS[next].level}</small></span><Icon name="chevron" size={18}/></summary>
      {list(locked, 'locked')}
    </details>}
    {done.length > 0 && <details className="mission-disclosure">
      <summary><span>Completed <small>{done.length}</small></span><Icon name="chevron" size={18}/></summary>
      {list(done, 'complete')}
    </details>}
  </section>;
}
