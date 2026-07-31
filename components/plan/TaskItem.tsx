"use client";

import React from "react";
import { DailyTask, Session } from "@/lib/data";
import { getTaskEvidence } from "@/lib/planning";

type TaskItemProps = {
  task: DailyTask;
  sessions: Session[];
  onToggleStatus: (task: DailyTask) => void;
  onLaunchFocus: (task: DailyTask) => void;
  onEditTask: (task: DailyTask) => void;
  onDeleteTask: (task: DailyTask) => void;
};

export default function TaskItem({
  task,
  sessions,
  onToggleStatus,
  onLaunchFocus,
  onEditTask,
  onDeleteTask,
}: TaskItemProps) {
  const evidence = getTaskEvidence(task, sessions);

  const isCompleted = task.status === "completed";
  const isInProgress = task.status === "in_progress";
  const isManuallyCompleted = isCompleted && (task.completedManually || (evidence.focusedMinutes === 0 && evidence.sessionCount === 0));

  let statusSymbol = "○";
  if (isCompleted) statusSymbol = "✓";
  else if (isInProgress) statusSymbol = "◔";

  return (
    <div className={`task-card-item status-${task.status}`}>
      <div className="task-main-row">
        {/* Status Indicator Badge */}
        {isCompleted ? (
          <button
            type="button"
            className="task-checkbox checked"
            onClick={() => onToggleStatus(task)}
            aria-label="Reopen completed task"
            title="Click to reopen task in progress"
          >
            ✓
          </button>
        ) : (
          <span
            className={`task-checkbox status-indicator ${isInProgress ? "in-progress" : "planned"}`}
            title={isInProgress ? "In Progress — complete round to reflect & complete" : "Planned"}
            aria-label={isInProgress ? "Task In Progress" : "Task Planned"}
          >
            {statusSymbol}
          </span>
        )}

        {/* Task Content Details */}
        <div className="task-content">
          <div className="task-title-group">
            <span className={`task-title ${isCompleted ? "line-through" : ""}`}>
              {task.title}
            </span>

            {task.priority && task.priority !== "normal" && (
              <span className={`priority-badge priority-${task.priority}`}>
                {task.priority.toUpperCase()}
              </span>
            )}
          </div>

          {/* Evidence Metrics & Meta Line */}
          <div className="task-meta-line">
            {isCompleted ? (
              isManuallyCompleted ? (
                <span className="manual-completed-tag">Completed manually</span>
              ) : (
                <span className="evidence-metrics-tag">
                  {evidence.formattedHours} focused · {evidence.sessionCount} session{evidence.sessionCount === 1 ? "" : "s"}
                </span>
              )
            ) : evidence.focusedMinutes > 0 || evidence.sessionCount > 0 ? (
              <span className="evidence-metrics-tag">
                {evidence.formattedHours} focused · {evidence.sessionCount} session{evidence.sessionCount === 1 ? "" : "s"}
              </span>
            ) : null}

            {task.carriedFromDate && (
              <span className="carried-from-tag">Carried from {task.carriedFromDate}</span>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="task-actions-wrapper">
          {!isCompleted ? (
            <button
              type="button"
              className="primary focus-launch-btn"
              onClick={() => onLaunchFocus(task)}
            >
              {isInProgress ? "Continue Focus →" : "Focus →"}
            </button>
          ) : (
            <span className="completed-badge">✓ Completed</span>
          )}

          {/* Secondary Actions */}
          <div className="task-secondary-actions">
            <button
              type="button"
              className="icon-action-btn"
              onClick={() => onEditTask(task)}
              title="Edit Task"
              aria-label="Edit Task"
            >
              ✎
            </button>
            <button
              type="button"
              className="icon-action-btn danger"
              onClick={() => onDeleteTask(task)}
              title="Delete Task"
              aria-label="Delete Task"
            >
              ✕
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
