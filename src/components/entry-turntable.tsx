'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { useStudent } from './student-support';

function dispose(model: THREE.Object3D) {
  const materials = new Set<THREE.Material>();
  model.traverse(node => {
    if (!(node instanceof THREE.Mesh)) return;
    node.geometry.dispose();
    if (node instanceof THREE.SkinnedMesh) node.skeleton.dispose();
    for (const material of [node.material].flat()) materials.add(material);
  });
  for (const material of materials) {
    const map = (material as THREE.MeshStandardMaterial).map;
    map?.dispose();
    material.dispose();
  }
}

export default function EntryTurntable({avatar}: {avatar: number}) {
  const { t } = useStudent();
  const host = useRef<HTMLDivElement>(null);
  const rotate = useRef<(delta: number) => void>(() => {});
  const pointer = useRef<{id:number; x:number} | null>(null);
  const [state, setState] = useState<'loading'|'ready'|'portrait'>('loading');
  const name = avatar === 1 ? 'Linh' : 'An';
  useEffect(() => {
    const node = host.current;
    if (!node) return;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({alpha:true, antialias:true, powerPreference:'low-power'}); }
    catch { Promise.resolve().then(() => setState('portrait')); return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    node.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const pivot = new THREE.Group();
    scene.add(pivot, new THREE.HemisphereLight(0xfff4dc,0xb7c8b1,1.9));
    const key = new THREE.DirectionalLight(0xfff5e2, 2.2);
    key.position.set(-3,5,4);
    scene.add(key);
    const camera = new THREE.OrthographicCamera(-1,1,1.12,-1.12,.01,20);
    camera.position.set(0,.12,5);
    camera.lookAt(0,0,0);
    let active = true;
    let model: THREE.Object3D | undefined;
    let frame = 0;
    function draw() {
      if (!active || frame) return;
      frame = requestAnimationFrame(() => { frame = 0; renderer.render(scene,camera); });
    }
    const resize = new ResizeObserver(() => {
      const {clientWidth:w,clientHeight:h} = node;
      if (!h || !w) return;
      camera.right = 1.12*w/h;
      camera.left = -camera.right;
      camera.updateProjectionMatrix();
      renderer.setSize(w,h,false);
      draw();
    });
    resize.observe(node);
    rotate.current = delta => { pivot.rotation.y += delta; draw(); };
    const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
    // Keep the original mesh, UVs and colours. Studio lighting only needs the colour atlas.
    loader.register(parser => ({
      name:'CampusEntryMaterial',
      beforeRoot: async () => {
        parser.json.images[0].uri = new URL('/art/entry-uniforms.webp', window.location.origin).href;
        parser.json.images[0].mimeType = 'image/webp';
        for (const material of parser.json.materials) {
          delete material.normalTexture;
          delete material.pbrMetallicRoughness.metallicRoughnessTexture;
          Object.assign(material.pbrMetallicRoughness,{metallicFactor:0,roughnessFactor:.85});
        }
      },
    }));
    loader.load('/models/tripo-h31/'+(avatar===1?'linh':'cadet')+'.glb', gltf => {
      if (!active) { dispose(gltf.scene); return; }
      // GLTFLoader can resolve successfully after a texture request fails.
      const uniform = gltf.scene.getObjectByProperty('isSkinnedMesh', true) as THREE.SkinnedMesh | undefined;
      if (!uniform || !(uniform.material as THREE.MeshStandardMaterial).map) {
        dispose(gltf.scene);
        setState('portrait');
        return;
      }
      model = gltf.scene;
      const bounds = new THREE.Box3().setFromObject(model,true);
      const scale = 2/bounds.getSize(new THREE.Vector3()).y;
      model.scale.setScalar(scale);
      model.position.copy(bounds.getCenter(new THREE.Vector3())).multiplyScalar(-scale);
      pivot.rotation.y = -.13;
      pivot.add(model);
      draw();
      setState('ready');
    },undefined,() => { if (active) setState('portrait'); });
    return () => {
      active=false;
      rotate.current=()=>{};
      resize.disconnect();
      cancelAnimationFrame(frame);
      if (model) dispose(model);
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    };
  }, [avatar]);

  return <div className="entry-turntable" data-state={state}>
    <div className="entry-model" role="group" tabIndex={state==='ready'?0:-1}
      aria-label={name+' · '+t('Character preview')} onKeyDown={e=>{
        if (e.key==='ArrowLeft'||e.key==='ArrowRight') {e.preventDefault();rotate.current(e.key==='ArrowLeft'?-.35:.35);}
      }}
      onPointerDown={e=>{if(!e.isPrimary||e.button!==0)return;pointer.current={id:e.pointerId,x:e.clientX};e.currentTarget.setPointerCapture(e.pointerId);}}
      onPointerMove={e=>{const p=pointer.current;if(p?.id===e.pointerId){rotate.current((e.clientX-p.x)*.015);p.x=e.clientX;}}}
      onLostPointerCapture={()=>{pointer.current=null;}}>
      <div className="entry-plinth" aria-hidden="true"/>
      {state!=='ready' && <span className={'entry-standin cadet-portrait avatar-'+avatar}/>}
      <div className="entry-render" ref={host}/>
    </div>
    <div className="entry-rotation">
      <button type="button" disabled={state!=='ready'} aria-label={t('Turn left')} onClick={()=>rotate.current(-Math.PI/6)}>↶</button>
      <span role="status">{t(state==='ready'?'Drag to rotate':state==='loading'?'Loading character…':'Character portrait')}</span>
      <button type="button" disabled={state!=='ready'} aria-label={t('Turn right')} onClick={()=>rotate.current(Math.PI/6)}>↷</button>
    </div>
  </div>;
}
