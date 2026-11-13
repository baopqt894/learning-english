import { SWIM_QUESTIONS } from './swim-race.ts';
export type CompetitionId='swimming'|'sprint'|'hurdles'|'sack'|'relay';
export type RaceQuestion={id:string;sentence:string;choices:string[];answer:number;explanation:string};
const q=(id:string,sentence:string,choices:string[],answer:string,explanation:string):RaceQuestion=>({id,sentence,choices,answer:choices.indexOf(answer),explanation});
export const COMPETITIONS={
 swimming:{id:'swimming',title:'Swim & solve',subtitle:'25 m freestyle',zone:'swimming',venue:'Campus pool',distance:25,x:75,z:-51,w:29,d:21,axis:'x',start:62.5,lobby:{x:58,z:-51},arrival:{x:75,z:-32.25},verb:'swim'},
 sprint:{id:'sprint',title:'Word sprint',subtitle:'40 m running race',zone:'athletics',venue:'Training track',distance:40,x:0,z:-71,w:44,d:9,axis:'x',start:-20,lobby:{x:0,z:-65.8},arrival:{x:0,z:-65.8},verb:'run'},
 hurdles:{id:'hurdles',title:'Grammar hurdles',subtitle:'40 m hurdle race',zone:'athletics',venue:'Training track',distance:40,x:0,z:-71,w:44,d:9,axis:'x',start:-20,lobby:{x:0,z:-65.8},arrival:{x:0,z:-65.8},verb:'jump'},
 sack:{id:'sack',title:'Vocabulary hops',subtitle:'20 m sack race',zone:'field-games',venue:'School games field',distance:20,x:27,z:6,w:20,d:24,axis:'z',start:16,lobby:{x:40,z:8},arrival:{x:40,z:20.5},verb:'hop'},
 relay:{id:'relay',title:'Message dash',subtitle:'20 m baton challenge',zone:'field-games',venue:'School games field',distance:20,x:27,z:6,w:20,d:24,axis:'z',start:16,lobby:{x:40,z:8},arrival:{x:40,z:20.5},verb:'carry'},
} as const;
export const COMPETITION_IDS=Object.keys(COMPETITIONS) as CompetitionId[];
export const RACE_COLOURS=['#e7bd63','#89b798','#92c9dd','#e1a38b'];
const common:RaceQuestion[]=[
 q('c1','We ___ ready for the race.',['is','are','am','be'],'are','Use “are” with we, you and they.'),
 q('c2','The race starts ___ nine o’clock.',['at','on','in','from'],'at','Use “at” before a clock time.'),
 q('c3','Please ___ before you exercise.',['warm up','borrow','fold','harvest'],'warm up','“Warm up” means prepare your body for exercise.'),
 q('c4','Minh is ___ than An today.',['fast','faster','fastest','more fast'],'faster','Use “faster than” to compare two people.'),
 q('c5','We are ___ English together.',['learn','learns','learning','learned'],'learning','“Are” + verb-ing describes an action happening now.'),
 q('c6','Could you ___ that, please?',['repeat','repeats','repeating','repeated'],'repeat','After “could you”, use the base verb.'),
 q('c7','First warm up. ___ join your lane.',['Then','Yesterday','Under','Because'],'Then','“First … Then …” puts instructions in order.'),
 q('c8','Which word is the opposite of “slow”?',['deep','fast','wet','long'],'fast','Fast and slow describe opposite speeds.'),
 q('c9','If you need help, ___ the coach.',['ask','asks','asking','asked'],'ask','Instructions use the base verb.'),
 q('c10','We train ___ Monday.',['on','at','in','by'],'on','Use “on” with days of the week.'),
 q('c11','Let’s ___ our teammates.',['thank','thanks','thanking','thanked'],'thank','After “let’s”, use the base verb.'),
 q('c12','I ___ my water bottle yesterday.',['find','finds','found','finding'],'found','The past form of “find” is “found”.'),
];
const sport:RaceQuestion[]=[
 q('r1','She ___ every morning.',['run','runs','running','to run'],'runs','Use -s with she / he in the present simple.'),
 q('r2','Stay ___ your own lane.',['in','on','under','through'],'in','You run “in” a lane.'),
 q('r3','The finish line is ___ the start line.',['ahead of','inside','between','under'],'ahead of','“Ahead of” means farther forward.'),
 q('r4','Run ___ and keep your balance.',['carefully','careful','care','caring'],'carefully','An adverb describes how to run.'),
 q('r5','You ___ push another runner.',['must not','must','can','should'],'must not','“Must not” states a rule against unsafe behaviour.'),
 q('r6','The runners ___ waiting for the signal.',['are','is','am','has'],'are','“The runners” is plural.'),
 q('r7','Jump ___ the low hurdle.',['over','under','between','into'],'over','“Over” means passing above an obstacle.'),
 q('r8','Bend your ___ when you land.',['knees','goggles','books','seeds'],'knees','Your knees bend to help you land gently.'),
 q('r9','Hold the sack with ___ hands.',['both','much','every','another'],'both','“Both” means the two together.'),
 q('r10','Keep your feet ___ the sack.',['inside','above','behind','beside'],'inside','“Inside” means within something.'),
 q('r11','Carry the ___ to the finish line.',['baton','blanket','watering can','broom'],'baton','A baton is a short stick used in a relay.'),
 q('r12','Do not ___ the baton.',['drop','drops','dropped','dropping'],'drop','“Do not” is followed by the base verb.'),
];
export function competitionQuestions(id:CompetitionId){return id==='swimming'?SWIM_QUESTIONS:[...common,...sport];}

export const ATHLETICS_TRACK={x:0,z:-71,w:44,d:9};
