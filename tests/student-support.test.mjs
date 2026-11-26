import test from 'node:test';
import assert from 'node:assert/strict';
import { dialogueMeaning, englishVoices, rememberPhrase, restoreStudent, translate } from '../src/lib/student-support.ts';
import { conversationClue } from '../src/lib/conversation-support.ts';
import { evaluateTurn, freshProgress, QUESTS, restoreProgress } from '../src/lib/game.ts';

test('learners can reopen a lookup after a save and repeated lookups occupy one slot', () => {
  const phrase = {en:'Walk to mission', vi:translate('vi','Walk to mission')};
  const saved = rememberPhrase([], phrase);
  assert.equal(rememberPhrase(saved, phrase), saved);
  const restored = restoreProgress(JSON.stringify({...freshProgress(),student:{language:'en',pace:'slow',phrases:[...saved,...saved,null]}}));
  assert.deepEqual(restored.student, {language:'en',pace:'slow',phrases:[phrase]});
  assert.equal(restoreProgress(JSON.stringify(freshProgress())).student, undefined);
  assert.equal(translate('en', phrase.vi), phrase.en);
});

test('each conversation clue teaches without passing the goal when copied', () => {
  QUESTS.forEach((quest, active) => {
    const progress = {...freshProgress(), active, goals:[]};
    for (const goal of quest.goals) {
      for (const language of ['en','vi']) {
        assert.equal(evaluateTurn(progress,goal.place,conversationClue(goal.id,language)).achieved,false,goal.id);
      }
      const result = evaluateTurn(progress,goal.place,goal.hint);
      assert.ok(dialogueMeaning(result.reply), goal.id+' translation');
      progress.goals = result.progress.goals;
    }
  });
});

test('voice preferences survive saves while a missing device voice has an English fallback', () => {
  const voices = [
    {voiceURI:'compact',name:'Samantha Compact',lang:'en_US',default:true,localService:true},
    {voiceURI:'natural',name:'Aria Natural',lang:'en-US'},
    {voiceURI:'foreign',name:'Premium',lang:'fr-FR'},
  ];
  assert.deepEqual(englishVoices(voices).map(v=>v.voiceURI), ['natural','compact']);
  assert.equal(restoreStudent({voice:'natural'}).voice, 'natural');
  assert.equal(restoreStudent({voice:42}).voice, undefined);
});
