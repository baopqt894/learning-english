import { CAMPUS_ENGLISH, gap } from './level-questions.ts';
import { ENGLISH_TIERS, type EnglishTier } from './cadet-tiers.ts';
import { drawQuestions, shuffled } from './question-rotation.ts';

const reading = {
  A1: [
    gap('A message says “Save your work before lunch.” What should you do first?', 'Save the file', 'Close the door', 'Eat lunch', 'Before lunch means you save first.'),
    gap('Mai writes “Please send me the photo.” What does she need?', 'A picture', 'A password', 'A keyboard', 'A photo is a picture.'),
    gap('The sign says “One headset per student.” How many can you take?', 'One', 'Two', 'Three', 'Per student means for each student.'),
  ],
  A2: [
    gap('“The printer is busy. Leave your file in the folder instead.” What should you do?', 'Save a digital copy there', 'Print another copy now', 'Empty the folder', 'Instead introduces the alternative action.'),
    gap('“Bring headphones unless you want to borrow ours.” Who needs to borrow headphones?', 'Someone without their own pair', 'Everyone with headphones', 'Only the teacher', 'Students can bring their own or borrow a pair.'),
    gap('Minh writes “I have already sent the draft.” What has he done?', 'Shared an early version', 'Deleted the final file', 'Asked for a new laptop', 'A draft is an early version of a piece of work.'),
  ],
  B1: [
    gap('“Only the latest version will be marked. Rename older drafts before submitting.” Why rename them?', 'So the teacher can identify the final file', 'So all drafts will be graded', 'So the deadline changes', 'The teacher needs to distinguish the final version from earlier work.'),
    gap('“Pairs may share notes, but each student submits an individual response.” Which action fits?', 'Discuss ideas and then write your own answer', 'Submit one answer for both students', 'Copy a partner’s response', 'The instructions allow shared preparation and require individual submissions.'),
    gap('“The quiz has been moved forward from Friday to Wednesday.” When should the class be ready?', 'Two days earlier than planned', 'Two days after Friday', 'At the same time next week', 'Moved forward means it takes place earlier.'),
  ],
};

const missingWords = {
  A1: [['Type your name using the ___. (k…)', 'keyboard'], ['Click the mouse to ___ the file. (o…)', 'open'], ['Listen to the words with your ___. (h…)', 'headphones'], ['Read the message on the ___. (s…)', 'screen']],
  A2: [['Yesterday we ___ the file to the email. (attach)', 'attached'], ['Please turn ___ the volume. I cannot hear. (up / down)', 'up'], ['She is ___ her answer now. (type)', 'typing'], ['Remember to log ___ before leaving a shared computer. (out / over)', 'out']],
  B1: [['The results will be ___ by email tomorrow. (send)', 'sent'], ['If we had saved a copy, we would not have ___ the draft. (lose)', 'lost'], ['The teacher suggested ___ the instructions again. (read)', 'reading'], ['Make a backup before ___ the old version. (delete)', 'deleting']],
};
export type ExamItem = {prompt:string; answer:string; options?:string[]; explanation:string};
export function computerExamRound(tier:EnglishTier, previous:readonly string[]): ExamItem[] {
  const key = (q: ExamItem) => q.prompt;
  const choice = [
    ...drawQuestions(reading[tier], 2, key, previous),
    ...drawQuestions(CAMPUS_ENGLISH[tier], 2, key, previous),
  ].map(q => ({...q, options:shuffled(q.options)}));
  const writing = missingWords[tier].map(([prompt,answer]) => ({prompt, answer, explanation:prompt.split(' (')[0].replace('___', answer)}));
  return shuffled([...choice, ...drawQuestions(writing, 2, key, previous)]);
}
export function examAnswerMatches(item: ExamItem, answer:string) {
  return item.answer.toLowerCase() === answer.trim().toLowerCase();
}
export type ExamRecords = Partial<Record<EnglishTier, {best:number; last:number}>>;
export function restoreExamRecords(value:unknown): ExamRecords | undefined {
  if(!value || typeof value !== 'object') return;
  const records:ExamRecords = {};
  const valid = (n:unknown) => typeof n==='number' && Number.isInteger(n) && n>=0 && n<=6;
  for(const tier of ENGLISH_TIERS) {
    const item = (value as ExamRecords)[tier];
    if(item && valid(item.best) && valid(item.last) && item.best>=item.last) records[tier]={best:item.best,last:item.last};
  }
  return Object.keys(records).length ? records : undefined;
}
