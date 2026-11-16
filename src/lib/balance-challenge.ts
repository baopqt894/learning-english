import { shuffled } from './activities.ts';

type BalanceQuestion = { prompt: string; choices: string[]; answer: string; explanation: string };
const questions: BalanceQuestion[] = [
  { prompt: 'Keep your arms ___ for balance.', choices: ['out', 'inside', 'downstairs'], answer: 'out', explanation: 'Hold your arms out to the sides to steady yourself.' },
  { prompt: 'Look ___ as you cross the beam.', choices: ['ahead', 'yesterday', 'under'], answer: 'ahead', explanation: 'Look ahead means look in the direction you are going.' },
  { prompt: 'Walk ___ and take small steps.', choices: ['slowly', 'slow', 'slowerly'], answer: 'slowly', explanation: 'Slowly describes how you walk.' },
  { prompt: 'Step ___ the beam to begin.', choices: ['onto', 'between', 'during'], answer: 'onto', explanation: 'Onto means moving up to the surface of something.' },
  { prompt: 'Cross the beam one step ___ a time.', choices: ['at', 'in', 'under'], answer: 'at', explanation: 'One step at a time means taking each step separately.' },
  { prompt: 'Wait ___ the next signal.', choices: ['for', 'at', 'inside'], answer: 'for', explanation: 'Use wait for when you expect something to happen.' },
];

export const BALANCE_ANSWER_MS = 8000;
const positions = [.21, .43, .66, 1] as const;
const stepMs = 1100;
export type BalanceRun = {
  questions: BalanceQuestion[];
  index: number;
  stage:
    | { kind: 'walk'; from: number; to: number; since: number }
    | { kind: 'quiz'; position: number; deadline: number }
    | { kind: 'fall'; position: number; since: number; reason: 'wrong' | 'timeout' }
    | { kind: 'failed'; reason: 'wrong' | 'timeout' }
    | { kind: 'done' };
};

export function startBalance(now: number, random: () => number = Math.random): BalanceRun {
  return {
    questions: shuffled(questions, random).slice(0, 3).map(q => ({ ...q, choices: shuffled(q.choices, random) })),
    index: 0,
    stage: { kind: 'walk', from: 0, to: positions[0], since: now },
  };
}

export function advanceBalance(run: BalanceRun, now: number): BalanceRun {
  const { stage } = run;
  if (stage.kind === 'walk' && now >= stage.since + stepMs) {
    return stage.to === 1 ? { ...run, stage: { kind: 'done' } }
      : { ...run, stage: { kind: 'quiz', position: stage.to, deadline: now + BALANCE_ANSWER_MS } };
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
  return { ...run, index, stage: { kind: 'walk', from: position, to: positions[index], since: now } };
}

export function balancePosition(run: BalanceRun, now: number) {
  const { stage } = run;
  if (stage.kind === 'done') return 1;
  if (stage.kind === 'failed') return 0;
  if (stage.kind !== 'walk') return stage.position;
  const fraction = Math.min(1, Math.max(0, (now - stage.since) / stepMs));
  return stage.from + (stage.to - stage.from) * fraction;
}
