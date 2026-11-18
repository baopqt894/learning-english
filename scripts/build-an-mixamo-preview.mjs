import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {MeshStandardMaterial, Texture} from 'three';
import {FBXLoader} from 'three/addons/loaders/FBXLoader.js';
import {GLTFExporter} from 'three/addons/exporters/GLTFExporter.js';
import {mergeVertices} from 'three/addons/utils/BufferGeometryUtils.js';

// The FBX uses the same UV atlas as An. Reuse the preview's original
// textures and material instead of decoding and embedding a second atlas.
const previewDir = new URL('../public/models/an-motion-preview/', import.meta.url);
const source = await readFile(new URL('../assets/mixamo/An-Standard-Walk.fbx', import.meta.url));
const loader = new FBXLoader();
loader.manager.addHandler(/.*/, {path: '', setPath() {}, load: () => new Texture()});
globalThis.window = {URL};
const character = loader.parse(source.buffer.slice(source.byteOffset, source.byteOffset + source.byteLength), '');
const mesh = character.getObjectByName('An');
const [walk] = character.animations;
if (!mesh?.isSkinnedMesh || !walk?.tracks.length) throw new Error('Missing skinned An or Standard Walk in Mixamo export');
walk.name = 'Mixamo_Standard_Walk';
mesh.material = new MeshStandardMaterial();
mesh.geometry = mergeVertices(mesh.geometry, 1e-7);
const uv = mesh.geometry.attributes.uv;
for (let i = 0; i < uv.count; i++) uv.setY(i, 1 - uv.getY(i));

globalThis.FileReader = class {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then(buffer => { this.result = buffer; this.onloadend?.(); });
  }
};
const glb = Buffer.from(await new GLTFExporter().parseAsync(character, {binary: true, animations: [walk]}));
function jsonChunk(bytes) {
  return JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)));
}
const model = jsonChunk(glb);
const original = jsonChunk(await readFile(new URL('an.glb', previewDir)));
for (const key of ['materials', 'textures', 'images', 'samplers']) model[key] = original[key];
const json = Buffer.from(JSON.stringify(model));
const padding = Buffer.alloc((4 - json.length % 4) % 4, 0x20);
const header = Buffer.from(glb.subarray(0, 20));
const binary = glb.subarray(20 + glb.readUInt32LE(12));
header.writeUInt32LE(20 + json.length + padding.length + binary.length, 8);
header.writeUInt32LE(json.length + padding.length, 12);
await writeFile(new URL('an-standard-walk.glb', previewDir), Buffer.concat([header, json, padding, binary]));

// Store only the bone tracks for the additional FBXs. The page loads a
// selected clip on demand and binds it to the single exported An skeleton.
const groups = JSON.parse(await readFile(new URL('../src/lib/an-mixamo-catalog.json',import.meta.url),'utf8'));
const output = new URL('mixamo/',previewDir);
await mkdir(output,{recursive:true});
for(const {items} of groups)for(const [name] of items){
 if(name==='Standard Walk')continue;
 const directory=name===name.toLowerCase()?'farming':'motions';
 const bytes=await readFile(new URL('../assets/mixamo/'+directory+'/'+name+'.fbx',import.meta.url));
 const source=loader.parse(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
 const [clip]=source.animations;
 if(!clip?.tracks.length)throw Error('Missing Mixamo take: '+name);
 for(const track of clip.tracks){
  if(!character.getObjectByName(track.name.split('.')[0]))throw Error('Foreign bone in '+name+': '+track.name);
 }
 clip.name=name;clip.optimize();
 const rig=character.getObjectByName('mixamorigHips').clone(true);
 const data=await new GLTFExporter().parseAsync(rig,{binary:true,animations:[clip]});
 await writeFile(new URL(name+'.glb',output),Buffer.from(data));
}
