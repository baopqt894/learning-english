# English Discovery Day: connected learning campaign

A storm has damaged the school exhibition. Minh invites the player to lead the Green Team. The player recovers the duty plan and guide, prepares the dormitory and garden, cares for animals, practises movement and water safety, then opens the exhibition with Minh and Linh.

The primary HUD follows this story. The six existing dialogue missions remain in Conversation practice; existing garden, duty and academy activities retain their saved work and rewards.

| Chapter | Location | English focus | Required practical evidence | XP once |
| --- | --- | --- | --- | --- |
| A team with a plan | Classroom A1 | be, time, directions | Visit the classroom | 70 |
| Ready for inspection | Dormitory B | tools and imperatives | Complete the saved 3D duty tasks and work report | 90 |
| The missing field guide | Library | requests and loan details | Visit Ms. Lan’s library | 80 |
| Recover the duty schedule | Computer lab | time, sequence and reading a schedule | Visit the lab | 90 |
| From seed to shared meal | Vegetable garden | first, then, finally; quantities | Complete the actual garden cycle and work report | 110 |
| Breakfast at the pens | Animal care | animal vocabulary and routines | Feed the chickens in 3D | 100 |
| The water clue | Fish pond | quantity and present continuous | Feed the fish in 3D | 100 |
| A message across the course | Training ground | adverbs and movement | Cross the balance beam | 110 |
| Keep everyone safe | Swimming pool | imperatives and prohibitions | Throw the life ring from the deck | 110 |
| Discovery Day opens | Multipurpose hall | completed-action reports and teamwork | Visit the hall and submit the final caption | 140 |

Each chapter has five typed word clues and a final typed report. The player reads an authored source note, fills the blanks, checks feedback and then performs the assignment. There are 50 scored word clues and ten report blanks. Answers are matched as complete normalized words or phrases, with authored alternatives where appropriate. Case, surrounding spaces and terminal punctuation are accepted; substring matches such as “not are” are rejected.

The five first answers determine the score. A corrected answer remains useful learning but does not become a first correct answer. Hints explain the clue; explicitly studying the answer marks it assisted. A score of at least 80/100, the required physical evidence and the final report are all necessary to complete the chapter. Below 80, the player can review and retry the word clues while retaining their physical work. There is no timer, health loss or duplicate XP.

Completion unlocks the next chapter. The final report opens Discovery Day and presents the team ending. Completed chapters provide a read-only review of the full sentences and explanations. Total campaign XP is 1,000, awarded once.

The journal requires the player to be in the actual mapped room or district. Practical work positions count as being in that area, so a player on the feeding deck is not told to return to an arbitrary entrance marker. A gold ring and atlas marker show the active destination. Travel closes the journal and walks the actual collision-aware route.

## Persistence and compatibility

The original version-1 save key remains. Optional `campaign` data stores chapter best scores, attempts, per-clue solved/first-correct/assisted states and validated completed-practice IDs. Existing names, avatars, dialogue goals, activity scores, fieldwork objects and XP remain. New chapters start uncompleted on old saves. Completed garden and duty work is recognised; the player need not repeat it just because the campaign was added.

Practice events are emitted only after a complete in-world hold action. Cancellation emits no completion. A report cannot bypass the English score, wrong location or physical evidence checks. Replaying events and reports does not grant additional XP.

## Larger spaces

Usable classroom floors are now 15 × 10 (150 versus 60 square units, 2.5 times the previous area), with twice as many normal-sized desks. Dormitory B is 12 × 10 (120 versus 45) with three additional beds and retained interactive furniture. Dining and multipurpose halls are 16 × 12 and 20 × 14. Core buildings and the reading pavilion are enlarged too.

The four outdoor districts have 1.5 times their former width and depth, 2.25 times their area. The swimming pool is 27 × 18 with six lanes; the training ground is 48 × 27. Livestock pens are 15 × 10.5. Characters and animals keep their previous size. Rendering and navigation share the district transforms. The farm is moved south and expanded to about 479 square units, with eight additional production beds, a larger shed and a clear entrance. Its three task beds retain their saved stages and direct planting, watering and harvest actions.

Current playable bounds are x −46…110, z −78…68: 22,776 square units. Footprints, rooms, work stations, the atlas and camera framing use the new layout. `docs/campus-layout-audit.json` records exhaustive routes and room dimensions.

## Verification

The 37-test suite covers all 50 typed clues and ten reports, wrong and assisted answers, score/retry gates, missing physical evidence, remote submissions, duplicate rewards and old-save restoration. The expanded layout audit checks 1,332 ordered routes and all building pairs. Real-browser checks cover wrong/correct feedback, saved word-clue progress after reload, travel to the enlarged rooms, and a chicken-feeding completion appearing as saved practical evidence while its chapter stays locked until the English lessons are passed. Existing visible progress remains level 3 / 330 XP before a campaign chapter is submitted.

The final hall now has physical exhibition tables for books, harvested crops, the campus map and safe teamwork, plus an English Discovery Day banner. These tie the final chapter to a recognisable place in the 3D school.
