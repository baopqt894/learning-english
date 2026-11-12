import test from "node:test";
import assert from "node:assert/strict";
import {
  MAP_BOUNDS,
  EXPLORATION_ZONES,
  MAP_OBSTACLES,
  EXPANSION_BUILDINGS,
  isOpenRoom,
  canWalkCampus,
  canWalkSegment,
  findCampusPath,
} from "../src/lib/campus-map.ts";

test("expanded map gives approximately eight times the previous travel area", () => {
  const area =
    (MAP_BOUNDS.maxX - MAP_BOUNDS.minX) * (MAP_BOUNDS.maxZ - MAP_BOUNDS.minZ);
  assert.ok(area / (25 * 20.6) > 8);
  assert.equal(canWalkCampus(35, 29), true);
  assert.equal(canWalkCampus(37, 0), false);
  for (const b of MAP_OBSTACLES) assert.equal(canWalkCampus(b.x, b.z), false);
});

test("rooms have a walkable doorway and centre aisle, solid walls and furniture", () => {
  for (const b of EXPANSION_BUILDINGS.filter(isOpenRoom)) {
    const outside = { x: b.x, z: b.z + b.d / 2 + 1 };
    const inside = { x: b.x, z: b.z };
    assert.ok(canWalkSegment(outside, inside), b.name);
    assert.equal(canWalkCampus(b.x + b.w / 2, b.z), false, `${b.name} wall`);
    assert.equal(
      canWalkCampus(b.x, b.z - b.d / 2),
      false,
      `${b.name} rear wall`,
    );
  }
});
test("every new district and existing NPC can be reached from every other destination", () => {
  const points = [
    { x: 0, z: 6 },
    { x: -1, z: 4 },
    { x: -6, z: -1 },
    { x: 6, z: 2 },
    ...EXPLORATION_ZONES.map((z) => ({ x: z.x, z: z.z })),
  ];
  for (const from of points)
    for (const to of points) {
      const path = findCampusPath(from, to);
      assert.ok(path.length, `${JSON.stringify(from)} → ${JSON.stringify(to)}`);
      let previous = from;
      for (const point of path) {
        assert.ok(canWalkSegment(previous, point));
        previous = point;
      }
      assert.deepEqual(path.at(-1), to);
    }
});
test("routes go around the main school building and reject blocked targets", () => {
  const from = { x: 0, z: 6 },
    to = { x: 0, z: -18 };
  assert.equal(canWalkSegment(from, to), false);
  assert.ok(findCampusPath(from, to).length > 1);
  assert.deepEqual(findCampusPath(from, { x: 0, z: -8.6 }), []);
  assert.deepEqual(findCampusPath(from, { x: 100, z: 0 }), []);
});

test("navigation can leave a valid fractional position beside furniture", () => {
  const from = { x: 22.51, z: -23 },
    to = { x: 0, z: 6 };
  assert.ok(canWalkCampus(from.x, from.z));
  const path = findCampusPath(from, to);
  assert.ok(path.length);
  let previous = from;
  for (const step of path) {
    assert.ok(canWalkSegment(previous, step));
    previous = step;
  }
  assert.deepEqual(path.at(-1), to);
});
