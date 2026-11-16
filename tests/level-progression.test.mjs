import { test } from 'node:test';
import assert from 'node:assert/strict';
import { statSync } from 'node:fs';
import { storyPosition, nearStoryLocation } from '../src/lib/campaign-locations.ts';
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
  const ids = LEVEL_MISSION_IDS.filter(id => LEVEL_MISSIONS[id].level >= 4);
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
