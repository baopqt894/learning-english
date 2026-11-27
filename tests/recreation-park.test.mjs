import assert from 'node:assert/strict';
import test from 'node:test';
import { PARK_ZONES, PARK_COURTS, parkObstacles, nearbyPark } from '../src/lib/recreation-park.ts';
import { canWalkCampus, canWalkSegment, findCampusPath } from '../src/lib/campus-map.ts';
import { placePracticeRound } from '../src/lib/place-practice.ts';
import { WORKSHOPS, workshopFittings } from '../src/lib/workshop-wing.ts';

test('new map pins lead from the courtyard to an accessible local lesson at each level',()=>{
  const origin={x:0,z:0};
  for(const zone of PARK_ZONES){
    const path=findCampusPath(origin,zone);
    assert.ok(path.length,zone.id);
    assert.deepEqual(path.at(-1),zone);
    assert.equal(nearbyPark(zone)?.id,zone.id);
    for(const tier of ['A1','A2','B1']){
      const round=placePracticeRound(zone.id,tier,[]);
      assert.equal(new Set(round.map(q=>q.prompt)).size,3);
      assert.ok(round.every(q=>q.options.includes(q.answer)));
    }
  }
});

test('court equipment and workshop project islands share walkable approaches with the rendered scene',()=>{
  for(const court of PARK_COURTS){
    assert.ok(canWalkCampus(court.x,court.z-2));
    if(court.kind==='volleyball')assert.equal(canWalkSegment({x:court.x,z:court.z-1},{x:court.x,z:court.z+1}),false);
  }
  for(const p of parkObstacles)assert.equal(canWalkCampus(p.x,p.z),false);
  for(const b of WORKSHOPS){
    const expected={kitchen:1,'light-lab':2,'plant-lab':3,weather:1,art:1,music:0};
    const benches=workshopFittings.filter(f=>f.kind===b.kind&&f.unit==='project');
    assert.equal(benches.length,expected[b.kind]);
    for(const bench of benches)assert.equal(canWalkCampus(bench.x,bench.z),false);
    assert.ok(canWalkSegment({x:b.x,z:b.z+b.d/2+1},{x:b.x,z:b.z-b.d/2+2}),b.kind);
  }
});
