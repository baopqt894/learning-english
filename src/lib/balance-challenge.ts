import type { EnglishTier } from './cadet-tiers.ts';
import { gap, FIELD_BRIEFING_QUESTIONS } from './level-questions.ts';
import { drawQuestions, shuffled } from './question-rotation.ts';

type BalanceQuestion = { prompt: string; choices: string[]; answer: string; explanation: string };
const questions: BalanceQuestion[] = [
  { prompt: 'Keep your arms ___ for balance.', choices: ['out', 'inside', 'downstairs'], answer: 'out', explanation: 'Hold your arms out to the sides to steady yourself.' },
  { prompt: 'Look ___ as you cross the beam.', choices: ['ahead', 'yesterday', 'under'], answer: 'ahead', explanation: 'Look ahead means look in the direction you are going.' },
  { prompt: 'Walk ___ and take small steps.', choices: ['slowly', 'slow', 'slowerly'], answer: 'slowly', explanation: 'Slowly describes how you walk.' },
  { prompt: 'Step ___ the beam to begin.', choices: ['onto', 'between', 'during'], answer: 'onto', explanation: 'Onto means moving up to the surface of something.' },
  { prompt: 'Cross the beam one step ___ a time.', choices: ['at', 'in', 'under'], answer: 'at', explanation: 'One step at a time means taking each step separately.' },
  { prompt: 'Wait ___ the next signal.', choices: ['for', 'at', 'inside'], answer: 'for', explanation: 'Use wait for when you expect something to happen.' },
];

const higherQuestions = {
  A2: [
    ...FIELD_BRIEFING_QUESTIONS.slice(2),
    gap('Keep going ___ you reach the other end.', 'until', 'since', 'during', 'Until tells you when to stop walking.'),
    gap('This beam is narrower ___ the practice line.', 'than', 'that', 'as', 'Use than after a comparative.'),
  ],
  B1: [
    gap('Even if you wobble, keep looking forward. What does the coach mean?', 'Look ahead even when you feel unsteady.', 'Only look ahead if you wobble.', 'Look down as soon as you wobble.', 'Even if means you should follow the instruction regardless of the condition.'),
    gap('The coach told us ___ onto the beam until it was clear.', 'not to step', 'don’t step', 'not stepping', 'Use told us not to plus a verb to report a negative instruction.'),
    gap('If the beam were wider, it ___ easier to cross.', 'would be', 'will be', 'had been', 'Use would be for the result of a hypothetical condition.'),
    gap('The beam must ___ for damage before each class.', 'be checked', 'check', 'have checking', 'Use must be plus a past participle when the beam receives the action.'),
    gap('The student ___ turn comes next is waiting on the mat.', 'whose', 'who', 'which', 'Whose shows which student the turn belongs to.'),
    gap('I stretched out my arms ___ I could stay steady.', 'so that', 'unless', 'even if', 'So that explains the purpose of stretching out your arms.'),
    gap('Only step onto the beam once it is clear. When should you start?', 'After the previous student steps off.', 'Before the previous student steps off.', 'As soon as anyone starts crossing.', 'Once it is clear means after the beam becomes free.'),
    gap('We crossed the beam ___ feeling nervous.', 'despite', 'although', 'because', 'Despite can be followed by an -ing form.'),
    gap('The beam was closed because its supports ___.', 'had shifted', 'will shift', 'are shifting', 'Use the past perfect to show that the movement happened before the closure.'),
    gap('Would you mind ___ back until the beam is free?', 'waiting', 'wait', 'to wait', 'Use the -ing form after would you mind.'),
  ],
};

export const BALANCE_TIERS = {
  A1: { seconds: 8, positions: [.21, .43, .66, 1] },
  A2: { seconds: 7, positions: [.21, .37, .53, .69, 1] },
  B1: { seconds: 6, positions: [.21, .34, .47, .60, .73, 1] },
} as const;
const stepMs = 1100;
export type BalanceRun = {
  questions: BalanceQuestion[];
  tier: EnglishTier;
  index: number;
  stage:
    | { kind: 'walk'; from: number; to: number; since: number }
    | { kind: 'quiz'; position: number; deadline: number }
    | { kind: 'fall'; position: number; since: number; reason: 'wrong' | 'timeout' }
    | { kind: 'failed'; reason: 'wrong' | 'timeout' }
    | { kind: 'done' };
};

export function startBalance(now: number, random = Math.random, tier: EnglishTier = 'A1', previous: readonly string[] = []): BalanceRun {
  const { positions } = BALANCE_TIERS[tier];
  const bank = tier === 'A1' ? questions : higherQuestions[tier].map(q => ({
    prompt: q.prompt, choices: q.options, answer: q.answer, explanation: q.explanation,
  }));
  return {
    tier,
    questions: drawQuestions(bank, positions.length - 1, q => q.prompt, previous, random)
      .map(q => ({ ...q, choices: shuffled(q.choices, random) })),
    index: 0,
    stage: { kind: 'walk', from: 0, to: positions[0], since: now },
  };
}

export function advanceBalance(run: BalanceRun, now: number): BalanceRun {
  const { stage } = run;
  if (stage.kind === 'walk' && now >= stage.since + stepMs) {
    return stage.to === 1 ? { ...run, stage: { kind: 'done' } }
      : { ...run, stage: { kind: 'quiz', position: stage.to, deadline: now + BALANCE_TIERS[run.tier].seconds * 1000 } };
  }
  if (stage.kind === 'quiz' && now >= stage.deadline) {
    return { ...run, stage: { kind: 'fall', position: stage.position, since: now, reason: 'timeout' } };
  }
  if (stage.kind === 'fall' && now >= stage.since + 850) {
    return { ...run, stage: { kind: 'failed', reason: stage.reason } };
  }
  return run;
}

export function answerBalance(run: BalanceRun, answer: string, now: number): BalanceRun {
  const next = advanceBalance(run, now);
  // An answer can only apply to a question already visible before this event.
  if (next !== run || run.stage.kind !== 'quiz') return next;
  const position = run.stage.position;
  if (!run.questions[run.index].choices.includes(answer)) return run;
  if (answer !== run.questions[run.index].answer) {
    return { ...run, stage: { kind: 'fall', position, since: now, reason: 'wrong' } };
  }
  const index = run.index + 1;
  return { ...run, index, stage: { kind: 'walk', from: position, to: BALANCE_TIERS[run.tier].positions[index], since: now } };
}

export function balancePosition(run: BalanceRun, now: number) {
  const { stage } = run;
  if (stage.kind === 'done') return 1;
  if (stage.kind === 'failed') return 0;
  if (stage.kind !== 'walk') return stage.position;
  const fraction = Math.min(1, Math.max(0, (now - stage.since) / stepMs));
  return stage.from + (stage.to - stage.from) * fraction;
}
