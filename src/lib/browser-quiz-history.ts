export type QuizHistory = {
  previous: (quiz: string) => readonly string[];
  record: (quiz: string, questions: readonly string[]) => void;
};

export function createQuizHistory(accountId: string): QuizHistory {
  const attempts = new Map<string, readonly string[]>();
  const storageKey = (quiz: string) => `campus-quiz-history-v1:${accountId}:${quiz}`;
  return {
    previous(quiz) {
      const current = attempts.get(quiz);
      if (current) return current;
      try {
        const saved = JSON.parse(localStorage.getItem(storageKey(quiz)) ?? '[]');
        if (Array.isArray(saved)) return saved.filter((key): key is string => typeof key === 'string');
      } catch { /* The current tab still rotates its questions. */ }
      return [];
    },
    record(quiz, questions) {
      const current = attempts.get(quiz);
      if (current?.length === questions.length && current.every((key, index) => key === questions[index])) return;
      attempts.set(quiz, questions);
      try { localStorage.setItem(storageKey(quiz), JSON.stringify(questions)); }
      catch { /* The current tab still rotates its questions. */ }
    },
  };
}
