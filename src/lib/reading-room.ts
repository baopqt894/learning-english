import * as THREE from 'three';
import { BOOKCASES, READING_SEATS, READING_TABLES } from './reading-pavilion.ts';

export function createReadingRoom() {
  const group = new THREE.Group();
  group.name = 'Reading pavilion interior';
  const parts: {matrix:THREE.Matrix4; tint:number}[] = [];
  const transform = new THREE.Object3D();
  function box(w:number,h:number,d:number,x:number,y:number,z:number,tint:number,tilt=0) {
    transform.scale.set(w,h,d);
    transform.position.set(x,y,z);
    transform.rotation.set(0,0,tilt);
    transform.updateMatrix();
    parts.push({matrix:transform.matrix.clone(), tint});
  }
  const oak=0xae7951, walnut=0x674830, sage=0x476859, brass=0xc5a366;
  const covers=[0x496c6c,0xb5654e,0xcca657,0x637947,0x936477,0x496080];
  for (const s of BOOKCASES) {
    box(s.w,1.84,.08,s.x,1.25,s.z-.27,walnut);
    for (const side of [-1,1]) box(.09,1.94,s.d,s.x+side*(s.w/2-.045),1.26,s.z,oak);
    for (let row=0;row<4;row++) {
      const y=.43+row*.56;
      box(s.w,.075,s.d+.035,s.x,y,s.z,oak);
      if(row===3) break;
      for (let i=0;i<14;i++) {
        const bx=s.x-1.35+i*.20, h=.31+((row+i*3)%5)*.036;
        box(.14,h,.37,bx,y+.041+h/2,s.z+.025,covers[(i+row*2)%covers.length]);
        box(.105,.028,.012,bx,y+.14,s.z+.215,brass);
      }
    }
    box(s.w+.1,.12,s.d+.1,s.x,2.23,s.z,walnut);
  }
  for (const t of READING_TABLES) {
    for (const side of [-1,1]) for (const end of [-1,1])
      box(.11,.68,.11,t.x+side*(t.w/2-.16),.63,t.z+end*.4,walnut);
    box(t.w,.12,t.d,t.x,1.03,t.z,oak);
    // Open exercise book with a stitched spine and printed lines on both pages.
    for (const side of [-1,1]) {
      const bx=t.x+side*.16, angle=-side*.07;
      box(.34,.045,.45,bx,1.12,t.z,sage,angle);
      box(.31,.032,.42,bx,1.15,t.z,0xffefd0,angle);
      for(let line=0;line<4;line++)
        box(.19,.008,.012,bx,1.17,t.z-.12+line*.066,0xa09579,angle);
    }
    for(let i=0;i<2;i++)box(.37,.055,.49,t.x+.67,1.12+i*.06,t.z-.12,covers[i+2]);
  }
  for (const s of READING_SEATS) {
    for(const side of [-1,1])box(.12,.34,.25,s.x+side*.58,.47,s.z,walnut);
    box(s.w,.10,s.d,s.x,.69,s.z,sage);
  }

  const mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),
    new THREE.MeshStandardMaterial({roughness:.84}),parts.length);
  const color = new THREE.Color();
  parts.forEach(({matrix,tint},i) => {mesh.setMatrixAt(i,matrix);mesh.setColorAt(i,color.setHex(tint));});
  mesh.castShadow=mesh.receiveShadow=true;
  group.add(mesh);
  group.visible=false;
  return group;
}
