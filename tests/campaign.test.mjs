import test from 'node:test';import assert from 'node:assert/strict';
import {STORY_CHAPTERS,freshCampaign,storyChapterIndex,answerStory,hintStory,retryStory,finishStory,recordStoryEvent,restoreCampaign,campaignXP,storyScore} from '../src/lib/campaign.ts';
import {freshProgress,restoreProgress,earnedXP} from '../src/lib/game.ts';
const work={garden:true,duty:true};
function solve(state,chapter){for(const q of chapter.exercises){const r=answerStory(state,chapter.id,q.answers[0],true);assert.equal(r.correct,true,q.sentence);state=r.state;}return state;}
test('all ten connected chapters require 50 typed clues, practical evidence and ten reports',()=>{
 let state=freshCampaign();assert.equal(STORY_CHAPTERS.length,10);
 for(const [i,ch]of STORY_CHAPTERS.entries()){
  assert.equal(storyChapterIndex(state),i);assert.equal(ch.exercises.length,5);assert.equal(finishStory(state,ch.id,ch.report.answers[0],true,work),state);
  state=solve(state,ch);assert.equal(storyScore(state,ch),100);
  if(!['visit','garden','duty'].includes(ch.proof)){assert.equal(finishStory(state,ch.id,ch.report.answers[0],true,work),state);state=recordStoryEvent(state,ch.proof);}
  if(ch.proof==='garden'||ch.proof==='duty')assert.equal(finishStory(state,ch.id,ch.report.answers[0],true,{garden:false,duty:false}),state);
  assert.equal(finishStory(state,ch.id,'not completed',true,work),state);assert.equal(finishStory(state,ch.id,ch.report.answers[0],false,work),state);
  const before=state;state=finishStory(state,ch.id,ch.report.answers[0],true,work);assert.notEqual(state,before);assert.equal(finishStory(state,ch.id,ch.report.answers[0],true,work),state);
 }
 assert.equal(storyChapterIndex(state),-1);assert.equal(campaignXP(state),1000);assert.equal(Object.keys(state.exercises).length,50);
});
test('remote, skipped, empty and negative answers do not advance a mission',()=>{
 const s=freshCampaign(),ch=STORY_CHAPTERS[0];for(const [id,word,near]of [[ch.id,'are',false],['animals','feed',true],[ch.id,' ',true]])assert.equal(answerStory(s,id,word,near).state,s);
 const wrong=answerStory(s,ch.id,'not are',true);assert.equal(wrong.correct,false);assert.equal(wrong.state.exercises['orders.0'].solved,false);
 const right=answerStory(wrong.state,ch.id,' ARE. ',true);assert.equal(right.correct,true);assert.equal(right.state.exercises['orders.0'].firstCorrect,false);
});
test('assisted answers score honestly; a failed run can be retried while physical evidence stays',()=>{
 let s=recordStoryEvent(freshCampaign(),'balance'),ch=STORY_CHAPTERS[0];s=hintStory(s,ch.id);s=answerStory(s,ch.id,'are',true).state;s=answerStory(s,ch.id,'wrong',true).state;s=solveRemaining(s,ch);assert.equal(storyScore(s,ch),60);
 assert.equal(finishStory(s,ch.id,'ready',true,work),s);s=retryStory(s,ch.id);assert.equal(storyChapterIndex(s),0);assert.deepEqual(s.events,['balance']);assert.equal(s.records.orders.best,60);assert.equal(s.exercises['orders.0'],undefined);
 s=solve(s,ch);assert.equal(retryStory(s,ch.id),s,'Retry must not turn a passing lesson into a bypass of the report');s=finishStory(s,ch.id,'ready',true,work);assert.equal(storyChapterIndex(s),1);
});
function solveRemaining(s,ch){for(let i=0;i<ch.exercises.length;i++)if(!s.exercises[`${ch.id}.${i}`]?.solved)s=answerStory(s,ch.id,ch.exercises[i].answers[0],true).state;return s;}
test('old saves retain names, dialogue progress and XP; campaign answers and hints resume',()=>{
 let p={...freshProgress(),name:'Bao',active:1,completed:[0],goals:['directions']};const old=restoreProgress(JSON.stringify(p));assert.equal(old.name,'Bao');assert.deepEqual(old.completed,[0]);assert.deepEqual(old.goals,['directions']);assert.equal(campaignXP(old.campaign),0);
 let s=hintStory(freshCampaign(),'orders');assert.equal(restoreCampaign(s).exercises['orders.0'].hinted,true);s=solve(s,STORY_CHAPTERS[0]);s=finishStory(s,'orders','ready',true,work);p={...old,campaign:s};const resumed=restoreProgress(JSON.stringify(p));assert.deepEqual(resumed.campaign,s);assert.equal(earnedXP(resumed)-earnedXP(old),70);
});
test('restoration rejects unknown IDs, non-finite scores and out-of-order completed chapters',()=>{
 const s=restoreCampaign({records:{exhibition:{best:100,attempts:1},orders:{best:Infinity,attempts:1}},events:['balance','balance','fake'],exercises:{'orders.0':{attempts:1,solved:false,firstCorrect:true,hinted:false},'fake':{attempts:1,solved:true,firstCorrect:true}}});assert.equal(storyChapterIndex(s),0);assert.equal(campaignXP(s),0);assert.deepEqual(s.events,['balance']);assert.equal(s.exercises['orders.0'].firstCorrect,false);assert.equal(s.exercises.fake,undefined);
});

test('learning recognises the actual room and district, including the practical work positions',async()=>{
 const {nearStoryLocation}=await import('../src/lib/campaign-locations.ts');
 const {DISTRICT_STATIONS}=await import('../src/lib/campus-districts-layout.ts');
 const {WORK_STATIONS}=await import('../src/lib/fieldwork.ts');
 const zones={'feed-pigs':'livestock','feed-goats':'livestock','feed-ducks':'livestock','feed-chickens':'livestock','feed-fish':'fish-pond',balance:'training','rescue-ring':'swimming'};
 for(const s of DISTRICT_STATIONS)assert.equal(nearStoryLocation(zones[s.id],s),true,s.id);
 for(const s of WORK_STATIONS)assert.equal(nearStoryLocation(s.kind==='garden'?'vegetable-garden':'dormitory',s.approach),true,s.id);
 for(const id of ['classrooms','dormitory','swimming','livestock','hall'])assert.equal(nearStoryLocation(id,{x:0,z:6}),false,id);
});
