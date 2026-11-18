import {setHandWithForearmRoll} from './an-hand-alignment.mjs';
import {AnimationClip,AnimationMixer,QuaternionKeyframeTrack,VectorKeyframeTrack,Matrix4,Vector3,Quaternion,Euler} from 'three';

/** Relax the chibi upper body, then align wrists while retaining authored leg timing. */
export function alignRunningWrists(gltf,binary,{append,floats,scene,byName,rest}){
 const names=new Map(gltf.nodes.map((n,i)=>[n.name,i]));
 function read(index){const a=gltf.accessors[index],v=gltf.bufferViews[a.bufferView],size={SCALAR:1,VEC3:3,VEC4:4}[a.type],out=[],d=new DataView(binary.buffer,binary.byteOffset,binary.byteLength);for(let i=0;i<a.count;i++)for(let k=0;k<size;k++)out.push(d.getFloat32((v.byteOffset||0)+(a.byteOffset||0)+i*(v.byteStride||size*4)+k*4,true));return out;}
 for(const clip of gltf.animations.filter(c=>['Jog','Sprint'].includes(c.name))){
  const tracks=clip.channels.filter(c=>['rotation','translation'].includes(c.target.path)).map(c=>{const s=clip.samplers[c.sampler],name=gltf.nodes[c.target.node].name;return c.target.path==='rotation'?new QuaternionKeyframeTrack(name+'.quaternion',read(s.input),read(s.output)):new VectorKeyframeTrack(name+'.position',read(s.input),read(s.output));});
  const postureNames=['spine_01','spine_02','spine_03','neck_01','head','clavicle_l','clavicle_r','lowerarm_l','lowerarm_r'];
  const postureValues=new Map(postureNames.map(name=>[name,[]]));
  const animation=new AnimationClip(clip.name,-1,tracks),mixer=new AnimationMixer(scene),action=mixer.clipAction(animation).play(),count=61,times=[],values={l:[],r:[]};
  for(let frame=0;frame<count;frame++){
   action.time=animation.duration*(frame===count-1?0:frame/(count-1));mixer.update(0);scene.updateMatrixWorld(true);times.push(animation.duration*frame/(count-1));
   const phase=frame/(count-1)*Math.PI*2,fast=clip.name==='Sprint';
   const chest=byName.get('spine_03').getWorldQuaternion(new Quaternion()).multiply(rest.get('spine_03').worldQ.clone().invert());
   const sourceYaw=new Euler().setFromQuaternion(chest,'YXZ').y;
   const yaw=Math.max(-.11,Math.min(.11,sourceYaw*.18));
   const setWorld=(name,pitch,turn,roll)=>{
    const bone=byName.get(name),desired=new Quaternion().setFromEuler(new Euler(pitch,turn,roll,'YXZ')).multiply(rest.get(name).worldQ);
    bone.quaternion.copy(bone.parent.getWorldQuaternion(new Quaternion()).invert().multiply(desired));bone.updateMatrixWorld(true);
   };
   // A small whole-torso lean replaces the exaggerated folded chest and downward head.
   const lean=(fast?11:7)*Math.PI/180,breathe=.006*Math.cos(phase*2);
   setWorld('spine_01',lean-.018+breathe,yaw*.45,.012*Math.sin(phase));
   setWorld('spine_02',lean+breathe,yaw*.75,.01*Math.sin(phase+.2));
   setWorld('spine_03',lean+.012+breathe,yaw,.008*Math.sin(phase+.35));
   setWorld('neck_01',.035,yaw*.4,.004*Math.sin(phase+.5));
   setWorld('head',.035,yaw*.35,.003*Math.sin(phase+.6));
   for(const side of ['l','r']){
    const name='clavicle_'+side,bone=byName.get(name);
    bone.quaternion.copy(rest.get(name).q);bone.updateMatrixWorld(true);
    const follow=new Quaternion().setFromEuler(new Euler(.008*Math.sin(phase*2),.055*Math.cos(phase-.15),(side==='l'?1:-1)*.008*Math.sin(phase*2)));
    const desired=follow.multiply(bone.getWorldQuaternion(new Quaternion()));
    bone.quaternion.copy(bone.parent.getWorldQuaternion(new Quaternion()).invert().multiply(desired));bone.updateMatrixWorld(true);
   }
   scene.updateMatrixWorld(true);
   for(const side of ['l','r']){
    const hand=byName.get('hand_'+side),elbow=byName.get('lowerarm_'+side),r=rest.get(hand.name);
    const axis=rest.get('middle_01_'+side).world.clone().sub(r.world).normalize();
    const palm=new Vector3(0,0,1).addScaledVector(axis,-axis.z).normalize(),thumb=palm.clone().cross(axis).normalize();if(side==='r')thumb.negate();
    const forward=hand.getWorldPosition(new Vector3()).sub(elbow.getWorldPosition(new Vector3())).normalize();
    // Neutral wrist: hand continues the forearm; thumb stays on top and palm faces the torso.
    const inward=new Vector3(side==='l'?-1:1,0,0);inward.addScaledVector(forward,-inward.dot(forward)).normalize();
    const up=inward.clone().cross(forward).multiplyScalar(side==='l'?1:-1).normalize();
    const source=new Matrix4().makeBasis(thumb,axis,palm),target=new Matrix4().makeBasis(up,forward,inward);
    const delta=new Quaternion().setFromRotationMatrix(target.multiply(source.invert())).normalize();
    const desired=delta.multiply(r.worldQ);setHandWithForearmRoll(side,desired,{byName,rest});
    const q=hand.quaternion.clone();
    const list=values[side];if(list.length&&q.dot(new Quaternion().fromArray(list,list.length-4))<0)q.set(-q.x,-q.y,-q.z,-q.w);list.push(...q.toArray());
   }
   for(const name of postureNames){const q=byName.get(name).quaternion.clone(),list=postureValues.get(name);if(list.length&&q.dot(new Quaternion().fromArray(list,list.length-4))<0)q.set(-q.x,-q.y,-q.z,-q.w);list.push(...q.toArray());}
  }
  mixer.stopAllAction();
  for(const [name,trackValues]of [...postureValues,...['l','r'].map(side=>['hand_'+side,values[side]])]){
   const node=names.get(name);clip.channels=clip.channels.filter(c=>!(c.target.node===node&&c.target.path==='rotation'));
   const input=append(floats(times),{componentType:5126,type:'SCALAR',count,min:[0],max:[animation.duration]});
   const output=append(floats(trackValues),{componentType:5126,type:'VEC4',count});
   clip.channels.push({sampler:clip.samplers.length,target:{node,path:'rotation'}});clip.samplers.push({input,output,interpolation:'LINEAR'});
  }
 }
}
