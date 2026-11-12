import * as THREE from "three";

export function seededRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

type Finish = "stucco" | "stone" | "pavers" | "turf" | "bark" | "clay";
const size = 256;

function wrappedNoise(seed: number, resolution: number) {
  const random = seededRandom(seed);
  const cells = Float32Array.from({ length: resolution ** 2 }, random);
  const get = (x: number, y: number) => cells[(y % resolution) * resolution + (x % resolution)];
  return (u: number, v: number) => {
    const x = u * resolution;
    const y = v * resolution;
    const col = Math.floor(x);
    const row = Math.floor(y);
    const smooth = (t: number) => t * t * (3 - 2 * t);
    const tx = smooth(x - col);
    const ty = smooth(y - row);
    return THREE.MathUtils.lerp(
      THREE.MathUtils.lerp(get(col, row), get(col + 1, row), tx),
      THREE.MathUtils.lerp(get(col, row + 1), get(col + 1, row + 1), tx),
      ty,
    );
  };
}

function texture(colorSpace: string) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const context = canvas.getContext("2d")!;
  const pixels = context.createImageData(size, size);
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = colorSpace;
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.anisotropy = 4;
  return { map, pixels, commit: () => context.putImageData(pixels, 0, 0) };
}

function finishMaps(finish: Finish) {
  const seed = finish.charCodeAt(0);
  const random = seededRandom(seed);
  const broad = wrappedNoise(seed + 11, 5);
  const detail = wrappedNoise(seed + 67, 27);
  const tone = texture(THREE.SRGBColorSpace);
  const bump = texture(THREE.NoColorSpace);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size;
      const v = y / size;
      const cloud = broad(u, v);
      const grain = detail(u, v);
      const speck = random();
      let value = 221 + 17 * cloud + 12 * grain + 8 * speck;
      let relief = 109 + 34 * grain + 30 * speck;
      if (finish === "pavers") {
        const course = v * 4;
        const offset = Math.floor(course) % 2 ? 0.5 : 0;
        const across = (u * 4 + offset) % 1;
        const down = course % 1;
        const joint = Math.min(across, 1 - across, down, 1 - down);
        const edge = THREE.MathUtils.smoothstep(joint, 0.011, 0.036);
        const slab = broad(Math.floor(u * 8) / 8, Math.floor(v * 4) / 4);
        value = 132 + edge * (66 + 29 * slab + 16 * grain + 9 * speck);
        relief = 39 + edge * (144 + 18 * grain + 14 * speck);
      } else if (finish === "turf") {
        value = 178 + cloud * 42 + grain * 22 + speck * 15;
        relief = 80 + grain * 35 + speck * 72;
      } else if (finish === "bark") {
        const groove = Math.sin(u * Math.PI * 22 + broad(u, v) * 5);
        value = 164 + groove * 27 + grain * 24 + speck * 17;
        relief = 110 + groove * 48 + grain * 27;
      } else if (finish === "clay") {
        value = 199 + 28 * cloud + 16 * grain + 9 * speck;
      } else if (finish === "stone") {
        value = 190 + 31 * cloud + 20 * grain + 15 * speck;
      }
      const i = (y * size + x) * 4;
      for (let c = 0; c < 3; c++) {
        tone.pixels.data[i + c] = value;
        bump.pixels.data[i + c] = relief;
      }
      tone.pixels.data[i + 3] = bump.pixels.data[i + 3] = 255;
    }
  }
  tone.commit();
  bump.commit();
  return { map: tone.map, bumpMap: bump.map };
}

export function createCampusSurfaces() {
  const finishes = new Map<Finish, ReturnType<typeof finishMaps>>();
  const materials = new Map<string, THREE.MeshStandardMaterial>();
  const heights: Record<Finish, number> = {
    stucco: 0.035, stone: 0.04, pavers: 0.085, turf: 0.045, bark: 0.065, clay: 0.025,
  };
  return (finish: Finish, color: number) => {
    const key = `${finish}/${color}`;
    const cached = materials.get(key);
    if (cached) return cached;
    let maps = finishes.get(finish);
    if (!maps) {
      maps = finishMaps(finish);
      finishes.set(finish, maps);
    }
    const surface = new THREE.MeshStandardMaterial({
      color,
      ...maps,
      roughness: finish === "clay" ? 0.76 : 0.94,
      bumpScale: heights[finish],
    });
    materials.set(key, surface);
    return surface;
  };
}

/** Preserve material scale across differently sized paths and building walls. */
export function worldAlignedUV(geometry: THREE.BufferGeometry, origin: THREE.Vector3, scale: number) {
  const position = geometry.attributes.position;
  const normal = geometry.attributes.normal;
  const uv = geometry.attributes.uv;
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i) + origin.x;
    const y = position.getY(i) + origin.y;
    const z = position.getZ(i) + origin.z;
    const vertical = Math.abs(normal.getY(i)) < 0.5;
    const side = Math.abs(normal.getX(i)) > 0.5;
    uv.setXY(i, (vertical && side ? z : x) / scale, (vertical ? y : z) / scale);
  }
}

export function createContactMaterial() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 64;
  const ctx = canvas.getContext("2d")!;
  const fade = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  fade.addColorStop(0, "rgba(22,29,18,.63)");
  fade.addColorStop(0.38, "rgba(22,29,18,.46)");
  fade.addColorStop(0.7, "rgba(22,29,18,.15)");
  fade.addColorStop(1, "rgba(22,29,18,0)");
  ctx.fillStyle = fade;
  ctx.fillRect(0, 0, 64, 64);
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  return new THREE.MeshBasicMaterial({ map, transparent: true, depthWrite: false, opacity: 0.84, polygonOffset: true, polygonOffsetFactor: -2 });
}
