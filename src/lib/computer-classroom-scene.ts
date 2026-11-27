import * as THREE from 'three';
import type { sceneryKit } from './campus-scenery-kit';
import { computerDesks, computerLab, examStations, teacherDesk } from './learning-room-layout';
type Kit = ReturnType<typeof sceneryKit>;
const birch = 0xd8ab76, steel = 0x425b63, pale = 0xe1e5d7, blue = 0x577f8c, ink = 0x233944;

// Displays share one labelled atlas and a single draw call for all desktop screens.
function desktopScreens(props: THREE.Group) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024; canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;
  const vertices: number[] = [], uvs: number[] = [];
  for (const [i, station] of examStations.filter(s => !s.laptop).entries()) {
    const col = i % 4, row = Math.floor(i / 4);
    const left = col * 256, upper = row * 160;
    ctx.save(); ctx.translate(left, upper);
    ctx.fillStyle = '#174853'; ctx.fillRect(0,0,256,160);
    ctx.fillStyle = '#a3d7ce'; ctx.fillRect(0,0,256,23);
    ctx.fillStyle = '#174853'; ctx.font = 'bold 15px sans-serif'; ctx.fillText('CAMPUS ENGLISH',12,17);
    ctx.fillStyle = '#fff3cf'; ctx.font = 'bold 39px sans-serif'; ctx.fillText(station.id,13,75);
    ctx.font = '21px sans-serif'; ctx.fillText('English test',14,108);
    ctx.fillStyle = '#d7ac59'; ctx.fillRect(14,124,68,12); ctx.restore();
    const x = station.x - computerLab.x, z = station.z - computerLab.z - .135;
    const u0=(left+1)/1024,u1=(left+255)/1024,v0=1-(upper+159)/1024,v1=1-(upper+1)/1024;
    for (const [dx,y,u,v] of [[-.546,1.39,u0,v0],[.546,1.39,u1,v0],[.546,2.06,u1,v1],
      [-.546,1.39,u0,v0],[.546,2.06,u1,v1],[-.546,2.06,u0,v1]]) {
      vertices.push(x+dx,y,z); uvs.push(u,v);
    }
  }
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices,3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs,2));
  props.add(new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({map:texture})));
}

export function furnishComputerClassroom(k: Kit, props: THREE.Group) {
  const back = -computerLab.d/2;
  for (const desk of computerDesks) {
    const {x,z,w,d} = desk;
    k.block(x,1.13,z,w,.14,d,birch);
    k.block(x,.86,z-.34,w-.23,.44,.085,blue);
    for (const side of [-1,1]) {
      k.block(x+side*(w/2-.24),.74,z,.13,.78,.76,steel);
      k.block(x+side*(w/2-.24),.37,z,.24,.10,.89,steel);
    }
  }
  for (const s of examStations.filter(s=>!s.laptop)) {
    const x=s.x-computerLab.x,z=s.z-computerLab.z;
    k.block(x,1.24,z-.21,.48,.08,.28,steel);
    k.block(x,1.42,z-.21,.12,.34,.09,steel);
    k.block(x,1.72,z-.215,1.22,.80,.13,ink);
    k.block(x,1.23,z+.24,.76,.06,.275,ink);
    for (let i=0;i<3;i++) k.block(x,1.267,z+.165+i*.065,.66,.016,.032,0x829294);
    k.globe(x+.56,1.25,z+.24,.14,.085,.22,steel);
    k.block(x,.37,z+.85,.56,.09,.51,steel);
    k.drum(x,.56,z+.85,.13,.36,.13,steel);
    k.block(x,.78,z+.85,.63,.15,.56,blue);
    k.block(x,1.02,z+1.10,.59,.43,.09,blue,0,0,.09);
  }
  desktopScreens(props);

  const {x,z,w,d}=teacherDesk;
  k.block(x,.86,z,w-.14,1.06,d-.10,blue); k.block(x,1.43,z,w,.12,d,birch);
  k.block(x-.65,1.54,z,.93,.07,.56,steel); k.block(x-.65,1.82,z-.21,.96,.56,.075,ink);
  k.block(x-.65,1.82,z-.16,.86,.46,.027,0x80bcb7);
  for(let i=0;i<3;i++) k.block(x+.82,1.53+i*.075,z,.65,.07,.43,[pale,0xcb9758,steel][i],0,i*.08);
  // Projection screen, chalk ledge, and a clock visible from the student rows.
  k.block(0,2.00,back+.19,8.13,2.39,.15,steel);
  k.block(0,.86,back+.29,7.9,.09,.28,birch);
  k.drum(4.75,2.60,back+.23,.82,.14,.82,steel,0,0,Math.PI/2);
  k.drum(4.75,2.60,back+.32,.69,.045,.69,pale,0,0,Math.PI/2);
  k.block(4.75,2.71,back+.36,.034,.24,.025,ink);
  k.block(4.84,2.65,back+.36,.20,.035,.025,ink,.42);
  for (const side of [-1,1]) {
    // Windows, sills and slatted blinds follow the side walls; the aisles stay clear.
    const sideX = side*(computerLab.w/2-.19);
    for (const bay of [-7.5,-2.6,2.6,7.5]) {
      k.block(sideX,2.1,bay,.14,1.56,3.62,steel);
      for(const face of [-1,1]) for(const end of [-1,1])
        k.block(sideX+face*.074,2.09,bay+end*.87,.025,1.35,1.61,0xb6d5cf);
      k.block(sideX-side*.14,2.63,bay,.09,.19,3.48,birch);
      k.block(sideX,1.31,bay,.32,.09,3.73,birch);
      k.block(sideX,1.10,bay,.14,.37,3.55,pale);
    }
  }
}
