/** Preserve the Tripo surface; repair skin weights on the Mesh2Motion trial only. */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {Matrix4,Vector3,Quaternion} from 'three';
import {addAnMotionLibrary} from './an-motion-library.mjs';

const source='assets/mesh2motion-exports/an-aligned-trial.glb';
const buffer=await readFile(source),size=buffer.readUInt32LE(12);
const gltf=JSON.parse(buffer.subarray(20,20+size)),binary=Buffer.from(buffer.subarray(28+size));
const original=await readFile('assets/mesh2motion-inputs/cadet-original.glb');
const originalJSON=JSON.parse(original.subarray(20,20+original.readUInt32LE(12)));
function accessor(index){
 const a=gltf.accessors[index],v=gltf.bufferViews[a.bufferView];
 const components={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT4:16}[a.type];
 const [method,width]=({5126:['Float32',4],5123:['Uint16',2],5121:['Uint8',1],5125:['Uint32',4]})[a.componentType];
 const data=new DataView(binary.buffer,binary.byteOffset,binary.byteLength),stride=v.byteStride||components*width,offset=(v.byteOffset||0)+(a.byteOffset||0);
 return {count:a.count,get:(i,k)=>data['get'+method](offset+i*stride+k*width,true),set:(i,k,n)=>data['set'+method](offset+i*stride+k*width,n,true)};
}
const skin=gltf.skins[0],names=skin.joints.map(i=>gltf.nodes[i].name),head=names.indexOf('head'),neck=names.indexOf('neck_01');
const attrs=gltf.meshes[0].primitives[0].attributes,p=accessor(attrs.POSITION),j=accessor(attrs.JOINTS_0),w=accessor(attrs.WEIGHTS_0);
let protectedHeadVertices=0;
const smooth=(a,b,value)=>{const t=Math.max(0,Math.min(1,(value-a)/(b-a)));return t*t*(3-2*t);};
const index=name=>names.indexOf(name);
const bindMatrices=accessor(skin.inverseBindMatrices);
const bindPoint=name=>new Vector3().setFromMatrixPosition(new Matrix4().fromArray(Array.from({length:16},(_,k)=>bindMatrices.get(index(name),k))).invert());
const handFrames=Object.fromEntries(['l','r'].map(side=>{const wrist=bindPoint('hand_'+side);return [side,{wrist,elbow:bindPoint('lowerarm_'+side),axis:bindPoint('middle_01_'+side).sub(wrist).normalize()}];}));
for(let i=0;i<p.count;i++){
 const x=p.get(i,0),y=p.get(i,1),weights=new Map();
 const add=(name,value)=>{if(value>0)weights.set(index(name),(weights.get(index(name))||0)+value);};
 // Smooth, anatomical envelopes replace the discontinuous nearest-bone result.
 // In particular, fingers stay attached to the hand and shoes to the ankle.
 const side=x>=0?'l':'r';
 const lower=1-smooth(.62,.73,y);
 const armThreshold=.31-.09*smooth(.6,.78,y)-.07*smooth(.84,1.01,y);
 const arm=smooth(armThreshold,armThreshold+.08,Math.abs(x))*smooth(.23,.38,y)*(1-smooth(1.01,1.08,y));
 const armFrame=handFrames[side],forearmVector=armFrame.wrist.clone().sub(armFrame.elbow),alongForearm=new Vector3(x,y,p.get(i,2)).sub(armFrame.elbow).dot(forearmVector)/forearmVector.lengthSq();
 const wristBlend=smooth(.7,1.04,alongForearm),elbowBlend=smooth(-.30,.30,alongForearm);
 add('hand_'+side,arm*wristBlend);add('lowerarm_'+side,arm*(1-wristBlend)*elbowBlend);add('upperarm_'+side,arm*(1-wristBlend)*(1-elbowBlend));
 const foot=1-smooth(.12,.22,y),calf=1-smooth(.31,.44,y),left=smooth(-.06,.06,x);
 for(const [suffix,lateral] of [['l',left],['r',1-left]]){
  const leg=(1-arm)*lower*lateral;
  add('foot_'+suffix,leg*foot);add('calf_'+suffix,leg*(1-foot)*calf);add('thigh_'+suffix,leg*(1-foot)*(1-calf));
 }
 const torso=(1-arm)*(1-lower),pelvis=1-smooth(.66,.77,y),lowSpine=1-smooth(.78,.87,y),highSpine=smooth(.88,.99,y);
 add('pelvis',torso*pelvis);add('spine_01',torso*(1-pelvis)*lowSpine);add('spine_02',torso*(1-pelvis)*(1-lowSpine)*(1-highSpine));add('spine_03',torso*(1-pelvis)*(1-lowSpine)*highSpine);
 // Inner fingers extend toward the hips in the exported spread-hand pose.
 // They must follow the wrist, never a nearby thigh/calf envelope.
 const anatomicalArm=smooth(.205,.305,Math.abs(x))*(1-smooth(.88,.98,y))*smooth(.43,.55,y);
 if(anatomicalArm>0){
  for(const [bone,value]of weights)weights.set(bone,value*(1-anatomicalArm));
  add('hand_'+side,anatomicalArm*wristBlend);add('lowerarm_'+side,anatomicalArm*(1-wristBlend)*elbowBlend);add('upperarm_'+side,anatomicalArm*(1-wristBlend)*(1-elbowBlend));
 }
 const handFrame=handFrames[side],alongHand=new Vector3(x,y,p.get(i,2)).sub(handFrame.wrist).dot(handFrame.axis);
 const handRegion=smooth(.265,.305,Math.abs(x))*smooth(-.045,-.005,alongHand)*(1-smooth(.74,.77,y))*smooth(.42,.46,y);
 if(handRegion>0){for(const [bone,value]of weights)weights.set(bone,value*(1-handRegion));add('hand_'+side,handRegion);}
 if(y>=1.02&&y<1.07){const t=smooth(1.02,1.07,y);for(const [bone,value]of weights)weights.set(bone,value*(1-t));add('neck_01',t);}
 // The entire face, ears, hair and cap move rigidly with one head bone.
 // A short collar-only transition avoids a seam without deforming the smile.
 if(y>=1.07){
  let t=Math.min(1,(y-1.07)/.05);t=t*t*(3-2*t);
  weights.clear();weights.set(head,t);weights.set(neck,1-t);
  if(t===1)protectedHeadVertices++;
 }
 const top=[...weights].sort((a,b)=>b[1]-a[1]).slice(0,4),total=top.reduce((sum,item)=>sum+item[1],0);
 for(let k=0;k<4;k++){j.set(i,k,top[k]?.[0]??0);w.set(i,k,(top[k]?.[1]??0)/total);}
}
// An export can capture the current animation pose. Restore the actual bind pose
// from inverse bind matrices, so stopping animation reproduces the input mesh.
const inverse=accessor(skin.inverseBindMatrices),world=new Map();
skin.joints.forEach((node,i)=>world.set(node,new Matrix4().fromArray(Array.from({length:16},(_,k)=>inverse.get(i,k))).invert()));
const parent=new Map();gltf.nodes.forEach((node,i)=>node.children?.forEach(child=>parent.set(child,i)));
for(const index of skin.joints){
 const node=gltf.nodes[index],matrix=world.get(index).clone(),parentWorld=world.get(parent.get(index));
 if(parentWorld)matrix.premultiply(parentWorld.clone().invert());
 const position=new Vector3(),rotation=new Quaternion(),scale=new Vector3();matrix.decompose(position,rotation,scale);
 node.translation=position.toArray();node.rotation=rotation.toArray();node.scale=scale.toArray();delete node.matrix;
}
gltf.materials=structuredClone(originalJSON.materials);gltf.textures=structuredClone(originalJSON.textures);gltf.samplers=structuredClone(originalJSON.samplers);
gltf.images=['color-original.jpg','orm-original.jpg','normal-original.png'].map((name,i)=>({uri:'../tripo-h31/'+name,mimeType:originalJSON.images[i].mimeType}));
// Drop re-encoded image bytes from Mesh2Motion; reference the original atlases.
const lastGeometryView=Math.max(...gltf.accessors.map(a=>a.bufferView));
gltf.bufferViews=gltf.bufferViews.slice(0,lastGeometryView+1);
const length=Math.max(...gltf.bufferViews.map(v=>(v.byteOffset||0)+v.byteLength));
let bin=Buffer.alloc(Math.ceil(length/4)*4);binary.copy(bin,0,0,length);gltf.buffers=[{byteLength:bin.length}];
bin=await addAnMotionLibrary(gltf,bin);
gltf.asset.extras={source:'Tripo H3.1',motion:'22 motion previews with articulated open-to-grip hands',protectedHeadVertices,originalSurfacePreserved:true,articulatedHandSurfaces:true,jointCount:gltf.skins[0].joints.length,articulatedFingersAllPoses:true,textureChanged:false};
const json=Buffer.from(JSON.stringify(gltf)),padded=Buffer.alloc(Math.ceil(json.length/4)*4,32);json.copy(padded);
const header=Buffer.alloc(20);header.writeUInt32LE(0x46546c67);header.writeUInt32LE(2,4);header.writeUInt32LE(28+padded.length+bin.length,8);header.writeUInt32LE(padded.length,12);header.writeUInt32LE(0x4e4f534a,16);
const bh=Buffer.alloc(8);bh.writeUInt32LE(bin.length);bh.writeUInt32LE(0x004e4942,4);
await mkdir('public/models/an-motion-preview',{recursive:true});
await writeFile('public/models/an-motion-preview/an.glb',Buffer.concat([header,padded,bh,bin]));
// A self-contained review export for re-import into Mesh2Motion, with the exact
// original image bytes embedded (no canvas/JPEG re-encoding).
const portable=structuredClone(gltf),chunks=[bin];let portableLength=bin.length;
const originalBin=original.subarray(28+original.readUInt32LE(12));
portable.images=originalJSON.images.map(image=>{
 const view=originalJSON.bufferViews[image.bufferView],bytes=originalBin.subarray(view.byteOffset,view.byteOffset+view.byteLength);
 const chunk=Buffer.alloc(Math.ceil(bytes.length/4)*4);chunk.set(bytes);chunks.push(chunk);
 const index=portable.bufferViews.length;portable.bufferViews.push({buffer:0,byteOffset:portableLength,byteLength:bytes.length});portableLength+=chunk.length;
 return {bufferView:index,mimeType:image.mimeType};
});
portable.buffers=[{byteLength:portableLength}];
const pj=Buffer.from(JSON.stringify(portable)),jp=Buffer.alloc(Math.ceil(pj.length/4)*4,32);jp.set(pj);const ph=Buffer.from(header),pbh=Buffer.from(bh);
ph.writeUInt32LE(28+jp.length+portableLength,8);ph.writeUInt32LE(jp.length,12);pbh.writeUInt32LE(portableLength);
await writeFile('assets/mesh2motion-exports/an-corrected-preview.glb',Buffer.concat([ph,jp,pbh,...chunks]));
console.log({protectedHeadVertices,clips:gltf.animations.map(a=>a.name),bytes:28+padded.length+bin.length});
