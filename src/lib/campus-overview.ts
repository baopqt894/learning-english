import * as THREE from 'three';
import { CORE_BUILDINGS, EXPANSION_BUILDINGS, MAP_BOUNDS } from './campus-map';
import {
  DISTRICT_PATHS, DISTRICT_STRUCTURES, FEED_DECK, FISH_POND, LIVESTOCK_PENS,
  SWIMMING_POOL, TRAINING_GROUND, TRAINING_EQUIPMENT,
} from './campus-districts-layout';
import { CAMPUS_TREES, FARM_FENCES, FARM_LAYOUT, READING_PLANTERS, SPORTS_FIELD } from './campus-spaces';
import { ATHLETICS_TRACK, SPORTS_VENUES, TRACK_STANDS } from './sports-layout';

type Footprint = { x: number; z: number; w: number; d: number };
type Instance = Footprint & { y: number; h: number; color: number };

const gable = () => {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute([
    -.5, 0, -.5, -.5, 0, .5, -.5, 1, 0,
    .5, 0, -.5, .5, 0, .5, .5, 1, 0,
  ], 3));
  geometry.setIndex([0, 1, 2, 3, 5, 4, 1, 4, 5, 1, 5, 2, 0, 2, 5, 0, 5, 3]);
  const faces = geometry.toNonIndexed();
  geometry.dispose();
  faces.computeVertexNormals();
  return faces;
};

/** Low-detail campus model for viewing the whole site. Its landmarks share the walkable map's footprints. */
export function createCampusOverview(sky: number) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(sky);
  const material = new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false });
  const boxes: Instance[] = [];
  const roofs: Instance[] = [];
  const crowns: Instance[] = [];
  function ground(footprint: Footprint, color: number, y = .02) {
    boxes.push({ ...footprint, h: .04, y, color });
  }
  function building(footprint: Footprint, h: number, roof: number) {
    boxes.push({ ...footprint, h, y: h / 2, color: 0xdfd0a6 });
    roofs.push({ ...footprint, w: footprint.w + .6, d: footprint.d + .6, h: 1.25, y: h, color: roof });
  }

  const { minX, maxX, minZ, maxZ } = MAP_BOUNDS;
  const w = maxX - minX, d = maxZ - minZ;
  boxes.push({ x: (minX + maxX) / 2, z: (minZ + maxZ) / 2, w: w + 4, d: d + 4, h: 1, y: -.5, color: 0x939f60 });
  ground({ x: 0, z: -.4, w: 22, d: 18 }, 0xd3c9a6);
  for (const road of DISTRICT_PATHS) ground(road, 0xcfc4a3, .04);
  for (const b of [...CORE_BUILDINGS, ...EXPANSION_BUILDINGS]) building(b, b.h, b.roof);
  for (const b of DISTRICT_STRUCTURES) building(b, b.h, 0x5f7854);

  for (const tree of CAMPUS_TREES) {
    const { x, z, scale } = tree;
    boxes.push({ x, z, w: .35 * scale, h: 2.4 * scale, d: .35 * scale, y: 1.2 * scale, color: 0x886b43 });
    crowns.push({ x, z, w: 3.8 * scale, h: 3.4 * scale, d: 3.5 * scale, y: 3 * scale, color: tree.flowering ? 0x89914e : 0x537739 });
  }

  for (const planter of READING_PLANTERS) ground(planter, 0x638746, .08);
  ground({ ...FARM_LAYOUT.center, w: FARM_LAYOUT.bounds.maxX - FARM_LAYOUT.bounds.minX, d: FARM_LAYOUT.bounds.maxZ - FARM_LAYOUT.bounds.minZ }, 0xc2af83);
  for (const fence of FARM_FENCES) boxes.push({ ...fence, h: 1.15, y: .57, color: 0x9d8054 });
  for (const bed of FARM_LAYOUT.beds) ground(bed, 0xa17252, .24);
  for (const bed of FARM_LAYOUT.reserve) {
    ground(bed, 0x92724b, .2);
    for (const offset of [-1.2, 0, 1.2]) ground({ ...bed, x: bed.x + offset, w: .62, d: bed.d - .3 }, 0x688c46, .34);
  }
  building(FARM_LAYOUT.shed, FARM_LAYOUT.shed.height * .78, 0x667d4e);

  for (const pen of LIVESTOCK_PENS) {
    ground(pen, 0xc2ac79, .035);
    building({ ...pen, z: pen.z - pen.d * .32, d: pen.d * .28, w: pen.w - .8 }, 1.6, 0x6d8054);
  }
  ground(FISH_POND, 0x72988d);
  ground(FEED_DECK, 0xb19065, .18);
  ground({ ...SWIMMING_POOL, w: SWIMMING_POOL.deckW, d: SWIMMING_POOL.deckD }, 0xded6bb, .035);
  ground(SWIMMING_POOL, 0x6db8c5, .07);
  for (let lane = 1; lane < 4; lane++) {
    ground({ ...SWIMMING_POOL, z: SWIMMING_POOL.z - SWIMMING_POOL.d / 2 + lane * SWIMMING_POOL.d / 4, d: .11 }, 0xf1dd9b, .115);
  }

  ground(TRAINING_GROUND, 0xc6b181);
  for (const item of TRAINING_EQUIPMENT) boxes.push({ ...item, h: .45, y: .28, color: 0x827757 });
  ground(ATHLETICS_TRACK, 0xb4604d, .055);
  for (let lane = 0; lane <= 4; lane++) {
    ground({ ...ATHLETICS_TRACK, z: ATHLETICS_TRACK.z - ATHLETICS_TRACK.d / 2 + lane * ATHLETICS_TRACK.d / 4, d: .09 }, 0xeee4cf, .095);
  }
  for (const stand of TRACK_STANDS) building(stand, 1.6, 0x667e61);
  ground(SPORTS_FIELD, 0x799750);
  ground({ ...SPORTS_FIELD, d: .13 }, 0xefe6bd, .07);
  for (const { desk } of Object.values(SPORTS_VENUES)) building(desk, 1.25, 0x5d8b6d);

  const matrix = new THREE.Matrix4();
  const rotation = new THREE.Quaternion();
  const position = new THREE.Vector3();
  const scale = new THREE.Vector3();
  const color = new THREE.Color();
  const sun = new THREE.Vector3(-.45, .8, .35).normalize();
  const normal = new THREE.Vector3();
  const instanced = (geometry: THREE.BufferGeometry, items: Instance[]) => {
    const normals = geometry.getAttribute('normal');
    const tint = new Float32Array(normals.count * 3);
    for (let i = 0; i < normals.count; i++) {
      const shade = .73 + .27 * Math.max(0, normal.fromBufferAttribute(normals, i).dot(sun));
      tint.fill(shade, i * 3, i * 3 + 3);
    }
    geometry.setAttribute('color', new THREE.BufferAttribute(tint, 3));
    const mesh = new THREE.InstancedMesh(geometry, material, items.length);
    items.forEach((item, index) => {
      matrix.compose(position.set(item.x, item.y, item.z), rotation, scale.set(item.w, item.h, item.d));
      mesh.setMatrixAt(index, matrix);
      mesh.setColorAt(index, color.setHex(item.color));
    });
    scene.add(mesh);
    return mesh;
  };
  const scenery = [
    instanced(new THREE.BoxGeometry(), boxes),
    instanced(gable(), roofs),
    instanced(new THREE.IcosahedronGeometry(.5, 1), crowns),
  ];
  const marker = new THREE.Mesh(
    new THREE.ConeGeometry(1.05, 2.4, 8),
    new THREE.MeshBasicMaterial({ color: 0xffcc65, depthTest: false, toneMapped: false }),
  );
  marker.rotation.z = Math.PI;
  marker.renderOrder = 1;
  scene.add(marker);
  return {
    scene,
    mark(x: number, z: number) { marker.position.set(x, 2.6, z); },
    dispose() {
      scenery.forEach(mesh => { mesh.geometry.dispose(); mesh.dispose(); });
      material.dispose();
      marker.geometry.dispose();
      marker.material.dispose();
    },
  };
}
