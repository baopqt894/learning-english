import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {Texture,Vector3,Quaternion,AnimationMixer} from 'three';

const loader=new GLTFLoader();loader.register(()=>({name:'test-texture',loadTexture:()=>Promise.resolve(new Texture())}));
async function load(path){const b=await readFile(new URL(path,import.meta.url));return {json:JSON.parse(b.subarray(20,20+b.readUInt32LE(12))),gltf:await loader.parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'')};}
const source=await load('../assets/mesh2motion-inputs/cadet-original.glb');
const trial=await load('../public/models/an-motion-preview/an.glb');
let original,mesh;source.gltf.scene.traverse(o=>{if(o.isMesh)original=o;});trial.gltf.scene.traverse(o=>{if(o.isSkinnedMesh&&!o.name.startsWith('articulated_hand_'))mesh=o;});

test('An trial keeps the input surface, UVs and original PBR textures',()=>{
 for(const name of ['position','uv']){
  const a=original.geometry.attributes[name],b=mesh.geometry.attributes[name];assert.ok(b.count>=a.count);
  for(let i=0;i<a.count;i++)for(let k=0;k<a.itemSize;k++)assert.ok(Math.abs(a.getComponent(i,k)-b.getComponent(i,k))<1e-7);
 }
 const before=original.geometry,after=mesh.geometry;
 const splits=new Set(mesh.userData.splitSleeveFaces);
 const pos=(g,i)=>new Vector3().fromBufferAttribute(g.attributes.position,i);
 const uv=(g,i)=>new Vector3(g.attributes.uv.getX(i),g.attributes.uv.getY(i),0);
 const area=([a,b,c])=>b.clone().sub(a).cross(c.clone().sub(a));
 let cursor=0;
 assert.ok(splits.size>0);
 for(let i=0;i<before.index.count;i+=3){
  const ids=[0,1,2].map(k=>before.index.getX(i+k));
  const corners=ids.map(id=>pos(before,id)),coords=ids.map(id=>uv(before,id));
  const pieces=splits.has(i/3)?3:1,sum=new Vector3();
  for(let tri=0;tri<pieces;tri++){
   const target=[0,1,2].map(()=>after.index.getX(cursor++));
   const points=target.map(id=>pos(after,id));
   sum.add(area(points));
   for(const [k,v] of points.entries()){
    const tUV=uv(after,target[k]);
    if(pieces===1){
     assert.ok(v.distanceTo(corners[k])<1e-7 && tUV.distanceTo(coords[k])<1e-7);continue;
    }
    assert.ok(corners.some((a,j)=>{
     const next=(j+1)%3,edge=corners[next].clone().sub(a);
     const t=Math.max(0,Math.min(1,v.clone().sub(a).dot(edge)/(edge.lengthSq()||1)));
     return a.clone().addScaledVector(edge,t).distanceTo(v)<2e-7 &&
      coords[j].clone().lerp(coords[next],t).distanceTo(tUV)<2e-5;
    }),'cut stays on original textured edge');
   }
  }
  assert.ok(sum.distanceTo(area(corners))<1e-7);
 }
 for(;cursor<after.index.count;cursor+=3){
  assert.ok(area([0,1,2].map(k=>pos(after,after.index.getX(cursor+k)))).length()<1e-12,'folded lining in comparison pose');
 }
 assert.deepEqual(trial.json.materials[0],source.json.materials[0]);
 assert.deepEqual(trial.json.textures,source.json.textures);
 assert.deepEqual(trial.json.images.map(i=>i.uri),['color-original.jpg','orm-original.jpg','normal-original.png'].map(f=>'../tripo-h31/'+f));
});

test('both animated arms share the sleeve edge throughout every clip',()=>{
 const scene=trial.gltf.scene,mixer=new AnimationMixer(scene);
 const arms=scene.children.filter(o=>o.userData.sleeveAttachment);
 assert.equal(arms.length,2);
 for(const clip of trial.gltf.animations){
  mixer.stopAllAction();const action=mixer.clipAction(clip).play();
  for(let k=0;k<8;k++){
   action.time=clip.duration*k/8;mixer.update(0);scene.updateMatrixWorld(true);
   for(const arm of arms){
    assert.ok(arm.userData.sleeveAttachment.length>12);
    for(const [a,b] of arm.userData.sleeveAttachment){
     const gap=mesh.getVertexPosition(a,new Vector3()).distanceTo(arm.getVertexPosition(b,new Vector3()));
     assert.ok(gap<1e-6,clip.name+' sleeve gap '+gap);
    }
   }
  }
 }
 mixer.stopAllAction();
});

test('face, hair, ears and cap remain a rigid original shape throughout all 22 clips',()=>{
 const p=mesh.geometry.attributes.position,w=mesh.geometry.attributes.skinWeight,j=mesh.geometry.attributes.skinIndex;
 const head=mesh.skeleton.bones.findIndex(b=>b.name==='head');const ids=[];
 for(let i=0;i<p.count;i++){
  let total=0;for(let k=0;k<4;k++)total+=w.getComponent(i,k);assert.ok(Math.abs(total-1)<1e-6);
  if(p.getY(i)>=1.12){assert.equal(j.getX(i),head);assert.equal(w.getX(i),1);ids.push(i);}
 }
 assert.ok(ids.length>4000);assert.equal(trial.gltf.animations.length,22);assert.ok(trial.gltf.animations.some(a=>a.name==='Walk_Original'));
 const mixer=new AnimationMixer(trial.gltf.scene),a=new Vector3(),b=new Vector3();
 for(const clip of trial.gltf.animations){
  mixer.stopAllAction();mesh.skeleton.pose();const action=mixer.clipAction(clip).play();
  for(let step=0;step<12;step++){
   action.time=clip.duration*step/12;mixer.update(0);trial.gltf.scene.updateMatrixWorld(true);mesh.skeleton.update();
   for(let n=0;n<ids.length;n+=47){
    const i=ids[n],k=ids[(n+127)%ids.length];a.fromBufferAttribute(p,i);b.fromBufferAttribute(p,k);const rest=a.distanceTo(b);
    mesh.applyBoneTransform(i,a);mesh.applyBoneTransform(k,b);assert.ok(Math.abs(a.distanceTo(b)-rest)<1e-5,clip.name+' must not squash the smile');
   }
  }
 }
 mixer.stopAllAction();mesh.skeleton.pose();trial.gltf.scene.updateMatrixWorld(true);mesh.skeleton.update();
 for(let i=0;i<p.count;i+=17){a.fromBufferAttribute(p,i);b.copy(a);mesh.applyBoneTransform(i,b);assert.ok(a.distanceTo(b)<1e-5,'bind pose must match original');}
});

test('archived IK comparison loops cleanly, keeps a planted foot, and avoids sinking soles',()=>{
 const clip=trial.gltf.animations.find(a=>a.name==='Walk_IK'),mixer=new AnimationMixer(trial.gltf.scene),p=mesh.geometry.attributes.position;
 for(const track of clip.tracks){const size=track.getValueSize();for(let k=0;k<size;k++)assert.ok(Math.abs(track.values[k]-track.values[track.values.length-size+k])<1e-6,'loop seam');}
 mesh.skeleton.pose();const action=mixer.clipAction(clip).play();
 for(let frame=0;frame<60;frame++){
  action.time=clip.duration*frame/60;mixer.update(0);trial.gltf.scene.updateMatrixWorld(true);mesh.skeleton.update();
  const soles=[Infinity,Infinity];
  for(let i=0;i<p.count;i++){if(p.getY(i)>.12)continue;const side=p.getX(i)<0?0:1;const v=mesh.applyBoneTransform(i,new Vector3().fromBufferAttribute(p,i));soles[side]=Math.min(soles[side],v.y);}
  assert.ok(Math.min(...soles)>-.01,'feet must not sink into the ground');
  assert.ok(Math.min(...soles)<.025,'at least one foot must stay planted');
  assert.ok(Math.max(...soles)<.09,'low, relaxed foot clearance');
 }
 mixer.stopAllAction();
});

test('motion does not tear short mesh edges into spikes',()=>{
 const p=mesh.geometry.attributes.position,indices=mesh.geometry.index,mixer=new AnimationMixer(trial.gltf.scene),restA=new Vector3(),restB=new Vector3();
 let maxRatio=0,worst;
 for(const clip of trial.gltf.animations.filter(c=>['Walk','Idle_A','Greeting'].includes(c.name))){
  mixer.stopAllAction();mesh.skeleton.pose();const action=mixer.clipAction(clip).play();
  for(let step=0;step<8;step++){
   action.time=clip.duration*step/8;mixer.update(0);trial.gltf.scene.updateMatrixWorld(true);mesh.skeleton.update();
   const positions=Array.from({length:p.count},(_,i)=>mesh.applyBoneTransform(i,new Vector3().fromBufferAttribute(p,i)));
   for(let edge=0;edge<indices.count;edge+=3)for(let k=0;k<3;k++){
    const a=indices.getX(edge+k),b=indices.getX(edge+(k+1)%3);restA.fromBufferAttribute(p,a);restB.fromBufferAttribute(p,b);const length=restA.distanceTo(restB);
    if(length>.004){const ratio=positions[a].distanceTo(positions[b])/length;if(ratio>maxRatio){maxRatio=ratio;worst={clip:clip.name,step,a:restA.toArray(),b:restB.toArray()};}}
   }
  }
 }
 console.log(worst);
 assert.ok(maxRatio<5,`Worst local edge stretch ${maxRatio.toFixed(2)}x`);
 console.log('An motion maximum edge stretch',maxRatio.toFixed(2));
});

test('all animated poses use the articulated hand surface with normalized skin weights',()=>{
 const fists=[];trial.gltf.scene.traverse(o=>{if(o.isSkinnedMesh&&o.name.startsWith('articulated_hand_'))fists.push(o);});
 assert.equal(fists.length,2);
 const delta=mesh.geometry.morphAttributes.position[0],p=mesh.geometry.attributes.position;
 let changed=0;
 for(let i=0;i<p.count;i++)if(new Vector3().fromBufferAttribute(delta,i).length()>1e-7){
  changed++;assert.ok(Math.abs(p.getX(i))>.23&&p.getY(i)>=.44&&p.getY(i)<=.91,'corrective stays inside the arm and short sleeve region');
 }
 assert.ok(changed>100);
 for(const fist of fists){
  const g=fist.geometry,uv=g.attributes.uv,j=g.attributes.skinIndex,w=g.attributes.skinWeight;
  assert.ok(g.attributes.position.count<8000,'compact shared-vertex fist mesh');
  const side=fist.name.slice(-1),used=new Set();
  for(let i=0;i<j.count;i++){
   let total=0;for(let k=0;k<4;k++){total+=w.getComponent(i,k);if(w.getComponent(i,k)>.001){const name=fist.skeleton.bones[j.getComponent(i,k)].name;assert.ok(name.endsWith('_'+side));used.add(name);}}assert.ok(Math.abs(total-1)<1e-6);
   assert.equal(uv.getX(i),uv.getX(0));assert.equal(uv.getY(i),uv.getY(0));
   assert.ok(Number.isFinite(g.morphAttributes.position[0].getX(i)));
  }
  assert.ok(used.size>=12,'finger bones must have real skin influence');
 }
 const mixer=new AnimationMixer(trial.gltf.scene);
 for(const name of ['Jog','Idle_A','Sprint','Greeting','Walk']){
  mixer.stopAllAction();mixer.clipAction(trial.gltf.animations.find(c=>c.name===name)).play();mixer.update(.4);
  for(const object of [mesh,...fists])assert.equal(object.morphTargetInfluences[0],1,name);
 }
 mixer.stopAllAction();
});


test('running wrists follow the forearm with thumbs up and palms inward on both sides',()=>{
 const scene=trial.gltf.scene;mesh.skeleton.pose();scene.updateMatrixWorld(true);
 const bone=n=>scene.getObjectByName(n),world=n=>bone(n).getWorldPosition(new Vector3());
 const rest={};
 for(const side of ['l','r']){
  const axis=world('middle_01_'+side).sub(world('hand_'+side)).normalize(),palm=new Vector3(0,0,1).addScaledVector(axis,-axis.z).normalize(),thumb=palm.clone().cross(axis).normalize();if(side==='r')thumb.negate();
  rest[side]={axis,palm,thumb,q:bone('hand_'+side).getWorldQuaternion(new Quaternion())};
 }
 assert.equal(mesh.skeleton.bones.length,80);
 const mixer=new AnimationMixer(scene);
 for(const name of ['Jog','Sprint']){
  mixer.stopAllAction();const clip=trial.gltf.animations.find(c=>c.name===name),action=mixer.clipAction(clip).play();
  for(let frame=0;frame<60;frame++){
   action.time=clip.duration*frame/60;mixer.update(0);scene.updateMatrixWorld(true);
   for(const side of ['l','r']){
    const forward=world('hand_'+side).sub(world('lowerarm_'+side)).normalize(),inward=new Vector3(side==='l'?-1:1,0,0);inward.addScaledVector(forward,-inward.dot(forward)).normalize();const up=inward.clone().cross(forward).multiplyScalar(side==='l'?1:-1).normalize();
    const change=bone('hand_'+side).getWorldQuaternion(new Quaternion()).multiply(rest[side].q.clone().invert());
    assert.ok(rest[side].axis.clone().applyQuaternion(change).dot(forward)>.995,`${name} wrist should stay straight`);
    assert.ok(rest[side].thumb.clone().applyQuaternion(change).dot(up)>.995,`${name} thumb must remain on top`);
    assert.ok(rest[side].palm.clone().applyQuaternion(change).x*(side==='l'?-1:1)>.1,`${name} frame ${frame} ${side} palm ${rest[side].palm.clone().applyQuaternion(change).toArray()} should face body`);
   }
  }
 }
 mixer.stopAllAction();
});

test('running keeps the upper body upright with a level gaze and moving shoulders',()=>{
 const scene=trial.gltf.scene,mixer=new AnimationMixer(scene),world=n=>scene.getObjectByName(n).getWorldPosition(new Vector3());
 for(const name of ['Jog','Sprint']){
  mixer.stopAllAction();const clip=trial.gltf.animations.find(c=>c.name===name),action=mixer.clipAction(clip).play(),shoulders={l:[],r:[]};
  for(let frame=0;frame<60;frame++){
   action.time=clip.duration*frame/60;mixer.update(0);scene.updateMatrixWorld(true);
   const torso=world('neck_01').sub(world('pelvis')),lean=Math.atan2(torso.z,torso.y)*180/Math.PI;
   assert.ok(lean>2&&lean<(name==='Jog'?9:16),`${name} torso lean ${lean}`);
   const forward=new Vector3(0,0,1).applyQuaternion(scene.getObjectByName('head').getWorldQuaternion(new Quaternion()));
   assert.ok(Math.abs(forward.y)<.08,'gaze stays near horizontal');
   for(const side of ['l','r'])shoulders[side].push(scene.getObjectByName('clavicle_'+side).quaternion.clone());
  }
  for(const side of ['l','r']){
   const variation=Math.max(...shoulders[side].map(q=>q.angleTo(shoulders[side][0])));
   assert.ok(variation>.05&&variation<.5,`${name} ${side} shoulder variation ${variation} should remain relaxed`);
  }
 }
 mixer.stopAllAction();
});

test('idle shoulders stay level and the friendly wave returns to a planted relaxed pose',()=>{
 const scene=trial.gltf.scene,mixer=new AnimationMixer(scene),world=n=>scene.getObjectByName(n).getWorldPosition(new Vector3());
 let neutral;
 for(const name of ['Idle_A','Greeting']){
  mixer.stopAllAction();const clip=trial.gltf.animations.find(c=>c.name===name),action=mixer.clipAction(clip).play();
  let feet,raised=false;
  for(let frame=0;frame<=60;frame++){
   action.time=clip.duration*frame/60;mixer.update(0);scene.updateMatrixWorld(true);
   assert.ok(Math.abs(world('upperarm_l').y-world('upperarm_r').y)<.008,'shoulders must remain level');
   const pair=['foot_l','foot_r'].map(world);if(!feet)feet=pair;else pair.forEach((p,i)=>assert.ok(p.distanceTo(feet[i])<.001,'feet remain planted'));
   const wrist=world('hand_r');if(name==='Idle_A'&&frame===0)neutral=wrist;
   if(name==='Greeting'){
    if(wrist.y>neutral.y+.25&&world('middle_01_r').y>world('upperarm_r').y+.04)raised=true;
    if(frame===0||frame===60)assert.ok(wrist.distanceTo(neutral)<.001,'wave starts and finishes in relaxed pose');
   }
  }
  if(name==='Greeting')assert.ok(raised,'wave must actually raise the hand');
 }
 mixer.stopAllAction();
});

test('articulated palms face inward and every finger moves its own surface',()=>{
 const scene=trial.gltf.scene,mixer=new AnimationMixer(scene),hands=[];scene.traverse(o=>{if(o.isSkinnedMesh&&o.name.startsWith('articulated_hand_'))hands.push(o);});
 mesh.skeleton.pose();scene.updateMatrixWorld(true);
 const frames={};for(const side of ['l','r']){
  const hand=scene.getObjectByName('hand_'+side),axis=scene.getObjectByName('middle_01_'+side).getWorldPosition(new Vector3()).sub(hand.getWorldPosition(new Vector3())).normalize();
  frames[side]={q:hand.getWorldQuaternion(new Quaternion()),palm:new Vector3(0,0,1).addScaledVector(axis,-axis.z).normalize()};
 }
 for(const name of ['Idle_A','Walk','Greeting']){
  mixer.stopAllAction();const clip=trial.gltf.animations.find(c=>c.name===name),action=mixer.clipAction(clip).play();
  for(let frame=0;frame<16;frame++){
   action.time=clip.duration*frame/16;mixer.update(0);scene.updateMatrixWorld(true);
   for(const side of ['l','r']){
    const f=frames[side],change=scene.getObjectByName('hand_'+side).getWorldQuaternion(new Quaternion()).multiply(f.q.clone().invert()),palm=f.palm.clone().applyQuaternion(change);
    if(name!=='Greeting'||side==='l')assert.ok(palm.x*(side==='l'?-1:1)>.9);
    if(name==='Greeting'&&side==='r'&&frame>=5&&frame<=11)assert.ok(palm.z>.9);
   }
  }
 }
 mixer.stopAllAction();mesh.skeleton.pose();hands.forEach(h=>h.morphTargetInfluences[0]=1);scene.updateMatrixWorld(true);
 for(const hand of hands)for(const digit of ['index','middle','ring','little','thumb']){
  const side=hand.name.slice(-1),bone=scene.getObjectByName(digit+'_2_'+side),q=bone.quaternion.clone(),indices=hand.geometry.attributes.skinIndex,weights=hand.geometry.attributes.skinWeight;
  const affected=new Set(hand.skeleton.bones.map((b,i)=>b.name===digit+'_2_'+side||b.name===digit+'_3_'+side?i:-1));affected.delete(-1);
  hand.skeleton.update();const before=Array.from({length:indices.count},(_,i)=>hand.getVertexPosition(i,new Vector3()));
  bone.quaternion.multiply(new Quaternion().setFromAxisAngle(new Vector3(1,0,0),.25));scene.updateMatrixWorld(true);hand.skeleton.update();let moved=0,untouched=0;
  for(let i=0;i<indices.count;i++){
   const displacement=hand.getVertexPosition(i,new Vector3()).distanceTo(before[i]);let influence=0;for(let k=0;k<4;k++)if(affected.has(indices.getComponent(i,k)))influence+=weights.getComponent(i,k);
   if(influence>.5&&displacement>.001)moved++;
   if(influence===0){assert.ok(displacement<1e-6,'other fingers must not move');untouched++;}
  }
  assert.ok(moved>10&&untouched>100,`${side} ${digit} must articulate independently`);bone.quaternion.copy(q);scene.updateMatrixWorld(true);
 }
});

test('the elbow surface carries its volume through a wave on both sides',()=>{
 const scene=trial.gltf.scene,mixer=new AnimationMixer(scene);
 const clip=trial.gltf.animations.find(c=>c.name==='Greeting'),action=mixer.clipAction(clip).play();
 for(const side of ['l','r']){
  const arm=scene.getObjectByName('articulated_hand_'+side),g=arm.geometry,weights=g.attributes.skinWeight,indices=g.attributes.skinIndex;
  const joint=arm.skeleton.bones.findIndex(b=>b.name==='elbow_bend_'+side),ring=[];
  for(let i=0;i<weights.count;i++)for(let k=0;k<4;k++)if(indices.getComponent(i,k)===joint&&weights.getComponent(i,k)>.985)ring.push(i);
  assert.ok(ring.length>=16,'continuous elbow ring');
  let restDiameter;
  for(let frame=0;frame<=36;frame++){
   action.time=clip.duration*frame/36;mixer.update(0);scene.updateMatrixWorld(true);
   const start=arm.getVertexPosition(ring[0],new Vector3());
   const diameter=Math.max(...ring.map(i=>start.distanceTo(arm.getVertexPosition(i,new Vector3()))));
   restDiameter??=diameter;assert.ok(diameter>.07&&Math.abs(diameter/restDiameter-1)<.04,'elbow collapses during greeting');
  }
 }
 mixer.stopAllAction();
});

test('the waving palm tracks the forearm through lift, wave and lowering',()=>{
 const scene=trial.gltf.scene,arm=scene.getObjectByName('articulated_hand_r');
 const world=name=>scene.getObjectByName(name+'_r').getWorldPosition(new Vector3());
 mesh.skeleton.pose();scene.updateMatrixWorld(true);
 const wrist=world('hand'),elbow=world('lowerarm'),axis=wrist.clone().sub(elbow);
 const g=arm.geometry,mid=[];
 for(let i=0;i<g.attributes.position.count;i++){
  const offset=new Vector3().fromBufferAttribute(g.morphAttributes.position[0],i);
  const fraction=-offset.dot(axis)/axis.lengthSq();
  if(fraction>.45&&fraction<.55)mid.push(i);
 }
 assert.ok(mid.length>=16);
 const mixer=new AnimationMixer(scene),clip=trial.gltf.animations.find(c=>c.name==='Greeting'),action=mixer.clipAction(clip).play();
 let previous;
 for(let i=0;i<=192;i++){
  action.time=clip.duration*i/192;mixer.update(0);scene.updateMatrixWorld(true);
  const wrist=world('hand'),elbow=world('lowerarm'),forearm=wrist.clone().sub(elbow).normalize();
  const hand=world('middle_01').sub(wrist).normalize();
  // At elbow height the hand should pass in front of the body. A wide
  // sideways sweep can have a perfectly straight wrist and still look twisted.
  if(Math.abs(forearm.y)<.25)assert.ok(forearm.z>Math.abs(forearm.x),'wave lifts through the front of the elbow');
  assert.ok(forearm.angleTo(hand)<5*Math.PI/180,'wrist bends away from its own forearm');
  if(previous)assert.ok(previous.angleTo(hand)<6*Math.PI/180,'hand snaps between samples');
  previous=hand;
  const centre=new Vector3();for(const v of mid)centre.add(arm.getVertexPosition(v,new Vector3()));
  centre.divideScalar(mid.length).sub(elbow);
  assert.ok(centre.cross(forearm).length()<.012,'visible forearm drifts off the bone');
 }
 mixer.stopAllAction();
});

test('activity hands follow the forearm without flips and clear the head on the high jack',()=>{
 const scene=trial.gltf.scene,mixer=new AnimationMixer(scene);
 const archive=new Set(['Walk_IK','Walk_Original']);
 for(const clip of trial.gltf.animations){
  const action=mixer.clipAction(clip).play(),previous={};
  for(let i=0;i<=120;i++){
   action.time=clip.duration*i/120;mixer.update(0);scene.updateMatrixWorld(true);
   for(const side of ['r','l']){
    const point=n=>scene.getObjectByName(n+'_'+side).getWorldPosition(new Vector3());
    const wrist=point('hand'),arm=wrist.clone().sub(point('lowerarm')),hand=point('middle_01').sub(wrist);
    const q=scene.getObjectByName('hand_'+side).getWorldQuaternion(new Quaternion());
    const angle=arm.angleTo(hand)*180/Math.PI;
    assert.ok(angle<(archive.has(clip.name)?40:21),clip.name+' wrist '+angle);
    if(previous[side])assert.ok(previous[side].angleTo(q)<.45,clip.name+' hand snaps');
    previous[side]=q;
    if(clip.name==='Jumping_Jacks'){
     const head=scene.getObjectByName('head').getWorldPosition(new Vector3()),tip=point('middle_tip');
     if(tip.y>head.y+.18)assert.ok(Math.abs(tip.x-head.x)>.34,'fingertips inside the cap');
    }
   }
  }
  mixer.stopAllAction();
 }
});

test('both bare arms fill the original sleeve in front and side views',()=>{
 const scene=trial.gltf.scene;mesh.skeleton.pose();scene.updateMatrixWorld(true);
 const at=name=>scene.getObjectByName(name).getWorldPosition(new Vector3());
 const scan=original.geometry.attributes.position;
 const originalPoints=Array.from({length:scan.count},(_,i)=>new Vector3().fromBufferAttribute(scan,i));
 for(const side of ['l','r']){
  const g=scene.getObjectByName('articulated_hand_'+side).geometry;
  const points=Array.from({length:g.attributes.position.count},(_,i)=>new Vector3().fromBufferAttribute(g.attributes.position,i)
   .add(new Vector3().fromBufferAttribute(g.morphAttributes.position[0],i)));
  const wrist=at('hand_'+side),axis=wrist.clone().sub(at('lowerarm_'+side)).normalize();
  const depth=new Vector3(0,0,1).addScaledVector(axis,-axis.z).normalize(),across=depth.clone().cross(axis);
  for(const along of [-.075,-.16]){
   const centre=wrist.clone().addScaledVector(axis,along);
   function diameter(vertices,dir){
    const section=vertices.map(v=>v.clone().sub(centre)).filter(v=>Math.abs(v.dot(axis))<.009&&v.length()<.105);
    const radii=section.map(v=>v.dot(dir));
    assert.ok(radii.length>=6);return Math.max(...radii)-Math.min(...radii);
   }
   for(const dir of [across,depth]){
    const ratio=diameter(points,dir)/diameter(originalPoints,dir);
    assert.ok(ratio>.87&&ratio<1.16,side+' arm section '+along+' ratio '+ratio);
   }
  }
 }
});

test('jumping jack keeps the soles planted through compression and leaves the ground twice',()=>{
 const scene=trial.gltf.scene,mixer=new AnimationMixer(scene);
 const clip=trial.gltf.animations.find(c=>c.name==='Jumping_Jacks'),action=mixer.clipAction(clip).play();
 const base=mesh.geometry.attributes.position;
 const ids=Array.from({length:base.count},(_,i)=>i).filter(i=>base.getY(i)<.07);
 const foot=scene.getObjectByName('foot_l'),current=new Vector3(),last=new Vector3();
 let flights=0,wasAirborne=false,wasPlanted=false;
 for(let i=0;i<=96;i++){
  action.time=clip.duration*i/96;mixer.update(0);scene.updateMatrixWorld(true);
  const soles=[Infinity,Infinity];for(const id of ids){
   const side=Number(base.getX(id)>0);
   soles[side]=Math.min(soles[side],mesh.getVertexPosition(id,current).y);
  }
  assert.ok(Math.min(...soles)>-.004 && Math.abs(soles[0]-soles[1])<.005);
  const airborne=Math.min(...soles)>.045,planted=Math.max(...soles)<.004;
  if(airborne&&!wasAirborne)flights++;
  foot.getWorldPosition(current);
  if(planted&&wasPlanted)assert.ok(current.distanceTo(last)<.001,'foot slides on the floor');
  last.copy(current);wasPlanted=planted;wasAirborne=airborne;
 }
 mixer.stopAllAction();assert.equal(flights,2);
});

test('An alternates low swing and planted support in the everyday walk',()=>{
 const mixer=new AnimationMixer(trial.gltf.scene),clip=trial.gltf.animations.find(c=>c.name==='Walk');
 const p=mesh.geometry.attributes.position,shoe=[[],[]],peak=[0,0];
 for(let i=0;i<p.count;i++)if(p.getY(i)<.12)shoe[Number(p.getX(i)>0)].push(i);
 mesh.skeleton.pose();
 const action=mixer.clipAction(clip).play(),v=new Vector3();
 for(let i=0;i<96;i++){
  action.time=clip.duration*i/96;mixer.update(0);trial.gltf.scene.updateMatrixWorld(true);
  const low=shoe.map(ids=>ids.reduce((h,id)=>Math.min(h,mesh.getVertexPosition(id,v).y),Infinity));
  assert.ok(Math.min(...low)>-.003 && Math.min(...low)<.004,'a shoe rolls on the ground');
  for(let side=0;side<2;side++)peak[side]=Math.max(peak[side],low[side]);
  if(i===30||i===78)assert.ok(low[i===30?0:1]>.055,'alternating foot passes');
 }
 assert.ok(peak.every(y=>y>.055&&y<.07));mixer.stopAllAction();
});
