import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CAMPUS_RESIDENTS } from '../src/lib/campus-residents.ts';
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
