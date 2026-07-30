"use client";

import React, { useState } from "react";
import { normalizeWaterGlasses, DEFAULT_WATER_GOAL } from "@/lib/planning";

type HydrationTrackerProps = {
  waterGlasses?: boolean[];
  waterGoal?: number;
  onUpdateHydration: (glasses: boolean[], goal: number) => void;
};

export default function HydrationTracker({
  waterGlasses,
  waterGoal = DEFAULT_WATER_GOAL,
  onUpdateHydration,
}: HydrationTrackerProps) {
  const [isEditingGoal, setIsEditingGoal] = useState(false);

  const { waterGlasses: glasses, waterGoal: goal } = normalizeWaterGlasses(
    waterGlasses,
    waterGoal
  );

  const activeCount = glasses.filter(Boolean).length;

  const handleToggle = (index: number) => {
    const next = [...glasses];
    next[index] = !next[index]; // Immutable index replacement for any goal 1..16
    onUpdateHydration(next, goal);
  };

  const handleGoalChange = (newGoal: number) => {
    const { waterGlasses: nextGlasses, waterGoal: nextGoal } = normalizeWaterGlasses(
      glasses,
      newGoal
    );
    onUpdateHydration(nextGlasses, nextGoal);
  };

  return (
    <div className="panel hydration-card">
      <div className="card-header-row">
        <span className="eyebrow">WELLBEING</span>
        <div className="hydration-header-right">
          <span className="water-ratio-label">
            <strong>{activeCount}</strong> / {goal} glasses
          </span>
          <button
            type="button"
            className="text-action-btn edit-goal-btn"
            onClick={() => setIsEditingGoal((prev) => !prev)}
            title="Customize hydration goal"
          >
            ✎ Goal
          </button>
        </div>
      </div>

      <h2>Hydration</h2>

      {/* Goal Customization Stepper */}
      {isEditingGoal && (
        <div className="hydration-goal-stepper-box">
          <span className="stepper-label">Daily Goal:</span>
          <div className="stepper-controls">
            <button
              type="button"
              className="stepper-btn"
              disabled={goal <= 1}
              onClick={() => handleGoalChange(goal - 1)}
              aria-label="Decrease daily hydration goal"
            >
              −
            </button>
            <span className="stepper-value">{goal} glasses</span>
            <button
              type="button"
              className="stepper-btn"
              disabled={goal >= 16}
              onClick={() => handleGoalChange(goal + 1)}
              aria-label="Increase daily hydration goal"
            >
              +
            </button>
          </div>
          <button
            type="button"
            className="secondary btn-sm"
            onClick={() => setIsEditingGoal(false)}
          >
            Done
          </button>
        </div>
      )}

      {/* Glasses Grid */}
      <div className="water-glasses-grid">
        {glasses.map((isFilled, idx) => (
          <button
            key={idx}
            type="button"
            className={`water-glass-btn ${isFilled ? "filled" : ""}`}
            onClick={() => handleToggle(idx)}
            aria-label={`Water glass ${idx + 1} of ${goal} — ${isFilled ? "completed" : "not completed"}`}
            title={`Glass ${idx + 1}: ${isFilled ? "Filled (Click to toggle)" : "Empty (Click to toggle)"}`}
          >
            <span className="glass-icon">{isFilled ? "💧" : "○"}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
