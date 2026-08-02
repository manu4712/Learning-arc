"use client";

import React, { useState } from "react";

type CreateGoalModalProps = {
  onClose: () => void;
  onCreate: (title: string, description?: string, duration?: string) => void;
};

const TIMELINE_OPTIONS = [
  "30 Days",
  "90 Days",
  "180 Days",
  "Custom",
] as const;

export default function CreateGoalModal({ onClose, onCreate }: CreateGoalModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedTimeline, setSelectedTimeline] = useState<string>("30 Days");
  const [customDurationValue, setCustomDurationValue] = useState("30");
  const [customDurationUnit, setCustomDurationUnit] = useState<"Days" | "Weeks" | "Months" | "Years">("Days");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Please enter a goal title.");
      return;
    }

    let finalDuration = selectedTimeline;
    if (selectedTimeline === "Custom") {
      const val = customDurationValue.trim() || "1";
      finalDuration = `${val} ${customDurationUnit}`;
    }

    onCreate(title.trim(), description.trim() || undefined, finalDuration);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content create-goal-onboarding-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
          ×
        </button>

        <div className="onboarding-modal-header">
          <span className="eyebrow tag-interpreted">NEW LEARNING ARC</span>
          <h2 className="onboarding-modal-title">Create a New Learning Goal</h2>
          <p className="onboarding-modal-desc">
            Define a dedicated learning mission. Each goal maintains its own intentional plans, focus history, skill evolution, and public profile.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="onboarding-modal-form">
          {error && <div className="form-error-banner">{error}</div>}

          {/* 1. GOAL TITLE */}
          <div className="onboarding-field-group">
            <label htmlFor="goal-title-input" className="onboarding-field-label">
              Goal Title <span className="required-star">*</span>
            </label>

            <p className="onboarding-field-subtext">
              Give your learning mission a short, meaningful name.
            </p>

            <input
              id="goal-title-input"
              type="text"
              className="text-input premium-onboarding-input"
              placeholder="e.g. APPSC Group 2, Web Development, GATE CSE 2027, English Communication"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (error) setError("");
              }}
              autoFocus
              maxLength={100}
            />
          </div>

          {/* 2. WHY DOES THIS GOAL MATTER TO YOU */}
          <div className="onboarding-field-group">
            <label htmlFor="goal-desc-input" className="onboarding-field-label">
              Why does this goal matter to you? <span className="optional-tag">(optional)</span>
            </label>

            <p className="onboarding-field-subtext">
              Describe what you want to achieve or why this goal is important. This will appear as your Current Mission.
            </p>

            <textarea
              id="goal-desc-input"
              className="text-input textarea-input premium-onboarding-textarea"
              placeholder="e.g. Master frontend architecture to build production ready applications and lead engineering projects…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={400}
            />
          </div>

          {/* 3. TIMELINE & HORIZON CARDS */}
          <div className="onboarding-field-group">
            <label className="onboarding-field-label">Target Horizon / Timeline</label>
            <p className="onboarding-field-subtext">
              Select the estimated duration for this learning journey.
            </p>

            <div className="timeline-cards-grid">
              {TIMELINE_OPTIONS.map((opt) => {
                const isSelected = selectedTimeline === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    className={`timeline-card ${isSelected ? "selected" : ""}`}
                    onClick={() => setSelectedTimeline(opt)}
                  >
                    <div className="timeline-card-indicator">
                      <span className="dot" />
                    </div>
                    <span className="timeline-card-label">{opt}</span>
                  </button>
                );
              })}
            </div>

            {/* CUSTOM TIMELINE ANIMATED REVEAL */}
            {selectedTimeline === "Custom" && (
              <div className="custom-timeline-reveal">
                <div className="custom-timeline-row">
                  <div className="custom-field">
                    <label htmlFor="custom-duration-num" className="custom-field-label">
                      Duration
                    </label>
                    <input
                      id="custom-duration-num"
                      type="number"
                      min={1}
                      max={365}
                      className="text-input custom-num-input"
                      value={customDurationValue}
                      onChange={(e) => setCustomDurationValue(e.target.value)}
                    />
                  </div>

                  <div className="custom-field">
                    <label htmlFor="custom-unit-select" className="custom-field-label">
                      Unit
                    </label>
                    <select
                      id="custom-unit-select"
                      className="text-input custom-unit-select"
                      value={customDurationUnit}
                      onChange={(e) =>
                        setCustomDurationUnit(e.target.value as "Days" | "Weeks" | "Months" | "Years")
                      }
                    >
                      <option value="Days">Days</option>
                      <option value="Weeks">Weeks</option>
                      <option value="Months">Months</option>
                      <option value="Years">Years</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ACTIONS */}
          <div className="onboarding-modal-actions">
            <button type="button" className="secondary onboarding-cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="primary onboarding-submit-btn">
              Create &amp; Switch Goal →
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
