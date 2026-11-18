/** Self-contained, unrigged GLBs for the actual Mesh2Motion upload flow. */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {MeshoptDecoder} from 'meshoptimizer';
const manifest=JSON.parse(await readFile('public/models/tripo-h31/manifest.json','utf8'));
await MeshoptDecoder.ready;
await mkdir('assets/mesh2motion-inputs',{recursive:true});
for(const asset of manifest.characters.filter(a=>!process.argv[2]||a.kind===process.argv[2])){
 const bytes=await readFile(`public/models/tripo-h31/${asset.kind}.glb`),len=bytes.readUInt32LE(12),j=JSON.parse(bytes.subarray(20,20+len)),bin=bytes.subarray(28+len),chunks=[];let offset=0;
 for(const v of j.bufferViews){const e=v.extensions?.EXT_meshopt_compression;let out;if(e){out=new Uint8Array(e.count*e.byteStride);MeshoptDecoder.decodeGltfBuffer(out,e.count,e.byteStride,bin.subarray(e.byteOffset,e.byteOffset+e.byteLength),e.mode,e.filter);}else out=bin.subarray(v.byteOffset,v.byteOffset+v.byteLength);const pad=Buffer.alloc(Math.ceil(out.length/4)*4);pad.set(out);chunks.push(pad);v.buffer=0;v.byteOffset=offset;v.byteLength=out.length;delete v.extensions;offset+=pad.length;}
 for(const image of j.images){const out=await readFile('public/models/tripo-h31/'+image.uri);const pad=Buffer.alloc(Math.ceil(out.length/4)*4);pad.set(out);chunks.push(pad);image.bufferView=j.bufferViews.length;j.bufferViews.push({buffer:0,byteOffset:offset,byteLength:out.length});offset+=pad.length;delete image.uri;}
 const mesh=j.meshes.find(m=>m.name===`${asset.kind}_near`)||j.meshes[0];for(const p of mesh.primitives){delete p.attributes.JOINTS_0;delete p.attributes.WEIGHTS_0;}
 j.meshes=[mesh];j.nodes=[{name:asset.kind,mesh:0}];j.scenes=[{nodes:[0]}];j.scene=0;delete j.skins;delete j.animations;
 j.buffers=[{byteLength:offset}];for(const key of ['extensionsUsed','extensionsRequired'])j[key]=(j[key]||[]).filter(e=>e!=='EXT_meshopt_compression');
 const json=Buffer.from(JSON.stringify(j)),jp=Buffer.alloc(Math.ceil(json.length/4)*4,32);json.copy(jp);const h=Buffer.alloc(20);h.writeUInt32LE(0x46546c67,0);h.writeUInt32LE(2,4);h.writeUInt32LE(28+jp.length+offset,8);h.writeUInt32LE(jp.length,12);h.writeUInt32LE(0x4e4f534a,16);const bh=Buffer.alloc(8);bh.writeUInt32LE(offset);bh.writeUInt32LE(0x004e4942,4);await writeFile(`assets/mesh2motion-inputs/${asset.kind}-original.glb`,Buffer.concat([h,jp,bh,...chunks]));console.log(asset.kind,offset,'bytes');
}
