# A day as a cadet

**Updated:** Garden and dormitory now use direct physical work in the 3D map. See [Physical fieldwork](physical-fieldwork.md) for the current mechanics, animations, save format and limitations. The guided-choice implementation described below records the initial design; it is no longer the garden/duty runtime.

Three playable English activities extend the six original dialogue missions. They are available from **Cadet activities** on the HUD, pause menu and journal. A location-specific launch appears at Learning garden, Dormitory or Classroom A1. The activity brief also offers travel to that destination. Practice can start from the activity board without requiring travel.

## Research and design decisions

- [People's Army Newspaper: cadets cultivating vegetables](https://www.qdnd.vn/quoc-phong-an-ninh/xay-dung-quan-doi/sao-vuong-vat-soi-nuoi-rau-808297) describes soil preparation, sowing and care in a military-school garden. The game adapts these into an age-appropriate school garden task, not an agricultural training guide.
- [Military Logistics Academy: organised production activities](https://hocvienhaucan.edu.vn/bai-viet/tieu-doan-1-chu-dong-tang-gia-san-xuat-gop-phan-cai-thien-doi-song-bo-doi) links garden work to cadet learning schedules and responsibility for a green, clean campus.
- [British Council: task-based learning](https://www.teachingenglish.org.uk/professional-development/teachers/teaching-knowledge-database/t-w/tbl-task-based-learning) motivates meaningful language use around a concrete task.
- [British Council: feedback on tasks](https://www.teachingenglish.org.uk/professional-development/teachers/managing-lesson/conducting-feedback-exercises-and-tasks) supports explaining mistakes and using results to guide further practice.

The dormitory tasks, 80-point pass mark, unlock conditions and rewards are game-design choices. They are not official military rules or a certified English assessment.

## Activities

| Activity | Actions / learning | Pass / reward |
|---|---|---|
| Grow for the team | Prepare soil, sow seeds, water seedlings, harvest, report three baskets. Sequence words, tools and action verbs. | 4/5 correct, 80 XP |
| Our barracks, our responsibility | Choose a broom, fold a blanket, put books on a shelf, ask for help moving a table, report completion. Imperatives, prepositions, polite teamwork requests. | 4/5 correct, 80 XP |
| Cadet English challenge | Ten distinct random questions from a twelve-question bank covering garden, duties, introductions, library, prices and schedules. | 8/10 correct, 120 XP |

Garden and duty are available immediately; passing both unlocks the classroom challenge. Every question supports reading and optional browser speech synthesis. An answer is checked once, followed by an explanation and bilingual vocabulary. Correct answers and activity progress remain visible. Wrong answers can be learned from before continuing. No time limit or XP penalty.

## Persistence and limits

Completed attempts store best score, attempt count and pass status in the existing version-1 progress object under optional `activities`. Old saves migrate with empty activity records. Existing dialogue progression is unchanged. XP is derived once per passed activity, so repeats cannot farm rewards; a worse replay cannot lower a best score. Combined maximum is 855 XP: 575 dialogue + 280 activities. Teacher view and JSON export include activity records. Starting a new journey clears them together with the original progress.

An unfinished attempt is not persisted; the UI explains this before leaving. Storage failures show a warning. Browser audio availability varies. These are guided instruction/action scenarios with immediate feedback; they do not yet animate crops growing or rooms being cleaned in the 3D world. The garden story explicitly says that time passes before harvest. There is no pronunciation or unrestricted writing grading.
