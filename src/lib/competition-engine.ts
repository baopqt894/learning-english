import {competitionQuestions,COMPETITIONS,DIFFICULTIES,RACE_COLOURS,type CompetitionId,type RaceQuestion,type RaceDifficulty} from './competition-catalog.ts';
export type CompetitionAnswer={questionId:string;choice:number|null;correct:boolean;seconds:number;at:number;boost:number;streak:number};
export type CompetitionMember={id:string;name:string;kind:'human'|'bot';ready:boolean;connected:boolean;avatar:number;colour:string;answers:CompetitionAnswer[];finishedAt:number|null;takeoverAt?:number;botAssisted?:boolean};
export type CompetitionRound={id:string;startedAt:number;order:string[];fixed?:true};
export type RecordStatus = 'personal-best' | 'kept-best' | 'not-qualified' | 'retrying';
export type CompetitionRoom={code:string;mode:CompetitionId;difficulty:RaceDifficulty;format:'online'|'practice';record?:RecordStatus;hostId:string;phase:'lobby'|'racing'|'finished';members:CompetitionMember[];round:CompetitionRound|null;revision:number;serverNow:number};
export const FEEDBACK_SECONDS=1.4;
export function questionSeconds(room: CompetitionRoom, kind?: RaceQuestion['kind']) {
 return DIFFICULTIES[room.difficulty].seconds + (kind === 'listen' ? 10 : kind === 'fill' ? 4 : 0);
}
export const questionsComplete = (room: CompetitionRoom, member: CompetitionMember) =>
 !!room.round?.fixed && member.answers.length >= room.round.order.length;
export function raceTime(room:CompetitionRoom,now:number){return room.round?(now-room.round.startedAt)/1000-3:0;}
export function raceQuestion(room:CompetitionRoom,member:CompetitionMember,index=member.answers.length):RaceQuestion{
 const bank=competitionQuestions(room.mode,room.difficulty),order=room.round?.order;
 const base=order?bank.find(q=>q.id===order[index%order.length])!:bank[index%bank.length];
 const correct=base.choices[base.answer],choices=[...base.choices];let seed=((room.round?.startedAt??0)+index*7919)>>>0;
 for(let i=choices.length-1;i>0;i--){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const j=seed%(i+1);[choices[i],choices[j]]=[choices[j],choices[i]];}
 return {...base,choices,answer:choices.indexOf(correct)};
}
export const openedAt=(member:CompetitionMember)=>member.answers.length?member.answers.at(-1)!.at+FEEDBACK_SECONDS:0;
export function makeAnswer(room:CompetitionRoom,member:CompetitionMember,choice:number|null,time:number):CompetitionAnswer{
 const q=raceQuestion(room,member),limit=questionSeconds(room,q.kind),seconds=Math.min(limit,Math.max(0,time-openedAt(member))),correct=choice===q.answer;
 const streak=correct?(member.answers.at(-1)?.streak??0)+1:0,multiplier=1+Math.min(4,Math.max(0,streak-1))*.15;
 return {questionId:q.id,choice,correct,seconds,at:time,streak,boost:correct?(1.5+2.7*(1-seconds/limit))*multiplier:0};
}
export function raceDistance(room:CompetitionRoom,member:CompetitionMember,time:number){
 let units = Math.max(0,time)*.4, resolved = 0;
 for (const answer of member.answers) {
   const progress = Math.min(1, Math.max(0, (time-answer.at)/1.5));
   units += answer.boost*progress;
   resolved += progress;
 }
 let fraction = Math.min(1, units/25);
 if (room.round?.fixed) {
   if (room.round.order.length > 6) {
     // Reserve part of the course for the remaining questions. A fast start
     // should not leave a racer parked beside the finish for several turns.
     fraction = .6*fraction + .4*resolved/room.round.order.length;
   } else {
     const last = member.answers.at(-1);
     const completion = questionsComplete(room,member) && last ? Math.min(1, Math.max(0, (time-last.at)/1.5)) : 0;
     fraction = Math.min(fraction, .96 + .04*completion);
   }
 }
 return fraction*COMPETITIONS[room.mode].distance;
}
export function finishTime(room:CompetitionRoom,member:CompetitionMember){if (room.round?.fixed && !questionsComplete(room,member)) return Infinity;
 let low=0,high=Math.max(62.5,(member.answers.at(-1)?.at??0)+1.6);for(let i=0;i<32;i++){const mid=(low+high)/2;if(raceDistance(room,member,mid)>=COMPETITIONS[room.mode].distance)high=mid;else low=mid;}return high;}
export function standings(room:CompetitionRoom,time:number){return room.members.map((m,index)=>({...m,index,metres:raceDistance(room,m,time)})).sort((a,b)=>b.metres-a.metres||((a.finishedAt!==null&&b.finishedAt!==null)?a.finishedAt-b.finishedAt:a.index-b.index));}
export function freshMember(id:string,name:string,kind:'human'|'bot',index:number,avatar=0):CompetitionMember{return {id,name,kind,ready:kind==='bot'||index===0,connected:true,avatar,colour:RACE_COLOURS[index%4],answers:[],finishedAt:null};}

export function raceTeamProgress(room: CompetitionRoom | null, playerId?: string) {
 const none = { together: false, threeEach: false };
 if (room?.format !== 'online' || !playerId) return none;
 const humans = room.members.filter(member => member.kind === 'human' && !member.botAssisted && member.finishedAt !== null);
 const self = humans.find(member => member.id === playerId);
 const teammates = humans.filter(member => member.id !== playerId);
 if (!self || !teammates.length) return none;
 const qualified = (member: CompetitionMember) => member.answers.filter(answer => answer.correct).length >= 3;
 return { together: true, threeEach: qualified(self) && teammates.some(qualified) };
}

/** Ease late network corrections while preserving visible forward motion. */
export function smoothRaceDistance(current: number, target: number, delta: number) {
 const correction = target - current;
 if (correction <= 0) return current;
 if (correction < .075) return target;
 return Math.min(target, current + .075 + correction * (1 - Math.exp(-delta * 12)));
}
