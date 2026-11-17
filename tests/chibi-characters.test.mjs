import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Box3 } from 'three';
import { animateCharacter, CHARACTER_PROFILES, createCampusCharacter } from '../src/lib/campus-character.ts';
import { CAMPUS_RESIDENTS } from '../src/lib/campus-residents.ts';
import { canWalkCampus, canWalkSegment } from '../src/lib/campus-map.ts';

test('all residents have their own rig and walk on short, clear paths', () => {
  assert.equal(new Set(CAMPUS_RESIDENTS.map(person => person.kind)).size, 12);
  for (const person of CAMPUS_RESIDENTS) {
    assert.ok(CHARACTER_PROFILES[person.kind]);
    const [start, finish] = person.route.map(([x, z]) => ({ x, z }));
    assert.ok(canWalkCampus(start.x, start.z), person.kind);
    if (finish) assert.ok(canWalkSegment(start, finish), person.kind);
  }
});

test('main chibi models have a ground-aligned body, distinct faces and independent moving pivots', () => {
  for (const kind of ['cadet', 'linh', 'minh', 'library', 'canteen']) {
    const rig = createCampusCharacter(kind, kind === 'cadet');
    const full = new Box3().setFromObject(rig.group);
    const head = new Box3().setFromObject(rig.head);
    assert.ok(Math.abs(full.min.y) < .02, kind);
    assert.ok((head.max.y - head.min.y) / (full.max.y - full.min.y) >= .4, kind);
    assert.equal(rig.eyes.length, 2);
    assert.equal(rig.elbows.length, 2);
    let meshes = 0;
    rig.group.traverse(object => {
      if (!object.isMesh) return;
      meshes++;
      assert.ok(object.geometry.index && object.geometry.hasAttribute('color'), kind);
    });
    assert.ok(meshes <= 18, kind);
    animateCharacter(rig, .1, true, false);
    assert.ok(rig.talkingMouth.visible, kind);
    animateCharacter(rig, .1, true, true);
    assert.ok(rig.smile.visible && !rig.talkingMouth.visible, kind);
  }
});
