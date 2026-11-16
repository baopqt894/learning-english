import * as THREE from 'three';
import {createCampusCharacter,animateCharacter} from './campus-character.ts';
import {createSwimRaceScene} from './swim-race-scene.ts';
import {COMPETITIONS,RACE_COLOURS,type CompetitionId} from './competition-catalog.ts';
import {buildSportsVenues,venueSign} from './sports-venue-scene.ts';
import { SWIMMING_POOL } from './campus-districts-layout.ts';
import {raceDistance,raceTime,type CompetitionRoom} from './competition-engine.ts';
export function createCompetitionScene(scene:THREE.Scene){
 const root=new THREE.Group();scene.add(root);
 let pool: ReturnType<typeof createSwimRaceScene> | null = null;
 buildSportsVenues(root);
 const white=new THREE.MeshStandardMaterial({color:0xf0e3c2,roughness:.9}),wood=new THREE.MeshStandardMaterial({color:0x6a7e54,roughness:.9});
 const box=(w:number,h:number,d:number,x:number,y:number,z:number,material:THREE.Material,parent:THREE.Object3D=root)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);m.position.set(x,y,z);m.receiveShadow=true;m.castShadow=h>.2;parent.add(m);return m;};
 const hurdles=new THREE.Group();root.add(hurdles);hurdles.visible=false;
 for(const x of [-12,-4,4,12])for(let i=0;i<4;i++){const z=-74+i*2;for(const s of [-1,1])box(.06,.65,.06,x,.42,z+s*.7,wood,hurdles);box(.09,.09,1.5,x,.77,z,white,hurdles);}
 const makeRigs=(avatars:number[])=>Array.from({length:4},(_,i)=>{const rig=createCampusCharacter(avatars[i]===1?'linh':'cadet');rig.group.scale.setScalar(1.1);root.add(rig.group);rig.group.visible=false;
  const tag=venueSign('',0,2.65,0,2.4,.38,rig.group);tag.name='Competition seat label';
  const sack=new THREE.Mesh(new THREE.CylinderGeometry(.32,.27,.83,20),new THREE.MeshStandardMaterial({color:0xa18a60,roughness:1}));sack.position.y=.53;rig.group.add(sack);sack.visible=false;
  const baton=new THREE.Mesh(new THREE.CylinderGeometry(.035,.035,.42,12),new THREE.MeshStandardMaterial({color:RACE_COLOURS[i],roughness:.6}));baton.rotation.z=Math.PI/2;baton.position.set(0,-.25,.11);rig.elbows[1].add(baton);baton.visible=false;
  return {rig,sack,baton,tag,label:''};});
 let rigs:ReturnType<typeof makeRigs>|null=null;
 const distances=[0,0,0,0];
 return {
  update(view:{mode:CompetitionId;room:CompetitionRoom|null}|null,time:number,reduced:boolean){
   const mode=view?.mode??'swimming',definition=COMPETITIONS[mode],room=view?.room??null,lobby=!room||room.phase==='lobby';
   const elapsed=room?Math.max(0,raceTime(room,time)):0;
   const positions=room?room.members.map(m=>raceDistance(room,m,elapsed)):[];
   const swimming = !!view && mode === 'swimming' && !lobby;
   if (swimming && !pool) pool = createSwimRaceScene(scene);
   pool?.update(swimming,positions,elapsed,reduced,room?.phase==='finished',room?.members.length??0);
   hurdles.visible=!!view&&mode==='hurdles'&&!lobby;
   if(view&&room?.members.length&&!rigs)rigs=makeRigs(room.members.map(m=>m.avatar));
   rigs?.forEach(({rig,sack,baton,tag},i)=>{
    const member=room?.members[i];rig.group.visible=!!view&&!!member&&(lobby||mode!=='swimming');if(!rig.group.visible)return;
    const label=`${member!.name} · ${member!.kind==='bot'?'BOT':'PLAYER'}`;
    if(rigs![i].label!==label){rigs![i].label=label;const texture=(tag.material as THREE.MeshBasicMaterial).map!,canvas=texture.image as HTMLCanvasElement,ctx=canvas.getContext('2d')!;ctx.fillStyle='#234536';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.fillStyle=member!.colour;ctx.font='600 42px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(label,canvas.width/2,canvas.height/2,canvas.width-20);texture.needsUpdate=true;}
    animateCharacter(rig,time/1000+i,false,reduced);sack.visible=!lobby&&mode==='sack';baton.visible=!lobby&&mode==='relay';rig.leftLeg.visible=rig.rightLeg.visible=!sack.visible;
    if(lobby){if(mode==='swimming'){rig.group.position.set(58.7,.13,SWIMMING_POOL.z-6.75+i*4.5);rig.group.rotation.y=Math.PI/2;}else if(definition.axis==='x'){rig.group.position.set(-12+i*3.6,.13,-65.15);rig.group.rotation.y=Math.PI;}else{rig.group.position.set(40,.13,1+i*3.2);rig.group.rotation.y=-Math.PI/2;}rig.leftLeg.rotation.x=rig.rightLeg.rotation.x=0;rig.knees.forEach(k=>k.rotation.x=0);}
    else{
     const d=positions[i]??0,moving=room!.phase!=='finished'&&member!.finishedAt===null&&d>distances[i]+.00001,cycle=reduced?0:elapsed*11+i*1.7;
     if(definition.axis==='x'){rig.group.position.set(definition.start+d,.13,-74+i*2);rig.group.rotation.y=Math.PI/2;}else{rig.group.position.set(20.5+i*4.3,.13,definition.start-d);rig.group.rotation.y=Math.PI;}
     let jump=0;if(mode==='hurdles'){const nearest=[8,16,24,32].find(at=>Math.abs(d-at)<1.2);if(nearest!==undefined)jump=Math.sin((d-nearest+1.2)/2.4*Math.PI)*.8;}
     if(mode==='sack'){jump=moving&&!reduced?Math.abs(Math.sin(cycle*.6))*.4:0;rig.leftArm.rotation.x=rig.rightArm.rotation.x=-.7;}
     else{rig.leftLeg.rotation.x=moving&&!reduced?Math.sin(cycle)*.68:0;rig.rightLeg.rotation.x=-rig.leftLeg.rotation.x;rig.knees.forEach((k,j)=>k.rotation.x=jump>.1?.85:Math.max(0,Math.sin(cycle+j*Math.PI))*.65);rig.leftArm.rotation.x=-rig.leftLeg.rotation.x*.7;rig.rightArm.rotation.x=mode==='relay'?-.9:rig.leftLeg.rotation.x*.7;rig.elbows[1].rotation.x=-.65;}
     rig.group.position.y+=reduced?0:jump;rig.body.rotation.x=moving?.1:0;distances[i]=d;
    }
    tag.rotation.y=-rig.group.rotation.y;
   });
  },
  dispose(){pool?.dispose();const geometries=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>();root.traverse(o=>{if(o instanceof THREE.Mesh){geometries.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material])materials.add(m);}});geometries.forEach(g=>g.dispose());materials.forEach(m=>{if('map'in m)(m.map as THREE.Texture|null)?.dispose();m.dispose();});root.removeFromParent();}
 };
}
