import * as THREE from 'three';
import type { sceneryKit } from './campus-scenery-kit';
import { studyGroups, type StudySubject } from './group-study-layout';

type Kit = ReturnType<typeof sceneryKit>;
type Station = (k: Kit, x: number, z: number, index: number) => void;
const wood = 0xce9964, frame = 0x574b40, paper = 0xffedcb, ink = 0x263f48;
const coral = 0xd97754, gold = 0xe5b657, teal = 0x549891, blue = 0x689cb3;
const top = 1.24;

function table(k: Kit, x: number, z: number, accent: number) {
  for (const side of [-1, 1]) {
    k.block(x + side * 1.22, .76, z, .16, .80, 1.18, frame);
    k.block(x + side * 1.22, .38, z, .31, .10, 1.38, frame);
    for (const end of [-1, 1]) {
      const sx = x + side * .83, sz = z + end * 1.15;
      k.drum(sx, .54, sz, .14, .42, .14, frame);
      k.block(sx, .36, sz, .51, .08, .46, frame);
      k.block(sx, .77, sz, .66, .13, .54, wood);
      k.block(sx, .86, sz, .60, .075, .50, accent);
      k.block(sx, 1.03, sz + end * .24, .52, .40, .08, accent, 0, 0, end * .07);
    }
  }
  k.block(x, .72, z, 2.41, .13, .12, frame);
  k.block(x, 1.12, z, 3.22, .13, 1.54, accent);
  k.block(x, 1.20, z, 3.29, .08, 1.60, wood);
}

function notebook(k: Kit, x: number, z: number, cover: number) {
  k.block(x, top + .035, z, .59, .07, .41, cover);
  k.block(x + .02, top + .08, z, .52, .025, .36, paper);
  for (const dz of [-.08, 0, .08])
    k.block(x + .03, top + .096, z + dz, .32, .009, .017, cover);
}

const language: Station = (k, x, z, index) => {
  for (const side of [-1, 1]) {
    notebook(k, x + side * .94, z + .38, side < 0 ? coral : teal);
    if (index === 1) {
      k.block(x + side * .83, 1.28, z - .24, .95, .06, .67, blue);
      for (const n of [-1, 0, 1]) {
        k.leaf(x + side * .83 + n * .19, 1.32, z - .26 + n * .08, .31, .04, .23, gold, 0, n);
      }
    } else {
      k.drum(x + side * .76, 1.29, z - .16, .42, .09, .38, ink);
      k.drum(x + side * .76, 1.46, z - .16, .06, .30, .06, frame);
      k.globe(x + side * .76, 1.69, z - .16, .23, .37, .23, ink, side * .23);
    }
  }
  k.hoop(x, 1.54, z, .53, .58, .35, ink);
  for (const side of [-1, 1]) k.globe(x + side * .23, 1.43, z, .13, .24, .20, teal);
};

const computer: Station = (k, x, z) => {
  for (const side of [-1, 1]) for (const end of [-1, 1]) {
    const sx = x + side * .86, sz = z + end * .45, hinge = sz - end * .21;
    k.block(sx, 1.28, sz, .86, .08, .51, ink);
    k.block(sx, 1.328, sz, .68, .014, .22, 0x769097);
    k.block(sx, 1.57, hinge, .86, .53, .052, ink);
    k.block(sx, 1.57, hinge + end * .034, .74, .42, .024, 0x386777);
    for (let i = 0; i < 3; i++)
      k.block(sx - .09 + i * .04, 1.46 + i * .085, hinge + end * .052, .27 + i * .10, .032, .015, i % 2 ? gold : 0x96d6bf);
  }
  k.block(x, 1.32, z, .32, .15, .57, teal);
};

const kitchen: Station = (k, x, z, index) => {
  k.block(x - .78, 1.28, z, 1.13, .08, .83, 0xab724d);
  for (let i = 0; i < 3; i++) {
    k.leaf(x - .99 + i * .21, 1.40, z, .17, .16, .56, 0xe58c41, 0, .16);
    k.leaf(x - .99 + i * .21, 1.43, z - .27, .15, .14, .20, 0x689756);
  }
  if (index % 2) {
    k.pot(x + .74, 1.47, z, .77, .43, .77, 0xa7b9b0);
    k.drum(x + .74, 1.69, z, .66, .026, .66, 0xb16a3e);
    for (const side of [-1, 1]) k.block(x + .74 + side * .39, 1.58, z, .17, .07, .20, ink);
  } else {
    k.drum(x + .76, 1.29, z, .89, .08, .77, paper);
    k.globe(x + .76, 1.45, z, .75, .31, .43, gold);
    for (const n of [-1, 0, 1]) k.block(x + .76 + n * .16, 1.589, z, .044, .015, .18, paper, 0, .32);
  }
  notebook(k, x, z + .48, coral);
};

const art: Station = (k, x, z, index) => {
  k.block(x - .65, 1.31, z, 1.20, .14, .52, frame);
  k.block(x - .65, 1.80, z - .07, 1.03, .88, .09, paper, 0, 0, -.09);
  k.block(x - .65, 1.77, z + .004, .85, .59, .035, index % 2 ? blue : teal);
  k.globe(x - .84, 1.90, z + .035, .21, .21, .044, gold);
  k.leaf(x - .52, 1.64, z + .045, .53, .23, .045, index % 2 ? teal : coral);
  k.globe(x + .59, 1.30, z + .23, .92, .12, .61, paper);
  for (const [i, color] of [coral, gold, teal, blue].entries())
    k.drum(x + .34 + i * .16, 1.372, z + .19 + .11 * Math.sin(i), .13, .027, .13, color);
  k.pot(x + 1.06, 1.43, z - .31, .28, .36, .28, teal);
  for (const n of [-1, 0, 1]) {
    k.drum(x + 1.06 + n * .06, 1.73, z - .31, .041, .47, .041, wood, n * -.15);
    k.globe(x + 1.06 + n * .09, 1.98, z - .31, .063, .11, .063, frame);
  }
};

const music: Station = (k, x, z, index) => {
  k.block(x - .46, 1.33, z, 1.79, .18, .81, index % 2 ? ink : frame);
  const colors = [coral, 0xe29b55, gold, 0x9eb768, teal, blue, 0x9b89ad];
  for (let i = 0; i < 7; i++) {
    const sx = x - 1.19 + i * .24;
    k.block(sx, 1.46, z, .21, .10, index % 2 ? .68 : .78 - i * .056, index % 2 ? paper : colors[i]);
    if (index % 2 && ![2, 6].includes(i)) k.block(sx + .11, 1.53, z - .17, .12, .08, .34, ink);
  }
  if (index % 2) notebook(k, x + .89, z + .27, frame);
  else for (const side of [-1, 1]) {
    k.block(x + .82, 1.29, z + side * .17, .76, .055, .055, wood);
    k.globe(x + 1.18, 1.33, z + side * .17, .16, .16, .16, coral);
  }
};

const weather: Station = (k, x, z, index) => {
  k.block(x - .51, 1.30, z, 1.71, .12, 1.11, blue);
  for (const n of [-1, 0, 1]) {
    k.leaf(x - .51 + n * .38, 1.38, z + n * .16, .63, .08, .42, 0x95b171, 0, n);
    k.drum(x - .64 + n * .38, 1.44, z + n * .16, .15, .06, .15, index % 2 ? coral : gold);
  }
  k.drum(x + .85, 1.29, z, .52, .10, .52, ink);
  k.drum(x + .85, 1.58, z, .07, .59, .07, frame);
  for (let i = 0; i < 3; i++) {
    const a = i * Math.PI * 2 / 3;
    k.block(x + .85 + .20 * Math.cos(a), 1.91, z + .20 * Math.sin(a), .47, .054, .054, ink, 0, -a);
    k.globe(x + .85 + .43 * Math.cos(a), 1.91, z + .43 * Math.sin(a), .23, .18, .22, paper);
  }
};

const plant: Station = (k, x, z, index) => {
  k.block(x - .47, 1.30, z, 1.76, .12, 1.03, frame);
  for (const col of [-1, 0, 1]) for (const row of [-1, 1]) {
    const px = x - .47 + col * .49, pz = z + row * .24;
    k.pot(px, 1.48, pz, .36, .29, .35, 0xbd7954);
    for (const side of [-1, 1]) k.leaf(px + side * .09, 1.71, pz, .20, .33, .18, index % 2 ? 0x829d52 : 0x5f9258, -side * .57);
  }
  notebook(k, x + .85, z + .39, teal);
  k.block(x + .85, 1.32, z - .22, .60, .14, .39, wood);
  k.drum(x + .85, 1.52, z - .22, .07, .40, .07, ink);
  k.hoop(x + .85, 1.91, z - .22, .49, .49, .45, frame);
};

const optics: Station = (k, x, z, index) => {
  k.block(x, 1.31, z, 2.68, .14, .51, ink);
  for (const sx of [-.99, 0, .99]) k.drum(x + sx, 1.50, z, .08, .36, .08, frame);
  k.block(x - .99, 1.76, z, .44, .35, .36, teal);
  k.globe(x - .74, 1.76, z, .10, .22, .22, gold);
  k.hoop(x, 1.76, z, .51, .51, .4, gold, 0, 1.05);
  k.globe(x, 1.76, z, .36, .36, .11, 0xa9d9d4, 0, 1.05);
  k.block(x + .99, 1.81, z, .69, .63, .08, paper);
  for (const [i, color] of [coral, gold, teal, blue].entries())
    k.block(x + .79 + i * .13, 1.81, z + .05, .105, .39, .024, color, index % 2 ? -.16 : 0);
};

const subjects: Record<StudySubject, {accent: number; books: string; equip: Station}> = {
  language: {accent: teal, books: 'Phrasebooks & picture cards', equip: language},
  computer: {accent: blue, books: 'Code & networks', equip: computer},
  kitchen: {accent: coral, books: 'Recipes & ingredients', equip: kitchen},
  art: {accent: 0xbf785d, books: 'Colour & composition', equip: art},
  music: {accent: 0x698a78, books: 'Scores & songbooks', equip: music},
  weather: {accent: blue, books: 'Forecasts & field notes', equip: weather},
  'plant-lab': {accent: 0x809d5c, books: 'Seeds & field guides', equip: plant},
  'light-lab': {accent: teal, books: 'Light & colour', equip: optics},
};

function bookshelf(k: Kit, x: number, z: number, accent: number) {
  for (const side of [-1, 1]) k.block(x + side * 1.19, .98, z, .11, 1.30, .76, frame);
  for (const y of [.46, 1.02, 1.59]) k.block(x, y, z, 2.48, .09, .78, wood);
  k.block(x, 1.0, z - .32, 2.33, 1.09, .09, frame);
  for (const y of [.51, 1.07]) for (let i = 0; i < 9; i++) {
    const h = .35 + (i % 3) * .045, px = x - 1.02 + i * .245;
    k.block(px, y + h / 2, z + .06, .18, h, .45, [accent, coral, ink, gold, teal][i % 5]);
    k.block(px, y + .09, z + .293, .14, .036, .013, paper);
  }
}

export function furnishStudyGroups(k: Kit, props: THREE.Group, subject: StudySubject) {
  const {accent, books, equip} = subjects[subject];
  const canvas = document.createElement('canvas');
  canvas.width = 384; canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#264542'; ctx.fillRect(0, 0, 384, 64);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fff0ce';
  ctx.font = 'bold 23px sans-serif'; ctx.fillText(books, 192, 32, 366);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const plaque = new THREE.PlaneGeometry(2.05, .34);
  const material = new THREE.MeshBasicMaterial({map: texture});
  for (const f of studyGroups.filter(f => f.subject === subject)) {
    if (f.unit === 'table') {
      table(k, f.x, f.z, accent);
      equip(k, f.x, f.z, f.index);
    } else {
      bookshelf(k, f.x, f.z, accent);
      k.block(f.x, 1.77, f.z - .23, 2.09, .39, .10, frame);
      const sign = new THREE.Mesh(plaque, material);
      sign.position.set(f.x, 1.77, f.z - .173);
      props.add(sign);
    }
  }
}
