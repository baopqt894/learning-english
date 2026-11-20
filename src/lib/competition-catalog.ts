import { basicRaceExercises } from './race-questions-basic.ts';
import { elementaryRaceExercises } from './race-questions-elementary.ts';
import { beginnerRaceExercises } from './race-questions-beginner.ts';
import { intermediateRaceExercises } from './race-questions-intermediate.ts';
import { advancedRaceExercises } from './race-questions-advanced.ts';
import { extraRaceQuestions } from './race-question-bank.ts';
import { drawQuestions, shuffled } from './question-rotation.ts';
import { SPORTS_VENUES, ATHLETICS_TRACK, FIELD_GAMES_COURSE, STADIUM_LOBBIES, type SportsVenueId } from './sports-layout.ts';
import { SWIM_QUESTIONS } from './swim-race.ts';
export type CompetitionId='swimming'|'sprint'|'hurdles'|'sack'|'relay';
export const DIFFICULTIES = {
  basic: { label: 'Basic', level: 'A1', seconds: 24, topic: 'First words, colours and numbers' },
  elementary: { label: 'Elementary', level: 'A1', seconds: 21, topic: 'Short messages and everyday routines' },
  beginner: { label: 'Beginner', level: 'A1', seconds: 18, topic: 'Everyday words and short instructions' },
  intermediate: { label: 'Intermediate', level: 'A2', seconds: 15, topic: 'Past events, comparisons and advice' },
  advanced: { label: 'Advanced', level: 'B1', seconds: 13, topic: 'Conditionals, reported speech and race strategy' },
} as const;
export type RaceDifficulty = keyof typeof DIFFICULTIES;
export const DIFFICULTY_IDS = Object.keys(DIFFICULTIES) as RaceDifficulty[];
export const RECORD_MIN_CORRECT = 3;
export type RaceQuestion={id:string;passageId?:string;sentence:string;choices:string[];answer:number;explanation:string;kind?:'listen'|'choice'|'fill';audio?:string;alternatives?:string[]};
const q=(id:string,sentence:string,choices:string[],answer:string,explanation:string):RaceQuestion=>({id,sentence,choices,answer:choices.indexOf(answer),explanation});
export const COMPETITIONS={
 swimming:{id:'swimming',title:'Swim & solve',subtitle:'25 m freestyle',zone:'swimming',station:'pool',venue:SPORTS_VENUES.pool.name,distance:25,x:75,z:-51,w:29,d:21,axis:'x',start:62.5,lobby:{x:58,z:-51},arrival:SPORTS_VENUES.pool.approach,verb:'swim'},
 sprint:{id:'sprint',title:'Word sprint',subtitle:'40 m running race',zone:'athletics',station:'track',venue:SPORTS_VENUES.track.name,distance:40,x:ATHLETICS_TRACK.x,z:ATHLETICS_TRACK.z,w:ATHLETICS_TRACK.w,d:ATHLETICS_TRACK.d,axis:'x',start:ATHLETICS_TRACK.start,lobby:STADIUM_LOBBIES.track,arrival:SPORTS_VENUES.track.approach,verb:'run'},
 hurdles:{id:'hurdles',title:'Grammar hurdles',subtitle:'40 m hurdle race',zone:'athletics',station:'track',venue:SPORTS_VENUES.track.name,distance:40,x:ATHLETICS_TRACK.x,z:ATHLETICS_TRACK.z,w:ATHLETICS_TRACK.w,d:ATHLETICS_TRACK.d,axis:'x',start:ATHLETICS_TRACK.start,lobby:STADIUM_LOBBIES.track,arrival:SPORTS_VENUES.track.approach,verb:'jump'},
 sack:{id:'sack',title:'Vocabulary hops',subtitle:'20 m sack race',zone:'field-games',station:'field',venue:SPORTS_VENUES.field.name,distance:20,x:FIELD_GAMES_COURSE.x,z:FIELD_GAMES_COURSE.z,w:FIELD_GAMES_COURSE.w,d:FIELD_GAMES_COURSE.d,axis:'z',start:FIELD_GAMES_COURSE.start,lobby:STADIUM_LOBBIES.field,arrival:SPORTS_VENUES.field.approach,verb:'hop'},
 relay:{id:'relay',title:'Message dash',subtitle:'20 m baton challenge',zone:'field-games',station:'field',venue:SPORTS_VENUES.field.name,distance:20,x:FIELD_GAMES_COURSE.x,z:FIELD_GAMES_COURSE.z,w:FIELD_GAMES_COURSE.w,d:FIELD_GAMES_COURSE.d,axis:'z',start:FIELD_GAMES_COURSE.start,lobby:STADIUM_LOBBIES.field,arrival:SPORTS_VENUES.field.approach,verb:'carry'},
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

const intermediate: RaceQuestion[] = [
  q('a2-1', 'We ___ at the venue ten minutes ago.', ['arrive', 'arrived', 'have arrived', 'are arriving'], 'arrived', '“Ago” locates an event in the finished past. Use the past simple.'),
  q('a2-2', 'While we ___ up, the coach checked the lanes.', ['warm', 'warmed', 'were warming', 'have warmed'], 'were warming', 'The past continuous describes the action already in progress.'),
  q('a2-3', 'You ___ bring a towel. There are some at the desk.', ['mustn’t', 'don’t have to', 'shouldn’t', 'can’t'], 'don’t have to', '“Don’t have to” means that bringing one is optional.'),
  q('a2-4', 'An finished much ___ than last week.', ['fast', 'fastest', 'faster', 'more fast'], 'faster', 'Use “much” before the comparative to show a large difference.'),
  q('a2-5', 'There aren’t ___ empty lanes left.', ['some', 'much', 'any', 'a little'], 'any', 'Use “any” with plural nouns in this negative sentence.'),
  q('a2-6', 'She went to the desk ___ for the event.', ['sign up', 'to sign up', 'signing up', 'signed up'], 'to sign up', '“To” + verb explains why she went to the desk.'),
  q('a2-7', 'This event is ___ for beginners. Everyone can join.', ['easy enough', 'enough easy', 'too easy', 'easier enough'], 'easy enough', 'Put “enough” after the adjective when something is sufficiently easy.'),
  q('a2-8', 'After training, I’m looking forward to ___ a rest.', ['have', 'having', 'had', 'has'], 'having', 'In “look forward to”, “to” is a preposition. Follow it with verb-ing.'),
];
const advanced: RaceQuestion[] = [
  q('b1-1', 'If I ___ my pace early on, I would have more energy at the end.', ['controlled', 'control', 'will control', 'would control'], 'controlled', 'Use if + past simple and would + base verb for a hypothetical situation.'),
  q('b1-2', 'By the time I reached the desk, my teammates ___ already registered.', ['have', 'had', 'were', 'would'], 'had', 'The past perfect marks an action that happened before another past event.'),
  q('b1-3', 'The coach said, “Stay in your lane.” He told us ___ in our lanes.', ['stay', 'stayed', 'staying', 'to stay'], 'to stay', 'Report an instruction using “tell” + person + “to” + verb.'),
  q('b1-4', '___ feeling nervous, Linh entered the race.', ['Although', 'Despite', 'However', 'Because'], 'Despite', '“Despite” can be followed by a verb in the -ing form.'),
  q('b1-5', 'The times ___ on the board after the race.', ['will post', 'will be posted', 'are posting', 'will have posted'], 'will be posted', 'Use “will be” + past participle when the focus is on the times being posted.'),
  q('b1-6', 'We won’t start ___ every player is ready.', ['until', 'during', 'while', 'since'], 'until', '“Until” gives the point when the delay ends.'),
  q('b1-7', 'The cadet ___ goggles broke borrowed mine.', ['who', 'whose', 'whom', 'which'], 'whose', '“Whose” shows that the goggles belong to the cadet.'),
  q('b1-8', 'I ___ get tired quickly, but now I can finish the course.', ['used to', 'am used to', 'use to', 'was used to'], 'used to', '“Used to” + base verb describes a past habit or state that has changed.'),
];
const swimA2 = [
  q('sw-a2-1', 'How ___ is the pool near the ladders?', ['far', 'deep', 'long', 'wide'], 'deep', 'Depth is the distance down from the surface to the bottom.'),
  q('sw-a2-2', 'We took a short break ___ two lengths of the pool.', ['after', 'since', 'during', 'until'], 'after', '“After” shows that the break came next.'),
  q('sw-a2-3', 'Water was getting in, so I ___ the strap on my goggles.', ['tighten', 'tightened', 'am tightening', 'will tighten'], 'tightened', 'Use the past simple for the adjustment you made at that moment.'),
  q('sw-a2-4', 'The lifeguard asked us ___ into the shallow end.', ['not dive', 'to not diving', 'not to dive', 'don’t dive'], 'not to dive', 'Use “ask someone not to do something” to report a request.'),
];
const trackA2 = [
  q('tr-a2-1', 'We have trained on this track ___ September.', ['for', 'since', 'during', 'at'], 'since', '“Since” gives the starting point of an action that continues to the present.'),
  q('tr-a2-2', 'Mai ___ her personal best by two seconds yesterday.', ['broke', 'broken', 'break', 'has broken'], 'broke', '“Yesterday” calls for the simple past. “Broke” is the past of “break”.'),
  q('tr-a2-3', 'Try ___ your pace steady on the first half.', ['keeps', 'keep', 'to keep', 'kept'], 'to keep', '“Try to keep” means make an effort to maintain something.'),
  q('tr-a2-4', 'You should take a break ___ you feel dizzy.', ['if', 'but', 'unless', 'although'], 'if', '“If” introduces the condition for taking a break.'),
];
const swimB1 = [
  q('sw-b1-1', 'Unless the lifeguard gives the signal, you ___ get into the pool.', ['shouldn’t', 'wouldn’t have', 'didn’t', 'could have'], 'shouldn’t', '“Unless” means “if not”. This sentence gives advice before a signal.'),
  q('sw-b1-2', 'Could you tell me ___?', ['where is the shallow end', 'where the shallow end is', 'where does the shallow end', 'where that shallow end'], 'where the shallow end is', 'Use statement word order after “Could you tell me”.'),
  q('sw-b1-3', 'I wish I ___ a spare pair of goggles with me.', ['have', 'will have', 'had', 'would have had'], 'had', 'Use wish + past simple for a present situation you want to change.'),
  q('sw-b1-4', 'Swimmers are advised ___ the handrail when leaving the water.', ['using', 'to use', 'use', 'used'], 'to use', '“Be advised to” is used to give formal advice.'),
];
const trackB1 = [
  q('tr-b1-1', 'If we pace ourselves, we ___ enough energy for the final stretch.', ['had', 'would have had', 'will have', 'having'], 'will have', 'Use if + present simple and will + verb for a possible future result.'),
  q('tr-b1-2', 'The runner kept going ___ she was out of breath.', ['despite', 'unless', 'because of', 'even though'], 'even though', '“Even though” introduces a contrasting clause with a subject and verb.'),
  q('tr-b1-3', 'The track ___ resurfaced since our last practice.', ['was', 'has been', 'will be', 'is being'], 'has been', 'Use the present perfect passive for work completed since a past point.'),
  q('tr-b1-4', 'I slowed down ___ I could save energy for the finish.', ['so that', 'as if', 'unless', 'even if'], 'so that', '“So that” introduces the purpose of slowing down.'),
];

const questionBanks = {
  pool: {
    beginner: [...SWIM_QUESTIONS,
      q('pool-towel', 'After a swim, dry your face with a ___.', ['ticket', 'towel', 'ladder', 'whistle'], 'towel', 'A towel absorbs water from your skin.')],
    intermediate: [...swimA2, ...intermediate,
      q('pool-length', 'Linh swam from one end to the other and back. How many lengths was that?', ['One', 'Two', 'Three', 'Four'], 'Two', 'Each trip from one end to the other counts as one length.')],
    advanced: [...swimB1, ...advanced,
      q('pool-notice', 'A notice reads “Lanes 1–3 reserved until noon.” At 11 am, which lane is available?', ['Lane 1', 'Lane 2', 'Lane 3', 'Lane 4'], 'Lane 4', 'The reservation covers only the first three lanes and is still in effect at eleven.')],
  },
  track: {
    beginner: [...common, ...sport.slice(0, 8),
      q('track-shoes', 'Tie your ___ before you run.', ['shoelaces', 'water bottles', 'stopwatches', 'scoreboards'], 'shoelaces', 'Tying your shoelaces keeps your shoes secure.')],
    intermediate: [...trackA2, ...intermediate,
      q('track-laps', 'Our coach asked us to run twice around the track. That means ___ laps.', ['half a', 'one', 'two', 'four'], 'two', 'One lap is one complete circuit. Twice around means two laps.')],
    advanced: [...trackB1, ...advanced,
      q('track-deadline', 'Entries close at 8:45 sharp. Which runner registered in time?', ['An at 8:44', 'Mai at 8:46', 'Bao at 8:50', 'Linh at 9:00'], 'An at 8:44', 'In time means before the deadline. Only An registered before 8:45.')],
  },
  field: {
    beginner: [...common, ...sport.slice(8),
      q('field-next', '“It is your turn.” Who goes next?', ['The coach', 'You', 'The whole team', 'The referee'], 'You', 'Your turn means you are the next person to take part.')],
    intermediate: [...intermediate,
      q('field-team', 'There are eight players. Make two equal teams. Each team has ___ players.', ['two', 'three', 'four', 'six'], 'four', 'Equal teams have the same number of players. Half of eight is four.')],
    advanced: [...advanced,
      q('field-spare', 'We brought a spare baton in case the first one ___.', ['breaks', 'breaking', 'to break', 'has breaking'], 'breaks', 'Use the present simple after in case for a possible future event.')],
  },
};

const campusExercises = {
  beginner: beginnerRaceExercises,
  intermediate: intermediateRaceExercises,
  advanced: advancedRaceExercises,
};

for (const bank of Object.values(questionBanks)) {
  for (const level of ['beginner', 'intermediate', 'advanced'] as const) bank[level].push(...extraRaceQuestions[level], ...campusExercises[level]);
}

// One written opener, then three mixed sets of one question per skill.
export const MIXED_RACE_SETS = 3;
export const RACE_QUESTION_COUNT = 1 + MIXED_RACE_SETS * 3;

export function drawRaceRound(mode: CompetitionId, difficulty: RaceDifficulty, previous: readonly string[]) {
  const bank = competitionQuestions(mode, difficulty);
  const source = (q: RaceQuestion) => q.passageId ?? q.id;
  const previousIds = new Set(previous);
  const recentSources = bank.filter(q => previousIds.has(q.id)).map(source);
  const draw = (kind: NonNullable<RaceQuestion['kind']>, count: number) => {
    const candidates = bank.filter(q => (q.kind ?? 'choice') === kind);
    const seen = new Set<string>();
    return drawQuestions(candidates, candidates.length, source, recentSources).filter(q => {
      if (seen.has(source(q))) return false;
      seen.add(source(q));
      return true;
    }).slice(0, count);
  };
  const choices = draw('choice', MIXED_RACE_SETS + 1);
  const clips = draw('listen', MIXED_RACE_SETS);
  const words = draw('fill', MIXED_RACE_SETS);
  // The written opener also gives phones time to preload the recordings.
  const order = [choices[0]];
  for (let i = 0; i < MIXED_RACE_SETS; i++) {
    order.push(...shuffled([choices[i+1], clips[i], words[i]]));
  }
  return order.map(q => q.id);
}

export function competitionQuestions(id: CompetitionId, difficulty: RaceDifficulty = 'beginner'): RaceQuestion[] {
  if (difficulty === 'basic') return basicRaceExercises;
  if (difficulty === 'elementary') return elementaryRaceExercises;
  return questionBanks[COMPETITIONS[id].station][difficulty];
}

export function venueCompetitions(venue: SportsVenueId) {
  return COMPETITION_IDS.filter(id => COMPETITIONS[id].station === venue);
}

export { ATHLETICS_TRACK } from './sports-layout.ts';
