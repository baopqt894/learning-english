import * as THREE from 'three';
import {createCampusCharacter,animateCharacter,setRunningGrip} from './campus-character.ts';
import {playAnMotion} from './an-game-motion.ts';
import {createSwimRaceScene} from './swim-race-scene.ts';
import {ATHLETICS_TRACK,COMPETITIONS,RACE_COLOURS,type CompetitionId} from './competition-catalog.ts';
import {buildSportsVenues,venueSign} from './sports-venue-scene.ts';
import { SWIMMING_POOL } from './campus-districts-layout.ts';
import { STADIUM_FLOORS } from './sports-layout.ts';
import {raceDistance,racePaceMultiplier,raceTime,smoothRaceDistance,type CompetitionRoom} from './competition-engine.ts';
export function createCompetitionScene(scene:THREE.Scene){
 const root=new THREE.Group();scene.add(root);
 let pool: ReturnType<typeof createSwimRaceScene> | null = null;
 buildSportsVenues(root);
 const white=new THREE.MeshStandardMaterial({color:0xf0e3c2,roughness:.9}),wood=new THREE.MeshStandardMaterial({color:0x6a7e54,roughness:.9});
 const box=(w:number,h:number,d:number,x:number,y:number,z:number,material:THREE.Material,parent:THREE.Object3D=root)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);m.position.set(x,y,z);m.receiveShadow=true;m.castShadow=h>.2;parent.add(m);return m;};
 const hurdles=new THREE.Group();root.add(hurdles);hurdles.visible=false;
 const trackLane = (seat:number) => ATHLETICS_TRACK.z + (seat - 1.5) * ATHLETICS_TRACK.laneWidth;
 // Place barriers between the 4 m stopping points so waiting runners land on the track.
 const hurdleOffsets = [6,14,22,30];
 for(const offset of hurdleOffsets)for(let i=0;i<4;i++){const x=ATHLETICS_TRACK.start+offset,z=trackLane(i);for(const s of [-1,1])box(.06,.65,.06,x,.42,z+s*.7,wood,hurdles);box(.09,.09,1.5,x,.77,z,white,hurdles);}
 const makeSeat=(i:number,avatar:number)=>{const rig=createCampusCharacter(avatar===1?'linh':'cadet');rig.group.scale.setScalar(1.1);root.add(rig.group);rig.group.visible=false;
  const tag=venueSign('',0,2.65,0,2.4,.38,rig.group);tag.name='Competition seat label';
  const sack=new THREE.Mesh(new THREE.CylinderGeometry(.32,.27,.83,20),new THREE.MeshStandardMaterial({color:0xa18a60,roughness:1}));sack.position.y=.53;rig.group.add(sack);sack.visible=false;
  const baton=new THREE.Mesh(new THREE.CylinderGeometry(.035,.035,.42,12),new THREE.MeshStandardMaterial({color:RACE_COLOURS[i],roughness:.6}));baton.rotation.z=Math.PI/2;baton.position.set(0,-.25,.11);rig.elbows[1].add(baton);baton.visible=false;
  return {rig,sack,baton,tag,label:''};};
 const seats=Array.from({length:4},()=>new Map<number,ReturnType<typeof makeSeat>>());
 const lanePaces=[1,1,1,1], gaitPhases=[0,0,0,0];
 const characterLanes=[false,false,false,false];
 const swimmerHead=new THREE.Vector3();
 const distances=[0,0,0,0], positions=[0,0,0,0];
 let roundId: string|undefined;
 let active = false;
 return {
  update(view:{mode:CompetitionId;room:CompetitionRoom|null}|null,time:number,reduced:boolean,delta:number){
   if(!view&&!active)return;
   active=!!view;
   const mode=view?.mode??'swimming',definition=COMPETITIONS[mode],room=view?.room??null,lobby=!room||room.phase==='lobby';
   const elapsed=room?Math.max(0,raceTime(room,time)):0;
   const nextRound=room?.round?.id;
   for(let lane=0;lane<4;lane++){
    const member=room?.members[lane];
    const target=room&&member?raceDistance(room,member,elapsed):0;
    positions[lane]=nextRound===roundId&&member?.finishedAt===null?smoothRaceDistance(positions[lane],target,delta):target;
    lanePaces[lane] = room?.round?.streakPace && member?.finishedAt===null ? racePaceMultiplier(room,member.answers.at(-1)?.streak??0) : 1;
    if(nextRound!==roundId) { distances[lane]=positions[lane];gaitPhases[lane]=lane*1.7; }
    if(!reduced) gaitPhases[lane]+=delta*11*(1+(lanePaces[lane]-1)*.45);
   }
   roundId=nextRound;
   const swimming = !!view && mode === 'swimming' && !lobby;
   if (swimming && !pool) pool = createSwimRaceScene(scene);
   characterLanes.fill(false);
   hurdles.visible=!!view&&mode==='hurdles'&&!lobby;
   seats.forEach((variants,i)=>{
    const member=room?.members[i];
    for(const [avatar,seat] of variants)seat.rig.group.visible=!!view&&member?.avatar===avatar;
    if(!view||!member)return;
    let seat=variants.get(member.avatar);
    if(!seat){seat=makeSeat(i,member.avatar);variants.set(member.avatar,seat);}
    const {rig,sack,baton,tag}=seat;
    rig.group.visible=true;
    const label=`${member!.name} · ${member!.kind==='bot'?'BOT':'PLAYER'}`;
    if(seat.label!==label){seat.label=label;const texture=(tag.material as THREE.MeshBasicMaterial).map!,canvas=texture.image as HTMLCanvasElement,ctx=canvas.getContext('2d')!;ctx.fillStyle='#234536';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.fillStyle=member!.colour;ctx.font='600 42px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(label,canvas.width/2,canvas.height/2,canvas.width-20);texture.needsUpdate=true;}
    animateCharacter(rig,time/1000+i,false,reduced);if(lobby)setRunningGrip(rig,0);sack.visible=!lobby&&mode==='sack';baton.visible=!lobby&&mode==='relay';rig.leftLeg.visible=rig.rightLeg.visible=!sack.visible;
    rig.body.rotation.x=0;
    if(swimming){
     const moving=room!.phase==='racing'&&member!.finishedAt===null&&positions[i]>distances[i]+.00001;
     characterLanes[i]=playAnMotion(rig,moving?'Swimming':'Treading Water',moving?delta*(1+(lanePaces[i]-1)*.45):delta,reduced);
     rig.group.visible=characterLanes[i];
     if(rig.group.visible){
      rig.group.rotation.y=Math.PI/2;
      rig.group.position.set(SWIMMING_POOL.x-SWIMMING_POOL.w/2+1+positions[i],0,SWIMMING_POOL.z+(i-1.5)*SWIMMING_POOL.d/4);
      rig.head.getWorldPosition(swimmerHead);
      rig.group.position.y=.34-swimmerHead.y;
     }
     distances[i]=positions[i];
    }else if(lobby){if(mode==='swimming'){rig.group.position.set(58.7,.13,SWIMMING_POOL.z-6.75+i*4.5);rig.group.rotation.y=Math.PI/2;}else{rig.group.position.set(definition.lobby.x+(i-1.5)*3.4,.09,definition.lobby.z);rig.group.rotation.y=0;}rig.leftLeg.rotation.x=rig.rightLeg.rotation.x=0;rig.knees.forEach(k=>k.rotation.x=0);playAnMotion(rig,'Idle',delta,reduced);}
    else{
     const d=positions[i]??0,moving=room!.phase!=='finished'&&member!.finishedAt===null&&d>distances[i]+.00001,cycle=reduced?0:gaitPhases[i];
     if(definition.axis==='x'){rig.group.position.set(definition.start+d,STADIUM_FLOORS.running,trackLane(i));rig.group.rotation.y=Math.PI/2;}else{rig.group.position.set(definition.x+(i-1.5)*4.3,STADIUM_FLOORS.pitch,definition.start-d);rig.group.rotation.y=Math.PI;}
     const hurdle = mode==='hurdles' ? hurdleOffsets.find(at=>Math.abs(d-at)<1.2) : undefined;
     const phase = hurdle===undefined ? undefined : (d-hurdle+1.2)/2.4;
     let jump = phase===undefined ? 0 : Math.sin(phase*Math.PI)*.8;
     setRunningGrip(rig,moving&&!reduced&&mode!=='sack'?1:0,reduced?undefined:delta);
     if(mode==='sack'){jump=moving&&!reduced?Math.abs(Math.sin(cycle*.6))*.4:0;rig.leftArm.rotation.x=rig.rightArm.rotation.x=-.7;}
     else{rig.leftLeg.rotation.x=moving&&!reduced?Math.sin(cycle)*.68:0;rig.rightLeg.rotation.x=-rig.leftLeg.rotation.x;rig.knees.forEach((k,j)=>k.rotation.x=jump>.1?.85:moving&&!reduced?Math.max(0,Math.sin(cycle+j*Math.PI))*.65:0);rig.leftArm.rotation.x=-rig.leftLeg.rotation.x*.7;rig.rightArm.rotation.x=mode==='relay'?-.9:rig.leftLeg.rotation.x*.7;rig.elbows[1].rotation.x=-.65;}
     rig.body.rotation.x=moving?.1:0;
     const jumping=mode==='sack'||jump>0;
     const take=!moving?'Idle':jumping?'Standing Jump':mode==='relay'?'Sprint':'Running';
     const mixed=playAnMotion(rig,take,moving?delta*(1+(lanePaces[i]-1)*.45):delta,reduced,phase);
     if(!mixed&&!reduced)rig.group.position.y+=jump;
     distances[i]=d;
    }
    tag.rotation.y=-rig.group.rotation.y;
    tag.position.y=swimming?(2-rig.group.position.y)/rig.group.scale.y:2.65;
   });
   pool?.update(swimming,positions,delta,reduced,room?.members.length??0,nextRound,characterLanes,lanePaces);
  },
  dispose(){pool?.dispose();const geometries=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>();root.traverse(o=>{if(o instanceof THREE.Mesh){geometries.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material])materials.add(m);}});geometries.forEach(g=>g.dispose());materials.forEach(m=>{if('map'in m){const texture=m.map as THREE.Texture|null;if(texture&&!texture.userData.sharedCharacterAtlas)texture.dispose();}m.dispose();});root.removeFromParent();}
 };
}
