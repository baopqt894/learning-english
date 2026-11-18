import test from 'node:test';
import assert from 'node:assert/strict';
import { CAMPUS_RESIDENTS, residentMeetingPoint } from '../src/lib/campus-residents.ts';
import { EXPLORATION_ZONES, findCampusPath } from '../src/lib/campus-map.ts';
import { areaQuestions } from '../src/lib/campus-question-bank.ts';
import { PLACES } from '../src/lib/game.ts';
import { PLACE_PRACTICE } from '../src/lib/place-practice.ts';
import { RESIDENT_MISSIONS } from '../src/lib/resident-missions.ts';

test('the campus pathfinder can reach every destination offered in the atlas', () => {
  const destinations = [
    ...EXPLORATION_ZONES,
    ...Object.entries(PLACES).map(([id, p]) => ({ id, x: p.position[0], z: p.position[1] + 1 })),
    ...CAMPUS_RESIDENTS.map(p => ({ id: p.kind, ...residentMeetingPoint(p) })),
  ];
  for (const { id, x, z } of destinations) {
    assert.deepEqual(findCampusPath({ x: 0, z: 6 }, { x, z }).at(-1), { x, z }, id);
  }
});

test('all practice places have original tiered questions and every NPC quiz has enough options to rotate', () => {
  assert.deepEqual(Object.keys(areaQuestions).sort(), Object.keys(PLACE_PRACTICE).sort());
  const seen = new Set();
  for (const bank of Object.values(areaQuestions)) {
    assert.deepEqual(Object.keys(bank).sort(), ['A1','A2','B1']);
    for (const q of Object.values(bank)) {
      assert.ok(!seen.has(q.prompt)); seen.add(q.prompt);
      assert.equal(new Set(q.options).size, 3);
      assert.ok(q.options.includes(q.answer));
    }
  }
  for (const { task } of Object.values(RESIDENT_MISSIONS)) {
    if (task.type !== 'quiz') continue;
    assert.ok(new Set(task.questions.map(q => q.prompt)).size >= 4);
    for (const q of task.questions) assert.ok(q.options.includes(q.answer));
  }
});

test('area icons and nearby NPC quest pins stay individually tappable on a phone', async () => {
  const { layoutAtlasPins, placeSymbols } = await import('../src/lib/atlas-pins.ts');
  const places = Object.entries(PLACES).map(([id,p]) => ({ id, x: p.position[0], z: p.position[1] }));
  const destinations = [...EXPLORATION_ZONES, ...places];
  assert.equal(new Set(destinations.map(p => placeSymbols[p.id])).size, destinations.length);
  const entries = [...destinations, ...CAMPUS_RESIDENTS.map(residentMeetingPoint), places[0]];
  for (const [width,height,diameter] of [[151,183,21],[240,292,21],[370,450,24],[494,600,28]]) {
    const pins = layoutAtlasPins(entries,width,height,diameter);
    for (const [i,pin] of pins.entries()) {
      assert.equal(pin.entry,entries[i]);
      assert.ok(pin.x >= diameter/2 && pin.x <= width-diameter/2);
      assert.ok(pin.y >= diameter/2 && pin.y <= height-diameter/2);
      for (const other of pins.slice(0,i))
        assert.ok(Math.hypot(pin.x-other.x,pin.y-other.y) >= diameter);
    }
  }
});
