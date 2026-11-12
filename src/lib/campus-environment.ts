import * as THREE from "three";
import { createCampusCharacter, type CharacterKind } from "./campus-character";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { PLACES, type Place } from "./game";
import { createCampusSurfaces, createContactMaterial, seededRandom, worldAlignedUV } from "./campus-surfaces";
import { addCampusRoofs } from "./campus-roofs";
import { createCampusTrees } from "./campus-trees";
import { addCampusGrass } from "./campus-planting";
import {
  CORE_BUILDINGS,
  EXPANSION_BUILDINGS,
  ROOM_FURNITURE,
  isOpenRoom,
} from "./campus-map";

const BUILDINGS = CORE_BUILDINGS;

/** The playable campus, with batched architecture and articulated characters. */
export function createCampusEnvironment(scene: THREE.Scene, avatar: number) {
  const palette = new Map<string, THREE.MeshStandardMaterial>();
  const windUniform = { value: 0 };
  const finish = createCampusSurfaces();
  const random = seededRandom(49257);
  const roofs: Parameters<typeof addCampusRoofs>[1] = [];
  const characterGroups: THREE.Group[] = [];
  const mat = (color: number, roughness = 0.8, metalness = 0) => {
    const key = `${color}/${roughness}/${metalness}`;
    if (!palette.has(key))
      palette.set(
        key,
        new THREE.MeshStandardMaterial({ color, roughness, metalness }),
      );
    return palette.get(key)!;
  };
  const mesh = (
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
    position: [number, number, number],
    parent: THREE.Object3D = scene,
  ) => {
    const object = new THREE.Mesh(geometry, material);
    object.position.set(...position);
    object.castShadow = true;
    object.receiveShadow = true;
    parent.add(object);
    return object;
  };
  const box = (
    w: number,
    h: number,
    d: number,
    color: number,
    x: number,
    y: number,
    z: number,
    parent: THREE.Object3D = scene,
    rounded = false,
  ) =>
    mesh(
      rounded
        ? new RoundedBoxGeometry(w, h, d, 2, Math.min(w, h, d) * 0.12)
        : new THREE.BoxGeometry(w, h, d),
      mat(color),
      [x, y, z],
      parent,
    );
  const cylinder = (
    top: number,
    bottom: number,
    h: number,
    color: number,
    x: number,
    y: number,
    z: number,
    parent: THREE.Object3D = scene,
    segments = 12,
  ) =>
    mesh(
      new THREE.CylinderGeometry(top, bottom, h, segments),
      mat(color),
      [x, y, z],
      parent,
    );
  const sphere = (
    radius: number,
    color: number,
    x: number,
    y: number,
    z: number,
    parent: THREE.Object3D = scene,
    detail = 12,
  ) =>
    mesh(
      new THREE.SphereGeometry(radius, detail, 10),
      mat(color),
      [x, y, z],
      parent,
    );
  const canvasTexture = (
    width: number,
    height: number,
    draw: (ctx: CanvasRenderingContext2D) => void,
  ) => {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d")!;
    draw(context);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  };
  const sign = (
    text: string,
    w: number,
    h: number,
    x: number,
    y: number,
    z: number,
    background = "#8b3c2d",
  ) => {
    const texture = canvasTexture(1024, 128, (ctx) => {
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, 1024, 128);
      ctx.strokeStyle = "#e5c979";
      ctx.lineWidth = 5;
      ctx.strokeRect(9, 9, 1006, 110);
      ctx.fillStyle = "#ffe6a3";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = "bold 58px Arial";
      ctx.fillText(text, 512, 68, 970);
    });
    return mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshStandardMaterial({ map: texture, roughness: 0.8 }),
      [x, y, z],
    );
  };

  const surfaceBox = (
    w: number, h: number, d: number, material: THREE.MeshStandardMaterial,
    x: number, y: number, z: number, repeat: number,
  ) => {
    const geometry = new THREE.BoxGeometry(w, h, d);
    worldAlignedUV(geometry, new THREE.Vector3(x, y, z), repeat);
    return mesh(geometry, material, [x, y, z]);
  };

  const contact = createContactMaterial();
  const shade = (x: number, z: number, w: number, d: number, y = 0.083) => {
    const decal = mesh(new THREE.PlaneGeometry(w, d), contact, [x, y, z]);
    decal.rotation.x = -Math.PI / 2;
    decal.castShadow = decal.receiveShadow = false;
    return decal;
  };
  const landscape = surfaceBox(180, 0.12, 180, finish("turf", 0x798c4f), 0, -0.23, 0, 5);
  landscape.castShadow = false;
  const lawn = surfaceBox(76, 0.18, 64, finish("turf", 0x91a65f), 0, -0.12, 0, 4.5);
  lawn.castShadow = false;

  const paving = finish("pavers", 0xe4d2ad);
  const paved = (w: number, h: number, d: number, x: number, y: number, z: number) => {
    const surface = surfaceBox(w, h, d, paving, x, y, z, 3.8);
    surface.castShadow = false;
    return surface;
  };
  paved(24, 0.1, 13.6, 0, 0.015, 1.8);
  paved(3.3, 0.12, 8, 0, 0.03, -6);
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(76, 64),
    new THREE.MeshBasicMaterial({ visible: false }),
  );
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);
  for (const x of [-12.1, 12.1]) box(0.13, 0.13, 14, 0xe5dfc9, x, 0.1, 1.5);
  for (const z of [-5, 8.7]) box(24, 0.13, 0.13, 0xd4c29e, 0, 0.1, z);
  const brickTrim = finish("clay", 0xa87454);
  for (const x of [-11.77, 11.77]) {
    surfaceBox(0.22, 0.016, 13.23, brickTrim, x, 0.069, 1.8, 1.9).castShadow = false;
  }
  for (const z of [-4.82, 8.42]) {
    surfaceBox(23.75, 0.016, 0.22, brickTrim, 0, 0.069, z, 1.9).castShadow = false;
  }
  // Avenues use the same tile scale as the courtyard.
  for (const x of [-15, 15]) paved(3.2, 0.09, 44, x, 0.005, 3);
  for (const z of [-18, 18]) paved(61, 0.1, 3.4, 0, 0.012, z);
  paved(18, 0.1, 3.2, -23, 0.015, 4);
  paved(3.4, 0.1, 16, 0, 0.02, 22);
  paved(3.4, 0.1, 7, 0, 0.02, -20);
  paved(3.2, 0.1, 18, -20, 0.015, -5);

  const glass = canvasTexture(128, 128, (ctx) => {
    const reflection = ctx.createLinearGradient(5, 0, 95, 128);
    reflection.addColorStop(0, "#85a8ad");
    reflection.addColorStop(0.27, "#4d7677");
    reflection.addColorStop(0.69, "#284744");
    reflection.addColorStop(1, "#162f29");
    ctx.fillStyle = reflection;
    ctx.fillRect(0, 0, 128, 128);
    ctx.fillStyle = "#d9efdf28";
    ctx.beginPath();
    ctx.moveTo(0, 26);
    ctx.lineTo(128, 67);
    ctx.lineTo(128, 81);
    ctx.lineTo(0, 42);
    ctx.fill();
    ctx.fillStyle = "#d0e4c41a";
    ctx.fillRect(7, 0, 3, 128);
  });
  const glazed = new THREE.MeshStandardMaterial({ map: glass, color: 0x9fb8ad, roughness: 0.26, metalness: 0.15 });

  // Windows have reveals, frames, mullions, lintels and warm interior depth.
  const windowPane = (x: number, y: number, z: number, w = 0.74, h = 1.02, turn = 0) => {
    const frame = new THREE.Group();
    frame.position.set(x, y, z);
    frame.rotation.y = turn;
    scene.add(frame);
    box(w + 0.2, h + 0.17, 0.11, 0x806f50, 0, 0, 0, frame);
    const pane = mesh(new THREE.PlaneGeometry(w, h), glazed, [0, 0, 0.061], frame);
    pane.castShadow = false;
    for (const side of [-1, 1]) {
      box(0.065, h + 0.12, 0.085, 0xd2c4a0, side * (w / 2 + 0.034), 0, 0.065, frame);
    }
    box(w + 0.14, 0.065, 0.085, 0xd2c4a0, 0, h / 2 + 0.025, 0.065, frame);
    box(0.04, h, 0.049, 0x3e5349, 0, 0, 0.085, frame);
    box(w, 0.044, 0.053, 0x3e5349, 0, 0.02, 0.085, frame);
    box(w + 0.22, 0.105, 0.23, 0xead7af, 0, -h / 2 - 0.055, 0.052, frame);
    box(w + 0.21, 0.075, 0.19, 0xdbc297, 0, h / 2 + 0.09, 0.052, frame);
  };

  BUILDINGS.forEach((b, index) => {
    box(b.w + 0.65, 0.22, b.d + 0.65, 0xc2bba4, b.x, 0.15, b.z);
    surfaceBox(b.w, b.h, b.d, finish("stucco", 0xf1d49d), b.x, b.h / 2 + 0.25, b.z, 2.6);
    surfaceBox(b.w + 0.09, 0.51, b.d + 0.09, finish("stone", 0xbaa986), b.x, 0.42, b.z, 2.8);
    shade(b.x, b.z + 0.7, b.w + 3.6, b.d + 2.5);
    box(b.w + 0.28, 0.18, b.d + 0.3, 0xffedc8, b.x, b.h + 0.25, b.z);
    const triangle = new THREE.Shape();
    triangle.moveTo(-b.d / 2 - 0.35, 0);
    triangle.lineTo(0, 1.15);
    triangle.lineTo(b.d / 2 + 0.35, 0);
    triangle.closePath();
    const roof = mesh(
      new THREE.ExtrudeGeometry(triangle, {
        depth: b.w + 0.65,
        bevelEnabled: false,
      }),
      mat(b.roof),
      [b.x - b.w / 2 - 0.325, b.h + 0.34, b.z],
    );
    roof.rotation.y = Math.PI / 2;
    roofs.push({
      x: b.x, y: b.h + 0.34, z: b.z,
      width: b.w + 0.68, run: b.d / 2 + 0.35, rise: 1.15,
      color: index === 2 ? 0x537052 : index === 1 ? 0xb66a48 : 0xa6543b,
      metal: index === 2,
    });
    for (const side of [-1, 1]) {
      const edge = b.z + side * (b.d / 2 + 0.35);
      box(b.w + 0.77, 0.075, 0.11, 0x514a37, b.x, b.h + 0.32, edge);
      for (let x = -b.w / 2 + 0.28; x < b.w / 2; x += 0.48) {
        box(0.09, 0.095, 0.43, 0x6a5840, b.x + x, b.h + 0.19, edge - side * 0.13);
      }
      const pipeX = b.x + side * (b.w / 2 - 0.18);
      cylinder(0.033, 0.033, b.h - 0.15, 0x656453, pipeX, b.h / 2 + 0.16, b.z + side * (b.d / 2 + 0.12));
    }
    for (let x = -b.w / 2; x < b.w / 2; x += 0.33) {
      const cap = mesh(
        new THREE.CylinderGeometry(0.08, 0.08, 0.3, 8),
        mat(index === 2 ? 0x3f6147 : 0xb86447),
        [b.x + x, b.h + 1.51, b.z],
      );
      cap.rotation.z = Math.PI / 2;
    }
    const front = b.z + b.d / 2 + 0.07;
    for (const offset of [-b.w / 2 + 0.12, b.w / 2 - 0.12]) {
      surfaceBox(0.22, b.h, 0.16, finish("stone", 0xe5cda6), b.x + offset, b.h / 2 + 0.22, front - 0.035, 2.4);
      for (let y = 0.7; y < b.h; y += 0.29) {
        box(0.23, 0.014, 0.17, 0xb6a185, b.x + offset, y, front - 0.035);
      }
    }
    if (index === 0) box(b.w + 0.08, 0.15, 0.18, 0xe5cfa5, b.x, 2.14, front);
    for (let row = 0; row < (index === 0 ? 2 : 1); row++)
      for (
        let offset = -b.w / 2 + 0.85;
        offset < b.w / 2 - 0.25;
        offset += 1.3
      ) {
        if (Math.abs(offset) < 0.58 && row === 0) continue;
        windowPane(
          b.x + offset,
          1.18 + row * 1.55,
          front,
          0.75,
          index === 0 ? 1.0 : 1.2,
        );
      }
    for (const side of [-1, 1]) {
      for (let offset = -b.d / 2 + 0.74; offset < b.d / 2 - 0.25; offset += 1.16) {
        for (let row = 0; row < (index === 0 ? 2 : 1); row++) {
          windowPane(b.x + side * (b.w / 2 + 0.06), 1.22 + row * 1.56, b.z + offset, 0.7, 0.96, side * Math.PI / 2);
        }
      }
      box(0.13, 0.11, b.d + 0.02, 0xe2cba1, b.x + side * b.w / 2, index === 0 ? 2.14 : 0.72, b.z);
    }
    for (let offset = -b.w / 2 + 0.84; offset < b.w / 2 - 0.3; offset += 1.36) {
      for (let row = 0; row < (index === 0 ? 2 : 1); row++) {
        windowPane(b.x + offset, 1.22 + row * 1.56, b.z - b.d / 2 - 0.055, 0.72, 0.96, Math.PI);
      }
    }
    box(1.05, 1.8, 0.12, 0x365344, b.x, 1.15, front + 0.025);
    box(0.035, 1.8, 0.08, 0xc4b57c, b.x, 1.15, front + 0.1);
    sphere(0.035, 0xd5bb69, b.x + 0.35, 1.08, front + 0.16);
    for (let step = 0; step < 3; step++)
      box(
        2.1 - step * 0.16,
        0.09,
        0.4,
        0xd9d4bb,
        b.x,
        0.08 + step * 0.09,
        front + 0.8 - step * 0.2,
      );
    sign(
      index === 0
        ? "PHÂN HIỆU 1"
        : index === 1
          ? "THƯ VIỆN · LIBRARY"
          : "CĂNG TIN · CANTEEN",
      b.w * 0.75,
      0.34,
      b.x,
      b.h - 0.15,
      front + 0.08,
      index === 2 ? "#3b5f45" : "#8b3c2d",
    );
    if (index === 0) {
      // Main-school portico, triangular pediment and balcony.
      box(3.2, 0.22, 1.4, 0xf3dfaf, 0, 2.3, front + 0.5);
      for (const x of [-1.35, 1.35]) {
        cylinder(0.13, 0.16, 2.1, 0xffedc7, x, 1.25, front + 1);
        cylinder(0.22, 0.22, 0.13, 0xdccca4, x, 0.25, front + 1);
      }
      box(3, 0.1, 0.08, 0x7f8b6f, 0, 2.9, front + 1.15);
      for (let x = -1.45; x < 1.5; x += 0.24)
        box(0.035, 0.5, 0.035, 0x7f8b6f, x, 2.65, front + 1.15);
      const pediment = new THREE.Shape();
      pediment.moveTo(-1.9, 0);
      pediment.lineTo(0, 0.9);
      pediment.lineTo(1.9, 0);
      pediment.closePath();
      mesh(
        new THREE.ExtrudeGeometry(pediment, {
          depth: 0.18,
          bevelEnabled: false,
        }),
        mat(0xf4e2ba),
        [0, b.h + 0.36, front + 0.2],
      );
      const crest = new THREE.TextureLoader().load("/images/school-logo.jpg");
      crest.colorSpace = THREE.SRGBColorSpace;
      mesh(
        new THREE.CircleGeometry(0.24, 32),
        new THREE.MeshStandardMaterial({ map: crest }),
        [0, b.h + 0.7, front + 0.4],
      );
    } else if (index === 1) {
      const shelfX = b.x + 1.8;
      box(1.1, 1.45, 0.3, 0x9b7650, shelfX, 0.95, front + 0.22);
      for (let row = 0; row < 3; row++) {
        box(
          1.15,
          0.06,
          0.35,
          0xb58a55,
          shelfX,
          0.45 + row * 0.43,
          front + 0.25,
        );
        for (let i = 0; i < 6; i++)
          box(
            0.09,
            0.3,
            0.21,
            [0x4a7970, 0xb78553, 0x858b4e, 0x9d5850][i % 4],
            shelfX - 0.43 + i * 0.16,
            0.63 + row * 0.43,
            front + 0.24,
          );
      }
    } else {
      const awning = box(
        4.8,
        0.09,
        1.5,
        0xeee6c5,
        b.x,
        b.h - 0.25,
        front + 0.7,
      );
      awning.rotation.x = 0.14;
      for (let i = 0; i < 10; i++) {
        const stripe = box(
          0.24,
          0.095,
          1.51,
          0x6f8b5b,
          b.x - 2.1 + i * 0.47,
          b.h - 0.25,
          front + 0.7,
        );
        stripe.rotation.x = 0.14;
      }
      box(4.9, 0.28, 0.1, 0x567647, b.x, b.h - 0.51, front + 1.45);
      for (const offset of [-2.2, 2.2])
        cylinder(0.045, 0.045, 1.8, 0x7c8864, b.x + offset, 1, front + 1.4);
      box(2.7, 0.75, 0.7, 0xb99265, b.x, 0.5, front + 0.5);
      box(2.85, 0.09, 0.85, 0xe0c695, b.x, 0.93, front + 0.5);
      for (let i = 0; i < 4; i++) {
        const bread = sphere(
          0.14,
          0xc7934e,
          b.x - 0.8 + i * 0.35,
          1.06,
          front + 0.4,
        );
        bread.scale.set(1.5, 0.7, 0.6);
      }
    }
  });

  EXPANSION_BUILDINGS.forEach((b) => {
    box(b.w + 0.5, 0.22, b.d + 0.5, 0xc6bda3, b.x, 0.13, b.z);
    if (isOpenRoom(b)) {
      // Cutaway rooms expose the furniture and preserve a real walkable doorway.
      box(
        b.w,
        0.06,
        b.d,
        b.kind === "hall" ? 0xbb9465 : 0xe0d5b6,
        b.x,
        0.26,
        b.z,
      );
      box(b.w, b.h, 0.2, 0xe9d6ad, b.x, b.h / 2 + 0.25, b.z - b.d / 2);
      for (const side of [-1, 1]) {
        box(0.2, 1.25, b.d, 0xe9d6ad, b.x + (side * b.w) / 2, 0.87, b.z);
        box(
          b.w / 2 - 1.3,
          0.65,
          0.2,
          0xe9d6ad,
          b.x + side * (b.w / 4 + 0.65),
          0.57,
          b.z + b.d / 2,
        );
        box(
          0.18,
          b.h,
          0.18,
          0xcab78d,
          b.x + side * 1.3,
          b.h / 2 + 0.25,
          b.z + b.d / 2,
        );
      }
      box(2.75, 0.18, 0.25, b.roof, b.x, b.h + 0.24, b.z + b.d / 2);
      sign(
        b.name,
        b.w * 0.8,
        0.43,
        b.x,
        b.h - 0.2,
        b.z - b.d / 2 + 0.13,
        b.kind === "computer" ? "#345b65" : "#476345",
      );
      if (b.kind === "classroom" || b.kind === "language") {
        box(4, 1.2, 0.06, 0x365c4a, b.x, 1.45, b.z - b.d / 2 + 0.16);
        sign(
          b.kind === "language"
            ? "HELLO! · LET’S SPEAK ENGLISH"
            : "WELCOME TO CLASS",
          3.8,
          0.4,
          b.x,
          1.5,
          b.z - b.d / 2 + 0.21,
          "#365c4a",
        );
        box(1.5, 0.8, 0.7, 0xba956d, b.x, 0.7, b.z - b.d / 2 + 0.9);
      }
      if (b.kind === "hall") {
        box(b.w - 1.2, 0.45, 1.5, 0xa77c58, b.x, 0.48, b.z - b.d / 2 + 1.1);
        for (const x of [b.x - 3.5, b.x + 3.5])
          box(0.06, 0.02, 5.2, 0xf3ead0, x, 0.3, b.z + 0.6);
        for (const z of [b.z - 2, b.z + 0.6, b.z + 3.2])
          box(7, 0.02, 0.06, 0xf3ead0, b.x, 0.3, z);
        for (const x of [b.x - 3.5, b.x + 3.5])
          cylinder(0.045, 0.045, 1.5, 0xede7d1, x, 1.05, b.z + 0.6);
        for (let i = 0; i < 16; i++)
          box(
            0.015,
            0.4,
            0.015,
            0xe6dfbf,
            b.x - 3.5 + (i * 7) / 15,
            1.55,
            b.z + 0.6,
          );
      }
      if (b.kind === "dining") {
        box(b.w - 1.4, 0.85, 0.7, 0x9eaf9b, b.x, 0.7, b.z - b.d / 2 + 0.8);
        for (let i = 0; i < 6; i++)
          cylinder(
            0.22,
            0.22,
            0.06,
            0xf0e5c7,
            b.x - 3.5 + i * 1.4,
            1.16,
            b.z - b.d / 2 + 0.8,
          );
      }
      return;
    }
    surfaceBox(b.w, b.h, b.d, finish("stucco", 0xe7d1a9), b.x, b.h / 2 + 0.23, b.z, 2.6);
    box(b.w + 0.25, 0.15, b.d + 0.25, 0xffebc6, b.x, b.h + 0.24, b.z);
    const section = new THREE.Shape();
    section.moveTo(-b.d / 2 - 0.3, 0);
    section.lineTo(0, 1.2);
    section.lineTo(b.d / 2 + 0.3, 0);
    section.closePath();
    const roof = mesh(
      new THREE.ExtrudeGeometry(section, {
        depth: b.w + 0.6,
        bevelEnabled: false,
      }),
      mat(b.roof),
      [b.x - b.w / 2 - 0.3, b.h + 0.32, b.z],
    );
    roof.rotation.y = Math.PI / 2;
    roofs.push({ x: b.x, y: b.h + 0.32, z: b.z, width: b.w + 0.64, run: b.d / 2 + 0.3, rise: 1.2, color: b.roof, metal: false });
    for (let row = 0; row < (b.h > 3 ? 2 : 1); row++)
      for (let x = -b.w / 2 + 0.8; x < b.w / 2 - 0.3; x += 1.4)
        windowPane(b.x + x, 1.2 + row * 1.8, b.z + b.d / 2 + 0.06, 0.8, 1.05);
    box(1.0, 1.8, 0.1, 0x3d604a, b.x, 1.15, b.z + b.d / 2 + 0.13);
    box(2.1, 0.15, 0.65, 0xe2d7ba, b.x, 0.13, b.z + b.d / 2 + 0.4);
    sign(b.name, b.w * 0.7, 0.33, b.x, b.h - 0.14, b.z + b.d / 2 + 0.12);
    if (b.h > 3) {
      box(b.w + 0.1, 0.12, 0.6, 0xf0dfb6, b.x, 2.4, b.z + b.d / 2 + 0.2);
      box(b.w - 0.2, 0.05, 0.05, 0x708466, b.x, 2.9, b.z + b.d / 2 + 0.45);
      for (let x = -b.w / 2 + 0.2; x < b.w / 2; x += 0.45)
        box(0.035, 0.5, 0.035, 0x708466, b.x + x, 2.65, b.z + b.d / 2 + 0.45);
    }
  });

  addCampusRoofs(scene, roofs, finish("clay", 0xffffff));

  ROOM_FURNITURE.forEach((f) => {
    if (f.kind === "stage") return;
    box(f.w, 0.12, f.d, 0xc59c66, f.x, 0.97, f.z);
    for (const side of [-1, 1]) {
      box(0.08, 0.65, 0.08, 0x686f5a, f.x + side * (f.w / 2 - 0.2), 0.59, f.z);
      box(0.65, 0.1, 0.55, 0x84946f, f.x + side * 0.65, 0.63, f.z + 0.7);
      box(0.65, 0.55, 0.08, 0x84946f, f.x + side * 0.65, 0.94, f.z + 0.94);
      if (f.kind === "computer") {
        box(0.76, 0.55, 0.08, 0x354c51, f.x + side * 0.64, 1.31, f.z - 0.1);
        box(0.64, 0.41, 0.02, 0x84c2c3, f.x + side * 0.64, 1.32, f.z - 0.045);
        box(0.05, 0.16, 0.05, 0x354c51, f.x + side * 0.64, 1.07, f.z - 0.1);
        box(0.65, 0.035, 0.2, 0x536b6d, f.x + side * 0.64, 1.05, f.z + 0.2);
      } else if (f.kind === "language") {
        box(0.5, 0.035, 0.32, 0xe9e3c1, f.x + side * 0.64, 1.05, f.z);
        const headphones = mesh(
          new THREE.TorusGeometry(0.15, 0.035, 6, 12, Math.PI),
          mat(0x394e5a),
          [f.x + side * 0.64, 1.14, f.z + 0.12],
        );
        headphones.rotation.x = -Math.PI / 2;
        for (const offset of [-0.15, 0.15])
          box(
            0.07,
            0.08,
            0.12,
            0x394e5a,
            f.x + side * 0.64 + offset,
            1.1,
            f.z + 0.12,
          );
      } else if (f.kind === "dining") {
        cylinder(0.22, 0.22, 0.035, 0xf3ebce, f.x + side * 0.65, 1.055, f.z);
        sphere(0.09, 0xd38a50, f.x + side * 0.65, 1.12, f.z, scene, 6);
      } else box(0.45, 0.045, 0.32, 0x638997, f.x + side * 0.65, 1.05, f.z);
    }
  });

  // Eastern sports district: a playable field, goals, track and bleachers.
  box(20, 0.08, 25, 0xba956e, 24, 0.005, 2);
  surfaceBox(16, 0.09, 20, finish("turf", 0x739253), 24, 0.02, 2, 3.5);
  for (const x of [16.25, 31.75]) box(0.09, 0.012, 19.5, 0xf1edd4, x, 0.073, 2);
  for (const z of [-7.75, 2, 11.75])
    box(15.5, 0.012, 0.09, 0xf1edd4, 24, 0.073, z);
  const centreCircle = mesh(
    new THREE.RingGeometry(2.1, 2.18, 48),
    mat(0xf1edd4),
    [24, 0.076, 2],
  );
  centreCircle.rotation.x = -Math.PI / 2;
  for (const z of [-7.5, 11.5]) {
    for (const x of [21.5, 26.5])
      cylinder(0.045, 0.045, 2.1, 0xf0ead3, x, 1.1, z);
    box(5.1, 0.09, 0.09, 0xf0ead3, 24, 2.15, z);
    for (let i = 0; i < 12; i++)
      box(0.015, 1.8, 0.015, 0xd4ddbd, 21.6 + i * 0.43, 1, z + 0.5);
  }
  for (let row = 0; row < 3; row++)
    box(14, 0.28, 0.75, 0xc1b69a, 24, 0.17 + row * 0.28, 14 + row * 0.8);
  sign("SÂN BÓNG ĐÁ · FOOTBALL", 7, 0.45, 24, 1.4, 16.2, "#3b6545");
  sphere(0.24, 0xf1ead5, 25.5, 0.3, 4.5);

  // Southern learning garden with a circular path and planted reading nooks.
  const gardenPath = mesh(
    new THREE.RingGeometry(5.2, 6.5, 64),
    paving,
    [0, 0.045, 24],
  );
  gardenPath.rotation.x = -Math.PI / 2;
  for (const side of [-1, 1]) {
    box(5, 0.17, 8, 0xc6b694, side * 10, 0.02, 23);
    box(4.7, 0.18, 7.7, 0x738b54, side * 10, 0.04, 23);
    for (let i = 0; i < 30; i++) {
      const x = side * 10 + Math.sin(i * 8.4) * 2;
      const z = 23 + Math.cos(i * 2.4) * 3.3;
      sphere(0.14, [0xe1b974, 0xc88d98, 0xd8d49b][i % 3], x, 0.35, z, scene, 6);
    }
  }
  for (const x of [-4.2, 4.2]) {
    cylinder(0.17, 0.22, 3.7, 0xd5c79f, x, 1.8, 30);
    box(0.8, 0.25, 0.8, 0xd9ccab, x, 3.7, 30);
  }
  sign("PHÂN HIỆU 1 · CHÀO MỪNG HỌC VIÊN", 8.2, 0.5, 0, 3.5, 30, "#3f6349");

  const trees = createCampusTrees(scene, finish("bark", 0x8c7050), windUniform);
  const tree = (x: number, z: number, scale = 1, flowering = false) => {
    trees.add(x, z, scale, flowering);
    if (Math.hypot(x, z) > 40) return;
    cylinder(0.64 * scale, 0.71 * scale, 0.16, 0xb9aa88, x, 0.02, z, scene, 24);
    cylinder(0.56 * scale, 0.56 * scale, 0.016, 0x5c513b, x, 0.111, z, scene, 24);
    shade(x, z, 2.2 * scale, 2.0 * scale, 0.13);
  };
  [
    [-11, -8],
    [-11, -1],
    [-11, 5],
    [-8, 9],
    [-4.7, 9],
    [4.7, 9],
    [9, 8],
    [11.5, 3],
    [11, -8],
    [-3.1, -5],
    [3.1, -5],
  ].forEach(([x, z], i) =>
    tree(x, z, 0.78 + (i % 3) * 0.14, i === 3 || i === 8),
  );
  for (let i = 0; i < 44; i++) {
    const a = (i / 44) * Math.PI * 2;
    const r = 42 + (i % 4) * 3;
    tree(Math.cos(a) * r, Math.sin(a) * r, 1.25 + (i % 3) * 0.3, i % 9 === 0);
  }
  // Distant hills with haze; the sky art remains visible above them.
  for (let i = 0; i < 12; i++) {
    const hill = sphere(
      12 + (i % 3) * 5,
      0x7a9d7a,
      Math.sin(i * 1.7) * 70,
      -2,
      -68 - (i % 3) * 10,
      scene,
      20,
    );
    hill.scale.y = 0.5;
    hill.castShadow = false;
  }

  // Dense planting is instanced, keeping draw calls low on classroom PCs.
  const flowerGeometry = new THREE.IcosahedronGeometry(0.075, 1);
  const flowers = new THREE.InstancedMesh(flowerGeometry, mat(0xd9a0aa), 180);
  scene.add(flowers);
  flowers.castShadow = true;
  const leaves = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.14, 6, 4),
    mat(0x5e8551),
    160,
  );
  scene.add(leaves);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < 180; i++) {
    const bed = i % 4;
    const x = (bed < 2 ? -10.7 : 10.7) + Math.sin(i * 7.31) * 0.5;
    const z = (bed % 2 ? -0.6 : 6) + Math.cos(i * 1.61) * 1.0;
    dummy.position.set(x, 0.28 + (i % 4) * 0.05, z);
    dummy.scale.setScalar(0.7 + (i % 3) * 0.2);
    dummy.updateMatrix();
    flowers.setMatrixAt(i, dummy.matrix);
    if (i < 160) {
      dummy.position.y = 0.15;
      dummy.scale.set(1.5, 0.7, 1.3);
      dummy.updateMatrix();
      leaves.setMatrixAt(i, dummy.matrix);
    }
  }
  for (const x of [-10.7, 10.7])
    for (const z of [-0.6, 6])
      box(1.4, 0.18, 2.5, 0xc7b799, x, 0.05, z, scene, true);
  const bench = (x: number, z: number, angle = 0) => {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    group.rotation.y = angle;
    scene.add(group);
    shade(x, z, 2.8, 1.35);
    for (let i = 0; i < 4; i++)
      box(2.2, 0.08, 0.14, 0xad8351, 0, 0.6, -0.27 + i * 0.18, group, true);
    for (let i = 0; i < 3; i++)
      box(2.2, 0.12, 0.07, 0xa47b49, 0, 0.9 + i * 0.15, 0.33, group, true);
    for (const side of [-0.8, 0.8]) {
      box(0.08, 0.6, 0.55, 0x445b45, side, 0.3, 0, group);
      box(0.07, 0.6, 0.08, 0x445b45, side, 0.9, 0.36, group);
    }
  };
  bench(-7, 5.8);
  bench(7, 5.8);
  bench(-3.7, -3, Math.PI / 2);
  for (const [x, z] of [
    [-18, 8],
    [-18, 11],
    [-12, 22],
    [12, 22],
    [-5, -18],
    [5, -18],
    [17, 18],
    [31, 18],
  ])
    bench(x, z);
  for (const [x, z] of [
    [-34, -17],
    [-34, -6],
    [-34, 5],
    [-30, 17],
    [-18, -25],
    [-18, 25],
    [18, -25],
    [33, -17],
    [33, 22],
    [-5, 29],
    [5, 29],
    [-9, 16],
    [9, 16],
    [18, 24],
  ])
    tree(x, z, 0.85 + (Math.abs(x) % 3) * 0.13, z > 15);
  for (const x of [-10, 10])
    for (const z of [-3, 7]) {
      cylinder(0.055, 0.09, 3.4, 0x4e614b, x, 1.7, z);
      box(0.45, 0.1, 0.45, 0x556b50, x, 3.43, z, scene, true);
      mesh(
        new THREE.SphereGeometry(0.16, 12, 8),
        new THREE.MeshStandardMaterial({
          color: 0xffe3a1,
          emissive: 0xffcb68,
          emissiveIntensity: 0.5,
        }),
        [x, 3.2, z],
      );
    }
  for (let x = -37; x <= 37; x += 1.5) {
    box(0.07, 0.85, 0.07, 0xc7c4a1, x, 0.42, -31);
    if (Math.abs(x) > 4.5) box(0.07, 0.85, 0.07, 0xc7c4a1, x, 0.42, 31);
  }
  for (let z = -31; z <= 31; z += 1.5)
    for (const x of [-37, 37]) box(0.07, 0.85, 0.07, 0xc7c4a1, x, 0.42, z);
  box(74, 0.06, 0.06, 0xc7c4a1, 0, 0.75, -31);
  for (const x of [-37, 37]) box(0.06, 0.06, 62, 0xc7c4a1, x, 0.75, 0);
  for (const x of [-20.5, 20.5]) box(33, 0.06, 0.06, 0xc7c4a1, x, 0.75, 31);

  // Flag cloth is subdivided so its silhouette moves in the wind.
  cylinder(0.8, 0.95, 0.24, 0xc9bea2, 2.7, 0.1, -1.9);
  cylinder(0.65, 0.8, 0.2, 0xdbcfb0, 2.7, 0.3, -1.9);
  cylinder(0.035, 0.055, 5, 0xb8b9a4, 2.7, 2.9, -1.9);
  sphere(0.075, 0xd9be74, 2.7, 5.43, -1.9);
  const flagTexture = canvasTexture(320, 200, (ctx) => {
    ctx.fillStyle = "#c3332c";
    ctx.fillRect(0, 0, 320, 200);
    ctx.fillStyle = "#f9d365";
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5,
        r = i % 2 ? 20 : 48;
      const x = 160 + Math.cos(a) * r,
        y = 100 + Math.sin(a) * r;
      if (!i) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
  });
  const flag = mesh(
    new THREE.PlaneGeometry(1.65, 1.03, 22, 12),
    new THREE.MeshStandardMaterial({
      map: flagTexture,
      side: THREE.DoubleSide,
      roughness: 0.75,
    }),
    [3.53, 4.72, -1.9],
  );

  // A small ornamental fountain with animated ripples and falling water.
  cylinder(0.9, 1.05, 0.26, 0xc6bfa2, -3, 0.15, -0.7, scene, 32);
  const water = new THREE.MeshStandardMaterial({ color: 0x5e9e95, roughness: 0.26, metalness: 0.24 });
  water.onBeforeCompile = (shader) => {
    shader.uniforms.uFountainTime = windUniform;
    shader.vertexShader = "varying vec2 vBasin;\n" + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace(
      "#include <begin_vertex>",
      "#include <begin_vertex>\nvBasin = position.xz;",
    );
    shader.fragmentShader = "uniform float uFountainTime;\nvarying vec2 vBasin;\n" + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <color_fragment>",
      `#include <color_fragment>
       float ripple = sin(length(vBasin) * 55.0 - uFountainTime * 4.0);
       float lattice = sin(vBasin.x * 47.0 + vBasin.y * 24.0 + uFountainTime)
         * sin(vBasin.x * -23.0 + vBasin.y * 39.0 - uFountainTime * 1.4);
       diffuseColor.rgb *= .93 + .1 * ripple + .19 * pow(max(0., lattice), 3.0);`,
    );
  };
  const basin = mesh(new THREE.CylinderGeometry(0.78, 0.78, 0.02, 48), water, [-3, 0.3, -0.7]);
  basin.castShadow = false;
  const basinRim = mesh(new THREE.TorusGeometry(0.865, 0.067, 10, 48), finish("stone", 0xd5c8a7), [-3, 0.31, -0.7]);
  basinRim.rotation.x = Math.PI / 2;
  shade(-3, -0.7, 2.7, 2.55);
  cylinder(0.18, 0.24, 0.75, 0xe2d2a6, -3, 0.6, -0.7);
  cylinder(0.45, 0.15, 0.13, 0xcbb88d, -3, 0.98, -0.7, scene, 24);
  const ripples: THREE.Mesh[] = [];
  for (let i = 0; i < 3; i++) {
    const ripple = mesh(
      new THREE.RingGeometry(0.19, 0.21, 40),
      new THREE.MeshBasicMaterial({
        color: 0xd8fff0,
        transparent: true,
        opacity: 0.45,
        side: THREE.DoubleSide,
      }),
      [-3, 0.321 + i * 0.001, -0.7],
    );
    ripple.rotation.x = -Math.PI / 2;
    ripples.push(ripple);
  }

  function character(x:number,z:number,kind:CharacterKind,backpack=false) {
    const rig=createCampusCharacter(kind,backpack);
    rig.group.position.set(x,.13,z);
    rig.group.scale.setScalar(1.16);
    scene.add(rig.group);characterGroups.push(rig.group);
    const feet = shade(x, z, 1.2, 0.9, 0.105);
    rig.group.attach(feet);
    return rig;
  }
  const player=character(0,6,avatar===1 ? "linh":"cadet",true);
  const npcs={} as Record<Place,ReturnType<typeof character>>;
  const npcMarkers: Record<Place, THREE.Mesh> = {} as Record<Place, THREE.Mesh>;
  (Object.keys(PLACES) as Place[]).forEach((id) => {
    const [x, z] = PLACES[id].position;
    const npc=character(x,z,id === "courtyard" ? "cadet" : id === "library" ? "library" : "canteen");
    npcs[id] = npc;
    const ring = mesh(
      new THREE.RingGeometry(0.48, 0.55, 40),
      new THREE.MeshBasicMaterial({
        color: 0xefc878,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide,
      }),
      [x, 0.13, z],
    );
    ring.rotation.x = -Math.PI / 2;
    npcMarkers[id] = ring;
  });
  const selection = mesh(
    new THREE.RingGeometry(0.36, 0.41, 40),
    new THREE.MeshBasicMaterial({
      color: 0xffe5a7,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide,
    }),
    [0, 0.13, 6],
  );
  selection.rotation.x = -Math.PI / 2;
  const destination = mesh(
    new THREE.RingGeometry(0.18, 0.23, 32),
    new THREE.MeshBasicMaterial({ color: 0xffdb75, side: THREE.DoubleSide }),
    [0, 0.14, 0],
  );
  destination.rotation.x = -Math.PI / 2;
  destination.visible = false;
  const moteTexture = canvasTexture(32, 32, (ctx) => {
    const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, "#fff7cc");
    gradient.addColorStop(0.2, "#fff1b9aa");
    gradient.addColorStop(1, "#fff1b900");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 32, 32);
  });
  const motePositions = new Float32Array(90 * 3);
  for (let i = 0; i < 90; i++) {
    motePositions[i * 3] = Math.sin(i * 12.23) * 14;
    motePositions[i * 3 + 1] = 0.5 + (i % 12) * 0.4;
    motePositions[i * 3 + 2] = Math.cos(i * 3.79) * 12;
  }
  const motes = new THREE.Points(
    new THREE.BufferGeometry().setAttribute(
      "position",
      new THREE.BufferAttribute(motePositions, 3),
    ),
    new THREE.PointsMaterial({
      map: moteTexture,
      color: 0xffe8a4,
      size: 0.14,
      transparent: true,
      opacity: 0.65,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  scene.add(motes);
  const butterflies: THREE.Group[] = [];
  for (let i = 0; i < 5; i++) {
    const group = new THREE.Group();
    group.position.set(i % 2 ? -10.6 : 10.6, 1.1 + i * 0.1, i % 2 ? 6 : -0.6);
    scene.add(group);
    for (const side of [-1, 1]) {
      const wing = mesh(
        new THREE.PlaneGeometry(0.13, 0.18),
        new THREE.MeshBasicMaterial({
          color: i % 2 ? 0xe7c56c : 0xe5a0a8,
          side: THREE.DoubleSide,
        }),
        [side * 0.06, 0, 0],
        group,
      );
      wing.rotation.y = side * 0.5;
    }
    butterflies.push(group);
  }
  const leafDetail = trees.finish();
  const grassDetail = addCampusGrass(scene, windUniform);

  // Dry leaves collect along the paving edges, out of the main footpath.
  const litterGeometry = new THREE.CircleGeometry(0.085, 5);
  litterGeometry.rotateX(-Math.PI / 2);
  const litter = new THREE.InstancedMesh(
    litterGeometry,
    new THREE.MeshStandardMaterial({ roughness: 0.98 }),
    460,
  );
  const ochres = [0xa77539, 0x9f6435, 0xc7a264, 0xb79149, 0x797c45];
  for (let i = 0; i < litter.count; i++) {
    const side = i % 2 ? 1 : -1;
    const across = i % 4 > 1;
    const edge = (0.4 + random() * 1.65) * side;
    dummy.position.set(
      across ? (random() - 0.5) * 21.5 : side * 11.6 - edge,
      0.077 + random() * 0.008,
      across ? 1.8 + side * 6.6 - edge : (random() - 0.5) * 11.2 + 1.6,
    );
    dummy.scale.set(0.4 + random() * 0.5, 1, 0.75 + random() * 0.65);
    dummy.rotation.set(0, random() * Math.PI * 2, 0);
    dummy.updateMatrix();
    litter.setMatrixAt(i, dummy.matrix);
    litter.setColorAt(i, new THREE.Color(ochres[i % ochres.length]));
  }
  litter.receiveShadow = true;
  scene.add(litter);
  // Small campus stories: planted borders, bicycle racks and a study pergola.
  for (const x of [-12.8, 12.8]) for (const z of [-1, 3, 7]) {
    box(0.85, 0.42, 1.9, 0xe2c7ab, x, 0.23, z, scene, true);
    box(0.7, 0.06, 1.7, 0x655b45, x, 0.47, z, scene, true);
    for (let i = 0; i < 5; i++) {
      const stemZ = z - 0.65 + i * 0.32;
      cylinder(0.025, 0.025, 0.38, 0x62826a, x, 0.65, stemZ);
      sphere(0.11, i % 2 ? 0xe9bd87 : 0xf2e2bc, x, 0.85, stemZ, scene, 6);
    }
  }
  for (let i = 0; i < 4; i++) {
    const x = -11 + i * 0.85, z = -12;
    for (const wheelX of [-0.32, 0.32]) {
      mesh(new THREE.TorusGeometry(0.28, 0.035, 5, 14), mat(0x405c56), [x + wheelX, 0.39, z]);
    }
    const frame = mesh(new THREE.TorusGeometry(0.26, 0.025, 4, 3), mat(i % 2 ? 0xbe8267 : 0x5a8a86), [x, 0.58, z]);
    frame.rotation.z = Math.PI / 2;
    box(0.2, 0.055, 0.12, 0x4a5045, x + 0.1, 0.91, z, scene, true);
  }
  for (const x of [-4, 4]) for (const z of [21, 24]) {
    box(0.17, 2.8, 0.17, 0xb29c75, x, 1.4, z);
  }
  for (let i = 0; i < 12; i++) box(0.16, 0.16, 3.8, 0xc9b18b, -4.3 + i * 0.78, 2.85, 22.5);
  sign("CAMPUS · EXPLORE & CONNECT", 4.5, 0.44, 0, 2.5, 24.12, "#416f64");
  for (let i = 0; i < 18; i++) {
    const x = 17.6 + (i % 6) * 2.9, z = 8.8 + Math.floor(i / 6) * 1.6;
    cylinder(0.3, 0.34, 0.08, 0xe4dcc7, x, 0.08, z, scene, 6);
  }
  // Discovery Day dressing belongs on existing building faces, clear of walking routes.
  sign("ENGLISH DISCOVERY DAY",7.4,.55,0,3.15,-6.94,"#315845");
  sign("READ · SHARE · DISCOVER",3.7,.4,-7,2.15,-3.39,"#5d6d48");
  for(const x of [-3,-1.5,0,1.5,3]) {
    const pennant=new THREE.Shape();pennant.moveTo(-.2,0);pennant.lineTo(.2,0);pennant.lineTo(0,-.35);pennant.closePath();
    mesh(new THREE.ShapeGeometry(pennant),mat(x%3 ? 0xd8bb77:0xa45e45),[x,2.75,-6.9]);
  }
  for(const x of [-10,-8,-6]) {
    box(.55,.08,.4,0x527453,x,.55,-3.3,scene,true);
    box(.5,.07,.35,0xe4d9ba,x+.02,.63,-3.3,scene,true);
    box(.52,.07,.37,0xa96f49,x-.02,.71,-3.3,scene,true);
  }
  // Batch static meshes by material. Architecture keeps its geometry detail while
  // avoiding a separate GPU draw for every tile, frame, branch and flowerpot.
  const protectedObjects = new Set<THREE.Object3D>([
    ...characterGroups,
    ...butterflies,
    ...ripples,
    ...Object.values(npcMarkers),
    flag,
    selection,
    destination,
    floor,
  ]);
  const buckets = new Map<string, THREE.Mesh[]>();
  scene.updateMatrixWorld(true);
  scene.traverse((object) => {
    if (
      !(object instanceof THREE.Mesh) ||
      object instanceof THREE.InstancedMesh ||
      Array.isArray(object.material)
    )
      return;
    let ancestor: THREE.Object3D | null = object;
    while (ancestor) {
      if (protectedObjects.has(ancestor)) return;
      ancestor = ancestor.parent;
    }
    const key = `${object.material.uuid}/${object.castShadow}/${object.receiveShadow}`;
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key)!.push(object);
  });
  for (const batch of buckets.values()) {
    if (batch.length < 2) continue;
    const prepared = batch.map((object) => {
      const cloned = object.geometry.clone();
      const geometry = cloned.index ? cloned.toNonIndexed() : cloned;
      if (geometry !== cloned) cloned.dispose();
      return geometry.applyMatrix4(object.matrixWorld);
    });
    const merged = mergeGeometries(prepared, false);
    prepared.forEach((g) => g.dispose());
    if (!merged) continue;
    const result = new THREE.Mesh(merged, batch[0].material);
    result.castShadow = batch[0].castShadow;
    result.receiveShadow = batch[0].receiveShadow;
    scene.add(result);
    batch.forEach((object) => {
      object.removeFromParent();
      object.geometry.dispose();
    });
  }
  return {
    floor,
    player,
    npcs,
    selection,
    destination,
    flag,
    leafDetail,
    grassDetail,
    litter,
    windUniform,
    ripples,
    motes,
    butterflies,
    npcMarkers,
  };
}
