'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { showroomClips } from '@/lib/showroom-motion';
import { useStudent } from './student-support';

function dispose(model: THREE.Object3D) {
  const materials = new Set<THREE.Material>();
  model.traverse(node => {
    if (!(node instanceof THREE.Mesh)) return;
    node.geometry.dispose();
    if (node instanceof THREE.SkinnedMesh) node.skeleton.dispose();
    for (const material of [node.material].flat()) materials.add(material);
  });
  const textures = new Set<THREE.Texture>();
  for (const material of materials) {
    for (const value of Object.values(material)) if (value instanceof THREE.Texture) textures.add(value);
    material.dispose();
  }
  for (const texture of textures) texture.dispose();
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
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.13;
    node.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const pivot = new THREE.Group();
    scene.add(pivot, new THREE.HemisphereLight(0xffffff,0xd4caca,2));
    const key = new THREE.DirectionalLight(0xfffaf3, 2.6);
    key.position.set(-3,5,4);
    const fill = new THREE.DirectionalLight(0xe5efff,1.25);
    fill.position.set(3,1.6,4);
    const rim = new THREE.DirectionalLight(0xfff0ce,1.6);
    rim.position.set(1,3,-2);
    scene.add(key,fill,rim);
    const camera = new THREE.OrthographicCamera(-1,1,1.12,-1.12,.01,20);
    camera.position.set(0,.12,5);
    camera.lookAt(0,0,0);
    let active = true;
    let model: THREE.Object3D | undefined;
    let frame = 0;
    const motionPref = window.matchMedia('(prefers-reduced-motion: reduce)');
    let visible = true, lastTime = 0, remaining = 0;
    let mixer: THREE.AnimationMixer | undefined, current: THREE.AnimationAction | undefined;
    const clips = showroomClips(avatar);
    function tick(time:number) {
      frame=0;
      if (!active || !visible || document.hidden) { lastTime=0; return; }
      if (mixer && clips.length && !motionPref.matches) {
        if (time-lastTime>=32 || !lastTime) {
          const dt=lastTime?Math.min((time-lastTime)/1000,.08):0;
          lastTime=time;
          remaining-=dt;
          if (remaining<=0) {
            const others=clips.filter(c=>c!==current?.getClip());
            const pool=others.length?others:clips;
            const clip=current ? pool[Math.floor(Math.random()*pool.length)] : clips[0];
            const next=mixer.clipAction(clip).reset().play();
            if (current && current!==next) next.crossFadeFrom(current,.35,false);
            current=next;
            remaining=Math.max(1.5,clip.duration);
            node!.dataset.motion=clip.name;
          }
          mixer.update(dt);
          renderer.render(scene,camera);
        }
        frame=requestAnimationFrame(tick);
      } else { renderer.render(scene,camera); lastTime=0; }
    }
    function draw() {
      if (active && visible && !document.hidden && !frame) frame=requestAnimationFrame(tick);
    }
    const observer=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;lastTime=0;draw();});
    observer.observe(node);
    document.addEventListener('visibilitychange',draw);
    motionPref.addEventListener('change',draw);
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
    const compact=window.matchMedia('(max-width: 760px)').matches;
    const manager=new THREE.LoadingManager();
    if (compact) manager.setURLModifier(url=>{
      if (url.endsWith('/color-original.jpg')) return '/art/entry-uniforms.webp';
      if (url.endsWith('/normal-original.png')) return '/models/cadet-showroom/normal-mobile.webp';
      if (url.endsWith('/orm-original.jpg')) return '/models/cadet-showroom/surface-mobile.webp';
      return url;
    });
    const loader = new GLTFLoader(manager).setMeshoptDecoder(MeshoptDecoder);
    loader.load('/models/cadet-showroom/'+(avatar===1?'linh':'cadet')+'.glb', gltf => {
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
      pivot.rotation.y = 0;
      pivot.add(model);
      mixer=new THREE.AnimationMixer(model);
      draw();
      setState('ready');
    },undefined,() => { if (active) setState('portrait'); });
    return () => {
      active=false;
      rotate.current=()=>{};
      resize.disconnect();
      observer.disconnect();
      document.removeEventListener('visibilitychange',draw);
      motionPref.removeEventListener('change',draw);
      mixer?.stopAllAction();
      if (model) mixer?.uncacheRoot(model);
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
