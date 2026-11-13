import test from 'node:test';
import assert from 'node:assert/strict';
import { ACTIVITIES, QUESTIONS, activityUnlocked, finishActivity, activityRounds, normalizeActivities } from '../src/lib/activities.ts';
import {freshProgress,restoreProgress,earnedXP} from '../src/lib/game.ts';
const correct=id=>QUESTIONS[id].slice(0,id==='academy'?10:5).map(q=>({questionId:q.id,answer:q.answer}));
test('activities preserve old saves, gate the classroom and award XP only once',()=>{
 let p=freshProgress();assert.deepEqual(restoreProgress(JSON.stringify(p)).activities,{});
 assert.equal(finishActivity(p,'academy',correct('academy')),p);
 p=finishActivity(p,'garden',correct('garden'));assert.equal(earnedXP(p),80);
 p=finishActivity(p,'garden',correct('garden'));assert.equal(earnedXP(p),80);assert.equal(p.activities.garden.attempts,2);
 p=finishActivity(p,'duty',correct('duty'));assert.ok(activityUnlocked('academy',p.activities));
 p=finishActivity(p,'academy',correct('academy'));assert.equal(earnedXP(p),280);
 assert.deepEqual(restoreProgress(JSON.stringify(p)).activities,p.activities);
});
test('scores at the pass boundary, retries and best score preservation',()=>{
 let answers=correct('garden');answers[0].answer=QUESTIONS.garden[0].choices.find(c=>c!==QUESTIONS.garden[0].answer);
 let p=finishActivity(freshProgress(),'garden',answers);assert.equal(p.activities.garden.best,80);assert.ok(p.activities.garden.passed);
 answers[1].answer=QUESTIONS.garden[1].choices.find(c=>c!==QUESTIONS.garden[1].answer);
 const failed=finishActivity(freshProgress(),'garden',answers);assert.equal(failed.activities.garden.best,60);assert.equal(failed.activities.garden.passed,false);assert.equal(earnedXP(failed),0);
 p=finishActivity(p,'garden',answers);assert.equal(p.activities.garden.best,80);assert.equal(earnedXP(p),80);
});
test('incomplete, duplicate or unknown answers cannot record a result',()=>{
 const p=freshProgress();assert.equal(finishActivity(p,'garden',correct('garden').slice(0,3)),p);
 const a=correct('garden');a[1]=a[0];assert.equal(finishActivity(p,'garden',a),p);
 const b=correct('duty');b[0].answer='fake';assert.equal(finishActivity(p,'duty',b),p);
 assert.deepEqual(normalizeActivities({garden:{best:'100',attempts:1},duty:{best:NaN,attempts:1}}),{});
});
test('classroom draws ten distinct valid questions and practice keeps its sequence',()=>{
 const rounds=activityRounds('academy');assert.equal(rounds.length,10);assert.equal(new Set(rounds.map(q=>q.id)).size,10);
 for(const q of rounds){assert.ok(q.choices.includes(q.answer));assert.equal(q.choices.length,3);}
 assert.deepEqual(activityRounds('garden').map(q=>q.id),QUESTIONS.garden.map(q=>q.id));
 assert.equal(ACTIVITIES.academy.pass,80);
 assert.deepEqual(normalizeActivities({academy:{best:100,attempts:1,passed:true}}),{});
});
