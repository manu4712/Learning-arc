"use client";

import React, { useEffect, useMemo, useState } from "react";
import { PomodoroProvider } from "@/components/context/PomodoroContext";
import Header from "@/components/layout/Header";
import TodayView from "@/components/today/TodayView";
import PomodoroView from "@/components/focus/PomodoroView";
import JourneyView from "@/components/journey/JourneyView";
import InsightsView from "@/components/insights/InsightsView";
import ProofView from "@/components/proof/ProofView";
import SettingsView from "@/components/settings/SettingsView";
import GoalSetup from "@/components/onboarding/GoalSetup";
import ThemeToggle from "@/components/layout/ThemeToggle";
import {
  EMPTY,
  Goal,
  Session,
  Store,
  Analysis,
  load as loadStore,
  save as saveStore,
  stats as calculateStats,
} from "@/lib/data";

type Screen = "today" | "focus" | "journey" | "insights" | "proof" | "settings";

function LearningArcContent() {
  const [store, setStore] = useState<Store>(EMPTY);
  const [ready, setReady] = useState(false);
  const [screen, setScreen] = useState<Screen>("today");
  const [onboard, setOnboard] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

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

  return (
    <div className="app-layout">
      <Header
        activeScreen={screen}
        onSelectScreen={setScreen}
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
            onNavigate={setScreen}
            onRetryAnalysis={handleRetrySessionAnalysis}
          />
        )}

        {screen === "focus" && (
          <PomodoroView
            goal={store.goal!}
            onCompleteSession={(newSession: Session) => {
              updateStore({ sessions: [...store.sessions, newSession] });
              setScreen("today");
            }}
          />
        )}

        {screen === "journey" && (
          <JourneyView sessions={store.sessions} st={st} />
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
