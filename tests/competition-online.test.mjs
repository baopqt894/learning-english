import test from 'node:test';import assert from 'node:assert/strict';
import {createCompetitionEngine} from '../src/lib/competition-server.ts';
import {raceQuestion,openedAt} from '../src/lib/competition-engine.ts';
const reply=(q,correct=true)=>q.kind==='fill'?{text:correct?q.choices[q.answer]:'incorrect'}:{choice:correct?q.answer:(q.answer+1)%q.choices.length};
const { roomAction, roomSnapshot } = createCompetitionEngine();
let now=1_800_000_000_000;const create=(mode='sprint')=>roomAction({action:'create',mode,name:'Host'},now+=100_000);
test('two real players share a lobby, only host edits seats, readiness gates start and bots fill empty seats',()=>{
 const a=create(),code=a.room.code,b=roomAction({action:'join',code,name:'Friend'},now+1),auth={code,token:a.token};
 assert.equal(b.room.members.filter(x=>x.kind==='human').length,2);
 assert.throws(()=>roomAction({action:'add-bot',code,token:b.token},now+2),/host/);
 assert.throws(()=>roomAction({action:'start',...auth},now+2),/Ready/);
 roomAction({action:'ready',code,token:b.token,ready:true},now+3);
 const started=roomAction({action:'start',...auth},now+4).room;assert.equal(started.phase,'racing');assert.equal(started.members.length,4);
 const peer=roomSnapshot(code,b.token,now+5);assert.equal(peer.round.id,started.round.id);assert.equal(peer.members[0].id,a.playerId);
 assert.ok(!JSON.stringify(peer).includes(a.token));
});
test('correct streaks increase boosts; wrong answers reset the streak; server rejects stale and forged submissions',()=>{
 const a=create('hurdles'),auth={code:a.room.code,token:a.token};let r=roomAction({action:'start',...auth},now).room,m=r.members[0];
 for(let i=0;i<3;i++){const q=raceQuestion(r,m),t=openedAt(m)+1;r=roomAction({action:'answer',...auth,roundId:r.round.id,questionIndex:i,...reply(q)},now+3000+t*1000).room;m=r.members[0];}
 assert.equal(m.answers.at(-1).streak,3);assert.ok(m.answers[2].boost>m.answers[0].boost);
 const t=openedAt(m)+1,q=raceQuestion(r,m);r=roomAction({action:'answer',...auth,roundId:r.round.id,questionIndex:3,...reply(q,false)},now+3000+t*1000).room;assert.equal(r.members[0].answers.at(-1).streak,0);
 assert.throws(()=>roomAction({action:'answer',...auth,roundId:r.round.id,questionIndex:3,choice:0},now+12000),/changed|open/);
 assert.throws(()=>roomAction({action:'add-bot',code:a.room.code,token:'forged'},now+1),/access/);
});
test('full lobbies admit humans by replacing bots, and all-human full rooms reject extra joins',()=>{
 const a=create();for(let i=0;i<2;i++)roomAction({action:'add-bot',code:a.room.code,token:a.token},now+i+1);
 for(let i=0;i<3;i++){const peer=roomAction({action:'join',code:a.room.code,name:`Peer ${i}`},now+10+i);assert.equal(peer.room.members.length,4);}
 assert.throws(()=>roomAction({action:'join',code:a.room.code,name:'Extra'},now+20),/full/);
});
test('leaving and disconnected racers are replaced by bots without changing completed answers',()=>{
 const a=create(),b=roomAction({action:'join',code:a.room.code,name:'Friend'},now+1),auth={code:a.room.code,token:a.token};roomAction({action:'ready',code:a.room.code,token:b.token,ready:true},now+2);let r=roomAction({action:'start',...auth},now+3).room;
 r=roomAction({action:'leave',code:a.room.code,token:b.token},now+5000).room;assert.equal(r.members.find(m=>m.id===b.playerId).kind,'bot');
 const v=roomSnapshot(a.room.code,a.token,now+20000);for(const m of v.members)for(let i=1;i<m.answers.length;i++)assert.ok(m.answers[i].at>m.answers[i-1].at);
});
test('a new human can host an abandoned waiting room instead of leaving it permanently without a host',()=>{
 const a=create();roomAction({action:'leave',code:a.room.code,token:a.token},now+1);
 const b=roomAction({action:'join',code:a.room.code,name:'New host'},now+2);assert.equal(b.room.hostId,b.playerId);
 roomAction({action:'ready',code:b.room.code,token:b.token,ready:true},now+3);
 assert.equal(roomAction({action:'start',code:b.room.code,token:b.token},now+4).room.phase,'racing');
});

test('a rematch and a new practice draw unseen race questions first when the bank has room', () => {
 const start=1_800_001_000_000;
 const {roomAction:act,roomSnapshot:snapshot}=createCompetitionEngine();
 const seat=act({action:'create',mode:'sprint',difficulty:'intermediate',name:'Host'},start);
 const auth={code:seat.room.code,token:seat.token};
 const first=act({action:'start',...auth},start+1).room;
 let race=first;
 // Complete the deck so the rematch excludes every question.
 for(let index=0;index<first.round.order.length;index++){
  const member=race.members[0], time=openedAt(member)+1;
  race=act({action:'answer',...auth,roundId:first.round.id,questionIndex:index,...reply(raceQuestion(race,member))},start+3001+Math.round(time*1000)).room;
 }
 const done=snapshot(auth.code,auth.token,start+95_000);
 assert.equal(done.phase,'finished');
 const seen=first.round.order.slice(0,done.members[0].answers.length+1);
 assert.equal(seen.length,first.round.order.length);
 act({action:'lobby',...auth},start+95_001);
 const second=act({action:'start',...auth},start+95_002).room;
 assert.ok(second.round.order.every(id=>!seen.includes(id)));
 const practice=act({action:'practice',mode:'sprint',difficulty:'intermediate',name:'Host',previous:seen},start+95_003,'a'.repeat(32));
 assert.ok(!seen.includes(practice.room.round.order[0]));
});
