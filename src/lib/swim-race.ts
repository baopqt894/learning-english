/** English answers drive continuous, shared 3D race positions. Times are monotonic milliseconds. */
export const SWIM_DISTANCE=25;
export const SWIM_QUESTION_SECONDS=12;
export const SWIM_FEEDBACK_SECONDS=1.4;
export const SWIM_RACERS=[{name:'You',color:'#e7bd63'},{name:'Minh',color:'#89b798'},{name:'Linh',color:'#92c9dd'},{name:'An',color:'#e1a38b'}] as const;
type Question={id:string;sentence:string;choices:string[];answer:number;explanation:string};
const q=(id:string,sentence:string,choices:string[],correct:string,explanation:string):Question=>({id,sentence,choices,answer:choices.indexOf(correct),explanation});
export const SWIM_QUESTIONS:Question[]=[
 q('s1','We ___ ready for the race.',['is','are','am','be'],'are','Use “are” with we, you and they.'),
 q('s2','She ___ in lane three.',['swim','swimming','swims','to swim'],'swims','In the present simple, she / he / it takes a verb ending in -s.'),
 q('s3','Please ___ before you enter the pool.',['warm up','harvest','borrow','fold'],'warm up','“Warm up” means prepare your body before exercise.'),
 q('s4','You wear ___ to protect your eyes in the water.',['boots','gloves','goggles','a belt'],'goggles','Goggles protect your eyes while swimming.'),
 q('s5','The race starts ___ nine o’clock.',['on','in','at','from'],'at','Use “at” before a clock time: at nine o’clock.'),
 q('s6','___ run on the wet pool deck.',['Do','Does','Not','Do not'],'Do not','“Do not” + verb gives a negative instruction.'),
 q('s7','There ___ six lanes in the pool.',['is','are','am','has'],'are','“Lanes” is plural, so use “there are”.'),
 q('s8','Minh is ___ than An today.',['fast','fastest','faster','more fast'],'faster','Use the comparative “faster” with “than”.'),
 q('s9','We are ___ English through a game.',['learning','learn','learns','learned'],'learning','“Are” + verb-ing describes an action happening now.'),
 q('s10','Could you ___ that instruction, please?',['repeats','repeating','repeated','repeat'],'repeat','After “could you”, use the base form of the verb.'),
 q('s11','First warm up. ___ enter the water.',['Yesterday','Then','Under','Because'],'Then','“First … Then …” puts instructions in order.'),
 q('s12','The lifeguard keeps swimmers ___.',['safe','safely','safety','save'],'safe','“Keep someone safe” means protect them from danger.'),
 q('s13','I ___ my towel in the changing room yesterday.',['leave','leaves','left','leaving'],'left','“Yesterday” points to the past. The past of “leave” is “left”.'),
 q('s14','These goggles belong to me. They are ___.',['my','mine','me','I'],'mine','“Mine” replaces “my goggles”.'),
 q('s15','There is not ___ water in my bottle.',['many','a few','much','a'],'much','Use “much” with the uncountable noun “water”.'),
 q('s16','Walk ___ on the wet floor.',['careful','carefully','care','caring'],'carefully','The adverb “carefully” tells us how to walk.'),
 q('s17','We ___ finished our swimming lesson.',['has','are','have','do'],'have','Use “have finished” with I / you / we / they.'),
 q('s18','Which word is the opposite of “slow”?',['deep','fast','wet','long'],'fast','Fast and slow describe opposite speeds.'),
 q('s19','The towel is ___ the bench, not under it.',['on','through','between','into'],'on','“On” means resting on top of a surface.'),
 q('s20','If you need help, ___ the lifeguard.',['asks','asking','asked','ask'],'ask','Instructions use the base form: ask the lifeguard.'),
 q('s21','Linh ___ a swimming cap now.',['wear','wears','is wearing','wore'],'is wearing','“Now” + “is wearing” describes what Linh is doing at this moment.'),
 q('s22','We train ___ Monday and Thursday.',['at','on','in','by'],'on','Use “on” before days of the week.'),
 q('s23','The pool is twenty-five metres ___.',['length','long','longer','along'],'long','A measurement + “long” describes length.'),
 q('s24','Let’s ___ our teammate after the race.',['thanks','thanking','thank','thanked'],'thank','After “let’s”, use the base form: let’s thank.'),
];
export type SwimAnswer={questionId:string;choice:number|null;correct:boolean;seconds:number;at:number;boost:number};
export type SwimRaceState={startedAt:number;pausedAt:number|null;pausedMs:number;order:string[];answers:SwimAnswer[];finishedAt:number|null};
export function startSwimRace(now:number,random=Math.random):SwimRaceState{
 const questions=SWIM_QUESTIONS.map(q=>({...q,choices:[...q.choices]}));
 // Choice positions are independently shuffled by swimQuestionAt.
 for(let i=questions.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[questions[i],questions[j]]=[questions[j],questions[i]];}
 return {startedAt:now,pausedAt:null,pausedMs:0,order:questions.map(q=>q.id),answers:[],finishedAt:null};
}
export function swimClock(s:SwimRaceState,now:number){return Math.max(-3,((s.pausedAt??now)-s.startedAt-s.pausedMs)/1000-3);}
export function swimBoost(seconds:number){return 1.5+2.7*(1-Math.min(12,Math.max(0,seconds))/12);}
export function swimQuestionAt(s:SwimRaceState,index:number){
 const base=SWIM_QUESTIONS.find(q=>q.id===s.order[index%s.order.length])!;
 const correct=base.choices[base.answer],choices=[...base.choices];let seed=(Math.floor(s.startedAt)*13+index*7919+97)>>>0;
 for(let i=choices.length-1;i>0;i--){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const j=seed%(i+1);[choices[i],choices[j]]=[choices[j],choices[i]];}
 return {...base,choices,answer:choices.indexOf(correct)};
}
export function swimQuestion(s:SwimRaceState){return swimQuestionAt(s,s.answers.length);}
export function swimQuestionOpenedAt(s:SwimRaceState){return s.answers.length?s.answers.at(-1)!.at+SWIM_FEEDBACK_SECONDS:0;}
export function swimFeedback(s:SwimRaceState,time:number){const last=s.answers.at(-1);return last&&time<last.at+SWIM_FEEDBACK_SECONDS?last:null;}
const botProfiles=[{delay:3.8,step:5.8,reaction:4.0,miss:5},{delay:4.4,step:6.0,reaction:4.6,miss:4},{delay:5.1,step:6.2,reaction:5.2,miss:6}];
export function swimmerDistance(s:SwimRaceState,index:number,time:number){
 const t=Math.max(0,time);let metres=t*.4;
 if(index===0){for(const answer of s.answers)metres+=answer.boost*Math.min(1,Math.max(0,(t-answer.at)/1.5));}
 else {const bot=botProfiles[index-1];for(let i=0;i<20;i++){const at=bot.delay+i*bot.step;if(at>t)break;if((i+1)%bot.miss!==0)metres+=swimBoost(bot.reaction+(i%3)*.35)*Math.min(1,(t-at)/1.5);}}
 return Math.min(SWIM_DISTANCE,metres);
}
export function swimFinishTime(s:SwimRaceState,index:number){let low=0,high=SWIM_DISTANCE/.4;for(let i=0;i<35;i++){const mid=(low+high)/2;if(swimmerDistance(s,index,mid)>=SWIM_DISTANCE)high=mid;else low=mid;}return high;}
export function advanceSwimRace(s:SwimRaceState,now:number):SwimRaceState{
 if(s.finishedAt!==null||s.pausedAt!==null)return s;const time=swimClock(s,now);
 if(swimmerDistance(s,0,time)>=SWIM_DISTANCE)return {...s,finishedAt:swimFinishTime(s,0)};
 if(time>=swimQuestionOpenedAt(s)+SWIM_QUESTION_SECONDS)return recordAnswer(s,null,time);
 return s;
}
function recordAnswer(s:SwimRaceState,choice:number|null,time:number){
 const question=swimQuestion(s),seconds=Math.min(12,Math.max(0,time-swimQuestionOpenedAt(s))),correct=choice===question.answer;
 return {...s,answers:[...s.answers,{questionId:question.id,choice,correct,seconds,at:time,boost:correct?swimBoost(seconds):0}]};
}
export function answerSwimRace(s:SwimRaceState,choice:number,now:number){
 if(!Number.isInteger(choice)||choice<0||choice>3||s.pausedAt!==null||s.finishedAt!==null)return s;
 const time=swimClock(s,now);if(time<swimQuestionOpenedAt(s)||time<0)return s;
 const advanced=advanceSwimRace(s,now);if(advanced!==s)return advanced;
 return recordAnswer(s,choice,time);
}
export function pauseSwimRace(s:SwimRaceState,now:number){return s.pausedAt!==null||s.finishedAt!==null?s:{...s,pausedAt:now};}
export function resumeSwimRace(s:SwimRaceState,now:number){return s.pausedAt===null?s:{...s,pausedAt:null,pausedMs:s.pausedMs+Math.max(0,now-s.pausedAt)};}
export function swimStandings(s:SwimRaceState,time:number){return SWIM_RACERS.map((r,i)=>({...r,index:i,metres:swimmerDistance(s,i,time),finishTime:swimFinishTime(s,i)})).sort((a,b)=>b.metres-a.metres||(a.metres>=SWIM_DISTANCE?a.finishTime-b.finishTime:a.index-b.index));}
