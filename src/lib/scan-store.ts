import { useSyncExternalStore } from "react";
import type { Appliance, BoxDetection, RoomType } from "./energy";
import { TARIFF_CONFIG, uid } from "./energy";

export interface Scan {
  id: string;
  createdAt: number;
  title: string;
  roomType: RoomType;
  occupants: number;
  tariff: number;
  image: string | null;
  boxes: BoxDetection[];
  appliances: Appliance[];
  verdict?: string;
  blindSpot?: string;
  demo?: boolean;
}

interface State {
  current: Scan | null;
  history: Scan[];
  tariff: number;
}

const KEY = "wattsight:v1";

function load(): State {
  if (typeof window === "undefined") return { current: null, history: [], tariff: TARIFF_CONFIG.defaultRpPerKwh };
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) return { tariff: TARIFF_CONFIG.defaultRpPerKwh, current: null, history: [], ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return { current: null, history: [], tariff: TARIFF_CONFIG.defaultRpPerKwh };
}

let state: State = { current: null, history: [], tariff: TARIFF_CONFIG.defaultRpPerKwh };
let hydrated = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* quota — ignore */
  }
}

function ensureHydrated() {
  if (!hydrated && typeof window !== "undefined") {
    state = load();
    hydrated = true;
  }
}

function subscribe(l: () => void) {
  ensureHydrated();
  listeners.add(l);
  return () => listeners.delete(l);
}

const serverSnapshot: State = { current: null, history: [], tariff: TARIFF_CONFIG.defaultRpPerKwh };

export function useScanStore(): State {
  return useSyncExternalStore(subscribe, () => state, () => serverSnapshot);
}

function set(updater: (s: State) => State) {
  ensureHydrated();
  state = updater(state);
  persist();
  emit();
}

export function getState(): State {
  ensureHydrated();
  return state;
}

export function newScan(partial: Partial<Scan> = {}): Scan {
  ensureHydrated();
  const scan: Scan = {
    id: uid(),
    createdAt: Date.now(),
    title: "Room scan",
    roomType: "bedroom",
    occupants: 1,
    tariff: state.tariff,
    image: null,
    boxes: [],
    appliances: [],
    ...partial,
  };
  set((s) => ({ ...s, current: scan }));
  return scan;
}

export function updateCurrent(patch: Partial<Scan> | ((s: Scan) => Partial<Scan>)) {
  set((s) => {
    if (!s.current) return s;
    const p = typeof patch === "function" ? patch(s.current) : patch;
    return { ...s, current: { ...s.current, ...p } };
  });
}

export function updateAppliance(id: string, patch: Partial<Appliance>) {
  updateCurrent((c) => ({
    appliances: c.appliances.map((a) => (a.id === id ? { ...a, ...patch } : a)),
  }));
}

export function removeAppliance(id: string) {
  updateCurrent((c) => ({ appliances: c.appliances.filter((a) => a.id !== id) }));
}

export function addAppliance(a: Appliance) {
  updateCurrent((c) => ({ appliances: [...c.appliances, a] }));
}

export function setTariff(value: number) {
  set((s) => ({
    ...s,
    tariff: value,
    current: s.current ? { ...s.current, tariff: value } : s.current,
  }));
}

export function saveCurrentToHistory() {
  set((s) => {
    if (!s.current) return s;
    const scan = { ...s.current, image: null }; // keep storage small; images stay in-session
    const history = [scan, ...s.history.filter((h) => h.id !== scan.id)].slice(0, 30);
    return { ...s, history };
  });
}

export function deleteScan(id: string) {
  set((s) => ({ ...s, history: s.history.filter((h) => h.id !== id) }));
}
