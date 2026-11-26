/** Process the user's actual H3.1 export. Never synthesizes replacement characters. */
import sharp from 'sharp';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import { MeshoptDecoder, MeshoptSimplifier, MeshoptEncoder } from 'meshoptimizer';
import * as T from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { bakeMixamoGameWalk } from './an-mixamo-game-walk.mjs';
import { correctedCadet, fitCastRig, castWeights, packWeights } from './cast-skin.mjs';
import { CHARACTER_PROFILES } from '../src/lib/campus-character-profiles.ts';
const showroom = process.argv.includes('--showroom');
const source = process.argv.slice(2).find(arg=>!arg.startsWith('--')) || 'assets/sources/tripo-cast-h31.glb';
const output = showroom ? 'public/models/cadet-showroom' : 'public/models/tripo-h31';
await mkdir(output, {recursive:true});
const input = await readFile(source), jsonLength=input.readUInt32LE(12);
const gltf=JSON.parse(input.subarray(20,20+jsonLength)), bin=input.subarray(28+jsonLength);
await Promise.all([MeshoptDecoder.ready,MeshoptSimplifier.ready,MeshoptEncoder.ready]);
const views=gltf.bufferViews.map(v=>{
 const e=v.extensions?.EXT_meshopt_compression;
 if(!e)return bin.subarray(v.byteOffset,v.byteOffset+v.byteLength);
 const data=new Uint8Array(e.count*e.byteStride);
 MeshoptDecoder.decodeGltfBuffer(data,e.count,e.byteStride,bin.subarray(e.byteOffset,e.byteOffset+e.byteLength),e.mode,e.filter);return data;
});
const arrays=gltf.accessors.map(a=>{
 const view=views[a.bufferView],d=new DataView(view.buffer,view.byteOffset,view.byteLength),sz={SCALAR:1,VEC2:2,VEC3:3}[a.type];
 const [fn,bytes,scale]={5120:['getInt8',1,a.normalized?127:1],5126:['getFloat32',4,1],5122:['getInt16',2,a.normalized?32767:1],5123:['getUint16',2,a.normalized?65535:1],5125:['getUint32',4,1]}[a.componentType];
 const result=new(a.type==='SCALAR'?Uint32Array:Float32Array)(a.count*sz),stride=gltf.bufferViews[a.bufferView].byteStride||bytes*sz;
 for(let i=0;i<a.count;i++)for(let k=0;k<sz;k++)result[i*sz+k]=d[fn]((a.byteOffset||0)+i*stride+k*bytes,true)/scale;
 return result;
});
const [positions,normals,uvs,indices]=arrays;
// User correction: preserve every texture byte and the original PBR material.
// Defect detection is review-only; no recolouring or automatic scalp painting.
const textureFiles=['color-original.jpg','orm-original.jpg','normal-original.png'];
const textureHashes=[];
for(let i=0;i<textureFiles.length;i++){
 const bytes=Buffer.from(views[gltf.images[i].bufferView]);
 if (!showroom) await writeFile(`${output}/${textureFiles[i]}`,bytes);
 else if (i>0) await sharp(bytes).resize({width:1536,withoutEnlargement:true}).webp({quality:93})
   .toFile(`${output}/${i===1?'surface':'normal'}-mobile.webp`);
 textureHashes.push(createHash('sha256').update(bytes).digest('hex'));
}
// The front-of-body prop bounds include fingers wrapped around the object.
// Use the original atlas to distinguish those skin pixels during binding.
const {data:palette,info:atlas}=await sharp(views[gltf.images[0].bufferView]).removeAlpha().raw().toBuffer({resolveWithObject:true});
function skinConfidence(u,v){
 const x=Math.min(atlas.width-1,Math.max(0,Math.floor(u*atlas.width)));
 const y=Math.min(atlas.height-1,Math.max(0,Math.floor(v*atlas.height)));
 const offset=(y*atlas.width+x)*atlas.channels,r=palette[offset],g=palette[offset+1],b=palette[offset+2];
 return T.MathUtils.smoothstep(r-g,12,33)*T.MathUtils.smoothstep(r,110,172)*T.MathUtils.smoothstep(b,65,110);
}
const rows=[{bounds:[-.3479,-.1615,-.0037,.1492,.3309],kinds:['cadet','linh','minh','library','canteen','mai']},{bounds:[-.3358,-.1673,.0109,.1794,.348],kinds:['nam','thu','khoa','phuc','yen','hai']},{bounds:[-.2687,-.0839,.0927,.2693],kinds:['vy','bao','tram','thao','quang']}];
const buckets=Array.from({length:17},()=>[]),vertexCharacter=new Int8Array(positions.length/3);
for(let i=0;i<vertexCharacter.length;i++){
 const y=positions[i*3+1],z=positions[i*3+2],row=y>.137?0:y>-.122?1:2;
 const col=rows[row].bounds.length-rows[row].bounds.filter(b=>z>b).length;
 vertexCharacter[i]=row*6+col;
}
let crossing=0;
for(let i=0;i<indices.length;i+=3){const ids=[indices[i],indices[i+1],indices[i+2]],c=vertexCharacter[ids[0]];if(ids.some(id=>vertexCharacter[id]!==c)){crossing++;continue;}buckets[c].push(...ids);}
if(crossing)throw Error(`Character boundaries intersect ${crossing} source faces`);
globalThis.FileReader=class{readAsArrayBuffer(blob){blob.arrayBuffer().then(b=>{this.result=b;this.onloadend?.();});}};
const exporter=new GLTFExporter();
const manifest={version:4,source:'Tripo H3.1 user export',sourceSha256:createHash('sha256').update(input).digest('hex'),sourceTriangles:indices.length/3,textures:textureFiles.map((file,i)=>({url:`/models/tripo-h31/${file}`,sha256:textureHashes[i]})),originalMaterial:gltf.materials[0],characters:[]};
for(let c=0;c<(showroom?2:17);c++){
 const kind=rows[Math.floor(c/6)].kinds[c%6],ids=Uint32Array.from(buckets[c]),used=[...new Set(ids)],remap=new Map(used.map((v,i)=>[v,i]));
 const src=used.map(i=>[positions[i*3],positions[i*3+1],positions[i*3+2]]);
 const minY=Math.min(...src.map(p=>p[1])),maxY=Math.max(...src.map(p=>p[1])),height=maxY-minY;
 const feet=src.filter(p=>p[1]<minY+height*.16),cx=(Math.min(...feet.map(p=>p[2]))+Math.max(...feet.map(p=>p[2])))/2;
 const torso=src.filter(p=>p[1]>minY+height*.34&&p[1]<minY+height*.55),cz=(Math.min(...torso.map(p=>p[0]))+Math.max(...torso.map(p=>p[0])))/2;
 const target=['library','canteen','phuc','hai','thao'].includes(kind)?1.94:1.85,scale=target/height;
 let pos=new Float32Array(used.length*3),normal=new Float32Array(used.length*3),uv=new Float32Array(used.length*2);

 for(let i=0;i<used.length;i++){
  const id=used[i],p=src[i];pos.set([-(p[2]-cx)*scale,(p[1]-minY)*scale,(p[0]-cz)*scale],i*3);normal.set([-normals[id*3+2],normals[id*3+1],normals[id*3]],i*3);uv.set([uvs[id*2],uvs[id*2+1]],i*2);

 }
 let compactIndices=Uint32Array.from(ids,id=>remap.get(id));
 let cadetSkin,seamLocks=null;
 if(kind==='cadet'&&!showroom){
  const corrected=correctedCadet();
  ({seamLocks,pos,normal,uv,indices:compactIndices,influences:cadetSkin}=corrected);
 }
 const attrs=new Float32Array(pos.length/3*5);
 for(let i=0;i<pos.length/3;i++)attrs.set([...normal.subarray(i*3,i*3+3),...uv.subarray(i*2,i*2+2)],i*5);
 const root=new T.Group();root.name=kind;root.userData={kind,version:2,assetVersion:4,source:'tripo-h31',backpack:['cadet','nam'].includes(kind),smilingEyes:false};
 const rig=fitCastRig(kind,target,root,showroom),{bones}=rig,vertex=new T.Vector3();
 for(const name of ['eyes_0','eyes_1','lids_0','lids_1','smile','talkingMouth']){const n=new T.Group();n.name=name;bones[1].add(n);}
 const skeleton=new T.Skeleton(bones),material=new T.MeshStandardMaterial({roughness:1,metalness:1});
 const stats={};
 for(const [detail,targetFaces,error]of (showroom ? [['near',70000,.0008]] : [['near',22000,.004],['far',3500,.015]])){
  const [simple]=MeshoptSimplifier.simplifyWithAttributes(compactIndices,pos,3,attrs,5,[.025,.025,.025,.35,.35],seamLocks,Math.min(targetFaces*3,compactIndices.length),error,['Permissive']);
  const selected=[...new Set(simple)],map=new Map(selected.map((v,i)=>[v,i]));
  const geom=new T.BufferGeometry(),p=[],n=[],u=[],skinIndex=[],skinWeight=[];
  for(const id of selected){const x=pos[id*3],y=pos[id*3+1],z=pos[id*3+2];p.push(...[x,y,z].map(v=>Math.round(v*10000)/10000));n.push(...normal.subarray(id*3,id*3+3));u.push(...uv.subarray(id*2,id*2+2));
   const h=y/target;
   const front=z/target,sideways=Math.abs(x)/target;
   const rigidTool=(kind==='phuc'&&h>.16&&h<.49&&front>.025)
    ||(kind==='yen'&&h>.09&&h<.45&&front>.14)
    ||(['map','books','board','tray'].includes(CHARACTER_PROFILES[kind].prop)&&h>.3&&h<.62&&front>.075)
    ||(CHARACTER_PROFILES[kind].carry==='satchel'&&h>.22&&h<.42&&sideways>.15)
    ||(CHARACTER_PROFILES[kind].carry==='backpack'&&h>.28&&h<.6&&front<-.10)
    ||(kind==='library'&&h>.075&&h<.34);
   const freedom=rigidTool?skinConfidence(uv[id*2],uv[id*2+1]):1;
   packWeights(cadetSkin?.[id]||castWeights(vertex.set(x,y,z),rig,target,freedom,rigidTool),skinIndex,skinWeight);
  }
  geom.setAttribute('position',new T.Float32BufferAttribute(p,3));geom.setAttribute('normal',new T.Int16BufferAttribute(n.map(v=>Math.round(Math.max(-1,Math.min(1,v))*32767)),3,true));geom.setAttribute('uv',new T.Uint16BufferAttribute(u.map(v=>Math.round(v*65535)),2,true));geom.setAttribute('skinIndex',new T.Uint16BufferAttribute(skinIndex,4));geom.setAttribute('skinWeight',new T.Uint8BufferAttribute(skinWeight,4,true));geom.setIndex(Array.from(simple,id=>map.get(id)));
  const mesh=new T.SkinnedMesh(geom,material);mesh.name=kind+'_'+detail;mesh.userData={detail,receiveShadow:false};mesh.visible=detail==='near';root.add(mesh);root.updateMatrixWorld(true);mesh.bind(skeleton);stats[detail+'Triangles']=simple.length/3;
 }
 const walk=!showroom&&kind==='cadet'?await bakeMixamoGameWalk(root,bones):undefined;
 const raw=Buffer.from(await exporter.parseAsync(root,{binary:true,onlyVisible:false,trs:true,animations:walk?[walk]:[]}));
 const len=raw.readUInt32LE(12),j=JSON.parse(raw.subarray(20,20+len)),sourceBinary=raw.subarray(28+len);
 // Lossless GPU buffer compression, including UVs and skin weights.
 const chunks=[];let packedOffset=0,decodedOffset=0;
 for(const [vi,v]of j.bufferViews.entries()){
  const a=j.accessors.find(a=>a.bufferView===vi),index=v.target===34963;
  const width={5120:1,5121:1,5122:2,5123:2,5125:4,5126:4}[a.componentType];
  const components={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT4:16}[a.type];
  const size=v.byteStride||width*components;
  const encoded=MeshoptEncoder.encodeGltfBuffer(sourceBinary.subarray(v.byteOffset,v.byteOffset+a.count*size),a.count,size,index?'TRIANGLES':'ATTRIBUTES');
  const bytes=Buffer.alloc(Math.ceil(encoded.length/4)*4);bytes.set(encoded);chunks.push(bytes);
  v.extensions={EXT_meshopt_compression:{buffer:0,byteOffset:packedOffset,byteLength:encoded.length,byteStride:size,count:a.count,mode:index?'TRIANGLES':'ATTRIBUTES'}};
  v.buffer=1;v.byteOffset=decodedOffset;decodedOffset+=v.byteLength;packedOffset+=bytes.length;
 }
 j.buffers=[{byteLength:packedOffset},{byteLength:decodedOffset,extensions:{EXT_meshopt_compression:{fallback:true}}}];
 j.extensionsUsed=[...(j.extensionsUsed||[]),'EXT_meshopt_compression'];j.extensionsRequired=[...(j.extensionsRequired||[]),'EXT_meshopt_compression'];
 const chunkHeader=Buffer.alloc(8);chunkHeader.writeUInt32LE(packedOffset,0);chunkHeader.writeUInt32LE(0x004e4942,4);const binary=Buffer.concat([chunkHeader,...chunks]);
 j.images=textureFiles.map((uri,i)=>({uri:showroom?'../tripo-h31/'+uri:uri,mimeType:gltf.images[i].mimeType}));
 j.textures=structuredClone(gltf.textures);if(gltf.samplers)j.samplers=structuredClone(gltf.samplers);
 j.materials=structuredClone(gltf.materials);
 const js=Buffer.from(JSON.stringify(j)),padded=Buffer.alloc(Math.ceil(js.length/4)*4,32);js.copy(padded);const hdr=Buffer.alloc(20);hdr.writeUInt32LE(0x46546c67,0);hdr.writeUInt32LE(2,4);hdr.writeUInt32LE(20+padded.length+binary.length,8);hdr.writeUInt32LE(padded.length,12);hdr.writeUInt32LE(0x4e4f534a,16);const out=Buffer.concat([hdr,padded,binary]),gz=gzipSync(out,{level:9}),hash=createHash('sha256').update(out).digest('hex').slice(0,12);
 await writeFile(`${output}/${kind}.glb`,out);if (!showroom) await writeFile(`${output}/${kind}.glb.gz`,gz);
 manifest.characters.push({kind,name:CHARACTER_PROFILES[kind].name,url:`/models/tripo-h31/${kind}.glb?v=${hash}`,bytes:out.length,transferBytes:gz.length,...stats,drawCalls:1,joints:bones.length,sourceTriangles:ids.length/3,repairedScalpVertices:0});
 console.log(`${kind}: ${ids.length/3} → ${stats.nearTriangles} near faces, ${Math.round(gz.length/1024)}KB; scalp 0`);
}
if (!showroom) await writeFile(`${output}/manifest.json`,JSON.stringify(manifest,null,2)+'\n');
