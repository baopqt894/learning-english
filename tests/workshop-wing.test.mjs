import test from 'node:test';
import assert from 'node:assert/strict';
import { statSync } from 'node:fs';
import { WORKSHOPS, nearbyWorkshop, workshopZones } from '../src/lib/workshop-wing.ts';
import { placePracticeRound, practiceQuestionKey } from '../src/lib/place-practice.ts';
import { canWalkCampus, campusAreaName, restoreCampusPosition } from '../src/lib/campus-map.ts';

test('each workshop atlas pin lands in the right room and enables its activity', () => {
  for (const point of workshopZones) {
    assert.ok(canWalkCampus(point.x,point.z));
    assert.equal(campusAreaName(point),point.name);
    assert.equal(nearbyWorkshop(restoreCampusPosition(point)).kind,point.id);
    const room = WORKSHOPS.find(b=>b.kind===point.id);
    assert.equal(nearbyWorkshop({x:room.x,z:room.z+room.d/2+1}),undefined);
  }
});

test('each workshop level rotates its recording and both MP3s are available offline in the build', () => {
  for (const room of WORKSHOPS) for (const tier of ['A1','A2','B1']) {
    const round = placePracticeRound(room.kind,tier,[]);
    const next = placePracticeRound(room.kind,tier,round.map(practiceQuestionKey));
    assert.notEqual(round[0].id,next[0].id);
    for (const questions of [round,next]) {
      assert.equal(questions.length,3);
      assert.equal(questions[0].kind,'listen');
      assert.ok(questions[0].transcript);
      assert.ok(statSync(new URL('../public/mission-audio/'+questions[0].id+'.mp3',import.meta.url)).size>3000);
      for (const q of questions) assert.equal(q.options.filter(a=>a===q.answer).length,1);
    }
  }
});
