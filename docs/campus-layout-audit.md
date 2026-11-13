# Current campus and learning audit

The expanded layout provides 22,776 square units of playable space. Classroom A1/A2 each have 150 square units; Dormitory B has 120; the multipurpose hall has 280. The enlarged vegetable garden has 478.97 square units. Characters keep their approved proportions.

All 1,722 directed routes between 42 named destinations pass, including the 12 physical-work stations, four district practices and both ends of the balance beam. The layout contains 260 solid footprints and 110 trees. Its 36 circulation paths form one connected network and do not cross buildings, the sports pitch or crop beds. The garden contains eight larger beds with about 135.28 square units of productive soil. Room, pond, pen and farm geometry shares coordinates with navigation and the atlas. Building footprints are checked pairwise for overlap; the main school was moved north to keep its enlarged roof and the library apart.

See `campus-replan-v2.md` for complete roofs, occupied-room reveal, frame-synchronised shadows and the new garden plan. See `campus-layout-audit.json` for current results and `discovery-day-campaign.md` for the ten-chapter learning flow. The older farm-specific audit notes below are historical references; their former campus-wide counts and coordinates have been superseded.

---

# Campus layout audit — concept garden revision

The current garden layout follows the [approved concept](previews/farm-concept-reference.png). See [the implementation report](farm-concept-implementation.md) for the scene, interactions and browser evidence.

## Current verification

Run `node scripts/audit-campus-layout.mjs`. The generated [JSON report](campus-layout-audit.json) records the result.

| Check | Result |
| --- | --- |
| Named destinations | 28, including district waypoints, NPC approaches, 12 work stations and two shed access points |
| Ordered routes | 756 passed, each segment checked against collision footprints |
| Solid footprints | 161 in the campus; 29 in the garden |
| Garden footprint | 17.8 × 9.1 m; 161.98 m² |
| Training-bed spacing | 1.2 m between adjacent plots; 1.65 m central service path |
| Entrance | 3.2 m nominal opening; 0.4 m cap clearance under the plaque |
| Test suite | 27 passed, with TypeScript, ESLint and production build passing |

The farm is separate from the sports pitch, reading garden and school buildings. Functional farm fixtures are within its boundary and do not overlap. Rendering, collision, station approaches and minimap share `src/lib/campus-spaces.ts`. The shed is open at the front: its walls, shelves, counter and posts have individual footprints instead of one solid building box.

## Findings fixed

- The former garden occupied the reading pavilion area. It now has its own southeast enclosure and gate.
- Gate leaves opening into the new shed aisle blocked navigation. They now fold flat against the fencing, and the entrance-to-interior route is covered by a regression assertion.
- A flowering tree obscured the entrance plaque from the work camera. It moved farther toward the reading-garden edge.
- Static planters, benches, fences, trunks, bike rack, bleachers, fountain, flag base and goal posts/net have collision footprints. Reading benches and flower beds are separated; pergola beams clear the pavilion roof; stray stones were removed from the playing field.
- The minimap pitch, garden, trees and flag marker were aligned to the 3D scene. New shed, nursery, beds, climbers and water points also use the shared layout.
- Garden area detection uses its boundary so the far end retains the correct district name and activity shortcut.
- The atlas fills its available width and stacks above the destination list below 1000 px. Pin labels appear on hover/focus instead of overlapping permanently.

The audit covers functional object footprints, farm separation, clearances and routes. Decorative foliage and grass are not collision objects; visibility is also inspected in the rendered scene. It does not simulate agricultural production or structural engineering.
