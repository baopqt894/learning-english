import {Quaternion,Vector3} from 'three';

const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
const xAxis=new Vector3(1,0,0),yAxis=new Vector3(0,1,0);
const stance=.61,reach=.145,duration=1.12;
function step(phase){
 if(phase<stance){
  const t=phase/stance;
  return {z:reach*(1-2*t),pitch:-.13*(1-smooth(t/.23))+.23*smooth((t-.64)/.36),lift:0};
 }
 const t=(phase-stance)/(1-stance);
 const tangent=-2*reach*(1-stance)/stance;
 return {z:-reach+2*reach*smooth(t)+tangent*t*(2*t*t-3*t+1),
  pitch:.23*(1-smooth(t))-.13*smooth(t),lift:.059*Math.sin(Math.PI*t)**2};
}

// Fit the ankle to the lowest point on the actual shoe as it rolls from heel to toe.
export function buildContactWalk(gltf,binary,{append,floats,rest,scene,byName,worldQ,pelvisAt,placeFoot}){
 const clip=gltf.animations.find(c=>c.name==='Walk');
 const position=gltf.accessors[gltf.meshes[0].primitives[0].attributes.POSITION];
 const view=gltf.bufferViews[position.bufferView],start=(view.byteOffset||0)+(position.byteOffset||0);
 const soles={l:[],r:[]};
 for(let i=0;i<position.count;i++){
  const at=start+i*(view.byteStride||12);
  const x=binary.readFloatLE(at),y=binary.readFloatLE(at+4),z=binary.readFloatLE(at+8);
  if(y>.12)continue;
  const side=x<0?'r':'l',ankle=rest.get('foot_'+side).world;
  soles[side].push([y-ankle.y,z-ankle.z]);
 }
 const count=97,times=[],pelvis=[],tracks=new Map();
 const names=['pelvis',...['r','l'].flatMap(side=>['thigh','calf','foot'].map(b=>b+'_'+side))];
 for(const name of names)tracks.set(name,[]);
 for(let frame=0;frame<count;frame++){
  const phase=(frame%(count-1))/(count-1),angle=2*Math.PI*phase;
  for(const [name,r] of rest){const b=byName.get(name);b.position.copy(r.position);b.quaternion.copy(r.q);}
  scene.updateMatrixWorld(true);
  const center=rest.get('pelvis').world.clone();
  center.x+=.017*Math.sin(angle);center.y-=.027+.012*Math.cos(2*angle-.65);
  pelvisAt(center);
  worldQ('pelvis',new Quaternion().setFromAxisAngle(yAxis,-.044*Math.cos(angle)).multiply(rest.get('pelvis').worldQ));
  for(const [side,offset] of [['l',0],['r',.5]]){
   const {z,pitch,lift}=step((phase+offset)%1),cos=Math.cos(pitch),sin=Math.sin(pitch);
   let lowest=Infinity,roll=0;
   for(const [dy,dz] of soles[side]){
    const y=dy*cos-dz*sin;
    if(y<lowest){lowest=y;roll=dz*(1-cos)-dy*sin;}
   }
   const name='foot_'+side,target=rest.get(name).world.clone();
   target.y=.001-lowest+lift;target.z+=z+roll;
   placeFoot(side,target);
   worldQ(name,new Quaternion().setFromAxisAngle(xAxis,pitch).multiply(rest.get(name).worldQ));
  }
  pelvis.push(...byName.get('pelvis').position.toArray());
  times.push(duration*frame/(count-1));
  for(const [name,values] of tracks){
   const q=byName.get(name).quaternion.clone();
   if(values.length&&q.dot(new Quaternion().fromArray(values,values.length-4))<0)q.set(-q.x,-q.y,-q.z,-q.w);
   values.push(...q.toArray());
  }
 }
 clip.samplers=[];clip.channels=[];clip.extras={source:'An heel-to-toe walk',duration};
 const input=append(floats(times),{componentType:5126,type:'SCALAR',count,min:[0],max:[duration]});
 function write(name,path,type,values){
  const output=append(floats(values),{componentType:5126,type,count});
  clip.channels.push({sampler:clip.samplers.length,target:{node:gltf.nodes.findIndex(b=>b.name===name),path}});
  clip.samplers.push({input,output,interpolation:'LINEAR'});
 }
 for(const [name,values] of tracks)write(name,'rotation','VEC4',values);
 write('pelvis','translation','VEC3',pelvis);
}
