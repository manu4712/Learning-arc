import { Mode } from "./data";

export type PomodoroPhase = "idle" | "focus" | "short" | "long" | "waiting" | "reflection";

export type PomodoroState = {
  phase: PomodoroPhase;
  mode: Mode;
  customActivity?: string;
  topic: string;
  intent: string;
  focusMins: number;
  shortMins: number;
  longMins: number;
  cycles: number;
  autoStart: boolean;
  completedCycles: number;
  startedAt: number | null; // Unix timestamp in ms
  pausedAt: number | null; // Unix timestamp in ms when paused
  accumulatedPausedMs: number; // Total paused duration in ms
  isPaused: boolean;
  isRoundStarted: boolean;
  reflectionPending?: boolean;
  completedAt?: number | null; // Timestamp in ms when round completed
  waitingNextPhase?: "focus" | "short" | "long";
  taskId?: string;
};

export const DEFAULT_POMODORO_STATE: PomodoroState = {
  phase: "idle",
  mode: "Learning",
  customActivity: "",
  topic: "",
  intent: "",
  focusMins: 25,
  shortMins: 5,
  longMins: 15,
  cycles: 4,
  autoStart: false,
  completedCycles: 0,
  startedAt: null,
  pausedAt: null,
  accumulatedPausedMs: 0,
  isPaused: false,
  isRoundStarted: false,
  reflectionPending: false,
  completedAt: null,
  taskId: undefined,
};

const POMODORO_STORAGE_KEY = "learning-arc-pomodoro-v1";

/**
 * Loads the active Pomodoro state from local storage.
 * Strictly validates invariants so stale or corrupted state safely falls back to clean Setup mode.
 */
export function loadPomodoroState(): PomodoroState {
  if (typeof window === "undefined") return DEFAULT_POMODORO_STATE;
  try {
    const raw = localStorage.getItem(POMODORO_STORAGE_KEY);
    if (!raw) return DEFAULT_POMODORO_STATE;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && typeof parsed.phase === "string") {
      const phase = parsed.phase as PomodoroPhase;
      const now = Date.now();

      // 1. Idle phase -> clean setup
      if (phase === "idle") return DEFAULT_POMODORO_STATE;

      // 2. Reflection phase validation
      // MUST have reflectionPending === true, valid topic, and a completedAt timestamp < 12h ago.
      if (phase === "reflection") {
        if (
          !parsed.reflectionPending ||
          !parsed.isRoundStarted ||
          !parsed.completedAt ||
          typeof parsed.completedAt !== "number" ||
          now - parsed.completedAt > 12 * 3600 * 1000 ||
          !parsed.topic ||
          typeof parsed.topic !== "string" ||
          !parsed.topic.trim()
        ) {
          clearPomodoroState();
          return DEFAULT_POMODORO_STATE;
        }
      }

      // 3. Focus / Short / Long running phase validation
      if (phase === "focus" || phase === "short" || phase === "long") {
        if (!parsed.isRoundStarted || !parsed.startedAt || typeof parsed.startedAt !== "number" || isNaN(parsed.startedAt)) {
          clearPomodoroState();
          return DEFAULT_POMODORO_STATE;
        }
        // If timer started > 24 hours ago, discard stale abandoned round
        if (now - parsed.startedAt > 24 * 3600 * 1000) {
          clearPomodoroState();
          return DEFAULT_POMODORO_STATE;
        }
        if (!parsed.topic || typeof parsed.topic !== "string" || !parsed.topic.trim()) {
          clearPomodoroState();
          return DEFAULT_POMODORO_STATE;
        }
      }

      // 4. Waiting phase validation
      if (phase === "waiting") {
        if (!parsed.isRoundStarted || !parsed.waitingNextPhase || !parsed.topic || typeof parsed.topic !== "string" || !parsed.topic.trim()) {
          clearPomodoroState();
          return DEFAULT_POMODORO_STATE;
        }
      }

      return {
        ...DEFAULT_POMODORO_STATE,
        ...parsed,
      };
    }
  } catch (e) {
    console.error("Failed to load active Pomodoro state:", e);
  }
  clearPomodoroState();
  return DEFAULT_POMODORO_STATE;
}

/**
 * Saves active Pomodoro state to local storage.
 */
export function savePomodoroState(state: PomodoroState): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(POMODORO_STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error("Failed to save active Pomodoro state:", e);
  }
}

/**
 * Clears active Pomodoro state from local storage.
 */
export function clearPomodoroState(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(POMODORO_STORAGE_KEY);
  } catch (e) {
    console.error("Failed to clear active Pomodoro state:", e);
  }
}

/**
 * Computes remaining time in milliseconds for the active timer phase using exact timestamps.
 */
export function getRemainingMs(state: PomodoroState, now = Date.now()): number {
  if (!state || !state.phase) return 25 * 60000;

  if (!state.startedAt || state.phase === "idle" || state.phase === "waiting" || state.phase === "reflection") {
    let mins = state.focusMins || 25;
    if (state.phase === "short" || (state.phase === "waiting" && state.waitingNextPhase === "short")) {
      mins = state.shortMins || 5;
    } else if (state.phase === "long" || (state.phase === "waiting" && state.waitingNextPhase === "long")) {
      mins = state.longMins || 15;
    } else {
      mins = state.focusMins || 25;
    }
    return Math.max(1, mins) * 60000;
  }

  const phaseMins = state.phase === "focus" ? (state.focusMins || 25) : state.phase === "short" ? (state.shortMins || 5) : (state.longMins || 15);
  const targetDurationMs = Math.max(1, phaseMins) * 60000;

  const currentPauseMs = state.isPaused && state.pausedAt ? now - state.pausedAt : 0;
  const totalPausedMs = (state.accumulatedPausedMs || 0) + currentPauseMs;
  const elapsedMs = now - state.startedAt - totalPausedMs;

  return Math.max(0, targetDurationMs - elapsedMs);
}
