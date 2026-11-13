# Expanded cadet campus

The approved character proportions are concept 01 in `public/concepts/expanded-campus-v1/01-characters.png`. This implementation uses actual Three.js meshes in the playable world. Concept rasters remain reference images, not geometry or in-game backgrounds.

## Character and vegetation

- Replaced the compressed-body / enlarged-head rig with approximately five-head proportions. Existing articulated shoulder, elbow, hip and knee API remains compatible with gardening, housekeeping and classroom poses.
- Face is a continuous sculpted loft with jaw, cheeks, sockets and nose. Hair is a swept, continuous shell; fingers, boot laces, pockets, collar tabs, cap seams and canvas equipment remain three-dimensional. Mouth keeps a stable smile.
- Geometry at each animated pivot is combined into painted and woven surfaces to reduce draw calls without removing joints.
- Character study at `/character-study` displays the same character factory with full-body / portrait framing and idle, gesture and walk controls.
- Trees use tapering curved branches, root flares and instanced individual leaves. Broadleaf, flowering, areca palm and bamboo silhouettes replace opaque polygonal crowns. Reduced-motion mode stops foliage wind.

## Plan

Playable bounds: x −42…76, z −58…52, 12,980 m² versus the previous 4,320 m². The original campus, room IDs, farm positions, saved physical work and English mission progression remain compatible. Four new districts bring the atlas to 14 destinations:

| District | Contents | Direct practice |
| --- | --- | --- |
| Animal care | Four separate chicken, goat, pig and duck pens; shelters, troughs, water bowls, egg nests, hay, feed sacks, tool shed, washing point and wheelbarrow | Scatter grain; chickens peck while food travels into the pen |
| Training ground | Paired tyres, supported balance beam, knotted rope net, low wall, pull-up bars, cones, rest shelter and drinking station | Hold to cross the actual beam, with arms extended and feet raised onto the beam; either end supports a return crossing |
| Swimming pool | Four lanes, floor markings, float ropes, coping, ladders, drains, depth signs, rescue equipment, changing rooms and showers | Throw a life ring from the dry deck into the practice lane |
| Fish pond | Production pond, feeding deck with rails, feed shed, nets, bins, aerator and reeds | Sprinkle food; fish gather near the deck |

New practice is repeatable local exploration. It does not award XP or claim a graded learning result. Each station shows an English instruction and a contextual sentence. Existing garden, housekeeping and academy activities retain their scoring and saved progress.

## Interaction and cancellation

Use the atlas to travel to a district, then click an English practice label to walk to its marked spot. Hold the action button or E to perform the action. Releasing early, losing focus, switching activity or hiding the page cancels. An interrupted balance crossing restores the safe starting point. Pens and water surfaces remain solid navigation obstacles; no cadet enters water in uniform.

## Shared spatial data and audit

`campus-districts-layout.ts` owns new footprints, paths, trees, practice points and district areas. Rendering, atlas and navigation consume this data. Collision broad-phase uses four-metre cells and is checked against exhaustive footprint collision. The old inner perimeter fence is removed and a new outer boundary follows the enlarged campus. Minimap opens the full atlas rather than stacking overlapping tiny travel buttons.

The layout audit checks all 1,332 directed routes between 37 destinations, including existing work stations and both beam ends. The initial audit found a cone on the beam exit; cones were moved into a separate shared row and the audit rerun. Current machine-readable evidence is `docs/campus-layout-audit.json`.

## Verification on 2026-11-13

- Typecheck, ESLint and production build pass. The Node test suite passes all 30 tests.
- Exhaustive route audit passes 1,332 directed routes. Broad-phase collision is compared with all footprints at 6,000 sampled positions and obstacle-cell boundaries.
- Actual browser: completed chicken feeding, keyboard fish feeding, a rescue throw, and balance crossings in both directions. Early release cancels feeding; an interrupted balance crossing restores the same starting x/z. The character arrives at z −47 and returns to z −38.5 on the reverse crossing.
- The final mobile pool replay confirms that the thrown ring stays floating after completion. English instructions, contextual sentence, Listen and the hold action fit the 390 × 844 viewport. Desktop gameplay was inspected at 1280 × 720, the character study at 1440 × 900, and the user's live game at 744 × 872.
- No browser console warnings/errors in the final practice run. Existing visible progress remains level 3, 330 XP, main mission 2/6, activities 3/3; exploration practice does not change it.
- Screenshot evidence is in `docs/previews/expanded-*.png`. Source and verification are local; this change has not been pushed or deployed.

The final overview audit also caught far-plane clipping when switching from portrait to landscape. The camera now has sufficient depth range, recomputes campus framing on resize and keeps the complete campus clear of overview fog. Practice prompts hide during overview. The spherical background hills were replaced with one continuous rolling terrain ridge.
