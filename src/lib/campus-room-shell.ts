import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { addCampusRoofs } from './campus-roofs.ts';

type Room={x:number;z:number;w:number;d:number;h:number;roof:number;name:string};
export function roomContainsPlayer(b:Room,point:{x:number;z:number},wasInside=false){
  const inset=wasInside?-.06:.16;
  return Math.abs(point.x-b.x)<b.w/2-inset&&Math.abs(point.z-b.z)<b.d/2-inset;
}

/** A real exterior, kept separate from the static interior so only the occupied room opens. */
export function createRoomShell(b:Room){
  const shell=new THREE.Group();shell.name=`Exterior · ${b.name}`;
  const stucco=new THREE.MeshStandardMaterial({color:0xe9d6ad,roughness:.94});
  const trim=new THREE.MeshStandardMaterial({color:0xf2e4c4,roughness:.84});
  const timber=new THREE.MeshStandardMaterial({color:0x496454,roughness:.8});
  const glass=new THREE.MeshStandardMaterial({color:0x466c70,roughness:.28,metalness:.15});
  const tile=new THREE.MeshStandardMaterial({color:b.roof,roughness:.88,side:THREE.DoubleSide});
  const box=(w:number,h:number,d:number,x:number,y:number,z:number,m:THREE.Material)=>{
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);mesh.position.set(x,y,z);mesh.castShadow=mesh.receiveShadow=true;shell.add(mesh);return mesh;
  };
  const front=b.z+b.d/2,top=b.h+.25;
  // Front wall has a 2.6 m doorway and two broad, recessed windows.
  for(const side of [-1,1]){
    const width=b.w/2-1.3,cx=b.x+side*(b.w/4+.65),windowWidth=Math.min(2.2,width-1);
    box(width,.65,.2,cx,1.225,front,stucco);
    box(width,top-2.75,.2,cx,(top+2.75)/2,front,stucco);
    for(const edge of [-1,1])box((width-windowWidth)/2,1.2,.2,cx+edge*(windowWidth/2+(width-windowWidth)/4),2.15,front,stucco);
    box(windowWidth,1.15,.055,cx,2.15,front+.035,glass);
    box(windowWidth+.2,.1,.3,cx,1.55,front+.08,trim);
    for(const dx of [-windowWidth/2,0,windowWidth/2])box(.055,1.25,.12,cx+dx,2.15,front+.09,timber);
    box(windowWidth,.055,.12,cx,2.15,front+.09,timber);
    // Open timber door leaves do not obstruct the walkable threshold.
    const door=box(.075,2.9,1.08,b.x+side*1.28,1.7,front-.55,timber);door.rotation.y=side*.15;
    // Side elevations sit above the low cutaway wall; real panes and sills face outside.
    box(.2,top-1.5,b.d,b.x+side*b.w/2,(top+1.5)/2,b.z,stucco);
    for(let i=0;i<Math.floor(b.d/2.4);i++){
      const z=b.z-b.d/2+1.4+i*2.4;
      box(.045,1.12,1.35,b.x+side*(b.w/2+.115),2.18,z,glass);
      box(.2,.1,1.55,b.x+side*(b.w/2+.14),1.58,z,trim);
      box(.09,1.2,.06,b.x+side*(b.w/2+.15),2.18,z,timber);
    }
  }
  box(2.6,Math.max(.2,top-3.15),.22,b.x,(top+3.15)/2,front,stucco);
  box(b.w+.45,.17,b.d+.45,b.x,top+.06,b.z,trim);
  const section=new THREE.Shape();section.moveTo(-b.d/2-.4,0);section.lineTo(0,1.3);section.lineTo(b.d/2+.4,0);section.closePath();
  const roof=new THREE.Mesh(new THREE.ExtrudeGeometry(section,{depth:b.w+.8,bevelEnabled:false}),tile);
  roof.rotation.y=Math.PI/2;roof.position.set(b.x-b.w/2-.4,top+.16,b.z);roof.castShadow=roof.receiveShadow=true;shell.add(roof);
  // Thin gutters, ridge cap and downpipes make the roof read as construction.
  for(const side of [-1,1]){
    box(b.w+.9,.13,.13,b.x,top+.13,b.z+side*(b.d/2+.38),timber);
    box(.09,top-.4,.09,b.x+b.w/2-.2,(top+.4)/2,b.z+side*(b.d/2+.18),timber);
  }
  box(b.w+.9,.14,.18,b.x,top+1.47,b.z,tile);
  // Merge the exterior by finish; it remains one independently hideable group.
  shell.updateMatrixWorld(true);
  for(const material of [stucco,trim,timber,glass,tile]){
    const parts=shell.children.filter((o):o is THREE.Mesh=>o instanceof THREE.Mesh&&o.material===material);
    const geos=parts.map(o=>{o.updateMatrix();return (o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone()).applyMatrix4(o.matrix);});
    const merged=mergeGeometries(geos,false);geos.forEach(g=>g.dispose());
    if(merged){const mesh=new THREE.Mesh(merged,material);mesh.castShadow=mesh.receiveShadow=true;shell.add(mesh);parts.forEach(o=>{o.geometry.dispose();o.removeFromParent();});}
  }
  addCampusRoofs(shell,[{x:b.x,y:top+.16,z:b.z,width:b.w+.8,run:b.d/2+.4,rise:1.3,color:b.roof,metal:false}],new THREE.MeshStandardMaterial({color:0xffffff,roughness:.88}));
  return shell;
}
