"use client";

import React, { useState } from "react";
import { DailyTask } from "@/lib/data";

type RolloverPromptProps = {
  unfinishedTasks: DailyTask[];
  onMoveToToday: (taskId: string) => void;
  onMoveAllToToday: () => void;
  onDelete: (taskId: string) => void;
};

export default function RolloverPrompt({
  unfinishedTasks,
  onMoveToToday,
  onMoveAllToToday,
  onDelete,
}: RolloverPromptProps) {
  const [reviewModalOpen, setReviewModalOpen] = useState(false);

  if (!unfinishedTasks.length) return null;

  return (
    <div className="panel rollover-prompt-banner">
      <div className="rollover-banner-content">
        <div className="banner-text">
          <span className="eyebrow tag-reflected">UNFINISHED COMMITMENTS</span>
          <h3>
            {unfinishedTasks.length} unfinished commitment{unfinishedTasks.length === 1 ? "" : "s"} from previous days
          </h3>
          <p>Consciously choose which tasks to carry forward or leave in past history.</p>
        </div>

        <div className="banner-actions">
          <button
            type="button"
            className="secondary"
            onClick={onMoveAllToToday}
          >
            Move All to Today
          </button>
          <button
            type="button"
            className="primary"
            onClick={() => setReviewModalOpen(true)}
          >
            Review Tasks ({unfinishedTasks.length}) →
          </button>
        </div>
      </div>

      {/* Explicit Review Modal */}
      {reviewModalOpen && (
        <div className="modal-backdrop" onClick={() => setReviewModalOpen(false)}>
          <div className="modal-content rollover-review-modal" onClick={(e) => e.stopPropagation()}>
            <span className="eyebrow">REVIEW UNFINISHED TASKS</span>
            <h2>Review Past Commitments</h2>
            <p className="modal-subtitle">
              Choose the explicit action for each task. Leaving a task unfinished preserves its original historical date.
            </p>

            <div className="rollover-tasks-list">
              {unfinishedTasks.map((t) => (
                <div key={t.id} className="rollover-task-row">
                  <div className="task-info">
                    <strong className="task-name">{t.title}</strong>
                    <div className="task-date-badges">
                      <span className="task-date-badge">Scheduled: {t.date}</span>
                      {t.originalPlannedDate && t.originalPlannedDate !== t.date && (
                        <span className="task-date-badge original">Originally planned: {t.originalPlannedDate}</span>
                      )}
                    </div>
                  </div>

                  <div className="rollover-item-actions">
                    <button
                      type="button"
                      className="primary btn-sm"
                      onClick={() => onMoveToToday(t.id)}
                    >
                      Move to Today
                    </button>
                    <button
                      type="button"
                      className="text danger btn-sm"
                      onClick={() => onDelete(t.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="secondary"
                onClick={() => setReviewModalOpen(false)}
              >
                Close Review
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
