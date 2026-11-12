import test from "node:test";
import assert from "node:assert/strict";
import { collectReward, earnedXP, evaluateTurn, freshProgress, nextGoal, QUESTS, restoreProgress } from "../src/lib/game.ts";

test("all six missions are achievable with their authored hints, including the two-location final", () => {
  let progress = { ...freshProgress(), name: "An" };
  for (let index = 0; index < QUESTS.length; index++) {
    assert.equal(progress.active, index);
    for (const goal of QUESTS[index].goals) {
      const result = evaluateTurn(progress, goal.place, goal.hint);
      assert.equal(result.achieved, true, `${index + 1}: ${goal.id}`);
      progress = result.progress;
    }
    const after = collectReward(progress);
    assert.ok(after.completed.includes(index));
    assert.equal(collectReward(after), after, "repeated collection cannot grant extra XP");
    progress = restoreProgress(JSON.stringify(after));
  }
  assert.deepEqual(progress.completed, [0,1,2,3,4,5]);
  assert.equal(earnedXP(progress), 575);
  assert.equal(nextGoal(progress), undefined);
});

test("wrong location, short yes, out-of-order objectives and repeated lines do not advance", () => {
  let progress = freshProgress();
  assert.equal(evaluateTurn(progress, "library", "My name is An").achieved, false);
  assert.equal(evaluateTurn(progress, "courtyard", "What's your name?").achieved, false);
  assert.equal(evaluateTurn(progress, "courtyard", "Yes").achieved, false);
  assert.equal(collectReward(progress), progress);
  progress = evaluateTurn(progress, "courtyard", "My name is An").progress;
  assert.equal(evaluateTurn(progress, "courtyard", "My name is An").achieved, false);
  assert.deepEqual(progress.goals, ["intro"]);
});

test("confirmation must include the known return day or the correct order and total", () => {
  const book = { ...freshProgress(), active: 2, completed: [0,1], goals: ["book","period"] };
  assert.equal(evaluateTurn(book,"library","Yes").achieved,false);
  assert.equal(evaluateTurn(book,"library","I'll return it on Tuesday").achieved,false);
  assert.equal(evaluateTurn(book,"library","I'll bring it back on Monday").achieved,true);
  const food = { ...freshProgress(), active: 4, completed: [0,1,2,3], goals: ["price","order"] };
  assert.equal(evaluateTurn(food,"canteen","A sandwich and water, 30,000 dong total").achieved,false);
  assert.equal(evaluateTurn(food,"canteen","A sandwich and water, 25,000 dong in total").achieved,true);
});

test("orders over the budget are rejected without losing earlier progress", () => {
  const progress = { ...freshProgress(), active: 4, completed: [0,1,2,3], goals: ["price"] };
  const result = evaluateTurn(progress,"canteen","I'd like two sandwiches and water");
  assert.equal(result.achieved,false);
  assert.deepEqual(result.progress.goals,["price"]);
  assert.match(result.reply,/budget/);
});

test("corrupt and stale saves are normalized and conversation history stays bounded", () => {
  assert.deepEqual(restoreProgress("{broken"),freshProgress());
  assert.deepEqual(restoreProgress('{"version":99}'),freshProgress());
  const restored = restoreProgress(JSON.stringify({ ...freshProgress(), name: "A".repeat(60), active: 5, completed: [0,0,2,5], goals: ["directions","directions","invented"], messages: [null,{ role:"invalid", text:"hi", place:"library" }] }));
  assert.equal(restored.active,1);
  assert.equal(restored.name.length,30);
  assert.deepEqual(restored.completed,[0]);
  assert.deepEqual(restored.goals,["directions"]);
  assert.deepEqual(restored.messages,[]);
  let progress = freshProgress();
  for (let i=0;i<60;i++) progress = evaluateTurn(progress,"courtyard","Hello").progress;
  assert.equal(progress.messages.length,80);
});

test("Discovery Day includes joining the team and reporting back, without accepting negative intent", () => {
  const joining={...freshProgress(),goals:["intro","name"]};
  assert.equal(evaluateTurn(joining,"courtyard","I don't want to help").achieved,false);
  assert.equal(evaluateTurn(joining,"courtyard","I would like to help with Discovery Day.").achieved,true);
  const final={...freshProgress(),active:5,completed:[0,1,2,3,4],goals:["event-book","event-return","event-price","event-order","event-confirm"]};
  assert.equal(nextGoal(final).place,"courtyard");
  assert.equal(evaluateTurn(final,"canteen","The book is ready and we have a sandwich and water").achieved,false);
  assert.equal(evaluateTurn(final,"courtyard","The book and picnic water are not ready").achieved,false);
  assert.equal(evaluateTurn(final,"courtyard","The book is ready, and we have a sandwich and water.").finished,true);
});

test("asking for repetition or help teaches without granting progress", () => {
  const progress={...freshProgress(),active:1,completed:[0],goals:["directions"]};
  const repeated=evaluateTurn(progress,"courtyard","Could you repeat that, please?");
  assert.equal(repeated.achieved,false);
  assert.match(repeated.reply,/Turn left/);
  const helped=evaluateTurn(progress,"courtyard","I don't understand. Can you help?");
  assert.equal(helped.achieved,false);
  assert.match(helped.reply,/Try:/);
  assert.deepEqual(helped.progress.goals,["directions"]);
});
