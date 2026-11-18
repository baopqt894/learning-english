import {elbowGuide,elbowGuideName,elbowSegments,elbowSpan} from '../src/lib/elbow-curve.ts';
import {readFile} from 'node:fs/promises';
import {AnimationMixer, Bone, Matrix3, Matrix4, Texture, Vector3, Quaternion} from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

// Elbow, wrist and fingertip landmarks in the exported model's front/side
// views. Negative X is the character's right. Poses and props are asymmetric.
const landmarks={
 linh:[[-.28,.83,-.02,-.34,.67,.09,-.47,.60,.15],[.35,1.00,.05,.43,1.13,.17,.64,1.20,.22]],
 minh:[[-.28,.83,-.04,-.28,.83,.15,-.22,.84,.24],[.30,.85,-.03,.32,.86,.15,.27,.88,.23]],
 library:[[-.23,.89,.01,-.11,.86,.22,.04,.85,.28],[.29,.91,.01,.23,.87,.18,.12,.86,.23]],
 canteen:[[-.47,.84,-.03,-.39,.82,.11,-.26,.81,.25],[.48,.89,-.03,.40,.86,.12,.30,.86,.23]],
 mai:[[-.28,.85,-.08,-.18,.88,.08,-.05,1.00,.17],[.28,.88,.00,.28,.82,.16,.19,.78,.21]],
 nam:[[-.32,.91,.06,-.20,.93,.24,-.10,1.03,.30],[.31,.91,.06,.25,.94,.23,.20,1.04,.30]],
 thu:[[-.23,.82,-.05,-.13,.78,.12,.04,.76,.23],[.28,.85,-.03,.27,.80,.13,.16,.78,.22]],
 khoa:[[-.30,.82,-.05,-.19,.87,.08,-.04,.95,.18],[.31,.82,.04,.36,.83,.15,.29,.87,.24]],
 phuc:[[-.34,.88,-.06,-.25,.78,.12,-.09,.76,.27],[.36,.88,-.03,.31,.81,.14,.25,.70,.26]],
 yen:[[-.19,.77,.04,-.08,.70,.22,.08,.65,.33],[.24,.78,.05,.20,.70,.21,.08,.65,.30]],
 hai:[[-.47,.93,-.02,-.48,1.04,.13,-.48,1.23,.22],[.45,.89,-.05,.34,.72,.06,.24,.63,.13]],
 vy:[[-.25,.82,-.15,-.11,.85,.04,.05,.88,.17],[.29,.87,.04,.32,.85,.19,.24,.92,.29]],
 bao:[[-.34,.83,-.08,-.26,.72,.04,-.15,.68,.14],[.35,.85,-.08,.28,.74,.04,.18,.67,.14]],
 tram:[[-.28,.87,-.04,-.19,.92,.11,-.09,1.02,.22],[.28,.87,-.03,.23,.92,.11,.17,1.03,.19]],
 thao:[[-.36,.80,-.12,-.34,.78,.04,-.23,.77,.20],[.40,.84,-.07,.42,.81,.09,.31,.81,.21]],
 quang:[[-.32,.82,-.12,-.20,.88,.04,-.08,.98,.15],[.34,.87,-.08,.27,.89,.10,.14,.93,.20]],
};
const aliases={root:'body',upperarm_r:'leftArm',upperarm_l:'rightArm',lowerarm_r:'elbows_0',lowerarm_l:'elbows_1',thigh_r:'leftLeg',thigh_l:'rightLeg',calf_r:'knees_0',calf_l:'knees_1'};
const order=['root','head','thigh_r','thigh_l','upperarm_r','upperarm_l','calf_r','calf_l','lowerarm_r','lowerarm_l'];
const loader=new GLTFLoader();
loader.register(()=>({name:'geometry-only',loadTexture:()=>Promise.resolve(new Texture())}));
const bytes=await readFile('public/models/an-motion-preview/an.glb');
const {scene,animations}=await loader.parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
scene.updateMatrixWorld(true);
let original;
scene.traverse(o=>{if(o.isSkinnedMesh&&!original)original=o;});
const reference=original.skeleton.bones;
const names=[...order,...reference.map(b=>b.name).filter(n=>!order.includes(n))];
// Other cast members fit their own hand scans from the neutral landmarks.
const bindPoints=new Map(reference.map(b=>[b.name,b.userData.castLandmark?
 new Vector3().fromArray(b.userData.castLandmark):b.getWorldPosition(new Vector3())]));
const relaxedPoints=new Map(),runningGrip=new Map();
const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
const point=(array,i)=>new Vector3().fromArray(array,i);

// Bake the approved relaxed pose as the gameplay bind pose. Both LODs are
// simplified from these exact hands, with the same finger and elbow weights.
export function correctedCadet(){
 const pos=[],normal=[],uv=[],indices=[],influences=[];
 const seamPoints=new Set();
 const key=i=>pos.slice(i*3,i*3+3).map(n=>n.toFixed(5)).join(',');
 const mixer=new AnimationMixer(scene);
 mixer.clipAction(animations.find(a=>a.name==='Idle_A')).play();mixer.update(0);scene.updateMatrixWorld(true);
 for(const bone of reference)relaxedPoints.set(bone.name,bone.getWorldPosition(new Vector3()));
 const transform=new Matrix4(),blend=new Matrix4(),normalMatrix=new Matrix3();
 scene.traverse(mesh=>{
  if(!mesh.isSkinnedMesh)return;
  mesh.skeleton.update();
  const g=mesh.geometry,a=g.attributes,offset=pos.length/3;
  for(let i=0;i<a.position.count;i++){
   const v=mesh.getVertexPosition(i,new Vector3());
   const n=new Vector3().fromBufferAttribute(a.normal,i);
   if(g.morphAttributes.normal)n.add(new Vector3().fromBufferAttribute(g.morphAttributes.normal[0],i));
   blend.elements.fill(0);
   for(let k=0;k<4;k++){
    const weight=a.skinWeight.getComponent(i,k);
    if(!weight)continue;
    transform.fromArray(mesh.skeleton.boneMatrices,16*a.skinIndex.getComponent(i,k));
    for(let j=0;j<16;j++)blend.elements[j]+=transform.elements[j]*weight;
   }
   n.applyNormalMatrix(normalMatrix.getNormalMatrix(blend));
   pos.push(...v.toArray());normal.push(...n.toArray());uv.push(a.uv.getX(i),a.uv.getY(i));
   const w=[];for(let k=0;k<4;k++)w.push([names.indexOf(mesh.skeleton.bones[a.skinIndex.getComponent(i,k)].name),a.skinWeight.getComponent(i,k)]);
   influences.push(w);
  }
  for(const [,arm] of mesh.userData.sleeveAttachment??[])seamPoints.add(key(offset+arm));
  // Rest-only scan faces have collapsed into the sleeve in this baked pose.
  const ab=new Vector3(),ac=new Vector3(),origin=new Vector3();
  for(let i=0;i<g.index.count;i+=3){
   const a=offset+g.index.getX(i),b=offset+g.index.getX(i+1),c=offset+g.index.getX(i+2);
   origin.fromArray(pos,a*3);
   ab.fromArray(pos,b*3).sub(origin);ac.fromArray(pos,c*3).sub(origin);
   if(ab.cross(ac).lengthSq()>1e-22)indices.push(a,b,c);
  }
 });
 const fingers=reference.filter(b=>/^(thumb|index|middle|ring|little)_[123]_[lr]$/.test(b.name));
 const relaxed=fingers.map(b=>({local:b.quaternion.clone(),parent:b.parent.getWorldQuaternion(new Quaternion())}));
 mixer.stopAllAction();
 mixer.clipAction(animations.find(a=>a.name==='Jog')).play();mixer.update(0);
 for(const [index,bone] of fingers.entries()){
  const {local,parent}=relaxed[index];
  const delta=parent.clone().multiply(bone.quaternion).multiply(local.invert()).multiply(parent.invert());
  runningGrip.set(bone.name,delta.normalize().toArray());
 }
 mixer.stopAllAction();scene.updateMatrixWorld(true);
 if(!seamPoints.size)throw Error('Cadet mesh lacks sleeve attachments');
 const seamLocks=Uint8Array.from(influences,(_,i)=>Number(seamPoints.has(key(i))));
 return {seamLocks,pos:Float32Array.from(pos),normal:Float32Array.from(normal),uv:Float32Array.from(uv),indices:Uint32Array.from(indices),influences};
}

export function fitCastRig(kind,height,group){
 const source=kind==='cadet'?relaxedPoints:bindPoints;
 const points=new Map(names.map(n=>[n,source.get(n).clone().multiplyScalar(height/1.85)]));
 const arms=[];
 for(const [side,sign,slot] of [['r',-1,0],['l',1,1]]){
  const get=name=>points.get(name+'_'+side);
  if(kind!=='cadet'){
   const mark=landmarks[kind][slot],elbow=point(mark,0),wrist=point(mark,3),tip=point(mark,6);
   const oldWrist=get('hand').clone(),long=get('middle_tip').clone().sub(oldWrist);
   const direction=tip.clone().sub(wrist),turn=new Quaternion().setFromUnitVectors(long.clone().normalize(),direction.clone().normalize());
   for(const [name,v] of points)if(name.endsWith('_'+side)&&/^(palm|thumb|index|middle|ring|little)/.test(name)){
    v.sub(oldWrist).applyQuaternion(turn).multiplyScalar(direction.length()/long.length()).add(wrist);
   }
   get('hand').copy(wrist);get('lowerarm').copy(elbow);
   get('upperarm').set(sign*Math.max(.19,Math.min(.34,Math.abs(elbow.x)*.8)),height*.55,elbow.z*.4-.035);
   const shoulder=get('upperarm'),localElbow=elbow.clone().sub(shoulder),localWrist=wrist.clone().sub(elbow);
   for(let step=1;step<elbowSegments;step++){
    const centre=points.get(elbowGuideName(step,side));
    elbowGuide(localElbow,localWrist,new Quaternion(),step/elbowSegments)(new Quaternion(),centre,new Quaternion());
    centre.add(shoulder);
   }
  }
  const digits=['thumb','index','middle','ring','little'].flatMap(d=>[1,2,3].map(i=>{
   const n=d+'_'+i+'_'+side,from=points.get(n),to=points.get(d+'_'+(i===3?'tip':i+1)+'_'+side);
   return {index:names.indexOf(n),from,to};
  }));
  arms.push({side,shoulder:get('upperarm'),elbow:get('lowerarm'),wrist:get('hand'),tip:get('middle_tip'),digits});
 }
 const bones=names.map(n=>{const bone=new Bone();bone.name=aliases[n]||n;bone.userData.motionJoint=n;if(kind==='cadet'&&runningGrip.has(n))bone.userData.runningGrip=runningGrip.get(n);return bone;});
 for(const [i,n] of names.entries()){
  const parent=scene.getObjectByName(n).parent?.name,index=names.indexOf(parent);
  bones[i].position.copy(points.get(n));
  if(index>=0){bones[i].position.sub(points.get(parent));bones[index].add(bones[i]);}else group.add(bones[i]);
 }
 return {bones,arms,indices:Object.fromEntries(names.map((n,i)=>[n,i]))};
}

const displacement=new Vector3(),direction=new Vector3(),closest=new Vector3();
function segment(p,a,b){
 direction.subVectors(b,a);const t=Math.max(0,Math.min(1,displacement.subVectors(p,a).dot(direction)/direction.lengthSq()));
 return {t,d:closest.copy(a).addScaledVector(direction,t).distanceTo(p)};
}
export function castWeights(p,rig,height,freedom,rigid){
 const {indices:id}=rig,h=p.y/height,legSide=p.x<0?'r':'l',weights=new Map();
 const add=(n,w)=>{if(w>0)weights.set(n,(weights.get(n)||0)+w);};
 if(freedom===0)return [[id.root,1]];
 const limbs=rig.arms.map(arm=>{
  const a=segment(p,arm.shoulder,arm.elbow),b=segment(p,arm.elbow,arm.wrist),c=segment(p,arm.wrist,arm.tip);
  return {arm,a,b,c,distance:Math.min(a.d,b.d,c.d)};
 });
 const {arm,a,b,c,distance}=limbs[limbs[1].distance<limbs[0].distance?1:0],side=arm.side;
 const coverage=freedom*(1-smooth(.073,.145,distance))*smooth(.06,.145,Math.abs(p.x)+Math.max(0,p.z)*.7);
 const body=rigid?0:1-coverage,head=smooth(.565,.635,h),leg=1-smooth(.29,.37,h);
 if(rigid)add(id.root,1-coverage);
 add(id.head,head*body);
 const knee=smooth(.15,.235,h),ankle=1-smooth(.055,.102,h);
 add(id['thigh_'+legSide],body*leg*knee);add(id['calf_'+legSide],body*leg*(1-knee)*(1-ankle));add(id['foot_'+legSide],body*leg*ankle);
 const trunk=body*(1-leg)*(1-head),chest=smooth(.39,.515,h);
 add(id.pelvis,trunk*(1-chest));add(id.spine_03,trunk*chest);
 if(coverage){
  // Longitudinal weights are continuous at both segment boundaries, even
  // when a wrist is above its elbow, as in Linh's pointing pose.
  const upper=arm.shoulder.distanceTo(arm.elbow),lower=arm.elbow.distanceTo(arm.wrist);
  const blend=[a,b,c].map(s=>Math.exp(-(s.d*s.d-distance*distance)/.0009));
  const along=(blend[0]*(a.t-1)*upper+blend[1]*b.t*lower+blend[2]*(lower+c.t*arm.wrist.distanceTo(arm.tip)))/(blend[0]+blend[1]+blend[2]);
  const span=elbowSpan(upper,lower),u=Math.min(1,Math.max(0,.5+along/(2*span)))*elbowSegments;
  const left=Math.min(elbowSegments-1,Math.floor(u)),mix=u-left,hand=smooth(lower-.04,lower+.03,along);
  const guide=step=>step===0?'upperarm_'+side:step===elbowSegments?'lowerarm_'+side:elbowGuideName(step,side);
  add(id[guide(left)],coverage*(1-hand)*(1-mix));add(id[guide(left+1)],coverage*(1-hand)*mix);
  if(hand){
   const ranked=arm.digits.map(d=>({i:d.index,d:segment(p,d.from,d.to).d})).sort((x,y)=>x.d-y.d);
   const grip=(1-smooth(.022,.052,ranked[0].d))*smooth(lower+.022,lower+.066,along);
   const primary=.5+.5*smooth(0,.012,ranked[1].d-ranked[0].d);
   add(id['hand_'+side],coverage*hand*(1-grip));add(ranked[0].i,coverage*hand*grip*primary);add(ranked[1].i,coverage*hand*grip*(1-primary));
  }
 }
 return [...weights].sort((a,b)=>b[1]-a[1]).slice(0,4);
}

export function packWeights(influences,indices,weights){
 const total=influences.reduce((s,p)=>s+p[1],0);
 const values=influences.map(([,w])=>Math.round(w/total*255));
 values[0]+=255-values.reduce((a,b)=>a+b,0);
 for(let k=0;k<4;k++){indices.push(influences[k]?.[0]||0);weights.push(values[k]||0);}
}
