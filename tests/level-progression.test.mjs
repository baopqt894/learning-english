import { test } from 'node:test';
import assert from 'node:assert/strict';
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
