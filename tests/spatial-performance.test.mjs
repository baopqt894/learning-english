import test from 'node:test';import assert from 'node:assert/strict';import * as THREE from 'three';import {spatialInstances} from '../src/lib/spatial-instances.ts';
import {COMPETITIONS,ATHLETICS_TRACK} from '../src/lib/competition-catalog.ts';
import {TRAINING_EQUIPMENT,EXPANDED_TREES} from '../src/lib/campus-districts-layout.ts';
import {canWalkCampus} from '../src/lib/campus-map.ts';
test('spatial foliage chunks preserve geometry, transforms and colours while allowing distant chunks to be culled',()=>{
 const geometry=new THREE.BoxGeometry(1,1,1),material=new THREE.MeshStandardMaterial(),source=new THREE.InstancedMesh(geometry,material,4),matrix=new THREE.Matrix4();
 [-60,-59,0,60].forEach((x,i)=>{matrix.makeTranslation(x,0,0);source.setMatrixAt(i,matrix);source.setColorAt(i,new THREE.Color().setRGB(i/4,.5,.25));});
 const chunks=spatialInstances(source,24);assert.equal(chunks.children.length,3);assert.equal(chunks.children.reduce((n,c)=>n+c.count,0),4);
 const positions=[];for(const part of chunks.children){assert.equal(part.geometry,geometry);assert.ok(part.boundingSphere);for(let i=0;i<part.count;i++){part.getMatrixAt(i,matrix);positions.push(matrix.elements[12]);}}
 assert.deepEqual(positions.sort((a,b)=>a-b),[-60,-59,0,60]);geometry.dispose();material.dispose();
});
test('the dedicated athletics course clears existing training equipment and every venue has a safe arrival',()=>{
 const overlap=(a,b)=>Math.abs(a.x-b.x)<(a.w+b.w)/2&&Math.abs(a.z-b.z)<(a.d+b.d)/2;
 for(const e of TRAINING_EQUIPMENT)assert.equal(overlap(ATHLETICS_TRACK,e),false,e.id);
 for(const tree of EXPANDED_TREES)assert.equal(overlap(ATHLETICS_TRACK,{...tree,w:.7,d:.7}),false);
 for(const competition of Object.values(COMPETITIONS))assert.ok(canWalkCampus(competition.arrival.x,competition.arrival.z),competition.id);
});
