import assert from 'node:assert/strict';
import test from 'node:test';
import { statSync } from 'node:fs';
import { competitionQuestions, COMPETITION_IDS, DIFFICULTY_IDS } from '../src/lib/competition-catalog.ts';
import { createCompetitionEngine } from '../src/lib/competition-server.ts';
import { raceQuestion, openedAt, raceDistance } from '../src/lib/competition-engine.ts';

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
