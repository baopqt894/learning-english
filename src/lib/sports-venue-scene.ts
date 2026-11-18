import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { SWIMMING_POOL } from './campus-districts-layout.ts';
import { ATHLETICS_TRACK, FOOTBALL_GOALS, POOL_TOWER, POOL_WATCH, SPORTS_FIELD, SPORTS_VENUES, STADIUM, STADIUM_FLOORS, STADIUM_LIGHTS, TRACK_BENCHES, TRACK_OUTER_RADIUS, TRACK_STANDS } from './sports-layout.ts';

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

/** One ring serves the stadium mesh and the low-detail campus view. */
export function stadiumBand(inner: number, outer: number, steps = 28, straight = STADIUM.straight) {
  const positions: number[] = [], uvs: number[] = [], indices: number[] = [];
  const stride = (steps + 1) * 2;
  for (let i = 0; i < stride; i++) {
    const west = i > steps;
    const angle = -Math.PI / 2 + (west ? Math.PI : 0) + (i % (steps + 1)) * Math.PI / steps;
    const x = (west ? -1 : 1) * straight / 2;
    for (const radius of [outer, inner]) {
      const dx = x + Math.cos(angle) * radius, z = Math.sin(angle) * radius;
      positions.push(dx, 0, z);
      uvs.push(dx / 100 + .5, z / 50 + .5);
    }
    const a = i * 2, next = ((i + 1) % stride) * 2;
    indices.push(a, a + 1, next, next, a + 1, next + 1);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
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

  const track = ATHLETICS_TRACK, stadium = STADIUM, pitch = SPORTS_FIELD;
  const band = (inner: number, outer: number, color: number, height: number) =>
    part(stadiumBand(inner, outer), color, stadium.x, height, stadium.z, 0, 0, 0, true);
  band(TRACK_OUTER_RADIUS, TRACK_OUTER_RADIUS + .85, palette.concrete, .07);
  band(stadium.innerRadius - .38, stadium.innerRadius, 0xc7bd95, .081);
  for (let lane = 0; lane < stadium.lanes; lane++) {
    const inner = stadium.innerRadius + lane * stadium.laneWidth;
    band(inner, inner + stadium.laneWidth, lane % 2 ? 0xad604d : 0xb96b55, STADIUM_FLOORS.running - .004);
    const z = stadium.z + inner + stadium.laneWidth / 2;
    const number = sign(String(lane + 1), track.start - 1.25, .099, z, .59, .56);
    number.rotation.x = -Math.PI / 2;
    for (const offset of [0, .28]) box(.19, .068, .34, palette.steel, track.start - .62 - offset, .12, z + offset);
  }
  for (let lane = 0; lane <= stadium.lanes; lane++) {
    const r = stadium.innerRadius + lane * stadium.laneWidth;
    band(r - .026, r + .026, palette.cream, .097);
  }
  for (const x of [track.start, track.finish]) {
    box(.094, .008, track.d, palette.cream, x, .101, track.z);
    sign(x === track.start ? 'START' : 'FINISH', x, 1.07, stadium.z + TRACK_OUTER_RADIUS + .65, 1.75, .36);
    for (const offset of [-.78,.78]) box(.065,1.25,.07,palette.tin,x+offset,.69,stadium.z+TRACK_OUTER_RADIUS+.71);
  }
  for (let i = 0; i < 30; i++)
    box(.16, .008, track.d / 30, i % 2 ? palette.cream : palette.rust, track.finish + .16, .101, track.z + (i - 14.5) * track.d / 30);

  const chalk = 0xf1ecd4, inset = .36, left = pitch.x - pitch.w / 2 + inset, right = pitch.x + pitch.w / 2 - inset;
  const north = pitch.z - pitch.d / 2 + inset, south = pitch.z + pitch.d / 2 - inset;
  band(0, stadium.innerRadius - .39, 0x728a51, .045);
  for (let i = 0; i < 10; i++)
    box(pitch.w / 10, .012, pitch.d, i % 2 ? 0x719a51 : 0x7da258, pitch.x + (i - 4.5) * pitch.w / 10, STADIUM_FLOORS.pitch - .006, pitch.z);
  for (const z of [north, south]) box(right - left, .009, .076, chalk, pitch.x, .073, z);
  for (const x of [left, pitch.x, right]) box(.076, .009, south - north, chalk, x, .073, pitch.z);
  part(new THREE.RingGeometry(2.7, 2.78, 48), chalk, pitch.x, .078, pitch.z, -Math.PI / 2, 0, 0, true);
  part(new THREE.CircleGeometry(.11, 12), chalk, pitch.x, .078, pitch.z, -Math.PI / 2, 0, 0, true);
  for (const side of [-1, 1]) {
    const edge = side < 0 ? left : right;
    for (const [depth, width] of [[5.8, 12.3],[2.35, 8.0]]) {
      box(.075, .009, width, chalk, edge - side * depth, .074, pitch.z);
      for (const dz of [-width / 2, width / 2]) box(depth, .009, .075, chalk, edge - side * depth / 2, .074, pitch.z + dz);
    }
    part(new THREE.CircleGeometry(.09, 10), chalk, edge - side * 4.25, .078, pitch.z, -Math.PI / 2, 0, 0, true);
    for (const z of [north, south]) {
      box(.038, .76, .038, chalk, edge, .42, z);
      box(.27, .16, .025, palette.gold, edge - side * .12, .75, z);
    }
  }
  for (const { x, z, back, width } of FOOTBALL_GOALS) {
    for (const dz of [-width / 2, width / 2]) {
      box(.095, 2.26, .095, chalk, x, 1.17, z + dz);
      box(.05, 1.72, .05, palette.steel, x + back, .90, z + dz);
      box(Math.abs(back), .045, .045, palette.steel, x + back / 2, .10, z + dz);
      for (let step = 1; step < 5; step++)
        box(Math.abs(back), .014, .014, 0xbac8ae, x + back / 2, .1 + step * .30, z + dz);
    }
    box(.095, .095, width + .095, chalk, x, 2.29, z);
    box(.045, .045, width, palette.steel, x + back, 1.75, z);
    for (let i = 0; i < 14; i++) box(.016, 1.68, .018, 0xd1d7bd, x + back, .91, z + (i - 6.5) * width / 14);
    for (let i = 1; i < 7; i++) box(.018, .016, width, 0xd1d7bd, x + back, .08 + i * .23, z);
  }

  for (const stand of TRACK_STANDS) {
    const { x,z,w,d } = stand;
    for (let row = 0; row < 3; row++) {
      const height = .39+row*.42, rowZ = z+d/2-.58-row*1.13;
      box(w,height,1.13,palette.concrete,x,.09+height/2,rowZ);
      box(w-.18,.09,.11,palette.cream,x,.12+height,rowZ+.48);
      for (let seat = 0; seat < 21; seat++) {
        box(.49,.12,.44,row%2 ? palette.tin : palette.dark,x+(seat-10)*.66,.21+height,rowZ);
        box(.49,.35,.075,row%2 ? palette.tin : palette.dark,x+(seat-10)*.66,.42+height,rowZ-.205);
      }
    }
    for (const dx of [-1,1]) {
      box(.13,3.38,.14,palette.dark,x+dx*(w/2-.18),1.78,z-d/2+.18);
      box(.12,2.96,.14,palette.dark,x+dx*(w/2-.18),1.57,z+d/2-.15);
    }
    box(w+.5,.14,d+.56,palette.tin,x,3.24,z,.117);
    for (let rib = -5; rib <= 5; rib++) box(.045,.037,d+.56,0x789083,x+rib,3.326,z,.117);
  }
  const grandstand = TRACK_STANDS[1];
  box(7.5, 1.04, .19, palette.dark, grandstand.x, 3.86, grandstand.z + grandstand.d / 2);
  sign('CAMPUS STADIUM', grandstand.x, 3.86, grandstand.z + grandstand.d / 2 + .11, 7.1, .82);
  for (const { x, z, w, d } of STADIUM_LIGHTS) {
    box(w, 5.1, d, palette.dark, x, 2.57, z);
    box(1.36, .32, .24, palette.tin, x, 5.08, z);
    for (let lamp = -1; lamp <= 1; lamp++) box(.37, .22, .13, palette.cream, x + lamp * .4, 5.07, z + .15);
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
