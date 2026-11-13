import type { Progress } from './game';

export type ActivityId = 'garden' | 'duty' | 'academy';
export type ActivityRecord = { best: number; attempts: number; passed: boolean };
export type ActivityRecords = Partial<Record<ActivityId, ActivityRecord>>;
export type ActivityQuestion = { id: string; instruction: string; choices: string[]; answer: string; explanation: string; word: string };
export type ActivityAnswer = { questionId: string; answer: string };
const q = (id:string,instruction:string,choices:string[],answer:string,explanation:string,word:string):ActivityQuestion => ({id,instruction,choices,answer,explanation,word});

export const ACTIVITIES = {
  garden: {title:'Grow for the team',location:'Vegetable garden',zone:'vegetable-garden',icon:'leaf',xp:80,pass:80,minutes:'4–6 min',brief:'Help Minh prepare a vegetable bed for the school kitchen. Walk to each bed, equip your tools, loosen the soil, sow and water the seeds, then harvest and report in English.',pattern:'First … Then … Finally … / We have harvested …',words:['seeds · hạt giống','water · tưới nước','harvest · thu hoạch'],badge:'Garden teammate'},
  duty: {title:'Our barracks, our responsibility',location:'Dormitory',zone:'dormitory',icon:'school',xp:80,pass:80,minutes:'4–6 min',brief:'Work with your team to make the cadet dormitory clean and ready. Sweep the floor, smooth and fold the blanket, then carry the books to the shelf and report in English.',pattern:'Could you help me …? / We have finished …',words:['sweep · quét','fold · gấp','put away · cất gọn'],badge:'Responsible teammate'},
  academy: {title:'Cadet English challenge',location:'Classroom A1',zone:'classrooms',icon:'book',xp:120,pass:80,minutes:'6–8 min',brief:'Your team is ready for the final classroom challenge. Answer 10 questions about school life, teamwork and the English you have practised. Earn at least 80 points to pass.',pattern:'Read carefully → choose → check → learn',words:['instructions · hướng dẫn','schedule · thời gian biểu','confirm · xác nhận'],badge:'English challenge finisher'},
} as const;
export const ACTIVITY_IDS = Object.keys(ACTIVITIES) as ActivityId[];
export const QUESTIONS:Record<ActivityId,ActivityQuestion[]> = {
 garden:[
  q('g1','First, prepare the soil before planting. What should you do?',['Loosen the soil','Pick the leaves','Pack the books'],'Loosen the soil','Loose soil is the first step in our school garden task. “First” tells you where the sequence starts.','soil · đất'),
  q('g2','Next, sow the seeds in the prepared bed. Choose your action.',['Plant the seeds','Harvest the vegetables','Sweep the floor'],'Plant the seeds','“Sow” means plant seeds. You plant before you water and harvest.','sow · gieo'),
  q('g3','The seedlings need water. Water them gently. Which action fits?',['Water the seedlings','Pull out the seedlings','Fold the blanket'],'Water the seedlings','“Water” can be a verb: give the plants water. “Gently” means nhẹ nhàng.','seedling · cây con'),
  q('g4','Later, the vegetables are ready. Harvest them for the kitchen.',['Collect the vegetables','Plant more books','Throw away the vegetables'],'Collect the vegetables','“Harvest” means collect the crops when they are ready. Time passes in this story; plants do not grow instantly in real life.','harvest · thu hoạch'),
  q('g5','You collected three baskets of vegetables. Report to Minh.',['We have harvested three baskets of vegetables.','We need three classrooms.','The book is due on Monday.'],'We have harvested three baskets of vegetables.','A useful report says what you completed and how much you collected.','basket · giỏ'),
 ],
 duty:[
  q('d1','The duty board says: “Sweep the floor.” Choose the useful tool.',['A broom','A watering can','A notebook'],'A broom','A broom is used to sweep. A watering can belongs in the garden.','broom · chổi'),
  q('d2','The next task is: “Fold the blanket neatly.” What should you do?',['Fold the blanket','Water the blanket','Leave the blanket on the floor'],'Fold the blanket','“Fold” means gấp; “neatly” means gọn gàng.','blanket · chăn'),
  q('d3','Put the books on the shelf, not on the bed. Where do the books go?',['On the shelf','On the bed','Under the water tap'],'On the shelf','Read both parts: “on the shelf” is the instruction; “not on the bed” rules out the other place.','shelf · kệ'),
  q('d4','A table needs moving with a teammate. Ask politely for help.',['Could you help me move this table, please?','What is your name?','This table is twenty thousand dong.'],'Could you help me move this table, please?','“Could you help me …, please?” makes a clear, polite request to your teammate.','help · giúp đỡ'),
  q('d5','The floor is clean and the beds are tidy. Report that the duty is complete.',['We have finished cleaning the room.','We have not started cleaning.','Could I borrow a mystery book?'],'We have finished cleaning the room.','“We have finished …” reports a completed team task.','finished · đã hoàn thành'),
 ],
 academy:[
  q('a1','You meet a new teammate. Introduce yourself.',['Hi! My name is An.','How much is it?','Turn left.'],'Hi! My name is An.','Use “My name is …” for an introduction.','introduce · giới thiệu'),
  q('a2','Minh says: “Turn left at the courtyard.” What should you do?',['Turn left','Turn right','Return the book'],'Turn left','Repeat the key direction to check that you understood.','left · trái'),
  q('a3','Which request is polite at the library?',['Could I borrow this book, please?','Give book now.','I am a broom.'],'Could I borrow this book, please?','“Could I …, please?” is a polite way to make a request.','borrow · mượn'),
  q('a4','The book is due next Monday. Confirm the return day.',['I will return it next Monday.','I will return it on Friday.','The floor is clean.'],'I will return it next Monday.','Confirmation repeats the important detail: next Monday.','due · đến hạn'),
  q('a5','Your first choice of book is unavailable. What can you ask?',['Do you have another book?','What is a blanket?','I will turn right.'],'Do you have another book?','Ask about another option when your first choice is unavailable.','another · một cái khác'),
  q('a6','A sandwich costs 20,000 dong and water costs 5,000 dong. What is the total?',['25,000 dong','20,000 dong','30,000 dong'],'25,000 dong','20,000 + 5,000 = 25,000. Use “in total” when checking the price.','total · tổng cộng'),
  q('a7','You pay 30,000 dong for a 25,000 dong order. How much change?',['5,000 dong','10,000 dong','25,000 dong'],'5,000 dong','30,000 − 25,000 = 5,000 dong in change.','change · tiền thừa'),
  q('a8','Put these garden steps in order.',['Prepare soil → sow seeds → water','Harvest → sow seeds → prepare soil','Water → harvest → sow seeds'],'Prepare soil → sow seeds → water','Sequence words help: first prepare, then sow, then water.','sequence · trình tự'),
  q('a9','Which tool do you need to sweep the dormitory floor?',['A broom','A library card','A watering can'],'A broom','Match the tool to the action: sweep with a broom.','sweep · quét'),
  q('a10','Ask a teammate to help you carry a basket.',['Could you help me carry this basket, please?','Where is next Monday?','How much is your name?'],'Could you help me carry this basket, please?','Say what help you need after “Could you help me …”.','carry · mang'),
  q('a11','The schedule says: “Study at 14:00.” When does study time start?',['At two in the afternoon','At four in the morning','At twelve at night'],'At two in the afternoon','14:00 is 2 p.m. Use “at” before a clock time.','schedule · thời gian biểu'),
  q('a12','You did not understand the instruction. What should you say?',['Could you repeat that, please?','Yes, I finished everything.','The book is a sandwich.'],'Could you repeat that, please?','Ask for repetition when you need clarification.','repeat · nhắc lại'),
 ],
};
export function normalizeActivities(raw:unknown):ActivityRecords {
 const records:ActivityRecords={};
 if(!raw || typeof raw!=='object') return records;
 for(const id of ACTIVITY_IDS){const value=(raw as Record<string,unknown>)[id] as Partial<ActivityRecord>|undefined;
  if(value && typeof value.best==='number' && Number.isFinite(value.best) && typeof value.attempts==='number' && Number.isInteger(value.attempts) && value.attempts>0){const best=Math.max(0,Math.min(100,Math.round(value.best)));records[id]={best,attempts:Math.min(100000,value.attempts),passed:best>=ACTIVITIES[id].pass};}
 }
 if(!records.garden?.passed||!records.duty?.passed) delete records.academy;
 return records;
}
export function activityUnlocked(id:ActivityId,records:ActivityRecords={}) {return id!=='academy'||!!(records.garden?.passed&&records.duty?.passed);}
export function activityXP(records:ActivityRecords={}) {return ACTIVITY_IDS.reduce((sum,id)=>sum+(records[id]?.passed?ACTIVITIES[id].xp:0),0);}
export function finishActivity(progress:Progress,id:ActivityId,answers:ActivityAnswer[]):Progress {
 const records=progress.activities||{};
 if(!activityUnlocked(id,records))return progress;
 const questions=QUESTIONS[id];const required=id==='academy'?10:questions.length;
 if(answers.length!==required||new Set(answers.map(a=>a.questionId)).size!==required)return progress;
 if(answers.some(a=>!questions.some(q=>q.id===a.questionId&&q.choices.includes(a.answer))))return progress;
 const score=Math.round(answers.filter(a=>questions.find(q=>q.id===a.questionId)?.answer===a.answer).length/required*100);
 const best=Math.max(records[id]?.best||0,score);
 return {...progress,activities:{...records,[id]:{best,attempts:(records[id]?.attempts||0)+1,passed:best>=ACTIVITIES[id].pass}}};
}
export function shuffled<T>(items:readonly T[],random= Math.random):T[]{const result=[...items];for(let i=result.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[result[i],result[j]]=[result[j],result[i]];}return result;}
export function activityRounds(id:ActivityId){const items=id==='academy'?shuffled(QUESTIONS[id]).slice(0,10):QUESTIONS[id];return items.map(q=>({...q,choices:shuffled(q.choices)}));}
