import test from 'node:test';
import assert from 'node:assert/strict';
import { DIFFICULTIES, competitionQuestions } from '../src/lib/competition-catalog.ts';
import { competitionBoard, createCompetitionEngine } from '../src/lib/competition-server.ts';
import { freshMember, openedAt, questionSeconds, raceQuestion, raceTeamProgress, smoothRaceDistance } from '../src/lib/competition-engine.ts';
import { campusDay, dailyMissions, dailyXP, recordDaily } from '../src/lib/daily-missions.ts';
import { earnedXP, freshProgress, restoreProgress } from '../src/lib/game.ts';
const { roomAction, roomSnapshot, recordFinishedPractice } = createCompetitionEngine();

const records = new Map();
const order = (a, b) => a.milliseconds - b.milliseconds || b.correct - a.correct || a.achievedAt - b.achievedAt;
const recordStore = {
  async save(record) {
    const key = `${record.mode}:${record.difficulty}:${record.profile}`;
    const old = records.get(key);
    if (old && order(old, record) <= 0) return false;
    records.set(key, record);
    return true;
  },
  async board(mode, difficulty, profile) {
    const rows = [...records.values()].filter(row => row.mode === mode && row.difficulty === difficulty).sort(order);
    const index = rows.findIndex(row => row.profile === profile);
    return { entries: rows.slice(0, 10), personal: index === -1 ? null : { ...rows[index], rank: index + 1 } };
  },
};
const boardFor = (mode, difficulty, profile) => competitionBoard(mode, difficulty, profile, recordStore);
const profile = '0123456789abcdef0123456789abcdef';
const now = 1_800_000_000_000;

function practice(mode, difficulty, at, correct, delay, identity = profile) {
  const seat = roomAction({ action: 'practice', mode, difficulty, profile: identity, name: 'Solo cadet' }, at);
  const { code } = seat.room;
  assert.equal(seat.room.members.length, 1);
  assert.equal(seat.room.format, 'practice');
  assert.throws(() => roomSnapshot(code, undefined, at), /practice seat/);
  assert.throws(() => roomAction({ action: 'join', code }, at), /not an online room/);
  let room = seat.room;
  for (let i = 0; i < room.round.order.length; i++) {
    const me = room.members[0];
    const submittedAt = at + 3000 + openedAt(me,room) * 1000 + Math.max(50,delay);
    room = roomSnapshot(code,seat.token,submittedAt);
    if (room.members[0].finishedAt !== null) break;
    const q = raceQuestion(room, me);
    room = roomAction({
      action: 'answer', code, token: seat.token, roundId: room.round.id, questionIndex: i,
      ...(q.kind === 'fill' ? { text: i<correct?q.choices[q.answer]:'incorrect' } : { choice: i<correct?q.answer:(q.answer+1)%q.choices.length }),
    }, submittedAt).room;
  }
  const settledAt = at + 130_000;
  return recordFinishedPractice(roomSnapshot(code, seat.token, settledAt), settledAt, recordStore);
}

test('solo swim keeps the fastest qualified time per browser profile and level', async () => {
  const first = await practice('swimming', 'advanced', now, 10, 1700);
  assert.equal(first.record, 'personal-best');
  assert.equal(first.members[0].kind, 'human');
  const firstMs = (await boardFor('swimming', 'advanced', profile)).personal.milliseconds;
  assert.equal((await practice('swimming', 'advanced', now + 70_000, 10, 4600)).record, 'kept-best');
  const fastest = await practice('swimming', 'advanced', now + 140_000, 10, 500);
  assert.equal(fastest.record, 'personal-best');
  const board = await boardFor('swimming', 'advanced', profile);
  assert.equal(board.entries.length, 1);
  assert.ok(board.personal.milliseconds < firstMs);
  assert.equal(board.personal.milliseconds, Math.round(fastest.members[0].finishedAt * 1000));
  assert.ok(!JSON.stringify(board).includes(profile));
  assert.equal((await boardFor('swimming', 'beginner', profile)).entries.length, 0);
  assert.equal((await boardFor('swimming', 'advanced', null)).personal, null);
});

test('solo sprint requires real correct answers and gives separate ranked places to different profiles', async () => {
  const unfinished = await practice('sprint', 'intermediate', now + 220_000, 9, 0);
  assert.equal(unfinished.phase, 'racing');
  assert.equal(unfinished.record, undefined);
  assert.equal((await boardFor('sprint', 'intermediate', profile)).entries.length, 0);
  assert.equal((await practice('sprint', 'intermediate', now + 290_000, 10, 1700)).record, 'personal-best');
  assert.equal((await practice('sprint', 'intermediate', now + 360_000, 10, 1200, 'a'.repeat(32))).record, 'personal-best');
  const board = await boardFor('sprint', 'intermediate', profile);
  assert.equal(board.entries.length, 2);
  assert.equal(board.personal.rank, 2);
  assert.ok(board.entries[0].milliseconds < board.entries[1].milliseconds);
});

test('friends register at the matching desk and inherit the host’s timed difficulty', async () => {
  const at = now + 450_000;
  const host = roomAction({ action: 'create', mode: 'sprint', difficulty: 'advanced', name: 'Host' }, at);
  const auth = { code: host.room.code, token: host.token };
  assert.throws(() => roomAction({ action: 'join', code: host.room.code, venue: 'pool' }, at), /Training track/);
  const guest = roomAction({ action: 'join', code: host.room.code, venue: 'track', difficulty: 'beginner' }, at);
  assert.equal(guest.room.difficulty, 'advanced');
  roomAction({ action: 'ready', code: guest.room.code, token: guest.token, ready: true }, at + 100);
  const room = roomAction({ action: 'start', ...auth }, at + 500).room;
  assert.equal(room.members.length, 4);
  assert.equal(questionSeconds(room), 13);
  assert.equal(roomSnapshot(room.code, host.token, at + 16_499).members[0].answers.length, 0);
  const updated = roomSnapshot(room.code, host.token, at + 16_501);
  assert.equal(updated.members[0].answers[0].choice, null);
  assert.equal(updated.members[0].answers[0].seconds, 13);
  assert.equal((await boardFor('sprint', 'advanced', profile)).entries.length, 0);
});

test('pool and track difficulty levels use distinct valid English questions and decreasing time limits', () => {
  assert.deepEqual(Object.values(DIFFICULTIES).map(level => level.seconds), [24, 21, 18, 15, 13]);
  for (const difficulty of Object.keys(DIFFICULTIES)) {
    const reading = questionSeconds({difficulty});
    assert.equal(questionSeconds({difficulty}, 'fill'), reading + 6);
    assert.equal(questionSeconds({difficulty}, 'listen'), reading + 12);
  }
  for (const mode of ['swimming', 'sprint']) {
    const tested = new Set();
    for (const difficulty of Object.keys(DIFFICULTIES)) {
      const bank = competitionQuestions(mode, difficulty);
      assert.ok(bank.length >= 10);
      for (const question of bank) {
        assert.ok(!tested.has(question.id) && question.answer >= 0 && question.answer < 4);
        assert.equal(new Set(question.choices).size, question.kind==='fill'?1:4);
        tested.add(question.id);
      }
    }
  }
});

test('daily missions reset at Vietnam midnight, grant XP once and retain prior days’ XP in the save', () => {
  const midnight = Date.UTC(2026, 10, 16, 17);
  const firstDay = campusDay(midnight - 1), nextDay = campusDay(midnight);
  assert.equal(nextDay, firstDay + 1);
  const target = dailyMissions(firstDay)[0].venue;
  const event = { type: 'race', venue: target, streak: 3 };
  let daily = recordDaily(undefined, firstDay, event);
  assert.equal(dailyXP(daily), 45);
  assert.equal(recordDaily(daily, firstDay, event), daily);
  daily = recordDaily(daily, firstDay, { type: 'quiz' });
  assert.equal(dailyXP(daily), 60);
  daily = recordDaily(daily, nextDay, { type: 'quiz' });
  assert.deepEqual(daily.completed, ['practice']);
  assert.equal(dailyXP(daily), 75);
  assert.equal(earnedXP(restoreProgress(JSON.stringify({ ...freshProgress(), name: 'Cadet', daily }))), 75);
});

test('a seat token cannot be used with a different signed-in account', () => {
  const first = 'a'.repeat(32), second = 'b'.repeat(32);
  const seat = roomAction({ action: 'create', mode: 'sprint', name: 'Cadet' }, now + 500_000, first);
  assert.throws(() => roomSnapshot(seat.room.code, seat.token, now + 500_001, second), /seat/);
  assert.throws(() => roomAction({ action: 'start', code: seat.room.code, token: seat.token }, now + 500_002, second), /access/);
  assert.equal(roomSnapshot(seat.room.code, seat.token, now + 500_003, first).hostId, seat.playerId);
});

test('team missions wait for a human teammate and reward both finishers once', () => {
  const day = campusDay(now);
  const answers = Array.from({ length: 3 }, () => ({ correct: true }));
  const self = { ...freshMember('a', 'Cadet A', 'human', 0), answers, finishedAt: 20 };
  const friend = { ...freshMember('b', 'Cadet B', 'human', 1), answers };
  const bot = { ...freshMember('c', 'Bot', 'bot', 2), answers, finishedAt: 21 };
  const room = { format: 'online', members: [self, friend, bot] };
  assert.deepEqual(raceTeamProgress(room, self.id), { together: false, threeEach: false });
  friend.finishedAt = 24;
  friend.botAssisted = true;
  assert.deepEqual(raceTeamProgress(room, self.id), { together: false, threeEach: false });
  friend.botAssisted = false;
  friend.answers = answers.slice(0, 2);
  assert.deepEqual(raceTeamProgress(room, self.id), { together: true, threeEach: false });
  friend.answers = answers;
  for (const player of [self, friend]) {
    const team = raceTeamProgress(room, player.id);
    const event = { type: 'race', venue: 'field', streak: 0, team };
    const daily = recordDaily(undefined, day, event);
    assert.deepEqual(daily.completed, ['team-finish', 'team-english']);
    assert.equal(dailyXP(daily), 60);
    assert.equal(recordDaily(daily, day, event), daily);
  }
});

test('remote swimmer movement catches up without abruptly jumping or reversing', () => {
  const first = smoothRaceDistance(3, 7, 1 / 60);
  assert.ok(first > 3 && first < 7);
  assert.equal(smoothRaceDistance(first, 2, 1 / 60), first);
  let distance = first;
  for (let i = 0; i < 60; i++) distance = smoothRaceDistance(distance, 7, 1 / 60);
  assert.equal(distance, 7);
});
