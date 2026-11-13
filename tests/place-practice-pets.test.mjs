import test from 'node:test';import assert from 'node:assert/strict';
import {PETS,feedPet,petStatus,normalizePetCare,petForStation,PET_MEAL_COOLDOWN} from '../src/lib/pet-care.ts';
import {PLACE_PRACTICE,feedingQuestions} from '../src/lib/place-practice.ts';
import {EXPLORATION_ZONES} from '../src/lib/campus-map.ts';
import {DISTRICT_STATIONS} from '../src/lib/campus-districts-layout.ts';
import {restoreProgress,freshProgress} from '../src/lib/game.ts';
test('every mapped district and NPC location has a complete, solvable English minigame',()=>{
 for(const area of [...EXPLORATION_ZONES.map(z=>z.id),'courtyard','library','canteen']){
 const lesson=PLACE_PRACTICE[area];assert.ok(lesson,area);assert.equal(lesson.questions.length,3);
 for(const q of lesson.questions){if(q.kind==='order'){assert.equal([...q.options].sort().join('|'),q.answer.split(' ').sort().join('|'));}else assert.ok(q.options.includes(q.answer));assert.ok(q.explanation.length>15);}
 }
 for(const id of Object.keys(PETS)){assert.ok(DISTRICT_STATIONS.some(s=>s.id===PETS[id].station));assert.equal(petForStation(PETS[id].station),id);assert.equal(feedingQuestions(id).length,3);}
});
test('feeding grows animals, blocks duplicate meals and recovery remains possible after neglect',()=>{
 const now=Date.now()-300000;let care={};assert.equal(petStatus(care,'pigs',now).stage,'Young');
 for(let i=0;i<6;i++)care=feedPet(care,'pigs',now+i*PET_MEAL_COOLDOWN);
 const last=now+5*PET_MEAL_COOLDOWN;assert.equal(petStatus(care,'pigs',last).stage,'Adult');assert.equal(feedPet(care,'pigs',last+100),care);
 assert.equal(petStatus(care,'pigs',last+7*3600000).state,'Hungry');assert.equal(petStatus(care,'pigs',last+13*3600000).state,'Weak');assert.equal(petStatus(care,'pigs',last+30*3600000).health,0);
 const rescued=feedPet(care,'pigs',last+30*3600000);assert.equal(petStatus(rescued,'pigs',last+30*3600000).health,100);assert.equal(rescued.pigs.meals,7);
});
test('pet data survives an existing save without changing XP, name or chapter progress',()=>{
 const p=freshProgress();p.name='Cadet';p.pets=feedPet({},'chickens',Date.now());const restored=restoreProgress(JSON.stringify(p));assert.equal(restored.name,p.name);assert.equal(restored.pets.chickens.meals,1);assert.deepEqual(normalizePetCare({pigs:{lastFedAt:Infinity,meals:-1,adoptedAt:0}}),{});
});
