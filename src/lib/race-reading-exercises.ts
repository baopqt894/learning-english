import type { RaceQuestion } from './competition-catalog.ts';

// Each row contains a prompt, its answer and three distractors. The round
// shuffles the options for everyone using the same seed.
export function passageQuestions(
  passageId: string, passage: string, audio: string | null,
  rows: [prompt: string, answer: string, other1: string, other2: string, other3: string][],
): RaceQuestion[] {
  return rows.map(([prompt, ...choices], index) => ({
    id: `${passageId}-${index + 1}`, passageId,
    kind: audio ? 'listen' : 'choice',
    sentence: audio ? prompt : `${passage} ${prompt}`,
    choices, answer: 0, explanation: passage,
    ...(audio && { audio }),
  }));
}

export function wordGap(id: string, prompt: string, answer: string, alternatives?: string[]): RaceQuestion {
  return {
    id, kind: 'fill', sentence: prompt, choices: [answer], answer: 0, alternatives,
    explanation: prompt.replace('___', answer),
  };
}
