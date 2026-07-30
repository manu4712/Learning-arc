"use client";

import React from "react";
import { DailyTask, Session } from "@/lib/data";
import { getTaskFocusedMinutes, getTaskSessionCount } from "@/lib/planning";

type TaskOutcomeModalProps = {
  task: DailyTask;
  sessions: Session[];
  onOutcome: (taskId: string, outcome: "completed" | "in_progress") => void;
};

export default function TaskOutcomeModal({
  task,
  sessions,
  onOutcome,
}: TaskOutcomeModalProps) {
  const focusedMins = getTaskFocusedMinutes(task, sessions);
  const sessionCount = getTaskSessionCount(task, sessions);

  const formattedMins =
    focusedMins > 60
      ? `${Math.floor(focusedMins / 60)}h ${focusedMins % 60}m`
      : `${focusedMins}m`;

  return (
    <div className="modal-backdrop">
      <div className="modal-content task-outcome-modal" onClick={(e) => e.stopPropagation()}>
        <span className="eyebrow tag-reflected">EVIDENCE SAVED</span>
        <h2>What happened to this task?</h2>
        <p className="modal-subtitle">
          Your reflection for <strong>“{task.title}”</strong> has been safely saved to your learning evidence.
        </p>

        <div className="task-outcome-summary-box">
          <div className="task-title-row">
            <strong>{task.title}</strong>
            {task.mode && <span className={`mode-pill ${task.mode.toLowerCase()}`}>{task.mode}</span>}
          </div>
          <div className="task-metrics-row">
            <span>Evidence-backed focus: <strong>{formattedMins}</strong></span>
            <span>•</span>
            <span>Sessions: <strong>{sessionCount}</strong></span>
          </div>
        </div>

        <div className="modal-actions task-outcome-actions">
          <button
            type="button"
            className="primary"
            onClick={() => onOutcome(task.id, "completed")}
          >
            ✓ Mark Task Complete
          </button>
          <button
            type="button"
            className="secondary"
            onClick={() => onOutcome(task.id, "in_progress")}
          >
            Continue Later →
          </button>
        </div>
      </div>
    </div>
  );
}
