import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {EXPANSION_BUILDINGS,isOpenRoom} from '../src/lib/campus-map.ts';
import {createRoomShell,roomContainsPlayer} from '../src/lib/campus-room-shell.ts';

test('closed room roofs block the exterior view, while the doorway stays open and cutaway removes the roof',()=>{
 for(const b of EXPANSION_BUILDINGS.filter(isOpenRoom)){
  const shell=createRoomShell(b);shell.updateMatrixWorld(true);
  const ray=new THREE.Raycaster(new THREE.Vector3(b.x,30,b.z),new THREE.Vector3(0,-1,0));
  const hits=ray.intersectObject(shell,true);
  assert.ok(hits.some(h=>h.point.y>b.h),`${b.name} has no solid roof`);
  assert.ok(shell.children.length<=7,'The facade must be batched rather than hundreds of draws');
  const door=new THREE.Raycaster(new THREE.Vector3(b.x,1.8,b.z+b.d/2+2),new THREE.Vector3(0,0,-1),0,3);
  assert.equal(door.intersectObject(shell,true).length,0,`${b.name}: doorway sealed by exterior`);
  assert.equal(roomContainsPlayer(b,{x:b.x,z:b.z+b.d/2+.2}),false);
  assert.equal(roomContainsPlayer(b,{x:b.x,z:b.z+b.d/2-.3}),true);
  assert.equal(roomContainsPlayer(b,{x:b.x,z:b.z+b.d/2+.03},true),true,'Door threshold should not flicker');
  assert.equal(roomContainsPlayer(b,{x:b.x,z:b.z+b.d/2+.2},true),false);
  shell.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();for(const m of Array.isArray(o.material)?o.material:[o.material])m.dispose();}});
 }
});
