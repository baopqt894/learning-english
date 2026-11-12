"use client";

import { useSyncExternalStore } from "react";
import { freshProgress, restoreProgress, STORAGE_KEY, type Progress } from "./game";

const serverSnapshot = freshProgress();
let snapshot = serverSnapshot;
let initialized = false;
let saveAvailable = true;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  if (!initialized) {
    initialized = true;
    try { snapshot = restoreProgress(localStorage.getItem(STORAGE_KEY)); }
    catch { saveAvailable = false; }
  }
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export function saveProgress(value: Progress) {
  snapshot = value;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(value)); saveAvailable = true; }
  catch { saveAvailable = false; }
  listeners.forEach(listener => listener());
}

export function useProgress() {
  const progress = useSyncExternalStore(subscribe, () => snapshot, () => serverSnapshot);
  return { progress, saveProgress, saveAvailable };
}
