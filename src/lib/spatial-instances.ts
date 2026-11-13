import * as THREE from 'three';
/** Shared geometry stays instanced, but distant chunks can now be culled by the renderer. */
export function spatialInstances(source:THREE.InstancedMesh,cell=24){
 const bins=new Map<string,number[]>(),matrix=new THREE.Matrix4(),point=new THREE.Vector3(),colour=new THREE.Color();
 for(let i=0;i<source.count;i++){source.getMatrixAt(i,matrix);point.setFromMatrixPosition(matrix);const key=`${Math.floor(point.x/cell)},${Math.floor(point.z/cell)}`;if(!bins.has(key))bins.set(key,[]);bins.get(key)!.push(i);}
 const group=new THREE.Group();group.name='Spatial instances';
 for(const indices of bins.values()){const part=new THREE.InstancedMesh(source.geometry,source.material,indices.length);part.castShadow=source.castShadow;part.receiveShadow=source.receiveShadow;indices.forEach((i,j)=>{source.getMatrixAt(i,matrix);part.setMatrixAt(j,matrix);if(source.instanceColor){source.getColorAt(i,colour);part.setColorAt(j,colour);}});part.computeBoundingSphere();group.add(part);}
 group.position.copy(source.position);group.rotation.copy(source.rotation);group.scale.copy(source.scale);source.dispose();return group;
}
