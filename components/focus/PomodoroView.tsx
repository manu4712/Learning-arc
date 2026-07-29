"use client";

import React, { useState, useEffect } from "react";
import { usePomodoro } from "@/components/context/PomodoroContext";
import ReflectionView from "@/components/reflection/ReflectionView";
import { Goal, Session, MODES, Mode } from "@/lib/data";

type PomodoroViewProps = {
  goal: Goal;
  onCompleteSession: (session: Session) => void;
};

export default function PomodoroView({ goal, onCompleteSession }: PomodoroViewProps) {
  const {
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
  } = usePomodoro();

  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);

  // Local form setup fields
  const [mode, setMode] = useState<Mode>(state.mode || "Learning");
  const [customActivity, setCustomActivity] = useState(state.customActivity || "");
  const [topic, setTopic] = useState(state.topic || "");
  const [intent, setIntent] = useState(state.intent || "");
  const [focusMins, setFocusMins] = useState(state.focusMins || 25);
  const [shortMins, setShortMins] = useState(state.shortMins || 5);
  const [longMins, setLongMins] = useState(state.longMins || 15);
  const [cycles, setCycles] = useState(state.cycles || 4);
  const [autoStart, setAutoStart] = useState(state.autoStart || false);

  // Sync form state if state is updated to idle
  useEffect(() => {
    if (state.phase === "idle") {
      if (state.mode) setMode(state.mode);
      if (state.customActivity !== undefined) setCustomActivity(state.customActivity);
      if (state.topic !== undefined) setTopic(state.topic);
      if (state.intent !== undefined) setIntent(state.intent);
      if (state.focusMins) setFocusMins(state.focusMins);
      if (state.shortMins) setShortMins(state.shortMins);
      if (state.longMins) setLongMins(state.longMins);
      if (state.cycles) setCycles(state.cycles);
      if (state.autoStart !== undefined) setAutoStart(state.autoStart);
    }
  }, [state]);

  if (!isLoaded) {
    return (
      <div className="focus-container">
        <div className="panel loading-state">
          <div className="spinner" />
          <p>Initializing Pomodoro Engine…</p>
        </div>
      </div>
    );
  }

  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const minsStr = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const secsStr = String(totalSeconds % 60).padStart(2, "0");

  const isBegun = state.phase !== "idle";
  const isBreak = state.phase === "short" || state.phase === "long";
  const isWaiting = state.phase === "waiting";

  const handleStart = () => {
    if (!topic.trim()) return;
    if (mode === "Other" && !customActivity.trim()) return;

    startRound({
      mode,
      customActivity: mode === "Other" ? customActivity : undefined,
      topic: topic.trim(),
      intent: intent.trim(),
      focusMins,
      shortMins,
      longMins,
      cycles,
      autoStart,
    });
  };

  const handleCancelAttempt = () => {
    if (state.completedCycles > 0 || remainingMs < ((state.focusMins || 25) * 60000 - 30000)) {
      setConfirmCancelOpen(true);
    } else {
      cancelRound();
    }
  };

  const confirmCancel = () => {
    setConfirmCancelOpen(false);
    cancelRound();
  };

  // If in Reflection phase
  if (state.phase === "reflection") {
    const totalProductiveDuration = (state.focusMins || 25) * (state.completedCycles || state.cycles || 1);
    return (
      <ReflectionView
        goal={goal}
        base={{
          mode: state.mode || "Learning",
          customActivity: state.customActivity,
          topic: state.topic || "Focus Session",
          intent: state.intent,
          duration: totalProductiveDuration,
        }}
        onComplete={(session) => {
          finishReflection();
          onCompleteSession(session);
        }}
        onDiscard={() => {
          finishReflection();
        }}
      />
    );
  }

  // Timer phase mins for ring SVG calculation
  let currentPhaseMins = state.focusMins || 25;
  if (state.phase === "short" || (state.phase === "waiting" && state.waitingNextPhase === "short")) {
    currentPhaseMins = state.shortMins || 5;
  } else if (state.phase === "long" || (state.phase === "waiting" && state.waitingNextPhase === "long")) {
    currentPhaseMins = state.longMins || 15;
  }

  const currentPhaseTotalMs = Math.max(1, currentPhaseMins) * 60000;
  const progressRatio = Math.max(0, Math.min(1, remainingMs / currentPhaseTotalMs));
  const circumference = 2 * Math.PI * 90;
  const strokeOffset = circumference * (1 - progressRatio);

  return (
    <div className="focus-container">
      {!isBegun ? (
        /* SETUP MODE LAYOUT */
        <div className="focus-setup-card panel">
          <div className="setup-header">
            <span className="eyebrow">DESIGN YOUR FOCUS ROUND</span>
            <h1 className="setup-title">What are you working on?</h1>
          </div>

          <div className="setup-form-grid">
            <div className="setup-main-fields">
              <label className="input-field">
                Mode
                <div className="mode-selector">
                  {MODES.map((m) => (
                    <button
                      key={m}
                      type="button"
                      className={`mode-btn ${mode === m ? "selected" : ""}`}
                      onClick={() => setMode(m)}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </label>

              {mode === "Other" && (
                <label className="input-field">
                  What kind of activity?
                  <input
                    type="text"
                    maxLength={80}
                    placeholder="e.g. Conversation club"
                    value={customActivity}
                    onChange={(e) => setCustomActivity(e.target.value)}
                    required
                  />
                </label>
              )}

              <label className="input-field">
                Topic
                <input
                  type="text"
                  maxLength={80}
                  placeholder="e.g. Async JavaScript & Promises"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  required
                />
              </label>

              <label className="input-field">
                What do you want to accomplish? <small>(optional)</small>
                <input
                  type="text"
                  maxLength={240}
                  placeholder="e.g. Understand async/await error handling"
                  value={intent}
                  onChange={(e) => setIntent(e.target.value)}
                />
              </label>
            </div>

            <div className="setup-duration-sidebar">
              <span className="eyebrow">INTERVAL CONFIGURATION</span>
              <div className="duration-inputs">
                <label className="input-field">
                  Focus Mins
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={focusMins}
                    onChange={(e) => setFocusMins(Math.max(1, Math.min(120, +e.target.value || 1)))}
                  />
                </label>

                <label className="input-field">
                  Short Break
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={shortMins}
                    onChange={(e) => setShortMins(Math.max(1, Math.min(60, +e.target.value || 1)))}
                  />
                </label>

                <label className="input-field">
                  Focus Cycles
                  <input
                    type="number"
                    min="1"
                    max="8"
                    value={cycles}
                    onChange={(e) => setCycles(Math.max(1, Math.min(8, +e.target.value || 1)))}
                  />
                </label>

                <label className="input-field">
                  Long Break
                  <input
                    type="number"
                    min="1"
                    max="90"
                    value={longMins}
                    onChange={(e) => setLongMins(Math.max(1, Math.min(90, +e.target.value || 1)))}
                  />
                </label>
              </div>

              <label className="toggle-field">
                <input
                  type="checkbox"
                  checked={autoStart}
                  onChange={(e) => setAutoStart(e.target.checked)}
                />
                Auto-start next timer phase
              </label>

              <div className="setup-summary">
                <p>{focusMins}m focus → {shortMins}m break × {cycles} → {longMins}m long break</p>
              </div>

              <button
                type="button"
                className="primary start-session-btn"
                onClick={handleStart}
                disabled={!topic.trim()}
              >
                Start Focus Session →
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* ACTIVE TIMER HERO LAYOUT */
        <div className="focus-active-hero panel">
          {/* Status Badge */}
          <div className="timer-status-badge">
            <span className="pulse-indicator-dot" />
            <span className="status-label">
              {isWaiting
                ? `WAITING · ${state.waitingNextPhase === "focus" ? "READY FOR FOCUS" : "READY FOR BREAK"}`
                : state.isPaused
                ? `PAUSED · ${state.phase === "focus" ? "FOCUS" : "BREAK"}`
                : `${state.phase === "focus" ? "FOCUS" : state.phase === "short" ? "SHORT BREAK" : "LONG BREAK"} · CYCLE ${state.completedCycles + (state.phase === "focus" ? 1 : 0)} OF ${state.cycles}`}
            </span>
          </div>

          {/* Centered Hero Ring & Digits */}
          <div className="timer-hero-wrapper">
            <svg className="timer-hero-svg" viewBox="0 0 210 210">
              <circle className="timer-hero-track" cx="105" cy="105" r="90" />
              <circle
                className="timer-hero-progress"
                cx="105"
                cy="105"
                r="90"
                style={{
                  strokeDasharray: circumference,
                  strokeDashoffset: strokeOffset,
                }}
              />
            </svg>
            <div className="timer-digits-hero">
              <strong>
                {minsStr}<i>:</i>{secsStr}
              </strong>
            </div>
          </div>

          {/* Topic & Intent */}
          <div className="timer-topic-block">
            <h2 className="active-topic-title">
              {state.phase === "focus"
                ? state.topic
                : isWaiting
                ? `Phase Complete. Next: ${state.waitingNextPhase === "focus" ? "Focus" : "Break"}`
                : "Rest your attention; return when you are ready."}
            </h2>
            {state.intent && state.phase === "focus" && (
              <p className="active-intent-subtitle">Goal: {state.intent}</p>
            )}
          </div>

          {/* Cycle Indicators */}
          <div className="cycle-indicators-bar">
            {Array.from({ length: state.cycles || cycles }).map((_, idx) => (
              <span
                key={idx}
                className={`cycle-dot-indicator ${
                  idx < state.completedCycles
                    ? "completed"
                    : idx === state.completedCycles && state.phase === "focus"
                    ? "active"
                    : ""
                }`}
                title={`Cycle ${idx + 1}`}
              />
            ))}
          </div>

          {/* Controlled Button Hierarchy */}
          <div className="timer-controls-bar">
            {isWaiting ? (
              /* Waiting state buttons (Auto-start OFF) */
              <div className="waiting-controls-group">
                <button
                  type="button"
                  className="primary action-btn"
                  onClick={startNextPhase}
                >
                  {state.waitingNextPhase === "focus"
                    ? "Start Focus →"
                    : state.waitingNextPhase === "long"
                    ? "Start Long Break →"
                    : "Start Break →"}
                </button>

                {(state.waitingNextPhase === "short" || state.waitingNextPhase === "long") && (
                  <button
                    type="button"
                    className="secondary action-btn"
                    onClick={skipBreak}
                  >
                    {state.waitingNextPhase === "long" ? "Skip Break → Reflection" : "Skip Break"}
                  </button>
                )}
              </div>
            ) : (
              /* Active running or paused state buttons */
              <div className="active-controls-group">
                {/* Pause / Resume Button with Correct Phase Label */}
                {state.isPaused ? (
                  <button
                    type="button"
                    className="primary action-btn"
                    onClick={resume}
                  >
                    {state.phase === "focus" ? "Resume Focus" : "Resume Break"}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="secondary action-btn"
                    onClick={pause}
                  >
                    {state.phase === "focus" ? "Pause Focus" : "Pause Break"}
                  </button>
                )}

                {/* Skip Break Button (Only during Break phases) */}
                {isBreak && (
                  <button
                    type="button"
                    className="secondary action-btn"
                    onClick={skipBreak}
                  >
                    {state.phase === "long" ? "Skip Break → Reflection" : "Skip Break"}
                  </button>
                )}
              </div>
            )}

            {/* Subordinated Destructive Cancel Button */}
            <button
              type="button"
              className="text danger cancel-round-btn"
              onClick={handleCancelAttempt}
            >
              Cancel Round
            </button>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {confirmCancelOpen && (
        <div className="modal-backdrop" onClick={() => setConfirmCancelOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <span className="eyebrow danger">CONFIRM CANCELLATION</span>
            <h2>Cancel this Pomodoro round?</h2>
            <p>
              You have completed <strong>{state.completedCycles}</strong> focus cycle{state.completedCycles === 1 ? "" : "s"}. Cancelling now will discard unreflected round progress.
            </p>
            <div className="modal-actions">
              <button type="button" className="text danger" onClick={confirmCancel}>
                Yes, Cancel Round
              </button>
              <button type="button" className="primary" onClick={() => setConfirmCancelOpen(false)}>
                Keep Focusing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
