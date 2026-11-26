import * as THREE from 'three';

// Each room or court gets a small set of batches and its own culling bounds.
export function sceneryKit(name:string) {
  const group=new THREE.Group();
  group.name=name;
  const shapes={
    block:new THREE.BoxGeometry(1,1,1),
    drum:new THREE.CylinderGeometry(.5,.5,1,16),
    globe:new THREE.SphereGeometry(.5,10,8),
  };
  type Shape=keyof typeof shapes;
  const batches=new Map<Shape,{matrix:THREE.Matrix4;color:number}[]>();
  const transform=new THREE.Object3D();
  type Part=[x:number,y:number,z:number,w:number,h:number,d:number,color:number,tilt?:number,yaw?:number];
  function put(shape:Shape,...[x,y,z,w,h,d,color,tilt=0,yaw=0]:Part){
    transform.position.set(x,y,z);
    transform.scale.set(w,h,d);
    transform.rotation.set(0,yaw,tilt);
    transform.updateMatrix();
    const batch=batches.get(shape)??[];
    batch.push({matrix:transform.matrix.clone(),color});
    batches.set(shape,batch);
  }
  const block=(...v:Part)=>put('block',...v);
  const drum=(...v:Part)=>put('drum',...v);
  const globe=(...v:Part)=>put('globe',...v);
  function finish(){
    const material=new THREE.MeshStandardMaterial({roughness:.82});
    for(const shape of Object.keys(shapes) as Shape[]){
      const items=batches.get(shape);
      if(!items){shapes[shape].dispose();continue;}
      const mesh=new THREE.InstancedMesh(shapes[shape],material,items.length);
      items.forEach((p,i)=>{mesh.setMatrixAt(i,p.matrix);mesh.setColorAt(i,new THREE.Color(p.color));});
      mesh.computeBoundingSphere();mesh.castShadow=true;mesh.receiveShadow=true;
      group.add(mesh);
    }
    return group;
  }
  return {block,drum,globe,finish};
}
