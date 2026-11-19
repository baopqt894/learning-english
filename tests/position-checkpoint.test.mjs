import assert from 'node:assert/strict';
import {test} from 'node:test';
import {campusPositionTracker} from '../src/lib/position-checkpoint.ts';

test('an offline checkpoint resumes only its owner, retries safely and yields to a newer server location',async t=>{
  const storage=new Map(), requests=[];
  t.mock.method(globalThis,'fetch',async (_url,options)=>{
    requests.push(JSON.parse(options.body));
    return new Response(null,{status:503});
  });
  const original=Object.getOwnPropertyDescriptor(globalThis,'localStorage');
  Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{
    getItem:key=>storage.get(key)??null,setItem:(key,v)=>storage.set(key,v),removeItem:key=>storage.delete(key),
  }});
  t.after(()=>original?Object.defineProperty(globalThis,'localStorage',original):delete globalThis.localStorage);
  const spawn={x:0,z:6,heading:0}, desk={x:83,z:-32.45,heading:1.2};
  const account={id:'a',serverNow:Date.now(),save:{progress:{position:spawn}}};
  const game=campusPositionTracker(account);
  game.observe(spawn);
  assert.ok(await game.flush());
  assert.equal(requests.length,0);
  game.observe(desk);
  assert.equal(await game.flush(),false);
  const checkpoint=requests[0];
  assert.deepEqual(checkpoint.position,desk);
  assert.equal(checkpoint.accountId,'a');
  assert.deepEqual(campusPositionTracker({...account,id:'b'}).initialPosition,spawn);
  assert.deepEqual(campusPositionTracker({...account,positionSavedAt:checkpoint.at+1}).initialPosition,spawn);
  const resumed=campusPositionTracker(account);
  assert.deepEqual(resumed.initialPosition,desk);
  globalThis.fetch.mock.mockImplementation(async(_url,options)=>{
    assert.deepEqual(JSON.parse(options.body),checkpoint);
    return new Response(null,{status:200});
  });
  assert.ok(await resumed.flush());
  assert.equal(storage.size,0);
});
