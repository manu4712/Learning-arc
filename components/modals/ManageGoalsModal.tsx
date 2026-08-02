"use client";

import React, { useState } from "react";
import { MultiGoalStore, minutes } from "@/lib/data";

type ManageGoalsModalProps = {
  multiStore: MultiGoalStore;
  onClose: () => void;
  onSelectGoal: (goalId: string) => void;
  onRenameGoal: (goalId: string, title: string, description?: string) => void;
  onArchiveGoal: (goalId: string) => void;
  onDeleteGoal: (goalId: string) => void;
  onCreateNewGoal: () => void;
};

export default function ManageGoalsModal({
  multiStore,
  onClose,
  onSelectGoal,
  onRenameGoal,
  onArchiveGoal,
  onDeleteGoal,
  onCreateNewGoal,
}: ManageGoalsModalProps) {
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [deletingGoalId, setDeletingGoalId] = useState<string | null>(null);

  const goalsList = Object.values(multiStore.goals);
  const totalGoals = goalsList.length;

  const startEditing = (goalId: string, currentTitle: string, currentDesc?: string) => {
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
        <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
          ×
        </button>

        <div className="modal-header-with-action">
          <div>
            <span className="eyebrow">WORKSPACE GOALS</span>
            <h2>Manage Learning Goals</h2>
          </div>
          <button
            type="button"
            className="secondary"
            onClick={() => {
              onClose();
              onCreateNewGoal();
            }}
          >
            + Create Goal
          </button>
        </div>

        <div className="goals-manage-list">
          {goalsList.map((g) => {
            const isActive = g.id === multiStore.activeGoalId;
            const isArchived = Boolean(g.archivedAt);
            const isEditing = editingGoalId === g.id;
            const isDeleting = deletingGoalId === g.id;
            const title = g.goal?.title || "Untitled Goal";
            const sessionCount = (g.sessions || []).length;
            const totalMins = (g.sessions || []).reduce((n, s) => n + (s.duration || 0), 0);

            if (isDeleting) {
              return (
                <div key={g.id} className="goal-manage-card danger-state">
                  <div className="goal-danger-header">
                    <strong>Delete &quot;{title}&quot;?</strong>
                    <p className="danger-text">
                      This will permanently delete this goal, its tasks, and all {sessionCount} logged focus sessions. This action cannot be undone.
                    </p>
                  </div>
                  <div className="goal-card-actions">
                    <button
                      type="button"
                      className="secondary"
                      onClick={() => setDeletingGoalId(null)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="danger-btn"
                      onClick={() => confirmDelete(g.id)}
                    >
                      Permanently Delete Goal
                    </button>
                  </div>
                </div>
              );
            }

            if (isEditing) {
              return (
                <div key={g.id} className="goal-manage-card edit-state">
                  <div className="field-group">
                    <label className="field-label">Goal Title</label>
                    <input
                      type="text"
                      className="text-input"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      maxLength={100}
                    />
                  </div>
                  <div className="field-group">
                    <label className="field-label">Description (Optional)</label>
                    <input
                      type="text"
                      className="text-input"
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      maxLength={300}
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
                      onClick={() => handleSaveRename(g.id)}
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={g.id}
                className={`goal-manage-card ${isActive ? "active-card" : ""} ${isArchived ? "archived-card" : ""}`}
              >
                <div className="goal-manage-info">
                  <div className="goal-title-row">
                    <strong className="goal-manage-title">{title}</strong>
                    {isActive && <span className="goal-badge active">ACTIVE</span>}
                    {isArchived && <span className="goal-badge archived">ARCHIVED</span>}
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
                  {!isActive && !isArchived && (
                    <button
                      type="button"
                      className="secondary-sm"
                      onClick={() => {
                        onSelectGoal(g.id);
                        onClose();
                      }}
                    >
                      Switch To
                    </button>
                  )}

                  <button
                    type="button"
                    className="icon-btn-text"
                    onClick={() => startEditing(g.id, title, g.goal?.description)}
                    title="Rename goal"
                  >
                    Rename
                  </button>

                  <button
                    type="button"
                    className="icon-btn-text"
                    onClick={() => onArchiveGoal(g.id)}
                  >
                    {isArchived ? "Unarchive" : "Archive"}
                  </button>

                  {totalGoals > 1 && (
                    <button
                      type="button"
                      className="icon-btn-text danger"
                      onClick={() => setDeletingGoalId(g.id)}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="modal-actions">
          <button type="button" className="secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
