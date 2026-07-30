"use client";

import React, { useState, useEffect, useRef } from "react";
import { Session, Goal, Mode, Independence, Analysis } from "@/lib/data";

type Recognition = {
  start: () => void;
  stop: () => void;
  abort: () => void;
  continuous: boolean;
  interimResults: boolean;
  onstart: (() => void) | null;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
};

type SpeechWindow = Window & {
  SpeechRecognition?: new () => Recognition;
  webkitSpeechRecognition?: new () => Recognition;
};

const INDEPENDENCE_OPTIONS: Independence[] = [
  "Following a tutorial",
  "With significant guidance",
  "With some guidance",
  "Mostly independently",
  "Completely independently",
];

type ReflectionViewProps = {
  goal: Goal;
  base: {
    mode: Mode;
    customActivity?: string;
    topic: string;
    intent: string;
    duration: number;
    taskId?: string;
  };
  onComplete: (session: Session) => void;
  onDiscard: () => void;
};

export default function ReflectionView({ goal, base, onComplete, onDiscard }: ReflectionViewProps) {
  const [reflection, setReflection] = useState("");
  const [independence, setIndependence] = useState<Independence>("With some guidance");
  const [difficulty, setDifficulty] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [listening, setListening] = useState(false);
  const [dictationSupported, setDictationSupported] = useState(false);
  const [confirmDiscardOpen, setConfirmDiscardOpen] = useState(false);

  const recognitionRef = useRef<Recognition | null>(null);

  useEffect(() => {
    const w = window as SpeechWindow;
    setDictationSupported(!!(w.SpeechRecognition || w.webkitSpeechRecognition));
    return () => {
      recognitionRef.current?.abort();
    };
  }, []);

  const toggleDictation = () => {
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }
    const w = window as SpeechWindow;
    const Speech = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!Speech) return;

    const next = new Speech();
    next.continuous = true;
    next.interimResults = false;
    next.onstart = () => {
      setListening(true);
      setMessage("");
    };
    next.onresult = (event) => {
      let words = "";
      for (let i = 0; i < event.results.length; i++) {
        words += `${event.results[i][0]?.transcript || ""} `;
      }
      if (words.trim()) {
        setReflection((val) => `${val}${val.trim() ? " " : ""}${words.trim()}`);
      }
    };
    next.onerror = (event) => {
      setMessage(`Dictation notice: ${event.error}. You can keep typing manually.`);
    };
    next.onend = () => {
      setListening(false);
      recognitionRef.current = null;
    };
    recognitionRef.current = next;

    try {
      next.start();
    } catch {
      setMessage("Dictation unavailable. You can continue typing manually.");
    }
  };

  const handleSubmit = async () => {
    if (!reflection.trim()) return;
    setBusy(true);

    const session: Session = {
      id: crypto.randomUUID(),
      startedAt: new Date(Date.now() - base.duration * 60000).toISOString(),
      completedAt: new Date().toISOString(),
      ...base,
      reflection: reflection.trim(),
      independence,
      difficulty: difficulty.trim() || undefined,
    };

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "session", goal, data: session }),
      });
      if (!res.ok) throw new Error();
      session.analysis = (await res.json()) as Analysis;
    } catch {
      session.analysisError = true;
      setMessage("Your session is safely saved! AI analysis is currently unavailable and can be retried later.");
    }

    onComplete(session);
    setBusy(false);
  };

  return (
    <div className="reflection-card panel">
      <div className="reflection-header">
        <span className="eyebrow">PROVE THE LEARNING</span>
        <h1>What did you actually do?</h1>
        <p className="lede">A candid reflection converts spent time into verifiable learning evidence.</p>
      </div>

      <div className="reflection-form">
        {/* Section 1: Reflection Input & Dictation */}
        <label className="input-field">
          What happened in this session?
          <textarea
            autoFocus
            rows={5}
            maxLength={1200}
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            placeholder="I built a small fetch request and handled edge cases without looking at the tutorial…"
          />
        </label>

        {dictationSupported && (
          <div className="dictation-wrapper">
            <button
              type="button"
              className={`secondary dictation-button ${listening ? "listening" : ""}`}
              onClick={toggleDictation}
            >
              {listening ? "⏹ Stop Dictation" : "🎙 Dictate Reflection"}
            </button>
            {listening && <span className="listening-pulse">Listening... speak naturally.</span>}
          </div>
        )}

        {/* Section 2: Segmented Independence Selector */}
        <fieldset className="independence-fieldset">
          <legend className="input-label">How independently did you work?</legend>
          <div className="independence-segmented-group">
            {INDEPENDENCE_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                className={`independence-pill-option ${independence === opt ? "selected" : ""}`}
                onClick={() => setIndependence(opt)}
              >
                {opt}
              </button>
            ))}
          </div>
        </fieldset>

        {/* Section 3: Difficulty Field */}
        <label className="input-field">
          <span>What was difficult or challenging? <small className="optional-tag">(optional)</small></span>
          <input
            type="text"
            maxLength={300}
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            placeholder="e.g. Error handling and understanding response shapes"
          />
        </label>

        {/* Dictation / Network Notice */}
        {message && (
          <div className="dictation-notice-box">
            <span className="notice-icon">ℹ</span>
            <span className="notice-text">{message}</span>
          </div>
        )}

        {/* Primary Action Button */}
        <div className="reflection-actions-bar">
          <button
            type="button"
            className="primary submit-reflection-btn"
            disabled={busy || !reflection.trim()}
            onClick={handleSubmit}
          >
            {busy ? "Interpreting evidence with Gemini…" : "Analyze My Progress →"}
          </button>
        </div>

        {/* Subtle Discard Escaping Control */}
        <div className="discard-reflection-wrapper">
          <button
            type="button"
            className="text danger discard-subtle-btn"
            onClick={() => setConfirmDiscardOpen(true)}
          >
            Discard Reflection
          </button>
        </div>
      </div>

      {/* Discard Confirmation Modal */}
      {confirmDiscardOpen && (
        <div className="modal-backdrop" onClick={() => setConfirmDiscardOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <span className="eyebrow danger">CONFIRM DISCARD</span>
            <h2>Discard this reflection?</h2>
            <p>
              Your completed focus round will not be saved as learning evidence in your Journey.
            </p>
            <div className="modal-actions">
              <button type="button" className="primary" onClick={() => setConfirmDiscardOpen(false)}>
                Keep Reflecting
              </button>
              <button type="button" className="text danger" onClick={() => { setConfirmDiscardOpen(false); onDiscard(); }}>
                Discard Reflection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
