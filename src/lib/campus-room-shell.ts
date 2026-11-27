import { doorwayHalfWidth } from './workshop-wing.ts';
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { addCampusRoofs } from './campus-roofs.ts';

type Room={x:number;z:number;w:number;d:number;h:number;roof:number;name:string;kind?:string};
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
  const halfDoor=doorwayHalfWidth(b.kind);
  const front=b.z+b.d/2,top=b.h+.25;
  // Front wall has a 2.6 m doorway and two broad, recessed windows.
  for(const side of [-1,1]){
    const width=b.w/2-halfDoor,cx=b.x+side*(b.w/4+halfDoor/2),windowWidth=Math.min(2.2,width-1);
    box(width,.65,.2,cx,1.225,front,stucco);
    box(width,top-2.75,.2,cx,(top+2.75)/2,front,stucco);
    for(const edge of [-1,1])box((width-windowWidth)/2,1.2,.2,cx+edge*(windowWidth/2+(width-windowWidth)/4),2.15,front,stucco);
    box(windowWidth,1.15,.055,cx,2.15,front+.035,glass);
    box(windowWidth+.2,.1,.3,cx,1.55,front+.08,trim);
    for(const dx of [-windowWidth/2,0,windowWidth/2])box(.055,1.25,.12,cx+dx,2.15,front+.09,timber);
    box(windowWidth,.055,.12,cx,2.15,front+.09,timber);
    // Open timber door leaves do not obstruct the walkable threshold.
    const door=box(.075,2.9,1.08,b.x+side*(halfDoor-.02),1.7,front-.55,timber);door.rotation.y=side*.15;
    // Side elevations sit above the low cutaway wall; real panes and sills face outside.
    box(.2,top-1.5,b.d,b.x+side*b.w/2,(top+1.5)/2,b.z,stucco);
    for(let i=0;i<Math.floor(b.d/2.4);i++){
      const z=b.z-b.d/2+1.4+i*2.4;
      box(.045,1.12,1.35,b.x+side*(b.w/2+.115),2.18,z,glass);
      box(.2,.1,1.55,b.x+side*(b.w/2+.14),1.58,z,trim);
      box(.09,1.2,.06,b.x+side*(b.w/2+.15),2.18,z,timber);
    }
  }
  box(halfDoor*2,Math.max(.2,top-3.15),.22,b.x,(top+3.15)/2,front,stucco);
  box(b.w+.45,.17,b.d+.45,b.x,top+.06,b.z,trim);
  const run=b.d/2+.4, rise=1.3, eave=top+.16;
  const isGlasshouse = b.kind === 'plant-lab';
  if (isGlasshouse) {
    // Two glazed roof slopes with purlins and regularly spaced glazing bars.
    const slope = Math.hypot(run,rise), pitch = Math.atan2(rise,run);
    for (const side of [-1,1]) {
      const middleZ=b.z+side*run/2;
      const pane=box(b.w+.8,.09,slope,b.x,eave+rise/2,middleZ,glass);
      pane.rotation.x=side*pitch;
      const bays=Math.ceil(b.w/2);
      for (let i=0;i<=bays;i++) {
        const x=b.x-b.w/2+i*b.w/bays;
        box(.085,.14,slope,x,eave+rise/2+.075,middleZ,trim).rotation.x=side*pitch;
      }
      for (const fraction of [.28,.68])
        box(b.w+.8,.09,.085,b.x,eave+rise*(1-fraction)+.08,b.z+side*run*fraction,trim);
    }
  } else {
    const section=new THREE.Shape();
    section.moveTo(-run,0);section.lineTo(0,rise);section.lineTo(run,0);section.closePath();
    const roof=new THREE.Mesh(new THREE.ExtrudeGeometry(section,{depth:b.w+.8,bevelEnabled:false}),tile);
    roof.rotation.y=Math.PI/2;roof.position.set(b.x-b.w/2-.4,eave,b.z);
    roof.castShadow=roof.receiveShadow=true;shell.add(roof);
  }
  if (b.kind === 'kitchen') {
    for (const side of [-1,1]) {
      const x=b.x+side*b.w*.25, z=b.z-1.1;
      box(1.25,1.15,1.05,x,eave+rise+.32,z,timber);
      for (let louver=0;louver<4;louver++)
        box(1.38,.08,1.17,x,eave+rise+.18+louver*.18,z,trim);
      box(1.55,.13,1.35,x,eave+rise+.99,z,timber);
    }
    const hatchX=b.x-b.w*.31;
    box(4,.12,1.05,hatchX,3.45,front+.46,tile).rotation.x=.12;
    box(3.7,.13,.64,hatchX,1.47,front+.29,trim);
  }
  if (b.kind === 'light-lab') {
    // Raised clerestory running along the ridge, shaded by a projecting cap.
    const width=b.w*.68;
    box(width,1,1.5,b.x,eave+rise+.34,b.z,glass);
    for (let i=0;i<=8;i++)
      box(.095,1.06,1.59,b.x-width/2+i*width/8,eave+rise+.34,b.z,trim);
    box(width+.6,.17,2.1,b.x,eave+rise+.93,b.z,timber);
    box(5.8,.19,1.6,b.x,3.48,front+.7,timber);
  }
  if (b.kind === 'weather') {
    const y=eave+rise, x=b.x+.22*b.w;
    box(.11,1.6,.11,x,y+.78,b.z,timber);
    box(1.2,.09,.09,x,y+1.51,b.z,trim);
    box(.37,.33,.08,x+.42,y+1.64,b.z,tile);
  } else if (b.kind === 'art') {
    for (const offset of [-.25,0,.25]) {
      const y=eave+rise*.51, z=b.z+run*.52, x=b.x+b.w*offset;
      const pitch=Math.atan2(rise,run);
      box(3.3,.14,2.05,x,y+.12,z,trim).rotation.x=pitch;
      box(3.08,.08,1.84,x,y+.24,z,glass).rotation.x=pitch;
    }
  } else if (b.kind === 'music') {
    for (const side of [-1,1]) for (let i=0;i<6;i++) {
      box(.09,1.72,.27,b.x+side*(b.w*.32+i*.32),2.22,front+.18,timber);
    }
    box(4.3,.15,1.3,b.x,3.45,front+.54,tile);
  }
  // Long teaching halls have sheltered window bays. The supports are wall brackets
  // so the entire apron stays available to players arriving together.
  if(b.w>=28){
    for(const side of [-1,1]){
      const x=b.x+side*.31*b.w,w=Math.min(9.2,b.w*.25);
      box(w+.22,.12,1.53,x,3.28,front+.67,timber).rotation.x=.12;
      for(let i=0;i<8;i++)
        box(w/8,.065,1.61,x+(i-3.5)*w/8,3.36,front+.67,i%2?tile:trim).rotation.x=.12;
      for(const edge of [-1,1])
        box(.105,.12,1.22,x+edge*(w/2-.28),2.95,front+.53,timber).rotation.x=-.46;
    }
  }
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
  if (!isGlasshouse) addCampusRoofs(shell,[{x:b.x,y:top+.16,z:b.z,width:b.w+.8,run:b.d/2+.4,rise:1.3,color:b.roof,metal:false}],new THREE.MeshStandardMaterial({color:0xffffff,roughness:.88}));
  return shell;
}
