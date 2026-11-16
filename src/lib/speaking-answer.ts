const wordVariants: Record<string, string> = {
  programme: 'program', organisers: 'organizers', organiser: 'organizer',
  centre: 'center', defence: 'defense', practised: 'practiced', practise: 'practice',
};
const contractions: Record<string, string> = {
  "don't": 'do not', "doesn't": 'does not', "didn't": 'did not',
  "can't": 'can not', cannot: 'can not', "won't": 'will not',
  "hasn't": 'has not', "haven't": 'have not', "hadn't": 'had not',
  "isn't": 'is not', "aren't": 'are not', "wasn't": 'was not', "weren't": 'were not',
  "you'll": 'you will', "we'll": 'we will', "they'll": 'they will',
  "you've": 'you have', "we've": 'we have', "they've": 'they have',
  "you're": 'you are', "we're": 'we are', "they're": 'they are',
};

function spokenWords(text: string) {
  const normalized = text.normalize('NFKC').toLowerCase().replace(/[‘’]/g, "'")
    .replace(/\btouch[\s-]+line\b/g, 'touchline')
    .replace(/\bnotice[\s-]+board\b/g, 'noticeboard');
  return (normalized.match(/[a-z0-9]+(?:'[a-z]+)*/g) ?? [])
    .map(word => Object.hasOwn(contractions, word) ? contractions[word] : Object.hasOwn(wordVariants, word) ? wordVariants[word] : word)
    .join(' ');
}

export function matchesSpokenAnswer(expected: string, submitted: string): boolean {
  const target = spokenWords(expected);
  return !!target && target === spokenWords(submitted);
}
