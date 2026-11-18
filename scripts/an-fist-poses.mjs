import {cutSleeves,sleeveSeam,sleeveLining} from './an-sleeve-seam.mjs';
import {cadetElbowSpanRatio,elbowGuide,elbowGuideName,elbowSegments,elbowSpan} from '../src/lib/elbow-curve.ts';
import {Vector3,MeshBasicMaterial,Matrix3,Matrix4,Quaternion,BufferGeometry,BufferAttribute} from 'three';
import {MarchingCubes} from 'three/addons/objects/MarchingCubes.js';

/** One continuous, articulated hand surface for open, relaxed and gripping poses. */
export async function addFistPoses(gltf,input,{append,floats,rest}){
 const smooth=(a,b,v)=>{const t=Math.max(0,Math.min(1,(v-a)/(b-a)));return t*t*(3-2*t);};
 const bounds=values=>{const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];for(let i=0;i<values.length;i++){const k=i%3;min[k]=Math.min(min[k],values[i]);max[k]=Math.max(max[k],values[i]);}return {min,max};};
 function read(index){const a=gltf.accessors[index],v=gltf.bufferViews[a.bufferView],size={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT4:16}[a.type],width={5126:4,5123:2,5125:4,5122:2}[a.componentType],method={5126:'getFloat32',5123:'getUint16',5125:'getUint32',5122:'getInt16'}[a.componentType],dv=new DataView(input.buffer,input.byteOffset,input.byteLength),out=[];for(let i=0;i<a.count;i++)for(let k=0;k<size;k++)out.push(dv[method]((v.byteOffset||0)+(a.byteOffset||0)+i*(v.byteStride||size*width)+k*width,true)/(a.normalized?(a.componentType===5122?32767:65535):1));return out;}
 const primitive=gltf.meshes[0].primitives[0],positions=read(primitive.attributes.POSITION),uvs=read(primitive.attributes.TEXCOORD_0),delta=Array(positions.length).fill(0);
 const scan={positions,normals:read(primitive.attributes.NORMAL),indices:read(primitive.indices),
  joints:read(primitive.attributes.JOINTS_0),weights:read(primitive.attributes.WEIGHTS_0),delta};
 await cutSleeves(scan,uvs);
 const trims=[];
 const inverseMatrices=read(gltf.skins[0].inverseBindMatrices),fingerTracks=[],handNodes=[],bendHelpers=[];
 const material=structuredClone(gltf.materials[primitive.material]);material.name='Original skin palette — articulated hands';delete material.normalTexture;const materialIndex=gltf.materials.length;gltf.materials.push(material);
 const capsule=(p,a,b,r)=>{const direction=b.clone().sub(a),t=Math.max(0,Math.min(1,p.clone().sub(a).dot(direction)/direction.lengthSq()));return p.distanceTo(a.clone().addScaledVector(direction,t))-r;};
 // Match the front AND side silhouettes of the Tripo arms. The scale at
 // the wrist carries into the forearm loft, including its shared edge.
 const wristWidth=1.28,wristDepth=1.46,palmFlare=.22,palmDepth=.18,fingerLength=.23;
 for(const side of ['l','r']){
  const wrist=rest.get('hand_'+side).world,axis=rest.get('middle_01_'+side).world.clone().sub(wrist).normalize(),normal=new Vector3(0,0,1).addScaledVector(axis,-axis.z).normalize(),across=normal.clone().cross(axis).normalize();if(side==='r')across.negate();
  const handNode=gltf.nodes.findIndex(n=>n.name==='hand_'+side),handQ=rest.get('hand_'+side).worldQ,world=local=>{
   // Widen the palm and lengthen the fingers gradually above the wrist.
   // Landmarks and vertices pass through the same map; the cuff stays sewn.
   const f=smooth(0,.045,local.y);
   return wrist.clone().addScaledVector(across,local.x*(wristWidth+palmFlare*f))
    .addScaledVector(axis,local.y*(1+fingerLength*f)).addScaledVector(normal,local.z*(wristDepth+palmDepth*f));
  };
  const localAxis=v=>v.clone().applyQuaternion(handQ.clone().invert());
  function joint(name,local,parent,parentWorld){
   const point=world(local),node=gltf.nodes.length,index=gltf.skins[0].joints.length;
   const castLandmark=wrist.clone().addScaledVector(across,local.x).addScaledVector(axis,local.y).addScaledVector(normal,local.z);
   gltf.nodes.push({name,translation:localAxis(point.clone().sub(parentWorld)).toArray(),rotation:[0,0,0,1],children:[],extras:{castLandmark:castLandmark.toArray()}});(gltf.nodes[parent].children??=[]).push(node);gltf.skins[0].joints.push(node);
   inverseMatrices.push(...new Matrix4().compose(point,handQ,new Vector3(1,1,1)).invert().toArray());return {node,index,world:point};
  }
  const palm=joint('palm_control_'+side,new Vector3(0,.012,0),handNode,wrist),digits=[];
  for(const [name,u,root,length,radius]of [['index',.031,.063,.066,.0105],['middle',.008,.067,.073,.011],['ring',-.015,.064,.065,.0105],['little',-.035,.055,.052,.0095]]){
   const points=[0,.4,.73,1].map(t=>new Vector3(u,root+length*t,0)),bones=[];let parent=palm;
   for(let segment=0;segment<3;segment++){
    const bone=joint(`${name}_${segment+1}_${side}`,points[segment],parent.node,parent.world);bones.push(bone);parent=bone;
    fingerTracks.push({node:bone.node,side,segment,digit:name,curlAxis:localAxis(across),normalAxis:localAxis(normal),longAxis:localAxis(axis)});
   }
   joint(`${name}_tip_${side}`,points[3],parent.node,parent.world);
   digits.push({name,points,bones,radius});
  }
  const thumbPoints=[[.036,.025,0],[.055,.041,0],[.069,.058,0],[.073,.074,0]].map(v=>new Vector3(...v)),thumbBones=[];let parent=palm;
  for(let segment=0;segment<3;segment++){
   const bone=joint(`thumb_${segment+1}_${side}`,thumbPoints[segment],parent.node,parent.world);thumbBones.push(bone);parent=bone;
   fingerTracks.push({node:bone.node,side,segment,digit:'thumb',curlAxis:localAxis(across),normalAxis:localAxis(normal),longAxis:localAxis(axis)});
  }
  joint(`thumb_tip_${side}`,thumbPoints[3],parent.node,parent.world);
  digits.push({name:'thumb',points:thumbPoints,bones:thumbBones,radius:.012});
  const elbow=rest.get('lowerarm_'+side).world,shoulder=rest.get('upperarm_'+side).world;
  const upper=elbow.clone().sub(shoulder).normalize();
  const upperJoint=gltf.skins[0].joints.findIndex(n=>gltf.nodes[n].name==='upperarm_'+side);
  const seam=sleeveSeam({...scan,side,upperJoint,upper});
  trims.push({seam,upperJoint});
  const sample=wrist.clone().addScaledVector(axis,.055).addScaledVector(normal,.04);
  let nearest=Infinity,skinUV;
  for(let i=0;i<positions.length/3;i++){
   if(!scan.skin[i])continue;
   const distance=new Vector3().fromArray(positions,i*3).distanceToSquared(sample);
   if(distance<nearest){nearest=distance;skinUV=uvs.slice(i*2,i*2+2);}
  }
  const resolution=48,mcMaterial=new MeshBasicMaterial(),mc=new MarchingCubes(resolution,mcMaterial,false,false,30000);mc.isolation=0;
  const digitDistance=(point,digit)=>Math.min(...digit.points.slice(0,3).map((p,i)=>capsule(point,p,digit.points[i+1],digit.radius*(1-i*.06))));
  for(let z=0;z<resolution;z++)for(let y=0;y<resolution;y++)for(let x=0;x<resolution;x++){
   const p=new Vector3((x/resolution*2-1)*.11,(y/resolution*2-1)*.11+.07,(z/resolution*2-1)*.11);const flare=smooth(-.019,.044,p.y);
   const width=.032+.012*flare,thickness=.023-.0035*smooth(-.036,-.004,p.y)+.004*flare;
   const cap=Math.max(0,p.y-.044)/.037;
   let distance=(Math.hypot(p.x/width,p.z/thickness,cap)-1)*thickness;
   for(const digit of digits){const d=digitDistance(p,digit),k=.004,h=Math.max(0,Math.min(1,.5+.5*(d-distance)/k));distance=d*(1-h)+distance*h-k*h*(1-h);}
   mc.field[z*resolution*resolution+y*resolution+x]=-distance;
  }
  mc.update();const geometry=mc.geometry,p=geometry.attributes.position,n=geometry.attributes.normal,vertices=new Map(),triangles=[],pos=[],norm=[],uv=[],indices=[],joints=[],weights=[],morph=[];
  for(let i=0;i<geometry.drawRange.count;i++){
   const key=[p.getX(i),p.getY(i),p.getZ(i),n.getX(i),n.getY(i),n.getZ(i)].map(v=>v.toFixed(5)).join(',');if(vertices.has(key)){triangles.push(vertices.get(key));continue;}vertices.set(key,pos.length/3);triangles.push(pos.length/3);
   const local=new Vector3().fromBufferAttribute(p,i).multiplyScalar(.11).add(new Vector3(0,.07,0)),point=world(local),ln=new Vector3().fromBufferAttribute(n,i),f=smooth(0,.045,local.y);
   const t=Math.max(0,Math.min(1,local.y/.045)),df=6*t*(1-t)/.045;
   const nx=ln.x/(wristWidth+palmFlare*f),nz=ln.z/(wristDepth+palmDepth*f);
   const ny=(ln.y-nx*palmFlare*local.x*df-nz*palmDepth*local.z*df)/(1+fingerLength*(f+local.y*df));
   const wn=across.clone().multiplyScalar(nx).addScaledVector(axis,ny).addScaledVector(normal,nz).normalize();
   pos.push(...wrist.toArray());morph.push(...point.sub(wrist).toArray());norm.push(...wn.toArray());uv.push(...skinUV);
   const digit=digits.reduce((a,b)=>digitDistance(local,a)<digitDistance(local,b)?a:b),points=digit.points;
   const distances=points.slice(0,3).map((start,k)=>{const segment=points[k+1].clone().sub(start),fraction=Math.max(0,Math.min(1,local.clone().sub(start).dot(segment)/segment.lengthSq()));return {k,fraction,d:local.distanceTo(start.clone().addScaledVector(segment,fraction))};}).sort((a,b)=>a.d-b.d);
   const nearest=distances[0],arc=nearest.k+nearest.fraction;
   const rootDirection=points[1].clone().sub(points[0]).normalize(),beyond=local.clone().sub(points[0]).dot(rootDirection),fingerWeight=smooth(-.012,.008,beyond);
   const transition1=smooth(.78,1.22,arc),transition2=smooth(1.78,2.22,arc);
   joints.push(palm.index,...digit.bones.map(b=>b.index));weights.push(1-fingerWeight,fingerWeight*(1-transition1),fingerWeight*(transition1-transition2),fingerWeight*transition2);
  }
  const mirrored=across.clone().cross(axis).dot(normal)<0;for(let i=0;i<triangles.length;i+=3)indices.push(triangles[i],triangles[i+(mirrored?2:1)],triangles[i+(mirrored?1:2)]);
  const lowerNode=gltf.nodes.findIndex(n=>n.name==='lowerarm_'+side);
  const upperNode=gltf.nodes.findIndex(n=>n.name==='upperarm_'+side);
  const lowerBone=gltf.nodes[lowerNode],bind=new Quaternion().fromArray(lowerBone.rotation);
  const localElbow=new Vector3().fromArray(lowerBone.translation),localWrist=new Vector3().fromArray(gltf.nodes[handNode].translation);
  const parentQ=rest.get('upperarm_'+side).worldQ;
  const guides=[gltf.skins[0].joints.indexOf(upperNode)];
  for(let step=1;step<elbowSegments;step++){
   const solve=elbowGuide(localElbow,localWrist,bind,step/elbowSegments,cadetElbowSpanRatio);
   const centre=new Vector3(),rotation=new Quaternion();solve(bind,centre,rotation);
   const node=gltf.nodes.length;guides.push(gltf.skins[0].joints.length);
   gltf.nodes.push({name:elbowGuideName(step,side),translation:centre.toArray(),rotation:rotation.toArray()});
   gltf.nodes[upperNode].children.push(node);gltf.skins[0].joints.push(node);
   const absolute=centre.clone().applyQuaternion(parentQ).add(shoulder);
   inverseMatrices.push(...new Matrix4().compose(absolute,parentQ,new Vector3(1,1,1)).invert().toArray());
   bendHelpers.push({node,driver:lowerNode,solve});
  }
  guides.push(gltf.skins[0].joints.indexOf(lowerNode));
  const innerSeam=sleeveLining(seam,scan,uvs,upper,upperJoint);
  const attachment=extendForearm({seam:innerSeam,upperJoint,pos,morph,norm,uv,indices,joints,weights,wrist,elbow,upper,axis,skinUV,guides,
   span:elbowSpan(shoulder.distanceTo(elbow),wrist.distanceTo(elbow),cadetElbowSpanRatio),wristJoint:gltf.skins[0].joints.indexOf(handNode)});
  geometry.dispose();mcMaterial.dispose();const count=pos.length/3;if(count>8000)throw new Error('Articulated hand exceeds mobile vertex budget');
  const attribute=(data,type)=>append(floats(data),{componentType:5126,type,count,...(type==='VEC3'?bounds(data):{})});
  const pa=attribute(pos,'VEC3'),na=attribute(norm,'VEC3'),ua=attribute(uv,'VEC2'),ja=append(Buffer.from(new Uint16Array(joints).buffer),{componentType:5123,type:'VEC4',count}),wa=attribute(weights,'VEC4'),ia=append(Buffer.from(new Uint16Array(indices).buffer),{componentType:5123,type:'SCALAR',count:indices.length}),ma=attribute(morph,'VEC3');
  const mesh=gltf.meshes.length;gltf.meshes.push({name:'articulated_hand_'+side,weights:[0],extras:{targetNames:['showArticulatedHand'],sleeveAttachment:attachment},primitives:[{attributes:{POSITION:pa,NORMAL:na,TEXCOORD_0:ua,JOINTS_0:ja,WEIGHTS_0:wa},indices:ia,material:materialIndex,targets:[{POSITION:ma}]}]});
  const node=gltf.nodes.length;gltf.nodes.push({name:'articulated_hand_'+side,mesh,skin:0,weights:[0]});gltf.scenes[gltf.scene||0].nodes.push(node);handNodes.push(node);
 }
 gltf.skins[0].inverseBindMatrices=append(floats(inverseMatrices),{componentType:5126,type:'MAT4',count:gltf.skins[0].joints.length});
 // Give the comparison scan its own copies of the cuff rim. Its removed
 // triangles can then collapse to zero area without pulling on the live rim.
 for(const {seam,upperJoint} of trims){
  const copies=new Map(),rimKeys=new Set(seam.rim.map(v=>positions.slice(3*v.source,3*v.source+3).map(n=>n.toFixed(5)).join(',')));
  for(const face of seam.hiddenFaces)for(let k=0;k<3;k++){
   const old=scan.indices[face+k],point=new Vector3().fromArray(positions,3*old);
   if(!rimKeys.has(point.toArray().map(n=>n.toFixed(5)).join(',')))continue;
   if(!copies.has(old)){
    copies.set(old,positions.length/3);positions.push(...point.toArray());
    uvs.push(...uvs.slice(2*old,2*old+2));scan.normals.push(...scan.normals.slice(3*old,3*old+3));
    scan.joints.push(upperJoint,0,0,0);scan.weights.push(1,0,0,0);delta.push(...seam.lining.clone().sub(point).toArray());
   }
   scan.indices[face+k]=copies.get(old);
  }
 }
 const count=positions.length/3;
 primitive.indices=append(Buffer.from(Uint16Array.from(scan.indices).buffer),{componentType:5123,type:'SCALAR',count:scan.indices.length});
 primitive.attributes.POSITION=append(floats(positions),{componentType:5126,type:'VEC3',count,...bounds(positions)});
 primitive.attributes.NORMAL=append(floats(scan.normals),{componentType:5126,type:'VEC3',count});
 primitive.attributes.TEXCOORD_0=append(floats(uvs),{componentType:5126,type:'VEC2',count});
 primitive.attributes.JOINTS_0=append(Buffer.from(Uint16Array.from(scan.joints).buffer),{componentType:5123,type:'VEC4',count});
 primitive.attributes.WEIGHTS_0=append(floats(scan.weights),{componentType:5126,type:'VEC4',count});
 const target=append(floats(delta),{componentType:5126,type:'VEC3',count,...bounds(delta)});
 primitive.targets=[{POSITION:target}];gltf.meshes[0].weights=[0];gltf.meshes[0].extras={...gltf.meshes[0].extras,targetNames:['hideOriginalHands'],splitSleeveFaces:scan.splitFaces};const originalNode=gltf.nodes.findIndex(n=>n.mesh===0);gltf.nodes[originalNode].weights=[0];
 const study=structuredClone(gltf.animations.find(a=>a.name==='Idle_A'));study.name='Hand_Study';gltf.animations.push(study);
 for(const clip of gltf.animations){
  // The central elbow ring follows the bisector of the upper and lower
  // arm. Blending the two end rotations directly would flatten this ring.
  for(const {node,driver,solve} of bendHelpers){
   const channel=clip.channels.find(c=>c.target.node===driver&&c.target.path==='rotation');
   if(!channel)continue;
   const sampler=clip.samplers[channel.sampler],rotations=read(sampler.output),values=[],centres=[];
   const centre=new Vector3(),frame=new Quaternion();
   for(let i=0;i<rotations.length;i+=4){
    solve(new Quaternion().fromArray(rotations,i).normalize(),centre,frame);
    values.push(...frame.toArray());centres.push(...centre.toArray());
   }
   for(const [path,type,data] of [['rotation','VEC4',values],['translation','VEC3',centres]]){
    const output=append(floats(data),{componentType:5126,type,count:rotations.length/4});
    clip.channels.push({sampler:clip.samplers.length,target:{node,path}});
    clip.samplers.push({...sampler,output});
   }
  }
  const running=['Jog','Sprint'].includes(clip.name),duration=Math.max(...clip.samplers.map(s=>gltf.accessors[s.input].max?.[0]||0)),count=49,times=Array.from({length:count},(_,i)=>duration*i/(count-1));
  const inputTime=append(floats(times),{componentType:5126,type:'SCALAR',count,min:[0],max:[duration]});
  for(const finger of fingerTracks){
   const values=times.flatMap((_,i)=>{
    const phase=i/(count-1),sign=finger.side==='l'?-1:1;
    const wave=clip.name==='Greeting'&&finger.side==='r'?smooth(.035,.30,phase)*(1-smooth(.70,.97,phase)):0;
    const working=smooth(.07,.3,phase)*(1-smooth(.72,.97,phase));
    let grip=0,open=wave;
    switch(clip.name){
     case 'Hand_Study': grip=smooth(0,.8,Math.sin(Math.PI*phase)**2);break;
     case 'Farm_Harvest': grip=.64*smooth(.33,.50,phase)*(1-smooth(.76,.93,phase));break;
     case 'Farm_PlantSeed':
      if(finger.side==='r')grip=(['thumb','index'].includes(finger.digit)?.85:.35)*working*(1-smooth(.48,.64,phase));
      break;
     case 'Farm_Watering': grip=(finger.side==='r'?.78:.38)*working;break;
     case 'Walk_Carry': grip=.42;break;
     case 'Jumping_Jacks': case 'Swim_Fwd': case 'Swim_Idle': open=.95;break;
     case 'Salute': if(finger.side==='r')open=working;break;
     default: grip=running?1:0;
    }
    const relaxed=[.10,.22,.15][finger.segment]*(1-open*.85),closed=[.85,1.05,.8][finger.segment];
    const curl=relaxed*(1-grip)+closed*grip;
    if(finger.digit==='thumb'){
     if(finger.segment===0)return new Quaternion().setFromAxisAngle(finger.longAxis,-sign*(.12+.65*grip)).multiply(new Quaternion().setFromAxisAngle(finger.normalAxis,sign*(.1+.35*grip))).toArray();
     return new Quaternion().setFromAxisAngle(finger.curlAxis,sign*(.12*(1-open)+grip*(finger.segment===1?.6:.45))).toArray();
    }
    return new Quaternion().setFromAxisAngle(finger.curlAxis,sign*curl).toArray();
   });
   const output=append(floats(values),{componentType:5126,type:'VEC4',count});clip.channels.push({sampler:clip.samplers.length,target:{node:finger.node,path:'rotation'}});clip.samplers.push({input:inputTime,output,interpolation:'LINEAR'});
  }
  const time=append(floats([0]),{componentType:5126,type:'SCALAR',count:1,min:[0],max:[0]}),output=append(floats([1]),{componentType:5126,type:'SCALAR',count:1});
  for(const node of [originalNode,...handNodes]){clip.channels.push({sampler:clip.samplers.length,target:{node,path:'weights'}});clip.samplers.push({input:time,output,interpolation:'LINEAR'});}
 }
}

// Continue the open marching-cubes wrist ring into the sleeve. The hand and
// forearm share boundary vertices, so wrist rotation cannot open a crack.
function extendForearm({seam,upperJoint,pos,morph,norm,uv,indices,joints,weights,wrist,elbow,upper,axis,skinUV,guides,span,wristJoint}){
 const offsets=Array.from({length:pos.length/3},(_,i)=>new Vector3().fromArray(morph,i*3));
 const levels=offsets.map(v=>v.dot(axis)),bottom=Math.min(...levels);
 const ring=levels.flatMap((level,i)=>level<bottom+1e-6?[i]:[]);
 if(ring.length<12)throw Error('Missing open wrist ring');
 const rim=new Set(ring),edges=[];
 for(let i=0;i<indices.length;i+=3)for(let k=0;k<3;k++){
  const a=indices[i+k],b=indices[i+(k+1)%3];
  if(rim.has(a)&&rim.has(b))edges.push([a,b]);
 }
 const forearm=wrist.clone().sub(elbow),length=forearm.length();forearm.normalize();
 const smooth=t=>{t=Math.min(1,Math.max(0,t));return t*t*(3-2*t);};
 const assign=(i,d)=>{
  const hand=1-smooth(d/(-bottom));
  const u=Math.min(1,Math.max(0,.5+(length-d)/(2*span)))*elbowSegments;
  const left=Math.min(elbowSegments-1,Math.floor(u)),blend=u-left;
  joints.splice(i*4,4,wristJoint,guides[left],guides[left+1],0);
  weights.splice(i*4,4,hand,(1-hand)*(1-blend),(1-hand)*blend,0);
 };
 // Put each wrist ring in the same frame as the bone carrying it. The
 // scanned palm and forearm point in different directions in bind pose.
 const wristTurn=new Quaternion().setFromUnitVectors(axis,forearm);
 const aligned=new Matrix3().setFromMatrix4(new Matrix4().makeRotationFromQuaternion(wristTurn));
 function alignedToBind(handWeight){
  const blend=aligned.clone().multiplyScalar(handWeight);
  for(const k of [0,4,8])blend.elements[k]+=1-handWeight;
  return blend.invert();
 }
 for(let i=0;i<levels.length;i++){
  if(levels[i]>=0)continue;
  const d=-levels[i],handWeight=1-smooth(d/(-bottom));
  offsets[i].clone().applyQuaternion(wristTurn).applyMatrix3(alignedToBind(handWeight)).toArray(morph,i*3);
  assign(i,d);
 }
 // Traverse each rim in mesh winding order, then register the two loops
 // by projected perimeter. Cuffs are oblique and have a different vertex
 // count on each side of the original scan.
 const successors=new Map(edges),ordered=[ring[0]];
 while(ordered.length<ring.length){
  const id=successors.get(ordered.at(-1));
  if(id===undefined||ordered.includes(id))throw Error('Non-manifold wrist rim');
  ordered.push(id);
 }
 const flat=v=>v.clone().addScaledVector(forearm,-v.dot(forearm));
 const radial=id=>offsets[id].clone().addScaledVector(axis,-bottom).applyQuaternion(wristTurn);
 const cuff=seam.rim.slice(),dir=radial(ordered[0]).normalize();
 const dots=cuff.map(v=>flat(v.point.clone().sub(seam.centre)).normalize().dot(dir));
 const start=dots.indexOf(Math.max(...dots));cuff.push(...cuff.splice(0,start));
 function perimeter(points){
  const stations=[0];
  for(let j=0;j<points.length;j++)stations.push(stations[j]+flat(points[(j+1)%points.length].clone().sub(points[j])).length());
  return stations.map(s=>s/stations.at(-1));
 }
 const hs=perimeter(ordered.map(radial)),cs=perimeter(cuff.map(v=>v.point));
 function sampleLoop(points,stations,phase){
  const u=(phase%1+1)%1;
  let j=0;while(stations[j+1]<u)j++;
  const f=(u-stations[j])/(stations[j+1]-stations[j]);
  return points[j].clone().lerp(points[(j+1)%points.length],f);
 }
 const cuffPoints=cuff.map(v=>v.point);
 const anchors=hs.slice(0,-1).map(u=>sampleLoop(cuffPoints,cs,u));
 // Import the shape of the opening, without propagating individual scanned
 // triangles all the way down the arm. Meet the exact edge at the lining.
 const oval=hs.slice(0,-1).map(u=>{
  const sum=new Vector3();let total=0;
  for(let j=-5;j<=5;j++){
   const w=Math.exp(-j*j/7);
   sum.addScaledVector(sampleLoop(cuffPoints,cs,u+j*.018),w);total+=w;
  }
  return sum.divideScalar(total);
 });
 const end=length-seam.centre.clone().sub(elbow).dot(upper);
 function section(d,id){
  const along=length-d,t=Math.min(1,Math.max(0,.5+along/(2*span)));
  const tangent=upper.clone().lerp(forearm,t).normalize();
  const centre=Math.abs(along)>=span?elbow.clone().addScaledVector(along<0?upper:forearm,along):
    elbow.clone().addScaledVector(upper,-span*(1-t)**2).addScaledVector(forearm,span*t*t);
  // Fit the bare arm between wrist and cuff, preserving its oval
  // cross-section as the elbow bends.
  const forearmT=Math.max(0,Math.min(1,(d+bottom)/(length+bottom)));
  const belly=Math.sin(Math.PI*forearmT)**2;
  const upperT=smooth((d-length)/(end-length));
  const fullness=1+.13*Math.sin(Math.PI*smooth((d+bottom)/(end+bottom)))**2;
  const width=(1+.19*forearmT+.19*belly+.14*upperT)*fullness;
  const depth=(1+.58*forearmT+.20*belly+.12*upperT)*fullness;
  const thinAxis=new Vector3(0,0,1).addScaledVector(axis,-axis.z).normalize();
  const r=offsets[id].clone().addScaledVector(axis,-bottom);
  const thickness=r.dot(thinAxis);
  r.multiplyScalar(width).addScaledVector(thinAxis,(depth-width)*thickness);
  return centre.add(r.applyQuaternion(new Quaternion().setFromUnitVectors(axis,tangent)));
 }
 const corrections=ordered.map((id,k)=>oval[k].clone().sub(section(end,id)));
 let previous=ordered.slice();
 const sections=[previous];
 const depths=Array.from({length:24},(_,i)=>-bottom+(end+bottom)*(i+1)/25);
 if(length<end)depths.push(length);
 depths.sort((a,b)=>a-b);
 for(const d of depths){
  const next=[],blend=smooth((d-length)/(end-length));
  for(const [k,id] of ordered.entries()){
   const edge=smooth((d-(end-.025))/.025);
   const point=section(d,id).addScaledVector(corrections[k],blend)
    .addScaledVector(anchors[k].clone().sub(oval[k]),edge),v=pos.length/3;
   pos.push(...wrist.toArray());morph.push(...point.sub(wrist).toArray());
   norm.push(0,0,0);uv.push(...skinUV);joints.push(0,0,0,0);weights.push(0,0,0,0);assign(v,d);
   // Match the sleeve's rigid rim gradually, even on the low side of the cuff.
   const lock=smooth((d-length)/(end-length));
   if(lock>0){
    const w=new Map([[upperJoint,lock]]);
    for(let j=0;j<4;j++){const i=v*4+j;w.set(joints[i],(w.get(joints[i])||0)+weights[i]*(1-lock));}
    const best=[...w].sort((a,b)=>b[1]-a[1]);
    for(let j=0;j<4;j++){joints[v*4+j]=best[j]?.[0]??0;weights[v*4+j]=best[j]?.[1]??0;}
   }
   next.push(v);
  }
  for(let k=0;k<next.length;k++){const q=(k+1)%next.length;indices.push(previous[q],previous[k],next[k],previous[q],next[k],next[q]);}
  previous=next;sections.push(next);
 }
 const attachment=[],cuffIds=cuff.map(({point,normal,source})=>{
  const i=pos.length/3;pos.push(...wrist.toArray());morph.push(...point.clone().sub(wrist).toArray());
  norm.push(...normal.toArray());uv.push(...skinUV);joints.push(upperJoint,0,0,0);weights.push(1,0,0,0);
  attachment.push([source,i]);return i;
 });
 let h=0,c=0;
 while(h<ordered.length||c<cuff.length){
  const a=previous[h%previous.length],b=cuffIds[c%cuffIds.length];
  if(c===cuff.length||(h<ordered.length&&hs[h+1]<=cs[c+1])){
   indices.push(previous[++h%previous.length],a,b);
  }else indices.push(a,b,cuffIds[++c%cuffIds.length]);
 }
 // The wrist rim and the loft share a normal field as well as positions.
 // Account for the changing radius and the final bind-space centreline.
 const surface=new BufferGeometry();
 const reference=Float32Array.from(morph);
 for(let i=0;i<levels.length;i++)offsets[i].clone().applyQuaternion(wristTurn).toArray(reference,i*3);
 surface.setAttribute('position',new BufferAttribute(reference,3));
 surface.setIndex(indices);surface.computeVertexNormals();
 const normals=surface.getAttribute('normal');
 for(let i=0;i<normals.count;i++){
  const amount=i>=levels.length?1:1-smooth((levels[i]+.005)/.026);
  if(amount===0)continue;
  const original=new Vector3().fromArray(norm,i*3);
  const lit=new Vector3().fromBufferAttribute(normals,i);
  if(i<levels.length)lit.applyMatrix3(alignedToBind(1-smooth(-levels[i]/(-bottom)))).normalize();
  original.lerp(lit,amount).normalize().toArray(norm,i*3);
 }

 // Uneven marching-cubes and scan edges must not produce alternating
 // wide flat highlights and narrow dark bands. Sample both tangents at
 // equal perimeter distances rather than weighting thin triangles by area.
 const rows=sections.map(ids=>ids.map(id=>new Vector3().fromArray(reference,id*3)));
 rows.push(anchors);
 for(let row=0;row<sections.length;row++){
  const pts=rows[row],centre=pts.reduce((v,p)=>v.add(p),new Vector3()).divideScalar(pts.length);
  for(let k=0;k<pts.length;k++){
   const u=hs[k],id=sections[row][k];
   const around=sampleLoop(pts,hs,u+.04).sub(sampleLoop(pts,hs,u-.04));
   const along=rows[row+1][k].clone().sub(row?rows[row-1][k]:pts[k]);
   const lit=around.cross(along).normalize();
   if(lit.dot(pts[k].clone().sub(centre))<0)lit.negate();
   lit.toArray(norm,id*3);
  }
 }
 surface.dispose();
 return attachment;
}
