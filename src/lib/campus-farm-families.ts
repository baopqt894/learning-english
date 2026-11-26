import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {sceneryKit} from './campus-scenery-kit';
import {LIVESTOCK_PENS} from './campus-districts-layout';
import {nurseryPens} from './campus-landscape-layout';

type Look='rabbit'|'sheep'|'duckling'|'chick'|'piglet'|'kid';
type Member=[x:number,z:number,size:number];
type Family={look:Look;x:number;z:number;members:Member[]};
const broods:Record<string,{look:Look;members:Member[]}>={
  chicken:{look:'chick',members:[[-2,1.55,.8],[-1.55,2.1,.79],[-.9,1.55,.83],[-.2,1.95,.76],[.48,1.45,.81]]},
  duck:{look:'duckling',members:[[.79,-.47,.86],[1.48,-.20,.79],[2.25,-.01,.83],[2.97,.18,.76],[3.7,.23,.72]]},
  pig:{look:'piglet',members:[[-2.65,3.20,.65],[-1.75,3.42,.59],[-.7,3.22,.63]]},
  goat:{look:'kid',members:[[-1.0,.66,.87],[.10,.52,.79],[1.16,.8,.84]]},
};

function prototype(look:Look){
  const k=sceneryKit(look),dark=0x39352f;
  if(look==='chick'||look==='duckling'){
    const duck=look==='duckling',coat=duck?0xd8bd67:0xf1ca70;
    k.globe(0,.33,0,.49,.48,.60,coat);k.globe(0,.59,.20,.39,.39,.39,0xf3cf79);
    k.leaf(0,.51,.423,duck?.24:.15,.092,.17,0xcc8547);
    for(const s of [-1,1]){
      k.globe(s*.151,.619,.306,.061,.064,.05,dark);
      k.leaf(s*.222,.35,-.035,.1,.25,.34,0xdeae59,s*-.13);
      k.leaf(s*.103,.085,.09,.15,.07,.23,0xc0854b);
    }
  }else if(look==='rabbit'){
    k.globe(0,.35,-.08,.53,.60,.72,0xc3a991);k.globe(0,.59,.27,.46,.44,.45,0xd0bca4);
    for(const s of [-1,1]){
      k.leaf(s*.115,.93,.19,.17,.55,.17,0xc4ac98,-s*.2);
      k.leaf(s*.115,.94,.25,.083,.38,.077,0xe3b8aa,-s*.2);
      k.globe(s*.18,.64,.38,.070,.076,.056,dark);
      k.globe(s*.192,.19,-.16,.23,.27,.37,0xb49c85);
      k.leaf(s*.125,.12,.24,.16,.12,.28,0xe2ccb1);
    }
    k.globe(0,.39,-.46,.22,.22,.22,0xf4e4c7);k.globe(0,.525,.487,.10,.063,.06,0xb5887c);
  }else{
    const sheep=look==='sheep',pig=look==='piglet',coat=sheep?0xe9ddbd:pig?0xd8a095:0xbd996d;
    const bodyH=sheep?.93:.60, headH=bodyH+.22;
    k.globe(0,bodyH,0,sheep?1.12:.69,sheep?1.03:.62,sheep?1.61:1.03,coat);
    if(sheep)for(let i=0;i<19;i++){
      const a=i*2.4;
      k.globe(Math.cos(a)*.37,bodyH+.18+Math.sin(a)*.21,((i%5)-2)*.25,.46,.49,.51,i%3?0xe6d9b9:0xf2e4c7);
    }
    const face=sheep?0x736960:coat,front=sheep?.76:.49;
    k.globe(0,headH,front,sheep?.53:.42,sheep?.70:.44,.53,face);
    for(const s of [-1,1]){
      k.leaf(s*(sheep?.32:.23),headH+.12,front-.04,.27,.15,.19,face,-s*.42);
      k.globe(s*(sheep?.199:.156),headH+.08,front+.177,.063,.066,.052,dark);
      if(look==='kid')k.leaf(s*.10,headH+.24,front-.05,.075,.22,.071,0x856e4d,-s*.13);
      for(const z of [-1,1]){
        const px=s*(sheep?.31:.20),pz=z*(sheep?.46:.30);
        k.drum(px,bodyH*.45,pz,sheep?.15:.11,bodyH*.8,sheep?.15:.11,face);
        k.globe(px,.10,pz+.025,sheep?.19:.14,.15,sheep?.24:.16,dark);
      }
    }
    if(pig){
      k.globe(0,headH-.07,front+.25,.28,.16,.12,0xc58582);
      for(const s of [-1,1])k.globe(s*.068,headH-.055,front+.31,.027,.039,.021,dark);
      k.hoop(.03,bodyH+.07,-.51,.14,.14,.47,0xc68983);
    }else k.leaf(0,bodyH+.02,sheep?-.76:-.49,.19,.35,.22,coat,.12);
  }
  // Bake the coloured parts once. Every member of the same family uses one draw call.
  const source=k.finish(),parts:THREE.BufferGeometry[]=[];
  const matrix=new THREE.Matrix4(),color=new THREE.Color();
  for(const child of source.children){
    const mesh=child as THREE.InstancedMesh;
    for(let i=0;i<mesh.count;i++){
      mesh.getMatrixAt(i,matrix);mesh.getColorAt(i,color);
      const geometry=mesh.geometry.clone().applyMatrix4(matrix);
      const data=new Float32Array(geometry.getAttribute('position').count*3);
      for(let n=0;n<data.length;n+=3)color.toArray(data,n);
      geometry.setAttribute('color',new THREE.BufferAttribute(data,3));parts.push(geometry);
    }
    mesh.geometry.dispose();mesh.dispose();
  }
  const geometry=mergeGeometries(parts)!;parts.forEach(p=>p.dispose());
  const material=(source.children[0] as THREE.Mesh).material as THREE.Material;material.dispose();
  return geometry;
}

export function createFarmFamilies(){
  const root=new THREE.Group(),transform=new THREE.Object3D();
  const groups:Family[]=[
    ...LIVESTOCK_PENS.map(p=>({x:p.x,z:p.z,...broods[p.kind]})),
    {...nurseryPens[0],look:'rabbit',members:[[-3,.62,1.3],[-1.63,.14,1.15],[-.74,1.35,.85],[.35,.6,1.1],[1.55,.23,.91],[2.61,1.05,.79]]},
    {...nurseryPens[1],look:'sheep',members:[[-3.8,-1.28,1.16],[-2.56,.60,.71],[-.95,-.79,1.05],[.71,.93,.69],[3.38,1.04,.90]]},
  ];
  const material=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.94});
  const families=groups.map(f=>{
    const mesh=new THREE.InstancedMesh(prototype(f.look),material,f.members.length);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);mesh.position.set(f.x,0,f.z);mesh.castShadow=mesh.receiveShadow=true;
    mesh.name=f.look;mesh.boundingSphere=new THREE.Sphere(new THREE.Vector3(0,1,0),9);
    root.add(mesh);return {...f,mesh};
  });
  function pose(f:typeof families[number],time:number){
    f.members.forEach(([x,z,size],index)=>{
      const phase=time*(f.look==='duckling'?.43:.65)+index*1.74;
      const hop=f.look==='rabbit'?Math.max(0,Math.sin(phase*1.7)-.62)*.43:0;
      const water=f.look==='duckling',bird=f.look==='chick'||water;
      transform.position.set(x+Math.sin(phase)*.29,(water?.22:.12)+hop,z+Math.cos(phase)*.19);
      transform.rotation.set(bird?Math.sin(phase*1.35)*.12:0,Math.atan2(Math.cos(phase)*.29,-Math.sin(phase)*.19),0);
      transform.scale.setScalar(size*(bird?.80:f.look==='kid'?.78:1));transform.updateMatrix();f.mesh.setMatrixAt(index,transform.matrix);
    });
    f.mesh.instanceMatrix.needsUpdate=true;
  }
  families.forEach(f=>pose(f,0));
  return {root,update(time:number,reduced:boolean,viewer:{x:number;z:number}){
    if(reduced)return;
    for(const f of families)if((viewer.x-f.x)**2+(viewer.z-f.z)**2<48**2)pose(f,time);
  }};
}
