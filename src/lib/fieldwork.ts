import { FARM_LAYOUT, FARM_OBSTACLES } from './campus-spaces.ts';
import type { Progress } from './game';

export type WorkKind = 'garden' | 'duty';
export type Tool = 'hands' | 'hoe' | 'seeds' | 'can' | 'basket' | 'broom';
export type WorkAction = 'till' | 'plant' | 'fill' | 'water' | 'grow' | 'harvest' | 'sweep' | 'fold' | 'books' | 'shelve';
export type Fieldwork = {
  garden: { beds: number[]; water: number; day: number; reported: boolean };
  duty: { swept: number; folds: number; books: number; reported: boolean };
};
export type WorkStation = {
  id: string; kind: WorkKind; name: string; x: number; z: number;
  approach: { x: number; z: number }; targetY: number;
};
export type WorkTask = { station: string; action: WorkAction; tool: Tool; instruction: string; word: string; seconds: number };
export const TOOLS: Record<Tool,string> = { hands:'Empty hands', hoe:'Garden hoe', seeds:'Seed pouch', can:'Watering can', basket:'Harvest basket', broom:'Broom' };
export const WORK_STATIONS: WorkStation[] = [
  ...FARM_LAYOUT.beds.map((bed,i)=>({id:`bed-${i}`,kind:'garden' as const,name:`Vegetable bed ${i+1}`,x:bed.x,z:bed.z,approach:bed.approach,targetY:.3})),
  {id:'tap',kind:'garden',name:'Water tap',...FARM_LAYOUT.tap,targetY:.9},
  {id:'garden-board',kind:'garden',name:'Harvest station',...FARM_LAYOUT.harvest,targetY:1},
  ...[[-27,-1.1],[-26.1,-3.2],[-28,-4.1]].map(([x,z],i)=>({id:`dust-${i}`,kind:'duty' as const,name:`Floor section ${i+1}`,x,z,approach:{x,z:z+.75},targetY:.28})),
  {id:'blanket',kind:'duty',name:'Cadet bed',x:-29.2,z:-3.1,approach:{x:-27.95,z:-2.7},targetY:.94},
  {id:'books',kind:'duty',name:'Study table',x:-24.6,z:-3.7,approach:{x:-25.7,z:-3.5},targetY:1.05},
  {id:'shelf',kind:'duty',name:'Book shelf',x:-24.1,z:-1.5,approach:{x:-25.25,z:-1.5},targetY:1.3},
  {id:'duty-board',kind:'duty',name:'Duty board',x:-23.8,z:.8,approach:{x:-23.8,z:1.9},targetY:1.3},
];
export const WORK_OBSTACLES = [
  ...FARM_OBSTACLES,
  {x:-29.2,z:-3.1,w:1.35,d:2.45}, {x:-24.6,z:-3.7,w:1.35,d:1.1}, {x:-24.1,z:-1.5,w:.75,d:.85},
];
export const freshFieldwork = ():Fieldwork => ({garden:{beds:[0,0,0],water:0,day:1,reported:false},duty:{swept:0,folds:0,books:0,reported:false}});
export function restoreFieldwork(raw:unknown):Fieldwork {
  const f=freshFieldwork(); if(!raw || typeof raw!=='object')return f;
  const value=raw as Fieldwork;
  const integer=(n:unknown,max:number)=>typeof n==='number'&&Number.isInteger(n)&&n>=0&&n<=max;
  if(value.garden){const g=value.garden;
    if(Array.isArray(g.beds)&&g.beds.length===3&&g.beds.every(b=>integer(b,5)))f.garden.beds=[...g.beds];
    if(integer(g.water,3))f.garden.water=g.water;
    if(g.day===2)f.garden.day=2;
    f.garden.reported=g.reported===true&&f.garden.beds.every(b=>b===5);
  }
  if(value.duty){const d=value.duty;
    if(integer(d.swept,7))f.duty.swept=d.swept;
    if(integer(d.folds,3))f.duty.folds=d.folds;
    if(integer(d.books,2))f.duty.books=d.books;
    f.duty.reported=d.reported===true&&f.duty.swept===7&&f.duty.folds===3&&f.duty.books===2;
  }
  return f;
}
export function nextWorkTask(f:Fieldwork,kind:WorkKind):WorkTask|null {
  const g=f.garden,d=f.duty;
  if(kind==='garden'){
    for(const stage of [0,1,2,4]){
      const i=g.beds.findIndex(b=>b===stage);if(i<0)continue;
      if(stage===2&&g.water===0)return {station:'tap',action:'fill',tool:'can',instruction:'Fill the watering can at the tap.',word:'fill · đổ đầy',seconds:2.5};
      return {station:`bed-${i}`,action:stage===0?'till':stage===1?'plant':stage===2?'water':'harvest',tool:stage===0?'hoe':stage===1?'seeds':stage===2?'can':'basket',instruction:stage===0?`Loosen the soil in bed ${i+1}.`:stage===1?`Sow the seeds in bed ${i+1}.`:stage===2?`Water bed ${i+1} gently.`:`Harvest the vegetables in bed ${i+1}.`,word:stage===0?'loosen · xới tơi':stage===1?'sow · gieo hạt':stage===2?'water · tưới nước':'harvest · thu hoạch',seconds:stage===0?3.5:stage===1?3.2:stage===2?4:3.5};
    }
    if(g.beds.every(b=>b===3))return {station:'garden-board',action:'grow',tool:'hands',instruction:'Finish today’s work. Advance to the next growing day.',word:'Time is compressed for the game; real vegetables take weeks to grow.',seconds:6};
  } else {
    for(let i=0;i<3;i++)if(!(d.swept&(1<<i)))return {station:`dust-${i}`,action:'sweep',tool:'broom',instruction:`Sweep floor section ${i+1}. Move the leaves into the dustpan.`,word:'sweep · quét; dustpan · hót rác',seconds:4};
    if(d.folds<3)return {station:'blanket',action:'fold',tool:'hands',instruction:['Smooth the blanket with both hands.','Fold the blanket lengthwise.','Fold the ends into a neat stack.'][d.folds],word:['smooth · vuốt phẳng','lengthwise · theo chiều dài','fold · gấp'][d.folds],seconds:3.6};
    if(d.books===0)return {station:'books',action:'books',tool:'hands',instruction:'Pick up the books from the study table.',word:'pick up · nhấc lên',seconds:2};
    if(d.books===1)return {station:'shelf',action:'shelve',tool:'hands',instruction:'Put the books on the shelf.',word:'put away · cất gọn',seconds:2.5};
  }
  return null;
}
/** Validation shared with runtime: work cannot complete remotely or with the wrong tool. */
export function applyWork(f:Fieldwork,kind:WorkKind,stationId:string,tool:Tool,position:{x:number;z:number},elapsed:number):Fieldwork {
  const task=nextWorkTask(f,kind),station=WORK_STATIONS.find(s=>s.id===stationId);
  if(!task||!station||task.station!==stationId||task.tool!==tool||!Number.isFinite(elapsed)||elapsed<task.seconds||Math.hypot(position.x-station.approach.x,position.z-station.approach.z)>.85)return f;
  const next:Fieldwork={garden:{...f.garden,beds:[...f.garden.beds]},duty:{...f.duty}};
  const i=Number(stationId.split('-')[1]);
  if(['till','plant','water','harvest'].includes(task.action)){next.garden.beds[i]++;if(task.action==='water')next.garden.water--;}
  if(task.action==='fill')next.garden.water=3;
  if(task.action==='grow'){next.garden.day=2;next.garden.beds=next.garden.beds.map(b=>b===3?4:b);}
  if(task.action==='sweep')next.duty.swept|=1<<i;
  if(task.action==='fold')next.duty.folds++;
  if(task.action==='books')next.duty.books=1;
  if(task.action==='shelve')next.duty.books=2;
  return next;
}
export function workReady(f:Fieldwork,kind:WorkKind){return kind==='garden'?f.garden.beds.every(b=>b===5):f.duty.swept===7&&f.duty.folds===3&&f.duty.books===2;}
export function reportWork(progress:Progress,kind:WorkKind,text:string):Progress {
  const f=progress.fieldwork||freshFieldwork();if(!workReady(f,kind)||f[kind].reported)return progress;
  const s=text.toLowerCase().replace(/[’‘]/g,"'");
  if(/\bnot\b|haven't|have not|don't|do not/.test(s))return progress;
  const valid=kind==='garden'?/harvest|collect|have/.test(s)&&/three|3/.test(s)&&/basket/.test(s)&&/vegetable|cabbage|lettuce/.test(s):/clean|swept|tidy/.test(s)&&/blanket/.test(s)&&/fold/.test(s)&&/book/.test(s)&&/shelf|put away/.test(s);
  if(!valid)return progress;
  return {...progress,fieldwork:{...f,[kind]:{...f[kind],reported:true}},activities:{...progress.activities,[kind]:{best:100,attempts:(progress.activities?.[kind]?.attempts||0)+1,passed:true}}};
}
export type WorkFrame={near:boolean;busy:boolean;percent:number;message:string};
