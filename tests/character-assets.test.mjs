import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { gunzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Box3, Texture, Quaternion, Vector3 } from 'three';
import { MeshoptDecoder } from 'meshoptimizer';
import { createCampusCharacter, installCharacterAsset, updateCharacterDetail, animateCharacter, setRunningGrip, setHandGrips, sampleCampusWalk, CHARACTER_PROFILES } from '../src/lib/campus-character.ts';

const base = new URL('../public/models/tripo-h31/', import.meta.url);
const manifest = JSON.parse(await readFile(new URL('manifest.json', base), 'utf8'));
const visibleStats = rig => {
  let triangles = 0, meshes = 0;
  rig.group.traverseVisible(o => { if (o.isMesh) { triangles += o.geometry.index.count/3; meshes++; } });
  return { triangles, meshes };
};

test('17 portable GLBs retain articulation, identity, LOD and independent scene resources', async () => {
  assert.deepEqual(manifest.characters.map(c => c.kind).sort(), Object.keys(CHARACTER_PROFILES).sort());
  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  const atlas = new Texture();
  loader.register(() => ({name:'CAMPUS_original_textures',loadTexture:()=>Promise.resolve(atlas)}));
  let totalTransfer = 0;
  for (const asset of manifest.characters) {
    const binary = await readFile(new URL(`${asset.kind}.glb`, base));
    const packed = await readFile(new URL(`${asset.kind}.glb.gz`, base));
    assert.deepEqual(gunzipSync(packed), binary, asset.kind);
    totalTransfer += packed.length;
    assert.equal(packed.length, asset.transferBytes);
    const gltf = await loader.parseAsync(binary.buffer.slice(binary.byteOffset,binary.byteOffset+binary.byteLength), '');
    installCharacterAsset(asset.kind, gltf.scene.children[0], gltf.animations);
    const rig = createCampusCharacter(asset.kind), clone = createCampusCharacter(asset.kind);
    assert.equal(rig.group.userData.kind, asset.kind);
    assert.equal(rig.group.userData.source, 'tripo-h31');
    assert.notEqual(rig.head, clone.head);
    if(asset.kind==='cadet'){
      const imported=gltf.animations.find(clip=>clip.name==='Mixamo_Standard_Walk');
      assert.ok(imported);
      const neutral=rig.leftLeg.quaternion.clone();
      sampleCampusWalk(rig, imported.duration*.25, 1);
      const contact=rig.leftLeg.quaternion.clone();
      animateCharacter(rig,0,false,false);
      assert.ok(rig.leftLeg.quaternion.angleTo(neutral)<1e-6,'stopping restores the base pose');
      sampleCampusWalk(rig, imported.duration*.75, 1);
      assert.ok(rig.leftLeg.quaternion.angleTo(contact)>.3,'both phases reach the live gameplay rig');
      animateCharacter(rig,0,false,false);
      const finger=rig.group.getObjectByName('index_2_l');
      setRunningGrip(rig,1);
      assert.ok(finger.quaternion.angleTo(new Quaternion())>.5);
      assert.ok(clone.group.getObjectByName('index_2_l').quaternion.angleTo(new Quaternion())<1e-6);
      setHandGrips(rig,0,.7);
      assert.ok(rig.group.getObjectByName('index_2_r').quaternion.angleTo(new Quaternion())<1e-6);
      assert.ok(finger.quaternion.angleTo(new Quaternion())>.3);
      setRunningGrip(rig,0);
      assert.ok(finger.quaternion.angleTo(new Quaternion())<1e-6);
    }
    const originalBox = new Box3().setFromObject(rig.group);
    assert.ok(Math.abs(originalBox.min.y) < .02, asset.kind);
    const near = visibleStats(rig);
    assert.ok(near.triangles < 24_000, asset.kind);
    assert.ok(near.meshes <= 18, asset.kind);
    updateCharacterDetail(rig, 19**2);
    const far = visibleStats(rig);
    assert.ok(far.triangles < near.triangles*.31, asset.kind);
    assert.equal(visibleStats(clone).triangles, near.triangles, 'another avatar must not switch LOD');
    updateCharacterDetail(rig, 16**2);
    assert.equal(visibleStats(rig).triangles, far.triangles, 'hysteresis');
    updateCharacterDetail(rig, 30**2, true);
    assert.equal(visibleStats(rig).triangles, near.triangles, 'conversation always uses full detail');
    animateCharacter(rig, .1, true, false);
    assert.equal(rig.talkingMouth.visible, false);
    assert.equal(rig.smile.visible, true);
    animateCharacter(rig, .1, true, true);
    assert.equal(rig.smile.visible, true);
    rig.leftLeg.rotation.x=.5;
    assert.ok(Math.abs(clone.leftLeg.rotation.x)<1e-8);
    const surfaces = [];
    rig.group.traverse(o=>{if(o.isMesh)surfaces.push(o);});
    for(const surface of surfaces){
      const copy=clone.group.getObjectByName(surface.name);
      assert.ok(surface.isSkinnedMesh, 'actual export must deform, not slide as a statue');
      assert.notEqual(surface.skeleton, copy.skeleton);
      assert.equal(surface.skeleton.bones[2], rig.leftLeg);
      assert.equal(copy.skeleton.bones[2], clone.leftLeg);
      assert.equal(surface.skeleton.bones.length,80);
      const {skinIndex,skinWeight}=surface.geometry.attributes;
      const bendWeights=[0,0];
      const helpers=['r','l'].map(side=>rig.group.getObjectByName('elbow_bend_'+side));
      const helperIndices=helpers.map(bone=>surface.skeleton.bones.indexOf(bone));
      for(let v=0;v<skinWeight.count;v++){
        let sum=0;
        for(let k=0;k<4;k++){
          const weight=skinWeight.getComponent(v,k);
          sum+=weight;
          const side=helperIndices.indexOf(skinIndex.getComponent(v,k));
          if(side>=0)bendWeights[side]+=weight;
        }
        assert.ok(Math.abs(sum-1)<1e-5,asset.kind+' skin normalization');
      }
      for(const [side,helper] of helpers.entries()){
        assert.ok(bendWeights[side]>0,asset.kind+' needs a weighted elbow at both LODs');
        const elbow=rig.elbows[side];
        elbow.rotation.x=-1.05;rig.group.updateMatrixWorld(true);
        const shoulder=elbow.position.clone().normalize(),wrist=rig.group.getObjectByName('hand_'+(side?'l':'r')).position.clone().normalize();
        const rest=shoulder.clone().lerp(wrist,.5).normalize();
        const posed=shoulder.clone().lerp(wrist.applyQuaternion(elbow.quaternion),.5).normalize();
        assert.ok(rest.applyQuaternion(helper.quaternion).dot(posed)>.99999,asset.kind+' cross section follows elbow tangent');
        elbow.rotation.x=0;
      }
      assert.notEqual(surface.geometry, copy.geometry);
      assert.notEqual(surface.material, copy.material);
    }
  }
  assert.ok(totalTransfer < 6_000_000, `Mobile cast download: ${totalTransfer}`);
});


test('cast provenance and split retain all source triangles and NPC identities', () => {
  assert.equal(manifest.source, 'Tripo H3.1 user export');
  assert.match(manifest.sourceSha256, /^[a-f0-9]{64}$/);
  assert.equal(manifest.characters.reduce((s,c)=>s+c.sourceTriangles,0), 1_923_248);
  assert.equal(manifest.sourceTriangles, 1_923_248);
  assert.ok(manifest.characters.every(c=>c.repairedScalpVertices === 0), 'No automatic repainting after user correction');
  assert.ok(manifest.characters.every(c=>c.drawCalls===1));
});


test('original Tripo colour, ORM and normal texture bytes and PBR material remain unchanged', async () => {
  const source = await readFile(new URL('../assets/sources/tripo-cast-h31.glb', import.meta.url));
  const length = source.readUInt32LE(12);
  const original = JSON.parse(source.subarray(20, 20 + length));
  const binary = source.subarray(28 + length);
  for (const [index, texture] of manifest.textures.entries()) {
    const image = original.images[index];
    const view = original.bufferViews[image.bufferView];
    const expected = binary.subarray(view.byteOffset, view.byteOffset + view.byteLength);
    const actual = await readFile(new URL(texture.url.split('/').pop(), base));
    assert.deepEqual(actual, expected, 'Do not repaint, grade or downsample the source texture');
    assert.equal(createHash('sha256').update(actual).digest('hex'), texture.sha256);
  }
  for (const asset of manifest.characters) {
    const buffer = await readFile(new URL(`${asset.kind}.glb`, base));
    const json = JSON.parse(buffer.subarray(20, 20 + buffer.readUInt32LE(12)));
    assert.deepEqual(json.materials, original.materials);
    assert.ok(json.meshes.every(mesh => mesh.primitives.every(p => !('COLOR_0' in p.attributes))), 'No added vertex colour tint');
  }
});

test('every Mixamo option binds to An and garden actions crossfade without moving the player between beds', async t => {
  const {loadAnMotion, playAnMotion, beginAnFrame, fieldworkMotion} = await import('../src/lib/an-game-motion.ts');
  const folder = new URL('../public/models/an-game-motion/', import.meta.url);
  const filenames = JSON.parse(await readFile(new URL('manifest.json', folder)));
  const catalog = JSON.parse(await readFile(new URL('../src/lib/an-mixamo-catalog.json', import.meta.url)));
  const names = catalog.flatMap(group => group.items.map(([name]) => name));
  assert.equal(new Set(names).size, 43);
  assert.deepEqual(new Set(['Standard Walk', ...Object.keys(filenames)]), new Set(names));
  const binary = await readFile(new URL('cadet.glb', base));
  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  loader.register(() => ({ name:'qa-atlas', loadTexture:async () => new Texture() }));
  const asset = await loader.parseAsync(binary.buffer.slice(binary.byteOffset,binary.byteOffset+binary.byteLength),'');
  installCharacterAsset('cadet',asset.scene.children[0],asset.animations);
  const rig = createCampusCharacter('cadet');
  rig.group.position.set(22,0,-11);
  t.mock.method(globalThis, 'fetch', async url => new Response(await readFile(new URL(url.split('/').pop(),folder))));
  for (const name of names) {
    await loadAnMotion(name);
    beginAnFrame(rig);
    assert.equal(playAnMotion(rig,name,1/60,false,.5),true,name);
    assert.deepEqual(rig.group.position.toArray(),[22,0,-11]);
    assert.ok(Number.isFinite(rig.head.quaternion.w));
  }
  for (const [action, name] of [['plant','dig and plant seeds'],['water','watering'],['harvest','pull plant']]) {
    assert.equal(fieldworkMotion({action}),name);
    for (let frame=0; frame<30; frame++) {
      animateCharacter(rig,frame/60,false,false);
      playAnMotion(rig,name,1/60,false,.5);
    }
    if (action==='plant'||action==='harvest') {
      const vertical=new Vector3(0,1,0);
      const headUp=vertical.clone().applyQuaternion(rig.head.getWorldQuaternion(new Quaternion()));
      assert.ok(headUp.angleTo(vertical)<Math.PI*.26,action+' keeps the cap up during a deep reach');
    }
    const before=rig.rightArm.quaternion.clone();
    animateCharacter(rig,0,false,false);
    playAnMotion(rig,'Idle',1/60);
    assert.ok(rig.rightArm.quaternion.angleTo(before)<.8,action+' cancellation blends back to idle');
  }
});
