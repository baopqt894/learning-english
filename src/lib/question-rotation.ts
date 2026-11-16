export function shuffled<T>(items: readonly T[], random = Math.random): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** Prefer questions that did not appear in the previous attempt. */
export function drawQuestions<T>(bank: readonly T[], count: number, key: (item: T) => string, previous: readonly string[] = [], random = Math.random) {
  const last = new Set(previous);
  const unseen: T[] = [];
  const seen: T[] = [];
  for (const item of shuffled(bank, random)) {
    (last.has(key(item)) ? seen : unseen).push(item);
  }
  return [...unseen, ...seen].slice(0, count);
}
