"use client";

import React, { useState, FormEvent } from "react";
import { Goal } from "@/lib/data";

type GoalSetupProps = {
  initial?: Goal;
  onDone: (goal: Goal) => void;
};

const KNOWN_DURATIONS = ["30 days", "90 days", "180 days"];

export default function GoalSetup({ initial, onDone }: GoalSetupProps) {
  const initialDuration = initial?.duration || "90 days";
  const [title, setTitle] = useState(initial?.title || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [duration, setDuration] = useState(
    KNOWN_DURATIONS.includes(initialDuration) ? initialDuration : "Custom"
  );
  const [customDays, setCustomDays] = useState(
    KNOWN_DURATIONS.includes(initialDuration) ? "" : initialDuration.replace(/\D/g, "")
  );

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const daysNum = Number(customDays);
    if (!title.trim()) return;
    if (duration === "Custom" && (!Number.isInteger(daysNum) || daysNum < 1 || daysNum > 3650)) {
      return;
    }

    onDone({
      title: title.trim(),
      description: description.trim(),
      duration: duration === "Custom" ? `${daysNum} days` : duration,
      createdAt: initial?.createdAt || new Date().toISOString(),
    });
  };

  return (
    <div className="onboard-container">
      <div className="orb-bg" />
      <div className="onboard-hero-copy">
        <span className="eyebrow">LEARNING, MADE VISIBLE</span>
        <h1 className="onboard-headline">
          Give your learning
          <br />
          <em>a clear direction.</em>
        </h1>
        <p className="onboard-sub">
          Learning Arc turns focused effort into a visible, shareable journey. Your data stays local by default.
        </p>
        <div className="learning-loop-bar">
          DECLARE <b>→</b> FOCUS <b>→</b> PROVE <b>→</b> GROW
        </div>
      </div>

      <form className="goal-form-card" onSubmit={handleSubmit}>
        <span className="eyebrow">{initial ? "EDIT DIRECTION" : "START WITH A DIRECTION"}</span>
        <h2>What are you trying to achieve?</h2>

        <label className="input-field">
          Goal title
          <input
            autoFocus
            type="text"
            maxLength={120}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Speak English confidently in technical discussions"
            required
          />
        </label>

        <label className="input-field">
          Why does it matter? <small>(optional)</small>
          <textarea
            maxLength={500}
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. I want to communicate fluently in team syncs, code reviews, and technical interviews."
          />
        </label>

        <fieldset className="horizon-fieldset">
          <legend>Target Horizon</legend>
          <div className="horizon-options">
            {[...KNOWN_DURATIONS, "Custom"].map((opt) => (
              <label key={opt} className={`pill-radio ${duration === opt ? "selected" : ""}`}>
                <input
                  type="radio"
                  name="duration"
                  checked={duration === opt}
                  onChange={() => setDuration(opt)}
                />
                {opt}
              </label>
            ))}
          </div>

          {duration === "Custom" && (
            <label className="input-field custom-days-input">
              Custom number of days
              <input
                type="number"
                min="1"
                max="3650"
                value={customDays}
                onChange={(e) => setCustomDays(e.target.value)}
                required
              />
            </label>
          )}
        </fieldset>

        <button type="submit" className="primary submit-goal-btn">
          {initial ? "Save Goal" : "Begin My Learning Arc"} <b>→</b>
        </button>
      </form>
    </div>
  );
}
