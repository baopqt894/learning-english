import * as THREE from "three";
import { seededRandom } from "./campus-surfaces";

type Roof = { x: number; y: number; z: number; width: number; run: number; rise: number; color: number; metal: boolean };

function curvedTile(metal: boolean) {
  const positions: number[] = [];
  const indices: number[] = [];
  const uv: number[] = [];
  const segments = 8;
  for (let row = 0; row <= 1; row++) {
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const arc = metal ? Math.pow(Math.abs(t * 2 - 1), 7) * 0.052 : Math.sin(t * Math.PI) * (row ? 0.067 : 0.047);
      positions.push(t - 0.5, arc, row - 0.5);
      uv.push(t, row);
      if (row && i) {
        const a = i - 1;
        const b = i + segments;
        indices.push(a, b + 1, a + 1, a, b, b + 1);
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

/** Each tile has curved geometry and individual firing/weathering variation. */
export function addCampusRoofs(scene: THREE.Scene, roofs: Roof[], clay: THREE.MeshStandardMaterial) {
  const random = seededRandom(32019);
  for (const metal of [false, true]) {
    const panels = roofs.filter((roof) => roof.metal === metal);
    const layouts = panels.map((roof) => {
      const length = Math.hypot(roof.run, roof.rise);
      const columns = Math.ceil(roof.width / (metal ? 0.29 : 0.245));
      const rows = metal ? 1 : Math.ceil(length / 0.39);
      return { roof, length, columns, rows };
    });
    const total = layouts.reduce((count, { columns, rows }) => count + columns * rows * 2, 0);
    if (!total) continue;
    const finish = metal ? new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.52, metalness: 0.35 }) : clay;
    const sheets = new THREE.InstancedMesh(curvedTile(metal), finish, total);
    const tile = new THREE.Object3D();
    const color = new THREE.Color();
    let index = 0;
    for (const { roof, length, columns, rows } of layouts) {
      const width = roof.width / columns;
      const span = length / rows;
      const pitch = Math.atan2(roof.rise, roof.run);
      for (const side of [-1, 1]) {
        tile.rotation.set(side * pitch, 0, 0);
        for (let row = 0; row < rows; row++) {
          const fraction = (row + 0.5) / rows;
          for (let col = 0; col < columns; col++) {
            tile.position.set(
              roof.x - roof.width / 2 + (col + 0.5) * width,
              roof.y + roof.rise * (1 - fraction) + 0.026,
              roof.z + side * roof.run * fraction,
            );
            tile.scale.set(width * 0.99, 1, span * (metal ? 1.01 : 1.04));
            tile.updateMatrix();
            sheets.setMatrixAt(index, tile.matrix);
            color.setHex(roof.color).multiplyScalar(0.79 + random() * 0.38 + Math.sin(col * 1.1 + row * 0.65) * 0.06);
            sheets.setColorAt(index++, color);
          }
        }
      }
    }
    sheets.castShadow = sheets.receiveShadow = true;
    scene.add(sheets);
  }
}
