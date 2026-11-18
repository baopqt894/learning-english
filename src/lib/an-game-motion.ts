import {AnimationClip,AnimationMixer, type AnimationAction} from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import files from '../../public/models/an-game-motion/manifest.json' with {type:'json'};
import type {CampusCharacter} from './campus-character.ts';
import type {WorkTask} from './fieldwork.ts';

const library=new Map<string,AnimationClip>();
const pending=new Map<string,Promise<void>>();
const retryAfter=new Map<string,number>();
const loader=new GLTFLoader();

export function loadAnMotion(name:string):Promise<void> {
 const file=(files as Record<string,string>)[name];
 if(!file||library.has(name)||Date.now()<(retryAfter.get(name)??0))return Promise.resolve();
 const existing=pending.get(name);if(existing)return existing;
 const load=(async()=>{
  const compressed=typeof DecompressionStream!=='undefined';
  const response=await fetch('/models/an-game-motion/'+file+(compressed?'.gz':''),{signal:AbortSignal.timeout(20000)});
  if(!response.ok||!response.body)throw Error('Motion '+response.status);
  const buffer=compressed?await new Response(response.body.pipeThrough(new DecompressionStream('gzip'))).arrayBuffer():await response.arrayBuffer();
  const {animations}=await loader.parseAsync(buffer,'');
  const clip=animations.find(c=>c.name===name);
  if(!clip)throw Error('Missing '+name);
  library.set(name,clip);
 })().catch(error=>{retryAfter.set(name,Date.now()+5000);console.warn('Cannot load An motion',name,error);}).finally(()=>pending.delete(name));
 pending.set(name,load);return load;
}

type Layer={action:AnimationAction;elapsed:number;weight:number;phase?:number};
type Playback={mixer:AnimationMixer;layers:Map<string,Layer>;active:string|null};
const players=new WeakMap<CampusCharacter,Playback>();

export function registerAnMotion(rig:CampusCharacter,walk:AnimationClip){
 library.set('Standard Walk',walk);
 players.set(rig,{mixer:new AnimationMixer(rig.group),layers:new Map(),active:null});
}

// Restore the previous frame's underlying pose before procedural tools,
// balance or swimming code writes its pose for this frame.
export function beginAnFrame(rig:CampusCharacter){
 const player=players.get(rig);if(player)player.mixer.stopAllAction();
}

export function playAnMotion(rig:CampusCharacter,name:string|null,dt:number,reduced=false,phase?:number){
 const player=players.get(rig);if(!player)return false;
 const clip=name?library.get(name):undefined;
 if(name&&!clip){if(!pending.has(name))void loadAnMotion(name);name=null;}
 let selected=name?player.layers.get(name):undefined;
 if(name&&clip&&!selected){
  selected={action:player.mixer.clipAction(clip),elapsed:0,weight:0};player.layers.set(name,selected);
 }
 if(selected){if(name!==player.active)selected.elapsed=0;selected.phase=phase;}
 player.active=name;
 const blend=reduced?1:1-Math.exp(-Math.min(dt,.12)*18);
 let total=0;
 for(const [key,layer] of player.layers){
  const target=key===name?1:0;
  layer.weight+=(target-layer.weight)*blend;
  if(!target&&layer.weight<.002){player.layers.delete(key);continue;}
  layer.elapsed+=dt;
  const duration=layer.action.getClip().duration;
  layer.action.play().setEffectiveWeight(layer.weight);
  layer.action.time=layer.phase!==undefined?duration*Math.min(.99999,Math.max(0,layer.phase)):
   reduced?0:layer.elapsed%duration;
  total+=layer.weight;
 }
 if(total){player.mixer.update(0);const base=1-Math.min(1,total);rig.body.rotation.x*=base;rig.body.rotation.z*=base;rig.body.position.y*=base;}
 rig.group.userData.activeMotion=name??'';
 return !!name;
}

export function fieldworkMotion(task:WorkTask|null):string|null{
 if(!task)return null;
 switch(task.action){
  case 'plant':case 'till':return 'dig and plant seeds';
  case 'harvest':return 'pull plant';
  case 'water':return 'watering';
  case 'fill':return 'Crouching Idle';
  case 'grow':return 'Head Nod Yes';
  case 'books':case 'shelve':return 'box idle';
  default:return null;
 }
}
