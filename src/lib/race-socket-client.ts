import type { CompetitionRoom } from './competition-engine';
type Packet = {room:CompetitionRoom;receivedAt?:number};
export type SendRoomAnswer = (body: Record<string,unknown>) => Promise<Packet>;
export class SocketUnavailable extends Error {}

export function followRaceSocket(
  seat: {code:string;token:string}, signal:AbortSignal,
  receive:(packet:Packet)=>void, ready:(send:SendRoomAnswer|null)=>void,
) {
  return new Promise<boolean>(resolve => {
    const url = new URL('/api/competitions/socket', location.href);
    url.protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(url);
    let joined = false, serial = 0;
    let pending: {id:number;resolve:(packet:Packet)=>void;reject:(reason:Error)=>void;timer:number} | undefined;
    const stop = () => ws.close();
    const deadline = window.setTimeout(stop,4500);
    const send: SendRoomAnswer = body => new Promise((accept,reject) => {
      if (ws.readyState !== WebSocket.OPEN || pending) { reject(new SocketUnavailable()); return; }
      const id = ++serial;
      pending={id,resolve:accept,reject,timer:window.setTimeout(stop,4000)};
      ws.send(JSON.stringify({...body,type:'answer',requestId:id}));
    });
    ws.onopen=()=>ws.send(JSON.stringify({type:'join',code:seat.code,token:seat.token}));
    ws.onmessage=e=>{
      if (signal.aborted) return;
      try {
        const packet=JSON.parse(e.data);
        if (packet.requestId && packet.requestId===pending?.id && pending) {
          window.clearTimeout(pending.timer);
          if (packet.error) pending.reject(new Error(packet.error));
          else pending.resolve(packet);
          pending=undefined;
        } else if (packet.room) {
          receive(packet);
          if (!joined) { clearTimeout(deadline);joined=true;ready(send); }
        } else if (packet.expired||packet.error) stop();
      } catch { stop(); }
    };
    ws.onerror=stop;
    ws.onclose=()=>{
      clearTimeout(deadline);signal.removeEventListener('abort',stop);
      if (pending) { clearTimeout(pending.timer); pending.reject(new SocketUnavailable()); }
      ready(null);resolve(joined);
    };
    signal.addEventListener('abort',stop,{once:true});
    if(signal.aborted) stop();
  });
}
