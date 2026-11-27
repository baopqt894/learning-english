import test from 'node:test';
import assert from 'node:assert/strict';
import {equipmentRound,orders,restoreEquipmentScores} from '../src/lib/equipment-lessons.ts';
import {demonstrationBays,nearbyEquipment,workshopSupplies} from '../src/lib/campus-detail-layout.ts';
import {WORKSHOPS} from '../src/lib/workshop-wing.ts';
import {findCampusPath,canWalkSegment,MAP_OBSTACLES} from '../src/lib/campus-map.ts';
test('all twelve machines have a reachable operating position and a rotating two-order assignment',()=>{
  for(const bay of demonstrationBays){
    const room=WORKSHOPS.find(r=>r.kind===bay.room);
    const door={x:room.x,z:room.z+room.d/2+1};
    assert.equal(nearbyEquipment(door),undefined);
    const path=findCampusPath(door,bay.approach);
    assert.deepEqual(path.at(-1),bay.approach);
    path.forEach((pt,i)=>assert.ok(canWalkSegment(i?path[i-1]:door,pt)));
    assert.equal(nearbyEquipment(bay.approach),bay);
    const items=equipmentRound(bay.name,[]);
    assert.equal(items.length,4);
    const seen=items.map(q=>q.instruction);
    assert.equal(new Set(seen).size,2);
    assert.ok(!seen.includes(equipmentRound(bay.name,seen)[0].instruction));
    for(const [i,q] of items.entries()){
      if(i%2===0){assert.ok(q.options.includes(q.answer));assert.equal(new Set(q.options).size,3);}
      else {assert.ok(q.prompt.includes('___'));assert.equal(q.options,undefined);}
    }
    assert.equal(orders[bay.name].length,3);
  }
});
test('workshop scores only restore completed valid station records',()=>{
  assert.deepEqual(restoreEquipmentScores({'Pottery wheel':{last:2,best:4},Xylophone:{last:5,best:5},bad:{last:1,best:1}}),{'Pottery wheel':{last:2,best:4}});
});

test('supply carts sit beside the work groups and keep machine approaches clear',()=>{
  for(const cart of workshopSupplies){
    assert.ok(MAP_OBSTACLES.includes(cart));
    for(const other of MAP_OBSTACLES){
      if(cart===other)continue;
      assert.ok(Math.abs(cart.x-other.x)>=(cart.w+other.w)/2 ||
        Math.abs(cart.z-other.z)>=(cart.d+other.d)/2,cart.room+' carts overlap');
    }
  }
});
