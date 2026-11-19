import { test } from 'node:test';
import assert from 'node:assert/strict';
import { canWalkSegment, findCampusPath } from '../src/lib/campus-map.ts';
import { CAMPUS_RESIDENTS, residentApproaches, residentMeetingPoint } from '../src/lib/campus-residents.ts';
import { RESIDENT_MISSIONS, matchResidentProof, startResidentMission } from '../src/lib/resident-missions.ts';
import { completeChallenge } from '../src/lib/challenge-xp.ts';
import { earnedXP, freshProgress, restoreProgress } from '../src/lib/game.ts';

test('each NPC links to a distinct role dialogue, task, report and restorable XP award', () => {
  const ids = CAMPUS_RESIDENTS.map(resident => resident.kind);
  assert.deepEqual(Object.keys(RESIDENT_MISSIONS), ids);
  const titles = new Set();
  let xp = 0;
  for (const id of ids) {
    const item = RESIDENT_MISSIONS[id];
    titles.add(item.title);
    assert.equal(item.dialogue.length, 2);
    for (const turn of [...item.dialogue, item.report]) {
      assert.notEqual(turn.correct, turn.other);
      assert.ok(turn.meaning);
    }
    xp += item.xp;
  }
  assert.equal(titles.size, ids.length);
  const challenges = ids.map(id => `resident/${id}`);
  assert.equal(completeChallenge(challenges, 'resident/hai'), challenges);
  const restored = restoreProgress(JSON.stringify({ ...freshProgress(), name: 'Tester', challenges: [...challenges, 'resident/hai'] }));
  assert.equal(earnedXP(restored), xp);
});

test('only matching work done after accepting a mission is eligible to report', () => {
  const beam = { type: 'station', station: 'balance' };
  assert.equal(matchResidentProof(undefined, beam), undefined);
  const accepted = startResidentMission(startResidentMission(undefined, 'hai'), 'phuc');
  assert.equal(matchResidentProof(accepted, beam), 'hai');
  assert.equal(matchResidentProof(accepted, { type: 'work', work: 'garden' }), 'phuc');
  assert.equal(matchResidentProof(accepted, { type: 'work', work: 'duty' }), undefined);
  assert.equal(matchResidentProof({ ...accepted, hai: 'ready' }, beam), undefined);
  const restored = restoreProgress(JSON.stringify({ ...freshProgress(), name: 'Tester',
    residentMissions: { ...accepted, khoa: 'ready', invalid: 'ready', mai: true } }));
  assert.deepEqual(restored.residentMissions, { ...accepted, khoa: 'ready' });
  assert.equal(earnedXP(restored), 0);
});

test('each patrol has a reachable standing spot within talking distance of both ends', () => {
  const spawn = {x:0,z:6};
  for (const resident of CAMPUS_RESIDENTS) {
    const spot = residentApproaches(resident, spawn).find(point =>
      canWalkSegment(point, residentMeetingPoint(resident)) && findCampusPath(spawn, point).length);
    assert.ok(spot, resident.kind);
    for (const [x,z] of resident.route) {
      const distance = Math.hypot(x - spot.x, z - spot.z);
      assert.ok(distance >= 1.24 && distance < 2.35, resident.kind);
    }
  }
});
