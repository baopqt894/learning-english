# English Games: shared rooms, place practice and animal care

**English competitions** in the HUD and the atlas give directions to three registration desks. On a phone, expand **Missions & activities** to see the HUD shortcuts. Walk there using the map, keyboard, or world clicks. The desk highlights **Register** within 2.25 m of its approach. Press **E** or tap the button to sign up. The game leaves your cadet at the desk when the race ends.

| Game | Venue | Action |
| --- | --- | --- |
| Swim & solve | Campus pool | 25 m freestyle with articulated strokes and wakes |
| Word sprint | New track north of the training area | 40 m running |
| Grammar hurdles | Same athletics track | 40 m running with timed hurdle jumps |
| Vocabulary hops | Football / games field | 20 m sack hopping |
| Message dash | Football / games field | 20 m running with a baton |

Waiting cadets stand on the pool deck, track apron or games field while the room is in its lobby. Each has a name and PLAYER/BOT label. The room has four seats, a six-character code, Ready controls and host-only + / remove controls. One bot initially stands with the creator; new human players can replace bots in the lobby. Starting automatically fills empty seats with bots. Every human must be ready.

## Actual multiplayer

The same-origin `/api/competitions` GET/POST route holds authoritative room state in MongoDB. Room updates compare a document version before saving, which keeps concurrent function instances from overwriting each other. Online rooms send room revisions to each client as they happen over an authenticated streaming response. If the stream is interrupted, the client requests snapshots while it reconnects. Clients interpolate movement locally and submit answers with a private per-seat token, round ID and question index. The server decides correctness, response time, combo, boosts, timeouts and finishes. Sending forged elapsed time or duplicate question indices cannot award a boost. Seat tokens are never included in public snapshots. Nicknames are limited to 24 characters and rendered as text.

Each correct answer earns one tenth of the course. Swimmers cover 2.5 m, runners and hurdlers cover 4 m, and sack and baton racers cover 2 m. Wrong answers and timeouts keep the racer in place and return the missed question to the queue. Consecutive correct answers shorten the time to cover the next segment, reaching double pace at five in a row. Everyone, including bots, must answer all ten distinct questions correctly to finish. Online races continue if a player hides the tab. A player who leaves or disconnects during a race is replaced by a bot. Finishing players can review answers while others complete the course; the host can return everyone to the lobby after the round.

The selected choice highlights immediately while the answer is being checked. The server reads the room while it verifies the account session, then validates the private seat and scores the answer. Production functions use the Hong Kong region. The competition POST response publishes timing metrics for request processing and account verification.

Rooms expire after 30 idle minutes. Vercel Functions and self-hosted Node instances share the `competition_rooms` collection. TTL cleanup removes expired rooms. Readiness, seat ownership, question time limits and race results persist across function invocations.

## How to join

1. Open the same game server address on every device and sign in to a cadet account.
2. Use **English competitions → Walk there**, or walk to the venue yourself. Press **E** or tap **Register** at the desk.
3. Choose **Race with friends**, your event and difficulty, then **Create online room**.
4. Share the venue and displayed room code. Friends register at that same desk and press **Join room**. The host’s difficulty applies to everyone. Before starting, the host can change **Room difficulty** to any level they have unlocked. Other players then confirm **Ready** again.
5. Every human presses **I’m ready**. The host can add bots with **+** or press **Start race** to fill the remaining seats. Answer with keys 1–4 or the on-screen choices.

The **How to play** button stays available at the desk and in the race. The pool has four marked lanes with floats, dive blocks, ladders, rescue rings and a surveillance chair. The four-lane 46 × 9 m track has a 40 m timed straight, distance marks and covered stands. The registration desks, waiting aprons and pathways sit outside the race lanes.

## Friends and race invitations

Open **Friends** in the campus HUD, search for a classmate's exact username, and send a request. Your classmate accepts it in **Inbox**. In an online lobby, the host can choose **Invite friends**. The recipient opens the invitation from **Inbox**, walks to the venue, and selects **Join room** with the room code already filled in. Invitations expire after 15 minutes and apply to an open lobby.

## Solo practice and campus records

Choose **Solo practice** at a registration desk. The race uses one lane and no bots. **Beginner (A1)** allows 12 seconds per question, **Intermediate (A2)** allows 10, and **Advanced (B1)** allows 8. Each level has its own questions. The expanded campus bank adds 80 reading questions, 60 listening questions based on 20 recordings, and 60 word gaps per level. A round draws four multiple-choice reading questions, three listening questions and three word gaps, using a different passage for each item. During a race, feedback shows progress or a missed attempt. After crossing the finish line, open **Review your answers** to see the correct answers and explanations for each attempt.

Complete all ten segments to qualify. The leaderboard compares times earned under the same rules. The server calculates the time and keeps the fastest result per account, event and level. **Campus records** shows the ten fastest cadets for the selected event and level along with your personal rank. Change either filter to browse the entire campus. The chosen nickname appears with qualifying records. Online results appear in the room.

The shared board reads MongoDB collection `race_records`. The fastest time for an account, event and difficulty survives server restarts. Live rooms use separate documents in `competition_rooms`.

## Daily missions

**Daily missions** in the HUD offers one course finish (pool and track alternate), a three-answer race streak, and a cleared contextual quiz. Two team missions award 25 XP for finishing the same online race with another human and 35 XP if each of you also gets at least three correct answers. Stay in the room until your teammate crosses the finish line. The missions refresh at midnight in Vietnam. XP is saved to the player’s account once per completed mission each day.

## Accounts and saved progress

On entry, create a cadet account with a login name, password, nickname and avatar. If this browser has an older local save, the registration form can import it. Sign in on another device to retrieve the same learning progress and race records. The pause menu shows save status and offers logout and recovery when two devices update the same account at once.

Set Node-only `MONGODB_URI` and optionally `MONGODB_DB` in an ignored `.env.local` or the server environment. The database defaults to `campusquest`. The `accounts` collection holds the learner save, salted password hash and revocable session hashes. Public hosting should use HTTPS so the session cookie carries the Secure flag. Set `MONGODB_URI` in the Vercel project’s Production environment before deploying. The public link should resolve to the production deployment built from `main`.

## Practice at each place

**Practise English here** selects a context-specific challenge for every mapped district and the courtyard/library/canteen. Nineteen lesson sets cover word meanings, missing words, polite conversation and ordering sentence words. Three questions must be solved, with explanations and retries and no time limit. These are separate from the ten-chapter story and do not overwrite story or activity progress.

## Quiz checkpoints and XP

The balance beam runs a three-question English challenge at the training ground. Each question opens once the cadet reaches a checkpoint and allows eight seconds. The cadet walks to the next checkpoint after a correct answer and falls before resetting to the starting side after a wrong answer or timeout. Either end of the beam can start a run.

The rescue throw, garden work and dormitory work open with short English quizzes. The quiz unlocks the physical action or assignment, and finishing it still requires the in-world controls. First clears award XP for distinct location quizzes, physical stations and sports events with at least three correct answers. Each 150 XP earns another level. The account keeps these first-clear records together with story, assignment and daily mission progress.

## Animal care loop

Five groups—chickens, pigs, goats, ducks and fish—have saved meal counts, growth stage and feeding time. Before any feeding hold action, the player must solve three English questions to earn a single food portion for that exact group. The portion lasts five minutes and is consumed only after the full physical feeding action. Keyboard E and pointer holds use the same gate.

Meals are spaced at least one minute apart for this game. Three meals reach Growing, six reach Adult. The actual pen models grow with the saved meal count. Animals become Hungry after six hours and Weak after twelve; health gradually falls from hour four. Exhausted animals remain recoverable through another learning-and-feeding assignment, so time away does not permanently destroy a pupil’s animal. Old version-1 saves retain names, XP, dialogue, campaign and fieldwork; pet data is optional and normalised.

## Performance changes

Foliage instancing is partitioned into spatial chunks and static architecture is batched by both material and 24 m spatial cell. Off-camera chunks can be culled in both colour and shadow passes. When the frame rate drops, the renderer lowers resolution and omits fine grass detail. During races it skips exploration updates and reuses the static shadow map. The swimmers share one instanced body mesh, while strokes, kicks and wakes run locally between network updates.

The whole-campus view uses an instanced model generated from the same landmarks and footprints as the walkable map. Select a point in that view to return to the detailed campus as the cadet walks there. Mobile shortcuts stay collapsed until opened, and HUD portraits use display-size WebP assets.

## Previous multiplayer release evidence

Browser testing used two independent client sessions joining the same live room, synchronised readiness, host + bot actions, a complete running round, correct-answer combos and answer review. The main player’s existing level 4 / 505 XP and three completed conversations remained intact. During the running check, the main tab reported 60 FPS, 282 draw calls and about 1.96 million rendered triangles; this is a local observation, not a guarantee for every device. Layout audit covers 42 destinations and 1,722 ordered routes.

Final release checks: 54 tests pass, with ESLint, TypeScript and production build passing. The production server was verified listening on all interfaces at port 3000. A real HTTP canary created a room through localhost, joined through the LAN host, started with two humans and two bots, checked one correct answer, observed that answer from the LAN client, and confirmed that a forged seat token received HTTP 401. The physical pig-feeding flow also passed in the browser and saved one meal; a repeated feeding attempt without a fresh portion was blocked.

## Venue registration and account release checks

The layout audit passed 1,722 ordered routes and confirmed three reachable registration desks. Production browser checks covered registration, solo swimming, a shared record board, the daily race streak and pool quiz, and an Advanced track race with two signed-in players and two bots. Mobile viewport checks used 390 and 360 CSS pixels. A separate MongoDB test database verified old-save import, logout, sign-in from a different browser context, record lookup, private race seats and rejection of concurrent progress overwrites. All 60 unit tests passed.
