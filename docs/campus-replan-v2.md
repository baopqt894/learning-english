# Campus circulation, buildings and productive garden

The campus is organised around a western residential street, two learning streets, a central courtyard, an eastern service spine and a southern production loop. The 34 shared path rectangles render identically in the 3D scene and atlas. Classroom/computer-lab entrances, dormitory thresholds, dining/hall entrances and the farm gate have short connecting paths. The computer and language blocks are realigned to keep their approach paths clear. The previous hardcoded avenues that continued through expanded buildings and the football pitch are removed.

Every path belongs to one connected circulation network, including the courtyard. The layout audit now rejects roads crossing any building footprint, the football pitch or a crop bed, in addition to checking building pairs, trees, work approaches, door clearances and all 1,332 destination-to-destination routes.

## Buildings

Enterable buildings have complete opaque pitched roofs with individual curved tiles, ridge caps, eaves, gutters, downpipes, front signs, glazed windows and an open timber doorway. The exterior shell is independently batched by finish, so it can be hidden without rebuilding the scene. Low cutaway walls and existing furniture stay inside it.

The default exterior view shows all roofs. Only the room occupied by the actual player opens. Crossing a doorway reveals the interior; walking out restores its exterior. A small entry/exit hysteresis prevents rapid roof flicker at thresholds. Campus overview closes every shell. Existing furniture, practical work and saved mission data stay intact. The shell does not add invisible collision walls across the open doorway.

## Productive garden

The garden retains its fenced 479-square-unit district, water point, potting shed, nursery, rear climbers, storage and saved three-bed task IDs. Its internal layout is rebuilt as three larger 3.8 × 4.6 m interactive beds, three 3.8 × 5.8 m production beds and two rear seedling beds. Productive soil occupies about 135.28 square units. The main beds have 1.7 m side aisles, a cross aisle and a western service aisle connecting the shed and relocated harvest table. The compost bin is moved away from the working approaches. No plot is a miniature decorative planter.

Each interactive bed now contains 28 plants/seeds distributed across seven rows. Production crops fill their actual bed dimensions rather than remaining in a tiny central cluster. Raised brick edges and soil ridges derive from the same footprints as navigation and picking. Planting, watering, growth and harvesting still operate directly in 3D and preserve all existing saved bed stages. Tool and watering targets use the near edge of the enlarged bed, preventing the old centre target from stretching the action several metres away.

## Shadows

The previous 250 ms shadow refresh caused obvious stale silhouettes while the sun's target followed the player. Shadows now update in the same render frame as movement, joints and the light target. A 1024-square filtered shadow map keeps the local detail while limiting the extra per-frame GPU cost. The existing quality setting can still disable shadow maps on slower devices. Geometry is batched by material, including the new exterior shells.

## Validation

The full suite includes actual geometry ray tests for roof coverage and an open doorway, threshold hysteresis, a connected-road graph, protected-area overlap checks, original gameplay and save compatibility. The independent layout report is `campus-layout-audit.json`. Browser verification checks exterior/occupied-room states, real travel, the garden and frame-rate diagnostics rather than relying on build output alone.

Final checks: 39 tests passed, TypeScript/ESLint and production build passed; the 1,332-route independent audit passed with no layout failures. Real-browser travel reached Classroom A1 and Computer Lab, with only the occupied room revealed. Computer monitors remain visible inside and the adjacent language room stays roofed. The garden overview shows the new long beds with saved day-2 / three-basket completion. Observed frame-rate diagnostics were 55–60 FPS during the desktop check, with 60 FPS at the garden and inside the computer lab; this is a local observation, not a cross-device performance guarantee. Browser error/warning logs were empty after the final reload.
