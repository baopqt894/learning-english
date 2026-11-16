import type { LEVEL_MISSIONS, LevelMissionId } from './cadet-tiers.ts';
import { fill, listen, type MissionExercise } from './mission-exercises.ts';

type SpeakingMissionId = { [Id in LevelMissionId]: (typeof LEVEL_MISSIONS)[Id] extends { speak: number } ? Id : never }[LevelMissionId];
function speakingBank(code: string, lines: readonly string[], extras: readonly MissionExercise[]): MissionExercise[] {
  return [...lines.map((transcript, index): MissionExercise => ({
    id: `${code}-${String(index + 1).padStart(2, '0')}`, kind: 'repeat',
    prompt: 'Repeat the message you hear.', transcript, answer: transcript,
    explanation: 'You repeated the message.',
  })), ...extras];
}

export const SPEAKING_MISSIONS = {
  'courtyard-radio': speakingBank('welcome', [
    'Meet your group beside the welcome board.',
    'Please wait here until your guide arrives.',
    'The next group should use the side entrance.',
    'Bring your map when you join the tour.',
  ], [
    listen('welcome-11', 'The courtyard tour starts by the flagpole. The group waiting at the main gate is taking a different tour.', 'Where does the courtyard tour start?', ['By the flagpole', 'At the main gate', 'Inside the classroom'], 'The flagpole is the starting point for this tour.'),
    listen('welcome-12', 'Take a badge at the desk before you meet your guide at the gate.', 'What should you do first?', ['Pick up a badge', 'Meet the guide', 'Close the gate'], 'Before gives the order of the two actions.'),
    fill('welcome-21', 'Write the noun form of “arrive”: Please report your ___ at the welcome desk.', 'arrival', 'Arrival is the noun for the act of arriving.'),
    fill('welcome-22', 'Complete the phrase: The first group is about ___ leave.', 'to', 'Be about to means something will happen very soon.'),
  ]),
  'library-pickup': speakingBank('library-desk', [
    'Books on the return trolley are ready to be sorted.',
    'Your reserved book will be held until tomorrow afternoon.',
    'Please leave the reference books in the reading room.',
    'You can renew the book if nobody else needs it.',
  ], [
    listen('library-desk-11', 'The library is still open, but the returns desk has closed early. Leave returned books in the box by the entrance.', 'Where do returned books go today?', ['In the box by the entrance', 'On the returns desk', 'In the reading room'], 'The entrance box replaces the desk today.'),
    listen('library-desk-12', 'The atlas can be used in the library until closing time. The history book can go home with you for a week.', 'Which book can you take home?', ['The history book', 'The atlas', 'Both books'], 'Only the history book is available to take home.'),
    fill('library-desk-21', 'Use the past participle of “reserve”: These copies have already been ___.', 'reserved', 'Use have been reserved for an earlier action affecting the copies.'),
    fill('library-desk-22', 'Complete the phrasal verb: You can pick ___ your book at the front desk.', 'up', 'Pick up means collect.'),
  ]),
  'canteen-orders': speakingBank('order-desk', [
    'Please leave out the ice, but keep the lemon in the drink.',
    'We asked for two sandwiches, and only one has arrived.',
    'If there is no tea left, bring water with the order.',
    'The soup is for this table, but the bread is for the next one.',
  ], [
    listen('order-desk-11', 'Please keep my sandwich order, but replace the orange juice with water. My friend still wants juice.', 'What changes for the speaker?', ['Water replaces their juice', 'Both drinks change to water', 'Their sandwich is cancelled'], 'The request changes only the speaker’s drink.'),
    listen('order-desk-12', 'The first order is already paid for. Please put the extra fruit on a separate bill.', 'What goes on the separate bill?', ['The extra fruit', 'The whole first order', 'The drinks only'], 'The original order is already paid.'),
    fill('order-desk-21', 'Use the noun form of “replace”: If a drink is unavailable, offer a ___.', 'replacement', 'A replacement is something supplied in place of another item.'),
    fill('order-desk-22', 'Complete the phrase: Could we split the bill ___ two people?', 'between', 'Between identifies the people sharing the bill.'),
  ]),
  'dormitory-brief': speakingBank('dorm-duty', [
    'Collect the clean blankets before you take the used ones downstairs.',
    'The shelves that have already been checked can be left as they are.',
    'If you finish your room early, ask the next team whether they need help.',
    'Do not sign the checklist until someone has checked the floor and windows.',
  ], [
    listen('dorm-duty-11', 'Only the top shelf needs clearing today. Leave the boxes underneath it until the storage team arrives.', 'What should be cleared now?', ['The top shelf', 'The boxes below the shelf', 'The entire room'], 'The boxes stay where they are for now.'),
    listen('dorm-duty-12', 'The room was ready before lunch, but the checklist was signed after lunch. The supervisor needs the signed checklist.', 'What does the supervisor need?', ['The signed checklist', 'A new cleaning team', 'A lunch order'], 'The supervisor asks for the signed record.'),
    listen('dorm-duty-13', 'The left cupboard is locked. Use supplies from the right cupboard unless the supervisor tells you otherwise.', 'Where should you get supplies for now?', ['The right cupboard', 'The locked cupboard', 'Both cupboards'], 'The right cupboard is the default until you hear otherwise.'),
    listen('dorm-duty-14', 'Minh folded the spare blankets while An checked the windows. They have not swept the floor yet.', 'Which job is still unfinished?', ['Sweeping the floor', 'Checking the windows', 'Folding the blankets'], 'Only sweeping is described as unfinished.'),
    fill('dorm-duty-21', 'Use the -ing form of “check”: The supervisor suggested ___ the windows again.', 'checking', 'Suggest can be followed by an -ing form.'),
    fill('dorm-duty-22', 'Complete the phrase: Leave the folded blankets ___ the shelf until inspection.', 'on', 'Use on when the blankets rest on the surface of the shelf.'),
  ]),
  'classroom-tutor': speakingBank('peer-tutor', [
    'Try explaining the answer in your own words before reading the example aloud.',
    'Although both sentences are correct, the second one sounds more polite in this situation.',
    'You can keep the first paragraph as it is, provided you revise the final sentence.',
    'If your partner has already read the question, ask them to explain why they chose that answer.',
  ], [
    listen('peer-tutor-11', 'Read the final sentence again. The word there refers to the place mentioned in the first paragraph.', 'Where will you find the place?', ['In the first paragraph', 'In a separate dictionary', 'In the question number'], 'The first paragraph supplies what there refers to.'),
    listen('peer-tutor-12', 'Do not translate each word separately. Read to the end of the sentence before deciding what the phrase means.', 'What is the suggested method?', ['Read the whole sentence first', 'Translate one word at a time', 'Skip any unfamiliar phrase'], 'The whole sentence provides context.'),
    listen('peer-tutor-13', 'Your explanation is clear, but the example uses the wrong tense. Keep the explanation and rewrite the example.', 'What should be rewritten?', ['The example', 'The whole explanation', 'The title only'], 'Only the example has the wrong tense.'),
    listen('peer-tutor-14', 'The first pair should compare answers now. The second pair should wait until their partner finishes the last question.', 'Which pair should wait?', ['The second pair', 'The first pair', 'Both pairs'], 'The second pair has a partner who is still working.'),
    fill('peer-tutor-21', 'Use the noun form of “explain”: Give a brief ___ for your choice.', 'explanation', 'Explanation is the noun.'),
    fill('peer-tutor-22', 'Complete the phrase: Could you go ___ the example one more time? (Review it.)', 'through', 'Go through means review in order.'),
  ]),
  'pond-observer': speakingBank('pond-log', [
    'The water looked clearer after the rain, although the temperature had hardly changed.',
    'Record the number of fish you can see before comparing it with yesterday’s total.',
    'If the fish move away from the dock, wait quietly before drawing a conclusion.',
    'The keeper asked us to note when the water level changed and what the weather was like.',
  ], [
    listen('pond-log-11', 'The fish gathered near the surface before feeding. After feeding, they went deeper, although the water temperature stayed the same.', 'What remained the same?', ['The water temperature', 'The location of the fish', 'The amount of food'], 'The temperature is explicitly described as unchanged.'),
    listen('pond-log-12', 'The water level measurement from yesterday is missing. Compare the two readings from today but leave yesterday out of your report.', 'Which readings should be compared?', ['The two readings from today', 'Yesterday and today', 'Yesterday and last week'], 'Only today’s readings are available.'),
    listen('pond-log-13', 'We counted eight fish near the dock and another group under the shade. We did not include the shaded group in the dock total.', 'What does the dock total represent?', ['Only fish near the dock', 'Every fish in the pond', 'Only fish under the shade'], 'The shaded group is separate.'),
    listen('pond-log-14', 'The keeper will repeat the test once the wind drops. The ripples made the first water level reading difficult to judge.', 'Why will the test be repeated?', ['Ripples affected the first reading', 'The fish refused their food', 'The keeper has lost the chart'], 'The rough surface made it hard to read the water level.'),
    fill('pond-log-21', 'Use the noun form of “observe”: Record one ___ about the water before noon.', 'observation', 'An observation is something you notice and record.'),
    fill('pond-log-22', 'Use the past participle of “measure”: The depth was ___ from the same place each day.', 'measured', 'Was measured is the past passive.'),
  ]),
  'football-captain': speakingBank('captain', [
    'Keep possession near the touchline unless you see a teammate in a clearer position.',
    'Although the other team pressed early, our defenders found enough room to pass across the pitch.',
    'If we had moved the ball sooner, their defenders would have had less time to close the gap.',
    'The coach asked everyone who was playing in the second half to warm up beside the bench.',
  ], [
    listen('captain-11', 'If the middle is crowded, send the ball back and switch sides. Cross immediately only if your teammate has space.', 'When should a player cross immediately?', ['When their teammate has space', 'Whenever the middle is crowded', 'Only after the final whistle'], 'Only if states the condition for crossing immediately.'),
    listen('captain-12', 'The match was stopped because the net needed repair. The score and remaining time will carry over when play restarts.', 'What carries over to the restart?', ['The score and remaining time', 'Only the remaining time', 'Only the score'], 'The stoppage changes neither value.'),
    listen('captain-13', 'An was going to defend, but the coach asked him to move forward after Linh tired. Minh took An’s original position.', 'Who took the original defensive position?', ['Minh', 'An', 'Linh'], 'Minh replaced An in defence.'),
    listen('captain-14', 'The practice area is available after lunch as long as both teams clear the cones before the next group arrives.', 'What must both teams do?', ['Clear the cones before the next group', 'Finish before lunch', 'Leave the cones in place'], 'As long as introduces a condition.'),
    fill('captain-21', 'Use the noun form of “defend”: The team improved its ___ in the second half.', 'defence', 'Defence is the noun. Defense is the US spelling.', ['defense']),
    fill('captain-22', 'Complete the relative clause: Thank the teammate ___ pass gave us the chance to score.', 'whose', 'Whose links the teammate to their pass.'),
  ]),
  'pool-announcer': speakingBank('pool-call', [
    'Swimmers may return to their lanes once the lifeguard has checked the water and given the signal.',
    'The afternoon session will start on time, provided the inspection finishes before the next group arrives.',
    'Anyone who borrowed goggles this morning should return them before collecting a locker key for the next session.',
    'Although the shallow end has reopened, the diving boards will stay closed until staff finish checking the equipment.',
    'The group that was booked for the last session can use the pool once the current lesson has ended.',
    'If there is a change to the programme, it will be announced at the desk before swimmers enter the deck.',
  ], [
    listen('pool-call-11', 'The main pool has reopened, but lanes two and three are reserved for lessons. Anyone swimming independently should check in for a remaining lane.', 'What should solo swimmers do?', ['Check in for an available lane', 'Enter a lesson lane', 'Wait for the main pool to reopen'], 'The pool is open, but lesson lanes are reserved.'),
    listen('pool-call-12', 'The session was expected to end early. It will now finish at the original time because the group arrived before the inspection ended.', 'When will the session finish?', ['At the original time', 'Earlier than originally planned', 'After the last session'], 'The final plan restores the original time.'),
    listen('pool-call-13', 'Unless staff ask you to move, stay beside your assigned lane. The seats near the door are only for visitors who are not swimming.', 'Who should use the seats near the door?', ['Visitors who are not swimming', 'All swimmers between races', 'Every person assigned a lane'], 'The seats have a specific purpose.'),
    listen('pool-call-14', 'The extra practice ends before the evening lesson. You may borrow equipment for practice, but return it as soon as that practice ends.', 'When must borrowed equipment be returned?', ['When the extra practice ends', 'After the evening lesson', 'Before the extra practice starts'], 'As soon as means immediately after the practice.'),
    fill('pool-call-21', 'Use the past participle of “inspect”: The deck must be ___ before the next lesson begins.', 'inspected', 'Must be inspected describes a required action on the deck.'),
    fill('pool-call-22', 'Complete the rule: Wait ___ the lifeguard gives the signal before entering.', 'until', 'Until gives the end point of the wait.'),
  ]),
  'track-official': speakingBank('track-call', [
    'By the time the runners reached the track, the officials had already checked the lanes and posted the revised schedule.',
    'The second heat has been delayed because one lane needs inspection, but the warm-up area will remain open as planned.',
    'Any runner whose name is missing from the list should report to the desk before the final call for their heat.',
    'If the organisers had kept the original schedule, the two events would have started at the same time on different tracks.',
    'Although the first heat has finished, its results will only be posted after the judges have reviewed the times.',
    'Participants were reminded that the outer lanes could be used for practice as long as the finish area was kept clear.',
  ], [
    listen('track-call-11', 'The second heat will start immediately after the first, provided no lane checks are needed. If checks are needed, an announcement will give the delay.', 'What could prevent an immediate start?', ['A lane check', 'Too many spectators', 'An early warm-up'], 'The schedule is conditional on the lanes being ready.'),
    listen('track-call-12', 'The final didn’t start on time because the scoreboard stopped working. The judges had already checked every lane before that happened.', 'What caused the delay?', ['The scoreboard failure', 'The lane checks', 'The judges arriving late'], 'The lane checks were already finished.'),
    listen('track-call-13', 'An was listed for the first heat, and Minh for the second. When Minh pulled out, the coach moved An to Minh’s heat.', 'Which heat will An run in now?', ['The second heat', 'The first heat', 'Both heats'], 'An takes Minh’s original place.'),
    listen('track-call-14', 'The old schedule is still on the noticeboard, but the online schedule already includes the new times. Use the online version until the paper one is replaced.', 'Which version should runners use now?', ['The online schedule', 'The older paper schedule', 'Either schedule'], 'Only the online version shows the changed times.'),
    fill('track-call-21', 'Use the past participle of “revise”: The schedule had been ___ before the teams arrived.', 'revised', 'Had been revised marks an action completed before another past action.'),
    fill('track-call-22', 'Use the noun form of “qualify”: Winning the heat does not guarantee ___ for the final.', 'qualification', 'Qualification is the noun for meeting the requirements.'),
  ]),
  'field-final': speakingBank('field-broadcast', [
    'Although the weather improved before the final round, the organisers kept the shorter course so that every team could finish before the awards ceremony.',
    'The awards will be announced once the judges have checked the results, provided that all the teams have handed in their score sheets.',
    'If the second field had been ready in time, the teams could have played simultaneously rather than waiting for the first round to finish.',
    'The announcement explained that the group whose turn had been postponed could practise beside the registration desk until the officials called them back.',
    'By the time the final scores were displayed, the organisers had replaced the outdated notices and asked the team leaders to confirm the changes.',
    'Despite losing time during the changeover, all teams completed their final rounds before the volunteers began clearing away the equipment.',
  ], [
    listen('field-broadcast-11', 'If the first prize could have been shared, the judges would have announced a tie. The rules required an extra round, which the Blue team won.', 'Why was there an extra round?', ['The rules didn’t allow a shared first prize', 'The Blue team asked to practise', 'The judges forgot the results'], 'An extra round was required to decide a single winner.'),
    listen('field-broadcast-12', 'The earlier notice gave the right place but the wrong time. The updated announcement changes the start time without changing where the teams should report.', 'What changed in the latest announcement?', ['Only the start time', 'Only the meeting place', 'Both the time and place'], 'Without changing where means the location stays the same.'),
    listen('field-broadcast-13', 'The course could have reopened earlier if the volunteers had received the replacement signs. They arrived just before the final round, so only that round used the new route.', 'Which round used the new route?', ['Only the final round', 'All rounds', 'Every round except the final'], 'The signs arrived just in time for the final round.'),
    listen('field-broadcast-14', 'The helpers collected the score sheets before the teams left. They kept one copy for the judges and gave the original back to each team captain.', 'What did the team captains receive?', ['The original score sheets', 'Copies made for the judges', 'Blank sheets for a second game'], 'The original was returned to each captain.'),
    fill('field-broadcast-21', 'Complete the condition with one word: The awards will start on time, ___ that all the results have been checked.', 'provided', 'Provided that introduces a condition.'),
    fill('field-broadcast-22', 'Use the noun form of “confirm”: Please wait for official ___ before announcing the winner.', 'confirmation', 'Confirmation is the noun for an official check or assurance.'),
  ]),
} satisfies Record<SpeakingMissionId, MissionExercise[]>;
