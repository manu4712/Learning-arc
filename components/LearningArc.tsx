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
import {
  EMPTY,
  Goal,
  Session,
  Store,
  Analysis,
  DailyTask,
  load as loadStore,
  save as saveStore,
  stats as calculateStats,
} from "@/lib/data";

type Screen = "today" | "plan" | "focus" | "journey" | "insights" | "proof" | "settings";

function LearningArcContent() {
  const [store, setStore] = useState<Store>(EMPTY);
  const [ready, setReady] = useState(false);
  const [screen, setScreen] = useState<Screen>("today");
  const [onboard, setOnboard] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Active task selected to launch Focus from Plan
  const [targetTaskForFocus, setTargetTaskForFocus] = useState<DailyTask | undefined>(undefined);

  // Task pending outcome decision after reflection submission
  const [pendingOutcomeTask, setPendingOutcomeTask] = useState<DailyTask | undefined>(undefined);

  useEffect(() => {
    const loaded = loadStore();
    setStore(loaded);
    setOnboard(!loaded.goal);
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) {
      saveStore(store);
    }
  }, [store, ready]);

  const st = useMemo(() => calculateStats(store.sessions), [store.sessions]);

  const updateStore = (patch: Partial<Store>) => {
    setStore((current) => ({ ...current, ...patch }));
  };

  const handleLaunchTaskFocus = (task: DailyTask) => {
    setTargetTaskForFocus(task);
    setScreen("focus");
  };

  const handleCompleteSession = (newSession: Session) => {
    // 1. Reflection session evidence is saved FIRST (Clarification 1)
    const updatedSessions = [...store.sessions, newSession];
    let updatedTasks = store.tasks || [];

    if (newSession.taskId) {
      // Append session ID to task.linkedSessionIds
      updatedTasks = updatedTasks.map((t) => {
        if (t.id === newSession.taskId) {
          const linked = t.linkedSessionIds || [];
          return {
            ...t,
            linkedSessionIds: linked.includes(newSession.id) ? linked : [...linked, newSession.id],
            status: t.status === "planned" ? ("in_progress" as const) : t.status,
          };
        }
        return t;
      });

      const linkedTask = updatedTasks.find((t) => t.id === newSession.taskId);

      updateStore({
        sessions: updatedSessions,
        tasks: updatedTasks,
      });

      if (linkedTask) {
        setPendingOutcomeTask(linkedTask);
      } else {
        setScreen("today");
      }
    } else {
      updateStore({ sessions: updatedSessions });
      setScreen("today");
    }

    setTargetTaskForFocus(undefined);
  };

  const handleTaskOutcome = (taskId: string, outcome: "completed" | "in_progress") => {
    const existing = store.tasks || [];
    const completedAt = outcome === "completed" ? new Date().toISOString() : undefined;
    const updated = existing.map((t) =>
      t.id === taskId ? { ...t, status: outcome, completedAt } : t
    );

    updateStore({ tasks: updated });
    setPendingOutcomeTask(undefined);
    setScreen("plan");
  };

  const handleRetrySessionAnalysis = async (id: string) => {
    const session = store.sessions.find((s) => s.id === id);
    if (!session) return;

    const res = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "session", goal: store.goal, data: session }),
    });

    if (!res.ok) throw new Error("Analysis request failed");

    const analysis = (await res.json()) as Analysis;
    setStore((current) => ({
      ...current,
      sessions: current.sessions.map((s) =>
        s.id === id ? { ...s, analysis, analysisError: false } : s
      ),
    }));
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
          initial={store.goal}
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
    <div className="app-layout">
      <Header
        activeScreen={screen}
        onSelectScreen={handleSelectScreen}
        goal={store.goal}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
      />

      <main className="app-main-content">
        {screen === "today" && (
          <TodayView
            goal={store.goal!}
            st={st}
            sessions={store.sessions}
            onNavigate={handleSelectScreen}
            onRetryAnalysis={handleRetrySessionAnalysis}
          />
        )}

        {screen === "plan" && (
          <PlanView
            store={store}
            onUpdateStore={updateStore}
            onLaunchFocus={handleLaunchTaskFocus}
          />
        )}

        {screen === "focus" && (
          <PomodoroView
            goal={store.goal!}
            targetTask={targetTaskForFocus}
            onCompleteSession={handleCompleteSession}
          />
        )}

        {screen === "journey" && (
          <JourneyView store={store} sessions={store.sessions} st={st} />
        )}

        {screen === "insights" && (
          <InsightsView store={store} st={st} onUpdateStore={updateStore} />
        )}

        {screen === "proof" && (
          <ProofView goal={store.goal!} store={store} st={st} />
        )}

        {screen === "settings" && (
          <SettingsView
            store={store}
            onUpdateStore={updateStore}
            onEditGoal={() => setOnboard(true)}
          />
        )}
      </main>

      {/* Post-Reflection Task Outcome Step Modal */}
      {pendingOutcomeTask && (
        <TaskOutcomeModal
          task={pendingOutcomeTask}
          sessions={store.sessions}
          onOutcome={handleTaskOutcome}
        />
      )}
    </div>
  );
}

export default function LearningArc() {
  return (
    <PomodoroProvider>
      <LearningArcContent />
    </PomodoroProvider>
  );
}
