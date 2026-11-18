"use client";
import Link from 'next/link';
import {useEffect,useRef,useState} from 'react';
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {CHARACTER_HEAD_HEIGHT,CHARACTER_PROFILES,createCampusCharacter,animateCharacter,type CharacterKind} from '@/lib/campus-character';
import { preloadCampusCharacters } from '@/lib/campus-character-assets';
import { CAMPUS_RESIDENTS } from '@/lib/campus-residents';
import './cadet-character-study.css';

const MAIN_CAST = ['cadet', 'linh', 'minh', 'library', 'canteen'] as const;
/** Review the same real-time mesh used by the campus, under neutral studio light. */
export function CadetCharacterStudy(){
  const host=useRef<HTMLDivElement>(null),[kind,setKind]=useState<CharacterKind|'all'>('cadet'),[portrait,setPortrait]=useState(false),[pose,setPose]=useState('idle');
  const [ready,setReady]=useState(false);
  useEffect(()=>{let active=true;preloadCampusCharacters().then(()=>{if(active)setReady(true);});return()=>{active=false;};},[]);
  const options=useRef({portrait,pose});useEffect(()=>{options.current={portrait,pose};},[portrait,pose]);
  useEffect(()=>{
    const node=host.current;if(!node||!ready)return;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true }); }
    catch { node.dataset.unavailable = 'true'; return; }
    delete node.dataset.unavailable;
    renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.7;node.appendChild(renderer.domElement);
    const scene=new THREE.Scene();scene.background=new THREE.Color(0x303234);scene.add(new THREE.HemisphereLight(0xffffff,0x777777,2));
    const key=new THREE.DirectionalLight(0xffffff,2);key.position.set(-3,5,5);key.castShadow=true;key.shadow.mapSize.set(2048,2048);key.shadow.normalBias=.014;key.shadow.radius=2.5;key.shadow.camera.left=-3;key.shadow.camera.right=3;key.shadow.camera.top=3;key.shadow.camera.bottom=-3;scene.add(key);
    const fill=new THREE.DirectionalLight(0xffffff,0);fill.position.set(3,3,-4);scene.add(fill);
    const all=kind==='all';
    const kinds:CharacterKind[]=all?Object.keys(CHARACTER_PROFILES) as CharacterKind[]:[kind];
    const rigs=kinds.map((item,index)=>{
      const rig=createCampusCharacter(item,item==='cadet');
      scene.add(rig.group);
      if(all){
        const row=Math.floor(index/6), col=index%6;
        rig.group.position.set((col-(row===2?2:2.5))*1.6,(2-row)*2.7,0);
        const canvas=document.createElement('canvas');canvas.width=256;canvas.height=64;
        const context=canvas.getContext('2d')!;context.font='600 32px Arial';context.fillStyle='#e9e8df';context.textAlign='center';context.textBaseline='middle';context.fillText(CHARACTER_PROFILES[item].name,128,32);
        const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
        const label=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,depthTest:false}));
        label.position.set(rig.group.position.x,rig.group.position.y-.23,.2);label.scale.set(1.45,.36,1);scene.add(label);
      }
      return rig;
    });
    const ground=new THREE.Mesh(new THREE.CircleGeometry(30,64),new THREE.MeshStandardMaterial({color:0x303234,roughness:1}));ground.rotation.x=-Math.PI/2;ground.position.y=-.003;ground.receiveShadow=true;scene.add(ground);ground.visible=!all;
    const camera=new THREE.OrthographicCamera(-1.4,1.4,1.4,-1.4,.01,100);camera.position.set(2.7,1.75,5);
    const controls=new OrbitControls(camera,renderer.domElement);controls.enablePan=false;controls.enableDamping=true;controls.minPolarAngle=.75;controls.maxPolarAngle=1.7;controls.minZoom=.75;controls.maxZoom=2;controls.target.set(0,all?3.65:1.1,0);if(all){camera.position.set(0,3.65,14);controls.enableRotate=true;}
    let previousPortrait=false;const reduced=matchMedia('(prefers-reduced-motion: reduce)');
    const resize=()=>{renderer.setSize(node.clientWidth,node.clientHeight);const h=all?Math.max(4.05,5.1*node.clientHeight/node.clientWidth):options.current.portrait?.73:1.27;camera.top=h;camera.bottom=-h;camera.left=-h*node.clientWidth/node.clientHeight;camera.right=-camera.left;camera.updateProjectionMatrix();};const observer=new ResizeObserver(resize);observer.observe(node);resize();
    renderer.setAnimationLoop(ms=>{const t=ms/1000,o=options.current;
      if(!all&&o.portrait!==previousPortrait){controls.target.set(0,o.portrait?CHARACTER_HEAD_HEIGHT+.05:1.05,0);camera.position.set(o.portrait?.9:2.7,o.portrait?1.86:1.62,o.portrait?4:5);camera.zoom=1;resize();previousPortrait=o.portrait;}
      for(const [index,rig] of rigs.entries()){animateCharacter(rig,t+index*.21,o.pose==='wave',reduced.matches);
      const step=o.pose==='walk'&&!reduced.matches?Math.sin(t*6)*.4:0;rig.leftLeg.rotation.x=step;rig.rightLeg.rotation.x=-step;rig.knees[0].rotation.x=Math.max(0,-step);rig.knees[1].rotation.x=Math.max(0,step);if(o.pose==='walk'&&!('prop' in CHARACTER_PROFILES[rig.kind]))rig.leftArm.rotation.x=-step*.7;}
      controls.update();renderer.render(scene,camera);
    });
    return()=>{renderer.setAnimationLoop(null);observer.disconnect();controls.dispose();const geometries=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>(),textures=new Set<THREE.Texture>();scene.traverse(o=>{if(o instanceof THREE.Mesh||o instanceof THREE.Sprite){if(o instanceof THREE.Mesh)geometries.add(o.geometry);(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>materials.add(m));}});materials.forEach(m=>Object.values(m).forEach(v=>{if(v instanceof THREE.Texture)textures.add(v);}));geometries.forEach(g=>g.dispose());textures.forEach(t=>{if(!t.userData.sharedCharacterAtlas)t.dispose();});materials.forEach(m=>m.dispose());renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();};
  },[kind,ready]);
  const main = MAIN_CAST.find(item => item === kind);
  return <main className="character-study" lang="vi">
    <div className="character-study-canvas" ref={host} aria-busy={!ready} role="img" aria-label="Model 3D tương tác. Kéo để xoay.">{!ready&&<p className="character-loading" role="status">Đang tải 17 nhân vật…</p>}</div>
    <div className="character-study-panel">
      <Link href="/">← Về sân trường</Link>
      <h1>Dàn nhân vật</h1>
      <p>Kéo để xoay model đang dùng trong game.</p>
      <button className="character-study-all" type="button" aria-pressed={kind==='all'} onClick={()=>{setKind('all');setPortrait(false);}}>Xem đủ 17 nhân vật</button>
      <fieldset>
        <legend>Nhân vật chính</legend>
        {MAIN_CAST.map(item=><button type="button" key={item} aria-pressed={kind===item} onClick={()=>setKind(item)}>
          {CHARACTER_PROFILES[item].name}
        </button>)}
      </fieldset>
      <label className="character-study-select">
        Nhân vật trong khuôn viên
        <select value={main || kind==='all' ? '' : kind} onChange={event => { if (event.target.value) setKind(event.target.value as CharacterKind); }}>
          <option value="" disabled>Chọn NPC</option>
          {CAMPUS_RESIDENTS.map(resident => <option key={resident.kind} value={resident.kind}>
            {CHARACTER_PROFILES[resident.kind].name} · {resident.role}
          </option>)}
        </select>
      </label>
      <fieldset><legend>Khung nhìn</legend>
        <button type="button" aria-pressed={!portrait} onClick={()=>setPortrait(false)}>Toàn thân</button>
        <button type="button" disabled={kind==='all'} aria-pressed={portrait} onClick={()=>setPortrait(true)}>Chân dung</button>
      </fieldset>
      <fieldset><legend>Chuyển động</legend>
        {([['idle','Đứng'],['wave','Nói'],['walk','Đi bộ']] as const).map(([value,label])=><button type="button" key={value}
          aria-pressed={pose===value} onClick={()=>setPose(value)}>{label}</button>)}
      </fieldset>
      <a href="/concepts/lineup-an-v2/character-lineup.png" target="_blank" rel="noreferrer">Xem concept đã duyệt ↗</a>
    </div>
  </main>;
}
