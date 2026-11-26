import { gap } from './level-questions.ts';
import { listen } from './mission-exercises.ts';
import type { EnglishTier } from './cadet-tiers.ts';
import type { WorkshopId } from './workshop-wing.ts';

// A round follows the order a learner would actually work in the room.
export const workshopBriefings = {
  kitchen: {
    A1: ['Wash the carrots before you cook them.', 'What do you wash?', 'Carrots', 'Rice', 'Apples'],
    A2: ['Set out four bowls. Two more students are joining us for lunch.', 'How many bowls will you need altogether?', 'Six', 'Four', 'Two'],
    B1: ['The first group has already eaten. Keep the soup warm until the second group arrives.', 'Which group still needs soup?', 'The second group', 'The first group', 'Both groups'],
  },
  'light-lab': {
    A1: ['Switch on the red circle.', 'Choose the signal you heard.', 'Red circle', 'Yellow triangle', 'Blue square'],
    A2: ['The square flashes first. Select the yellow triangle that comes after it.', 'Which signal do you choose?', 'Yellow triangle', 'Blue square', 'Red circle'],
    B1: ['Ignore the first flash. The signal between the red circle and the blue square is the one to record. It is a yellow triangle.', 'Which signal belongs in the log?', 'Yellow triangle', 'Red circle', 'Blue square'],
  },
  'plant-lab': {
    A1: ['Put the bean seeds in the small pot.', 'Where do the seeds go?', 'In the small pot', 'On the shelf', 'In the water jug'],
    A2: ['Yesterday the shoot was four centimetres tall. Today it is seven.', 'How much has the shoot grown?', 'Three centimetres', 'Seven centimetres', 'Four centimetres'],
    B1: ['Both trays received equal amounts of water. Only the tray beside the window grew taller.', 'Which condition differed between the trays?', 'The amount of light', 'The amount of water', 'The kind of seed'],
  },
} as const;

export const secondBriefings = {
  kitchen: {
    A1: ['Put the apples on the lunch tray.', 'Which food goes on the tray?', 'Apples', 'Rice', 'Carrots'],
    A2: ['We have eight clean bowls, but only six people are having soup.', 'How many bowls can you put away?', 'Two', 'Six', 'Eight'],
    B1: ['Leave the sauce in a separate bowl so that guests can choose how much to add.', 'How should you serve the sauce?', 'On the side', 'Mixed into every portion', 'Under the rice'],
  },
  'light-lab': {
    A1: ['Touch the blue square on the panel.', 'Touch the signal you heard.', 'Blue square', 'Yellow triangle', 'Red circle'],
    A2: ['The yellow triangle appears after the red circle. Select the earlier signal.', 'Which signal appears earlier?', 'Red circle', 'Yellow triangle', 'Blue square'],
    B1: ['If two circles flash, choose the square. If only one flashes, choose the triangle. You see two circles.', 'Which signal follows this pattern?', 'Blue square', 'Yellow triangle', 'Red circle'],
  },
  'plant-lab': {
    A1: ['Write the date beside the plant name.', 'What do you write beside the name?', 'The date', 'Your lunch order', 'The price'],
    A2: ['Record the height before you move the pot to the sunny shelf.', 'What should you do first?', 'Record the height', 'Move the pot', 'Water the leaves'],
    B1: ['Our first tray was planted on Monday. The other was planted on Thursday. Compare them when each is seven days old.', 'Why measure the trays on different days?', 'To compare plants of the same age', 'To give them different amounts of light', 'To test two kinds of seeds'],
  },
} as const;

export const workshopQuestions = {
  kitchen: {
    A1: gap('The rice is ready. Serve it in a ___.','bowl','tap','fork','A bowl holds a serving of rice.'),
    A2: gap('Put the lid on the pot ___ the water begins to boil.','when','during','while boiling it','When introduces the moment an action happens.'),
    B1: gap('The lunch order has doubled. Which note keeps the recipe proportions?','Double every ingredient','Double only the rice','Use half the water','Multiplying each quantity by two preserves the ratio.'),
  },
  'light-lab': {
    A1: gap('Which light has three sides?','Triangle','Square','Circle','A triangle has three straight sides.'),
    A2: gap('The blue square comes before the circle. Which shape appears second?','Circle','Square','Triangle','Before means earlier in the sequence.'),
    B1: gap('The circle only lights up if both switches are on. Only one is on. What do you expect?','The circle stays dark','The circle must light up','The circle changes shape','Both switches are necessary for this signal.'),
  },
  'plant-lab': {
    A1: gap('The soil is dry. What does the seedling need?','Water','A ruler','A label','Water helps a seedling grow in dry soil.'),
    A2: gap('Mark the height ___ centimetres on your chart.','in','by','at','We express a measurement in centimetres.'),
    B1: gap('Which observation can be checked with a ruler?','The stem grew by two centimetres','This is the nicest plant','The plant looks happy','A change in height can be measured and compared.'),
  },
};

export const workshopNotes = {
  kitchen: {
    A1: ['First wash your ___ before touching food.', 'hands', 'boots', 'chair'],
    A2: ['The recipe serves two. For four people, use ___ the amount of rice.', 'twice', 'half', 'less than'],
    B1: ['The cook wrote “Set aside a portion”. What should the helper do?', 'Save some for later', 'Throw away the leftovers', 'Serve everything now'],
  },
  'light-lab': {
    A1: ['Which card matches a blue square?', 'A blue shape with four equal sides', 'A blue circle', 'A yellow triangle'],
    A2: ['The red light flashes twice and the blue light once. How many flashes did you count?', 'Three', 'Two', 'Four'],
    B1: ['A signal repeats every four seconds, starting at zero. When does it flash for the third time?', 'After eight seconds', 'After twelve seconds', 'After four seconds'],
  },
  'plant-lab': {
    A1: ['Put a label on the pot. Write the plant’s ___ on it.', 'name', 'sound', 'shoe size'],
    A2: ['Your plant was ten centimetres tall. It grew by two. Record its new ___.', 'height of twelve centimetres', 'height of eight centimetres', 'weight of twelve grams'],
    B1: ['Two seedlings are different heights. What would help you compare their growth fairly?', 'Measure both at the same time each day', 'Use a different unit for each plant', 'Measure only the taller seedling'],
  },
} as const;

export function workshopAudio(id: WorkshopId, tier: EnglishTier, alternate = false) {
  const [line, prompt, answer, b, c] = (alternate ? secondBriefings : workshopBriefings)[id][tier];
  return listen(id+'-'+tier.toLowerCase()+(alternate?'-2':''),line,prompt,[answer,b,c],line);
}
