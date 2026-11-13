# English Games: shared rooms, place practice and animal care

Five real 3D competitions are available from **English competitions** in the HUD and registration labels at the venues:

| Game | Venue | Action |
| --- | --- | --- |
| Swim & solve | Campus pool | 25 m freestyle with articulated strokes and wakes |
| Word sprint | New track north of the training area | 40 m running |
| Grammar hurdles | Same athletics track | 40 m running with timed hurdle jumps |
| Vocabulary hops | Football / games field | 20 m sack hopping |
| Message dash | Football / games field | 20 m running with a baton |

Creating or joining a room takes the player to a safe shared-map arrival. Four cadets stand on the pool deck or track/field waiting area while the room is in its lobby. Each has a name and PLAYER/BOT label. The room has four seats, a six-character code, Ready controls and host-only + / remove controls. One bot initially stands with the creator; new human players can replace bots in the lobby. Starting automatically fills empty seats with bots. Every human must be ready.

## Actual multiplayer

The same-origin `/api/competitions` GET/POST route holds authoritative room state in the running Node process. Independent clients join by code and poll compact snapshots every 500 ms, interpolate movement locally and submit answers with a private per-seat token, round ID and question index. The server decides correctness, response time, combo, boosts, timeouts and finishes. Sending forged elapsed time or duplicate question indices cannot award a boost. Seat tokens are never included in public snapshots. Nicknames are limited to 24 characters and rendered as text.

Correct answers give a 1.5-second acceleration burst. Successive correct answers add 15% per step to that burst, capped at ×1.6 for a streak of five or more. Wrong answers and timeouts reset the streak. Bots follow the same boost rules. Online races continue if a player hides the tab. A player who leaves or disconnects during a race is replaced by a bot. Finishing players can review answers while others complete the course; the host can return everyone to the lobby after the round.

Rooms are temporary and expire after 30 idle minutes. They currently require one running Node instance; restarting it clears rooms. Scaling to multiple server replicas requires moving the registry to shared storage. This implementation provides the multiplayer protocol and local/LAN runtime; it does not itself publish a public internet domain.

## How to join

1. Open the same game server address on every device.
2. Press **English competitions**, choose the game and **Create online room**.
3. Share the displayed room code. Friends enter their nickname/code and press **Join room**.
4. Each friend presses **I’m ready**. The host can add bots with **+** or simply press **Start race · auto-fill bots**.
5. Answer with keys 1–4 or the on-screen choices. Read explanations and build a combo.

The **How to play** button stays available in the room. On the campus map, English athletics and field games have their own destinations. The 44 × 9 m athletics track is separate from balance, tyre and climbing activities, with shared approach paths and registration fixtures.

## Practice at each place

**Practise English here** selects a context-specific challenge for every mapped district and the courtyard/library/canteen. Nineteen lesson sets cover word meanings, missing words, polite conversation and ordering sentence words. Three questions must be solved, with explanations and retries and no time limit. These are separate from the ten-chapter story and do not overwrite story or activity progress.

## Animal care loop

Five groups—chickens, pigs, goats, ducks and fish—have saved meal counts, growth stage and feeding time. Before any feeding hold action, the player must solve three English questions to earn a single food portion for that exact group. The portion lasts five minutes and is consumed only after the full physical feeding action. Keyboard E and pointer holds use the same gate.

Meals are spaced at least one minute apart for this game. Three meals reach Growing, six reach Adult. The actual pen models grow with the saved meal count. Animals become Hungry after six hours and Weak after twelve; health gradually falls from hour four. Exhausted animals remain recoverable through another learning-and-feeding assignment, so time away does not permanently destroy a pupil’s animal. Old version-1 saves retain names, XP, dialogue, campaign and fieldwork; pet data is optional and normalised.

## Performance changes

Foliage instancing is partitioned into spatial chunks instead of one whole-campus bounding sphere, and static architecture is batched by both material and 24 m spatial cell. Off-camera chunks can be culled in both colour and shadow passes. The normal render pixel ratio is capped at 1.25. Detailed competition characters initialise only when a room is entered. UI clock updates stay within the competition component; shared snapshots update at 2 Hz rather than every frame. Shadows remain synchronised with movement.

## Evidence

Browser testing used two independent client sessions joining the same live room, synchronised readiness, host + bot actions, a complete running round, correct-answer combos and answer review. The main player’s existing level 4 / 505 XP and three completed conversations remained intact. During the running check, the main tab reported 60 FPS, 282 draw calls and about 1.96 million rendered triangles; this is a local observation, not a guarantee for every device. Layout audit covers 42 destinations and 1,722 ordered routes.

Final release checks: 54 tests pass, with ESLint, TypeScript and production build passing. The production server was verified listening on all interfaces at port 3000. A real HTTP canary created a room through localhost, joined through the LAN host, started with two humans and two bots, checked one correct answer, observed that answer from the LAN client, and confirmed that a forged seat token received HTTP 401. The physical pig-feeding flow also passed in the browser and saved one meal; a repeated feeding attempt without a fresh portion was blocked.
