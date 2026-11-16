import { test } from 'node:test';
import assert from 'node:assert/strict';
import { statSync } from 'node:fs';
import { storyPosition, nearStoryLocation } from '../src/lib/campaign-locations.ts';
import { SPEAKING_MISSIONS } from '../src/lib/speaking-missions.ts';
import { matchesSpokenAnswer } from '../src/lib/speaking-answer.ts';
import { MISSION_EXERCISES, isTypedAnswerCorrect, missionAudioPath } from '../src/lib/mission-exercises.ts';
import { TIER_LEVEL, englishTier, LEVEL_MISSION_IDS, LEVEL_MISSIONS } from '../src/lib/cadet-tiers.ts';
import { advanceBalance, BALANCE_TIERS, startBalance } from '../src/lib/balance-challenge.ts';
import { levelMissionRound, placePracticeRound, practiceQuestionKey } from '../src/lib/place-practice.ts';
import { cadetLevel, completeChallenge } from '../src/lib/challenge-xp.ts';
import { activityRounds } from '../src/lib/activities.ts';
import { earnedXP, freshProgress, restoreProgress } from '../src/lib/game.ts';

function checkFresh(previous, current) {
  assert.ok(current.every(id => !previous.includes(id)));
  assert.equal(new Set(current).size, current.length);
}

test('first clears unlock A2 and B1 at the saved XP thresholds and award each mission once', () => {
  assert.equal(TIER_LEVEL.A2, 2);
  assert.equal(TIER_LEVEL.B1, 3);
  assert.equal(englishTier(cadetLevel(149).level), 'A1');
  assert.equal(englishTier(cadetLevel(150).level), 'A2');
  assert.equal(englishTier(cadetLevel(299).level), 'A2');
  assert.equal(englishTier(cadetLevel(300).level), 'B1');
  const ids = ['station/balance', 'station/balance/A2', 'mission/field-briefing', 'race/swimming/A2', 'quiz/training'];
  const challenges = ids.reduce(completeChallenge, []);
  assert.equal(completeChallenge(challenges, 'mission/field-briefing'), challenges);
  const progress = restoreProgress(JSON.stringify({ ...freshProgress(), name: 'Tester', challenges }));
  assert.equal(earnedXP(progress), 280);
  const next = { ...progress, challenges: completeChallenge(challenges, 'quiz/swimming') };
  assert.equal(englishTier(cadetLevel(earnedXP(next)).level), 'B1');
});

test('level missions, local quizzes and exams draw fresh questions on consecutive attempts', () => {
  for (const id of LEVEL_MISSION_IDS) {
    const previous = levelMissionRound(id, []).map(practiceQuestionKey);
    assert.equal(previous.length, LEVEL_MISSIONS[id].count);
    checkFresh(previous, levelMissionRound(id, previous).map(practiceQuestionKey));
  }
  for (const tier of ['A1', 'A2', 'B1']) {
    for (const [area, pet] of [['vegetable-garden'], ['dormitory'], ['swimming'], ['fish-pond', 'fish']]) {
      const previous = placePracticeRound(area, tier, [], pet).map(practiceQuestionKey);
      checkFresh(previous, placePracticeRound(area, tier, previous, pet).map(practiceQuestionKey));
    }
    const previous = activityRounds('academy', tier).map(q => q.id);
    checkFresh(previous, activityRounds('academy', tier, previous).map(q => q.id));
  }
});

test('each beam tier gives more checkpoints and a shorter time window, with new prompts on retry', () => {
  const tiers = ['A1', 'A2', 'B1'];
  for (const [index, tier] of tiers.entries()) {
    const run = startBalance(0, () => .5, tier);
    const previous = run.questions.map(q => q.prompt);
    assert.equal(previous.length, 3 + index);
    const quiz = advanceBalance(run, 1100);
    assert.equal(quiz.stage.deadline - 1100, BALANCE_TIERS[tier].seconds * 1000);
    checkFresh(previous, startBalance(0, () => .5, tier, previous).questions.map(q => q.prompt));
  }
});

test('levels four through ten unlock a different location with a full mix of listening and typing', () => {
  const zones = new Set();
  const ids = LEVEL_MISSION_IDS.filter(id => LEVEL_MISSIONS[id].level >= 4 && LEVEL_MISSIONS[id].level <= 10);
  let progress = { ...freshProgress(), name: 'Tester', challenges: [
    'station/balance', 'station/balance/A2', 'station/balance/B1', 'mission/field-briefing',
    'mission/team-leader', 'station/rescue-ring',
  ] };
  assert.deepEqual(ids.map(id => LEVEL_MISSIONS[id].level), [4, 5, 6, 7, 8, 9, 10]);
  assert.equal(earnedXP(progress), 450);
  for (const id of ids) {
    const mission = LEVEL_MISSIONS[id], level = cadetLevel(earnedXP(progress)).level;
    assert.equal(mission.level, level);
    assert.ok(!zones.has(mission.area));
    zones.add(mission.area);
    const target = storyPosition(mission.area);
    assert.equal(nearStoryLocation(mission.area, target), true);
    const questions = levelMissionRound(id, []);
    assert.equal(questions.filter(q => q.kind === 'listen').length, mission.listen);
    assert.equal(questions.filter(q => q.kind === 'dictation').length, mission.dictation);
    assert.equal(questions.filter(q => q.kind === 'fill').length, 2);
    const challenges = completeChallenge(progress.challenges, `mission/${id}`);
    assert.equal(completeChallenge(challenges, `mission/${id}`), challenges);
    progress = restoreProgress(JSON.stringify({ ...progress, challenges }));
    assert.equal(cadetLevel(earnedXP(progress)).level, level + 1);
  }
});

test('typed exercises check the word and every spoken exercise has a unique recording', () => {
  const examples = Object.values(MISSION_EXERCISES).flat();
  const recordingIds = new Set();
  for (const question of examples) {
    if (question.kind !== 'listen') {
      assert.equal(isTypedAnswerCorrect(question, `  ${question.answer.toUpperCase()}.  `), true);
      assert.equal(isTypedAnswerCorrect(question, ''), false);
      for (const variant of question.alternatives ?? []) assert.equal(isTypedAnswerCorrect(question, variant), true);
      assert.equal(isTypedAnswerCorrect(question, `${question.answer}s-not-an-answer`), false);
    }
    if ('transcript' in question) {
      assert.ok(!recordingIds.has(question.id));
      recordingIds.add(question.id);
      if (question.kind === 'dictation') assert.ok(question.transcript.toLowerCase().includes(question.answer));
      if (question.kind === 'listen') assert.ok(question.options.includes(question.answer));
      const audio = new URL(`../public${missionAudioPath(question.id)}`, import.meta.url);
      assert.ok(statSync(audio).size > 1000, question.id);
    }
  }
  assert.equal(recordingIds.size, 44);
});

test('levels eleven to twenty rotate speaking prompts at ten distinct reachable destinations', () => {
  const ids = Object.keys(SPEAKING_MISSIONS);
  assert.deepEqual(ids.map(id => LEVEL_MISSIONS[id].level), Array.from({ length: 10 }, (_, i) => 11 + i));
  assert.equal(new Set(LEVEL_MISSION_IDS.map(id => LEVEL_MISSIONS[id].area)).size, LEVEL_MISSION_IDS.length);
  const keys = new Set(Object.values(MISSION_EXERCISES).flat().map(question => question.id));
  let clips = 0;
  for (const id of ids) {
    const mission = LEVEL_MISSIONS[id];
    const position = storyPosition(mission.area);
    assert.ok(nearStoryLocation(mission.area, position));
    for (const q of SPEAKING_MISSIONS[id]) {
      assert.ok(!keys.has(q.id));
      keys.add(q.id);
      if ('transcript' in q) {
        assert.ok(statSync(new URL(`../public${missionAudioPath(q.id)}`, import.meta.url)).size > 1000);
        clips++;
      }
      if (q.kind === 'repeat') assert.equal(q.answer, q.transcript);
    }
    const round = levelMissionRound(id, []);
    assert.equal(round.filter(q => q.kind === 'repeat').length, mission.speak);
    assert.equal(round.filter(q => q.kind === 'listen').length, mission.listen);
    assert.equal(round.filter(q => q.kind === 'fill').length, 1);
    const key = `mission/${id}`;
    const progress = restoreProgress(JSON.stringify({ ...freshProgress(), name: 'Tester', challenges: [key, key] }));
    assert.deepEqual(progress.challenges, [key]);
    assert.equal(earnedXP(progress), 150);
  }
  assert.equal(clips, 80);
  const firstPhrases = SPEAKING_MISSIONS[ids[0]].filter(q => q.kind === 'repeat').map(q => q.answer.split(' ').length);
  const finalPhrases = SPEAKING_MISSIONS[ids.at(-1)].filter(q => q.kind === 'repeat').map(q => q.answer.split(' ').length);
  assert.ok(Math.min(...finalPhrases) > Math.max(...firstPhrases));
});

test('speech scoring tolerates punctuation, spelling conventions and contractions while requiring the complete message', () => {
  const phrase = 'Do not use the programme until the organisers have checked it.';
  assert.ok(matchesSpokenAnswer(phrase, '  Don’t use the program until the organizers have checked it! '));
  assert.ok(matchesSpokenAnswer('Warm-up starts beside the touchline.', 'warm up starts beside the touch line'));
  assert.equal(matchesSpokenAnswer(phrase, 'Use the programme until the organisers have checked it.'), false);
  assert.equal(matchesSpokenAnswer(phrase, 'Do not use the programme.'), false);
  assert.equal(matchesSpokenAnswer('Meet your group beside the welcome board.', 'Meet your group behind the welcome board'), false);
});
