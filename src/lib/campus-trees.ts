import * as THREE from "three";
import { seededRandom } from "./campus-surfaces";

type Spray = { position: THREE.Vector3; radius: THREE.Vector3; color: number; density: number };
const up = new THREE.Vector3(0, 1, 0);

export function createCampusTrees(
  scene: THREE.Scene,
  bark: THREE.MeshStandardMaterial,
  wind: { value: number },
) {
  const sprays: Spray[] = [];
  const foliage = new THREE.MeshStandardMaterial({ roughness: 0.95 });
  const tube = (from: THREE.Vector3, to: THREE.Vector3, base: number, tip: number) => {
    const axis = to.clone().sub(from);
    const branch = new THREE.Mesh(new THREE.CylinderGeometry(tip, base, axis.length(), 8), bark);
    branch.position.copy(from).lerp(to, 0.5);
    branch.quaternion.setFromUnitVectors(up, axis.normalize());
    branch.castShadow = branch.receiveShadow = true;
    scene.add(branch);
  };

  function add(x: number, z: number, scale: number, flowering: boolean) {
    const random = seededRandom(Math.floor((x + 101) * 241 + (z + 103) * 601));
    const distance = Math.hypot(x, z);
    const near = distance < 40;
    const trunk = new THREE.Vector3(x, 0.02, z);
    const fork = new THREE.Vector3(x + (random() - 0.5) * 0.3, 1.63 * scale, z);
    tube(trunk, fork, 0.19 * scale, 0.09 * scale);
    const colors = flowering
      ? [0xc66436, 0xd58748, 0xaa5939, 0xd4a450, 0x78844a]
      : [0x496632, 0x607a38, 0x758d42, 0x435e34, 0x8d9c4d];
    const count = near ? 9 : 5;
    for (let i = 0; i < count; i++) {
      const angle = i * 2.399 + random() * 0.65;
      const reach = i ? 0.45 + random() * 0.75 : 0;
      const center = new THREE.Vector3(
        fork.x + Math.cos(angle) * reach * scale,
        (i ? 2.0 + random() * 0.73 : 3.08) * scale,
        fork.z + Math.sin(angle) * reach * scale,
      );
      const spread = (0.5 + random() * 0.35) * scale * (near ? 1 : 1.28);
      const radius = new THREE.Vector3(spread, spread * (0.61 + random() * 0.29), spread * (0.81 + random() * 0.31));
      if (i < 6) tube(fork, center, 0.072 * scale, 0.016 * scale);

      // An irregular opaque core catches the broad light and shadows. Loose leaves break up its edge.
      const geo = new THREE.IcosahedronGeometry(1, near ? 2 : 1);
      const pos = geo.attributes.position;
      for (let j = 0; j < pos.count; j++) {
        const vx = pos.getX(j), vy = pos.getY(j), vz = pos.getZ(j);
        const warp = 0.91 + 0.115 * Math.sin(vx * 8 + vy * 10 + vz * 7 + i);
        pos.setXYZ(j, vx * warp, vy * warp, vz * warp);
      }
      geo.computeVertexNormals();
      const tint = new THREE.Color(colors[i % colors.length]);
      const canopyColor = new Float32Array(pos.count * 3);
      for (let j = 0; j < pos.count; j++) {
        const variation = 0.75 + pos.getY(j) * 0.24 + Math.sin(pos.getX(j) * 22 + pos.getZ(j) * 16) * 0.08;
        const i = j * 3;
        canopyColor[i] = tint.r * variation;
        canopyColor[i + 1] = tint.g * variation;
        canopyColor[i + 2] = tint.b * variation;
      }
      geo.setAttribute("color", new THREE.BufferAttribute(canopyColor, 3));
      const core = new THREE.Mesh(geo, foliage);
      core.position.copy(center);
      core.scale.copy(radius);
      core.castShadow = near;
      core.receiveShadow = true;
      scene.add(core);
      if (distance < 46) {
        sprays.push({ position: center, radius, color: colors[i % colors.length], density: near ? 135 : 55 });
      }
    }
  }

  foliage.vertexColors = true;
  function finish() {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute([
      0, -0.57, 0, -0.29, -0.04, 0, -0.18, 0.28, -0.04, 0, 0.57, 0,
      0.19, 0.23, -0.045, 0.29, -0.07, 0, 0, 0.04, 0.12,
    ], 3));
    geo.setIndex([0, 6, 1, 1, 6, 2, 2, 6, 3, 3, 6, 4, 4, 6, 5, 5, 6, 0]);
    geo.computeVertexNormals();
    const leafMaterial = new THREE.MeshStandardMaterial({
      side: THREE.DoubleSide, roughness: 0.88, emissive: 0x253317, emissiveIntensity: 0.26,
    });
    leafMaterial.onBeforeCompile = (shader) => {
      shader.uniforms.uCampusLeafWind = wind;
      shader.vertexShader = "uniform float uCampusLeafWind;\n" + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace(
        "#include <begin_vertex>",
        "#include <begin_vertex>\ntransformed.z += sin(uCampusLeafWind * 1.35 + instanceMatrix[3].x * .71 + instanceMatrix[3].z * .45) * (.14 + position.y * .19);",
      );
    };
    const leaves = new THREE.InstancedMesh(geo, leafMaterial, sprays.reduce((n, spray) => n + spray.density, 0));
    leaves.receiveShadow = true;
    const random = seededRandom(10971);
    const leaf = new THREE.Object3D();
    const color = new THREE.Color();
    let index = 0;
    for (const { position, radius, density, color: tint } of sprays) {
      for (let i = 0; i < density; i++) {
        const height = random() * 2 - 1;
        const angle = random() * Math.PI * 2;
        const lateral = Math.sqrt(1 - height * height);
        const span = 0.85 + random() * 0.46;
        leaf.position.set(
          position.x + radius.x * Math.cos(angle) * lateral * span,
          position.y + radius.y * height * span,
          position.z + radius.z * Math.sin(angle) * lateral * span,
        );
        leaf.rotation.set((random() - 0.5) * 2.8, angle, (random() - 0.5) * 2.5);
        leaf.scale.setScalar((0.21 + random() * 0.24) * Math.sqrt(radius.x));
        leaf.updateMatrix();
        leaves.setMatrixAt(index, leaf.matrix);
        color.setHex(tint).multiplyScalar(0.56 + random() * 0.66 + Math.max(0, height) * 0.31);
        leaves.setColorAt(index++, color);
      }
    }
    scene.add(leaves);
    return leaves;
  }
  return { add, finish };
}
