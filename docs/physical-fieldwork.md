# Physical fieldwork in the 3D campus

Garden and dormitory practice now operate on live Three.js objects in the existing campus. The old multiple-choice garden/duty rounds remain as authored data for compatibility, but their Start buttons enter physical practice. The classroom challenge is still an English comprehension assessment, taken after travelling to Classroom A1; the actor walks to a chair and sits at an open book while the questions occupy the screen edge.

## Player loop

1. Open Cadet activities and enter 3D practice. The character walks to the next work position through the campus navigation system.
2. Click a work object directly, or use its Walk to button. A ground ring identifies the required standing position. Tasks cannot execute from another part of the map.
3. Equip the appropriate tool. Tools appear in the character's hand, anchored to the articulated arm. Hands are available for folding, carrying books and advancing the growing day.
4. Hold the action button, or focus it and hold Space/Enter. Releasing, losing pointer capture, blurring the window, hiding the tab, changing tools, leaving the activity or opening a blocking overlay cancels the unfinished action. A completed action is committed once.
5. The object changes, progress is saved immediately, and the instruction moves to the next target. There is no automatic completion from choosing a tool.
6. At the work board, submit an English report. A model sentence is optional. Physical completion and the report are both required for the practical badge. Rewards are still awarded only once.

## Garden

The garden is now a separate southeast production district, reached through its western gate rather than occupying the reading pavilion area. Three reserve beds, tool rack, water/compost bay and a harvest table surround the three interactive training beds. Rendering, station approaches, collision and minimap share `campus-spaces.ts`. See [the layout audit](campus-layout-audit.md) for dimensions, findings and route verification.

Three raised beds have soil, furrows, seed markers and twelve independently scalable vegetables each. The player loosens all three beds, sows seeds, fills a 3 L watering can at the tap, and waters each bed using 1 L. Water particles originate at the rose on the tilted can and soil darkens. The garden has a deliberate growing-day advance with scaled plant growth; real growing time is explicitly compressed rather than implying that vegetables mature immediately after watering.

The actor bends or crouches, works with the hoe, scatters seeds and tilts the can. During harvest the vegetables disappear sequentially from their individual positions, a vegetable follows an arc toward the held basket, and full baskets appear at the harvest station. The English report includes three baskets and vegetables.

## Dormitory

Dormitory B is a real open room with a walkable doorway, furniture collision, a bed frame, mattress, pillow, deformable blanket, study table and open bookshelf. Three leaf/dust groups gather toward a movable dustpan during sweeping and remain cleaned after completion.

Blanket work has three separate actions: smooth the wrinkled cloth, fold lengthwise, then fold the ends into a compact stack. The subdivided sheet changes vertex positions during each fold; its final stack matches the folded dimensions. Book work removes the table stack, attaches it to the carrying hand while travelling, and places it on the shelf at the destination. A final English report mentions the clean room, folded blanket and books put away.

## State and validation

- `src/lib/fieldwork.ts`: immutable, testable state transitions, shared station/obstacle coordinates, tool/distance/hold validation, report recognition and old-save restoration.
- `src/lib/fieldwork-scene.ts`: dynamic props, pooled particles, articulated poses, cloth deformation, harvest transfer and book carrying. Vegetables share one merged colored geometry instead of drawing every leaf separately.
- `src/components/campus-world.tsx`: raycast picking, collision-aware travel, hold lifecycle, work camera, study seating, animation and resource cleanup.
- `src/components/fieldwork-hud.tsx`: English instructions, bilingual vocabulary, equipment, progress, hold control and report form. This is an in-world HUD, not a blocking answer-choice modal.
- Optional `Progress.fieldwork` stores bed stages, water, growing day, cleaned floor mask, fold count, book location and reports. Old saves receive a fresh physical state and retain their existing XP. Completed practical work can be restarted with Practise again without duplicating rewards.

## Scope and practical limits

The existing chibi models and military school visual direction are retained. Motion is authored procedural joint animation. Cloth uses controlled geometric folds rather than a cloth-physics solver. Harvest uses an authored transfer arc, not rigid-body grasping. Growing time is a clearly labelled game time-lapse. Partial hold duration resets when interrupted; completed actions persist. Speech is optional browser synthesis and report checking uses authored English intent rules, not unrestricted language grading. Reduced motion removes particles and repetitive sways while keeping poses and state feedback. Physical practice requires WebGL; the entry point reports an unavailable 3D scene instead of silently granting progress.

## Validation

Unit coverage checks approach reachability/collision, action order, wrong tools, distance, incomplete holds, water consumption, growing day, harvest counts, fold stages, carrying/shelving, save restore, English reports and single-award rewards. Existing dialogue/map tests remain in place. Browser QA also exercises the actual rendered objects, not a test-only scene. The relocated layout has 27 passing tests and a separate 756-route audit.

Browser evidence: garden was completed through all three beds, water decreased 3→2→1→0 L, day advance produced mature plants, three harvests filled baskets, and the English report was accepted at the board. Releasing a harvest hold early left the progress unchanged. Reloading resumed the next unfinished step. Dormitory QA completed three floor areas, all three blanket stages, picking up books, clicking the shelf directly to walk there, shelving, and an accepted English report. The 390×844 layout retained visible work objects and usable hold controls. Tests currently cover 27 scenarios across the original dialogue/navigation and new activities/fieldwork.

Classroom QA: the challenge entry stayed disabled during travel and became available at the classroom approach. The actor walked to the chair and sat at the open book; desktop composition kept the actor beside the question panel, and 390×844 composition kept the actor above it. A full ten-question mobile run scored 100/100 without awarding duplicate XP. Try again worked while seated. Question changes now reset the panel scroll so the heading and close control remain accessible. Previously earned XP and badges are retained during replay.
