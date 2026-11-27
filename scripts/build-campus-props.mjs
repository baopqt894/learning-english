// Rebuild compact, individually placeable props from the supplied Tripo contact sheet.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import sharp from 'sharp';
import { MeshoptDecoder, MeshoptSimplifier } from 'meshoptimizer';

const file = await readFile(process.argv[2] || 'garden_tools_and_furniture_3d_model.glb');
const jsonSize = file.readUInt32LE(12);
const source = JSON.parse(file.subarray(20, 20 + jsonSize));
const binary = file.subarray(28 + jsonSize);
await Promise.all([MeshoptDecoder.ready, MeshoptSimplifier.ready]);
function view(id) {
  const v = source.bufferViews[id], e = v.extensions?.EXT_meshopt_compression;
  if (!e) return binary.subarray(v.byteOffset, v.byteOffset + v.byteLength);
  const out = new Uint8Array(e.count * e.byteStride);
  MeshoptDecoder.decodeGltfBuffer(out, e.count, e.byteStride, binary.subarray(e.byteOffset, e.byteOffset + e.byteLength), e.mode, e.filter);
  return out;
}
const prim = source.meshes[0].primitives[0];
function floats(id, components) {
  const a = source.accessors[id], v = source.bufferViews[a.bufferView], data = view(a.bufferView);
  if (a.componentType !== 5126 || (v.byteStride && v.byteStride !== components * 4)) throw Error('Unexpected Tripo export format');
  return new Float32Array(data.buffer, data.byteOffset + (a.byteOffset || 0), a.count * components);
}
const pos = floats(prim.attributes.POSITION, 3), uv = floats(prim.attributes.TEXCOORD_0, 2);
const normalView = view(source.accessors[prim.attributes.NORMAL].bufferView);
const normals = new Int8Array(normalView.buffer, normalView.byteOffset, normalView.byteLength);
const stride = source.bufferViews[source.accessors[prim.attributes.NORMAL].bufferView].byteStride || 3;
const indexData = view(source.accessors[prim.indices].bufferView);
const faces = new Uint32Array(indexData.buffer, indexData.byteOffset, source.accessors[prim.indices].count);
const atlas = await sharp(view(source.images[0].bufferView)).resize(2048,2048).jpeg({quality:84,mozjpeg:true}).toBuffer();
// Non-overlapping silhouettes in the 900px orthographic source sheet (front = +X).
const regions = [
  ['watering-can', 12,312,169,440], ['barrow',342,332,524,455], ['basket',542,332,679,455],
  ['planter',684,326,896,455], ['bookshelf',18,454,159,601], ['chair',366,470,490,615],
  ['bench',699,491,895,615], ['hob',180,630,350,715], ['pot',350,615,502,740],
  ['tray',528,650,706,740], ['bucket',732,635,863,760], ['projector',176,768,330,851],
];
const lookup = new Int8Array(900*900).fill(-1);
regions.forEach(([,left,top,right,bottom],id)=>{
  for(let y=top;y<bottom;y++)lookup.fill(id,y*900+left,y*900+right);
});
const owners=new Int8Array(pos.length/3);
for(let i=0;i<owners.length;i++)owners[i]=lookup[Math.floor((.5-pos[i*3+1])*900)*900+Math.floor((.5-pos[i*3+2])*900)];
const subsets=regions.map(()=>[]);
for(let i=0;i<faces.length;i+=3){
  const [a,b,c]=faces.subarray(i,i+3), owner=owners[a];
  if(owners[b]!==owner||owners[c]!==owner)throw Error('A crop intersects source geometry at face '+i/3);
  if(owner>=0)subsets[owner].push(a,b,c);
}
const gltf={asset:{version:'2.0'},scene:0,scenes:[{nodes:[]}],nodes:[],meshes:[],accessors:[],bufferViews:[],buffers:[],
  textures:[{source:0}],images:[{bufferView:0,mimeType:'image/jpeg'}],
  materials:[{pbrMetallicRoughness:{baseColorTexture:{index:0},metallicFactor:0,roughnessFactor:.83}}]};
const chunks=[];let bytes=0;
gltf.bufferViews.push({buffer:0,byteOffset:0,byteLength:atlas.length});
chunks.push(atlas,Buffer.alloc((4-atlas.length%4)%4));bytes=(atlas.length+3)&~3;
function accessor(array,type,componentType,count,extra={}){
  const id=gltf.bufferViews.length, part=Buffer.from(array.buffer,array.byteOffset,array.byteLength);
  gltf.bufferViews.push({buffer:0,byteOffset:bytes,byteLength:part.length});
  const padding=(4-part.length%4)%4; chunks.push(part,Buffer.alloc(padding));bytes+=part.length+padding;
  return gltf.accessors.push({bufferView:id,componentType,type,count,...extra})-1;
}
for(const [id,[name]] of regions.entries()){
  const ids=[...new Set(subsets[id])], reverse=new Map(ids.map((v,i)=>[v,i]));
  const points=new Float32Array(ids.length*3), coords=new Float32Array(ids.length*2);
  const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
  ids.forEach((src,i)=>{
    const p=[-pos[src*3+2],pos[src*3+1],pos[src*3]];
    p.forEach((v,n)=>{min[n]=Math.min(min[n],v);max[n]=Math.max(max[n],v);});points.set(p,i*3);
    coords.set(uv.subarray(src*2,src*2+2),i*2);
  });
  const width=max[0]-min[0], center=[(min[0]+max[0])/2,min[1],(min[2]+max[2])/2];
  for(let i=0;i<points.length;i++)points[i]=(points[i]-center[i%3])/width;
  const [simple]=MeshoptSimplifier.simplifyWithAttributes(Uint32Array.from(subsets[id],i=>reverse.get(i)),points,3,coords,2,[.45,.45],null,6600,.12,['Permissive']);
  const selected=[...new Set(simple)], remap=new Map(selected.map((v,i)=>[v,i]));
  const xyz=new Float32Array(selected.length*3),tex=new Float32Array(selected.length*2),norm=new Float32Array(xyz.length);
  selected.forEach((v,i)=>{
    xyz.set(points.subarray(v*3,v*3+3),i*3);
    const j=ids[v]*stride;norm.set([-normals[j+2]/127,normals[j+1]/127,normals[j]/127],i*3);
    tex.set(coords.subarray(v*2,v*2+2),i*2);
  });
  const positions=accessor(xyz,'VEC3',5126,selected.length,{min:min.map((a,n)=>(a-center[n])/width),max:max.map((a,n)=>(a-center[n])/width)});
  const normal=accessor(norm,'VEC3',5126,selected.length),uvIndex=accessor(tex,'VEC2',5126,selected.length);
  const indices=accessor(Uint16Array.from(simple,i=>remap.get(i)),'SCALAR',5123,simple.length);
  gltf.meshes.push({name,primitives:[{attributes:{POSITION:positions,NORMAL:normal,TEXCOORD_0:uvIndex},indices,material:0}]});
  gltf.nodes.push({name,mesh:id});gltf.scenes[0].nodes.push(id);
  console.log(name,simple.length/3,'triangles');
}
gltf.buffers.push({byteLength:bytes});
const json=Buffer.from(JSON.stringify(gltf)), padded=Buffer.alloc((json.length+3)&~3,32);json.copy(padded);
const header=Buffer.alloc(20);header.write('glTF');header.writeUInt32LE(2,4);header.writeUInt32LE(28+padded.length+bytes,8);header.writeUInt32LE(padded.length,12);header.write('JSON',16);
const binHeader=Buffer.alloc(8);binHeader.writeUInt32LE(bytes);binHeader.write('BIN\0',4);
await mkdir('public/models/environment',{recursive:true});
await writeFile('public/models/environment/school-props.glb',Buffer.concat([header,padded,binHeader,...chunks]));
