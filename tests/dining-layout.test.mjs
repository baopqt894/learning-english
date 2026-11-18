import assert from 'node:assert/strict';
import test from 'node:test';
import { diningLayout } from '../src/lib/dining-layout.ts';
import { EXPANSION_BUILDINGS, canWalkCampus, canWalkSegment, findCampusPath } from '../src/lib/campus-map.ts';

test('a cadet can reach the serving line, each bench and tray return from the dining hall entrance', () => {
  const room = EXPANSION_BUILDINGS.find(b => b.kind === 'dining');
  const entrance = {x:room.x, z:room.z+room.d/2+1};
  const {tables, stations} = diningLayout(room);
  assert.equal(tables.length, 4);
  for (const solid of [...tables,...Object.values(stations)]) assert.equal(canWalkCampus(solid.x,solid.z), false);
  const stops = [
    ...['wash','trays','counter','fridge'].map(key => ({x:stations[key].x, z:stations[key].z+1.45})),
    ...tables.flatMap(t => [-1,1].map(side => ({x:t.x,z:t.z+side*1.6}))),
    {x:stations.returns.x,z:stations.returns.z-1}, entrance,
  ];
  let from = entrance;
  for (const stop of stops) {
    const route = findCampusPath(from, stop);
    assert.deepEqual(route.at(-1),stop);
    for (const point of route) { assert.ok(canWalkSegment(from,point)); from=point; }
  }
});
