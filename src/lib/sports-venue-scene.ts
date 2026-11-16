import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { SWIMMING_POOL } from './campus-districts-layout.ts';
import { ATHLETICS_TRACK, POOL_TOWER, POOL_WATCH, SPORTS_VENUES, TRACK_BENCHES, TRACK_STANDS } from './sports-layout.ts';

const palette = {
  cream: 0xffedce, timber: 0x946b48, tin: 0x466860, dark: 0x304d45,
  concrete: 0xa7aa98, steel: 0x9cbbb5, turquoise: 0x40899a, gold: 0xe0b26b, rust: 0x904c42,
};

export function venueSign(text: string, x: number, y: number, z: number, width: number, height: number, parent: THREE.Object3D) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 96;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#25483c';
  ctx.fillRect(0, 0, 512, 96);
  ctx.strokeStyle = '#b49d66';
  ctx.lineWidth = 2;
  ctx.strokeRect(7, 7, 498, 82);
  ctx.font = 'bold 43px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffedce';
  ctx.fillText(text, 256, 48, 478);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(width, height), new THREE.MeshBasicMaterial({ map: texture }));
  sign.position.set(x, y, z);
  parent.add(sign);
  return sign;
}

export function buildSportsVenues(root: THREE.Group) {
  const solids: THREE.BufferGeometry[] = [], markings: THREE.BufferGeometry[] = [];
  const stamp = new THREE.Object3D();
  function part(geometry: THREE.BufferGeometry, color: number, x: number, y: number, z: number, rx = 0, ry = 0, rz = 0, ground = false) {
    const meshGeometry = geometry.index ? geometry.toNonIndexed() : geometry.clone();
    geometry.dispose();
    stamp.position.set(x, y, z);
    stamp.rotation.set(rx, ry, rz);
    stamp.updateMatrix();
    meshGeometry.applyMatrix4(stamp.matrix);
    const c = new THREE.Color(color), rgb: number[] = [];
    for (let i = 0; i < meshGeometry.attributes.position.count; i++) rgb.push(c.r, c.g, c.b);
    meshGeometry.setAttribute('color', new THREE.Float32BufferAttribute(rgb, 3));
    (ground ? markings : solids).push(meshGeometry);
  }
  function box(w: number, h: number, d: number, color: number, x: number, y: number, z: number, rx = 0, ry = 0, ground = h < .09) {
    part(new THREE.BoxGeometry(w, h, d), color, x, y, z, rx, ry, 0, ground);
  }
  function sign(text: string, x: number, y: number, z: number, w: number, h: number) {
    return venueSign(text, x, y, z, w, h, root);
  }

  for (const [id, venue] of Object.entries(SPORTS_VENUES)) {
    const { x, z, w, d } = venue.desk;
    const accent = id === 'pool' ? palette.turquoise : id === 'track' ? palette.rust : palette.tin;
    box(w, .12, d, palette.concrete, x, .12, z);
    box(w - .25, .82, .65, palette.timber, x, .58, z + .16);
    box(w - .11, .1, .89, palette.cream, x, 1.04, z + .15);
    for (let i = 0; i < 12; i++) box(.026, .77, .035, palette.dark, x + (i-5.5)*(w-.3)/12, .59, z + .49);
    for (const side of [-1, 1]) {
      box(.095, 2.65, .095, palette.dark, x + side * (w/2-.13), 1.44, z - .31);
      box(.095, 2.65, .095, palette.dark, x + side * (w/2-.13), 1.44, z + .52);
    }
    box(w + .35, .14, d + .48, accent, x, 2.85, z + .06, .15);
    for (let i = 0; i < 12; i++) box(.036, .04, d+.48, palette.tin, x+(i-5.5)*w/12, 2.93, z+.06, .15);
    box(w+.31, .44, .14, palette.dark, x, 3.04, z+.70);
    sign(venue.sign, x, 3.04, z+.777, w+.27, .41);
    box(.48, .035, .34, palette.tin, x-.79, 1.11, z+.24, 0, -.15);
    box(.43, .012, .28, palette.cream, x-.79, 1.137, z+.24, 0, -.15);
    box(.29, .032, .27, palette.gold, x+.42, 1.11, z+.13, 0, .15);
    box(.35, .035, .30, palette.turquoise, x+.72, 1.11, z+.21, 0, -.12);
    for (let i = 0; i < 3; i++) box(.23, .006, .014, palette.dark, x-.78, 1.145, z+.17+i*.06, 0, -.15);
    part(new THREE.RingGeometry(.57,.66,40), palette.gold, venue.approach.x, .153, venue.approach.z, -Math.PI/2, 0, 0, true);
  }

  const track = ATHLETICS_TRACK;
  box(54, .075, 18.5, 0xc6bea4, 0, .061, -72.2);
  box(track.w+.45, .05, 9.6, 0x784b3e, track.x, .104, track.z);
  for (let lane = 0; lane < 4; lane++) {
    const z = track.z + (lane-1.5)*track.laneWidth;
    box(track.w, .035, 2, lane%2 ? 0xaa6353 : 0xb56a57, track.x, .134, z);
    for (const x of [track.start,track.finish]) {
      const number = sign(String(lane+1), x+(x<0?-1.35:1.35), .165, z, .67, .63);
      number.rotation.x = -Math.PI/2;
    }
    for (let i = 0; i < 9; i++) box(.11,.012,.27,palette.cream,-20+i*5,.157,z+.76);
    for (let i = 0; i < 2; i++) box(.23,.075,.38,palette.steel,-20.65-i*.3,.19,z+(i-.5)*.48,0, i ? .14 : -.14);
  }
  for (let lane = 0; lane <= 4; lane++) box(track.w,.009,.053,palette.cream,0,.156,track.z+(lane-2)*2);
  for (const x of [track.start,track.finish]) box(.095,.013,8.12,palette.cream,x,.16,track.z);
  for (let i = 0; i < 32; i++) box(.13,.01,.25,i%2 ? palette.cream : palette.dark,20.17,.163,-74.875+i*.25);
  for (const x of [-20,20]) {
    sign(x<0 ? 'START' : 'FINISH',x,1.22,-76.1,2.12,.51);
    for (const dx of [-.89,.89]) box(.065,1.55,.07,palette.tin,x+dx,.82,-76.15);
  }
  for (const stand of TRACK_STANDS) {
    const { x,z,w,d } = stand;
    for (let row = 0; row < 3; row++) {
      const height = .39+row*.42, rowZ = z+d/2-.58-row*1.13;
      box(w,height,1.13,palette.concrete,x,.09+height/2,rowZ);
      box(w-.18,.09,.11,palette.cream,x,.12+height,rowZ+.48);
      for (let seat = 0; seat < 17; seat++) {
        box(.49,.12,.44,row%2 ? palette.tin : palette.dark,x+(seat-8)*.6,.21+height,rowZ);
        box(.49,.35,.075,row%2 ? palette.tin : palette.dark,x+(seat-8)*.6,.42+height,rowZ-.205);
      }
    }
    for (const dx of [-1,1]) {
      box(.13,3.38,.14,palette.dark,x+dx*(w/2-.18),1.78,z-d/2+.18);
      box(.12,2.96,.14,palette.dark,x+dx*(w/2-.18),1.57,z+d/2-.15);
    }
    box(w+.5,.14,d+.56,palette.tin,x,3.24,z,.117);
    for (let rib = -5; rib <= 5; rib++) box(.045,.037,d+.56,0x789083,x+rib,3.326,z,.117);
  }
  sign('40 M ATHLETICS',0,2.89,-77.9,5.2,.58);
  for (const x of [-23.6,23.6]) {
    for (const z of [-74.8,-67.2]) {
      part(new THREE.ConeGeometry(.17,.34,8),palette.gold,x,.25,z);
      box(.36,.045,.36,palette.dark,x,.1,z);
    }
  }
  for (const bench of [...TRACK_BENCHES,...POOL_WATCH]) {
    const { x,z,w,d } = bench;
    for (const offset of [-w*.38,w*.38]) box(.14,.49,d,palette.tin,x+offset,.32,z);
    for (let slat = 0; slat < 4; slat++) box(w,.075,.16,palette.timber,x,.61,z+(slat-1.5)*.17);
    for (let slat = 0; slat < 3; slat++) box(w,.11,.075,palette.timber,x,.8+slat*.13,z-.31);
  }

  const pool = SWIMMING_POOL;
  for (let lane = 0; lane < 4; lane++) {
    const z = pool.z + (lane-1.5)*pool.d/4;
    box(.62,.24,.88,palette.concrete,61.08,.28,z);
    box(.7,.07,.98,palette.turquoise,61.08,.45,z,0,0);
    for (let tread = 0; tread < 5; tread++) box(.026,.013,.85,palette.steel,60.82+tread*.13,.49,z);
    const number = sign(String(lane+1),60.7,.54,z,.49,.37);
    number.rotation.y = -Math.PI/2;
  }
  const tower = POOL_TOWER;
  for (const dx of [-.62,.62]) {
    for (const dz of [-.58,.58]) box(.065,2.4,.065,palette.tin,tower.x+dx,1.29,tower.z+dz);
    for (const y of [.67,1.12,1.57,2.02]) box(.92,.055,.07,palette.steel,tower.x,y,tower.z+dx);
  }
  box(1.55,.13,1.45,palette.concrete,tower.x,2.45,tower.z);
  box(.82,.125,.62,palette.cream,tower.x,2.78,tower.z-.14);
  box(.84,.59,.095,palette.cream,tower.x,3.05,tower.z-.42);
  box(.075,1.7,.075,palette.tin,tower.x+.61,3.25,tower.z-.57);
  part(new THREE.ConeGeometry(1.18,.44,8),palette.rust,tower.x,4.1,tower.z);
  sign('LIFEGUARD',tower.x,2.26,tower.z+.80,1.48,.28);
  const flagsZ = pool.z + pool.d/2 + 1.7;
  for (const x of [61.5,88.5]) box(.065,2.9,.065,palette.tin,x,1.57,flagsZ);
  box(27,.026,.027,palette.tin,75,2.92,flagsZ);
  for (let i = 0; i < 21; i++) {
    const shape = new THREE.Shape();
    shape.moveTo(-.24,0); shape.lineTo(.24,0); shape.lineTo(0,-.45); shape.closePath();
    part(new THREE.ShapeGeometry(shape),[palette.turquoise,palette.cream,palette.gold][i%3],62+i*1.295,2.915,flagsZ);
  }

  for (const [parts, shadow] of [[solids, true], [markings, false]] as const) {
    const combined = mergeGeometries(parts);
    parts.forEach(geometry => geometry.dispose());
    if (!combined) continue;
    const mesh = new THREE.Mesh(combined, new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: .86 }));
    mesh.castShadow = shadow;
    mesh.receiveShadow = true;
    root.add(mesh);
  }
}
