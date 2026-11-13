import {randomBytes} from 'node:crypto';
import {COMPETITIONS,competitionQuestions,type CompetitionId} from './competition-catalog.ts';
import {freshMember,raceTime,raceDistance,finishTime,raceQuestion,openedAt,makeAnswer,type CompetitionRoom} from './competition-engine.ts';
type Room={view:CompetitionRoom;tokens:Map<string,string>;seen:Map<string,number>;updated:number};
type Registry={rooms:Map<string,Room>};
const host=globalThis as typeof globalThis&{__campusCompetitions?:Registry};
const registry:Registry=host.__campusCompetitions??=( {rooms:new Map<string,Room>()} );
export class RoomError extends Error{status:number;constructor(message:string,status=400){super(message);this.status=status;}}
const id=()=>randomBytes(12).toString('hex');
const name=(value:unknown)=>typeof value==='string'?value.normalize('NFKC').replace(/[<>\x00-\x1f]/g,'').trim().slice(0,24)||'Cadet':'Cadet';
function clean(now:number){for(const [code,r]of registry.rooms)if(now-r.updated>30*60_000)registry.rooms.delete(code);}
function getRoom(code:unknown,now:number){clean(now);const r=typeof code==='string'?registry.rooms.get(code.toUpperCase()):undefined;if(!r)throw new RoomError('Room not found. Check the code or create a new room.',404);return r;}
function bump(r:Room,now:number){r.updated=now;r.view.revision++;r.view.serverNow=now;}
function bot(r:Room){const used=new Set(r.view.members.map(m=>m.name));const names=['Minh','Linh','An','Nam'];const botName=names.find(n=>!used.has(n))??'Cadet bot';const m=freshMember(id(),botName,'bot',r.view.members.length,botName==='Linh'?1:0);r.view.members.push(m);return m;}
function advance(r:Room,now:number){
 const v=r.view;if(v.phase==='lobby'){
  for(const m of [...v.members])if(m.kind==='human'&&now-(r.seen.get(m.id)??now)>300_000){v.members=v.members.filter(x=>x.id!==m.id);r.tokens.delete(m.id);r.seen.delete(m.id);if(v.hostId===m.id)v.hostId=v.members.find(x=>x.kind==='human')?.id??'';bump(r,now);}
 }else if(v.phase==='racing'){
  const t=raceTime(v,now);if(t<0)return;
  for(const [index,m] of v.members.entries()){
   if(m.finishedAt!==null)continue;
   if(m.kind==='human'&&now-(r.seen.get(m.id)??now)>15_000){m.kind='bot';m.connected=false;m.takeoverAt=t;bump(r,now);}
   if(m.kind==='bot'){
    const delay=3.5+index*.4,step=5.5+index*.25;
    let at=m.answers.length?Math.max(openedAt(m)+2.3,delay+m.answers.length*step):delay;
    if(m.takeoverAt!==undefined)at=Math.max(at,m.takeoverAt+2.3,(m.answers.at(-1)?.at??-10)+3.7);
    for(let n=0;n<30&&at<=t;n++){
     const miss=(m.answers.length+1)%(4+index)===0,q=raceQuestion(v,m);
     m.answers.push(makeAnswer(v,m,miss?(q.answer+1)%4:q.answer,at));bump(r,now);
     at=Math.max(openedAt(m)+2.3,delay+m.answers.length*step);
    }
   }else for(let n=0;n<30&&t>=openedAt(m)+12;n++){m.answers.push(makeAnswer(v,m,null,openedAt(m)+12));bump(r,now);}
   if(raceDistance(v,m,t)>=COMPETITIONS[v.mode].distance){m.finishedAt=finishTime(v,m);bump(r,now);}
  }
  if(v.members.every(m=>m.finishedAt!==null)){v.phase='finished';bump(r,now);}
 }
}
export function roomSnapshot(code:unknown,token?:string,now=Date.now()){
 const r=getRoom(code,now);if(token){const m=r.view.members.find(m=>r.tokens.get(m.id)===token);if(!m)throw new RoomError('Your seat is no longer available. Join the room again.',401);r.seen.set(m.id,now);r.updated=now;if(m.kind==='bot'&&!m.connected){m.kind='human';m.connected=true;delete m.takeoverAt;bump(r,now);}}
 advance(r,now);return structuredClone({...r.view,serverNow:now});
}
export function roomAction(input:Record<string,unknown>,now=Date.now()){
 clean(now);const action=input.action;
 if(action==='create'){
  if(!(typeof input.mode==='string'&&input.mode in COMPETITIONS))throw new RoomError('Choose a competition.');
  if(registry.rooms.size>=200)throw new RoomError('All rooms are busy. Try again shortly.',503);
  let code=randomBytes(4).toString('hex').slice(0,6).toUpperCase();while(registry.rooms.has(code))code=randomBytes(4).toString('hex').slice(0,6).toUpperCase();
  const member=freshMember(id(),name(input.name),'human',0,input.avatar===1?1:0),token=id()+id();
  const r:Room={view:{code,mode:input.mode as CompetitionId,hostId:member.id,phase:'lobby',members:[member],round:null,revision:0,serverNow:now},tokens:new Map([[member.id,token]]),seen:new Map([[member.id,now]]),updated:now};
  bot(r);registry.rooms.set(code,r);return {room:roomSnapshot(code,token,now),playerId:member.id,token};
 }
 const r=getRoom(input.code,now);advance(r,now);const v=r.view;
 if(action==='join'){
  if(v.phase!=='lobby')throw new RoomError('This race has started. Join after the host returns to the lobby.',409);
  if(v.members.length===4){const replace=v.members.findIndex(m=>m.kind==='bot');if(replace<0)throw new RoomError('This room is full.',409);v.members.splice(replace,1);}
  const member=freshMember(id(),name(input.name),'human',v.members.length,input.avatar===1?1:0),token=id()+id();member.ready=false;v.members.push(member);r.tokens.set(member.id,token);r.seen.set(member.id,now);bump(r,now);return {room:roomSnapshot(v.code,token,now),playerId:member.id,token};
 }
 const m=v.members.find(m=>r.tokens.get(m.id)===input.token);if(!m)throw new RoomError('You do not have access to this seat.',401);r.seen.set(m.id,now);
 const hostOnly=()=>{if(v.hostId!==m.id)throw new RoomError('Only the host can do that.',403);};
 if(action==='leave'){
  r.tokens.delete(m.id);r.seen.delete(m.id);
  if(v.phase==='lobby')v.members=v.members.filter(x=>x.id!==m.id);else{m.kind='bot';m.connected=false;m.takeoverAt=Math.max(0,raceTime(v,now));}
  if(v.hostId===m.id)v.hostId=v.members.find(x=>x.kind==='human')?.id??'';
 }else if(action==='ready'){if(v.phase!=='lobby')throw new RoomError('Wait until the next lobby.',409);m.ready=!!input.ready;
 }else if(action==='add-bot'){hostOnly();if(v.phase!=='lobby'||v.members.length>=4)throw new RoomError('No empty seat is available.',409);bot(r);
 }else if(action==='remove'){hostOnly();if(v.phase!=='lobby')throw new RoomError('Seats cannot change during a race.',409);if(input.playerId===m.id)throw new RoomError('Use Leave room to leave your own seat.');const target=v.members.find(x=>x.id===input.playerId);if(!target)throw new RoomError('Seat not found.',404);v.members=v.members.filter(x=>x!==target);r.tokens.delete(target.id);r.seen.delete(target.id);
 }else if(action==='start'){
  hostOnly();if(v.phase!=='lobby')throw new RoomError('The race has already started.',409);
  if(v.members.some(x=>x.kind==='human'&&!x.ready))throw new RoomError('Wait for every player to press Ready.',409);
  while(v.members.length<4)bot(r);
  const order=competitionQuestions(v.mode).map(q=>q.id);for(let i=order.length-1;i>0;i--){const j=randomBytes(2).readUInt16BE()% (i+1);[order[i],order[j]]=[order[j],order[i]];}
  v.round={id:id(),startedAt:now,order};v.phase='racing';v.members.forEach((x,i)=>{x.answers=[];x.finishedAt=null;x.colour=['#e7bd63','#89b798','#92c9dd','#e1a38b'][i];});
 }else if(action==='answer'){
  if(v.phase!=='racing'||!v.round||input.roundId!==v.round.id||input.questionIndex!==m.answers.length||m.finishedAt!==null)throw new RoomError('That question has changed. Read the current question.',409);
  const t=raceTime(v,now);if(t<openedAt(m)||t<0)throw new RoomError('Wait for the question to open.',409);
  if(!Number.isInteger(input.choice)||Number(input.choice)<0||Number(input.choice)>3)throw new RoomError('Choose one of the four answers.');
  m.answers.push(makeAnswer(v,m,Number(input.choice),t));
 }else if(action==='lobby'){
  hostOnly();if(v.phase!=='finished')throw new RoomError('Wait for the race to finish.',409);v.phase='lobby';v.round=null;v.members.forEach(x=>{x.answers=[];x.finishedAt=null;x.ready=x.kind==='bot'||x.id===v.hostId;delete x.takeoverAt;});
 }else throw new RoomError('Unknown room action.');
 bump(r,now);advance(r,now);return {room:structuredClone({...v,serverNow:now})};
}
