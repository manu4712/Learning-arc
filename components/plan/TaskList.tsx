"use client";

import React, { useState } from "react";
import { DailyTask, Session } from "@/lib/data";
import TaskItem from "./TaskItem";

type TaskListProps = {
  tasks: DailyTask[];
  sessions: Session[];
  onToggleStatus: (task: DailyTask) => void;
  onLaunchFocus: (task: DailyTask) => void;
  onEditTask: (task: DailyTask) => void;
  onDeleteTask: (task: DailyTask) => void;
  onAddNewTask: () => void;
};

export default function TaskList({
  tasks,
  sessions,
  onToggleStatus,
  onLaunchFocus,
  onEditTask,
  onDeleteTask,
  onAddNewTask,
}: TaskListProps) {
  const [showAllCompleted, setShowAllCompleted] = useState(false);

  const plannedTasks = tasks.filter((t) => t.status === "planned");
  const inProgressTasks = tasks.filter((t) => t.status === "in_progress");
  const completedTasks = tasks.filter((t) => t.status === "completed");

  const visibleCompleted = showAllCompleted ? completedTasks : completedTasks.slice(0, 4);
  const hiddenCompletedCount = completedTasks.length - visibleCompleted.length;

  return (
    <div className="panel task-list-card">
      <div className="card-header-with-action">
        <div>
          <span className="eyebrow">DAILY COMMITMENTS</span>
          <h2>Today’s Commitments</h2>
        </div>
        <button type="button" className="secondary add-task-btn" onClick={onAddNewTask}>
          + Add Task
        </button>
      </div>

      {tasks.length === 0 ? (
        <div className="empty-tasks-state">
          <p>Choose a few meaningful tasks worth moving forward today.</p>
          <button type="button" className="primary" onClick={onAddNewTask}>
            + Add Your First Task
          </button>
        </div>
      ) : (
        <div className="task-groups-container">
          {/* PLANNED Group */}
          {plannedTasks.length > 0 && (
            <div className="tasks-subgroup">
              <span className="subgroup-label">PLANNED · {plannedTasks.length}</span>
              {plannedTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  sessions={sessions}
                  onToggleStatus={onToggleStatus}
                  onLaunchFocus={onLaunchFocus}
                  onEditTask={onEditTask}
                  onDeleteTask={onDeleteTask}
                />
              ))}
            </div>
          )}

          {/* IN PROGRESS Group */}
          {inProgressTasks.length > 0 && (
            <div className="tasks-subgroup">
              <span className="subgroup-label tag-in-progress">IN PROGRESS · {inProgressTasks.length}</span>
              {inProgressTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  sessions={sessions}
                  onToggleStatus={onToggleStatus}
                  onLaunchFocus={onLaunchFocus}
                  onEditTask={onEditTask}
                  onDeleteTask={onDeleteTask}
                />
              ))}
            </div>
          )}

          {/* COMPLETED Group */}
          {completedTasks.length > 0 && (
            <div className="tasks-subgroup completed-group">
              <span className="subgroup-label">COMPLETED · {completedTasks.length}</span>
              {visibleCompleted.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  sessions={sessions}
                  onToggleStatus={onToggleStatus}
                  onLaunchFocus={onLaunchFocus}
                  onEditTask={onEditTask}
                  onDeleteTask={onDeleteTask}
                />
              ))}

              {hiddenCompletedCount > 0 && (
                <button
                  type="button"
                  className="text expand-completed-btn"
                  onClick={() => setShowAllCompleted(true)}
                >
                  Show {hiddenCompletedCount} more ↓
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
