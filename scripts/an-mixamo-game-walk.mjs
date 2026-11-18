import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {AnimationClip, AnimationMixer, Matrix4, Quaternion, QuaternionKeyframeTrack, Texture, Vector3, VectorKeyframeTrack} from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

import {GLTFExporter} from 'three/addons/exporters/GLTFExporter.js';
import {createHash} from 'node:crypto';
import {gzipSync} from 'node:zlib';

const jointMap = {pelvis:'Hips',spine_01:'Spine',spine_02:'Spine1',spine_03:'Spine2',neck_01:'Neck',head:'Head'};
for (const [side,prefix] of [['l','Left'],['r','Right']]) {
 for (const [game,source] of Object.entries({clavicle:'Shoulder',upperarm:'Arm',lowerarm:'ForeArm',hand:'Hand',thigh:'UpLeg',calf:'Leg',foot:'Foot'})) {
  jointMap[game+'_'+side]=prefix+source;
 }
}

// Apply Mixamo's skinning transform to each gameplay pivot. The input to
// Mixamo was this same model with both arms spread by .53 radians at the
// shoulders. Undo that bind-pose difference without moving the task anchors.
export async function bakeMixamoGameWalk(root,bones){
 const bytes=await readFile(new URL('../public/models/an-motion-preview/an-standard-walk.glb',import.meta.url));
 const loader=new GLTFLoader();
 loader.register(()=>({name:'ignore-atlas',loadTexture:async()=>new Texture()}));
 const {scene,animations}=await loader.parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
 const catalog=JSON.parse(await readFile(new URL('../src/lib/an-mixamo-catalog.json',import.meta.url),'utf8'));
 const dest=new URL('../public/models/an-game-motion/',import.meta.url);
 await mkdir(dest,{recursive:true});
 const manifest={};
 const walk=bake(animations.find(c=>c.name==='Mixamo_Standard_Walk'),true);
 for(const group of catalog)for(const [name] of group.items){
  if(name==='Standard Walk')continue;
  const data=await readFile(new URL('../public/models/an-motion-preview/mixamo/'+name+'.glb',import.meta.url));
  const result=await loader.parseAsync(data.buffer.slice(data.byteOffset,data.byteOffset+data.byteLength),'');
  const take=result.animations.find(c=>c.name===name);
  if(!take)throw Error('Missing Mixamo take '+name);
  const clip=bake(take,false);
  const dataOut=Buffer.from(await new GLTFExporter().parseAsync(root.getObjectByName('body').clone(true),{binary:true,animations:[clip]}));
  const hash=createHash('sha256').update(dataOut).digest('hex').slice(0,12);
  const file=name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/-$/,'')+'-'+hash+'.glb';
  await writeFile(new URL(file,dest),dataOut);await writeFile(new URL(file+'.gz',dest),gzipSync(dataOut));
  manifest[name]=file;
 }
 await writeFile(new URL('manifest.json',dest),JSON.stringify(manifest,null,2)+'\n');
 return walk;

 function bake(clip,groundWalk){
 const skin=scene.getObjectByName('An').skeleton;
 const game=new Map(bones.map(b=>[b.userData.motionJoint,b]));
 const targets=new Map();
 root.updateMatrixWorld(true);
 for(const [name,source] of Object.entries(jointMap)){
  const node=game.get(name),index=skin.bones.findIndex(b=>b.name==='mixamorig'+source);
  if(!node||index<0)throw Error('Missing walking joint '+name);
  const neutral=node.matrixWorld.clone(),side=name.slice(-1);
  if(/^(upperarm|lowerarm|hand)_/.test(name)){
   const p=game.get('upperarm_'+side).getWorldPosition(new Vector3());
   const spread=new Matrix4().makeTranslation(p.x,p.y,p.z)
    .multiply(new Matrix4().makeRotationZ(side==='r'?-.53:.53))
    .multiply(new Matrix4().makeTranslation(-p.x,-p.y,-p.z));
   neutral.premultiply(spread);
  }
  targets.set(node,{source:skin.bones[index],inverse:skin.boneInverses[index],neutral,world:new Matrix4(),positions:[],rotations:[]});
 }
 const mixer=new AnimationMixer(scene),action=mixer.clipAction(clip).play();
 const count=Math.ceil(clip.duration*(groundWalk?30:24));
 const times=Float32Array.from({length:count+1},(_,i)=>clip.duration*i/count);
 const hips=clip.tracks.find(t=>t.name==='mixamorigHips.position');
 const drift=new Vector3().fromArray(hips.values,hips.values.length-3).sub(new Vector3().fromArray(hips.values));
 drift.y=0;if(drift.length()<.60)drift.set(0,0,0);
 for(let i=0;i<times.length;i++){
  action.time=groundWalk&&i===times.length-1?0:Math.min(times[i],clip.duration-.00001);mixer.update(0);scene.updateMatrixWorld(true);
  for(const t of targets.values())t.world.multiplyMatrices(t.source.matrixWorld,t.inverse).multiply(t.neutral);
  for(const [node,t] of targets){
   const parent=targets.get(node.parent)?.world??node.parent.matrixWorld;
   const local=parent.clone().invert().multiply(t.world),p=new Vector3(),q=new Quaternion();
   local.decompose(p,q,new Vector3());
   if(node.userData.motionJoint==='pelvis')p.addScaledVector(drift,-i/count);
   if(t.rotations.length&&q.dot(new Quaternion().fromArray(t.rotations,t.rotations.length-4))<0)q.set(-q.x,-q.y,-q.z,-q.w);
   t.positions.push(...p.toArray());t.rotations.push(...q.toArray());
  }
 }
 mixer.stopAllAction();
 const tracks=[];
 for(const [bone,t] of targets){
  tracks.push(new QuaternionKeyframeTrack(bone.name+'.quaternion',times,t.rotations));
  tracks.push(new VectorKeyframeTrack(bone.name+'.position',times,t.positions));
 }
 const walk=new AnimationClip(clip.name,clip.duration,tracks);
 if(!groundWalk)return walk.optimize();
 // Mixamo bends the toe separately. The gameplay LOD keeps the shoe on one
 // foot bone. Match its lowest sole point through toe-off on each side.
 const gameMesh=root.getObjectByName('cadet_near'),sourceMesh=scene.getObjectByName('An');
 function soleVertices(mesh,side){
  const p=mesh.geometry.attributes.position;
  return Array.from({length:p.count},(_,i)=>i).filter(i=>p.getY(i)<.13&&(p.getX(i)>0)===(side==='l'));
 }
 const v=new Vector3();
 function bottom(mesh,indices){let result=Infinity;for(const i of indices)result=Math.min(result,mesh.getVertexPosition(i,v).y);return result;}
 const feet=['l','r'].map(side=>{
  const thigh=game.get('thigh_'+side);
  return {thigh,source:soleVertices(sourceMesh,side),game:soleVertices(gameMesh,side),
   track:tracks.find(t=>t.name===thigh.name+'.position'),offsets:[]};
 });
 const testMixer=new AnimationMixer(root),testAction=testMixer.clipAction(walk).play();
 action.reset().play();
 for(let i=0;i<times.length;i++){
  testAction.time=action.time=i===times.length-1?0:times[i];
  testMixer.update(0);mixer.update(0);root.updateMatrixWorld(true);scene.updateMatrixWorld(true);
  for(const foot of feet){
   const dy=bottom(sourceMesh,foot.source)-bottom(gameMesh,foot.game);
   foot.offsets.push(new Vector3(0,dy,0).applyQuaternion(foot.thigh.parent.getWorldQuaternion(new Quaternion()).invert()));
  }
 }
 testMixer.stopAllAction();mixer.stopAllAction();root.updateMatrixWorld(true);
 for(const foot of feet)for(const [i,offset] of foot.offsets.entries()){
  const values=foot.track.values;
  values[i*3]+=offset.x;values[i*3+1]+=offset.y;values[i*3+2]+=offset.z;
 }
 return walk.optimize();
}
}
