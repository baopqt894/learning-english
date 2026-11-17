import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { sculptLoft, type SculptRing } from './cadet-sculpt.ts';

type Hair = 'swept' | 'spikes' | 'pony' | 'bun' | 'crop' | 'bob';
type Hat = 'cadet' | 'cook' | 'sun' | 'visor';
type Prop = 'map' | 'books' | 'tray' | 'board' | 'can' | 'bag' | 'whistle' | 'headphones' | 'bucket';
type Profile = {
  name: string;
  cloth: number;
  pants: number;
  skin?: number;
  hair?: Hair;
  hat?: Hat;
  prop?: Prop;
  uniform?: boolean;
  carry?: 'satchel' | 'backpack';
  glasses?: boolean;
  moustache?: boolean;
  skirt?: boolean;
  broad?: boolean;
  brightSmile?: boolean;
};

export const CHARACTER_PROFILES = {
  cadet: { name: 'An', cloth: 0x687545, pants: 0x505d39, uniform: true, hat: 'cadet' },
  linh: { name: 'Linh', cloth: 0x69794a, pants: 0x4e5c37, uniform: true, hat: 'cadet', hair: 'pony', carry: 'satchel', brightSmile: true },
  minh: { name: 'Minh', cloth: 0x647341, pants: 0x4e5c36, uniform: true, hair: 'spikes', prop: 'map', brightSmile: true },
  library: { name: 'Cô Lan', cloth: 0xf0dfbc, pants: 0x345941, hair: 'bun', glasses: true, skirt: true, prop: 'books' },
  canteen: { name: 'Chú Hùng', cloth: 0xf2dfbe, pants: 0x625238, hat: 'cook', moustache: true, broad: true, prop: 'tray', brightSmile: true },
  mai: { name: 'Mai', cloth: 0x6c7b4e, pants: 0x535e3d, uniform: true, hair: 'bob', carry: 'satchel', prop: 'board' },
  nam: { name: 'Nam', cloth: 0x738456, pants: 0x515b3a, uniform: true, hair: 'crop', skin: 0xd99b72, carry: 'backpack' },
  thu: { name: 'Thu', cloth: 0xffe5bc, pants: 0x59513a, hair: 'bob', glasses: true, prop: 'books' },
  khoa: { name: 'Khoa', cloth: 0x617352, pants: 0x4b553b, uniform: true, hair: 'swept', prop: 'board' },
  phuc: { name: 'Phúc', cloth: 0x6d794e, pants: 0x514c33, skin: 0xb98262, hat: 'sun', prop: 'can' },
  yen: { name: 'Yến', cloth: 0xc2a873, pants: 0x53664a, hair: 'pony', prop: 'bucket' },
  hai: { name: 'Thầy Hải', cloth: 0x6e7752, pants: 0x444e32, skin: 0xdca379, hat: 'cadet', uniform: true, broad: true, prop: 'whistle' },
  vy: { name: 'Vy', cloth: 0x557e7a, pants: 0x394b45, hair: 'pony', hat: 'visor', prop: 'board' },
  bao: { name: 'Bảo', cloth: 0xa45840, pants: 0x4b5541, hair: 'spikes', prop: 'whistle' },
  tram: { name: 'Trâm', cloth: 0x906c81, pants: 0x4c4f42, hair: 'bob', glasses: true, prop: 'headphones' },
  thao: { name: 'Cô Thảo', cloth: 0xd5ae74, pants: 0x4c5d48, hair: 'bun', prop: 'tray' },
  quang: { name: 'Quang', cloth: 0x618267, pants: 0x4d5038, hair: 'crop', prop: 'bag', skin: 0xcf9568 },
} as const satisfies Record<string, Profile>;

export type CharacterKind = keyof typeof CHARACTER_PROFILES;
export const CHARACTER_HEAD_HEIGHT = 1.47;
type Vec = [number, number, number];

export function createCampusCharacter(kind: CharacterKind, backpack = false) {
  const profile: Profile = CHARACTER_PROFILES[kind];
  const group = new THREE.Group(), body = new THREE.Group();
  group.name = profile.name;
  group.add(body);
  const skin = profile.skin ?? 0xf3b487, blush = 0xe79a79;
  const shirt = profile.cloth, pants = profile.pants, hair = 0x252420, hairLight = 0x3a362e;
  const gold = 0xf2be4f, red = 0xbb4933, dark = 0x342e25, cream = 0xf6e7c8;
  const backpackColor = 0xb59559;
  const palette = new Map<number, THREE.MeshStandardMaterial>();
  const surface = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .86 });

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
    const piece = mesh(new THREE.SphereGeometry(1, 12, 8), color, parent, x, y, z);
    piece.scale.set(sx, sy, sz);
    return piece;
  };
  const patch = (parent: THREE.Object3D, color: number, x: number, y: number, z: number, w: number, h: number, d: number) =>
    mesh(new RoundedBoxGeometry(w, h, d, 1, Math.min(w, h, d) * .38), color, parent, x, y, z);
  const loft = (parent: THREE.Object3D, color: number, rings: SculptRing[], segments = 14, steps = 12) =>
    mesh(sculptLoft(rings, segments, steps), color, parent);
  const stroke = (parent: THREE.Object3D, color: number, radius: number, points: Vec[]) =>
    mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p))), 8, radius, 4, false), color, parent);
  function framedStar(parent: THREE.Group) {
    const star = new THREE.Shape();
    for (let i = 0; i < 10; i++) {
      const angle = Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? .026 : .056;
      const x = Math.cos(angle) * r, y = Math.sin(angle) * r;
      if (i) star.lineTo(x, y); else star.moveTo(x, y);
    }
    star.closePath();
    mesh(new THREE.ShapeGeometry(star), gold, parent, 0, .399, .349);
  }

  const width = profile.broad ? .265 : .229;
  loft(body, shirt, [
    { y: .39, x: .02, z: .025 }, { y: .43, x: width * .88, z: .146 },
    { y: .64, x: width, z: .177 }, { y: .88, x: width, z: .155 },
    { y: .98, x: width * .78, z: .135 }, { y: 1.03, x: .1, z: .09 }, { y: 1.04, x: .01, z: .01 },
  ]);
  ball(body, skin, 0, 1.035, .005, .112, .139, .106);
  const leftLeg = new THREE.Group(), rightLeg = new THREE.Group();
  leftLeg.position.set(-.115, .47, 0);
  rightLeg.position.set(.115, .47, 0);
  body.add(leftLeg, rightLeg);
  const knees: THREE.Group[] = [];
  for (const leg of [leftLeg, rightLeg]) {
    loft(leg, pants, [{ y: .055, x: .088, z: .091 }, { y: -.04, x: .108, z: .121 }, { y: -.18, x: .086, z: .094 }]);
    const knee = new THREE.Group();
    knee.position.y = -.16;
    leg.add(knee);
    knees.push(knee);
    loft(knee, profile.skirt ? skin : pants, [{ y: .04, x: .087, z: .092 }, { y: -.1, x: .09, z: .095 }, { y: -.212, x: .073, z: .079 }]);
    patch(knee, profile.uniform ? cream : 0x776144, 0, -.281, .056, .227, .052, .329);
    ball(knee, profile.uniform ? 0x424b32 : 0x635039, 0, -.221, .055, .113, .073, .16);
    ball(knee, profile.uniform ? cream : 0x8e7050, 0, -.221, .16, .104, .06, .067);
    if (profile.uniform) for (let i = 0; i < 2; i++) {
      stroke(knee, cream, .008, [[-.047, -.165 - i * .016, .063 + i * .035], [0, -.159 - i * .016, .075 + i * .035], [.047, -.165 - i * .016, .063 + i * .035]]);
    }
  }
  if (profile.skirt) {
    loft(body, pants, [{ y: .23, x: .283, z: .165 }, { y: .25, x: .285, z: .168 },
      { y: .48, x: .225, z: .146 }, { y: .64, x: .198, z: .144 }]);
    stroke(body, 0x294a36, .009, [[-.12, .62, .124], [-.15, .46, .128], [-.2, .25, .121]]);
    stroke(body, 0x567357, .008, [[.08, .62, .14], [.11, .47, .145], [.14, .25, .143]]);
  } else if (profile.uniform) {
    loft(body, 0x494132, [{ y: .451, x: width * .941, z: .154 }, { y: .462, x: width * .97, z: .174 },
      { y: .507, x: width * .97, z: .173 }, { y: .514, x: width * .94, z: .156 }]);
    patch(body, gold, 0, .485, .166, .079, .055, .023);
    patch(body, dark, 0, .485, .18, .055, .032, .01);
  }
  for (const side of [-1, 1]) {
    const label = patch(body, profile.uniform ? red : cream, .083 * side, .944, .134, .098, .085, .034);
    label.rotation.z = .43 * side;
    if (profile.uniform) {
      ball(body, gold, .086 * side, .939, .159, .015, .015, .005);
      patch(body, 0x546139, .113 * side, .745, .164, .134, .122, .028);
      patch(body, shirt, .113 * side, .781, .182, .139, .046, .019);
      ball(body, gold, .113 * side, .762, .198, .009, .009, .005);
    }
  }
  stroke(body, profile.uniform ? 0x475632 : 0xcab797, .008, [[0,.9,.163],[0,.71,.184],[0,.535,.161]]);
  for (const y of [.84, .665, .565]) ball(body, profile.uniform ? gold : 0xbba486, 0, y, .179, .011, .011, .006);

  const leftArm = new THREE.Group(), rightArm = new THREE.Group();
  leftArm.position.set(-width, .905, 0);
  rightArm.position.set(width, .905, 0);
  body.add(leftArm, rightArm);
  const elbows: THREE.Group[] = [];
  for (const [index, arm] of [leftArm, rightArm].entries()) {
    const side = index === 0 ? -1 : 1;
    arm.rotation.z = side * .13;
    loft(arm, shirt, [{ y: .077, x: .014, z: .033 }, { y: .036, x: .083, z: .085 },
      { y: -.085, x: .091, z: .089 }, { y: -.176, x: .073, z: .073 }]);
    const elbow = new THREE.Group();
    elbow.position.y = -.16;
    arm.add(elbow);
    elbows.push(elbow);
    loft(elbow, shirt, [{ y: .043, x: .074, z: .074 }, { y: -.012, x: .078, z: .077 }, { y: -.054, x: .066, z: .068 }]);
    ball(elbow, skin, 0, -.105, .003, .063, .095, .065);
    ball(elbow, skin, 0, -.174, .012, .07, .072, .055);
    ball(elbow, skin, -.049 * side, -.151, .041, .028, .047, .028);
  }
  if (kind === 'minh') loft(rightArm, gold, [
    { y: -.07, x: .093, z: .092 }, { y: -.126, x: .087, z: .087 },
  ]);

  const head = new THREE.Group();
  head.position.set(0, CHARACTER_HEAD_HEIGHT, .012);
  body.add(head);
  const cheek = profile.broad ? .425 : .393;
  const headSegments = 36, headSteps = 34;
  const face = loft(head, skin, [
    { y: -.403, x: .01, z: .01, cz: .046 }, { y: -.381, x: .181, z: .18, cz: .038 },
    { y: -.302, x: .3, z: .255, cz: .029 }, { y: -.181, x: cheek, z: .298, cz: .017 },
    { y: -.025, x: cheek + .014, z: .324 }, { y: .137, x: .371, z: .308, cz: -.018 },
    { y: .284, x: .297, z: .255, cz: -.052 }, { y: .372, x: .152, z: .137, cz: -.056 },
    { y: .396, x: .01, z: .01, cz: -.051 },
  ], headSegments, headSteps);
  const vertices = face.geometry.attributes.position;
  const vertexTints = new Float32Array(vertices.count * 3);
  const warmCheek = new THREE.Color(blush), baseSkin = new THREE.Color(skin);
  const tint = new THREE.Color();
  for (let i = 0; i < vertices.count; i++) {
    const x = vertices.getX(i), y = vertices.getY(i), z = vertices.getZ(i);
    const front = THREE.MathUtils.smoothstep(z, .16, .27);
    vertices.setZ(i, z + front * .046 * Math.exp(-(x * x) / .0042 - ((y + .14) ** 2) / .0034));
    const redness = .68 * front * Math.exp(-((Math.abs(x) - .239) ** 2) / .021 - ((y + .177) ** 2) / .0048);
    tint.copy(baseSkin).lerp(warmCheek, redness).toArray(vertexTints, i * 3);
  }
  face.geometry.setAttribute('paintedTint', new THREE.BufferAttribute(vertexTints, 3));
  face.geometry.computeVertexNormals();
  const normals = face.geometry.attributes.normal;
  const seam = new THREE.Vector3();
  for (let row = 0; row <= headSteps; row++) {
    const first = row * (headSegments + 1), last = first + headSegments;
    seam.set(normals.getX(first) + normals.getX(last),
      normals.getY(first) + normals.getY(last), normals.getZ(first) + normals.getZ(last)).normalize();
    normals.setXYZ(first, seam.x, seam.y, seam.z);
    normals.setXYZ(last, seam.x, seam.y, seam.z);
  }
  // The broad shapes render clearly when the camera pulls back.
  ball(head, hair, 0, .152, -.105, .415, .307, .326);
  for (const side of [-1, 1]) {
    ball(head, skin, side * (cheek + .012), -.117, -.014, .071, .112, .057);
    ball(head, blush, side * (cheek + .04), -.12, .025, .036, .059, .021);
    ball(head, hair, side * .325, .02, -.114, .09, .198, .13);
  }
  if (profile.hair === 'bun') {
    ball(head, hair, -.242, -.204, -.3, .173, .161, .126);
    ball(head, hairLight, -.291, -.165, -.32, .096, .084, .085);
  } else if (profile.hair === 'pony') {
    ball(head, hair, .302, -.152, -.25, .129, .18, .12).rotation.z = .33;
    ball(head, hairLight, .373, -.245, -.27, .101, .17, .102).rotation.z = .49;
    ball(head, 0xc3743c, .277, -.111, -.273, .077, .05, .073);
  } else if (profile.hair === 'bob') {
    for (const side of [-1, 1]) ball(head, hair, side * .343, -.101, -.167, .101, .224, .164);
  }
  const spikes = profile.hair === 'spikes';
  const brim = profile.hat === 'cadet' || profile.hat === 'sun' || profile.hat === 'cook';
  const sidePart = profile.hair === 'pony' || profile.hair === 'bun' || profile.hair === 'bob';
  const fringe = sidePart ? [[-.229,-.13,.158,.15],[-.131,-.01,.171,.142],[.053,.026,.151,.121],[.227,-.032,.116,.157]]
    : [[-.224,-.045,.132,.133],[-.079,0,.137,.156],[.074,.025,.122,.14],[.226,.017,.119,.13]];
  for (const [index, [x, offset, w, h]] of fringe.entries()) {
    const strand = ball(head, index === 1 ? hairLight : hair, x,
      brim ? .176 + offset * .39 : .263 + offset * .6,
      .163 + (index === 0 ? -.028 : .04),
      w, brim ? h * .57 : spikes ? h * 1.09 : profile.hair === 'crop' ? h * .72 : h, .097);
    strand.rotation.z = (spikes ? -.89 : sidePart ? -.64 : -.4) + index * .12;
    strand.rotation.y = x;
    if (spikes) {
      const tip = loft(head, index === 1 ? hairLight : hair, [
        { y: .252, x: .1, z: .093 }, { y: .399, x: .079, z: .071, cx: .043, cz: -.04 },
        { y: .543 - index * .024, x: .002, z: .002, cx: .13, cz: -.093 },
      ]);
      tip.position.set(x, 0, .052 - index * .015);
    }
  }

  const eyes: THREE.Group[] = [];
  for (const side of [-1, 1]) {
    const eye = new THREE.Group();
    eye.position.set(side * .151, -.05, .286);
    eye.rotation.y = side * .25;
    head.add(eye);
    eyes.push(eye);
    if (kind === 'library' || kind === 'canteen') {
      stroke(eye, dark, .018, [[-.064,-.02,.024],[-.032,.026,.036],[.004,.042,.041],[.036,.027,.037],[.064,-.016,.026]]);
    } else {
      const size = profile.hair === 'pony' || profile.hair === 'bob' ? 1.07 : 1;
      ball(eye, dark, 0, .006, .007, .085 * size, .101, .037);
      ball(eye, 0xfff4e1, 0, -.008, .025, .077 * size, .089, .036);
      ball(eye, 0x62402b, -side * .006, -.004, .054, .047, .073, .024);
      ball(eye, 0x2b231c, -side * .005, .001, .071, .034, .062, .011);
      ball(eye, 0xffffff, -.017, .029, .08, .017, .021, .007);
      ball(eye, 0xf3d5ad, .015, -.028, .08, .006, .007, .004);
    }
    stroke(head, hair, profile.broad ? .021 : sidePart ? .013 : .018, [
      [side * .077, .103, .317], [side * .151, .139 + (spikes ? .007 : 0), .313],
      [side * .222, .103, .276],
    ]);
  }
  const smile = new THREE.Group(), talkingMouth = new THREE.Group();
  head.add(smile, talkingMouth);
  if (profile.brightSmile) {
    ball(smile, 0x552f2a, 0, -.253, .302, .087, .055, .018);
    ball(smile, 0xf3e2ca, 0, -.232, .317, .062, .016, .007);
    ball(smile, 0xda886d, 0, -.276, .315, .044, .014, .009);
  } else {
    stroke(smile, 0x694436, .012, [[-.072,-.247,.285],[-.04,-.267,.293],[.018,-.271,.294],[.07,-.244,.281]]);
  }
  ball(talkingMouth, 0x57332c, 0, -.254, .312, .057, .057, .015);
  ball(talkingMouth, 0xe18875, 0, -.275, .327, .035, .016, .007);
  talkingMouth.visible = false;
  if (profile.moustache) for (const side of [-1, 1]) {
    ball(head, hair, side * .049, -.211, .325, .072, .025, .025).rotation.z = side * .22;
  }
  if (profile.glasses) {
    for (const side of [-1, 1]) mesh(new THREE.TorusGeometry(.111, .012, 5, 23), 0x45372a, head, side * .151, -.055, .362);
    stroke(head, 0x45372a, .012, [[-.051,-.04,.365],[0,-.012,.383],[.051,-.04,.365]]);
  }

  if (profile.hat === 'cadet') {
    loft(head, shirt, [
      { y: .271, x: .405, z: .305, cz: -.027 }, { y: .296, x: .437, z: .333, cz: -.025 },
      { y: .401, x: .41, z: .337, cz: -.043 }, { y: .507, x: .296, z: .241, cz: -.072 },
      { y: .55, x: .03, z: .037, cz: -.075 },
    ], 26, 18);
    ball(head, 0x414c31, 0, .255, .243, .404, .04, .225).rotation.x = -.06;
    stroke(head, 0x909858, .009, [[-.357,.337,.171],[-.24,.311,.263],[0,.3,.306],[.24,.311,.263],[.357,.337,.171]]);
    framedStar(head);
  } else if (profile.hat === 'cook') {
    ball(head, 0xd9c49f, 0, .29, -.03, .394, .12, .303);
    for (const [x, y, z, r] of [[-.22,.418,.013,.2],[.015,.457,-.05,.221],[.222,.41,-.08,.181]]) {
      ball(head, cream, x, y, z, r, .142, .197);
    }
    ball(head, 0xe9d7b6, 0, .278, .21, .38, .052, .19);
  } else if (profile.hat === 'sun') {
    ball(head, 0xd5b677, 0, .31, -.02, .393, .212, .322);
    ball(head, 0xbda062, 0, .246, .024, .527, .045, .399);
  } else if (profile.hat === 'visor') {
    ball(head, 0x406862, 0, .246, .243, .373, .043, .214);
    stroke(head, 0x77a49a, .027, [[-.361,.208,.065],[-.228,.254,.24],[0,.264,.298],[.228,.254,.24],[.361,.208,.065]]);
  }

  if (profile.prop === 'tray') {
    patch(body, 0xa96334, 0, .594, .178, .343, .412, .04);
    patch(body, 0x55704a, 0, .53, .202, .178, .109, .035);
    for (const side of [-1,1]) patch(body, 0xa56c40, .115 * side, .82, .142, .04, .221, .029).rotation.z = side * .13;
    const tray = new THREE.Group();
    tray.position.set(-.015, -.177, .071);
    tray.rotation.x = 1.17;
    elbows[1].add(tray);
    patch(tray, 0x784a2c, 0, 0, 0, .32, .03, .233);
    ball(tray, 0xd29a53, .042, .048, 0, .086, .036, .064);
    ball(tray, 0x719348, .042, .038, 0, .086, .016, .066);
  }
  if (profile.prop === 'books' || profile.prop === 'map' || profile.prop === 'board') {
    const bundle = new THREE.Group();
    bundle.position.set(.018, -.146, .066);
    bundle.rotation.x = .43;
    elbows[0].add(bundle);
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
    }
  }
  if (profile.prop === 'bucket' || profile.prop === 'can' || profile.prop === 'bag') {
    const prop = new THREE.Group();
    elbows[0].add(prop);
    prop.position.set(-.003, -.23, .028);
    const color = profile.prop === 'can' ? 0x607d65 : profile.prop === 'bucket' ? 0x879da3 : 0x9c7950;
    loft(prop, color, [{ y: -.17, x: .086, z: .076 }, { y: -.153, x: .091, z: .08 },
      { y: -.047, x: .105, z: .087 }, { y: -.036, x: .105, z: .087 }]);
    stroke(prop, dark, .01, [[-.084,-.044,0],[-.06,.032,0],[.066,.032,0],[.09,-.044,0]]);
    if (profile.prop === 'can') stroke(prop, color, .024, [[.082,-.13,0],[.175,-.107,0],[.21,-.045,0]]);
  }
  if (profile.prop === 'whistle') {
    stroke(body, dark, .01, [[-.077,.951,.155],[0,.716,.192],[.075,.951,.157]]);
    patch(body, gold, 0, .69, .195, .049, .068, .032);
  }
  if (profile.prop === 'headphones') {
    stroke(head, 0x5f454c, .023, [[-.395,.04,-.04],[-.31,.353,-.05],[0,.445,-.08],[.31,.353,-.05],[.395,.04,-.04]]);
    for (const side of [-1,1]) ball(head, 0xa8757b, side*.407, -.049, -.052, .05, .119, .078);
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
    baked.castShadow = baked.receiveShadow = true;
    parts.forEach(part => { part.removeFromParent(); part.geometry.dispose(); });
    parent.add(baked);
  });
  palette.forEach(material => material.dispose());
  return { group, body, head, leftLeg, rightLeg, leftArm, rightArm, knees, elbows, eyes, smile, talkingMouth, kind };
}

export type CampusCharacter = ReturnType<typeof createCampusCharacter>;

export function animateCharacter(rig: CampusCharacter, time: number, speaking: boolean, reducedMotion: boolean) {
  const t = reducedMotion ? 0 : time;
  const phase = t % 4.9;
  const blink = !reducedMotion && phase < .16 ? 1 - Math.sin(phase / .16 * Math.PI) * .94 : 1;
  const profile: Profile = CHARACTER_PROFILES[rig.kind];
  const holdingLeft = profile.prop && ['map', 'books', 'board'].includes(profile.prop);
  const carryingTool = profile.prop && ['bucket', 'can', 'bag'].includes(profile.prop);
  rig.eyes.forEach(eye => { eye.scale.y = blink; });
  rig.body.position.y = Math.sin(t * 1.65) * .009;
  rig.head.rotation.set(Math.sin(t * (speaking ? 3 : .9)) * (speaking ? .047 : .014),
    Math.sin(t * .72) * .025, Math.sin(t * .87) * .018);
  rig.leftArm.rotation.z = -.13;
  rig.rightArm.rotation.z = .13 + (speaking && profile.prop !== 'tray' ? .12 + Math.sin(t * 2.2) * .073 : 0);
  rig.leftArm.rotation.x = holdingLeft ? -.47 : carryingTool ? -.18 : Math.sin(t) * .025;
  rig.elbows[0].rotation.x = holdingLeft ? -.72 : carryingTool ? -.28 : -.06;
  rig.rightArm.rotation.x = profile.prop === 'tray' ? -.51 : speaking ? -.34 : Math.sin(t) * .025;
  rig.elbows[1].rotation.x = profile.prop === 'tray' ? -.77 : speaking ? -.54 : -.07;
  const mouthOpen = speaking && !reducedMotion && Math.sin(t * 18) > -.28;
  rig.smile.visible = !mouthOpen;
  rig.talkingMouth.visible = mouthOpen;
}
