import assert from 'node:assert/strict';
import test from 'node:test';
import {computerLab, examStations, nearbyExamStation} from '../src/lib/learning-room-layout.ts';
import {EXPLORATION_ZONES, canWalkSegment, findCampusPath} from '../src/lib/campus-map.ts';
import {computerExamRound, examAnswerMatches, restoreExamRecords} from '../src/lib/computer-exam.ts';
import {freshProgress,restoreProgress} from '../src/lib/game.ts';

test('the classroom door leads to all desktop and laptop exam stations', () => {
  const entrance={x:computerLab.x,z:computerLab.z+computerLab.d/2+1};
  assert.equal(nearbyExamStation(entrance),undefined);
  assert.equal(examStations.length,32);
  assert.ok(nearbyExamStation(EXPLORATION_ZONES.find(z=>z.id==='computer')));
  for(const station of examStations) {
    const route=findCampusPath(entrance,station.approach);
    assert.deepEqual(route.at(-1),station.approach,station.id);
    assert.equal(nearbyExamStation(station.approach)?.id,station.id);
    route.forEach((p,i)=>assert.ok(canWalkSegment(i?route[i-1]:entrance,p),station.id));
  }
});
test('English exams rotate reading, usage and written answers at each level',()=>{
  for(const tier of ['A1','A2','B1']){
    const items=computerExamRound(tier,[]);
    assert.equal(items.filter(q=>!q.options).length,2);
    assert.equal(new Set(items.map(q=>q.prompt)).size,6);
    const next=computerExamRound(tier,items.map(q=>q.prompt));
    assert.ok(next.filter(q=>items.some(last=>last.prompt===q.prompt)).length<=1);
    for(const item of items){
      assert.ok(!item.options || item.options.includes(item.answer));
      assert.ok(examAnswerMatches(item,' '+item.answer.toUpperCase()+' '));
      assert.equal(examAnswerMatches(item,''),false);
    }
  }
});
test('completed scores round-trip through account saves; invalid scores are discarded',()=>{
  const record={A1:{best:5,last:2},B1:{best:0,last:0}};
  assert.deepEqual(restoreProgress(JSON.stringify({...freshProgress(),computerExams:record})).computerExams,record);
  assert.equal(restoreExamRecords({A2:{best:9,last:1},B1:{best:1,last:2}}),undefined);
  assert.equal(restoreProgress(JSON.stringify(freshProgress())).computerExams,undefined);
});
