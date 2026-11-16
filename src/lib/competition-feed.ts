import type { CompetitionRoom } from './competition-engine.ts';
import { RoomError } from './competition-server.ts';
import { loadCompetitionRoom, watchCompetitionRoom } from './competition-storage.ts';

export type FeedMessage = { room: CompetitionRoom } | { heartbeat: true } | { expired: true };

export function competitionFeed(initial: CompetitionRoom, token: string, accountId: string, requestSignal: AbortSignal) {
  const abort = new AbortController();
  const encoder = new TextEncoder();
  let tick: ReturnType<typeof setTimeout> | undefined;
  let lifetime: ReturnType<typeof setTimeout> | undefined;
  let stop = () => { abort.abort(); };

  return new ReadableStream<Uint8Array>({
    start(controller) {
      stop = () => {
        if (abort.signal.aborted) return;
        abort.abort();
        clearTimeout(tick);
        clearTimeout(lifetime);
        requestSignal.removeEventListener('abort', stop);
        if (controller.desiredSize !== null) controller.close();
      };
      requestSignal.addEventListener('abort', stop, { once: true });
      if (requestSignal.aborted) { stop(); return; }

      let revision = -1, phase = initial.phase;
      const emit = (message: FeedMessage) => {
        if (abort.signal.aborted) return;
        if ((controller.desiredSize ?? 0) < -4) { stop(); return; }
        controller.enqueue(encoder.encode(JSON.stringify(message) + '\n'));
      };
      const expired = () => { emit({ expired: true }); stop(); };
      const send = (room: CompetitionRoom | null) => {
        if (!room) { expired(); return; }
        if (room.revision <= revision) return;
        revision = room.revision;
        phase = room.phase;
        emit({ room });
      };

      // Mutations are pushed without waiting for a poll. This timer advances
      // bots, timeouts and seat heartbeats when nobody is currently answering.
      const maintain = async () => {
        try {
          const room = await loadCompetitionRoom(initial.code, token, accountId);
          const before = revision;
          send(room);
          if (before === revision) emit({ heartbeat: true });
        } catch (error) {
          if (error instanceof RoomError && (error.status === 401 || error.status === 404)) expired();
          else stop();
        }
        if (!abort.signal.aborted) tick = setTimeout(maintain, phase === 'racing' ? 1200 : 3000);
      };

      lifetime = setTimeout(stop, 25_000);
      send(initial);
      tick = setTimeout(maintain, 1000);
      void watchCompetitionRoom(initial.code, token, accountId, abort.signal, send).catch(stop);
    },
    cancel() { stop(); },
  });
}
