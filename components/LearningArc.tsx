"use client";

import React, { useEffect, useMemo, useState } from "react";
import { PomodoroProvider } from "@/components/context/PomodoroContext";
import Header from "@/components/layout/Header";
import TodayView from "@/components/today/TodayView";
import PlanView from "@/components/plan/PlanView";
import PomodoroView from "@/components/focus/PomodoroView";
import JourneyView from "@/components/journey/JourneyView";
import InsightsView from "@/components/insights/InsightsView";
import ProofView from "@/components/proof/ProofView";
import SettingsView from "@/components/settings/SettingsView";
import GoalSetup from "@/components/onboarding/GoalSetup";
import ThemeToggle from "@/components/layout/ThemeToggle";
import TaskOutcomeModal from "@/components/plan/TaskOutcomeModal";
import CreateGoalModal from "@/components/modals/CreateGoalModal";
import ManageGoalsModal from "@/components/modals/ManageGoalsModal";
import {
  EMPTY_MULTI_STORE,
  EMPTY_GOAL_STORE,
  Goal,
  Session,
  GoalStore,
  MultiGoalStore,
  Analysis,
  DailyTask,
  normalizeMultiStore,
  mergeMultiStore,
  loadMultiStore,
  saveMultiStore,
  createGoal as createGoalInStore,
  switchGoal as switchGoalInStore,
  renameGoalInStore,
  deleteGoalFromStore,
  stats as calculateStats,
} from "@/lib/data";
import { clearPomodoroState } from "@/lib/pomodoro";

type Screen = "today" | "plan" | "focus" | "journey" | "insights" | "proof" | "settings";

function LearningArcContent() {
  const [multiStore, setMultiStore] = useState<MultiGoalStore>(EMPTY_MULTI_STORE);
  const [ready, setReady] = useState(false);
  const [screen, setScreen] = useState<Screen>("today");
  const [onboard, setOnboard] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Modals for multi-goal support
  const [createGoalModalOpen, setCreateGoalModalOpen] = useState(false);
  const [manageGoalsModalOpen, setManageGoalsModalOpen] = useState(false);

  // Active task selected to launch Focus from Plan
  const [targetTaskForFocus, setTargetTaskForFocus] = useState<DailyTask | undefined>(undefined);

  // Task pending outcome decision after reflection submission
  const [pendingOutcomeTask, setPendingOutcomeTask] = useState<DailyTask | undefined>(undefined);

  useEffect(() => {
    const loadedMulti = loadMultiStore();
    setMultiStore(loadedMulti);
    const active = loadedMulti.goals[loadedMulti.activeGoalId];
    setOnboard(!active || !active.goal?.title);
    setReady(true);
  }, []);

  // Compute active GoalStore derived from activeGoalId
  const activeGoalStore: GoalStore = useMemo(() => {
    if (multiStore.activeGoalId && multiStore.goals[multiStore.activeGoalId]) {
      return multiStore.goals[multiStore.activeGoalId];
    }
    const firstId = Object.keys(multiStore.goals)[0];
    if (firstId && multiStore.goals[firstId]) {
      return multiStore.goals[firstId];
    }
    return EMPTY_GOAL_STORE;
  }, [multiStore]);

  const st = useMemo(
    () => calculateStats(activeGoalStore.sessions || []),
    [activeGoalStore.sessions]
  );

  const updateStore = (patch: Partial<GoalStore>) => {
    setMultiStore((current) => {
      const normalized = normalizeMultiStore(current);
      const activeId = normalized.activeGoalId;
      if (!activeId || !normalized.goals[activeId]) return normalized;
      const currentGoalStore = normalized.goals[activeId];
      const updatedGoalStore: GoalStore = {
        ...currentGoalStore,
        ...patch,
        id: activeId, // Immutable ID preservation
        updatedAt: new Date().toISOString(),
      };
      const updatedMulti: MultiGoalStore = {
        ...normalized,
        goals: {
          ...normalized.goals,
          [activeId]: updatedGoalStore,
        },
      };
      saveMultiStore(updatedMulti);
      return updatedMulti;
    });
  };

  // Multi-Goal Handler Functions
  const handleSelectGoal = (goalId: string) => {
    setMultiStore((current) => {
      const updated = switchGoalInStore(current, goalId);
      return updated;
    });
  };

  const handleCreateGoal = (title: string, description?: string, duration?: string) => {
    setMultiStore((current) => {
      const updated = createGoalInStore(current, title, description, duration);
      return updated;
    });
    setOnboard(false);
  };

  const handleRenameGoal = (goalId: string, title: string, description?: string) => {
    setMultiStore((current) => renameGoalInStore(current, goalId, title, description));
  };

  const handleDeleteGoal = (goalId: string) => {
    // 1. Clean up Pomodoro persisted state for deleted goal
    clearPomodoroState(goalId);

    // 2. Delete goal from multi-store and switch to next valid goal
    setMultiStore((current) => {
      const updated = deleteGoalFromStore(current, goalId);
      const active = updated.goals[updated.activeGoalId];
      if (!active || !active.goal?.title) {
        setOnboard(true);
      }
      return updated;
    });
  };

  const handleRestoreMultiStore = (restored: MultiGoalStore) => {
    setMultiStore((current) => {
      const merged = mergeMultiStore(current, restored);
      saveMultiStore(merged);
      setTimeout(() => {
        const active = merged.goals[merged.activeGoalId];
        setOnboard(!active || !active.goal?.title);
      }, 0);
      return merged;
    });
  };

  const handleLaunchTaskFocus = (task: DailyTask) => {
    setTargetTaskForFocus(task);
    setScreen("focus");
  };

  const handleCompleteSession = (newSession: Session) => {
    setMultiStore((current) => {
      const normalized = normalizeMultiStore(current);
      const targetGoalId = newSession.goalId || normalized.activeGoalId;
      const targetGoalStore = normalized.goals[targetGoalId] || normalized.goals[normalized.activeGoalId];
      if (!targetGoalStore) return normalized;

      const currentSessions = targetGoalStore.sessions || [];
      const sessionToSave: Session = {
        ...newSession,
        goalId: targetGoalStore.id,
      };
      const updatedSessions = [...currentSessions, sessionToSave];
      let updatedTasks = targetGoalStore.tasks || [];

      if (newSession.taskId) {
        updatedTasks = updatedTasks.map((t) => {
          if (t.id === newSession.taskId) {
            const linked = t.linkedSessionIds || [];
            return {
              ...t,
              goalId: targetGoalStore.id,
              linkedSessionIds: linked.includes(newSession.id) ? linked : [...linked, newSession.id],
              status: t.status === "planned" ? ("in_progress" as const) : t.status,
            };
          }
          return t;
        });
      }

      const updatedGoalStore: GoalStore = {
        ...targetGoalStore,
        sessions: updatedSessions,
        tasks: updatedTasks,
        updatedAt: new Date().toISOString(),
      };

      const updatedMulti: MultiGoalStore = {
        ...normalized,
        goals: {
          ...normalized.goals,
          [targetGoalStore.id]: updatedGoalStore,
        },
      };
      saveMultiStore(updatedMulti);

      if (newSession.taskId) {
        const linkedTask = updatedTasks.find((t) => t.id === newSession.taskId);
        if (linkedTask) {
          setPendingOutcomeTask(linkedTask);
        } else {
          setScreen("today");
        }
      } else {
        setScreen("today");
      }

      return updatedMulti;
    });

    setTargetTaskForFocus(undefined);
  };

  const handleTaskOutcome = (taskId: string, outcome: "completed" | "in_progress") => {
    const existing = activeGoalStore.tasks || [];
    const completedAt = outcome === "completed" ? new Date().toISOString() : undefined;
    const updated = existing.map((t) =>
      t.id === taskId ? { ...t, status: outcome, completedAt } : t
    );

    updateStore({ tasks: updated });
    setPendingOutcomeTask(undefined);
    setScreen("plan");
  };

  const handleRetrySessionAnalysis = async (id: string) => {
    const session = (activeGoalStore.sessions || []).find((s) => s.id === id);
    if (!session) return;

    const res = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "session", goal: activeGoalStore.goal, data: session }),
    });

    if (!res.ok) throw new Error("Analysis request failed");

    const analysis = (await res.json()) as Analysis;
    updateStore({
      sessions: (activeGoalStore.sessions || []).map((s) =>
        s.id === id ? { ...s, analysis, analysisError: false } : s
      ),
    });
  };

  if (!ready) {
    return (
      <main className="loading-state">
        <div className="spinner" />
        <p>Loading your learning arc…</p>
      </main>
    );
  }

  if (onboard) {
    return (
      <div className="onboard-wrapper">
        <header className="onboard-top-bar">
          <div className="brand">
            <span className="brand-symbol">↗</span> Learning Arc
          </div>
          <ThemeToggle />
        </header>
        <GoalSetup
          initial={activeGoalStore.goal}
          onDone={(newGoal: Goal) => {
            updateStore({ goal: newGoal });
            setOnboard(false);
          }}
        />
      </div>
    );
  }

  const handleSelectScreen = (scr: Screen) => {
    if (scr !== "focus") {
      setTargetTaskForFocus(undefined);
    }
    setScreen(scr);
  };

  return (
    <PomodoroProvider
      key={multiStore.activeGoalId || "goal_default"}
      activeGoalId={multiStore.activeGoalId || "goal_default"}
    >
      <div className="app-layout">
        <Header
          activeScreen={screen}
          onSelectScreen={handleSelectScreen}
          multiStore={multiStore}
          onSelectGoal={handleSelectGoal}
          onCreateGoal={() => setCreateGoalModalOpen(true)}
          onManageGoals={() => setManageGoalsModalOpen(true)}
          menuOpen={menuOpen}
          setMenuOpen={setMenuOpen}
        />

        <main className="app-main-content">
          {screen === "today" && (
            <TodayView
              goal={activeGoalStore.goal!}
              st={st}
              sessions={activeGoalStore.sessions || []}
              onNavigate={handleSelectScreen}
              onRetryAnalysis={handleRetrySessionAnalysis}
            />
          )}

          {screen === "plan" && (
            <PlanView
              store={activeGoalStore}
              onUpdateStore={updateStore}
              onLaunchFocus={handleLaunchTaskFocus}
            />
          )}

          {screen === "focus" && (
            <PomodoroView
              goal={activeGoalStore.goal!}
              targetTask={targetTaskForFocus}
              onCompleteSession={handleCompleteSession}
            />
          )}

          {screen === "journey" && (
            <JourneyView
              store={activeGoalStore}
              sessions={activeGoalStore.sessions || []}
              st={st}
            />
          )}

          {screen === "insights" && (
            <InsightsView
              store={activeGoalStore}
              st={st}
              onUpdateStore={updateStore}
            />
          )}

          {screen === "proof" && (
            <ProofView
              goal={activeGoalStore.goal!}
              store={activeGoalStore}
              st={st}
              onUpdateStore={updateStore}
            />
          )}

          {screen === "settings" && (
            <SettingsView
              store={activeGoalStore}
              multiStore={multiStore}
              onUpdateStore={updateStore}
              onRestoreMultiStore={handleRestoreMultiStore}
              onEditGoal={() => setOnboard(true)}
            />
          )}
        </main>

        {/* Post-Reflection Task Outcome Step Modal */}
        {pendingOutcomeTask && (
          <TaskOutcomeModal
            task={pendingOutcomeTask}
            sessions={activeGoalStore.sessions || []}
            onOutcome={handleTaskOutcome}
          />
        )}

        {/* Multi-Goal Modals */}
        {createGoalModalOpen && (
          <CreateGoalModal
            onClose={() => setCreateGoalModalOpen(false)}
            onCreate={handleCreateGoal}
          />
        )}

        {manageGoalsModalOpen && (
          <ManageGoalsModal
            multiStore={multiStore}
            onClose={() => setManageGoalsModalOpen(false)}
            onSelectGoal={handleSelectGoal}
            onRenameGoal={handleRenameGoal}
            onDeleteGoal={handleDeleteGoal}
            onCreateNewGoal={() => setCreateGoalModalOpen(true)}
          />
        )}
      </div>
    </PomodoroProvider>
  );
}

export default function LearningArc() {
  return <LearningArcContent />;
}
