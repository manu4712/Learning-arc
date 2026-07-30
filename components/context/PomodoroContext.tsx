"use client";

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import {
  PomodoroState,
  DEFAULT_POMODORO_STATE,
  loadPomodoroState,
  savePomodoroState,
  clearPomodoroState,
  getRemainingMs,
  PomodoroPhase,
} from "@/lib/pomodoro";
import { Mode } from "@/lib/data";

type PomodoroContextType = {
  state: PomodoroState;
  remainingMs: number;
  isLoaded: boolean;
  startRound: (config: {
    mode: Mode;
    customActivity?: string;
    topic: string;
    intent: string;
    focusMins: number;
    shortMins: number;
    longMins: number;
    cycles: number;
    autoStart: boolean;
    taskId?: string;
  }) => void;
  startNextPhase: () => void;
  pause: () => void;
  resume: () => void;
  skipBreak: () => void;
  cancelRound: () => void;
  finishReflection: () => void;
  updateSetupField: (field: Partial<PomodoroState>) => void;
};

const PomodoroContext = createContext<PomodoroContextType | null>(null);

export function PomodoroProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PomodoroState>(DEFAULT_POMODORO_STATE);
  const [now, setNow] = useState<number>(Date.now());
  const [isLoaded, setIsLoaded] = useState(false);
  const sounded = useRef(false);

  // Load state on initial mount
  useEffect(() => {
    const initial = loadPomodoroState();
    setState(initial);
    setIsLoaded(true);
  }, []);

  // Interval timer tick (every 250ms for responsive timestamp updates)
  useEffect(() => {
    const id = setInterval(() => {
      setNow(Date.now());
    }, 250);
    return () => clearInterval(id);
  }, []);

  // Save state on change
  useEffect(() => {
    if (isLoaded) {
      savePomodoroState(state);
    }
  }, [state, isLoaded]);

  // Compute remaining time
  const remainingMs = getRemainingMs(state, now);
  const totalSeconds = Math.ceil(remainingMs / 1000);

  // Sound completion chime
  const playChime = useCallback(() => {
    if (sounded.current) return;
    sounded.current = true;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      [0, 0.72, 1.44].forEach((offset, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const startAt = ctx.currentTime + offset;
        osc.type = "sine";
        osc.frequency.setValueAtTime([523, 659, 784][idx], startAt);
        gain.gain.setValueAtTime(0.0001, startAt);
        gain.gain.exponentialRampToValueAtTime(0.16, startAt + 0.035);
        gain.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.55);
        osc.connect(gain).connect(ctx.destination);
        osc.start(startAt);
        osc.stop(startAt + 0.58);
      });
    } catch {
      // Audio context might be restricted before user interaction
    }
  }, []);

  // Update browser document title
  useEffect(() => {
    if (state.phase === "focus" || state.phase === "short" || state.phase === "long") {
      if (state.isPaused) {
        document.title = `Paused • ${state.phase === "focus" ? "Focus" : "Break"} | Learning Arc`;
      } else if (state.startedAt) {
        const m = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
        const s = String(totalSeconds % 60).padStart(2, "0");
        const phaseName = state.phase === "focus" ? "Focus" : "Break";
        document.title = `${m}:${s} • ${phaseName} | Learning Arc`;
      }
    } else {
      document.title = "Learning Arc";
    }
  }, [state.phase, state.isPaused, state.startedAt, totalSeconds]);

  // Handle phase completion state machine transitions
  useEffect(() => {
    if (!isLoaded) return;
    if (!state.startedAt || state.isPaused) return;

    if (remainingMs === 0) {
      playChime();

      if (state.phase === "focus") {
        const nextCompleted = state.completedCycles + 1;
        const isFinalCycle = nextCompleted >= state.cycles;
        const nextPhase: PomodoroPhase = isFinalCycle ? "long" : "short";

        sounded.current = false;
        if (state.autoStart) {
          setState((prev) => ({
            ...prev,
            completedCycles: nextCompleted,
            phase: nextPhase,
            startedAt: Date.now(),
            pausedAt: null,
            accumulatedPausedMs: 0,
            isPaused: false,
          }));
        } else {
          setState((prev) => ({
            ...prev,
            completedCycles: nextCompleted,
            phase: "waiting",
            waitingNextPhase: nextPhase,
            startedAt: null,
            pausedAt: null,
            accumulatedPausedMs: 0,
            isPaused: false,
          }));
        }
      } else if (state.phase === "short") {
        sounded.current = false;
        if (state.autoStart) {
          setState((prev) => ({
            ...prev,
            phase: "focus",
            startedAt: Date.now(),
            pausedAt: null,
            accumulatedPausedMs: 0,
            isPaused: false,
          }));
        } else {
          setState((prev) => ({
            ...prev,
            phase: "waiting",
            waitingNextPhase: "focus",
            startedAt: null,
            pausedAt: null,
            accumulatedPausedMs: 0,
            isPaused: false,
          }));
        }
      } else if (state.phase === "long") {
        sounded.current = false;
        // Long break completed -> transition directly to reflection with invariants!
        setState((prev) => ({
          ...prev,
          phase: "reflection",
          reflectionPending: true,
          completedAt: Date.now(),
          startedAt: null,
          isPaused: false,
        }));
      }
    }
  }, [remainingMs, state.startedAt, state.isPaused, state.phase, state.completedCycles, state.cycles, state.autoStart, isLoaded, playChime]);

  const startRound = useCallback((config: {
    mode: Mode;
    customActivity?: string;
    topic: string;
    intent: string;
    focusMins: number;
    shortMins: number;
    longMins: number;
    cycles: number;
    autoStart: boolean;
    taskId?: string;
  }) => {
    sounded.current = false;
    const nowMs = Date.now();
    const newState: PomodoroState = {
      ...DEFAULT_POMODORO_STATE,
      ...config,
      phase: "focus",
      completedCycles: 0,
      startedAt: nowMs,
      pausedAt: null,
      accumulatedPausedMs: 0,
      isPaused: false,
      isRoundStarted: true,
      reflectionPending: false,
      completedAt: null,
    };
    setState(newState);
  }, []);

  const startNextPhase = useCallback(() => {
    if (state.phase !== "waiting" || !state.waitingNextPhase) return;
    const targetPhase = state.waitingNextPhase;
    const nowMs = Date.now();
    sounded.current = false;

    if (targetPhase === "long" || targetPhase === "short") {
      setState((prev) => ({
        ...prev,
        phase: targetPhase,
        startedAt: nowMs,
        pausedAt: null,
        accumulatedPausedMs: 0,
        isPaused: false,
        waitingNextPhase: undefined,
      }));
    } else if (targetPhase === "focus") {
      setState((prev) => ({
        ...prev,
        phase: "focus",
        startedAt: nowMs,
        pausedAt: null,
        accumulatedPausedMs: 0,
        isPaused: false,
        waitingNextPhase: undefined,
      }));
    }
  }, [state.phase, state.waitingNextPhase]);

  const pause = useCallback(() => {
    if (state.isPaused || !state.startedAt) return;
    const nowMs = Date.now();
    setState((prev) => ({
      ...prev,
      isPaused: true,
      pausedAt: nowMs,
    }));
  }, [state.isPaused, state.startedAt]);

  const resume = useCallback(() => {
    if (!state.isPaused || !state.pausedAt) return;
    const nowMs = Date.now();
    const additionalPause = nowMs - state.pausedAt;
    setState((prev) => ({
      ...prev,
      isPaused: false,
      pausedAt: null,
      accumulatedPausedMs: (prev.accumulatedPausedMs || 0) + additionalPause,
    }));
  }, [state.isPaused, state.pausedAt]);

  const skipBreak = useCallback(() => {
    if (state.phase !== "short" && state.phase !== "long" && !(state.phase === "waiting" && (state.waitingNextPhase === "short" || state.waitingNextPhase === "long"))) {
      return;
    }

    sounded.current = false;
    const nowMs = Date.now();

    if (state.phase === "long" || (state.phase === "waiting" && state.waitingNextPhase === "long")) {
      // Long Break Skipped -> Go straight to Reflection with invariants!
      setState((prev) => ({
        ...prev,
        phase: "reflection",
        reflectionPending: true,
        completedAt: Date.now(),
        startedAt: null,
        pausedAt: null,
        accumulatedPausedMs: 0,
        isPaused: false,
      }));
    } else {
      // Short Break Skipped -> Go straight to Focus
      setState((prev) => ({
        ...prev,
        phase: "focus",
        startedAt: nowMs,
        pausedAt: null,
        accumulatedPausedMs: 0,
        isPaused: false,
        waitingNextPhase: undefined,
      }));
    }
  }, [state.phase, state.waitingNextPhase]);

  const cancelRound = useCallback(() => {
    sounded.current = false;
    clearPomodoroState();
    setState(DEFAULT_POMODORO_STATE);
  }, []);

  const finishReflection = useCallback(() => {
    sounded.current = false;
    clearPomodoroState();
    setState(DEFAULT_POMODORO_STATE);
  }, []);

  const updateSetupField = useCallback((patch: Partial<PomodoroState>) => {
    setState((prev) => ({
      ...prev,
      ...patch,
    }));
  }, []);

  return (
    <PomodoroContext.Provider
      value={{
        state,
        remainingMs,
        isLoaded,
        startRound,
        startNextPhase,
        pause,
        resume,
        skipBreak,
        cancelRound,
        finishReflection,
        updateSetupField,
      }}
    >
      {children}
    </PomodoroContext.Provider>
  );
}

export function usePomodoro() {
  const ctx = useContext(PomodoroContext);
  if (!ctx) {
    throw new Error("usePomodoro must be used within a PomodoroProvider");
  }
  return ctx;
}
