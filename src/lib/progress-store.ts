'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { AccountSession, SavedProgress } from './account.ts';
import { restoreProgress, type Progress } from './game.ts';

type SyncStatus = 'saved' | 'saving' | 'offline' | 'conflict';
type Queue = {
  revision: number;
  dirty: Progress | null;
  flight: Promise<boolean> | null;
  conflict: SavedProgress | null;
};

function readPending(key: string): SavedProgress | null {
  try {
    const pending = JSON.parse(localStorage.getItem(key) ?? 'null');
    if (!pending || !Number.isSafeInteger(pending.revision) || pending.revision < 0) return null;
    const progress = restoreProgress(JSON.stringify(pending.progress));
    return progress.name ? { revision: pending.revision, progress } : null;
  } catch { return null; }
}

function writePending(key: string, revision: number, dirty: Progress | null) {
  try {
    if (dirty) localStorage.setItem(key, JSON.stringify({ revision, progress: dirty }));
    else localStorage.removeItem(key);
  } catch { /* The current tab continues saving to the server. */ }
}

export function useProgress(account: AccountSession, onExpired: () => void) {
  const [progress, setProgress] = useState(account.save.progress);
  const [sync, setSync] = useState<SyncStatus>('saved');
  const queue = useRef<Queue>({ revision: account.save.revision, dirty: null, flight: null, conflict: null });
  const cacheKey = `campus-pending-progress-${account.id}`;

  const flush = useCallback(async (): Promise<boolean> => {
    const state = queue.current;
    if (state.flight) return state.flight;
    if (state.conflict) return false;
    if (!state.dirty) return true;
    setSync('saving');

    const run = async () => {
      while (state.dirty) {
        const progress = state.dirty;
        try {
          const response = await fetch('/api/account', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'save', revision: state.revision, progress }),
            signal: AbortSignal.timeout(12_000),
          });
          if (response.status === 401) {
            setSync('offline');
            onExpired();
            return false;
          }
          const packet: { save?: SavedProgress; current?: SavedProgress } = await response.json();
          if (response.status === 409 && packet.current) {
            state.conflict = packet.current;
            setSync('conflict');
            return false;
          }
          if (!response.ok || !packet.save) throw new Error('Could not save');
          state.revision = packet.save.revision;
          if (state.dirty === progress) state.dirty = null;
          writePending(cacheKey, state.revision, state.dirty);
        } catch {
          setSync('offline');
          return false;
        }
      }
      setSync('saved');
      return true;
    };

    state.flight = run();
    try { return await state.flight; }
    finally { state.flight = null; }
  }, [cacheKey, onExpired]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const pending = readPending(cacheKey);
      if (!pending) return;
      const state = queue.current;
      if (state.dirty) return;
      state.dirty = pending.progress;
      state.revision = pending.revision;
      setProgress(pending.progress);
      void flush();
    });
    const reconnect = () => { void flush(); };
    window.addEventListener('online', reconnect);
    return () => { cancelAnimationFrame(frame); window.removeEventListener('online', reconnect); };
  }, [cacheKey, flush]);

  const saveProgress = useCallback((value: Progress) => {
    const state = queue.current;
    state.dirty = value;
    setProgress(value);
    writePending(cacheKey, state.revision, value);
    void flush();
  }, [cacheKey, flush]);

  function resolveConflict(useDevice: boolean) {
    const state = queue.current, server = state.conflict;
    if (!server) return;
    state.revision = server.revision;
    state.conflict = null;
    if (useDevice) {
      writePending(cacheKey, state.revision, state.dirty);
      void flush();
    } else {
      state.dirty = null;
      writePending(cacheKey, state.revision, null);
      setProgress(server.progress);
      setSync('saved');
    }
  }

  return { progress, saveProgress, saveAvailable: sync === 'saved' || sync === 'saving', sync, flush, resolveConflict };
}
