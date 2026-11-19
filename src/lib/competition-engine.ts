import {competitionQuestions,COMPETITIONS,DIFFICULTIES,RACE_COLOURS,type CompetitionId,type RaceQuestion,type RaceDifficulty} from './competition-catalog.ts';
export type CompetitionAnswer={questionId:string;choice:number|null;correct:boolean;seconds:number;at:number;boost:number;streak:number};
export type CompetitionMember={id:string;name:string;kind:'human'|'bot';ready:boolean;connected:boolean;avatar:number;colour:string;answers:CompetitionAnswer[];finishedAt:number|null;takeoverAt?:number;botAssisted?:boolean};
// Persisted protocol field: swimPacing 3 uses ten earned segments in every event.
export type CompetitionRound={id:string;startedAt:number;order:string[];fixed?:true;streakPace?:true;swimPacing?:2|3};
export type RecordStatus = 'personal-best' | 'kept-best' | 'not-qualified' | 'retrying';
export type CompetitionRoom={code:string;mode:CompetitionId;difficulty:RaceDifficulty;format:'online'|'practice';record?:RecordStatus;hostId:string;phase:'lobby'|'racing'|'finished';members:CompetitionMember[];round:CompetitionRound|null;revision:number;serverNow:number};
export const FEEDBACK_SECONDS=1.4;
export function questionSeconds(room: CompetitionRoom, kind?: RaceQuestion['kind']) {
 return DIFFICULTIES[room.difficulty].seconds + (kind === 'listen' ? 10 : kind === 'fill' ? 4 : 0);
}
export function questionsComplete(room: CompetitionRoom, member: CompetitionMember) {
 if (room.round?.swimPacing === 3) return member.answers.filter(a => a.correct).length >= room.round.order.length;
 return !!room.round?.fixed && member.answers.length >= room.round.order.length;
}
export function raceTime(room:CompetitionRoom,now:number){return room.round?(now-room.round.startedAt)/1000-3:0;}
export function raceQuestion(room:CompetitionRoom,member:CompetitionMember,index=member.answers.length):RaceQuestion{
 const bank=competitionQuestions(room.mode,room.difficulty),order=room.round?.order;
 // After the original deck, retry missed items in the order they were missed.
 let id = order?.[index % order.length];
 if (room.round?.swimPacing === 3 && order && index >= order.length) {
   id = member.answers[index]?.questionId ?? member.answers.filter(a => !a.correct)[index-order.length]?.questionId;
 }
 const base=order?bank.find(q=>q.id===id)!:bank[index%bank.length];
 const correct=base.choices[base.answer],choices=[...base.choices];let seed=((room.round?.startedAt??0)+index*7919)>>>0;
 for(let i=choices.length-1;i>0;i--){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const j=seed%(i+1);[choices[i],choices[j]]=[choices[j],choices[i]];}
 return {...base,choices,answer:choices.indexOf(correct)};
}
function segmentSeconds(room: CompetitionRoom, answer: CompetitionAnswer) {
 return FEEDBACK_SECONDS / racePaceMultiplier(room,answer.streak);
}
export function openedAt(member: CompetitionMember, room?: CompetitionRoom) {
 const last = member.answers.at(-1);
 if (!last) return 0;
 return last.at + (room?.round?.swimPacing === 3 ? segmentSeconds(room,last) : FEEDBACK_SECONDS);
}
export function racePaceMultiplier(room: CompetitionRoom, streak: number) {
 const steps = Math.min(4, Math.max(0, streak-1));
 return 1 + steps * (room.round?.streakPace ? .25 : .15);
}

export function makeAnswer(room:CompetitionRoom,member:CompetitionMember,choice:number|null,time:number):CompetitionAnswer{
 const q=raceQuestion(room,member),limit=questionSeconds(room,q.kind),seconds=Math.min(limit,Math.max(0,time-openedAt(member,room))),correct=choice===q.answer;
 const streak=correct?(member.answers.at(-1)?.streak??0)+1:0,multiplier=racePaceMultiplier(room,streak);
 return {questionId:q.id,choice,correct,seconds,at:time,streak,boost:correct?(1.5+2.7*(1-seconds/limit))*multiplier:0};
}
// A racer moving at normal pace covers one course in this many seconds.
const BASE_COURSE_SECONDS = 62.5;
const BOOST_DURATION_SECONDS = 1.5;
const BOOST_SECONDS_PER_POINT = 1.25;
const SWIM_BOOST_SECONDS_PER_POINT = .28;

export function raceDistance(room: CompetitionRoom, member: CompetitionMember, time: number) {
 const distance = COMPETITIONS[room.mode].distance;
 if (member.finishedAt !== null && time >= member.finishedAt) return distance;

 if (room.round?.swimPacing === 3) {
   const step = distance / room.round.order.length;
   let earned = 0;
   for (const answer of member.answers) {
     if (answer.at >= time) break;
     if (answer.correct) {
       const duration = segmentSeconds(room,answer);
       earned += Math.min(1, (time-answer.at)/duration);
     }
   }
   return Math.min(distance, earned*step);
 }

 const boostSeconds = room.round?.swimPacing === 2 ? SWIM_BOOST_SECONDS_PER_POINT : BOOST_SECONDS_PER_POINT;
 let travelSeconds = Math.max(0, time);
 for (const [index, answer] of member.answers.entries()) {
   const age = time - answer.at;
   if (age <= 0) break;
   const interval = Math.min(time, member.answers[index + 1]?.at ?? time) - answer.at;
   const pace = racePaceMultiplier(room, answer.streak);
   travelSeconds += interval * (pace - 1);
   travelSeconds += answer.boost * boostSeconds * Math.min(1, age / BOOST_DURATION_SECONDS);
 }
 return distance * Math.min(1, travelSeconds / BASE_COURSE_SECONDS);
}

export function finishTime(room: CompetitionRoom, member: CompetitionMember) {
 if (member.finishedAt !== null) return member.finishedAt;
 if (room.round?.swimPacing === 3) {
   const last = member.answers.at(-1);
   if (!last || !questionsComplete(room,member)) return Infinity;
   return openedAt(member,room);
 }
 let low = 0, high = BASE_COURSE_SECONDS;
 const distance = COMPETITIONS[room.mode].distance;
 for (let i = 0; i < 32; i++) {
   const mid = (low + high) / 2;
   if (raceDistance(room, member, mid) >= distance) high = mid;
   else low = mid;
 }
 return high;
}
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
