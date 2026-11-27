import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { createCampusSurfaces, seededRandom, worldAlignedUV } from './campus-surfaces';
import { BUNK_LEVELS, DORMITORY_B, DORMITORY_CHAIRS, DORMITORY_DESKTOP, DORMITORY_FLOOR, DORMITORY_LAYOUT, DORMITORY_WALL, MATTRESS_DEPTH } from './dormitory-layout';

function canvasMap(width: number, height: number, paint: (c: CanvasRenderingContext2D) => void) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  paint(canvas.getContext('2d')!);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createDormitoryRoom(finish: ReturnType<typeof createCampusSurfaces>) {
  const structure = new THREE.Group(), interior = new THREE.Group();
  structure.name = 'Dormitory B · architecture';
  interior.name = 'Dormitory B · bunks and study area';
  interior.visible = false;
  for (const group of [structure, interior]) group.position.set(DORMITORY_B.x, 0, DORMITORY_B.z);

  const standard = (color: number, roughness = .85) => new THREE.MeshStandardMaterial({ color, roughness });
  const plaster = finish('stucco', 0xe8dcc5);
  const trim = standard(0xe9dcc0);
  const sage = standard(0x788365);
  const steel = standard(0x4f604b, .52);
  const windowFrame = standard(0x3f594c, .61);
  const pane = new THREE.MeshStandardMaterial({ color: 0xc6e0cf, opacity: .16, transparent: true, depthWrite: false });
  const wood = standard(0xffe6bb), edge = standard(0xba915d), inside = standard(0x867054);
  const woodMap = canvasMap(256, 512, c => {
    c.fillStyle = '#dfbe90';
    c.fillRect(0, 0, 256, 512);
    const random = seededRandom(8178);
    for (let i = 0; i < 360; i++) {
      const x = random() * 256, bend = (random() - .5) * 24;
      c.strokeStyle = i % 4 ? 'rgba(132,85,42,.11)' : 'rgba(255,240,198,.37)';
      c.lineWidth = .32 + random() * 1.35;
      c.beginPath();
      c.moveTo(x, -2);
      c.bezierCurveTo(x + bend, 150, x - bend, 352, x, 514);
      c.stroke();
    }
  });
  wood.map = edge.map = woodMap;
  const floor = DORMITORY_FLOOR;
  const paving = standard(0xf4e1ca);
  paving.map = canvasMap(256, 256, c => {
    c.fillStyle = '#cbbaa8';
    c.fillRect(0, 0, 256, 256);
    c.fillStyle = '#e9daca';
    c.fillRect(1, 1, 254, 254);
    const random = seededRandom(4026);
    for (let i = 0; i < 1750; i++) {
      c.fillStyle = ['#cdb9a1', '#fcf4e4', '#d1c8b6', '#b9a18b'][i % 4];
      c.globalAlpha = .25 + random() * .51;
      const radius = .25 + random() * 1.6;
      c.fillRect(2 + random() * 251, 2 + random() * 251, radius, radius * .7);
    }
  });
  paving.map.wrapS = paving.map.wrapT = THREE.RepeatWrapping;
  const linen = standard(0xebdfc9), pillow = standard(0xf1e5ce);
  const cloth = standard(0x778054), alternateCloth = standard(0x386266);
  cloth.side = alternateCloth.side = THREE.DoubleSide;
  const stitch = standard(0xb8b590);
  const fabric = canvasMap(128, 128, c => {
    c.fillStyle = '#e6dfce'; c.fillRect(0, 0, 128, 128);
    const noise = seededRandom(817);
    for (let i = 0; i < 128; i += 2) {
      c.fillStyle = `rgba(120,108,86,${.10 + noise() * .12})`;
      c.fillRect(i, 0, 1, 128);
      c.fillRect(0, i, 128, 1);
    }
  });
  fabric.wrapS = fabric.wrapT = THREE.RepeatWrapping;
  fabric.repeat.set(3, 4);
  for (const surface of [linen, pillow, cloth, alternateCloth]) surface.map = fabric;
  const foldedThrow = standard(0xb6a16f);
  foldedThrow.map = canvasMap(128, 128, c => {
    c.fillStyle = '#e5ddba'; c.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 128; i += 22) {
      c.fillStyle = 'rgba(81,94,63,.53)';
      c.fillRect(i, 0, 10, 128);
      c.fillRect(0, i, 128, 10);
    }
  });
  const brass = standard(0xc5a367, .44), rubber = standard(0x3c4335);
  const ferrule = standard(0x6c7763, .43);
  const boltMetal = standard(0x90968b, .36);
  const welt = standard(0xc4b087);
  const quiltThread = standard(0xa6ad8f);
  const paper = standard(0xe9d9b6), rust = standard(0x995f45), blue = standard(0x4b6a64);
  const lampGlow = new THREE.MeshStandardMaterial({ color: 0xffedd2, emissive: 0xffbc66, emissiveIntensity: 1.1 });
  const lampPool = new THREE.MeshBasicMaterial({
    map: canvasMap(128, 128, c => {
      const glow = c.createRadialGradient(64, 64, 2, 64, 64, 63);
      glow.addColorStop(0, 'rgba(255,184,79,.39)');
      glow.addColorStop(.45, 'rgba(255,184,79,.16)');
      glow.addColorStop(1, 'rgba(255,184,79,0)');
      c.fillStyle = glow; c.fillRect(0, 0, 128, 128);
    }), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  type Batch = { materials: THREE.Material; group: THREE.Group; shadow: boolean; geometries: THREE.BufferGeometry[] };
  let active = structure;
  const placement = new THREE.Matrix4();
  function place(fixture: { x: number; z: number; turn: number }) {
    placement.makeRotationY(fixture.turn * Math.PI / 2).setPosition(fixture.x, 0, fixture.z);
  }
  const batches = new Map<string, Batch>();
  function add(geometry: THREE.BufferGeometry, surface: THREE.Material, shadow = true) {
    geometry.applyMatrix4(placement);
    if (geometry.index) {
      const expanded = geometry.toNonIndexed();
      geometry.dispose();
      geometry = expanded;
    }
    const id = `${active.id}/${surface.id}/${shadow}`;
    const batch = batches.get(id) ?? { materials: surface, group: active, shadow, geometries: [] };
    batch.geometries.push(geometry);
    batches.set(id, batch);
  }
  function box(w: number, h: number, d: number, x: number, y: number, z: number, surface: THREE.Material, radius = 0) {
    const geometry = radius ? new RoundedBoxGeometry(w, h, d, 2, radius) : new THREE.BoxGeometry(w, h, d);
    if (surface === plaster || surface === paving)
      worldAlignedUV(geometry, new THREE.Vector3(x, y, z), surface === paving ? 1.19 : .86);
    add(geometry.translate(x, y, z), surface, surface !== paving);
  }
  type Vec = [number, number, number];
  function bar(a: Vec, b: Vec, radius: number, surface: THREE.Material, endRadius = radius) {
    const start = new THREE.Vector3(...a), end = new THREE.Vector3(...b);
    const axis = end.clone().sub(start);
    const rotation = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), axis.clone().normalize());
    const transform = new THREE.Matrix4().compose(start.lerp(end, .5), rotation, new THREE.Vector3(1, 1, 1));
    add(new THREE.CylinderGeometry(endRadius, radius, axis.length(), 10).applyMatrix4(transform), surface);
  }
  function oval(x: number, y: number, z: number, w: number, h: number, d: number, mat: THREE.Material) {
    add(new THREE.SphereGeometry(1, 12, 8).scale(w, h, d).translate(x, y, z), mat);
  }
  function bentTube(points: Vec[], radius: number, surface: THREE.Material) {
    const path = new THREE.CatmullRomCurve3(points.map(point => new THREE.Vector3(...point)));
    add(new THREE.TubeGeometry(path, 44, radius, 10, false), surface);
  }
  function screw(x: number, y: number, z: number, side: number) {
    bar([x, y, z], [x + side * .014, y, z], .026, boltMetal);
    box(.008, .005, .029, x + side * .016, y, z, rubber, .002);
  }
  function bedPillow(y: number, z: number, angle: number) {
    const geometry = new THREE.SphereGeometry(1, 40, 28);
    const positions = geometry.attributes.position;
    const inflate = (value: number) => Math.sign(value) * Math.pow(Math.abs(value), .43);
    for (let i = 0; i < positions.count; i++) {
      const x = inflate(positions.getX(i)) * .57;
      const depth = inflate(positions.getZ(i)) * .31;
      const height = positions.getY(i);
      const hollow = height > 0 ? .038 * Math.exp(-12 * x * x - 42 * depth * depth) : 0;
      const edgeCreases = Math.sin(x * 24 + depth * 18) * .012 * Math.pow(Math.abs(depth) / .31, 2);
      positions.setXYZ(i, x, height * .117 - hollow + edgeCreases, depth);
    }
    geometry.computeVertexNormals();
    const pose = new THREE.Matrix4().makeRotationY(angle).setPosition(0, y, z);
    add(geometry.applyMatrix4(pose), pillow);
    const perimeter = Array.from({ length: 32 }, (_, i) => {
      const turn = i * Math.PI * 2 / 32;
      const x = inflate(Math.cos(turn)) * .566;
      const depth = inflate(Math.sin(turn)) * .309;
      return new THREE.Vector3(x, -.008, depth).applyMatrix4(pose);
    });
    add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(perimeter, true), 64, .008, 6, true), welt);
  }
  function quiltSurface(width: number, length: number, y: number, z: number, material: THREE.Material, seed: number) {
    const sheet = new THREE.PlaneGeometry(width, length, 36, 32).rotateX(-Math.PI / 2);
    const position = sheet.attributes.position;
    function onCloth(x: number, localZ: number): Vec {
      const edge = Math.abs(x);
      const bend = width / 2 - .09;
      const hem = THREE.MathUtils.smoothstep(edge, bend, width / 2);
      // Take the fabric beyond the mattress piping before dropping the hem.
      const overhang = .059 * THREE.MathUtils.smoothstep(edge, bend - .13, bend) * (1 - .9 * hem);
      const ripples = Math.sin(x * 17 + localZ * 3.4 + seed) * (.010 + .017 * hem)
        + Math.cos(x * 27 - localZ * 7.1) * .008 + Math.sin(x * 5 - localZ * 5.4) * .013;
      const fold = .051 * Math.exp(-Math.pow((localZ + length / 2 - .09 + x * .035) / .083, 2));
      return [Math.sign(x) * (edge + overhang + (1 + Math.sin(localZ * 14 + seed)) * .007 * hem),
        y + .063 + fold + ripples - hem * .139, localZ + z + Math.cos(x * 5.8) * .025];
    }
    for (let i = 0; i < position.count; i++)
      position.setXYZ(i, ...onCloth(position.getX(i), position.getZ(i)));
    sheet.computeVertexNormals();
    add(sheet, material);
    // Stitch the border to the deformed surface so it follows the folds and side drape.
    for (const side of [-1, 1]) {
      const points = Array.from({ length: 26 }, (_, i) => {
        const point = onCloth(side * (width / 2 - .063), (i / 25 - .5) * (length - .066));
        point[1] += .008;
        return point;
      });
      bentTube(points, .007, quiltThread);
    }
    const cuff = Array.from({ length: 29 }, (_, i) => {
      const point = onCloth((i / 28 - .5) * (width - .132), -length / 2 + .106);
      point[1] += .008;
      return point;
    });
    bentTube(cuff, .007, quiltThread);
  }
  function lamp(x: number, y: number, z: number, direction: number) {
    bar([x, y, z], [x, y + .28, z], .019, steel);
    bar([x, y + .28, z], [x + direction * .12, y + .35, z], .02, steel);
    const top: Vec = [x + direction * .12, y + .34, z];
    const bottom: Vec = [x + direction * .22, y + .20, z + .035];
    bar(bottom, top, .114, steel, .062);
    oval(bottom[0], bottom[1] - .012, bottom[2], .076, .025, .07, lampGlow);
  }

  const { w, d, h } = DORMITORY_B;
  const rear = -d / 2, front = d / 2, half = w / 2;
  box(w, .08, d, 0, floor - .04, 0, paving);
  const opening = 14.45, sill = 2.72, head = 3.95, top = h + .25;
  box(w, sill - floor, DORMITORY_WALL, 0, (sill + floor) / 2, rear, plaster);
  box(w, top - head, DORMITORY_WALL, 0, (top + head) / 2, rear, plaster);
  for (const side of [-1, 1]) {
    box((w - opening) / 2, head - sill, DORMITORY_WALL, side * (w + opening) / 4, (head + sill) / 2, rear, plaster);
    box(DORMITORY_WALL, 1.26, d, side * half, floor + .63, 0, plaster);
    box(half - 1.3, .60, DORMITORY_WALL, side * (half + 1.3) / 2, floor + .30, front, plaster);
    box(half - 1.3, .07, .255, side * (half + 1.3) / 2, floor + .60, front, trim);
    box(.16, 2.48, .17, side * 1.31, floor + 1.24, front, edge);
    box(.018, .70, d - .23, side * (half - .092), floor + .35, 0, sage);
    box(.030, .055, d - .23, side * (half - .087), floor + .74, 0, trim);
  }
  box(2.77, .15, .26, 0, floor + 2.52, front, windowFrame);
  box(2.6, .18, .72, 0, .126, front + .36, paving);
  box(w - .2, .70, .034, 0, floor + .35, rear + .091, sage);
  box(w - .2, .055, .047, 0, floor + .74, rear + .094, trim);
  box(opening + .27, .125, .36, 0, sill + .015, rear + .064, trim);
  const windowHeight = head - sill - .12;
  for (const y of [sill + .08, head - .04]) box(opening + .08, .11, .21, 0, y, rear + .026, windowFrame);
  const windowBays = 8, paneWidth = opening / windowBays;
  for (let i = 0; i <= windowBays; i++)
    box(.117, windowHeight, .238, -opening / 2 + paneWidth * i, (head + sill) / 2 + .036, rear + .027, windowFrame);
  for (let i = 0; i < windowBays; i++) {
    const x = -opening / 2 + paneWidth * (i + .5);
    add(new THREE.PlaneGeometry(paneWidth - .14, windowHeight - .055).translate(x, (head + sill) / 2 + .022, rear - .076), pane, false);
    box(.038, windowHeight - .05, .075, x, (head + sill) / 2 + .016, rear - .035, windowFrame);
    for (let slat = 0; slat < 5; slat++)
      add(new THREE.BoxGeometry(paneWidth - .13, .059, .20).rotateX(-.43)
        .translate(x, sill + .16 + slat * .202, rear + .05), windowFrame);
  }

  active = interior;
  const { bunks, rug, entryMat, linenCabinet, lockers, wallCabinets, desks, bookShelves, shoeBench, towelShelf, seat, laundryShelf, notice } = DORMITORY_LAYOUT;
  const bedNumbers = new THREE.MeshStandardMaterial({
    roughness: .67,
    map: canvasMap(768, 96, c => {
      c.fillStyle = '#d6ba7c'; c.fillRect(0, 0, 768, 96);
      c.font = 'bold 43px sans-serif'; c.textAlign = 'center';
      for (let i = 0; i < bunks.length * 2; i++) {
        const x = 48 + i * 96;
        c.strokeStyle = '#8c7046'; c.lineWidth = 2; c.strokeRect(x - 40, 12, 80, 72);
        c.fillStyle = '#433c32'; c.fillText(`0${i + 1}`, x, 65);
      }
    }),
  });
  for (const [index, bunk] of bunks.entries()) {
    place(bunk);
    const { ladderSide } = bunk;
    const x = 0, z = 0;
    const halfWidth = bunk.w / 2 - .067, halfDepth = bunk.d / 2 - .048;
    const topRail = floor + 2.34;
    for (const side of [-1, 1]) for (const end of [-1, 1]) {
      const px = x + side * halfWidth, pz = z + end * halfDepth;
      bar([px, floor, pz], [px, topRail - .24, pz], .039, steel);
      bar([px, floor + .070, pz], [px, floor + .105, pz], .046, brass);
      bar([px, floor + .004, pz], [px, floor + .053, pz], .066, rubber);
      bar([px, topRail - .303, pz], [px, topRail - .245, pz], .049, ferrule);
    }
    for (const [level, lift] of BUNK_LEVELS.entries()) {
      const y = floor + lift;
      box(bunk.w - .12, .081, bunk.d - .06, x, y - .0405, z, steel, .035);
      box(bunk.w - .12, MATTRESS_DEPTH, bunk.d - .14, x, y + MATTRESS_DEPTH / 2, z, linen, .079);
      box(bunk.w - .106, .017, bunk.d - .115, x, y + .082, z, welt, .008);
      for (const side of [-1, 1]) {
        const px = side * halfWidth;
        box(.067, .122, bunk.d - .041, px, y - .081, z, steel, .018);
        for (const end of [-1, 1]) {
          const pz = end * halfDepth;
          box(.095, .167, .172, px, y - .048, pz, ferrule, .018);
          for (const dy of [-.041, .041]) screw(px + side * .048, y - .045 + dy, pz, side);
        }
      }
      bedPillow(y + MATTRESS_DEPTH + .098, z - .79, index % 2 ? -.027 : .032);
      box(.006, .055, .119, -halfWidth - .006, y + .090, z - .614, paper);
      for (const offset of [-.034, 0, .034])
        box(.003, .016, .005, -halfWidth - .011, y + .090, z - .614 + offset, quiltThread);
      if (index !== 0 || level !== 0) {
        const quilt = (index + level) % 2 ? alternateCloth : cloth;
        quiltSurface(bunk.w - .13, 1.43, y + MATTRESS_DEPTH, .43, quilt, index * 4 + level);
        if (index === 1 && level === 1) {
          box(.83, .062, .62, -.08, y + MATTRESS_DEPTH + .13, .65, foldedThrow, .020);
          for (let thread = 0; thread < 13; thread++)
            box(.027, .009, .071, -.462 + thread * .063, y + MATTRESS_DEPTH + .10, .97, stitch);
        }
      }
      box(bunk.w - .375, .257, .072, x, y + .136, z - halfDepth + .019, wood, .034);
      const ladderGap = .50;
      const footPanelWidth = level ? bunk.w - .21 - ladderGap : bunk.w - .24;
      const footX = x - (level ? ladderSide * ladderGap / 2 : 0);
      box(footPanelWidth, .177, .063, footX, y + .083, z + halfDepth - .017, wood, .023);
      for (const plateSide of [-1, 1])
        bar([footX + plateSide * (footPanelWidth / 2 - .083), y + .086, z + halfDepth + .011],
          [footX + plateSide * (footPanelWidth / 2 - .083), y + .086, z + halfDepth + .026], .018, boltMetal);
      const badge = new THREE.PlaneGeometry(.149, .106);
      const uv = badge.attributes.uv;
      for (let i = 0; i < uv.count; i++) uv.setX(i, (uv.getX(i) + index * 2 + level) / (bunks.length * 2));
      box(.166, .122, .013, footX, y + .086, z + halfDepth + .02, brass, .005);
      add(badge.translate(footX, y + .086, z + halfDepth + .028), bedNumbers, false);
      const lampX = x + halfWidth - .09;
      oval(lampX, y + .18, z - halfDepth + .12, .063, .024, .055, steel);
      lamp(lampX, y + .18, z - halfDepth + .14, -1);
      add(new THREE.PlaneGeometry(.84, .56).rotateX(-Math.PI / 2).translate(lampX - .24, y + MATTRESS_DEPTH + .005, z - .93), lampPool, false);
    }
    for (const side of [-1, 1]) {
      const px = x + side * halfWidth;
      const rail = topRail - .024;
      bentTube([[px, rail - .29, -halfDepth], [px, rail - .105, -halfDepth],
        [px, rail - .026, -halfDepth + .061], [px, rail, -halfDepth + .167],
        [px, rail, -.74], [px, rail, .74], [px, rail, halfDepth - .167],
        [px, rail - .026, halfDepth - .061], [px, rail - .105, halfDepth],
        [px, rail - .29, halfDepth]], .039, steel);
      bar([px, rail - .195, -halfDepth], [px, rail - .195, halfDepth], .026, steel);
      for (const railZ of [-.53, .53])
        bar([px, rail - .194, railZ], [px, rail, railZ], .022, steel);
    }
    const ladderX = x + ladderSide * .29, near = z + halfDepth;
    const stop = ladderX - ladderSide * .252;
    bar([x - ladderSide * halfWidth, topRail - .035, near], [stop, topRail - .035, near], .032, steel);
    for (const side of [-1, 1]) {
      const px = ladderX + side * .229;
      bar([px, floor + .028, near + .177], [px, topRail, near + .016], .031, steel);
      oval(px, floor + .023, near + .177, .054, .021, .051, rubber);
      const bracketY = floor + BUNK_LEVELS[1] - .078;
      bar([px, bracketY, near - .046], [px, bracketY, near + .068], .036, ferrule);
    }
    for (let rung = 0; rung < 6; rung++) {
      const y = floor + .29 + .337 * rung;
      const pz = near + .177 - (y - floor) * .161 / (topRail - floor);
      box(.438, .047, .096, ladderX, y, pz, steel, .017);
      box(.353, .009, .067, ladderX, y + .026, pz, rubber, .004);
      for (const offset of [-.020, 0, .020])
        box(.304, .006, .005, ladderX, y + .032, pz + offset, ferrule);
      for (const side of [-1, 1])
        bar([ladderX + side * .202, y, pz + .041], [ladderX + side * .202, y, pz + .054], .013, boltMetal);
    }
    const drawerWidth = (bunk.d - .23) / 2;
    for (const end of [-1, 1]) {
      const dz = end * drawerWidth / 2;
      box(bunk.w - .19, .236, drawerWidth - .058, x, floor + .146, dz, sage, .024);
      box(.042, .219, drawerWidth - .088, -(bunk.w - .19) / 2, floor + .146, dz, wood, .019);
      const drawerFace = -(bunk.w - .19) / 2 - .028;
      const pullY = floor + .17;
      bentTube([[drawerFace, pullY, dz - .092], [drawerFace - .023, pullY, dz - .083],
        [drawerFace - .046, pullY, dz - .061], [drawerFace - .049, pullY, dz - .037],
        [drawerFace - .049, pullY, dz + .037], [drawerFace - .046, pullY, dz + .061],
        [drawerFace - .023, pullY, dz + .083], [drawerFace, pullY, dz + .092]], .012, brass);
    }

    const pocketX = -halfWidth + .05, pocketY = floor + 1.62, pocketZ = -.99;
    for (const offset of [-.127, .127])
      box(.055, .208, .040, pocketX, pocketY + .254, pocketZ + offset, index ? alternateCloth : cloth, .010);
    box(.119, .303, .355, pocketX - .018, pocketY + .055, pocketZ, index ? alternateCloth : cloth, .029);
    box(.039, .265, .28, pocketX - .065, pocketY + .112, pocketZ, index ? rust : blue, .012);
    box(.008, .236, .256, pocketX - .087, pocketY + .119, pocketZ, paper, .003);
    box(.037, .191, .350, pocketX - .086, pocketY + .036, pocketZ, index ? alternateCloth : cloth, .014);
    box(.005, .015, .322, pocketX - .107, pocketY + .118, pocketZ, quiltThread);
  }
  placement.identity();
  const rugMat = standard(0xe0cba2);
  rugMat.map = canvasMap(128, 384, c => {
    c.fillStyle = '#a69370'; c.fillRect(0, 0, 128, 384);
    c.fillStyle = '#606e63'; c.fillRect(10, 12, 108, 360);
    c.strokeStyle = '#d6bc89'; c.lineWidth = 3; c.strokeRect(15, 20, 98, 344);
    c.strokeStyle = '#8a9b82'; c.lineWidth = 1; c.strokeRect(21, 30, 86, 324);
    for (let i = 40; i < 365; i += 40) {
      for (const x of [38, 64, 90]) {
        c.strokeStyle = '#859583';
        c.beginPath(); c.moveTo(x - 7, i); c.lineTo(x, i - 7);
        c.lineTo(x + 7, i); c.lineTo(x, i + 7); c.closePath(); c.stroke();
      }
    }
    const random = seededRandom(57);
    for (let i = 0; i < 5700; i++) {
      c.fillStyle = i % 2 ? 'rgba(74,59,41,.19)' : 'rgba(255,238,199,.33)';
      c.fillRect(random() * 128, random() * 384, random() * 2 + .4, 1);
    }
  });
  for (const mat of [rug, entryMat]) {
    place(mat);
    add(new THREE.PlaneGeometry(mat.w, mat.d).rotateX(-Math.PI / 2).translate(0, floor + .005, 0), rugMat, false);
    for (let i = 0; i < 24; i++) for (const end of [-1, 1])
      box(.014, .007, .044, (i / 23 - .5) * (mat.w - .035), floor + .006, end * (mat.d / 2 + .018), stitch);
  }

  // Storage fronts are authored on +Z and turned towards the relevant aisle.
  for (const [index, locker] of lockers.entries()) {
    place(locker);
    const base = floor + .076, height = 1.82, face = locker.d / 2;
    box(locker.w, height, locker.d, 0, base + height / 2, 0, steel, .019);
    box(locker.w, .051, locker.d, 0, base + height, 0, sage, .014);
    for (let i = 0; i < 4; i++) {
      const x = (i % 2 - .5) * locker.w / 2, y = base + (i < 2 ? .75 : .25) * height;
      box(locker.w / 2 - .037, height / 2 - .046, .037, x, y, face + .012, sage, .014);
      box(.068, .155, .031, x + .180, y + .005, face + .043, brass, .009);
      box(.023, .097, .013, x + .180, y + .005, face + .057, rubber, .005);
      box(.095, .043, .010, x, y + .285, face + .049, paper, .006);
      for (let vent = 0; vent < 3; vent++) for (const dy of [-.23, .14])
        box(.22, .015, .015, x, y + dy + vent * .030, face + .041, steel, .004);
    }
    for (const x of [-.51, .51]) for (const z of [-.23, .23])
      box(.09, .09, .10, x, floor + .045, z, steel, .012);
    for (let layer = 0; layer < 3; layer++)
      box(.45, .049, .40, index ? .25 : -.25, base + height + .055 + layer * .044, .02, layer % 2 ? foldedThrow : linen, .019);
  }

  for (const cabinet of [linenCabinet, ...wallCabinets]) {
    place(cabinet);
    const height = cabinet === linenCabinet ? .92 : .84;
    const compartments = cabinet === linenCabinet ? 3 : 4;
    box(cabinet.w, height - .09, cabinet.d, 0, floor + height / 2, 0, sage, .013);
    box(cabinet.w, .067, cabinet.d, 0, floor + height, 0, wood, .014);
    for (let i = 0; i < compartments; i++) {
      const x = ((i + .5) / compartments - .5) * cabinet.w;
      box(cabinet.w / compartments - .032, height - .18, .027, x, floor + height / 2, cabinet.d / 2 + .005, sage, .012);
      box(.099, .023, .029, x + .15, floor + height - .19, cabinet.d / 2 + .03, brass, .005);
    }
    if (cabinet === linenCabinet) {
      for (const x of [-.91, .91]) for (let layer = 0; layer < 3; layer++)
        box(.52, .046, .34, x, floor + height + .053 + layer * .038, -.045,
          layer === 1 ? foldedThrow : linen, .019);
    }
  }

  function openStorage(fixture: typeof shoeBench | typeof towelShelf | typeof laundryShelf, height: number, bays: number) {
    place(fixture);
    box(fixture.w, .069, fixture.d, 0, floor + .07, 0, edge, .012);
    box(fixture.w, .065, fixture.d, 0, floor + height, 0, wood, .016);
    box(fixture.w, height - .12, .045, 0, floor + height / 2, -fixture.d / 2 + .024, inside);
    for (let i = 0; i <= bays; i++)
      box(.048, height - .10, fixture.d, (i / bays - .5) * (fixture.w - .051), floor + height / 2, 0, wood, .010);
  }
  openStorage(shoeBench, .55, 4);
  for (let i = 0; i < 4; i++) {
    const x = (i - 1.5) * shoeBench.w / 4, shoe = i % 2 ? rubber : inside;
    for (const side of [-1, 1]) {
      const px = x + side * .102;
      box(.15, .044, .35, px, floor + .135, .033, rubber, .016);
      oval(px, floor + .18, .091, .075, .067, .143, shoe);
      box(.14, .12, .135, px, floor + .224, -.058, shoe, .027);
      for (let lace = 0; lace < 3; lace++)
        box(.079, .009, .011, px, floor + .237, .016 + lace * .031, linen, .002);
    }
  }
  box(shoeBench.w, .89, .085, 0, floor + .76, -shoeBench.d / 2 + .045, edge, .012);
  box(shoeBench.w - .28, .071, .049, 0, floor + 1.14, -shoeBench.d / 2 + .097, steel, .008);
  for (let i = 0; i < 4; i++) {
    const x = (i - 1.5) * .76, bag = i % 2 ? sage : blue;
    box(.30, .35, .174, x, floor + .87, -.126, bag, .052);
    box(.266, .14, .064, x, floor + .796, -.026, bag, .027);
    for (const side of [-1, 1])
      bar([x + side * .073, floor + .999, -.142], [x, floor + 1.135, -.195], .013, rubber);
    box(.046, .068, .016, x + .054, floor + .809, .012, brass, .007);
  }
  openStorage(towelShelf, .73, 2);
  for (let stack = 0; stack < 2; stack++) for (let item = 0; item < 3; item++)
    box(.575, .055, .44, (stack - .5) * .77, floor + .122 + item * .049, -.038, item === 1 ? foldedThrow : linen, .023);

  place(seat);
  const seatY = floor + .51;
  box(seat.w, .13, seat.d, 0, seatY - .088, 0, edge, .018);
  box(seat.w - .039, .50, .124, 0, seatY + .174, -seat.d / 2 + .075, sage, .047);
  for (const side of [-1, 1]) {
    box(seat.w / 2 - .087, .132, .50, side * seat.w / 4, seatY + .039, .054, sage, .045);
    const x = side * (seat.w / 2 - .112);
    for (const z of [-.226, .226]) box(.082, .420, .094, x, floor + .212, z, edge, .010);
    box(.077, .07, seat.d - .046, side * (seat.w / 2 - .039), seatY + .202, 0, wood, .016);
  }

  openStorage(laundryShelf, .84, 2);
  const wicker = standard(0xbb9d67);
  for (const x of [-.51, .51]) {
    const centerZ = .015, radius = .252, base = floor + .105;
    bar([x, base, centerZ], [x, base + .315, centerZ], radius - .034, wicker, radius);
    for (let band = 0; band < 6; band++) {
      const y = base + .055 + .046 * band;
      add(new THREE.TorusGeometry(radius - .029 + .004 * band, .011, 6, 24)
        .rotateX(-Math.PI / 2).translate(x, y, centerZ), edge);
    }
    box(.324, .082, .31, x, base + .326, centerZ, linen, .047);
  }
  for (let item = 0; item < 3; item++)
    box(.60, .047, .40, -.48, floor + .896 + item * .043, -.04, item === 1 ? foldedThrow : linen, .020);
  placement.identity();

  const desktopY = DORMITORY_DESKTOP;
  const pageArtwork = canvasMap(256, 184, c => {
    c.fillStyle = '#f2e6cd'; c.fillRect(0, 0, 256, 184);
    c.fillStyle = '#d0c3a9'; c.fillRect(125, 0, 6, 184);
    c.font = '10px Georgia'; c.fillStyle = '#536467';
    c.fillText('Lesson 04', 12, 23); c.fillText('Homework', 146, 23);
    const random = seededRandom(77);
    for (const x of [12, 145]) for (let row = 0; row < 11; row++) {
      c.fillStyle = 'rgba(83,108,118,.23)';
      c.fillRect(x, 37 + row * 12, 98, 1);
      c.fillStyle = 'rgba(69,82,82,.43)';
      c.fillRect(x + 2, 35 + row * 12, 34 + random() * 55, 1.65);
    }
  });
  const exercisePage = new THREE.MeshStandardMaterial({ map: pageArtwork, roughness: .93, side: THREE.DoubleSide });
  for (const [i, desk] of desks.entries()) {
    place(desk);
    box(desk.w, .095, desk.d, 0, desktopY - .0475, 0, wood, .022);
    box(desk.w - .055, .137, .096, 0, desktopY - .116, -desk.d / 2 + .079, edge);
    box(.018, .007, desk.d - .066, 0, desktopY + .004, 0, edge);
    for (const x of [-desk.w / 2 + .10, 0, desk.w / 2 - .10]) {
      for (const z of [-.26, .26]) bar([x, floor, z], [x, desktopY - .085, z], .033, steel);
      box(.064, .055, .61, x, floor + .152, 0, steel, .010);
    }
    for (const [seat, x] of [-1.08, 1.08].entries()) {
      const lampX = x - .70, base = desktopY;
      oval(lampX, base + .024, -.22, .119, .029, .112, steel);
      lamp(lampX, base + .026, -.22, 1);
      add(new THREE.PlaneGeometry(.77, .58).rotateX(-Math.PI / 2)
        .translate(x - .36, base + .005, -.08), lampPool, false);
      const notebook = i + seat;
      box(.523, .019, .348, x, base + .011, .085, notebook % 2 ? rust : blue, .010);
      add(new THREE.PlaneGeometry(.509, .336).rotateX(-Math.PI / 2)
        .translate(x, base + .026, .087), exercisePage, false);
      bar([x + .26, base + .021, -.074], [x + .34, base + .021, .193], .009, brass);
      bar([x + .54, base, -.23], [x + .54, base + .113, -.23], .067, notebook % 2 ? rust : brass);
      for (let pen = 0; pen < 4; pen++)
        bar([x + .547 + (pen - 1.5) * .022, base + .071, -.23],
          [x + .547 + (pen - 1.5) * .035, base + .172 + pen % 2 * .032, -.23 + Math.cos(pen) * .038], .007, pen % 2 ? rust : blue);
      if (notebook % 3) {
        box(.24, .045, .164, x + .49, base + .032, .146, notebook % 2 ? blue : sage, .015);
      } else {
        bar([x + .66, base, .118], [x + .66, base + .24, .118], .057, steel, .049);
        bar([x + .66, base + .24, .118], [x + .66, base + .27, .118], .047, rubber);
      }
    }
  }

  for (const chair of DORMITORY_CHAIRS) {
    place(chair);
    const seatY = .77;
    box(chair.w - .033, .071, chair.d - .09, 0, seatY, 0, wood, .026);
    for (const side of [-1, 1]) {
      const x = side * .201;
      bar([x, floor, -.211], [x, seatY + .012, -.166], .026, steel);
      bar([x, floor, .217], [x, seatY + .39, .17], .026, steel);
    }
    box(.45, .169, .058, 0, seatY + .308, .175, wood, .027);
  }

  const leaf = standard(0x799553);
  for (const shelf of bookShelves) {
    place(shelf);
    const topY = floor + .74;
    box(shelf.w, .067, shelf.d, 0, topY, 0, wood, .015);
    box(shelf.w, .65, .04, 0, floor + .34, -shelf.d / 2 + .025, edge);
    for (let i = 0; i <= 4; i++)
      box(.045, .668, shelf.d, (i / 4 - .5) * (shelf.w - .047), floor + .352, 0, wood, .010);
    for (const level of [.09, .408])
      box(shelf.w, .054, shelf.d - .026, 0, floor + level, 0, wood, .009);
    for (let bay = 0; bay < 4; bay++) {
      const x = (bay - 1.5) * shelf.w / 4;
      for (let i = 0; i < 6; i++) {
        const px = x + (i - 2.5) * .091, y = floor + .548 + i % 3 * .018;
        box(.074, .22 + i % 3 * .036, .216, px, y, .094, [blue, rust, sage, paper, edge][i % 5], .009);
        box(.055, .033, .009, px, y + .044, .207, paper, .004);
      }
      box(.53, .237, .427, x, floor + .226, .033, bay % 2 ? wicker : sage, .026);
      box(.149, .044, .019, x, floor + .265, .253, inside, .009);
    }
    const plantX = shelf.turn * 1.18;
    bar([plantX, topY + .034, 0], [plantX, topY + .244, 0], .121, rust, .159);
    for (let i = 0; i < 8; i++)
      oval(plantX + Math.sin(i * 2.4) * .156, topY + .292 + i % 3 * .041,
        Math.cos(i * 2.4) * .125, .094, .048, .073, leaf);
    for (const [index, x] of [-plantX, -plantX * .31].entries()) {
      for (let level = 0; level < 2 + index; level++) {
        const y = topY + .053 + level * .046;
        box(.31 - level * .027, .049, .39 - level * .025, x, y, .015,
          [blue, rust, sage][(level + index) % 3], .009);
        box(.282 - level * .027, .032, .361 - level * .025, x, y, .034, paper, .004);
      }
    }
  }
  placement.identity();

  const boardMap = canvasMap(512, 282, c => {
    c.fillStyle = '#ad8859'; c.fillRect(0, 0, 512, 282);
    const random = seededRandom(2845);
    c.fillStyle = 'rgba(77,54,33,.2)';
    for (let i = 0; i < 1900; i++) c.fillRect(random() * 512, random() * 282, 2, 1);
    for (const [i, x] of [23, 200, 342].entries()) {
      const y = 48 + i % 2 * 32, cardH = i === 0 ? 182 : 122;
      c.fillStyle = '#816640'; c.fillRect(x + 4, y + 5, 142, cardH);
      c.fillStyle = ['#eadfc3', '#d9d4b9', '#e7cfaa'][i]; c.fillRect(x, y, 142, cardH);
      c.fillStyle = '#5e624e'; c.font = 'bold 18px sans-serif';
      c.fillText(['DUTY', 'SWEEP', 'TIDY UP'][i], x + 11, y + 40);
      c.fillStyle = 'rgba(87,83,64,.28)';
      for (let line = 0; line < 4; line++) c.fillRect(x + 12, y + 61 + line * 11, 66 + random() * 42, 2);
      c.fillStyle = '#665237'; c.beginPath(); c.arc(x + 65, y + 9, 4, 0, Math.PI * 2); c.fill();
    }
  });
  const board = new THREE.MeshStandardMaterial({ map: boardMap, roughness: .87 });
  box(1.58, .90, .104, notice.x, notice.y, notice.z, edge, .027);
  add(new THREE.PlaneGeometry(1.446, .775).translate(notice.x, notice.y, notice.z + .054), board);

  for (const { geometries, group, materials, shadow } of batches.values()) {
    const geometry = mergeGeometries(geometries);
    geometries.forEach(piece => piece.dispose());
    if (!geometry) continue;
    const mesh = new THREE.Mesh(geometry, materials);
    mesh.castShadow = shadow;
    mesh.receiveShadow = true;
    group.add(mesh);
  }
  return { structure, interior };
}
