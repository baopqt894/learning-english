import test from 'node:test';
import assert from 'node:assert/strict';
import {createVegetableGeometry} from '../src/lib/farm-craft.ts';

test('garden crops have finite colored geometry, distinct heights and fit their planting cells',()=>{
  const heights={};
  for(const kind of ['lettuce','cabbage','carrot','bean','tomato']){
    const g=createVegetableGeometry(kind);g.computeBoundingBox();
    for(const name of ['position','normal','color'])assert.ok([...g.attributes[name].array].every(Number.isFinite),`${kind} ${name}`);
    const {min,max}=g.boundingBox;
    assert.ok(min.y<=0,`${kind} needs a stem/root reaching the soil`);
    assert.ok(max.x-min.x<.8&&max.z-min.z<.8,`${kind} spills outside its cell`);
    assert.equal(g.attributes.color.count,g.attributes.position.count);
    heights[kind]=max.y-min.y;g.dispose();
  }
  assert.ok(heights.bean>heights.carrot&&heights.carrot>heights.lettuce);
  assert.ok(heights.cabbage>heights.lettuce);
});
