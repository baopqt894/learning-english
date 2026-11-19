import { restoreCampusPosition, type CampusPosition } from './campus-map.ts';
import type { AccountSession, PositionCheckpoint } from './account.ts';

function readCheckpoint(key: string): PositionCheckpoint | undefined {
  try {
    const data = JSON.parse(localStorage.getItem(key) ?? 'null');
    const position = restoreCampusPosition(data?.position);
    if (position && Number.isSafeInteger(data.at)) return { position, at: data.at };
  } catch { /* Local storage may be unavailable. */ }
}

// One instance per signed-in game. Movement never queues or rewrites mission progress.
export function campusPositionTracker(account: AccountSession) {
  const key = 'campus-pending-position-' + account.id;
  const deviceStart = account.receivedAt ?? Date.now();
  const serverStart = account.serverNow ?? deviceStart;
  const cached = readCheckpoint(key);
  let pending = cached && cached.at > (account.positionSavedAt ?? 0) ? cached : undefined;
  const initialPosition = pending?.position ?? restoreCampusPosition(account.save.progress.position);
  let last = initialPosition, lastAt = pending?.at ?? account.positionSavedAt ?? 0;
  let movedAt = 0, sentAt = 0;
  let flight: { point: PositionCheckpoint; result: Promise<boolean> } | undefined;

  function observe(candidate: CampusPosition | undefined) {
    const position = restoreCampusPosition(candidate);
    if (!position || (last && last.x === position.x && last.z === position.z && Math.abs(last.heading-position.heading) < .001)) return;
    movedAt = Date.now();
    lastAt = Math.max(lastAt + 1, serverStart + movedAt - deviceStart);
    last = position;
    pending = { position, at: lastAt };
  }

  function flush(): Promise<boolean> {
    const point = pending;
    if (!point) return Promise.resolve(true);
    if (flight?.point === point) return flight.result;
    sentAt = Date.now();
    try {
      if ((readCheckpoint(key)?.at ?? 0) <= point.at) localStorage.setItem(key, JSON.stringify(point));
    } catch { /* Try the server even if storage is full. */ }
    const result = fetch('/api/account', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, keepalive: true,
      body: JSON.stringify({ action: 'position', accountId: account.id, ...point }),
      signal: AbortSignal.timeout(10000),
    }).then(response => {
      if (!response.ok) return false;
      if (pending === point) pending = undefined;
      try {
        if (readCheckpoint(key)?.at === point.at) localStorage.removeItem(key);
      } catch { /* Server already has the checkpoint. */ }
      return true;
    }).catch(() => false).finally(() => { if (flight?.point === point) flight = undefined; });
    flight = { point, result };
    return result;
  }

  function tick() {
    const now = Date.now();
    if (pending && now - sentAt >= 1000 && (now - movedAt >= 600 || now - sentAt >= 5000)) void flush();
  }

  return { initialPosition, observe, tick, flush };
}
