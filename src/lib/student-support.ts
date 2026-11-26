import { UI_PHRASES } from './ui-phrases.ts';

export type Language = 'vi' | 'en';
export type ReadingPace = 'slow' | 'normal';
export type Phrase = { en: string; vi: string };
export type StudentSettings = { language: Language; pace: ReadingPace; voice?: string; phrases: Phrase[] };
export const defaultStudent: StudentSettings = { language: 'vi', pace: 'normal', phrases: [] };
const translations = new Map<string, readonly [string, string]>();
for (const pair of UI_PHRASES) for (const label of pair) translations.set(label, pair);

export function translate(language: Language, text: string) {
  return translations.get(text)?.[language === 'vi' ? 1 : 0] ?? text;
}

export function rememberPhrase(phrases: Phrase[], phrase: Phrase) {
  if (phrases.some(item => item.en === phrase.en)) return phrases;
  return [phrase, ...phrases].slice(0, 60);
}

export function restoreStudent(value: unknown): StudentSettings | undefined {
  if (!value || typeof value !== 'object') return;
  const raw = value as Partial<StudentSettings>;
  const phrases: Phrase[] = [];
  if (Array.isArray(raw.phrases)) {
    for (const item of raw.phrases) {
      if (phrases.length === 60) break;
      if (item && typeof item.en === 'string' && typeof item.vi === 'string' &&
        item.en.trim() && item.vi.trim() && item.en.length <= 400 && item.vi.length <= 400 &&
        !phrases.some(phrase => phrase.en === item.en)) phrases.push({ en: item.en, vi: item.vi });
    }
  }
  return { language: raw.language === 'en' ? 'en' : 'vi', pace: raw.pace === 'slow' ? 'slow' : 'normal', phrases, ...(typeof raw.voice === 'string' && raw.voice.length > 0 && raw.voice.length <= 512 ? {voice:raw.voice} : {}) };
}

/** Voice inventories can arrive after the first render, especially on Android. */
export function englishVoices(voices: SpeechSynthesisVoice[]) {
  function score(voice: SpeechSynthesisVoice) {
    const name = voice.name;
    if (/whisper|novelty|compact|espeak|eloquence|speech synthesizer/i.test(name)) return -10;
    return (/natural|enhanced|premium|neural|online/i.test(name) ? 20 : 0) +
      (/samantha|daniel|google.*english|aria|jenny|serena/i.test(name) ? 5 : 0) +
      (voice.default ? 2 : 0) + (voice.localService ? 1 : 0);
  }
  return voices.filter(v => /^en(?:[-_]|$)/i.test(v.lang))
    .sort((a,b) => score(b)-score(a) || a.name.localeCompare(b.name));
}

export function englishLine(text: string, pace: ReadingPace, preferred?: string) {
  const spoken = text.replace(/_{2,}/g, ' blank ').replace(/\s+/g,' ').trim();
  const line = new SpeechSynthesisUtterance(spoken);
  const voices = englishVoices(window.speechSynthesis.getVoices());
  const voice = voices.find(v => v.voiceURI === preferred) ?? voices[0];
  if (voice) line.voice = voice;
  line.lang = voice?.lang ?? 'en-US';
  line.rate = pace === 'slow' ? .78 : .9;
  return line;
}

// A successful turn can contain both an acknowledgement and the next prompt.
export function dialogueMeaning(text: string) {
  const exact = translations.get(text);
  if (exact) return exact[1];
  for (let at = text.indexOf(' '); at >= 0; at = text.indexOf(' ', at + 1)) {
    const first = translations.get(text.slice(0, at));
    if (first) {
      const next = translations.get(text.slice(at + 1));
      if (next) return first[1] + ' ' + next[1];
    }
  }
  return '';
}
