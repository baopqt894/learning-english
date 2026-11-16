import { test } from 'node:test';
import assert from 'node:assert/strict';
import { advanceBalance, answerBalance, balancePosition, startBalance } from '../src/lib/balance-challenge.ts';
import { cadetLevel, completeChallenge } from '../src/lib/challenge-xp.ts';
import { earnedXP, freshProgress, restoreProgress } from '../src/lib/game.ts';

test('wrong answers and timeouts stop a balance attempt before the opposite end', () => {
  const run = advanceBalance(startBalance(0, () => .5), 1100);
  assert.equal(run.stage.kind, 'quiz');
  const q = run.questions[0];
  const miss = answerBalance(run, q.choices.find(choice => choice !== q.answer), 1200);
  assert.equal(miss.stage.kind, 'fall');
  assert.equal(miss.stage.reason, 'wrong');
  assert.equal(balancePosition(miss, 1450), balancePosition(run, 1200));
  assert.equal(advanceBalance(miss, 2050).stage.kind, 'failed');
  const late = answerBalance(run, q.answer, run.stage.deadline);
  assert.equal(late.stage.kind, 'fall');
  assert.equal(late.stage.reason, 'timeout');
});

test('the balance result requires three distinct quiz checkpoints and all the walking segments', () => {
  let run = startBalance(0, () => .5);
  for (let i = 0; i < 3; i++) {
    const clock = 1300 * i + 1100;
    run = advanceBalance(run, clock);
    assert.equal(run.stage.kind, 'quiz');
    assert.equal(run.index, i);
    const answer = run.questions[i].answer;
    run = answerBalance(run, answer, clock + 10);
    assert.equal(run.stage.kind, 'walk');
    assert.equal(answerBalance(run, answer, clock + 11), run);
  }
  assert.equal(balancePosition(run, 4300) < 1, true);
  const done = advanceBalance(run, 4900);
  assert.equal(done.stage.kind, 'done');
  assert.equal(balancePosition(done, 4900), 1);
});

test('first-time campus challenges accumulate XP across saves and level up without repeat credit', () => {
  let progress = { ...freshProgress(), name: 'Tester' };
  assert.equal(earnedXP(restoreProgress(JSON.stringify(progress))), 0);
  for (const id of ['station/balance', 'station/rescue-ring', 'race/swimming', 'quiz/training']) {
    progress = { ...progress, challenges: completeChallenge(progress.challenges, id) };
  }
  const xp = earnedXP(restoreProgress(JSON.stringify(progress)));
  assert.equal(xp, 155);
  assert.deepEqual(cadetLevel(xp), { level: 2, earned: 5, remaining: 145, perLevel: 150 });
  assert.equal(completeChallenge(progress.challenges, 'station/balance'), progress.challenges);
  assert.equal(earnedXP(restoreProgress(JSON.stringify({ ...progress, challenges: [...progress.challenges, 'station/balance', 'forged'] }))), xp);
});
