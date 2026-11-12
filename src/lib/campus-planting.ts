import * as THREE from "three";
import { seededRandom } from "./campus-surfaces";

// Clumps follow the edges of the lawn so the paths and their collision map stay clear.
export function addCampusGrass(scene: THREE.Scene, wind: { value: number }) {
  const random = seededRandom(31994);
  const strips = [
    [-8.9, 9.8, 5.1, 1.45], [8.9, 9.8, 5.1, 1.45],
    [-12.75, 3.8, 1.0, 8.0], [12.75, 3.8, 1.0, 8.0],
    [-9, 12.75, 4.5, 3.5], [9, 12.75, 4.5, 3.5],
    [-12.65, -7.3, 1.1, 6], [12.65, -7.3, 1.1, 5],
    [-8.7, 24, 3.3, 7.8], [8.7, 24, 3.3, 7.8],
  ];
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute([
    -0.11, 0, 0, 0.11, 0, 0, -0.09, 0.39, -0.03, 0.07, 0.42, -0.04,
    -0.04, 0.73, -0.14, 0.045, 0.75, -0.16, 0, 1, -0.34,
  ], 3));
  geometry.setIndex([0, 1, 2, 1, 3, 2, 2, 3, 4, 3, 5, 4, 4, 5, 6]);
  geometry.computeVertexNormals();
  const tones = [0.42, 0.42, 0.69, 0.74, 0.95, 0.93, 1];
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(tones.flatMap((v) => [v, v, v * 0.9]), 3));
  const material = new THREE.MeshStandardMaterial({
    vertexColors: true, side: THREE.DoubleSide, roughness: 1,
    emissive: 0x263016, emissiveIntensity: 0.3,
  });
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uGrassWind = wind;
    shader.vertexShader = "uniform float uGrassWind;\n" + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace(
      "#include <begin_vertex>",
      `#include <begin_vertex>
       float wave = sin(uGrassWind * 2.2 + instanceMatrix[3].x * 1.6 + instanceMatrix[3].z * 1.1);
       transformed.z += wave * .24 * position.y * position.y;`,
    );
  };
  const tuftsPerStrip = 250;
  const bladesPerTuft = 5;
  const grass = new THREE.InstancedMesh(geometry, material, strips.length * tuftsPerStrip * bladesPerTuft);
  grass.receiveShadow = true;
  const blade = new THREE.Object3D();
  const tint = new THREE.Color();
  let index = 0;
  for (const [x, z, width, depth] of strips) {
    for (let i = 0; i < tuftsPerStrip; i++) {
      const angle = random() * Math.PI * 2;
      const radius = Math.sqrt(random());
      const rim = 0.86 + Math.sin(angle * 3 + x) * 0.12;
      const dx = Math.cos(angle) * radius * rim;
      const dz = Math.sin(angle) * radius * rim;
      const tall = 0.055 + 0.22 * random() * (1 - radius * 0.72);
      const tuftX = x + dx * width / 2;
      const tuftZ = z + dz * depth / 2;
      const moss = random() > 0.83 ? 0xb5a25d : random() > 0.5 ? 0x819c50 : 0x5b7d3c;
      for (let j = 0; j < bladesPerTuft; j++) {
        blade.position.set(tuftX + (random() - 0.5) * 0.22, -0.024, tuftZ + (random() - 0.5) * 0.22);
        blade.rotation.set(0, random() * Math.PI * 2, (random() - 0.5) * 0.24);
        blade.scale.set(0.11 + random() * 0.13, tall * (0.7 + random() * 0.65), tall);
        blade.updateMatrix();
        grass.setMatrixAt(index, blade.matrix);
        tint.setHex(moss).multiplyScalar(0.74 + random() * 0.38);
        grass.setColorAt(index++, tint);
      }
    }
  }
  scene.add(grass);
  return grass;
}
