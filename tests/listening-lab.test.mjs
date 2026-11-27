import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {listeningBank,listeningRound,wordScore,roundScore,restoreLabRecords} from '../src/lib/listening-lab.ts';
import {listeningStations,nearbyListeningStation,languageMeetingPoint} from '../src/lib/learning-room-layout.ts';
import {canWalkSegment,findCampusPath} from '../src/lib/campus-map.ts';
test('all headset desks have a route in both directions from the language classroom door',()=>{
  assert.equal(listeningStations.length,12);
  for(const s of listeningStations){
    for(const [from,to] of [[languageMeetingPoint,s.approach],[s.approach,languageMeetingPoint]]){
      const path=findCampusPath(from,to);
      assert.deepEqual(path.at(-1),to,s.id);
      path.forEach((p,i)=>assert.ok(canWalkSegment(path[i-1]??from,p),s.id));
    }
    assert.equal(nearbyListeningStation(s.approach)?.id,s.id);
  }
  assert.equal(nearbyListeningStation(languageMeetingPoint),undefined);
});
test('each tier rotates four different recordings per visit and can restore a finished attempt',()=>{
  for(const tier of ['A1','A2','B1']){
    const bank=listeningBank.filter(q=>q.tier===tier);
    assert.equal(new Set(bank.map(q=>q.line)).size,12);
    bank.forEach(q=>assert.ok(existsSync(new URL('../public/mission-audio/'+q.id+'.mp3',import.meta.url))));
    const round=listeningRound(tier,[]),ids=round.map(q=>q.id);
    assert.equal(new Set(ids).size,4);
    assert.ok(listeningRound(tier,ids).every(q=>!ids.includes(q.id)));
    const replies=round.map(q=>({id:q.id,text:q.line,mode:'mic'}));
    const record={tier,replies,best:100};
    assert.equal(roundScore(replies),100);
    assert.deepEqual(restoreLabRecords({[tier]:record}),{[tier]:record});
    assert.equal(restoreLabRecords({[tier]:{...record,replies:Array(4).fill(replies[0])}}),undefined);
  }
  assert.equal(wordScore("It's sunny today.","it is sunny today"),100);
  assert.equal(wordScore('Open the blue book','open the book'),75);
  assert.equal(wordScore('Open the blue book',''),0);
});
