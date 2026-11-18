import {Matrix4,Quaternion,Vector3} from 'three';
import {setHandWithForearmRoll} from './an-hand-alignment.mjs';

const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
const xAxis=new Vector3(1,0,0),zAxis=new Vector3(0,0,1);

// Two short hops per repetition. Move the shoes sideways only during
// flight, and let the knees absorb each landing before the next takeoff.
export function buildJumpingJack(gltf,{append,floats,rest,scene,byName,pointBone,worldQ,pelvisAt,placeFoot}){
 const clip=gltf.animations.find(c=>c.name==='Jumping_Jacks');
 const duration=1.6,count=97,times=[],pelvis=[];
 const sides=[['r',-1],['l',1]];
 const nodes=new Map(gltf.nodes.map((n,i)=>[n.name,i]));
 const tracks=new Map(gltf.skins[0].joints.map(id=>[gltf.nodes[id].name,[]]));
 clip.channels=[];clip.samplers=[];
 for(let i=0;i<count;i++){
  const phase=i/(count-1),half=(phase*2)%1,opening=phase<.5||phase===1;
  const t=Math.max(0,Math.min(1,(half-.22)/.52));
  const spread=opening?smooth(t):1-smooth(t);
  const flight=4*t*(1-t);
  // The contact interval straddles the boundary between the two hops.
  const contact=(half>=.74?half-.74:half+.26)/.48;
  const compression=half<.22||half>.74?Math.sin(Math.PI*contact)**2:0;
  const sweep=smooth((half-.10)/.76),raise=opening?sweep:1-sweep;
  for(const [n,r] of rest){const bone=byName.get(n);bone.position.copy(r.position);bone.quaternion.copy(r.q);}
  scene.updateMatrixWorld(true);
  const hip=rest.get('pelvis').world.clone();
  hip.y+=-.018-.034*spread-.054*compression+.095*flight;
  pelvisAt(hip);
  worldQ('spine_03',new Quaternion().setFromAxisAngle(xAxis,.025+.065*compression).multiply(rest.get('spine_03').worldQ));
  worldQ('head',new Quaternion().setFromAxisAngle(xAxis,.018*compression).multiply(rest.get('head').worldQ));
  for(const [side,sign] of sides){
   const foot='foot_'+side,target=rest.get(foot).world.clone();
   target.x=sign*(.137+.139*spread);
   target.y+=.001+.116*flight;
   placeFoot(side,target);
   worldQ(foot,new Quaternion().setFromAxisAngle(xAxis,.11*flight).multiply(rest.get(foot).worldQ));

   const angle=.23+raise*2.27;
   const follow=smooth((half-.15)/.76);
   const lowerAngle=.34+2.34*(opening?follow:1-follow);
   const armDirection=new Vector3(sign*Math.sin(angle),-Math.cos(angle),.10+.08*raise).normalize();
   const forearm=new Vector3(sign*Math.sin(lowerAngle),-Math.cos(lowerAngle),.24+.15*Math.sin(raise*Math.PI)).normalize();
   const clav='clavicle_'+side;
   worldQ(clav,new Quaternion().setFromAxisAngle(zAxis,sign*.09*raise).multiply(rest.get(clav).worldQ));
   pointBone('upperarm_'+side,'lowerarm_'+side,armDirection);
   pointBone('lowerarm_'+side,'hand_'+side,forearm);

   const hand='hand_'+side,axis=rest.get('middle_01_'+side).world.clone().sub(rest.get(hand).world).normalize();
   const palm=zAxis.clone().addScaledVector(axis,-axis.z).normalize();
   const facing=new Vector3(-sign,0,0).applyAxisAngle(zAxis,sign*lowerAngle);
   facing.z=.20+.50*raise+.42*Math.sin(Math.PI*raise);
   facing.addScaledVector(forearm,-facing.dot(forearm)).normalize();
   const source=new Matrix4().makeBasis(palm.clone().cross(axis),axis,palm);
   const posed=new Matrix4().makeBasis(facing.clone().cross(forearm),forearm,facing);
   const desired=new Quaternion().setFromRotationMatrix(posed.multiply(source.invert())).multiply(rest.get(hand).worldQ);
   setHandWithForearmRoll(side,desired,{byName,rest});
  }
  times.push(phase*duration);pelvis.push(...byName.get('pelvis').position.toArray());
  for(const [name,values] of tracks){
   const q=byName.get(name).quaternion.clone();
   if(values.length&&q.dot(new Quaternion().fromArray(values,values.length-4))<0)q.set(-q.x,-q.y,-q.z,-q.w);
   values.push(...q.toArray());
  }
 }
 const input=append(floats(times),{componentType:5126,type:'SCALAR',count,min:[0],max:[duration]});
 function track(name,path,type,values){
  const output=append(floats(values),{componentType:5126,type,count});
  clip.channels.push({sampler:clip.samplers.length,target:{node:nodes.get(name),path}});
  clip.samplers.push({input,output,interpolation:'LINEAR'});
 }
 for(const [name,values] of tracks)track(name,'rotation','VEC4',values);
 track('pelvis','translation','VEC3',pelvis);
}
