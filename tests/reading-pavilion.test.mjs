import test from 'node:test';
import assert from 'node:assert/strict';
import { READING_PAVILION as room, READING_APPROACH, READING_TABLES, READING_SEATS, BOOKCASES, nearReadingTable } from '../src/lib/reading-pavilion.ts';
import { canWalkCampus, canWalkSegment, findCampusPath, isOpenRoom } from '../src/lib/campus-map.ts';
import { roomContainsPlayer } from '../src/lib/campus-room-shell.ts';
import { PAVILION_READINGS, pavilionReadingRound } from '../src/lib/pavilion-reading.ts';
import { ENGLISH_TIERS } from '../src/lib/cadet-tiers.ts';

test('the reading desk route goes through the front door and returns to the garden',()=>{
  const outside={x:room.x,z:room.z+room.d/2+1};
  assert.ok(isOpenRoom(room)); assert.ok(nearReadingTable(READING_APPROACH));
  assert.ok(!nearReadingTable(outside));
  assert.ok(!roomContainsPlayer(room,outside));
  for (const [start,end] of [[outside,READING_APPROACH],[READING_APPROACH,outside]]) {
    let from=start;
    const route=findCampusPath(start,end);
    assert.deepEqual(route.at(-1),end);
    for(const to of route){assert.ok(canWalkSegment(from,to));from=to;}
  }
  assert.ok(roomContainsPlayer(room,READING_APPROACH));
  for(const f of [...READING_TABLES,...READING_SEATS,...BOOKCASES]) assert.equal(canWalkCampus(f.x,f.z),false);
});

test('each reading level has a passage and three answerable questions on every visit',()=>{
  for (const tier of ENGLISH_TIERS) {
    assert.ok(PAVILION_READINGS[tier].text.length>100);
    const first=pavilionReadingRound(tier,[]).map(q=>q.prompt);
    const next=pavilionReadingRound(tier,first);
    assert.equal(new Set(next.map(q=>q.prompt)).size,3);
    assert.ok(next.some(q=>!first.includes(q.prompt)));
    for(const q of next){assert.equal(new Set(q.options).size,3);assert.ok(q.options.includes(q.answer));}
  }
});
