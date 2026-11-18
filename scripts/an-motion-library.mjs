import {readFile} from 'node:fs/promises';
import {Bone,Group,Vector3,Quaternion} from 'three';
import {buildContactWalk} from './an-contact-walk.mjs';
import {buildJumpingJack} from './an-jumping-jack.mjs';
import {refineEverydayMotion} from './an-everyday-motion.mjs';
import {alignRunningWrists} from './an-running-wrists.mjs';
import {refineActivityMotion} from './an-activity-motion.mjs';
import {addFistPoses} from './an-fist-poses.mjs';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'meshoptimizer';

/** Real exported M2M clips plus an An-specific, low-step walk solved with leg IK. */
export async function addAnMotionLibrary(gltf,input){
 const chunks=[input];let length=input.length;
 function append(bytes,definition){
  const padded=Buffer.alloc(Math.ceil(bytes.length/4)*4);padded.set(bytes);chunks.push(padded);
  const view=gltf.bufferViews.length;gltf.bufferViews.push({buffer:0,byteOffset:length,byteLength:bytes.length});length+=padded.length;
  const accessor=gltf.accessors.length;gltf.accessors.push({...definition,bufferView:view,byteOffset:0});return accessor;
 }
 const file=await readFile('assets/mesh2motion-exports/an-first-trial.glb'),jl=file.readUInt32LE(12),source=JSON.parse(file.subarray(20,20+jl)),binary=file.subarray(28+jl);
 const targets=new Map(gltf.nodes.map((n,i)=>[n.name,i])),copied=new Map();
 function copyAccessor(index){
  if(copied.has(index))return copied.get(index);
  const a=source.accessors[index],view=source.bufferViews[a.bufferView];
  const components={SCALAR:1,VEC3:3,VEC4:4}[a.type],width={5126:4,5123:2}[a.componentType],size=components*width;
  const bytes=Buffer.alloc(a.count*size);
  for(let i=0;i<a.count;i++)binary.copy(bytes,i*size,(view.byteOffset||0)+(a.byteOffset||0)+i*(view.byteStride||size),(view.byteOffset||0)+(a.byteOffset||0)+i*(view.byteStride||size)+size);
  const result=append(bytes,a);copied.set(index,result);return result;
 }
 // These exports share M2M bone names and the same .72 pelvis scale.
 gltf.animations=source.animations.map(animation=>({
  name:animation.name==='Walk'?'Walk_Original':animation.name,
  samplers:animation.samplers.map(s=>({...s,input:copyAccessor(s.input),output:copyAccessor(s.output)})),
  channels:animation.channels.filter(c=>targets.has(source.nodes[c.target.node].name)).map(c=>({...c,target:{...c.target,node:targets.get(source.nodes[c.target.node].name)}})),
 }));

 const nodes=gltf.nodes.map(n=>{const b=new Bone();b.name=n.name;b.position.fromArray(n.translation||[0,0,0]);b.quaternion.fromArray(n.rotation||[0,0,0,1]);b.scale.fromArray(n.scale||[1,1,1]);return b;});
 const scene=new Group(),hasParent=new Set();gltf.nodes.forEach((n,i)=>n.children?.forEach(child=>{nodes[i].add(nodes[child]);hasParent.add(child);}));nodes.forEach((n,i)=>{if(!hasParent.has(i))scene.add(n);});scene.updateMatrixWorld(true);
 const byName=new Map(nodes.map(n=>[n.name,n])),rest=new Map(nodes.map(n=>[n.name,{position:n.position.clone(),q:n.quaternion.clone(),world:n.getWorldPosition(new Vector3()),worldQ:n.getWorldQuaternion(new Quaternion())}]));
 const bone=name=>byName.get(name),frameCount=61,duration=1.28,rotationTracks=new Map(),pelvisPositions=[],times=[];
 const joints=gltf.skins[0].joints.map(i=>gltf.nodes[i].name);
 joints.forEach(name=>rotationTracks.set(name,[]));
 const axisX=new Vector3(1,0,0),axisY=new Vector3(0,1,0);
 function worldQ(name,q){const b=bone(name),parent=b.parent.getWorldQuaternion(new Quaternion()).invert();b.quaternion.copy(parent.multiply(q));b.updateMatrixWorld(true);}
 function pointBone(name,child,direction){
  const original=rest.get(child).world.clone().sub(rest.get(name).world).normalize();
  const delta=new Quaternion().setFromUnitVectors(original,direction.clone().normalize());worldQ(name,delta.multiply(rest.get(name).worldQ));
 }
 function pelvisAt(position){bone('pelvis').position.copy(bone('pelvis').parent.worldToLocal(position.clone()));scene.updateMatrixWorld(true);}
 function placeFoot(suffix,target){
  const hip=bone('thigh_'+suffix).getWorldPosition(new Vector3());
  const upper=rest.get('thigh_'+suffix).world.distanceTo(rest.get('calf_'+suffix).world),lower=rest.get('calf_'+suffix).world.distanceTo(rest.get('foot_'+suffix).world);
  const direction=target.clone().sub(hip),distance=Math.min(direction.length(),upper+lower-.001);direction.normalize();
  const along=(upper*upper-lower*lower+distance*distance)/(2*distance),bend=Math.sqrt(Math.max(0,upper*upper-along*along));
  const forward=new Vector3(0,0,1).addScaledVector(direction,-direction.z).normalize();
  const knee=hip.clone().addScaledVector(direction,along).addScaledVector(forward,bend);
  pointBone('thigh_'+suffix,'calf_'+suffix,knee.clone().sub(hip));
  pointBone('calf_'+suffix,'foot_'+suffix,target.clone().sub(knee));
 }
 const footCycle=(phase)=>{
  const stance=.6,step=.145;
  if(phase<stance){const t=phase/stance;return {z:step*(1-2*t),lift:0,pitch:.06*Math.sin((t-.5)*Math.PI)};}
  const t=(phase-stance)/(1-stance),ease=t*t*(3-2*t);
  return {z:-step+2*step*ease,lift:.045*Math.sin(Math.PI*t)**2,pitch:-.04*Math.sin(Math.PI*t)};
 };
 for(let frame=0;frame<frameCount;frame++){
  const phase=frame/(frameCount-1),angle=phase*Math.PI*2;times.push(phase*duration);
  for(const [name,r]of rest){bone(name).position.copy(r.position);bone(name).quaternion.copy(r.q);}scene.updateMatrixWorld(true);
  pelvisAt(new Vector3(.008*Math.sin(angle),.631+.004*Math.cos(angle*2),-.036));
  worldQ('pelvis',new Quaternion().setFromAxisAngle(axisY,.025*Math.sin(angle)).multiply(rest.get('pelvis').worldQ));
  worldQ('spine_03',new Quaternion().setFromAxisAngle(axisY,-.018*Math.sin(angle)).multiply(rest.get('spine_03').worldQ));
  worldQ('head',new Quaternion().setFromAxisAngle(axisY,-.009*Math.sin(angle)).multiply(rest.get('head').worldQ));
  for(const [suffix,offset,side]of [['l',0,1],['r',.5,-1]]){
   const gait=footCycle((phase+offset)%1);
   const target=new Vector3(side*.13,.083+gait.lift+Math.abs(gait.pitch)*.1,-.023+gait.z);
   placeFoot(suffix,target);
   worldQ('foot_'+suffix,new Quaternion().setFromAxisAngle(axisX,gait.pitch).multiply(rest.get('foot_'+suffix).worldQ));
   const swing=Math.cos(angle+offset*Math.PI*2);
   pointBone('upperarm_'+suffix,'lowerarm_'+suffix,new Vector3(side*.075,-.225,-swing*.045));
   pointBone('lowerarm_'+suffix,'hand_'+suffix,new Vector3(side*.035,-.168,.018-swing*.035));
   const wristDelta=bone('lowerarm_'+suffix).getWorldQuaternion(new Quaternion()).multiply(rest.get('lowerarm_'+suffix).worldQ.clone().invert());
   worldQ('hand_'+suffix,wristDelta.multiply(rest.get('hand_'+suffix).worldQ));
  }
  scene.updateMatrixWorld(true);pelvisPositions.push(...bone('pelvis').position.toArray());
  for(const name of joints)rotationTracks.get(name).push(...bone(name).quaternion.toArray());
 }
 const floats=values=>Buffer.from(new Float32Array(values).buffer);
 const timeAccessor=append(floats(times),{componentType:5126,type:'SCALAR',count:frameCount,min:[0],max:[duration]});
 const walk={name:'Walk_IK',samplers:[],channels:[],extras:{source:'Previous An low-step IK walk, retained for comparison',duration,stepLength:.29,footLift:.045}};
 for(const [name,values]of rotationTracks){
  // Shortest-path interpolation and an exact loop seam.
  for(let i=4;i<values.length;i+=4){let dot=0;for(let k=0;k<4;k++)dot+=values[i+k]*values[i-4+k];if(dot<0)for(let k=0;k<4;k++)values[i+k]*=-1;}
  for(let k=0;k<4;k++)values[values.length-4+k]=values[k];
  const output=append(floats(values),{componentType:5126,type:'VEC4',count:frameCount});
  walk.channels.push({sampler:walk.samplers.length,target:{node:targets.get(name),path:'rotation'}});walk.samplers.push({input:timeAccessor,output,interpolation:'LINEAR'});
 }
 for(let k=0;k<3;k++)pelvisPositions[pelvisPositions.length-3+k]=pelvisPositions[k];
 const output=append(floats(pelvisPositions),{componentType:5126,type:'VEC3',count:frameCount});walk.channels.push({sampler:walk.samplers.length,target:{node:targets.get('pelvis'),path:'translation'}});walk.samplers.push({input:timeAccessor,output,interpolation:'LINEAR'});
 gltf.animations.push(walk);
 // Professionally authored alternatives from the official CC0 M2M library.
 const loader=new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
 for(const [file,name]of [['walk-relaxed','Walk'],['walk-happy','Walk_Lively']]){
  const bytes=await readFile(`assets/mesh2motion-animations/${file}.glb`),asset=await loader.parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
  const clip={name,samplers:[],channels:[],extras:{source:`Mesh2Motion CC0 ${file}`,pelvisScale:.72}};
  for(const track of asset.animations[0].tracks){
   const split=track.name.lastIndexOf('.'),bone=track.name.slice(0,split),property=track.name.slice(split+1);if(!targets.has(bone)||!(property==='quaternion'||bone==='pelvis'&&property==='position'))continue;
   const values=Array.from(track.values,v=>property==='position'?v*.72:v),count=track.times.length;
   if(property==='quaternion')for(let i=0;i<values.length;i+=4){const q=new Quaternion().fromArray(values,i).normalize();q.toArray(values,i);}
   const time=append(floats(track.times),{componentType:5126,type:'SCALAR',count,min:[track.times[0]],max:[track.times[count-1]]});
   const output=append(floats(values),{componentType:5126,type:property==='position'?'VEC3':'VEC4',count});
   clip.channels.push({sampler:clip.samplers.length,target:{node:targets.get(bone),path:property==='position'?'translation':'rotation'}});clip.samplers.push({input:time,output,interpolation:'LINEAR'});
  }
  gltf.animations.push(clip);
 }
 buildContactWalk(gltf,input,{append,floats,rest,scene,byName,worldQ,pelvisAt,placeFoot});
 refineEverydayMotion(gltf,Buffer.concat(chunks),{append,floats,scene,byName,rest});
 alignRunningWrists(gltf,Buffer.concat(chunks),{append,floats,scene,byName,rest});
 refineActivityMotion(gltf,Buffer.concat(chunks),{append,floats,scene,byName,rest});
 buildJumpingJack(gltf,{append,floats,rest,scene,byName,pointBone,worldQ,pelvisAt,placeFoot});
 await addFistPoses(gltf,Buffer.concat(chunks),{append,floats,rest});
 gltf.buffers=[{byteLength:length}];return Buffer.concat(chunks);
}
