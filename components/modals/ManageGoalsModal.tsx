"use client";

import React, { useState } from "react";
import { MultiGoalStore, minutes } from "@/lib/data";

type ManageGoalsModalProps = {
  multiStore: MultiGoalStore;
  onClose: () => void;
  onSelectGoal: (goalId: string) => void;
  onRenameGoal: (goalId: string, title: string, description?: string) => void;
  onDeleteGoal: (goalId: string) => void;
  onCreateNewGoal: () => void;
};

export default function ManageGoalsModal({
  multiStore,
  onClose,
  onRenameGoal,
  onDeleteGoal,
  onCreateNewGoal,
}: ManageGoalsModalProps) {
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [deletingGoalId, setDeletingGoalId] = useState<string | null>(null);

  const goalEntries = Object.entries(multiStore.goals);
  const totalGoals = goalEntries.length;

  const startEditing = (goalId: string, currentTitle: string, currentDesc?: string) => {
    setDeletingGoalId(null);
    setEditingGoalId(goalId);
    setEditTitle(currentTitle);
    setEditDesc(currentDesc || "");
  };

  const handleSaveRename = (goalId: string) => {
    if (!editTitle.trim()) return;
    onRenameGoal(goalId, editTitle.trim(), editDesc.trim() || undefined);
    setEditingGoalId(null);
  };

  const confirmDelete = (goalId: string) => {
    onDeleteGoal(goalId);
    setDeletingGoalId(null);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content manage-goals-modal-content" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="modal-close" onClick={onClose} aria-label="Close modal">
          ×
        </button>

        <div className="modal-header-with-action">
          <div>
            <span className="eyebrow tag-interpreted">WORKSPACE GOALS</span>
            <h2 className="manage-modal-title">Manage Learning Goals</h2>
          </div>
          <button
            type="button"
            className="secondary modal-create-btn"
            onClick={() => {
              onClose();
              onCreateNewGoal();
            }}
          >
            + Create Goal
          </button>
        </div>

        <div className="goals-manage-list">
          {goalEntries.map(([goalId, g]) => {
            const isActive = goalId === multiStore.activeGoalId;
            const isEditing = editingGoalId === goalId;
            const isDeleting = deletingGoalId === goalId;
            const title = g.goal?.title || "Untitled Goal";
            const sessionCount = (g.sessions || []).length;
            const totalMins = (g.sessions || []).reduce((n, s) => n + (s.duration || 0), 0);

            if (isDeleting) {
              return (
                <div key={goalId} className="goal-manage-card delete-confirm-card">
                  <div className="delete-confirm-content">
                    <strong className="delete-confirm-title">Delete &quot;{title}&quot;?</strong>
                    <p className="delete-confirm-desc">
                      This will permanently delete this goal, its tasks, and all {sessionCount} logged focus sessions. This action cannot be undone.
                    </p>
                  </div>
                  <div className="delete-confirm-actions">
                    <button
                      type="button"
                      className="secondary delete-cancel-btn"
                      onClick={() => setDeletingGoalId(null)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="danger-btn delete-action-btn"
                      onClick={() => confirmDelete(goalId)}
                    >
                      Delete Goal
                    </button>
                  </div>
                </div>
              );
            }

            if (isEditing) {
              return (
                <div key={goalId} className="goal-manage-card edit-state">
                  <div className="field-group">
                    <label className="field-label">Goal Title</label>
                    <input
                      type="text"
                      className="text-input"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      maxLength={100}
                      placeholder="e.g. Become full stack web developer"
                    />
                  </div>
                  <div className="field-group">
                    <label className="field-label">Description (Optional)</label>
                    <textarea
                      rows={2}
                      className="text-input textarea-input"
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      maxLength={300}
                      placeholder="e.g. To build production-ready web apps independently."
                    />
                  </div>
                  <div className="goal-card-actions">
                    <button
                      type="button"
                      className="secondary"
                      onClick={() => setEditingGoalId(null)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="primary"
                      onClick={() => handleSaveRename(goalId)}
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={goalId}
                className={`goal-manage-card ${isActive ? "active-card" : ""}`}
              >
                <div className="goal-manage-info">
                  <div className="goal-title-row">
                    <strong className="goal-manage-title">{title}</strong>
                    {isActive && <span className="goal-badge active">ACTIVE</span>}
                  </div>
                  {g.goal?.description && (
                    <p className="goal-manage-desc">{g.goal.description}</p>
                  )}
                  <div className="goal-manage-meta">
                    <span>{sessionCount} sessions</span>
                    <span>·</span>
                    <span>{minutes(totalMins)} focus time</span>
                    <span>·</span>
                    <span>Created {new Date(g.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="goal-manage-controls">
                  <button
                    type="button"
                    className="icon-btn-text"
                    onClick={() => startEditing(goalId, title, g.goal?.description)}
                  >
                    Rename
                  </button>

                  {totalGoals > 1 && (
                    <button
                      type="button"
                      className="icon-btn-text danger"
                      onClick={() => {
                        setEditingGoalId(null);
                        setDeletingGoalId(goalId);
                      }}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
