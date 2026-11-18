import {setHandWithForearmRoll} from './an-hand-alignment.mjs';
import {AnimationClip,AnimationMixer,QuaternionKeyframeTrack,VectorKeyframeTrack,Vector3,Quaternion,Euler,Matrix4} from 'three';

/** Author a balanced rest, restrained walking upper body and a small friendly wave. */
export function refineEverydayMotion(gltf,binary,{append,floats,scene,byName,rest}){
 const names=new Map(gltf.nodes.map((n,i)=>[n.name,i]));
 const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
 const read=i=>{const a=gltf.accessors[i],v=gltf.bufferViews[a.bufferView],size={SCALAR:1,VEC3:3,VEC4:4}[a.type],out=[],d=new DataView(binary.buffer,binary.byteOffset,binary.byteLength);for(let j=0;j<a.count;j++)for(let k=0;k<size;k++)out.push(d.getFloat32((v.byteOffset||0)+(a.byteOffset||0)+j*(v.byteStride||size*4)+k*4,true));return out;};
 const world=(name,q)=>{const b=byName.get(name);b.quaternion.copy(b.parent.getWorldQuaternion(new Quaternion()).invert().multiply(q));b.updateMatrixWorld(true);};
 const orient=(name,pitch=0,yaw=0,roll=0)=>world(name,new Quaternion().setFromEuler(new Euler(pitch,yaw,roll,'YXZ')).multiply(rest.get(name).worldQ));
 const point=(name,child,direction)=>world(name,new Quaternion().setFromUnitVectors(rest.get(child).world.clone().sub(rest.get(name).world).normalize(),direction.clone().normalize()).multiply(rest.get(name).worldQ));
 const allNames=gltf.skins[0].joints.map(id=>gltf.nodes[id].name);
 const upper=['spine_01','spine_02','spine_03','neck_01','head','clavicle_l','clavicle_r','upperarm_l','lowerarm_l','hand_l','upperarm_r','lowerarm_r','hand_r'];
 for(const clip of gltf.animations.filter(c=>['Idle_A','Walk','Walk_Lively','Greeting'].includes(c.name))){
  const walking=clip.name.startsWith('Walk'),greeting=clip.name==='Greeting';
  const tracks=clip.channels.filter(c=>['rotation','translation'].includes(c.target.path)).map(c=>{const s=clip.samplers[c.sampler],name=gltf.nodes[c.target.node].name;return c.target.path==='rotation'?new QuaternionKeyframeTrack(name+'.quaternion',read(s.input),read(s.output)):new VectorKeyframeTrack(name+'.position',read(s.input),read(s.output));});
  const source=new AnimationClip(clip.name,-1,tracks),mixer=new AnimationMixer(scene),action=mixer.clipAction(source).play(),duration=walking?source.duration:greeting?3.2:3.6,count=97,times=[],values=new Map((walking?upper:allNames).map(n=>[n,[]])),pelvis=[];
  for(let f=0;f<count;f++){
   const phase=f/(count-1),angle=phase*Math.PI*2;
   if(walking){action.time=source.duration*(f===count-1?0:phase);mixer.update(0);}
   else for(const [name,r]of rest){byName.get(name).position.copy(r.position);byName.get(name).quaternion.copy(r.q);}
   scene.updateMatrixWorld(true);
   const left=byName.get('foot_l').getWorldPosition(new Vector3()),right=byName.get('foot_r').getWorldPosition(new Vector3());
   const stride=walking?Math.max(-1,Math.min(1,(left.z-right.z)/.32)):0;
   const breath=.003*Math.sin(angle),lean=walking?.025:0,turn=stride*.035;
   orient('spine_01',lean+breath,turn*.3);orient('spine_02',lean+breath,turn*.6);orient('spine_03',lean,turn);
   orient('neck_01',0,turn*.3);orient('head',0,turn*.25);
   const wave=greeting?smooth(.035,.30,phase)*(1-smooth(.70,.97,phase)):0;
   for(const [side,sign]of [['l',1],['r',-1]]){
    const clav=byName.get('clavicle_'+side);clav.quaternion.copy(rest.get(clav.name).q);clav.updateMatrixWorld(true);
    // Symmetric relaxed shoulders; only arms swing opposite the legs.
    const swing=-stride*sign*(clip.name==='Walk'?.081:.065);
    const upperDirection=new Vector3(sign*.065,-.23,swing),lowerDirection=new Vector3(sign*.023,-.175,(clip.name==='Walk'?.039:.018)+swing*.55);
    const start=lowerDirection.clone().normalize();
    const waving=side==='r' ? wave : 0;
    const beat=Math.sin((phase-.25)*Math.PI*8)*waving;
    if(waving){
     upperDirection.lerp(new Vector3(-.202,-.075,.055),waving);
     // Lead the lift forward at the elbow before showing the palm. A single
     // shortest rotation between down and up swings the wrist out sideways.
     const reach=new Vector3(-.38,.06,.92).normalize();
     const raised=new Vector3(-.089,.167,.053).normalize();
     lowerDirection.copy(start).multiplyScalar((1-waving)**2)
      .addScaledVector(reach,2*waving*(1-waving)).addScaledVector(raised,waving*waving).normalize();
     lowerDirection.applyAxisAngle(new Vector3(0,0,1),.095*beat);
    }
    point('upperarm_'+side,'lowerarm_'+side,upperDirection);
    point('lowerarm_'+side,'hand_'+side,lowerDirection);

    const wrist=rest.get('hand_'+side).world;
    const axis=rest.get('middle_01_'+side).world.clone().sub(wrist).normalize();
    const palm=new Vector3(0,0,1).addScaledVector(axis,-axis.z).normalize();
    const across=palm.clone().cross(axis).multiplyScalar(sign);
    // Transport a single hand frame with the forearm. Only the twist about
    // its long axis opens the palm towards the viewer during the lift.
    const forward=lowerDirection.normalize();
    const facing=new Vector3(-sign,0,0);
    facing.addScaledVector(start,-facing.dot(start)).normalize();
    facing.applyQuaternion(new Quaternion().setFromUnitVectors(start,forward));
    if(waving){
     const front=new Vector3(0,0,1).addScaledVector(forward,-forward.z).normalize();
     const twist=Math.atan2(forward.dot(facing.clone().cross(front)),facing.dot(front));
     facing.applyAxisAngle(forward,twist*waving);
    }
    const handAxis=forward.clone().applyAxisAngle(facing,.065*beat);
    const acrossTarget=facing.clone().cross(handAxis).multiplyScalar(sign);
    const basis=new Matrix4().makeBasis(acrossTarget,handAxis,facing);
    const delta=new Quaternion().setFromRotationMatrix(basis.multiply(new Matrix4().makeBasis(across,axis,palm).invert()));
    const q=delta.multiply(rest.get('hand_'+side).worldQ);
    setHandWithForearmRoll(side,q.normalize(),{byName,rest});
   }
   times.push(phase*duration);pelvis.push(...byName.get('pelvis').position.toArray());
   for(const [name,list]of values){const q=byName.get(name).quaternion.clone();if(list.length&&q.dot(new Quaternion().fromArray(list,list.length-4))<0)q.set(-q.x,-q.y,-q.z,-q.w);list.push(...q.toArray());}
  }
  mixer.stopAllAction();
  if(!walking){clip.channels=[];clip.samplers=[];}
  const input=append(floats(times),{componentType:5126,type:'SCALAR',count,min:[0],max:[duration]});
  for(const [name,list]of values){
   const node=names.get(name);clip.channels=clip.channels.filter(c=>!(c.target.node===node&&c.target.path==='rotation'));
   const output=append(floats(list),{componentType:5126,type:'VEC4',count});clip.channels.push({sampler:clip.samplers.length,target:{node,path:'rotation'}});clip.samplers.push({input,output,interpolation:'LINEAR'});
  }
  if(!walking){const output=append(floats(pelvis),{componentType:5126,type:'VEC3',count});clip.channels.push({sampler:clip.samplers.length,target:{node:names.get('pelvis'),path:'translation'}});clip.samplers.push({input,output,interpolation:'LINEAR'});}
 }
}
