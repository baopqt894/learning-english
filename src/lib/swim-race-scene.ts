import * as THREE from 'three';
import {SWIMMING_POOL} from './campus-districts-layout.ts';
import {SWIM_RACERS,SWIM_DISTANCE} from './swim-race.ts';

/** Articulated swimmers in the real campus pool; no second scene or fake race track. */
export function createSwimRaceScene(scene:THREE.Scene){
 const root=new THREE.Group();root.name='English swimming race';root.visible=false;scene.add(root);
 const pool=SWIMMING_POOL,skin=new THREE.Color(0xe8b18b),black=new THREE.Color(0x254846),white=new THREE.Color(0xf2ecd4);
 const rippleGeometry=new THREE.RingGeometry(.3,.32,20);
 type BodyPart={shape:THREE.Object3D;color:THREE.Color};
 let parts:BodyPart[]=[];
 function oval(parent:THREE.Object3D,sx:number,sy:number,sz:number,x:number,y:number,z:number,color:THREE.Color){
  const shape=new THREE.Object3D();
  shape.scale.set(sx,sy,sz);shape.position.set(x,y,z);parent.add(shape);parts.push({shape,color});
 }
 const swimmers=SWIM_RACERS.map((r,index)=>{
  parts=[];
  const group=new THREE.Group();root.add(group);group.rotation.y=Math.PI/2;
  const cap=new THREE.Color(r.color),suit=cap.clone().multiplyScalar(.65);
  oval(group,.258,.142,.47,0,-.035,-.018,suit);oval(group,.217,.123,.243,0,-.045,-.38,suit);
  oval(group,.088,.075,.135,0,.027,.46,skin);oval(group,.234,.195,.237,0,.126,.663,skin);
  oval(group,.241,.155,.216,0,.24,.641,cap);
  const lens=cap.clone().lerp(white,.66);
  for(const side of [-1,1]){
   oval(group,.038,.06,.046,side*.216,.121,.692,skin);
   oval(group,.093,.051,.046,side*.1,.166,.859,black);
   oval(group,.071,.034,.018,side*.1,.167,.894,lens);
   oval(group,.022,.011,.004,side*.1-.013,.183,.911,white);
  }
  oval(group,.053,.012,.016,0,.17,.885,black);
  oval(group,.039,.037,.042,0,.103,.89,skin);
  const arms:THREE.Group[]=[],elbows:THREE.Group[]=[],legs:THREE.Group[]=[];
  for(const side of [-1,1]){
   const arm=new THREE.Group();arm.position.set(side*.27,.015,.29);group.add(arm);arms.push(arm);
   oval(arm,.073,.075,.23,0,0,.19,skin);
   const elbow=new THREE.Group();elbow.position.z=.39;arm.add(elbow);elbows.push(elbow);
   oval(elbow,.054,.06,.2,0,0,.18,skin);oval(elbow,.069,.035,.11,0,0,.4,skin);
   const leg=new THREE.Group();leg.position.set(side*.13,-.06,-.44);group.add(leg);legs.push(leg);
   oval(leg,.092,.085,.24,0,0,-.22,skin);oval(leg,.063,.059,.24,0,-.015,-.61,skin);oval(leg,.07,.035,.14,0,-.01,-.86,skin);
  }
  const wake=new THREE.Group();root.add(wake);
  const ripples=Array.from({length:2},()=>{const m=new THREE.Mesh(rippleGeometry,new THREE.MeshBasicMaterial({color:0xe1f5e5,transparent:true,opacity:.45,depthWrite:false,side:THREE.DoubleSide}));m.rotation.x=-Math.PI/2;wake.add(m);return m;});
  return {group,arms,elbows,legs,wake,ripples,lane:index+1,parts,phase:index*.65,lastDistance:0,blend:0};
 });
 const bodyParts=swimmers.flatMap(swimmer=>swimmer.parts);
 const bodies=new THREE.InstancedMesh(new THREE.SphereGeometry(1,16,12),new THREE.MeshStandardMaterial({roughness:.72}),bodyParts.length);
 bodies.frustumCulled=false;
 bodies.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
 bodyParts.forEach(({color},index)=>bodies.setColorAt(index,color));
 root.add(bodies);
 const hidden=new THREE.Matrix4().makeScale(0,0,0);
 const stroke=new THREE.Euler(), strokeRotation=new THREE.Quaternion();
 function banner(text:string,x:number){
  const canvas=document.createElement('canvas');canvas.width=256;canvas.height=64;const ctx=canvas.getContext('2d')!;ctx.fillStyle='#234b3c';ctx.fillRect(0,0,256,64);ctx.font='bold 30px Arial';ctx.fillStyle='#fff0c8';ctx.textAlign='center';ctx.fillText(text,128,43);
  const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;
  const sign=new THREE.Mesh(new THREE.PlaneGeometry(2.4,.6),new THREE.MeshBasicMaterial({map:tex,side:THREE.DoubleSide}));sign.position.set(x,1.4,pool.z+pool.d/2+.8);root.add(sign);
 }
 const startX=pool.x-pool.w/2+1;banner('START',startX);banner('FINISH',startX+SWIM_DISTANCE);
 const finish=new THREE.Mesh(new THREE.PlaneGeometry(.18,pool.d),new THREE.MeshStandardMaterial({color:white}));finish.rotation.x=-Math.PI/2;finish.position.set(startX+SWIM_DISTANCE,.245,pool.z);root.add(finish);
 let currentRound: string|undefined;
 return {
  update(visible:boolean,distances:number[],delta:number,reduced:boolean,count:number,roundId?:string,characterLanes:readonly boolean[]=[],lanePaces:readonly number[]=[]){
   root.visible=visible;
   if(!visible){currentRound=undefined;return;}
   let partIndex=0;
   const newRound=roundId!==currentRound;
   currentRound=roundId;
   swimmers.forEach((s,i)=>{
    s.wake.visible=i<count;
    if(i>=count)return;
    const distance=distances[i]??0;
    if(newRound){s.lastDistance=distance;s.phase=i*.65;s.blend=0;}
    const speed=Math.max(0,(distance-s.lastDistance)/Math.max(.008,delta));
    s.lastDistance=distance;
    const target=speed>.03&&!reduced?1:0;
    s.blend+=(target-s.blend)*(1-Math.exp(-delta*12));
    if(!reduced)s.phase=(s.phase+delta*(4.5+Math.min(4,speed)*.8))%(Math.PI*2);
    const cycle=s.phase;
    const z=pool.z+(s.lane-2.5)*pool.d/4;
    s.group.position.set(startX+distance,.26+s.blend*Math.sin(cycle*2)*.017,z);
    s.wake.position.set(startX+distance,.245,z);
    for(let side=0;side<2;side++){
     const phase=cycle+side*Math.PI;
     stroke.set(target ? phase : Math.PI*.10,(side?1:-1)*(.14+Math.cos(phase)*.06*s.blend),0);
     s.arms[side].quaternion.slerp(strokeRotation.setFromEuler(stroke),newRound ? 1 : 1-Math.exp(-delta*22));
     s.elbows[side].rotation.x=.15+Math.max(0,Math.sin(phase))*.68*s.blend;
     s.legs[side].rotation.x=Math.sin(phase*2)*.14*s.blend;
    }
    s.group.rotation.z=Math.sin(cycle)*.10*s.blend;
    if(!characterLanes[i])s.group.updateMatrixWorld(true);
    for(const part of s.parts) bodies.setMatrixAt(partIndex++,characterLanes[i]?hidden:part.shape.matrixWorld);
    s.ripples.forEach((ring,n)=>{
     const p=(cycle/(Math.PI*2)+n/2)%1;
     ring.visible=s.blend>.05&&distance>0;
     const pace=lanePaces[i]??1;
     ring.position.set(-.58-p*(1.15+.65*(pace-1)),0,0);ring.scale.set((.65+p)*(1+.25*(pace-1)),.43+p*.45,1);
     (ring.material as THREE.MeshBasicMaterial).opacity=(1-p)*(.42+.22*(pace-1))*s.blend;
    });
   });
   bodies.count=partIndex;
   bodies.instanceMatrix.needsUpdate=true;
  },
  dispose(){const geometries=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>();bodies.dispose();root.traverse(o=>{if(o instanceof THREE.Mesh){geometries.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material])materials.add(m);}});geometries.forEach(g=>g.dispose());materials.forEach(m=>{if(m instanceof THREE.MeshBasicMaterial)m.map?.dispose();m.dispose();});root.removeFromParent();}
 };
}
