/** Rebuild the approved cast offline, with no paid service or runtime simplification. */
import { mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { SimplifyModifier } from 'three/addons/modifiers/SimplifyModifier.js';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { Uint8BufferAttribute, Int16BufferAttribute, Mesh } from 'three';
import { buildCampusCharacter, CHARACTER_PROFILES } from '../src/lib/campus-character.ts';

// GLTFExporter only needs this browser primitive for its binary Blob result.
globalThis.FileReader = class {
  readAsArrayBuffer(blob) { blob.arrayBuffer().then(buffer => { this.result = buffer; this.onloadend?.(); }); }
};
const output = new URL('../public/models/cast-v2/', import.meta.url);
await mkdir(output, { recursive: true });
const manifest = { version: 2, source: '/concepts/lineup-an-v2/character-lineup.png', characters: [] };
const exporter = new GLTFExporter(), simplifier = new SimplifyModifier();
for (const kind of Object.keys(CHARACTER_PROFILES)) {
  const rig = buildCampusCharacter(kind);
  const meshes = [];
  rig.group.traverse(o => { if (o.isMesh) meshes.push(o); });
  let nearTriangles = 0, farTriangles = 0;
  for (const [index, mesh] of meshes.entries()) {
    // No textures: UV seams only duplicate vertices and cost memory.
    const source = mesh.geometry;
    source.deleteAttribute('uv');
    const color = source.attributes.color;
    source.setAttribute('color', new Uint8BufferAttribute(Array.from(color.array, value => Math.round(Math.min(1, Math.max(0, value)) * 255)), 3, true));
    const welded = mergeVertices(source, .00001);
    source.dispose();
    mesh.geometry = welded;
    mesh.name = `surface_${index}`;
    mesh.userData = { detail: 'near', receiveShadow: mesh.receiveShadow };
    nearTriangles += welded.index.count / 3;
    const low = new Mesh(await simplifier.modify(welded, Math.floor(welded.attributes.position.count * .82)), mesh.material);
    low.name = `distant_${index}`;
    low.userData = { detail: 'far', receiveShadow: false };
    low.visible = false;
    mesh.parent.add(low);
    // Sub-millimetre precision in scene units, using standard KHR_mesh_quantization.
    // Both LODs share the same decode scale, so switching cannot shift the feet.
    for (const surface of [mesh, low]) {
      const geometry = surface.geometry;
      const position = geometry.attributes.position, normal = geometry.attributes.normal;
      const points = Array.from(position.array, value => {
        if (Math.abs(value) > 2) throw new Error(`Quantization range exceeded: ${kind}`);
        return Math.round(value / 2 * 32767);
      });
      geometry.setAttribute('position', new Int16BufferAttribute(points, 3, true));
      geometry.setAttribute('normal', new Int16BufferAttribute(Array.from(normal.array, value => Math.round(Math.min(1,Math.max(-1,value)) * 32767)), 3, true));
      surface.scale.setScalar(2);
    }
    farTriangles += low.geometry.index.count / 3;
  }
  const data = Buffer.from(await exporter.parseAsync(rig.group, { binary: true, onlyVisible: false, trs: true }));
  const hash = createHash('sha256').update(data).digest('hex').slice(0,12);
  await writeFile(new URL(`${kind}.glb`, output), data);
  const compressed = gzipSync(data, {level:9});
  await writeFile(new URL(`${kind}.glb.gz`, output), compressed);
  manifest.characters.push({ kind, name: CHARACTER_PROFILES[kind].name, url: `/models/cast-v2/${kind}.glb?v=${hash}`, bytes: data.length, transferBytes: compressed.length, nearTriangles, farTriangles, drawCalls: meshes.length });
  console.log(`${kind}: ${(data.length/1024).toFixed(0)} KB; ${nearTriangles} → ${farTriangles} triangles; ${meshes.length} pivots`);
}
await writeFile(new URL('manifest.json', output), JSON.stringify(manifest, null, 2) + '\n');
