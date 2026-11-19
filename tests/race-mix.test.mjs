import assert from 'node:assert/strict';
import test from 'node:test';
import { statSync } from 'node:fs';
import { competitionQuestions, COMPETITION_IDS, DIFFICULTY_IDS } from '../src/lib/competition-catalog.ts';
import { createCompetitionEngine } from '../src/lib/competition-server.ts';
import { raceQuestion, openedAt, raceDistance, makeAnswer, racePaceMultiplier } from '../src/lib/competition-engine.ts';

test('every event and difficulty assigns both humans the same ten items, audio, and options even when one times out',()=>{
  for (const mode of COMPETITION_IDS) for(const difficulty of DIFFICULTY_IDS) {
    const t=1800000000000, {roomAction:act,roomSnapshot:get}=createCompetitionEngine();
    const host=act({action:'create',mode,difficulty},t);
    const code=host.room.code, guest=act({action:'join',code},t);
    act({action:'ready',code,token:guest.token,ready:true},t);
    let room=act({action:'start',code,token:host.token},t).room;
    const order=room.round.order;
    assert.equal(new Set(order).size,10);
    const questions=order.map((_,i)=>raceQuestion(room,room.members[0],i));
    assert.deepEqual(questions,order.map((_,i)=>raceQuestion(room,room.members.at(-1),i)));
    assert.deepEqual(questions.map(q=>q.kind??'choice').sort(),['choice','choice','choice','choice','fill','fill','fill','listen','listen','listen']);
    for(const q of competitionQuestions(mode,difficulty)){
      if(q.kind==='listen')assert.ok(statSync(new URL('../public'+q.audio,import.meta.url)).size>1000);
    }
    const human=()=>room.members.find(m=>m.id===host.playerId);
    for(let i=0;i<order.length;i++){
      const q=questions[i], time=openedAt(human())+.5;
      const payload=q.kind==='fill'?{text:'  '+q.choices[q.answer].toUpperCase()+'!  '}:{choice:q.answer};
      get(code,guest.token,t+3000+Math.round(time*1000)-1);
      room=act({action:'answer',roundId:room.round.id,questionIndex:i,code,token:host.token,...payload},t+3000+Math.round(time*1000)).room;
      assert.equal(human().answers[i].correct,true);
      if(i<order.length-1)assert.ok(raceDistance(room,human(),200)<(mode==='swimming'?25:mode==='sprint'||mode==='hurdles'?40:20));
    }
    for(let elapsed=25;elapsed<205;elapsed+=5) room=get(code,guest.token,t+elapsed*1000);
    assert.equal(room.phase,'finished');
    for(const member of room.members)assert.deepEqual(member.answers.map(a=>a.questionId),order);
    assert.ok(room.members.find(m=>m.id===guest.playerId).answers.every(a=>a.choice===null));
  }
});

test('a streak raises cruising speed between answers and a miss or timeout resets it',()=>{
  for(const mode of COMPETITION_IDS){
    const {roomAction}=createCompetitionEngine();
    const {room}=roomAction({action:'practice',mode,profile:'a'.repeat(32)},1800000000000);
    const me=room.members[0];
    for(const [i,expected] of [1,1.25,1.5,1.75,2,2].entries()){
      const q=raceQuestion(room,me), at=2+3*i;
      me.answers.push(makeAnswer(room,me,q.answer,at));
      assert.equal(racePaceMultiplier(room,me.answers.at(-1).streak),expected);
    }
    const last=me.answers.at(-1), t=last.at+2;
    // Same boosts and position at the answer; change only the cruising streak.
    const normal={...me,answers:[...me.answers.slice(0,-1),{...last,streak:1}]};
    const travel=(m,start)=>raceDistance(room,m,start+1)-raceDistance(room,m,start);
    assert.ok(travel(me,t)>travel(normal,t));
    for(const choice of [null,-1]){
      const broken={...me,answers:[...me.answers,makeAnswer(room,me,choice,t+1)]};
      assert.equal(broken.answers.at(-1).streak,0);
      assert.equal(broken.answers.at(-1).boost,0);
      assert.ok(travel(broken,t+3)<travel(me,t+3));
      const next=makeAnswer(room,broken,raceQuestion(room,broken).answer,t+5);
      assert.equal(next.streak,1);
      assert.equal(racePaceMultiplier(room,next.streak),1);
    }
  }
});
