import assert from 'node:assert/strict';
import test from 'node:test';
import { statSync } from 'node:fs';
import { competitionQuestions, COMPETITIONS, COMPETITION_IDS, DIFFICULTY_IDS } from '../src/lib/competition-catalog.ts';
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
    if(mode==='swimming')continue; // Swimming has its own distance and retry checks below.
    const human=()=>room.members.find(m=>m.id===host.playerId);
    for(let i=0;i<7;i++){
      const q=questions[i], time=openedAt(human())+.5;
      const payload=q.kind==='fill'?{text:'  '+q.choices[q.answer].toUpperCase()+'!  '}:{choice:q.answer};
      get(code,guest.token,t+3000+Math.round(time*1000)-1);
      room=get(code,host.token,t+3000+Math.round(time*1000));
      if(human().finishedAt!==null)break;
      room=act({action:'answer',roundId:room.round.id,questionIndex:i,code,token:host.token,...payload},t+3000+Math.round(time*1000)).room;
      assert.equal(human().answers[i].correct,true);
    }
    for(let elapsed=18;elapsed<=78;elapsed+=5) {
      get(code,host.token,t+elapsed*1000);
      room=get(code,guest.token,t+elapsed*1000);
    }
    assert.equal(room.phase,'finished');
    for(const member of room.members)assert.deepEqual(member.answers.map(a=>a.questionId),order.slice(0,member.answers.length));
    const winner=human(),distance=COMPETITIONS[mode].distance;
    assert.ok(winner.answers.length<order.length);
    assert.ok(winner.finishedAt<room.members.find(m=>m.id===guest.playerId).finishedAt);
    assert.equal(raceDistance(room,winner,winner.finishedAt),distance);
    assert.ok(raceDistance(room,winner,winner.finishedAt-.001)<distance);
    assert.throws(()=>act({action:'answer',code,token:host.token,roundId:room.round.id,questionIndex:winner.answers.length,choice:0},t+76000),/changed/);
    assert.ok(room.members.find(m=>m.id===guest.playerId).answers.every(a=>a.choice===null));
  }
});

test('a streak raises cruising speed between answers and a miss or timeout resets it',()=>{
  for(const mode of COMPETITION_IDS.filter(mode=>mode!=='swimming')){
    const {roomAction}=createCompetitionEngine();
    const {room}=roomAction({action:'practice',mode,profile:'a'.repeat(32)},1800000000000);
    const me=room.members[0];
    for(const [i,expected] of [1,1.25,1.5,1.75,2,2].entries()){
      const q=raceQuestion(room,me), at=1+2*i;
      me.answers.push(makeAnswer(room,me,q.answer,at));
      assert.equal(racePaceMultiplier(room,me.answers.at(-1).streak),expected);
    }
    for (const answer of me.answers) answer.boost=0;
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

for(const format of ['practice','online']){
 test(format+' swim earns exactly 2.5 m per distinct correct answer and retries mistakes and timeouts',()=>{
  const start=1800000000000,{roomAction,roomSnapshot}=createCompetitionEngine();
  const seat=roomAction({action:format==='practice'?'practice':'create',mode:'swimming',profile:'a'.repeat(32)},start);
  const auth={code:seat.room.code,token:seat.token};
  let room=format==='practice'?seat.room:roomAction({action:'start',...auth},start).room;
  const clock=t=>start+3000+Math.round(t*1000);
  const me=()=>room.members[0];
  const answer=(correct)=>{
    const m=me(),q=raceQuestion(room,m),at=openedAt(m,room)+.5;
    const payload=q.kind==='fill'?{text:correct?q.choices[q.answer]:'wrong'}:{choice:correct?q.answer:(q.answer+1)%q.choices.length};
    room=roomAction({action:'answer',...auth,roundId:room.round.id,questionIndex:m.answers.length,...payload},clock(at)).room;
    return q.id;
  };
  const deck=room.round.order;
  room=roomSnapshot(room.code,auth.token,clock(12.1)); // The written opener times out.
  assert.equal(me().answers[0].choice,null);
  assert.equal(raceDistance(room,me(),12.1),0);
  assert.equal(answer(false),deck[1]);
  for(let i=2;i<10;i++){
    assert.equal(answer(true),deck[i]);
    const a=me().answers.at(-1);
    assert.ok(raceDistance(room,me(),a.at+.4)>(i-2)*2.5);
    assert.equal(raceDistance(room,me(),a.at+3),(i-1)*2.5);
  }
  assert.equal(raceDistance(room,me(),1000),20);
  assert.equal(me().finishedAt,null);
  assert.equal(answer(false),deck[0]);
  assert.equal(answer(true),deck[1]);
  assert.equal(raceDistance(room,me(),1000),22.5);
  assert.equal(answer(true),deck[0]);
  const last=me().answers.at(-1),wall=openedAt(me(),room);
  assert.ok(raceDistance(room,me(),last.at+.1)<25);
  room=roomSnapshot(room.code,auth.token,clock(wall+.01));
  assert.equal(me().finishedAt,wall);
  assert.equal(raceDistance(room,me(),wall),25);
  assert.equal(new Set(me().answers.filter(a=>a.correct).map(a=>a.questionId)).size,10);
  assert.throws(()=>roomAction({action:'answer',...auth,roundId:room.round.id,questionIndex:me().answers.length,choice:0},clock(wall+.02)),/question has changed/);
  if(format==='online'){
    room=roomSnapshot(room.code,auth.token,clock(180));
    assert.equal(room.phase,'finished');
    assert.ok(room.members.every(m=>m.answers.filter(a=>a.correct).length===10));
  }else assert.equal(room.phase,'finished');
 });
}
