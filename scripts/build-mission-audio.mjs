// Run on macOS with ffmpeg and the Samantha and Daniel voices installed.
import { mkdtempSync, mkdirSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { MISSION_EXERCISES } from '../src/lib/mission-exercises.ts';
import { LEVEL_MISSIONS } from '../src/lib/cadet-tiers.ts';

const directory = fileURLToPath(new URL('../public/mission-audio/', import.meta.url));
const temporary = mkdtempSync(join(tmpdir(), 'campus-mission-audio-'));
mkdirSync(directory, { recursive: true });
try {
  for (const [id, questions] of Object.entries(MISSION_EXERCISES)) {
    const rate = Math.min(174, 152 + (LEVEL_MISSIONS[id].level - 4) * 4);
    for (const question of questions) {
      if (!('transcript' in question)) continue;
      const source = join(temporary, `${question.id}.aiff`);
      const descriptor = Number(question.id.split('-').at(-1));
      const voice = LEVEL_MISSIONS[id].level >= 5 && descriptor % 2 === 0 ? 'Daniel' : 'Samantha';
      execFileSync('say', ['-v', voice, '-r', String(rate), '-o', source, question.transcript]);
      execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', source,
        '-map_metadata', '-1', '-af', 'loudnorm=I=-18:TP=-1.5:LRA=8', '-ac', '1', '-ar', '24000',
        '-codec:a', 'libmp3lame', '-b:a', '40k', join(directory, `${question.id}.mp3`)]);
    }
  }
} finally {
  rmSync(temporary, { recursive: true, force: true });
}
