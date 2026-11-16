import type { LEVEL_MISSIONS, LevelMissionId } from './cadet-tiers.ts';

type AnswerKey = { answer: string; alternatives?: readonly string[] };
type Exercise = AnswerKey & { id: string; prompt: string; explanation: string };
type SpokenExercise = Exercise & { transcript: string };
export type MissionExercise =
  | (Exercise & { kind: 'fill' })
  | (SpokenExercise & { kind: 'dictation' | 'repeat' })
  | (SpokenExercise & { kind: 'listen'; options: string[] });

export const listen = (id: string, transcript: string, prompt: string, [answer, ...wrong]: [string, string, string], explanation: string): MissionExercise =>
  ({ id, kind: 'listen', transcript, prompt, options: [answer, ...wrong], answer, explanation });

export const fill = (id: string, prompt: string, answer: string, explanation: string, alternatives?: string[]): MissionExercise =>
  ({ id, kind: 'fill', prompt, answer, explanation, alternatives });

const dictation = (id: string, transcript: string, prompt: string, answer: string, explanation: string, alternatives?: string[]): MissionExercise =>
  ({ id, kind: 'dictation', transcript, prompt, answer, explanation, alternatives });

export const missionAudioPath = (id: string) => `/mission-audio/${id}.mp3`;

export function isTypedAnswerCorrect(question: AnswerKey, value: string): boolean {
  const normalize = (text: string) => text.normalize('NFKC').toLowerCase().replace(/[‘’]/g, "'")
    .trim().replace(/^[.!?,"]+|[.!?,"]+$/g, '').trim().replace(/\s+/g, ' ');
  const actual = normalize(value);
  return !!actual && [question.answer, ...(question.alternatives ?? [])].some(answer => normalize(answer) === actual);
}

type AdvancedMissionId = { [Id in LevelMissionId]: (typeof LEVEL_MISSIONS)[Id] extends { listen: number; speak?: never } ? Id : never }[LevelMissionId];
export const MISSION_EXERCISES = {
  'language-desk': [
    listen('language-01', 'The welcome talk has moved from nine fifteen to nine forty-five. Please be in the language lab five minutes before the new start time.', 'When should you arrive?', ['At 9:40', 'At 9:15', 'At 9:50'], 'Five minutes before 9:45 is 9:40.'),
    listen('language-02', 'Group Green, your listening lesson is still in the language lab. The group meeting you afterwards will be in Classroom B.', 'Where is Group Green’s listening lesson?', ['In the language lab', 'In Classroom B', 'In the assembly hall'], 'The following meeting is in Classroom B. The lesson is still in the lab.'),
    listen('language-03', 'If a pair of headphones does not work, raise your hand. Leave it on the desk so that we can check it.', 'What should you do with broken headphones?', ['Leave them on the desk', 'Bring them to the front', 'Put them in your bag'], 'The message asks you to leave the broken headphones where they are.'),
    listen('language-04', 'Please record your team name before you record your welcome message. The second recording should be no longer than thirty seconds.', 'What goes in the first recording?', ['The team name', 'The whole welcome message', 'A list of all visitors'], 'The name comes first. The welcome message is the second recording.'),
    fill('language-05', 'Complete the polite request: Could you ___ that, please? (Say it again.)', 'repeat', 'Repeat means say or do something again.'),
    fill('language-06', 'Complete the phrasal verb: Please turn ___ the volume if the announcement is too loud.', 'down', 'Turn down the volume means make it quieter.'),
    fill('language-07', 'Use the past form of “move”: The notice says the meeting was ___ to a different room.', 'moved', 'The passive form is was + moved.'),
    fill('language-08', 'Complete the phrase: Write ___ the room number so that you can remember it later.', 'down', 'Write down means make a written note.'),
  ],
  'meal-coordinator': [
    listen('dining-01', 'The soup contains milk, but the vegetable rice is dairy-free. Both dishes have carrots.', 'Which dish is suitable for a visitor who avoids milk?', ['The vegetable rice', 'The soup', 'Both dishes'], 'The rice is described as dairy-free. The soup contains milk.'),
    listen('dining-02', 'The second lunch group should come at twelve forty instead of twelve twenty. The first group will still come at noon.', 'When should the second group come?', ['At 12:40', 'At 12:20', 'At noon'], 'Instead of replaces the earlier time with 12:40.'),
    listen('dining-03', 'We have enough plates for everyone, but there are only six clean trays. Please bring ten more trays from the cupboard.', 'What should you fetch?', ['Ten trays', 'Six plates', 'Ten plates'], 'The shortage is trays. The speaker asks for ten more.'),
    listen('dining-04', 'The queue for hot food is beside the windows. If you are only collecting fruit, go straight to the table by the door.', 'Where should someone collecting only fruit go?', ['To the table by the door', 'To the queue by the windows', 'Back to the kitchen'], 'People collecting only fruit can go straight to the door-side table.'),
    fill('dining-05', 'Complete the notice: Please tell us about any food ___. (Use the plural of “allergy”.)', 'allergies', 'Change the final y of allergy to ies in the plural.'),
    fill('dining-06', 'Use the past participle of “serve”: Lunch will be ___ at noon.', 'served', 'Will be + served makes the future passive.'),
    fill('dining-07', 'Complete the phrase: We’ve run ___ of trays. (There are none left.)', 'out', 'Run out of means use all of something.'),
    fill('dining-08', 'Use the noun form of “choose”: There is a ___ of two main dishes.', 'choice', 'Choice is the noun. Choose is the verb.'),
  ],
  'tech-check': [
    listen('computer-01', 'The video is ready, but the captions in the English file still need checking. Please publish it only after you have checked the captions.', 'What should happen before publishing?', ['Check the English captions', 'Record a new video', 'Delete the captions'], 'Only after makes checking the captions a condition for publishing.'),
    listen('computer-02', 'The link on the welcome screen works. The one on the printed sign points to last year’s guide, so replace that one first.', 'Which link needs replacing?', ['The link on the printed sign', 'The link on the welcome screen', 'Both links'], 'The printed sign has the outdated link.'),
    listen('computer-03', 'We made a copy of the guide before we edited it. If today’s changes disappear, open the folder called Backup.', 'Where should you look if you lose today’s changes?', ['In the Backup folder', 'In the shared calendar', 'In the trash'], 'The Backup folder is where the team kept an earlier copy.'),
    listen('computer-04', 'The visitors can read the guide on their phones. For the presenter, open a local copy in case the internet connection drops.', 'Why should the presenter open a local copy?', ['It works if the connection drops', 'It makes the guide public', 'It translates the guide'], 'In case introduces a problem the team wants to prepare for.'),
    fill('computer-05', 'Use the past participle of “attach”: The map is ___ to the email.', 'attached', 'Is attached means the map comes with the email.'),
    fill('computer-06', 'Complete the phrase: Back ___ the latest file before updating it.', 'up', 'Back up means make a copy so you can recover the file later.'),
    fill('computer-07', 'Use a form of “access”: Can all visitors ___ the guide without signing in?', 'access', 'After can plus a subject, use the base verb access.'),
    fill('computer-08', 'Complete the instruction: Sign ___ before you leave the shared computer. (End your session.)', 'out', 'Sign out ends your account session.', ['off']),
    dictation('computer-09', 'Please rename the finished file before you share it.', 'Please ___ the finished file before you share it.', 'rename', 'Rename means give the file a new name.'),
    dictation('computer-10', 'Delete the duplicate after you save the original.', 'Delete the ___ after you save the original.', 'duplicate', 'A duplicate is another copy of the same item.'),
  ],
  'garden-tour': [
    listen('reading-01', 'The path past the fountain is closed. Follow the covered walkway beside the classrooms and enter the garden through the small gate.', 'Which route should visitors take?', ['The covered walkway', 'The path past the fountain', 'The main road'], 'The fountain path is closed. The covered walkway leads to the open gate.'),
    listen('reading-02', 'The first reading starts under the pavilion. If it gets too crowded, send any new arrivals to the benches beside the oak tree.', 'When should you send new visitors to the benches?', ['When the pavilion gets too crowded', 'As soon as the first reading starts', 'Only when the reading ends'], 'If sets the condition for using the benches.'),
    listen('reading-03', 'We planned a tour for both groups, but the visitors from Class B arrived late. Give them the short tour after their reading session.', 'What should Class B do before their tour?', ['Attend the reading session', 'Visit the pavilion twice', 'Meet Class A at the gate'], 'Their tour comes after the reading session.'),
    listen('reading-04', 'The signs point to the reading circle. The one at the entrance is hard to see, so move it closer to the path, but leave the other signs where they are.', 'Which sign should you move?', ['The sign at the entrance', 'Every sign in the garden', 'The sign next to the reading circle'], 'The entrance sign is the only one the speaker asks you to move.'),
    fill('reading-05', 'Complete the relative clause: The cadet ___ group arrived early will lead the first tour.', 'whose', 'Whose shows which cadet the group belongs to.'),
    fill('reading-06', 'Complete the condition with one word: You can stay outside ___ it starts raining. (Except if it rains.)', 'unless', 'Unless means except if.'),
    fill('reading-07', 'Use the past participle of “guide”: Visitors will be ___ to the benches by a cadet.', 'guided', 'Use will be guided when the visitors receive the action.'),
    fill('reading-08', 'Use the noun form of “enter”: Meet the guide at the main ___.', 'entrance', 'Entrance names the place where you enter.'),
    dictation('reading-09', 'The reading circle has been moved to the shelter.', 'The reading circle has been moved to the ___.', 'shelter', 'A shelter is a covered place that protects people from the weather.'),
    dictation('reading-10', 'Wait beside the noticeboard until your guide arrives.', 'Wait beside the ___ until your guide arrives.', 'noticeboard', 'A noticeboard displays announcements.', ['notice board']),
  ],
  'harvest-handover': [
    listen('harvest-01', 'The kitchen needs two baskets today. Leave the rest in the cool room for tomorrow’s lunch, and put the date on every label.', 'What should stay in the cool room?', ['Any baskets beyond the first two', 'All of today’s baskets', 'The first two baskets only'], 'The first two are needed today. The rest are for tomorrow.'),
    listen('harvest-02', 'The south bed is ready, but the plants in the north bed are still small. Water them after lunch and let them grow for another week.', 'What should happen in the north bed today?', ['Water the plants after lunch', 'Harvest the plants before lunch', 'Plant new seeds right away'], 'The north bed needs watering today. Its plants need another week before harvest.'),
    listen('harvest-03', 'The delivery was due at ten, but the kitchen asked us to bring it half an hour earlier. Minh can take the first basket while we weigh the rest.', 'When is the delivery now due?', ['At 9:30', 'At 10:30', 'At 10:00'], 'Half an hour earlier than ten is 9:30.'),
    listen('harvest-04', 'Keep the clean baskets beside the scales. The ones with wet labels can wait near the door until their labels have dried.', 'Which baskets should stay near the door?', ['The baskets with wet labels', 'Every basket after weighing', 'Only empty baskets'], 'The message identifies wet labels as the reason to wait.'),
    listen('harvest-05', 'We thought the order was for lettuce only. The updated note asks for carrots as well, but it doesn’t change the number of lettuce baskets.', 'What changed in the order?', ['Carrots were added', 'Lettuce was replaced by carrots', 'The number of lettuce baskets doubled'], 'As well means the carrots are an addition.'),
    listen('harvest-06', 'We can finish washing the crops before the rain starts if the other team brings a second tub. Otherwise, set the unwashed baskets aside.', 'When should you set the unwashed baskets aside?', ['If the second tub doesn’t arrive', 'As soon as the second tub arrives', 'After all the crops have been washed'], 'Otherwise describes what to do if the team doesn’t bring the tub.'),
    fill('harvest-07', 'Use the past participle of “weigh”: All baskets must be ___ before they go to the kitchen.', 'weighed', 'The passive construction is must be weighed.'),
    fill('harvest-08', 'Complete the phrase: Set the damaged labels ___ so that nobody uses them. (Put them separately.)', 'aside', 'Set aside means put something away from the rest.'),
    fill('harvest-09', 'Use the -ing form of “sort”: We finished ___ the vegetables before noon.', 'sorting', 'Finish is followed by the -ing form of a verb.'),
    fill('harvest-10', 'Complete the label with a form of “remain”: Keep the ___ baskets for tomorrow.', 'remaining', 'Remaining means still left after some have been used.'),
    dictation('harvest-11', 'Write the weight and the date on each label.', 'Write the ___ and the date on each label.', 'weight', 'Weight tells the kitchen how heavy the basket is.'),
    dictation('harvest-12', 'Store the smaller basket in the cool room overnight.', 'Store the smaller basket in the cool room ___.', 'overnight', 'Overnight means during the night or until the next morning.'),
  ],
  'animal-care-report': [
    listen('care-01', 'The morning team refilled the water after feeding the goats. The chickens have not been fed yet, so that is the first job for the next team.', 'What should the next team do first?', ['Feed the chickens', 'Feed the goats again', 'Refill the water immediately'], 'The goats and water are already taken care of. The chickens are still waiting.'),
    listen('care-02', 'The ducks were moved to the shaded pen because the yard was too hot. Leave them there until the keeper says they can return.', 'Who decides when the ducks can return?', ['The keeper', 'The visitors', 'The afternoon team by itself'], 'The team must wait for the keeper’s instruction.'),
    listen('care-03', 'One bucket has a cracked handle. Put it on the repair shelf rather than with the clean equipment. The other buckets are ready to use.', 'Where should the cracked bucket go?', ['On the repair shelf', 'With the clean equipment', 'In a feeding pen'], 'Rather than distinguishes the repair shelf from the usual equipment area.'),
    listen('care-04', 'An signed the board after checking the water bowls, but she forgot to record how much feed was left. Ask her before you order more.', 'What should you ask An about?', ['How much feed was left', 'Who signed the board', 'Which bowls she checked'], 'The feed quantity is missing from the record.'),
    listen('care-05', 'The visitor group is ready now, but don’t open the pen gate until the keeper arrives. The group can watch from the marked path meanwhile.', 'What can the group do while waiting?', ['Watch from the marked path', 'Enter the pen without the keeper', 'Open the gate and call the animals'], 'Meanwhile describes what the group can do before the keeper arrives.'),
    listen('care-06', 'The supplies would have lasted until Friday if the bag hadn’t torn. Since some feed was spilled, collect a spare bag from the store today.', 'Why does the team need a spare bag today?', ['The old bag tore and some feed spilled', 'The store is closed on Friday', 'The animals were fed twice'], 'The condition did not happen. The bag tore, so the supplies won’t last as planned.'),
    fill('care-07', 'Use the past participle of “fill”: The water bowls have already been ___.', 'filled', 'The bowls received the action, so use have been filled.'),
    fill('care-08', 'Use the noun form of “inspect”: Record when the last ___ of the pen took place.', 'inspection', 'Inspection is the noun for a careful check.'),
    fill('care-09', 'Complete the phrasal verb: The morning team will hand ___ to the next group at noon.', 'over', 'Hand over means pass responsibility to another person or team.'),
    fill('care-10', 'Use the -ing form of “check”: The keeper suggested ___ the gate again before visitors arrive.', 'checking', 'Suggest is often followed by a verb ending in -ing.'),
    dictation('care-11', 'Put the damaged bucket on the repair shelf.', 'Put the ___ bucket on the repair shelf.', 'damaged', 'Damaged means no longer in good condition.'),
    dictation('care-12', 'Leave a written record beside the feeding chart.', 'Leave a written ___ beside the feeding chart.', 'record', 'A record is information kept so another person can check it.'),
  ],
  'open-day-debrief': [
    listen('debrief-01', 'We originally planned to welcome visitors in the hall. Because the sound system failed, the first group met in the courtyard. The hall reopened in time for the final talk.', 'Why did the first group meet outside?', ['The sound system failed', 'The hall was too small', 'The final talk was cancelled'], 'The audio gives the failed sound system as the cause of the move.'),
    listen('debrief-02', 'Linh said we ought to post the room changes earlier next time. Minh agreed, but added that printed signs also helped people whose phones had no signal.', 'Which improvement did both cadets support?', ['Posting room changes earlier', 'Removing the printed signs', 'Giving every visitor a phone'], 'Minh agreed with Linh’s proposal before making a separate point about signs.'),
    listen('debrief-03', 'By the time the second group arrived, the tech team had fixed the display. They still took a printed guide because they wanted to read it during lunch.', 'Had the display been fixed before the second group arrived?', ['Yes, the repair was already finished', 'No, they waited until after lunch', 'No, that group fixed it themselves'], 'Had fixed describes the repair before the arrival.'),
    listen('debrief-04', 'The garden guide had planned a long tour, but shortened it when rain was forecast. It stayed dry, although the shorter tour meant everyone reached lunch on time.', 'What was an unexpected benefit of shortening the tour?', ['Everyone got to lunch on time', 'The rain stopped early', 'Everyone visited more places'], 'It did not rain, yet shortening the tour helped the lunch schedule.'),
    listen('debrief-05', 'We need someone to revise the visitor map and someone to test it. Because An designed the first version, she will revise it. Nam will test it without being told the route.', 'Why is Nam testing the map without route instructions?', ['To see whether the map is clear on its own', 'To replace An as the designer', 'To keep visitors from using the map'], 'Testing it independently shows whether a new visitor could follow the map.'),
    listen('debrief-06', 'The extra signs would not have helped if they had shown the old times. Fortunately, every sign was checked before it went up.', 'What made the extra signs useful?', ['They had been checked for the correct times', 'They showed the original times', 'They were put up without checking'], 'The last sentence tells us the team checked the signs before displaying them.'),
    fill('debrief-07', 'Complete the instruction with a form of “recommend”: We ___ checking all notices before publishing them. (Give advice.)', 'recommend', 'Recommend can be followed by a verb ending in -ing.', ['suggest']),
    fill('debrief-08', 'Complete the contrast: ___ having less time to prepare, the team finished the tour successfully.', 'despite', 'Despite can be followed by a verb ending in -ing.'),
    fill('debrief-09', 'Use the past participle of “write”: By the time we met, she had already ___ the report.', 'written', 'The past participle of write is written.'),
    fill('debrief-10', 'Complete the relative clause: Thank the volunteers ___ work kept the event running.', 'whose', 'Whose links the volunteers to the work they did.'),
    dictation('debrief-11', 'Check that the times are consistent across all notices.', 'Check that the times are ___ across all notices.', 'consistent', 'Consistent means that the notices give the same times.'),
    dictation('debrief-12', 'Summarize the main changes before you make recommendations.', '___ the main changes before you make recommendations.', 'summarize', 'Summarize means report the main points briefly.', ['summarise']),
  ],
} satisfies Record<AdvancedMissionId, MissionExercise[]>;
