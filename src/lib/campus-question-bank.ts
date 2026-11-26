import { recreationQuestions } from './recreation-lessons.ts';
import { PARK_ZONES } from './recreation-park.ts';
import { workshopQuestions } from './workshop-lessons.ts';
import type { EnglishTier } from './cadet-tiers.ts';
import { gap, type EnglishQuestion } from './level-questions.ts';

// Each situation stays at its campus location as the learner changes level.
export const areaQuestions: Record<string, Record<EnglishTier, EnglishQuestion>> = {
  ...Object.fromEntries(PARK_ZONES.map(p=>[p.id,{A1:recreationQuestions(p.id,'A1')[0],A2:recreationQuestions(p.id,'A2')[0],B1:recreationQuestions(p.id,'B1')[0]}])),
  ...workshopQuestions,
  courtyard: {
    A1: gap('A new student says “Nice to meet you.” You reply, “___.”', 'Nice to meet you too', 'Here is your change', 'At half past nine', 'Return a greeting when someone introduces themselves.'),
    A2: gap('An was waiting by the gate when his classmates ___.','arrived','were arrive','have arrive','The arrival interrupted the wait, so use the past simple.'),
    B1: gap('The guide asked whether we ___ the meeting point the day before.','had seen','will see','are seeing','The visit happened before the guide asked about it.'),
  },
  library: {
    A1: gap('Which label helps you find a book about the past?', 'History','Music','Science','History books describe people and events from the past.'),
    A2: gap('This book belongs to Lan. It is ___.','hers','her','she','Use the possessive pronoun hers without a noun after it.'),
    B1: gap('The novel, ___ was donated last year, is now on display.','which','whose','where','Which refers to the novel and introduces extra information.'),
  },
  canteen: {
    A1: gap('The cashier says “That is fifteen thousand dong.” What do you do next?','Pay for the food','Borrow a book','Put on goggles','The cashier has told you the price of your order.'),
    A2: gap('There are only ___ sandwiches left in the canteen.','a few','a little','much','Sandwiches are countable, so use a few.'),
    B1: gap('I would have bought lunch if I ___ my wallet.','had brought','bring','will bring','Use if plus past perfect for an unreal past condition.'),
  },
  dormitory: {
    A1: gap('The bed is untidy. Please straighten the ___.','blanket','ladder','menu','A blanket covers a bed and can be straightened or folded.'),
    A2: gap('Whose boots are these? They belong ___ my roommate.','to','for','of','Use belong to before the owner.'),
    B1: gap('We divided the chores so that nobody ___ to clean the whole room alone.','had','having','have had','Use had to to describe a duty in the past.'),
  },
  classrooms: {
    A1: gap('The teacher asks you to write the date. Pick up your ___.','pen','tray','towel','A pen is a tool for writing.'),
    A2: gap('Linh ___ her hand because she wanted to answer.','raised','rose','risen','Raise something means to lift it. The past form is raised.'),
    B1: gap('The instructions were so clear that we could work ___ asking for help.','without','unless','despite of','Without precedes a noun or an -ing form.'),
  },
  'classroom-b': {
    A1: gap('Two pupils share one desk. How many pupils sit there?','Two','One','Three','Two pupils means a pair of students.'),
    A2: gap('Neither answer is on the board. Please write ___ of them.','both','much','every','Both refers to two things together.'),
    B1: gap('By the time the second lesson began, we ___ our pairs.','had chosen','have chosen','will choose','The pairs were chosen before a second past event.'),
  },
  computer: {
    A1: gap('To type your name, use the ___.','keyboard','screen','speaker','A keyboard has the letter keys you press to type.'),
    A2: gap('The screen went dark while I ___ a sentence.','was typing','have typed','am type','Use was typing for the action in progress at that past moment.'),
    B1: gap('Create a second copy in case the original file ___ damaged.','gets','would get','getting','After in case, the present simple describes a possible future problem.'),
  },
  language: {
    A1: gap('You cannot hear the recording. Ask the teacher to turn the volume ___.','up','off','away','Turn the volume up means make the sound louder.'),
    A2: gap('Please speak a little ___. I cannot follow such fast speech.','more slowly','slowest','slowly than','More slowly asks for a change in speaking speed.'),
    B1: gap('The tutor suggested ___ our voices and playing them back.','recording','to record','record','Suggest is followed by a noun or an -ing form.'),
  },
  dining: {
    A1: gap('Pass me a ___ so I can eat my soup.','spoon','knife','plate','A spoon holds a small amount of liquid.'),
    A2: gap('We need six chairs, but there are only four. We need two ___.','more','most','many','Two more means another two in addition to the four.'),
    B1: gap('Meals will be served as soon as the tables ___.','are set','will set','setting','The tables receive the action, and the time clause takes the present simple.'),
  },
  hall: {
    A1: gap('Visitors clap after the song. What are they doing?','Applauding','Whispering','Rehearsing','Applauding means clapping to show appreciation.'),
    A2: gap('An is taller than Mai, so Mai is ___ than An.','shorter','shortest','short','Use the comparative to describe two different heights.'),
    B1: gap('The exhibition was postponed ___ the lights had stopped working.','because','although','despite','Because introduces the reason for postponing the event.'),
  },
  sports: {
    A1: gap('Which player usually wears gloves in a football match?','The goalkeeper','The striker','The referee','The goalkeeper wears gloves to catch the ball.'),
    A2: gap('Our team ___ two goals in the second half yesterday.','scored','scores','has scoring','Yesterday places the action in the finished past.'),
    B1: gap('Even though our team was losing, the players kept ___ for the ball.','asking','ask','to asking','Keep doing something means continue doing it.'),
  },
  garden: {
    A1: gap('You want to sit and read outdoors. Look for a ___.','bench','basket','bucket','A bench is a long seat for several people.'),
    A2: gap('It began to rain, so Lan put her book ___ her bag.','into','between','along','Into shows movement from outside the bag to inside it.'),
    B1: gap('The bench ___ we usually read has been moved into the shade.','where','whose','which it','Where introduces the place in which the reading happens.'),
  },
  'vegetable-garden': {
    A1: gap('Which part of a carrot grows under the soil?','The root','The flower','The leaf','The orange part of a carrot is its root.'),
    A2: gap('How ___ water is left in the watering can?','much','many','few','Water is uncountable, so ask how much.'),
    B1: gap('The labels keep the seedlings from ___ mixed up.','getting','get','to get','The preposition from is followed by an -ing form.'),
  },
  livestock: {
    A1: gap('A hen lays an ___.','egg','apple','acorn','A hen is a female chicken and lays eggs.'),
    A2: gap('We checked the gate before ___ the goats into the pen.','letting','let','to let','Before can be followed by an -ing form.'),
    B1: gap('The keeper asked how often the drinking bowls ___.','were washed','did wash','were they washed','In a reported question, use statement word order and the passive here.'),
  },
  'fish-pond': {
    A1: gap('You see three fish. One swims away. How many can you still see?','Two','Four','One','Three minus one leaves two fish.'),
    A2: gap('The fish came up to the surface as soon as the food ___ the water.','hit','hits','is hitting','The past form of hit has the same spelling as the base verb.'),
    B1: gap('Base the report on observations and avoid ___ what happened underwater.','guessing','guess','to guessing','Avoid is followed by a verb in the -ing form.'),
  },
  training: {
    A1: gap('The coach says “Stand in pairs.” Find ___ partner.','one','three','five','A pair has two people, so each person needs one partner.'),
    A2: gap('The beam is narrow. Take ___ steps than you take on the ground.','shorter','shortest','short','Than calls for a comparative adjective.'),
    B1: gap('We would finish the circuit sooner if everyone ___ the signs carefully.','read','reads','will read','An imagined condition uses the past simple, here spelled read.'),
  },
  swimming: {
    A1: gap('After swimming, dry your hair with a ___.','towel','ticket','tray','A towel absorbs water from hair and skin.'),
    A2: gap('Linh forgot her goggles, so I lent her ___.','mine','my','me','Mine replaces my goggles without repeating the noun.'),
    B1: gap('Swimmers must stay on the deck until they ___ permission to enter.','are given','will give','are giving','They receive permission, so use the present passive in the time clause.'),
  },
  athletics: {
    A1: gap('Which object measures how long a runner takes?','A stopwatch','A compass','A ruler','A stopwatch measures elapsed time.'),
    A2: gap('An ran the last lap in ___ time than his first lap.','less','fewer','few','Use less with the uncountable noun time.'),
    B1: gap('Having crossed the finish line, Mai stopped ___ her time.','to check','to checking','check','Stop to do something means pause one action in order to do another.'),
  },
  'field-games': {
    A1: gap('Your teammate is next in the relay. Hand them the ___.','baton','ticket','towel','Relay runners pass a baton from one runner to the next.'),
    A2: gap('The sack was too small for both feet to fit ___.','inside','between','across','Inside means within the sack.'),
    B1: gap('The team practised every handover to avoid ___ the baton.','dropping','to drop','drop','Avoid takes an -ing form.'),
  },
};
