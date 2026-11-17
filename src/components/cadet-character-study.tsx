"use client";
import Link from 'next/link';
import {useEffect,useRef,useState} from 'react';
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {CHARACTER_HEAD_HEIGHT,CHARACTER_PROFILES,createCampusCharacter,animateCharacter,type CharacterKind} from '@/lib/campus-character';
import { CAMPUS_RESIDENTS } from '@/lib/campus-residents';
import './cadet-character-study.css';

const MAIN_CAST = ['cadet', 'linh', 'minh', 'library', 'canteen'] as const;
/** Review the same real-time mesh used by the campus, under neutral studio light. */
export function CadetCharacterStudy(){
  const host=useRef<HTMLDivElement>(null),[kind,setKind]=useState<CharacterKind>('cadet'),[portrait,setPortrait]=useState(false),[pose,setPose]=useState('idle');
  const options=useRef({portrait,pose});useEffect(()=>{options.current={portrait,pose};},[portrait,pose]);
  useEffect(()=>{
    const node=host.current;if(!node)return;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true }); }
    catch { node.dataset.unavailable = 'true'; return; }
    delete node.dataset.unavailable;
    renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.28;node.appendChild(renderer.domElement);
    const scene=new THREE.Scene();scene.background=new THREE.Color(0xd9dfcb);scene.add(new THREE.HemisphereLight(0xfff3db,0x697961,2.3));
    const key=new THREE.DirectionalLight(0xffe9c9,3.1);key.position.set(-3,5,5);key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.normalBias=.018;key.shadow.camera.left=-3;key.shadow.camera.right=3;key.shadow.camera.top=3;key.shadow.camera.bottom=-3;scene.add(key);
    const fill=new THREE.DirectionalLight(0xe4f4ed,1.7);fill.position.set(3,3,-4);scene.add(fill);
    const rig=createCampusCharacter(kind,kind==='cadet');scene.add(rig.group);
    const ground=new THREE.Mesh(new THREE.CircleGeometry(30,64),new THREE.MeshStandardMaterial({color:0xc1ccb0,roughness:1}));ground.rotation.x=-Math.PI/2;ground.position.y=-.003;ground.receiveShadow=true;scene.add(ground);
    const camera=new THREE.OrthographicCamera(-1.4,1.4,1.4,-1.4,.01,100);camera.position.set(2.7,1.75,5);
    const controls=new OrbitControls(camera,renderer.domElement);controls.enablePan=false;controls.enableDamping=true;controls.minPolarAngle=.75;controls.maxPolarAngle=1.7;controls.minZoom=.75;controls.maxZoom=2;controls.target.set(0,1.1,0);
    let previousPortrait=false;const reduced=matchMedia('(prefers-reduced-motion: reduce)');
    const resize=()=>{renderer.setSize(node.clientWidth,node.clientHeight);const h=options.current.portrait?.73:1.27;camera.top=h;camera.bottom=-h;camera.left=-h*node.clientWidth/node.clientHeight;camera.right=-camera.left;camera.updateProjectionMatrix();};const observer=new ResizeObserver(resize);observer.observe(node);resize();
    renderer.setAnimationLoop(ms=>{const t=ms/1000,o=options.current;
      if(o.portrait!==previousPortrait){controls.target.set(0,o.portrait?CHARACTER_HEAD_HEIGHT+.05:1.05,0);camera.position.set(o.portrait?.9:2.7,o.portrait?1.86:1.62,o.portrait?4:5);camera.zoom=1;resize();previousPortrait=o.portrait;}
      animateCharacter(rig,t,o.pose==='wave',reduced.matches);
      const step=o.pose==='walk'&&!reduced.matches?Math.sin(t*6)*.4:0;rig.leftLeg.rotation.x=step;rig.rightLeg.rotation.x=-step;rig.knees[0].rotation.x=Math.max(0,-step);rig.knees[1].rotation.x=Math.max(0,step);if(o.pose==='walk')rig.leftArm.rotation.x=-step*.7;
      controls.update();renderer.render(scene,camera);
    });
    return()=>{renderer.setAnimationLoop(null);observer.disconnect();controls.dispose();const geometries=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>(),textures=new Set<THREE.Texture>();scene.traverse(o=>{if(o instanceof THREE.Mesh){geometries.add(o.geometry);(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>materials.add(m));}});materials.forEach(m=>Object.values(m).forEach(v=>{if(v instanceof THREE.Texture)textures.add(v);}));geometries.forEach(g=>g.dispose());textures.forEach(t=>t.dispose());materials.forEach(m=>m.dispose());renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();};
  },[kind]);
  const main = MAIN_CAST.find(item => item === kind);
  return <main className="character-study" lang="vi">
    <div className="character-study-canvas" ref={host} role="img" aria-label="Model 3D tương tác. Kéo để xoay."/>
    <div className="character-study-panel">
      <Link href="/">← Về sân trường</Link>
      <h1>Dàn nhân vật</h1>
      <p>Kéo để xoay model đang dùng trong game.</p>
      <fieldset>
        <legend>Nhân vật chính</legend>
        {MAIN_CAST.map(item=><button type="button" key={item} aria-pressed={kind===item} onClick={()=>setKind(item)}>
          {CHARACTER_PROFILES[item].name}
        </button>)}
      </fieldset>
      <label className="character-study-select">
        Nhân vật trong khuôn viên
        <select value={main ? '' : kind} onChange={event => { if (event.target.value) setKind(event.target.value as CharacterKind); }}>
          <option value="" disabled>Chọn NPC</option>
          {CAMPUS_RESIDENTS.map(resident => <option key={resident.kind} value={resident.kind}>
            {CHARACTER_PROFILES[resident.kind].name} · {resident.role}
          </option>)}
        </select>
      </label>
      <fieldset><legend>Khung nhìn</legend>
        <button type="button" aria-pressed={!portrait} onClick={()=>setPortrait(false)}>Toàn thân</button>
        <button type="button" aria-pressed={portrait} onClick={()=>setPortrait(true)}>Chân dung</button>
      </fieldset>
      <fieldset><legend>Chuyển động</legend>
        {([['idle','Đứng'],['wave','Nói'],['walk','Đi bộ']] as const).map(([value,label])=><button type="button" key={value}
          aria-pressed={pose===value} onClick={()=>setPose(value)}>{label}</button>)}
      </fieldset>
      <a href="/concepts/campus-chibi-lineup.webp" target="_blank" rel="noreferrer">Xem concept đã duyệt ↗</a>
    </div>
  </main>;
}
