import {PETS,type PetId} from './pet-care.ts';
import { LEVEL_MISSIONS, type EnglishTier, type LevelMissionId } from './cadet-tiers.ts';
import { CAMPUS_ENGLISH, FIELD_BRIEFING_QUESTIONS, TEAM_LEADER_QUESTIONS, gap, type EnglishQuestion } from './level-questions.ts';
import { drawQuestions, shuffled } from './question-rotation.ts';

export type PlaceQuestion = EnglishQuestion;
const q=(prompt:string,options:string[],answer:string,explanation:string):PlaceQuestion=>({prompt,options,answer,explanation});
const order=(sentence:string):PlaceQuestion=>({prompt:'Put the words in order.',options:sentence.split(' ').reverse(),answer:sentence,explanation:`The complete sentence is: ${sentence}`,kind:'order'});
const vocab=(word:string,correct:string,wrong1:string,wrong2:string)=>q(`Choose the meaning of “${word}”.`,[correct,wrong1,wrong2],correct,`“${word}” means ${correct.toLowerCase()}.`);
export const PLACE_PRACTICE:Record<string,{title:string;questions:PlaceQuestion[]}>= {
 courtyard:{title:'Meet your team',questions:[q('My name ___ Minh.',['is','are','am'],'is','Use “is” after “My name”.'),vocab('left','Trái','Phải','Ở trên'),order('Could you help me please')]},
 library:{title:'Library word builder',questions:[order('Could I borrow this book please'),vocab('shelf','Kệ sách','Cửa sổ','Giỏ'),q('Please be ___ in the library.',['quiet','loud','wet'],'quiet','Quiet means making little noise.')]},
 canteen:{title:'Canteen conversation',questions:[q('I ___ like some water, please.',['would','am','has'],'would','“I would like …” is a polite request.'),vocab('change','Tiền thừa','Cái chăn','Luống rau'),q('A sandwich is 20,000 dong and water is 5,000 dong. Total?',['25,000 dong','15,000 dong','30,000 dong'],'25,000 dong','Add the two prices: 20,000 + 5,000.')]},
 dormitory:{title:'Barracks duty',questions:[vocab('fold','Gấp','Tưới','Chạy'),q('Put the books ___ the shelf.',['on','under','between'],'on','Books rest on top of the shelf.'),order('We have cleaned our room')]},
 classrooms:{title:'Classroom grammar',questions:[q('We ___ students.',['are','is','am'],'are','Use “are” with “we”.'),q('Class begins ___ eight o’clock.',['at','on','in'],'at','Use “at” before a clock time.'),order('My name is Minh')]},
 'classroom-b':{title:'Grammar workshop',questions:[q('She ___ English every day.',['studies','study','studying'],'studies','She + study becomes “studies”.'),q('He ___ not have a pen.',['does','do','is'],'does','Use “does not” with he or she.'),q('We meet ___ Monday.',['on','at','in'],'on','Use “on” before a day.')]},
 computer:{title:'Computer lab vocabulary',questions:[vocab('save','Lưu','Xóa','Đọc'),q('Click Save to keep your ___.',['file','blanket','broom'],'file','A file stores computer information.'),q('Keep your password ___.',['private','loud','open'],'private','Private means you do not share it with everyone.')]},
 language:{title:'Listening and sentence studio',questions:[order('Could you repeat that please'),vocab('listen','Lắng nghe','Quét dọn','Bơi'),q('Let’s ___ English together.',['speak','speaks','speaking'],'speak','Use the base verb after “let’s”.')]},
 dining:{title:'Dining hall manners',questions:[q('___ your hands before eating.',['Wash','Plant','Fold'],'Wash','Wash your hands before a meal.'),vocab('plate','Cái đĩa','Luống đất','Mũ'),order('May I have some rice please')]},
 hall:{title:'Welcome to Discovery Day',questions:[order('Welcome to our English exhibition'),q('We have ___ the displays.',['prepared','prepare','prepares'],'prepared','Use the past participle after “have”.'),vocab('teamwork','Làm việc nhóm','Cái bàn','Bơi nhanh')]},
 sports:{title:'Team sports English',questions:[vocab('goal','Bàn thắng','Cái giường','Vòi nước'),q('Pass the ball to your ___.',['teammate','blanket','seed'],'teammate','A teammate is on your team.'),q('Play ___ and follow the rules.',['fairly','fair','fairness'],'fairly','Use an adverb to describe how to play.')]},
 garden:{title:'Reading garden discovery',questions:[vocab('shade','Bóng mát','Cái bát','Thức ăn'),q('I enjoy ___ in the garden.',['reading','read','reads'],'reading','Use verb-ing after “enjoy”.'),order('Please keep the garden clean')]},
 'vegetable-garden':{title:'Garden sequence challenge',questions:[q('First prepare the soil. Then ___ the seeds.',['sow','borrow','fold'],'sow','Sow means put seeds in the soil.'),vocab('harvest','Thu hoạch','Mượn sách','Đi bộ'),order('Water the plants gently')]},
 livestock:{title:'Animal care English',questions:[vocab('feed','Cho ăn','Chạy','Xếp sách'),q('Animals need clean ___ every day.',['water','books','boots'],'water','All animals need fresh drinking water.'),q('We ___ the animals every morning.',['feed','feeds','feeding'],'feed','Use the base verb with “we”.')]},
 'fish-pond':{title:'Fish pond observation',questions:[q('The fish are ___ in the pond.',['swimming','running','reading'],'swimming','Fish swim through the water.'),vocab('pond','Ao cá','Thư viện','Cái mũ'),q('Give the fish a ___ portion of food.',['small','huge','dirty'],'small','A small portion helps avoid overfeeding.')]},
 training:{title:'Follow the training commands',questions:[q('Jump ___ the low wall.',['over','under','inside'],'over','Over means passing above something.'),vocab('balance','Giữ thăng bằng','Cái đĩa','Tưới cây'),order('Walk slowly and keep your balance')]},
 swimming:{title:'Pool safety quiz',questions:[q('___ run on a wet pool deck.',['Do not','Always','Please'],'Do not','Running on wet surfaces is unsafe.'),vocab('goggles','Kính bơi','Cái chổi','Sách'),q('Ask the ___ if you need help.',['lifeguard','basket','seed'],'lifeguard','The lifeguard helps keep swimmers safe.')]},
 athletics:{title:'Athletics word sprint',questions:[q('Minh is ___ than An.',['faster','fast','fastest'],'faster','Use “faster than” to compare two runners.'),q('Stay in your own ___.',['lane','shelf','bowl'],'lane','A lane is your marked running space.'),order('Warm up before the race')]},
 'field-games':{title:'Field games commands',questions:[vocab('baton','Gậy tiếp sức','Cái giường','Thức ăn'),q('Hold the sack with ___ hands.',['both','much','every'],'both','Both means the two together.'),order('Be kind to your teammates')]},
};
export function feedingQuestions(id:PetId):PlaceQuestion[]{const pet=PETS[id];return [q(`What should you give the ${pet.name.toLowerCase()}?`,[pet.food,'plastic bags','books'],pet.food,`${pet.name} need suitable food: ${pet.food}.`),q('Before feeding, check that the water is ___.',['clean','dirty','empty'],'clean','Animals need clean drinking water.'),q(`We ___ the ${pet.name.toLowerCase()} every day.`,['feed','feeds','feeding'],'feed','Use “feed” with “we”.')];}

const zoneQuestions = {
  'vegetable-garden': {
    A2: [
      gap('We finished planting the seeds ___ the rain started.', 'before', 'since', 'during', 'Before puts the planting earlier than the start of the rain.'),
      gap('These seedlings need ___ water than the older plants.', 'less', 'fewer', 'least', 'Use less with an amount of water.'),
      gap('If the soil feels dry, ___ the seedlings gently.', 'water', 'watering', 'waters', 'In the instruction after if, use the base verb.'),
    ],
    B1: [
      gap('The seedlings must ___ before they are moved outside.', 'be watered', 'water', 'be watering', 'The seedlings receive the action. Use must be plus a past participle.'),
      gap('If we had a larger bed, we ___ more vegetables.', 'could grow', 'will grow', 'grew', 'Could grow describes a possible result in an imagined situation.'),
      gap('Keep the newly sown bed covered ___ the birds cannot reach the seeds.', 'so that', 'unless', 'even though', 'So that gives the purpose of covering the bed.'),
    ],
  },
  dormitory: {
    A2: [
      gap('We ___ the floor while Linh was folding the blankets.', 'were sweeping', 'sweep', 'have swept', 'The past continuous describes actions happening at the same time.'),
      gap('There are ___ clean blankets for all the beds.', 'enough', 'much', 'a little', 'Enough means there are as many as you need.'),
      gap('Please put the books ___ before you leave.', 'away', 'along', 'through', 'Put something away means return it to its proper place.'),
    ],
    B1: [
      gap('All bags should ___ under the beds before the inspection.', 'be stored', 'store', 'have storing', 'Use should be plus a past participle for what happens to the bags.'),
      gap('Linh said she ___ the shelves before the inspection started.', 'had tidied', 'will tidy', 'has tidied', 'The past perfect describes the earlier of the two past events.'),
      gap('The room looks tidy ___ one bed is still unmade.', 'although', 'despite', 'because of', 'Although is followed by a clause with a subject and verb.'),
    ],
  },
  swimming: {
    A2: [
      gap('If someone needs help in the pool, you ___ tell the lifeguard at once.', 'should', 'shouldn’t', 'can’t', 'Should gives advice about what to do.'),
      gap('The deck is slippery. Walk ___ than you normally do.', 'more slowly', 'slowest', 'slowerly', 'More slowly compares two ways of walking.'),
      gap('Swimmers are waiting for the signal ___ they enter the pool.', 'before', 'since', 'during', 'Before puts the signal earlier than entry into the pool.'),
    ],
    B1: [
      gap('The inspection must be finished first. The pool cannot reopen until the equipment ___ checked.', 'has been', 'is being', 'will have', 'Has been checked means the inspection must be complete first.'),
      gap('The lifeguard told us ___ near the ladder.', 'not to run', 'don’t run', 'not running', 'Report a negative instruction with told us not to plus a verb.'),
      gap('Unless a lifeguard is on duty, swimmers ___ enter the water.', 'mustn’t', 'would have', 'had to', 'Unless means if not. Mustn’t describes what is forbidden.'),
    ],
  },
  training: { A2: FIELD_BRIEFING_QUESTIONS, B1: CAMPUS_ENGLISH.B1 },
  hall: { A2: CAMPUS_ENGLISH.A2, B1: TEAM_LEADER_QUESTIONS },
};

const animalQuestions = {
  A2: [
    gap('Give the animals a little food ___ they finish their last portion.', 'after', 'during', 'since', 'After tells you when the next portion can be given.'),
    gap('There is still ___ food in the feeder, so wait before adding more.', 'some', 'many', 'a few', 'Use some with a positive statement about an amount of food.'),
    gap('Today the animals are eating ___ than yesterday.', 'more slowly', 'slowest', 'more slow', 'More slowly compares the way they eat on two days.'),
  ],
  B1: [
    gap('The bowl should ___ before it is refilled.', 'be cleaned', 'clean', 'have cleaning', 'The bowl receives the action, so use should be plus a past participle.'),
    gap('If we refilled the feeder now, there ___ too much food in it.', 'would be', 'will be', 'had been', 'Use would be for the result of an imagined action.'),
    gap('The keeper asked us ___ the animals until she returned.', 'not to feed', 'don’t feed', 'not feeding', 'Use asked us not to plus a verb to report a negative request.'),
  ],
};

function mix(question: PlaceQuestion) {
  const options = shuffled(question.options);
  if (question.kind === 'order' && options.join(' ') === question.answer) options.reverse();
  return { ...question, options };
}
export function practiceQuestionKey(question: PlaceQuestion) {
  return question.kind === 'order' ? question.answer : question.prompt;
}
export function placePracticeRound(area: string, tier: EnglishTier, previous: readonly string[], feeding?: PetId) {
  const local = (PLACE_PRACTICE[area] ?? PLACE_PRACTICE.courtyard).questions;
  if (feeding) {
    const pet = PETS[feeding];
    const foodQuestions = [
      feedingQuestions(feeding)[0],
      gap(`Complete the note for the ${pet.name.toLowerCase()}: “Please bring ___ for feeding.”`, pet.food, 'paper scraps', 'empty bottles', `The right feed is ${pet.food}.`),
      gap(`Which item belongs in the food bucket for the ${pet.name.toLowerCase()}?`, pet.food, 'plastic cups', 'sweeping brushes', `Choose food suited to this animal: ${pet.food}.`),
    ];
    const care = tier === 'A1' ? [...feedingQuestions(feeding).slice(1), ...CAMPUS_ENGLISH.A1] : [...animalQuestions[tier], ...CAMPUS_ENGLISH[tier]];
    return shuffled([...drawQuestions(foodQuestions, 1, practiceQuestionKey, previous), ...drawQuestions(care, 2, practiceQuestionKey, previous)]).map(mix);
  }
  const contextual: readonly PlaceQuestion[] = tier === 'A1' ? local
    : area === 'livestock' || area === 'fish-pond' ? animalQuestions[tier]
    : (zoneQuestions[area as keyof typeof zoneQuestions]?.[tier] ?? CAMPUS_ENGLISH[tier].slice(0, 4));
  const contextQuestion = drawQuestions(contextual, 1, practiceQuestionKey, previous);
  const rest = CAMPUS_ENGLISH[tier].filter(question => question !== contextQuestion[0]);
  return shuffled([...contextQuestion, ...drawQuestions(rest, 2, practiceQuestionKey, previous)]).map(mix);
}

export function levelMissionRound(id: LevelMissionId, previous: readonly string[]) {
  const bank = id === 'field-briefing' ? FIELD_BRIEFING_QUESTIONS : TEAM_LEADER_QUESTIONS;
  return drawQuestions(bank, LEVEL_MISSIONS[id].count, practiceQuestionKey, previous).map(mix);
}
