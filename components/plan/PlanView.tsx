"use client";

import React, { useState } from "react";
import { Store, DailyTask, TaskPriority, TaskStatus } from "@/lib/data";
import {
  getTodayStr,
  getPlanForDay,
  getTasksForDay,
  getUnfinishedPreviousTasks,
  getDailySummary,
} from "@/lib/planning";

import DailyIntention from "./DailyIntention";
import TaskList from "./TaskList";
import TaskEditor from "./TaskEditor";
import HydrationTracker from "./HydrationTracker";
import AffirmationCard from "./AffirmationCard";
import GratitudeCard from "./GratitudeCard";
import RolloverPrompt from "./RolloverPrompt";
import DailySummary from "./DailySummary";

type PlanViewProps = {
  store: Store;
  onUpdateStore: (patch: Partial<Store>) => void;
  onLaunchFocus: (task: DailyTask) => void;
};

export default function PlanView({ store, onUpdateStore, onLaunchFocus }: PlanViewProps) {
  const todayStr = getTodayStr();

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<DailyTask | undefined>(undefined);
  const [taskToDelete, setTaskToDelete] = useState<DailyTask | undefined>(undefined);

  const plan = getPlanForDay(store.dailyPlans, todayStr);
  const todayTasks = getTasksForDay(store.tasks, todayStr);
  const unfinishedTasks = getUnfinishedPreviousTasks(store.tasks, todayStr);
  const summary = getDailySummary(store.tasks, store.dailyPlans, store.sessions, todayStr);

  const updateDailyPlan = (patch: Partial<typeof plan>) => {
    const updatedPlan = { ...plan, ...patch };
    onUpdateStore({
      dailyPlans: {
        ...(store.dailyPlans || {}),
        [todayStr]: updatedPlan,
      },
    });
  };

  const updateTasks = (nextTasks: DailyTask[]) => {
    onUpdateStore({ tasks: nextTasks });
  };

  const handleSaveTask = (taskData: { title: string; priority: TaskPriority }) => {
    const existing = store.tasks || [];
    if (editingTask?.id) {
      const updated = existing.map((t) =>
        t.id === editingTask.id ? { ...t, ...taskData } : t
      );
      updateTasks(updated);
    } else {
      const newTask: DailyTask = {
        id: crypto.randomUUID(),
        date: todayStr,
        originalPlannedDate: todayStr,
        title: taskData.title,
        priority: taskData.priority,
        status: "planned",
        createdAt: new Date().toISOString(),
        linkedSessionIds: [],
        rolloverCount: 0,
        rolloverHistory: [],
      };
      updateTasks([...existing, newTask]);
    }
    setEditorOpen(false);
    setEditingTask(undefined);
  };

  const handleToggleStatus = (task: DailyTask) => {
    const existing = store.tasks || [];
    const nextStatus: TaskStatus = task.status === "completed" ? "in_progress" : "completed";
    const completedAt = nextStatus === "completed" ? new Date().toISOString() : undefined;
    const completedManually = nextStatus === "completed" ? true : undefined;

    const updated = existing.map((t) =>
      t.id === task.id ? { ...t, status: nextStatus, completedAt, completedManually } : t
    );
    updateTasks(updated);
  };

  const confirmDeleteTask = () => {
    if (!taskToDelete) return;
    const existing = store.tasks || [];
    // Delete DailyTask record itself (Session evidence in store.sessions remains preserved!)
    const updated = existing.filter((t) => t.id !== taskToDelete.id);
    updateTasks(updated);
    setTaskToDelete(undefined);
  };

  const handleMoveToToday = (taskId: string) => {
    const existing = store.tasks || [];
    const updated = existing.map((t) => {
      if (t.id === taskId) {
        const history = Array.isArray(t.rolloverHistory) ? [...t.rolloverHistory, t.date] : [t.date];
        return {
          ...t,
          carriedFromDate: t.date,
          date: todayStr,
          rolloverCount: (t.rolloverCount || 0) + 1,
          rolloverHistory: history,
          status: "planned" as const,
        };
      }
      return t;
    });
    updateTasks(updated);
  };

  const handleMoveAllToToday = () => {
    const existing = store.tasks || [];
    const unfinishedIds = new Set(unfinishedTasks.map((t) => t.id));
    const updated = existing.map((t) => {
      if (unfinishedIds.has(t.id)) {
        const history = Array.isArray(t.rolloverHistory) ? [...t.rolloverHistory, t.date] : [t.date];
        return {
          ...t,
          carriedFromDate: t.date,
          date: todayStr,
          rolloverCount: (t.rolloverCount || 0) + 1,
          rolloverHistory: history,
          status: "planned" as const,
        };
      }
      return t;
    });
    updateTasks(updated);
  };

  const formattedToday = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="plan-view-container">
      {/* Page Header */}
      <div className="page-head">
        <div>
          <span className="eyebrow">DAILY COMMAND CENTER</span>
          <h1 className="page-title">Plan Your Day</h1>
          <p className="page-desc">{formattedToday} • Align your commitments with focused execution.</p>
        </div>
      </div>

      {/* Factual Summary Row */}
      <DailySummary summary={summary} />

      {/* Rollover Prompt Banner (If Unfinished Tasks Exist) */}
      <RolloverPrompt
        unfinishedTasks={unfinishedTasks}
        onMoveToToday={handleMoveToToday}
        onMoveAllToToday={handleMoveAllToToday}
        onDelete={(taskId) => {
          const t = (store.tasks || []).find((x) => x.id === taskId);
          if (t) setTaskToDelete(t);
        }}
      />

      {/* Main Workspace Layout */}
      <div className="plan-workspace-grid">
        {/* Left Column: Intention + Tasks */}
        <div className="plan-main-column">
          <DailyIntention
            intention={plan.intention}
            onSaveIntention={(val) => updateDailyPlan({ intention: val })}
          />

          <TaskList
            tasks={todayTasks}
            sessions={store.sessions}
            onToggleStatus={handleToggleStatus}
            onLaunchFocus={onLaunchFocus}
            onEditTask={(task) => {
              setEditingTask(task);
              setEditorOpen(true);
            }}
            onDeleteTask={(task) => setTaskToDelete(task)}
            onAddNewTask={() => {
              setEditingTask(undefined);
              setEditorOpen(true);
            }}
          />
        </div>

        {/* Right Column: Hydration, Affirmation, Gratitude */}
        <div className="plan-side-column">
          <HydrationTracker
            waterGlasses={plan.waterGlasses}
            waterGoal={plan.waterGoal}
            onUpdateHydration={(glasses, goal) => updateDailyPlan({ waterGlasses: glasses, waterGoal: goal })}
          />

          <AffirmationCard dateStr={todayStr} />

          <GratitudeCard
            gratitude={plan.gratitude}
            onSaveGratitude={(items) => updateDailyPlan({ gratitude: items })}
          />
        </div>
      </div>

      {/* Task Creation / Editing Modal */}
      {editorOpen && (
        <TaskEditor
          initialTask={editingTask}
          onSave={handleSaveTask}
          onClose={() => {
            setEditorOpen(false);
            setEditingTask(undefined);
          }}
        />
      )}

      {/* Task Deletion Confirmation Modal */}
      {taskToDelete && (
        <div className="modal-backdrop" onClick={() => setTaskToDelete(undefined)}>
          <div className="modal-content delete-task-modal" onClick={(e) => e.stopPropagation()}>
            <span className="eyebrow danger">CONFIRM DELETION</span>
            <h2>Delete this task?</h2>
            <p className="modal-subtitle">
              This removes the task from your Plan. Existing completed learning sessions linked to this task will remain preserved in Journey.
            </p>

            <div className="task-to-delete-preview">
              <strong>“{taskToDelete.title}”</strong>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="secondary"
                onClick={() => setTaskToDelete(undefined)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="primary danger-btn"
                onClick={confirmDeleteTask}
              >
                Delete Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
