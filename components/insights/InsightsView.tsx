"use client";

import React, { useState } from "react";
import { Store, stats as calculateStats, minutes, Report } from "@/lib/data";

type InsightsViewProps = {
  store: Store;
  st: ReturnType<typeof calculateStats>;
  onUpdateStore: (patch: Partial<Store>) => void;
};

export default function InsightsView({ store, st, onUpdateStore }: InsightsViewProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const report = store.report;

  const generateReport = async () => {
    if (!st.done.length) {
      setError("Complete at least one focus session first so Learning Intelligence can analyze your evidence.");
      return;
    }

    setBusy(true);
    setError("");

    try {
      const facts = {
        periodDays: 14,
        totalMinutes: st.week,
        sessions: st.done.length,
        modeMinutes: st.byMode,
        topTopics: st.top,
        independence: st.done.reduce<Record<string, number>>((acc, s) => {
          acc[s.independence] = (acc[s.independence] || 0) + 1;
          return acc;
        }, {}),
        recent: st.done
          .slice(-10)
          .map((s) => ({ mode: s.mode, topic: s.topic, duration: s.duration, analysis: s.analysis })),
      };

      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "review", goal: store.goal, data: facts }),
      });

      if (!res.ok) throw new Error();
      const generated = (await res.json()) as Omit<Report, "createdAt">;
      onUpdateStore({ report: { ...generated, createdAt: new Date().toISOString() } });
    } catch {
      setError("Learning Intelligence is temporarily unavailable. Your completed learning evidence remains safely saved.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="insights-container">
      <div className="page-head">
        <div>
          <span className="eyebrow">LEARNING INTELLIGENCE</span>
          <h1 className="page-title">Patterns, interpreted carefully.</h1>
          <p className="page-desc">Deterministic evidence from your device, then an intentional AI interpretation.</p>
        </div>
      </div>

      {report ? (
        <section className="panel intelligence-panel">
          <div className="intel-header">
            <span className="eyebrow">GENERATED {new Date(report.createdAt).toLocaleDateString()}</span>
            <h2 className="narrative-headline">“{report.narrative}”</h2>
          </div>

          <div className="intel-grid">
            <div className="intel-card">
              <span className="intel-card-title">Emerging Pattern</span>
              <p>{report.pattern}</p>
            </div>
            <div className="intel-card">
              <span className="intel-card-title">Important Gap</span>
              <p>{report.gap}</p>
            </div>
            <div className="intel-card">
              <span className="intel-card-title">Recommended Next Move</span>
              <p>{report.priority}</p>
            </div>
          </div>

          <div className="intel-actions">
            <button className="secondary" onClick={generateReport} disabled={busy}>
              {busy ? "Reading your evidence with Gemini…" : "Refresh Interpretation"}
            </button>
            {error && <p className="notice danger">{error}</p>}
          </div>
        </section>
      ) : (
        <section className="panel intelligence-panel empty-intel">
          <div className="empty-intel-content">
            <span className="empty-icon">✦</span>
            <h2>{st.done.length ? "Your first learning review is ready" : "No learning evidence yet."}</h2>
            <p>
              {st.done.length
                ? `You have ${st.done.length} completed session${
                    st.done.length === 1 ? "" : "s"
                  }. Learning Intelligence interprets your balance, topics, and independence signals.`
                : "Complete your first focus session to generate your first AI learning review."}
            </p>
            <button
              className="primary"
              disabled={busy || !st.done.length}
              onClick={generateReport}
            >
              {busy ? "Reading your evidence with Gemini…" : "Generate Learning Intelligence →"}
            </button>
            {error && <p className="notice danger">{error}</p>}
          </div>
        </section>
      )}

      {/* Deterministic Facts Section */}
      <section className="grid two">
        <div className="panel">
          <span className="eyebrow">DETERMINISTIC EVIDENCE</span>
          <h2>What’s been measured</h2>
          <p className="facts-summary">
            {minutes(st.week)} in the last 7 days · {st.done.length} completed sessions · {st.currentStreak}-day active streak
          </p>

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
        </div>

        <div className="panel">
          <span className="eyebrow">AI USE, WITH INTENTION</span>
          <h2>Not a generic chatbot</h2>
          <p className="ai-philosophy">
            AI reads your actual balance, topics, and independence signals only when you explicitly request an interpretation. Its conclusions are structured signals—never objective facts or unsupported claims.
          </p>
        </div>
      </section>

      {/* Deterministic Planning & Execution Section */}
      {(store.tasks && store.tasks.length > 0) && (
        <section className="panel planning-insights-panel" style={{ marginTop: "16px" }}>
          <span className="eyebrow">PLANNING & EXECUTION</span>
          <h2>Intention vs Execution Signals</h2>
          <div className="intel-grid-horizontal">
            <div className="intel-metric-card">
              <strong>{store.tasks.filter((t) => t.status === "completed").length} / {store.tasks.length}</strong>
              <span>planned tasks completed</span>
            </div>
            <div className="intel-metric-card">
              <strong>{store.tasks.filter((t) => t.carriedFromDate).length}</strong>
              <span>tasks carried forward</span>
            </div>
            <div className="intel-metric-card">
              <strong>{store.tasks.filter((t) => t.status === "in_progress").length}</strong>
              <span>tasks in progress</span>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
