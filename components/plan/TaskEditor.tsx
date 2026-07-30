"use client";

import React, { useState } from "react";
import { DailyTask, TaskPriority } from "@/lib/data";

type TaskEditorProps = {
  initialTask?: Partial<DailyTask>;
  onSave: (taskData: {
    title: string;
    priority: TaskPriority;
  }) => void;
  onClose: () => void;
};

export default function TaskEditor({ initialTask, onSave, onClose }: TaskEditorProps) {
  const [title, setTitle] = useState(initialTask?.title || "");
  const [priority, setPriority] = useState<TaskPriority>(initialTask?.priority || "normal");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSave({
      title: title.trim(),
      priority,
    });
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content task-editor-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="eyebrow">{initialTask?.id ? "EDIT COMMITMENT" : "NEW COMMITMENT"}</span>
          <h2>{initialTask?.id ? "Edit Task" : "Add Task Commitment"}</h2>
        </div>

        <form onSubmit={handleSubmit} className="task-form">
          <label className="input-field">
            Task Title *
            <input
              type="text"
              required
              autoFocus
              maxLength={150}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Build responsive dashboard"
            />
          </label>

          <label className="input-field">
            Priority
            <div className="priority-segmented-group">
              {(["normal", "medium", "high"] as TaskPriority[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  className={`priority-pill-option ${priority === p ? "selected" : ""} priority-${p}`}
                  onClick={() => setPriority(p)}
                >
                  {p.toUpperCase()}
                </button>
              ))}
            </div>
          </label>

          <div className="modal-actions">
            <button type="button" className="secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="primary" disabled={!title.trim()}>
              {initialTask?.id ? "Save Changes" : "Add Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
