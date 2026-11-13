import {competitionQuestions,COMPETITIONS,RACE_COLOURS,type CompetitionId,type RaceQuestion} from './competition-catalog.ts';
export type CompetitionAnswer={questionId:string;choice:number|null;correct:boolean;seconds:number;at:number;boost:number;streak:number};
export type CompetitionMember={id:string;name:string;kind:'human'|'bot';ready:boolean;connected:boolean;avatar:number;colour:string;answers:CompetitionAnswer[];finishedAt:number|null;takeoverAt?:number};
export type CompetitionRound={id:string;startedAt:number;order:string[]};
export type CompetitionRoom={code:string;mode:CompetitionId;hostId:string;phase:'lobby'|'racing'|'finished';members:CompetitionMember[];round:CompetitionRound|null;revision:number;serverNow:number};
export const FEEDBACK_SECONDS=1.4,QUESTION_SECONDS=12;
export function raceTime(room:CompetitionRoom,now:number){return room.round?(now-room.round.startedAt)/1000-3:0;}
export function raceQuestion(room:CompetitionRoom,member:CompetitionMember,index=member.answers.length):RaceQuestion{
 const order=room.round?.order??competitionQuestions(room.mode).map(q=>q.id);
 const base=competitionQuestions(room.mode).find(q=>q.id===order[index%order.length])!;
 const correct=base.choices[base.answer],choices=[...base.choices];let seed=((room.round?.startedAt??0)+index*7919)>>>0;
 for(let i=choices.length-1;i>0;i--){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const j=seed%(i+1);[choices[i],choices[j]]=[choices[j],choices[i]];}
 return {...base,choices,answer:choices.indexOf(correct)};
}
export const openedAt=(member:CompetitionMember)=>member.answers.length?member.answers.at(-1)!.at+FEEDBACK_SECONDS:0;
export function makeAnswer(room:CompetitionRoom,member:CompetitionMember,choice:number|null,time:number):CompetitionAnswer{
 const q=raceQuestion(room,member),seconds=Math.min(12,Math.max(0,time-openedAt(member))),correct=choice===q.answer;
 const streak=correct?(member.answers.at(-1)?.streak??0)+1:0,multiplier=1+Math.min(4,Math.max(0,streak-1))*.15;
 return {questionId:q.id,choice,correct,seconds,at:time,streak,boost:correct?(1.5+2.7*(1-seconds/12))*multiplier:0};
}
export function raceDistance(room:CompetitionRoom,member:CompetitionMember,time:number){
 let units=Math.max(0,time)*.4;for(const a of member.answers)units+=a.boost*Math.min(1,Math.max(0,(time-a.at)/1.5));
 return Math.min(1,units/25)*COMPETITIONS[room.mode].distance;
}
export function finishTime(room:CompetitionRoom,member:CompetitionMember){let low=0,high=62.5;for(let i=0;i<32;i++){const mid=(low+high)/2;if(raceDistance(room,member,mid)>=COMPETITIONS[room.mode].distance)high=mid;else low=mid;}return high;}
export function standings(room:CompetitionRoom,time:number){return room.members.map((m,index)=>({...m,index,metres:raceDistance(room,m,time)})).sort((a,b)=>b.metres-a.metres||((a.finishedAt!==null&&b.finishedAt!==null)?a.finishedAt-b.finishedAt:a.index-b.index));}
export function freshMember(id:string,name:string,kind:'human'|'bot',index:number,avatar=0):CompetitionMember{return {id,name,kind,ready:kind==='bot'||index===0,connected:true,avatar,colour:RACE_COLOURS[index%4],answers:[],finishedAt:null};}
