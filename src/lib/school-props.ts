import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

type Prop = 'watering-can'|'barrow'|'basket'|'planter'|'bookshelf'|'chair'|'bench'|'hob'|'pot'|'tray'|'bucket'|'projector';

// The export is normalised to one metre wide, with the origin at floor level.
export function placeSchoolProp(parent:THREE.Object3D, type:Prop, x:number,y:number,z:number,width:number,yaw=0) {
  const marker=new THREE.Object3D();
  marker.userData.schoolProp=type;
  marker.position.set(x,y,z);
  marker.rotation.y=yaw;
  marker.scale.setScalar(width);
  parent.add(marker);
}

export function loadSchoolProps(scene:THREE.Scene) {
  let disposed=false;
  const mounts=new Map<THREE.Object3D,Map<string,THREE.Object3D[]>>();
  scene.traverse(marker=>{
    const type=marker.userData.schoolProp,parent=marker.parent;
    if (!type||!parent) return;
    const groups=mounts.get(parent)??new Map<string,THREE.Object3D[]>();
    const markers=groups.get(type)??[];markers.push(marker);
    groups.set(type,markers);mounts.set(parent,groups);
  });
  new GLTFLoader().load('/models/environment/school-props.glb',({scene:library})=>{
    if(disposed){
      const materials=new Set<THREE.MeshStandardMaterial>();
      library.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();materials.add(o.material);}});
      for(const m of materials){m.map?.dispose();m.dispose();}
      return;
    }
    for(const [parent,groups] of mounts)for(const [type,markers] of groups){
      // GLTFLoader sanitizes node names; the original mesh name is retained.
      const prop=library.children.find(o=>o.userData.name===type||o.name===type);
      if(!(prop instanceof THREE.Mesh))continue;
      const batch=new THREE.InstancedMesh(prop.geometry,prop.material,markers.length);
      batch.name=type;batch.castShadow=batch.receiveShadow=true;
      markers.forEach((marker,i)=>{marker.updateMatrix();batch.setMatrixAt(i,marker.matrix);parent.remove(marker);});
      batch.computeBoundingSphere();parent.add(batch);
    }
  });
  return ()=>{disposed=true;mounts.clear();};
}
