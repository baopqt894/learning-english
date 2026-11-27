import { ENGLISH_TIERS, type EnglishTier } from './cadet-tiers.ts';
import { workshopAudio } from './workshop-lessons.ts';
import { WORKSHOPS } from './workshop-wing.ts';
import { drawQuestions } from './question-rotation.ts';
import { spokenWords } from './speaking-answer.ts';

export const listeningBank = ENGLISH_TIERS.flatMap(tier => WORKSHOPS.flatMap(room =>
  [false,true].map(alternate=>{
    const item=workshopAudio(room.kind,tier,alternate);
    return {id:item.id,line:item.transcript,tier};
  })));
export type ListeningLine = typeof listeningBank[number];
export type LabReply = {id:string; text:string; mode:'mic'|'typed'};
export type LabRecord = {tier:EnglishTier; replies:LabReply[]; best?:number};
export type LabRecords = Partial<Record<EnglishTier,LabRecord>>;
export const listeningLength = 4;
export function listeningRound(tier:EnglishTier, previous:readonly string[]) {
  return drawQuestions(listeningBank.filter(q=>q.tier===tier),listeningLength,q=>q.id,previous);
}
// Edit distance counts missed, substituted and extra words, keeping word order significant.
export function wordScore(expected:string, actual:string) {
  const words=(s:string)=>spokenWords(s).split(' ').filter(Boolean);
  const a=words(expected), b=words(actual);
  let row=Array.from({length:b.length+1},(_,i)=>i);
  for(const [i,word] of a.entries()){
    const next=[i+1];
    for(const [j,heard] of b.entries()) next.push(Math.min(row[j+1]+1,next[j]+1,row[j]+Number(word!==heard)));
    row=next;
  }
  return a.length ? Math.max(0,Math.round(100*(1-row[b.length]/a.length))) : 0;
}
export function roundScore(replies:LabReply[]) {
  return Math.round(replies.reduce((sum,r)=>sum+wordScore(listeningBank.find(q=>q.id===r.id)!.line,r.text),0)/replies.length);
}
export function restoreLabRecords(raw:unknown): LabRecords | undefined {
  if (!raw || typeof raw!=='object') return;
  const records:LabRecords={};
  for(const tier of ENGLISH_TIERS){
    const r=(raw as LabRecords)[tier];
    if (!r || !Array.isArray(r.replies) || r.replies.length!==listeningLength || new Set(r.replies.map(q=>q?.id)).size!==listeningLength) continue;
    if (!r.replies.every(q=>q && listeningBank.some(line=>line.id===q.id && line.tier===tier) &&
      (q.mode==='mic'||q.mode==='typed') && typeof q.text==='string' && q.text.trim() && q.text.length<=350)) continue;
    records[tier]={tier,replies:r.replies.map(({id,text,mode})=>({id,text,mode})),
      ...(typeof r.best==='number' && Number.isInteger(r.best) && r.best>=0 && r.best<=100?{best:r.best}:{})};
  }
  return Object.keys(records).length?records:undefined;
}
