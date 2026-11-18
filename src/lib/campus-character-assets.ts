import {loadAnMotion} from './an-game-motion.ts';
import { TextureLoader, SRGBColorSpace } from 'three';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { installCharacterAsset, type CharacterKind } from './campus-character.ts';
import manifest from '../../public/models/tripo-h31/manifest.json';

let preload: Promise<void> | undefined;
/** Three bounded downloads at a time, compressed on mobile, cached for the session. */
export function preloadCampusCharacters(): Promise<void> {
  if (preload) return preload;
  preload = (async () => {
    const essentials=Promise.all(['Waving','Idle','Running'].map(loadAnMotion));
    const queue = [...manifest.characters];
    const atlases = manifest.textures.map((item, index) => {
      const pending = new TextureLoader().loadAsync(item.url).then(texture => {
        if (index === 0) texture.colorSpace = SRGBColorSpace;
        texture.flipY = false;
        texture.userData.sharedCharacterAtlas = true;
        return texture;
      });
      void pending.catch(() => undefined);
      return pending;
    });
    const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
    loader.register(() => ({ name: 'CAMPUS_original_textures', loadTexture: (index: number) => atlases[index] }));
    const deadline = AbortSignal.timeout(45_000);
    await Promise.all(Array.from({ length: 3 }, async () => {
      for (let asset = queue.shift(); asset; asset = queue.shift()) {
        try {
          const compressed = typeof DecompressionStream !== 'undefined';
          const url = compressed ? asset.url.replace('.glb?', '.glb.gz?') : asset.url;
          const response = await fetch(url, { signal: deadline });
          if (!response.ok || !response.body) throw new Error(`HTTP ${response.status}`);
          const buffer = compressed
            ? await new Response(response.body.pipeThrough(new DecompressionStream('gzip'))).arrayBuffer()
            : await response.arrayBuffer();
          const gltf = await loader.parseAsync(buffer, '/models/tripo-h31/');
          const root = gltf.scene.children[0];
          if (!root?.isObject3D) throw new Error('Missing character root');
          installCharacterAsset(asset.kind as CharacterKind, root, gltf.animations);
        } catch (error) {
          // A damaged/uncached file never prevents playing or taking a mission.
          // The procedural rig is an offline/error fallback, never labelled as Tripo.
          console.warn(`Using local character for ${asset.kind}`, error);
        }
      }
    }));
    await essentials;
  })().catch(error => {
    // Network failure must not leave the loading screen unresolved.
    console.warn("Character assets could not be loaded", error);
  });
  return preload;
}
