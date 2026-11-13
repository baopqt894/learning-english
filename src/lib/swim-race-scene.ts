import * as THREE from 'three';
import {SWIMMING_POOL} from './campus-districts-layout.ts';
import {SWIM_RACERS,SWIM_DISTANCE} from './swim-race.ts';

/** Articulated swimmers in the real campus pool; no second scene or fake race track. */
export function createSwimRaceScene(scene:THREE.Scene){
 const root=new THREE.Group();root.name='English swimming race';root.visible=false;scene.add(root);
 const pool=SWIMMING_POOL,skin=new THREE.MeshStandardMaterial({color:0xe8b18b,roughness:.75});
 const black=new THREE.MeshStandardMaterial({color:0x254846,roughness:.4});
 const white=new THREE.MeshStandardMaterial({color:0xf2ecd4,roughness:.75});
 function oval(parent:THREE.Object3D,sx:number,sy:number,sz:number,x:number,y:number,z:number,material:THREE.Material){const m=new THREE.Mesh(new THREE.SphereGeometry(1,20,14),material);m.scale.set(sx,sy,sz);m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;parent.add(m);return m;}
 const swimmers=SWIM_RACERS.map((r,index)=>{
  const group=new THREE.Group();root.add(group);group.rotation.y=Math.PI/2;
  const suit=new THREE.MeshStandardMaterial({color:new THREE.Color(r.color).multiplyScalar(.65),roughness:.82}),cap=new THREE.MeshStandardMaterial({color:r.color,roughness:.65});
  oval(group,.26,.135,.43,0,-.035,0,suit);oval(group,.22,.13,.24,0,-.045,-.38,suit);
  oval(group,.075,.07,.12,0,.04,.46,skin);oval(group,.19,.18,.22,0,.12,.66,skin);
  oval(group,.199,.14,.19,0,.24,.63,cap);
  for(const side of [-1,1]){oval(group,.079,.047,.045,side*.087,.16,.846,black);oval(group,.06,.029,.014,side*.087,.16,.882,white);}
  oval(group,.035,.04,.054,0,.11,.873,skin);
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
  const ripples=Array.from({length:3},()=>{const m=new THREE.Mesh(new THREE.RingGeometry(.3,.32,32),new THREE.MeshBasicMaterial({color:0xe1f5e5,transparent:true,opacity:.45,depthWrite:false,side:THREE.DoubleSide}));m.rotation.x=-Math.PI/2;wake.add(m);return m;});
  return {group,arms,elbows,legs,wake,ripples,lane:index+1};
 });
 function banner(text:string,x:number){
  const canvas=document.createElement('canvas');canvas.width=256;canvas.height=64;const ctx=canvas.getContext('2d')!;ctx.fillStyle='#234b3c';ctx.fillRect(0,0,256,64);ctx.font='bold 30px Arial';ctx.fillStyle='#fff0c8';ctx.textAlign='center';ctx.fillText(text,128,43);
  const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;
  const sign=new THREE.Mesh(new THREE.PlaneGeometry(2.4,.6),new THREE.MeshBasicMaterial({map:tex,side:THREE.DoubleSide}));sign.position.set(x,1.4,pool.z+pool.d/2+.8);root.add(sign);
 }
 const startX=pool.x-pool.w/2+1;banner('START',startX);banner('FINISH',startX+SWIM_DISTANCE);
 const finish=new THREE.Mesh(new THREE.PlaneGeometry(.18,pool.d),white);finish.rotation.x=-Math.PI/2;finish.position.set(startX+SWIM_DISTANCE,.245,pool.z);root.add(finish);
 const lastDistances=[0,0,0,0];
 return {
  update(visible:boolean,distances:number[],time:number,reduced:boolean,paused:boolean,count=4){
   root.visible=visible;if(!visible)return;
   swimmers.forEach((s,i)=>{
    s.group.visible=s.wake.visible=i<count;if(i>=count)return;
    const distance=distances[i]||0,moving=!paused&&distance<SWIM_DISTANCE&&distance>lastDistances[i]+.00001;
    const z=pool.z-pool.d/2+1.5+s.lane*3;
    s.group.position.set(startX+distance,.26,z);s.wake.position.copy(s.group.position);s.wake.position.y=.245;
    const cycle=reduced?0:time*5.5+i*1.8;
    for(let side=0;side<2;side++){
     const phase=cycle+side*Math.PI;
     s.arms[side].rotation.x=moving&&!reduced?phase:Math.PI*.1;
     s.arms[side].rotation.y=(side?1:-1)*.2;s.elbows[side].rotation.x=moving&&!reduced?Math.max(0,Math.sin(phase))*.75:.15;
     s.legs[side].rotation.x=moving&&!reduced?Math.sin(phase*1.6)*.15:0;
    }
    s.group.rotation.z=moving&&!reduced?Math.sin(cycle)*.055:0;
    s.ripples.forEach((r,n)=>{const p=reduced?.5:(time*.8+n/3)%1;r.visible=!paused&&distance>0;r.position.set(-.6-p*1.2,0,0);r.scale.set(.7+p,.45+p*.4,1);(r.material as THREE.MeshBasicMaterial).opacity=(1-p)*.4;});
    lastDistances[i]=distance;
   });
  },
  dispose(){const geometries=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>();root.traverse(o=>{if(o instanceof THREE.Mesh){geometries.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material])materials.add(m);}});geometries.forEach(g=>g.dispose());materials.forEach(m=>{if(m instanceof THREE.MeshBasicMaterial)m.map?.dispose();m.dispose();});root.removeFromParent();}
 };
}
