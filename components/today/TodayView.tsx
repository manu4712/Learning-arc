"use client";

import React, { useState } from "react";
import { usePomodoro } from "@/components/context/PomodoroContext";
import { Goal, Session, stats as calculateStats, minutes } from "@/lib/data";

type Screen = "today" | "focus" | "journey" | "insights" | "proof" | "settings";

type TodayViewProps = {
  goal: Goal;
  st: ReturnType<typeof calculateStats>;
  sessions: Session[];
  onNavigate: (screen: Screen) => void;
  onRetryAnalysis: (id: string) => Promise<void>;
};

export default function TodayView({
  goal,
  st,
  sessions,
  onNavigate,
  onRetryAnalysis,
}: TodayViewProps) {
  const { state: pomodoroState } = usePomodoro();
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const isTimerRunning =
    pomodoroState.phase === "focus" ||
    pomodoroState.phase === "short" ||
    pomodoroState.phase === "long";

  const recentSessions = [...sessions]
    .sort((a, b) => +new Date(b.completedAt) - +new Date(a.completedAt))
    .slice(0, 4);

  const handleRetry = async (id: string) => {
    setRetryingId(id);
    try {
      await onRetryAnalysis(id);
    } catch {
      alert("Analysis is currently unavailable. Your evidence remains safely saved.");
    } finally {
      setRetryingId(null);
    }
  };

  return (
    <div className="today-container">
      {/* Hero Section */}
      <div className="hero">
        <div className="hero-content">
          <span className="eyebrow">TODAY’S DIRECTION</span>
          <h1 className="hero-title">{goal.title}</h1>
          <p className="hero-desc">{goal.description || "Turn focused effort into independent capability."}</p>
        </div>
        <button
          className="primary hero-cta-btn"
          onClick={() => onNavigate("focus")}
        >
          {isTimerRunning ? "Return to Active Focus →" : "Start a Focus Session →"}
        </button>
      </div>

      {/* Stat Row */}
      <div className="stat-row">
        <div className="stat">
          <strong>{minutes(st.today)}</strong>
          <span>focused today</span>
        </div>
        <div className="stat">
          <strong>{st.currentStreak} day{st.currentStreak === 1 ? "" : "s"}</strong>
          <span>
            {st.isStreakActiveToday
              ? "current streak • completed today"
              : st.currentStreak > 0
              ? `streak alive • log today to reach ${st.currentStreak + 1}`
              : "current streak"}
          </span>
        </div>
        <div className="stat">
          <strong>{minutes(st.total)}</strong>
          <span>total evidence</span>
        </div>
        <div className="stat">
          <strong>{st.done.length}</strong>
          <span>sessions completed</span>
        </div>
      </div>

      {/* Grid: Balance & Recent Evidence */}
      <div className="grid two">
        <section className="panel">
          <div className="panel-head">
            <div>
              <span className="eyebrow">YOUR LEARNING BALANCE</span>
              <h2>How you’ve been growing</h2>
            </div>
            <button className="text" onClick={() => onNavigate("journey")}>
              Explore journey →
            </button>
          </div>

          {st.done.length ? (
            <div className="balance-list">
              {["Learning", "Practicing", "Building", "Reading", "Revising"].map((m) => {
                const n = st.byMode[m] || 0;
                const pct = st.total ? Math.round((n / st.total) * 100) : 0;
                return (
                  <div className="balance-item" key={m}>
                    <span className="mode-label">{m}</span>
                    <div className="bar-track">
                      <div className={`bar-fill ${m.toLowerCase()}`} style={{ width: `${pct}%` }} />
                    </div>
                    <b className="pct-text">{pct}%</b>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-state">
              <span className="empty-icon">◇</span>
              <strong>Your journey starts with one honest session.</strong>
              <p>Focus on something meaningful, then reflect on what you actually did.</p>
            </div>
          )}
        </section>

        <section className="panel">
          <div className="panel-head">
            <div>
              <span className="eyebrow">RECENT EVIDENCE</span>
              <h2>Learning events</h2>
            </div>
          </div>

          {recentSessions.length ? (
            <div className="events-list">
              {recentSessions.map((s) => (
                <article className="event-item" key={s.id}>
                  <div className="event-dot" />
                  <div className="event-details">
                    <strong>{s.topic}</strong>
                    <p className="event-meta">
                      <span className={`mode-mark ${s.mode.toLowerCase()}`}>{s.mode}</span> · {minutes(s.duration)} ·{" "}
                      {s.analysis?.evidence || "unanalysed"} evidence
                    </p>
                    <small className="event-summary">{s.analysis?.summary || s.reflection}</small>
                    {s.analysisError && (
                      <button
                        className="text retry-btn"
                        disabled={retryingId === s.id}
                        onClick={() => handleRetry(s.id)}
                      >
                        {retryingId === s.id ? "Analyzing…" : "Retry analysis"}
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <span className="empty-icon">◇</span>
              <strong>No sessions recorded yet</strong>
              <p>Your completed focus sessions will become evidence here.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
