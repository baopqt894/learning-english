import type { EnglishTier } from './cadet-tiers.ts';
import { gap } from './level-questions.ts';
import { drawQuestions, shuffled } from './question-rotation.ts';

export const PAVILION_READINGS = {
  A1: {
    title: 'A book for Minh',
    text: 'Linh has two books in her bag. One is about birds and one is about trees. Minh wants to draw a bird, so Linh gives him the first book. They sit at the little table by the window.',
    questions: [
      gap('How many books does Linh bring?', 'Two', 'One', 'Three', 'Linh has two books in her bag.'),
      gap('Which book does Minh take?', 'The book about birds', 'The book about trees', 'Both books', 'Minh wants to draw a bird, so he takes the bird book.'),
      gap('Where do they sit?', 'By the window', 'Under a tree', 'By the door', 'The little table is next to the window.'),
      gap('Who gives Minh a book?', 'Linh', 'His teacher', 'His brother', 'Linh takes the book from her bag and gives it to Minh.'),
    ],
  },
  A2: {
    title: 'The missing bookmark',
    text: 'After lunch, Khoa found a blue bookmark under the reading table. A small fish was drawn on it. He was about to put it on the shelf when he remembered that Mai drew fish on all her things. He left it inside her notebook with a note.',
    questions: [
      gap('Where did Khoa find the bookmark?', 'Under the table', 'Inside a notebook', 'On the shelf', 'He first saw it under the reading table.'),
      gap('What helped Khoa identify the owner?', 'The drawing of a fish', 'The blue colour', 'A name on the bookmark', 'Mai often drew fish on her belongings.'),
      gap('What did Khoa do in the end?', 'Put it in Mai’s notebook', 'Keep it on the shelf', 'Give it to a teacher', 'He changed his plan and left the bookmark inside her notebook.'),
      gap('When did Khoa find it?', 'After lunch', 'Before breakfast', 'During dinner', 'The story begins just after lunch.'),
    ],
  },
  B1: {
    title: 'A shelf with no labels',
    text: 'When the reading club removed the labels from one shelf, An expected the books to be harder to find. Instead, the club wrapped each cover and wrote a single clue about the story on the paper. By Friday, even the quietest readers were swapping recommendations. The club kept the experiment on one shelf so that students looking for a particular title could still find it elsewhere.',
    questions: [
      gap('Why did the club keep most shelves unchanged?', 'To help readers find specific titles', 'To save clues for Friday', 'To stop readers exchanging books', 'Students who already knew the title they wanted still needed labelled shelves.'),
      gap('Which outcome surprised An?', 'Clues encouraged readers to share discoveries', 'The club stopped lending books', 'The books became easier to sort by title', 'An expected difficulty, but readers began exchanging recommendations.'),
      gap('What could a reader learn before unwrapping a book?', 'A hint about its story', 'Its exact title', 'What everyone thought of it', 'The club wrote a single clue on each wrapped cover.'),
      gap('Which title best describes the experiment?', 'Choose a story by a clue', 'How to care for damaged books', 'A competition for fast readers', 'The experiment changed how students chose and discussed books.'),
    ],
  },
};

export function pavilionReadingRound(tier: EnglishTier, previous: readonly string[]) {
  return drawQuestions(PAVILION_READINGS[tier].questions,3,q=>q.prompt,previous)
    .map(q=>({...q,options:shuffled(q.options)}));
}
