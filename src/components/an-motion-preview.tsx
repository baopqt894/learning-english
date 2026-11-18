'use client';

import {useEffect,useRef,useState} from 'react';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {clone} from 'three/addons/utils/SkeletonUtils.js';
import motionGroups from '@/lib/an-mixamo-catalog.json';
import './an-motion-preview.css';

const mixamoWalk = 'Standard Walk';
const motions = [[mixamoWalk,'Đi bộ'],['Idle','Đứng'],['Running','Chạy'],['Waving','Vẫy chào'],['Jumping Jacks','Bật nhảy']] as const;
const previewPath = '/models/an-motion-preview/';

export function AnMotionPreview(){
 const host=useRef<HTMLDivElement>(null);
 const seek=useRef<((fraction:number)=>void)|null>(null);
 const inspectHand=useRef<((close:boolean,side?:'l'|'r')=>void)|null>(null),[handView,setHandView]=useState(false),[handSide,setHandSide]=useState<'l'|'r'>('l');
 const [motion,setMotion]=useState(mixamoWalk),[paused,setPaused]=useState(false),[bones,setBones]=useState(false),[status,setStatus]=useState('Đang tải bản thử…');
 const chooseMotion=(value:string)=>{if(handView){setHandView(false);inspectHand.current?.(false);}setMotion(value);setPaused(false);};
 const state=useRef({motion,paused,bones});
 useEffect(()=>{state.current={motion,paused,bones};},[motion,paused,bones]);
 useEffect(()=>{
  const node=host.current;if(!node)return;
  let disposed=false,renderer:THREE.WebGLRenderer;
  try{renderer=new THREE.WebGLRenderer({antialias:true});}catch{node.textContent='Không thể mở WebGL trên thiết bị này.';return;}
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.7;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;node.appendChild(renderer.domElement);
  const scene=new THREE.Scene();scene.background=new THREE.Color('#303234');scene.add(new THREE.HemisphereLight(0xffffff,0x777777,2));
  const key=new THREE.DirectionalLight(0xffffff,2);key.position.set(-3,5,5);key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.camera.left=-2;key.shadow.camera.right=2;key.shadow.camera.top=3;key.shadow.camera.bottom=-2;key.shadow.normalBias=.01;scene.add(key);
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(30,30),new THREE.MeshStandardMaterial({color:0x303234,roughness:1}));floor.rotation.x=-Math.PI/2;floor.position.y=-.005;floor.receiveShadow=true;scene.add(floor);
  const camera=new THREE.PerspectiveCamera(33,1,.01,40);camera.position.set(0,1.1,4.7);
  const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,1,0);controls.enableDamping=true;controls.enablePan=false;controls.minDistance=2;controls.maxDistance=9;
  const resize=()=>{renderer.setSize(node.clientWidth,node.clientHeight);camera.aspect=node.clientWidth/node.clientHeight;camera.fov=camera.aspect<1?48:33;camera.updateProjectionMatrix();};
  const observer=new ResizeObserver(resize);observer.observe(node);resize();
  const mixer=new THREE.AnimationMixer(scene);
  const actions=new Map<string,THREE.AnimationAction>();
  const travel=new Map<string,THREE.Vector3>();
  const helpers=new Map<THREE.Object3D,THREE.SkeletonHelper>();
  let animated:THREE.Object3D|undefined,lastMotion='',previous=0;
  let pendingSeek:number|null=null;
  let requested='';
  const loader=new GLTFLoader();
  const pending=new Set<string>();
  function showModel(model:THREE.Object3D,x:number){
   const holder=new THREE.Group();
   holder.position.x=x;holder.add(model);scene.add(holder);
   model.traverse(o=>{if(o instanceof THREE.Mesh){o.castShadow=true;if(o instanceof THREE.SkinnedMesh)o.frustumCulled=false;}});
   const helper=new THREE.SkeletonHelper(model);helper.visible=false;scene.add(helper);helpers.set(model,helper);
  }
  const resetPose=(root:THREE.Object3D)=>root.traverse(o=>{if(o instanceof THREE.SkinnedMesh)o.skeleton.pose();});
  loader.loadAsync(previewPath+'an-standard-walk.glb').then(gltf=>{
   if(disposed){disposeObject(gltf.scene);return;}
   const walk=gltf.animations.find(c=>c.name==='Mixamo_Standard_Walk');
   if(!walk){disposeObject(gltf.scene);throw new Error('Missing Mixamo walk');}
   const original=clone(gltf.scene);resetPose(original);showModel(original,-.68);
   animated=gltf.scene;resetPose(animated);showModel(animated,.68);
   actions.set(mixamoWalk,mixer.clipAction(walk,animated));
  }).catch(()=>{if(!disposed)setStatus('Tải model An thất bại. Hãy tải lại trang.');});
  function requestMotion(name:string,model:THREE.Object3D){
   if(actions.has(name)||pending.has(name)||name==='rest')return;
   pending.add(name);
   setStatus('Đang tải '+name+'…');
   loader.loadAsync(previewPath+'mixamo/'+encodeURIComponent(name)+'.glb').then(gltf=>{
    if(disposed)return;
    const clip=gltf.animations.find(c=>c.name===name);
    if(!clip)throw new Error('Missing '+name);
    actions.set(name,mixer.clipAction(clip,model));
    const hips=clip.tracks.find(t=>t.name==='mixamorigHips.position');
    if(hips){
     const delta=new THREE.Vector3().fromArray(hips.values,hips.values.length-3).sub(new THREE.Vector3().fromArray(hips.values));
     delta.y=0;
     if(delta.length()>.65)travel.set(name,delta);
    }
   }).catch(()=>{
    if(!disposed&&state.current.motion===name)setStatus('Tải chuyển động thất bại. Chọn lại để thử.');
   }).finally(()=>pending.delete(name));
  }
  inspectHand.current=(close,side='l')=>{
   if(close){
    const hand=animated?.getObjectByName(side==='l'?'mixamorigLeftHand':'mixamorigRightHand');
    if(hand){const target=hand.getWorldPosition(new THREE.Vector3());controls.target.copy(target);camera.position.copy(target).add(new THREE.Vector3(0,.02,.65));controls.minDistance=.25;}
   }else{controls.minDistance=2;controls.target.set(0,1,0);camera.position.set(0,1.1,4.7);}
   controls.update();
  };
  seek.current=fraction=>{pendingSeek=fraction;};
  renderer.setAnimationLoop(ms=>{
   const dt=Math.min(.05,previous?(ms-previous)/1000:0);previous=ms;
   const current=state.current;
   if(!animated){controls.update();renderer.render(scene,camera);return;}
   if(requested!==current.motion){
    requested=current.motion;
    requestMotion(requested,animated);
   }
   floor.visible=!['Swimming','Treading Water'].includes(current.motion);
   const action=actions.get(current.motion);
   if(current.motion!==lastMotion&&(action||current.motion==='rest')){
    mixer.stopAllAction();resetPose(animated);
    action?.reset().setEffectiveWeight(1).play();mixer.update(0);
    lastMotion=current.motion;
    setStatus('Kéo để xoay và xem từ bên cạnh.');
   }
   if(action&&pendingSeek!==null){
    mixer.stopAllAction();action.reset().setEffectiveWeight(1).play();action.time=action.getClip().duration*pendingSeek;mixer.update(0);pendingSeek=null;
   }else if(!current.paused&&action)mixer.update(dt);
   // Keep forward-travelling takes inside the comparison viewport. Leave the
   // vertical jump and the hip sway from the original take intact.
   const drift=travel.get(lastMotion),played=actions.get(lastMotion);
   const phase=played?played.time/played.getClip().duration:0;
   animated.position.set(drift?-drift.x*phase:0,0,drift?-drift.z*phase:0);
   for(const [model,helper] of helpers)helper.visible=current.bones&&model.visible;
   controls.update();renderer.render(scene,camera);
  });
  return()=>{disposed=true;seek.current=null;inspectHand.current=null;renderer.setAnimationLoop(null);mixer.stopAllAction();if(animated)mixer.uncacheRoot(animated);observer.disconnect();controls.dispose();disposeObject(scene);renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();};
 },[]);
 return <main className="an-motion-preview">
  <header><span>AN · XEM TRƯỚC CHUYỂN ĐỘNG</span><h1>Thử từng dáng chuyển động.</h1><p>Chọn một chuyển động Mixamo hoặc kéo thanh thời gian để xem từng tư thế.</p></header>
  <div className="an-motion-canvas" ref={host} aria-label="So sánh dáng gốc bên trái và chuyển động bên phải"/>
  <div className="an-motion-labels">{handView?<span>CẬN CẢNH BÀN TAY · KÉO ĐỂ XOAY</span>:<><span>DÁNG GỐC</span><span>{motion==='rest'?'DÁNG GỐC':motion.toUpperCase()}</span></>}</div>
  <footer><p role="status">{status}</p><div className="an-motion-controls">
   {motions.map(([value,label])=><button key={value} aria-pressed={motion===value} onClick={()=>chooseMotion(value)}>{label}</button>)}
   <button aria-pressed={paused} onClick={()=>setPaused(!paused)}>{paused?'Tiếp tục':'Tạm dừng'}</button>
   <button aria-pressed={bones} onClick={()=>setBones(!bones)}>Hiện xương</button>
   <button aria-pressed={handView} onClick={()=>{if(!handView)setPaused(true);setHandView(!handView);inspectHand.current?.(!handView,handSide);}}>{handView?'Toàn thân':'Cận bàn tay'}</button>
   {handView&&<button onClick={()=>{const side=handSide==='l'?'r':'l';setHandSide(side);inspectHand.current?.(true,side);}}>Xem tay {handSide==='l'?'phải':'trái'}</button>}
  </div><label className="an-motion-library">Thêm động tác <select aria-label="Chọn động tác" value={motion} onChange={e=>chooseMotion(e.target.value)}><option value="rest">Dáng gốc · không chuyển động</option>{motionGroups.map(group=><optgroup label={group.label} key={group.label}>{group.items.map(([value,label])=><option key={value} value={value}>{label}</option>)}</optgroup>)}</select></label><label className="an-motion-scrub">Xem từng tư thế <input type="range" min="0" max="100" defaultValue="0" aria-label="Vị trí chuyển động" onChange={e=>{setPaused(true);seek.current?.(Number(e.target.value)/100);}}/></label><a className="an-motion-reference" href="/concepts/an-motion-reference/walk-run-fists.png" target="_blank" rel="noreferrer">Xem ảnh tham khảo đi–chạy ↗</a><small>Xem khung xương trên các nhân vật trong game tại <a href="/character-study">Dàn nhân vật</a>.</small></footer>
 </main>;
}

function disposeObject(root:THREE.Object3D){
 const geometries=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>(),textures=new Set<THREE.Texture>(),skeletons=new Set<THREE.Skeleton>();
 root.traverse(o=>{if(o instanceof THREE.Mesh||o instanceof THREE.LineSegments){geometries.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material])materials.add(m);}if(o instanceof THREE.SkinnedMesh)skeletons.add(o.skeleton);});
 materials.forEach(m=>Object.values(m).forEach(v=>{if(v instanceof THREE.Texture)textures.add(v);}));geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());skeletons.forEach(s=>s.dispose());
}
