import {registerAnMotion,beginAnFrame} from './an-game-motion.ts';
import { cadetElbowSpanRatio, elbowGuide, elbowGuideName, elbowSegments } from './elbow-curve.ts';
import * as THREE from 'three';
import { clone as cloneSkeleton } from 'three/addons/utils/SkeletonUtils.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { sculptChibiHair, sculptChibiLock, sculptLoft, type SculptRing } from './cadet-sculpt.ts';

import { CHARACTER_PROFILES, type CharacterKind, type CharacterProfile } from './campus-character-profiles.ts';
export { CHARACTER_PROFILES, type CharacterKind } from './campus-character-profiles.ts';

const CHARACTER_HEAD_SCALE = .86;
// Keep the chin seated on the neck when reducing the whole head and its accessories.
export const CHARACTER_HEAD_HEIGHT = 1.47 - .365 * (1 - CHARACTER_HEAD_SCALE);
type Vec = [number, number, number];

export function buildCampusCharacter(kind: CharacterKind, backpack = false) {
  const profile: CharacterProfile = CHARACTER_PROFILES[kind];
  const group = new THREE.Group(), body = new THREE.Group();
  group.name = profile.name;
  group.add(body);
  const skin = profile.skin ?? 0xeda66b, blush = 0xe88462;
  const shirt = profile.cloth, pants = profile.pants, hair = profile.hairColor ?? 0x201e1c, hairLight = profile.hairColor ? 0xa6aaa0 : 0x393530;
  const gold = 0xf2be4f, red = 0xbb4933, dark = 0x342e25, cream = 0xf6e7c8;
  const backpackColor = 0xb59559;
  const palette = new Map<number, THREE.MeshStandardMaterial>();
  // Soft matte materials match the approved sculpted cast. Vertex colour keeps
  // clothing, skin and props in one draw per articulated pivot, without textures.
  const surface = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .76, metalness: 0 });

  function mesh(geometry: THREE.BufferGeometry, color: number, parent: THREE.Object3D, x = 0, y = 0, z = 0) {
    let material = palette.get(color);
    if (!material) {
      material = new THREE.MeshStandardMaterial({ color });
      palette.set(color, material);
    }
    const piece = new THREE.Mesh(geometry, material);
    piece.position.set(x, y, z);
    parent.add(piece);
    return piece;
  }
  const ball = (parent: THREE.Object3D, color: number, x: number, y: number, z: number, sx: number, sy: number, sz: number) => {
    const fine = Math.max(sx, sy, sz) > .09;
    const piece = mesh(new THREE.SphereGeometry(1, fine ? 16 : 10, fine ? 12 : 7), color, parent, x, y, z);
    piece.scale.set(sx, sy, sz);
    return piece;
  };
  const patch = (parent: THREE.Object3D, color: number, x: number, y: number, z: number, w: number, h: number, d: number) =>
    mesh(new RoundedBoxGeometry(w, h, d, 1, Math.min(w, h, d) * .38), color, parent, x, y, z);
  const loft = (parent: THREE.Object3D, color: number, rings: SculptRing[], segments = 14, steps = 14) =>
    mesh(sculptLoft(rings, segments, steps, color === pants && !profile.skirt ? .012 : 0), color, parent);
  const stroke = (parent: THREE.Object3D, color: number, radius: number, points: Vec[]) =>
    mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p))), 8, radius, 4, false), color, parent);
  function framedStar(parent: THREE.Group, depth: (x: number, y: number) => number) {
    const star = new THREE.Shape();
    for (let i = 0; i < 10; i++) {
      const angle = Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? .029 : .061;
      const x = Math.cos(angle) * r, y = Math.sin(angle) * r;
      if (i) star.lineTo(x, y); else star.moveTo(x, y);
    }
    star.closePath();
    const geometry = new THREE.ShapeGeometry(star), p = geometry.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i) + .394;
      p.setXYZ(i, x, y, depth(x, y) + .007);
    }
    geometry.computeVertexNormals();
    mesh(geometry, gold, parent);
  }

  const width = kind === 'canteen' ? .305 : profile.broad ? .266 : .224;
  loft(body, shirt, [
    { y: .401, x: .02, z: .025 }, { y: .448, x: width * .90, z: .147 },
    { y: .625, x: width * .94, z: .181 }, { y: .827, x: width * 1.025, z: .164 },
    { y: .948, x: width * .91, z: .146 }, { y: .991, x: width * .68, z: .119 }, { y: 1.03, x: .1, z: .09 }, { y: 1.04, x: .01, z: .01 },
  ]);
  ball(body, skin, 0, 1.035, .005, .096, .109, .094);
  const leftLeg = new THREE.Group(), rightLeg = new THREE.Group();
  leftLeg.position.set(-.115, .47, 0);
  rightLeg.position.set(.115, .47, 0);
  body.add(leftLeg, rightLeg);
  const knees: THREE.Group[] = [];
  for (const leg of [leftLeg, rightLeg]) {
    loft(leg, profile.skirt ? skin : pants, [{ y: .066, x: .084, z: .088 }, { y: -.015, x: .115, z: .123 }, { y: -.109, x: .108, z: .107 }, { y: -.199, x: .084, z: .094 }]);
    const knee = new THREE.Group();
    knee.position.y = -.16;
    leg.add(knee);
    knees.push(knee);
    loft(knee, profile.skirt ? skin : pants, [
      { y: .055, x: .083, z: .09 }, { y: -.048, x: .096, z: .095 },
      { y: -.148, x: .091, z: .087 }, { y: -.211, x: .073, z: .075 },
    ]);
    if (!profile.skirt) {
      loft(knee, pants, [{ y: -.152, x: .09, z: .088 }, { y: -.185, x: .087, z: .081 }, { y: -.203, x: .078, z: .077 }]);
    }
    const sole = profile.uniform ? cream : 0x977955;
    ball(knee, sole, 0, -.274, .059, .117, .033, .171);
    ball(knee, 0x41382b, 0, -.296, .059, .112, .012, .163);
    loft(knee, profile.uniform ? 0x444d31 : 0x6d5138, [
      { y: -.266, x: .106, z: .151, cz: .060 }, { y: -.228, x: .113, z: .156, cz: .060 },
      { y: -.179, x: .097, z: .104, cz: .022 }, { y: -.142, x: .071, z: .061, cz: -.012 },
    ]);
    ball(knee, sole, 0, -.249, .171, .103, .022, .052);
    if (profile.uniform) for (let i = 0; i < 2; i++) {
      stroke(knee, cream, .008, [[-.047, -.165 - i * .016, .063 + i * .035], [0, -.159 - i * .016, .075 + i * .035], [.047, -.165 - i * .016, .063 + i * .035]]);
    }
  }
  if (profile.skirt) {
    const skirt = new THREE.Group();
    body.add(skirt);
    loft(skirt, pants, [{ y: .07, x: .282, z: .178 }, { y: .095, x: .287, z: .184 },
      { y: .48, x: .258, z: .173 }, { y: .68, x: .216, z: .159 }], 24, 24);
    stroke(skirt, 0x294a36, .006, [[-.12, .66, .134], [-.15, .46, .149], [-.2, .10, .132]]);
    stroke(skirt, 0x567357, .005, [[.08, .66, .152], [.11, .47, .165], [.14, .20, .166]]);
  } else if (profile.uniform) {
    loft(body, 0x494132, [{ y: .451, x: width * .941, z: .154 }, { y: .462, x: width * .97, z: .174 },
      { y: .507, x: width * .97, z: .173 }, { y: .514, x: width * .94, z: .156 }]);
    patch(body, gold, 0, .485, .166, .079, .055, .023);
    patch(body, dark, 0, .485, .18, .055, .032, .01);
  }
  for (const side of [-1, 1]) {
    const collarShape = new THREE.Shape();
    collarShape.moveTo(.012 * side,.995);
    collarShape.lineTo(.104 * side,.978);
    collarShape.lineTo(.14 * side,.881);
    collarShape.quadraticCurveTo(.105 * side,.89,.047 * side,.942);
    collarShape.closePath();
    const collarGeometry = new THREE.ExtrudeGeometry(collarShape, {depth:.018, bevelEnabled:true, bevelThickness:.004, bevelSize:.004, bevelSegments:1, steps:1});
    mesh(collarGeometry,shirt,body,0,0,.121);
    const label = patch(body, profile.uniform ? red : shirt, .086 * side, .946, .149, .053, .061, .012);
    label.rotation.z = .4 * side;
    if (profile.uniform) {
      ball(body, gold, .086 * side, .945, .159, .010, .010, .005);
      patch(body, 0x546139, .113 * side, .745, .164, .134, .122, .028);
      patch(body, shirt, .113 * side, .781, .182, .139, .046, .019);
      ball(body, gold, .113 * side, .762, .198, .009, .009, .005);
    }
  }
  stroke(body, profile.uniform ? 0x475632 : 0xcab797, .008, [[0,.9,.163],[0,.71,.184],[0,.535,.161]]);
  for (const y of [.84, .665, .565]) ball(body, profile.uniform ? gold : 0xbba486, 0, y, .179, .011, .011, .006);

  const leftArm = new THREE.Group(), rightArm = new THREE.Group();
  leftArm.position.set(-width * .93, .897, .007);
  rightArm.position.set(width * .93, .897, .007);
  body.add(leftArm, rightArm);
  const elbows: THREE.Group[] = [];
  for (const [index, arm] of [leftArm, rightArm].entries()) {
    const side = index === 0 ? -1 : 1;
    arm.rotation.z = side * .13;
    loft(arm, shirt, [{ y: .077, x: .013, z: .025 }, { y: .046, x: .080, z: .083 },
      { y: -.038, x: .099, z: .093 }, { y: -.114, x: .089, z: .087 }, { y: -.186, x: .071, z: .073 }]);
    const elbow = new THREE.Group();
    elbow.position.y = -.16;
    arm.add(elbow);
    elbows.push(elbow);
    loft(elbow, shirt, [{ y: .043, x: .074, z: .074 }, { y: -.012, x: .078, z: .077 }, { y: -.054, x: .066, z: .068 }]);
    if (profile.uniform)
      loft(elbow, shirt, [{ y: -.018, x: .078, z: .081 }, { y: -.043, x: .081, z: .083 }, { y: -.058, x: .072, z: .075 }]);
    loft(elbow, skin, [
      { y: -.237, x: .007, z: .004, cz: .020 }, { y: -.212, x: .055, z: .039, cz: .024 },
      { y: -.161, x: .068, z: .058, cz: .014 }, { y: -.092, x: .056, z: .054 }, { y: -.038, x: .065, z: .063 },
    ]);
    ball(elbow, skin, -.046 * side, -.158, .045, .029, .041, .026).rotation.z = side * .35;
    // Curled fingers read as a small hand when it closes around a strap or prop.
    for (let finger = 0; finger < 3; finger++) {
      const x = (finger - 1) * .025;
      ball(elbow, skin, x, -.198, .039, .017, .026, .025);
    }
  }
  if (kind === 'minh') loft(rightArm, gold, [
    { y: -.07, x: .093, z: .092 }, { y: -.126, x: .087, z: .087 },
  ]);

  const head = new THREE.Group();
  head.position.set(0, CHARACTER_HEAD_HEIGHT, .012);
  head.scale.setScalar(CHARACTER_HEAD_SCALE);
  body.add(head);
  const cheek = (profile.broad ? .416 : profile.hair === 'bob' ? .378 : .369) * (profile.faceWidth ?? 1);
  const headSegments = 36, headSteps = 36, stride = headSegments + 1;
  const face = loft(head, skin, [
    { y: -.365, x: .009, z: .006, cz: .055 }, { y: -.343, x: .133, z: .127, cz: .053 },
    { y: -.293, x: .238, z: .206, cz: .038 }, { y: -.205, x: cheek - .025, z: .283, cz: .014 },
    { y: -.082, x: cheek, z: .319, cz: .014 }, { y: .077, x: cheek - .007, z: .326, cz: -.014 },
    { y: .227, x: .334, z: .291, cz: -.036 }, { y: .342, x: .231, z: .201, cz: -.058 },
    { y: .403, x: .009, z: .009, cz: -.06 },
  ], headSegments, headSteps);
  const vertices = face.geometry.attributes.position;
  const rings = Array.from({ length: headSteps + 1 }, (_, row) => {
    const front = row * stride, back = front + headSegments / 2;
    const z = (vertices.getZ(front) + vertices.getZ(back)) / 2;
    return { y: vertices.getY(front), z, depth: vertices.getZ(front) - z, width: vertices.getX(front + headSegments / 4) };
  });
  const bell = (x: number, y: number, spreadX: number, spreadY: number) => Math.exp(-x * x / spreadX - y * y / spreadY);
  function faceRelief(x: number, y: number, z: number) {
    const front = THREE.MathUtils.smoothstep(z, .11, .275);
    return front * (
      .025 * bell(x, y + .105, .002, .0022) + .006 * bell(x, y + .017, .0012, .008)
      + .015 * bell(Math.abs(x) - .218, y + .158, .014, .006)
      - .003 * bell(Math.abs(x) - .146, y + .026, .006, .003)
      + .009 * bell(x, y + .224, .008, .006)
    );
  }
  function faceDepth(x: number, y: number) {
    const i = Math.max(1, rings.findIndex(ring => ring.y >= y));
    const a = rings[i - 1], b = rings[i];
    const t = THREE.MathUtils.clamp((y - a.y) / Math.max(.0001, b.y - a.y), 0, 1);
    const width = THREE.MathUtils.lerp(a.width, b.width, t);
    const z = THREE.MathUtils.lerp(a.z, b.z, t) + THREE.MathUtils.lerp(a.depth, b.depth, t)
      * Math.sqrt(Math.max(0, 1 - (x / width) ** 2));
    return z + faceRelief(x, y, z);
  }
  const base = new THREE.Color(skin), warm = new THREE.Color(blush), tint = new THREE.Color();
  const paint = new Float32Array(vertices.count * 3);
  for (let i = 0; i < vertices.count; i++) {
    const x = vertices.getX(i), y = vertices.getY(i), z = vertices.getZ(i);
    vertices.setZ(i, z + faceRelief(x, y, z));
    const redness = .61 * THREE.MathUtils.smoothstep(z, .12, .26) * bell(Math.abs(x) - .228, y + .16, .017, .0045);
    tint.copy(base).lerp(warm, redness).toArray(paint, i * 3);
  }
  face.geometry.setAttribute('paintedTint', new THREE.BufferAttribute(paint, 3));
  face.geometry.computeVertexNormals();
  const normals = face.geometry.attributes.normal, seam = new THREE.Vector3();
  for (let row = 0; row <= headSteps; row++) {
    const first = row * stride, last = first + headSegments;
    seam.set(normals.getX(first) + normals.getX(last), normals.getY(first) + normals.getY(last), normals.getZ(first) + normals.getZ(last)).normalize();
    normals.setXYZ(first, seam.x, seam.y, seam.z);
    normals.setXYZ(last, seam.x, seam.y, seam.z);
  }

  function feature(parent: THREE.Object3D, color: number, path: THREE.Shape, zOffset: number, x = 0, y = 0, height = 1) {
    // Subdivide before projection: large flat triangles cut through the curved
    // cheeks, producing floating pupils and irregular eye rims at oblique angles.
    const shape = new THREE.ShapeGeometry(path, 12);
    shape.computeBoundingBox();
    const bounds = shape.boundingBox!;
    const span = Math.max(bounds.max.x - bounds.min.x, bounds.max.y - bounds.min.y);
    const subdivisions = span > .17 ? 2 : span > .07 ? 1 : 0;
    let flat = shape.toNonIndexed();
    shape.dispose();
    for (let level = 0; level < subdivisions; level++) {
      const input = flat.attributes.position, output: number[] = [];
      for (let i = 0; i < input.count; i += 3) {
        const a = new THREE.Vector3().fromBufferAttribute(input, i);
        const b = new THREE.Vector3().fromBufferAttribute(input, i + 1);
        const c = new THREE.Vector3().fromBufferAttribute(input, i + 2);
        const ab = a.clone().lerp(b, .5), bc = b.clone().lerp(c, .5), ca = c.clone().lerp(a, .5);
        for (const v of [a, ab, ca, ab, b, bc, ca, bc, c, ab, bc, ca]) output.push(v.x, v.y, v.z);
      }
      flat.dispose();
      flat = new THREE.BufferGeometry();
      flat.setAttribute('position', new THREE.Float32BufferAttribute(output, 3));
    }
    const geometry = flat;
    // Match attributes of the sculpted meshes for pivot-level batching.
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(geometry.attributes.position.count * 2), 2));
    const p = geometry.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const px = p.getX(i) + x, py = p.getY(i) * height + y;
      p.setXYZ(i, px, py, faceDepth(px, py) + zOffset);
    }
    geometry.computeVertexNormals();
    const normals = geometry.attributes.normal;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), e = .001;
      const normal = new THREE.Vector3(
        -(faceDepth(x+e,y)-faceDepth(x-e,y))/(2*e),
        -(faceDepth(x,y+e)-faceDepth(x,y-e))/(2*e), 1).normalize();
      normals.setXYZ(i, normal.x, normal.y, normal.z);
    }
    return mesh(geometry, color, parent);
  }
  function ellipse(x: number, y: number, width: number, height: number) {
    const path = new THREE.Shape();
    path.absellipse(x, y, width, height, 0, Math.PI * 2, false);
    return path;
  }
  function paintedLine(parent: THREE.Object3D, color: number, radius: number, points: [number, number][]) {
    return stroke(parent, color, radius, points.map(([x, y]) => [x, y, faceDepth(x, y) + .004]));
  }

  const part = profile.hair === 'pony' || profile.hair === 'bun' || profile.hair === 'bob';
  const spiky = profile.hair === 'spikes', crop = profile.hair === 'crop';
  const capped = profile.hat === 'cadet' || profile.hat === 'sun' || profile.hat === 'cook';
  const hairline = (angle: number) => {
    const front = Math.max(0, Math.cos(angle));
    const back = Math.max(0, -Math.cos(angle));
    return 1.88 - .78 * front + back * (part ? .69 : .54) + .15 * front * Math.sin(angle * 4 + .6);
  };
  mesh(sculptChibiHair(hairline, 16, 32), hair, head);
  function lock(color: number, width: number, depth: number, points: Vec[]) {
    const geometry = sculptChibiLock(points.map(p => new THREE.Vector3(...p)), width, depth);
    const position = geometry.attributes.position, uv = geometry.attributes.uv;
    const colors = new Float32Array(position.count * 3), strand = new THREE.Color(color), tone = new THREE.Color();
    for (let i = 0; i < position.count; i++) {
      const x = position.getX(i), y = position.getY(i), z = position.getZ(i);
      if (capped && z > 0) {
        const weight = THREE.MathUtils.smoothstep(y, .22, .305);
        const ceiling = .208 * Math.sqrt(Math.max(0, 1 - (x / .46) ** 2));
        position.setZ(i, Math.min(z, THREE.MathUtils.lerp(z, ceiling, weight)));
      }
      const crest = Math.max(0, Math.sin(uv.getX(i) * Math.PI * 2));
      const highlight = .45 * crest ** 2 * Math.sin(Math.PI * uv.getY(i)) ** .6;
      tone.copy(strand).multiplyScalar(1 + highlight).toArray(colors, i * 3);
    }
    geometry.computeVertexNormals();
    geometry.setAttribute('paintedTint', new THREE.BufferAttribute(colors, 3));
    return mesh(geometry, color, head);
  }
  if (part) {
    lock(hairLight, .114, .055, [[.08,.365,.204],[-.105,.329,.307],[-.251,.198,.256],[-.351,.062,.154]]);
    lock(hair, .103, .05, [[.164,.335,.197],[.256,.255,.251],[.316,.127,.213],[.354,-.101,.12]]);
    lock(profile.hairColor ?? 0x252b2d, .074, .052, [[.047,.371,.217],[-.107,.279,.322],[-.216,.158,.288],[-.289,.116,.237]]);
    if (profile.hair === 'bob') {
      for (const side of [-1, 1])
        lock(hair, .114, .087, [[side*.259,.235,-.114],[side*.367,.035,-.145],[side*.361,-.223,-.129],[side*.337,-.314,-.066]]);
    } else if (profile.hair === 'bun') {
      ball(head, hair, -.244, -.166, -.294, .177, .147, .151);
      lock(hairLight, .089, .048, [[-.316,-.076,-.29],[-.398,-.165,-.311],[-.354,-.263,-.303],[-.258,-.287,-.292]]);
    } else {
      ball(head, 0xbe744a, .244, -.119, -.294, .065, .039, .067);
      lock(hair, .124, .111, [[.247,-.118,-.30],[.36,-.22,-.345],[.379,-.346,-.322],[.28,-.438,-.23]]);
      lock(hairLight, .075, .050, [[.279,-.141,-.35],[.395,-.228,-.395],[.424,-.329,-.344],[.373,-.397,-.235]]);
    }
  } else if (crop) {
    for (let i = -3; i <= 3; i++) {
      const x = i * .085;
      lock(hair, .048, .026, [[x,.295,.22],[x,.245,.294],[x+.012,.205,.301],[x+.025,.184,.292]]);
    }
  } else {
    const lift = spiky ? .042 : crop ? -.06 : 0;
    lock(hair, .093, .045, [[-.095,.375+lift,.199],[-.245,.291+lift,.282],[-.342,.151,.235],[-.348,-.014,.127]]);
    lock(profile.hairColor ?? 0x242a2c, .096, .046, [[.132,.382+lift,.185],[.032,.302+lift,.317],[-.126,.194,.322],[-.292,.164,.235]]);
    lock(hairLight, .069, .041, [[.225,.355+lift,.167],[.191,.263,.304],[.112,.158,.331],[.009,.115,.324]]);
    lock(hair, .074, .039, [[.285,.303+lift,.124],[.318,.215,.231],[.339,.096,.212],[.359,.011,.116]]);
    if (spiky) {
      lock(hair, .141, .105, [[-.263,.276,-.085],[-.1,.404,.039],[.111,.451,.005],[.23,.539,-.098]]);
      lock(hairLight, .10, .094, [[-.248,.266,.092],[-.107,.404,.162],[.035,.466,.086],[.087,.53,-.036]]);
      lock(0x242b2e, .095, .088, [[.09,.324,.131],[.277,.384,.164],[.344,.424,.053],[.388,.49,-.077]]);
    }
  }
  for (const side of [-1, 1]) {
    const ear = ball(head, skin, side * (cheek - .005), -.14, -.002, .072, .087, .064);
    ear.rotation.z = side * -.24;
    ball(head, 0xce876b, side * (cheek + .013), -.144, .047, .035, .045, .016).rotation.z = side * -.24;
    if (!capped || !part) lock(hair, .049, .05, [[side*.328,.211,-.069],[side*.38,.097,-.031],[side*.374,-.045,.01],[side*.35,-.107,.049]]);
  }

  const eyes: THREE.Group[] = [], lids: THREE.Group[] = [];
  const smilingEyes = kind === 'phuc';
  const girlish = part && !profile.broad;
  const eyeHeight = profile.mature ? .88 : 1;
  for (const side of [-1, 1]) {
    const eye = new THREE.Group(), lid = new THREE.Group();
    head.add(eye, lid);
    eyes.push(eye);
    lids.push(lid);
    const x = side * (profile.broad ? .158 : .143), y = -.026;
    // Tall, dark pupils with a restrained crescent of white, like the approved
    // drawing. Mirrored upper lashes avoid the old wide-eyed, startled look.
    const sclera = new THREE.Shape();
    sclera.moveTo(-.072, -.008);
    sclera.bezierCurveTo(-.078, .074, -.032, .095, .019, .084);
    sclera.bezierCurveTo(.082, .074, .084, -.008, .049, -.058);
    sclera.bezierCurveTo(.017, -.087, -.068, -.074, -.072, -.008);
    feature(eye, 0xfff2db, sclera, .006, x, y, eyeHeight);
    const gaze = x + .006;
    feature(eye, 0x34271f, ellipse(gaze, y + .001, .044, .067 * eyeHeight), .010);
    feature(eye, 0x775035, ellipse(gaze + .003, y - .038 * eyeHeight, .026, .023 * eyeHeight), .013);
    feature(eye, 0x251f1b, ellipse(gaze, y + .014, .036, .050 * eyeHeight), .016);
    feature(eye, 0xfffbeb, ellipse(gaze - .012, y + .038 * eyeHeight, .012, .016 * eyeHeight), .020);
    feature(eye, 0xffe7bd, ellipse(gaze + .013, y - .034 * eyeHeight, .005, .006), .020);
    paintedLine(eye, hair, .008, [[x-.073,y+.036*eyeHeight],[x-.052,y+.077*eyeHeight],[x-.005,y+.092*eyeHeight],[x+.047,y+.073*eyeHeight]]);
    if (girlish) for (let lash = 0; lash < 2; lash++) {
      paintedLine(eye, hair, .005, [[x+side*(.043+lash*.009),y+.055-lash*.015],[x+side*(.068+lash*.01),y+.067-lash*.012]]);
    }

    const curve = smilingEyes ? .069 : -.011;
    const closed = new THREE.Shape();
    closed.moveTo(-.065,-.029);
    closed.bezierCurveTo(-.033,curve,.028,curve,.065,-.026);
    closed.bezierCurveTo(.028,curve-.023,-.025,curve-.023,-.065,-.037);
    feature(lid, dark, closed, .011, x, y);
    lid.visible = smilingEyes;
    eye.visible = !smilingEyes;

    const brow = new THREE.Shape();
    brow.moveTo(side*.071,.116);
    brow.bezierCurveTo(side*.087,.173,side*.164,.184,side*.218,.129);
    brow.lineTo(side*.221,.11);
    brow.bezierCurveTo(side*.162,.147,side*.118,.143,side*.071,.116);
    brow.closePath();
    feature(head, hair, brow, .006);

  }

  const smile = new THREE.Group(), talkingMouth = new THREE.Group();
  head.add(smile, talkingMouth);
  ball(head, skin, 0, -.105, faceDepth(0,-.105)-.004, .047, .033, .037);
  if (profile.brightSmile !== false) {
    const open = new THREE.Shape();
    open.moveTo(-.103,-.204);
    open.bezierCurveTo(-.052,-.226,.052,-.226,.103,-.204);
    open.bezierCurveTo(.083,-.327,-.069,-.327,-.103,-.204);
    open.closePath();
    feature(smile, 0x5b322b, open, .011);
    const teeth = new THREE.Shape();
    teeth.moveTo(-.092,-.211);
    teeth.quadraticCurveTo(.002,-.235,.092,-.211);
    teeth.quadraticCurveTo(.063,-.253,-.078,-.237);
    teeth.closePath();
    feature(smile, 0xffeddb, teeth, .015);
    feature(smile, 0xe28573, ellipse(.002,-.285,.031,.014), .015);
  } else {
    const closed = new THREE.Shape();
    closed.moveTo(-.077,-.23);
    closed.bezierCurveTo(-.042,-.262,.043,-.264,.078,-.225);
    closed.bezierCurveTo(.051,-.278,-.043,-.277,-.077,-.236);
    closed.closePath();
    feature(smile, 0x693d32, closed, .011);
  }
  feature(talkingMouth, 0x57332c, ellipse(0,-.244,.047,.039), .014);
  feature(talkingMouth, 0xe18875, ellipse(0,-.263,.028,.014), .017);
  talkingMouth.visible = false;
  for (const mouth of [smile, talkingMouth]) {
    for (const child of mouth.children) {
      if (!(child instanceof THREE.Mesh)) continue;
      const p = child.geometry.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i), oldY = p.getY(i), y = oldY + .026;
        const offset = p.getZ(i) - faceDepth(x, oldY);
        p.setXYZ(i, x, y, faceDepth(x, y) + offset);
      }
      child.geometry.computeVertexNormals();
    }
  }
  if (profile.moustache) for (const side of [-1, 1]) {
    lock(hair, .027, .021, [[side*.009,-.178,.328],[side*.046,-.177,.328],[side*.085,-.199,.321],[side*.115,-.188,.3]]);
  }
  if (profile.glasses) {
    for (const side of [-1, 1]) {
      const frame = mesh(new THREE.TorusGeometry(.111, .0083, 6, 28), 0x493a31, head, side * .145, -.021, .354);
      frame.rotation.y = side * .24;
      stroke(head, 0x554039, .007, [[side*.248,-.005,.328],[side*.308,.018,.266],[side*.391,.035,.113]]);
    }
    stroke(head, 0x574033, .008, [[-.048,-.016,.363],[0,.007,.375],[.048,-.016,.363]]);
  }

  if (profile.hat === 'cadet') {
    const cap = new THREE.Group();
    head.add(cap);
    cap.rotation.z = kind === 'linh' ? -.078 : .067;
    const crown = loft(cap, shirt, [
      { y: .258, x: .39, z: .304, cz: -.034 }, { y: .295, x: .433, z: .332, cz: -.032 },
      { y: .382, x: .418, z: .332, cz: -.044 }, { y: .478, x: .327, z: .252, cz: -.068 },
      { y: .518, x: .193, z: .144, cz: -.067 }, { y: .538, x: .002, z: .002, cz: -.068 },
    ], 32, 20);
    ball(cap, 0x455033, 0, .253, .236, .387, .036, .215).rotation.x = -.092;
    const crownVertices = crown.geometry.attributes.position;
    const capRings = Array.from({ length: 21 }, (_, i) => ({
      y: crownVertices.getY(i*33),
      width: crownVertices.getX(i*33+8),
      center: (crownVertices.getZ(i*33)+crownVertices.getZ(i*33+16))/2,
      depth: (crownVertices.getZ(i*33)-crownVertices.getZ(i*33+16))/2,
    }));
    const capDepth = (x: number, y: number) => {
      const i = Math.max(1, capRings.findIndex(r => r.y >= y));
      const a = capRings[i-1], b = capRings[i], t = THREE.MathUtils.clamp((y-a.y)/(b.y-a.y),0,1);
      const w = THREE.MathUtils.lerp(a.width,b.width,t);
      return THREE.MathUtils.lerp(a.center,b.center,t) + THREE.MathUtils.lerp(a.depth,b.depth,t)*Math.sqrt(Math.max(0,1-(x/w)**2));
    };
    const capSeam = (points: [number, number][], color: number, r: number) =>
      stroke(cap, color, r, points.map(([x,y])=>[x,y,capDepth(x,y)+.002]));
    capSeam([[-.35,.316],[-.247,.294],[0,.28],[.247,.294],[.35,.316]],0x8b9359,.007);
    capSeam([[-.31,.314],[-.285,.389],[-.22,.459],[-.119,.498]],0x53613b,.005);
    framedStar(cap, capDepth);
  } else if (profile.hat === 'cook') {
    ball(head, 0xd9c49f, 0, .29, -.03, .394, .12, .303);
    for (const [x, y, z, r] of [[-.22,.418,.013,.2],[.015,.457,-.05,.221],[.222,.41,-.08,.181]]) {
      ball(head, cream, x, y+.035, z, r, .20, .197);
    }
    ball(head, 0xe9d7b6, 0, .278, .21, .38, .052, .19);
  } else if (profile.hat === 'sun') {
    ball(head, 0xd5b677, 0, .344, -.035, .447, .228, .383);
    ball(head, 0xbda062, 0, .263, .024, .553, .04, .427);
  } else if (profile.hat === 'visor') {
    ball(head, 0x406862, 0, .246, .243, .373, .043, .214);
    stroke(head, 0x77a49a, .027, [[-.361,.208,.065],[-.228,.254,.24],[0,.264,.298],[.228,.254,.24],[.361,.208,.065]]);
  }

  if (profile.prop === 'tray') {
    patch(body, kind === 'thao' ? 0xe5cda1 : 0xa96334, 0, .594, .178, .343, kind === 'thao' ? .60 : .412, .04);
    patch(body, 0x55704a, 0, .53, .202, .178, .109, .035);
    for (const side of [-1,1]) patch(body, 0xa56c40, .115 * side, .82, .142, .04, .221, .029).rotation.z = side * .13;
    const tray = new THREE.Group();
    tray.position.set(-.015, -.177, .071);
    tray.rotation.x = 1.17;
    elbows[1].add(tray);
    tray.scale.setScalar(1.45);tray.position.x=-.08;
    patch(tray, 0x9aa8a0, 0, 0, 0, .32, .03, .233);
    ball(tray, kind === 'thao' ? 0xf0dfbd : 0xd29a53, .042, .048, 0, .086, .036, .064);
    if (kind === 'thao') for (let i=0;i<3;i++) ball(tray, [0xe4a148,0x628440,0xa4613d][i], -.085, .034, (i-1)*.063, .041, .022, .029);
    ball(tray, 0x719348, .042, .038, 0, .086, .016, .066);
  }
  if (profile.prop === 'books' || profile.prop === 'map' || profile.prop === 'board') {
    const bundle = new THREE.Group();
    bundle.position.set(.018, -.146, .066);
    bundle.rotation.x = .43;
    elbows[0].add(bundle);
    bundle.scale.setScalar(profile.prop === 'map' ? 1.55 : 1.3);
    if (profile.prop === 'books') {
      patch(bundle, 0x3e6853, -.027, .04, 0, .205, .268, .044);
      patch(bundle, 0xba593c, .02, .017, .044, .175, .225, .043);
      patch(bundle, cream, .057, .009, .07, .089, .024, .007);
    } else if (profile.prop === 'map') {
      for (const [i, color] of [0xece0b3, 0xdacb9d, 0xece0b3].entries()) {
        const page = patch(bundle, color, (i-1)*.075, .014, 0, .081, .188, .018);
        page.rotation.y = i % 2 ? .18 : -.18;
        patch(bundle, 0x75945f, (i-1)*.075, .016 + .018*i, .012, .043, .062, .008);
      }
    } else {
      patch(bundle, 0x7e5736, 0, .01, 0, .181, .25, .03);
      patch(bundle, cream, 0, .013, .02, .149, .209, .012);
      patch(bundle, gold, 0, .116, .025, .068, .027, .018);
      for (let i = 0; i < 3; i++) {
        patch(bundle, 0x8b997b, .019, .061-i*.046, .028, .074, .006, .004);
        stroke(bundle, 0x507345, .004, [[-.055,.064-i*.046,.029],[-.047,.056-i*.046,.029],[-.034,.074-i*.046,.029]]);
      }
    }
  }
  if (profile.prop === 'bucket' || profile.prop === 'can' || profile.prop === 'bag') {
    const prop = new THREE.Group();
    elbows[0].add(prop);
    prop.position.set(-.003, -.23, .028);
    prop.scale.setScalar(1.35);
    const color = profile.prop === 'can' ? 0x607d65 : profile.prop === 'bucket' ? 0x879da3 : 0x9c7950;
    loft(prop, color, [{ y: -.17, x: .086, z: .076 }, { y: -.153, x: .091, z: .08 },
      { y: -.047, x: .105, z: .087 }, { y: -.036, x: .105, z: .087 }]);
    stroke(prop, dark, .01, [[-.084,-.044,0],[-.06,.032,0],[.066,.032,0],[.09,-.044,0]]);
    if (profile.prop === 'can') {
      stroke(prop, color, .021, [[.082,-.13,0],[.175,-.107,0],[.21,-.045,0]]);
      ball(prop, 0xabc49a, .214, -.036, 0, .043, .025, .043).rotation.z = -.65;
      for (const x of [-.018,0,.018]) ball(prop, 0x48624a,.219+x,-.014,.018,.004,.004,.003);
    } else {
      ball(prop, 0xcda65b, 0, -.037,0,.091,.012,.076);
      for (let i=0;i<8;i++) ball(prop, 0xe1bd70, Math.sin(i*2.4)*.06,-.024,Math.cos(i*2.4)*.05,.011,.008,.008);
    }
  }
  if (profile.prop === 'whistle') {
    stroke(body, dark, .01, [[-.077,.951,.155],[0,.716,.192],[.075,.951,.157]]);
    patch(body, gold, 0, .69, .195, .049, .068, .032);
  }
  if (profile.prop === 'headphones') {
    stroke(body, 0x45484a, .024, [[-.14,.94,.116],[-.164,.833,.176],[0,.788,.221],[.164,.833,.176],[.14,.94,.116]]);
    for (const side of [-1,1]) {
      ball(body, 0xb9b8b1, side*.133, .852, .183, .053, .079, .042);
      ball(body, 0x494a47, side*.133, .852, .214, .039, .061, .018);
    }
  }
  if (profile.carry === 'satchel') {
    stroke(body, backpackColor, .029, [[.132,.960,.133],[.063,.801,.187],[-.05,.649,.196],[-.194,.526,.163]]);
    patch(body, backpackColor, -.212, .48, .126, .229, .18, .105).rotation.z = -.11;
    patch(body, 0x967744, -.211, .509, .188, .207, .092, .02);
    ball(body, gold, -.202, .477, .205, .013, .014, .007);
  } else if (backpack || profile.carry === 'backpack') {
    patch(body, backpackColor, 0, .701, -.194, .37, .417, .208);
    patch(body, 0x967543, 0, .624, -.3, .322, .195, .073);
    for (const side of [-1,1]) {
      stroke(body, backpackColor, .027, [[side*.163,.905,-.17],[side*.164,.957,.082],[side*.166,.79,.171],[side*.176,.52,.112]]);
      patch(body, gold, side*.16, .674, .188, .052, .05, .019);
    }
  }

  // A shorter jacket and longer, softly splayed trousers match the concept's
  // silhouette without changing total height, gameplay reach or head anchors.
  for (const child of body.children) {
    if (child instanceof THREE.Mesh) {
      child.updateMatrix();
      child.geometry.applyMatrix4(child.matrix);
      child.position.set(0, 0, 0);
      child.rotation.set(0, 0, 0);
      child.scale.set(1, 1, 1);
      const p = child.geometry.attributes.position;
      for (let i = 0; i < p.count; i++) p.setY(i, .57 + (p.getY(i) - .47) * .84);
      child.geometry.computeVertexNormals();
    }
  }
  for (const [index, leg] of [leftLeg, rightLeg].entries()) {
    leg.position.y = .47 * 1.22;
    leg.position.x = index ? .124 : -.124;
    leg.scale.y = 1.22;
    leg.rotation.y = index ? .09 : -.09;
  }
  for (const arm of [leftArm, rightArm]) {
    arm.position.y = .57 + (arm.position.y - .47) * .84;
    arm.scale.set(.95, .9, .95);
  }

  // Batch by articulated pivot to keep facial details and accessories off the draw-call budget.
  group.traverse(parent => {
    if (!(parent instanceof THREE.Group)) return;
    const parts = parent.children.filter((child): child is THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial> => child instanceof THREE.Mesh);
    if (!parts.length) return;
    const geometries = parts.map(part => {
      part.updateMatrix();
      const geometry = part.geometry.clone().applyMatrix4(part.matrix);
      const painted = geometry.attributes.paintedTint;
      if (painted) {
        geometry.deleteAttribute('paintedTint');
        geometry.setAttribute('color', painted);
      } else {
        const colors = new Float32Array(geometry.attributes.position.count * 3);
        for (let i = 0; i < colors.length; i += 3) part.material.color.toArray(colors, i);
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      }
      if (!geometry.index) geometry.setIndex(Array.from({ length: geometry.attributes.position.count }, (_, i) => i));
      return geometry;
    });
    const geometry = mergeGeometries(geometries);
    geometries.forEach(part => part.dispose());
    if (!geometry) return;
    const baked = new THREE.Mesh(geometry, surface);
    baked.castShadow = true;
    // Keep tiny lashes, glasses and facial ink from producing stippled
    // self-shadows across the illustrated face under the campus sun.
    baked.receiveShadow = parent !== head && ![...eyes, ...lids, smile, talkingMouth].includes(parent as THREE.Group);
    parts.forEach(part => { part.removeFromParent(); part.geometry.dispose(); });
    parent.add(baked);
  });
  palette.forEach(material => material.dispose());
  const rig = { group, body, head, leftLeg, rightLeg, leftArm, rightArm, knees, elbows, eyes, lids, smilingEyes, smile, talkingMouth, kind, backpack: backpack || profile.carry === 'backpack' };
  nameCharacterRig(rig);
  return rig;
}

export type CampusCharacter = ReturnType<typeof buildCampusCharacter>;

type HandGrip = { amount: number; fingers: { bone: THREE.Bone; grip: THREE.Quaternion }[] };
const fingerGrips = new WeakMap<CampusCharacter, [HandGrip, HandGrip]>();

/** Amounts are relative to the relaxed gameplay hands, in rig.elbows order. */
export function setHandGrips(rig: CampusCharacter, first: number, second: number, dt?: number) {
  const hands = fingerGrips.get(rig);
  if (!hands) return;
  for (let i = 0; i < hands.length; i++) {
    const hand = hands[i], target = i === 0 ? first : second;
    if (hand.amount === target) continue;
    const blend = dt === undefined ? target : THREE.MathUtils.damp(hand.amount, target, 12, dt);
    hand.amount = Math.abs(blend - target) < .001 ? target : blend;
    for (const { bone, grip } of hand.fingers) bone.quaternion.identity().slerp(grip, hand.amount);
  }
}

export function setRunningGrip(rig: CampusCharacter, amount: number, dt?: number) {
  setHandGrips(rig, amount, amount, dt);
}

const walkClips = new Map<CharacterKind, THREE.AnimationClip>();
const walkActions = new WeakMap<CampusCharacter, { mixer: THREE.AnimationMixer; action: THREE.AnimationAction }>();

/** Layer the same fitted gait shown in the motion preview over the current pose. */
export function sampleCampusWalk(rig: CampusCharacter, elapsed: number, weight: number) {
  const walk = walkActions.get(rig);
  if (!walk || weight < .001) return;
  walk.action.play().setEffectiveWeight(weight);
  walk.action.time = elapsed % walk.action.getClip().duration;
  walk.mixer.update(0);
  rig.body.position.y *= 1 - weight;
  rig.body.rotation.x *= 1 - weight;
  rig.body.rotation.z *= 1 - weight;
}

const templates = new Map<CharacterKind, THREE.Group>();
const pivotNames = ['body', 'head', 'leftLeg', 'rightLeg', 'leftArm', 'rightArm', 'smile', 'talkingMouth'] as const;
const pivotArrays = ['knees', 'elbows', 'eyes', 'lids'] as const;

/** Stable articulation names are also the portable GLB's animation contract. */
export function nameCharacterRig(rig: CampusCharacter) {
  for (const name of pivotNames) rig[name].name = name;
  for (const name of pivotArrays) rig[name].forEach((pivot, index) => { pivot.name = `${name}_${index}`; });
  rig.group.userData = { kind: rig.kind, smilingEyes: rig.smilingEyes, backpack: rig.backpack, version: 2 };
}

export function installCharacterAsset(kind: CharacterKind, source: THREE.Object3D, clips: THREE.AnimationClip[] = []) {
  const group = cloneSkeleton(source) as THREE.Group;
  if (group.userData.kind !== kind || group.userData.version !== 2) throw new Error(`Invalid character: ${kind}`);
  for (const name of [...pivotNames, ...pivotArrays.flatMap(name => [name + '_0', name + '_1'])]) {
    if (!group.getObjectByName(name)) throw new Error(`Missing character pivot: ${name}`);
  }
  const walk = clips.find(clip => clip.name === 'Mixamo_Standard_Walk');
  if (walk) walkClips.set(kind, walk);
  else walkClips.delete(kind);
  templates.set(kind, group);
}

export function createCampusCharacter(kind: CharacterKind, backpack = false): CampusCharacter {
  const template = templates.get(kind);
  if (!template) return buildCampusCharacter(kind, backpack);
  const group = cloneSkeleton(template) as THREE.Group;
  const materials = new Map<THREE.Material, THREE.Material>();
  // Each scene owns its GPU resources: closing the study cannot dispose the game.
  group.traverse(object => {
    if (!(object instanceof THREE.Mesh)) return;
    object.geometry = object.geometry.clone();
    const cloneMaterial = (material: THREE.Material) => {
      if (!materials.has(material)) materials.set(material, material.clone());
      return materials.get(material)!;
    };
    object.material = Array.isArray(object.material) ? object.material.map(cloneMaterial) : cloneMaterial(object.material);
    object.castShadow = true;
    object.receiveShadow = object.userData.receiveShadow === true;
    object.visible = object.userData.detail !== 'far';
  });
  const rig = { group, kind, backpack: group.userData.backpack === true, smilingEyes: group.userData.smilingEyes === true } as CampusCharacter;
  for (const name of pivotNames) rig[name] = group.getObjectByName(name) as THREE.Group;
  for (const name of pivotArrays) rig[name] = [0, 1].map(i => group.getObjectByName(`${name}_${i}`) as THREE.Group);
  if (kind === 'cadet') {
    const walk = walkClips.get(kind);
    if (walk) {
      const mixer = new THREE.AnimationMixer(group);
      registerAnMotion(rig,walk);
      walkActions.set(rig, { mixer, action: mixer.clipAction(walk) });
    }
    const hands: [HandGrip, HandGrip] = [{ amount: 0, fingers: [] }, { amount: 0, fingers: [] }];
    group.traverse(bone => {
      if (bone instanceof THREE.Bone && Array.isArray(bone.userData.runningGrip)) {
        hands[bone.name.endsWith('_r') ? 0 : 1].fingers.push({ bone, grip: new THREE.Quaternion().fromArray(bone.userData.runningGrip) });
      }
    });
    fingerGrips.set(rig, hands);
  }
  // Sample the final elbow rotation during matrix propagation, after scene
  // actions (walking, swimming, carrying) have written their own pose.
  for (const [index, side] of ['r', 'l'].entries()) {
    const hand = group.getObjectByName('hand_' + side);
    if (!hand) continue;
    const elbow = rig.elbows[index];
    for (let step = 1; step < elbowSegments; step++) {
      const guide = group.getObjectByName(elbowGuideName(step,side));
      if (!guide) continue;
      const bind = new THREE.Quaternion();
      const solve = elbowGuide(elbow.position, hand.position, bind, step / elbowSegments, kind === 'cadet' ? cadetElbowSpanRatio : undefined);
      const origin = new THREE.Vector3();
      solve(bind, origin, new THREE.Quaternion());
      const offset = guide.position.clone().sub(origin);
      const previous = new THREE.Quaternion(0, 0, 0, 0);
      guide.updateMatrix = function () {
        if (!previous.equals(elbow.quaternion)) {
          solve(elbow.quaternion, this.position, this.quaternion);
          this.position.add(offset);
          previous.copy(elbow.quaternion);
        }
        THREE.Object3D.prototype.updateMatrix.call(this);
      };
    }
  }
  animateCharacter(rig, 0, false, true);
  return rig;
}

/** Hysteresis avoids flickering when a camera/player crosses the LOD boundary. */
export function updateCharacterDetail(rig: CampusCharacter, distanceSquared: number, forceNear = false) {
  const previous = rig.group.userData.detail ?? 'near';
  const far = !forceNear && distanceSquared > (previous === 'far' ? 14 : 18) ** 2;
  const next = far ? 'far' : 'near';
  if (next === previous) return;
  rig.group.userData.detail = next;
  rig.group.traverse(object => {
    if (!(object instanceof THREE.Mesh) || !object.userData.detail) return;
    object.visible = object.userData.detail === next;
    object.castShadow = !far;
  });
}


export function animateCharacter(rig: CampusCharacter, time: number, speaking: boolean, reducedMotion: boolean) {
  // Restore the underlying pose before another activity writes its joints.
  beginAnFrame(rig);
  const walk = walkActions.get(rig);
  if (walk?.action.isScheduled()) walk.action.stop();
  const t = reducedMotion ? 0 : time;
  if (rig.group.userData.source === 'tripo-h31') {
    // The export already holds its props in a finished pose. Animate deltas from
    // that pose instead of applying the procedural rig's bent rest angles twice.
    rig.body.position.y = Math.sin(t * 1.65) * .006;
    rig.head.rotation.set(Math.sin(t * (speaking ? 2.1 : .9)) * (speaking ? .026 : .008), Math.sin(t * .72) * .018, Math.sin(t * .87) * .009);
    rig.leftArm.rotation.set(0, 0, Math.sin(t) * .009);
    rig.rightArm.rotation.set(speaking ? Math.sin(t * 2) * .035 : 0, 0, Math.sin(t + 1) * .009);
    rig.elbows.forEach(elbow => elbow.rotation.set(0, 0, 0));
    // Preserve Tripo's cheerful textured face; no replacement cartoon mouth.
    rig.smile.visible = true;
    rig.talkingMouth.visible = false;
    return;
  }
  const phase = t % 4.9;
  const blink = !reducedMotion && phase > .025 && phase < .13;
  const profile: CharacterProfile = CHARACTER_PROFILES[rig.kind];
  const holdingLeft = profile.prop && ['map', 'books', 'board'].includes(profile.prop);
  const carryingTool = profile.prop && ['bucket', 'can', 'bag'].includes(profile.prop);
  const shoulderBag = rig.kind === 'nam';
  for (let i = 0; i < rig.eyes.length; i++) {
    rig.eyes[i].visible = !rig.smilingEyes && !blink;
    rig.lids[i].visible = rig.smilingEyes || blink;
  }
  rig.body.position.y = Math.sin(t * 1.65) * .009;
  rig.head.rotation.set(Math.sin(t * (speaking ? 3 : .9)) * (speaking ? .047 : .014),
    Math.sin(t * .72) * .025, Math.sin(t * .87) * .018);
  rig.leftArm.rotation.z = -.13;
  rig.rightArm.rotation.z = .13 + (speaking && profile.prop !== 'tray' ? .12 + Math.sin(t * 2.2) * .073 : 0);
  rig.leftArm.rotation.x = holdingLeft ? -.47 : carryingTool ? -.18 : shoulderBag ? .04 : -.09 + Math.sin(t) * .025;
  rig.elbows[0].rotation.x = holdingLeft ? -.72 : carryingTool ? -.28 : shoulderBag ? -1.95 : -.23;
  rig.rightArm.rotation.x = profile.prop === 'tray' ? -.51 : speaking ? -.34 : shoulderBag ? .04 : -.09 + Math.sin(t) * .025;
  rig.elbows[1].rotation.x = profile.prop === 'tray' ? -.77 : speaking ? -.54 : shoulderBag ? -1.95 : -.23;
  const mouthOpen = speaking && !reducedMotion && Math.sin(t * 18) > -.28;
  rig.smile.visible = !mouthOpen;
  rig.talkingMouth.visible = mouthOpen;
}
