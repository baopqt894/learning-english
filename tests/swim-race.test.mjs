import test from 'node:test';
import assert from 'node:assert/strict';
import {SWIM_QUESTIONS,SWIM_DISTANCE,startSwimRace,swimClock,swimBoost,swimQuestion,swimQuestionAt,swimQuestionOpenedAt,swimFeedback,swimmerDistance,swimFinishTime,swimStandings,answerSwimRace,advanceSwimRace,pauseSwimRace,resumeSwimRace} from '../src/lib/swim-race.ts';
const start=()=>startSwimRace(1000,()=>.4);
const at=t=>1000+(t+3)*1000;
test('correct fast answers produce stronger, continuous swimming boosts; wrong answers cannot farm progress',()=>{
 const s=start(),q=swimQuestion(s),fast=answerSwimRace(s,q.answer,at(1)),slow=answerSwimRace(s,q.answer,at(10));
 assert.ok(fast.answers[0].boost>slow.answers[0].boost);
 assert.equal(swimmerDistance(fast,0,1),.4,'Boost cannot teleport a swimmer');
 assert.ok(swimmerDistance(fast,0,1.5)>swimmerDistance(s,0,1.5));
 const wrong=answerSwimRace(s,(q.answer+1)%4,at(1));assert.equal(wrong.answers[0].boost,0);assert.equal(swimmerDistance(wrong,0,4),swimmerDistance(s,0,4));
 assert.equal(answerSwimRace(fast,q.answer,at(1.1)),fast,'Only one submission per question');
 for(const invalid of [-1,4,NaN,.5])assert.equal(answerSwimRace(s,invalid,at(1)),s);
 assert.equal(answerSwimRace(s,q.answer,at(-1)),s,'Countdown answers must not count');
 assert.ok(swimBoost(0)>swimBoost(12));
});
test('questions time out without rewards; feedback and paused time cannot consume another question',()=>{
 const s=start(),timeout=advanceSwimRace(s,at(12.2));assert.equal(timeout.answers.length,1);assert.equal(timeout.answers[0].choice,null);assert.equal(timeout.answers[0].boost,0);assert.ok(swimFeedback(timeout,12.3));
 assert.equal(advanceSwimRace(timeout,at(12.5)),timeout);
 const paused=pauseSwimRace(timeout,at(13));assert.equal(swimClock(paused,at(45)),13);assert.equal(advanceSwimRace(paused,at(45)),paused);assert.equal(answerSwimRace(paused,0,at(45)),paused);
 const resumed=resumeSwimRace(paused,at(45));assert.equal(swimClock(resumed,at(46)),14);assert.equal(advanceSwimRace(resumed,at(46)),resumed);
});
test('finish times and order are independent of render frame rate, with one immutable final result',()=>{
 let s=start();for(let i=0;i<10&&s.finishedAt===null;i++){const t=swimQuestionOpenedAt(s)+.8;s=answerSwimRace(s,swimQuestion(s).answer,at(t));s=advanceSwimRace(s,at(t+1.5));}
 s=advanceSwimRace(s,at(63));assert.notEqual(s.finishedAt,null);assert.ok(s.finishedAt<swimFinishTime(s,1));assert.equal(swimmerDistance(s,0,s.finishedAt+.01),SWIM_DISTANCE);
 assert.equal(advanceSwimRace(s,at(100)),s);assert.equal(answerSwimRace(s,0,at(100)),s);
 const order=swimStandings(s,63);assert.equal(order[0].index,0);assert.ok(order.every(r=>r.metres<=SWIM_DISTANCE));
 const idle=start(),done=advanceSwimRace(idle,at(63));assert.equal(Math.round(done.finishedAt*10)/10,62.5);assert.equal(swimStandings(done,63).at(-1).index,0);
});
test('all authored questions have one valid answer; replays vary order and choice positions with accurate review',()=>{
 const s=start();assert.equal(new Set(s.order).size,24);assert.notDeepEqual(startSwimRace(2000,()=>.8).order,s.order);
 for(let i=0;i<SWIM_QUESTIONS.length;i++){const q=swimQuestionAt(s,i),base=SWIM_QUESTIONS.find(x=>x.id===q.id);assert.equal(q.choices[q.answer],base.choices[base.answer]);assert.equal(q.choices.length,4);assert.equal(new Set(q.choices).size,4);assert.ok(q.explanation.length>20);}
 assert.ok(SWIM_QUESTIONS.some((_,i)=>swimQuestionAt(s,i).answer!==SWIM_QUESTIONS.find(x=>x.id===s.order[i]).answer));
});
