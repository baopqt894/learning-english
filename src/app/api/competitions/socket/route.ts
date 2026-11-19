import { upgradeWebSocket } from '@vercel/functions';
import { NextRequest } from 'next/server';
import { ACCOUNT_COOKIE, signedInAccount } from '@/lib/account-server';
import { competitionFeed } from '@/lib/competition-feed';
import { RoomError } from '@/lib/competition-server';
import { changeCompetitionRoom, loadCompetitionRoom } from '@/lib/competition-storage';

export const maxDuration = 120;

export async function GET(request: NextRequest) {
  if (request.headers.get('origin') !== request.nextUrl.origin) return new Response(null,{status:403});
  if (request.headers.get('upgrade')?.toLowerCase() !== 'websocket') return new Response(null,{status:426});
  const cookie = request.cookies.get(ACCOUNT_COOKIE)?.value;
  const owner = cookie && await signedInAccount(cookie);
  if (!owner) return new Response(null,{status:401});
  return upgradeWebSocket(ws => {
    const controller = new AbortController();
    let seat: {code:string;token:string} | undefined;
    let joining = false, answering = false;
    const joinDeadline = setTimeout(() => ws.close(1008,'Join a room first'),5000);
    const send = (packet: unknown) => {
      if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(packet));
    };
    ws.once('close',() => { clearTimeout(joinDeadline); controller.abort(); });
    ws.on('error',() => controller.abort());
    ws.on('message',async data => {
      const receivedAt = Date.now();
      let requestId: number | undefined;
      try {
        const frame = JSON.parse(data.toString());
        if (frame.type === 'join' && !joining && !seat) {
          joining = true;
          if (typeof frame.code !== 'string' || typeof frame.token !== 'string') throw new RoomError('Invalid seat.',401);
          const room = await loadCompetitionRoom(frame.code,frame.token,owner.id);
          if (room.format !== 'online') throw new RoomError('Online rooms only.');
          clearTimeout(joinDeadline);
          seat = {code:room.code,token:frame.token};
          const reader = competitionFeed(room,seat.token,owner.id,controller.signal,90_000).getReader();
          try {
            for (;;) {
              const {value,done} = await reader.read();
              if (done || controller.signal.aborted) break;
              if (ws.readyState === ws.OPEN) ws.send(value,{binary:false});
            }
          } finally { reader.releaseLock(); ws.close(); }
        } else if (frame.type === 'answer' && seat && Number.isSafeInteger(frame.requestId)) {
          requestId=frame.requestId;
          if (answering) throw new RoomError('An answer is already pending.',409);
          answering=true;
          try {
            const result=await changeCompetitionRoom({
              action:'answer',...seat,roundId:frame.roundId,questionIndex:frame.questionIndex,choice:frame.choice,text:frame.text,
            },owner.id,receivedAt);
            send({type:'ack',requestId,receivedAt,room:{...result.room,serverNow:Date.now()}});
          } finally { answering=false; }
        } else { throw new RoomError('Unknown room message.'); }
      } catch (err) {
        send({type:'error',requestId,error:err instanceof RoomError?err.message:'Room connection interrupted.'});
        if (!seat) ws.close(1008);
      }
    });
  },{maxPayload:2048});
}
