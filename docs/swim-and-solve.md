# Swim & solve

A 25 m English race takes place in the existing 3D campus pool. The player selects Swim & solve in the HUD, walks to the swimming district and opens the race. The briefing identifies Minh, Linh and An as computer-controlled teammates. This is local single-player practice, not online multiplayer.

Four articulated swimmers use separate real pool lanes, coloured swimming caps, goggles, arm recovery, elbow movement, flutter kicks and water wakes. The exploration avatar stays safely on the deck and is hidden during the race; leaving restores it and the exploration camera. Pool geometry, rescue practice and the Discovery Day campaign are preserved.

After a three-second countdown, the player answers English questions with four choices, by touch/click or number keys 1–4. There are 24 authored A1–A2 questions covering introductions, grammar, instructions, sequence, time, equipment and pool vocabulary. Question order and choice positions vary on replay.

Every swimmer has a base speed of 0.4 m/s. A correct answer adds a continuous 1.5-second acceleration burst with distance `1.5 + 2.7 × (1 − responseSeconds / 12)` metres, clamped to the 0–12 second response range. Quick correct answers therefore produce stronger bursts. Wrong answers and 12-second timeouts give no boost, display the correct answer and explanation, and continue after 1.4 seconds. Duplicate clicks during feedback cannot submit or boost again. NPCs follow deterministic response/accuracy profiles with the same speed-boost formula. Positions and finish order depend on elapsed active time and answer events, never render-frame counts.

Pause and Escape freeze all swimmers and question timing. Hiding the page automatically pauses; resuming is explicit. Reduced-motion settings preserve race progress while suppressing stroke/wake animation. Finished races show all four finish times, rank and an expandable review of correct, wrong and timed-out responses. Replays start a fresh round. Race practice does not overwrite existing chapter progress, XP or physical work.

## Validation

Pure tests cover fast versus slow rewards, continuous movement without teleporting, wrong/invalid/duplicate submissions, countdown blocking, timeout and pause behaviour, exact finish order, replay question shuffling and correct answer review. Browser checks exercised real travel to the pool, correct and incorrect answers, stable paused positions, a full finish, answer review and return to the same deck position with existing 330 XP retained. The layout is visually checked at native desktop size and 390 × 844. Screenshots are in `docs/previews/swim-race-*.png`.

Final verification: all 43 tests passed, ESLint and TypeScript passed, and the production build passed. The race camera fits the real pool bounding rectangle into the available area above the portrait question panel or beside the landscape panel, rather than using a fixed zoom/offset. Timer/position state is shared by the question interface and the actual 3D swimmers.
