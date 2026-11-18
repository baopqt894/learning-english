import {AnimationClip,AnimationMixer,QuaternionKeyframeTrack,VectorKeyframeTrack,Euler,Vector3,Quaternion} from 'three';

// Correct the imported clips in An's proportions. Keep the source feet,
// pelvis, timing and hand targets when lifting the head out of a deep bend.
const wristLimits={
 Crouch_Idle:14,Farm_Harvest:18,Farm_PlantSeed:20,Farm_Watering:16,
 Head_Nod:12,Idle_Listening:16,Idle_Talking:20,Salute:18,
 Sitting_Idle:15,Swim_Fwd:17,Swim_Idle:19,Walk_Carry:13,
};
const deg=Math.PI/180;
const ease=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};

export function refineActivityMotion(gltf,binary,{append,floats,scene,byName,rest}){
 const nodes=new Map(gltf.nodes.map((n,i)=>[n.name,i]));
 function values(index,size){
  const a=gltf.accessors[index],v=gltf.bufferViews[a.bufferView],view=new DataView(binary.buffer,binary.byteOffset,binary.byteLength);
  return Array.from({length:a.count*size},(_,i)=>view.getFloat32((v.byteOffset||0)+(a.byteOffset||0)+Math.floor(i/size)*(v.byteStride||size*4)+i%size*4,true));
 }
 const world=name=>byName.get(name).getWorldPosition(new Vector3());
 const rotation=name=>byName.get(name).getWorldQuaternion(new Quaternion());
 function setWorld(name,q){
  const b=byName.get(name);
  b.quaternion.copy(b.parent.getWorldQuaternion(new Quaternion()).invert().multiply(q)).normalize();b.updateMatrixWorld(true);
 }
 function aim(name,child,direction){
  const current=world(child).sub(world(name)).normalize();
  setWorld(name,new Quaternion().setFromUnitVectors(current,direction.clone().normalize()).multiply(rotation(name)));
 }
 function reach(side,target,pole){
  const upper='upperarm_'+side,lower='lowerarm_'+side,hand='hand_'+side;
  const start=world(upper),a=world(lower).distanceTo(start),b=world(hand).distanceTo(world(lower));
  const line=target.clone().sub(start),distance=Math.max(Math.abs(a-b)+.001,Math.min(a+b-.001,line.length()));line.normalize();
  const along=(a*a-b*b+distance*distance)/(2*distance);
  pole.addScaledVector(line,-pole.dot(line)).normalize();
  const bend=line.clone().multiplyScalar(along).addScaledVector(pole,Math.sqrt(Math.max(0,a*a-along*along)));
  aim(upper,lower,bend);aim(lower,hand,line.multiplyScalar(distance).sub(bend));
 }
 for(const clip of gltf.animations.filter(c=>c.name in wristLimits)){
  const name=clip.name,farming=name.startsWith('Farm_'),crouched=farming||name==='Crouch_Idle';
  const tracks=clip.channels.filter(c=>['translation','rotation'].includes(c.target.path)).map(c=>{
   const sampler=clip.samplers[c.sampler],path=c.target.path,bone=gltf.nodes[c.target.node].name;
   return path==='rotation'?new QuaternionKeyframeTrack(bone+'.quaternion',values(sampler.input,1),values(sampler.output,4)):
    new VectorKeyframeTrack(bone+'.position',values(sampler.input,1),values(sampler.output,3));
  });
  const source=new AnimationClip(name,-1,tracks),mixer=new AnimationMixer(scene);
  for(const [n,r] of rest){byName.get(n).quaternion.copy(r.q);byName.get(n).position.copy(r.position);}
  const action=mixer.clipAction(source).play(),count=Math.ceil(source.duration*40)+1,times=[];
  const modified=['hand_l','hand_r'];
  if(crouched||name==='Walk_Carry')modified.push('head','neck_01');
  if(crouched)modified.push('spine_03');
  if(crouched||name==='Salute')modified.push('upperarm_r','lowerarm_r','upperarm_l','lowerarm_l');
  const outputs=new Map(modified.map(n=>[n,[]]));
  for(let k=0;k<count;k++){
   // Source channels can be sparse. Reset modified bones before sampling,
   // including the last sample where the loop returns to its first pose.
   for(const n of modified)byName.get(n).quaternion.copy(rest.get(n).q);
   // AnimationMixer caches its last output. Starting a new action restores
   // constant source tracks even after the previous frame's corrections.
   mixer.stopAllAction();action.reset().play();const phase=k/(count-1);
   action.time=k===count-1?0:phase*source.duration;mixer.update(0);scene.updateMatrixWorld(true);
   const sourceHands=['l','r'].map(s=>({wrist:world('hand_'+s),elbow:world('lowerarm_'+s),q:rotation('hand_'+s)}));
   if(crouched||name==='Walk_Carry'){
    const chain=crouched?['spine_03','neck_01','head']:['neck_01','head'];
    // The harvest bends past vertical. Extract heading from the lateral
    // axis, which stays horizontal when the forward axis points into the soil.
    const rotations=chain.map(n=>rotation(n).multiply(rest.get(n).worldQ.clone().invert()));
    for(const [i,n] of chain.entries()){
     const q=rotations[i],right=new Vector3(1,0,0).applyQuaternion(q);
     const up=new Vector3(0,1,0).applyQuaternion(q),front=new Vector3(0,0,1).applyQuaternion(q);
     const max=n==='spine_03'?55:n==='neck_01'?42:32;
     const pitch=Math.max(-.08,Math.min(max*deg,Math.atan2(-front.y,up.y)));
     const yaw=Math.max(-.38,Math.min(.38,Math.atan2(-right.z,right.x)));
     const roll=Math.max(-.16,Math.min(.16,Math.asin(Math.max(-1,Math.min(1,right.y)))));
     setWorld(n,new Quaternion().setFromEuler(new Euler(pitch,yaw,roll,'YXZ')).multiply(rest.get(n).worldQ));
    }
   }
   for(const [j,side] of ['l','r'].entries()){
    const sign=side==='l'?1:-1,upper='upperarm_'+side,lower='lowerarm_'+side,hand='hand_'+side;
    const {wrist,elbow,q}=sourceHands[j];
    let desired=q;
    if(crouched){
     const engagement=ease((phase-.12)/.18)*(1-ease((phase-.7)/.20));
     const shoulder=world(upper),goal=wrist.clone();
     if(name==='Farm_PlantSeed'&&side==='r'){
      goal.lerp(shoulder.clone().add(new Vector3(-.045,-.34,.16)),engagement);
     }else if(name==='Farm_Watering'){
      // The pouring hand leads and the other steadies the weight underneath.
      goal.lerp(shoulder.clone().add(new Vector3(-sign*.065,side==='r'?-.14:-.21,.27)),engagement);
     }
     reach(side,goal,elbow.clone().sub(shoulder).add(new Vector3(sign*.045,0,-.025)));
    }
    const saluting=name==='Salute'&&side==='r';
    const salute=saluting?ease((phase-.035)/.18)*(1-ease((phase-.65)/.25)):0;
    if(saluting){
     const target=world('head').add(new Vector3(-.29,.157,.17));
     const low=world(upper).add(new Vector3(-.08,-.36,.035));
     const path=low.lerp(target,salute).add(new Vector3(-.12,0,.15).multiplyScalar(Math.sin(Math.PI*salute)));
     reach(side,path,new Vector3(-1,.35,-.18));
    }
    const forward=world(hand).sub(world(lower)).normalize();
    const bindAxis=rest.get('middle_01_'+side).world.clone().sub(rest.get(hand).world).normalize();
    const axis=bindAxis.applyQuaternion(q.clone().multiply(rest.get(hand).worldQ.clone().invert()));
    const angle=axis.angleTo(forward),limit=wristLimits[name]*deg;
    const corrected=new Quaternion().setFromUnitVectors(axis,forward);
    desired=new Quaternion().slerp(corrected,angle>1e-6?1-Math.tanh(angle/limit)*limit/angle:0).multiply(q);
    if(saluting){
     // Fingers together at the outer temple; transport the palm as the
     // elbow rises so the sustained salute does not turn back into a wave.
     const line=rest.get('middle_01_r').world.clone().sub(rest.get(hand).world).normalize();
     const normal=new Vector3(0,0,1).addScaledVector(line,-line.z).normalize();
     const turn=new Quaternion().setFromUnitVectors(line,forward);
     normal.applyQuaternion(turn);
     const palm=new Vector3(1,0,0).lerp(new Vector3(0,-.75,.66),salute);
     palm.addScaledVector(forward,-palm.dot(forward)).normalize();
     const roll=Math.atan2(forward.dot(normal.clone().cross(palm)),normal.dot(palm));
     const saluteFrame=new Quaternion().setFromAxisAngle(forward,roll).multiply(turn).multiply(rest.get(hand).worldQ);
     desired.copy(saluteFrame);
    }
    setWorld(hand,desired);
   }
   times.push(phase*source.duration);
   for(const [n,list] of outputs){
    const q=byName.get(n).quaternion.clone();
    if(list.length&&q.dot(new Quaternion().fromArray(list,list.length-4))<0)q.set(-q.x,-q.y,-q.z,-q.w);
    list.push(...q.toArray());
   }
  }
  mixer.stopAllAction();
  const input=append(floats(times),{componentType:5126,type:'SCALAR',count,min:[0],max:[source.duration]});
  for(const [n,list] of outputs){
   const node=nodes.get(n);clip.channels=clip.channels.filter(c=>c.target.node!==node||c.target.path!=='rotation');
   const output=append(floats(list),{componentType:5126,type:'VEC4',count});
   clip.channels.push({sampler:clip.samplers.length,target:{node,path:'rotation'}});clip.samplers.push({input,output,interpolation:'LINEAR'});
  }
 }
}
