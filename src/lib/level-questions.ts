export type EnglishQuestion = { prompt: string; options: string[]; answer: string; explanation: string; kind?: 'order' };

export function gap(prompt: string, answer: string, wrong1: string, wrong2: string, explanation: string): EnglishQuestion {
  return { prompt, options: [answer, wrong1, wrong2], answer, explanation };
}

export const CAMPUS_ENGLISH = {
  A1: [
    gap('Listen ___ the instructions.', 'to', 'at', 'on', 'Use listen to before the thing you hear.'),
    gap('I ___ a student at this school.', 'am', 'is', 'are', 'Use am with I.'),
    gap('Can you ___ me, please?', 'help', 'helps', 'helping', 'Use the base verb after can.'),
    gap('There ___ two bags by the door.', 'are', 'is', 'am', 'Use there are for more than one thing.'),
    gap('Please ___ here until your team arrives.', 'wait', 'waits', 'waiting', 'Give an instruction with the base verb.'),
    gap('First check the sign. ___, go inside.', 'Then', 'Yesterday', 'Under', 'Then tells us what happens next.'),
    gap('An and Minh ___ in the same group.', 'are', 'is', 'am', 'Use are for two or more people.'),
    gap('Which word means the opposite of “open”?', 'closed', 'clean', 'early', 'An open door lets you through. A closed door does not.'),
  ],
  A2: [
    gap('We ___ the equipment yesterday afternoon.', 'checked', 'have checked', 'are checking', 'Yesterday afternoon is a finished past time.'),
    gap('There isn’t ___ space left on the shelf.', 'much', 'many', 'a few', 'Use much with the uncountable noun space.'),
    gap('Mai came early ___ set up the room.', 'to', 'for', 'so', 'Use to plus a verb to say why she came early.'),
    gap('Walk ___ at the next turn. The floor is wet.', 'more carefully', 'most careful', 'carefuller', 'More carefully describes a safer way to walk.'),
    gap('You ___ bring a pen. We have spare ones.', 'don’t have to', 'mustn’t', 'can’t', 'Don’t have to means bringing a pen is optional.'),
    gap('We’ve practised together ___ two weeks.', 'for', 'since', 'at', 'Use for with a length of time.'),
    gap('I was checking the list when the bell ___.', 'rang', 'rings', 'has rung', 'The short event interrupting a past action uses the past simple.'),
    gap('Could you tell me ___ to put this?', 'where', 'what', 'who', 'Where asks for a place.'),
    gap('The box is light ___ for one person to carry.', 'enough', 'too', 'very', 'Put enough after the adjective when the amount is sufficient.'),
    gap('You ___ check with your teammates before changing the plan.', 'should', 'are', 'have', 'Should gives advice.'),
    gap('We have already ___ the notice board.', 'read', 'reading', 'reads', 'Use the past participle after have. For read it has the same spelling.'),
    gap('Which instruction means “do it again”?', 'Repeat the step.', 'Skip the step.', 'Swap the steps.', 'Repeat means do the same thing again.'),
  ],
  B1: [
    gap('The forms ___ before the next class begins.', 'must be signed', 'must sign', 'must be signing', 'Use must be plus a past participle when the forms receive the action.'),
    gap('If we left earlier, we ___ time to practise.', 'would have', 'will have', 'had', 'Use would plus a base verb for the result of a hypothetical condition.'),
    gap('The cadet ___ notebook was missing asked for help.', 'whose', 'which', 'whom', 'Whose shows who the notebook belongs to.'),
    gap('Could you tell me where ___?', 'the meeting starts', 'does the meeting start', 'starts the meeting', 'Indirect questions use statement word order.'),
    gap('The hall was full, ___ we moved the group outside.', 'so', 'although', 'unless', 'So introduces the result of the hall being full.'),
    gap('We had already checked the room before the visitors ___.', 'arrived', 'have arrived', 'arrive', 'The later event in a sequence of past events uses the past simple.'),
    gap('The tutor reminded us ___ our names on the sheet.', 'to write', 'write', 'writing', 'Remind someone to do something.'),
    gap('The group finished on time ___ starting late.', 'despite', 'although', 'because', 'Despite can be followed by a verb ending in -ing.'),
    gap('You may borrow the equipment ___ you return it by five.', 'as long as', 'even though', 'as if', 'As long as introduces a condition for borrowing it.'),
    gap('We spoke quietly ___ we wouldn’t disturb the class.', 'so that', 'unless', 'even if', 'So that introduces the purpose.'),
    gap('I’m used to ___ the directions twice before setting off.', 'checking', 'check', 'checked', 'Be used to means be accustomed to. It can be followed by an -ing form.'),
    gap('Only one group can use the hall at a time. What does the notice require?', 'Groups must take turns.', 'Groups should combine.', 'Groups all start together.', 'At a time means only one group may use it at any given moment.'),
  ],
};

export const FIELD_BRIEFING_QUESTIONS = [
  gap('The notice says: “Bring water. Your coach will provide cones.” What should you pack yourself?', 'Water', 'Cones', 'Both water and cones', 'Bring names what you need to carry. The coach will supply the cones.'),
  gap('The eastern lane is closed until 10 a.m. It is 9:45. Where can your group practise now?', 'In the western lane', 'In the eastern lane', 'In the eastern lane until 10 a.m.', 'A lane closed until ten is unavailable at 9:45.'),
  gap('You missed the briefing because you arrived after it ended. What can you ask?', 'Could you tell me what I missed?', 'Could I move the briefing to yesterday?', 'Have you missed my arrival?', 'Ask for a summary of what happened before you got there.'),
  gap('Minh checked the kit while the others ___ the course.', 'were preparing', 'are preparing', 'have prepared', 'The past continuous describes the action already in progress.'),
  gap('The rules say you ___ step onto the beam until the coach signals.', 'mustn’t', 'don’t have to', 'should', 'Mustn’t means the action is forbidden.'),
  gap('Linh practised for twenty minutes. An practised for thirty. Who practised longer?', 'An', 'Linh', 'They practised for the same time', 'Thirty minutes is longer than twenty.'),
  gap('The coach shortened the course ___ the ground was slippery.', 'because', 'but', 'afterward', 'Because introduces the reason the course was shortened.'),
  gap('The coach has just moved the meeting ___ the track to the shelter.', 'from', 'between', 'during', 'From gives the old location. To gives the new one.'),
];

export const TEAM_LEADER_QUESTIONS = [
  gap('“The rehearsal has been brought forward from three to two.” What time should your team arrive?', 'By two o’clock', 'After three o’clock', 'Between two and three', 'Bring forward means move something to an earlier time.'),
  gap('The library team can help provided that they finish setting up first. When can they help?', 'After their own setup is complete', 'Before they start their setup', 'While they are still setting up', 'Provided that introduces a condition.'),
  gap('A message says, “We will guide visitors to the hall.” Report the promise to your teacher.', 'They said they would guide the visitors.', 'They said they had guided the visitors.', 'They told the visitors to guide them.', 'Will usually changes to would in reported speech after said.'),
  gap('The director asked which group ___ the posters the day before.', 'had designed', 'will design', 'has designed', 'Use the past perfect for the action before the director asked.'),
  gap('“We’ve run out of programme sheets.” What should your team do?', 'Print or fetch more sheets.', 'Take the extra sheets away.', 'Move the visitors to another hall.', 'Run out of means there are none left.'),
  gap('We stayed near the entrance ___ late arrivals could still find us.', 'so that', 'even if', 'unless', 'So that explains the reason for staying near the entrance.'),
  gap('If the main hall is full, use Classroom B instead. What will you do once all the seats are taken?', 'Send the next group to Classroom B.', 'Keep sending groups to the main hall.', 'Tell the seated groups to leave immediately.', 'The instruction names a fallback location when the hall is full.'),
  gap('Visitors ___ to leave the display tables clear.', 'are asked', 'are asking', 'have asked', 'The visitors receive the request, so use the passive.'),
  gap('The helper ___ you were looking for is at the front desk.', 'who', 'whose', 'which', 'Who can refer to a person in a relative clause.'),
  gap('The team delivered its presentation ___ having very little time to rehearse.', 'despite', 'even though', 'unless', 'Despite is followed by a noun or an -ing form.'),
];
